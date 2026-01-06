// inject.js - Runs in MAIN world to intercept Push API
// This script detects when websites register service workers with push capabilities

(function() {
  'use strict';

  // Track if we've already shown the notice for this page
  let noticeShownForThisPage = false;

  function notifyExtension(details) {
    if (noticeShownForThisPage) return;
    noticeShownForThisPage = true;

    // Send to bridge via custom event
    window.dispatchEvent(new CustomEvent('pushNotificationDetected', {
      detail: details
    }));
  }

  // Intercept ServiceWorker registration
  if ('serviceWorker' in navigator) {
    const originalRegister = navigator.serviceWorker.register;
    navigator.serviceWorker.register = function(...args) {
      const result = originalRegister.apply(this, args);
      
      // Check if this service worker will handle push notifications
      result.then((registration) => {
        // If the service worker has push manager, notify extension
        if (registration.pushManager) {
          notifyExtension({
            type: 'serviceWorkerWithPush',
            url: window.location.href,
            domain: window.location.hostname,
            timestamp: Date.now()
          });
        }
      }).catch(() => {
        // Ignore errors
      });

      return result;
    };
  }

  // Intercept PushManager.subscribe calls
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    // We need to override the subscribe method on the prototype
    const descriptor = Object.getOwnPropertyDescriptor(PushManager.prototype, 'subscribe');
    if (descriptor && descriptor.value) {
      const originalSubscribe = descriptor.value;
      
      Object.defineProperty(PushManager.prototype, 'subscribe', {
        value: function(...args) {
          notifyExtension({
            type: 'pushSubscription',
            url: window.location.href,
            domain: window.location.hostname,
            timestamp: Date.now()
          });
          
          return originalSubscribe.apply(this, args);
        },
        configurable: true,
        writable: true
      });
    }
  }

  // Intercept the legacy Notification.requestPermission
  if ('Notification' in window) {
    const originalRequestPermission = Notification.requestPermission;
    Notification.requestPermission = function(...args) {
      // This might be a regular notification or push-based
      // We'll notify the extension to let the user know
      notifyExtension({
        type: 'notificationPermissionRequest',
        url: window.location.href,
        domain: window.location.hostname,
        timestamp: Date.now()
      });
      
      return originalRequestPermission.apply(this, args);
    };

    // Also intercept the Notification constructor to catch notifications being shown
    const OriginalNotification = window.Notification;
    window.Notification = function(title, options = {}) {
      const notificationData = {
        title: title,
        message: options.body || '',
        icon: options.icon || '',
        timestamp: Date.now(),
        url: window.location.href,
        domain: window.location.hostname
      };

      // Send notification details to our extension for evaluation
      window.dispatchEvent(new CustomEvent('notificationToEvaluate', {
        detail: notificationData
      }));

      // Create a promise that will be resolved by bridge.js after rule evaluation
      // For now, we'll create the notification but the bridge will handle the decision
      return new OriginalNotification(title, options);
    };
    
    // Copy over static properties
    Object.setPrototypeOf(window.Notification, OriginalNotification);
    window.Notification.prototype = OriginalNotification.prototype;
    
    // Copy static properties like permission, maxActions, etc.
    Object.defineProperties(window.Notification, {
      permission: {
        get: () => OriginalNotification.permission
      },
      requestPermission: {
        value: Notification.requestPermission
      }
    });
  }

})();
