// admin/js/academy.js - Akademi İçerik Yönetimi
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  // Elements
  var videosTableBody = document.getElementById('videos-table-body');
  var resourcesTableBody = document.getElementById('resources-table-body');

  var tabVideosBtn = document.getElementById('tab-videos-btn');
  var tabResourcesBtn = document.getElementById('tab-resources-btn');
  var tabVideosContent = document.getElementById('tab-videos');
  var tabResourcesContent = document.getElementById('tab-resources');

  var btnNewVideo = document.getElementById('btn-new-video');
  var btnNewResource = document.getElementById('btn-new-resource');

  // Video Modal Elements
  var videoModal = document.getElementById('video-modal');
  var videoForm = document.getElementById('video-form');
  var videoModalTitle = document.getElementById('video-modal-title');
  var btnCloseVideoModal = document.getElementById('btn-close-video-modal');
  var btnCancelVideo = document.getElementById('btn-cancel-video');

  // Resource Modal Elements
  var resourceModal = document.getElementById('resource-modal');
  var resourceForm = document.getElementById('resource-form');
  var resourceModalTitle = document.getElementById('resource-modal-title');
  var btnCloseResourceModal = document.getElementById('btn-close-resource-modal');
  var btnCancelResource = document.getElementById('btn-cancel-resource');

  // Load Data
  loadVideos();
  loadResources();

  // Tab switching
  if (tabVideosBtn && tabResourcesBtn) {
    tabVideosBtn.addEventListener('click', function () {
      tabVideosBtn.classList.add('active');
      tabResourcesBtn.classList.remove('active');
      tabVideosContent.classList.add('active');
      tabResourcesContent.classList.remove('active');
    });

    tabResourcesBtn.addEventListener('click', function () {
      tabResourcesBtn.classList.add('active');
      tabVideosBtn.classList.remove('active');
      tabResourcesContent.classList.add('active');
      tabVideosContent.classList.remove('active');
    });
  }

  // ─── VIDEO EVENTS ───────────────────────────────
  if (btnNewVideo) {
    btnNewVideo.addEventListener('click', function () {
      openVideoForm();
    });
  }

  if (btnCloseVideoModal) btnCloseVideoModal.addEventListener('click', closeVideoForm);
  if (btnCancelVideo) btnCancelVideo.addEventListener('click', closeVideoForm);

  if (videoForm) {
    videoForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var id = document.getElementById('video-id').value;
      var title = document.getElementById('video-title').value.trim();
      var youtubeId = document.getElementById('video-youtube-id').value.trim();
      var channel = document.getElementById('video-channel').value.trim();
      var category = document.getElementById('video-category').value.trim();
      var categoryId = document.getElementById('video-category-id').value;
      var duration = document.getElementById('video-duration').value.trim();
      var level = document.getElementById('video-level').value;
      var description = document.getElementById('video-desc').value.trim();

      var url = id ? '/api/admin/academy/videos/' + id : '/api/admin/academy/videos';
      var method = id ? 'PUT' : 'POST';

      try {
        var res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, youtubeId, channel, category, categoryId, duration, level, description })
        });
        var data = await res.json();
        if (res.ok) {
          showNotification(data.message || 'Başarılı!');
          closeVideoForm();
          loadVideos();
        } else {
          showNotification(data.error || 'Hata oluştu.', 'error');
        }
      } catch (err) {
        showNotification('Bağlantı hatası.', 'error');
      }
    });
  }

  // ─── RESOURCE EVENTS ─────────────────────────────
  if (btnNewResource) {
    btnNewResource.addEventListener('click', function () {
      openResourceForm();
    });
  }

  if (btnCloseResourceModal) btnCloseResourceModal.addEventListener('click', closeResourceForm);
  if (btnCancelResource) btnCancelResource.addEventListener('click', closeResourceForm);

  if (resourceForm) {
    resourceForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var id = document.getElementById('resource-id').value;
      var title = document.getElementById('resource-title').value.trim();
      var badge = document.getElementById('resource-badge').value.trim();
      var icon = document.getElementById('resource-icon').value.trim();
      var url = document.getElementById('resource-url').value.trim();
      var description = document.getElementById('resource-desc').value.trim();

      var apiUrl = id ? '/api/admin/academy/resources/' + id : '/api/admin/academy/resources';
      var method = id ? 'PUT' : 'POST';

      try {
        var res = await fetch(apiUrl, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, badge, icon, url, description })
        });
        var data = await res.json();
        if (res.ok) {
          showNotification(data.message || 'Başarılı!');
          closeResourceForm();
          loadResources();
        } else {
          showNotification(data.error || 'Hata oluştu.', 'error');
        }
      } catch (err) {
        showNotification('Bağlantı hatası.', 'error');
      }
    });
  }

  // ─── DATA LOADING ────────────────────────────────
  async function loadVideos() {
    if (!videosTableBody) return;
    try {
      var res = await fetch('/api/admin/academy/videos');
      var videos = await res.json();

      if (videos.length === 0) {
        videosTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted)">Kayıtlı video bulunamadı.</td></tr>';
        return;
      }

      videosTableBody.innerHTML = videos.map(function (v) {
        return `
          <tr>
            <td>
              <img src="https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg" style="width: 100px; aspect-ratio: 16/9; object-fit: cover; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05);">
            </td>
            <td><strong>${v.title}</strong></td>
            <td>${v.channel}</td>
            <td><span class="status-badge status-approved">${v.category}</span></td>
            <td>${v.level} / ${v.duration}</td>
            <td>
              <div style="display:flex; gap:8px;">
                <button class="btn-edit-video action-btn" data-id="${v.id}" style="padding:4px 8px; font-size:0.8rem; background:rgba(20, 219, 212, 0.1); border:1px solid rgba(20, 219, 212, 0.2); color:var(--accent-cyan); border-radius:4px; cursor:pointer;">Düzenle</button>
                <button class="btn-delete-video action-btn" data-id="${v.id}" style="padding:4px 8px; font-size:0.8rem; background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.2); color:var(--accent-red); border-radius:4px; cursor:pointer;">Sil</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Bind actions
      videosTableBody.querySelectorAll('.btn-edit-video').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = this.getAttribute('data-id');
          var video = videos.find(v => v.id === id);
          if (video) openVideoForm(video);
        });
      });

      videosTableBody.querySelectorAll('.btn-delete-video').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var id = this.getAttribute('data-id');
          if (confirm('Bu videoyu silmek istediğinize emin misiniz?')) {
            try {
              var res = await fetch('/api/admin/academy/videos/' + id, { method: 'DELETE' });
              var data = await res.json();
              if (res.ok) {
                showNotification(data.message || 'Video silindi.');
                loadVideos();
              } else {
                showNotification(data.error || 'Silinemedi.', 'error');
              }
            } catch (err) {
              showNotification('Hata oluştu.', 'error');
            }
          }
        });
      });

    } catch (e) {
      console.error(e);
      videosTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--accent-red)">Yüklenirken hata oluştu.</td></tr>';
    }
  }

  async function loadResources() {
    if (!resourcesTableBody) return;
    try {
      var res = await fetch('/api/admin/academy/resources');
      var resources = await res.json();

      if (resources.length === 0) {
        resourcesTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Kayıtlı kaynak bulunamadı.</td></tr>';
        return;
      }

      resourcesTableBody.innerHTML = resources.map(function (r) {
        return `
          <tr>
            <td style="font-size: 1.5rem; text-align:center">${r.icon}</td>
            <td><strong>${r.title}</strong><br><a href="${r.url}" target="_blank" style="font-size:0.75rem; color:var(--accent-cyan); text-decoration:none;">${r.url}</a></td>
            <td><span class="status-badge" style="background:rgba(138, 75, 245, 0.1); color:var(--accent-purple); border:1px solid rgba(138, 75, 245, 0.2);">${r.badge}</span></td>
            <td style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${r.description}">${r.description}</td>
            <td>
              <div style="display:flex; gap:8px;">
                <button class="btn-edit-resource action-btn" data-id="${r.id}" style="padding:4px 8px; font-size:0.8rem; background:rgba(20, 219, 212, 0.1); border:1px solid rgba(20, 219, 212, 0.2); color:var(--accent-cyan); border-radius:4px; cursor:pointer;">Düzenle</button>
                <button class="btn-delete-resource action-btn" data-id="${r.id}" style="padding:4px 8px; font-size:0.8rem; background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.2); color:var(--accent-red); border-radius:4px; cursor:pointer;">Sil</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Bind actions
      resourcesTableBody.querySelectorAll('.btn-edit-resource').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = this.getAttribute('data-id');
          var resource = resources.find(r => r.id === id);
          if (resource) openResourceForm(resource);
        });
      });

      resourcesTableBody.querySelectorAll('.btn-delete-resource').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var id = this.getAttribute('data-id');
          if (confirm('Bu kaynağı silmek istediğinize emin misiniz?')) {
            try {
              var res = await fetch('/api/admin/academy/resources/' + id, { method: 'DELETE' });
              var data = await res.json();
              if (res.ok) {
                showNotification(data.message || 'Kaynak silindi.');
                loadResources();
              } else {
                showNotification(data.error || 'Silinemedi.', 'error');
              }
            } catch (err) {
              showNotification('Hata oluştu.', 'error');
            }
          }
        });
      });

    } catch (e) {
      console.error(e);
      resourcesTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--accent-red)">Yüklenirken hata oluştu.</td></tr>';
    }
  }

  // ─── HELPERS ─────────────────────────────────────
  function openVideoForm(video) {
    if (!videoForm) return;
    videoForm.reset();
    
    if (video) {
      videoModalTitle.textContent = 'Videoyu Düzenle';
      document.getElementById('video-id').value = video.id;
      document.getElementById('video-title').value = video.title;
      document.getElementById('video-youtube-id').value = video.youtubeId;
      document.getElementById('video-channel').value = video.channel;
      document.getElementById('video-category').value = video.category;
      document.getElementById('video-category-id').value = video.categoryId;
      document.getElementById('video-duration').value = video.duration;
      document.getElementById('video-level').value = video.level;
      document.getElementById('video-desc').value = video.description;
    } else {
      videoModalTitle.textContent = 'Yeni Video Ekle';
      document.getElementById('video-id').value = '';
    }
    
    videoModal.style.display = 'flex';
  }

  function closeVideoForm() {
    if (videoModal) videoModal.style.display = 'none';
  }

  function openResourceForm(resource) {
    if (!resourceForm) return;
    resourceForm.reset();
    
    if (resource) {
      resourceModalTitle.textContent = 'Kaynağı Düzenle';
      document.getElementById('resource-id').value = resource.id;
      document.getElementById('resource-title').value = resource.title;
      document.getElementById('resource-badge').value = resource.badge;
      document.getElementById('resource-icon').value = resource.icon;
      document.getElementById('resource-url').value = resource.url;
      document.getElementById('resource-desc').value = resource.description;
    } else {
      resourceModalTitle.textContent = 'Yeni Kaynak Ekle';
      document.getElementById('resource-id').value = '';
    }
    
    resourceModal.style.display = 'flex';
  }

  function closeResourceForm() {
    if (resourceModal) resourceModal.style.display = 'none';
  }

  // Common Notification
  function showNotification(message, type) {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      alert(message);
    }
  }
});
