// Initialize map
const map = L.map('map').setView([44.0, -120.5], 6);

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
        radius: getRadius(feature.properties.brightness),
        fillColor: getColor(feature.properties.intensity),
        color: "#222",
        weight: 1,
        fillOpacity: 0.85
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
    case "High": return "#d73027";   // deep red
    case "Medium": return "#fc8d59"; // orange
    case "Low": return "#fee08b";    // yellow
    default: return "#cccccc";
  }
}
function getRadius(brightness) {
  if (!brightness) return 5;
  return Math.max(5, brightness / 120);
}

const legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
  const div = L.DomUtil.create("div", "info legend");

  div.innerHTML += "<b>Fire Intensity</b><br>";

  div.innerHTML +=
    '<i style="background:#d73027;width:10px;height:10px;display:inline-block;"></i> High<br>';

  div.innerHTML +=
    '<i style="background:#fc8d59;width:10px;height:10px;display:inline-block;"></i> Medium<br>';

  div.innerHTML +=
    '<i style="background:#fee08b;width:10px;height:10px;display:inline-block;"></i> Low<br>';

  return div;
};

legend.addTo(map);

