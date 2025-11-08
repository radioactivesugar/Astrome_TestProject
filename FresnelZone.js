// --- 1. Geodesic Constants (Earth's radius in meters) ---
const R = 6371000; // Earth's mean radius in meters
var currentFresnel;
// --- 2. Helper Functions (Custom Implementation) ---

// Converts degrees to radians
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Converts radians to degrees
function toDeg(radians) {
    return radians * (180 / Math.PI);
}

// Calculates the initial bearing (azimuth) from point 1 to point 2
function getBearing(lat1, lon1, lat2, lon2) {
    const phi1 = toRad(lat1);
    const lambda1 = toRad(lon1);
    const phi2 = toRad(lat2);
    const lambda2 = toRad(lon2);

    const y = Math.sin(lambda2 - lambda1) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) -
              Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda2 - lambda1);

    const bearingRad = Math.atan2(y, x);
    // Convert back to degrees and normalize to 0-360
    return (toDeg(bearingRad) + 360) % 360;
}

// Calculates a destination LatLng given a start, distance (m), and bearing (deg)
function offsetLatLng(lat, lon, distance_m, bearing_deg) {
    const phi1 = toRad(lat);
    const lambda1 = toRad(lon);
    const bearingRad = toRad(bearing_deg);

    // Angular distance in radians
    const angularDist = distance_m / R;

    // Calculate new latitude
    const newLatRad = Math.asin(
        Math.sin(phi1) * Math.cos(angularDist) +
        Math.cos(phi1) * Math.sin(angularDist) * Math.cos(bearingRad)
    );

    // Calculate new longitude
    const newLonRad = lambda1 + Math.atan2(
        Math.sin(bearingRad) * Math.sin(angularDist) * Math.cos(phi1),
        Math.cos(angularDist) - Math.sin(phi1) * Math.sin(newLatRad)
    );

    return {
        lat: toDeg(newLatRad),
        lng: toDeg(newLonRad)
    };
}

// Simple linear interpolation to find the Lat/Lng at distance d1 along the link
// (This is fine since d1 is the distance along the line string itself)
function getPointAlongLine(lat1, lon1, lat2, lon2, d1_m, D_m) {
    const t = d1_m / D_m;
    const lat = lat1 + t * (lat2 - lat1);
    const lon = lon1 + t * (lon2 - lon1);
    return {lat, lon};
}

function removeFresnel()
{
  if(currentFresnel != null)
    currentFresnel.remove();
}

// --- 3. The Main Calculation Function ---

function calculateScale(freq){
    // ... (Your original code for constants and Fresnel points) ...
    console.log(currentLink);
    const lat1 = currentLink.start.lat;
    const lon1 = currentLink.start.lng;
    const lat2 = currentLink.end.lat;
    const lon2 = currentLink.end.lng;

    const currentFrequency = freq; // Assuming a value if not defined globally

    // 1. Get current values from the (new) inputs
    const f_GHz = currentFrequency;
    const D_km = currentLink.distance;
    const c = 3e8;                    // speed of light (m/s)
    const steps = 300;                // number of sampling points

    // Convert to base units
    const f = f_GHz * 1e9;            // frequency (Hz)
    const D = D_km * 1000;            // distance (m)
    const lambda = c / f;             // wavelength (m)

    // 2. Compute Fresnel radii
    const points = [];
    for (let i = 0; i <= steps; i++) {
        const d1 = (D / steps) * i;
        const d2 = D - d1;
        // Fresnel Radius Formula (n=1)
        // Add a check to prevent division by zero at the exact start/end points if d1 or d2 is 0
        const r = (d1 + d2 === 0) ? 0 : Math.sqrt((lambda * d1 * d2) / (d1 + d2));
        points.push({ d1, r });
    }

    // ----------------------------------------------------
    // START OF POLYGON GENERATION LOGIC
    // ----------------------------------------------------

    const leftBoundaryPoints = [];
    const rightBoundaryPoints = [];

    // Calculate the initial bearing (direction) of the link
    const forwardBearing = getBearing(lat1, lon1, lat2, lon2);
    const leftBearing = (forwardBearing - 90 + 360) % 360; // Perpendicular left
    const rightBearing = (forwardBearing + 90) % 360;    // Perpendicular right

    // Iterate through the calculated Fresnel radii
    for (const point of points) {
        const d1 = point.d1; // distance from start (m)
        const r = point.r;   // Fresnel radius (m)

        // 3. Find the Lat/Lng point along the straight link at this distance
        const midPoint = getPointAlongLine(lat1, lon1, lat2, lon2, d1, D);

        // 4. Calculate the Lat/Lng offset by radius 'r' to the left and right

        // Offset to the Left
        const leftPoint = offsetLatLng(midPoint.lat, midPoint.lon, r, leftBearing);
        leftBoundaryPoints.push([leftPoint.lat, leftPoint.lng]);

        // Offset to the Right
        const rightPoint = offsetLatLng(midPoint.lat, midPoint.lon, r, rightBearing);
        rightBoundaryPoints.push([rightPoint.lat, rightPoint.lng]);
    }

    // 5. Assemble the final polygon path
    const finalPolygonPath = [
        ...leftBoundaryPoints,
        // Reverse the right points list to close the loop cleanly
        ...rightBoundaryPoints.reverse()
    ];

    // 6. Draw the polygon on the map
    currentFresnel = L.polygon(finalPolygonPath, {
        color: '#C7743D',
        fillColor: '#FFEC1F',
        fillOpacity: 0.35,
        weight: 2
    }).addTo(map);

    console.log(currentFresnel);


    // ----------------------------------------------------
    // END OF POLYGON GENERATION LOGIC
    // ----------------------------------------------------

    // ... (rest of your original code, adjusted for the polygon's bounds) ...

    // Example: fit the map view to the newly drawn polygon's bounds
    map.fitBounds(L.latLngBounds(finalPolygonPath));

    console.log(`Start Lat: ${lat1}, End Lon: ${lon1}, Dist: ${currentLink.distance}`);
}
