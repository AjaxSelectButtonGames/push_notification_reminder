const toggleBtn = document.getElementById('toggleBtn');
const testBtn = document.getElementById('testBtn');
const modeText = document.getElementById('modeText');

// Check current state when popup opens
chrome.storage.local.get(['isPaused'], (res) => {
  updateUI(res.isPaused);
});

toggleBtn.addEventListener('click', () => {
  chrome.storage.local.get(['isPaused'], (res) => {
    const newState = !res.isPaused;
    chrome.storage.local.set({ isPaused: newState }, () => {
      updateUI(newState);
      // Tell background we might need to release queued notifications
      if (!newState) {
        chrome.runtime.sendMessage({ type: "RELEASE_QUEUED" });
      }
    });
  });
});

testBtn.addEventListener('click', () => {
  // Simulate a notification coming in
  chrome.runtime.sendMessage({ 
    type: "NEW_NOTIFY", 
    data: { title: "Magic Alert!", message: "This worked!" } 
  });
});

function updateUI(isPaused) {
  modeText.innerText = isPaused ? "Paused" : "Active";
  toggleBtn.innerText = isPaused ? "Resume Notifications" : "Pause Notifications";
}
