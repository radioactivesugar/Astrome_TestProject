console.log("Link script loaded.");

window.links = [];
window.connectMode = false;
window.linkStartPoint = null;


//Declaring Current Values for calculations
var currentLink;
var currentFrequency;

function startConnection(id) {
  const startPoint = markerData.find(p => p.id === id);
  if (!startPoint) return;

  window.connectMode = true;
  window.linkStartPoint = startPoint;

  // Close any open popup
  if (currentPopup) {
    map.closePopup(currentPopup);
    currentPopup = null;
  }

  // Show overlay with CSS class
  const overlay = document.getElementById("map-overlay");
  overlay.classList.add("active");

  setInfo(`Connecting from (${startPoint.lat.toFixed(3)}, ${startPoint.lng.toFixed(3)}). Click another point to link or click the map to cancel.`);

  // Highlight start marker
  startPoint.marker._icon.style.filter = "drop-shadow(0 0 8px lime)";

  disableLinkInteractions();
}

function cancelConnection() {
  if (!window.connectMode) return;

  if (window.linkStartPoint) {
    window.linkStartPoint.marker._icon.style.filter = "";
  }

  enableLinkInteractions();
  window.linkStartPoint = null;
  window.connectMode = false;
  setInfo("Connection cancelled.");

  // Hide overlay by removing CSS class
  const overlay = document.getElementById("map-overlay");
  overlay.classList.remove("active");
}

// Create a link between two points
function createLink(p1, p2) {
  const dist2D = map.distance([p1.lat, p1.lng], [p2.lat, p2.lng]);
  const elevDiff = (p2.elevation || 0) - (p1.elevation || 0);
  const dist3D = Math.sqrt(dist2D ** 2 + elevDiff ** 2);

  // // Create invisible thicker line for easier clicking
  // const invisibleLine = L.polyline([[p1.lat, p1.lng], [p2.lat, p2.lng]], {
  //   color: "transparent",
  //   weight: 20, // Much thicker for easier clicking
  //   opacity: 0
  // }).addTo(map);

  const line = L.polyline([[p1.lat, p1.lng], [p2.lat, p2.lng]], {
    color: "#38bdf8",
    weight: 10
  }).addTo(map);

  const link = {
    id: Date.now("0000"),
    start: p1,
    end: p2,
    line,
    distance: dist3D
  };


  window.links.push(link);

  const popupHtml = `
    <div class="text-sm">
      🔗 <b>Link</b><br>
      From: (${p1.lat.toFixed(3)}, ${p1.lng.toFixed(3)})<br>
      To: (${p2.lat.toFixed(3)}, ${p2.lng.toFixed(3)})<br>
      Distance: <b>${dist3D.toFixed(2)} m</b><br><br>
      <button onclick="removeLink(${link.id})" class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded">Remove Link</button>
    </div>
  `;
  line.bindPopup(popupHtml);

  // Add click handler similar to markers
  line.on("click", function() {
    // If there's already a popup open, close it first and do nothing
    if (currentPopup) {
      map.closePopup(currentPopup);
      currentPopup = null;
      return;
    }


    // Otherwise open this line's popup
    line.openPopup();
    currentPopup = line.getPopup();
    currentLink = link;
    calculateScale(returnFrequency(p1.id));


  });
}

// Remove a link
function removeLink(id) {
  const index = window.links.findIndex(l => l.id === id);
  if (index !== -1) {
    map.removeLayer(window.links[index].line);
    window.links.splice(index, 1);
    setInfo("Link removed.");
  }
}

// Disable link clicks during connect mode
function disableLinkInteractions() {
  window.links.forEach(l => {
    if (l.line.getElement()) l.line.getElement().style.pointerEvents = "none";
  });
}

// Enable link clicks
function enableLinkInteractions() {
  window.links.forEach(l => {
    if (l.line.getElement()) l.line.getElement().style.pointerEvents = "auto";
  });
}
