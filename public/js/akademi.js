// public/js/akademi.js - Yapay Zeka Testleri, Videoları ve Kaynakları Mantığı
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var quizzesGrid = document.getElementById('quizzes-grid-list');
  var videosGrid = document.getElementById('videos-grid-list');
  var resourcesGrid = document.getElementById('resources-grid-list');
  
  // Modal Elements for Quizzes
  var quizModalOverlay = document.getElementById('quiz-modal-overlay');
  var btnCloseModal = document.getElementById('btn-close-quiz-modal');
  
  var screenIntro = document.getElementById('quiz-intro-screen');
  var screenQuestion = document.getElementById('quiz-question-screen');
  var screenResult = document.getElementById('quiz-result-screen');
  
  var modalTitle = document.getElementById('modal-quiz-title');
  var modalDesc = document.getElementById('modal-quiz-desc');
  var btnStartQuiz = document.getElementById('btn-start-quiz');
  
  var progressBar = document.getElementById('quiz-progress-bar');
  var questionIndexLabel = document.getElementById('question-index-label');
  var questionText = document.getElementById('quiz-question-text');
  var optionsContainer = document.getElementById('quiz-options-container');
  var btnPrev = document.getElementById('btn-prev-question');
  var btnNext = document.getElementById('btn-next-question');
  
  var resultTitle = document.getElementById('result-title');
  var resultDesc = document.getElementById('result-desc');
  var resultBadgeIcon = document.getElementById('success-badge-icon');
  var btnShare = document.getElementById('btn-quiz-share');
  var btnCloseSuccess = document.getElementById('btn-quiz-close-success');

  var earnedBadgesArea = document.getElementById('earned-badges-area');
  var earnedBadgesList = document.getElementById('earned-badges-list');

  // Video Modal Elements
  var videoModalOverlay = document.getElementById('video-modal-overlay');
  var btnCloseVideoModal = document.getElementById('btn-close-video-modal');
  var videoModalTitle = document.getElementById('video-modal-title');
  var videoPlayerIframe = document.getElementById('video-player-iframe');

  // State
  var quizzesList = [];
  var videosList = [];
  var activeQuiz = null;
  var currentQuestionIndex = 0;
  var userAnswers = [];

  // Initialize
  loadQuizzes();
  loadVideos();
  loadResources();
  renderEarnedBadges();

  // Close modals
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeQuizModal);
  if (btnCloseSuccess) btnCloseSuccess.addEventListener('click', closeQuizModal);
  if (btnCloseVideoModal) btnCloseVideoModal.addEventListener('click', closeVideoModal);
  if (videoModalOverlay) {
    videoModalOverlay.addEventListener('click', function(e) {
      if (e.target === videoModalOverlay) closeVideoModal();
    });
  }

  // ─── VIDEOS LOGIC ──────────────────────────────
  async function loadVideos() {
    if (!videosGrid) return;
    try {
      var res = await fetch('/api/academy/videos');
      videosList = await res.json();
      renderVideos('all');
    } catch (e) {
      console.error('Error loading videos:', e);
      videosGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">Eğitim videoları yüklenemedi.</p>';
    }
  }

  function renderVideos(category) {
    var filtered = category === 'all' 
      ? videosList 
      : videosList.filter(v => v.categoryId === category);
      
    if (filtered.length === 0) {
      videosGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">Bu kategoride henüz video eklenmemiş.</p>';
      return;
    }
    
    videosGrid.innerHTML = filtered.map(function(v) {
      return `
        <article class="video-card" data-youtube-id="${v.youtubeId}" data-title="${v.title}">
          <div class="video-thumbnail-container">
            <img class="video-thumbnail" src="https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg" alt="${v.title}" loading="lazy">
            <div class="video-play-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <span class="video-duration">${v.duration}</span>
          </div>
          <div class="video-info">
            <div class="video-meta-top">
              <span class="video-channel">${v.channel}</span>
              <span class="video-level">${v.level}</span>
            </div>
            <h3 class="video-card-title">${v.title}</h3>
            <p class="video-card-desc">${v.description}</p>
            <span class="video-watch-link">
              Videoyu İzle 
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </div>
        </article>
      `;
    }).join('');
    
    // Bind click events to video cards
    videosGrid.querySelectorAll('.video-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var youtubeId = this.getAttribute('data-youtube-id');
        var title = this.getAttribute('data-title');
        openVideoModal(youtubeId, title);
      });
    });
  }

  // Category filter tabs
  var filterButtons = document.querySelectorAll('#video-category-filters .filter-btn');
  filterButtons.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      filterButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      var category = this.getAttribute('data-category');
      renderVideos(category);
    });
  });

  function openVideoModal(youtubeId, title) {
    if (!videoModalOverlay || !videoPlayerIframe) return;
    videoModalTitle.textContent = title;
    videoPlayerIframe.src = 'https://www.youtube.com/embed/' + youtubeId + '?autoplay=1';
    videoModalOverlay.style.display = 'flex';
  }
  
  function closeVideoModal() {
    if (!videoModalOverlay || !videoPlayerIframe) return;
    videoModalOverlay.style.display = 'none';
    videoPlayerIframe.src = '';
  }

  // ─── RESOURCES LOGIC ────────────────────────────
  async function loadResources() {
    if (!resourcesGrid) return;
    try {
      var res = await fetch('/api/academy/resources');
      var resources = await res.json();
      
      if (resources.length === 0) {
        resourcesGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">Yakında yeni kaynaklar eklenecektir!</p>';
        return;
      }
      
      resourcesGrid.innerHTML = resources.map(function(r) {
        return `
          <a href="${r.url}" target="_blank" rel="noopener" class="resource-card">
            <div class="resource-header">
              <span class="resource-icon-box">${r.icon}</span>
              <span class="resource-badge">${r.badge}</span>
            </div>
            <h3 class="resource-title">${r.title}</h3>
            <p class="resource-desc">${r.description}</p>
            <span class="resource-link">
              Kaynağa Git 
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </span>
          </a>
        `;
      }).join('');
    } catch (e) {
      console.error('Error loading resources:', e);
      resourcesGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">Kaynaklar yüklenemedi.</p>';
    }
  }

  // ─── QUIZZES LOGIC ──────────────────────────────
  async function loadQuizzes() {
    if (!quizzesGrid) return;
    try {
      var res = await fetch('/api/quizzes');
      var quizzes = await res.json();
      quizzesList = quizzes;

      if (quizzes.length === 0) {
        quizzesGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">Yakında yeni eğitim testleri eklenecektir!</p>';
        return;
      }

      quizzesGrid.innerHTML = quizzes.map(function (quiz) {
        var earned = isQuizPassed(quiz.id);
        var cardClass = earned ? 'quiz-card passed' : 'quiz-card';
        var borderStyle = earned ? 'border-color: rgba(20, 219, 212, 0.3); background: rgba(20, 219, 212, 0.02);' : '';
        
        return `
          <div class="${cardClass}" style="${borderStyle}">
            <div class="quiz-badge-preview">${quiz.badgeIcon}</div>
            <h3 class="quiz-title">${quiz.title}</h3>
            <p class="quiz-desc">${quiz.description}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
              <span style="font-size:0.8rem; color:var(--text-secondary)">Soru Sayısı: ${quiz.questions.length}</span>
              <button class="btn-primary btn-open-quiz" data-id="${quiz.id}" style="padding: 8px 16px; font-size: 0.85rem; background: ${earned ? 'var(--accent-green)' : 'var(--gradient-primary)'}; border:none; color:white; border-radius:6px; font-weight:600; cursor:pointer;">
                ${earned ? '✓ Tamamlandı' : 'Testi Çöz'}
              </button>
            </div>
          </div>
        `;
      }).join('');

      quizzesGrid.querySelectorAll('.btn-open-quiz').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var id = this.getAttribute('data-id');
          openQuizIntro(id);
        });
      });

    } catch (err) {
      console.error('Error loading quizzes:', err);
      quizzesGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">Eğitimler yüklenirken bir hata oluştu.</p>';
    }
  }

  function openQuizIntro(quizId) {
    var quiz = quizzesList.find(q => q.id === quizId);
    if (!quiz) return;

    activeQuiz = quiz;
    modalTitle.textContent = quiz.title;
    modalDesc.textContent = quiz.description;
    
    screenIntro.style.display = 'block';
    screenQuestion.style.display = 'none';
    screenResult.style.display = 'none';
    
    quizModalOverlay.style.display = 'flex';

    btnStartQuiz.onclick = function () {
      startQuizWizard();
    };
  }

  function startQuizWizard() {
    currentQuestionIndex = 0;
    userAnswers = new Array(activeQuiz.questions.length).fill(null);
    
    screenIntro.style.display = 'none';
    screenQuestion.style.display = 'block';
    
    renderQuestion();
  }

  function renderQuestion() {
    var question = activeQuiz.questions[currentQuestionIndex];
    var totalQuestions = activeQuiz.questions.length;

    var progressPercent = ((currentQuestionIndex) / totalQuestions) * 100;
    progressBar.style.width = progressPercent + '%';

    questionIndexLabel.textContent = 'Soru: ' + (currentQuestionIndex + 1) + '/' + totalQuestions;
    questionText.textContent = question.questionText;

    optionsContainer.innerHTML = question.options.map(function (option, idx) {
      var isSelected = userAnswers[currentQuestionIndex] === idx;
      var selectedClass = isSelected ? 'selected' : '';
      return `
        <button class="quiz-option-btn ${selectedClass}" data-index="${idx}">
          ${option}
        </button>
      `;
    }).join('');

    optionsContainer.querySelectorAll('.quiz-option-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        optionsContainer.querySelectorAll('.quiz-option-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        userAnswers[currentQuestionIndex] = parseInt(this.getAttribute('data-index'));
      });
    });

    if (currentQuestionIndex > 0) {
      btnPrev.style.display = 'block';
      btnPrev.onclick = function () {
        currentQuestionIndex--;
        renderQuestion();
      };
    } else {
      btnPrev.style.display = 'none';
    }

    if (currentQuestionIndex === totalQuestions - 1) {
      btnNext.textContent = 'Cevapları Gönder';
      btnNext.style.background = 'var(--gradient-primary)';
      btnNext.onclick = function () {
        submitQuizAnswers();
      };
    } else {
      btnNext.textContent = 'Sonraki Soru';
      btnNext.style.background = 'var(--accent-purple)';
      btnNext.onclick = function () {
        if (userAnswers[currentQuestionIndex] === null) {
          showToast('Lütfen bir seçenek seçin.', 'error');
          return;
        }
        currentQuestionIndex++;
        renderQuestion();
      };
    }
  }

  async function submitQuizAnswers() {
    if (userAnswers[currentQuestionIndex] === null) {
      showToast('Lütfen bir seçenek seçin.', 'error');
      return;
    }

    btnNext.disabled = true;
    btnNext.textContent = 'Gönderiliyor...';

    try {
      var res = await fetch('/api/quizzes/' + activeQuiz.id + '/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: userAnswers })
      });
      var data = await res.json();
      
      btnNext.disabled = false;
      
      if (data.success) {
        showQuizResults(data);
      } else {
        showToast(data.error || 'Değerlendirme hatası.', 'error');
      }
    } catch (e) {
      btnNext.disabled = false;
      showToast('Sunucu bağlantısı kurulamadı.', 'error');
    }
  }

  function showQuizResults(data) {
    screenQuestion.style.display = 'none';
    screenResult.style.display = 'flex';

    if (data.passed) {
      resultBadgeIcon.textContent = data.badge.icon;
      resultBadgeIcon.style.display = 'flex';
      resultTitle.textContent = 'Tebrikler! Testi Geçtiniz';
      resultTitle.style.color = 'var(--accent-cyan)';
      resultDesc.innerHTML = `Tüm sorulara (<strong>${data.score}/${data.total}</strong>) doğru yanıt verdiniz ve başarıyla <strong>${data.badge.title}</strong> rozetini kazandınız!`;
      
      saveBadge({
        quizId: activeQuiz.id,
        title: data.badge.title,
        icon: data.badge.icon,
        date: new Date().toLocaleDateString('tr-TR')
      });
      
      renderEarnedBadges();
      loadQuizzes();

      btnShare.style.display = 'block';
      btnShare.onclick = function () {
        var text = `AiKlavuz Akademi'de "${activeQuiz.title}" testini başarıyla tamamladım ve "${data.badge.icon} ${data.badge.title}" rozetini kazandım! Sen de test et: ${window.location.origin}/akademi`;
        navigator.clipboard.writeText(text).then(function () {
          btnShare.textContent = '✅ Paylaşım Metni Kopyalandı!';
          setTimeout(() => {
            btnShare.textContent = 'Rozeti Paylaş';
          }, 2000);
        });
      };

    } else {
      resultBadgeIcon.style.display = 'none';
      resultTitle.textContent = 'Başarısız Oldunuz';
      resultTitle.style.color = 'var(--accent-red)';
      resultDesc.innerHTML = `Maalesef testten tam puan alamadınız (<strong>${data.score}/${data.total}</strong>). Rozet kazanmak için tüm soruları doğru cevaplamalısınız.`;
      
      btnShare.style.display = 'block';
      btnShare.textContent = 'Yeniden Dene';
      btnShare.onclick = function () {
        startQuizWizard();
      };
    }
  }

  function closeQuizModal() {
    quizModalOverlay.style.display = 'none';
    activeQuiz = null;
  }

  function isQuizPassed(quizId) {
    var badges = JSON.parse(localStorage.getItem('earned_badges') || '[]');
    return badges.some(b => b.quizId === quizId);
  }

  function saveBadge(badgeObj) {
    var badges = JSON.parse(localStorage.getItem('earned_badges') || '[]');
    if (!badges.some(b => b.quizId === badgeObj.quizId)) {
      badges.push(badgeObj);
      localStorage.setItem('earned_badges', JSON.stringify(badges));
      syncBadgeToToolkit(badgeObj);
    }
  }

  function renderEarnedBadges() {
    if (!earnedBadgesArea) return;
    var badges = JSON.parse(localStorage.getItem('earned_badges') || '[]');
    if (badges.length === 0) {
      earnedBadgesArea.style.display = 'none';
      return;
    }

    earnedBadgesList.innerHTML = badges.map(function (b) {
      return `
        <div class="earned-badge-card">
          <div class="earned-badge-icon">${b.icon}</div>
          <div class="earned-badge-title">${b.title}</div>
          <div style="font-size:0.65rem; color:var(--text-secondary); margin-top:4px">${b.date}</div>
        </div>
      `;
    }).join('');
    
    earnedBadgesArea.style.display = 'block';
  }

  function syncBadgeToToolkit(badgeObj) {
    var event = new CustomEvent('badgeEarned', { detail: badgeObj });
    document.dispatchEvent(event);
  }

  function showToast(message, type) {
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'success');
    toast.textContent = message;
    document.body.appendChild(toast);
    
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.zIndex = '99999';
    toast.style.background = type === 'error' ? 'var(--accent-red)' : 'var(--accent-green)';
    toast.style.color = '#fff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
    toast.style.fontWeight = '600';
    toast.style.fontFamily = 'var(--font-body)';
    toast.style.fontSize = '0.9rem';

    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4000);
  }
});
