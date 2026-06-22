// Yapay Zeka Vitrini — AI Danışman Chatbot Modülü
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  const t = (key, fallback) => (window.i18n && typeof window.i18n.t === 'function') ? window.i18n.t(key) : fallback;

  // Chatbot HTML Arayüzünü Dinamik Olarak Enjekte Et
  const chatbotHtml = `
    <!-- Floating Chat Bubble -->
    <button class="ai-advisor-bubble" id="ai-advisor-bubble" title="AI Danışman'a Sor">
      <span class="bubble-icon" style="display:flex; align-items:center; justify-content:center;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          <path d="M12 7l1 2.5L15.5 10 13 11 12 13.5 11 11 8.5 10 11 9.5z" fill="currentColor"></path>
        </svg>
      </span>
      <span class="bubble-badge">AI</span>
    </button>

    <!-- Chat Box Window -->
    <div class="ai-advisor-chatbox" id="ai-advisor-chatbox">
      <div class="chatbox-header">
        <div class="header-info">
          <span class="avatar-icon">🧠</span>
          <div>
            <h4 data-i18n="advisor_title">AI Danışman</h4>
            <span class="status-indicator" data-i18n="advisor_status">çevrimiçi</span>
          </div>
        </div>
        <button class="btn-close-chatbox" id="btn-close-chatbox">&times;</button>
      </div>
      
      <div class="chatbox-body" id="chatbox-body">
        <div class="chat-message system">
          <p data-i18n="advisor_welcome_1">Merhaba! Ben AiKlavuz'in akıllı danışmanıyım. 🤖</p>
          <p data-i18n="advisor_welcome_2">İhtiyacınız olan yapay zeka aracı türünü yazın, size en popüler ve uygun alternatifleri hemen önereyim. (Örn: <em>"Resim çizen ücretsiz araçlar"</em> veya <em>"Kod yazma asistanı"</em>)</p>
        </div>
      </div>
      
      <div class="chatbox-footer">
        <form id="chatbox-form" style="display:flex; width:100%; gap:8px;">
          <input type="text" id="chatbox-input" placeholder="Mesajınızı yazın..." data-i18n-placeholder="advisor_input_placeholder" autocomplete="off" required>
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

  // Initial translation apply in case translations are already loaded
  if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
    window.i18n.applyTranslations();
  }

  // Listen to language loaded events to translate chatbot interface on the fly
  window.addEventListener('i18nLoaded', function () {
    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations();
    }
  });

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
          appendMessage('system', t('advisor_error_response', 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.'));
        }
      } catch (err) {
        removeTypingIndicator(typingId);
        appendMessage('system', t('advisor_conn_error', 'Bağlantı hatası oluştu. Lütfen internetinizi kontrol edin.'));
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
          ${tools.map(toolItem => {
            let pricingLabel = t('paid', 'Ücretli');
            if (toolItem.pricing === 'ucretsiz') pricingLabel = t('free', 'Ücretsiz');
            else if (toolItem.pricing === 'freemium') pricingLabel = t('freemium', 'Freemium');

            let supportText = t('badge_tr_none', '🇬🇧 İngilizce');
            if (toolItem.turkish_supported === 'full') supportText = t('badge_tr_full', '🇹🇷 Türkçe');
            else if (toolItem.turkish_supported === 'partial') supportText = t('badge_tr_partial', '🇹🇷 Kısmi');

            const viewBtnText = t('advisor_view_btn', 'İncele');

            return `
              <div class="chat-tool-card" data-url="${toolItem.url}" style="cursor:pointer">
                <div class="card-top">
                  <span class="tool-icon-mini">${toolItem.name.charAt(0).toUpperCase()}</span>
                  <div class="card-name-group">
                    <h5>${toolItem.name}</h5>
                    <span class="tool-cat-mini">${toolItem.category_icon || '📁'} ${toolItem.category_name || ''}</span>
                  </div>
                </div>
                <p class="tool-desc-mini">${toolItem.description.substring(0, 75)}...</p>
                <div class="card-bottom">
                  <span class="tool-badge-mini pricing-${toolItem.pricing}">${pricingLabel}</span>
                  <span class="tool-badge-mini tr-${toolItem.turkish_supported || 'none'}">${supportText}</span>
                  <a href="/tool/${toolItem.id}" class="btn-tool-visit" target="_blank">${viewBtnText}</a>
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
