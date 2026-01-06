document.addEventListener('DOMContentLoaded', () => {
  const feedEl = document.getElementById('feed');
  const clearBtn = document.getElementById('clearAll');
  const noticeEl = document.getElementById('capabilityNotice');
  const dismissBtn = document.getElementById('dismissCapabilityNotice');

  // ----- Capability notice -----
  chrome.storage.local.get(
    ["capabilityNoticeShown", "capabilityNoticeDismissed"],
    (res) => {
      if (noticeEl && res.capabilityNoticeShown && !res.capabilityNoticeDismissed) {
        noticeEl.style.display = "block";
      }
    }
  );

  if (dismissBtn) {
    dismissBtn.addEventListener("click", () => {
      chrome.storage.local.set({ capabilityNoticeDismissed: true }, () => {
        noticeEl.style.display = "none";
      });
    });
  }

  // ----- Clear all -----
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all notifications?')) {
        chrome.runtime.sendMessage({ type: "CLEAR_FEED" }, loadFeed);
      }
    });
  }

  // ----- Load feed -----
  function loadFeed() {
    chrome.runtime.sendMessage({ type: "GET_FEED" }, (response) => {
      const feed = response?.feed || [];

      if (!feedEl) return;

      if (feed.length === 0) {
        feedEl.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
            </svg>
            <div>No notifications yet</div>
          </div>
        `;
        return;
      }

      feedEl.innerHTML = feed.map(item => `
        <div class="notification-item ${item.read ? '' : 'unread'}" data-id="${item.id}">
          <div class="notify-header">
            <div class="notify-title">${escapeHtml(item.title)}</div>
            <div style="display:flex;align-items:center;">
              <div class="notify-time">${formatTime(item.timestamp)}</div>
              <button class="delete-btn" data-id="${item.id}">×</button>
            </div>
          </div>
          ${item.message ? `<div class="notify-message">${escapeHtml(item.message)}</div>` : ''}
          <div class="notify-domain">${escapeHtml(item.domain || 'Background notification')}</div>
        </div>
      `).join('');

      // Mark read
      document.querySelectorAll('.notification-item').forEach(el => {
        el.addEventListener('click', (e) => {
          if (!e.target.classList.contains('delete-btn')) {
            chrome.runtime.sendMessage({ type: "MARK_READ", id: el.dataset.id }, loadFeed);
          }
        });
      });

      // Delete
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          chrome.runtime.sendMessage({ type: "DELETE_ITEM", id: btn.dataset.id }, loadFeed);
        });
      });
    });
  }

  loadFeed();
});

/* ---------- helpers ---------- */

function formatTime(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}
