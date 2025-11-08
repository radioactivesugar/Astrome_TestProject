console.log("Leaflet script loaded.");

// Map setup
var map = L.map("map").setView([13.17, 77.62], 15);

let currentPopup = null;

var latX, latY, latX1, latY1;

let towerCount = 0;

L.tileLayer(
  "https://api.maptiler.com/maps/streets-v4/256/{z}/{x}/{y}.png?key=zR9N2yQDN0DnrkpxaLNG",
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
                >
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

    removeFresnel();
  // 1️⃣ Close popup if open
  if (currentPopup) {
    map.closePopup(currentPopup);
    currentPopup = null;
    return;
  }

  // 2️⃣ Cancel connection if active
  if (window.connectMode && window.linkStartPoint) {
    cancelConnection(true);
    return;
  }

  // 3️⃣ Add new marker
  const { lat, lng } = e.latlng;
  towerCount++;
  // Convert the number to a string and take the last 4 characters
  const id = Number(Date.now().toString().slice(-4));
  const towerName = `tower_${towerCount.toString()}`;


  console.log(typeof id);
  console.log(typeof uniqueCode);

  const marker = L.marker([lat, lng], { icon: towerIcon }).addTo(map);

  const point = {
    towerName,
    id,
    lat,
    lng,
    elevation: null,
    marker
  };
console.log(point.id);
  markerData.push(point);
  setInfo(`Added ${point.towerName}`, `Tap on the icon to see more info. You can click "+" to connect to other towers.`, false);

  //console.log(markerData.length);

  initializeFrequencyForMarker(marker, id);

  // You MUST use HTML instead of a plain string to include the icon
const iconTooltipContent = `
    <div style="display: flex; align-items: center; white-space: nowrap;">
        <span style = "font: Open Sans;">creating...</span>
        <img src="assets/rss.svg" alt="Icon" style="width: 12px; height: 12px; margin-left: 15px;">
    </div>
`;

marker.bindTooltip(iconTooltipContent, { permanent: true, direction: "top" }).openTooltip();
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
      cancelConnection(false);
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
  <div class="tower-card">
  <!-- Header Section -->
  <div class="tower-header">
    <div class="tower-title">
      ${point.towerName} <span class="tower-id">#${point.id}</span>
    </div>
    <button class="close-btn" onclick="map.closePopup(currentPopup)" title="Close">×</button>
  </div>

  <!-- Frequency Section -->
  <div class="frequency-section">
    <div class="frequency-label">frequency</div>
    <div class="frequency-input-group">
      <input id="freq-input-${point.id}"
             type="number"
             value="${freq.toFixed(1)}"
             step="0.1"
             min="0"
             class="frequency-input"
             oninput="updateFrequencyFromInput(${point.id})"/>
      <span class="frequency-unit">GHz</span>
      <div class="spinner-controls">
        <button class="spinner-btn"
                onclick="document.getElementById('freq-input-${point.id}').stepUp(); updateFrequencyFromInput(${point.id})">▲</button>
        <button class="spinner-btn"
                onclick="document.getElementById('freq-input-${point.id}').stepDown(); updateFrequencyFromInput(${point.id})">▼</button>
      </div>
    </div>
  </div>

  <!-- Elevation Field -->
  <div class="data-field">
    <span class="data-label">elevation</span>
    <span class="data-value">${point.elevation}m</span>
  </div>

  <!-- Latitude Field -->
  <div class="data-field">
    <span class="data-label">latitude</span>
    <span class="data-value">${point.lat.toFixed(3)}</span>
  </div>

  <!-- Longitude Field -->
  <div class="data-field">
    <span class="data-label">longitude</span>
    <span class="data-value">${point.lng.toFixed(3)}</span>
  </div>

  <!-- Action Buttons -->
  <div class="action-buttons">
    <button onclick="deletePoint(${point.id});" class="btn btn-delete">
      <img class = 'btn-delete-img' src='assets/trash.svg' style="width:10px;height:10px;">
    </button>
    <button onclick="startConnection(${point.id});" class="btn btn-add">
      +
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
  console.log(id);
  if (index !== -1) {
    const point = markerData[index];
    map.closePopup();
    map.removeLayer(point.marker);
    if (point.freqLabel) map.removeLayer(point.freqLabel);
    markerData.splice(index, 1);
    setInfo(`Deleted point`, `The tower and all it's link have been destroyed`, true);
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

/**
 * Updates the info box with new content and styling.
 * * @param {string} headerText The text for the header (e.g., "Frequencies do not match").
 * @param {string} bodyText The detailed body text.
 * @param {boolean} isError If true, applies the error style (red/info icon); otherwise, applies the success style (blue/sun icon).
 */
function setInfo(headerText, bodyText, isError) {

    const infoBox = document.getElementById("info-box"); // Main container
    const headerElement = document.getElementById("info-header");
    const bodyElement = document.getElementById("info-body");
    const iconElement = document.getElementById("info-icon");

    // 1. Update Content
    headerElement.innerText = headerText;
    bodyElement.innerText = bodyText;
    infoBox.classList.remove('faded');


    // 2. Update Style (based on isError boolean)
    if (isError) {
        infoBox.className = "info-box error";
        // Assuming your red 'i' icon is at this path
        iconElement.src = "assets/icon-error-info.svg";
        iconElement.alt = "Error Information Icon";
    } else {
        infoBox.className = "info-box success";
        // Assuming your blue 'sun' icon is at this path
        iconElement.src = "assets/icon-success-sun.svg";
        iconElement.alt = "Success Sun Icon";
    }
    setTimeout(() => {
        infoBox.classList.add('faded');
    }, 20000); // 10 seconds delay

}
