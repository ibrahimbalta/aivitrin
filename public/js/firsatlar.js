// Yapay Zeka Vitrini — Fırsatlar & Kuponlar Modülü
'use strict';

document.addEventListener('DOMContentLoaded', async function () {
  let allDeals = [];

  // DOM Elements
  const dealsGrid = document.getElementById('deals-grid');
  const searchInput = document.getElementById('deal-search-input');
  const themeToggle = document.getElementById('theme-toggle');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');

  // Load deals from API
  async function loadDeals() {
    try {
      const res = await fetch('/api/deals');
      if (res.ok) {
        allDeals = await res.json();
        renderDeals(allDeals);
      } else {
        dealsGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--accent-red); padding:40px;">Kuponlar yüklenemedi. Sunucu hatası.</div>`;
      }
    } catch (e) {
      console.error('Error fetching deals:', e);
      dealsGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--accent-red); padding:40px;">Bağlantı hatası. Lütfen internetinizi kontrol edin.</div>`;
    }
  }

  // Render Deals Cards
  function renderDeals(deals) {
    if (!dealsGrid) return;
    if (deals.length === 0) {
      dealsGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:40px;">Aradığınız kriterlere uygun fırsat bulunamadı.</div>`;
      return;
    }

    dealsGrid.innerHTML = deals.map(deal => {
      const firstLetter = deal.tool_name.charAt(0).toUpperCase();
      const verifiedBadge = deal.verified ? `<span class="badge badge-featured" style="background:#10b981; color:white; font-size:0.75rem; border:none; margin-left:auto;">✓ Doğrulanmış</span>` : '';
      
      // Determine if code requires copying or is just a link
      const isCode = deal.code && deal.code !== 'Kupon Gerekmiyor';
      const buttonHtml = isCode 
        ? `<button class="btn-copy-code" data-code="${deal.code}" data-id="${deal.id}" style="padding:10px 16px; background:var(--gradient-primary); border:none; color:white; font-weight:600; border-radius:var(--radius-sm); cursor:pointer; font-size:0.85rem; transition:all 0.2s ease;">Kodu Kopyala</button>`
        : `<a href="${deal.url}" target="_blank" rel="noopener" class="btn-copy-code" data-id="${deal.id}" style="padding:10px 16px; background:var(--accent-purple); color:white; font-weight:600; border-radius:var(--radius-sm); text-decoration:none; text-align:center; font-size:0.85rem; transition:all 0.2s ease;">Fırsatı Yakala &rarr;</a>`;

      const codeBoxHtml = isCode
        ? `<div class="deal-code-box" style="border: 2px dashed rgba(99,102,241,0.3); background: rgba(99,102,241,0.05); padding: 8px 16px; border-radius: var(--radius-sm); font-family: monospace; font-size: 1.1rem; font-weight: 700; color: var(--accent-purple); text-align: center; letter-spacing: 1px;">${deal.code}</div>`
        : `<div class="deal-code-box" style="border: 2px dashed rgba(16,185,129,0.3); background: rgba(16,185,129,0.05); padding: 8px 16px; border-radius: var(--radius-sm); font-size: 0.9rem; font-weight: 600; color: #10b981; text-align: center;">Kupon Kodu Gerekmiyor</div>`;

      return `
        <div class="tool-card animate-on-scroll visible" style="display:flex; flex-direction:column; padding:24px;">
          <div class="tool-card-header" style="margin-bottom:12px; display:flex; align-items:center;">
            <div class="tool-icon" style="margin-right:12px;">${firstLetter}</div>
            <div class="tool-info" style="flex:1;">
              <h3 class="tool-name" style="margin:0; font-size:1.15rem;">${deal.tool_name}</h3>
              <span style="font-size:0.8rem; color:var(--accent-red); font-weight:700; background:rgba(239,68,68,0.1); padding:2px 8px; border-radius:50px; display:inline-block; margin-top:4px;">${deal.discount}</span>
            </div>
            ${verifiedBadge}
          </div>
          
          <p class="tool-description" style="margin:12px 0; font-size:0.9rem; line-height:1.5; color:var(--text-muted); flex:1;">${deal.description}</p>
          
          <div style="margin-top:auto; display:flex; flex-direction:column; gap:12px;">
            ${codeBoxHtml}
            ${buttonHtml}
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
              <span>📅 Son Gün: ${deal.expiry_date || 'Belirtilmemiş'}</span>
              <span id="click-count-${deal.id}">🔥 <span class="clicks-num" style="font-weight:600; color:var(--text-primary);">${deal.clicks || 0}</span> kez kullanıldı</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach copy & click event listeners
    document.querySelectorAll('.btn-copy-code').forEach(btn => {
      btn.addEventListener('click', async function (e) {
        const id = this.getAttribute('data-id');
        const code = this.getAttribute('data-code');
        
        // Log click statistics to API
        fetch(`/api/deals/${id}/click`, { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              const countEl = document.querySelector(`#click-count-${id} .clicks-num`);
              if (countEl) countEl.textContent = data.clicks;
            }
          }).catch(err => console.error('Error logging click:', err));

        if (code) {
          // Copy to clipboard
          try {
            await navigator.clipboard.writeText(code);
            showToast('Kupon kodu başarıyla kopyalandı! ✂', 'success');
            
            // Visual button animation feedback
            const originalText = this.textContent;
            this.textContent = 'Kopyalandı! ✔';
            this.style.background = '#10b981';
            setTimeout(() => {
              this.textContent = originalText;
              this.style.background = 'var(--gradient-primary)';
            }, 2000);
          } catch (err) {
            showToast('Kopyalama başarısız oldu.', 'error');
          }
        }
      });
    });
  }

  // Initial load
  await loadDeals();

  // Search logic
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const q = this.value.toLowerCase().trim();
      const filtered = allDeals.filter(deal => {
        return deal.tool_name.toLowerCase().includes(q) || 
               deal.description.toLowerCase().includes(q) || 
               deal.code.toLowerCase().includes(q) ||
               deal.discount.toLowerCase().includes(q);
      });
      renderDeals(filtered);
    });
  }

  // Spotlight effect
  document.addEventListener('mousemove', function (e) {
    document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
    document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
  });

  // Theme Toggler
  var savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = (current === 'dark') ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // Mobile Menu
  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', function () {
      mobileNav.classList.toggle('active');
    });
  }
});

// Toast notification helper
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.background = type === 'success' ? '#10b981' : '#ef4444';
  toast.style.color = 'white';
  toast.style.padding = '12px 24px';
  toast.style.borderRadius = '8px';
  toast.style.marginTop = '10px';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  toast.style.fontFamily = 'Inter, sans-serif';
  toast.style.fontSize = '0.9rem';
  toast.style.fontWeight = '500';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(20px)';
  toast.style.transition = 'all 0.3s ease';
  toast.textContent = message;

  container.appendChild(toast);

  // Trigger animations
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);

  // Remove toast
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}
