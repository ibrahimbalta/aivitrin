'use strict';

// ─── PWA & Service Worker Registration ───
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
      })
      .catch(err => {
        console.warn('[PWA] ServiceWorker registration failed:', err);
      });
  });
}

// ─── Native Install Prompt (Android APK / PWA Banner) ───
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const dismissedTime = localStorage.getItem('aiklavuz_pwa_dismissed');
  if (dismissedTime && (Date.now() - parseInt(dismissedTime, 10)) < 7 * 24 * 60 * 60 * 1000) {
    return;
  }

  showInstallBanner();
});

function showInstallBanner() {
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    return;
  }

  if (document.getElementById('pwa-install-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <div class="pwa-banner-inner">
      <div class="pwa-banner-icon">
        <img src="/icons/icon-192.png" alt="AiKlavuz App" width="42" height="42">
      </div>
      <div class="pwa-banner-text">
        <strong>AiKlavuz'u Yükleyin</strong>
        <span>Daha hızlı, reklamsız ve uygulama olarak kullanın (APK / PWA)</span>
      </div>
      <div class="pwa-banner-actions">
        <button id="pwa-btn-install" class="pwa-btn-primary">Yükle</button>
        <button id="pwa-btn-close" class="pwa-btn-dismiss" aria-label="Kapat">&times;</button>
      </div>
    </div>
  `;

  if (!document.getElementById('pwa-banner-style')) {
    const style = document.createElement('style');
    style.id = 'pwa-banner-style';
    style.textContent = `
      #pwa-install-banner {
        position: fixed;
        bottom: calc(66px + env(safe-area-inset-bottom, 10px));
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        width: calc(100% - 32px);
        max-width: 480px;
        background: rgba(17, 20, 34, 0.95);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(99, 102, 241, 0.35);
        border-radius: 16px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.2);
        padding: 12px 16px;
        animation: pwaSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @keyframes pwaSlideUp {
        from { opacity: 0; transform: translate(-50%, 40px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      .pwa-banner-inner {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .pwa-banner-icon img {
        border-radius: 10px;
        display: block;
      }
      .pwa-banner-text {
        flex: 1;
        text-align: left;
        display: flex;
        flex-direction: column;
      }
      .pwa-banner-text strong {
        font-size: 0.9rem;
        color: #fff;
        line-height: 1.2;
      }
      .pwa-banner-text span {
        font-size: 0.74rem;
        color: #94a3b8;
        line-height: 1.3;
        margin-top: 2px;
      }
      .pwa-banner-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .pwa-btn-primary {
        background: linear-gradient(135deg, #0099ff, #7a00ff);
        color: #fff;
        border: none;
        border-radius: 9999px;
        padding: 7px 16px;
        font-weight: 700;
        font-size: 0.82rem;
        cursor: pointer;
        transition: transform 0.15s ease;
      }
      .pwa-btn-primary:hover {
        transform: scale(1.04);
      }
      .pwa-btn-dismiss {
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 1.3rem;
        cursor: pointer;
        padding: 4px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .pwa-btn-dismiss:hover {
        color: #fff;
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(banner);

  document.getElementById('pwa-btn-install').addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] User choice outcome:', outcome);
      deferredPrompt = null;
    }
    banner.remove();
  });

  document.getElementById('pwa-btn-close').addEventListener('click', () => {
    banner.remove();
    localStorage.setItem('aiklavuz_pwa_dismissed', Date.now().toString());
  });
}

// ─── Native Mobile App Bottom Navigation Bar Injection ───
function initMobileBottomBar() {
  if (document.getElementById('mobile-app-bottom-bar')) return;

  const pathname = window.location.pathname.toLowerCase();

  const isHome = pathname === '/' || pathname === '/index.html' || pathname === '';
  const isStudio = pathname.startsWith('/studio');
  const isModels = pathname.startsWith('/models');
  const isPrompts = pathname.startsWith('/prompt-studio') || pathname.startsWith('/prompts');
  const isCareer = pathname.startsWith('/kariyer') || pathname.startsWith('/jobs');

  const bottomNav = document.createElement('nav');
  bottomNav.className = 'mobile-app-bottom-bar';
  bottomNav.id = 'mobile-app-bottom-bar';
  bottomNav.setAttribute('aria-label', 'Mobil Ana Gezinme Barı');

  bottomNav.innerHTML = `
    <a href="/#tools-section" class="mobile-bottom-tab ${isHome ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
      <span>Keşfet</span>
    </a>

    <a href="/studio" class="mobile-bottom-tab ${isStudio ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
      <span>Stüdyo</span>
    </a>

    <a href="/models" class="mobile-bottom-tab ${isModels ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
      <span>Borsa</span>
    </a>

    <a href="/prompt-studio" class="mobile-bottom-tab ${isPrompts ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
      </svg>
      <span>Promptlar</span>
    </a>

    <a href="/kariyer" class="mobile-bottom-tab ${isCareer ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
      <span>Kariyer</span>
    </a>
  `;

  document.body.appendChild(bottomNav);
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileBottomBar);
} else {
  initMobileBottomBar();
}

// Global click hook for [data-pwa-install]
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-pwa-install]');
  if (target) {
    e.preventDefault();
    if (deferredPrompt) {
      deferredPrompt.prompt();
    } else {
      alert("AiKlavuz'u telefonunuza yüklemek için tarayıcı menüsünden 'Uygulamayı Yükle' veya 'Ana Ekrana Ekle' seçeneğine dokunun.");
    }
  }
});
