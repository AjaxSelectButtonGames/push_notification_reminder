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
  window.addEventListener('notificationToEvaluate', async (event) => {
    const details = event.detail;
    
    // Ask background script to evaluate this notification
    chrome.runtime.sendMessage({
      type: 'EVALUATE_NOTIFY',
      data: details
    }, (response) => {
      if (!response) return;
      
      const { decision, reason } = response;
      
      // Always add to feed regardless of decision
      chrome.runtime.sendMessage({
        type: 'NEW_NOTIFY',
        data: details
      });
      
      // Show visual feedback based on decision
      showDecisionFeedback(details, decision, reason);
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

    addAnimationStyles();
    appendToBody(overlay, 10000);
  }

  function showDecisionFeedback(notificationData, decision, reason) {
    const overlay = document.createElement('div');
    overlay.className = 'notifypause-decision-overlay';
    
    // Different styles based on decision
    let bgColor, emoji, decisionText;
    
    if (decision === 'allow') {
      bgColor = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
      emoji = '🟢';
      decisionText = 'ALLOWED';
    } else if (decision === 'flag') {
      bgColor = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      emoji = '🟡';
      decisionText = 'FLAGGED';
    } else if (decision === 'hold') {
      bgColor = 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
      emoji = '🔴';
      decisionText = 'HELD';
    }
    
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 999999;
      max-width: 380px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideIn 0.3s ease-out;
    `;

    overlay.innerHTML = `
      <div style="display: flex; align-items: start; gap: 12px;">
        <div style="font-size: 28px; line-height: 1;">${emoji}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 12px; font-weight: 700; opacity: 0.9; letter-spacing: 0.5px; margin-bottom: 4px;">
            ${decisionText}
          </div>
          <div style="font-size: 15px; font-weight: 600; margin-bottom: 6px; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${escapeHtml(notificationData.title)}
          </div>
          <div style="font-size: 13px; opacity: 0.9; line-height: 1.4; margin-bottom: 8px;">
            ${escapeHtml(reason)}
          </div>
          <div style="font-size: 11px; opacity: 0.75; font-style: italic;">
            ${notificationData.domain}
          </div>
        </div>
      </div>
    `;

    addAnimationStyles();
    appendToBody(overlay, 4000);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function addAnimationStyles() {
    if (document.getElementById('notifypause-animations')) return;
    
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

  function appendToBody(element, autoDismissMs) {
    if (document.body) {
      document.body.appendChild(element);
      
      if (autoDismissMs) {
        setTimeout(() => {
          if (element.parentNode) {
            element.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => element.remove(), 300);
          }
        }, autoDismissMs);
      }
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(element);
        
        if (autoDismissMs) {
          setTimeout(() => {
            if (element.parentNode) {
              element.style.animation = 'slideOut 0.3s ease-in';
              setTimeout(() => element.remove(), 300);
            }
          }, autoDismissMs);
        }
      });
    }
  }

})();
