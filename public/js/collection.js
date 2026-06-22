// Yapay Zeka Vitrini — Paylaşılan Koleksiyon Sayfası Scripti
'use strict';

document.addEventListener('DOMContentLoaded', async function () {
  const collectionGrid = document.getElementById('collection-grid');
  const collectionTitle = document.getElementById('collection-title');
  const collectionDesc = document.getElementById('collection-desc');
  const collectionOwner = document.getElementById('collection-owner');
  const collectionMeta = document.getElementById('collection-meta-container');

  // Global Toast Notification System (copied for safety if not global)
  window.showToast = window.showToast || function (message, type) {
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'success');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 4000);
  };
  const showToast = window.showToast;

  // Extract collection ID from URL query string
  const urlParams = new URLSearchParams(window.location.search);
  const collectionId = urlParams.get('id');

  const bagParam = urlParams.get('bag');

  if (bagParam) {
    try {
      const [catsRes, toolsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/tools')
      ]);
      const categories = await catsRes.json();
      const toolsData = await toolsRes.json();
      const allTools = toolsData.tools || toolsData;
      
      const toolIds = bagParam.split(',').map(id => id.trim()).filter(Boolean);
      const matchedTools = toolIds.map(id => {
        const t = allTools.find(tool => tool.id === id);
        if (t) {
          const cat = categories.find(c => c.id === t.category_id);
          return Object.assign({}, t, {
            category_name: cat ? cat.name : '',
            category_icon: cat ? cat.icon : ''
          });
        }
        return null;
      }).filter(Boolean);
      
      renderCollection({
        name: 'Paylaşılan AI Çantam',
        description: 'AiKlavuz üzerinde biriktirdiğim yapay zeka araçları koleksiyonu.',
        owner: 'Paylaşan Üye',
        tools: matchedTools
      });
    } catch (err) {
      console.error('Batch load error:', err);
      showEmptyState('Bağlantı Hatası', 'Araçlar yüklenemedi. İnternet bağlantınızı kontrol edin.');
    }
    return;
  }

  if (!collectionId) {
    showEmptyState('Geçersiz Koleksiyon', 'Herhangi bir koleksiyon ID\'si sağlanmadı. Lütfen geçerli bir paylaşım linki kullanın.');
    return;
  }

  // Load collection details and tools from API
  try {
    const res = await fetch(`/api/collections/${collectionId}`);
    if (!res.ok) {
      if (res.status === 404) {
        showEmptyState('Koleksiyon Bulunamadı', 'Aradığınız koleksiyon silinmiş veya hiç var olmamış olabilir.');
      } else {
        showEmptyState('Hata', 'Koleksiyon yüklenirken bir sunucu hatası oluştu.');
      }
      return;
    }

    const data = await res.json();
    renderCollection(data);
  } catch (err) {
    console.error('Koleksiyon çekme hatası:', err);
    showEmptyState('Bağlantı Hatası', 'Koleksiyon verileri alınamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.');
  }

  function showEmptyState(title, message) {
    collectionTitle.textContent = title;
    collectionDesc.textContent = '';
    collectionMeta.style.display = 'none';
    if (collectionGrid) {
      collectionGrid.innerHTML = `
        <div class="empty-collection-state" style="grid-column: 1/-1;">
          <div class="empty-icon" style="font-size: 3rem; margin-bottom: 20px;">🔍</div>
          <h3>${title}</h3>
          <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto;">${message}</p>
          <a href="/" class="btn-primary" style="display: inline-block; margin-top: 24px; padding: 10px 20px; text-decoration: none; border-radius: var(--radius-md); background: var(--gradient-primary); color: white; font-weight: 600;" data-i18n="collection_go_home">${(window.i18n && typeof window.i18n.t === 'function') ? window.i18n.t('collection_go_home') : 'Ana Sayfaya Git'}</a>
        </div>
      `;
    }
  }

  function getPricingLabel(pricing) {
    if (window.i18n && typeof window.i18n.t === 'function') {
      if (pricing === 'ucretsiz') return window.i18n.t('free');
      if (pricing === 'ucretli') return window.i18n.t('paid');
    }
    const labels = { ucretsiz: 'Ücretsiz', ucretli: 'Ücretli', freemium: 'Freemium' };
    return labels[pricing] || pricing;
  }

    const t = (key, fallback) => (window.i18n && typeof window.i18n.t === 'function') ? window.i18n.t(key) : fallback;
    collectionTitle.textContent = data.name;
    collectionDesc.textContent = data.description || t('collection_no_desc', 'Bu koleksiyon için bir açıklama girilmemiş.');
    collectionOwner.textContent = data.owner || 'Anonim';
    collectionMeta.style.display = 'inline-flex';

    const tools = data.tools || [];
    if (tools.length === 0) {
      collectionGrid.innerHTML = `
        <div class="empty-collection-state" style="grid-column: 1/-1;">
          <div class="empty-icon" style="font-size: 3rem; margin-bottom: 20px;">📂</div>
          <h3 data-i18n="collection_empty_title">${t('collection_empty_title', 'Bu Koleksiyon Boş')}</h3>
          <p style="color: var(--text-secondary);" data-i18n="collection_empty_desc">${t('collection_empty_desc', 'Bu koleksiyonda henüz hiçbir yapay zeka aracı listelenmemiş.')}</p>
        </div>
      `;
      return;
    }

    // Render tools
    const bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');

    collectionGrid.innerHTML = tools.map(tool => {
      const catLabel = tool.category_name ? `${tool.category_icon} ${tool.category_name}` : '';
      const stars = '★'.repeat(Math.round(tool.rating || 4));
      const pricingLabel = getPricingLabel(tool.pricing);

      var badges = '';
      if (tool.featured) {
        badges += '<span class="badge badge-featured">' + t('badge_featured', '⭐ Öne Çıkan') + '</span>';
      }
      if (tool.is_new || tool.isNew) {
        badges += '<span class="badge badge-new">' + t('badge_new', '🆕 Yeni') + '</span>';
      }

      if (tool.turkish_supported === 'full') {
        badges += '<span class="badge badge-tr full">' + t('badge_tr_full', '🇹🇷 Türkçe') + '</span>';
      } else if (tool.turkish_supported === 'partial') {
        badges += '<span class="badge badge-tr partial">' + t('badge_tr_partial', '🇹🇷 Kısmi') + '</span>';
      } else if (tool.turkish_supported === 'none') {
        badges += '<span class="badge badge-tr none">' + t('badge_tr_none', '🇬🇧 İngilizce') + '</span>';
      }

      // Yerli Teknoloji Rozeti
      if (tool.made_in_turkey) {
        badges += '<span class="badge badge-yerli">' + t('badge_yerli', '🇹🇷 Yerli') + '</span>';
      }

      let tags = tool.tags || [];
      if (typeof tags === 'string') {
        try { tags = JSON.parse(tags); } catch (e) { tags = []; }
      }

      let tagsHtml = '';
      if (tags && tags.length > 0) {
        tagsHtml = '<div class="tool-tags">';
        tags.slice(0, 3).forEach(tag => {
          tagsHtml += `<span class="tool-tag">${tag}</span>`;
        });
        tagsHtml += '</div>';
      }

      const firstLetter = tool.name.charAt(0).toUpperCase();
      const pricingSub = tool.pricing_try ? `<span class="tool-pricing-sub">${tool.pricing_try}</span>` : '';
      const isBookmarked = bookmarks.indexOf(tool.id) !== -1;
      const bookmarkClass = isBookmarked ? ' active' : '';

      return `
        <div class="tool-card" data-url="${tool.url}" data-id="${tool.id}" style="cursor:pointer">
          <div class="tool-card-header">
            <div class="tool-icon">${firstLetter}</div>
            <div class="tool-info">
              <h3 class="tool-name">${tool.name}</h3>
              <span class="tool-category-badge">${catLabel}</span>
            </div>
            <div class="tool-header-badges">${badges}</div>
          </div>
          <p class="tool-description">${tool.description || ''}</p>
          <div class="tool-footer">
            <div class="tool-rating">${stars} <span>${tool.rating || 4.5}</span></div>
            <div class="tool-pricing-group">
              <span class="tool-pricing pricing-${tool.pricing}">${pricingLabel}</span>
              ${pricingSub}
            </div>
          </div>
          ${tagsHtml}
          <div class="tool-card-actions">
            <button class="btn-card-action btn-card-vote" data-id="${tool.id}" title="Beğen / Oy Ver">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
              <span class="vote-count">${tool.votes || 0}</span>
            </button>
            <button class="btn-card-action btn-card-bookmark${bookmarkClass}" data-id="${tool.id}" title="Çantama Ekle">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            </button>
            <button class="btn-card-action btn-card-compare" data-id="${tool.id}" title="Karşılaştır">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20L20.5 3.5M20 16v5h-5M4 4l16.5 16.5"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    bindCardEvents();
  }

  function bindCardEvents() {
    if (!collectionGrid) return;

    collectionGrid.querySelectorAll('.tool-card').forEach(card => {
      card.addEventListener('click', function (e) {
        if (e.target.closest('.tool-card-actions')) return;
        const url = this.getAttribute('data-url');
        if (url) window.open(url, '_blank', 'noopener');
      });
    });

    collectionGrid.querySelectorAll('.btn-card-vote').forEach(btn => {
      btn.addEventListener('click', async function (e) {
        e.preventDefault();
        e.stopPropagation();
        const id = this.getAttribute('data-id');
        
        const votedList = JSON.parse(localStorage.getItem('voted_tools') || '[]');
        if (votedList.indexOf(id) !== -1) {
          showToast('Bu araca zaten oy verdiniz!', 'error');
          return;
        }

        const voteCountEl = this.querySelector('.vote-count');
        const self = this;
        self.disabled = true;

        try {
          const res = await fetch(`/api/tools/${id}/vote`, { method: 'POST' });
          const data = await res.json();
          if (data.success) {
            voteCountEl.textContent = data.votes;
            votedList.push(id);
            localStorage.setItem('voted_tools', JSON.stringify(votedList));
            self.classList.add('voted');
            showToast('Oyunuz başarıyla kaydedildi!', 'success');
          } else {
            showToast(data.error || 'Oy verilemedi.', 'error');
          }
        } catch(err) {
          showToast('Bağlantı hatası.', 'error');
        } finally {
          self.disabled = false;
        }
      });
    });

    collectionGrid.querySelectorAll('.btn-card-bookmark').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        const id = this.getAttribute('data-id');
        const self = this;

        if (!window.isUserLoggedIn) {
          if (typeof window.showAuthModal === 'function') {
            window.showAuthModal(function() {
              self.click();
            });
          } else {
            showToast('Lütfen giriş yapın.', 'error');
          }
          return;
        }

        const bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
        const idx = bookmarks.indexOf(id);

        if (idx === -1) {
          bookmarks.push(id);
          this.classList.add('active');
          showToast('AI Çantama başarıyla eklendi!', 'success');
        } else {
          bookmarks.splice(idx, 1);
          this.classList.remove('active');
          showToast('AI Çantamdan çıkarıldı.', 'success');
        }
        localStorage.setItem('toolkit', JSON.stringify(bookmarks));
        window.dispatchEvent(new CustomEvent('toolkitUpdated'));
      });
    });

    collectionGrid.querySelectorAll('.btn-card-compare').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const id = this.getAttribute('data-id');
        const compareList = JSON.parse(localStorage.getItem('compare_tools') || '[]');
        
        if (compareList.indexOf(id) !== -1) {
          showToast('Bu araç zaten karşılaştırma listesinde.', 'error');
          return;
        }

        if (compareList.length >= 3) {
          showToast('En fazla 3 aracı karşılaştırabilirsiniz.', 'error');
          return;
        }

        compareList.push(id);
        localStorage.setItem('compare_tools', JSON.stringify(compareList));
        showToast('Araç karşılaştırma listesine eklendi.', 'success');
        
        window.showConfirm('added_to_compare_confirm', 'confirm_ok', 'confirm_cancel').then(function (confirmed) {
          if (confirmed) {
            window.location.href = '/compare';
          }
        });
      });
    });
  }

  // Listen for toolkit changes and update bookmark button states
  window.addEventListener('toolkitUpdated', function () {
    const bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
    document.querySelectorAll('.btn-card-bookmark').forEach(btn => {
      const id = btn.getAttribute('data-id');
      if (bookmarks.indexOf(id) !== -1) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  });
});
