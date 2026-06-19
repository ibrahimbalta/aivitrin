'use strict';
global.window = global.window || {};

const { readDB, writeDB } = require('./database');
const bcrypt = require('bcryptjs');

// Mevcut verileri yükle
require('./seed-data.js');
const oldCategories = global.window.AI_CATEGORIES || [];
const oldTools = global.window.AI_TOOLS || [];

const newCategories = [
  { id: "genel-ai-asistan", name: "Genel AI Asistan", icon: "💬" },
  { id: "yazilim-kod-ai", name: "Yazılım & Kod AI", icon: "💻" },
  { id: "yaratici-ai", name: "Görsel & Tasarım AI", icon: "🎨" },
  { id: "bilgi-arastirma-ai", name: "Bilgi & Araştırma AI", icon: "📚" },
  { id: "veri-analitik-ai", name: "Veri & Analitik AI", icon: "📊" },
  { id: "is-uretkenlik-ai", name: "İş & Üretkenlik AI", icon: "🚀" },
  { id: "pazarlama-satis-ai", name: "Pazarlama & Satış AI", icon: "📈" },
  { id: "e-ticaret-ai", name: "E-ticaret AI", icon: "🛒" },
  { id: "finans-ai", name: "Finans AI", icon: "💰" },
  { id: "hukuk-uyum-ai", name: "Hukuk & Uyum AI", icon: "⚖️" },
  { id: "siber-guvenlik-ai", name: "Siber Güvenlik AI", icon: "🛡️" },
  { id: "saglik-ai", name: "Sağlık AI", icon: "🏥" },
  { id: "egitim-ai", name: "Eğitim AI", icon: "🎓" },
  { id: "kurumsal-ai", name: "Kurumsal AI", icon: "🏢" },
  { id: "endustri-robotik-ai", name: "Endüstri & Robotik AI", icon: "🤖" },
  { id: "mobilite-ai", name: "Mobilite AI", icon: "🚗" },
  { id: "altyapi-ai", name: "Altyapı AI", icon: "⚙️" },
  { id: "oyun-eglence-ai", name: "Oyun & Eğlence AI", icon: "🎮" },
  { id: "bilim-akademik-ai", name: "Bilim & Akademik AI", icon: "🔬" },
  { id: "donanim-iot-ai", name: "Donanım & IoT AI", icon: "⚡" }
];

const categoryMapping = {
  'sohbet-asistan': { id: 'genel-ai-asistan', name: 'Genel AI Asistan', alt: 'Dil Öğrenme', sector: 'Bireysel', integration: 'Web Uygulaması' },
  'gorsel-tasarim': { id: 'yaratici-ai', name: 'Görsel & Tasarım AI', alt: 'Görsel Üretim', sector: 'Bireysel', integration: 'Web Uygulaması' },
  'yazma-icerik': { id: 'yaratici-ai', name: 'Görsel & Tasarım AI', alt: 'İçerik Yazımı', sector: 'Bireysel', integration: 'SaaS' },
  'is-uretkenlik': { id: 'is-uretkenlik-ai', name: 'İş & Üretkenlik AI', alt: 'Tasarım Araçları', sector: 'Bireysel', integration: 'Web Uygulaması' },
  'kodlama-gelistirme': { id: 'yazilim-kod-ai', name: 'Yazılım & Kod AI', alt: 'Kod Üretimi', sector: 'Geliştirici', integration: 'Web Uygulaması' },
  'video-ses': { id: 'yaratici-ai', name: 'Görsel & Tasarım AI', alt: 'Video Üretim', sector: 'Bireysel', integration: 'Web Uygulaması' },
  'pazarlama': { id: 'pazarlama-satis-ai', name: 'Pazarlama & Satış AI', alt: 'SEO Araçları', sector: 'Pazarlama', integration: 'SaaS' },
  'otomasyon': { id: 'is-uretkenlik-ai', name: 'İş & Üretkenlik AI', alt: 'DevOps', sector: 'Kurumsal', integration: 'SaaS' },
  'egitim': { id: 'egitim-ai', name: 'Eğitim AI', alt: 'AI Tutor', sector: 'Eğitim', integration: 'Web Uygulaması' },
  'veri-analiz': { id: 'veri-analitik-ai', name: 'Veri & Analitik AI', alt: 'Bulut AI', sector: 'Finans', integration: 'SaaS' }
};

const categories = newCategories;
const tools = oldTools.map(t => {
  const mapping = categoryMapping[t.category] || { id: 'genel-ai-asistan', name: 'Genel AI Asistan', alt: 'Dil Öğrenme', sector: 'Bireysel', integration: 'Web Uygulaması' };
  return {
    ...t,
    category: mapping.id,
    ana_kategori: mapping.name,
    alt_kategori: mapping.alt,
    sektor: mapping.sector,
    entegrasyon_tipi: mapping.integration,
    dogrulanmis: true,
    öne_cikan: t.featured ? true : false
  };
});

console.log('🌱 Veritabanı tohumlama başlıyor...');

const db = readDB();

// Admin kullanıcı
const existingUser = db.users.find(u => u.username === 'admin');
if (!existingUser) {
  db.users.push({
    id: 1,
    username: 'admin',
    password: bcrypt.hashSync('admin123', 10),
    created_at: new Date().toISOString()
  });
  console.log('✅ Admin kullanıcı oluşturuldu (admin / admin123)');
} else {
  console.log('ℹ️  Admin kullanıcı zaten mevcut.');
}

// Kategoriler
let catCount = 0;
categories.forEach(function (cat, i) {
  if (!db.categories.find(c => c.id === cat.id)) {
    db.categories.push({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      sort_order: i,
      created_at: new Date().toISOString()
    });
    catCount++;
  }
});
console.log('✅ ' + catCount + ' kategori eklendi.');

// Araçlar
let toolCount = 0;
tools.forEach(function (t) {
  if (!db.tools.find(x => x.id === t.id)) {
    db.tools.push({
      id: t.id,
      name: t.name,
      description: t.description,
      category_id: t.category,
      tags: t.tags || [],
      pricing: t.pricing || 'freemium',
      rating: t.rating || 4.0,
      url: t.url || '',
      featured: t.featured ? 1 : 0,
      is_new: t.isNew ? 1 : 0,
      ana_kategori: t.ana_kategori,
      alt_kategori: t.alt_kategori,
      sektor: t.sektor,
      entegrasyon_tipi: t.entegrasyon_tipi,
      dogrulanmis: t.dogrulanmis,
      öne_cikan: t.öne_cikan,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    toolCount++;
  }
});
console.log('✅ ' + toolCount + ' araç eklendi.');

writeDB(db);
console.log('🎉 Tohumlama tamamlandı!');
process.exit(0);
