// Yapay Zeka Vitrini — AI Danışman Chatbot Modülü
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  // Chatbot HTML Arayüzünü Dinamik Olarak Enjekte Et
  const chatbotHtml = `
    <!-- Floating Chat Bubble -->
    <button class="ai-advisor-bubble" id="ai-advisor-bubble" title="AI Danışman'a Sor">
      <span class="bubble-icon">💬</span>
      <span class="bubble-badge">AI</span>
    </button>

    <!-- Chat Box Window -->
    <div class="ai-advisor-chatbox" id="ai-advisor-chatbox">
      <div class="chatbox-header">
        <div class="header-info">
          <span class="avatar-icon">🧠</span>
          <div>
            <h4>AI Danışman</h4>
            <span class="status-indicator">çevrimiçi</span>
          </div>
        </div>
        <button class="btn-close-chatbox" id="btn-close-chatbox">&times;</button>
      </div>
      
      <div class="chatbox-body" id="chatbox-body">
        <div class="chat-message system">
          <p>Merhaba! Ben AIvitrin'in akıllı danışmanıyım. 🤖</p>
          <p>İhtiyacınız olan yapay zeka aracı türünü yazın, size en popüler ve uygun alternatifleri hemen önereyim. (Örn: <em>"Resim çizen ücretsiz araçlar"</em> veya <em>"Kod yazma asistanı"</em>)</p>
        </div>
      </div>
      
      <div class="chatbox-footer">
        <form id="chatbox-form" style="display:flex; width:100%; gap:8px;">
          <input type="text" id="chatbox-input" placeholder="Mesajınızı yazın..." autocomplete="off" required>
          <button type="submit" class="btn-chatbox-send" id="btn-chatbox-send" title="Gönder">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.innerHTML = chatbotHtml;
  while (div.firstChild) {
    document.body.appendChild(div.firstChild);
  }

  const bubble = document.getElementById('ai-advisor-bubble');
  const chatbox = document.getElementById('ai-advisor-chatbox');
  const btnClose = document.getElementById('btn-close-chatbox');
  const chatForm = document.getElementById('chatbox-form');
  const chatInput = document.getElementById('chatbox-input');
  const chatBody = document.getElementById('chatbox-body');

  function toggleChatbox() {
    chatbox.classList.toggle('active');
    if (chatbox.classList.contains('active')) {
      chatInput.focus();
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }

  if (bubble) bubble.addEventListener('click', toggleChatbox);
  if (btnClose) btnClose.addEventListener('click', () => chatbox.classList.remove('active'));

  // Close chatbox on click outside
  document.addEventListener('click', function (e) {
    if (chatbox && bubble && !chatbox.contains(e.target) && !bubble.contains(e.target) && chatbox.classList.contains('active')) {
      chatbox.classList.remove('active');
    }
  });

  // Submit message
  if (chatForm) {
    chatForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;

      // Append user message
      appendMessage('user', message);
      chatInput.value = '';

      // Append typing indicator
      const typingId = appendTypingIndicator();
      chatBody.scrollTop = chatBody.scrollHeight;

      try {
        const res = await fetch('/api/advisor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        });
        
        removeTypingIndicator(typingId);

        if (res.ok) {
          const data = await res.json();
          appendMessage('system', data.reply, data.recommended_tools);
        } else {
          appendMessage('system', 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.');
        }
      } catch (err) {
        removeTypingIndicator(typingId);
        appendMessage('system', 'Bağlantı hatası oluştu. Lütfen internetinizi kontrol edin.');
      }
      
      chatBody.scrollTop = chatBody.scrollHeight;
    });
  }

  function appendMessage(sender, text, tools) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}`;
    
    // Parse simple markdown-like syntax for bold or lists if any
    let formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    let htmlContent = `<p>${formattedText}</p>`;

    // If there are recommended tools, append them as cards
    if (tools && tools.length > 0) {
      htmlContent += `
        <div class="chat-tool-recommendations">
          ${tools.map(t => {
            const pricingLabel = t.pricing === 'ucretsiz' ? 'Ücretsiz' : t.pricing === 'freemium' ? 'Freemium' : 'Ücretli';
            return `
              <div class="chat-tool-card" data-url="${t.url}" style="cursor:pointer">
                <div class="card-top">
                  <span class="tool-icon-mini">${t.name.charAt(0).toUpperCase()}</span>
                  <div class="card-name-group">
                    <h5>${t.name}</h5>
                    <span class="tool-cat-mini">${t.category_icon || '📁'} ${t.category_name || ''}</span>
                  </div>
                </div>
                <p class="tool-desc-mini">${t.description.substring(0, 75)}...</p>
                <div class="card-bottom">
                  <span class="tool-badge-mini pricing-${t.pricing}">${pricingLabel}</span>
                  <span class="tool-badge-mini tr-${t.turkish_supported || 'none'}">🇹🇷 ${t.turkish_supported === 'full' ? 'Türkçe' : t.turkish_supported === 'partial' ? 'Kısmi' : 'İngilizce'}</span>
                  <a href="/tool/${t.id}" class="btn-tool-visit" target="_blank">İncele</a>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    msgDiv.innerHTML = htmlContent;
    chatBody.appendChild(msgDiv);

    // Bind click events to mini tool cards inside chat
    msgDiv.querySelectorAll('.chat-tool-card').forEach(card => {
      card.addEventListener('click', function (e) {
        if (e.target.closest('.btn-tool-visit')) return;
        const url = this.getAttribute('data-url');
        if (url) window.open(url, '_blank', 'noopener');
      });
    });
  }

  function appendTypingIndicator() {
    const id = 'typing_' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message system typing';
    typingDiv.id = id;
    typingDiv.innerHTML = `
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    chatBody.appendChild(typingDiv);
    return id;
  }

  function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.parentNode.removeChild(el);
  }
});
