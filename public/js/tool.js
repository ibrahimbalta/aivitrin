// Yapay Zeka Vitrini — Yapay Zeka Aracı Detay Sayfası Scripti
'use strict';

document.addEventListener('DOMContentLoaded', async function () {
  // Global Toast Notification System
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

  // Extract tool ID from pathname (e.g. /tool/chatgpt -> chatgpt)
  const toolId = window.location.pathname.split('/').pop();

  if (!toolId) {
    showEmptyState();
    return;
  }

  let toolData = null;
  let selectedRating = 0;

  // Sync Input Elements
  const toolNameEl = document.getElementById('tool-name');
  const toolCategoryEl = document.getElementById('tool-category');
  const toolRatingStars = document.getElementById('tool-rating-stars');
  const toolRatingVal = document.getElementById('tool-rating-val');
  const toolVotesEl = document.getElementById('tool-votes');
  const toolDescEl = document.getElementById('tool-desc');
  const visitLink = document.getElementById('btn-visit-link');
  
  const specPricing = document.getElementById('spec-pricing');
  const specPricingTryRow = document.getElementById('spec-pricing-try-row');
  const specPricingTry = document.getElementById('spec-pricing-try');
  const specTrSupport = document.getElementById('spec-tr-support');
  const toolTagsDetail = document.getElementById('tool-tags-detail');
  
  const reviewsContainer = document.getElementById('reviews-list-container');
  const reviewForm = document.getElementById('review-form');
  const reviewAuthPrompt = document.getElementById('review-auth-prompt');
  const btnReviewLogin = document.getElementById('btn-review-login');
  
  const btnVote = document.getElementById('btn-detail-vote');
  const btnBookmark = document.getElementById('btn-detail-bookmark');
  const btnCompare = document.getElementById('btn-detail-compare');
  const voteCountLabel = document.getElementById('vote-count-label');

  const starElements = document.querySelectorAll('#stars-selector .rating-star');

  // Load Tool details
  async function loadToolDetails() {
    try {
      const res = await fetch(`/api/tools/${toolId}`);
      if (!res.ok) {
        showEmptyState();
        return;
      }
      toolData = await res.json();
      renderToolDetails();
      loadAIAnalysis();
      loadAlternatives();
    } catch (err) {
      console.error('Error fetching tool details:', err);
      showEmptyState();
    }
  }

  async function loadAIAnalysis() {
    const wrapper = document.getElementById('ai-analysis-wrapper');
    const prosList = document.getElementById('tool-pros');
    const consList = document.getElementById('tool-cons');
    if (!wrapper || !prosList || !consList) return;

    try {
      const res = await fetch(`/api/tools/${toolId}/analysis`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.success && data.pros && data.cons) {
        prosList.innerHTML = data.pros.map(pro => `<li>${pro}</li>`).join('');
        consList.innerHTML = data.cons.map(con => `<li>${con}</li>`).join('');
        wrapper.style.display = 'block';
      }
    } catch (err) {
      console.error('Error fetching AI analysis:', err);
    }
  }

  function showEmptyState() {
    document.title = 'Araç Bulunamadı — AiKlavuz';
    toolNameEl.textContent = 'Araç Bulunamadı';
    toolDescEl.textContent = 'Aradığınız yapay zeka aracı vitrinimizde bulunmuyor veya yayından kaldırılmış.';
    const detailsLayout = document.querySelector('.tool-detail-layout');
    if (detailsLayout) {
      detailsLayout.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 100px 20px;">
          <div style="font-size: 3.5rem; margin-bottom: 20px;">🔍</div>
          <h2>Aradığınız Yapay Zeka Aracı Bulunamadı</h2>
          <p style="color: var(--text-secondary); margin-top: 10px; max-width: 500px; margin-left: auto; margin-right: auto;">Aradığınız araç silinmiş veya hatalı bir bağlantı kullanılmış olabilir.</p>
          <a href="/" class="btn-primary" style="display: inline-block; margin-top: 24px; padding: 12px 24px; text-decoration: none; font-weight: 600; border-radius: 8px; background: var(--gradient-primary); color: white;">Ana Sayfaya Dön</a>
        </div>
      `;
    }
  }

  function getPricingLabel(pricing) {
    const labels = { ucretsiz: 'Ücretsiz', ucretli: 'Ücretli', freemium: 'Freemium' };
    return labels[pricing] || pricing;
  }

  function getTrSupportLabel(support) {
    const labels = { full: 'Tam Türkçe Desteği', partial: 'Kısmi Türkçe Desteği', none: 'Yalnızca İngilizce' };
    return labels[support] || 'Bilinmiyor';
  }

  function renderToolDetails() {
    // Page Title Update
    document.title = `${toolData.name} — Türkçe Detaylı İnceleme & Alternatifleri | AiKlavuz`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', `${toolData.name} yapay zeka aracının detayları, kullanıcı yorumları, Türkçe dil desteği, fiyat modelleri ve en iyi alternatif rakipleri.`);
    }

    toolNameEl.textContent = toolData.name;
    toolCategoryEl.textContent = toolData.category_name ? `${toolData.category_icon} ${toolData.category_name}` : 'Yapay Zeka';
    
    // Rating
    toolRatingVal.textContent = toolData.rating.toFixed(1);
    toolRatingStars.textContent = '★'.repeat(Math.round(toolData.rating));
    toolVotesEl.textContent = `${toolData.votes || 0} oy`;
    voteCountLabel.textContent = toolData.votes || 0;

    // Desc & Link
    toolDescEl.textContent = toolData.description;
    visitLink.href = toolData.url;

    // Specs
    specPricing.textContent = getPricingLabel(toolData.pricing);
    if (toolData.pricing_try) {
      specPricingTry.textContent = toolData.pricing_try;
      specPricingTryRow.style.display = 'flex';
    } else {
      specPricingTryRow.style.display = 'none';
    }
    specTrSupport.textContent = getTrSupportLabel(toolData.turkish_supported);

    // Tags
    let tags = toolData.tags || [];
    if (typeof tags === 'string') {
      try { tags = JSON.parse(tags); } catch(e) { tags = []; }
    }
    if (tags.length > 0) {
      toolTagsDetail.innerHTML = tags.map(tag => `<span class="tool-tag">${tag}</span>`).join('');
      document.getElementById('tags-container-area').style.display = 'block';
    } else {
      document.getElementById('tags-container-area').style.display = 'none';
    }

    // Bookmark & Vote class states
    syncButtonStates();

    // Render Reviews
    renderReviews(toolData.reviews || []);
  }

  function syncButtonStates() {
    // Vote State
    const votedList = JSON.parse(localStorage.getItem('voted_tools') || '[]');
    if (votedList.indexOf(toolId) !== -1) {
      btnVote.classList.add('voted');
      btnVote.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg> Beğenildi (${toolData.votes || 0})`;
    } else {
      btnVote.classList.remove('voted');
      btnVote.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg> Beğen (${toolData.votes || 0})`;
    }

    // Bookmark State
    const bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
    if (bookmarks.indexOf(toolId) !== -1) {
      btnBookmark.classList.add('active');
      btnBookmark.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> Çantamda`;
    } else {
      btnBookmark.classList.remove('active');
      btnBookmark.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> Çantama Ekle`;
    }
  }

  function renderReviews(reviews) {
    if (reviews.length === 0) {
      reviewsContainer.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-muted); background: rgba(255,255,255,0.01); border: 1px dashed var(--border-color); border-radius: 8px;">
          Henüz inceleme yapılmamış. Bu aracı değerlendiren ilk kişi siz olun!
        </div>
      `;
      return;
    }

    // Sort newest first
    reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    reviewsContainer.innerHTML = reviews.map(rev => {
      const dateStr = rev.created_at ? new Date(rev.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
      const stars = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
      return `
        <div class="review-item">
          <div class="review-header">
            <div class="review-user-info">
              <span class="review-username">👤 ${rev.username}</span>
              <span class="review-rating">${stars}</span>
            </div>
            <span class="review-date">${dateStr}</span>
          </div>
          <p class="review-comment">${rev.comment}</p>
        </div>
      `;
    }).join('');
  }

  // Auth Panel logic
  function checkReviewAuth() {
    if (window.isUserLoggedIn) {
      reviewForm.style.display = 'flex';
      reviewAuthPrompt.style.display = 'none';
    } else {
      reviewForm.style.display = 'none';
      reviewAuthPrompt.style.display = 'block';
    }
  }

  // Intercept the checkAuth to configure review forms
  const originalCheckAuth = window.checkAuth;
  window.checkAuth = async function() {
    if (originalCheckAuth) await originalCheckAuth();
    checkReviewAuth();
  };
  
  // Double safety check
  setInterval(checkReviewAuth, 1000);

  if (btnReviewLogin) {
    btnReviewLogin.addEventListener('click', function (e) {
      e.preventDefault();
      if (typeof window.showAuthModal === 'function') {
        window.showAuthModal(() => {
          checkReviewAuth();
        });
      }
    });
  }

  // Star selector interactions
  starElements.forEach(star => {
    star.addEventListener('click', function () {
      selectedRating = parseInt(this.getAttribute('data-value'));
      starElements.forEach(s => {
        const val = parseInt(s.getAttribute('data-value'));
        if (val <= selectedRating) {
          s.classList.add('selected');
        } else {
          s.classList.remove('selected');
        }
      });
    });
  });

  // Review Submit
  if (reviewForm) {
    reviewForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const commentInput = document.getElementById('review-comment-textarea');
      const comment = commentInput.value.trim();

      if (selectedRating === 0) {
        showToast('Lütfen bir yıldız puanı seçin.', 'error');
        return;
      }

      try {
        const res = await fetch(`/api/tools/${toolId}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating: selectedRating, comment })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(data.message, 'success');
          commentInput.value = '';
          selectedRating = 0;
          starElements.forEach(s => s.classList.remove('selected'));
          
          // Update details and recalculate avg
          toolData.reviews = data.reviews;
          toolData.rating = data.rating;
          toolData.votes = (toolData.votes || 0) + 1;
          renderToolDetails();
        } else {
          showToast(data.error || 'İnceleme gönderilemedi.', 'error');
        }
      } catch (err) {
        showToast('Bağlantı hatası oluştu.', 'error');
      }
    });
  }

  // Load Alternatives
  async function loadAlternatives() {
    const grid = document.getElementById('alternatives-grid');
    if (!grid) return;

    try {
      const res = await fetch(`/api/tools/${toolId}/alternatives`);
      if (!res.ok) return;

      const list = await res.json();
      if (list.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1;">Bu araç için benzer alternatif bulunamadı.</p>';
        return;
      }

      grid.innerHTML = list.slice(0, 3).map(alt => {
        const catLabel = alt.category_name ? `${alt.category_icon} ${alt.category_name}` : '';
        const stars = '★'.repeat(Math.round(alt.rating || 4));
        const pricingLabel = getPricingLabel(alt.pricing);

        return `
          <div class="tool-card" data-id="${alt.id}" style="cursor:pointer">
            <div class="tool-card-header">
              <div class="tool-icon">${alt.name.charAt(0).toUpperCase()}</div>
              <div class="tool-info">
                <h3 class="tool-name">${alt.name}</h3>
                <span class="tool-category-badge">${catLabel}</span>
              </div>
            </div>
            <p class="tool-description">${alt.description}</p>
            <div class="tool-footer" style="margin-top:auto;">
              <div class="tool-rating">${stars} <span>${alt.rating}</span></div>
              <span class="tool-pricing pricing-${alt.pricing}">${pricingLabel}</span>
            </div>
          </div>
        `;
      }).join('');

      // Add click redirect to alternatives
      grid.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', function () {
          const id = this.getAttribute('data-id');
          if (id) window.location.href = `/tool/${id}`;
        });
      });

    } catch (err) {
      console.error('Alternatives fetch error:', err);
    }
  }

  // Sidebar Actions
  btnVote.addEventListener('click', async function (e) {
    e.preventDefault();
    const votedList = JSON.parse(localStorage.getItem('voted_tools') || '[]');
    if (votedList.indexOf(toolId) !== -1) {
      showToast('Bu araca zaten oy verdiniz!', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/tools/${toolId}/vote`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        votedList.push(toolId);
        localStorage.setItem('voted_tools', JSON.stringify(votedList));
        toolData.votes = data.votes;
        renderToolDetails();
        showToast('Oyunuz kaydedildi!', 'success');
      } else {
        showToast('Oy verilemedi.', 'error');
      }
    } catch (err) {
      showToast('Bağlantı hatası.', 'error');
    }
  });

  btnBookmark.addEventListener('click', function (e) {
    e.preventDefault();
    if (!window.isUserLoggedIn) {
      if (typeof window.showAuthModal === 'function') {
        window.showAuthModal(() => btnBookmark.click());
      }
      return;
    }

    const bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
    const idx = bookmarks.indexOf(toolId);

    if (idx === -1) {
      bookmarks.push(toolId);
      showToast('AI Çantama eklendi!', 'success');
    } else {
      bookmarks.splice(idx, 1);
      showToast('AI Çantamdan çıkarıldı.', 'success');
    }
    localStorage.setItem('toolkit', JSON.stringify(bookmarks));
    window.dispatchEvent(new CustomEvent('toolkitUpdated'));
    syncButtonStates();
  });

  btnCompare.addEventListener('click', function (e) {
    e.preventDefault();
    const compareList = JSON.parse(localStorage.getItem('compare_tools') || '[]');
    if (compareList.indexOf(toolId) !== -1) {
      showToast('Bu araç zaten karşılaştırma listesinde.', 'error');
      return;
    }

    if (compareList.length >= 3) {
      showToast('En fazla 3 aracı karşılaştırabilirsiniz.', 'error');
      return;
    }

    compareList.push(toolId);
    localStorage.setItem('compare_tools', JSON.stringify(compareList));
    showToast('Karşılaştırma listesine eklendi.', 'success');
    if (confirm('Karşılaştırmaya eklendi. Şimdi karşılaştırma sayfasına gitmek ister misiniz?')) {
      window.location.href = '/compare';
    }
  });

  // Listen to external toolkit updates
  window.addEventListener('toolkitUpdated', syncButtonStates);

  // Initialize
  loadToolDetails();
});
