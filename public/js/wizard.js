// Yapay Zeka Vitrini — Karar Sihirbazı Modülü
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  const t = (key, fallback) => (window.i18n && typeof window.i18n.t === 'function') ? window.i18n.t(key) : fallback;

  // 1. Sekmeler Arası Geçiş (Standart Arama - Karar Sihirbazı)
  const tabSearch = document.getElementById('tab-search');
  const tabWizard = document.getElementById('tab-wizard');
  const searchContainer = document.querySelector('.hero-search');
  const wizardContainer = document.getElementById('hero-wizard-container');
  const suggestions = document.querySelector('.search-suggestions');

  if (tabSearch && tabWizard && searchContainer && wizardContainer) {
    tabSearch.addEventListener('click', function () {
      tabSearch.classList.add('active');
      tabWizard.classList.remove('active');
      searchContainer.style.display = 'block';
      wizardContainer.style.display = 'none';
      if (suggestions) suggestions.style.display = 'flex';
    });

    tabWizard.addEventListener('click', function () {
      tabWizard.classList.add('active');
      tabSearch.classList.remove('active');
      searchContainer.style.display = 'none';
      wizardContainer.style.display = 'block';
      if (suggestions) suggestions.style.display = 'none';
      
      // Sihirbaz açıldığında ilk adıma odaklan
      resetWizard();
    });
  }

  // 2. Sihirbaz Adım Mantığı
  let currentStep = 1;
  const choices = {
    goal: null,
    budget: null,
    experience: null
  };

  const steps = [
    document.getElementById('wizard-step-1'),
    document.getElementById('wizard-step-2'),
    document.getElementById('wizard-step-3')
  ];

  const progressFill = document.getElementById('wizard-progress-fill');
  const stepIndicator = document.getElementById('wizard-step-indicator');
  const btnPrev = document.getElementById('btn-wizard-prev');
  const btnNext = document.getElementById('btn-wizard-next');
  const btnRestart = document.getElementById('btn-wizard-restart');
  const footerControls = document.getElementById('wizard-footer-controls');
  const loadingView = document.getElementById('wizard-loading-view');
  const resultsView = document.getElementById('wizard-results-view');
  const resultsGrid = document.getElementById('wizard-results-grid-container');

  // Her Adımdaki Seçenekleri Dinleme
  steps.forEach((stepEl, index) => {
    if (!stepEl) return;
    const cards = stepEl.querySelectorAll('.wizard-option-card');
    cards.forEach(card => {
      card.addEventListener('click', function () {
        // Aynı adımdaki diğer kartlardan seçimi kaldır
        cards.forEach(c => c.classList.remove('selected'));
        // Bu kartı seç
        this.classList.add('selected');

        const value = this.getAttribute('data-value');
        if (index === 0) choices.goal = value;
        else if (index === 1) choices.budget = value;
        else if (index === 2) choices.experience = value;

        // Devam Et butonunu aktif et
        btnNext.disabled = false;
      });
    });
  });

  // Sonraki Adım
  if (btnNext) {
    btnNext.addEventListener('click', function () {
      if (currentStep < 3) {
        goToStep(currentStep + 1);
      } else {
        // Son adımda API'ye git
        submitWizard();
      }
    });
  }

  // Önceki Adım
  if (btnPrev) {
    btnPrev.addEventListener('click', function () {
      if (currentStep > 1) {
        goToStep(currentStep - 1);
      }
    });
  }

  // Yeniden Başlat
  if (btnRestart) {
    btnRestart.addEventListener('click', resetWizard);
  }

  function goToStep(step) {
    // Mevcut adımı gizle
    steps[currentStep - 1].style.display = 'none';
    
    currentStep = step;
    
    // Yeni adımı göster
    steps[currentStep - 1].style.display = 'block';

    // Arayüz kontrollerini güncelle
    btnPrev.disabled = currentStep === 1;
    
    // Eğer bu adımda önceden bir şey seçilmişse sonraki butonunu aktif et
    let hasChoice = false;
    if (currentStep === 1 && choices.goal) hasChoice = true;
    else if (currentStep === 2 && choices.budget) hasChoice = true;
    else if (currentStep === 3 && choices.experience) hasChoice = true;
    
    btnNext.disabled = !hasChoice;

    // Son adımda "Sonuçları Gör" yap
    if (currentStep === 3) {
      btnNext.textContent = 'Sonuçları Analiz Et ✨';
    } else {
      btnNext.textContent = 'Devam Et';
    }

    // İlerleme çubuğunu güncelle
    const progressPerc = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100;
    if (progressFill) progressFill.style.width = progressPerc + '%';
    if (stepIndicator) stepIndicator.textContent = `Adım ${currentStep} / 3`;
  }

  // Sihirbazı Sıfırla
  function resetWizard() {
    choices.goal = null;
    choices.budget = null;
    choices.experience = null;
    currentStep = 1;

    // Tüm kart seçimlerini temizle
    document.querySelectorAll('.wizard-option-card').forEach(c => c.classList.remove('selected'));

    // Görünümleri sıfırla
    steps.forEach((el, idx) => {
      if (el) el.style.display = idx === 0 ? 'block' : 'none';
    });
    if (loadingView) loadingView.style.display = 'none';
    if (resultsView) resultsView.style.display = 'none';
    
    if (footerControls) footerControls.style.display = 'flex';
    if (btnPrev) {
      btnPrev.style.display = 'inline-block';
      btnPrev.disabled = true;
    }
    if (btnNext) {
      btnNext.style.display = 'inline-block';
      btnNext.disabled = true;
      btnNext.textContent = 'Devam Et';
    }
    if (btnRestart) btnRestart.style.display = 'none';

    // İlerleme çubuğu
    if (progressFill) progressFill.style.width = '33%';
    if (stepIndicator) stepIndicator.textContent = 'Adım 1 / 3';
    if (resultsGrid) resultsGrid.innerHTML = '';
  }

  // API İstek Gönderme
  async function submitWizard() {
    // Sihirbaz adımlarını ve butonlarını gizle, loading göster
    steps[2].style.display = 'none';
    if (btnPrev) btnPrev.style.display = 'none';
    if (btnNext) btnNext.style.display = 'none';
    if (loadingView) loadingView.style.display = 'flex';

    try {
      // Dil parametresini al
      const currentLang = document.documentElement.lang || 'tr';
      const response = await fetch(`/api/advisor/wizard?lang=${currentLang}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(choices)
      });

      if (loadingView) loadingView.style.display = 'none';

      if (response.ok) {
        const data = await response.json();
        renderResults(data.tools);
      } else {
        showError('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (e) {
      console.error(e);
      if (loadingView) loadingView.style.display = 'none';
      showError('Bağlantı hatası oluştu. Lütfen internetinizi kontrol edin.');
    }
  }

  // Sonuçları Çizdirme
  function renderResults(tools) {
    if (resultsView) resultsView.style.display = 'block';
    if (btnRestart) btnRestart.style.display = 'inline-block';
    if (footerControls) footerControls.style.display = 'flex'; // show footer for restart button

    if (!resultsGrid) return;
    resultsGrid.innerHTML = '';

    if (!tools || tools.length === 0) {
      resultsGrid.innerHTML = `<p style="color:var(--text-secondary); text-align:center; grid-column: 1/-1;">Seçimlerinize uygun araç bulunamadı.</p>`;
      return;
    }

    const bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');

    tools.forEach(tool => {
      const isAdded = bookmarks.includes(tool.id);
      const pricingLabel = tool.pricing === 'ucretsiz' ? t('free', 'Ücretsiz') : tool.pricing === 'freemium' ? 'Freemium' : t('paid', 'Ücretli');
      const trSupportText = tool.turkish_supported === 'full' ? '🇹🇷 Türkçe' : tool.turkish_supported === 'partial' ? '🇹🇷 Kısmi' : '🇬🇧 İngilizce';

      const card = document.createElement('div');
      card.className = 'wizard-result-card';
      card.innerHTML = `
        <div class="result-card-inner">
          <div class="result-card-header">
            <span class="tool-icon-mini" style="background:var(--gradient-primary); color:white; font-weight:700; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
              ${tool.name.charAt(0).toUpperCase()}
            </span>
            <div class="tool-name-info">
              <h4>${tool.name}</h4>
              <span class="tool-cat">${tool.category_icon || '📁'} ${tool.category_name}</span>
            </div>
          </div>
          <p class="tool-desc">${tool.description.substring(0, 110)}...</p>
          <div class="tool-badges">
            <span class="tool-badge-mini pricing-${tool.pricing}">${pricingLabel}</span>
            <span class="tool-badge-mini tr-${tool.turkish_supported || 'none'}">${trSupportText}</span>
          </div>
          
          <div class="ai-explanation-bubble">
            <div class="bubble-header">
              <span class="bubble-logo">🤖</span>
              <span>Yapay Zeka Analizi</span>
            </div>
            <p>${tool.ai_explanation || ''}</p>
          </div>
          
          <div class="result-card-actions">
            <a href="/tool/${tool.id}" class="btn-primary" style="flex:1; text-align:center; padding:10px 0; border-radius:10px; font-weight:600;" target="_blank">İncele</a>
            <button class="btn-secondary btn-wizard-toggle-bag" data-id="${tool.id}" style="padding:10px 14px; border-radius:10px; font-size:1.1rem; display:flex; align-items:center; justify-content:center;" title="${isAdded ? 'Çantadan Çıkar' : 'Çantaya Ekle'}">
              ${isAdded ? '🎒✔️' : '🎒➕'}
            </button>
          </div>
        </div>
      `;
      resultsGrid.appendChild(card);
    });

    // Çantaya Ekle / Çıkar Buton Dinleyicileri
    resultsGrid.querySelectorAll('.btn-wizard-toggle-bag').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const id = this.getAttribute('data-id');
        let currentBookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
        if (currentBookmarks.includes(id)) {
          // Çantadan çıkar
          currentBookmarks = currentBookmarks.filter(item => item !== id);
          localStorage.setItem('toolkit', JSON.stringify(currentBookmarks));
          this.innerHTML = '🎒➕';
          this.setAttribute('title', 'Çantaya Ekle');
          if (typeof showToast === 'function') showToast('Araç çantanızdan çıkarıldı.', 'info');
        } else {
          // Çantaya ekle
          currentBookmarks.push(id);
          localStorage.setItem('toolkit', JSON.stringify(currentBookmarks));
          this.innerHTML = '🎒✔️';
          this.setAttribute('title', 'Çantadan Çıkar');
          if (typeof showToast === 'function') showToast('Araç çantanıza eklendi!', 'success');
        }
        window.dispatchEvent(new CustomEvent('toolkitUpdated'));
      });
    });
  }

  // Hata Gösterimi
  function showError(msg) {
    if (resultsView) resultsView.style.display = 'block';
    if (btnRestart) btnRestart.style.display = 'inline-block';
    if (footerControls) footerControls.style.display = 'flex';
    
    if (resultsGrid) {
      resultsGrid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:20px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:12px; color:var(--accent-red);">
          <span style="font-size:2rem; display:block; margin-bottom:8px;">⚠️</span>
          <p>${msg}</p>
        </div>
      `;
    }
  }

  // Çantadaki Değişiklikleri Dinleyerek Buton Durumlarını Güncelleme
  window.addEventListener('toolkitUpdated', function () {
    const currentBookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
    document.querySelectorAll('.btn-wizard-toggle-bag').forEach(btn => {
      const id = btn.getAttribute('data-id');
      const isAdded = currentBookmarks.includes(id);
      btn.innerHTML = isAdded ? '🎒✔️' : '🎒➕';
      btn.setAttribute('title', isAdded ? 'Çantadan Çıkar' : 'Çantaya Ekle');
    });
  });
});
