'use strict';

const API_BASE = 'https://aiklavuz.com/api';

// DOM Elements
const tabs = document.querySelectorAll('.tab-btn');
const contents = document.querySelectorAll('.tab-content');
const toast = document.getElementById('toast');
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');

let activeTabId = 'tab-detect';
let searchTimeout = null;

// Initialize Tabs switching
tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    activeTabId = btn.dataset.tab;
    document.getElementById(activeTabId).classList.add('active');
    
    // Clear search if switching tab manually
    if (searchInput.value) {
      searchInput.value = '';
      searchClearBtn.classList.add('hidden');
    }
  });
});

// Toast Helper
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

// Helper to determine pricing class and name
function getPricingMeta(pricing) {
  const p = (pricing || '').toLowerCase();
  if (p === 'free' || p === 'ucretsiz' || p === 'ücretsiz') {
    return { className: 'badge-ucretsiz', label: 'Ücretsiz' };
  } else if (p === 'freemium') {
    return { className: 'badge-freemium', label: 'Freemium' };
  } else {
    return { className: 'badge-ucretli', label: 'Ücretli' };
  }
}

// Instant Search Logic
searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim();
  
  if (query.length > 0) {
    searchClearBtn.classList.remove('hidden');
    
    // Switch UI to search view panel
    contents.forEach(c => c.classList.remove('active'));
    document.getElementById('tab-search').classList.add('active');
    
    // Debounce search API calls
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 250);
  } else {
    searchClearBtn.classList.add('hidden');
    // Restore previously active tab
    contents.forEach(c => c.classList.remove('active'));
    document.getElementById(activeTabId).classList.add('active');
    document.getElementById('tab-search').classList.remove('active');
  }
});

// Clear Search
searchClearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchClearBtn.classList.add('hidden');
  
  // Restore active tab
  contents.forEach(c => c.classList.remove('active'));
  document.getElementById(activeTabId).classList.add('active');
  document.getElementById('tab-search').classList.remove('active');
});

