'use strict';

document.addEventListener('DOMContentLoaded', function () {

  // ═══════════════════════════════════════════
  // PROFESSION DATA
  // ═══════════════════════════════════════════
  var professions = [
    {
      id: 'ogretmen',
      icon: '👨‍🏫',
      title: 'Öğretmen',
      subtitle: 'Eğitim & Akademi',
      color: 'hsl(235, 90%, 60%)',
      description: 'Ders planı hazırlama, sunum oluşturma, sınav sorusu yazma ve öğrenci değerlendirme süreçlerini yapay zeka ile hızlandırın.',
      benefits: [
        { icon: '📝', title: 'Ders Planı & Müfredat', text: 'ChatGPT ve Claude ile haftalık ders planlarınızı dakikalar içinde hazırlayın. Kazanım odaklı müfredat taslakları oluşturun.' },
        { icon: '🎨', title: 'Sunum & Görsel Materyal', text: 'Gamma ve Canva AI ile profesyonel sunumlar, infografikler ve poster tasarımları oluşturun.' },
        { icon: '📊', title: 'Sınav & Değerlendirme', text: 'AI ile çoktan seçmeli, açık uçlu ve seviye bazlı sınav soruları üretin. Rubrik ve değerlendirme kriterleri hazırlayın.' },
        { icon: '⏱️', title: 'Haftalık 10+ Saat Kazanım', text: 'Rutin hazırlık işlerini AI\'ya devredip öğrenci ilişkilerine ve yaratıcı öğretime odaklanın.' }
      ],
      suggestedTools: ['chatgpt', 'claude', 'gamma', 'canva', 'notion-ai', 'grammarly'],
      workflow: [
        { step: 1, title: 'Müfredat Taslağı', tool: 'ChatGPT / Claude', desc: 'Haftalık konu ve kazanımları belirleyin' },
        { step: 2, title: 'Sunum Hazırlama', tool: 'Gamma / Canva AI', desc: 'Görsel ve etkileşimli sunumlar oluşturun' },
        { step: 3, title: 'Sınav Oluşturma', tool: 'ChatGPT', desc: 'Seviyeye uygun sorular ve rubrikler hazırlayın' },
        { step: 4, title: 'Geri Bildirim', tool: 'Grammarly / Claude', desc: 'Öğrenci ödevlerini hızlıca değerlendirin' }
      ],
      categories: ['genel-ai-asistan', 'yaratici-ai', 'is-uretkenlik-ai']
    },
    {
      id: 'emlakci',
      icon: '🏠',
      title: 'Emlakçı',
      subtitle: 'Gayrimenkul & Satış',
      color: 'hsl(15, 95%, 55%)',
      description: 'İlan hazırlama, fotoğraf düzenleme, müşteri takibi ve pazar analizi süreçlerini yapay zeka ile optimize edin.',
      benefits: [
        { icon: '📸', title: 'Profesyonel İlan Görselleri', text: 'Photoroom ve Canva AI ile ev fotoğraflarını profesyonel kaliteye dönüştürün. Sanal staging yapın.' },
        { icon: '✍️', title: 'Etkileyici İlan Metinleri', text: 'ChatGPT ile SEO uyumlu, dikkat çekici emlak ilanı açıklamaları yazın.' },
        { icon: '📈', title: 'Pazar Analizi', text: 'AI araçları ile bölge bazlı fiyat analizi yapın, trend raporları oluşturun.' },
        { icon: '🤝', title: 'Müşteri İlişkileri', text: 'CRM entegrasyonlu AI chatbot ile müşteri sorularını 7/24 yanıtlayın.' }
      ],
      suggestedTools: ['chatgpt', 'photoroom', 'canva', 'midjourney', 'jasper'],
      workflow: [
        { step: 1, title: 'Fotoğraf Düzenleme', tool: 'Photoroom / Canva AI', desc: 'Ev fotoğraflarını profesyonel hale getirin' },
        { step: 2, title: 'İlan Yazımı', tool: 'ChatGPT / Jasper', desc: 'SEO uyumlu ilan açıklamaları oluşturun' },
        { step: 3, title: 'Sosyal Medya', tool: 'Canva AI', desc: 'Instagram ve Facebook için görsel paylaşımlar' },
        { step: 4, title: 'Müşteri Takibi', tool: 'AI CRM Asistan', desc: 'Otomatik takip e-postaları ve hatırlatmalar' }
      ],
      categories: ['yaratici-ai', 'genel-ai-asistan', 'sosyal-medya-ai']
    },
    {
      id: 'avukat',
      icon: '⚖️',
      title: 'Avukat',
      subtitle: 'Hukuk & Danışmanlık',
      color: 'hsl(45, 100%, 50%)',
      description: 'Sözleşme taslakları, hukuki araştırma, dava analizi ve belge inceleme süreçlerini yapay zeka ile hızlandırın.',
      benefits: [
        { icon: '📜', title: 'Sözleşme Taslağı', text: 'AI ile standart sözleşme şablonları oluşturun ve mevcut sözleşmelerdeki riskleri tespit edin.' },
        { icon: '🔍', title: 'Hukuki Araştırma', text: 'Emsal kararları, mevzuat değişikliklerini ve içtihat raporlarını dakikalar içinde tarayın.' },
        { icon: '📋', title: 'Belge Özetleme', text: 'Yüzlerce sayfalık dosyaları saniyeler içinde özetleyin ve kilit noktaları çıkarın.' },
        { icon: '💼', title: 'Verimlilik Artışı', text: 'Rutin hukuki yazışmaları otomatikleştirerek müvekkil görüşmelerine daha fazla zaman ayırın.' }
      ],
      suggestedTools: ['chatgpt', 'claude', 'copilot', 'notion-ai'],
      workflow: [
        { step: 1, title: 'Emsal Araştırma', tool: 'Claude / ChatGPT', desc: 'İlgili Yargıtay kararlarını ve mevzuatı tarayın' },
        { step: 2, title: 'Sözleşme Hazırlama', tool: 'ChatGPT', desc: 'Taslak sözleşme oluşturup risk analizi yapın' },
        { step: 3, title: 'Belge Özetleme', tool: 'Claude', desc: 'Dava dosyalarını özetleyip kilit noktaları çıkarın' },
        { step: 4, title: 'Müvekkil Raporu', tool: 'Notion AI', desc: 'Profesyonel ve anlaşılır raporlar hazırlayın' }
      ],
      categories: ['genel-ai-asistan', 'is-uretkenlik-ai']
    },
    {
      id: 'tasarimci',
      icon: '🎨',
      title: 'Tasarımcı',
      subtitle: 'Grafik & UI/UX',
      color: 'hsl(280, 80%, 55%)',
      description: 'Logo tasarımı, UI mockup, görsel üretimi ve marka kimliği çalışmalarını yapay zeka ile zenginleştirin.',
      benefits: [
        { icon: '🖼️', title: 'AI Görsel Üretimi', text: 'Midjourney ve DALL·E ile konsept görseller, mood board\'lar ve ilham kaynakları oluşturun.' },
        { icon: '🎯', title: 'UI/UX Prototipleme', text: 'v0.dev ve Figma AI ile hızlı wireframe ve prototip oluşturun.' },
        { icon: '🔤', title: 'Logo & Marka Kimliği', text: 'AI destekli renk paleti, tipografi ve logo varyasyonları keşfedin.' },
        { icon: '⚡', title: 'Hızlı İterasyon', text: 'Müşteri geri bildirimlerine anında cevap verin, dakikalar içinde revizyon yapın.' }
      ],
      suggestedTools: ['midjourney', 'dall-e', 'canva', 'figma', 'adobe-firefly'],
      workflow: [
        { step: 1, title: 'Konsept & Mood Board', tool: 'Midjourney / DALL·E', desc: 'Görsel konseptler ve ilham kaynakları oluşturun' },
        { step: 2, title: 'UI Tasarım', tool: 'Figma AI / v0.dev', desc: 'Wireframe ve yüksek çözünürlüklü mockup\'lar' },
        { step: 3, title: 'Görsel İşleme', tool: 'Adobe Firefly', desc: 'Fotoğraf düzenleme ve görsel genişletme' },
        { step: 4, title: 'Sunum', tool: 'Canva / Gamma', desc: 'Müşteriye profesyonel sunum hazırlayın' }
      ],
      categories: ['yaratici-ai', 'gorsel-video-ai']
    },
    {
      id: 'yazilimci',
      icon: '💻',
      title: 'Yazılımcı',
      subtitle: 'Yazılım & Geliştirme',
      color: 'hsl(145, 80%, 42%)',
      description: 'Kod yazma, debug, dokümantasyon ve test süreçlerini yapay zeka destekli araçlarla güçlendirin.',
      benefits: [
        { icon: '🤖', title: 'AI Kod Asistanı', text: 'GitHub Copilot ve Cursor ile otomatik kod tamamlama, refactoring ve kod önerileri alın.' },
        { icon: '🐛', title: 'Hata Tespiti & Debug', text: 'AI ile hata mesajlarını analiz edin, çözüm önerileri alın ve log dosyalarını tarayın.' },
        { icon: '📖', title: 'Dokümantasyon', text: 'Otomatik README, API dokümantasyonu ve yorum satırları oluşturun.' },
        { icon: '🚀', title: 'Prototipleme', text: 'v0.dev ve Bolt ile saatler içinde çalışan prototip geliştirin.' }
      ],
      suggestedTools: ['github-copilot', 'cursor', 'chatgpt', 'claude', 'v0', 'bolt'],
      workflow: [
        { step: 1, title: 'Mimari Planlama', tool: 'ChatGPT / Claude', desc: 'Proje mimarisi ve teknoloji seçimi' },
        { step: 2, title: 'Kod Geliştirme', tool: 'Cursor / Copilot', desc: 'AI destekli hızlı kod yazımı' },
        { step: 3, title: 'Test & Debug', tool: 'ChatGPT', desc: 'Hata analizi ve test senaryoları oluşturma' },
        { step: 4, title: 'Deploy & Docs', tool: 'Claude / Notion AI', desc: 'Dokümantasyon ve deployment' }
      ],
      categories: ['yazilim-kod-ai', 'genel-ai-asistan']
    },
    {
      id: 'pazarlamaci',
      icon: '📢',
      title: 'Pazarlamacı',
      subtitle: 'Dijital Pazarlama & İçerik',
      color: 'hsl(340, 80%, 55%)',
      description: 'İçerik üretimi, SEO optimizasyonu, sosyal medya yönetimi ve reklam kampanyalarını yapay zeka ile ölçekleyin.',
      benefits: [
        { icon: '✍️', title: 'İçerik Üretimi', text: 'Blog yazıları, e-posta kampanyaları ve reklam metinlerini AI ile dakikalar içinde oluşturun.' },
        { icon: '📊', title: 'SEO & Anahtar Kelime', text: 'AI ile anahtar kelime araştırması yapın, SEO uyumlu içerikler üretin.' },
        { icon: '📱', title: 'Sosyal Medya', text: 'Otomatik paylaşım planlaması, hashtag önerisi ve görsel oluşturma.' },
        { icon: '🎯', title: 'Reklam Optimizasyonu', text: 'AI destekli A/B testi, hedef kitle analizi ve reklam metni optimizasyonu.' }
      ],
      suggestedTools: ['chatgpt', 'jasper', 'canva', 'copy-ai', 'surfer-seo'],
      workflow: [
        { step: 1, title: 'Strateji & Planlama', tool: 'ChatGPT / Claude', desc: 'İçerik takvimi ve kampanya stratejisi' },
        { step: 2, title: 'İçerik Üretimi', tool: 'Jasper / Copy.ai', desc: 'SEO uyumlu blog, e-posta ve reklam metinleri' },
        { step: 3, title: 'Görsel Tasarım', tool: 'Canva AI', desc: 'Sosyal medya görselleri ve banner\'lar' },
        { step: 4, title: 'Analiz & Raporlama', tool: 'AI Analytics', desc: 'Performans takibi ve optimizasyon önerileri' }
      ],
      categories: ['genel-ai-asistan', 'is-uretkenlik-ai', 'sosyal-medya-ai']
    },
    {
      id: 'icerik-ureticisi',
      icon: '✍️',
      title: 'İçerik Üreticisi',
      subtitle: 'Yazım & Sosyal Medya',
      color: 'hsl(300, 75%, 50%)',
      description: 'Blog yazıları, sosyal medya gönderileri, video senaryoları ve e-posta kampanyalarını yapay zeka ile saniyeler içinde tasarlayın.',
      benefits: [
        { icon: '📝', title: 'Blog & Makale Yazımı', text: 'ChatGPT ve Jasper ile SEO uyumlu blog yazıları ve makaleler tasarlayın.' },
        { icon: '🎬', title: 'Senaryo & Metin Hazırlama', text: 'YouTube, TikTok ve Instagram Reels videolarınız için dikkat çekici senaryolar hazırlayın.' },
        { icon: '📧', title: 'E-Posta Pazarlaması', text: 'Müşteri bültenleri, satış mektupları ve otomatik e-posta serileri oluşturun.' },
        { icon: '📈', title: 'Hız ve Ölçeklenebilirlik', text: 'İçerik üretim hacminizi 5 kat artırırken kaliteden ödün vermeyin.' }
      ],
      suggestedTools: ['chatgpt', 'claude', 'jasper', 'copy-ai', 'notion'],
      workflow: [
        { step: 1, title: 'Fikir Arama', tool: 'Perplexity / ChatGPT', desc: 'İçerik fikirleri ve konu başlıkları bulun' },
        { step: 2, title: 'Metin Yazımı', tool: 'Claude / Jasper', desc: 'Taslak metni veya video senaryosunu oluşturun' },
        { step: 3, title: 'Düzeltme & Editörlük', tool: 'Notion AI / Grammarly', desc: 'İçeriği yapılandırın ve imla kontrolü yapın' },
        { step: 4, title: 'Görsel Üretim', tool: 'Canva AI / Midjourney', desc: 'İçeriğe uygun kapak ve sosyal medya görselleri tasarlayın' }
      ],
      categories: ['genel-ai-asistan', 'yaratici-ai', 'is-uretkenlik-ai']
    },
    {
      id: 'akademisyen',
      icon: '🎓',
      title: 'Öğrenci & Akademisyen',
      subtitle: 'Araştırma & Öğrenim',
      color: 'hsl(190, 90%, 45%)',
      description: 'Akademik araştırma, literatür taraması, tez yazımı ve ders notu özetleme süreçlerini yapay zeka asistanları ile yönetin.',
      benefits: [
        { icon: '📚', title: 'Literatür Taraması', text: 'Perplexity ve Elicit ile binlerce akademik makaleyi anında tarayın ve özetleyin.' },
        { icon: '✍️', title: 'Akademik Yazım & Düzeltme', text: 'İngilizce makalelerinizi dil bilgisi ve stil standartlarına uygun şekilde düzenleyin.' },
        { icon: '🔍', title: 'Kaynak & Atıf Yönetimi', text: 'AI destekli araçlarla kaynaklarınızı organize edin ve doğru atıflar oluşturun.' },
        { icon: '💡', title: 'Kolay Öğrenme', text: 'Karmaşık bilimsel makaleleri veya matematiksel formülleri AI yardımıyla basitleştirerek öğrenin.' }
      ],
      suggestedTools: ['perplexity', 'chatgpt', 'claude', 'notion', 'grammarly'],
      workflow: [
        { step: 1, title: 'Makale Araştırma', tool: 'Perplexity', desc: 'Konuyla ilgili en güncel akademik kaynakları bulun' },
        { step: 2, title: 'Literatür Özeti', tool: 'Claude', desc: 'Makaleleri hızlıca özetleyerek kilit bulguları derleyin' },
        { step: 3, title: 'Taslak & Yazım', tool: 'ChatGPT / Notion AI', desc: 'Tez veya ödev planını çıkartıp metni hazırlayın' },
        { step: 4, title: 'Dil Kontrolü', tool: 'Grammarly', desc: 'Gramatik ve akademik dil düzeltmelerini tamamlayın' }
      ],
      categories: ['bilgi-arastirma-ai', 'bilim-akademik-ai', 'genel-ai-asistan']
    },
    {
      id: 'veri-analisti',
      icon: '📊',
      title: 'Veri Analisti & Finansçı',
      subtitle: 'Analiz & Raporlama',
      color: 'hsl(160, 85%, 40%)',
      description: 'Finansal modelleme, veri temizleme, grafik oluşturma ve tahminleme işlemlerini yapay zeka ile otomatikleştirin.',
      benefits: [
        { icon: '📈', title: 'Otomatik Raporlama', text: 'Excel ve SQL sorgularınızı AI ile yazın. Karmaşık tabloları saniyeler içinde analiz edin.' },
        { icon: '📊', title: 'Veri Görselleştirme', text: 'Julius AI ile ham verilerinizden etkileyici grafikler ve paneller oluşturun.' },
        { icon: '🔍', title: 'Hata Tespiti', text: 'Bütçe ve harcama tablolarındaki finansal hataları ve riskleri anında tespit edin.' },
        { icon: '💡', title: 'Trend Tahminleme', text: 'Tarihsel verilere dayanarak gelecek dönem bütçe ve satış tahminleri yapın.' }
      ],
      suggestedTools: ['julius', 'chatgpt', 'claude', 'excel', 'powerbi'],
      workflow: [
        { step: 1, title: 'Veri Kaynağı', tool: 'Excel / SQL / CSV', desc: 'Ham verilerinizi veya tablolarınızı hazırlayın' },
        { step: 2, title: 'Veri Sorgulama', tool: 'Julius AI / ChatGPT', desc: 'Doğal dil kullanarak veri setine sorular sorun' },
        { step: 3, title: 'Grafik Üretimi', tool: 'Julius AI', desc: 'Verilerinize en uygun grafikleri ve tabloları çizdirin' },
        { step: 4, title: 'Sunum Hazırlama', tool: 'Gamma', desc: 'Bulguları yönetici sunumu haline getirin' }
      ],
      categories: ['veri-analitik-ai', 'finans-ai', 'is-uretkenlik-ai']
    },
    {
      id: 'saglik-calisani',
      icon: '🩺',
      title: 'Sağlık Çalışanı',
      subtitle: 'Tıp & Sağlık Yönetimi',
      color: 'hsl(350, 85%, 55%)',
      description: 'Hasta kayıtlarının özetlenmesi, tıbbi literatür araştırması ve idari süreçlerin yapay zeka desteğiyle optimize edilmesi.',
      benefits: [
        { icon: '📖', title: 'Tıbbi Literatür', text: 'Güncel tıbbi yayınları ve makaleleri Perplexity ile tarayın, en son tedavi protokollerine ulaşın.' },
        { icon: '✍️', title: 'Epikriz Raporlama', text: 'Hasta muayene özetlerini veya sesli notları AI ile yapılandırılmış epikriz raporlarına dönüştürün.' },
        { icon: '⏱️', title: 'İdari İşlerin Azaltılması', text: 'Randevu takibi, hasta bilgilendirme e-postaları ve idari yazışmaları otomatikleştirin.' },
        { icon: '💡', title: 'Alternatif Perspektif', text: 'Nadir görülen vakalarda veya karmaşık semptom kombinasyonlarında AI\'dan fikirler alın.' }
      ],
      suggestedTools: ['perplexity', 'chatgpt', 'claude', 'notion'],
      workflow: [
        { step: 1, title: 'Vaka Araştırması', tool: 'Perplexity / PubMed AI', desc: 'Benzer vakaları ve klinik yayınları tarayın' },
        { step: 2, title: 'Hasta Notu', tool: 'ChatGPT / Claude', desc: 'Muayene notlarını resmi tıbbi rapora dönüştürün' },
        { step: 3, title: 'İdari İşler', tool: 'Notion AI', desc: 'Hasta takip ve randevu yazılarını düzenleyin' },
        { step: 4, title: 'Hasta Bilgilendirme', tool: 'ChatGPT', desc: 'Hastanın anlayacağı dilde tedavi rehberi hazırlayın' }
      ],
      categories: ['saglik-ai', 'genel-ai-asistan', 'bilgi-arastirma-ai']
    },
    {
      id: 'musteri-temsilcisi',
      icon: '💬',
      title: 'Müşteri Temsilcisi',
      subtitle: 'Destek & CRM',
      color: 'hsl(210, 85%, 50%)',
      description: 'Müşteri taleplerinin yanıtlanması, SSS dokümantasyonu ve 7/24 kesintisiz yapay zeka sohbet robotu desteği.',
      benefits: [
        { icon: '💬', title: '7/24 Chatbot Desteği', text: 'Sitenize entegre edeceğiniz yapay zeka chatbotları ile ilk seviye müşteri sorularını anında yanıtlayın.' },
        { icon: '📝', title: 'Yanıt Şablonları', text: 'Gelen karmaşık şikayet veya taleplere profesyonel, yapıcı yanıt taslakları oluşturun.' },
        { icon: '📖', title: 'Bilgi Bankası & SSS', text: 'Sıkça sorulan soruları derleyin ve AI yardımıyla kapsamlı bilgi bankası makalelerine dönüştürün.' },
        { icon: '🤝', title: 'Memnuniyet Analizi', text: 'Müşteri konuşmalarını analiz ederek memnuniyet skorları (NPS) ve duygu durum analizleri yapın.' }
      ],
      suggestedTools: ['chatgpt', 'claude', 'notion', 'v0'],
      workflow: [
        { step: 1, title: 'Chatbot Eğitimi', tool: 'AI Chatbot Builder', desc: 'Şirket verilerini AI chatbot sistemine yükleyin' },
        { step: 2, title: 'Yanıt Hazırlama', tool: 'ChatGPT / Claude', desc: 'Destek taleplerine uygun taslak cevaplar üretin' },
        { step: 3, title: 'SSS Düzenleme', tool: 'Notion AI', desc: 'Soru-cevap bankasını ve rehberleri güncelleyin' },
        { step: 4, title: 'Duygu Analizi', tool: 'Analytics AI', desc: 'Müşteri yorumlarındaki memnuniyet oranlarını tarayın' }
      ],
      categories: ['genel-ai-asistan', 'is-uretkenlik-ai', 'kurumsal-ai']
    },
    {
      id: 'insan-kaynaklari',
      icon: '👥',
      title: 'İnsan Kaynakları',
      subtitle: 'İşe Alım & Yönetim',
      color: 'hsl(120, 75%, 40%)',
      description: 'İş ilanlarının yazılması, aday CV\'lerinin taranması, mülakat sorularının hazırlanması ve çalışan eğitim planlamaları.',
      benefits: [
        { icon: '📄', title: 'CV Filtreleme', text: 'Yüzlerce adayın özgeçmişini iş tanımına göre tarayarak en uygun yetenekleri saniyeler içinde listeleyin.' },
        { icon: '✍️', title: 'Çekici İş İlanları', text: 'Rolün gerekliliklerine ve şirket kültürüne uygun iş ilanları ve duyurular tasarlayın.' },
        { icon: '❓', title: 'Mülakat Kılavuzları', text: 'Adayın seviyesine ve teknik pozisyona özel derinlemesine mülakat soru listeleri üretin.' },
        { icon: '🎓', title: 'Kişisel Eğitim Planı', text: 'Personelin kariyer gelişimine uygun kişiselleştirilmiş eğitim patikaları hazırlayın.' }
      ],
      suggestedTools: ['chatgpt', 'claude', 'notion', 'linkedin'],
      workflow: [
        { step: 1, title: 'İş Tanımı', tool: 'ChatGPT', desc: 'Yeni açılacak kadro için görev ve kriterleri yazın' },
        { step: 2, title: 'CV Tarama', tool: 'Claude', desc: 'Gelen başvuruları iş tanımıyla eşleştirip puanlayın' },
        { step: 3, title: 'Mülakat Hazırlığı', tool: 'ChatGPT', desc: 'Seçilen adaylar için teknik ve yetkinlik soruları hazırlayın' },
        { step: 4, title: 'Oryantasyon', tool: 'Notion AI', desc: 'Yeni işe giren çalışan için eğitim programı çıkartın' }
      ],
      categories: ['is-uretkenlik-ai', 'genel-ai-asistan', 'kurumsal-ai']
    },
    {
      id: 'girisimci',
      icon: '🚀',
      title: 'Girişimci',
      subtitle: 'Startup & İş Yönetimi',
      color: 'hsl(25, 90%, 55%)',
      description: 'İş planı hazırlama, sunum (pitch deck) oluşturma, pazar analizi ve şirket kurulumu adımlarını yapay zeka ile hızlandırın.',
      benefits: [
        { icon: '📝', title: 'İş Planı & Finansal Model', text: 'Yapay zeka ile detaylı iş planları, SWOT analizleri ve ilk yıl finansal tahmin şablonları hazırlayın.' },
        { icon: '📊', title: 'Yatırımcı Sunumu', text: 'Gamma ve ChatGPT ile yatırımcıların ilgisini çekecek etkileyici pitch deck sunumları tasarlayın.' },
        { icon: '🔍', title: 'Pazar & Rakip Analizi', text: 'Sektördeki rakipleri, pazar paylarını ve müşteri segmentlerini AI araçlarıyla tarayıp analiz edin.' },
        { icon: '⚡', title: 'Hızlı MVP Geliştirme', text: 'Kodsuz araçlar ve yapay zeka asistanları ile fikrinizi saatler içinde çalışan bir prototipe dönüştürün.' }
      ],
      suggestedTools: ['chatgpt', 'claude', 'gamma', 'notion', 'perplexity'],
      workflow: [
        { step: 1, title: 'Pazar Analizi', tool: 'Perplexity / ChatGPT', desc: 'Sektör analizi ve pazar ihtiyaçlarını araştırın' },
        { step: 2, title: 'İş Modeli Kanvası', tool: 'ChatGPT / Claude', desc: 'İş fikrinin detaylarını ve değer önerilerini netleştirin' },
        { step: 3, title: 'Pitch Deck Sunumu', tool: 'Gamma / Canva AI', desc: 'Yatırımcılara sunmak üzere dinamik sunum hazırlayın' },
        { step: 4, title: 'Prototip (MVP)', tool: 'v0 / Bolt', desc: 'Kodsuz veya az kodlu araçlarla çalışan ilk sürümü üretin' }
      ],
      categories: ['is-uretkenlik-ai', 'genel-ai-asistan', 'finans-ai']
    },
    {
      id: 'mimar',
      icon: '📐',
      title: 'Mimar & 3D Tasarımcı',
      subtitle: 'Mimarlık & İç Mekan',
      color: 'hsl(200, 80%, 40%)',
      description: 'Konsept tasarımı, iç mekan görselleştirme, 3D model boyama ve render süreçlerini yapay zeka ile hızlandırın.',
      benefits: [
        { icon: '🖼️', title: 'Konsept Görselleştirme', text: 'Midjourney ve Stable Diffusion ile müşterilerinize sunmak üzere saniyeler içinde konsept tasarımlar üretin.' },
        { icon: '🛋️', title: 'Yapay Zeka ile Render', text: 'Ham CAD veya 3D modellerinizi AI araçlarıyla saniyeler içinde fotogerçekçi görsellere dönüştürün.' },
        { icon: '🎨', title: 'Malzeme Kombinasyonları', text: 'Farklı mermer, ahşap, metal ve kumaş dokularını mekan üzerinde anında deneyin.' },
        { icon: '⏱️', title: 'Hızlı Render Süreçleri', text: 'Günler süren render alma ve düzenleme aşamalarını dakikalar seviyesine indirgeyin.' }
      ],
      suggestedTools: ['midjourney', 'canva-ai', 'dall-e'],
      workflow: [
        { step: 1, title: 'Konsept Arama', tool: 'Midjourney', desc: 'Görsel konseptler ve ilham tasarımları üretin' },
        { step: 2, title: '3D Çizim', tool: 'CAD / SketchUp', desc: 'Projenin 3D ham geometrisini çizin' },
        { step: 3, title: 'AI Render', tool: 'AI Renderer', desc: 'Ham modeli dakikalar içinde fotogerçekçi görsele çevirin' },
        { step: 4, title: 'Post-Prodüksiyon', tool: 'Canva / Photoshop', desc: 'Işık ve malzeme detaylarını optimize edin' }
      ],
      categories: ['yaratici-ai', 'gorsel-video-ai']
    },
    {
      id: 'proje-yoneticisi',
      icon: '📋',
      title: 'Proje Yöneticisi',
      subtitle: 'Planlama & Operasyon',
      color: 'hsl(260, 75%, 60%)',
      description: 'Görev dağılımı, zaman planlaması, toplantı notlarının özetlenmesi ve takım içi iletişimin yapay zeka ile koordinasyonu.',
      benefits: [
        { icon: '📝', title: 'Toplantı Özetleme', text: 'Ses kayıtlarını veya video konferansları metne döküp eylem planları ve görev listeleri halinde özetleyin.' },
        { icon: '⏱️', title: 'Zaman Planlaması', text: 'Gantt şemaları, kilometre taşları ve kaynak dağılımlarını AI desteği ile optimize edin.' },
        { icon: '📊', title: 'Durum Raporlama', text: 'Proje ilerleme durumunu, riskleri ve tamamlanma oranlarını otomatik raporlar haline getirin.' },
        { icon: '👥', title: 'Ekip Koordinasyonu', text: 'İş tanımlarına ve ekip üyelerinin uzmanlıklarına göre görev atamalarını yapay zekayla koordine edin.' }
      ],
      suggestedTools: ['notion', 'chatgpt', 'claude', 'perplexity'],
      workflow: [
        { step: 1, title: 'Kapsam Belgesi', tool: 'ChatGPT / Claude', desc: 'Proje hedeflerini ve sınırlarını belirleyin' },
        { step: 2, title: 'Görev Planı', tool: 'Notion AI', desc: 'İş kırılım şemasını ve görevleri sisteme girin' },
        { step: 3, title: 'Takip & Rapor', tool: 'Slack AI / Teams', desc: 'Günlük ilerlemeyi ve engelleri analiz edin' },
        { step: 4, title: 'Değerlendirme', tool: 'Transcription AI', desc: 'Toplantı notlarından aksiyon kararları çıkartın' }
      ],
      categories: ['is-uretkenlik-ai', 'genel-ai-asistan']
    },
    {
      id: 'cevirmen',
      icon: '🌐',
      title: 'Çevirmen & Dil Uzmanı',
      subtitle: 'Çeviri & Lokalizasyon',
      color: 'hsl(170, 75%, 45%)',
      description: 'Çok dilli çeviri, lokalizasyon, altyazı hazırlama ve akademik metin çevirilerini yapay zeka ile profesyonelleştirin.',
      benefits: [
        { icon: '🌐', title: 'Bağlamsal Çeviri', text: 'DeepL ve Claude ile deyimleri, jargonları ve kültürel öğeleri koruyarak bağlama uygun çeviriler yapın.' },
        { icon: '📄', title: 'Format Koruyarak Çeviri', text: 'PDF, Word veya Excel belgelerinin formatını bozmadan tamamını farklı dillere çevirin.' },
        { icon: '🎬', title: 'Altyazı & Ses', text: 'Video içerikleriniz için otomatik altyazı dosyaları (SRT) oluşturun ve yapay zeka ile seslendirin.' },
        { icon: '✍️', title: 'Ton Değişikliği', text: 'Metinleri hedef kitleye göre resmi, samimi, akademik veya pazarlama diline uyarlayın.' }
      ],
      suggestedTools: ['deepl', 'chatgpt', 'claude', 'notion'],
      workflow: [
        { step: 1, title: 'Ham Çeviri', tool: 'DeepL / ChatGPT', desc: 'Metnin ilk çevirisini tamamlayın' },
        { step: 2, title: 'Bağlam Düzenleme', tool: 'Claude', desc: 'Deyim ve özel kelimeleri yerelleştirin' },
        { step: 3, title: 'Stil Kontrolü', tool: 'Notion AI', desc: 'Metnin tonunu ve akıcılığını kontrol edin' },
        { step: 4, title: 'Son Okuma', tool: 'Grammarly', desc: 'İmla ve yazım hatalarını sıfırlayın' }
      ],
      categories: ['genel-ai-asistan', 'is-uretkenlik-ai', 'bilim-akademik-ai']
    },
    {
      id: 'sosyal-medya',
      icon: '📱',
      title: 'Sosyal Medya Yöneticisi',
      subtitle: 'Sosyal Medya & Tasarım',
      color: 'hsl(320, 80%, 50%)',
      description: 'Gönderi planlama, görsel/video tasarımı, trend takibi ve etkileşim analizlerini yapay zeka ile otomatikleştirin.',
      benefits: [
        { icon: '📅', title: 'İçerik Takvimi', text: 'ChatGPT ile 30 günlük Instagram, LinkedIn ve TikTok içerik takvimlerini fikirleriyle birlikte üretin.' },
        { icon: '🎨', title: 'Görsel Tasarımı', text: 'Canva AI ve Adobe Firefly ile şablonlar üzerinden profesyonel sosyal medya görselleri tasarlayın.' },
        { icon: '🎬', title: 'Kısa Video (Shorts)', text: 'Uzun videolarınızdan yapay zekayla trend dikey dikey videolar (Reels) çıkartın.' },
        { icon: '💬', title: 'Otomatik Yorumlar', text: 'Gelen mesajlara ve yorumlara AI asistanı ile hızlı ve samimi yanıtlar verin.' }
      ],
      suggestedTools: ['canva-ai', 'midjourney', 'chatgpt', 'copy-ai', 'jasper'],
      workflow: [
        { step: 1, title: 'Trend Analizi', tool: 'ChatGPT / Perplexity', desc: 'Haftalık viral olabilecek konuları belirleyin' },
        { step: 2, title: 'İçerik Üretimi', tool: 'Canva AI / Midjourney', desc: 'Açıklama metinlerini ve görselleri hazırlayın' },
        { step: 3, title: 'Video Kurgusu', tool: 'CapCut AI / OpusClip', desc: 'Uzun videoları kesip altyazılı dikey video yapın' },
        { step: 4, title: 'Paylaşım Planı', tool: 'Buffer / Hootsuite', desc: 'Paylaşımları doğru saatlere planlayıp otomatik yayınlayın' }
      ],
      categories: ['sosyal-medya-ai', 'yaratici-ai', 'gorsel-video-ai']
    },
    {
      id: 'satis-temsilcisi',
      icon: '🤝',
      title: 'Satış & İş Geliştirme',
      subtitle: 'Satış & Müşteri Edinimi',
      color: 'hsl(140, 70%, 45%)',
      description: 'Soğuk e-posta (cold email) yazımı, potansiyel müşteri listeleme ve satış sunumlarını yapay zeka ile güçlendirin.',
      benefits: [
        { icon: '✉️', title: 'Kişiselleştirilmiş E-Posta', text: 'Aday müşterilerin LinkedIn profillerini inceleyerek onlara özel etkileyici soğuk e-postalar yazın.' },
        { icon: '📞', title: 'Görüşme Hazırlığı', text: 'Müşteri adayı firmanın web sitesini analiz edin, satış öncesi kritik ihtiyaçları listeleyin.' },
        { icon: '📊', title: 'Teklif & Sunum', text: 'AI ile her müşterinin problemine odaklanan özel teklif dosyaları ve sunum şablonları hazırlayın.' },
        { icon: '⏱️', title: 'Takip (Follow-up)', text: 'Görüşme sonrasında otomatik takip e-postalarını organize edip zamanında gönderin.' }
      ],
      suggestedTools: ['chatgpt', 'claude', 'jasper', 'notion'],
      workflow: [
        { step: 1, title: 'Müşteri Keşfi', tool: 'Perplexity / LinkedIn', desc: 'Müşteri adayı firmaları ve yetkilileri araştırın' },
        { step: 2, title: 'Soğuk İletişim', tool: 'ChatGPT / Copy.ai', desc: 'Kişiselleştirilmiş e-posta veya mesajlar yazın' },
        { step: 3, title: 'Sunum & Teklif', tool: 'Gamma / Canva AI', desc: 'Müşteriye özel satış sunumunu hazırlayın' },
        { step: 4, title: 'CRM Takibi', tool: 'Notion AI', desc: 'Görüşme notlarını kaydedip sonraki adımları belirleyin' }
      ],
      categories: ['is-uretkenlik-ai', 'genel-ai-asistan', 'pazarlama-satis-ai']
    },
    {
      id: 'fotografci',
      icon: '📷',
      title: 'Fotoğrafçı & Videograf',
      subtitle: 'Fotoğraf & Video Üretimi',
      color: 'hsl(10, 85%, 50%)',
      description: 'Fotoğraf düzenleme, arka plan temizleme, video kurgusu ve renk derecelendirme (color grading) süreçlerini yapay zeka ile hızlandırın.',
      benefits: [
        { icon: '📸', title: 'Hızlı Fotoğraf Retouch', text: 'Photoshop AI ve Lightroom ile portre ve manzara fotoğraflarındaki pürüzleri tek tıkla giderin.' },
        { icon: '🎬', title: 'Akıllı Video Kurgusu', text: 'CapCut veya Premiere Pro AI ile videolardaki sessiz boşlukları otomatik kesin ve geçişleri düzenleyin.' },
        { icon: '🖼️', title: 'Arka Plan Değiştirme', text: 'Photoroom ile ürün veya model fotoğraflarının arka planını stüdyo kalitesindeki sahnelerle saniyeler içinde değiştirin.' },
        { icon: '💡', title: 'AI ile Renklendirme', text: 'Çekimlerinize en uygun sinematik renk filtrelerini (LUT) AI yardımıyla oluşturun ve uygulayın.' }
      ],
      suggestedTools: ['photoshop', 'photoroom', 'canva-ai', 'midjourney'],
      workflow: [
        { step: 1, title: 'Ham Çekim Ayıklama', tool: 'Lightroom AI', desc: 'Çekilen fotoğraflardan en iyilerini otomatik seçin' },
        { step: 2, title: 'Arka Plan Temizleme', tool: 'Photoroom', desc: 'Model veya ürün görsellerinin arka planını düzenleyin' },
        { step: 3, title: 'Akıllı Video Kurgusu', tool: 'CapCut AI / Premiere', desc: 'Sessiz sahneleri kesin ve otomatik altyazı ekleyin' },
        { step: 4, title: 'Renk Derecelendirme', tool: 'DaVinci / Premiere AI', desc: 'Videoya sinematik renk ve tonlama uygulayın' }
      ],
      categories: ['yaratici-ai', 'gorsel-video-ai']
    },
    {
      id: 'muhendis',
      icon: '⚙️',
      title: 'Mühendis & CAD Tasarımcısı',
      subtitle: 'Mühendislik & Üretim',
      color: 'hsl(210, 80%, 45%)',
      description: 'Teknik dokümantasyon, CAD model optimizasyonu, hesaplamalar ve simülasyon veri analizlerini yapay zeka ile otomatikleştirin.',
      benefits: [
        { icon: '📝', title: 'Teknik Şartname', text: 'Mühendislik projeleriniz için detaylı teknik şartnameler ve kalite standartları belgeleri hazırlayın.' },
        { icon: '📊', title: 'Veri & Simülasyon Analizi', text: 'Julius AI ile simülasyon test verilerinizi analiz edin, grafikler oluşturun ve anomali tespiti yapın.' },
        { icon: '💻', title: 'Kod ve Makro Yazımı', text: 'CAD programlarında (AutoCAD, SolidWorks) işinizi kolaylaştıracak özel LISP veya Python makrolarını AI ile yazdırın.' },
        { icon: '💡', title: 'Mühendislik Hesapları', text: 'Karmaşık matematiksel formülleri ve mukavemet hesaplamalarını AI asistanları ile doğrulayın.' }
      ],
      suggestedTools: ['chatgpt', 'claude', 'julius-ai', 'perplexity'],
      workflow: [
        { step: 1, title: 'Proje Planlama', tool: 'ChatGPT / Claude', desc: 'Proje sınırlarını ve teknik gereksinimleri tanımlayın' },
        { step: 2, title: 'CAD Makro Yazımı', tool: 'ChatGPT', desc: 'Tekrarlayan çizim adımları için makro kodları oluşturun' },
        { step: 3, title: 'Test Veri Analizi', tool: 'Julius AI', desc: 'Simülasyon test raporlarını analiz edip grafikleştirin' },
        { step: 4, title: 'Teknik Raporlama', tool: 'Notion AI', desc: 'Sonuçları standart mühendislik raporu haline getirin' }
      ],
      categories: ['yazilim-kod-ai', 'veri-analitik-ai', 'is-uretkenlik-ai']
    },
    {
      id: 'turizmci',
      icon: '✈️',
      title: 'Seyahat Danışmanı',
      subtitle: 'Turizm & Otelcilik',
      color: 'hsl(180, 80%, 45%)',
      description: 'Kişiselleştirilmiş seyahat rotaları hazırlama, otel önerileri derleme ve müşteri rezervasyon takip maillerini yapay zeka ile yönetin.',
      benefits: [
        { icon: '🗺️', title: 'Kişiselleştirilmiş Rota', text: 'Müşterilerin bütçesine ve ilgi alanlarına göre gün bazlı detaylı seyahat rotaları ve aktiviteler hazırlayın.' },
        { icon: '🏨', title: 'Mekan Önerileri', text: 'Perplexity ile gidilecek şehirlerdeki en yüksek puanlı ve popüler mekanları anlık olarak tarayıp listeleyin.' },
        { icon: '✍️', title: 'Pazarlama & Tanıtım', text: 'Tur ilanları ve tatil paketleri için sosyal medyada dikkat çekecek SEO uyumlu tanıtım metinleri yazın.' },
        { icon: '📞', title: 'Rezervasyon Takibi', text: 'Müşteri taleplerine hızlı yanıt e-postaları ve seyahat öncesi hatırlatma mesajları tasarlayın.' }
      ],
      suggestedTools: ['perplexity', 'chatgpt', 'claude', 'notion'],
      workflow: [
        { step: 1, title: 'Otel & Ulaşım Arama', tool: 'Perplexity', desc: 'Fiyat ve puan durumuna göre en iyi alternatifleri bulun' },
        { step: 2, title: 'Günlük Rota Çıkartma', tool: 'ChatGPT / Claude', desc: 'Gezilecek yerlerin günlük planını ve haritasını oluşturun' },
        { step: 3, title: 'Tur Metni Yazımı', tool: 'Jasper / Copy.ai', desc: 'İlan veya katalog için çekici tanıtım yazıları yazın' },
        { step: 4, title: 'Danışan Takibi', tool: 'Notion AI', desc: 'Müşteri evraklarını ve rezervasyon bilgilerini arşivleyin' }
      ],
      categories: ['genel-ai-asistan', 'is-uretkenlik-ai', 'pazarlama-satis-ai']
    },
    {
      id: 'diyetisyen',
      icon: '🍏',
      title: 'Diyetisyen & Antrenör',
      subtitle: 'Sağlık, Beslenme & Spor',
      color: 'hsl(100, 75%, 45%)',
      description: 'Kişiye özel beslenme programları tasarlama, egzersiz planları hazırlama ve danışan takip süreçlerini yapay zekayla kolaylaştırın.',
      benefits: [
        { icon: '🍏', title: 'Menü Planlama', text: 'Danışanın boy, kilo, alerji ve hedeflerine göre alternatifli haftalık beslenme listeleri çıkartın.' },
        { icon: '🏋️', title: 'Egzersiz Rutinleri', text: 'Spor salonu veya ev ortamına uygun, set ve tekrar sayıları belirlenmiş kişiye özel egzersiz planları hazırlayın.' },
        { icon: '📊', title: 'Gelişim Raporları', text: 'Danışanların haftalık kilo ve yağ oranı değişimlerini analiz edip motivasyonel geri bildirim raporları oluşturun.' },
        { icon: '📝', title: 'Alternatif Tarifler', text: 'Düşük kalorili, glutensiz veya ketojenik tarif alternatiflerini saniyeler içinde üretin.' }
      ],
      suggestedTools: ['chatgpt', 'claude', 'notion', 'perplexity'],
      workflow: [
        { step: 1, title: 'Danışan Hedefleri', tool: 'Notion', desc: 'Danışanın metabolizma ve sağlık hedeflerini kaydedin' },
        { step: 2, title: 'Beslenme Programı', tool: 'ChatGPT / Claude', desc: 'Boy/kilo hedefine uygun günlük kalori listesini yazın' },
        { step: 3, title: 'Antrenman Planı', tool: 'ChatGPT', desc: 'Hedeflenen kas grubu ve kondisyona göre antrenmanı çizin' },
        { step: 4, title: 'Gelişim Değerlendirme', tool: 'Notion AI', desc: 'Haftalık yağ/kilo analiz sonuçlarını raporlayın' }
      ],
      categories: ['saglik-ai', 'genel-ai-asistan', 'is-uretkenlik-ai']
    },
    {
      id: 'etkinlik-organizasyon',
      icon: '🎉',
      title: 'Etkinlik Organizatörü',
      subtitle: 'Etkinlik & Düğün Planlama',
      color: 'hsl(330, 85%, 55%)',
      description: 'Etkinlik konsepti tasarımı, bütçe yönetimi, zaman akış planları (timeline) ve davetiye/afiş tasarımlarını yapay zekayla yönetin.',
      benefits: [
        { icon: '🎭', title: 'Konsept & Fikir Üretme', text: 'Düğün, gala, lansman veya doğum günleri için yaratıcı ve özgün etkinlik temaları ve dekorasyon fikirleri üretin.' },
        { icon: '📅', title: 'Zaman Akışı (Timeline)', text: 'Sunucu, müzisyen ve ikram saatlerini içeren dakika dakika etkinlik akış planları hazırlayın.' },
        { icon: '✉️', title: 'Davetiye & Poster AI', text: 'Canva AI veya Midjourney ile etkinlik temasına uygun şık davetiye ve poster tasarımları oluşturun.' },
        { icon: '💰', title: 'Bütçe & Tedarikçi', text: 'Harcamaları takip edin, tedarikçi listelerini optimize edin ve bütçe aşım risklerini önleyin.' }
      ],
      suggestedTools: ['chatgpt', 'gamma', 'canva-ai', 'midjourney'],
      workflow: [
        { step: 1, title: 'Konsept & Tema', tool: 'Midjourney', desc: 'Etkinlik dekorasyon tarzını görsel olarak tasarlayın' },
        { step: 2, title: 'Teklif Sunumu', tool: 'Gamma / Canva AI', desc: 'Müşteriye sunulacak bütçe ve konsept slaytını hazırlayın' },
        { step: 3, title: 'Zaman Çizelgesi', tool: 'ChatGPT / Notion AI', desc: 'Etkinlik gününün saatlik program akışını yazın' },
        { step: 4, title: 'Basılı Materyal', tool: 'Canva AI', desc: 'Giriş kartları, davetiye ve masa kartlarını tasarlayın' }
      ],
      categories: ['yaratici-ai', 'is-uretkenlik-ai', 'sosyal-medya-ai']
    },
    {
      id: 'gazeteci',
      icon: '📰',
      title: 'Gazeteci & Editör',
      subtitle: 'Medya & Yayıncılık',
      color: 'hsl(280, 70%, 45%)',
      description: 'Haber araştırma, röportaj deşifre etme, başlık optimizasyonu ve haber yazım süreçlerini yapay zeka ile hızlandırın.',
      benefits: [
        { icon: '🔍', title: 'Kaynak Araştırması', text: 'Gelişmeler ve olaylar hakkında Perplexity ile internet üzerindeki güvenilir kaynakları anında tarayın.' },
        { icon: '🎙️', title: 'Röportaj Deşifresi', text: 'Saatler süren röportaj ses kayıtlarını AI ile dakikalar içinde hatasız yazılı metne dönüştürün.' },
        { icon: '✍️', title: 'SEO Uyumlu Başlıklar', text: 'Okunma oranlarını artıracak, dikkat çekici ve SEO uyumlu alternatif haber başlıkları üretin.' },
        { icon: '📝', title: 'Haber Redaksiyonu', text: 'Yazılan haberlerin tarafsızlık, dil bilgisi, akıcılık ve yazım kuralları kontrollerini otomatikleştirin.' }
      ],
      suggestedTools: ['perplexity', 'chatgpt', 'claude', 'grammarly'],
      workflow: [
        { step: 1, title: 'Haber Araştırma', tool: 'Perplexity', desc: 'Olayla ilgili kaynakları ve kronolojiyi tarayın' },
        { step: 2, title: 'Ses Deşifresi', tool: 'Transcription AI', desc: 'Kaydedilen röportaj sesini metin belgesine çevirin' },
        { step: 3, title: 'Haber Yazımı', tool: 'ChatGPT / Claude', desc: 'Haber metnini nesnel ve akıcı bir dilde kaleme alın' },
        { step: 4, title: 'Son Kontrol', tool: 'Grammarly', desc: 'Metnin imla, dil bilgisi ve başlık optimizasyonunu yapın' }
      ],
      categories: ['bilgi-arastirma-ai', 'genel-ai-asistan', 'is-uretkenlik-ai']
    }
  ];

  // ═══════════════════════════════════════════
  // DOM ELEMENTS
  // ═══════════════════════════════════════════
  var grid = document.getElementById('professions-grid');
  var detailSection = document.getElementById('profession-detail');
  var gridSection = document.querySelector('.professions-grid-section');
  var heroSection = document.querySelector('.professions-hero');
  var detailHeader = document.getElementById('profession-detail-header');
  var benefitsContainer = document.getElementById('profession-benefits');
  var toolsGrid = document.getElementById('profession-tools-grid');
  var workflowContainer = document.getElementById('profession-workflow');
  var backBtn = document.getElementById('profession-back-btn');

  // ═══════════════════════════════════════════
  // THEME TOGGLE
  // ═══════════════════════════════════════════
  var themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    var savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // ═══════════════════════════════════════════
  // MOBILE MENU
  // ═══════════════════════════════════════════
  var mobileMenuBtn = document.getElementById('mobile-menu-btn');
  var mobileNav = document.getElementById('mobile-nav');
  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', function () {
      mobileNav.classList.toggle('active');
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { mobileNav.classList.remove('active'); });
    });
  }

  // ═══════════════════════════════════════════
  // RENDER PROFESSION CARDS
  // ═══════════════════════════════════════════
  function renderGrid() {
    grid.innerHTML = professions.map(function (p) {
      return '<div class="profession-card" data-profession="' + p.id + '" style="--card-accent: ' + p.color + '">' +
        '<div class="profession-card-glow"></div>' +
        '<div class="profession-card-inner">' +
          '<div class="profession-card-icon">' + p.icon + '</div>' +
          '<h3 class="profession-card-title">' + p.title + '</h3>' +
          '<span class="profession-card-subtitle">' + p.subtitle + '</span>' +
          '<p class="profession-card-desc">' + p.description + '</p>' +
          '<button class="profession-card-btn">' + ((window.i18n && typeof window.i18n.t === 'function') ? window.i18n.t('menu_explore') : 'Keşfet') + ' →</button>' +
        '</div>' +
      '</div>';
    }).join('');

    grid.querySelectorAll('.profession-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = this.dataset.profession;
        var prof = professions.find(function (p) { return p.id === id; });
        if (prof) showDetail(prof);
      });
    });
  }

  // ═══════════════════════════════════════════
  // SHOW DETAIL
  // ═══════════════════════════════════════════
  function showDetail(prof) {
    heroSection.style.display = 'none';
    gridSection.style.display = 'none';
    detailSection.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    detailHeader.innerHTML = 
      '<div class="profession-detail-icon" style="background: ' + prof.color + '22; border: 2px solid ' + prof.color + '44">' + prof.icon + '</div>' +
      '<div>' +
        '<h2 class="profession-detail-title">' + prof.title + ' için AI Çözümleri</h2>' +
        '<p class="profession-detail-subtitle">' + prof.description + '</p>' +
      '</div>';

    // Benefits
    benefitsContainer.innerHTML = prof.benefits.map(function (b) {
      return '<div class="benefit-card">' +
        '<div class="benefit-icon">' + b.icon + '</div>' +
        '<h4 class="benefit-title">' + b.title + '</h4>' +
        '<p class="benefit-text">' + b.text + '</p>' +
      '</div>';
    }).join('');

    // Workflow
    workflowContainer.innerHTML = prof.workflow.map(function (w) {
      return '<div class="workflow-step">' +
        '<div class="workflow-step-number">' + w.step + '</div>' +
        '<div class="workflow-step-content">' +
          '<h4 class="workflow-step-title">' + w.title + '</h4>' +
          '<span class="workflow-step-tool">' + w.tool + '</span>' +
          '<p class="workflow-step-desc">' + w.desc + '</p>' +
        '</div>' +
      '</div>';
    }).join('');

    // Load tools from API
    loadTools(prof);
  }

  // ═══════════════════════════════════════════
  // LOAD TOOLS FROM API
  // ═══════════════════════════════════════════
  function loadTools(prof) {
    const t = (key, fallback) => (window.i18n && typeof window.i18n.t === 'function') ? window.i18n.t(key) : fallback;
    toolsGrid.innerHTML = '<p class="profession-loading">' + t('loading', 'Araçlar yükleniyor...') + '</p>';
    
    fetch('/api/tools')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var tools = data.tools || data || [];
        var categories = data.categories || [];
        
        // Filter by relevant categories
        var matched = [];
        if (prof.categories && prof.categories.length > 0) {
          matched = tools.filter(function (t) {
            return prof.categories.indexOf(t.category_id) !== -1;
          });
        }

        // Also check tool names for suggested tools
        var suggestedNames = prof.suggestedTools || [];
        var suggested = tools.filter(function (t) {
          return suggestedNames.some(function (sn) {
            return t.id && t.id.toLowerCase().indexOf(sn.toLowerCase()) !== -1;
          });
        });

        // Merge and deduplicate
        var all = suggested.concat(matched);
        var seen = {};
        var unique = [];
        all.forEach(function (t) {
          if (!seen[t.id]) {
            seen[t.id] = true;
            unique.push(t);
          }
        });

        // Sort by rating
        unique.sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); });

        // Render cards (max 12)
        var display = unique.slice(0, 12);
        if (display.length === 0) {
          toolsGrid.innerHTML = '<p class="profession-loading">Bu meslek için henüz eşleşen araç bulunamadı.</p>';
          return;
        }

        function getCatLabel(catId) {
          var c = categories.find(function (cat) { return cat.id === catId; });
          return c ? (c.icon + ' ' + c.name) : '';
        }

        function getPricingLabel(p) {
          if (p === 'ucretsiz') return 'Ücretsiz';
          if (p === 'freemium') return 'Freemium';
          return 'Ücretli';
        }

        toolsGrid.innerHTML = display.map(function (tool) {
          var catLabel = tool.category_name ? (tool.category_icon + ' ' + tool.category_name) : '';
          var stars = '★'.repeat(Math.round(tool.rating || 4));
          var pricingLabel = getPricingLabel(tool.pricing);
          var firstLetter = tool.name.charAt(0).toUpperCase();

          return '<div class="profession-tool-card" data-id="' + tool.id + '" style="cursor:pointer">' +
            '<div class="tool-card-header">' +
              '<div class="tool-icon">' + firstLetter + '</div>' +
              '<div class="tool-info">' +
                '<h3 class="tool-name">' + tool.name + '</h3>' +
                '<span class="tool-category-badge">' + catLabel + '</span>' +
              '</div>' +
            '</div>' +
            '<p class="tool-description">' + (tool.description || '').substring(0, 100) + '...</p>' +
            '<div class="tool-footer">' +
              '<div class="tool-rating">' + stars + ' <span>' + (tool.rating || '-') + '</span></div>' +
              '<span class="tool-pricing pricing-' + tool.pricing + '">' + pricingLabel + '</span>' +
            '</div>' +
          '</div>';
        }).join('');

        toolsGrid.querySelectorAll('.profession-tool-card').forEach(function (card) {
          card.addEventListener('click', function () {
            var id = this.dataset.id;
            if (id) window.location.href = '/tool/' + id;
          });
        });
      })
      .catch(function () {
        toolsGrid.innerHTML = '<p class="profession-loading">' + t('error_loading_tools', 'Araçlar yüklenirken bir hata oluştu.') + '</p>';
      });
  }

  // ═══════════════════════════════════════════
  // BACK BUTTON
  // ═══════════════════════════════════════════
  backBtn.addEventListener('click', function () {
    detailSection.style.display = 'none';
    heroSection.style.display = '';
    gridSection.style.display = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ═══════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════
  renderGrid();

  // Animate on scroll
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(function (el) {
    observer.observe(el);
  });

});
