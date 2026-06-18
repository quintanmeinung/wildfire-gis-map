// Initialize map
const map = L.map('map').setView([40.44, -123.42], 7);

// Basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Load GeoJSON
fetch("data/fires.geojson")
  .then(res => res.json())
  .then(data => {

    L.geoJSON(data, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 6,
          fillColor: getColor(feature.properties.intensity),
          color: "#000",
          weight: 1,
          fillOpacity: 0.8
        });
      },

      onEachFeature: function (feature, layer) {
        layer.bindPopup(
          `<b>${feature.properties.name}</b><br>
           Date: ${feature.properties.date}<br>
           Intensity: ${feature.properties.intensity}`
        );
      }
    }).addTo(map);
  });

// Simple styling function
function getColor(intensity) {
  switch (intensity) {
    case "High": return "red";
    case "Medium": return "orange";
    case "Low": return "yellow";
    default: return "gray";
  }
}