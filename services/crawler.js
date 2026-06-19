'use strict';
const https = require('https');
const { readDB, writeDB } = require('../db/database');
const { callLLM } = require('./ai');

// Fallback Mock Tools (for offline or when RSS feed has no new tools)
const fallbackMockTools = [
  {
    name: "Flux.1",
    url: "https://blackforestlabs.ai",
    description: "Black Forest Labs tarafından geliştirilen, metinden inanılmaz derecede gerçekçi görseller üreten son teknoloji açık kaynaklı görsel modeli.",
    category_id: "yaratici-ai",
    pricing: "freemium",
    tags: ["görsel üretimi", "açık kaynak", "Flux", "AI art"]
  },
  {
    name: "Groq Speed",
    url: "https://groq.com",
    description: "LPU teknolojisi sayesinde yapay zeka dil modellerini saniyede yüzlerce kelime üretecek kadar ultra yüksek hızda çalıştıran işlem platformu.",
    category_id: "yazilim-kod-ai",
    pricing: "freemium",
    tags: ["donanım", "hızlı LLM", "LPU", "asistan"]
  },
  {
    name: "NotebookLM",
    url: "https://notebooklm.google",
    description: "Google'ın notlarınızı, belgelerinizi ve kaynaklarınızı yükleyip üzerinde akıllıca çalışabileceğiniz ve sesli tartışmalar oluşturabileceğiniz yapay zeka not defteri.",
    category_id: "egitim-ai",
    pricing: "ucretsiz",
    tags: ["not alma", "Google", "özetleme", "araştırma"]
  },
  {
    name: "Julius AI Data",
    url: "https://julius.ai",
    description: "Veri dosyalarınızı analiz eden, grafikler çizen, istatistiksel modeller kuran ve veri temizleme işlemlerini sohbetle gerçekleştiren yapay zeka veri analisti.",
    category_id: "veri-analitik-ai",
    pricing: "freemium",
    tags: ["veri analizi", "grafik çizimi", "excel", "R"]
  },
  {
    name: "Phind Search",
    url: "https://www.phind.com",
    description: "Geliştiriciler için özel olarak tasarlanmış, kodlama sorularına doğrudan çözümler, açıklamalar ve referans kod blokları sunan arama motoru.",
    category_id: "yazilim-kod-ai",
    pricing: "freemium",
    tags: ["kodlama", "arama", "geliştirici", "copilot"]
  },
  {
    name: "Napkin AI",
    url: "https://www.napkin.ai",
    description: "Yazdığınız metinleri anında akış şemalarına, zihin haritalarına ve görsel şemalara dönüştüren yeni nesil görsel doküman oluşturucu.",
    category_id: "is-uretkenlik-ai",
    pricing: "freemium",
    tags: ["tasarım", "şema üretici", "dokümantasyon", "sunum"]
  },
  {
    name: "Reka Multimodal",
    url: "https://www.reka.ai",
    description: "Video, görsel, ses ve metin girdilerini aynı anda analiz edebilen son derece gelişmiş çok modlu büyük dil modeli.",
    category_id: "genel-ai-asistan",
    pricing: "freemium",
    tags: ["çok modlu", "reka", "multimodal", "sohbet"]
  },
  {
    name: "Kling AI",
    url: "https://klingai.com",
    description: "Gerçekçi fizik kurallarına uygun, son derece yaratıcı ve sinematik kalitede yapay zeka videoları üreten yeni nesil video aracı.",
    category_id: "yaratici-ai",
    pricing: "freemium",
    tags: ["video üretimi", "sinematik", "kling", "yaratıcı"]
  },
  {
    name: "Heckrate AI",
    url: "https://heckrate.com",
    description: "Web sitelerinin dönüşüm oranlarını artırmak için yapay zeka ile açılış sayfası analizi ve A/B test önerileri sunan pazarlama aracı.",
    category_id: "pazarlama-satis-ai",
    pricing: "freemium",
    tags: ["pazarlama", "optimizasyon", "landing page", "A/B test"]
  }
];

// Helper to extract tags from XML
function extractTag(itemXml, tag) {
  const match = itemXml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  if (!match) return '';
  let content = match[1].trim();
  if (content.startsWith('<![CDATA[') && content.endsWith(']]>')) {
    content = content.substring(9, content.length - 3).trim();
  }
  return content;
}

// Clean HTML entities
function cleanEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<[^>]*>?/gm, ''); // strip HTML tags
}

