// Yapay Zeka Vitrini — AI Workflows Modülü
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  const workflowsGrid = document.getElementById('workflows-grid');
  const themeToggle = document.getElementById('theme-toggle');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');

  // Static list of AI Workflows
  const workflows = [
    {
      id: 'pazarlama-icerik',
      title: 'Sosyal Medya & İçerik Pazarlaması Akışı',
      icon: '📈',
      tag: 'Pazarlama & Sosyal Medya',
      description: 'Markanız için blog yazısı fikirleri bulmaktan, bunları podcast, sosyal medya gönderisi ve görsellere dönüştürmeye kadar olan zincir.',
      steps: [
        { num: 1, name: 'ChatGPT veya Claude', desc: 'İçerik fikri, blog taslağı ve sosyal medya kopyaları hazırlar.' },
        { num: 2, name: 'Midjourney veya Canva AI', desc: 'Metin açıklamalarına uygun çarpıcı pazarlama görselleri üretir.' },
        { num: 3, name: 'ElevenLabs', desc: 'Hazırlanan blog metinlerini sese çevirerek profesyonel seslendirme veya podcast üretir.' },
        { num: 4, name: 'Buffer veya Hootsuite', desc: 'Oluşturulan tüm materyalleri planlayıp otomatik yayınlar.' }
      ]
    },
    {
      id: 'yazilim-gelistirme',
      title: 'Hızlı Yazılım Prototipleme & Kod Akışı',
      icon: '💻',
      tag: 'Yazılım & Web Geliştirme',
      description: 'Fikrinizi dakikalar içinde çalışan bir web sitesine veya mobil arayüze dönüştürüp, kodunu yazıp analiz etme zinciri.',
      steps: [
        { num: 1, name: 'v0.dev', desc: 'Doğal dil açıklamalarıyla modern web arayüzleri (React, Tailwind) prototipler.' },
        { num: 2, name: 'Cursor', desc: 'Prototiplenen kodları yerel projenize entegre edip yapay zeka yardımıyla geliştirir.' },
        { num: 3, name: 'GitHub Copilot', desc: 'Kod yazarken gerçek zamanlı satır içi tamamlamalar ve hata düzeltmeleri sunar.' },
        { num: 4, name: 'SonarCloud', desc: 'Geliştirilen kodun güvenlik açıklarını ve kod kalitesini otomatik denetler.' }
      ]
    },
    {
      id: 'e-ticaret-otomasyon',
      title: 'E-Ticaret Ürün Listeleme & Satış Akışı',
      icon: '🛒',
      tag: 'E-Ticaret & Otomasyon',
      description: 'Yeni bir ürünü vitrine eklerken açıklama yazma, ürün fotoğrafını stüdyo kalitesine getirme ve bot otomasyonu kurma zinciri.',
      steps: [
        { num: 1, name: 'Jasper AI', desc: 'SEO uyumlu ve yüksek dönüşüm oranlı ürün açıklamaları yazar.' },
        { num: 2, name: 'Photoroom', desc: 'Evde çekilen ürün resimlerinin arka planını temizler ve profesyonel stüdyo ışığı ekler.' },
        { num: 3, name: 'ManyChat', desc: 'Instagram ve WhatsApp üzerinden gelen ürün sorularına yapay zekayla otomatik yanıt verir.' }
      ]
    },
    {
      id: 'akademik-arastirme',
      title: 'Akademik Araştırma & Literatür Tarama Akışı',
      icon: '🔬',
      tag: 'Eğitim & Araştırma',
      description: 'Bir konu hakkında yayınlanan makaleleri bulma, özetleme ve kaynakçalandırarak akademik yazı hazırlama zinciri.',
      steps: [
        { num: 1, name: 'Consensus veya Elicit', desc: 'Bilimsel veritabanlarında sorularınıza doğrudan kanıt sunan makaleleri bulur.' },
        { num: 2, name: 'ChatPDF', desc: 'Uzun ve karmaşık bilimsel PDF dosyalarını analiz eder, sorularınızı yanıtlar ve özetler.' },
        { num: 3, name: 'Grammarly', desc: 'Yazılan makalenin dil bilgisi ve akademik üslup kontrollerini yapar.' }
      ]
    },
    {
      id: 'video-uretim',
      title: 'Yapay Zeka Destekli Video Üretim Akışı',
      icon: '🎥',
      tag: 'Video & Tasarım',
      description: 'YouTube veya TikTok için sıfırdan senaryo hazırlayıp, yapay zeka ile video klipleri ve seslendirmeyi birleştirme zinciri.',
      steps: [
        { num: 1, name: 'Claude AI', desc: 'Video konusu için yaratıcı ve akıcı bir senaryo taslağı oluşturur.' },
        { num: 2, name: 'Runway Gen-2 veya Sora', desc: 'Senaryodaki sahnelere uygun sinematik yapay zeka videoları üretir.' },
        { num: 3, name: 'ElevenLabs', desc: 'Senaryoyu son derece doğal, insan taklidi seslerle seslendirir.' },
        { num: 4, name: 'CapCut AI', desc: 'Tüm video, ses ve efektleri otomatik altyazıyla birleştirip kurgular.' }
      ]
    },
    {
      id: 'destek-otomasyon',
      title: 'Müşteri Destek & Chatbot Otomasyon Akışı',
      icon: '💬',
      tag: 'Destek & CRM',
      description: 'Gelen destek taleplerini sınıflandırma, otomatik yanıtlar oluşturma ve siteniz için 7/24 konuşabilen AI asistanı eğitme zinciri.',
      steps: [
        { num: 1, name: 'Voiceflow veya Chatbase', desc: 'Şirket bilgi bankasını kullanarak sitenize entegre çalışan bir chatbot tasarlar.' },
        { num: 2, name: 'Claude AI', desc: 'Gelen e-posta veya canlı destek şikayet metinlerini analiz eder ve duygu durum tespiti yapar.' },
        { num: 3, name: 'ChatGPT', desc: 'Şikayete uygun yapıcı, çözüm odaklı resmi yanıt taslakları hazırlar.' },
        { num: 4, name: 'Zendesk veya Intercom', desc: 'Tüm bu süreçleri ticket sistemine bağlayıp müşteri ilişkilerini otomatikleştirir.' }
      ]
    },
    {
      id: 'tasarim-marka',
      title: 'AI Destekli Grafik Tasarım & Marka Kimliği Akışı',
      icon: '🎨',
      tag: 'Tasarım & Yaratıcılık',
      description: 'Yeni bir marka için renk paleti ve logo fikirleri bulmaktan, bunları profesyonel vektör çizimlere ve sosyal medya şablonlarına dönüştürme zinciri.',
      steps: [
        { num: 1, name: 'Midjourney veya DALL-E', desc: 'Marka ruhunu yansıtan logo, ikon ve marka tarzı görselleri üretir.' },
        { num: 2, name: 'Vectorizer.ai', desc: 'Üretilen piksel tabanlı logoları yüksek kaliteli, sonsuz ölçeklenebilir SVG formatına çevirir.' },
        { num: 3, name: 'Coolors AI', desc: 'Markaya en uygun uyumlu renk paletlerini ve tipografi taslaklarını hazırlar.' },
        { num: 4, name: 'Figma veya Canva AI', desc: 'Tüm bu varlıkları kullanarak kurumsal kimlik, kartvizit ve sosyal medya şablonları oluşturur.' }
      ]
    },
    {
      id: 'veri-analiz-bi',
      title: 'Veri Analitiği & İş Zekası (BI) Raporlama Akışı',
      icon: '📊',
      tag: 'Analiz & Raporlama',
      description: 'Şirket verilerini temizleme, doğal dille analiz etme, grafikleştirme ve yönetim panelleri (dashboard) tasarlama zinciri.',
      steps: [
        { num: 1, name: 'Julius AI', desc: 'CSV veya Excel tablolarınızı tarar, eksik verileri temizler ve temel istatistikleri çıkarır.' },
        { num: 2, name: 'ChatGPT Advanced Data Analysis', desc: 'Veriler üzerinde korelasyon analizleri yapar ve iş fırsatlarını yorumlar.' },
        { num: 3, name: 'PowerBI AI veya Tableau', desc: 'Verilerden dinamik ve etkileşimli görsel grafikler ve paneller oluşturur.' },
        { num: 4, name: 'Gamma', desc: 'Tüm analiz sonuçlarını tek tıkla şık bir yönetim kurulu rapor sunumuna dönüştürür.' }
      ]
    },
    {
      id: 'girisimcilik-sunum',
      title: 'Yatırımcı Sunumu (Pitch Deck) Hazırlama Akışı',
      icon: '🚀',
      tag: 'Girişimcilik & Finans',
      description: 'Girişim fikriniz için pazar araştırması yapma, iş modeli geliştirme ve yatırımcılara sunmak üzere etkileyici sunum hazırlama zinciri.',
      steps: [
        { num: 1, name: 'Perplexity AI', desc: 'Pazardaki rakipleri, pazar büyüklüğünü ve güncel trendleri derinlemesine araştırıp raporlar.' },
        { num: 2, name: 'Claude AI', desc: 'Girişiminiz için SWOT analizi, iş modeli kanvası ve gelir modeli taslakları hazırlar.' },
        { num: 3, name: 'Gamma', desc: 'Yatırımcıların aradığı 10 slaytlık standart sunumu (Problem, Çözüm, Pazar vs.) otomatik tasarlar.' },
        { num: 4, name: 'Notion AI', desc: 'Sunumun detaylı iş planını ve yatırım teklif mektubunu kurumsal bir dille yazar.' }
      ]
    },
    {
      id: 'bilimsel-literatur',
      title: 'Tıbbi & Bilimsel Yayın Derleme Akışı',
      icon: '🩺',
      tag: 'Sağlık & Akademik',
      description: 'Klinik vakaları veya bilimsel konuları araştırma, güvenilir kaynakları derleme, raporlama ve hasta/okuyucu rehberleri oluşturma zinciri.',
      steps: [
        { num: 1, name: 'Consensus veya PubMed AI', desc: 'Tıp veritabanlarındaki hakemli bilimsel yayınlardan doğrudan kanıtlı makaleleri bulur.' },
        { num: 2, name: 'ChatPDF veya Claude', desc: 'Çok sayfalı klinik araştırma raporlarını analiz edip kilit bulguları derler.' },
        { num: 3, name: 'ChatGPT', desc: 'Bulguları hastaların veya genel okuyucuların anlayabileceği sade, güvenli ve açıklayıcı rehberlere dönüştürün.' },
        { num: 4, name: 'Notion', desc: 'Tüm bu bilgileri kaynakçasıyla birlikte düzenli bir arşiv haline getirir.' }
      ]
    },
    {
      id: 'ekitap-yayin',
      title: 'Yapay Zeka ile E-Kitap & Dijital Yayıncılık Akışı',
      icon: '📖',
      tag: 'Yayıncılık & Yazım',
      description: 'Kendi e-kitabınızı yazma, editörlük, kapak tasarlama ve Amazon KDP formatına uygun şekilde dijital yayın hazırlama zinciri.',
      steps: [
        { num: 1, name: 'ChatGPT veya Claude', desc: 'Kitap konusu, ana hatları (outline) ve her bölümün taslak metinlerini yazar.' },
        { num: 2, name: 'Grammarly AI', desc: 'Metindeki anlatım bozukluklarını, imla hatalarını giderir ve akıcılığı optimize eder.' },
        { num: 3, name: 'Midjourney veya Canva AI', desc: 'Kitabın konusuna uygun, dikkat geçici profesyonel kitap kapak tasarımları üretir.' },
        { num: 4, name: 'Notion veya Kindle Create', desc: 'Tüm bölümleri ve görselleri e-kitap formatında (EPUB/PDF) mizanpaj edip hazırlar.' }
      ]
    },
    {
      id: 'ses-muzik-uretim',
      title: 'Yapay Zeka Destekli Müzik & Ses Üretim Akışı',
      icon: '🎵',
      tag: 'Ses & Müzik Üretimi',
      description: 'Sıfırdan şarkı sözü yazma, AI ile profesyonel vokal ve beste oluşturma, podcast ses temizleme zinciri.',
      steps: [
        { num: 1, name: 'ChatGPT', desc: 'İstediğiniz tarzda (pop, rock, rap) kafiyeli ve anlamlı şarkı sözleri yazar.' },
        { num: 2, name: 'Suno AI veya Udio', desc: 'Yazılan sözleri melodik ritimlerle birleştirerek saniyeler içinde besteleyip şarkı üretir.' },
        { num: 3, name: 'ElevenLabs', desc: 'Podcast veya sesli kitap projeleriniz için kendi sesinizi klonlar ve seslendirme üretir.' },
        { num: 4, name: 'Adobe Podcast Enhance', desc: 'Ses kayıtlarındaki tüm arka plan gürültülerini temizleyip stüdyo kalitesine getirir.' }
      ]
    },
    {
      id: 'dil-ogrenim-pratik',
      title: 'AI Destekli Yabancı Dil Öğrenme Akışı',
      icon: '🗣️',
      tag: 'Eğitim & Dil',
      description: 'Kişiselleştirilmiş kelime kartları oluşturma, yapay zeka ile sesli pratik yapma ve dil bilgisi düzeltme zinciri.',
      steps: [
        { num: 1, name: 'ChatGPT veya Claude', desc: 'Seviyenize uygun (A1-C2) günlük konuşma diyalogları ve kelime listeleri hazırlar.' },
        { num: 2, name: 'ElevenLabs', desc: 'Hazırlanan konuşma metinlerini farklı aksanlarda (Amerikan, İngiliz vb.) seslendirerek dinleme pratiği sunar.' },
        { num: 3, name: 'TalkPal veya ChatGPT Voice', desc: 'Yapay zekayla gerçek zamanlı, sesli konuşarak akıcılık ve telaffuz pratikleri yapmanızı sağlar.' },
        { num: 4, name: 'Grammarly', desc: 'Yazdığınız yabancı dildeki e-posta ve ödevlerin hatalarını düzeltip geri bildirimler sunar.' }
      ]
    },
    {
      id: 'seo-blog-opt',
      title: 'Yapay Zeka Destekli SEO & Blog Optimizasyon Akışı',
      icon: '🔍',
      tag: 'SEO & Web Pazarlama',
      description: 'Web sitenizin organik trafiğini artırmak için anahtar kelime bulma, rakip analizi ve SEO uyumlu içerik yazma zinciri.',
      steps: [
        { num: 1, name: 'Perplexity veya Ahrefs AI', desc: 'Hedef kelimenizle ilgili en çok aratılan soru kalıplarını ve rakip sitelerin içeriklerini listeler.' },
        { num: 2, name: 'Surfer SEO', desc: 'İçerikte hangi anahtar kelimelerin bulunması gerektiğini belirleyen detaylı bir SEO şablonu çıkartır.' },
        { num: 3, name: 'Jasper veya ChatGPT', desc: 'Surfer SEO şablonuna sadık kalarak, okunabilirliği yüksek ve Google dostu blog yazısı üretir.' },
        { num: 4, name: 'Canva AI', desc: 'Blog yazısının içine yerleştirilecek infografik ve öne çıkan görselleri hazırlar.' }
      ]
    },
    {
      id: 'sunum-konusma-akisi',
      title: 'Yapay Zeka ile Profesyonel Sunum Hazırlama Akışı',
      icon: '📢',
      tag: 'İş & Kişisel Gelişim',
      description: 'Toplantı veya konferanslar için sunum taslağı çıkarma, slayt tasarlama ve AI ile sunum provası yapma zinciri.',
      steps: [
        { num: 1, name: 'Claude AI', desc: 'Sunumun ana fikrini, slayt slayt konuşma notlarını ve akışını tasarlar.' },
        { num: 2, name: 'Gamma veya Tome', desc: 'Konuşma notlarını saniyeler içinde profesyonel ve modern slayt tasarımlarına dönüştürür.' },
        { num: 3, name: 'ChatGPT', desc: 'Dinleyicilerden gelebilecek zor soruları tahmin eder ve bunlara yönelik ikna edici yanıt taslakları hazırlar.' },
        { num: 4, name: 'Yoodli AI', desc: 'Konuşma provanızı analiz ederek konuşma hızınızı, duraklamalarınızı ve beden dilinizi puanlar.' }
      ]
    }
  ];

  // Render workflows
  function renderWorkflows() {
    if (!workflowsGrid) return;
    
    workflowsGrid.innerHTML = workflows.map(wf => {
      const stepsHtml = wf.steps.map(step => {
        return `
          <div class="workflow-step">
            <span class="workflow-step-num">${step.num}</span>
            <div class="workflow-step-details">
              <span class="workflow-step-name">${step.name}</span>
              <span class="workflow-step-desc"> — ${step.desc}</span>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="workflow-card">
          <span class="workflow-icon">${wf.icon}</span>
          <span class="workflow-tag">${wf.tag}</span>
          <h3 class="workflow-title">${wf.title}</h3>
          <p class="workflow-description">${wf.description}</p>
          <div class="workflow-steps-title">İŞ AKIŞI ADIMLARI</div>
          <div class="workflow-steps">
            ${stepsHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  renderWorkflows();

  // Scroll animations
  var animatedElements = document.querySelectorAll('.animate-on-scroll');
  if (animatedElements.length > 0 && 'IntersectionObserver' in window) {
    var scrollObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          scrollObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    animatedElements.forEach(function (el) { scrollObserver.observe(el); });
  } else {
    animatedElements.forEach(function (el) { el.classList.add('visible'); });
  }

  // Spot light tracking
  document.addEventListener('mousemove', function (e) {
    document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
    document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
  });

  // Theme Toggler
  var savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = (current === 'dark') ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // Mobile Menu
  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', function () {
      mobileNav.classList.toggle('active');
    });
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('active');
      });
    });
  }

  // ─── ARAÇ GÖNDERME MODALI MANTIĞI ───
  const submitModal = document.getElementById('submit-tool-modal');
  const btnSubmitTool = document.getElementById('btn-submit-tool');
  const mobileBtnSubmitTool = document.getElementById('mobile-btn-submit-tool');
  const submitModalClose = document.getElementById('submit-modal-close');
  const submitModalCancel = document.getElementById('submit-modal-cancel');
  const submitToolForm = document.getElementById('submit-tool-form');
  const btnSubmitSave = document.getElementById('btn-submit-save');
  const subCategorySelect = document.getElementById('sub-category');

  async function loadCategoriesForModal() {
    if (!subCategorySelect) return;
    try {
      const res = await fetch('/api/categories');
      const cats = await res.json();
      subCategorySelect.innerHTML = '<option value="">Kategori Seçin</option>' + cats.map(c => {
        return `<option value="${c.id}">${c.icon} ${c.name}</option>`;
      }).join('');
    } catch (err) {
      console.error('Kategoriler yüklenemedi:', err);
    }
  }

  function openSubmitModal(e) {
    if(e) e.preventDefault();
    loadCategoriesForModal();
    if(submitModal) submitModal.classList.add('active');
  }

  function closeSubmitModal() {
    if(submitModal) {
      submitModal.classList.remove('active');
      if(submitToolForm) submitToolForm.reset();
    }
  }

  if(btnSubmitTool) btnSubmitTool.addEventListener('click', openSubmitModal);
  if(mobileBtnSubmitTool) mobileBtnSubmitTool.addEventListener('click', openSubmitModal);
  if(submitModalClose) submitModalClose.addEventListener('click', closeSubmitModal);
  if(submitModalCancel) submitModalCancel.addEventListener('click', closeSubmitModal);

  if(btnSubmitSave) {
    btnSubmitSave.addEventListener('click', async function() {
      var name = document.getElementById('sub-name').value.trim();
      var url = document.getElementById('sub-url').value.trim();
      var desc = document.getElementById('sub-description').value.trim();
      var category = document.getElementById('sub-category').value;
      var pricing = document.getElementById('sub-pricing').value;
      var tagsStr = document.getElementById('sub-tags').value;

      if(!name || !url || !desc || !category) {
        showToast('Lütfen tüm zorunlu (*) alanları doldurun.', 'error');
        return;
      }

      if(desc.length < 10) {
        showToast('Açıklama en az 10 karakter olmalıdır.', 'error');
        return;
      }

      var featured = document.getElementById('sub-featured') ? document.getElementById('sub-featured').checked : false;
      var madeInTurkey = document.getElementById('sub-made-in-turkey') ? document.getElementById('sub-made-in-turkey').checked : false;

      var body = {
        name: name,
        url: url,
        description: desc,
        category_id: category,
        pricing: pricing,
        featured: featured,
        made_in_turkey: madeInTurkey,
        tags: tagsStr ? tagsStr.split(',').map(function(s){ return s.trim() }).filter(Boolean) : []
      };

      btnSubmitSave.disabled = true;
      btnSubmitSave.textContent = 'Gönderiliyor...';

      try {
        var res = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        var data = await res.json();
        if(data.success) {
          showToast('Harika! Aracınız başarıyla gönderildi, editör onayından sonra yayınlanacaktır.', 'success');
          closeSubmitModal();
        } else {
          showToast(data.error || 'Gönderim sırasında bir hata oluştu.', 'error');
        }
      } catch(e) {
        showToast('Sunucu bağlantı hatası oluştu.', 'error');
      } finally {
        btnSubmitSave.disabled = false;
        btnSubmitSave.textContent = 'Gönder';
      }
    });
  }

  // ─── AI WORKFLOW GENERATOR ───
  const aiWorkflowForm = document.getElementById('ai-workflow-form');
  const aiWorkflowInput = document.getElementById('ai-workflow-input');
  const btnGenerateWorkflow = document.getElementById('btn-generate-workflow');
  const dynamicResultContainer = document.getElementById('dynamic-workflow-result');
  const dynamicCardContainer = document.getElementById('dynamic-workflow-card-container');

  if (aiWorkflowForm) {
    aiWorkflowForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const goal = aiWorkflowInput.value.trim();
      if (goal.length < 5) {
        showToast('Lütfen en az 5 karakterlik bir hedef girin.', 'error');
        return;
      }

      btnGenerateWorkflow.disabled = true;
      btnGenerateWorkflow.innerHTML = '<span>⏳</span> Tasarlanıyor...';

      try {
        const res = await fetch('/api/workflows/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal })
        });
        const data = await res.json();
        
        if (res.ok && data.success && data.workflow) {
          const wf = data.workflow;
          
          const stepsHtml = wf.steps.map(step => `
            <div class="workflow-step">
              <span class="workflow-step-num" style="background: var(--gradient-primary); color: white;">${step.num}</span>
              <div class="workflow-step-details">
                <span class="workflow-step-name">${step.name}</span>
                <span class="workflow-step-desc"> — ${step.desc}</span>
              </div>
            </div>
          `).join('');

          dynamicCardContainer.innerHTML = `
            <div class="workflow-card" style="margin: 0; background: rgba(99, 102, 241, 0.03); border: 1.5px solid var(--accent-purple); box-shadow: 0 0 20px rgba(99, 102, 241, 0.08);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <span class="workflow-icon">${wf.icon || '🪄'}</span>
                <span class="workflow-tag" style="background: var(--accent-purple); color: white;">${wf.tag}</span>
              </div>
              <h3 class="workflow-title" style="background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; display: inline-block;">${wf.title}</h3>
              <p class="workflow-description" style="margin-top: 10px; margin-bottom: 20px;">${wf.description}</p>
              <div class="workflow-steps-title">AI HEDEF ZİNCİRİNİZ</div>
              <div class="workflow-steps">
                ${stepsHtml}
              </div>
            </div>
          `;

          dynamicResultContainer.style.display = 'block';
          showToast('İş akışı yapay zeka ile başarıyla oluşturuldu!', 'success');
          
          // Scroll smoothly to results
          dynamicResultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          showToast(data.error || 'İş akışı oluşturulamadı.', 'error');
        }
      } catch (err) {
        showToast('Bağlantı hatası oluştu.', 'error');
      } finally {
        btnGenerateWorkflow.disabled = false;
        btnGenerateWorkflow.innerHTML = '<span>✨</span> Akış Tasarla';
      }
    });
  }
});

// Toast notification helper
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.background = type === 'success' ? '#10b981' : '#ef4444';
  toast.style.color = 'white';
  toast.style.padding = '12px 24px';
  toast.style.borderRadius = '8px';
  toast.style.marginTop = '10px';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  toast.style.fontFamily = 'Inter, sans-serif';
  toast.style.fontSize = '0.9rem';
  toast.style.fontWeight = '500';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(20px)';
  toast.style.transition = 'all 0.3s ease';
  toast.textContent = message;

  container.appendChild(toast);

  // Trigger animations
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);

  // Remove toast
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}
