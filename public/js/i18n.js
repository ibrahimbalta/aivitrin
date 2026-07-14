'use strict';

// Theme Initialization (Default to light mode, preventing page flicker)
(function () {
  var savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

(function () {
  let currentLang = localStorage.getItem('lang') || 'tr';
  let translations = {};

  // Intercept native fetch to inject lang query parameter
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    let url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
    if (url && (url.startsWith('/api/') || url.includes('/api/'))) {
      const lang = localStorage.getItem('lang') || 'tr';
      const separator = url.includes('?') ? '&' : '?';
      if (!url.includes('lang=')) {
        url = url + separator + 'lang=' + lang;
      }
      if (input instanceof Request) {
        input = new Request(url, input);
      } else {
        input = url;
      }
    }
    return originalFetch(input, init);
  };

  async function loadTranslations(lang) {
    try {
      const response = await fetch('/locales/' + lang + '.json');
      if (!response.ok) throw new Error('Translation file load failed');
      translations = await response.json();
      currentLang = lang;
      localStorage.setItem('lang', lang);
      applyTranslations();
      updateSelectValue(lang);
      window.dispatchEvent(new CustomEvent('i18nLoaded', { detail: { lang } }));
      
      // Initialize Cookie Consent Banner after translations are loaded
      initCookieConsent();
    } catch (err) {
      console.error('Error loading language ' + lang + ':', err);
      // Fallback init in case translation fetch fails
      initCookieConsent();
    }
  }

  function applyTranslations() {
    // 1. data-i18n elements
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[key]) {
        // If translation contains html, use innerHTML, else textContent
        if (translations[key].includes('<') && translations[key].includes('>')) {
          el.innerHTML = translations[key];
        } else {
          el.textContent = translations[key];
        }
      }
    });

    // 2. data-i18n-placeholder elements
    const inputs = document.querySelectorAll('[data-i18n-placeholder]');
    inputs.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (translations[key]) {
        el.placeholder = translations[key];
      }
    });

    // 3. data-i18n-title elements
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (translations[key]) {
        el.setAttribute('title', translations[key]);
      }
    });

    // 4. Update HTML lang attribute
    document.documentElement.setAttribute('lang', currentLang);
  }

  function updateSelectValue(lang) {
    const selects = document.querySelectorAll('.lang-select-element');
    selects.forEach(select => {
      if (select.value !== lang) {
        select.value = lang;
      }
    });
  }

  function injectLanguageSwitcher() {
    const headerRight = document.querySelector('.header-actions');
    if (!headerRight) return;

    // Check if switcher already exists
    if (document.querySelector('.lang-switcher')) return;

    const switcherContainer = document.createElement('div');
    switcherContainer.className = 'lang-switcher';
    switcherContainer.innerHTML = `
      <select class="lang-select-element" aria-label="Select Language">
        <option value="tr">TR</option>
        <option value="en">EN</option>
        <option value="de">DE</option>
      </select>
    `;

    // Insert right before theme toggle (if exists) or at the beginning of header-right
    const themeToggle = headerRight.querySelector('.theme-toggle') || headerRight.querySelector('#theme-toggle');
    if (themeToggle) {
      headerRight.insertBefore(switcherContainer, themeToggle);
    } else {
      headerRight.prepend(switcherContainer);
    }

    // Set active option
    const select = switcherContainer.querySelector('.lang-select-element');
    select.value = currentLang;

    // Add change listener
    select.addEventListener('change', function () {
      localStorage.setItem('lang', this.value);
      window.location.reload();
    });
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    injectLanguageSwitcher();
    loadTranslations(currentLang);
  });

  // Global Premium Custom Confirm Modal Dialog
  window.showConfirm = function (messageKeyOrText, confirmKeyOrText = 'confirm_ok', cancelKeyOrText = 'confirm_cancel') {
    return new Promise((resolve) => {
      const getVal = (keyOrText) => {
        if (!keyOrText) return '';
        return translations[keyOrText] || keyOrText;
      };

      const msg = getVal(messageKeyOrText);
      const confirmText = getVal(confirmKeyOrText) || 'Tamam';
      const cancelText = getVal(cancelKeyOrText) || 'İptal';

      // Create modal elements
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';

      overlay.innerHTML = `
        <div class="confirm-modal">
          <div class="confirm-content">${msg}</div>
          <div class="confirm-actions">
            <button class="btn-confirm-cancel">${cancelText}</button>
            <button class="btn-confirm-ok">${confirmText}</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const btnCancel = overlay.querySelector('.btn-confirm-cancel');
      const btnOk = overlay.querySelector('.btn-confirm-ok');

      const close = (result) => {
        overlay.style.animation = 'confirmFadeOut 0.2s ease forwards';
        overlay.querySelector('.confirm-modal').style.animation = 'confirmScaleOut 0.2s ease forwards';
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          resolve(result);
        }, 200);
      };

      btnCancel.addEventListener('click', () => close(false));
      btnOk.addEventListener('click', () => close(true));

      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          close(false);
        }
      });
    });
  };

  function initCookieConsent() {
    if (localStorage.getItem('cookieConsent')) {
      return; // Already decided
    }

    const lang = localStorage.getItem('lang') || 'tr';
    
    const cookieTexts = {
      tr: {
        message: 'Sitemizde, içeriği ve reklamları kişiselleştirmek, sosyal medya özellikleri sunmak ve trafiği analiz etmek için çerezler (cookies) kullanılmaktadır. Ayrıca web sitemizi kullanımınızla ilgili bilgileri, reklam ve analitik ortaklarımızla (Google dahil) paylaşıyoruz.',
        linkText: 'Gizlilik Politikamızı',
        suffix: ' inceleyerek detaylı bilgi alabilirsiniz.',
        accept: 'Kabul Et',
        decline: 'Reddet'
      },
      en: {
        message: 'We use cookies to personalize content and ads, provide social media features, and analyze our traffic. We also share information about your use of our site with our advertising and analytics partners (including Google).',
        linkText: 'Privacy Policy',
        suffix: ' for details.',
        accept: 'Accept All',
        decline: 'Decline'
      },
      de: {
        message: 'Wir verwenden Cookies zur Personalisierung von Inhalten und Anzeigen, für Social-Media-Funktionen und zur Analyse unseres Datenverkehrs. Wir teilen auch Informationen über Ihre Nutzung unserer Website mit unseren Partnern für Werbung und Analysen (einschließlich Google).',
        linkText: 'Datenschutzerklärung',
        suffix: ' für Details.',
        accept: 'Alle akzeptieren',
        decline: 'Ablehnen'
      }
    };

    const text = cookieTexts[lang] || cookieTexts['tr'];

    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .cookie-consent-banner {
        position: fixed;
        bottom: 24px;
        left: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        padding: 20px 30px;
        background: rgba(16, 16, 24, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        transform: translateY(150px);
        opacity: 0;
        transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease;
      }
      [data-theme="light"] .cookie-consent-banner {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(0, 0, 0, 0.08);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
      }
      .cookie-consent-banner.show {
        transform: translateY(0);
        opacity: 1;
      }
      .cookie-consent-text {
        font-size: 0.9rem;
        color: #9ca3af;
        line-height: 1.6;
        flex: 1;
        text-align: left;
      }
      [data-theme="light"] .cookie-consent-text {
        color: #475569;
      }
      .cookie-consent-text a {
        color: #6366f1;
        text-decoration: underline;
        font-weight: 500;
      }
      [data-theme="light"] .cookie-consent-text a {
        color: #4f46e5;
      }
      .cookie-consent-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }
      .btn-cookie-decline {
        padding: 10px 20px;
        border-radius: 10px;
        font-size: 0.85rem;
        font-weight: 600;
        color: #9ca3af;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: transparent;
        transition: all 0.2s ease;
        cursor: pointer;
      }
      [data-theme="light"] .btn-cookie-decline {
        color: #64748b;
        border: 1px solid rgba(0, 0, 0, 0.08);
      }
      .btn-cookie-decline:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #f3f4f6;
      }
      [data-theme="light"] .btn-cookie-decline:hover {
        background: rgba(0, 0, 0, 0.03);
        color: #0f172a;
      }
      .btn-cookie-accept {
        padding: 10px 24px;
        border-radius: 10px;
        font-size: 0.85rem;
        font-weight: 600;
        color: #ffffff;
        background: linear-gradient(135deg, #6366f1 0%, #d946ef 100%);
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.25);
        border: none;
        transition: all 0.2s ease;
        cursor: pointer;
      }
      .btn-cookie-accept:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        filter: brightness(1.1);
      }
      @media (max-width: 768px) {
        .cookie-consent-banner {
          flex-direction: column;
          align-items: stretch;
          padding: 20px;
          bottom: 16px;
          left: 16px;
          right: 16px;
          gap: 16px;
        }
        .cookie-consent-actions {
          justify-content: flex-end;
        }
      }
    `;
    document.head.appendChild(styleEl);

    const banner = document.createElement('div');
    banner.className = 'cookie-consent-banner';
    banner.innerHTML = `
      <div class="cookie-consent-text">
        ${text.message} 
        <a href="/gizlilik-politikasi">${text.linkText}</a>${text.suffix}
      </div>
      <div class="cookie-consent-actions">
        <button class="btn-cookie-decline">${text.decline}</button>
        <button class="btn-cookie-accept">${text.accept}</button>
      </div>
    `;
    
    document.body.appendChild(banner);

    setTimeout(() => {
      banner.classList.add('show');
    }, 100);

    const closeBanner = (consent) => {
      localStorage.setItem('cookieConsent', consent);
      banner.classList.remove('show');
      setTimeout(() => {
        if (banner.parentNode) banner.parentNode.removeChild(banner);
      }, 500);
    };

    banner.querySelector('.btn-cookie-decline').addEventListener('click', () => closeBanner('rejected'));
    banner.querySelector('.btn-cookie-accept').addEventListener('click', () => closeBanner('accepted'));
  }

  // Export globally if needed
  window.i18n = {
    loadLanguage: loadTranslations,
    getLanguage: () => currentLang,
    t: (key, fallback) => translations[key] || fallback || key,
    applyTranslations: applyTranslations
  };
})();