// Classify tool into categories
function classifyCategory(title, desc) {
  const text = (title + ' ' + desc).toLowerCase();
  if (text.match(/code|coder|coding|dev|develop|git|database|programming|sql|ide|javascript|python|html|css|api|editor/)) {
    return 'yazilim-kod-ai';
  }
  if (text.match(/image|photo|design|logo|art|draw|paint|avatar|graphic|midjourney|stable diffusion|illustration|render|canvas/)) {
    return 'yaratici-ai';
  }
  if (text.match(/video|audio|voice|speech|music|podcast|tts|song|sound|edit video|mp3|mp4|avatar/)) {
    return 'yaratici-ai';
  }
  if (text.match(/write|content|blog|copywrite|email|writer|article|translate|pdf|summary|summarize|text/)) {
    return 'yaratici-ai';
  }
  if (text.match(/seo|ads|market|adword|campaign|sales|funnel|lead/)) {
    return 'pazarlama-satis-ai';
  }
  if (text.match(/automate|zapier|workflow|agent|n8n|integration|sync|cron/)) {
    return 'is-uretkenlik-ai';
  }
  if (text.match(/learn|teach|course|study|homework|school|class|education/)) {
    return 'egitim-ai';
  }
  if (text.match(/data|analyze|chart|excel|analytics|insights|sheet/)) {
    return 'veri-analitik-ai';
  }
  if (text.match(/chat|assistant|helper|support|chatbot|consult/)) {
    return 'genel-ai-asistan';
  }
  if (text.match(/oyun|game|gaming|play|unity|unreal|eğlence|entertainment/)) {
    return 'oyun-eglence-ai';
  }
  if (text.match(/bilim|science|physics|chemistry|biology|dna|protein|akademik|academic/)) {
    return 'bilim-akademik-ai';
  }
  if (text.match(/donanım|hardware|iot|chip|gpu|cpu|intel|nvidia/)) {
    return 'donanim-iot-ai';
  }
  return 'is-uretkenlik-ai';
}

