console.log("Leaflet script loaded.");

// Map setup
var map = L.map("map").setView([13, 78], 50);

let currentPopup = null;

var customIcon = L.icon({
  iconUrl: "assets/marker-icon.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28]
});

L.tileLayer(
  "https://api.maptiler.com/maps/aquarelle/256/{z}/{x}/{y}.png?key=zR9N2yQDN0DnrkpxaLNG",
  {
    attribution:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
      '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
  }
).addTo(map);

window.markerData = []; // global access for link.js

// Click on map → add marker
map.on("click", async function (e) {
  // 1️⃣ If a popup is open, close it first and do nothing else
  if (currentPopup) {
    map.closePopup(currentPopup);
    currentPopup = null;
    return; // stop here, don’t add a marker
  }

  // 2️⃣ If connect mode is active and user clicks empty map, cancel connection
  if (window.connectMode && window.linkStartPoint) {
    cancelConnection();
    return;
  }

  // 3️⃣ Otherwise, add a new marker
  const { lat, lng } = e.latlng;
  const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

  const point = {
    id: Date.now(),
    lat,
    lng,
    elevation: null,
    marker
  };

  markerData.push(point);
  setInfo(`Added point ${markerData.length}`);

  marker.bindTooltip("Loading elevation...", { permanent: true, direction: "top" }).openTooltip();
  const elevation = await fetchElevation(lat, lng);
  point.elevation = elevation;
  marker.unbindTooltip();

  // Native click popup
  marker.on("click", () => {
    showPointPopup(point);
  });
});




// Native popup function
function showPointPopup(point) {
  if (window.connectMode && window.linkStartPoint) {
    if (point.id !== window.linkStartPoint.id) {
      createLink(window.linkStartPoint, point);
      cancelConnection();
    }
    return;
  }

  if (currentPopup) {
    map.closePopup(currentPopup);
  }

  const popupHtml = `
    <div class="text-sm font-medium">
      📍 <b>Point</b><br>
      Lat: ${point.lat.toFixed(4)}<br>
      Lng: ${point.lng.toFixed(4)}<br>
      Elevation: <b>${point.elevation} m</b><br><br>
      <button onclick="deletePoint(${point.id})" class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded">Delete</button>
      <button onclick="startConnection(${point.id})" class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded ml-2">Connect</button>
    </div>
  `;

  L.popup()
    .setLatLng([point.lat, point.lng])
    .setContent(popupHtml)
    .openOn(map);

    // Create the popup object
  const popup = L.popup()
    .setLatLng([point.lat, point.lng])
    .setContent(popupHtml);

  // Open it on the map
  popup.openOn(map);

  // Track the currently open popup
  currentPopup = popup;

 //  // Reset currentPopup when the user closes it manually
 // popup.on("remove", function() {
 //   currentPopup = null;
 // });
}

// Delete marker
function deletePoint(id) {
  const index = markerData.findIndex((p) => p.id === id);
  if (index !== -1) {
    const point = markerData[index];
    map.closePopup();
    map.removeLayer(point.marker);
    markerData.splice(index, 1);
    setInfo(`Deleted point`);

    // Also remove links associated with this point
    removeLinksWithPoint(point);
  }
}

// Remove links connected to a marker
function removeLinksWithPoint(point) {
  if (!window.links) return;
  const toRemove = window.links.filter(l => l.start.id === point.id || l.end.id === point.id);
  toRemove.forEach(l => {
    map.removeLayer(l.line);
    window.links.splice(window.links.indexOf(l), 1);
  });
}

function setInfo(text) {
  document.getElementById("info").innerText = text;
}
