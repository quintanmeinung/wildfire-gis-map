// -------------------------
// Initialize map
// -------------------------
const map = L.map('map').setView([44.0, -120.5], 6);

// -------------------------
// Global state
// -------------------------
let rawData = null;

let clusters = L.markerClusterGroup();
let fireLayer = null;
let heatLayer = null;

let activeLayer = "markers";

let latestDate = null;

// filter state
let filters = {
    days: 5,
    severity: "all",
    minBrightness: 0
};

// -------------------------
// Fire Summary Dashboard
// -------------------------
const fireSummary = L.control({ position: "topright" });

fireSummary.onAdd = function () {
    this._div = L.DomUtil.create("div", "info summary");
    this.update();
    return this._div;
};

fireSummary.update = function () {
    this._div.innerHTML = `
        <h4>🔥 Wildfire Summary</h4>
        <div id="fire-counts">Loading...</div>
    `;
};

fireSummary.addTo(map);

// -------------------------
// Basemap
// -------------------------
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// -------------------------
// Load data
// -------------------------
fetch("data/fires.geojson")
.then(res => res.json())
.then(data => {

    rawData = data;

    // normalize timestamps (CRITICAL FIX)
    rawData.features.forEach(f => {
        f.properties.ts = Date.parse(f.properties.date);
    });

    latestDate = Math.max(...rawData.features.map(f => f.properties.ts));

    renderMap();
});

// -------------------------
// Helpers
// -------------------------
function getPercentile(value, sortedArray) {
    const index = sortedArray.findIndex(v => v >= value);
    return index === -1 ? 1 : index / sortedArray.length;
}

function getColor(intensity) {
    switch (intensity) {
        case "High": return "#d73027";
        case "Medium": return "#fc8d59";
        case "Low": return "#fee08b";
        default: return "#cccccc";
    }
}

// -------------------------
// Filtering (single source of truth)
// -------------------------
function getFilteredData() {
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

// -------------------------
// Render pipeline (ONLY renderer)
// -------------------------
function renderMap() {

    const data = getFilteredData();

    clusters.clearLayers();

    if (fireLayer) fireLayer.remove();
    if (heatLayer) map.removeLayer(heatLayer);

    if (!data.features.length) return;

    // brightness scaling
    const brightnessValues = data.features
        .map(f => f.properties.brightness)
        .filter(v => v != null)
        .sort((a, b) => a - b);

    // -------------------------
    // Marker layer
    // -------------------------
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
        }
    });

    clusters.addLayer(fireLayer);

    // -------------------------
    // Heatmap layer
    // -------------------------
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

    // apply active view
    if (activeLayer === "markers") {
        map.addLayer(clusters);
    } else {
        map.addLayer(heatLayer);
    }

    updateFireStats(data);
}

// -------------------------
// Stats UI
// -------------------------
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
        Source: NASA FIRMS VIIRS SNPP NRT
    `;
}

// -------------------------
// Layer switching
// -------------------------
function showHeatmap() {
    if (map.hasLayer(clusters)) map.removeLayer(clusters);
    map.addLayer(heatLayer);
    activeLayer = "heat";
}

function showMarkers() {
    if (map.hasLayer(heatLayer)) map.removeLayer(heatLayer);
    map.addLayer(clusters);
    activeLayer = "markers";
}

// -------------------------
// UI EVENTS
// -------------------------
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

// -------------------------
// Legend
// -------------------------
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