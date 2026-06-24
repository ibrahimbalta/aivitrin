// Yapay Zeka Vitrini — Admin Panel
'use strict';

// ─── MOBILE LAYOUT INTEGRATION ───────────────
(function () {
  var layout = document.querySelector('.admin-layout');
  if (!layout) return;

  // Create mobile header bar
  var mobileHeader = document.createElement('div');
  mobileHeader.className = 'admin-mobile-header';
  mobileHeader.innerHTML = `
    <button id="admin-menu-toggle" aria-label="Menüyü Aç">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
    <div class="mobile-logo-text">AiKlavuz Yönetim</div>
    <div style="width:24px;"></div>
  `;

  // Insert mobile header at the beginning of document.body
  document.body.insertBefore(mobileHeader, document.body.firstChild);

  // Bind toggle action
  var toggleBtn = document.getElementById('admin-menu-toggle');
  var sidebar = document.querySelector('.admin-sidebar');
  
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });

    // Close sidebar on click outside
    document.addEventListener('click', function (e) {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });

    // Close sidebar on click of sidebar link
    sidebar.querySelectorAll('.sidebar-nav a').forEach(function(link) {
      link.addEventListener('click', function() {
        sidebar.classList.remove('open');
      });
    });
  }
})();

// ─── AUTH & LOGOUT ──────────────────────────
fetch('/auth/check').then(function(r){return r.json()}).then(function(d){
  if(!d.authenticated) window.location.href='/admin/login.html';
}).catch(function(){window.location.href='/admin/login.html'});

var logoutBtn = document.getElementById('btn-logout');
if(logoutBtn){
  logoutBtn.addEventListener('click', async function(){
    await fetch('/auth/logout',{method:'POST'});
    window.location.href='/admin/login.html';
  });
}

