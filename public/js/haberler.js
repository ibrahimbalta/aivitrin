// public/js/haberler.js - Haber Listeleme ve Detay Gösterme Scripti
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var newsGrid = document.getElementById('news-grid-list');
  var articleView = document.getElementById('article-view');

  if (newsGrid) {
    loadNewsList();
  }

  if (articleView) {
    loadArticleDetail();
  }

  async function loadNewsList() {
    try {
      var res = await fetch('/api/news');
      var data = await res.json();
      var news = data.news || [];

      if (news.length === 0) {
        newsGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">Henüz yapay zeka haberi eklenmemiş.</p>';
        return;
      }

      newsGrid.innerHTML = news.map(function (item) {
        var imgUrl = item.imageUrl || '/uploads/ads/ad_1782015572826_609.png'; // placeholder fallback
        return `
          <div class="news-card" onclick="window.location.href='/haber-detay?id=${item.id}'">
            <div class="news-card-img">
              <img src="${imgUrl}" alt="${item.title}">
            </div>
            <div class="news-card-body">
              <div class="news-meta">
                <span>📅 ${item.publishDate}</span>
                <span>👤 ${item.source || 'AIvitrin'}</span>
              </div>
              <h3 class="news-title">${item.title}</h3>
              <p class="news-summary">${item.summary}</p>
              <div style="margin-top: auto; color: var(--accent-cyan); font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 4px;">
                Devamını Oku 
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Error loading news list:', err);
      newsGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">Haberler yüklenirken bir hata oluştu.</p>';
    }
  }

  async function loadArticleDetail() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');

    if (!id) {
      articleView.innerHTML = `
        <div style="text-align: center;">
          <h2 style="color: var(--accent-red); margin-bottom: 16px;">Hatalı İstek</h2>
          <p style="color: var(--text-secondary); margin-bottom: 24px;">Herhangi bir haber kimliği belirtilmedi.</p>
          <a href="/haberler" class="btn-back">Haberlere Geri Dön</a>
        </div>
      `;
      return;
    }

    try {
      var res = await fetch('/api/news/' + id);
      if (!res.ok) {
        throw new Error('Haber bulunamadı.');
      }
      var item = await res.json();
      var imgUrl = item.imageUrl || '/uploads/ads/ad_1782015572826_609.png'; // placeholder fallback

      articleView.innerHTML = `
        <div class="article-header">
          <h1 class="article-title">${item.title}</h1>
          <div class="article-meta">
            <span>📅 Yayın Tarihi: <strong>${item.publishDate}</strong></span>
            <span>👤 Kaynak: <strong>${item.source || 'AIvitrin'}</strong></span>
            ${item.sourceUrl ? `<span>🔗 <a href="${item.sourceUrl}" target="_blank" style="color: var(--accent-cyan); text-decoration: none;">Kaynak Siteye Git</a></span>` : ''}
          </div>
        </div>

        <div class="article-image">
          <img src="${imgUrl}" alt="${item.title}">
        </div>

        <div class="article-content">
          ${item.content}
        </div>

        <div class="article-footer">
          <a href="/haberler" class="btn-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transform: rotate(180deg); margin-right: 4px; vertical-align: middle;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            Haberlere Geri Dön
          </a>
          <button id="btn-share-news" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); color: var(--text-primary); padding: 10px 20px; border-radius: var(--radius-md); cursor: pointer; font-size: 0.9rem; font-weight: 500;">
            🔗 Haberi Paylaş
          </button>
        </div>
      `;

      // Share button click
      var shareBtn = document.getElementById('btn-share-news');
      if (shareBtn) {
        shareBtn.addEventListener('click', function () {
          navigator.clipboard.writeText(window.location.href).then(function () {
            shareBtn.textContent = '✅ Bağlantı Kopyalandı!';
            setTimeout(function () {
              shareBtn.textContent = '🔗 Haberi Paylaş';
            }, 2000);
          });
        });
      }

    } catch (err) {
      console.error('Error loading article detail:', err);
      articleView.innerHTML = `
        <div style="text-align: center;">
          <h2 style="color: var(--accent-red); margin-bottom: 16px;">Haber Bulunamadı</h2>
          <p style="color: var(--text-secondary); margin-bottom: 24px;">İstediğiniz haber yayından kaldırılmış veya taşınmış olabilir.</p>
          <a href="/haberler" class="btn-back">Haberlere Geri Dön</a>
        </div>
      `;
    }
  }
});
