// fresnelzone.js
console.log("Fresnel Zone script loaded.");

const FRESNEL_MODAL_ID = "fresnel-zone-modal";

/**
 * Creates and shows a modal with the Fresnel Zone visualization.
 * @param {number} f_GHz - The frequency in Gigahertz.
 * @param {number} D_km - The distance in kilometers.
 */
function showFresnelZoneModal(f_GHz, D_km) {
  let modal = document.getElementById(FRESNEL_MODAL_ID);
  if (!modal) {
    // Create the modal HTML if it doesn't exist
    modal = document.createElement('div');
    modal.id = FRESNEL_MODAL_ID;
    modal.innerHTML = `
      <div class="fresnel-backdrop" onclick="closeFresnelZoneModal()"></div>
      <div class="fresnel-content">
        <button class="fresnel-close" onclick="closeFresnelZoneModal()">×</button>
        <h3>📡 First Fresnel Zone Cross-Section</h3>
        <div class="fresnel-info">
          <p id="fresnel-params"></p>
          <p id="fresnel-results"></p>
        </div>
        <canvas id="fresnelCanvas" width="800" height="400"></canvas>
        <p class="fresnel-note">Visualization is a cross-section of the first Fresnel zone. Vertical scale is exaggerated.</p>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Update parameters and draw
  document.getElementById("fresnel-params").innerHTML =
    `Frequency: <b>${f_GHz.toFixed(1)} GHz</b> | Distance: <b>${D_km.toFixed(2)} km</b>`;

  // Show the modal
  modal.style.display = 'flex';

  // Wait for the modal to be visible and canvas to be in the DOM before drawing
  setTimeout(() => drawFresnelZone(f_GHz, D_km), 50);
}

function closeFresnelZoneModal() {
  const modal = document.getElementById(FRESNEL_MODAL_ID);
  if (modal) {
    modal.style.display = 'none';
  }
}


// --- Core Fresnel Zone Drawing Logic (Adapted from your HTML) ---

function drawFresnelZone(f_GHz, D_km) {
  const c = 3e8;              // speed of light (m/s)
  const steps = 300;          // number of sampling points
  const MAX_VISIBLE_RADIUS = 20; // Meters: Max radius to show on the canvas

  const canvas = document.getElementById("fresnelCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const resultsDisplay = document.getElementById("fresnel-results");

  // Conversions
  const f = f_GHz * 1e9;      // frequency (Hz)
  const D = D_km * 1000;      // distance (m)
  const lambda = c / f;       // wavelength (m)

  // SCALING
  // Horizontal scale: 800 canvas pixels covers D meters (distance)
  const xScale = w / D;
  // Vertical scale: 400 canvas pixels covers 2 * MAX_VISIBLE_RADIUS meters
  const yScale = h / (2 * MAX_VISIBLE_RADIUS);
  const offsetX = 0; // No padding needed inside the canvas
  const centerY = h / 2; // Vertical center line for the path

  // Reset canvas
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(offsetX, 0);

  // 1. Compute Fresnel radii
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const d1 = (D / steps) * i;
    const d2 = D - d1;
    // Fresnel Radius Formula (n=1): R = sqrt((n * lambda * d1 * d2) / (d1 + d2))
    const r = Math.sqrt((lambda * d1 * d2) / D); // d1 + d2 is just D
    points.push({ x: d1, r });
  }

  const maxR = Math.max(...points.map(p => p.r));

  // 2. Draw the Line of Sight (LOS)
  ctx.beginPath();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.moveTo(0, centerY);
  ctx.lineTo(D * xScale, centerY);
  ctx.stroke();
  ctx.closePath();

  // 3. Draw the Fresnel Zone Ellipse
  ctx.strokeStyle = "#00ff88";
  ctx.lineWidth = 2;
  ctx.fillStyle = "rgba(0, 255, 136, 0.1)";

  ctx.beginPath();
  // Top half
  points.forEach((p, i) => {
    const x = p.x * xScale;
    // Clamp the radius to MAX_VISIBLE_RADIUS for display purposes
    const r_scaled = Math.min(p.r, MAX_VISIBLE_RADIUS) * yScale;
    const y = centerY - r_scaled;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  // Bottom half
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    const x = p.x * xScale;
    const r_scaled = Math.min(p.r, MAX_VISIBLE_RADIUS) * yScale;
    const y = centerY + r_scaled;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.fill();

  // 4. Labels and Results
  ctx.fillStyle = "#fff";
  ctx.font = "14px sans-serif";
  ctx.fillText("Tx", -20 + offsetX, centerY + 5);
  ctx.fillText("Rx", D * xScale + 10 + offsetX, centerY + 5);

  const R_at_max_display = points.find(p => p.r === maxR).x / 1000;

  // Results in the HTML
  resultsDisplay.innerHTML = `
    **Wavelength ($\lambda$):** ${lambda.toFixed(4)} m &nbsp; | &nbsp;
    **Max Radius ($R_{max}$):** ${maxR.toFixed(2)} m (at ${R_at_max_display.toFixed(2)} km)
  `;

  ctx.restore();
}
