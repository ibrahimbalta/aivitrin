'use strict';
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

const newCategories = [
  { id: "genel-ai-asistan", name: "Genel AI Asistan", icon: "💬", sort_order: 0 },
  { id: "yazilim-kod-ai", name: "Yazılım & Kod AI", icon: "💻", sort_order: 1 },
  { id: "yaratici-ai", name: "Görsel & Tasarım AI", icon: "🎨", sort_order: 2 },
  { id: "bilgi-arastirma-ai", name: "Bilgi & Araştırma AI", icon: "📚", sort_order: 3 },
  { id: "veri-analitik-ai", name: "Veri & Analitik AI", icon: "📊", sort_order: 4 },
  { id: "is-uretkenlik-ai", name: "İş & Üretkenlik AI", icon: "🚀", sort_order: 5 },
  { id: "pazarlama-satis-ai", name: "Pazarlama & Satış AI", icon: "📈", sort_order: 6 },
  { id: "e-ticaret-ai", name: "E-ticaret AI", icon: "🛒", sort_order: 7 },
  { id: "finans-ai", name: "Finans AI", icon: "💰", sort_order: 8 },
  { id: "hukuk-uyum-ai", name: "Hukuk & Uyum AI", icon: "⚖️", sort_order: 9 },
  { id: "siber-guvenlik-ai", name: "Siber Güvenlik AI", icon: "🛡️", sort_order: 10 },
  { id: "saglik-ai", name: "Sağlık AI", icon: "🏥", sort_order: 11 },
  { id: "egitim-ai", name: "Eğitim AI", icon: "🎓", sort_order: 12 },
  { id: "kurumsal-ai", name: "Kurumsal AI", icon: "🏢", sort_order: 13 },
  { id: "endustri-robotik-ai", name: "Endüstri & Robotik AI", icon: "🤖", sort_order: 14 },
  { id: "mobilite-ai", name: "Mobilite AI", icon: "🚗", sort_order: 15 },
  { id: "altyapi-ai", name: "Altyapı AI", icon: "⚙️", sort_order: 16 },
  { id: "oyun-eglence-ai", name: "Oyun & Eğlence AI", icon: "🎮", sort_order: 17 },     // New
  { id: "bilim-akademik-ai", name: "Bilim & Akademik AI", icon: "🔬", sort_order: 18 }, // New
  { id: "donanim-iot-ai", name: "Donanım & IoT AI", icon: "⚡", sort_order: 19 }        // New
];

