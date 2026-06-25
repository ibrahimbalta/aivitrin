'use strict';

function syncToolkit() {
  try {
    const toolkitStr = localStorage.getItem('toolkit');
    if (toolkitStr) {
      const toolkit = JSON.parse(toolkitStr);
      chrome.storage.local.set({ website_toolkit: toolkit }, () => {
        console.log('[AiKlavuz Extension] Synced toolkit from website:', toolkit);
      });
    } else {
      chrome.storage.local.set({ website_toolkit: [] });
    }
  } catch (e) {
    console.error('[AiKlavuz Extension] Sync failed:', e);
  }
}

// Sync on page load
syncToolkit();

// Listen to storage changes on the website in real-time
window.addEventListener('storage', (e) => {
  if (e.key === 'toolkit') {
    syncToolkit();
  }
});
