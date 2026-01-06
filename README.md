# NotifyPause Magic 🔔

A smart Chrome extension that tracks web notifications and helps you decide which ones deserve your attention right now, and which can wait.

## 🎯 What It Does

NotifyPause Magic intercepts web page notifications before they reach you, applying intelligent rules to determine if you should see them immediately or if they can be held for later. Think of it as an inbox for your notifications.

### Key Features

- **📊 Smart Notification Feed**: All notifications are captured in a centralized feed
- **🧠 Intelligent Rules Engine**: Automatically categorizes notifications based on your behavior
- **⏰ Context-Aware Decisions**: Considers time of day, frequency, and your past interactions
- **🎯 Action Tracking**: Learns from which notifications you open vs ignore
- **🔍 Domain-Based Filtering**: Groups notifications by website for better management
- **🚫 Noise Reduction**: Automatically holds repetitive or low-priority notifications

## 📋 How It Works

### Notification Detection

The extension uses two content scripts to detect notifications:

1. **inject.js** - Intercepts the native JavaScript Notification API in web pages
2. **bridge.js** - Bridges communication between the page and extension

When a website creates a notification, it's captured and added to your feed instead of being shown immediately.

### Decision Engine

Each notification is evaluated against a set of rules:

- **High-Frequency Noise**: If you've ignored similar notifications 3+ times, they're held
- **Engagement Signal**: Notifications you usually open are flagged as important
- **Off-Hours Protection**: Repetitive notifications outside work hours (9am-5pm) are held
- **Default Behavior**: New or important-looking notifications are allowed through

### Decisions Types

- **ALLOW** (🟢): Show immediately
- **FLAG** (🟡): Important - you usually engage with these
- **HOLD** (🔴): Delayed - check when you're ready

## ⚠️ Important Limitations

### Service Worker Push Notifications

**NotifyPause Magic cannot track native browser push notifications** that come from service workers. These include:

- Native mobile-style push notifications from web apps
- Background sync notifications
- Push notifications that appear even when the browser is closed

When the extension detects a website using service worker push notifications, it will show a warning popup explaining this limitation.

**What CAN be tracked:**
- Regular `new Notification()` calls from web pages
- Notifications shown while the page is open
- JavaScript-based notification systems

**What CANNOT be tracked:**
- Service Worker push notifications
- Background push messages
- Native browser notifications from closed tabs

## 🚀 Installation

### From Source (Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/AjaxSelectButtonGames/push_notification_reminder.git
   cd push_notification_reminder
   ```

2. Open Chrome and navigate to `chrome://extensions`

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked"

5. Select the `push_notification_reminder` directory

6. The extension is now installed!

### Using the Extension

1. Click the NotifyPause Magic icon in your Chrome toolbar
2. View your notification feed
3. Mark notifications as read or delete them
4. The extension learns from your behavior over time

## 📁 Project Structure

```
push_notification_reminder/
├── manifest.json          # Extension configuration (MV3)
├── background.js          # Service worker - handles notification logic
├── rules.js               # Decision engine with evaluation rules
├── inject.js              # Content script - intercepts page notifications
├── bridge.js              # Content script - bridges page and extension
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic and feed display
└── README.md              # This file
```

## 🛠️ Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: notifications, storage, tabs, all_urls
- **Content Script Worlds**: 
  - MAIN (for API interception)
  - ISOLATED (for extension communication)
- **Storage**: Chrome's local storage API
- **Feed Size**: Maximum 50 notifications

## 🔒 Privacy

- All notification data is stored locally on your device
- No data is sent to external servers
- No tracking or analytics
- Open source - audit the code yourself

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 📝 License

MIT License - feel free to use and modify as needed.

## 🐛 Known Issues

- Service worker push notifications cannot be intercepted (browser limitation)
- Some websites may use custom notification systems that aren't detected
- Extension must be running for notifications to be tracked

## 💡 Future Ideas

- Custom rules editor
- Notification scheduling
- Do Not Disturb mode with timer
- Export/import notification history
- Statistics dashboard
- Cross-browser support

---

**Made with ❤️ by AjaxSelectButtonGames**
