// Yapay Zeka Vitrini — Abonelik Danışmanı Modülü
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  let currentStep = 1;
  const answers = { 1: null, 2: null, 3: null };

  const stepNames = {
    1: 'Kullanım Amacı',
    2: 'Öncelikli Özellik',
    3: 'Ekstra İhtiyaçlar'
  };

  // DOM Elements
  const step1 = document.getElementById('quiz-step-1');
  const step2 = document.getElementById('quiz-step-2');
  const step3 = document.getElementById('quiz-step-3');
  const resultStep = document.getElementById('quiz-result-step');

  const btnPrev = document.getElementById('btn-quiz-prev');
  const btnNext = document.getElementById('btn-quiz-next');
  const btnRestart = document.getElementById('btn-restart-quiz');
  
  const progressFill = document.getElementById('quiz-progress-fill');
  const currentStepLabel = document.getElementById('current-step-label');
  const stepNameLabel = document.getElementById('step-name-label');
  const progressWrapper = document.querySelector('.quiz-progress-wrapper');
  const navRow = document.getElementById('quiz-nav-row');

  const optionCards = document.querySelectorAll('.quiz-option-card');

  // Handle Option Card Selections
  optionCards.forEach(card => {
    card.addEventListener('click', function () {
      const question = parseInt(this.getAttribute('data-question'));
      const value = this.getAttribute('data-value');

      // Save answer
      answers[question] = value;

      // Toggle selected class within this question group
      document.querySelectorAll(`.quiz-option-card[data-question="${question}"]`).forEach(c => {
        c.classList.remove('selected');
        c.style.borderColor = 'var(--border-color)';
        c.style.background = 'rgba(255,255,255,0.01)';
      });

      this.classList.add('selected');
      this.style.borderColor = 'var(--accent-purple)';
      this.style.background = 'rgba(99, 102, 241, 0.05)';

      // Enable Next Button
      btnNext.disabled = false;
      btnNext.classList.add('btn-primary');

      // Auto-advance to next step after a tiny delay for snappy UX (only if not on last step)
      if (currentStep < 3) {
        setTimeout(() => {
          goToStep(currentStep + 1);
        }, 350);
      }
    });
  });

  // Prev Button click
  btnPrev.addEventListener('click', () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  });

  // Next Button click
  btnNext.addEventListener('click', () => {
    if (currentStep < 3) {
      goToStep(currentStep + 1);
    } else {
      showResults();
    }
  });

  // Restart Button click
  btnRestart.addEventListener('click', restartQuiz);

  function goToStep(step) {
    currentStep = step;

    // Toggle steps visibility
    step1.style.display = currentStep === 1 ? 'block' : 'none';
    step2.style.display = currentStep === 2 ? 'block' : 'none';
    step3.style.display = currentStep === 3 ? 'block' : 'none';
    resultStep.style.display = 'none';

    // Reset Progress Bar
    progressWrapper.style.display = 'block';
    navRow.style.display = 'flex';
    
    const pct = Math.round((currentStep / 3) * 100);
    progressFill.style.width = `${pct}%`;
    currentStepLabel.textContent = currentStep;
    stepNameLabel.textContent = stepNames[currentStep];

    // Toggle Prev Button visibility
    btnPrev.style.visibility = currentStep === 1 ? 'hidden' : 'visible';

    // Configure Next Button
    if (answers[currentStep]) {
      btnNext.disabled = false;
      btnNext.classList.add('btn-primary');
    } else {
      btnNext.disabled = true;
      btnNext.classList.remove('btn-primary');
    }

    // Next Button label change for last step
    btnNext.innerHTML = currentStep === 3 ? 'Sonucu Gör &rarr;' : 'İleri &rarr;';
  }

  function showResults() {
    progressWrapper.style.display = 'none';
    navRow.style.display = 'none';
    
    step1.style.display = 'none';
    step2.style.display = 'none';
    step3.style.display = 'none';
    resultStep.style.display = 'block';

    // Model weight score calculation
    let chatgpt = 0;
    let claude = 0;
    let gemini = 0;

    // Q1: Primary Goal
    const q1 = answers[1];
    if (q1 === 'coding') {
      claude += 10; chatgpt += 6; gemini += 4;
    } else if (q1 === 'writing') {
      claude += 8; chatgpt += 8; gemini += 6;
    } else if (q1 === 'general') {
      gemini += 10; claude += 8; chatgpt += 7;
    } else if (q1 === 'daily') {
      chatgpt += 10; gemini += 7; claude += 5;
    }

    // Q2: Critical Feature
    const q2 = answers[2];
    if (q2 === 'files') {
      gemini += 10; claude += 8; chatgpt += 4;
    } else if (q2 === 'voice') {
      chatgpt += 10; gemini += 6; claude += 2;
    } else if (q2 === 'ecosystem') {
      gemini += 10; chatgpt += 4; claude += 1;
    }

    // Q3: Extra Needs
    const q3 = answers[3];
    if (q3 === 'storage') {
      gemini += 10; chatgpt += 1; claude += 0;
    } else if (q3 === 'projects') {
      claude += 10; chatgpt += 6; gemini += 4;
    } else if (q3 === 'voice_image') {
      chatgpt += 10; gemini += 6; claude += 2;
    }

    // Max possible scores: ChatGPT=30, Claude=28, Gemini=30
    let pctChatgpt = Math.round((chatgpt / 30) * 100);
    let pctClaude = Math.round((claude / 28) * 100);
    let pctGemini = Math.round((gemini / 30) * 100);

    // Limit maximum matching percentage to 98% and minimum to 25% for realistic display
    pctChatgpt = Math.max(25, Math.min(98, pctChatgpt));
    pctClaude = Math.max(25, Math.min(98, pctClaude));
    pctGemini = Math.max(25, Math.min(98, pctGemini));

    // Determine the winner
    let winnerName = 'ChatGPT Plus';
    let winnerPct = pctChatgpt;
    let winnerDesc = '';

    if (pctClaude >= pctChatgpt && pctClaude >= pctGemini) {
      winnerName = 'Claude Pro';
      winnerPct = pctClaude;
      winnerDesc = 'Yazılım geliştirme, teknik analizler ve uzun kod tabanlarını yönetme konusundaki hassasiyetiniz nedeniyle Claude Pro sizin için en doğru seçimdir. Etkileşimli Artifacts ekranı ve gelişmiş analiz yetenekleri iş akışınızı ciddi ölçüde hızlandıracaktır.';
    } else if (pctGemini >= pctChatgpt && pctGemini >= pctClaude) {
      winnerName = 'Gemini Advanced';
      winnerPct = pctGemini;
      winnerDesc = 'Google Drive, Gmail ve Dokümanlar gibi geniş Google ekosistemi entegrasyonu, 2 Milyon tokenlik devasa dosya analiz hafızası ve Google One aboneliğiyle hediye gelen 2 TB bulut depolama alanı ihtiyaçlarınız doğrultusunda Gemini Advanced sizin için en ideal seçenektir.';
    } else {
      winnerName = 'ChatGPT Plus';
      winnerPct = pctChatgpt;
      winnerDesc = 'Doğal sesli asistan arayüzü, görsel oluşturmadaki başarısı (DALL-E 3), web taraması ve geniş özel GPT marketi sayesinde ChatGPT Plus günlük işleriniz, planlamalarınız ve çok yönlü asistanlık gereksinimleriniz için en dengeli seçenektir.';
    }

    // Set UI elements
    document.getElementById('winner-name').textContent = winnerName;
    document.getElementById('winner-percentage').textContent = winnerPct;
    document.getElementById('winner-description').textContent = winnerDesc;

    // Render bar percentages
    document.getElementById('score-claude').textContent = `%${pctClaude}`;
    document.getElementById('bar-claude').style.width = `${pctClaude}%`;

    document.getElementById('score-chatgpt').textContent = `%${pctChatgpt}`;
    document.getElementById('bar-chatgpt').style.width = `${pctChatgpt}%`;

    document.getElementById('score-gemini').textContent = `%${pctGemini}`;
    document.getElementById('bar-gemini').style.width = `${pctGemini}%`;
  }

  function restartQuiz() {
    answers[1] = null;
    answers[2] = null;
    answers[3] = null;

    optionCards.forEach(c => {
      c.classList.remove('selected');
      c.style.borderColor = 'var(--border-color)';
      c.style.background = 'rgba(255,255,255,0.01)';
    });

    goToStep(1);
  }
});
