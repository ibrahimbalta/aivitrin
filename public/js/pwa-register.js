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
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  deferredPrompt = e;

  // Check if user previously dismissed prompt in the last 7 days
  const dismissedTime = localStorage.getItem('aiklavuz_pwa_dismissed');
  if (dismissedTime && (Date.now() - parseInt(dismissedTime, 10)) < 7 * 24 * 60 * 60 * 1000) {
    return;
  }

  showInstallBanner();
});

function showInstallBanner() {
  // Don't show if already installed (standalone mode)
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

  // Append styling if not already present
  if (!document.getElementById('pwa-banner-style')) {
    const style = document.createElement('style');
    style.id = 'pwa-banner-style';
    style.textContent = `
      #pwa-install-banner {
        position: fixed;
        bottom: 20px;
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

// Global hook for any UI button with data-pwa-install
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
