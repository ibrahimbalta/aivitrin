'use strict';
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

const newCategories = [
  { id: "genel-ai-asistan", name: "Genel AI Asistan", icon: "💬", sort_order: 0, created_at: new Date().toISOString() },
  { id: "yazilim-kod-ai", name: "Yazılım & Kod AI", icon: "💻", sort_order: 1, created_at: new Date().toISOString() },
  { id: "yaratici-ai", name: "Yaratıcı AI", icon: "🎨", sort_order: 2, created_at: new Date().toISOString() },
  { id: "bilgi-arastirma-ai", name: "Bilgi & Araştırma AI", icon: "📚", sort_order: 3, created_at: new Date().toISOString() },
  { id: "veri-analitik-ai", name: "Veri & Analitik AI", icon: "📊", sort_order: 4, created_at: new Date().toISOString() },
  { id: "is-uretkenlik-ai", name: "İş & Üretkenlik AI", icon: "🚀", sort_order: 5, created_at: new Date().toISOString() },
  { id: "pazarlama-satis-ai", name: "Pazarlama & Satış AI", icon: "📈", sort_order: 6, created_at: new Date().toISOString() },
  { id: "e-ticaret-ai", name: "E-ticaret AI", icon: "🛒", sort_order: 7, created_at: new Date().toISOString() },
  { id: "finans-ai", name: "Finans AI", icon: "💰", sort_order: 8, created_at: new Date().toISOString() },
  { id: "hukuk-uyum-ai", name: "Hukuk & Uyum AI", icon: "⚖️", sort_order: 9, created_at: new Date().toISOString() },
  { id: "siber-guvenlik-ai", name: "Siber Güvenlik AI", icon: "🛡️", sort_order: 10, created_at: new Date().toISOString() },
  { id: "saglik-ai", name: "Sağlık AI", icon: "🏥", sort_order: 11, created_at: new Date().toISOString() },
  { id: "egitim-ai", name: "Eğitim AI", icon: "🎓", sort_order: 12, created_at: new Date().toISOString() },
  { id: "kurumsal-ai", name: "Kurumsal AI", icon: "🏢", sort_order: 13, created_at: new Date().toISOString() },
  { id: "endustri-robotik-ai", name: "Endüstri & Robotik AI", icon: "🤖", sort_order: 14, created_at: new Date().toISOString() },
  { id: "mobilite-ai", name: "Mobilite AI", icon: "🚗", sort_order: 15, created_at: new Date().toISOString() },
  { id: "altyapi-ai", name: "Altyapı AI", icon: "⚙️", sort_order: 16, created_at: new Date().toISOString() }
];

const categoryMapping = {
  'sohbet-asistan': { id: 'genel-ai-asistan', name: 'Genel AI Asistan', alt: 'Dil Öğrenme', sector: 'Bireysel', integration: 'Web Uygulaması' },
  'gorsel-tasarim': { id: 'yaratici-ai', name: 'Yaratıcı AI', alt: 'Görsel Üretim', sector: 'Bireysel', integration: 'Web Uygulaması' },
  'yazma-icerik': { id: 'yaratici-ai', name: 'Yaratıcı AI', alt: 'İçerik Yazımı', sector: 'Bireysel', integration: 'SaaS' },
  'is-uretkenlik': { id: 'is-uretkenlik-ai', name: 'İş & Üretkenlik AI', alt: 'Tasarım Araçları', sector: 'Bireysel', integration: 'Web Uygulaması' },
  'kodlama-gelistirme': { id: 'yazilim-kod-ai', name: 'Yazılım & Kod AI', alt: 'Kod Üretimi', sector: 'Geliştirici', integration: 'Web Uygulaması' },
  'video-ses': { id: 'yaratici-ai', name: 'Yaratıcı AI', alt: 'Video Üretim', sector: 'Bireysel', integration: 'Web Uygulaması' },
  'pazarlama': { id: 'pazarlama-satis-ai', name: 'Pazarlama & Satış AI', alt: 'SEO Araçları', sector: 'Pazarlama', integration: 'SaaS' },
  'otomasyon': { id: 'is-uretkenlik-ai', name: 'İş & Üretkenlik AI', alt: 'DevOps', sector: 'Kurumsal', integration: 'SaaS' },
  'egitim': { id: 'egitim-ai', name: 'Eğitim AI', alt: 'AI Tutor', sector: 'Eğitim', integration: 'Web Uygulaması' },
  'veri-analiz': { id: 'veri-analitik-ai', name: 'Veri & Analitik AI', alt: 'Bulut AI', sector: 'Finans', integration: 'SaaS' }
};

if (!fs.existsSync(DB_PATH)) {
  console.error('Database file not found at:', DB_PATH);
  process.exit(1);
}

try {
  const fileContent = fs.readFileSync(DB_PATH, 'utf8');
  const data = JSON.parse(fileContent);

  // 1. Update Categories list
  data.categories = newCategories;

  // Helper to map and enrich tool fields according to new schema
  function migrateTool(tool) {
    const oldCatId = tool.category_id;
    const mapping = categoryMapping[oldCatId] || { id: 'genel-ai-asistan', name: 'Genel AI Asistan', alt: 'Dil Öğrenme', sector: 'Bireysel', integration: 'Web Uygulaması' };
    
    // Set mapped category
    tool.category_id = mapping.id;
    
    // Add new schema fields
    tool.ana_kategori = mapping.name;
    tool.alt_kategori = mapping.alt;
    tool.sektor = mapping.sector;
    tool.entegrasyon_tipi = mapping.integration;
    
    // Handle verified & featured
    tool.dogrulanmis = tool.dogrulanmis !== undefined ? !!tool.dogrulanmis : true;
    tool.öne_cikan = tool.featured === 1 || tool.featured === true;
  }

  // 2. Migrate Tools
  if (Array.isArray(data.tools)) {
    data.tools.forEach(migrateTool);
  }

  // 3. Migrate Submissions
  if (Array.isArray(data.submissions)) {
    data.submissions.forEach(migrateTool);
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log('Successfully completed database schema migration!');
  console.log(`Migrated ${data.tools.length} tools to the new category schema.`);
  console.log(`Migrated ${data.submissions.length} submissions to the new category schema.`);

} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
}
