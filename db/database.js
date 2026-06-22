'use strict';
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Force Google DNS to resolve MongoDB SRV records reliably if local fails
try {
  const dns = require('dns');
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const VERCEL_MODE = !!process.env.VERCEL;
const DB_PATH = VERCEL_MODE
  ? '/tmp/data.json'
  : path.join(__dirname, 'data.json');

// Local cached values
let dbCache = null;
let dbVersion = 0;
let lastCheckTime = 0;

// Varsayılan veri yapısı
const defaultData = {
  users: [],
  categories: [],
  tools: [],
  submissions: [],
  newsletter: [],
  stories: [],
  messages: [],
  ads: [],
  adsense_code: "",
  prompts: [
    {
      id: "prompt-1",
      title: "İçerik Editörü ve SEO Uyumlu Makale Yazıcı",
      category: "Pazarlama",
      targetTool: "ChatGPT / Claude",
      description: "Anahtar kelimelerinizi girerek SEO uyumlu blog yazıları oluşturun.",
      promptText: "Sen kıdemli bir SEO uzmanı ve içerik editörüsün. Sana vereceğim [KONU] ve [ANAHTAR KELİMELER] doğrultusunda şu kurallara göre bir blog makalesi yaz:\n1. Başlık ilgi çekici ve H1 etiketinde olmalı.\n2. Makale en az 800 kelime olmalı ve H2, H3 alt başlıkları içermeli.\n3. Anahtar kelimeler metin içerisinde doğal bir şekilde dağıtılmalı.\n4. Okuyucuya doğrudan hitap eden akıcı bir dil kullanılmalı.",
      isPromptOfTheDay: true,
      votes: 15,
      created_at: "2026-06-21T07:00:00.000Z"
    },
    {
      id: "prompt-2",
      title: "Midjourney ile Ultra Gerçekçi Portre Çizimi",
      category: "Tasarım",
      targetTool: "Midjourney",
      description: "Fotoğraf kalitesinde, dramatik ışıklandırmaya sahip insan portreleri üretin.",
      promptText: "A hyper-realistic studio portrait of a 40-year-old Turkish fisherman with sun-kissed skin and detailed wrinkles, dramatic lighting, shot on 85mm lens, f/1.4, photorealistic, 8k resolution, detailed texture --ar 3:4 --style raw --v 6.0",
      isPromptOfTheDay: false,
      votes: 8,
      created_at: "2026-06-21T07:10:00.000Z"
    }
  ],
  news: [
    {
      id: "news-1",
      title: "DeepSeek R1 Çıktı! Sektörde Kartlar Yeniden Dağıtılıyor",
      summary: "Çin merkezli yapay zeka girişimi DeepSeek, akıl yürütme yetenekleriyle OpenAI o1 modeline rakip olan yeni açık kaynaklı modeli R1'i duyurdu.",
      content: "<p>Yapay zeka dünyasında rekabet tüm hızıyla sürüyor. Çinli yapay zeka şirketi DeepSeek, yeni açık kaynaklı ve gelişmiş akıl yürütme (reasoning) yeteneklerine sahip olan DeepSeek R1 modelini yayınladı.</p><p>Model, özellikle matematik, kodlama ve bilimsel problem çözme testlerinde OpenAI'ın o1 ve o3-mini modelleriyle başa baş performans gösteriyor. En dikkat çekici unsur ise modelin açık kaynaklı olması ve geliştiriciler tarafından yerel bilgisayarlarda çalıştırılabilmesi.</p><p>Sektör temsilcileri, bu modelin yapay zeka pazarındaki dengeleri değiştireceğini ve açık kaynaklı ekosistemi çok daha güçlü kılacağını öngörüyor.</p>",
      source: "AiKlavuz Özel",
      sourceUrl: "",
      publishDate: "2026-06-21",
      imageUrl: "",
      created_at: "2026-06-21T07:00:00.000Z"
    },
    {
      id: "news-2",
      title: "Google Gemini 2.0 Flash Yayında: Daha Hızlı, Daha Akıllı",
      summary: "Google, gerçek zamanlı ses ve video işleme yeteneklerine sahip ultra hızlı modeli Gemini 2.0 Flash'ı genel kullanıma açtı.",
      content: "<p>Google, yeni nesil yapay zeka modeli ailesinin en hızlı üyesi olan Gemini 2.0 Flash'ı tanıttı. Hız ve maliyet verimliliğine odaklanan yeni model, özellikle gerçek zamanlı konuşma (multimodal) asistanları ve hızlı veri analizleri için tasarlandı.</p><p>Düşük gecikme süresiyle dikkat çeken Gemini 2.0 Flash, aynı zamanda Google AI Studio ve Vertex AI üzerinden Türkçe dahil 40'tan fazla dilde erişilebilir durumda.</p>",
      source: "Google Developers",
      sourceUrl: "https://developers.googleblog.com",
      publishDate: "2026-06-20",
      imageUrl: "",
      created_at: "2026-06-20T07:00:00.000Z"
    }
  ],
  quizzes: [
    {
      id: "quiz-1",
      title: "Yapay Zeka Okuryazarlığı Testi",
      description: "Temel yapay zeka terimlerini, LLM çalışma mantıklarını ve günlük kullanım pratiklerini ne kadar iyi biliyorsunuz? Kendinizi test edin ve AI Okuryazarı rozetini kazanın!",
      badge: "AI Okuryazarı",
      badgeIcon: "🧠",
      questions: [
        {
          questionText: "Büyük Dil Modellerinde (LLM) 'Prompt' ne anlama gelir?",
          options: [
            "Modelin yanıt üretmek için kullandığı donanım bileşeni",
            "Modele verdiğiniz ve ne yapması gerektiğini açıklayan girdi talimatı",
            "Modelin eğitiminde kullanılan veri setinin boyutu",
            "Modelin ürettiği yanıtın hızı"
          ],
          correctOptionIndex: 1
        },
        {
          questionText: "Aşağıdakilerden hangisi OpenAI tarafından geliştirilen popüler bir yapay zeka modelidir?",
          options: [
            "Gemini",
            "Claude",
            "GPT-4o",
            "Llama"
          ],
          correctOptionIndex: 2
        },
        {
          questionText: "Yapay zeka aracının olmayan bir bilgiyi gerçekmiş gibi uydurup yanıt üretmesine ne ad verilir?",
          options: [
            "Overfitting (Aşırı Uyum)",
            "Hallucination (Halüsinasyon)",
            "Prompt Engineering (Prompt Mühendisliği)",
            "Fine-Tuning (İnce Ayar)"
          ],
          correctOptionIndex: 1
        }
      ]
    },
    {
      id: "quiz-2",
      title: "Prompt Mühendisliği (Prompt Engineering) Testi",
      description: "Yapay zeka modellerinden en verimli ve doğru sonuçları almak için prompt yazma tekniklerine ne kadar hakimsiniz? Testi çözün ve Prompt Uzmanı rozetini alın!",
      badge: "Prompt Uzmanı",
      badgeIcon: "✍️",
      questions: [
        {
          questionText: "Bir promptta yapay zekaya bir rol tanımlamak (Örn: 'Sen kıdemli bir yazılımcısın') modelin yanıtını nasıl etkiler?",
          options: [
            "Yanıtın daha yavaş üretilmesine sebep olur.",
            "Modelin belirli bir bağlam ve uzmanlık tonunda daha kaliteli yanıtlar vermesini sağlar.",
            "Modelin güvenlik filtrelerini devre dışı bırakır.",
            "Yanıtın uzunluğunu otomatik olarak sınırlandırır."
          ],
          correctOptionIndex: 1
        },
        {
          questionText: "Few-Shot Prompting tekniği neyi ifade eder?",
          options: [
            "Yapay zekaya hiç örnek vermeden sadece talimat vermeyi",
            "Yapay zekaya talimatla birlikte bir veya birkaç örnek vermeyi",
            "Promptu olabildiğince kısa ve kelimesiz tutmayı",
            "Modelleri baştan eğitmeyi"
          ],
          correctOptionIndex: 1
        },
        {
          questionText: "Modellere karmaşık mantıksal problemleri çözdürürken 'Adım adım düşün' (Think step-by-step) demek hangi tekniğin bir parçasıdır?",
          options: [
            "Chain of Thought (Düşünce Zinciri)",
            "Zero-Shot Prompting",
            "Fine-Tuning",
            "Semantic Search"
          ],
          correctOptionIndex: 0
        }
      ]
    }
  ],
  crawler_settings: {
    auto_approve: false,
    last_run: null,
    total_crawled: 0,
    ai_enabled: false,
    ai_provider: 'xai',
    ai_api_key: '',
    ai_model: 'grok-beta',
    ai_custom_endpoint: ''
  },
  crawler_logs: []
};

// MongoDB URI
const mongoUri = process.env.MONGODB_URI;

// MongoClient instances
let mongoClient = null;

async function getMongoClient() {
  if (!mongoUri) return null;
  if (!mongoClient) {
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
  }
  return mongoClient;
}

// MongoDB'den veriyi asenkron olarak yerel önbelleğe çek
async function syncFromMongo(force = false) {
  if (!mongoUri) {
    return readLocalDB();
  }

  const now = Date.now();
  // 5 saniyede bir en fazla 1 kez uzaktan kontrol yap (sunucusuz fonksiyonlarda aşırı yükü engellemek için)
  if (!force && dbCache && (now - lastCheckTime < 5000)) {
    return dbCache;
  }

  try {
    const client = await getMongoClient();
    const db = client.db('aivitrin');
    const collection = db.collection('system_data');

    // Sadece version alanını hızlıca sorgula
    const meta = await collection.findOne({ _id: 'main' }, { projection: { version: 1 } });
    
    if (!meta) {
      // Veritabanı boşsa varsayılan veriyi yükle ve kaydet
      console.log('MongoDB is empty. Seeding default data...');
      await syncToMongo(defaultData);
      dbCache = JSON.parse(JSON.stringify(defaultData));
      dbVersion = 1;
      writeLocalDB(dbCache);
      lastCheckTime = Date.now();
      return dbCache;
    }

    if (force || !dbCache || meta.version !== dbVersion || !fs.existsSync(DB_PATH)) {
      console.log(`[Sync] Local version: ${dbVersion}, Remote version: ${meta.version}. Fetching full database...`);
      const doc = await collection.findOne({ _id: 'main' });
      dbCache = doc.data;
      dbVersion = doc.version;
      writeLocalDB(dbCache);
    }

    lastCheckTime = Date.now();
    return dbCache;
  } catch (err) {
    console.error('[Sync Error] Failed to sync from MongoDB:', err.message);
    // Hata durumunda yerel önbellek dosyasından devam et (fallback)
    return readLocalDB();
  }
}

// MongoDB'ye veriyi asenkron olarak gönder
async function syncToMongo(data) {
  if (!mongoUri) return;
  
  try {
    const client = await getMongoClient();
    const db = client.db('aivitrin');
    const collection = db.collection('system_data');

    dbVersion++;
    const dbDoc = {
      _id: 'main',
      version: dbVersion,
      last_updated: new Date().toISOString(),
      data: data
    };

    await collection.replaceOne({ _id: 'main' }, dbDoc, { upsert: true });
    // console.log(`[Sync] Successfully saved version ${dbVersion} to MongoDB Atlas.`);
  } catch (err) {
    console.error('[Sync Error] Failed to sync to MongoDB:', err.message);
  }
}

function readLocalDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Local DB read error:', e.message);
  }
  return JSON.parse(JSON.stringify(defaultData));
}

function writeLocalDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Local DB write error:', e.message);
  }
}

// Veritabanını oku (Senkron Rotalar İçin)
function readDB() {
  if (dbCache) {
    // Check if local file exists, if not write it
    if (!fs.existsSync(DB_PATH)) {
      writeLocalDB(dbCache);
    }
    if (!dbCache.prompts) dbCache.prompts = defaultData.prompts || [];
    if (!dbCache.news) dbCache.news = defaultData.news || [];
    if (!dbCache.quizzes) dbCache.quizzes = defaultData.quizzes || [];
    return dbCache;
  }
  dbCache = readLocalDB();
  let changed = false;
  if (!dbCache.prompts) { dbCache.prompts = defaultData.prompts || []; changed = true; }
  if (!dbCache.news) { dbCache.news = defaultData.news || []; changed = true; }
  if (!dbCache.quizzes) { dbCache.quizzes = defaultData.quizzes || []; changed = true; }
  if (changed) {
    writeLocalDB(dbCache);
  }
  return dbCache;
}

// Veritabanına yaz (Senkron Rotalar İçin)
function writeDB(data) {
  dbCache = data;
  writeLocalDB(data);

  // Arka planda MongoDB'ye asenkron kaydet (HTTP isteğini bloklamaz)
  syncToMongo(data).catch(err => {
    console.error('[Background Sync] MongoDB write failed:', err.message);
  });
}

// İlk başlatmada dosya yoksa ve yerel moddaysa varsayılan dosyayı oluştur
if (!VERCEL_MODE && !fs.existsSync(DB_PATH)) {
  writeLocalDB(defaultData);
}

module.exports = { 
  readDB, 
  writeDB, 
  DB_PATH,
  syncFromMongo,
  syncToMongo
};
