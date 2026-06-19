// Yapay Zeka Vitrini — Admin Bülten Yönetimi Scripti
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  const subscribersTableBody = document.getElementById('subscribers-table-body');
  const historyTableBody = document.getElementById('history-table-body');
  const btnGenerateSend = document.getElementById('btn-generate-send');
  const topicInput = document.getElementById('newsletter-topic');
  
  const simConsole = document.getElementById('sim-console');
  const simProgressBar = document.getElementById('sim-progress-bar');
  const simProgressContainer = document.getElementById('sim-progress-container');
  
  const statSubscribers = document.getElementById('stat-subscribers-count');
  const statSent = document.getElementById('stat-sent-count');
  const previewBox = document.getElementById('newsletter-preview-box');

  const historyModal = document.getElementById('history-modal');
  const historyModalTitle = document.getElementById('history-modal-title');
  const historyModalBody = document.getElementById('history-modal-body');
  const historyModalClose = document.getElementById('history-modal-close');
  const historyCloseBtn = document.getElementById('history-close');

  let subscribers = [];
  let historyLogs = [];

  // Helper function to append log to simulation console
  function addConsoleLog(message, type = '') {
    const line = document.createElement('div');
    line.className = `sim-line ${type}`;
    line.textContent = `[${new Date().toLocaleTimeString('tr-TR')}] ${message}`;
    simConsole.appendChild(line);
    simConsole.scrollTop = simConsole.scrollHeight;
  }

  // Load and render all data
  async function loadNewsletterData() {
    try {
      const [subsRes, histRes] = await Promise.all([
        fetch('/api/admin/newsletter'),
        fetch('/api/admin/newsletter/history')
      ]);

      if (subsRes.ok && histRes.ok) {
        subscribers = await subsRes.json();
        historyLogs = await histRes.json();

        // Sort history: newest first
        historyLogs.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));

        renderSubscribers();
        renderHistory();
        updateStats();
      }
    } catch (err) {
      console.error('Bülten verileri yüklenemedi:', err);
      if (typeof showToast === 'function') showToast('Veriler yüklenirken hata oluştu.', 'error');
    }
  }

  function updateStats() {
    statSubscribers.textContent = subscribers.length;
    statSent.textContent = historyLogs.length;

    if (historyLogs.length > 0) {
      const latest = historyLogs[0];
      previewBox.innerHTML = `
        <strong>Konu:</strong> ${latest.subject}<br>
        <strong>Tarih:</strong> ${new Date(latest.sent_at).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })}<br>
        <strong>Alıcı Sayısı:</strong> ${latest.recipient_count} abona<br><br>
        <div style="padding: 10px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 4px; white-space: pre-wrap;">${latest.content}</div>
      `;
    } else {
      previewBox.textContent = 'Henüz gönderilmiş bülten bulunmuyor.';
    }
  }

  function renderSubscribers() {
    if (!subscribersTableBody) return;

    if (subscribers.length === 0) {
      subscribersTableBody.innerHTML = `
        <tr>
          <td colspan="3" class="empty-state" style="text-align:center; padding:24px; color:var(--text-muted);">
            Kayıtlı bülten abonesi bulunmuyor.
          </td>
        </tr>
      `;
      return;
    }

    subscribersTableBody.innerHTML = subscribers.map(sub => {
      const dateStr = sub.subscribed_at ? new Date(sub.subscribed_at).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-';
      return `
        <tr>
          <td><strong>${sub.email}</strong></td>
          <td>${dateStr}</td>
          <td style="text-align:right">
            <button class="btn-delete btn-delete-sub" data-email="${sub.email}" style="color:var(--accent-red); background:none; border:none; cursor:pointer;">Sil</button>
          </td>
        </tr>
      `;
    }).join('');

    subscribersTableBody.querySelectorAll('.btn-delete-sub').forEach(btn => {
      btn.addEventListener('click', async function () {
        const email = this.getAttribute('data-email');
        if (confirm(`${email} abonesini silmek istediğinize emin misiniz?`)) {
          try {
            const res = await fetch(`/api/admin/newsletter/${encodeURIComponent(email)}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
              if (typeof showToast === 'function') showToast('Abone silindi.', 'success');
              loadNewsletterData();
            } else {
              if (typeof showToast === 'function') showToast(data.error || 'Abone silinemedi.', 'error');
            }
          } catch (err) {
            if (typeof showToast === 'function') showToast('Bağlantı hatası.', 'error');
          }
        }
      });
    });
  }

  function renderHistory() {
    if (!historyTableBody) return;

    if (historyLogs.length === 0) {
      historyTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state" style="text-align:center; padding:24px; color:var(--text-muted);">
            Gönderim geçmişi boş.
          </td>
        </tr>
      `;
      return;
    }

    historyTableBody.innerHTML = historyLogs.map(log => {
      const dateStr = log.sent_at ? new Date(log.sent_at).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-';
      return `
        <tr>
          <td><strong>${log.topic}</strong></td>
          <td>${log.recipient_count} alıcı</td>
          <td>${dateStr}</td>
          <td style="text-align:right">
            <button class="btn-edit btn-view-log" data-id="${log.id}" style="color:var(--accent-purple); background:none; border:none; cursor:pointer;">Ön İzle</button>
          </td>
        </tr>
      `;
    }).join('');

    historyTableBody.querySelectorAll('.btn-view-log').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const log = historyLogs.find(x => x.id === id);
        if (log) {
          historyModalTitle.textContent = log.subject;
          historyModalBody.innerHTML = `
            <div style="margin-bottom: 12px; color: var(--text-muted); font-size: 0.8rem;">
              <strong>Gönderim Konusu:</strong> ${log.topic} | <strong>Tarih:</strong> ${new Date(log.sent_at).toLocaleString('tr-TR')}
            </div>
            <div style="padding: 16px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm); white-space: pre-wrap; font-family: inherit;">${log.content}</div>
          `;
          historyModal.classList.add('active');
        }
      });
    });
  }

  // Modal Actions
  function closeHistoryModal() {
    historyModal.classList.remove('active');
  }
  if (historyModalClose) historyModalClose.addEventListener('click', closeHistoryModal);
  if (historyCloseBtn) historyCloseBtn.addEventListener('click', closeHistoryModal);

  // Generate and Send (Simulation)
  if (btnGenerateSend) {
    btnGenerateSend.addEventListener('click', async function () {
      const topic = topicInput.value.trim();
      if (!topic) {
        if (typeof showToast === 'function') showToast('Lütfen bülten konusu girin.', 'error');
        return;
      }

      btnGenerateSend.disabled = true;
      btnGenerateSend.textContent = 'Bülten Hazırlanıyor...';
      
      // Initialize simulator visual indicators
      simConsole.style.display = 'block';
      simProgressContainer.style.display = 'block';
      simConsole.innerHTML = '';
      simProgressBar.style.width = '0%';

      try {
        // Step 1: Connecting
        addConsoleLog('Sunucuyla bağlantı kuruluyor...', 'info');
        simProgressBar.style.width = '10%';
        await new Promise(r => setTimeout(r, 600));

        // Step 2: Preparing database
        addConsoleLog('Abone listesi ve yapay zeka entegrasyonu analiz ediliyor...', 'info');
        simProgressBar.style.width = '25%';
        await new Promise(r => setTimeout(r, 600));

        // Step 3: Trigger backend call
        addConsoleLog('Yapay zeka bülten taslağı hazırlıyor (vitrindeki araçlar inceleniyor)...');
        simProgressBar.style.width = '45%';
        
        const response = await fetch('/api/admin/newsletter/send-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic })
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Bülten oluşturulamadı.');
        }

        // Step 4: Gen completed
        addConsoleLog(`Bülten Taslağı Oluşturuldu: "${data.newsletter.subject}"`, 'success');
        simProgressBar.style.width = '60%';
        await new Promise(r => setTimeout(r, 800));

        // Step 5: Simulate mail dispatch looping subscribers
        addConsoleLog('E-posta sunucusu başlatılıyor, gönderim sırası aktif...', 'info');
        simProgressBar.style.width = '70%';
        await new Promise(r => setTimeout(r, 600));

        if (subscribers.length === 0) {
          addConsoleLog('Uyarı: Kayıtlı aktif bülten abonesi bulunmuyor. Gönderim atlandı.', 'info');
          simProgressBar.style.width = '90%';
          await new Promise(r => setTimeout(r, 500));
        } else {
          // Loop through subscribers with tiny delays to visualize dispatches
          const increment = 20 / subscribers.length;
          let currentWidth = 70;
          
          for (let i = 0; i < subscribers.length; i++) {
            const sub = subscribers[i];
            addConsoleLog(`Alıcıya gönderildi: ${sub.email} (${i+1}/${subscribers.length})`, 'success');
            currentWidth += increment;
            simProgressBar.style.width = `${Math.min(currentWidth, 90)}%`;
            await new Promise(r => setTimeout(r, Math.max(100, 1000 / subscribers.length)));
          }
        }

        // Finalize
        simProgressBar.style.width = '100%';
        addConsoleLog('Tamamlandı! Tüm bültenler başarıyla gönderildi ve arşive kaydedildi.', 'success');
        if (typeof showToast === 'function') showToast(data.message, 'success');
        
        topicInput.value = '';
        
        // Reload all logs and stats
        await loadNewsletterData();

      } catch (err) {
        addConsoleLog(`Hata: ${err.message}`, 'error');
        if (typeof showToast === 'function') showToast(err.message, 'error');
        simProgressBar.style.width = '0%';
      } finally {
        btnGenerateSend.disabled = false;
        btnGenerateSend.textContent = 'AI Bültenini Hazırla ve Gönder';
      }
    });
  }

  loadNewsletterData();
});
