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
    return dbCache;
  }
  dbCache = readLocalDB();
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
