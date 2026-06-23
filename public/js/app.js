// Yapay Zeka Vitrini — Ana Uygulama (API Entegrasyonlu)
'use strict';

/**
 * Yapay Zeka Vitrini — Ana Uygulama Modülü
 * API'den veri çeker, arama, filtreleme, tema, animasyon ve render işlemlerini yönetir.
 */

// ─────────────────────────────────────────────
// YARDIMCI FONKSİYONLAR
// ─────────────────────────────────────────────

function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

function getPricingLabel(pricing) {
  if (window.i18n && typeof window.i18n.t === 'function') {
    if (pricing === 'ucretsiz') return window.i18n.t('free');
    if (pricing === 'ucretli') return window.i18n.t('paid');
  }
  const labels = { ucretsiz: 'Ücretsiz', ucretli: 'Ücretli', freemium: 'Freemium' };
  return labels[pricing] || pricing;
}

function getCategoryById(categoryId) {
  return window._categories.find(function (c) { return c.id === categoryId; });
}

function trLower(str) {
  return (str || '').toLocaleLowerCase('tr-TR');
}

// ─────────────────────────────────────────────
// UYGULAMA BAŞLATMA
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {

  // Global Toast Notification System
  window.showToast = function (message, type) {
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
  var showToast = window.showToast;

  // Global veri depoları
  window._categories = [];
  window._tools = [];

  // ═══════════════════════════════════════════
  // API'DEN VERİ ÇEKME
  // ═══════════════════════════════════════════
  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      window._categories = data;
      return data;
    } catch (err) {
      console.error('Kategoriler yüklenemedi:', err);
      return [];
    }
  }

  async function fetchTools() {
    try {
      const res = await fetch('/api/tools');
      const data = await res.json();
      window._tools = data.tools || data;
      return window._tools;
    } catch (err) {
      console.error('Araçlar yüklenemedi:', err);
      return [];
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch('/api/stats');
      return await res.json();
    } catch (err) {
      console.error('İstatistikler yüklenemedi:', err);
      return { totalTools: 0, totalCategories: 0, freeTools: 0, pageViews: 45280, totalUsers: 20 };
    }
  }

  // ═══════════════════════════════════════════
  // DOM Referansları
  // ═══════════════════════════════════════════
  var toolsGrid        = document.querySelector('#tools-grid');
  var categoriesGrid   = document.querySelector('#categories-grid');
  var featuredGrid     = document.querySelector('#featured-grid');
  var searchInput      = document.querySelector('#search-input');
  var heroSearchInput  = document.querySelector('#hero-search-input');
  var filterPricing    = document.querySelector('#filter-pricing');
  var filterLanguage   = document.querySelector('#filter-language');
  var filterSort       = document.querySelector('#filter-sort');
  var btnClearFilters  = document.querySelector('#btn-clear-filters');
  var themeToggle      = document.querySelector('#theme-toggle');
  var mobileMenuBtn    = document.querySelector('#mobile-menu-btn');
  var mobileNav        = document.querySelector('#mobile-nav');
  var newsletterForm   = document.querySelector('#newsletter-form');
  var toolCountEl      = document.querySelector('#tools-count');
  var suggestionChips  = document.querySelectorAll('.suggestion-chip');
  var statTools        = document.querySelector('#stat-tools');
  var statCategories   = document.querySelector('#stat-categories');
  var statFree         = document.querySelector('#stat-free');
  var statViews        = document.querySelector('#stat-views');
  var statMembers      = document.querySelector('#stat-members');
  var backToTop        = document.querySelector('#back-to-top');
  var smartSearchCheckbox = document.querySelector('#smart-search-checkbox');
  var heroSmartSearchCheckbox = document.querySelector('#hero-smart-search-checkbox');
  var yerliSearchCheckbox = document.querySelector('#yerli-search-checkbox');

  var activeCategory = null;
  var currentPage = 1;
  var itemsPerPage = 12;

  // Interactive Cursor Spotlight tracking
  document.addEventListener('mousemove', function (e) {
    document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
    document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
  });

  // ═══════════════════════════════════════════
  // RENDER FONKSİYONLARI
  // ═══════════════════════════════════════════

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
            
            var localTool = window._tools.find(function(t) { return t.id === id; });
            if (localTool) localTool.votes = data.votes;
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
        
        window.showConfirm('added_to_compare_confirm', 'confirm_ok', 'confirm_cancel').then(function (confirmed) {
          if (confirmed) {
            window.location.href = '/compare';
          }
        });
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

  function renderTools(tools, totalFilteredCount) {
    if (!toolsGrid) return;

    if (toolCountEl) {
      toolCountEl.textContent = (totalFilteredCount !== undefined ? totalFilteredCount : tools.length) + ' araç bulundu';
    }

    if (tools.length === 0) {
      toolsGrid.innerHTML =
        '<div class="no-results">' +
          '<div class="no-results-icon">🔍</div>' +
          '<h3>Araç bulunamadı</h3>' +
          '<p>Farklı anahtar kelimeler veya filtreler deneyiniz.</p>' +
        '</div>';
      return;
    }

    toolsGrid.innerHTML = tools.map(renderToolCard).join('');
    bindCardEvents(toolsGrid);
  }

  function renderPagination(totalItems) {
    var paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;

    var totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    var html = '<span style="font-size:0.875rem;color:var(--text-muted);margin-right:8px">Sayfa:</span>';
    
    var range = [];
    var delta = 2; // number of pages to show around current page

    for (var i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    var last = null;
    range.forEach(function(p) {
      if (last !== null) {
        if (p - last === 2) {
          var midPage = last + 1;
          html += '<button class="page-btn" data-page="' + midPage + '">' + midPage + '</button>';
        } else if (p - last > 2) {
          html += '<span style="color:var(--text-muted);padding:0 6px">...</span>';
        }
      }
      var activeClass = (p === currentPage) ? ' active' : '';
      html += '<button class="page-btn' + activeClass + '" data-page="' + p + '">' + p + '</button>';
      last = p;
    });

    paginationContainer.innerHTML = html;

    paginationContainer.querySelectorAll('.page-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var page = parseInt(this.getAttribute('data-page'));
        currentPage = page;
        applyFilters();
        
        var toolsSection = document.querySelector('#tools-section');
        if (toolsSection) {
          toolsSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  function renderCategories(categories) {
    if (!categoriesGrid) return;

    var html = '';
    categories.forEach(function (cat) {
      var activeClass = (activeCategory === cat.id) ? ' active' : '';
      html +=
        '<button class="category-card' + activeClass + '" data-category="' + cat.id + '">' +
          '<span class="category-icon">' + cat.icon + '</span>' +
          '<span class="category-name">' + cat.name + '</span>' +
          '<span class="category-count">' + cat.count + ' araç</span>' +
        '</button>';
    });

    categoriesGrid.innerHTML = html;

    // Sync search category dropdown label
    var selectedTextEl = document.querySelector('#hero-category-select-btn .selected-category-text');
    if (selectedTextEl) {
      if (activeCategory) {
        var selectedCat = categories.find(function(c) { return c.id === activeCategory; });
        selectedTextEl.textContent = selectedCat ? (selectedCat.icon + ' ' + selectedCat.name) : 'Tüm Kategoriler';
      } else {
        selectedTextEl.textContent = 'Tüm Kategoriler';
      }
    }

    categoriesGrid.querySelectorAll('.category-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var selectedCategory = this.getAttribute('data-category');
        activeCategory = (activeCategory === selectedCategory) ? null : selectedCategory;
        currentPage = 1;
        renderCategories(window._categories);
        applyFilters();
        if (activeCategory) {
          var toolsSection = document.querySelector('#tools-section');
          if (toolsSection) toolsSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  function renderFeatured() {
    if (!featuredGrid) return;
    var featured = window._tools.filter(function (t) { return t.featured; }).slice(0, 6);
    featuredGrid.innerHTML = featured.map(renderToolCard).join('');
    bindCardEvents(featuredGrid);
  }

  // ═══════════════════════════════════════════
  // FİLTRELEME & ARAMA
  // ═══════════════════════════════════════════

  async function applyFilters() {
    var searchTerm = searchInput ? trLower(searchInput.value.trim()) : '';
    var pricing = filterPricing ? filterPricing.value : 'all';
    var language = filterLanguage ? filterLanguage.value : 'all';
    var sortBy = filterSort ? filterSort.value : 'rating-desc';

    var filtered = [];
    var matchScores = {};

    var isSmart = (smartSearchCheckbox && smartSearchCheckbox.checked) || 
                  (heroSmartSearchCheckbox && heroSmartSearchCheckbox.checked);

    if (isSmart && searchTerm) {
      if (toolsGrid) {
        toolsGrid.innerHTML = '<div class="loader" style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-secondary)">🧠 Yapay Zeka ile Akıllı Arama yapılıyor...</div>';
      }
      try {
        var catParam = activeCategory ? activeCategory : '';
        var res = await fetch('/api/semantic-search?q=' + encodeURIComponent(searchTerm) + '&pricing=' + pricing + '&category=' + catParam + '&sort=' + sortBy);
        var data = await res.json();
        filtered = data.tools || [];
        if (language && language !== 'all') {
          filtered = filtered.filter(function (tool) { return tool.turkish_supported === language; });
        }
        if (yerliSearchCheckbox && yerliSearchCheckbox.checked) {
          filtered = filtered.filter(function (tool) { return tool.made_in_turkey; });
        }
      } catch (err) {
        console.error('Akıllı arama başarısız:', err);
        showToast('Akıllı arama sırasında hata oluştu, yerel arama kullanılıyor.', 'error');
        isSmart = false;
      }
    }

    if (!isSmart || !searchTerm) {
      window._tools.forEach(function (tool) {
        if (activeCategory && (tool.category_id || tool.category) !== activeCategory) return;
        if (pricing && pricing !== 'all' && tool.pricing !== pricing) return;
        if (language && language !== 'all' && tool.turkish_supported !== language) return;
        if (yerliSearchCheckbox && yerliSearchCheckbox.checked && !tool.made_in_turkey) return;

        var score = 0;

        if (searchTerm) {
          var tags = tool.tags;
          if (typeof tags === 'string') { try { tags = JSON.parse(tags); } catch(e) { tags = []; } }

          var searchWords = searchTerm.split(/\s+/).filter(function(w) { return w.length > 0; });
          var stopWords = ['yapan', 'aracı', 'arac', 'olan', 'bir', 've', 'en', 'ai', 'yapay', 'zeka', 'çevir', 'cevir', 'siteleri', 'sistemi', 'programi', 'programı'];
          
          if (searchWords.length > 1) {
            searchWords = searchWords.filter(function(w) {
              return stopWords.indexOf(w) === -1;
            });
          }
          
          if (searchWords.length === 0) {
            searchWords = [searchTerm];
          }

          var nameText = trLower(tool.name);
          var descText = trLower(tool.description);
          var tagsText = (tags || []).map(function(t) { return trLower(t); }).join(' ');

          var isMatch = false;
          searchWords.forEach(function(sw) {
            var wordMatched = false;
            if (nameText.indexOf(sw) !== -1) {
              score += 15;
              wordMatched = true;
            }
            (tags || []).forEach(function(tag) {
              if (trLower(tag).indexOf(sw) !== -1) {
                score += 8;
                wordMatched = true;
              }
            });
            if (descText.indexOf(sw) !== -1) {
              score += 4;
              wordMatched = true;
            }

            if (wordMatched) isMatch = true;
          });

          if (!isMatch) return;
        }

        filtered.push(tool);
        matchScores[tool.id] = score;
      });

      if (sortBy === 'rating-desc') {
        filtered.sort(function (a, b) {
          if (searchTerm) {
            var diff = matchScores[b.id] - matchScores[a.id];
            if (Math.abs(diff) > 1) return diff;
          }
          return b.rating - a.rating;
        });
      } else if (sortBy === 'popular') {
        filtered.sort(function (a, b) {
          if (searchTerm) {
            var diff = matchScores[b.id] - matchScores[a.id];
            if (Math.abs(diff) > 1) return diff;
          }
          return (b.votes || 0) - (a.votes || 0);
        });
      } else if (sortBy === 'name-asc') {
        filtered.sort(function (a, b) { return a.name.localeCompare(b.name, 'tr'); });
      } else if (sortBy === 'newest') {
        filtered.sort(function (a, b) {
          if (a.is_new === b.is_new) {
            if (searchTerm) {
              var diff = matchScores[b.id] - matchScores[a.id];
              if (Math.abs(diff) > 1) return diff;
            }
            return b.rating - a.rating;
          }
          return a.is_new ? -1 : 1;
        });
      }
    }

    var totalItems = filtered.length;
    var totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
    
    var startIndex = (currentPage - 1) * itemsPerPage;
    var endIndex = startIndex + itemsPerPage;
    var pageTools = filtered.slice(startIndex, endIndex);

    renderTools(pageTools, totalItems);
    renderPagination(totalItems);
  }

  // ═══════════════════════════════════════════
  // OLAY DİNLEYİCİLER
  // ═══════════════════════════════════════════

  if (searchInput) {
    searchInput.addEventListener('keyup', debounce(function() {
      currentPage = 1;
      applyFilters();
    }, 200));
  }

  if (heroSearchInput) {
    heroSearchInput.addEventListener('keyup', debounce(function() {
      if (searchInput) {
        searchInput.value = heroSearchInput.value;
        currentPage = 1;
        var toolsSection = document.querySelector('#tools-section');
        if (toolsSection) toolsSection.scrollIntoView({ behavior: 'smooth' });
        applyFilters();
      }
    }, 300));
  }

  if (smartSearchCheckbox) {
    smartSearchCheckbox.addEventListener('change', function () {
      if (heroSmartSearchCheckbox) heroSmartSearchCheckbox.checked = this.checked;
      currentPage = 1;
      applyFilters();
    });
  }

  if (heroSmartSearchCheckbox) {
    heroSmartSearchCheckbox.addEventListener('change', function () {
      if (smartSearchCheckbox) smartSearchCheckbox.checked = this.checked;
      currentPage = 1;
      applyFilters();
    });
  }

  if (yerliSearchCheckbox) {
    yerliSearchCheckbox.addEventListener('change', function () {
      currentPage = 1;
      applyFilters();
    });
  }

  if (filterPricing) {
    filterPricing.addEventListener('change', function() {
      currentPage = 1;
      applyFilters();
    });
  }

  if (filterLanguage) {
    filterLanguage.addEventListener('change', function() {
      currentPage = 1;
      applyFilters();
    });
  }

  if (filterSort) {
    filterSort.addEventListener('change', function() {
      currentPage = 1;
      applyFilters();
    });
  }

  if (btnClearFilters) {
    btnClearFilters.addEventListener('click', function () {
      if (searchInput) searchInput.value = '';
      if (heroSearchInput) heroSearchInput.value = '';
      if (filterPricing) filterPricing.value = 'all';
      if (filterLanguage) filterLanguage.value = 'all';
      if (filterSort) filterSort.value = 'rating-desc';
      if (yerliSearchCheckbox) yerliSearchCheckbox.checked = false;
      activeCategory = null;
      currentPage = 1;
      renderCategories(window._categories);
      applyFilters();
    });
  }

  // Öneri chip'leri
  suggestionChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var term = this.textContent.trim();
      if (searchInput) {
        searchInput.value = term;
        currentPage = 1;
        var toolsSection = document.querySelector('#tools-section');
        if (toolsSection) toolsSection.scrollIntoView({ behavior: 'smooth' });
        applyFilters();
      }
    });
  });

  // Footer kategori linkleri
  var footerCategories = document.querySelectorAll('#footer-categories a');
  footerCategories.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var toolsSection = document.querySelector('#tools-section');
      if (toolsSection) {
        e.preventDefault();
        var selectedCategory = this.getAttribute('data-category');
        activeCategory = selectedCategory;
        currentPage = 1;
        renderCategories(window._categories);
        applyFilters();
        toolsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

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
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId && targetId.length > 1) {
        var target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Back to top
  if (backToTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 500) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    });
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ═══════════════════════════════════════════
  // BÜLTEN FORMU
  // ═══════════════════════════════════════════
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailInput = this.querySelector('input[type="email"]');
      var email = emailInput ? emailInput.value.trim() : '';
      if (!email) return;

      var self = this;
      var submitBtn = self.querySelector('button[type="submit"]');
      var originalBtnText = submitBtn ? submitBtn.textContent : 'Abone Ol';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'İşleniyor...';
      }

      fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var msg = document.createElement('div');
        if (data.success) {
          msg.className = 'newsletter-success';
          msg.style.color = '#10b981';
          msg.style.marginTop = '12px';
          msg.style.fontSize = '0.9rem';
          msg.innerHTML = '🎉 Teşekkürler! <strong>' + email + '</strong> adresi bültenimize başarıyla kaydedildi.';
          self.reset();
        } else {
          msg.className = 'newsletter-error';
          msg.style.color = '#ef4444';
          msg.style.marginTop = '12px';
          msg.style.fontSize = '0.9rem';
          msg.innerHTML = '❌ Hata: ' + (data.error || 'Abone olunamadı.');
        }
        self.parentNode.insertBefore(msg, self.nextSibling);
        setTimeout(function () {
          if (msg.parentNode) msg.parentNode.removeChild(msg);
        }, 5000);
      })
      .catch(function (err) {
        var msg = document.createElement('div');
        msg.className = 'newsletter-error';
        msg.style.color = '#ef4444';
        msg.style.marginTop = '12px';
        msg.style.fontSize = '0.9rem';
        msg.innerHTML = '❌ Sunucu bağlantı hatası.';
        self.parentNode.insertBefore(msg, self.nextSibling);
        setTimeout(function () {
          if (msg.parentNode) msg.parentNode.removeChild(msg);
        }, 5000);
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      });
    });
  }

  // ═══════════════════════════════════════════
  // İSTATİSTİK SAYACI ANİMASYONU
  // ═══════════════════════════════════════════
  function animateCounter(element, target, duration) {
    if (!element) return;
    var startTs = null;
    function step(timestamp) {
      if (!startTs) startTs = timestamp;
      var progress = Math.min((timestamp - startTs) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 4);
      element.textContent = Math.floor(eased * target);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = target;
      }
    }
    requestAnimationFrame(step);
  }

  // ═══════════════════════════════════════════
  // VERİ YÜKLEME VE İLK RENDER
  // ═══════════════════════════════════════════
  try {
    const [categories, tools, stats] = await Promise.all([
      fetchCategories(),
      fetchTools(),
      fetchStats()
    ]);

    renderCategories(categories);
    initSearchCategoryDropdown(categories);
    renderFeatured();
    applyFilters();
    renderDirectoryIndex(categories, tools);

    // Günün Promptu ve Haberleri yükle
    initHomepageFeatures();

    // İstatistikler
    var statsBar = document.querySelector('.stats-bar');
    if (statsBar && 'IntersectionObserver' in window) {
      var statsObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(statTools, stats.totalTools || tools.length, 1500);
            animateCounter(statCategories, stats.totalCategories || categories.length, 1500);
            animateCounter(statFree, stats.freeTools || 0, 1500);
            animateCounter(statViews, stats.pageViews || 45280, 1500);
            animateCounter(statMembers, stats.totalUsers || 20, 1500);
            statsObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      statsObserver.observe(statsBar);
    } else {
      animateCounter(statTools, stats.totalTools || tools.length, 1500);
      animateCounter(statCategories, stats.totalCategories || categories.length, 1500);
      animateCounter(statFree, stats.freeTools || 0, 1500);
      animateCounter(statViews, stats.pageViews || 45280, 1500);
      animateCounter(statMembers, stats.totalUsers || 20, 1500);
    }

    // Live trend drawing helper
    function drawTrend(viewsHistory, membersHistory) {
      const svgWidth = 100;
      const svgHeight = 30;
      const maxValV = Math.max(...viewsHistory, 10);
      const minValV = Math.min(...viewsHistory, 0);
      const diffV = (maxValV - minValV) || 1;

      const maxValM = Math.max(...membersHistory, 5);
      const minValM = Math.min(...membersHistory, 0);
      const diffM = (maxValM - minValM) || 1;

      // Draw views path
      let linePathV = '';
      let areaPathV = '';
      viewsHistory.forEach((val, index) => {
        const x = (index / (viewsHistory.length - 1)) * svgWidth;
        const y = 25 - ((val - minValV) / diffV) * 20;
        if (index === 0) {
          linePathV = `M ${x} ${y}`;
          areaPathV = `M ${x} 30 L ${x} ${y}`;
        } else {
          linePathV += ` L ${x} ${y}`;
          areaPathV += ` L ${x} ${y}`;
        }
      });
      areaPathV += ` L 100 30 Z`;

      // Draw members path
      let linePathM = '';
      let areaPathM = '';
      membersHistory.forEach((val, index) => {
        const x = (index / (membersHistory.length - 1)) * svgWidth;
        const y = 26 - ((val - minValM) / diffM) * 18;
        if (index === 0) {
          linePathM = `M ${x} ${y}`;
          areaPathM = `M ${x} 30 L ${x} ${y}`;
        } else {
          linePathM += ` L ${x} ${y}`;
          areaPathM += ` L ${x} ${y}`;
        }
      });
      areaPathM += ` L 100 30 Z`;

      const lineVEl = document.getElementById('views-line-path');
      const areaVEl = document.getElementById('views-area-path');
      const lineMEl = document.getElementById('members-line-path');
      const areaMEl = document.getElementById('members-area-path');

      if (lineVEl) lineVEl.setAttribute('d', linePathV);
      if (areaVEl) areaVEl.setAttribute('d', areaPathV);
      if (lineMEl) lineMEl.setAttribute('d', linePathM);
      if (areaMEl) areaMEl.setAttribute('d', areaPathM);
    }

    // Populate historical points ending at current values
    const maxPoints = 20;
    let currentV = stats.pageViews || 45280;
    let currentM = stats.totalUsers || 20;

    let viewsHistory = Array.from({length: maxPoints}, (_, i) => {
      return Math.round(currentV - (maxPoints - 1 - i) * (Math.floor(Math.random() * 5) + 3));
    });
    let membersHistory = Array.from({length: maxPoints}, (_, i) => {
      return Math.round(currentM - (maxPoints - 1 - i) * (Math.random() > 0.75 ? 1 : 0));
    });

    drawTrend(viewsHistory, membersHistory);

    // Auto-update stats and graph every 5 seconds to feel live!
    setInterval(async () => {
      try {
        const freshStats = await fetchStats();
        const nextV = freshStats.pageViews || currentV;
        const nextM = freshStats.totalUsers || currentM;

        // Simulate tiny random fluctuations (1-2 views) if the database counter hasn't flushed yet
        let vVal = nextV;
        if (vVal === currentV) {
          vVal = currentV + Math.floor(Math.random() * 2) + 1;
        }
        let mVal = nextM;

        currentV = vVal;
        currentM = mVal;

        if (statViews) statViews.textContent = vVal;
        if (statMembers) statMembers.textContent = mVal;

        viewsHistory.push(vVal);
        viewsHistory.shift();

        // Increment members only occasionally if no new real signup
        if (mVal === currentM && Math.random() > 0.98) {
          mVal++;
        }
        membersHistory.push(mVal);
        membersHistory.shift();

        drawTrend(viewsHistory, membersHistory);
      } catch (e) {
        console.error('Failed to update live metrics:', e);
      }
    }, 5000);

    // ─── ARAÇ GÖNDERME MODALI MANTIĞI ───
    var subCategorySelect = document.getElementById('sub-category');
    if (subCategorySelect && categories) {
      subCategorySelect.innerHTML = '<option value="">Kategori Seçin</option>' + categories.map(function(c) {
        return '<option value="' + c.id + '">' + c.icon + ' ' + c.name + '</option>';
      }).join('');
    }

    var submitModal = document.getElementById('submit-tool-modal');
    var btnSubmitTool = document.getElementById('btn-submit-tool');
    var mobileBtnSubmitTool = document.getElementById('mobile-btn-submit-tool');
    var submitModalClose = document.getElementById('submit-modal-close');
    var submitModalCancel = document.getElementById('submit-modal-cancel');
    var submitToolForm = document.getElementById('submit-tool-form');
    var btnSubmitSave = document.getElementById('btn-submit-save');

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

  } catch (err) {
    console.error('Uygulama başlatılamadı:', err);
  }

  function renderDirectoryIndex(categories, tools) {
    var catsListEl = document.getElementById('directory-categories-list');
    var tagsListEl = document.getElementById('directory-tags-list');
    if (!catsListEl || !tagsListEl) return;

    // Calculate category counts
    var categoryCounts = {};
    tools.forEach(function (t) {
      var catId = t.category_id || t.category;
      if (catId) {
        categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
      }
    });

    var sortedCats = categories
      .map(function (c) { return Object.assign({}, c, { count: categoryCounts[c.id] || 0 }); })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, 18); // top 18 categories

    catsListEl.innerHTML = sortedCats.map(function (c) {
      return `
        <div class="directory-item" onclick="filterByCategory('${c.id}')">
          <span class="directory-item-name">${c.icon} ${c.name}</span>
          <span class="directory-item-leader"></span>
          <span class="directory-item-count">${c.count}</span>
        </div>
      `;
    }).join('');

    // Calculate tag counts
    var tagCounts = {};
    tools.forEach(function (t) {
      var tags = t.tags;
      if (typeof tags === 'string') {
        try { tags = JSON.parse(tags); } catch(e) { tags = []; }
      }
      if (Array.isArray(tags)) {
        tags.forEach(function (tag) {
          var cleanTag = tag.trim();
          if (cleanTag) {
            tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
          }
        });
      }
    });

    var sortedTags = Object.keys(tagCounts)
      .map(function (tag) { return { name: tag, count: tagCounts[tag] }; })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, 18); // top 18 tags

    tagsListEl.innerHTML = sortedTags.map(function (t) {
      return `
        <div class="directory-item" onclick="filterByTag('${t.name}')">
          <span class="directory-item-name"># ${t.name}</span>
          <span class="directory-item-leader"></span>
          <span class="directory-item-count">${t.count}</span>
        </div>
      `;
    }).join('');
  }

  window.filterByCategory = function (catId) {
    activeCategory = (activeCategory === catId) ? null : catId;
    currentPage = 1;
    renderCategories(window._categories);
    applyFilters();
    var toolsSection = document.querySelector('#tools-section');
    if (toolsSection) toolsSection.scrollIntoView({ behavior: 'smooth' });
  };

  window.filterByTag = function (tagName) {
    if (searchInput) {
      searchInput.value = tagName;
    }
    if (heroSearchInput) {
      heroSearchInput.value = tagName;
    }
    currentPage = 1;
    if (smartSearchCheckbox) smartSearchCheckbox.checked = false;
    if (heroSmartSearchCheckbox) heroSmartSearchCheckbox.checked = false;
    applyFilters();
    var toolsSection = document.querySelector('#tools-section');
    if (toolsSection) toolsSection.scrollIntoView({ behavior: 'smooth' });
  };

  async function initHomepageFeatures() {
    // Yeni ve Popüler Araçlar Slider Yükleme
    await initPopularToolsSlider();

    // Son Haberleri Yükleme
    var newsGrid = document.getElementById('homepage-news-grid');
    if (newsGrid) {
      try {
        var res = await fetch('/api/news');
        var data = await res.json();
        var news = data.news || [];
        if (news.length === 0) {
          newsGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">Henüz haber eklenmemiş.</p>';
          return;
        }

        // Show last 3 news
        var recentNews = news.slice(0, 3);
        newsGrid.innerHTML = recentNews.map(function(item) {
          var imgUrl = item.imageUrl || '/uploads/ads/ad_1782015572826_609.png'; // fallback placeholder image
          return `
            <div class="tool-card" onclick="window.location.href='/haber-detay?id=${item.id}'" style="cursor:pointer">
              <div style="height: 180px; overflow: hidden; border-radius: var(--radius-md); margin-bottom: 16px; background: rgba(0,0,0,0.2); position: relative;">
                <img src="${imgUrl}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">
                <span style="position: absolute; left: 12px; bottom: 12px; background: rgba(0,0,0,0.6); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${item.publishDate}</span>
              </div>
              <h3 class="tool-name" style="font-size: 1.1rem; margin-bottom: 8px;">${item.title}</h3>
              <p class="tool-description" style="-webkit-line-clamp: 2; height: auto; margin-bottom: 12px;">${item.summary}</p>
              <div style="display:flex; justify-content:space-between; align-items:center; font-size: 0.8rem; color: var(--text-secondary);">
                <span>Kaynak: ${item.source || 'AiKlavuz'}</span>
                <span style="color: var(--accent-cyan); font-weight:600">Devamını Oku &rarr;</span>
              </div>
            </div>
          `;
        }).join('');
      } catch (err) {
        console.error('Haber yükleme hatası:', err);
        newsGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">Haberler yüklenirken bir hata oluştu.</p>';
      }
    }
  }

  async function initPopularToolsSlider() {
    var sliderContainer = document.getElementById('popular-tools-slider-container');
    var paginationContainer = document.getElementById('popular-slider-pagination');
    var prevBtn = document.getElementById('popular-slider-prev');
    var nextBtn = document.getElementById('popular-slider-next');

    if (!sliderContainer) return;

    try {
      var [resNewest, resPopular] = await Promise.all([
        fetch('/api/tools?limit=6&sort=newest'),
        fetch('/api/tools?limit=6&sort=popular')
      ]);
      var dataNewest = await resNewest.json();
      var dataPopular = await resPopular.json();
      var newestTools = dataNewest.tools || [];
      var popularTools = dataPopular.tools || [];

      var toolsMap = {};
      var tools = [];
      newestTools.forEach(function(t) {
        if (!toolsMap[t.id]) {
          toolsMap[t.id] = true;
          tools.push(t);
        }
      });
      popularTools.forEach(function(t) {
        if (!toolsMap[t.id]) {
          toolsMap[t.id] = true;
          tools.push(t);
        }
      });
      tools = tools.slice(0, 12);

      if (tools.length === 0) {
        sliderContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; width: 100%;">Henüz araç eklenmemiş.</p>';
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        return;
      }

      var html = '';
      tools.forEach(function(tool) {
        var cat = getCategoryById(tool.category_id || tool.category);
        var catIcon = cat ? cat.icon : '🛠️';
        var catName = cat ? cat.name : (tool.category_name || 'Yapay Zeka');
        
        var verifiedBadge = tool.dogrulanmis ? '<span class="verified-badge" title="Doğrulanmış">✓</span>' : '';
        
        var bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
        var isBookmarked = bookmarks.indexOf(tool.id) !== -1;
        var activeClass = isBookmarked ? ' active' : '';

        html += '<div class="popular-slider-card" data-url="' + tool.url + '" data-id="' + tool.id + '" style="cursor:pointer">' +
          '<div class="popular-slider-card-center-icon">' + catIcon + '</div>' +
          '<div class="popular-slider-card-content">' +
            '<div class="popular-slider-card-info">' +
              '<h3 class="popular-slider-card-title">' + tool.name + ' ' + verifiedBadge + '</h3>' +
              '<p class="popular-slider-card-subtitle">' + catName + '</p>' +
            '</div>' +
            '<button class="popular-slider-card-action btn-slider-bookmark' + activeClass + '" data-id="' + tool.id + '" title="Çantama Ekle">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>';
      });

      sliderContainer.innerHTML = html;

      // Click card to open website or details
      sliderContainer.querySelectorAll('.popular-slider-card').forEach(function(card) {
        card.addEventListener('click', function(e) {
          if (e.target.closest('.popular-slider-card-action')) return;
          var id = this.getAttribute('data-id');
          if (id) {
            window.location.href = '/tool.html?id=' + id;
          }
        });
      });

      // Heart Button click listeners
      sliderContainer.querySelectorAll('.btn-slider-bookmark').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var id = this.getAttribute('data-id');
          var bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
          var idx = bookmarks.indexOf(id);
          if (idx === -1) {
            bookmarks.push(id);
            this.classList.add('active');
            showToast('Çantaya eklendi!', 'success');
          } else {
            bookmarks.splice(idx, 1);
            this.classList.remove('active');
            showToast('Çantadan çıkarıldı.', 'info');
          }
          localStorage.setItem('toolkit', JSON.stringify(bookmarks));
          
          var counts = document.querySelectorAll('.toolkit-count');
          counts.forEach(function(el) { el.textContent = bookmarks.length; });
        });
      });

      // Pagination & Navigation Logic
      var cardCount = tools.length;
      var cardsPerView = 3;
      
      function updateCardsPerView() {
        if (window.innerWidth <= 600) cardsPerView = 1;
        else if (window.innerWidth <= 992) cardsPerView = 2;
        else cardsPerView = 3;
      }
      updateCardsPerView();
      window.addEventListener('resize', updateCardsPerView);

      // Render pagination dots
      function renderDots() {
        if (!paginationContainer) return;
        var dotsHtml = '';
        var activeDotIndex = Math.round(sliderContainer.scrollLeft / ((sliderContainer.clientWidth / cardsPerView) || 1));
        var totalDots = Math.ceil(cardCount / cardsPerView);
        for (var i = 0; i < totalDots; i++) {
          var activeClass = (i === activeDotIndex) ? ' active' : '';
          dotsHtml += '<button class="slider-dot' + activeClass + '" data-index="' + i + '" aria-label="Sayfa ' + (i+1) + '"></button>';
        }
        paginationContainer.innerHTML = dotsHtml;

        paginationContainer.querySelectorAll('.slider-dot').forEach(function(dot) {
          dot.addEventListener('click', function() {
            var index = parseInt(this.getAttribute('data-index'));
            var scrollPos = index * (sliderContainer.clientWidth + 24);
            sliderContainer.scrollTo({ left: scrollPos, behavior: 'smooth' });
          });
        });
      }
      
      renderDots();
      
      // Scroll listener to update dots
      sliderContainer.addEventListener('scroll', function() {
        var activeDotIndex = Math.round(sliderContainer.scrollLeft / (sliderContainer.clientWidth || 1));
        var dots = paginationContainer.querySelectorAll('.slider-dot');
        dots.forEach(function(dot, idx) {
          if (idx === activeDotIndex) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });
      });

      if (prevBtn) {
        prevBtn.addEventListener('click', function() {
          sliderContainer.scrollBy({ left: -(sliderContainer.clientWidth + 24), behavior: 'smooth' });
        });
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', function() {
          sliderContainer.scrollBy({ left: (sliderContainer.clientWidth + 24), behavior: 'smooth' });
        });
      }

    } catch (err) {
      console.error('Yeni ve popüler araçlar yükleme hatası:', err);
    }
  }



  // ═══════════════════════════════════════════
  // CATEGORY SEARCH DROPDOWN AND SUBMIT BUTTON LISTENERS
  // ═══════════════════════════════════════════
  var heroSearchSubmitBtn = document.querySelector('#hero-search-submit-btn');
  if (heroSearchSubmitBtn) {
    heroSearchSubmitBtn.addEventListener('click', function() {
      if (searchInput && heroSearchInput) {
        searchInput.value = heroSearchInput.value;
        currentPage = 1;
        var toolsSection = document.querySelector('#tools-section');
        if (toolsSection) toolsSection.scrollIntoView({ behavior: 'smooth' });
        applyFilters();
      }
    });
  }

  function initSearchCategoryDropdown(categories) {
    var categorySelectBtn = document.querySelector('#hero-category-select-btn');
    var categoryDropdown = document.querySelector('#hero-category-dropdown');
    var dropdownListContainer = document.querySelector('#category-dropdown-list-container');
    var categorySearchInput = document.querySelector('#category-dropdown-search-input');
    var categoryWrapper = document.querySelector('.search-category-wrapper');

    if (!categorySelectBtn || !categoryDropdown || !dropdownListContainer) return;

    // Toggle Dropdown Panel
    categorySelectBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      var isVisible = categoryDropdown.style.display !== 'none';
      if (isVisible) {
        categoryDropdown.style.display = 'none';
        categoryWrapper.classList.remove('open');
      } else {
        categoryDropdown.style.display = 'block';
        categoryWrapper.classList.add('open');
        if (categorySearchInput) categorySearchInput.focus();
      }
    });

    // Close Dropdown on Outside Click
    document.addEventListener('click', function(e) {
      if (!categoryWrapper.contains(e.target)) {
        categoryDropdown.style.display = 'none';
        categoryWrapper.classList.remove('open');
      }
    });

    // Render Dropdown List
    function renderDropdownItems(filteredCats) {
      var activeId = activeCategory || '';
      var html = '<button type="button" class="category-dropdown-item' + (activeId === '' ? ' active' : '') + '" data-id="">' +
        '<span>📁 Tüm Kategoriler</span>' +
        '<svg class="category-dropdown-item-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>' +
        '</button>';

      filteredCats.forEach(function(cat) {
        var isActive = (activeId === cat.id) ? ' active' : '';
        html += '<button type="button" class="category-dropdown-item' + isActive + '" data-id="' + cat.id + '">' +
          '<span>' + cat.icon + ' ' + cat.name + '</span>' +
          '<svg class="category-dropdown-item-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>' +
          '</button>';
      });

      dropdownListContainer.innerHTML = html;

      // Item click listener
      dropdownListContainer.querySelectorAll('.category-dropdown-item').forEach(function(item) {
        item.addEventListener('click', function() {
          var selectedId = this.getAttribute('data-id');
          activeCategory = selectedId ? selectedId : null;

          // Update trigger label
          var selectedTextEl = categorySelectBtn.querySelector('.selected-category-text');
          if (selectedTextEl) {
            if (activeCategory) {
              var selectedCat = categories.find(function(c) { return c.id === activeCategory; });
              selectedTextEl.textContent = selectedCat ? (selectedCat.icon + ' ' + selectedCat.name) : 'Tüm Kategoriler';
            } else {
              selectedTextEl.textContent = 'Tüm Kategoriler';
            }
          }

          // Close dropdown
          categoryDropdown.style.display = 'none';
          categoryWrapper.classList.remove('open');

          // Sync category cards layout selection
          renderCategories(window._categories);

          // Apply filters and search
          currentPage = 1;
          applyFilters();
        });
      });
    }

    // Initial render of list
    renderDropdownItems(categories);

    // Live search inside dropdown
    if (categorySearchInput) {
      categorySearchInput.addEventListener('input', function() {
        var query = this.value.toLowerCase().trim();
        var filtered = categories.filter(function(cat) {
          return cat.name.toLowerCase().includes(query);
        });
        renderDropdownItems(filtered);
      });
    }
  }
});
