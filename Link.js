console.log("Link script loaded.");

window.links = [];
window.connectMode = false;
window.linkStartPoint = null;


//Declaring Current Values for calculations
var currentLink;
var currentFrequency;
let currentLinkNo = 0;

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

  setInfo(`Connecting (${startPoint.lat.toFixed(3)}, ${startPoint.lng.toFixed(3)})`,`Click another another tower to link or click the map to cancel.`, false);

  // Highlight start marker
  startPoint.marker._icon.style.filter = "drop-shadow(0 0 8px lime)";

  disableLinkInteractions();
}

function cancelConnection(temp) {
  if (!window.connectMode) return;

  if (window.linkStartPoint) {
    window.linkStartPoint.marker._icon.style.filter = "";
  }

  enableLinkInteractions();
  window.linkStartPoint = null;
  window.connectMode = false;

  if (temp)
    setInfo("Link not Made", `You have to tap on another tower to connect. Please Try again.`, true);

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
    opacity: .35,
    weight: 10
  }).addTo(map);

  const link = {
    frequency: window.towerFrequencies[p1.id].toFixed(1),
    linkName: `link_${currentLinkNo = (currentLinkNo+1)}`,
    id: Number(Date.now().toString().slice(-4)),
    start: p1,
    end: p2,
    line,
    distance: dist3D
  };


  setInfo("Successful Link!", `Now both the towers have are linked. Tap on the "Link line" to see more details.`, false);

  window.links.push(link);

  const popupHtml = `
  <div class="link-card-wrapper">
    <div class="link-card-content">

        <!-- HEADER -->
        <div class="link-card-header">
            <span class="link-card-title">${link.linkName} #<span class="link-card-id">${link.id}</span></span>
            <button class="link-card-close-btn" onclick="map.closePopup(currentPopup); removeFresnel();">×</button>
        </div>

        <!-- MAIN LINK DATA (Frequency and Distance side-by-side) -->
        <div class="link-card-main-data">
            <!-- Frequency -->
            <div>
                <span class="link-card-data-label-main">frequency</span>
                <div class="link-card-main-data-field">${link.frequency} <span class="frequency-unit">GHz</span></div>
            </div>
            <!-- Distance -->
            <div>
                <span class="link-card-data-label-main">distance</span>
                <div class="link-card-main-data-field">${link.distance.toFixed(2)}<span class="frequency-unit">m</span></div>
            </div>
        </div>

        <!-- TOWER HEADERS -->
        <div class="link-card-tower-headers">
            <div class="link-card-title">${link.start.towerName} <span class="link-card-id">#${link.start.id}</span></div>
            <div class="link-card-title">${link.end.towerName} <span class="link-card-id">#${link.end.id}</span></div>
        </div>

        <!-- TOWER DATA GRID (T1 and T2 data in 4 columns) -->
        <div class="link-card-tower-grid">

            <!-- Row 1: Elevation -->
            <div class="link-card-data-label">elevation</div>
            <div class="link-card-data-value link-card-align-right">${link.start.elevation}m</div>
            <div class="link-card-data-label">elevation</div>
            <div class="link-card-data-value link-card-align-right">${link.end.elevation}m</div>

            <!-- Row 2: Latitude -->
            <div class="link-card-data-label">latitude</div>
            <div class="link-card-data-value link-card-align-right">${link.start.lat.toFixed(3)}</div>
            <div class="link-card-data-label">latitude</div>
            <div class="link-card-data-value link-card-align-right">${link.end.lat.toFixed(3)}</div>

            <!-- Row 3: Longitude -->
            <div class="link-card-data-label">longitude</div>
            <div class="link-card-data-value link-card-align-right">${link.start.lng.toFixed(3)}</div>
            <div class="link-card-data-label">longitude</div>
            <div class="link-card-data-value link-card-align-right">${link.end.lng.toFixed(3)}</div>

        </div>

        <!-- ACTION BUTTONS -->
        <div class="link-card-action-buttons " onclick="removeLink(${link.id});">
            <button class="link-card-btn-delete btn btn-delete">  <img class = 'btn-delete-img' src='assets/trash.svg' style="width:10px;height:10px;"></button>
        </div>

    </div>
</div>
  `;
  line.bindPopup(popupHtml);

  // Add click handler similar to markers
  line.on("click", function() {


    // If there's already a popup open, close it first and do nothing
    if (currentPopup) {
      map.closePopup(currentPopup);
            //
            // removeFresnel();
            // calculateScale(returnFrequency(p1.id));
      currentPopup = null;


      //console.log('this now');

    }
    //console.log('happening now');
    removeFresnel();



    line.openPopup();
    currentPopup = line.getPopup();
    if (link.start.lat > link.end.lat)
      currentPopup.setLatLng([link.start.lat + 0.002 ,link.start.lng]);
      else
      currentPopup.setLatLng([link.end.lat + 0.002 ,link.end.lng]);
    currentLink = link;
    calculateScale(returnFrequency(p1.id));


  });
}

// Remove a link
function removeLink(id) {
  const index = window.links.findIndex(l => l.id === id);
  if (index !== -1) {
    removeFresnel();
    map.removeLayer(window.links[index].line);
    window.links.splice(index, 1);
    setInfo("Link removed.", 'The link has been removed.', true);
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
