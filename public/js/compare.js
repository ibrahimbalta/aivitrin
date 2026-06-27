// Yapay Zeka Vitrini — Karşılaştırma Matrisi Uygulaması
'use strict';

document.addEventListener('DOMContentLoaded', async function () {
  var showToast = window.showToast;
  let categories = [];
  let allTools = [];
  let compareList = [];

  // DOM Referansları
  const searchInput = document.getElementById('compare-search-input');
  const btnClear = document.getElementById('btn-compare-clear');
  const dropdown = document.getElementById('compare-autocomplete-dropdown');
  const selectedBar = document.getElementById('compare-selected-bar');
  const tableWrapper = document.getElementById('compare-table-wrapper');

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

  // Spot light
  document.addEventListener('mousemove', function (e) {
    document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
    document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
  });

  // Scroll animations
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

  function trLower(str) {
    return (str || '').toLocaleLowerCase('tr-TR');
  }

  // Karşılaştırma Listesini Yükle ve Render Et
  function loadAndRenderCompare() {
    compareList = JSON.parse(localStorage.getItem('compare_tools') || '[]');
    
    // Geçerli araç verilerini eşleştir
    const toolsToCompare = compareList.map(id => allTools.find(t => t.id === id)).filter(Boolean);
    
    renderSelectedBar(toolsToCompare);
    renderCompareTable(toolsToCompare);
  }

  function renderSelectedBar(tools) {
    if (tools.length === 0) {
      selectedBar.innerHTML = '<span style="color:var(--text-muted);font-size:0.9rem">Karşılaştırma için henüz araç seçilmedi.</span>';
      return;
    }

    selectedBar.innerHTML = tools.map(t => {
      return `
        <div class="selected-chip">
          <span>${t.name}</span>
          <button class="btn-chip-remove" data-id="${t.id}">&times;</button>
        </div>
      `;
    }).join('');

    // Remove handlers
    selectedBar.querySelectorAll('.btn-chip-remove').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        removeToolFromCompare(id);
      });
    });
  }

  function renderCompareTable(toolsToCompare) {
    if (toolsToCompare.length === 0) {
      tableWrapper.innerHTML = `
        <div class="compare-empty-state">
          <div class="empty-icon">📊</div>
          <h3 data-i18n="compare_empty_title">${(window.i18n && typeof window.i18n.t === 'function') ? window.i18n.t('compare_empty_title') : 'Karşılaştırma Listesi Boş'}</h3>
          <p data-i18n="compare_empty_desc">${(window.i18n && typeof window.i18n.t === 'function') ? window.i18n.t('compare_empty_desc') : 'Yukarıdaki arama kutusunu kullanarak veya anasayfadaki araç kartlarının altındaki karşılaştırma butonuna basarak araç ekleyin.'}</p>
        </div>
      `;
      return;
    }

    const t = (key, fallback) => (window.i18n && typeof window.i18n.t === 'function') ? window.i18n.t(key) : fallback;

    let html = '<table class="compare-table">';
    html += '<thead><tr><th data-i18n="compare_features_col">' + t('compare_features_col', 'Özellik / Karşılaştırma') + '</th>';
    
    toolsToCompare.forEach(toolItem => {
      const firstLetter = toolItem.name.charAt(0).toUpperCase();
      html += `
        <th>
          <div class="compare-th-header">
            <div class="tool-icon">${firstLetter}</div>
            <div class="compare-th-title">
              <h4>${toolItem.name}</h4>
              <button class="btn-remove-compare" data-id="${toolItem.id}" title="Listeden Çıkar">&times;</button>
            </div>
          </div>
        </th>
      `;
    });
    html += '</tr></thead><tbody>';

    const getTrBadge = val => {
      if (val === 'full') return '<span class="badge badge-tr full">' + t('tr_support_full', '🇹🇷 Tam Destek') + '</span>';
      if (val === 'partial') return '<span class="badge badge-tr partial">' + t('tr_support_partial', '🇹🇷 Kısmi') + '</span>';
      return '<span class="badge badge-tr none">' + t('badge_tr_none', '🇬🇧 İngilizce') + '</span>';
    };

    const getPricingBadge = val => {
      let pricingLabel = val;
      if (val === 'ucretsiz') pricingLabel = t('free', 'Ücretsiz');
      if (val === 'ucretli') pricingLabel = t('paid', 'Ücretli');
      if (val === 'freemium') pricingLabel = 'Freemium';
      return `<span class="tool-pricing pricing-${val}">${pricingLabel}</span>`;
    };

    const rows = [
      { label: t('compare_category', 'Kategori'), key: 'category_id', format: val => {
          const cat = categories.find(c => c.id === val);
          return cat ? `${cat.icon} ${cat.name}` : '';
        }
      },
      { label: t('compare_rating', 'Puan'), key: 'rating', format: val => '★'.repeat(Math.round(val)) + ` <span>(${val} / 5)</span>` },
      { label: t('compare_pricing_model', 'Fiyatlandırma Modeli'), key: 'pricing', format: getPricingBadge },
      { label: t('compare_turkey_price', 'Türkiye Fiyatı / Notu'), key: 'pricing_try', format: val => val || t('compare_unspecified', 'Belirtilmemiş') },
      { label: t('compare_turkish_support', 'Türkçe Desteği'), key: 'turkish_supported', format: getTrBadge },
      { label: t('compare_popularity', 'Popülerlik (Oy)'), key: 'votes', format: val => `👍 ${val || 0} ${t('votes_suffix', 'Oy')}` },
      { label: t('tags_label', 'Etiketler'), key: 'tags', format: val => {
          let tags = val;
          if (typeof tags === 'string') {
            try { tags = JSON.parse(tags); } catch(e) { tags = []; }
          }
          return (tags || []).map(tagText => `<span class="tool-tag">${tagText}</span>`).join(' ');
        }
      },
      { label: t('compare_description', 'Kısa Açıklama'), key: 'description', format: val => val },
      { label: t('compare_link', 'Bağlantı'), key: 'url', format: val => `<a href="${val}" target="_blank" rel="noopener" class="btn-visit-table">${t('compare_visit_site', 'Sitede Gör')} &rarr;</a>` }
    ];

    rows.forEach(row => {
      html += `<tr><td class="compare-row-label">${row.label}</td>`;
      toolsToCompare.forEach(toolObj => {
        const value = toolObj[row.key];
        const formatted = row.format ? row.format(value) : value;
        html += `<td>${formatted || '-'}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    tableWrapper.innerHTML = html;

    // Remove handlers in table header
    tableWrapper.querySelectorAll('.btn-remove-compare').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        removeToolFromCompare(id);
      });
    });
  }

  function removeToolFromCompare(id) {
    compareList = compareList.filter(item => item !== id);
    localStorage.setItem('compare_tools', JSON.stringify(compareList));
    loadAndRenderCompare();
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
      return trLower(t.name).includes(query);
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
        searchInput.value = '';
        dropdown.style.display = 'none';
        btnClear.style.display = 'none';
        addToolToCompare(id);
      });
    });
  }

  function addToolToCompare(id) {
    compareList = JSON.parse(localStorage.getItem('compare_tools') || '[]');
    if (compareList.indexOf(id) !== -1) {
      showToast('Bu araç zaten karşılaştırma listesinde.', 'error');
      return;
    }

    if (compareList.length >= 3) {
      showToast('En fazla 3 aracı yan yana karşılaştırabilirsiniz.', 'error');
      return;
    }

    compareList.push(id);
    localStorage.setItem('compare_tools', JSON.stringify(compareList));
    loadAndRenderCompare();
    showToast('Araç başarıyla karşılaştırmaya eklendi.', 'success');
  }

  // Input events
  searchInput.addEventListener('input', handleSearchInput);
  searchInput.addEventListener('focus', handleSearchInput);

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.alt-search-container')) {
      dropdown.style.display = 'none';
    }
  });

  btnClear.addEventListener('click', function () {
    searchInput.value = '';
    dropdown.style.display = 'none';
    btnClear.style.display = 'none';
    searchInput.focus();
  });

  loadAndRenderCompare();
  parseUrlQueryParams();

  function parseUrlQueryParams() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const t1 = urlParams.get('t1');
      const t2 = urlParams.get('t2');
      const t3 = urlParams.get('t3');
      
      let list = [];
      if (t1) list.push(t1.trim().toLowerCase());
      if (t2) list.push(t2.trim().toLowerCase());
      if (t3) list.push(t3.trim().toLowerCase());
      
      if (list.length > 0) {
        // Filter valid tool ids
        const validList = list.filter(id => allTools.some(t => t.id === id)).slice(0, 3);
        if (validList.length > 0) {
          localStorage.setItem('compare_tools', JSON.stringify(validList));
          loadAndRenderCompare();
        }
      }
    } catch (e) {
      console.error('URL karşılaştırma parametreleri yüklenemedi:', e);
    }
  }

  // ═══════════════════════════════════════════
  // TEMA DEĞİŞTİRİCİ
  // ═══════════════════════════════════════════
  var savedTheme = localStorage.getItem('theme') || 'light';
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

  // Gönder Butonu
  if(btnSubmitSave) {
    btnSubmitSave.addEventListener('click', async function() {
      var name = document.getElementById('sub-name').value.trim();
      var url = document.getElementById('sub-url').value.trim();
      var desc = document.getElementById('sub-description').value.trim();
      var category = document.getElementById('sub-category').value;
      var pricing = document.getElementById('sub-pricing').value;

      if(!name || !url || !desc || !category) {
        showToast('Lütfen tüm zorunlu (*) alanları doldurun.', 'error');
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
        made_in_turkey: madeInTurkey
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
          showToast('Harika! Aracınız başarıyla gönderildi.', 'success');
          closeSubmitModal();
        } else {
          showToast(data.error || 'Gönderim sırasında bir hata oluştu.', 'error');
        }
      } catch(e) {
        showToast('Sunucu bağlantı hatası.', 'error');
      } finally {
        btnSubmitSave.disabled = false;
        btnSubmitSave.textContent = 'Gönder';
      }
    });
  }
});
