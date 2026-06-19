// Yapay Zeka Vitrini — AI Yol Arkadaşı (Asistan) Modülü
'use strict';

document.addEventListener('DOMContentLoaded', async function () {
  window.allTools = [];
  let categories = [];
  
  // Elementler
  const chatThread = document.getElementById('assistant-chat-thread');
  const welcomeScreen = document.getElementById('chat-welcome-screen');
  const chatForm = document.getElementById('assistant-chat-form');
  const chatInput = document.getElementById('assistant-chat-input');
  const btnNewChat = document.getElementById('btn-new-chat-sidebar');

  // API'den Araçları ve Kategorileri Yükle
  async function loadData() {
    try {
      const [catsRes, toolsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/tools')
      ]);
      categories = await catsRes.json();
      const toolsData = await toolsRes.json();
      window.allTools = toolsData.tools || toolsData;
      
      // Çanta listesini ilk kez doldur
      renderSidebarToolkit();
    } catch (e) {
      console.error('Veriler yüklenirken hata oluştu:', e);
    }
  }

  await loadData();

  // Çantadaki Araçları Dinamik Listeleme
  function renderSidebarToolkit() {
    const sidebarList = document.getElementById('sidebar-toolkit-list');
    if (!sidebarList) return;

    const bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
    if (bookmarks.length === 0) {
      sidebarList.innerHTML = `<span style="color:var(--text-muted); font-style:italic;">Çantanız boş.</span>`;
      return;
    }

    if (!window.allTools || window.allTools.length === 0) {
      sidebarList.innerHTML = `<span style="color:var(--text-muted);">Yükleniyor...</span>`;
      return;
    }

    const bookmarkedTools = bookmarks.map(id => window.allTools.find(t => t.id === id)).filter(Boolean);
    sidebarList.innerHTML = bookmarkedTools.map(t => {
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); padding:8px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-color); margin-bottom:6px;">
          <span style="font-weight:500; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:180px; font-size:0.8rem;">${t.name}</span>
          <button class="btn-remove-sidebar-tool" data-id="${t.id}" style="background:none; border:none; color:var(--accent-red); cursor:pointer; font-size:1.1rem; padding:0; line-height:1;" title="Çantadan Çıkar">&times;</button>
        </div>
      `;
    }).join('');

    // Çıkarma dinleyicileri
    sidebarList.querySelectorAll('.btn-remove-sidebar-tool').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const id = this.getAttribute('data-id');
        removeFromToolkit(id);
      });
    });
  }

  // Toolkit modülündeki güncellemeleri dinle
  window.addEventListener('toolkitUpdated', function () {
    renderSidebarToolkit();
    updateToolCardButtons();
  });

  // Çantaya Araç Ekleme
  function addToToolkit(toolId) {
    let bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
    if (!bookmarks.includes(toolId)) {
      bookmarks.push(toolId);
      localStorage.setItem('toolkit', JSON.stringify(bookmarks));
      window.dispatchEvent(new CustomEvent('toolkitUpdated'));
      if (typeof showToast === 'function') {
        showToast('Araç çantanıza eklendi!', 'success');
      }
      return true;
    }
    return false;
  }

  // Çantadan Araç Çıkarma
  function removeFromToolkit(toolId) {
    let bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
    bookmarks = bookmarks.filter(id => id !== toolId);
    localStorage.setItem('toolkit', JSON.stringify(bookmarks));
    window.dispatchEvent(new CustomEvent('toolkitUpdated'));
    if (typeof showToast === 'function') {
      showToast('Araç çantanızdan çıkarıldı.', 'info');
    }
  }

  // Input alanının yüksekliğini otomatik ayarla
  chatInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight - 10) + 'px';
  });

  // Enter tuşuna basıldığında (Shift+Enter hariç) gönder
  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  // Yeni Sohbet Başlat
  function startNewChat() {
    chatThread.innerHTML = '';
    chatThread.appendChild(welcomeScreen);
    welcomeScreen.style.display = 'block';
    chatInput.value = '';
    chatInput.style.height = 'auto';
    chatInput.focus();
  }

  if (btnNewChat) btnNewChat.addEventListener('click', startNewChat);

  // Öneri kartları ve Sidebar öğeleri dinleyicileri
  const suggestions = document.querySelectorAll('.suggestion-card, .history-item');
  suggestions.forEach(card => {
    card.addEventListener('click', function () {
      const promptText = this.getAttribute('data-prompt');
      if (promptText) {
        chatInput.value = promptText;
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight - 10) + 'px';
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  });

  // Mesaj Gönderme Formu
  chatForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    // Hoşgeldiniz ekranını gizle
    if (welcomeScreen.style.display !== 'none') {
      welcomeScreen.style.display = 'none';
    }

    // Kullanıcı mesajını ekle
    appendMessage('user', message);
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Yazıyor animasyonunu ekle
    const typingId = appendTypingIndicator();
    chatThread.scrollTop = chatThread.scrollHeight;

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      removeTypingIndicator(typingId);

      if (res.ok) {
        const data = await res.json();
        appendMessage('assistant', data.reply, data.recommended_tools);
      } else {
        appendMessage('assistant', 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen kısa bir süre sonra tekrar deneyin.');
      }
    } catch (err) {
      removeTypingIndicator(typingId);
      appendMessage('assistant', 'Bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
    }

    chatThread.scrollTop = chatThread.scrollHeight;
  });

  // Mesaj Ekleme Fonksiyonu
  function appendMessage(sender, text, tools) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${sender}`;

    const avatar = sender === 'user' ? '👤' : '🧠';
    
    // Markdown-like basit kalınlaştırma, eğik yazı ve satır kesmeleri
    let formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    let htmlContent = `
      <div class="msg-avatar">${avatar}</div>
      <div class="msg-bubble">
        <p>${formattedText}</p>
    `;

    // Önerilen araç kartlarını yerleştir
    if (tools && tools.length > 0) {
      htmlContent += `<div class="chat-recommended-tools">`;
      tools.forEach(t => {
        const bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
        const isAdded = bookmarks.includes(t.id);
        const pricingLabel = t.pricing === 'ucretsiz' ? 'Ücretsiz' : t.pricing === 'freemium' ? 'Freemium' : 'Ücretli';
        
        htmlContent += `
          <div class="assistant-tool-card" data-id="${t.id}">
            <div class="tool-card-left">
              <div class="tool-card-icon">${t.name.charAt(0)}</div>
              <div class="tool-card-info">
                <h5>${t.name}</h5>
                <p>${t.description.substring(0, 100)}...</p>
                <div class="tool-card-badges">
                  <span class="tool-badge-mini pricing-${t.pricing}">${pricingLabel}</span>
                  <span class="tool-badge-mini tr-${t.turkish_supported || 'none'}">🇹🇷 ${t.turkish_supported === 'full' ? 'Türkçe' : t.turkish_supported === 'partial' ? 'Kısmi' : 'İngilizce'}</span>
                </div>
              </div>
            </div>
            <div class="tool-card-right">
              <a href="/tool/${t.id}" target="_blank" class="btn-assistant-action primary">İncele</a>
              <button class="btn-assistant-action secondary btn-toggle-bag" data-id="${t.id}">
                ${isAdded ? '🎒 Çantadan Çıkar' : '🎒 Çantaya Ekle'}
              </button>
            </div>
          </div>
        `;
      });
      htmlContent += `</div>`;
    }

    htmlContent += `</div>`;
    msgDiv.innerHTML = htmlContent;
    chatThread.appendChild(msgDiv);

    // Çantaya Ekle/Çıkar butonlarını bağla
    msgDiv.querySelectorAll('.btn-toggle-bag').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const id = this.getAttribute('data-id');
        const bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
        if (bookmarks.includes(id)) {
          removeFromToolkit(id);
        } else {
          addToToolkit(id);
        }
      });
    });

    chatThread.scrollTop = chatThread.scrollHeight;
  }

  // Tüm kartların "Çantaya Ekle / Çıkar" buton yazılarını güncelle
  function updateToolCardButtons() {
    const bookmarks = JSON.parse(localStorage.getItem('toolkit') || '[]');
    document.querySelectorAll('.btn-toggle-bag').forEach(btn => {
      const id = btn.getAttribute('data-id');
      if (bookmarks.includes(id)) {
        btn.textContent = '🎒 Çantadan Çıkar';
      } else {
        btn.textContent = '🎒 Çantaya Ekle';
      }
    });
  }

  // Yazıyor Göstergesi
  function appendTypingIndicator() {
    const id = 'typing_' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-msg assistant typing-msg';
    typingDiv.id = id;
    typingDiv.innerHTML = `
      <div class="msg-avatar">🧠</div>
      <div class="msg-bubble">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    chatThread.appendChild(typingDiv);
    return id;
  }

  function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
});
