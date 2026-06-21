// public/js/akademi.js - Yapay Zeka Testleri ve Rozet Kazanımı Mantığı
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var quizzesGrid = document.getElementById('quizzes-grid-list');
  
  // Modal Elements
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

  // Quiz State
  var quizzesList = [];
  var activeQuiz = null;
  var currentQuestionIndex = 0;
  var userAnswers = [];

  // Initialize
  loadQuizzes();
  renderEarnedBadges();

  // Close modal
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeQuizModal);
  if (btnCloseSuccess) btnCloseSuccess.addEventListener('click', closeQuizModal);

  async function loadQuizzes() {
    try {
      var res = await fetch('/api/quizzes');
      var quizzes = await res.json();
      quizzesList = quizzes;

      if (quizzes.length === 0) {
        quizzesGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">Yakında yeni eğitim testleri eklenecektir!</p>';
        return;
      }

      quizzesGrid.innerHTML = quizzes.map(function (quiz) {
        // Check if already passed
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

      // Bind click events to start button
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
    
    // Reset screens
    screenIntro.style.display = 'block';
    screenQuestion.style.display = 'none';
    screenResult.style.display = 'none';
    
    quizModalOverlay.style.display = 'flex';

    // Start quiz button listener
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

    // Progress Bar
    var progressPercent = ((currentQuestionIndex) / totalQuestions) * 100;
    progressBar.style.width = progressPercent + '%';

    questionIndexLabel.textContent = 'Soru: ' + (currentQuestionIndex + 1) + '/' + totalQuestions;
    questionText.textContent = question.questionText;

    // Render options
    optionsContainer.innerHTML = question.options.map(function (option, idx) {
      var isSelected = userAnswers[currentQuestionIndex] === idx;
      var selectedClass = isSelected ? 'selected' : '';
      return `
        <button class="quiz-option-btn ${selectedClass}" data-index="${idx}">
          ${option}
        </button>
      `;
    }).join('');

    // Bind option click
    optionsContainer.querySelectorAll('.quiz-option-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        optionsContainer.querySelectorAll('.quiz-option-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        userAnswers[currentQuestionIndex] = parseInt(this.getAttribute('data-index'));
      });
    });

    // Navigation buttons
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
      
      // Save badge to local storage
      saveBadge({
        quizId: activeQuiz.id,
        title: data.badge.title,
        icon: data.badge.icon,
        date: new Date().toLocaleDateString('tr-TR')
      });
      
      // Reload UI elements
      renderEarnedBadges();
      loadQuizzes();

      // Configure share button
      btnShare.style.display = 'block';
      btnShare.onclick = function () {
        var text = `AIvitrin Akademi'de "${activeQuiz.title}" testini başarıyla tamamladım ve "${data.badge.icon} ${data.badge.title}" rozetini kazandım! Sen de test et: ${window.location.origin}/akademi`;
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
      
      btnShare.style.display = 'none';
      
      // Configure retry button
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

  // Local storage badge helpers
  function isQuizPassed(quizId) {
    var badges = JSON.parse(localStorage.getItem('earned_badges') || '[]');
    return badges.some(b => b.quizId === quizId);
  }

  function saveBadge(badgeObj) {
    var badges = JSON.parse(localStorage.getItem('earned_badges') || '[]');
    if (!badges.some(b => b.quizId === badgeObj.quizId)) {
      badges.push(badgeObj);
      localStorage.setItem('earned_badges', JSON.stringify(badges));
      
      // Sync badge to user's toolkit bookmarks if logged in
      syncBadgeToToolkit(badgeObj);
    }
  }

  function renderEarnedBadges() {
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
    // If the user has a toolkit list in localStorage, we can append a custom badge category or just store it.
    // For now, storing badges in 'earned_badges' local storage matches index page and toolkit drawers.
    // We can also trigger a custom event
    var event = new CustomEvent('badgeEarned', { detail: badgeObj });
    document.dispatchEvent(event);
  }

  // Toast Helper
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
