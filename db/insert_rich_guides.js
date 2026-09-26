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
  try {
    await syncFromMongo(true);
  } catch (e) {
    console.warn('Mongo sync skipped:', e.message);
  }

  const db = readDB();
  if (!db.news) db.news = [];

  const richGuides = [
    {
      id: "rehber-yazilimcilar-icin-en-iyi-ai-kodlama-asistanlari",
      title: "Yazılımcılar İçin En İyi AI Kodlama Asistanları: Cursor, GitHub Copilot ve Claude Dev Karşılaştırması",
      summary: "Yazılım geliştirme süreçlerini hızlandıran, hata ayıklama süresini yarı yarıya indiren en popüler yapay zeka kodlama araçlarının derinlemesine analizi.",
      content: `<p>Yazılım dünyasında yapay zeka artık bir lüks değil, geliştiricilerin günlük iş akışının vazgeçilmez bir parçası haline geldi. 2026 yılı itibarıyla yapay zeka kod asistanları, sadece basit kod tamamlama işlevinin ötesine geçerek tüm proje mimarisini anlayan, kod tabanında çoklu dosya düzenlemeleri yapabilen ve karmaşık algoritmaları dakikalar içinde üretebilen akıllı iş ortaklarına dönüştü.</p>

<h3>1. Cursor IDE: Yapay Zeka Odaklı Kod Editörü</h3>
<p>Cursor, VS Code tabanlı geliştirilen ve merkezine yapay zekayı alan modern bir kod editörüdür. Cursor'ı diğer eklentilerden ayıran en önemli özellik, tüm projenizin (codebase) semantik indeksini çıkarabilmesidir. Böylece 'Composer' modu sayesinde tek bir komutla birden fazla dosyada eş zamanlı değişiklik yapabilir, yeni özellikler ekleyebilir ve refactoring süreçlerini yönetebilirsiniz.</p>
<ul>
  <li><strong>Öne Çıkan Özellikler:</strong> @Files ve @Codebase referansları ile bağlamı tam kavrama, Claude 3.7 ve GPT-4o model desteği.</li>
  <li><strong>Kimler İçin Uygun:</strong> Modern web, mobil ve backend geliştiricileri; tam entegre AI editör deneyimi arayanlar.</li>
</ul>

<h3>2. GitHub Copilot: Kurumsal ve Bireysel Standart</h3>
<p>Microsoft ve OpenAI ortaklığıyla geliştirilen GitHub Copilot, pazarın en köklü ve yaygın kullanılan aracıdır. VS Code, JetBrains IDE'leri, Neovim ve Visual Studio ile mükemmel uyumluluğa sahiptir. GitHub entegrasyonu sayesinde pull request incelemeleri, test senaryosu üretimi ve CLI komutları önerme konularında geliştiriciye büyük kolaylık sağlar.</p>
<ul>
  <li><strong>Güçlü Yönleri:</strong> Güvenilirlik, kurumsal güvenlik ve gizlilik standartları, geniş IDE desteği.</li>
  <li><strong>Sınırlılıkları:</strong> Tüm projeyi aynı anda baştan sona dönüştürme yeteneği Cursor kadar esnek olmayabilir.</li>
</ul>

<h3>3. Claude Dev (Cline) ve Açık Kaynak Çözümler</h3>
<p>Son dönemde popülerliği hızla artan otonom ajan eklentileri (Cline, Continue vb.), geliştiricinin kendi API anahtarlarını (Anthropic, DeepSeek, OpenAI) bağlamasına olanak tanır. Özellikle Claude 3.7 Sonnet modelinin yüksek mantıksal akıl yürütme kapasitesi, karmaşık hata ayıklama (debugging) süreçlerinde insan yazılımcı seviyesinde çözümler üretir.</p>

<h3>Sonuç ve Tavsiye</h3>
<p>Eğer günlük işlerinizde maksimum hız ve sıfırdan proje geliştirme esnekliği istiyorsanız <strong>Cursor IDE</strong> açık ara en verimli tercihtir. Mevcut kurumsal IDE ekosisteminizden ayrılmak istemiyorsanız <strong>GitHub Copilot</strong> en dengeli çözümdür. Bütçe dostu ve derin akıl yürütme odaklı projelerde ise DeepSeek V3 veya Claude modellerini entegre eden araçlar öne çıkmaktadır.</p>`,
      source: "AiKlavuz Teknoloji Rehberi",
      sourceUrl: "https://aiklavuz.com",
      publishDate: "2026-09-20",
      imageUrl: "",
      created_at: new Date("2026-09-20T10:00:00Z").toISOString()
    },
    {
      id: "rehber-chatgpt-claude-gemini-karsilastirma",
      title: "ChatGPT vs Claude vs Gemini: Hangi Yapay Zeka Modelini Ne Zaman Tercih Etmelisiniz?",
      summary: "Pazarın üç büyük yapay zeka devi OpenAI ChatGPT, Anthropic Claude ve Google Gemini arasındaki farklar, avantajlar ve Türkçe performans analizi.",
      content: `<p>Büyük dil modelleri (LLM) arasındaki rekabet her geçen gün kızışıyor. Kullanıcılar sıklıkla 'En iyi yapay zeka hangisi?' sorusunu sorsa da, günümüzde her modelin parladığı ve zayıf kaldığı belirli kullanım alanları mevcuttur. Bu rehberde OpenAI ChatGPT, Anthropic Claude ve Google Gemini'yi tarafsız kriterlerle masaya yatırıyoruz.</p>

<h3>1. OpenAI ChatGPT (GPT-4o & o1 Ailesi)</h3>
<p>ChatGPT, geniş kullanıcı kitlesi ve zengin entegrasyon ekosistemi ile yapay zekanın amiral gemisi olmaya devam ediyor. Özellikle çok modlu (multimodal) sesli iletişim, görsel yorumlama ve gelişmiş veri analizi özellikleri onu çok yönlü bir asistana dönüştürüyor.</p>
<ul>
  <li><strong>En İyi Olduğu Alanlar:</strong> Günlük asistanlık, sesli sohbet, karmaşık matematiksel akıl yürütme (o1/o3 serisi), Python kod çalıştırma ve tablo analizi.</li>
  <li><strong>Türkçe Performansı:</strong> Çok akıcı ve zengin kelime dağarcığı.</li>
</ul>

<h3>2. Anthropic Claude (Claude 3.5 & 3.7 Sonnet)</h3>
<p>Anthropic, özellikle yazılımcılar, araştırmacılar ve yazarlar arasında birinci tercih haline geldi. Claude'un en büyük üstünlüğü, metin yazarken 'yapay zeka gibi kokmayan' doğal tonlaması ve karmaşık mantıksal problemlerdeki hatasız analiz yeteneğidir.</p>
<ul>
  <li><strong>En İyi Olduğu Alanlar:</strong> Kodlama, uzun makale ve akademik rapor yazımı, teknik dokümantasyon analizi, nüanslı düşünme.</li>
  <li><strong>Artifacts Özelliği:</strong> Kodları ve görsel arayüzleri anında tarayıcıda çalıştırıp önizleme imkanı sunması büyük bir avantajdır.</li>
</ul>

<h3>3. Google Gemini (Gemini 2.0 Flash & Pro)</h3>
<p>Google'ın devasa altyapısından beslenen Gemini, özellikle devasa bağlam penceresi (context window) ve Google ekosistemi entegrasyonu (YouTube, Google Docs, Drive, Haritalar) ile öne çıkıyor. Milyonlarca token'lık belgeleri veya saatlerce süren videoları tek seferde analiz edebilme yeteneği rakipsizdir.</p>
<ul>
  <li><strong>En İyi Olduğu Alanlar:</strong> Yüzlerce sayfalık PDF analizleri, YouTube video özetleme, Google Workspace entegrasyonu ve güncel web aramaları.</li>
  <li><strong>Hız:</strong> Gemini Flash modelleri piyasadaki en hızlı yanıt sürelerine sahiptir.</li>
</ul>

<h3>Özet Tablo: Kimi Seçmelisiniz?</h3>
<p>Hızlı bilgi arama, Google araçları ve uzun dokümanlar için <strong>Gemini</strong>; yazılım geliştirme, kusursuz Türkçe edebi yazılar ve derin mantık için <strong>Claude</strong>; çok yönlü genel asistanlık, görsel üretimi (DALL-E) ve sesli etkileşim için ise <strong>ChatGPT</strong> tercih edilmelidir.</p>`,
      source: "AiKlavuz Editoryal İnceleme",
      sourceUrl: "https://aiklavuz.com",
      publishDate: "2026-09-18",
      imageUrl: "",
      created_at: new Date("2026-09-18T10:00:00Z").toISOString()
    },
    {
      id: "rehber-ileri-seviye-prompt-muhendisligi-teknikleri",
      title: "Yapay Zekadan Kusursuz Sonuç Alma: İleri Seviye Prompt Mühendisliği Rehberi",
      summary: "Yapay zeka modellerine doğru soru ve yönlendirme vermenin püf noktaları. Rol atama, Few-Shot Prompting, Chain of Thought ve yapılandırılmış çıktı teknikleri.",
      content: `<p>Yapay zeka modellerinin kalitesi ne kadar yüksek olursa olsun, aldığınız çıktının değeri tamamen girdiğiniz komutun (prompt) kalitesine bağlıdır. Çoğu kullanıcı yapay zekaya yüzeysel sorular sorup vasat yanıtlar alırken, prompt mühendisliği tekniklerini bilen uzmanlar saatler sürecek analizleri dakikalar içinde tamamlamaktadır.</p>

<h3>1. Rol ve Bağlam Tanımlama (Persona & Context)</h3>
<p>Yapay zekaya sadece bir görev vermek yerine, hangi rolde konuşacağını ve hedef kitlenin kim olduğunu belirtin. Örneğin: <em>'Sen 15 yıllık deneyime sahip kıdemli bir e-ticaret danışmanısın. Bütçesi kısıtlı yeni bir girişimciye hitap ediyorsun.'</em> Bu tanımlama, modelin yanıt tonunu ve teknik derinliğini doğrudan optimize eder.</p>

<h3>2. Adım Adım Düşünme: Chain-of-Thought (CoT)</h3>
<p>Karmaşık stratejik kararlarda veya mantık yürütme gerektiren sorularda yapay zekaya <strong>'Adım adım düşünerek açıkla'</strong> komutunu vermek, modelin hata yapma olasılığını %40'a kadar azaltır. Model sonuca atlamak yerine ara adımları kendi kendine doğrular.</p>

<h3>3. Örneklerle Yönlendirme (Few-Shot Prompting)</h3>
<p>Modelden beklediğiniz formatı veya üslubu anlatmak yerine 1-2 adet girdi-çıktı örneği gösterin. Örneğin ürün açıklaması yazdıracaksanız, daha önce beğendiğiniz bir örneği prompt'a ekleyin. Model verilen şablonu hızla kavrayıp aynı çizgide çıktı üretecektir.</p>

<h3>4. Yapılandırılmış Çıktı Alma (JSON, Tablo, Markdown)</h3>
<p>Yapay zekanın gereksiz selamlama ve laf kalabalığı yapmasını engellemek için çıktıyı belirli bir formatta talep edin: <em>'Yalnızca JSON formatında yanıt ver', 'Sadece Markdown tablosu oluştur'</em> veya <em>'En fazla 3 maddelik kısa bir özet hazırla'</em>.</p>

<p>Bu temel kuralları alışkanlık haline getirdiğinizde, yapay zeka araçlarının iş verimliliğinizi 10 katına nasıl çıkarabildiğini göreceksiniz.</p>`,
      source: "AiKlavuz Akademi Serisi",
      sourceUrl: "https://aiklavuz.com",
      publishDate: "2026-09-15",
      imageUrl: "",
      created_at: new Date("2026-09-15T10:00:00Z").toISOString()
    },
    {
      id: "rehber-yapay-zeka-ile-gorsel-ve-video-uretimi",
      title: "Yapay Zeka ile Görsel ve Video Üretimi: Midjourney, Stable Diffusion ve Runway Rehberi",
      summary: "Tasarımcılar, ajanslar ve pazarlamacılar için yapay zeka tabanlı görsel ve video üretim araçlarının karşılaştırması ve pratik kullanım adımları.",
      content: `<p>Görsel ve video prodüksiyon sektörü, üretken yapay zeka modelleriyle birlikte köklü bir devrim yaşıyor. Eskiden günler süren fotoğraf çekimleri, illüstrasyon çizimleri ve video kurgu süreçleri, artık doğru yapay zeka komutlarıyla dakikalar içinde gerçekleştirilebiliyor.</p>

<h3>1. Midjourney: Sanatsal Estetikte Zirve</h3>
<p>Midjourney v6 serisi, fotogerçekçi portreler, mimari konseptler, ürün renderları ve fütüristik tasarımlar üretmede sektörün lideridir. Işık oyunları, derinlik hissi ve malzeme dokusunu aktarma yeteneği onu reklam ajanslarının ve yaratıcı yönetmenlerin bir numaralı tercihi yapmaktadır.</p>

<h3>2. Stable Diffusion ve Flux.1: Açık Kaynak Gücü ve Tam Kontrol</h3>
<p>Özellikle Black Forest Labs tarafından geliştirilen <strong>Flux.1</strong> modeli, metinleri görsellerin üzerine doğru yazabilme kabiliyeti ve insan anatomisindeki gerçekçiliği ile büyük beğeni topladı. Kendi bilgisayarınızda yerel (local) olarak çalıştırılabilmesi ve telif/gizlilik esnekliği sunması profesyoneller için büyük bir artıdır.</p>

<h3>3. Runway Gen-3 ve Sora: Metinden Video Üretimi</h3>
<p>Fotoğrafları hareketlendirmek, sıfırdan sinematik sahneler kurgulamak ve kamera açılarını kontrol etmek artık metinden videoya (Text-to-Video) modelleriyle mümkün. Runway Gen-3, gerçekçi fizik simülasyonları ve kamera hareket kontrolü ile reklam filmleri ve sosyal medya klipleri için güçlü bir prodüksiyon aracı sunuyor.</p>

<h3>Görsel Üretiminde Başarılı Olmanın 3 İpucu</h3>
<ul>
  <li><strong>Kamera ve Lens Belirtin:</strong> 'Shot on 35mm lens, f/1.8 aperture, natural sunlight' gibi fotoğrafçılık terimleri görselin gerçekçiliğini katlar.</li>
  <li><strong>Negatif Prompt Kullanın:</strong> İstemediğiniz öğeleri (çarpık parmaklar, düşük çözünürlük, bulanıklık) negatif prompt ile filtreleyin.</li>
  <li><strong>Çözünürlük ve Oranları Belirleyin:</strong> Instagram dikey içerikler için --ar 9:16, YouTube için --ar 16:9 oranlarını baştan tanımlayın.</li>
</ul>`,
      source: "AiKlavuz Tasarım Masası",
      sourceUrl: "https://aiklavuz.com",
      publishDate: "2026-09-12",
      imageUrl: "",
      created_at: new Date("2026-09-12T10:00:00Z").toISOString()
    },
    {
      id: "rehber-kobiler-icin-adim-adim-yapay-zeka-donusumu",
      title: "KOBİ'ler ve Girişimciler İçin Adım Adım Yapay Zeka Dönüşümü: Maliyetleri Düşürme ve Verimlilik",
      summary: "Küçük ve orta ölçekli işletmelerin müşteri desteği, muhasebe, pazarlama ve veri analizinde yapay zekayı nasıl karlı bir şekilde uygulayabileceğine dair pratik rehber.",
      content: `<p>Yapay zeka yalnızca Silikon Vadisi teknoloji devlerinin erişebildiği pahalı bir teknoloji olmaktan çıktı. Günümüzde küçük bir kafe, yerel bir e-ticaret mağazası veya 10 kişilik bir hukuk bürosu bile ayda birkaç yüz liralık yapay zeka araçlarıyla operasyonel maliyetlerini %30 azaltabiliyor.</p>

<h3>1. Adım: 7/24 Akıllı Müşteri Hizmetleri</h3>
<p>KOBİ'lerin en büyük sorunlarından biri, mesai saatleri dışında gelen müşteri sorularına anında yanıt verememektir. Web sitenize entegre edilecek Claude veya GPT tabanlı bir yapay zeka sohbet botu (Chatbot), şirketinizin ürün kataloğunu, sıkça sorulan sorularını ve iade koşullarını öğrenerek müşterilerinize anında profesyonel yanıtlar verebilir.</p>

<h3>2. Adım: Sosyal Medya ve Pazarlama İçerikleri</h3>
<p>Pahalı ajans bütçeleri yerine, haftalık blog yazılarınızı, Instagram gönderi açıklamalarınızı, e-posta bültenlerinizi ve kampanya sloganlarınızı yapay zeka destekli metin ve tasarım araçlarıyla (Canva AI, Copy.ai vb.) şirket içinde kolayca üretebilirsiniz.</p>

<h3>3. Adım: Satış ve Stok Verilerini Görselleştirme</h3>
<p>Excel tabloları içinde kaybolmak yerine, Excel veya Google E-Tablolar'daki satış verilerinizi yapay zekaya yükleyerek <em>'Hangi ürün grubumuz en karlı?', 'Gelecek ay hangi ürünlerde stok açığı yaşayabiliriz?'</em> gibi sorular sorarak anında stratejik grafikler ve içgörüler elde edebilirsiniz.</p>

<h3>KOBİ'ler İçin Altın Kurallar</h3>
<p>Yapay zekaya geçiş yaparken her şeyi aynı anda otomatikleştirmeye çalışmayın. En çok zamanınızı alan ve tekrarlayan tek bir süreçle (örneğin müşteri e-postalarını yanıtlamak) başlayın, ekibinizi eğitin ve sonuçları ölçerek büyüyün.</p>`,
      source: "AiKlavuz Girişimcilik Bülteni",
      sourceUrl: "https://aiklavuz.com",
      publishDate: "2026-09-10",
      imageUrl: "",
      created_at: new Date("2026-09-10T10:00:00Z").toISOString()
    }
  ];

  let addedCount = 0;
  for (const guide of richGuides) {
    const existingIdx = db.news.findIndex(n => n.id === guide.id);
    if (existingIdx >= 0) {
      db.news[existingIdx] = guide;
    } else {
      db.news.unshift(guide);
      addedCount++;
    }
  }

  writeDB(db);
  console.log(`Successfully added/updated ${richGuides.length} rich editorial guides. (Total news: ${db.news.length})`);

  try {
    await syncToMongo(true);
    console.log('Synchronized to MongoDB Atlas.');
  } catch (e) {
    console.warn('Mongo upload skipped (local only):', e.message);
  }
})();
