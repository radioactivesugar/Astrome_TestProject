console.log("Frequency Match script loaded.");

// --- NEW GLOBAL VARIABLES FOR PRESS-AND-HOLD FEATURE ---
let repeatTimer;
let repeatInterval;

const INITIAL_DELAY = 400; // Delay (ms) before repetition starts
const REPEAT_SPEED = 100;  // Speed (ms) of the repetition

// --- NEW FUNCTIONS FOR PRESS-AND-HOLD FEATURE ---

/**
 * Starts the continuous frequency change when the button is held down.
 * @param {string} id - The ID of the tower/input.
 * @param {number} delta - The value to add/subtract (e.g., 0.1 or -0.1).
 */
function startRepeat(id, delta) {
    // 1. Execute the change function once immediately upon mouse down
    changeFrequency(id, delta);

    // 2. Set a short delay before continuous repetition starts
    repeatTimer = setTimeout(() => {
        // 3. After the initial delay, start the continuous interval
        repeatInterval = setInterval(() => {
            changeFrequency(id, delta);
        }, REPEAT_SPEED);
    }, INITIAL_DELAY);
}

/**
 * Stops the continuous frequency change (called on mouse up/leave).
 */
function stopRepeat() {
    // Clear both timers to halt any ongoing or pending repetition
    clearTimeout(repeatTimer);
    clearInterval(repeatInterval);

    // Optional: If you have a separate visualization update function (e.g., calculateScale)
    // and need it to run one last time after the user finishes adjusting:
    // if (window.someLinkIsActive) window.calculateScale();
}
// --- END OF NEW FUNCTIONS ---


window.towerFrequencies = {};

function initializeFrequencyForMarker(marker, id) {
    window.towerFrequencies[id] = 52.9;
}

function changeFrequency(id, delta) {
    const current = window.towerFrequencies[id] ?? 52.9;
    const newFreq = Math.max(0, parseFloat((current + delta).toFixed(1)));
    window.towerFrequencies[id] = newFreq;

    const input = document.getElementById(`freq-input-${id}`);
    if (input) input.value = newFreq.toFixed(1);

    updateFrequencyLabel(id);
}

function updateFrequencyFromInput(id) {
    const input = document.getElementById(`freq-input-${id}`);
    if (input) {
        let val = parseFloat(input.value);
        if (isNaN(val) || val < 0) val = 0;
        window.towerFrequencies[id] = parseFloat(val.toFixed(1));
        updateFrequencyLabel(id);
    }
}

function returnFrequency(p) {
    return window.towerFrequencies[p]
}


function updateFrequencyLabel(id) {
    const label = document.getElementById(`freq-label-${id}`);
    if (label) {
        const val = window.towerFrequencies[id].toFixed(1);
        label.textContent = `${val}GHz`;
    }

    const index = markerData.findIndex((p) => p.id === id);
    const point = markerData[index];
    removeLinksWithPoint(point);
    setInfo(`Frequency Changed.`,` All links to the tower have been removed.`, true);


}

function frequenciesMatch(p1, p2) {
    const f1 = window.towerFrequencies[p1.id];
    const f2 = window.towerFrequencies[p2.id];
    if (f1 == null || f2 == null) return false;
    return Math.abs(f1 - f2) < 0.001;
}

const originalCreateLink = window.createLink;
window.createLink = function (p1, p2) {
    if (!frequenciesMatch(p1, p2)) {
        setInfo(`Frequency mismatch! Towers cannot link.`,` Tower frequencies do not match - (${window.towerFrequencies[p1.id]} GHz vs ${window.towerFrequencies[p2.id]} GHz)`, true);
        return;
    }
    originalCreateLink(p1, p2);

};
