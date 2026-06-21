'use strict';

document.addEventListener('DOMContentLoaded', function () {
  // 1. Google AdSense Script Injection
  async function initAdSense() {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) return;
      const data = await response.json();
      
      if (data.adsense_code) {
        injectScripts(data.adsense_code);
      }
    } catch (err) {
      console.error('Failed to load AdSense settings:', err);
    }
  }

  function injectScripts(htmlString) {
    if (!htmlString) return;
    
    // Create a temporary container
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    
    const scripts = tempDiv.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const originalScript = scripts[i];
      const newScript = document.createElement('script');
      
      // Copy all attributes (like async, src, etc.)
      for (let j = 0; j < originalScript.attributes.length; j++) {
        const attr = originalScript.attributes[j];
        newScript.setAttribute(attr.name, attr.value);
      }
      
      // Copy inline text content if any
      newScript.textContent = originalScript.textContent;
      
      document.head.appendChild(newScript);
    }
  }

  // 2. Local Ad Banner Injections
  async function initLocalAds() {
    try {
      const response = await fetch('/api/ads');
      if (!response.ok) return;
      const ads = await response.json();
      
      const slots = document.querySelectorAll('.ad-slot');
      slots.forEach(slot => {
        const position = slot.dataset.position;
        if (!position) return;
        
        // Filter active ads for this specific position
        const matchingAds = ads.filter(ad => ad.position === position);
        if (matchingAds.length === 0) {
          slot.style.display = 'none'; // Collapse empty slot
          return;
        }
        
        // Pick a random ad for rotation
        const selectedAd = matchingAds[Math.floor(Math.random() * matchingAds.length)];
        
        // Render ad banner
        slot.innerHTML = `
          <a href="${selectedAd.target_url}" target="_blank" rel="noopener sponsored" class="ad-banner-link" title="${selectedAd.title}">
            <img src="${selectedAd.image_url}" alt="${selectedAd.title}" class="ad-banner-image">
          </a>
        `;
        
        // Apply styling container rules dynamically
        slot.style.display = 'block';
        slot.style.margin = '20px auto';
        slot.style.maxWidth = '100%';
        slot.style.width = '100%';
        slot.style.overflow = 'hidden';
        
        const img = slot.querySelector('.ad-banner-image');
        if (img) {
          img.style.width = '100%';
          img.style.height = 'auto';
          img.style.display = 'block';
          img.style.borderRadius = 'var(--radius-md)';
          img.style.transition = 'transform var(--transition-base), box-shadow var(--transition-base)';
          img.style.border = '1px solid var(--border-color)';
          
          // Hover effects
          img.addEventListener('mouseenter', () => {
            img.style.transform = 'translateY(-2px)';
            img.style.boxShadow = 'var(--shadow-card-hover)';
            img.style.borderColor = 'var(--border-hover)';
          });
          img.addEventListener('mouseleave', () => {
            img.style.transform = 'translateY(0)';
            img.style.boxShadow = 'none';
            img.style.borderColor = 'var(--border-color)';
          });
        }
      });
    } catch (err) {
      console.error('Failed to load local ads:', err);
    }
  }

  // Run initializations
  initAdSense();
  initLocalAds();
});
