console.log("Leaflet script loaded.");

// Map setup
var map = L.map("map").setView([13, 78], 50);

let currentPopup = null;

L.tileLayer(
  "https://api.maptiler.com/maps/aquarelle/256/{z}/{x}/{y}.png?key=zR9N2yQDN0DnrkpxaLNG",
  {
    attribution:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
      '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
  }
).addTo(map);

const towerIcon = L.icon({
  iconUrl: "assets/marker-icon.png",  // path to your custom icon image
  iconSize: [30, 30],                // width, height of icon in pixels
  iconAnchor: [15, 30],              // where the "tip" of the icon sits
  popupAnchor: [0, -30],             // popup offset relative to icon
  tooltipAnchor: [0, -25]            // tooltip offset relative to icon
});

window.markerData = []; // global access for link.js
window.towerFrequencies = window.towerFrequencies || {}; // for frequencyMatch.js

// ✅ Create a frequency label near marker
function createFrequencyLabel(id, lat, lng, freq = 52.9) {
  const label = L.divIcon({
    className: "frequency-label",
    html: `<div id="freq-label-${id}"
                style="background:white;border:1px solid #555;border-radius:4px;
                       padding:2px 5px;font-size:11px;box-shadow:0 0 2px rgba(0,0,0,0.4);">
             ${freq.toFixed(1)} GHz
           </div>`,
    iconSize: [60, 20],
    iconAnchor: [-25, 25] // position slightly to the side
  });
  const labelMarker = L.marker([lat, lng], { icon: label, interactive: false }).addTo(map);
  return labelMarker;
}

// Click on map → add marker
map.on("click", async function (e) {
  // 1️⃣ Close popup if open
  if (currentPopup) {
    map.closePopup(currentPopup);
    currentPopup = null;
    return;
  }

  // 2️⃣ Cancel connection if active
  if (window.connectMode && window.linkStartPoint) {
    cancelConnection();
    return;
  }

  // 3️⃣ Add new marker
  const { lat, lng } = e.latlng;
  const id = Date.now();

  const marker = L.marker([lat, lng], { icon: towerIcon }).addTo(map);

  const point = {
    id,
    lat,
    lng,
    elevation: null,
    marker
  };

  markerData.push(point);
  setInfo(`Added point ${markerData.length}`);

  initializeFrequencyForMarker(marker, id);

  marker.bindTooltip("Loading elevation...", { permanent: true, direction: "top" }).openTooltip();
  const elevation = await fetchElevation(lat, lng);
  point.elevation = elevation;
  marker.unbindTooltip();

  // ✅ Add frequency label near the marker
  const freq = window.towerFrequencies[id];
  point.freqLabel = createFrequencyLabel(id, lat, lng, freq);

  // Native click popup
  marker.on("click", () => {
    showPointPopup(point);
  });
});

// ✅ Update frequency label text
function updateFrequencyLabel(id) {
  const labelEl = document.getElementById(`freq-label-${id}`);
  if (labelEl && window.towerFrequencies[id] !== undefined) {
    labelEl.innerText = `${window.towerFrequencies[id].toFixed(1)} GHz`;
  }
}

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

  // Ensure frequency exists
  if (!window.towerFrequencies[point.id]) {
    window.towerFrequencies[point.id] = 52.9;
  }

  const freq = window.towerFrequencies[point.id];

  const popupHtml = `
    <div class="text-sm font-medium space-y-2">
      📶 <b>Telecom Tower #${point.id}</b><br>
      Lat: ${point.lat.toFixed(4)}<br>
      Lng: ${point.lng.toFixed(4)}<br>
      Elevation: <b>${point.elevation} m</b><br>

      <hr class="my-2 border-gray-400">

      <div>
        <b>Frequency:</b>
        <div class="flex items-center space-x-2 mt-1">
          <button onclick="changeFrequency(${point.id}, -0.1)" class="bg-gray-700 text-white px-2 rounded">-</button>
          <input id="freq-input-${point.id}" type="number" value="${freq.toFixed(1)}"
                 step="0.1" min="0" class="border rounded w-20 text-center"
                 oninput="updateFrequencyFromInput(${point.id})"/>
          <button onclick="changeFrequency(${point.id}, 0.1)" class="bg-gray-700 text-white px-2 rounded">+</button>
          <span>GHz</span>
        </div>
      </div>

      <div class="flex gap-2 mt-3">
        <button onclick="deletePoint(${point.id})"
          class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded w-full">
          Delete
        </button>
        <button onclick="startConnection(${point.id})"
          class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded w-full">
          Connect
        </button>
      </div>
    </div>
  `;

  const popup = L.popup()
    .setLatLng([point.lat, point.lng])
    .setContent(popupHtml)
    .openOn(map);

  currentPopup = popup;
}

// Delete marker
function deletePoint(id) {
  const index = markerData.findIndex((p) => p.id === id);
  if (index !== -1) {
    const point = markerData[index];
    map.closePopup();
    map.removeLayer(point.marker);
    if (point.freqLabel) map.removeLayer(point.freqLabel);
    markerData.splice(index, 1);
    setInfo(`Deleted point`);
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