const categoryDetails = {
  'genel-ai-asistan': { name: 'Genel AI Asistan', alt: 'Dil Öğrenme', sector: 'Bireysel', integration: 'Web Uygulaması' },
  'yazilim-kod-ai': { name: 'Yazılım & Kod AI', alt: 'Kod Üretimi', sector: 'Geliştirici', integration: 'Web Uygulaması' },
  'yaratici-ai': { name: 'Görsel & Tasarım AI', alt: 'Görsel Üretim', sector: 'Bireysel', integration: 'Web Uygulaması' },
  'bilgi-arastirma-ai': { name: 'Bilgi & Araştırma AI', alt: 'Dil Öğrenme', sector: 'Bireysel', integration: 'Web Uygulaması' },
  'veri-analitik-ai': { name: 'Veri & Analitik AI', alt: 'Bulut AI', sector: 'Geliştirici', integration: 'SaaS' },
  'is-uretkenlik-ai': { name: 'İş & Üretkenlik AI', alt: 'Tasarım Araçları', sector: 'Bireysel', integration: 'SaaS' },
  'pazarlama-satis-ai': { name: 'Pazarlama & Satış AI', alt: 'SEO Araçları', sector: 'Pazarlama', integration: 'SaaS' },
  'e-ticaret-ai': { name: 'E-ticaret AI', alt: 'SEO Araçları', sector: 'E-ticaret', integration: 'SaaS' },
  'finans-ai': { name: 'Finans AI', alt: 'Trading', sector: 'Finans', integration: 'SaaS' },
  'hukuk-uyum-ai': { name: 'Hukuk & Uyum AI', alt: 'SEO Araçları', sector: 'Kurumsal', integration: 'SaaS' },
  'siber-guvenlik-ai': { name: 'Siber Güvenlik AI', alt: 'Siber Güvenlik', sector: 'Geliştirici', integration: 'SaaS' },
  'saglik-ai': { name: 'Sağlık AI', alt: 'AI Tutor', sector: 'Sağlık', integration: 'SaaS' },
  'egitim-ai': { name: 'Eğitim AI', alt: 'AI Tutor', sector: 'Eğitim', integration: 'Web Uygulaması' },
  'kurumsal-ai': { name: 'Kurumsal AI', alt: 'LMS', sector: 'Kurumsal', integration: 'SaaS' },
  'endustri-robotik-ai': { name: 'Endüstri & Robotik AI', alt: 'DevOps', sector: 'Endüstri', integration: 'SaaS' },
  'mobilite-ai': { name: 'Mobilite AI', alt: 'DevOps', sector: 'Endüstri', integration: 'Web Uygulaması' },
  'altyapi-ai': { name: 'Altyapı AI', alt: 'Bulut AI', sector: 'Geliştirici', integration: 'API' },
  'oyun-eglence-ai': { name: 'Oyun & Eğlence AI', alt: 'Görsel Üretim', sector: 'Bireysel', integration: 'Web Uygulaması' },
  'bilim-akademik-ai': { name: 'Bilim & Akademik AI', alt: 'AI Tutor', sector: 'Eğitim', integration: 'Web Uygulaması' },
  'donanim-iot-ai': { name: 'Donanım & IoT AI', alt: 'DevOps', sector: 'Geliştirici', integration: 'API' }
};

const categoryKeywords = {
  'genel-ai-asistan': ['sohbet', 'asistan', 'chatbot', 'assistant', 'gpt', 'claude', 'gemini', 'copilot', 'helper'],
  'yazilim-kod-ai': ['kod', 'yazılım', 'geliştirici', 'programming', 'developer', 'api', 'devops', 'git', 'database', 'python', 'javascript', 'html', 'css', 'coding', 'coder', 'web', 'site'],
  'yaratici-ai': ['görsel', 'resim', 'çizim', 'tasarım', 'video', 'ses', 'müzik', 'fotoğraf', '3d', 'avatar', 'art', 'image', 'design', 'music', 'audio', 'speech', 'creative', 'paint', 'canvas', 'illustration', 'midjourney', 'stable diffusion'],
  'bilgi-arastirma-ai': ['araştırma', 'makale', 'arama', 'akademik', 'bilgi', 'search', 'research', 'academic', 'paper', 'notebooklm', 'scholar'],
  'veri-analitik-ai': ['veri', 'analiz', 'grafik', 'excel', 'istatistik', 'data', 'analytics', 'chart', 'dashboard', 'sql'],
  'is-uretkenlik-ai': ['iş', 'üretkenlik', 'not', 'verimlilik', 'takvim', 'toplantı', 'doküman', 'otomasyon', 'notion', 'productivity', 'office', 'document', 'workflow', 'automate', 'pdf', 'özet', 'summarize'],
  'pazarlama-satis-ai': ['pazarlama', 'satış', 'seo', 'reklam', 'e-posta', 'sosyal medya', 'copywriting', 'marketing', 'sales', 'social media', 'ads', 'funnel', 'lead', 'yazma', 'içerik', 'content', 'writer', 'blog', 'makale yaz'],
  'e-ticaret-ai': ['e-ticaret', 'ecommerce', 'shopify', 'ürün', 'mağaza', 'store', 'retail'],
  'finans-ai': ['finans', 'para', 'borsa', 'trading', 'kripto', 'muhasebe', 'vergi', 'bütçe', 'yatırım', 'finance', 'money', 'crypto', 'accounting', 'tax', 'budget', 'investment', 'banka', 'sigorta'],
  'hukuk-uyum-ai': ['hukuk', 'sözleşme', 'legal', 'law', 'compliance', 'uyum', 'contract', 'court'],
  'siber-guvenlik-ai': ['güvenlik', 'siber', 'security', 'cyber', 'fraud', 'threat', 'dolandırıcılık', 'spam'],
  'saglik-ai': ['sağlık', 'tıp', 'medikal', 'doktor', 'health', 'medical', 'doctor', 'clinical', 'hastane'],
  'egitim-ai': ['eğitim', 'öğrenme', 'ders', 'okul', 'sınav', 'education', 'learning', 'school', 'study', 'tutor', 'öğretmen'],
  'kurumsal-ai': ['kurumsal', 'şirket', 'insan kaynakları', 'hr', 'enterprise', 'corporate', 'recruitment'],
  'endustri-robotik-ai': ['robot', 'endüstri', 'üretim', 'fabrika', 'industry', 'robotic', 'factory'],
  'mobilite-ai': ['mobilite', 'araç', 'otonom', 'navigasyon', 'autonomous', 'car', 'traffic', 'harita'],
  'altyapi-ai': ['altyapı', 'bulut', 'sunucu', 'cloud', 'infrastructure', 'server', 'database', 'hosting'],
  'oyun-eglence-ai': ['oyun', 'game', 'gaming', 'play', 'unity', 'unreal', 'eğlence', 'entertainment', 'toy'],
  'bilim-akademik-ai': ['bilim', 'science', 'physics', 'chemistry', 'biology', 'dna', 'protein', 'akademik', 'academic', 'laboratory', 'laboratuvar'],
  'donanim-iot-ai': ['donanım', 'hardware', 'iot', 'chip', 'gpu', 'cpu', 'intel', 'nvidia', 'raspberry', 'arduino', 'semiconductor']
};