// ─── SUBMISSIONS BADGE COUNT ────────────────
async function updateSidebarSubmissionsBadge() {
  try {
    var res = await fetch('/api/stats');
    var stats = await res.json();
    var badge = document.getElementById('nav-sub-count');
    if (badge) {
      if (stats.pendingSubmissions > 0) {
        badge.textContent = stats.pendingSubmissions;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch(e) {}
}
updateSidebarSubmissionsBadge();
window.updateSidebarSubmissionsBadge = updateSidebarSubmissionsBadge;

// ─── TOAST ──────────────────────────────────
function showToast(message, type) {
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + (type || 'success');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(function(){
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(function(){ if(toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  }, 3000);
}

// ─── SLUG GENERATOR ─────────────────────────
function generateSlug(text) {
  return text.toLowerCase()
    .replace(/ı/g,'i').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').trim();
}

// ═══════════════════════════════════════════
// ARAÇ YÖNETİMİ (tools.html)
// ═══════════════════════════════════════════
var toolsTableBody = document.getElementById('tools-table-body');
if (toolsTableBody) {
  var allTools = [];
  var allCategories = [];
  var editingToolId = null;
  var deletingToolId = null;

  // DOM refs
  var toolSearch = document.getElementById('tool-search');
  var toolCategoryFilter = document.getElementById('tool-category-filter');
  var btnAddTool = document.getElementById('btn-add-tool');
  var toolModal = document.getElementById('tool-modal');
  var modalTitle = document.getElementById('modal-title');
  var modalClose = document.getElementById('modal-close');
  var modalCancel = document.getElementById('modal-cancel');
  var modalSave = document.getElementById('modal-save');
  var deleteModal = document.getElementById('delete-modal');
  var deleteModalClose = document.getElementById('delete-modal-close');
  var deleteCancel = document.getElementById('delete-cancel');
  var deleteConfirm = document.getElementById('delete-confirm');
  var deleteToolName = document.getElementById('delete-tool-name');

  async function loadTools() {
    try {
      var res = await fetch('/api/tools');
      var data = await res.json();
      allTools = data.tools || data;
      renderToolsTable(allTools);
    } catch(e) { showToast('Araçlar yüklenemedi','error'); }
  }

  async function loadCategoriesForSelect() {
    try {
      var res = await fetch('/api/categories');
      allCategories = await res.json();
      var catSelect = document.getElementById('tool-category');
      if(catSelect) {
        catSelect.innerHTML = '<option value="">Kategori seçin</option>' + allCategories.map(function(c){
          return '<option value="'+c.id+'">'+c.icon+' '+c.name+'</option>';
        }).join('');
      }
      if(toolCategoryFilter) {
        toolCategoryFilter.innerHTML = '<option value="">Tüm Kategoriler</option>' + allCategories.map(function(c){
          return '<option value="'+c.id+'">'+c.icon+' '+c.name+'</option>';
        }).join('');
      }
    } catch(e) { console.error(e); }
  }

  function renderToolsTable(tools) {
    if(tools.length === 0) {
      toolsTableBody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>Henüz araç eklenmemiş.</p></td></tr>';
      return;
    }
    toolsTableBody.innerHTML = tools.map(function(t){
      var tags = typeof t.tags === 'string' ? JSON.parse(t.tags||'[]') : (t.tags||[]);
      var pLabel = t.pricing==='ucretsiz'?'Ücretsiz':t.pricing==='freemium'?'Freemium':'Ücretli';
      var status = '';
      if(t.featured) status += '⭐ ';
      if(t.is_new) status += '🆕 ';
      if(t.show_in_slider) status += '🎠 ';
      return '<tr>' +
        '<td><strong>'+t.name+'</strong></td>' +
        '<td>'+(t.category_name||t.category_id||'')+'</td>' +
        '<td><span class="badge badge-'+t.pricing+'">'+pLabel+'</span></td>' +
        '<td>⭐ '+t.rating+'</td>' +
        '<td>'+status+'</td>' +
        '<td class="table-actions">' +
          '<button class="btn-edit" data-id="'+t.id+'">Düzenle</button>' +
          '<button class="btn-delete" data-id="'+t.id+'" data-name="'+t.name+'">Sil</button>' +
        '</td></tr>';
    }).join('');

    // Edit buttons
    toolsTableBody.querySelectorAll('.btn-edit').forEach(function(btn){
      btn.addEventListener('click', function(){ openEditTool(this.dataset.id); });
    });
    // Delete buttons
    toolsTableBody.querySelectorAll('.btn-delete').forEach(function(btn){
      btn.addEventListener('click', function(){
        deletingToolId = this.dataset.id;
        deleteToolName.textContent = this.dataset.name;
        deleteModal.classList.add('active');
      });
    });
  }

  // Search & Filter
  function filterTools() {
    var search = (toolSearch?toolSearch.value:'').toLowerCase();
    var cat = toolCategoryFilter?toolCategoryFilter.value:'';
    var filtered = allTools.filter(function(t){
      if(cat && (t.category_id||t.category) !== cat) return false;
      if(search && t.name.toLowerCase().indexOf(search)===-1 && t.description.toLowerCase().indexOf(search)===-1) return false;
      return true;
    });
    renderToolsTable(filtered);
  }
  if(toolSearch) toolSearch.addEventListener('input', filterTools);
  if(toolCategoryFilter) toolCategoryFilter.addEventListener('change', filterTools);

  // Modal open/close
  function openModal() { toolModal.classList.add('active'); }
  function closeModal() { toolModal.classList.remove('active'); editingToolId = null; }
  if(modalClose) modalClose.addEventListener('click', closeModal);
  if(modalCancel) modalCancel.addEventListener('click', closeModal);

  // Add tool
  if(btnAddTool) {
    btnAddTool.addEventListener('click', function(){
      editingToolId = null;
      modalTitle.textContent = 'Yeni Araç Ekle';
      document.getElementById('tool-edit-id').value = '';
      document.getElementById('tool-name').value = '';
      document.getElementById('tool-url').value = '';
      document.getElementById('tool-description').value = '';
      document.getElementById('tool-category').value = '';
      document.getElementById('tool-pricing').value = 'freemium';
      document.getElementById('tool-rating').value = '4.5';
      document.getElementById('tool-tags').value = '';
      document.getElementById('tool-featured').checked = false;
      document.getElementById('tool-is-new').checked = false;
      document.getElementById('tool-show-in-slider').checked = false;
      openModal();
    });
  }

  // Edit tool
  async function openEditTool(id) {
    try {
      var res = await fetch('/api/tools/' + id);
      var t = await res.json();
      editingToolId = id;
      modalTitle.textContent = 'Aracı Düzenle';
      document.getElementById('tool-edit-id').value = t.id;
      document.getElementById('tool-name').value = t.name;
      document.getElementById('tool-url').value = t.url;
      document.getElementById('tool-description').value = t.description;
      document.getElementById('tool-category').value = t.category_id||'';
      document.getElementById('tool-pricing').value = t.pricing;
      document.getElementById('tool-rating').value = t.rating;
      var tags = typeof t.tags==='string'?JSON.parse(t.tags||'[]'):(t.tags||[]);
      document.getElementById('tool-tags').value = tags.join(', ');
      document.getElementById('tool-featured').checked = !!t.featured;
      document.getElementById('tool-is-new').checked = !!t.is_new;
      document.getElementById('tool-show-in-slider').checked = !!t.show_in_slider;
      openModal();
    } catch(e) { showToast('Araç yüklenemedi','error'); }
  }

  // Save tool
  if(modalSave) {
    modalSave.addEventListener('click', async function(){
      var name = document.getElementById('tool-name').value.trim();
      var url = document.getElementById('tool-url').value.trim();
      var desc = document.getElementById('tool-description').value.trim();
      var cat = document.getElementById('tool-category').value;
      var pricing = document.getElementById('tool-pricing').value;
      var rating = parseFloat(document.getElementById('tool-rating').value) || 4.0;
      var tagsStr = document.getElementById('tool-tags').value;
      var tags = tagsStr ? tagsStr.split(',').map(function(s){return s.trim()}).filter(Boolean) : [];
      var featured = document.getElementById('tool-featured').checked;
      var isNew = document.getElementById('tool-is-new').checked;
      var showInSlider = document.getElementById('tool-show-in-slider').checked;

      if(!name || !url || !desc || !cat) { showToast('Tüm zorunlu alanları doldurun.','error'); return; }

      var body = { name:name, description:desc, category_id:cat, tags:tags, pricing:pricing, rating:rating, url:url, featured:featured, is_new:isNew, show_in_slider:showInSlider };

      try {
        var res;
        if(editingToolId) {
          res = await fetch('/api/tools/'+editingToolId, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        } else {
          body.id = generateSlug(name);
          res = await fetch('/api/tools', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        }
        var data = await res.json();
        if(data.success) {
          showToast(editingToolId ? 'Araç güncellendi!' : 'Araç eklendi!', 'success');
          closeModal();
          loadTools();
        } else {
          showToast(data.error || data.message || 'Hata oluştu.','error');
        }
      } catch(e) { showToast('Sunucu hatası.','error'); }
    });
  }

  // Delete tool
  function closeDeleteModal() { deleteModal.classList.remove('active'); deletingToolId = null; }
  if(deleteModalClose) deleteModalClose.addEventListener('click', closeDeleteModal);
  if(deleteCancel) deleteCancel.addEventListener('click', closeDeleteModal);
  if(deleteConfirm) {
    deleteConfirm.addEventListener('click', async function(){
      if(!deletingToolId) return;
      try {
        var res = await fetch('/api/tools/'+deletingToolId, {method:'DELETE'});
        var data = await res.json();
        if(data.success) { showToast('Araç silindi!','success'); closeDeleteModal(); loadTools(); }
        else { showToast(data.error||'Silinemedi.','error'); }
      } catch(e) { showToast('Sunucu hatası.','error'); }
    });
  }

  // Init
  loadCategoriesForSelect();
  loadTools();
}

// ═══════════════════════════════════════════
// KATEGORİ YÖNETİMİ (categories.html)
// ═══════════════════════════════════════════
var categoriesTableBody = document.getElementById('categories-table-body');
if (categoriesTableBody) {
  var editingCatId = null;
  var deletingCatId = null;

  var btnAddCategory = document.getElementById('btn-add-category');
  var catModal = document.getElementById('category-modal');
  var catModalTitle = document.getElementById('cat-modal-title');
  var catModalClose = document.getElementById('cat-modal-close');
  var catModalCancel = document.getElementById('cat-modal-cancel');
  var catModalSave = document.getElementById('cat-modal-save');
  var catDeleteModal = document.getElementById('cat-delete-modal');
  var catDeleteClose = document.getElementById('cat-delete-close');
  var catDeleteCancel = document.getElementById('cat-delete-cancel');
  var catDeleteConfirm = document.getElementById('cat-delete-confirm');
  var deleteCatName = document.getElementById('delete-cat-name');

  async function loadCategories() {
    try {
      var res = await fetch('/api/categories');
      var cats = await res.json();
      if(cats.length === 0) {
        categoriesTableBody.innerHTML = '<tr><td colspan="5" class="empty-state"><p>Henüz kategori eklenmemiş.</p></td></tr>';
        return;
      }
      categoriesTableBody.innerHTML = cats.map(function(c){
        return '<tr>' +
          '<td style="font-size:1.5rem">'+c.icon+'</td>' +
          '<td><strong>'+c.name+'</strong></td>' +
          '<td><code style="color:var(--text-muted)">'+c.id+'</code></td>' +
          '<td>'+c.count+' araç</td>' +
          '<td class="table-actions">' +
            '<button class="btn-edit" data-id="'+c.id+'" data-name="'+c.name+'" data-icon="'+c.icon+'" data-sort="'+(c.sort_order||0)+'">Düzenle</button>' +
            '<button class="btn-delete" data-id="'+c.id+'" data-name="'+c.name+'">Sil</button>' +
          '</td></tr>';
      }).join('');

      categoriesTableBody.querySelectorAll('.btn-edit').forEach(function(btn){
        btn.addEventListener('click', function(){
          editingCatId = this.dataset.id;
          catModalTitle.textContent = 'Kategoriyi Düzenle';
          document.getElementById('cat-original-id').value = this.dataset.id;
          document.getElementById('cat-id').value = this.dataset.id;
          document.getElementById('cat-id').readOnly = true;
          document.getElementById('cat-name').value = this.dataset.name;
          document.getElementById('cat-icon').value = this.dataset.icon;
          document.getElementById('cat-sort').value = this.dataset.sort;
          catModal.classList.add('active');
        });
      });
      categoriesTableBody.querySelectorAll('.btn-delete').forEach(function(btn){
        btn.addEventListener('click', function(){
          deletingCatId = this.dataset.id;
          deleteCatName.textContent = this.dataset.name;
          catDeleteModal.classList.add('active');
        });
      });
    } catch(e) { showToast('Kategoriler yüklenemedi','error'); }
  }

  function closeCatModal() { catModal.classList.remove('active'); editingCatId = null; document.getElementById('cat-id').readOnly = false; }
  if(catModalClose) catModalClose.addEventListener('click', closeCatModal);
  if(catModalCancel) catModalCancel.addEventListener('click', closeCatModal);

  if(btnAddCategory) {
    btnAddCategory.addEventListener('click', function(){
      editingCatId = null;
      catModalTitle.textContent = 'Yeni Kategori Ekle';
      document.getElementById('cat-original-id').value = '';
      document.getElementById('cat-id').value = '';
      document.getElementById('cat-id').readOnly = false;
      document.getElementById('cat-name').value = '';
      document.getElementById('cat-icon').value = '';
      document.getElementById('cat-sort').value = '0';
      catModal.classList.add('active');
    });
  }

  if(catModalSave) {
    catModalSave.addEventListener('click', async function(){
      var id = document.getElementById('cat-id').value.trim();
      var name = document.getElementById('cat-name').value.trim();
      var icon = document.getElementById('cat-icon').value.trim();
      var sort = parseInt(document.getElementById('cat-sort').value) || 0;
      if(!id||!name||!icon) { showToast('Tüm zorunlu alanları doldurun.','error'); return; }

      var body = { id:id, name:name, icon:icon, sort_order:sort };
      try {
        var res;
        if(editingCatId) {
          res = await fetch('/api/categories/'+editingCatId, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        } else {
          res = await fetch('/api/categories', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        }
        var data = await res.json();
        if(data.success) { showToast(editingCatId?'Kategori güncellendi!':'Kategori eklendi!','success'); closeCatModal(); loadCategories(); }
        else { showToast(data.error||'Hata oluştu.','error'); }
      } catch(e) { showToast('Sunucu hatası.','error'); }
    });
  }

  function closeCatDeleteModal() { catDeleteModal.classList.remove('active'); deletingCatId = null; }
  if(catDeleteClose) catDeleteClose.addEventListener('click', closeCatDeleteModal);
  if(catDeleteCancel) catDeleteCancel.addEventListener('click', closeCatDeleteModal);
  if(catDeleteConfirm) {
    catDeleteConfirm.addEventListener('click', async function(){
      if(!deletingCatId) return;
      try {
        var res = await fetch('/api/categories/'+deletingCatId, {method:'DELETE'});
        var data = await res.json();
        if(data.success) { showToast('Kategori silindi!','success'); closeCatDeleteModal(); loadCategories(); }
        else { showToast(data.error||'Silinemedi.','error'); }
      } catch(e) { showToast('Sunucu hatası.','error'); }
    });
  }

  loadCategories();
}
