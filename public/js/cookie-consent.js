'use strict';

/**
 * AiKlavuz — KVKK & AdSense GDPR Uyumlu Çerez Bildirim (Cookie Consent) Modülü
 */
(function () {
  const CONSENT_KEY = 'aiklavuz_cookie_consent_choice';

  function initCookieConsent() {
    const savedConsent = localStorage.getItem(CONSENT_KEY);
    if (savedConsent) {
      applyConsent(savedConsent);
      return;
    }

    // Render banner after 1 second for smooth entrance
    setTimeout(showConsentBanner, 1000);
  }

  function applyConsent(choice) {
    if (typeof window.gtag === 'function') {
      if (choice === 'all') {
        window.gtag('consent', 'update', {
          'analytics_storage': 'granted',
          'ad_storage': 'granted',
          'ad_user_data': 'granted',
          'ad_personalization': 'granted'
        });
      } else {
        window.gtag('consent', 'update', {
          'analytics_storage': 'granted',
          'ad_storage': 'denied',
          'ad_user_data': 'denied',
          'ad_personalization': 'denied'
        });
      }
    }
  }

  function showConsentBanner() {
    if (document.getElementById('cookie-consent-banner')) return;

    const bannerHtml = `
      <div id="cookie-consent-banner" class="cookie-banner-wrapper" role="dialog" aria-live="polite" aria-label="Çerez İzin Bildirimi">
        <div class="cookie-banner-inner">
          <div class="cookie-banner-content">
            <div class="cookie-banner-header">
              <span class="cookie-icon">🍪</span>
              <h4 class="cookie-title">Çerez ve Gizlilik Tercihleriniz</h4>
            </div>
            <p class="cookie-text">
              AiKlavuz'da kullanıcı deneyimini iyileştirmek, site kullanımını analiz etmek ve Google AdSense gibi reklam ortaklarımızla kişiselleştirilmiş içerik sunabilmek için çerezler kullanmaktayız. Detaylı bilgi için <a href="/gizlilik-politikasi" class="cookie-link">Gizlilik Politikası ve Çerez Aydınlatma Metni</a> sayfamızı inceleyebilirsiniz.
            </p>
          </div>
          <div class="cookie-banner-actions">
            <button id="btn-cookie-essential" class="cookie-btn cookie-btn-secondary">Sadece Gerekli</button>
            <button id="btn-cookie-accept-all" class="cookie-btn cookie-btn-primary">Tümünü Kabul Et</button>
          </div>
        </div>
      </div>
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .cookie-banner-wrapper {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        width: calc(100% - 32px);
        max-width: 900px;
        z-index: 99999;
        opacity: 0;
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .cookie-banner-wrapper.cookie-show {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
      .cookie-banner-inner {
        background: rgba(13, 14, 22, 0.92);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: var(--radius-lg, 20px);
        padding: 24px 28px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
      }
      @media (max-width: 768px) {
        .cookie-banner-inner {
          flex-direction: column;
          align-items: stretch;
          padding: 20px;
          gap: 16px;
        }
      }
      .cookie-banner-content {
        flex: 1;
      }
      .cookie-banner-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }
      .cookie-icon {
        font-size: 1.4rem;
      }
      .cookie-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--text-primary, #ffffff);
        margin: 0;
      }
      .cookie-text {
        font-size: 0.88rem;
        color: var(--text-secondary, #a1a1aa);
        line-height: 1.55;
        margin: 0;
      }
      .cookie-link {
        color: var(--accent-cyan, #d946ef);
        text-decoration: underline;
        font-weight: 500;
      }
      .cookie-banner-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }
      @media (max-width: 480px) {
        .cookie-banner-actions {
          flex-direction: column;
        }
      }
      .cookie-btn {
        padding: 10px 20px;
        border-radius: var(--radius-md, 12px);
        font-size: 0.88rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        outline: none;
        white-space: nowrap;
        width: 100%;
        text-align: center;
      }
      .cookie-btn-primary {
        background: var(--gradient-primary, linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%));
        color: #ffffff;
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
      }
      .cookie-btn-primary:hover {
        opacity: 0.95;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
      }
      .cookie-btn-secondary {
        background: rgba(255, 255, 255, 0.07);
        color: var(--text-primary, #ffffff);
        border: 1px solid rgba(255, 255, 255, 0.12);
      }
      .cookie-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
      }
    `;

    document.head.appendChild(styleElement);
    document.body.insertAdjacentHTML('beforeend', bannerHtml);

    const bannerElement = document.getElementById('cookie-consent-banner');
    requestAnimationFrame(() => {
      bannerElement.classList.add('cookie-show');
    });

    document.getElementById('btn-cookie-accept-all').addEventListener('click', function () {
      localStorage.setItem(CONSENT_KEY, 'all');
      applyConsent('all');
      hideBanner(bannerElement);
    });

    document.getElementById('btn-cookie-essential').addEventListener('click', function () {
      localStorage.setItem(CONSENT_KEY, 'essential');
      applyConsent('essential');
      hideBanner(bannerElement);
    });
  }

  function hideBanner(element) {
    element.classList.remove('cookie-show');
    setTimeout(() => {
      element.remove();
    }, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieConsent);
  } else {
    initCookieConsent();
  }
})();
