'use strict';

const API_BASE = 'https://aiklavuz.com/api';

// Create Context Menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "search-aiklavuz",
    title: "AiKlavuz'da Ara: \"%s\"",
    contexts: ["selection"]
  });
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "search-aiklavuz" && info.selectionText) {
    const query = encodeURIComponent(info.selectionText.trim());
    chrome.tabs.create({
      url: `https://aiklavuz.com?search=${query}`
    });
  }
});

// Detect AI Tools on tab updates and set badge
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    try {
      const urlObj = new URL(tab.url);
      const domain = urlObj.hostname;

      // Skip common non-AI or internal domains
      const exclude = [
        'google.com', 'google.com.tr', 'facebook.com', 'youtube.com', 
        'twitter.com', 'x.com', 'instagram.com', 'linkedin.com', 
        'github.com', 'localhost', 'aiklavuz.com', 'chrome://', 'newtab'
      ];
      
      const shouldSkip = exclude.some(d => domain.includes(d));
      if (shouldSkip) {
        chrome.action.setBadgeText({ text: '', tabId });
        return;
      }

      fetch(`${API_BASE}/tools/detect?domain=${encodeURIComponent(domain)}`)
        .then(res => {
          if (!res.ok) throw new Error('API status not ok');
          return res.json();
        })
        .then(data => {
          if (data && data.exists) {
            // Set glowing 'AI' badge on the icon
            chrome.action.setBadgeText({ text: 'AI', tabId });
            chrome.action.setBadgeBackgroundColor({ color: '#00f2fe', tabId });
          } else {
            chrome.action.setBadgeText({ text: '', tabId });
          }
        })
        .catch(err => {
          console.warn('[AiKlavuz Background] Tool detection failed:', err.message);
          chrome.action.setBadgeText({ text: '', tabId });
        });
    } catch (e) {
      console.error('[AiKlavuz Background] URL parsing error:', e);
    }
  }
});