// Perform Search Request
async function performSearch(query) {
  const loading = document.getElementById('search-loading');
  const list = document.getElementById('search-results-list');
  const noResults = document.getElementById('search-no-results');

  loading.classList.remove('hidden');
  list.classList.add('hidden');
  noResults.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE}/tools?search=${encodeURIComponent(query)}&limit=5`);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    const tools = data.tools || [];

    if (tools.length === 0) {
      noResults.classList.remove('hidden');
    } else {
      list.innerHTML = tools.map(t => {
        const rating = t.rating ? `★ ${t.rating.toFixed(1)}` : '★ Yeni';
        const meta = getPricingMeta(t.pricing);
        
        return `
          <a class="item-card" href="https://aiklavuz.com/tool/${t.id}" target="_blank">
            <div class="item-header">
              <span class="item-name">${t.name}</span>
              <span class="item-badge-right ${meta.className}">${meta.label}</span>
            </div>
            <p class="item-desc">${t.description || ''}</p>
            <div class="item-header" style="margin-top: 4px;">
              <span class="item-badge-right" style="color:var(--accent-cyan); background:rgba(0,242,254,0.04); border:1px solid rgba(0,242,254,0.1); text-transform:none; font-weight:500;">${t.category_name || 'Yapay Zeka'}</span>
              <span style="font-size:0.75rem; color:#f1c40f; font-weight:600">${rating}</span>
            </div>
          </a>
        `;
      }).join('');
      list.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Search request error:', err);
    list.innerHTML = '<li style="text-align:center;font-size:0.8rem;color:var(--text-secondary);padding:20px;">Arama sırasında hata oluştu.</li>';
    list.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
  }
}

// Detect & Load Current Website Tool & Alternatives
async function checkCurrentTab() {
  const loading = document.getElementById('detect-loading');
  const notFound = document.getElementById('detect-not-found');
  const content = document.getElementById('detect-content');

  const showNotFound = () => {
    loading.classList.add('hidden');
    content.classList.add('hidden');
    notFound.classList.remove('hidden');
  };

  try {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabsList) => {
        const activeTab = tabsList[0];
        if (!activeTab || !activeTab.url || !activeTab.url.startsWith('http')) {
          showNotFound();
          return;
        }

        try {
          const urlObj = new URL(activeTab.url);
          const domain = urlObj.hostname;
          
          const res = await fetch(`${API_BASE}/tools/detect?domain=${encodeURIComponent(domain)}`);
          if (!res.ok) throw new Error('API request failed');
          const data = await res.json();

          if (data && data.exists) {
            const t = data.tool;
            document.getElementById('detect-tool-name').textContent = t.name;
            document.getElementById('detect-tool-rating').textContent = t.rating ? `★ ${t.rating.toFixed(1)}` : '★ -';
            document.getElementById('detect-tool-desc').textContent = t.description || '';
            document.getElementById('detect-tool-category').textContent = t.category_name || '';
            
            const reviewLink = document.getElementById('detect-tool-link');
            reviewLink.href = `https://aiklavuz.com/tool/${t.id}`;

            const altsList = document.getElementById('detect-alternatives-list');
            const alts = data.alternatives || [];
            
            if (alts.length === 0) {
              altsList.innerHTML = '<li class="empty-state" style="font-size:0.72rem; padding:10px;">Henüz alternatif araç bulunmuyor.</li>';
            } else {
              altsList.innerHTML = alts.map(alt => {
                const altRating = alt.rating ? `★ ${alt.rating.toFixed(1)}` : '★ Yeni';
                const meta = getPricingMeta(alt.pricing);
                
                return `
                  <a class="item-card" href="https://aiklavuz.com/tool/${alt.id}" target="_blank" style="padding: 10px;">
                    <div class="item-header">
                      <span class="item-name" style="font-size:0.82rem;">${alt.name}</span>
                      <span class="item-badge-right ${meta.className}" style="font-size:0.6rem; padding:1px 5px;">${meta.label}</span>
                    </div>
                    <p class="item-desc" style="font-size:0.74rem; -webkit-line-clamp: 1;">${alt.description || ''}</p>
                    <div class="item-header" style="margin-top: 2px;">
                      <span class="item-badge-right" style="font-size:0.6rem; color:var(--accent-cyan); background:rgba(0,242,254,0.04); border:1px solid rgba(0,242,254,0.1); padding:1px 5px; text-transform:none; font-weight:500;">${alt.category_name || 'Yapay Zeka'}</span>
                      <span style="font-size:0.7rem; color:#f1c40f; font-weight:600;">${altRating}</span>
                    </div>
                  </a>
                `;
              }).join('');
            }

            loading.classList.add('hidden');
            notFound.classList.add('hidden');
            content.classList.remove('hidden');
          } else {
            showNotFound();
          }
        } catch (e) {
          console.error('Detection parse error:', e);
          showNotFound();
        }
      });
    } else {
      showNotFound();
    }
  } catch (err) {
    console.error('Failed to run active tab query:', err);
    showNotFound();
  }
}

// Fetch Daily Prompt
async function loadDailyPrompt() {
  const loading = document.getElementById('prompt-loading');
  const content = document.getElementById('prompt-content');
  const titleEl = document.getElementById('prompt-title');
  const catEl = document.getElementById('prompt-category');
  const textEl = document.getElementById('prompt-text');
  const btnCopy = document.getElementById('btn-copy-prompt');

  try {
    const res = await fetch(`${API_BASE}/prompts/day`);
    if (!res.ok) throw new Error('Data fetch failed');
    const prompt = await res.json();

    titleEl.textContent = prompt.title;
    catEl.textContent = prompt.category;
    textEl.textContent = prompt.promptText;

    btnCopy.onclick = () => {
      navigator.clipboard.writeText(prompt.promptText);
      showToast('Prompt panoya kopyalandı! 📋');
    };

    loading.classList.add('hidden');
    content.classList.remove('hidden');
  } catch (err) {
    console.error('Failed to load daily prompt:', err);
    titleEl.textContent = 'Prompt Yüklenemedi';
    textEl.textContent = 'Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.';
    loading.classList.add('hidden');
    content.classList.remove('hidden');
    btnCopy.classList.add('hidden');
  }
}

