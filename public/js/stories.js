// Yapay Zeka Vitrini — Başarı Hikayeleri Scripti
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  const storiesContainer = document.getElementById('dynamic-stories-container');
  const btnShareStory = document.getElementById('btn-share-story');
  const modalShareStory = document.getElementById('modal-share-story');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const formShareStory = document.getElementById('form-share-story');
  const btnSubmitStory = document.getElementById('btn-submit-story');

  // Card slide-in observer
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  // Custom Toast Notification Helper
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.style.background = type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)';
    toast.style.color = '#fff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.marginBottom = '10px';
    toast.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
    toast.style.fontSize = '0.9rem';
    toast.style.fontWeight = '500';
    toast.style.backdropFilter = 'blur(10px)';
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.innerText = message;

    container.appendChild(toast);

    // Fade in
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    // Fade out and remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Fetch and Load Stories
  async function loadStories() {
    if (!storiesContainer) return;
    
    // Add loading text/spinner
    storiesContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary); display:flex; flex-direction:column; align-items:center; gap:12px;">
        <div class="spinner" style="width: 24px; height: 24px; border: 2px solid var(--border-color); border-top-color: var(--accent-purple); border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <span>Başarı hikayeleri yükleniyor...</span>
      </div>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    `;

    try {
      const res = await fetch('/api/stories');
      if (!res.ok) throw new Error('Sunucu hatası.');
      
      const stories = await res.json();
      storiesContainer.innerHTML = '';

      if (stories.length === 0) {
        storiesContainer.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
            Henüz başarı hikayesi eklenmemiş. İlk paylaşan siz olun!
          </div>
        `;
        return;
      }

      stories.forEach(story => {
        const card = document.createElement('article');
        card.className = 'story-card';
        card.id = story.id;

        let statsHtml = '';
        if (Array.isArray(story.stats)) {
          story.stats.forEach(stat => {
            statsHtml += `
              <div class="story-stat">
                <span class="story-stat-value">${stat.value}</span>
                <span class="story-stat-label">${stat.label}</span>
              </div>
            `;
          });
        }

        let toolsHtml = '';
        if (Array.isArray(story.tools)) {
          story.tools.forEach(tool => {
            toolsHtml += `<span class="story-tool-badge">${tool}</span>`;
          });
        }

        card.innerHTML = `
          <div class="story-card-accent" style="background: ${story.color_accent || 'linear-gradient(135deg, hsl(235, 90%, 60%), hsl(260, 85%, 55%))'}"></div>
          <div class="story-card-inner">
            <div class="story-card-header">
              <div class="story-avatar" style="background: ${story.color_accent || 'linear-gradient(135deg, hsl(235, 90%, 60%), hsl(260, 85%, 55%))'}">${story.avatar || 'A'}</div>
              <div>
                <h3 class="story-name">${story.name}</h3>
                <span class="story-role">${story.role}</span>
              </div>
            </div>
            <h2 class="story-title">${story.title}</h2>
            <div class="story-quote">
              <p>"${story.quote}"</p>
            </div>
            <div class="story-stats">
              ${statsHtml}
            </div>
            <div class="story-tools">
              ${toolsHtml}
            </div>
            <div class="story-content">
              <h4>Zorluk</h4>
              <p>${story.content?.challenge || ''}</p>
              <h4>Çözüm</h4>
              <p>${story.content?.solution || ''}</p>
              <h4>Sonuç</h4>
              <p>${story.content?.result || ''}</p>
            </div>
          </div>
        `;

        storiesContainer.appendChild(card);
        cardObserver.observe(card);

        // Click handler for expansion
        const inner = card.querySelector('.story-card-inner');
        inner.addEventListener('click', function (e) {
          if (e.target.closest('.story-tool-badge')) return;
          card.classList.toggle('expanded');
        });
      });

    } catch (err) {
      console.error(err);
      storiesContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--accent-red);">
          Hikayeler yüklenirken hata oluştu: ${err.message}
        </div>
      `;
    }
  }

  // Modal Event Handlers
  if (btnShareStory && modalShareStory) {
    btnShareStory.addEventListener('click', function () {
      modalShareStory.classList.add('active');
    });
  }

  if (btnCloseModal && modalShareStory) {
    btnCloseModal.addEventListener('click', function () {
      modalShareStory.classList.remove('active');
    });
  }

  if (modalShareStory) {
    modalShareStory.addEventListener('click', function (e) {
      if (e.target === modalShareStory) {
        modalShareStory.classList.remove('active');
      }
    });
  }

  // Form Submit Handler
  if (formShareStory) {
    formShareStory.addEventListener('submit', async function (e) {
      e.preventDefault();
      
      const name = document.getElementById('story-name-input').value.trim();
      const role = document.getElementById('story-role-input').value.trim();
      const tools_used = document.getElementById('story-tools-input').value.trim();
      const raw_story = document.getElementById('story-raw-input').value.trim();

      // Disable inputs and show loading state
      btnSubmitStory.disabled = true;
      const originalText = btnSubmitStory.innerHTML;
      btnSubmitStory.innerHTML = `<span>⏳</span> Yapay Zeka Hikayenizi Özetliyor...`;

      try {
        const res = await fetch('/api/stories/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, role, raw_story, tools_used })
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Gönderim başarısız.');
        }

        formShareStory.reset();
        modalShareStory.classList.remove('active');

        if (data.requires_approval) {
          showToast('Hikayeniz AI tarafından özetlendi ve onay için sıraya alındı!', 'success');
        } else {
          showToast('Başarı hikayeniz yayınlandı! 🚀', 'success');
          loadStories(); // reload list
        }

      } catch (err) {
        console.error(err);
        showToast('Hata: ' + err.message, 'error');
      } finally {
        btnSubmitStory.disabled = false;
        btnSubmitStory.innerHTML = originalText;
      }
    });
  }

  // Initial Load
  loadStories();
});
