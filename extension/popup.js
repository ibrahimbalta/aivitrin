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

    // Trigger prompt wizard init if switching to tab-wizard
    if (activeTabId === 'tab-wizard') {
      loadLibrary();
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

// Storage Helpers (Safe fallback to localStorage)
function getStorage(key, callback) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get([key], (result) => {
      callback(result[key]);
    });
  } else {
    try {
      const val = localStorage.getItem(key);
      callback(val ? JSON.parse(val) : null);
    } catch (e) {
      callback(null);
    }
  }
}

function setStorage(key, value, callback) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ [key]: value }, () => {
      if (callback) callback();
    });
  } else {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // ignore
    }
    if (callback) callback();
  }
}

// Prompt Wizard sub-tab switching
const wizardSubBtns = document.querySelectorAll('.wizard-sub-btn');
const subTabContents = document.querySelectorAll('.sub-tab-content');

wizardSubBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    wizardSubBtns.forEach(b => {
      b.classList.remove('active');
      b.style.background = 'transparent';
      b.style.color = 'var(--text-secondary)';
      b.style.fontWeight = '500';
    });
    subTabContents.forEach(c => c.classList.add('hidden'));

    btn.classList.add('active');
    btn.style.background = 'rgba(255,255,255,0.08)';
    btn.style.color = 'var(--text-primary)';
    btn.style.fontWeight = '600';
    
    const subId = btn.dataset.sub;
    document.getElementById(subId).classList.remove('hidden');

    if (subId === 'wizard-library') {
      loadLibrary();
    }
  });
});

// Prompt Wizard generation logic
const roles = {
  genel: 'Genel Yardımcı Yapay Zeka Asistanı',
  yazilim: 'Kıdemli Yazılım Geliştirici ve Sistem Mimarı',
  pazarlama: 'Deneyimli Dijital Pazarlama ve Büyüme Uzmanı',
  yazar: 'Profesyonel Metin Yazarı ve Yaratıcı İçerik Editörü',
  ogretmen: 'Pedagojik Uzmanlığa Sahip Eğitmen ve Öğretmen',
  is: 'İş Analisti ve Proje Yöneticisi'
};

const tones = {
  profesyonel: 'Profesyonel, net, kurumsal ve saygılı',
  samimi: 'Samimi, içten, samimi ve günlük konuşma dilinde',
  ikna: 'İkna edici, çarpıcı, harekete geçirici ve etkileyici',
  akademik: 'Akademik, bilimsel, kanıta dayalı ve analitik',
  eglenceli: 'Eğlenceli, mizahi, esprili ve yaratıcı'
};

const formats = {
  bullet: 'maddeler halinde kısa ve net bir liste',
  report: 'konu başlıklarını içeren detaylı ve yapılandırılmış bir rapor',
  email: 'profesyonel bir e-posta taslağı',
  table: 'Markdown formatında düzenlenmiş anlaşılır bir tablo',
  guide: 'adım adım uygulanabilir bir rehber'
};

document.getElementById('btn-generate-prompt').addEventListener('click', () => {
  const roleVal = document.getElementById('wizard-role').value;
  const toneVal = document.getElementById('wizard-tone').value;
  const formatVal = document.getElementById('wizard-format').value;
  const textVal = document.getElementById('wizard-text').value.trim();

  if (!textVal) {
    showToast('Lütfen görevi veya içeriği yazın! ⚠️');
    return;
  }

  const roleText = roles[roleVal] || roles.genel;
  const toneText = tones[toneVal] || tones.profesyonel;
  const formatText = formats[formatVal] || formats.bullet;

  const promptText = `Sen bir "${roleText}" rolündesin.
Sana vereceğim görevi "${toneText}" bir üslup kullanarak yerine getirmelisin.

Görevin/Girdim:
"""
${textVal}
"""

Lütfen çıktıyı tam olarak "${formatText}" şeklinde sun.`;

  navigator.clipboard.writeText(promptText);
  showToast('Prompt oluşturuldu ve kopyalandı! 🪄');
  
  // Clear textarea
  document.getElementById('wizard-text').value = '';
});

// Personal Prompt Library logic
document.getElementById('btn-save-prompt').addEventListener('click', () => {
  const titleEl = document.getElementById('lib-title');
  const textEl = document.getElementById('lib-text');
  
  const title = titleEl.value.trim();
  const text = textEl.value.trim();

  if (!title || !text) {
    showToast('Lütfen başlık ve prompt alanlarını doldurun! ⚠️');
    return;
  }

  getStorage('aiklavuz_library', (savedList) => {
    const list = savedList || [];
    list.unshift({
      id: Date.now().toString(),
      title: title,
      text: text
    });

    setStorage('aiklavuz_library', list, () => {
      showToast('Kütüphaneye kaydedildi! 💾');
      titleEl.value = '';
      textEl.value = '';
      loadLibrary();
    });
  });
});

function loadLibrary() {
  const listEl = document.getElementById('library-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  getStorage('aiklavuz_library', (savedList) => {
    const list = savedList || [];

    if (list.length === 0) {
      listEl.innerHTML = '<li style="text-align:center; font-size:0.72rem; color:var(--text-secondary); padding:20px;">Henüz kayıtlı promptunuz yok.</li>';
      return;
    }

    listEl.innerHTML = list.map(item => {
      return `
        <li class="lib-item" data-id="${item.id}">
          <div class="lib-item-info">
            <span class="lib-item-title">${escapeHtml(item.title)}</span>
            <span class="lib-item-preview">${escapeHtml(item.text.substring(0, 45))}...</span>
          </div>
          <div class="lib-item-actions">
            <button class="btn-icon-lib copy" title="Kopyala" data-id="${item.id}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
            <button class="btn-icon-lib delete" title="Sil" data-id="${item.id}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </li>
      `;
    }).join('');

    // Attach click listeners to library list items
    listEl.querySelectorAll('.lib-item-info').forEach(infoBox => {
      infoBox.addEventListener('click', (e) => {
        const id = infoBox.parentElement.dataset.id;
        copyFromLibrary(id, list);
      });
    });

    listEl.querySelectorAll('.btn-icon-lib.copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyFromLibrary(btn.dataset.id, list);
      });
    });

    listEl.querySelectorAll('.btn-icon-lib.delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFromLibrary(btn.dataset.id);
      });
    });
  });
}

function copyFromLibrary(id, list) {
  const item = list.find(x => x.id === id);
  if (item) {
    navigator.clipboard.writeText(item.text);
    showToast(`"${item.title}" panoya kopyalandı! 📋`);
  }
}

function deleteFromLibrary(id) {
  getStorage('aiklavuz_library', (savedList) => {
    const list = savedList || [];
    const filtered = list.filter(x => x.id !== id);
    setStorage('aiklavuz_library', filtered, () => {
      showToast('Prompt silindi. 🗑️');
      loadLibrary();
    });
  });
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Init Load
document.addEventListener('DOMContentLoaded', async () => {
  await detectApiBase();
  checkCurrentTab();
  loadDailyPrompt();
  loadNewTools();
  loadNews();
  loadLibrary();
});
