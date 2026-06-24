'use strict';
const { readDB, writeDB } = require('./database');

const db = readDB();
if (!db.news) db.news = [];

const newArticles = [
  {
    id: "news-tr-101",
    title: "BTK ve Sanayi Bakanlığı'ndan Milli Yapay Zeka Stratejisi Güncellemesi: Hedef Kendi Çiplerimiz",
    summary: "Türkiye'nin 2026-2030 Milli Yapay Zeka Stratejisi açıklandı. Sanayi ve Teknoloji Bakanlığı ile BTK ortaklığında, kamu hizmetlerinde yerli dil modelleri ve yerli yapay zeka çipleri geliştirilecek.",
    content: `<p>Sanayi ve Teknoloji Bakanlığı ile Bilgi Teknolojileri ve İletişim Kurumu (BTK), Türkiye'nin teknolojik bağımsızlığını güçlendirecek yeni Milli Yapay Zeka Strateji Belgesi'ni (2026-2030) resmi olarak yayımladı. Yeni dönem stratejisinin odağında yerli yapay zeka çipleri ve Türkçe büyük dil modelleri (LLM) bulunuyor.</p>
<p>Bakanlık yetkilileri, özellikle kamu kurumlarında dışa bağımlılığı azaltmak adına kritik verilerin işlendiği tüm süreçlerin yerli sistemler üzerinden yürütüleceğini duyurdu. Bu kapsamda, TÜBİTAK BİLGEM bünyesinde tasarlanacak milli yapay zeka hızlandırıcı çiplerin prototip üretimine başlanması hedefleniyor.</p>
<p>Ayrıca BTK Akademi aracılığıyla önümüzdeki 3 yıl içinde 100 bin yapay zeka uzmanının yetiştirilmesi planlanıyor. Eğitimlerin ardından başarılı olan genç geliştiricilere finansman ve kuluçka merkezi desteği sağlanarak yerli yapay zeka start-up ekosisteminin büyütülmesi amaçlanıyor.</p>`,
    source: "BTK Basın Bülteni",
    sourceUrl: "https://www.btk.gov.tr",
    publishDate: "2026-06-24",
    imageUrl: "",
    created_at: new Date().toISOString()
  },
  {
    id: "news-tr-102",
    title: "Yerli Yapay Zeka Girişimi Tazi.ai, ABD'deki Finans Devleriyle Masada",
    summary: "Türk girişimciler tarafından kurulan ve sürekli öğrenen yapay zeka (continuous learning) teknolojileri geliştiren Tazi.ai, ABD pazarında finans ve sigortacılık sektöründe hızla büyüyor.",
    content: `<p>Türkiye'nin en başarılı yapay zeka girişimlerinden biri olan Tazi.ai, Amerika Birleşik Devletleri'ndeki sigortacılık ve bankacılık sektörlerine yönelik geliştirdiği makine öğrenmesi modelleriyle küresel büyümesini sürdürüyor. Klasik yapay zekaların aksine 'sürekli öğrenen' (continuous learning) mimarisiyle dikkat çeken platform, değişen finansal koşullara anında uyum sağlıyor.</p>
<p>Şirketin kurucuları, geliştirdikleri teknolojinin finansal kurumlara risk analizinde %30'a varan doğruluk artışı sağladığını belirtiyor. ABD'deki büyük finans kuruluşlarının Tazi.ai altyapısını kullanarak kredi onaylama ve sahtekarlık önleme süreçlerini otomatikleştirdikleri açıklandı.</p>
<p>Türkiye'de doğup dünyaya açılan girişimin bu başarısı, yerli teknoloji ekosisteminin küresel standartlarda rekabet edebilir yazılımlar üretebileceğinin en önemli kanıtlarından biri olarak değerlendiriliyor.</p>`,
    source: "TRAI Girişim Bülteni",
    sourceUrl: "https://turkiye.ai",
    publishDate: "2026-06-23",
    imageUrl: "",
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "news-tr-103",
    title: "Trendyol LLM ve TÜBİTAK İş Birliği: Türkiye'nin En Büyük Türkçe Dil Modeli Geliyor",
    summary: "Trendyol, geliştirdiği açık kaynaklı Türkçe LLM modelini TÜBİTAK BİLGEM'in yüksek performanslı hesaplama altyapısıyla eğitiyor. Model, Türkçe dil görevlerinde rekor kırıyor.",
    content: `<p>Türkiye'nin e-ticaret devi Trendyol ve TÜBİTAK BİLGEM, Türkçe dil yapısına tamamen hakim, yüksek performanslı yeni bir büyük dil modeli (LLM) geliştirmek için güçlerini birleştirdi. Daha önce açık kaynak olarak paylaşılan Trendyol LLM'in yeni versiyonu, TÜBİTAK'ın süper bilgisayarlarında milyarlarca Türkçe kelimeyle eğitiliyor.</p>
<p>Yerli dil modelinin en büyük avantajı, Türkçe'nin eklemeli yapısını, deyimleri, kültürel bağlamı ve yerel ifade biçimlerini diğer küresel modellere kıyasla çok daha yüksek doğrulukla anlaması ve üretmesidir. Model, müşteri hizmetlerinden hukuk analizine, içerik üretiminden kod yazımına kadar birçok alanda yerli şirketlere hizmet verecek.</p>
<p>Projenin tamamlanmasının ardından modelin açık kaynak topluluğuna sunulacağı ve geliştiricilerin kendi özel yapay zeka asistanlarını bu altyapıyla kolayca eğitebileceği bildirildi.</p>`,
    source: "Trendyol Tech",
    sourceUrl: "https://github.com/trendyol",
    publishDate: "2026-06-22",
    imageUrl: "",
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: "news-tr-104",
    title: "İTÜ'den Tarımda Devrim: Yapay Zeka Destekli IoT Sensörleri ile %40 Su Tasarrufu",
    summary: "İstanbul Teknik Üniversitesi (İTÜ) akademisyenleri, tarlalardaki nem, sıcaklık ve toprak kalitesini analiz ederek sulamayı optimize eden yerli yapay zeka algoritmasını duyurdu.",
    content: `<p>İstanbul Teknik Üniversitesi (İTÜ) Bilgisayar ve Bilişim Fakültesi, tarımda verimliliği artırmak ve iklim kriziyle mücadele etmek amacıyla yapay zeka destekli akıllı tarım projesini hayata geçirdi. Toprağa yerleştirilen IoT (Nesnelerin İnterneti) sensörlerinden gelen anlık veriler, yerli yapay zeka modeli tarafından analiz ediliyor.</p>
<p>Sistem, toprağın tam olarak hangi bölgede ve ne zaman suya ihtiyaç duyduğunu tespit ederek sulama vanalarını otomatik olarak yönetiyor. Pilot bölgelerde yapılan testlerde, geleneksel sulama yöntemlerine kıyasla %40 su tasarrufu elde edilirken ürün verimliliğinde %15 artış kaydedildi.</p>
<p>Projenin Tarım ve Orman Bakanlığı iş birliğiyle tüm Türkiye genelindeki kooperatiflere yaygınlaştırılması ve çiftçilerin mobil uygulama üzerinden tarlalarını anlık olarak yapay zeka tavsiyeleriyle izlemesi hedefleniyor.</p>`,
    source: "İTÜ Akademik Haberler",
    sourceUrl: "https://www.itu.edu.tr",
    publishDate: "2026-06-21",
    imageUrl: "",
    created_at: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: "news-tr-105",
    title: "Hukukta Yapay Zeka Dönemi: Türk Avukatlar İçin Yerli İçtihad Analiz Sistemleri",
    summary: "Türkiye'deki hukuk büroları, binlerce sayfalık dava dosyalarını ve Yargıtay kararlarını saniyeler içinde analiz eden yerli yapay zeka araçlarına yöneliyor.",
    content: `<p>Hukuk teknolojileri (LegalTech) Türkiye'de en hızlı büyüyen alanlardan biri haline geldi. Türk yazılımcılar tarafından geliştirilen yeni nesil yapay zeka destekli hukuk asistanları, avukatların dava hazırlama süreçlerini baştan aşağı değiştiriyor. Sistemler, Yargıtay'ın milyonlarca içtihat kararını tarayarak benzer davaları saniyeler içinde bulabiliyor.</p>
<p>Yerli hukuk platformları, dava dilekçelerini otomatik olarak analiz ederek eksik belgeleri, çelişkili ifadeleri ve geçmiş kararlarla uyumsuz olan noktaları avukatlara raporluyor. Bu sayede normal şartlarda günlerce sürecek dosya hazırlama mesaisi birkaç saate iniyor.</p>
<p>Barolar Birliği temsilcileri, yapay zekanın avukatların yerini almayacağını, aksine rutin iş yükünü hafifleterek savunmanın kalitesini artıracağını vurguluyor.</p>`,
    source: "Hukuk Teknolojileri Dergisi",
    sourceUrl: "",
    publishDate: "2026-06-20",
    imageUrl: "",
    created_at: new Date(Date.now() - 28800000).toISOString()
  },
  {
    id: "news-tr-106",
    title: "DeepSeek R1 Türkçe Desteği Test Edildi: Geliştiriciler İçin Yeni Standart",
    summary: "Açık kaynak dünyasını sallayan DeepSeek R1 modelinin Türkçe performansı incelendi. Türkçe mantık yürütme testlerinde model üstün başarı gösterdi.",
    content: `<p>Geçtiğimiz günlerde piyasaya sürülen ve akıl yürütme (reasoning) yetenekleriyle küresel ölçekte dikkat çeken açık kaynaklı DeepSeek R1 modelinin Türkçe dil performansı Türk geliştiriciler tarafından mercek altına alındı. Yapılan testler, modelin Türkçe mantık sorularında ve kodlama komutlarında oldukça yetkin olduğunu gösteriyor.</p>
<p>Özellikle Türkçe dilbilgisi kurallarına uyum, metin özetleme ve Türkçe hazırlanan kodlama projelerinde hata bulma gibi zorlu sınavlardan geçen DeepSeek R1, ticari kapalı kaynaklı rakiplerine (OpenAI o1, Claude 3.5 Sonnet) yakın sonuçlar verdi. Açık kaynaklı olması sebebiyle yerel sunucularda veri güvenliği kapsamında çalıştırılabilmesi en büyük avantajı olarak görülüyor.</p>
<p>Türkiye'deki yapay zeka geliştiricileri topluluğu, DeepSeek R1'in yerel entegrasyon süreçlerine şimdiden başlayarak e-ticaret siteleri, müşteri destek botları ve veri analitiği araçlarında bu modeli kullanmaya başladı.</p>`,
    source: "AiKlavuz Analiz",
    sourceUrl: "",
    publishDate: "2026-06-19",
    imageUrl: "",
    created_at: new Date(Date.now() - 43200000).toISOString()
  },
  {
    id: "news-tr-107",
    title: "Türkiye'deki KOBİ'ler İçin Yapay Zeka Rehberi: Verimliliği Artırmanın Yolları",
    summary: "Küçük ve orta ölçekli işletmelerin (KOBİ) dijital dönüşüm süreçlerinde yapay zekayı nasıl kullanacaklarına dair pratik adımlar ve yerli araç önerileri açıklandı.",
    content: `<p>Türkiye ekonomisinin bel kemiğini oluşturan KOBİ'ler, rekabet avantajı elde etmek amacıyla iş süreçlerine yapay zeka entegrasyonunu hızlandırıyor. Uzmanlar, KOBİ'lerin büyük bütçeler ayırmadan da yapay zeka asistanları, sosyal medya yönetim araçları ve otomatik fatura işleme sistemleri ile operasyonel maliyetlerini düşürebileceğini belirtiyor.</p>
<p>Özellikle müşteri ilişkileri yönetimi (CRM) ve stok tahmini süreçlerinde kullanılan makine öğrenmesi modelleri, işletmelerin atıl stok maliyetlerini azaltarak kârlılıklarını artırıyor. Yerli SaaS girişimlerinin sunduğu kolay entegre edilebilir yapay zeka yazılımları, KOBİ'lerin dijital dönüşümünü kolaylaştırıyor.</p>
<p>TOBB bünyesinde açılan yeni eğitim portalları ile çiftçi, esnaf ve KOBİ yöneticilerine yapay zeka okuryazarlığı eğitimleri ücretsiz olarak verilmeye başlandı.</p>`,
    source: "TOBB Haber",
    sourceUrl: "https://www.tobb.org.tr",
    publishDate: "2026-06-18",
    imageUrl: "",
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "news-tr-108",
    title: "Sağlık Bakanlığı'ndan Dev Adım: Yapay Zeka Destekli e-Nabız Dönemi Başlıyor",
    summary: "Radyoloji ve tomografi görüntülerinde kanserli hücreleri önceden teşhis edebilen yerli yapay zeka yazılımı, e-Nabız sistemiyle entegre edilerek pilot hastanelerde kullanılmaya başlandı.",
    content: `<p>Türkiye Cumhuriyeti Sağlık Bakanlığı, teşhis süreçlerini hızlandırmak ve hekimlerin iş yükünü azaltmak amacıyla yapay zeka entegrasyonu başlattı. TÜBİTAK ve yerli biyoteknoloji girişimleri iş birliğiyle geliştirilen yapay zeka yazılımı, radyoloji görüntülerinde gözle kaçabilecek mikro kitleleri tespit edebiliyor.</p>
<p>e-Nabız sistemiyle entegre çalışan sistem, çekilen röntgen veya MR görüntülerini anında analiz ederek şüpheli durumlarda ilgili hekime öncelikli uyarı gönderiyor. Pilot olarak seçilen 10 büyük şehir hastanesinde başlatılan uygulama, kanserin erken teşhis oranında ciddi bir artış sağladı.</p>
<p>Bakanlık, sistemin ilerleyen dönemlerde kardiyoloji ve dermatoloji branşlarında da kullanılacağını ve teşhis doğruluğunun yapay zekanın öğrenme süreciyle birlikte sürekli artacağını duyurdu.</p>`,
    source: "Sağlık Bakanlığı Basın Açıklaması",
    sourceUrl: "https://www.saglik.gov.tr",
    publishDate: "2026-06-17",
    imageUrl: "",
    created_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: "news-tr-109",
    title: "Yapay Zeka Okuryazarlığı ve Etik Dersleri Ortaokul Müfredatına Ekleniyor",
    summary: "Milli Eğitim Bakanlığı (MEB), yeni eğitim-öğretim döneminde bilişim teknolojileri dersi kapsamında yapay zeka okuryazarlığı ve etik kurallarını ders kitaplarına ekledi.",
    content: `<p>Milli Eğitim Bakanlığı, çocukların erken yaşta teknoloji üretim mantığını kavraması ve yapay zekayı güvenli bir şekilde kullanabilmesi amacıyla müfredatta önemli bir güncelleme gerçekleştirdi. Ortaokul ve lise düzeyindeki bilişim derslerinde artık yapay zekanın temel prensipleri, prompt yazma teknikleri ve yapay zeka etiği işlenecek.</p>
<p>Öğrenciler, yapay zekanın ürettiği bilgilerin doğruluğunu teyit etme (halüsinasyon tespiti), telif hakları ve kişisel verilerin korunması gibi kritik konularda bilinçlendirilecek. Ayrıca temel seviyede blok tabanlı yapay zeka kodlama araçlarıyla projeler geliştirilecek.</p>
<p>MEB, öğretmenlerin bu yeni müfredata uyum sağlayabilmesi için yaz aylarında öğretmen akademileri bünyesinde kapsamlı yapay zeka eğitim programları düzenleyeceğini belirtti.</p>`,
    source: "MEB Duyuru",
    sourceUrl: "https://www.meb.gov.tr",
    publishDate: "2026-06-16",
    imageUrl: "",
    created_at: new Date(Date.now() - 259200000).toISOString()
  },
  {
    id: "news-tr-110",
    title: "TRAI Yapay Zeka Zirvesi İstanbul'da Gerçekleşti: Yapay Genel Zeka (AGI) Tartışıldı",
    summary: "Türkiye Yapay Zeka İnisiyatifi (TRAI) tarafından düzenlenen dev zirvede, Türkiye'nin yapay zeka ekosistemindeki liderleri ve küresel uzmanlar İstanbul'da bir araya geldi.",
    content: `<p>Türkiye'nin en kapsamlı yapay zeka etkinliği olan TRAI Yapay Zeka Zirvesi, bu yıl rekor bir katılımla İstanbul'da gerçekleştirildi. Zirvenin ana gündem maddeleri arasında üretken yapay zekanın iş dünyasındaki etkisi, yapay genel zekaya (AGI) giden yol ve Türkiye'nin bu süreçteki konumu yer aldı.</p>
<p>Etkinlikte söz alan yerli ve yabancı teknoloji liderleri, yapay zekanın iş gücü dönüşümündeki rolünü tartışırken, Türkiye'nin yazılım alanındaki genç nüfusu sayesinde bu dönüşümü avantaja çevirebileceğine dikkat çekti. Yerli girişimlerin geliştirdiği otonom sistemler ve iş akışı otomasyonları zirve fuarında büyük ilgi gördü.</p>
<p>Zirve sonunda yayımlanan ortak bildiride, yapay zeka geliştirme süreçlerinde etik kuralların önemi ve yerli açık kaynak projelerin desteklenmesinin ulusal güvenlik ve ekonomik bağımsızlık için elzem olduğu vurgulandı.</p>`,
    source: "TRAI Zirve Raporu",
    sourceUrl: "https://turkiye.ai",
    publishDate: "2026-06-15",
    imageUrl: "",
    created_at: new Date(Date.now() - 345600000).toISOString()
  }
];

// Combine and filter out existing items with the same IDs to prevent duplication
const existingIds = new Set(db.news.map(n => n.id));
let addedCount = 0;

newArticles.forEach(art => {
  if (!existingIds.has(art.id)) {
    db.news.unshift(art); // Add to the beginning so they appear as recent news
    addedCount++;
  }
});

writeDB(db);
console.log(`[Success] Successfully added ${addedCount} new SEO-optimized Turkish news articles to the database.`);
