// background.js (MV3 service worker, ES module)

import { evaluateNotification } from "./rules.js";

const MAX_FEED_SIZE = 50;

/* -------------------------------------------------
   BACKGROUND / PUSH AWARENESS (NOT INTERCEPTION)
-------------------------------------------------- */

function maybeShowCapabilityNotice() {
  chrome.storage.local.get(["capabilityNoticeShown"], (res) => {
    if (res.capabilityNoticeShown) return;

    chrome.storage.local.set({
      capabilityNoticeShown: true,
      capabilityNoticeAt: Date.now()
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === "SHOW_CAPABILITY_NOTICE") {
    maybeShowCapabilityNotice();
    return;
  }

  if (message.type === "NEW_NOTIFY") {
    addToFeed({ ...message.data, sourceType: "page" });
    return;
  }

  if (message.type === "GET_FEED") {
    getFeed(sendResponse);
    return true;
  }

  if (message.type === "CLEAR_FEED") {
    clearFeed(sendResponse);
    return true;
  }

  if (message.type === "MARK_READ") {
    markAsRead(message.id, sendResponse);
    return true;
  }

  if (message.type === "DELETE_ITEM") {
    deleteItem(message.id, sendResponse);
    return true;
  }
});


/* -------------------------------------------------
   CORE FEED LOGIC
-------------------------------------------------- */

function generateId() {
  return `notify_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function addToFeed(data) {
  chrome.storage.local.get(["feed"], (res) => {
    let feed = res.feed || [];

    let decision = {
      decision: "allow",
      reason: "No reason to delay this."
    };

    if (data.sourceType === "page") {
      decision = evaluateNotification(data, feed);
    }

    const item = {
      id: generateId(),
      title: data.title,
      message: data.message,
      icon: data.icon,
      timestamp: data.timestamp,
      url: data.url || null,
      domain: data.domain || null,

      read: false,
      sourceType: data.sourceType,
      decision: decision.decision,
      reason: decision.reason,
      decidedAt: Date.now(),
      undone: false
    };

    feed.unshift(item);

    if (feed.length > MAX_FEED_SIZE) {
      feed = feed.slice(0, MAX_FEED_SIZE);
    }

    chrome.storage.local.set({ feed }, updateBadge);
  });
}

/* -------------------------------------------------
   FEED HELPERS
-------------------------------------------------- */

function getFeed(sendResponse) {
  chrome.storage.local.get(["feed"], (res) => {
    sendResponse({ feed: res.feed || [] });
  });
}

function clearFeed(sendResponse) {
  chrome.storage.local.set({ feed: [] }, () => {
    updateBadge();
    sendResponse({ success: true });
  });
}

function markAsRead(id, sendResponse) {
  chrome.storage.local.get(["feed"], (res) => {
    const feed = res.feed || [];
    const item = feed.find(n => n.id === id);
    if (item) {
      item.read = true;
      chrome.storage.local.set({ feed }, () => {
        updateBadge();
        sendResponse({ success: true });
      });
    }
  });
}

function deleteItem(id, sendResponse) {
  chrome.storage.local.get(["feed"], (res) => {
    let feed = res.feed || [];
    feed = feed.filter(n => n.id !== id);
    chrome.storage.local.set({ feed }, () => {
      updateBadge();
      sendResponse({ success: true });
    });
  });
}

/* -------------------------------------------------
   BADGE
-------------------------------------------------- */

function updateBadge() {
  chrome.storage.local.get(["feed"], (res) => {
    const feed = res.feed || [];
    const unread = feed.filter(n => !n.read).length;

    chrome.action.setBadgeText({ text: unread ? String(unread) : "" });
    chrome.action.setBadgeBackgroundColor({ color: "#FF4444" });
  });
}

updateBadge();
