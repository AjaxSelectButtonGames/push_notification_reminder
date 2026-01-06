// bridge.js - Runs in ISOLATED world to bridge between page and extension
// This script receives messages from inject.js and forwards them to the background script

(function() {
  'use strict';

  // Listen for events from inject.js (MAIN world)
  window.addEventListener('pushNotificationDetected', (event) => {
    const details = event.detail;
    
    // Show a user-friendly alert about push notifications
    showPushNotificationWarning(details);
    
    // Also notify the background script for tracking
    chrome.runtime.sendMessage({
      type: 'SHOW_CAPABILITY_NOTICE'
    });
  });

  // Listen for notification events from inject.js
  window.addEventListener('notificationShown', (event) => {
    const details = event.detail;
    
    // Forward to background script
    chrome.runtime.sendMessage({
      type: 'NEW_NOTIFY',
      data: details
    });
  });

  function showPushNotificationWarning(details) {
    // Create a visual warning overlay
    const overlay = document.createElement('div');
    overlay.id = 'notifypause-warning-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 999999;
      max-width: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideIn 0.3s ease-out;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    title.innerHTML = `
      <span style="font-size: 24px;">⚠️</span>
      <span>Push Notifications Detected</span>
    `;

    const message = document.createElement('div');
    message.style.cssText = `
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 15px;
      opacity: 0.95;
    `;
    
    let messageText = '';
    if (details.type === 'serviceWorkerWithPush') {
      messageText = 'This website is using Service Workers for push notifications. These notifications are handled by your browser natively and <strong>will NOT be tracked</strong> by NotifyPause Magic.';
    } else if (details.type === 'pushSubscription') {
      messageText = 'This website is subscribing to push notifications. These push notifications <strong>will NOT be tracked</strong> by NotifyPause Magic since they are handled by the browser.';
    } else {
      messageText = 'This website requested notification permissions. Web-based notifications will be tracked, but browser push notifications will not.';
    }
    
    message.innerHTML = messageText;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Got it';
    closeButton.style.cssText = `
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 8px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s;
      width: 100%;
    `;
    closeButton.onmouseover = () => {
      closeButton.style.background = 'rgba(255,255,255,0.3)';
    };
    closeButton.onmouseout = () => {
      closeButton.style.background = 'rgba(255,255,255,0.2)';
    };
    closeButton.onclick = () => {
      overlay.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => overlay.remove(), 300);
    };

    overlay.appendChild(title);
    overlay.appendChild(message);
    overlay.appendChild(closeButton);

    // Add CSS animation
    if (!document.getElementById('notifypause-animations')) {
      const style = document.createElement('style');
      style.id = 'notifypause-animations';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Wait for DOM to be ready
    if (document.body) {
      document.body.appendChild(overlay);
      
      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.style.animation = 'slideOut 0.3s ease-in';
          setTimeout(() => overlay.remove(), 300);
        }
      }, 10000);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(overlay);
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => overlay.remove(), 300);
          }
        }, 10000);
      });
    }
  }

})();
