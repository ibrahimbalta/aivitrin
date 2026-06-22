// Yapay Zeka Vitrini — Alternatifler Uygulaması
'use strict';

document.addEventListener('DOMContentLoaded', async function () {
  var showToast = window.showToast;
  // Global veri depoları
  let categories = [];
  let allTools = [];

  // DOM Referansları
  const searchInput = document.getElementById('alt-search-input');
  const btnClear = document.getElementById('btn-alt-clear');
  const dropdown = document.getElementById('alt-autocomplete-dropdown');
  const suggestionsChips = document.querySelectorAll('.suggestion-chip');
  const resultsSection = document.getElementById('alt-results-section');
  const selectedToolContainer = document.getElementById('selected-tool-card-container');
  const alternativesGrid = document.getElementById('alternatives-grid');

  const themeToggle = document.getElementById('theme-toggle');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');

  // API'den kategorileri ve tüm araçları çek
  async function loadInitialData() {
    try {
      const [catsRes, toolsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/tools')
      ]);
      categories = await catsRes.json();
      const toolsData = await toolsRes.json();
      allTools = toolsData.tools || toolsData;

      // Kategori seçim dropdown'ını doldur (Submit Modal için)
      const subCategorySelect = document.getElementById('sub-category');
      if (subCategorySelect && categories) {
        subCategorySelect.innerHTML = '<option value="">Kategori Seçin</option>' + categories.map(c => {
          return `<option value="${c.id}">${c.icon} ${c.name}</option>`;
        }).join('');
      }
    } catch (err) {
      console.error('Veri yüklenemedi:', err);
    }
  }

  await loadInitialData();

  // Interactive Cursor Spotlight tracking
  document.addEventListener('mousemove', function (e) {
    document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
    document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
  });

  function trLower(str) {
    return (str || '').toLocaleLowerCase('tr-TR');
  }

  // Arama girdisine göre süzme ve autocomplete listesini doldurma
  function handleSearchInput() {
    const query = trLower(searchInput.value.trim());
    if (!query) {
      dropdown.style.display = 'none';
      btnClear.style.display = 'none';
      return;
    }

    btnClear.style.display = 'block';

    const matches = allTools.filter(t => {
      return trLower(t.name).includes(query) || (t.tags && t.tags.some(tag => trLower(tag).includes(query)));
    }).slice(0, 8);

    if (matches.length === 0) {
      dropdown.innerHTML = '<div class="autocomplete-no-match">Eşleşen araç bulunamadı.</div>';
    } else {
      dropdown.innerHTML = matches.map(t => {
        const cat = categories.find(c => c.id === t.category_id);
        const catLabel = cat ? `${cat.icon} ${cat.name}` : '';
        return `
          <div class="autocomplete-item" data-id="${t.id}" data-name="${t.name}">
            <div class="item-name">${t.name}</div>
            <div class="item-category">${catLabel}</div>
          </div>
        `;
      }).join('');
    }

    dropdown.style.display = 'block';

    // Autocomplete öğelerine tıklama dinleyicisi ekle
    dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const name = this.getAttribute('data-name');
        searchInput.value = name;
        dropdown.style.display = 'none';
        loadAlternatives(id);
      });
    });
  }

  // input dinleyicileri
  searchInput.addEventListener('input', handleSearchInput);
  searchInput.addEventListener('focus', handleSearchInput);

  // Belge geneline tıklandığında dropdown'ı kapat
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.alt-search-container')) {
      dropdown.style.display = 'none';
    }
  });

  // Arama temizleme butonu
  btnClear.addEventListener('click', function () {
    searchInput.value = '';
    dropdown.style.display = 'none';
    btnClear.style.display = 'none';
    searchInput.focus();
  });

  // Hızlı öneri chip'leri
  suggestionsChips.forEach(chip => {
    chip.addEventListener('click', function () {
      const toolId = this.getAttribute('data-tool-id');
      
      // Veritabanında eşleşen id var mı bak, yoksa isme göre ara
      let match = allTools.find(t => t.id === toolId);
      if (!match) {
        const chipText = this.textContent.trim();
        match = allTools.find(t => trLower(t.name) === trLower(chipText));
      }

      if (match) {
        searchInput.value = match.name;
        btnClear.style.display = 'block';
        loadAlternatives(match.id);
      }
    });
  });

  function getPricingLabel(pricing) {
    if (window.i18n && typeof window.i18n.t === 'function') {
      if (pricing === 'ucretsiz') return window.i18n.t('free');
      if (pricing === 'ucretli') return window.i18n.t('paid');
    }
    const labels = { ucretsiz: 'Ücretsiz', ucretli: 'Ücretli', freemium: 'Freemium' };
    return labels[pricing] || pricing;
  }

  // Alternatifleri API'den yükleme ve render etme
  async function loadAlternatives(toolId) {
    try {
      const t = (key, fallback) => (window.i18n && typeof window.i18n.t === 'function') ? window.i18n.t(key) : fallback;
      resultsSection.style.display = 'block';
      selectedToolContainer.innerHTML = '<div class="loader">' + t('loading', 'Yükleniyor...') + '</div>';
      alternativesGrid.innerHTML = '<div class="loader">' + t('loading_alternatives', 'Alternatifler aranıyor...') + '</div>';

      // Sayfayı sonuç alanına kaydır
      resultsSection.scrollIntoView({ behavior: 'smooth' });

      const [toolRes, altRes] = await Promise.all([
        fetch(`/api/tools/${toolId}`),
        fetch(`/api/tools/${toolId}/alternatives`)
      ]);

      if (!toolRes.ok) throw new Error('Araç bulunamadı.');

      const tool = await toolRes.json();
      const alternatives = await altRes.json();

      renderSelectedTool(tool);
      renderAlternatives(alternatives, tool);
    } catch (err) {
      console.error(err);
      selectedToolContainer.innerHTML = '<div class="error-msg">Araç bilgileri yüklenemedi.</div>';
      alternativesGrid.innerHTML = '';
    }
  }

  function renderSelectedTool(tool) {
    const pricingLabel = getPricingLabel(tool.pricing);
    const cat = categories.find(c => c.id === tool.category_id);
    const catLabel = cat ? `${cat.icon} ${cat.name}` : '';
    const stars = '★'.repeat(Math.round(tool.rating));
    const firstLetter = tool.name.charAt(0).toUpperCase();

    selectedToolContainer.innerHTML = `
      <div class="selected-tool-card">
        <div class="selected-tool-header">
          <div class="tool-icon big">${firstLetter}</div>
          <div class="tool-info">
            <h3>${tool.name}</h3>
            <span class="tool-category-badge">${catLabel}</span>
          </div>
        </div>
        <p class="tool-description">${tool.description}</p>
        
        <div class="selected-tool-details">
          <div class="detail-row">
            <span class="detail-label">Fiyatlandırma:</span>
            <span class="tool-pricing pricing-${tool.pricing}">${pricingLabel}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Puan:</span>
            <div class="tool-rating">${stars} <span>${tool.rating} / 5</span></div>
          </div>
          ${tool.tags && tool.tags.length > 0 ? `
            <div class="detail-row tags-row">
              <span class="detail-label">Etiketler:</span>
              <div class="tool-tags">
                ${tool.tags.map(t => `<span class="tool-tag">${t}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
        
        <a href="${tool.url}" target="_blank" rel="noopener" class="btn-visit-tool">
          Web Sitesine Git
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>
    `;
  }

  function getCategoryById(categoryId) {
    return categories.find(function (c) { return c.id === categoryId; });
  }

  function renderToolCard(tool) {
    var cat = getCategoryById(tool.category_id || tool.category);
    var catLabel = cat ? (cat.icon + ' ' + cat.name) : (tool.category_name ? (tool.category_icon + ' ' + tool.category_name) : '');
    var stars = '★'.repeat(Math.round(tool.rating));
    var pricingLabel = getPricingLabel(tool.pricing);

    const t = (key, fallback) => (window.i18n && typeof window.i18n.t === 'function') ? window.i18n.t(key) : fallback;

    var badges = '';
    if (tool.featured) {
      badges += '<span class="badge badge-featured">' + t('badge_featured', '⭐ Öne Çıkan') + '</span>';
    }
    if (tool.is_new || tool.isNew) {
      badges += '<span class="badge badge-new">' + t('badge_new', '🆕 Yeni') + '</span>';
    }

    // Türkçe Desteği Rozeti
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

    var tags = tool.tags;
    if (typeof tags === 'string') {
      try { tags = JSON.parse(tags); } catch(e) { tags = []; }
    }

    var tagsHtml = '';
    if (tags && tags.length > 0) {
      tagsHtml = '<div class="tool-tags">';
      tags.slice(0, 3).forEach(function (tag) {
        tagsHtml += '<span class="tool-tag">' + tag + '</span>';
      });
      tagsHtml += '</div>';
    }

    var firstLetter = tool.name.charAt(0).toUpperCase();
    var pricingSub = tool.pricing_try ? '<span class="tool-pricing-sub">' + tool.pricing_try + '</span>' : '';
    
    // Bookmark durumu
    var bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
    var isBookmarked = bookmarks.indexOf(tool.id) !== -1;
    var bookmarkClass = isBookmarked ? ' active' : '';

    return '<div class="tool-card" data-url="' + tool.url + '" data-id="' + tool.id + '" style="cursor:pointer">' +
      '<div class="tool-card-header">' +
        '<div class="tool-icon">' + firstLetter + '</div>' +
        '<div class="tool-info">' +
          '<h3 class="tool-name">' + tool.name + '</h3>' +
          '<span class="tool-category-badge">' + catLabel + '</span>' +
        '</div>' +
        '<div class="tool-header-badges">' + badges + '</div>' +
      '</div>' +
      '<p class="tool-description">' + tool.description + '</p>' +
      '<div class="tool-footer">' +
        '<div class="tool-rating">' + stars + ' <span>' + tool.rating + '</span></div>' +
        '<div class="tool-pricing-group">' +
          '<span class="tool-pricing pricing-' + tool.pricing + '">' + pricingLabel + '</span>' +
          pricingSub +
        '</div>' +
      '</div>' +
      tagsHtml +
      '<div class="tool-card-actions">' +
        '<button class="btn-card-action btn-card-vote" data-id="' + tool.id + '" title="Beğen / Oy Ver">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>' +
          '<span class="vote-count">' + (tool.votes || 0) + '</span>' +
        '</button>' +
        '<button class="btn-card-action btn-card-bookmark' + bookmarkClass + '" data-id="' + tool.id + '" title="Çantama Ekle">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>' +
        '</button>' +
        '<button class="btn-card-action btn-card-compare" data-id="' + tool.id + '" title="Karşılaştır">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20L20.5 3.5M20 16v5h-5M4 4l16.5 16.5"></path></svg>' +
        '</button>' +
        '<button class="btn-card-action btn-card-explore-alt" data-id="' + tool.id + '" title="Bunun Alternatiflerini Bul" style="background:hsla(15, 100%, 58%, 0.1);color:var(--accent-cyan)">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.34-4.34"></path></svg>' +
        '</button>' +
      '</div>' +
    '</div>';
  }

  function bindCardEvents(container) {
    if (!container) return;

    // Kartların yer imi durumlarını yerel depolamaya göre eşitle
    var bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
    container.querySelectorAll('.btn-card-bookmark').forEach(function (btn) {
      var id = btn.getAttribute('data-id');
      if (bookmarks.indexOf(id) !== -1) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    container.querySelectorAll('.tool-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('.tool-card-actions')) return;
        var id = this.getAttribute('data-id');
        if (id) window.location.href = '/tool/' + id;
      });
    });

    container.querySelectorAll('.btn-card-vote').forEach(function (btn) {
      btn.addEventListener('click', async function (e) {
        e.preventDefault();
        e.stopPropagation();
        var id = this.getAttribute('data-id');
        
        var votedList = JSON.parse(localStorage.getItem('voted_tools') || '[]');
        if (votedList.indexOf(id) !== -1) {
          showToast('Bu araca zaten oy verdiniz!', 'error');
          return;
        }

        var voteCountEl = this.querySelector('.vote-count');
        var self = this;
        self.disabled = true;

        try {
          var res = await fetch('/api/tools/' + id + '/vote', { method: 'POST' });
          var data = await res.json();
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

    container.querySelectorAll('.btn-card-bookmark').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        var id = this.getAttribute('data-id');
        var self = this;

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

        var bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
        var idx = bookmarks.indexOf(id);

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

    container.querySelectorAll('.btn-card-compare').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var id = this.getAttribute('data-id');
        var compareList = JSON.parse(localStorage.getItem('compare_tools') || '[]');
        
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
        
        if (confirm('Karşılaştırma listesine eklendi. Şimdi karşılaştırma sayfasına gitmek ister misiniz?')) {
          window.location.href = '/compare';
        }
      });
    });

    container.querySelectorAll('.btn-card-explore-alt').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var id = this.getAttribute('data-id');
        var tool = allTools.find(function(t) { return t.id === id; });
        if (tool) {
          searchInput.value = tool.name;
          loadAlternatives(id);
        }
      });
    });
  }

  // Çanta değişimlerini dinle ve tüm kartların durumunu güncelle
  window.addEventListener('toolkitUpdated', function () {
    var bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
    document.querySelectorAll('.btn-card-bookmark').forEach(function (btn) {
      var id = btn.getAttribute('data-id');
      if (bookmarks.indexOf(id) !== -1) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  });

  function renderAlternatives(alternatives, originalTool) {
    if (alternatives.length === 0) {
      alternativesGrid.innerHTML =
        '<div class="no-results" style="grid-column: span 3;">' +
          '<div class="no-results-icon">🔍</div>' +
          '<h3>Alternatif bulunamadı</h3>' +
          '<p>' + originalTool.name + ' aracı için henüz başka bir alternatif eklenmemiş.</p>' +
        '</div>';
      return;
    }

    alternativesGrid.innerHTML = alternatives.map(renderToolCard).join('');
    bindCardEvents(alternativesGrid);
  }

  // ═══════════════════════════════════════════
  // TEMA DEĞİŞTİRİCİ
  // ═══════════════════════════════════════════
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

  // ═══════════════════════════════════════════
  // MOBİL MENÜ
  // ═══════════════════════════════════════════
  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', function () {
      mobileNav.classList.toggle('active');
    });
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('active');
      });
    });
  }

  // ═══════════════════════════════════════════
  // SCROLL ANİMASYONLARI
  // ═══════════════════════════════════════════
  var animatedElements = document.querySelectorAll('.animate-on-scroll');
  if (animatedElements.length > 0 && 'IntersectionObserver' in window) {
    var scrollObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          scrollObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    animatedElements.forEach(function (el) { scrollObserver.observe(el); });
  } else {
    animatedElements.forEach(function (el) { el.classList.add('visible'); });
  }

  // ─── ARAÇ GÖNDERME MODALI MANTIĞI ───
  const submitModal = document.getElementById('submit-tool-modal');
  const btnSubmitTool = document.getElementById('btn-submit-tool');
  const mobileBtnSubmitTool = document.getElementById('mobile-btn-submit-tool');
  const submitModalClose = document.getElementById('submit-modal-close');
  const submitModalCancel = document.getElementById('submit-modal-cancel');
  const submitToolForm = document.getElementById('submit-tool-form');
  const btnSubmitSave = document.getElementById('btn-submit-save');

  function openSubmitModal(e) {
    if(e) e.preventDefault();
    if(submitModal) submitModal.classList.add('active');
  }
  function closeSubmitModal() {
    if(submitModal) {
      submitModal.classList.remove('active');
      if(submitToolForm) submitToolForm.reset();
    }
  }

  if(btnSubmitTool) btnSubmitTool.addEventListener('click', openSubmitModal);
  if(mobileBtnSubmitTool) mobileBtnSubmitTool.addEventListener('click', openSubmitModal);
  if(submitModalClose) submitModalClose.addEventListener('click', closeSubmitModal);
  if(submitModalCancel) submitModalCancel.addEventListener('click', closeSubmitModal);



  // Gönder Butonu Tıklama
  if(btnSubmitSave) {
    btnSubmitSave.addEventListener('click', async function() {
      var name = document.getElementById('sub-name').value.trim();
      var url = document.getElementById('sub-url').value.trim();
      var desc = document.getElementById('sub-description').value.trim();
      var category = document.getElementById('sub-category').value;
      var pricing = document.getElementById('sub-pricing').value;
      var tagsStr = document.getElementById('sub-tags').value;

      if(!name || !url || !desc || !category) {
        showToast('Lütfen tüm zorunlu (*) alanları doldurun.', 'error');
        return;
      }

      if(desc.length < 10) {
        showToast('Açıklama en az 10 karakter olmalıdır.', 'error');
        return;
      }

      var featured = document.getElementById('sub-featured') ? document.getElementById('sub-featured').checked : false;
      var madeInTurkey = document.getElementById('sub-made-in-turkey') ? document.getElementById('sub-made-in-turkey').checked : false;

      var body = {
        name: name,
        url: url,
        description: desc,
        category_id: category,
        pricing: pricing,
        featured: featured,
        made_in_turkey: madeInTurkey,
        tags: tagsStr ? tagsStr.split(',').map(function(s){ return s.trim() }).filter(Boolean) : []
      };

      btnSubmitSave.disabled = true;
      btnSubmitSave.textContent = 'Gönderiliyor...';

      try {
        var res = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        var data = await res.json();
        if(data.success) {
          showToast('Harika! Aracınız başarıyla gönderildi, editör onayından sonra yayınlanacaktır.', 'success');
          closeSubmitModal();
        } else {
          showToast(data.error || 'Gönderim sırasında bir hata oluştu.', 'error');
        }
      } catch(e) {
        showToast('Sunucu bağlantı hatası oluştu.', 'error');
      } finally {
        btnSubmitSave.disabled = false;
        btnSubmitSave.textContent = 'Gönder';
      }
    });
  }
});
