'use strict';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load local .env file manually into process.env
try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
} catch (e) {
  console.error('Error loading .env file:', e.message);
}

const { syncFromMongo, syncToMongo, readDB, writeDB } = require('./database');

(async () => {
  // Sync latest from MongoDB Atlas
  await syncFromMongo(true);

  const db = readDB();
  if (!db.news) db.news = [];
  if (!db.prompts) db.prompts = [];

  const newArticles = [
    {
      id: "news-tr-201",
      title: "En İyi Yapay Zeka Araçları 2026: İş Akışınızı Uçuracak 15 AI Programı",
      summary: "2026 yılında üretkenliği artıran, zaman kazandıran ve işinizi kolaylaştıracak en iyi yapay zeka araçlarını, programlarını ve ücretsiz alternatiflerini listeledik.",
      content: `<p>Teknoloji dünyası her geçen gün yeni bir yapay zeka devrimiyle sarsılıyor. 2026 yılı itibarıyla, sadece sohbet botları değil; seslendirme, video kurgu, kodlama ve grafik tasarım alanında profesyonel iş üretebilen <strong>en iyi yapay zeka araçları</strong> iş akışlarımızın vazgeçilmez bir parçası haline geldi. İşte bu yıl mutlaka denemeniz gereken en popüler AI programları:</p>
<h4>1. Metin ve İçerik Üretimi İçin En İyi AI Araçları</h4>
<p>ChatGPT-5 ve Claude 3.7 Sonnet, uzun blog yazıları yazma, e-posta taslakları hazırlama ve karmaşık kod bloklarını analiz etme konusunda pazar liderliğini koruyor. Eğer içerik üreticiyseniz veya SEO uyumlu makaleler yazmak istiyorsanız, bu araçları gelişmiş prompt yazma formülleriyle entegre ederek verimliliğinizi artırabilirsiniz.</p>
<h4>2. Resim ve Görsel Tasarımda Yapay Zeka Devrimi</h4>
<p>Midjourney v6.5 ve Stable Diffusion XL, kelimeleri göz alıcı sanat eserlerine dönüştürme konusunda sınır tanımıyor. Sosyal medya görselleri üretmek, logo tasarımı yapmak ya da marka kimliği oluşturmak için bu <strong>resim çizen yapay zekalar</strong> mükemmel sonuçlar sunuyor. Ücretsiz alternatif arayanlar için ise Bing Image Creator (DALL-E 3) ve Leonardo.ai harika seçenekler sunuyor.</p>
<h4>3. Video Üretim ve Kurgu Otomasyonları</h4>
<p>Sora ve Runway Gen-3 Alpha gibi araçlar, sadece metin komutlarıyla saniyeler içinde sinematik videolar oluşturabiliyor. YouTube, TikTok ve Instagram Reels üreticileri için video arka planı temizleme, otomatik altyazı ekleme ve ses analizi yapan yapay zeka araçları video kurgu sürecini günler yerine dakikalara indiriyor.</p>
<p>Yapay zeka araçlarını iş süreçlerinize dahil ederek rekabetin bir adım önünde yer alabilir ve operasyonel işlerinize harcadığınız zamanı yaratıcı süreçlere ayırabilirsiniz.</p>`,
      source: "AiKlavuz Teknoloji Editörü",
      sourceUrl: "https://yapayzekavitrini.com",
      publishDate: "2026-06-28",
      imageUrl: "",
      created_at: new Date().toISOString()
    },
    {
      id: "news-tr-202",
      title: "Yapay Zeka ile Para Kazanma Yolları: 2026'nın En Çok Kazandıran İş Fikirleri",
      summary: "AI teknolojilerini kullanarak ek gelir elde edebileceğiniz veya yeni bir kariyer başlatabileceğiniz, yapay zeka ile para kazanma yöntemlerini ve iş modellerini derledik.",
      content: `<p>Gelişen teknolojiyle birlikte yapay zekayı sadece tüketmekle kalmayıp, bu teknolojiyi bir kazanç kapısına dönüştürmek mümkün. 2026'da <strong>yapay zeka ile para kazanma</strong> yolları arasında en popüler olan, en düşük maliyetle yüksek gelir vadeden iş modellerini ve stratejilerini inceledik:</p>
<h4>1. AI Destekli İçerik Üretimi ve SEO Danışmanlığı</h4>
<p>Web siteleri için arama motoru optimizasyonlu (SEO) makaleler üretmek artık yapay zeka asistanları sayesinde çok daha hızlı. ChatGPT veya Claude gibi yapay zekalarla kaliteli, okuyucu dostu makaleler hazırlayarak içerik editörlüğü yapabilir, şirketlere SEO odaklı blog yönetimi hizmeti sunarak gelir elde edebilirsiniz.</p>
<h4>2. Prompt Mühendisliği ve Prompt Satışı</h4>
<p>Midjourney, DALL-E veya ChatGPT'den en iyi sonucu almak doğru kelimeleri bir araya getirmekten geçiyor. 'Prompt Mühendisi' adı verilen bu yeni meslek grubu, ürettiği görsel ve metin formüllerini PromptBase gibi platformlarda satarak küresel çapta gelir elde ediyor. Markalara özel görsel üretim şablonları hazırlamak da oldukça popüler.</p>
<h4>3. Yapay Zeka ile Sosyal Medya ve Video İçerik Yönetimi</h4>
<p>Runway, HeyGen and ElevenLabs gibi ses-video yapay zeka programlarını kullanarak yüzünüzü göstermeden 'faceless' YouTube veya TikTok kanalları kurabilirsiniz. Yapay zeka ile seslendirme ve görselleştirme yaparak eğitici, bilgilendirici videolar hazırlayabilir ve reklam gelirleri, sponsorluklar yoluyla ciddi kazançlar sağlayabilirsiniz.</p>
<p>Unutmayın, yapay zeka araçları tek başına sihirli bir değnek değildir; onları kendi yaratıcılığınız, iş disiplininiz ve doğru pazarlama yöntemleriyle birleştirdiğinizde sürdürülebilir bir iş modeli kurabilirsiniz.</p>`,
      source: "AiKlavuz Finans Analiz",
      sourceUrl: "https://yapayzekavitrini.com",
      publishDate: "2026-06-27",
      imageUrl: "",
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "news-tr-203",
      title: "DeepSeek R1 Nedir? Türkçe DeepSeek Kullanımı ve İpuçları",
      summary: "Açık kaynak dünyasında çığır açan Çin menşeili DeepSeek R1 yapay zeka modelinin özellikleri, Türkçe mantık yürütme performansı ve verimli kullanım rehberi.",
      content: `<p>Son aylarda yapay zeka dünyasının en çok konuşulan ismi şüphesiz açık kaynak kodlu <strong>DeepSeek R1</strong> oldu. Gelişmiş akıl yürütme (reasoning) yetenekleriyle dikkat çeken bu yapay zeka modeli, özellikle matematik, kodlama analizi ve mantık testlerinde rakiplerine meydan okuyor. Peki, DeepSeek Türkçe dil görevlerinde nasıl performans gösteriyor?</p>
<h4>DeepSeek R1'in Diğer Yapay Zekalardan Farkı Nedir?</h4>
<p>Geleneksel LLM modelleri sorulara doğrudan cevap üretirken, DeepSeek R1 arka planda 'Düşünme Süreci' (Thinking Process) yürüterek soruyu adım adım analiz eder. Bu süreç sayesinde matematiksel problemler, karmaşık algoritma tasarımları ve mantıksal çıkarsamalar çok daha az hata oranıyla sonuçlanır.</p>
<h4>Türkçe Dil Performansı ve Kullanım İpuçları</h4>
<p>DeepSeek Türkçe dilbilgisine, kültürel ifadelere ve yerel aramalara son derece iyi uyum gösteriyor. Türkçe kod açıklaması yaptırma veya teknik doküman çevirilerinde oldukça başarılı sonuçlar veriyor. DeepSeek R1 modelini daha verimli kullanmak için şu ipuçlarını uygulayabilirsiniz:</p>
<ul>
  <li><strong>Soruyu Adım Adım Sorun:</strong> Modelin akıl yürütme yeteneğini tetiklemek için sorularınızı 'Bunu aşamalı olarak açıklayabilir misin?' veya 'Problemi adım adım incele' şeklinde yönlendirin.</li>
  <li><strong>Kodlama Görevlerinde Detay Verin:</strong> Yazdırmak istediğiniz fonksiyonun hangi dilde olacağını, girdi-çıktı parametrelerini ve hata senaryolarını önceden belirtin.</li>
</ul>
<p>Açık kaynak dünyasının en güçlü modeli olan DeepSeek R1, yapay zekayı yerel sunucularda tamamen ücretsiz ve veri gizliliği standartlarına uygun çalıştırmak isteyen kurumsal firmalar için de en iyi alternatiftir.</p>`,
      source: "AiKlavuz Teknoloji Analiz",
      sourceUrl: "https://yapayzekavitrini.com",
      publishDate: "2026-06-26",
      imageUrl: "",
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: "news-tr-204",
      title: "Resim Çizen Yapay Zeka Programları: Ücretsiz En İyi 5 Görsel Oluşturma Aracı",
      summary: "Tasarım deneyimi gerektirmeden, sadece metin yazarak profesyonel kalitede görseller üretebileceğiniz ücretsiz resim çizen yapay zeka programlarını inceledik.",
      content: `<p>Görsel içerik üretimi, pazarlamadan sosyal medyaya kadar her sektörün en önemli ihtiyaçlarından biri. Eskiden profesyonel tasarım programlarını öğrenmek gerekirken, günümüzde <strong>resim çizen yapay zeka</strong> araçları sayesinde sadece bir cümle yazarak saniyeler içinde hayalinizdeki görsele ulaşabilirsiniz. İşte 2026'da kullanabileceğiniz en iyi ücretsiz yapay zeka görsel oluşturma araçları:</p>
<h4>1. Leonardo.ai (Gelişmiş Özellikler ve Modeller)</h4>
<p>Leonardo.ai, her gün yenilenen ücretsiz jetonları sayesinde geniş kitleler tarafından tercih ediliyor. İçerisinde portre çizimi, anime tasarımları, 3D karakter üretimi gibi birçok hazır model barındıran platform, kullanıcı dostu arayüzüyle harikalar yaratıyor.</p>
<h4>2. Bing Image Creator / Copilot (DALL-E 3 Gücü)</h4>
<p>Microsoft tarafından sunulan bu ücretsiz araç, OpenAI'ın en güçlü görsel motoru olan DALL-E 3'ü kullanıyor. Türkçe komutları çok iyi anlayan Copilot, özellikle detaylı ve yazılı görseller üretme konusunda en başarılı ücretsiz seçeneklerden biridir.</p>
<h4>3. Krea.ai (Gerçek Zamanlı Görsel Üretimi ve Upscale)</h4>
<p>Krea.ai, siz metin yazarken veya basit karalamalar yaparken gerçek zamanlı olarak görseli tamamlamasıyla ünlüdür. Ayrıca mevcut düşük kaliteli resimlerinizi yapay zeka ile netleştirme (upscale) özelliği de profesyonel düzeydedir.</p>
<h4>4. Adobe Firefly (Telif Hukuku Uyumlu Tasarımlar)</h4>
<p>Adobe'un kendi lisanslı kütüphanesiyle eğittiği Firefly, ticari projelerinizde telif hakkı sorunu yaşamadan görsel üretmenizi sağlar. Photoshop entegrasyonu sayesinde profesyonel tasarımcıların vazgeçilmez yardımcılarından biridir.</p>
<p>Hayal gücünüzü kelimelere dökerek bu yapay zeka görsel araçları ile sunum dosyalarınızı, sosyal medya postlarınızı ve web sitenizi benzersiz görsellerle zenginleştirebilirsiniz.</p>`,
      source: "AiKlavuz Tasarım Rehberi",
      sourceUrl: "https://yapayzekavitrini.com",
      publishDate: "2026-06-25",
      imageUrl: "",
      created_at: new Date(Date.now() - 14400000).toISOString()
    },
    {
      id: "news-tr-205",
      title: "Sosyal Medya Yöneticileri İçin En İyi Yapay Zeka Araçları ve Otomasyon Rehberi",
      summary: "Instagram, TikTok ve YouTube platformlarında içerik fikirleri bulmaktan, otomatik video üretimine kadar sosyal medya süreçlerinizi otomatikleştirecek AI programları.",
      content: `<p>Sosyal medya içerik üretimi ve yönetimi ciddi bir zaman ve yaratıcılık gerektirir. Neyse ki, sosyal medya ajansları ve bireysel içerik üreticileri için geliştirilen <strong>yapay zeka sosyal medya otomasyon araçları</strong>, haftalık içerik planlamasını saatler içinde tamamlamayı mümkün kılıyor. İşte sosyal medya yöneticilerinin kullanması gereken en iyi araçlar:</p>
<h4>1. Otomatik Metin ve Caption Hazırlayıcılar</h4>
<p>Copy.ai ve Jasper, sosyal medya gönderileriniz için dikkat çekici başlıklar (caption), hashtag grupları ve YouTube video açıklamaları yazma konusunda uzmanlaşmıştır. Hangi hedef kitleye hitap edeceğinizi ve tonlamanızı belirleyerek dakikalar içinde onlarca farklı alternatif başlık üretebilirsiniz.</p>
<h4>2. Yapay Zeka ile Seslendirme (Text-to-Speech)</h4>
<p>ElevenLabs, ses tonunuza inanılmaz derecede benzeyen veya profesyonel ses sanatçısı kalitesinde yapay zeka sesleri üretebilen bir yazılımdır. Videolarınız için dublaj yapmak veya Türkçe seslendirmeli eğitim videoları hazırlamak için en kaliteli yapay zeka ses üreticisidir.</p>
<h4>3. Şablon Tasarım ve Otomatik Paylaşım</h4>
<p>Canva Magic Design, verdiğiniz metin komutlarına veya ürün fotoğraflarına göre anında Instagram post şablonları hazırlayabiliyor. Buffer veya Hootsuite gibi entegre AI asistanları ise oluşturduğunuz gönderileri en yüksek etkileşim saatlerinde otomatik olarak paylaşarak zaman yönetiminizi en üst seviyeye çıkarıyor.</p>
<p>Bu yapay zeka araçlarını entegre ederek, sosyal medya hesaplarınızda paylaşımların sürekliliğini sağlayabilir, etkileşim oranlarınızı artırabilir ve marka bilinirliğinizi büyütebilirsiniz.</p>`,
      source: "AiKlavuz Sosyal Medya Rehberi",
      sourceUrl: "https://yapayzekavitrini.com",
      publishDate: "2026-06-24",
      imageUrl: "",
      created_at: new Date(Date.now() - 28800000).toISOString()
    }
  ];

  const newPrompts = [
    {
      id: "prompt-seo-1",
      title: "Google SEO Uyumlu Blog Yazısı ve Makale Yazıcı",
      category: "Pazarlama",
      targetTool: "ChatGPT / Claude / DeepSeek",
      description: "Anahtar kelimelerinizi girerek Google arama sonuçlarında üst sıralara çıkacak, SEO uyumlu ve kullanıcı dostu makaleler yazdırın.",
      promptText: "Sen uzman bir SEO uzmanı ve içerik stratejistisin. Senden [KONU] hakkında, [ANAHTAR KELİMELER] listesini içeren, Google sıralama kriterlerine (EEAT) tam uyumlu bir blog makalesi yazmanı istiyorum.\n\nLütfen şu kurallara kesinlikle uy:\n1. Başlık (H1) ilgi çekici ve anahtar kelime içermeli.\n2. Makale en az 1000 kelime uzunluğunda, derinlemesine bilgi veren bir yapıda olmalı.\n3. H2 ve H3 alt başlıkları kullanarak okumayı kolaylaştır.\n4. Anahtar kelimeleri metnin içine doğal bir şekilde dağıt, kelime yığılması (stuffing) yapma.\n5. Giriş paragrafında okuyucuyu yakalayacak bir kanca (hook) kullan ve sonuç kısmında net bir eyleme çağrı (CTA) ekle.\n6. Dil tonu samimi, profesyonel ve bilgilendirici olmalı.\n\nKonu ve anahtar kelimeleri girdiğimde makaleyi yazmaya başla.",
      isPromptOfTheDay: true,
      votes: 42,
      created_at: new Date().toISOString()
    },
    {
      id: "prompt-seo-2",
      title: "Midjourney V6 Ultra Gerçekçi Fotoğrafik Görsel Prompteur",
      category: "Tasarım",
      targetTool: "Midjourney",
      description: "Midjourney v6 için stüdyo kalitesinde, dramatik ışıklı ve gerçekçi resimler çizen en iyi prompt formülü.",
      promptText: "A hyper-realistic studio portrait of [KİŞİ VEYA ÖĞE], shot on 85mm lens, f/1.8 aperture, dramatic cinematic lighting with soft rim light, highly detailed skin textures, photorealistic reflection in the eyes, 8k resolution, award-winning photography, volumetric smoke background, --ar 16:9 --style raw --v 6.0",
      isPromptOfTheDay: false,
      votes: 28,
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "prompt-seo-3",
      title: "Instagram Reels / TikTok Kanca (Hook) ve Senaryo Üretici",
      category: "Sosyal Medya",
      targetTool: "ChatGPT / Claude",
      description: "Sosyal medyada izlenme rekorları kıracak, ilk 3 saniyede izleyiciyi kilitleyen kancalı Reels video senaryoları tasarlayın.",
      promptText: "Sen yaratıcı bir sosyal medya danışmanı ve viral içerik üreticisisin. Senden [VİDEO KONUSU] hakkında bir Instagram Reels / TikTok video senaryosu yazmanı istiyorum.\n\nSenaryo şu bölümlerden oluşmalı:\n1. KANCA (İlk 3 saniye): İzleyicinin videoyu kaydırmasını önleyecek 3 alternatif şok edici/ilgi çekici cümle öner.\n2. GELİŞME (3-20. saniyeler): Konunun ana değerini/çözümünü 3 maddede hızlı ve dinamik bir dille aktar.\n3. SONUÇ / CTA (Son 5 saniye): İzleyiciyi yorum yapmaya, kaydetmeye veya takip etmeye yönlendiren güçlü bir kapanış ekle.\n\nEk olarak ekranda görünecek görsel talimatları (B-roll önerileri) parantez içinde belirt. Konuyu girdiğimde senaryoyu oluştur.",
      isPromptOfTheDay: false,
      votes: 35,
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  // Combine and filter out existing items with the same IDs to prevent duplication
  const existingNewsIds = new Set(db.news.map(n => n.id));
  let addedNewsCount = 0;

  newArticles.forEach(art => {
    if (!existingNewsIds.has(art.id)) {
      db.news.unshift(art); // Add to the beginning so they appear as recent news
      addedNewsCount++;
    }
  });

  const existingPromptIds = new Set(db.prompts.map(p => p.id));
  let addedPromptCount = 0;

  newPrompts.forEach(pr => {
    if (!existingPromptIds.has(pr.id)) {
      db.prompts.unshift(pr);
      addedPromptCount++;
    }
  });

  writeDB(db);
  console.log('Writing locally to data.json...');
  
  console.log('Syncing to MongoDB Atlas...');
  await syncToMongo(db);
  
  console.log(`[Success] Successfully added ${addedNewsCount} SEO articles and ${addedPromptCount} SEO prompts to the database and synced to MongoDB Atlas.`);
  process.exit(0);
})();