// Helper for slug generation
function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Fetch XML feed
function fetchFeed(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP Status ${res.statusCode}`));
        return;
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', err => reject(err));
  });
}

// Main Crawler Function
async function runCrawler() {
  console.log('🤖 AI Tarayıcı başlatıldı...');
  const { syncFromMongo } = require('../db/database');
  await syncFromMongo();
  const db = readDB();
  const settings = db.crawler_settings || { auto_approve: false, last_run: null, total_crawled: 0 };
  const autoApprove = settings.auto_approve;

  let xmlData = '';
  let liveSucceeded = false;
  let items = [];

  const feeds = [
    { name: 'Product Hunt', url: 'https://www.producthunt.com/feed' },
    { name: 'AIDIRECTORY', url: 'https://aidirectory.com/rss.xml' },
    { name: 'Hacker News Show HN', url: 'https://hnrss.org/showhn?q=ai' }
  ];

  for (const feed of feeds) {
    try {
      const feedXml = await fetchFeed(feed.url);
      liveSucceeded = true;
      let feedAddedCount = 0;
      
      const itemMatches = feedXml.match(/<item>([\s\S]*?)<\/item>/g) || [];
      for (const itemXml of itemMatches) {
        const title = cleanEntities(extractTag(itemXml, 'title'));
        const link = extractTag(itemXml, 'link');
        const desc = cleanEntities(extractTag(itemXml, 'description'));
        const categoryTag = cleanEntities(extractTag(itemXml, 'category'));
        
        if (title && link) {
          items.push({
            name: title.split('-')[0].split('–')[0].trim(), // Clean up suffixes
            url: link,
            description: desc || title,
            category_id: classifyCategory(title + ' ' + categoryTag, desc),
            pricing: 'freemium',
            tags: ['crawled', feed.name]
          });
          feedAddedCount++;
        }
      }
      console.log(`📡 ${feed.name} kaynağından ${feedAddedCount} ürün başarıyla çekildi.`);
    } catch (err) {
      console.warn(`⚠️ ${feed.name} kaynağı taranamadı:`, err.message);
    }
  }

  // 2. If live failed or RSS was empty, use fallback mock list
  if (!liveSucceeded || items.length === 0) {
    items = [...fallbackMockTools];
    console.log(`💡 Simülasyon modunda ${items.length} yapay zeka aracı yüklendi.`);
  }

  // AI keywords filter
  const aiKeywords = ['ai', 'gpt', 'llm', 'chatgpt', 'chatbot', 'copilot', 'artificial', 'intelligence', 'yapay zeka', 'machine learning', 'neural', 'diffusion', 'video', 'görsel', 'ses', 'kod', 'yazma', 'search'];
  
  const filteredTools = items.filter(item => {
    const text = (item.name + ' ' + item.description).toLowerCase();
    return aiKeywords.some(keyword => text.includes(keyword));
  });

  console.log(`🔍 Yapay zeka ile ilgili ${filteredTools.length} araç tespit edildi.`);

  // ─── AI ile Türkçe Zenginleştirme ve Sınıflandırma ───
  let processedTools = [];
  if (settings.ai_enabled && (settings.ai_api_key || process.env.GROQ_API_KEY || process.env.AI_API_KEY)) {
    console.log(`🤖 AI Entegrasyonu aktif. Taranan araçlar yapay zeka ile Türkçeleştiriliyor ve analiz ediliyor...`);
    const chunkSize = 8;
    for (let i = 0; i < filteredTools.length; i += chunkSize) {
      const chunk = filteredTools.slice(i, i + chunkSize);
      console.log(`📡 AI Analiz: Grup ${Math.floor(i / chunkSize) + 1}/${Math.ceil(filteredTools.length / chunkSize)} işleniyor...`);
      
      const categoriesList = db.categories.map(c => `"${c.id}" (${c.name})`).join(', ');
      
      const systemPrompt = `Aşağıda JSON formatında verilen yabancı yapay zeka araçları listesini analiz et.
Her bir aracı Türkçeleştirip zenginleştirerek aşağıdaki JSON formatında geri döndür. Yanıtında hiçbir açıklayıcı metin yazma, sadece saf JSON döndür.

Format:
{
  "tools": [
    {
      "name": "Araç Adı (özgün haliyle korunsun)",
      "url": "Web adresi (dokunulmasın)",
      "description": "Araç hakkında kısa, profesyonel Türkçe tanıtım açıklaması (maksimum 160 karakter)",
      "category_id": "Aşağıdaki geçerli kategorilerden en uygun olanının ID değeri (birebir eşleşmeli)",
      "pricing": "ucretsiz | freemium | ucretli (araç detaylarına göre saptanmış en uygun model)",
      "tags": ["etiket1", "etiket2", "maksimum 4 Türkçe etiket"]
    }
  ]
}

Geçerli Kategoriler (Sadece bunlardan birinin ID'sini kullanmalısın):
[ ${categoriesList} ]`;

      try {
        const aiResponseText = await callLLM(systemPrompt, JSON.stringify(chunk.map(c => ({ name: c.name, url: c.url, description: c.description }))), settings);
        const parsed = JSON.parse(aiResponseText);
        if (parsed && Array.isArray(parsed.tools)) {
          processedTools.push(...parsed.tools);
        } else {
          console.warn('⚠️ AI yanıtı beklenen formatta değildi, ham veriler kullanılacak.');
          processedTools.push(...chunk);
        }
      } catch (err) {
        console.error('⚠️ AI analiz grubu hatası:', err.message);
        processedTools.push(...chunk); // Fallback to raw data
      }
    }
  } else {
    processedTools = filteredTools;
  }

  const addedTools = [];
  let addedCount = 0;

  for (const item of processedTools) {
    // Check if duplicate exists (name or url)
    const duplicate = db.tools.some(t => t.url === item.url || t.name.toLowerCase() === item.name.toLowerCase()) ||
                      db.submissions.some(s => s.url === item.url || s.name.toLowerCase() === item.name.toLowerCase());

    if (duplicate) continue; // Skip duplicates

    if (autoApprove) {
      // Approve automatically and add to tools list
      let toolId = slugify(item.name);
      let suffix = 1;
      let finalId = toolId;
      while (db.tools.some(t => t.id === finalId)) {
        finalId = toolId + '-' + suffix;
        suffix++;
      }

      const newTool = {
        id: finalId,
        name: item.name,
        description: item.description,
        category_id: item.category_id,
        tags: item.tags || [],
        pricing: item.pricing,
        rating: 4.5,
        url: item.url,
        featured: 0,
        is_new: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        crawled: true
      };

      db.tools.push(newTool);
      addedTools.push({ name: item.name, status: 'approved', id: finalId });
    } else {
      // Send to submissions inbox as pending crawler item
      const newSub = {
        id: 'sub_crawled_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: item.name,
        url: item.url,
        description: item.description,
        category_id: item.category_id,
        pricing: item.pricing,
        tags: item.tags || [],
        rating: 4.5,
        source: 'crawler',
        created_at: new Date().toISOString()
      };

      db.submissions.push(newSub);
      addedTools.push({ name: item.name, status: 'pending_review', id: newSub.id });
    }
    addedCount++;
  }

  // Update settings and logs
  settings.last_run = new Date().toISOString();
  settings.total_crawled = (settings.total_crawled || 0) + addedCount;
  db.crawler_settings = settings;

  const logEntry = {
    timestamp: new Date().toISOString(),
    success: true,
    tools_found: filteredTools.length,
    tools_added: addedCount,
    auto_approved: autoApprove,
    details: addedTools.map(t => `${t.name} (${t.status})`).join(', ') || 'Yeni araç bulunamadı.'
  };

  db.crawler_logs.push(logEntry);
  // Keep logs at max 100 entries
  if (db.crawler_logs.length > 100) db.crawler_logs.shift();

  writeDB(db);

  console.log(`🤖 Tarama tamamlandı! ${addedCount} yeni araç eklendi. (Mod: ${autoApprove ? 'Otomatik Onay' : 'Onay Bekliyor'})`);

  return {
    count: addedCount,
    tools: addedTools
  };
}

module.exports = { runCrawler };