// Fetch New Tools
async function loadNewTools() {
  const loading = document.getElementById('tools-loading');
  const list = document.getElementById('tools-list');

  try {
    const res = await fetch(`${API_BASE}/tools?sort=newest&limit=5`);
    if (!res.ok) throw new Error('Data fetch failed');
    const data = await res.json();
    const tools = data.tools || [];

    if (tools.length === 0) {
      list.innerHTML = '<li class="empty-state">Henüz yeni araç bulunmuyor.</li>';
    } else {
      list.innerHTML = tools.map(t => {
        const rating = t.rating ? `★ ${t.rating.toFixed(1)}` : '★ Yeni';
        const meta = getPricingMeta(t.pricing);
        
        return `
          <a class="item-card" href="https://aiklavuz.com/tool/${t.id}" target="_blank">
            <div class="item-header">
              <span class="item-name">${t.name}</span>
              <span class="item-badge-right ${meta.className}">${meta.label}</span>
            </div>
            <p class="item-desc">${t.description || ''}</p>
            <div class="item-header" style="margin-top: 4px;">
              <span class="item-badge-right" style="color:var(--accent-cyan); background:rgba(0,242,254,0.04); border:1px solid rgba(0,242,254,0.1); text-transform:none; font-weight:500;">${t.category_name || 'Yapay Zeka'}</span>
              <span style="font-size:0.75rem; color:#f1c40f; font-weight:600">${rating}</span>
            </div>
          </a>
        `;
      }).join('');
    }

    loading.classList.add('hidden');
    list.classList.remove('hidden');
  } catch (err) {
    console.error('Failed to load tools:', err);
    list.innerHTML = '<li style="text-align:center;font-size:0.8rem;color:var(--text-secondary);padding:20px;">Araçlar yüklenemedi.</li>';
    loading.classList.add('hidden');
    list.classList.remove('hidden');
  }
}

// Fetch AI News
async function loadNews() {
  const loading = document.getElementById('news-loading');
  const list = document.getElementById('news-list');

  try {
    const res = await fetch(`${API_BASE}/news`);
    if (!res.ok) throw new Error('Data fetch failed');
    const data = await res.json();
    const news = (data.news || []).slice(0, 5); // get top 5

    if (news.length === 0) {
      list.innerHTML = '<li class="empty-state">Henüz haber bulunmuyor.</li>';
    } else {
      list.innerHTML = news.map(n => {
        let dateStr = '';
        if (n.publishDate) {
          dateStr = new Date(n.publishDate).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }

        return `
          <a class="item-card" href="https://aiklavuz.com/news/${n.id}" target="_blank">
            <div class="item-header">
              <span class="item-name" style="font-size:0.82rem; line-height: 1.3;">${n.title}</span>
            </div>
            <p class="item-desc" style="-webkit-line-clamp: 2;">${n.summary || ''}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
              <span class="news-date">${dateStr}</span>
              <span style="font-size:0.7rem; color:var(--accent-blue); font-weight:600;">Oku →</span>
            </div>
          </a>
        `;
      }).join('');
    }

    loading.classList.add('hidden');
    list.classList.remove('hidden');
  } catch (err) {
    console.error('Failed to load news:', err);
    list.innerHTML = '<li style="text-align:center;font-size:0.8rem;color:var(--text-secondary);padding:20px;">Haberler yüklenemedi.</li>';
    loading.classList.add('hidden');
    list.classList.remove('hidden');
  }
}

// Init Load
document.addEventListener('DOMContentLoaded', () => {
  checkCurrentTab();
  loadDailyPrompt();
  loadNewTools();
  loadNews();
});
