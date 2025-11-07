console.log("Frequency Match script loaded.");

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


function updateFrequencyLabel(id) {
  const label = document.getElementById(`freq-label-${id}`);
  if (label) {
    const val = window.towerFrequencies[id].toFixed(1);
    label.textContent = `${val}GHz`;
  }
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
    setInfo("❌ Frequency mismatch! Towers cannot link.");
    alert(`Cannot connect: Tower frequencies differ (${window.towerFrequencies[p1.id]} GHz vs ${window.towerFrequencies[p2.id]} GHz)`);
    return;
  }
  originalCreateLink(p1, p2);
};
