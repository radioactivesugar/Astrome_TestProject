// elevation.js
console.log("Elevation script loaded.");

async function fetchElevation(lat, lon) {
  try {
    const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.results[0].elevation;
  } catch (err) {
    console.error("Error fetching elevation:", err);
    return "N/A";

  }
}
