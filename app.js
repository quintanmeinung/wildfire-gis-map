// =========================
// MAP INIT
// =========================
const map = L.map('map', {
    center: [44.0, -120.5],
    zoom: 6,
    minZoom: 3,
    maxZoom: 18   // ✅ ADD THIS (important)
});

// =========================
// GLOBAL STATE
// =========================
let rawData = null;

let clusters = L.markerClusterGroup();
map.addLayer(clusters);

let fireLayer = null;
let heatLayer = null;

let activeLayer = "markers";
let latestDate = null;

let selectedFeatureId = null;
let fireLayerRef = null;

// =========================
// FILTERS
// =========================
let filters = {
    days: 5,
    severity: "all",
    minBrightness: 0
};

// =========================
// SUMMARY UI
// =========================
const fireSummary = L.control({ position: "topright" });

fireSummary.onAdd = function () {
    this._div = L.DomUtil.create("div", "info summary");
    this.update();
    return this._div;
};

fireSummary.update = function () {
    this._div.innerHTML = `
        <h4>Wildfire Summary</h4>
        <div id="fire-counts">Loading...</div>
    `;
};

fireSummary.addTo(map);

// =========================
// BASEMAP
// =========================
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19   // ✅ ADD THIS
}).addTo(map);

// =========================
// LOAD DATA
// =========================
fetch("data/fires.geojson")
.then(res => res.json())
.then(data => {
    rawData = data;

    rawData.features.forEach(f => {
        f.properties.ts = Date.parse(f.properties.date);
    });

    latestDate = Math.max(...rawData.features.map(f => f.properties.ts));

    renderMap();
});

// =========================
// HELPERS
// =========================
function getPercentile(value, arr) {
    const index = arr.findIndex(v => v >= value);
    return index === -1 ? 1 : index / arr.length;
}

function getColor(intensity) {
    switch (intensity) {
        case "High": return "#d73027";
        case "Medium": return "#fc8d59";
        case "Low": return "#fee08b";
        default: return "#ccc";
    }
}

// =========================
// FILTERING
// =========================
function getFilteredData() {
    if (!rawData) return { features: [] };

    return {
        ...rawData,
        features: rawData.features.filter(f => {

            const daysOld =
                (latestDate - f.properties.ts) / (1000 * 60 * 60 * 24);

            const matchDate = daysOld <= filters.days;

            const matchSeverity =
                filters.severity === "all" ||
                f.properties.intensity === filters.severity;

            const matchBrightness =
                !filters.minBrightness ||
                f.properties.brightness >= filters.minBrightness;

            return matchDate && matchSeverity && matchBrightness;
        })
    };
}

function setLayer(type) {
    activeLayer = type;
    renderMap();
}

// =========================
// MAIN RENDER PIPELINE
// =========================
function renderMap() {

    const data = getFilteredData();

    // clear marker cluster safely
    clusters.clearLayers();

    // remove old layers safely
    if (fireLayer) {
        fireLayer.remove();
        fireLayer = null;
    }

    if (heatLayer) {
        map.removeLayer(heatLayer);
        heatLayer = null;
    }

    if (!data.features.length) return;

    // brightness scaling
    const brightnessValues = data.features
        .map(f => f.properties.brightness)
        .filter(v => v != null)
        .sort((a, b) => a - b);

    // =========================
    // MARKERS
    // =========================
    fireLayer = L.geoJSON(data, {
        pointToLayer: (feature, latlng) => {

            const brightness = feature.properties.brightness;
            const percentile = getPercentile(brightness, brightnessValues);

            return L.circleMarker(latlng, {
                radius: 4 + (percentile * 12),
                fillColor: getColor(feature.properties.intensity),
                color: "#222",
                weight: 1,
                fillOpacity: 0.85
            });
        },

        onEachFeature: (feature, layer) => {
    layer.on("click", () => {
        showFireInfo(feature.properties);
    });
}
    });

    clusters.addLayer(fireLayer);

    // =========================
    // HEATMAP
    // =========================
    const heatPoints = data.features.map(f => [
        f.geometry.coordinates[1],
        f.geometry.coordinates[0],
        f.properties.brightness / 500
    ]);

    heatLayer = L.heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 10
    });

    // apply active layer
    if (activeLayer === "markers") {
        map.addLayer(clusters);
    } else {
        map.addLayer(heatLayer);
    }

    updateFireStats(data);
}

// =========================
// STATS
// =========================
function updateFireStats(data) {

    let high = 0, medium = 0, low = 0;

    data.features.forEach(f => {
        const type = f.properties.intensity;

        if (type === "High") high++;
        else if (type === "Medium") medium++;
        else low++;
    });

    document.getElementById("fire-counts").innerHTML = `
        🔴 High: ${high}<br>
        🟠 Medium: ${medium}<br>
        🟡 Low: ${low}<br>
        <hr>
        Total: ${data.features.length}<br>
        Latest Detection: ${new Date(latestDate).toISOString().split("T")[0]}<br>
        Source: NASA FIRMS
    `;
}

// =========================
// LAYER TOGGLES
// =========================
function showHeatmap() {
    if (!heatLayer) return;

    map.removeLayer(clusters);
    map.addLayer(heatLayer);
    activeLayer = "heat";
}

function showMarkers() {
    if (map.hasLayer(heatLayer)) {
        map.removeLayer(heatLayer);
    }

    map.addLayer(clusters);
    activeLayer = "markers";
}

// =========================
// FIRE CLICK POPUP UI
// =========================
function showFireInfo(props) {
    const panel = document.getElementById("fireInfo");

    if (!panel) return;

    panel.innerHTML = `
        <h4>Fire Details</h4>
        <b>Intensity:</b> ${props.intensity}<br>
        <b>Brightness:</b> ${props.brightness}<br>
        <b>Date:</b> ${props.date}<br>
    `;
}

// =========================
// UI EVENTS
// =========================
document.getElementById("severityFilter").addEventListener("change", (e) => {
    filters.severity = e.target.value;
    renderMap();
});

document.getElementById("brightnessFilter").addEventListener("input", (e) => {
    filters.minBrightness = Number(e.target.value);
    document.getElementById("brightnessValue").innerText = e.target.value;
    renderMap();
});

document.getElementById("timeSlider").addEventListener("input", (e) => {
    filters.days = Number(e.target.value);
    document.getElementById("timeLabel").innerText = `${filters.days} days`;
    renderMap();
});

// =========================
// LEGEND
// =========================
const legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
    const div = L.DomUtil.create("div", "info legend");

    div.innerHTML = `
        <b>Fire Intensity</b><br>
        <i style="background:#d73027;width:10px;height:10px;display:inline-block;"></i> High<br>
        <i style="background:#fc8d59;width:10px;height:10px;display:inline-block;"></i> Medium<br>
        <i style="background:#fee08b;width:10px;height:10px;display:inline-block;"></i> Low<br>
    `;

    return div;
};

legend.addTo(map);