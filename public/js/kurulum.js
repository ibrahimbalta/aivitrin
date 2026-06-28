// Yapay Zeka Vitrini — Bana Özel YZ Kurulumu
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  // State
  let selectedProfession = null;
  let selectedExperience = null;
  let selectedPainPoint = null;
  let recommendedTools = [];

  // DOM Elements
  const steps = {
    1: document.getElementById('step-1'),
    2: document.getElementById('step-2'),
    3: document.getElementById('step-3'),
    4: document.getElementById('step-4'),
  };

  const nextBtns = {
    1: document.getElementById('next-1'),
    2: document.getElementById('next-2'),
    3: document.getElementById('next-3'),
  };

  const prevBtns = {
    2: document.getElementById('prev-2'),
    3: document.getElementById('prev-3'),
    4: document.getElementById('prev-4'),
  };

  const resultsGrid = document.getElementById('results-grid');
  const resultsLoader = document.getElementById('results-loader');
  const addAllBtn = document.getElementById('btn-add-all-toolkit');

  // Option selection logic
  document.querySelectorAll('.setup-step').forEach(stepEl => {
    const stepNum = parseInt(stepEl.id.replace('step-', ''));
    const options = stepEl.querySelectorAll('.option-btn');
    
    options.forEach(opt => {
      opt.addEventListener('click', function () {
        // Deselect siblings
        options.forEach(o => o.classList.remove('selected'));
        
        // Select clicked
        this.classList.add('selected');
        const val = this.getAttribute('data-value');
        
        // Save to state
        if (stepNum === 1) {
          selectedProfession = val;
        } else if (stepNum === 2) {
          selectedExperience = val;
        } else if (stepNum === 3) {
          selectedPainPoint = val;
        }
        
        // Enable next button
        if (nextBtns[stepNum]) {
          nextBtns[stepNum].disabled = false;
        }
      });
    });
  });

  // Step transition function
  function goToStep(fromStep, toStep) {
    if (steps[fromStep]) {
      steps[fromStep].classList.remove('active');
    }
    if (steps[toStep]) {
      steps[toStep].classList.add('active');
    }
    
    // Trigger recommendation logic on step 4
    if (toStep === 4) {
      generateRecommendations();
    }
  }

  // Next button click listeners
  Object.keys(nextBtns).forEach(stepNum => {
    nextBtns[stepNum].addEventListener('click', function () {
      goToStep(parseInt(stepNum), parseInt(stepNum) + 1);
    });
  });

  // Prev button click listeners
  Object.keys(prevBtns).forEach(stepNum => {
    prevBtns[stepNum].addEventListener('click', function () {
      goToStep(parseInt(stepNum), parseInt(stepNum) - 1);
    });
  });

  // Recommendation logic
  async function generateRecommendations() {
    resultsLoader.style.display = 'block';
    resultsGrid.style.display = 'none';
    addAllBtn.disabled = true;
    
    try {
      const res = await fetch('/api/tools');
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      const allTools = data.tools || data;

      // Map user choices to target categories
      const targetCategories = new Set();
      
      // Profession mapping
      const profMap = {
        ogretmen: ['egitim-ve-dil', 'is-ve-verimlilik'],
        yazilimci: ['kodlama-ve-gelistirme'],
        tasarimci: ['gorsel-tasarim', 'video-ve-animasyon'],
        yazar: ['yazma-ve-icerik-uretimi', 'ai-asistanlar'],
        pazarlamaci: ['pazarlama-ve-sosyal-medya', 'is-ve-verimlilik'],
        girisimci: ['is-ve-verimlilik', 'ai-asistanlar'],
        hukukcu: ['finans-ve-hukuk', 'is-ve-verimlilik'],
        saglikci: ['saglik-ve-wellness', 'ai-asistanlar']
      };
      
      if (profMap[selectedProfession]) {
        profMap[selectedProfession].forEach(c => targetCategories.add(c));
      }
      
      // Pain point mapping
      const painMap = {
        yazma: 'yazma-ve-icerik-uretimi',
        gorsel: 'gorsel-tasarim',
        kod: 'kodlama-ve-gelistirme',
        analiz: 'arastirma-ve-analiz',
        otomasyon: 'is-ve-verimlilik',
        'hizli-cozum': 'ai-asistanlar'
      };
      
      if (painMap[selectedPainPoint]) {
        targetCategories.add(painMap[selectedPainPoint]);
      }

      // Filter tools by category
      let filtered = allTools.filter(tool => targetCategories.has(tool.category_id));
      
      // If we don't have enough matches, fallback to general popular/featured tools
      if (filtered.length < 3) {
        filtered = allTools.filter(t => t.featured);
      }

      // Sort: Featured first, then by rating
      filtered.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });

      // Select top 4 tools
      recommendedTools = filtered.slice(0, 4);
      
      // Render tools
      renderRecommendedTools(recommendedTools);
      
    } catch (err) {
      console.error('Error generating recommendations:', err);
      resultsLoader.innerHTML = `<div style="color: var(--accent-red)">Öneriler yüklenirken hata oluştu. Lütfen tekrar deneyin.</div>`;
    }
  }

  // Render recommended tools in grid
  function renderRecommendedTools(tools) {
    resultsLoader.style.display = 'none';
    resultsGrid.style.display = 'grid';
    addAllBtn.disabled = false;

    if (tools.length === 0) {
      resultsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Eşleşen yapay zeka aracı bulunamadı.</div>`;
      return;
    }

    resultsGrid.innerHTML = tools.map(tool => {
      const firstLetter = tool.name.charAt(0).toUpperCase();
      const ratingHtml = tool.rating ? `⭐ <span style="color:var(--text-primary); font-weight:600;">${tool.rating}</span>` : '⭐ Yeni';
      
      return `
        <div class="tool-card animate-on-scroll visible" style="display:flex; flex-direction:column; padding:20px; border-color: rgba(20,219,212,0.15); background: rgba(20,219,212,0.01);">
          <div class="tool-card-header" style="margin-bottom:8px; display:flex; align-items:center;">
            <div class="tool-icon" style="margin-right:10px; width:40px; height:40px; font-size:1.1rem; background: var(--gradient-primary); color:white;">${firstLetter}</div>
            <div class="tool-info" style="flex:1;">
              <h4 class="tool-name" style="margin:0; font-size:1rem; font-family:'Outfit',sans-serif;">${tool.name}</h4>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                ${ratingHtml}
              </div>
            </div>
          </div>
          <p class="tool-description" style="margin:10px 0; font-size:0.82rem; line-height:1.4; color:var(--text-muted); flex:1;">${tool.description}</p>
          <a href="/tool/${tool.id}" target="_blank" style="margin-top:auto; font-size:0.8rem; font-weight:700; color:var(--accent-cyan); text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
            Detayları Gör &rarr;
          </a>
        </div>
      `;
    }).join('');
  }

  // Add all recommended tools to toolkit
  if (addAllBtn) {
    addAllBtn.addEventListener('click', function () {
      if (recommendedTools.length === 0) return;
      
      let bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
      let addedCount = 0;

      recommendedTools.forEach(tool => {
        if (!bookmarks.includes(tool.id)) {
          bookmarks.push(tool.id);
          addedCount++;
        }
      });

      if (addedCount > 0) {
        localStorage.setItem('toolkit', JSON.stringify(bookmarks));
        // Trigger bag update event
        window.dispatchEvent(new CustomEvent('toolkitUpdated'));
        showToast(`${addedCount} adet özel yapay zeka aracı çantanıza eklendi! 🎒`, 'success');
        
        // Button visual feedback
        const originalText = this.innerHTML;
        this.innerHTML = `✓ Çantaya Eklendi!`;
        this.style.background = '#10b981';
        setTimeout(() => {
          this.innerHTML = originalText;
          this.style.background = '#10b981';
        }, 2000);
      } else {
        showToast('Önerilen tüm araçlar zaten çantanızda ekli. 🎒', 'info');
      }
    });
  }

  // Toast notification helper
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.background = type === 'success' ? '#10b981' : (type === 'info' ? '#3b82f6' : '#ef4444');
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

    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // Spotlight effect
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
});
