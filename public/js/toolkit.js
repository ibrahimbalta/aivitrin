// Yapay Zeka Vitrini — AI Çantam (Toolkit) Modülü
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  let allTools = [];
  let categories = [];
  let authCallback = null;
  let activeTab = 'login';
  let activeDrawerTab = 'bookmarks'; // 'bookmarks' veya 'collections'

  // Global Auth variables
  window.isUserLoggedIn = false;
  window.currentUser = null;

  // Drawer & Auth Modal HTML
  const dynamicHtml = `
    <!-- AI Çantam Drawer -->
    <div class="toolkit-drawer" id="toolkit-drawer">
      <div class="drawer-header">
        <h3>🎒 AI Çantam</h3>
        <div style="display:flex;align-items:center;gap:10px">
          <span class="user-display" id="user-display" style="font-size:0.8rem;color:var(--text-secondary)"></span>
          <button class="btn-toolkit-logout" id="btn-toolkit-logout" title="Çıkış Yap" style="font-size:0.75rem;color:var(--accent-red);background:rgba(239,68,68,0.1);padding:4px 8px;border-radius:4px;display:none;border:none;cursor:pointer;">Çıkış</button>
          <button class="btn-close-drawer" id="btn-close-toolkit" style="border:none;background:none;cursor:pointer;">&times;</button>
        </div>
      </div>
      
      <!-- Drawer Tabs -->
      <div class="drawer-tabs" style="display:flex; background:rgba(255,255,255,0.02); border-bottom:1px solid var(--border-color)">
        <button class="drawer-tab active" id="tab-drawer-bookmarks" style="flex:1; background:none; border:none; padding:12px; color:var(--text-primary); font-size:0.85rem; font-weight:600; cursor:pointer; border-bottom:2px solid var(--accent-purple);">🎒 Tüm Çantam</button>
        <button class="drawer-tab" id="tab-drawer-collections" style="flex:1; background:none; border:none; padding:12px; color:var(--text-muted); font-size:0.85rem; font-weight:600; cursor:pointer; border-bottom:2px solid transparent;">📁 Koleksiyonlar</button>
      </div>

      <div class="drawer-body" id="toolkit-drawer-body">
        <div class="loader">Yükleniyor...</div>
      </div>
      <div class="drawer-footer" style="display:flex; gap:10px; padding:16px;">
        <button class="btn-toolkit-share" id="btn-toolkit-share" style="flex:1; padding:12px; font-size:0.85rem; font-weight:600; background:var(--gradient-primary); border:none; color:white; border-radius:var(--radius-sm); cursor:pointer;">🔗 Çantamı Paylaş</button>
        <button class="btn-toolkit-export" id="btn-toolkit-export" style="padding:12px; font-size:0.85rem; background:rgba(255,255,255,0.03); border:1px solid var(--border-color); color:var(--text-secondary); border-radius:var(--radius-sm); cursor:pointer;">JSON</button>
      </div>
    </div>
    <div class="toolkit-backdrop" id="toolkit-backdrop"></div>

    <!-- Auth Modal (Giriş Yap / Üye Ol) -->
    <div class="modal-overlay" id="auth-modal" style="z-index: 2000; display: none;">
      <div class="modal" style="max-width: 400px; background: rgba(14, 16, 29, 0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-card); position: relative;">
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 id="auth-modal-title" style="font-family: 'Outfit', sans-serif; font-size: 1.25rem;">🎒 AI Çantam — Giriş Yap</h3>
          <button class="modal-close" id="btn-close-auth" style="border: none; background: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary);">&times;</button>
        </div>
        <div class="modal-body">
          <div class="auth-tabs" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
            <button class="auth-tab active" id="tab-login" style="flex: 1; text-align: center; font-weight: 600; padding: 8px; border-radius: var(--radius-sm);">Giriş Yap</button>
            <button class="auth-tab" id="tab-register" style="flex: 1; text-align: center; font-weight: 600; padding: 8px; border-radius: var(--radius-sm);">Kayıt Ol</button>
          </div>
          <form class="modal-form" id="auth-form" style="display: flex; flex-direction: column; gap: 15px;">
            <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
              <label for="auth-username" style="font-size: 0.85rem; color: var(--text-secondary);">Kullanıcı Adı</label>
              <input type="text" id="auth-username" required placeholder="Kullanıcı adınız" style="width: 100%; padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary); font-family: inherit;">
            </div>
            <div class="form-group" style="display: flex; flex-direction: column; gap: 6px;">
              <label for="auth-password" style="font-size: 0.85rem; color: var(--text-secondary);">Şifre</label>
              <input type="password" id="auth-password" required placeholder="Şifreniz (En az 6 karakter)" style="width: 100%; padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary); font-family: inherit;">
            </div>
            <div class="auth-error" id="auth-error-msg" style="color: var(--accent-red); font-size: 0.85rem; display: none;"></div>
            <button type="submit" class="btn-primary" id="btn-auth-submit" style="background: var(--gradient-primary); border: none; color: white; font-weight: 600; padding: 12px; border-radius: var(--radius-md); width: 100%; cursor: pointer; transition: var(--transition-fast);">Giriş Yap</button>
          </form>
        </div>
      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.innerHTML = dynamicHtml;
  while (div.firstChild) {
    document.body.appendChild(div.firstChild);
  }

  const drawer = document.getElementById('toolkit-drawer');
  const backdrop = document.getElementById('toolkit-backdrop');
  const btnClose = document.getElementById('btn-close-toolkit');
  const drawerBody = document.getElementById('toolkit-drawer-body');
  const btnExport = document.getElementById('btn-toolkit-export');
  const btnShare = document.getElementById('btn-toolkit-share');

  const authModal = document.getElementById('auth-modal');
  const btnCloseAuth = document.getElementById('btn-close-auth');
  const authForm = document.getElementById('auth-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');

  const tabDrawerBookmarks = document.getElementById('tab-drawer-bookmarks');
  const tabDrawerCollections = document.getElementById('tab-drawer-collections');

  // Drawer Tab switching
  function switchDrawerTab(tab) {
    activeDrawerTab = tab;
    if (tab === 'bookmarks') {
      tabDrawerBookmarks.classList.add('active');
      tabDrawerBookmarks.style.color = 'var(--text-primary)';
      tabDrawerBookmarks.style.borderBottom = '2px solid var(--accent-purple)';
      tabDrawerCollections.classList.remove('active');
      tabDrawerCollections.style.color = 'var(--text-muted)';
      tabDrawerCollections.style.borderBottom = '2px solid transparent';
    } else {
      tabDrawerCollections.classList.add('active');
      tabDrawerCollections.style.color = 'var(--text-primary)';
      tabDrawerCollections.style.borderBottom = '2px solid var(--accent-purple)';
      tabDrawerBookmarks.classList.remove('active');
      tabDrawerBookmarks.style.color = 'var(--text-muted)';
      tabDrawerBookmarks.style.borderBottom = '2px solid transparent';
    }
    renderToolkitItems();
  }

  if (tabDrawerBookmarks) tabDrawerBookmarks.addEventListener('click', () => switchDrawerTab('bookmarks'));
  if (tabDrawerCollections) tabDrawerCollections.addEventListener('click', () => switchDrawerTab('collections'));

  // Open buttons
  const btnOpen = document.getElementById('nav-toolkit-btn');
  const btnOpenMobile = document.getElementById('mobile-toolkit-btn');

  function openDrawer() {
    if (!window.isUserLoggedIn) {
      window.showAuthModal(() => {
        openDrawer();
      });
      return;
    }
    drawer.classList.add('active');
    backdrop.classList.add('active');
    renderToolkitItems();
  }

  function closeDrawer() {
    drawer.classList.remove('active');
    backdrop.classList.remove('active');
  }

  if (btnOpen) btnOpen.addEventListener('click', function(e) { e.preventDefault(); openDrawer(); });
  if (btnOpenMobile) btnOpenMobile.addEventListener('click', function(e) { e.preventDefault(); openDrawer(); });
  if (btnClose) btnClose.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  // Auth Modal Actions
  window.showAuthModal = function (callback) {
    authCallback = callback;
    authModal.style.display = 'flex';
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-error-msg').style.display = 'none';
    switchTab('login');
  };

  function closeAuthModal() {
    authModal.style.display = 'none';
  }

  if (btnCloseAuth) btnCloseAuth.addEventListener('click', closeAuthModal);

  function switchTab(tab) {
    activeTab = tab;
    const btnSubmit = document.getElementById('btn-auth-submit');
    const modalTitle = document.getElementById('auth-modal-title');

    if (tab === 'login') {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      btnSubmit.textContent = 'Giriş Yap';
      modalTitle.textContent = '🎒 AI Çantam — Giriş Yap';
    } else {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      btnSubmit.textContent = 'Kayıt Ol';
      modalTitle.textContent = '🎒 AI Çantam — Üye Ol';
    }
  }

  if (tabLogin) tabLogin.addEventListener('click', () => switchTab('login'));
  if (tabRegister) tabRegister.addEventListener('click', () => switchTab('register'));

  if (authForm) {
    authForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const usernameInput = document.getElementById('auth-username');
      const passwordInput = document.getElementById('auth-password');
      const errorEl = document.getElementById('auth-error-msg');
      
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      
      errorEl.style.display = 'none';
      errorEl.textContent = '';

      const endpoint = activeTab === 'login' ? '/auth/login' : '/auth/register';
      
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const data = await res.json();
        
        if (res.ok && data.success) {
          window.isUserLoggedIn = true;
          window.currentUser = username;
          
          await syncBookmarksFromServer();
          closeAuthModal();
          
          if (typeof showToast === 'function') {
            showToast(activeTab === 'login' ? 'Giriş başarılı!' : 'Kayıt ve giriş başarılı!', 'success');
          }
          
          updateHeaderAuthUI();

          if (authCallback) {
            authCallback();
            authCallback = null;
          }
        } else {
          errorEl.textContent = data.message || 'Bir hata oluştu.';
          errorEl.style.display = 'block';
        }
      } catch (err) {
        errorEl.textContent = 'Bağlantı hatası.';
        errorEl.style.display = 'block';
      }
    });
  }

  // Header auth displaying
  function updateHeaderAuthUI() {
    const userDisplay = document.getElementById('user-display');
    if (userDisplay) {
      userDisplay.textContent = window.isUserLoggedIn ? `👤 ${window.currentUser}` : '';
    }
    const logoutBtn = document.getElementById('btn-toolkit-logout');
    if (logoutBtn) {
      logoutBtn.style.display = window.isUserLoggedIn ? 'inline-block' : 'none';
    }
  }

  // Logout actions
  const logoutBtn = document.getElementById('btn-toolkit-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function () {
      try {
        const res = await fetch('/auth/logout', { method: 'POST' });
        if (res.ok) {
          window.isUserLoggedIn = false;
          window.currentUser = null;
          
          localStorage.removeItem('toolkit');
          localStorage.removeItem('toolkit_notes');
          localStorage.removeItem('toolkit_collections');
          
          updateBadgeCount();
          updateHeaderAuthUI();
          closeDrawer();
          
          window.dispatchEvent(new CustomEvent('toolkitUpdated'));
          
          if (typeof showToast === 'function') {
            showToast('Çıkış yapıldı.', 'success');
          }
        }
      } catch (e) {
        console.error('Logout failed:', e);
      }
    });
  }

  // Server sync logic
  async function syncBookmarksFromServer() {
    try {
      const res = await fetch('/api/my-toolkit');
      if (res.ok) {
        const data = await res.json();
        
        const localBookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
        const localNotes = JSON.parse(localStorage.getItem('toolkit_notes') || '{}');
        const localCollections = JSON.parse(localStorage.getItem('toolkit_collections') || '[]');
        
        const mergedBookmarks = [...new Set([...localBookmarks, ...data.bookmarks])];
        const mergedNotes = { ...localNotes, ...data.notes };
        const mergedCollections = data.collections && data.collections.length > 0 ? data.collections : localCollections;
        
        localStorage.setItem('toolkit', JSON.stringify(mergedBookmarks));
        localStorage.setItem('toolkit_notes', JSON.stringify(mergedNotes));
        localStorage.setItem('toolkit_collections', JSON.stringify(mergedCollections));
        
        if (localBookmarks.length > 0 || localCollections.length > 0) {
          await saveBookmarksToServer(mergedBookmarks, mergedNotes, mergedCollections);
        }
        
        // Sunucudan yüklenen yer imlerini kart durumlarına yansıtmak için olay fırlat
        window.dispatchEvent(new CustomEvent('toolkitUpdated', { detail: { source: 'server' } }));
      }
    } catch (e) {
      console.error('Bookmarks sync error:', e);
    }
  }

  async function saveBookmarksToServer(bookmarks, notes, collections) {
    if (!window.isUserLoggedIn) return;
    try {
      await fetch('/api/my-toolkit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarks, notes, collections: collections || [] })
      });
    } catch (e) {
      console.error('Bookmarks save error:', e);
    }
  }

  // Veri yükleme
  async function loadData() {
    try {
      const [catsRes, toolsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/tools')
      ]);
      categories = await catsRes.json();
      const toolsData = await toolsRes.json();
      allTools = toolsData.tools || toolsData;
      
      // Perform Auth Check on initialization
      await checkAuth();
    } catch (e) {
      console.error('Toolkit verisi yüklenemedi:', e);
    }
  }

  async function checkAuth() {
    try {
      const res = await fetch('/auth/check');
      const data = await res.json();
      window.isUserLoggedIn = data.authenticated;
      window.currentUser = data.username;
      
      if (window.isUserLoggedIn) {
        await syncBookmarksFromServer();
      }
      
      updateBadgeCount();
      updateHeaderAuthUI();
    } catch (e) {
      console.error('Auth check error:', e);
    }
  }

  loadData();

  // Badge sayısını güncelle
  function updateBadgeCount() {
    const bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
    const badges = document.querySelectorAll('.toolkit-count');
    badges.forEach(b => {
      b.textContent = bookmarks.length;
      if (bookmarks.length > 0) {
        b.style.display = 'inline-flex';
      } else {
        b.style.display = 'none';
      }
    });
  }

  // Toolkit güncellemelerini dinle ve sunucuya gönder
  window.addEventListener('toolkitUpdated', async function (e) {
    updateBadgeCount();
    const bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
    const notes = JSON.parse(localStorage.getItem('toolkit_notes') || '{}');
    const collections = JSON.parse(localStorage.getItem('toolkit_collections') || '[]');
    
    // Eğer güncelleme sunucu senkronizasyonundan gelmediyse sunucuya kaydet
    if (!e.detail || e.detail.source !== 'server') {
      await saveBookmarksToServer(bookmarks, notes, collections);
    }
    
    if (drawer && drawer.classList.contains('active')) {
      renderToolkitItems();
    }
  });

  // Yer imlerini çizdirme
  function renderToolkitItems() {
    const bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
    const notes = JSON.parse(localStorage.getItem('toolkit_notes') || '{}');
    const collections = JSON.parse(localStorage.getItem('toolkit_collections') || '[]');

    if (activeDrawerTab === 'bookmarks') {
      // 🎒 TÜM YER İMLERİ GÖRÜNÜMÜ
      if (bookmarks.length === 0) {
        drawerBody.innerHTML = `
          <div class="drawer-empty-state">
            <div class="empty-icon">🎒</div>
            <h4>Çantanız Boş</h4>
            <p>Vitrinimizdeki beğendiğiniz yapay zeka araçlarının altındaki yer imi simgesine basarak buraya ekleyebilirsiniz.</p>
          </div>
        `;
        return;
      }

      const bookmarkedTools = bookmarks.map(id => allTools.find(t => t.id === id)).filter(Boolean);

      drawerBody.innerHTML = bookmarkedTools.map(t => {
        const cat = categories.find(c => c.id === t.category_id);
        const catLabel = cat ? `${cat.icon} ${cat.name}` : '';
        const noteText = notes[t.id] || '';

        // Koleksiyon eşleştirme dropdown'ı
        const optionsHtml = collections.map(col => {
          const isSelected = col.bookmarks && col.bookmarks.includes(t.id) ? 'selected' : '';
          return `<option value="${col.id}" ${isSelected}>📁 ${col.name}</option>`;
        }).join('');

        return `
          <div class="drawer-item" data-id="${t.id}">
            <div class="drawer-item-main">
              <div class="item-info" style="cursor:pointer" onclick="window.location.href='/tool/${t.id}'">
                <h4>${t.name}</h4>
                <span class="item-cat">${catLabel}</span>
              </div>
              <div class="item-actions">
                <a href="${t.url}" target="_blank" rel="noopener" class="btn-item-link" title="Sitede Gör">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
                <button class="btn-item-delete" data-id="${t.id}" title="Sil">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
            
            <div class="drawer-item-col-select" style="margin-top:8px;">
              <select class="select-item-collection" data-id="${t.id}" style="width:100%; padding:6px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:var(--radius-sm); color:var(--text-primary); font-size:0.75rem;">
                <option value="">Koleksiyon: Yok (Genel)</option>
                ${optionsHtml}
              </select>
            </div>

            <!-- Kişisel Not Alanı -->
            <div class="drawer-item-note">
              <textarea placeholder="Bu araçla ilgili kişisel kullanım notlarınızı buraya yazın..." data-id="${t.id}">${noteText}</textarea>
            </div>
          </div>
        `;
      }).join('');

      // Silme dinleyicileri
      drawerBody.querySelectorAll('.btn-item-delete').forEach(btn => {
        btn.addEventListener('click', function () {
          const id = this.getAttribute('data-id');
          removeFromToolkit(id);
        });
      });

      // Not kaydetme dinleyicileri (auto-save on blur/change)
      drawerBody.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('input', function () {
          const id = this.getAttribute('data-id');
          const text = this.value;
          const currentNotes = JSON.parse(localStorage.getItem('toolkit_notes') || '{}');
          currentNotes[id] = text;
          localStorage.setItem('toolkit_notes', JSON.stringify(currentNotes));
          window.dispatchEvent(new CustomEvent('toolkitUpdated'));
        });
      });

      // Koleksiyon değiştirme dinleyicileri
      drawerBody.querySelectorAll('.select-item-collection').forEach(select => {
        select.addEventListener('change', function () {
          const toolId = this.getAttribute('data-id');
          const selectedColId = this.value;
          
          let currentCollections = JSON.parse(localStorage.getItem('toolkit_collections') || '[]');
          
          // Önce aracı tüm koleksiyonlardan çıkar
          currentCollections.forEach(c => {
            c.bookmarks = (c.bookmarks || []).filter(id => id !== toolId);
          });

          // Eğer bir koleksiyon seçildiyse ona ekle
          if (selectedColId) {
            const col = currentCollections.find(c => c.id === selectedColId);
            if (col) {
              if (!col.bookmarks) col.bookmarks = [];
              col.bookmarks.push(toolId);
            }
          }

          localStorage.setItem('toolkit_collections', JSON.stringify(currentCollections));
          window.dispatchEvent(new CustomEvent('toolkitUpdated'));
        });
      });

    } else {
      // 📁 KOLEKSİYONLAR GÖRÜNÜMÜ
      let collectionsHtml = `
        <div class="create-collection-box" style="padding:16px; background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:var(--radius-md); margin-bottom:20px;">
          <h5 style="margin-top:0; margin-bottom:10px;">New Collection</h5>
          <input type="text" id="new-col-name" placeholder="Koleksiyon Adı..." style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:var(--radius-sm); background:var(--bg-input); color:var(--text-primary); font-size:0.8rem; margin-bottom:8px;">
          <input type="text" id="new-col-desc" placeholder="Açıklama (isteğe bağlı)..." style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:var(--radius-sm); background:var(--bg-input); color:var(--text-primary); font-size:0.8rem; margin-bottom:10px;">
          <button class="btn-primary" id="btn-create-col" style="width:100%; padding:8px; font-size:0.8rem; background:var(--gradient-primary); border:none; color:white; border-radius:var(--radius-sm); cursor:pointer;">Oluştur</button>
        </div>
      `;

      if (collections.length === 0) {
        collectionsHtml += `
          <div class="drawer-empty-state">
            <div class="empty-icon">📁</div>
            <h4>Koleksiyon Yok</h4>
            <p>Henüz bir koleksiyon oluşturmadınız. Yukarıdaki panelden ilk koleksiyonunuzu oluşturun.</p>
          </div>
        `;
        drawerBody.innerHTML = collectionsHtml;
        bindCreateCollectionEvent();
        return;
      }

      collectionsHtml += collections.map(col => {
        const count = col.bookmarks ? col.bookmarks.length : 0;
        return `
          <div class="collection-item" data-id="${col.id}" style="padding:14px; background:rgba(255,255,255,0.01); border:1px solid var(--border-color); border-radius:var(--radius-md); margin-bottom:12px; display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h4 style="margin:0; font-family:'Outfit',sans-serif; font-size:0.95rem;">📂 ${col.name}</h4>
              <span style="font-size:0.75rem; color:var(--text-muted);">${count} araç</span>
            </div>
            ${col.description ? `<p style="margin:0; font-size:0.75rem; color:var(--text-secondary);">${col.description}</p>` : ''}
            <div style="display:flex; gap:10px; margin-top:6px;">
              <button class="btn-share-col" data-id="${col.id}" style="flex:1; padding:6px; font-size:0.75rem; background:rgba(6,182,212,0.1); border:1px solid var(--accent-cyan); color:var(--accent-cyan); border-radius:4px; cursor:pointer;">🔗 Paylaş</button>
              <button class="btn-delete-col" data-id="${col.id}" style="padding:6px 10px; font-size:0.75rem; background:rgba(239,68,68,0.1); border:1px solid var(--accent-red); color:var(--accent-red); border-radius:4px; cursor:pointer;">Sil</button>
            </div>
          </div>
        `;
      }).join('');

      drawerBody.innerHTML = collectionsHtml;
      bindCreateCollectionEvent();
      bindCollectionActions();
    }
  }

  function bindCreateCollectionEvent() {
    const btnCreate = document.getElementById('btn-create-col');
    if (btnCreate) {
      btnCreate.addEventListener('click', function () {
        const nameInput = document.getElementById('new-col-name');
        const descInput = document.getElementById('new-col-desc');
        const name = nameInput.value.trim();
        const desc = descInput.value.trim();

        if (!name) {
          if (typeof showToast === 'function') showToast('Koleksiyon adı boş olamaz.', 'error');
          return;
        }

        let currentCollections = JSON.parse(localStorage.getItem('toolkit_collections') || '[]');
        const id = 'col_item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        
        currentCollections.push({
          id,
          name,
          description: desc,
          bookmarks: []
        });

        localStorage.setItem('toolkit_collections', JSON.stringify(currentCollections));
        window.dispatchEvent(new CustomEvent('toolkitUpdated'));
        renderToolkitItems();
      });
    }
  }

  function bindCollectionActions() {
    // Silme
    drawerBody.querySelectorAll('.btn-delete-col').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        window.showConfirm('delete_collection_confirm', 'confirm_ok', 'confirm_cancel').then(function (confirmed) {
          if (confirmed) {
            let currentCollections = JSON.parse(localStorage.getItem('toolkit_collections') || '[]');
            currentCollections = currentCollections.filter(c => c.id !== id);
            localStorage.setItem('toolkit_collections', JSON.stringify(currentCollections));
            window.dispatchEvent(new CustomEvent('toolkitUpdated'));
            renderToolkitItems();
          }
        });
      });
    });

    // Paylaşma
    drawerBody.querySelectorAll('.btn-share-col').forEach(btn => {
      btn.addEventListener('click', async function () {
        const id = this.getAttribute('data-id');
        const currentCollections = JSON.parse(localStorage.getItem('toolkit_collections') || '[]');
        const col = currentCollections.find(c => c.id === id);

        if (!col) return;

        if (col.bookmarks.length === 0) {
          alert('Koleksiyon boş! Lütfen önce bu koleksiyona en az 1 yapay zeka aracı ekleyin.');
          return;
        }

        const self = this;
        self.disabled = true;
        self.textContent = 'Paylaşılıyor...';

        try {
          const res = await fetch('/api/collections/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: col.name,
              description: col.description,
              bookmarks: col.bookmarks
            })
          });
          const data = await res.json();
          if (data.success) {
            const shareUrl = `${window.location.origin}/collection?id=${data.collection_id}`;
            navigator.clipboard.writeText(shareUrl);
            alert(`Koleksiyon linki başarıyla kopyalandı! 🔗\n\nLink: ${shareUrl}`);
          } else {
            alert(data.error || 'Paylaşım sırasında bir hata oluştu.');
          }
        } catch(e) {
          alert('Bağlantı hatası oluştu.');
        } finally {
          self.disabled = false;
          self.textContent = '🔗 Paylaş';
        }
      });
    });
  }

  function removeFromToolkit(id) {
    let bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
    bookmarks = bookmarks.filter(item => item !== id);
    localStorage.setItem('toolkit', JSON.stringify(bookmarks));
    
    const currentNotes = JSON.parse(localStorage.getItem('toolkit_notes') || '{}');
    delete currentNotes[id];
    localStorage.setItem('toolkit_notes', JSON.stringify(currentNotes));

    // Ayrıca tüm koleksiyonlardan da kaldır
    let currentCollections = JSON.parse(localStorage.getItem('toolkit_collections') || '[]');
    currentCollections.forEach(c => {
      c.bookmarks = (c.bookmarks || []).filter(item => item !== id);
    });
    localStorage.setItem('toolkit_collections', JSON.stringify(currentCollections));

    window.dispatchEvent(new CustomEvent('toolkitUpdated'));
    renderToolkitItems();

    const cardBookmark = document.querySelectorAll(`.btn-card-bookmark[data-id="${id}"]`);
    cardBookmark.forEach(card => card.classList.remove('active'));
  }

  // Çantamı Paylaş
  if (btnShare) {
    btnShare.addEventListener('click', function () {
      const bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
      if (bookmarks.length === 0) {
        alert('Çantanız boş! Önce vitrindeki beğendiğiniz araçları çantanıza ekleyin.');
        return;
      }
      
      const shareUrl = `${window.location.origin}/collection.html?bag=${bookmarks.join(',')}`;
      
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(`Çantanızın paylaşım linki panoya kopyalandı! 🔗\n\nLink: ${shareUrl}`);
      }).catch(err => {
        prompt('Çantanızın paylaşım linki oluşturuldu. Buradan kopyalayabilirsiniz:', shareUrl);
      });
    });
  }

  // JSON Dışa Aktarma
  btnExport.addEventListener('click', function () {
    const bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
    const notes = JSON.parse(localStorage.getItem('toolkit_notes') || '{}');

    if (bookmarks.length === 0) {
      alert('Çantanız boş, dışa aktarılacak veri bulunamadı.');
      return;
    }

    const bookmarkedTools = bookmarks.map(id => allTools.find(t => t.id === id)).filter(Boolean);
    const exportData = bookmarkedTools.map(t => {
      return {
        id: t.id,
        name: t.name,
        category: t.category_id,
        url: t.url,
        description: t.description,
        personal_note: notes[t.id] || ''
      };
    });

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', 'aiklavuz-cantam.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });
});
