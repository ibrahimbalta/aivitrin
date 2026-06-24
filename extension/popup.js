'use strict';

let API_BASE = 'https://aiklavuz.com/api';

// Auto-detect localhost during development
async function detectApiBase() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300);
  try {
    const res = await fetch('http://localhost:3000/api/tools?limit=1', { signal: controller.signal });
    if (res.ok) {
      API_BASE = 'http://localhost:3000/api';
      console.log('Using local server:', API_BASE);
    }
  } catch (e) {
    // defaults to production
  } finally {
    clearTimeout(timeoutId);
  }
}

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

    // Trigger summarizer on tab switch
    if (activeTabId === 'tab-summarize') {
      summarizeCurrentPage();
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

// Page Summarization Logic
async function summarizeCurrentPage() {
  const loading = document.getElementById('summarize-loading');
  const unsupported = document.getElementById('summarize-unsupported');
  const content = document.getElementById('summarize-content');
  const textEl = document.getElementById('summarize-text');

  loading.classList.remove('hidden');
  unsupported.classList.add('hidden');
  content.classList.add('hidden');
  textEl.innerHTML = '';

  try {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabsList) => {
        const activeTab = tabsList[0];
        if (!activeTab || !activeTab.url || !activeTab.url.startsWith('http')) {
          loading.classList.add('hidden');
          unsupported.classList.remove('hidden');
          return;
        }

        chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: () => {
            return document.body.innerText || '';
          }
        }, async (results) => {
          if (chrome.runtime.lastError || !results || !results[0]) {
            console.warn('[AiKlavuz] Scripting injection error:', chrome.runtime.lastError);
            loading.classList.add('hidden');
            unsupported.classList.remove('hidden');
            return;
          }

          let pageText = (results[0].result || '').trim();
          if (pageText.length < 100) {
            chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              func: () => {
                const paragraphs = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim()).filter(Boolean);
                return paragraphs.join('\n\n');
              }
            }, async (results2) => {
              if (results2 && results2[0] && results2[0].result) {
                pageText = results2[0].result.trim();
              }
              await fetchSummary(pageText, activeTab.url);
            });
          } else {
            await fetchSummary(pageText, activeTab.url);
          }
        });
      });
    } else {
      loading.classList.add('hidden');
      unsupported.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Page summary execution error:', err);
    loading.classList.add('hidden');
    unsupported.classList.remove('hidden');
  }
}

async function fetchSummary(text, url) {
  const loading = document.getElementById('summarize-loading');
  const content = document.getElementById('summarize-content');
  const textEl = document.getElementById('summarize-text');
  const copyBtn = document.getElementById('btn-copy-summary');

  if (!text || text.length < 50) {
    loading.classList.add('hidden');
    document.getElementById('summarize-unsupported').classList.remove('hidden');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/ai/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.substring(0, 8000),
        url: url
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Özet oluşturma hatası');
    }

    const data = await response.json();
    if (data.success && data.summary) {
      const formatted = data.summary;
      if (formatted.includes('•') || formatted.includes('- ')) {
        const lines = formatted.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => {
            const clean = line.replace(/^[•\-\*]\s*/, '');
            return `<li>${clean}</li>`;
          })
          .join('');
        textEl.innerHTML = `<ul>${lines}</ul>`;
      } else {
        textEl.textContent = formatted;
      }

      copyBtn.onclick = () => {
        const plainText = textEl.innerText || textEl.textContent;
        navigator.clipboard.writeText(plainText);
        showToast('Özet panoya kopyalandı! 📋');
      };

      loading.classList.add('hidden');
      content.classList.remove('hidden');
    } else {
      throw new Error('Geçersiz sunucu yanıtı.');
    }
  } catch (err) {
    console.error('Fetch summary failed:', err);
    const friendlyMsg = getFriendlyErrorMessage(err.message);
    textEl.innerHTML = `<div style="color:#ff4757; font-size:0.78rem; line-height:1.5; padding:6px 2px;">${friendlyMsg}</div>`;
    loading.classList.add('hidden');
    content.classList.remove('hidden');
  }
}

function getFriendlyErrorMessage(message) {
  const msg = (message || '').toLowerCase();
  
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('rate_limit') || msg.includes('tpm') || msg.includes('rpm')) {
    return '⚠️ API Kullanım Limiti Aşıldı!\n\nYapay zeka servisinin dakikalık/günlük limitleri aşılmış durumda. Lütfen API anahtarınızın bakiyesini veya limitlerini kontrol edip birkaç dakika sonra tekrar deneyin.';
  }
  
  if (msg.includes('insufficient_quota') || msg.includes('quota') || msg.includes('bakiye') || msg.includes('billing')) {
    return '💳 API Kotası / Bakiyesi Yetersiz!\n\nYapay zeka API anahtarınızın kullanım kotası dolmuş veya bakiyesi tükenmiş. Lütfen API sağlayıcınızın kontrol panelinden faturanızı/bakiyenizi kontrol edin.';
  }
  
  if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid_api_key') || msg.includes('api anahtarı geçersiz')) {
    return '🔑 Geçersiz API Anahtarı!\n\nYapay zeka API anahtarı geçersiz veya yetkilendirme hatası alındı. Lütfen yönetici panelinden API anahtarını güncelleyin.';
  }
  
  if (msg.includes('timeout') || msg.includes('zaman aşımı') || msg.includes('timed out')) {
    return '⏱️ Bağlantı Zaman Aşımına Uğradı!\n\nSunucu veya yapay zeka servisi zamanında yanıt vermedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.';
  }

  if (msg.includes('404') || msg.includes('model_not_found') || msg.includes('model bulunamadı')) {
    return '🤖 Model Bulunamadı!\n\nAyarlarda seçilen yapay zeka modeli (örneğin gpt-5.4-mini) API sağlayıcısı tarafından desteklenmiyor veya geçersiz. Lütfen model adını kontrol edin.';
  }
  
  return `❌ Bir Hata Oluştu:\n\n${message}`;
}

// Bind reload/refresh button
document.getElementById('btn-refresh-summary').addEventListener('click', summarizeCurrentPage);

// Init Load
document.addEventListener('DOMContentLoaded', async () => {
  await detectApiBase();
  checkCurrentTab();
  loadDailyPrompt();
  loadNewTools();
  loadNews();
});
