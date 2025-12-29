chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "NEW_NOTIFY") {
    handleNotification(message.data);
  } else if (message.type === "RELEASE_QUEUED") {
    releaseQueue();
  }
});

function handleNotification(data) {
  chrome.storage.local.get(['isPaused', 'queue'], (res) => {
    const queue = res.queue || [];
    
    if (res.isPaused) {
      // Logic B: Pause and save for later
      queue.push(data);
      chrome.storage.local.set({ queue: queue });
      console.log("Notification paused and queued.");
    } else {
      // Logic A: Remind immediately
      showNow(data.title, data.message);
    }
  });
}

function releaseQueue() {
  chrome.storage.local.get(['queue'], (res) => {
    const queue = res.queue || [];
    if (queue.length > 0) {
      showNow("Missed Notifications", `You missed ${queue.length} alerts while paused!`);
      // Clear the queue
      chrome.storage.local.set({ queue: [] });
    }
  });
}

function showNow(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'https://www.gstatic.com/chrome/intelligent/images/notifications/general_48dp.png',
    title: title,
    message: message,
    priority: 2
  });
}
