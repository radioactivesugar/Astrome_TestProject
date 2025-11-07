// elevation.js
console.log("Elevation script loaded.");

async function fetchElevation(lat, lon) {
  const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results[0].elevation;
}

async function getElevationSummary(txMarker, rxMarker) {
  setInfo("Fetching link data...");

  try {
    const distance = map.distance(txMarker.getLatLng(), rxMarker.getLatLng()).toFixed(1);

    setInfo(
      `📡 Tx Elevation: ${txMarker.elevation} m | 🎯 Rx Elevation: ${rxMarker.elevation} m | 📏 Distance: ${distance} m`
    );
  } catch (err) {
    console.error(err);
    setInfo("❌ Error fetching elevation data.");
  }
}
