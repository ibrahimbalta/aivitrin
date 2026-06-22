'use strict';

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
    } catch (err) {
      console.error('Error loading language ' + lang + ':', err);
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

    // 3. Update HTML lang attribute
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

  // Export globally if needed
  window.i18n = {
    loadLanguage: loadTranslations,
    getLanguage: () => currentLang,
    t: (key) => translations[key] || key,
    applyTranslations: applyTranslations
  };
})();
