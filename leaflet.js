// leaflet.js
console.log("Leaflet script loaded.");

var map = L.map("map").setView([12.9, 77.64], 50); // Centered on India

L.tileLayer(
  "https://api.maptiler.com/maps/aquarelle/256/{z}/{x}/{y}.png?key=zR9N2yQDN0DnrkpxaLNG",
  {
    attribution:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
      '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
  }
).addTo(map);

let txMarker = null;
let rxMarker = null;
let linkLine = null;

map.on("click", async function (e) {
  if (!txMarker) {
    // Place Transmitter
    txMarker = L.marker(e.latlng, { title: "Transmitter" }).addTo(map);

    // Fetch elevation
    const txElevation = await fetchElevation(e.latlng.lat, e.latlng.lng);

    txMarker
      .bindPopup(`
        <div class="text-sm font-medium">
          📡 <b>Transmitter (Tx)</b><br>
          Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}<br>
          Elevation: <b>${txElevation} m</b>
        </div>
      `)
      .openPopup();

    txMarker.elevation = txElevation;
    setInfo("Now click to place Receiver (Rx).");

  } else if (!rxMarker) {
    // Place Receiver
    rxMarker = L.marker(e.latlng, { title: "Receiver" }).addTo(map);

    const rxElevation = await fetchElevation(e.latlng.lat, e.latlng.lng);

    rxMarker
      .bindPopup(`
        <div class="text-sm font-medium">
          🎯 <b>Receiver (Rx)</b><br>
          Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}<br>
          Elevation: <b>${rxElevation} m</b>
        </div>
      `)
      .openPopup();

    rxMarker.elevation = rxElevation;

    // Draw line between Tx and Rx
    linkLine = L.polyline([txMarker.getLatLng(), rxMarker.getLatLng()], {
      color: "#ef4444", // Tailwind red-500
      weight: 3
    }).addTo(map);

    getElevationSummary(txMarker, rxMarker);
  } else {
    // Reset all
    [txMarker, rxMarker, linkLine].forEach(layer => layer && map.removeLayer(layer));
    txMarker = rxMarker = linkLine = null;
    setInfo("Click two new points to get elevation data.");
  }
});

function setInfo(text) {
  document.getElementById("info").innerText = text;
}
