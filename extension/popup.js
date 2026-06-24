'use strict';

const API_BASE = 'https://aiklavuz.com/api';

// DOM Elements
const tabs = document.querySelectorAll('.tab-btn');
const contents = document.querySelectorAll('.tab-content');
const toast = document.getElementById('toast');

// Initialize Tabs
tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    const target = btn.dataset.tab;
    document.getElementById(target).classList.add('active');
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
        const pricingText = t.pricing ? t.pricing.toUpperCase() : 'Ücretsiz';
        
        return `
          <a class="item-card" href="https://aiklavuz.com/tool/${t.id}" target="_blank">
            <div class="item-header">
              <span class="item-name">${t.name}</span>
              <span class="item-badge-right">${pricingText}</span>
            </div>
            <p class="item-desc">${t.description || ''}</p>
            <div class="item-header" style="margin-top: 4px;">
              <span class="item-badge-right" style="color:var(--accent-cyan); background:rgba(0,242,254,0.05)">${t.category_name || 'Yapay Zeka'}</span>
              <span style="font-size:0.7rem; color:#f1c40f">${rating}</span>
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
              <span class="item-name" style="font-size:0.82rem;">${n.title}</span>
            </div>
            <p class="item-desc" style="-webkit-line-clamp: 2;">${n.summary || ''}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
              <span class="news-date">${dateStr}</span>
              <span style="font-size:0.65rem; color:var(--accent-blue)">Devamını Oku →</span>
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
  loadDailyPrompt();
  loadNewTools();
  loadNews();
});
