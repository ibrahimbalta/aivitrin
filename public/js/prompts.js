// public/js/prompts.js - Türkçe Prompt Kütüphanesi Mantığı
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var searchInput = document.getElementById('prompt-search');
  var categoryChips = document.querySelectorAll('.chip');
  var promptsGrid = document.getElementById('prompts-grid-list');
  var dayPromptSection = document.getElementById('day-prompt-section');
  
  var activeCategory = 'all';
  var searchQuery = '';

  // Load Day Prompt
  loadDayPrompt();
  // Load All Prompts
  loadPrompts();

  // Category selection
  categoryChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      categoryChips.forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      activeCategory = this.getAttribute('data-category');
      loadPrompts();
    });
  });

  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', debounce(function (e) {
      searchQuery = e.target.value.trim();
      loadPrompts();
    }, 300));
  }

  async function loadDayPrompt() {
    try {
      var res = await fetch('/api/prompts/day');
      var prompt = await res.json();
      if (prompt) {
        dayPromptSection.innerHTML = `
          <div class="prompt-widget-card" style="background: linear-gradient(135deg, rgba(138, 75, 245, 0.08) 0%, rgba(20, 219, 212, 0.04) 100%); border: 1px solid rgba(138, 75, 245, 0.2); border-radius: var(--radius-lg); padding: 24px; position: relative; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);">
            <div class="prompt-badge" style="position: absolute; right: 16px; top: 16px; background: var(--gradient-primary); color: white; padding: 4px 12px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.5px;">🔥 Günün Promptu</div>
            <h3 style="font-family: var(--font-title); font-size: 1.3rem; color: var(--text-primary); margin-bottom: 8px; padding-right: 120px;">${prompt.title}</h3>
            <div style="display: flex; gap: 8px; margin-bottom: 12px; font-size: 0.8rem;">
              <span class="category-chip" style="background: rgba(255, 255, 255, 0.05); color: var(--accent-cyan); padding: 2px 8px; border-radius: 4px; font-weight: 500;">${prompt.category}</span>
              <span class="tool-chip" style="background: rgba(255, 255, 255, 0.05); color: var(--accent-purple); padding: 2px 8px; border-radius: 4px; font-weight: 500;">${prompt.targetTool}</span>
            </div>
            <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 16px;">${prompt.description}</p>
            
            <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: var(--radius-md); padding: 16px; position: relative; margin-bottom: 16px;">
              <pre style="margin: 0; white-space: pre-wrap; font-family: monospace; font-size: 0.85rem; color: var(--text-primary); max-height: 120px; overflow-y: auto;">${prompt.promptText}</pre>
              <button class="btn-primary btn-copy-prompt" data-text="${prompt.promptText.replace(/"/g, '&quot;')}" style="position: absolute; right: 12px; bottom: 12px; padding: 6px 12px; font-size: 0.8rem; background: var(--gradient-primary); border: none; border-radius: 6px; color: white; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 600;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                Kopyala
              </button>
            </div>
            <div style="display: flex; justify-content: flex-end; align-items: center;">
              <button class="btn-vote-prompt" data-id="${prompt.id}" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); color: var(--text-primary); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; gap: 6px; transition: 0.2s;">
                👍 <span class="votes-count">${prompt.votes || 0}</span> Beğeni
              </button>
            </div>
          </div>
        `;
        dayPromptSection.style.display = 'block';
        bindPromptEvents(dayPromptSection);
      } else {
        dayPromptSection.style.display = 'none';
      }
    } catch (err) {
      console.error('Day prompt load error:', err);
    }
  }

  async function loadPrompts() {
    promptsGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">Yükleniyor...</p>';
    try {
      var url = '/api/prompts?category=' + encodeURIComponent(activeCategory) + '&search=' + encodeURIComponent(searchQuery);
      var res = await fetch(url);
      var data = await res.json();
      var prompts = data.prompts || [];
      
      if (prompts.length === 0) {
        promptsGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">Kriterlere uygun prompt bulunamadı.</p>';
        return;
      }

      promptsGrid.innerHTML = prompts.map(function (prompt) {
        return `
          <div class="prompt-card">
            <h3 style="font-family: var(--font-title); font-size: 1.15rem; color: var(--text-primary); margin-bottom: 8px;">${prompt.title}</h3>
            <div style="display: flex; gap: 8px; margin-bottom: 12px; font-size: 0.75rem;">
              <span style="background: rgba(255, 255, 255, 0.04); color: var(--accent-cyan); padding: 2px 6px; border-radius: 4px;">${prompt.category}</span>
              <span style="background: rgba(255, 255, 255, 0.04); color: var(--accent-purple); padding: 2px 6px; border-radius: 4px;">${prompt.targetTool}</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px; flex-grow: 1;">${prompt.description}</p>
            <div class="prompt-text-area">${prompt.promptText}</div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
              <button class="btn-vote-prompt" data-id="${prompt.id}" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); color: var(--text-primary); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; gap: 4px; transition: 0.2s;">
                👍 <span class="votes-count">${prompt.votes || 0}</span> Beğen
              </button>
              <button class="btn-primary btn-copy-prompt" data-text="${prompt.promptText.replace(/"/g, '&quot;')}" style="padding: 6px 12px; font-size: 0.8rem; background: var(--gradient-primary); border: none; border-radius: 6px; color: white; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 600;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                Promptu Kopyala
              </button>
            </div>
          </div>
        `;
      }).join('');

      bindPromptEvents(promptsGrid);
    } catch (err) {
      console.error('Load prompts error:', err);
      promptsGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">Yüklenirken hata oluştu.</p>';
    }
  }

  function bindPromptEvents(container) {
    if (!container) return;

    container.querySelectorAll('.btn-copy-prompt').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var text = this.getAttribute('data-text');
        navigator.clipboard.writeText(text).then(() => {
          var originalText = this.innerHTML;
          this.innerHTML = '✅ Kopyalandı!';
          showToast('Prompt panoya kopyalandı.', 'success');
          setTimeout(() => {
            this.innerHTML = originalText;
          }, 2000);
        });
      });
    });

    container.querySelectorAll('.btn-vote-prompt').forEach(function (btn) {
      btn.addEventListener('click', async function (e) {
        e.preventDefault();
        var id = this.getAttribute('data-id');
        var votedPrompts = JSON.parse(localStorage.getItem('voted_prompts') || '[]');
        
        if (votedPrompts.indexOf(id) !== -1) {
          showToast('Bu promptu zaten beğendiniz!', 'error');
          return;
        }

        try {
          var res = await fetch('/api/prompts/' + id + '/vote', { method: 'POST' });
          var data = await res.json();
          if (data.success) {
            this.querySelector('.votes-count').textContent = data.votes;
            votedPrompts.push(id);
            localStorage.setItem('voted_prompts', JSON.stringify(votedPrompts));
            showToast('Beğeniniz kaydedildi!', 'success');
          }
        } catch (e) {
          showToast('Oy verilemedi.', 'error');
        }
      });
    });
  }

  // Toast helper
  function showToast(message, type) {
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'success');
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Add styling inline if style.css does not cover toast animation
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.zIndex = '9999';
    toast.style.background = type === 'error' ? 'var(--accent-red)' : 'var(--accent-green)';
    toast.style.color = '#fff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
    toast.style.fontWeight = '600';
    toast.style.fontFamily = 'var(--font-body)';
    toast.style.fontSize = '0.9rem';
    toast.style.animation = 'toastIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards';

    setTimeout(function() {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 4000);
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }
});
