// Initialize map
const map = L.map('map').setView([44.0, -120.5], 6);

// -------------------------
// Global state
// -------------------------
let rawData;
let fireLayer;

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
// Load GeoJSON
// -------------------------
fetch("data/fires.geojson")
    .then(res => res.json())
    .then(data => {

        rawData = data;

        // Build brightness array for percentile scaling
        const brightnessValues = data.features
            .map(f => f.properties.brightness)
            .filter(v => v != null)
            .sort((a, b) => a - b);

        // Create layer
        fireLayer = L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {

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

            onEachFeature: function (feature, layer) {
                layer.bindPopup(`
                    <b>Wildfire Detection</b><br>
                    Date: ${feature.properties.date}<br>
                    Intensity: ${feature.properties.intensity}<br>
                    Brightness: ${feature.properties.brightness}
                `);
            }
        }).addTo(map);

        updateFireStats(data);
    });

// -------------------------
// Percentile functions
// -------------------------
function getPercentile(value, sortedArray) {
    const index = sortedArray.findIndex(v => v >= value);
    return index === -1 ? 1 : index / sortedArray.length;
}

// -------------------------
// Styling
// -------------------------
function getColor(intensity) {
    switch (intensity) {
        case "High": return "#d73027";
        case "Medium": return "#fc8d59";
        case "Low": return "#fee08b";
        default: return "#cccccc";
    }
}

// -------------------------
// Fire Statistics
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
        Total: ${data.features.length}
    `;
}

// -------------------------
// Filtering
// -------------------------
function applyFilters() {

    const severity = document.getElementById("severityFilter").value;
    const minBrightness = document.getElementById("brightnessFilter").value;

    const filtered = {
        ...rawData,
        features: rawData.features.filter(f => {

            const matchSeverity =
                severity === "all" ||
                f.properties.intensity === severity;

            const matchBrightness =
                !minBrightness ||
                f.properties.brightness >= minBrightness;

            return matchSeverity && matchBrightness;
        })
    };

    fireLayer.clearLayers();
    fireLayer.addData(filtered);
    updateFireStats(filtered);
}

// -------------------------
// UI Events
// -------------------------
document.getElementById("severityFilter")
    .addEventListener("change", applyFilters);

document.getElementById("brightnessFilter")
    .addEventListener("input", function () {
        document.getElementById("brightnessValue").innerText = this.value;
        applyFilters();
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