function classifyTool(t) {
  const nameText = (t.name || '').toLowerCase();
  const descText = (t.description || '').toLowerCase();
  const tagsList = Array.isArray(t.tags) ? t.tags.map(x => x.toLowerCase()) : [];

  let bestCatId = 'yaratici-ai'; // Fallback
  let maxScore = -1;

  for (const catId in categoryKeywords) {
    if (categoryKeywords.hasOwnProperty(catId)) {
      let score = 0;
      categoryKeywords[catId].forEach(kw => {
        if (nameText.includes(kw)) score += 5;
        tagsList.forEach(tag => {
          if (tag === kw || tag.includes(kw)) score += 3;
        });
        if (descText.includes(kw)) score += 1;
      });

      if (score > maxScore && score > 0) {
        maxScore = score;
        bestCatId = catId;
      }
    }
  }

  const details = categoryDetails[bestCatId];
  t.category_id = bestCatId;
  t.ana_kategori = details.name;
  t.alt_kategori = details.alt;
  t.sektor = details.sector;
  t.entegrasyon_tipi = details.integration;
}

if (!fs.existsSync(DB_PATH)) {
  console.error('Database file not found.');
  process.exit(1);
}

try {
  const fileContent = fs.readFileSync(DB_PATH, 'utf8');
  const data = JSON.parse(fileContent);

  // 1. Save new categories
  data.categories = newCategories.map(c => {
    const existing = data.categories.find(ex => ex.id === c.id);
    return {
      ...c,
      created_at: existing ? existing.created_at : new Date().toISOString()
    };
  });

  // 2. Reclassify
  if (Array.isArray(data.tools)) {
    data.tools.forEach(classifyTool);
  }
  if (Array.isArray(data.submissions)) {
    data.submissions.forEach(classifyTool);
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log('Successfully completed symmetry category migration!');

  const counts = {};
  newCategories.forEach(c => counts[c.id] = 0);
  data.tools.forEach(t => { counts[t.category_id] = (counts[t.category_id] || 0) + 1; });
  
  console.log('\n--- Symmetric Category Distribution ---');
  newCategories.forEach(c => {
    console.log(`- ${c.name} (${c.id}): ${counts[c.id]} tools`);
  });

} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
}
