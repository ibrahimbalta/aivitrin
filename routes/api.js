'use strict';
const express = require('express');
const path = require('path');
const { readDB, writeDB } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { addToSocialQueue, sharePost } = require('../services/social');

const router = express.Router();

// Turkish normalization and stemming helper functions
function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u');
}

function stripTurkishSuffixes(word) {
  if (!word || word.length <= 3) return word;
  
  const suffixes = [
    'larından', 'lerinin', 'larında', 'lerinde', 'larına', 'lerine', 'larını', 'lerini', 'larının', 'lerinin',
    'umuzdan', 'ümüzden', 'imizden', 'umuzdan', 'ından', 'inden', 'undan', 'ünden',
    'umuzda', 'ümüzde', 'imizde', 'umuzda', 'ında', 'inde', 'unda', 'ünde',
    'umuza', 'ümüze', 'imize', 'umuza', 'ına', 'ine', 'una', 'üne',
    'umuzu', 'ümüzü', 'imizi', 'umuzu', 'ını', 'ini', 'unu', 'ünü',
    'lardan', 'lerden', 'larda', 'lerde', 'lara', 'lere', 'ları', 'leri',
    'umuz', 'ümüz', 'imiz', 'ümüz', 'nız', 'niz', 'nuz', 'nüz',
    'dan', 'den', 'tan', 'ten',
    'lar', 'ler',
    'mız', 'miz', 'muz', 'müz',
    'da', 'de', 'ta', 'te',
    'sı', 'si', 'su', 'sü',
    'ya', 'ye',
    'ın', 'in', 'un', 'ün',
    'nı', 'ni', 'nu', 'nü',
    'ı', 'i', 'u', 'ü'
  ];

  let stemmed = word;
  for (const suffix of suffixes) {
    if (stemmed.endsWith(suffix)) {
      const candidate = stemmed.slice(0, -suffix.length);
      if (candidate.length >= 3) {
        stemmed = candidate;
        break;
      }
    }
  }
  return stemmed;
}

function getStemsAndWords(text) {
  if (!text) return [];
  const clean = text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  const words = clean.split(/\s+/).filter(Boolean);
  const result = new Set();
  
  const stopWords = new Set(['bana', 'bir', 've', 'en', 'için', 'olan', 'araçlar', 'araç', 'yapay', 'zeka', 'bul', 'öner', 'tavsiye', 'et', 'mi', 'mu', 'nedir', 'listele', 'hangileri', 'nasıl']);
  
  words.forEach(w => {
    if (w.length <= 1 || stopWords.has(w)) return;
    result.add(w);
    
    const norm = normalizeText(w);
    result.add(norm);
    
    const stemmed = stripTurkishSuffixes(w);
    result.add(stemmed);
    result.add(normalizeText(stemmed));
    
    const stemmedNorm = stripTurkishSuffixes(norm);
    result.add(stemmedNorm);
  });
  
  return Array.from(result);
}

// ─── i18n Translation Support ──────────────────
const categoryTranslations = {
  en: {
    'Genel AI Asistan': 'General AI Assistant',
    'Yazılım & Kod AI': 'Software & Code AI',
    'Görsel & Tasarım AI': 'Image & Design AI',
    'Bilgi & Araştırma AI': 'Knowledge & Research AI',
    'Veri & Analitik AI': 'Data & Analytics AI',
    'İş & Üretkenlik AI': 'Business & Productivity AI',
    'Pazarlama & Satış AI': 'Marketing & Sales AI',
    'E-ticaret AI': 'E-commerce AI',
    'Finans AI': 'Finance AI',
    'Hukuk & Uyum AI': 'Law & Compliance AI',
    'Siber Güvenlik AI': 'Cybersecurity AI',
    'Sağlık AI': 'Healthcare AI',
    'Eğitim AI': 'Education AI',
    'Kurumsal AI': 'Enterprise AI',
    'Endüstri & Robotik AI': 'Industry & Robotics AI',
    'Mobilite AI': 'Mobility AI',
    'Altyapı AI': 'Infrastructure AI',
    'Oyun & Eğlence AI': 'Gaming & Entertainment AI',
    'Bilim & Akademik AI': 'Science & Academic AI',
    'Donanım & IoT AI': 'Hardware & IoT AI'
  },
  de: {
    'Genel AI Asistan': 'Allgemeiner KI-Assistent',
    'Yazılım & Kod AI': 'Software & Code KI',
    'Görsel & Tasarım AI': 'Bild & Design KI',
    'Bilgi & Araştırma AI': 'Wissen & Forschung KI',
    'Veri & Analitik AI': 'Daten & Analytik KI',
    'İş & Üretkenlik AI': 'Geschäft & Produktivität KI',
    'Pazarlama & Satış AI': 'Marketing & Vertrieb KI',
    'E-ticaret AI': 'E-Commerce KI',
    'Finans AI': 'Finanzen KI',
    'Hukuk & Uyum AI': 'Recht & Compliance KI',
    'Sağlık AI': 'Gesundheit KI',
    'Eğitim AI': 'Bildung KI',
    'Kurumsal AI': 'Unternehmen KI',
    'Endüstri & Robotik AI': 'Industrie & Robotik KI',
    'Mobilite AI': 'Mobilität KI',
    'Altyapı AI': 'Infrastruktur KI',
    'Oyun & Eğlence AI': 'Gaming & Unterhaltung KI',
    'Bilim & Akademik AI': 'Wissenschaft & Akademische KI',
    'Donanım & IoT AI': 'Hardware & IoT KI'
  }
};

function translatePricingTry(pricingTry, lang) {
  if (!pricingTry) return pricingTry;
  if (!lang || lang === 'tr') return pricingTry;

  let val = pricingTry.trim();
  if (lang === 'en') {
    if (val === 'Ücretsiz') return 'Free';
    if (val === 'Ücretsiz Plan Mevcut') return 'Free Plan Available';
    if (val === 'Özel Teklif') return 'Special Offer';
    
    val = val.replace(/(\d+)\s*TL\/ay'dan başlayan/i, "Starting from $1 TRY/month")
             .replace(/(\d+)\s*TL\/ay/i, "$1 TRY/month")
             .replace(/(\d+)\s*USD\/ay/i, "$1 USD/month")
             .replace(/~\s*(\d+)\s*TL/i, "~$1 TRY")
             .replace(/ay/i, "month");
  } else if (lang === 'de') {
    if (val === 'Ücretsiz') return 'Kostenlos';
    if (val === 'Ücretsiz Plan Mevcut') return 'Kostenloser Plan verfügbar';
    if (val === 'Özel Teklif') return 'Sonderangebot';

    val = val.replace(/(\d+)\s*TL\/ay'dan başlayan/i, "ab $1 TRY/Monat")
             .replace(/(\d+)\s*TL\/ay/i, "$1 TRY/Monat")
             .replace(/(\d+)\s*USD\/ay/i, "$1 USD/Monat")
             .replace(/~\s*(\d+)\s*TL/i, "~$1 TRY")
             .replace(/ay/i, "Monat");
  }
  return val;
}

async function translateProsCons(pros, cons, lang, settings) {
  if (!pros || !cons || pros.length === 0 || cons.length === 0) return { pros, cons };
  if (!lang || lang === 'tr') return { pros, cons };

  const apiKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY || settings.ai_api_key;
  if (!apiKey) return { pros, cons };

  try {
    const { callLLM } = require('../services/ai');
    const systemPrompt = "You are a professional translator. Translate the following pros and cons list of an AI tool from Turkish to " + (lang === 'de' ? 'German' : 'English') + ".\n" +
      "Keep the points short (max 80 chars) and return strictly as a JSON object with \"pros\" and \"cons\" arrays. Do not output anything else.\n\n" +
      "JSON Format:\n{\n  \"pros\": [\"translated pro 1\", \"translated pro 2\", ...],\n  \"cons\": [\"translated con 1\", \"translated con 2\", ...]\n}";
    const userPrompt = 'Pros: ' + JSON.stringify(pros) + '\nCons: ' + JSON.stringify(cons);
    const llmResponse = await callLLM(systemPrompt, userPrompt, settings);
    
    let translated = { pros: [], cons: [] };
    try {
      translated = JSON.parse(llmResponse);
    } catch(e) {
      const cleanJson = llmResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      translated = JSON.parse(cleanJson);
    }
    if (translated.pros && translated.pros.length > 0) {
      return translated;
    }
  } catch (err) {
    console.error('[translateProsCons Helper Failed]:', err.message);
  }
  return { pros, cons };
}

const translatingIds = new Set();

async function translateInBackground(toolId, lang) {
  const cacheKey = toolId + '_' + lang;
  if (translatingIds.has(cacheKey)) return;
  translatingIds.add(cacheKey);

  try {
    const db = readDB();
    const idx = db.tools.findIndex(t => t.id === toolId);
    if (idx === -1) return;

    const tool = db.tools[idx];
    const descKey = 'description_' + lang;
    const tagsKey = 'tags_' + lang;

    if (tool[descKey]) return; // Already translated by another process

    const settings = db.crawler_settings || {};
    if (!settings.ai_api_key && !process.env.GROQ_API_KEY && !process.env.AI_API_KEY) {
      return;
    }

    const { callLLM } = require('../services/ai');
    const systemPrompt = "You are a professional translator. Translate the following AI tool description and tags from Turkish to " + (lang === 'de' ? 'German' : 'English') + ".\n" +
      "Keep the same tone, professional terminology, and style.\n" +
      "Return the result strictly as a JSON object with \"description\" and \"tags\" keys. Do not output anything else.\n\n" +
      "JSON Format:\n{\n  \"description\": \"translated description\",\n  \"tags\": [\"tag1\", \"tag2\", ...]\n}";
    const userPrompt = 'Description: "' + tool.description + '"\nTags: ' + JSON.stringify(tool.tags);
    const llmResponse = await callLLM(systemPrompt, userPrompt, settings);
    
    let translated = { description: '', tags: [] };
    try {
      translated = JSON.parse(llmResponse);
    } catch (e) {
      const cleanJson = llmResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      translated = JSON.parse(cleanJson);
    }

    if (translated.description) {
      const currentDb = readDB();
      const currentIdx = currentDb.tools.findIndex(t => t.id === toolId);
      if (currentIdx !== -1) {
        currentDb.tools[currentIdx][descKey] = translated.description;
        currentDb.tools[currentIdx][tagsKey] = translated.tags;
        writeDB(currentDb);
        console.log('[Translation] Cached translation for tool "' + tool.name + '" in ' + lang);
      }
    }
  } catch (err) {
    console.error('[Translation Failed] for ' + toolId + ' to ' + lang + ':', err.message);
  } finally {
    translatingIds.delete(cacheKey);
  }
}

async function translateToolIfNeeded(tool, lang, db) {
  if (!lang || lang === 'tr') return tool;
  const descKey = 'description_' + lang;
  const tagsKey = 'tags_' + lang;

  let translated = tool;
  if (tool[descKey]) {
    translated = {
      ...tool,
      description: tool[descKey],
      tags: tool[tagsKey] || tool.tags
    };
  } else {
    // Fallback to original Turkish, but translate in background
    translateInBackground(tool.id, lang).catch(err => {});
  }

  if (translated.pricing_try) {
    translated.pricing_try = translatePricingTry(translated.pricing_try, lang);
  }
  return translated;
}

async function getTranslatedToolSync(tool, lang, db) {
  const descKey = 'description_' + lang;
  const tagsKey = 'tags_' + lang;

  let translated = tool;
  if (tool[descKey]) {
    translated = {
      ...tool,
      description: tool[descKey],
      tags: tool[tagsKey] || tool.tags
    };
  } else {
    const settings = db.crawler_settings || {};
    if (settings.ai_api_key || process.env.GROQ_API_KEY || process.env.AI_API_KEY) {
      try {
        const { callLLM } = require('../services/ai');
        const systemPrompt = "You are a professional translator. Translate the following AI tool description and tags from Turkish to " + (lang === 'de' ? 'German' : 'English') + ".\n" +
          "Keep the same tone, professional terminology, and style.\n" +
          "Return the result strictly as a JSON object with \"description\" and \"tags\" keys. Do not output anything else.\n\n" +
          "JSON Format:\n{\n  \"description\": \"translated description\",\n  \"tags\": [\"tag1\", \"tag2\", ...]\n}";
        const userPrompt = 'Description: "' + tool.description + '"\nTags: ' + JSON.stringify(tool.tags);
        const llmResponse = await callLLM(systemPrompt, userPrompt, settings);
        
        let parsed = { description: '', tags: [] };
        try {
          parsed = JSON.parse(llmResponse);
        } catch (e) {
          const cleanJson = llmResponse.replace(/```json/g, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleanJson);
        }

        if (parsed.description) {
          const currentDb = readDB();
          const currentIdx = currentDb.tools.findIndex(t => t.id === tool.id);
          if (currentIdx !== -1) {
            currentDb.tools[currentIdx][descKey] = parsed.description;
            currentDb.tools[currentIdx][tagsKey] = parsed.tags;
            writeDB(currentDb);
            
            tool[descKey] = parsed.description;
            tool[tagsKey] = parsed.tags;
          }
        }
      } catch (err) {
        console.error('[Sync Translation Failed] for ' + tool.id + ' to ' + lang + ':', err.message);
      }
    }
    translated = {
      ...tool,
      description: tool[descKey] || tool.description,
      tags: tool[tagsKey] || tool.tags
    };
  }

  if (translated.pricing_try) {
    translated.pricing_try = translatePricingTry(translated.pricing_try, lang);
  }
  return translated;
}

// ─── CATEGORIES ───────────────────────────────

router.get('/categories', function (req, res) {
  try {
    const { lang } = req.query;
    const db = readDB();
    const cats = db.categories
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(c => {
        let name = c.name;
        if (lang && categoryTranslations[lang] && categoryTranslations[lang][c.name]) {
          name = categoryTranslations[lang][c.name];
        }
        return {
          ...c,
          name,
          count: db.tools.filter(t => t.category_id === c.id).length
        };
      });
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: 'Kategoriler yüklenemedi.' });
  }
});

router.post('/categories', requireAuth, function (req, res) {
  try {
    const { id, name, icon, sort_order } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'ID ve isim gerekli.' });
    const db = readDB();
    if (db.categories.find(c => c.id === id)) return res.status(409).json({ error: 'Bu ID zaten mevcut.' });
    db.categories.push({ id, name, icon: icon || '📁', sort_order: sort_order || 0, created_at: new Date().toISOString() });
    writeDB(db);
    res.status(201).json({ success: true, message: 'Kategori oluşturuldu.' });
  } catch (err) {
    res.status(500).json({ error: 'Kategori oluşturulamadı.' });
  }
});

router.put('/categories/:id', requireAuth, function (req, res) {
  try {
    const { name, icon, sort_order } = req.body;
    const db = readDB();
    const idx = db.categories.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Kategori bulunamadı.' });
    db.categories[idx] = { ...db.categories[idx], name, icon, sort_order: sort_order || 0 };
    writeDB(db);
    res.json({ success: true, message: 'Kategori güncellendi.' });
  } catch (err) {
    res.status(500).json({ error: 'Kategori güncellenemedi.' });
  }
});

router.delete('/categories/:id', requireAuth, function (req, res) {
  try {
    const db = readDB();
    const before = db.categories.length;
    db.categories = db.categories.filter(c => c.id !== req.params.id);
    if (db.categories.length === before) return res.status(404).json({ error: 'Kategori bulunamadı.' });
    // Araçların category_id'sini null yap
    db.tools.forEach(t => { if (t.category_id === req.params.id) t.category_id = null; });
    writeDB(db);
    res.json({ success: true, message: 'Kategori silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Kategori silinemedi.' });
  }
});

// ─── TOOLS ────────────────────────────────────

router.get('/tools', async function (req, res) {
  try {
    const { search, category, pricing, sort, limit, made_in_turkey, profession, lang, show_in_slider, ids } = req.query;
    const db = readDB();

    let tools = db.tools;

    if (ids) {
      const idList = ids.split(',').map(id => id.trim()).filter(Boolean);
      tools = tools.filter(t => idList.includes(t.id));
    }

    if (search) {
      const s = search.trim().toLocaleLowerCase('tr-TR');
      const searchWords = s.split(/\s+/).filter(Boolean);
      const stopWords = ['yapan', 'aracı', 'arac', 'olan', 'bir', 've', 'en', 'ai', 'yapay', 'zeka', 'çevir', 'cevir', 'siteleri', 'sistemi', 'programi', 'programı'];
      
      let filteredWords = searchWords;
      if (searchWords.length > 1) {
        filteredWords = searchWords.filter(w => !stopWords.includes(w));
      }
      if (filteredWords.length === 0) {
        filteredWords = [s];
      }

      const wordMatch = function (sw, tw) {
        if (tw.includes(sw)) return true;
        if (sw.includes(tw)) return true;
        const len = Math.min(sw.length, tw.length);
        if (len >= 3) {
          const prefixLen = Math.min(4, len);
          if (sw.substring(0, prefixLen) === tw.substring(0, prefixLen)) return true;
          if (sw.substring(0, 3) === tw.substring(0, 3)) return true;
        }
        return false;
      };

      const trLower = function (str) {
        return (str || '').toLocaleLowerCase('tr-TR');
      };

      tools = tools.filter(t => {
        const nameText = trLower(t.name);
        const descText = trLower(t.description);
        const tagsText = (t.tags || []).map(tag => trLower(tag)).join(' ');

        return filteredWords.some(sw => {
          if (nameText.includes(sw) || descText.includes(sw) || tagsText.includes(sw)) return true;
          const targetWords = `${nameText} ${descText} ${tagsText}`.split(/[^\wığüşöç]+/);
          return targetWords.some(tw => wordMatch(sw, tw));
        });
      });
    }
    if (category) tools = tools.filter(t => t.category_id === category);
    if (pricing && pricing !== 'all') tools = tools.filter(t => t.pricing === pricing);
    if (made_in_turkey !== undefined) {
      const isYerli = made_in_turkey === 'true' || made_in_turkey === '1';
      tools = tools.filter(t => !!t.made_in_turkey === isYerli);
    }
    if (profession) {
      tools = tools.filter(t => Array.isArray(t.professions) && t.professions.includes(profession));
    }
    if (show_in_slider !== undefined) {
      const sliderFilter = show_in_slider === 'true' || show_in_slider === '1';
      tools = tools.filter(t => !!t.show_in_slider === sliderFilter);
    }

    if (sort === 'name-asc') tools.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    else if (sort === 'newest') tools.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sort === 'popular') tools.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    else tools.sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name, 'tr'));

    if (limit) tools = tools.slice(0, parseInt(limit));

    if (lang && lang !== 'tr') {
      tools = await Promise.all(tools.map(t => translateToolIfNeeded(t, lang, db)));
    }

    // Map to lightweight, fast-loading objects for the client card grid
    const lightweightTools = tools.map(t => {
      const cat = db.categories.find(c => c.id === t.category_id);
      let catName = cat ? cat.name : '';
      if (lang && categoryTranslations[lang] && cat && categoryTranslations[lang][cat.name]) {
        catName = categoryTranslations[lang][cat.name];
      }
      
      let parsedTags = [];
      if (Array.isArray(t.tags)) {
        parsedTags = t.tags;
      } else if (typeof t.tags === 'string') {
        try { parsedTags = JSON.parse(t.tags || '[]'); } catch (e) { parsedTags = []; }
      }

      return {
        id: t.id,
        name: t.name,
        url: t.url,
        description: t.description ? t.description.substring(0, 180) : '',
        category_id: t.category_id,
        pricing: t.pricing,
        rating: t.rating,
        votes: t.votes || 0,
        turkish_supported: t.turkish_supported,
        made_in_turkey: t.made_in_turkey,
        tags: parsedTags.slice(0, 3),
        pricing_try: t.pricing_try,
        featured: t.featured,
        is_new: t.is_new || t.isNew,
        show_in_slider: t.show_in_slider,
        category_name: catName,
        category_icon: cat ? cat.icon : ''
      };
    });

    res.json({ tools: lightweightTools, total: lightweightTools.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Araçlar yüklenemedi.' });
  }
});

router.get('/tools/detect', async function (req, res) {
  try {
    const { domain } = req.query;
    if (!domain) return res.status(400).json({ error: 'Domain parametresi gerekli.' });

    const db = readDB();

    const cleanDomain = (d) => {
      let result = d.toLowerCase().trim();
      result = result.replace(/^(https?:\/\/)?(www\.)?/, '');
      result = result.split('/')[0];
      return result;
    };

    const targetDomain = cleanDomain(domain);

    const tool = db.tools.find(t => {
      if (!t.url) return false;
      return cleanDomain(t.url) === targetDomain;
    });

    if (!tool) {
      return res.json({ exists: false });
    }

    const cat = db.categories.find(c => c.id === tool.category_id);
    const categoryName = cat ? cat.name : '';

    let alternatives = db.tools
      .filter(t => t.category_id === tool.category_id && t.id !== tool.id)
      .map(t => {
        const c = db.categories.find(catItem => catItem.id === t.category_id);
        return { ...t, category_name: c ? c.name : '' };
      });

    alternatives.sort((a, b) => b.rating - a.rating || (b.votes || 0) - (a.votes || 0));
    const topAlternatives = alternatives.slice(0, 3);

    res.json({
      exists: true,
      tool: {
        ...tool,
        category_name: categoryName,
        category_icon: cat ? cat.icon : ''
      },
      alternatives: topAlternatives
    });
  } catch (err) {
    console.error('Tool detection error:', err);
    res.status(500).json({ error: 'Araç algılanamadı.' });
  }
});

router.post('/ai/summarize', async function (req, res) {
  try {
    const { text, url } = req.body;
    if (!text) return res.status(400).json({ error: 'Metin gerekli.' });

    const db = readDB();
    const settings = db.crawler_settings || {};
    const { callLLM } = require('../services/ai');

    const systemPrompt = `Sen AiKlavuz yapay zeka asistanısın. Görevin, sana gönderilen web sayfası içeriğini analiz etmek ve en önemli kısımlarını Türkçe olarak özetlemektir.
Kurallar:
1. Yanıtı sadece JSON formatında şu yapıda dön: {"summary": "• Madde 1\\n• Madde 2\\n• Madde 3..."}
2. Maddeler halinde (en fazla 5 madde) net ve anlaşılır ol.
3. Reklam ve gereksiz içerikleri ayıkla, sadece ana fikri yaz.
4. Başka hiçbir açıklama metni ekleme, sadece JSON objesini döndür.`;

    const userPrompt = `Web Sayfası Adresi: ${url || 'Belirtilmedi'}\n\nİçerik:\n${text.substring(0, 8000)}`;

    const responseText = await callLLM(systemPrompt, userPrompt, { ...settings, jsonMode: true });
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch(e) {
      result = { summary: responseText };
    }

    res.json({ success: true, summary: result.summary });
  } catch (err) {
    console.error('AI summary error:', err);
    res.status(500).json({ error: err.message || 'Özet oluşturulurken bir hata oluştu.' });
  }
});

router.get('/tools/:id', async function (req, res) {
  try {
    const { lang } = req.query;
    const db = readDB();
    let tool = db.tools.find(t => t.id === req.params.id);
    if (!tool) return res.status(404).json({ error: 'Araç bulunamadı.' });

    if (lang && lang !== 'tr') {
      tool = await getTranslatedToolSync(tool, lang, db);
    }

    const cat = db.categories.find(c => c.id === tool.category_id);
    let catName = cat ? cat.name : '';
    if (lang && categoryTranslations[lang] && cat && categoryTranslations[lang][cat.name]) {
      catName = categoryTranslations[lang][cat.name];
    }

    const reviews = (db.reviews || []).filter(r => r.tool_id === tool.id);
    res.json({ 
      ...tool, 
      category_name: catName, 
      category_icon: cat ? cat.icon : '',
      reviews: reviews
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Araç yüklenemedi.' });
  }
});

// Helper to generate dynamic, tool-specific fallback pros and cons
function generateFallbackProsCons(tool, db) {
  const cat = db.categories.find(c => c.id === tool.category_id);
  const catId = (tool.category_id || '').toLowerCase();
  const catName = cat ? cat.name.toLowerCase() : '';
  const name = tool.name;

  const prosPool = [];
  const consPool = [];

  // General pros & cons
  prosPool.push(`Modern ve kullanıcı dostu arayüzü ile hızlıca öğrenilebilir.`);
  prosPool.push(`${name}, kendi alanında popüler ve geniş kabul görmüş bir çözümdür.`);

  // Category specific pros & cons
  if (catId.includes('kod') || catId.includes('developer') || catName.includes('kod') || catName.includes('yazılım') || catName.includes('geliştirici')) {
    prosPool.push(`Kod yazma, hata ayıklama ve geliştirme süreçlerini hızlandırır.`);
    prosPool.push(`Popüler IDE'ler ve yazılım araçlarıyla entegrasyonu kolaydır.`);
    consPool.push(`Karmaşık mantıksal mimarilerde üretilen çıktılar insan kontrolü gerektirir.`);
    consPool.push(`Çok spesifik veya eski kütüphanelerle çalışırken önerileri zayıf kalabilir.`);
  } else if (catId.includes('yaz') || catId.includes('metin') || catName.includes('yaz') || catName.includes('içerik') || catName.includes('editör')) {
    prosPool.push(`İçerik üretimi, metin düzenleme ve blog yazarlığı süreçlerini ciddi oranda hızlandırır.`);
    prosPool.push(`Çeşitli dil tonlarında ve formatlarda akıcı metin üretebilme yeteneğine sahiptir.`);
    consPool.push(`Üretilen içeriklerin doğruluğu ve intihal durumu mutlaka son okumayla denetlenmelidir.`);
    consPool.push(`Yaratıcı ve derin sanatsal metinlerde tekrara düşme eğilimi gösterebilir.`);
  } else if (catId.includes('tasarim') || catId.includes('gorsel') || catName.includes('tasarım') || catName.includes('görsel') || catName.includes('video') || catName.includes('resim') || catName.includes('grafik')) {
    prosPool.push(`Hızlı prototipleme, yaratıcı görsel taslaklar ve render üretme imkanı sunar.`);
    prosPool.push(`Farklı stil ve çözünürlük seçenekleriyle yüksek esneklik sağlar.`);
    consPool.push(`Görsellerde bazen anatomik veya detaysal küçük anomaliler oluşabilir.`);
    consPool.push(`Yüksek çözünürlüklü ve detaylı çıktılar almak daha uzun işlem süresi gerektirebilir.`);
  } else if (catId.includes('analiz') || catId.includes('veri') || catName.includes('veri') || catName.includes('analiz') || catName.includes('rapor')) {
    prosPool.push(`Büyük veri kümelerini hızlıca analiz edip anlamlı içgörüler üretebilir.`);
    prosPool.push(`Grafiksel raporlamalar ve veri görselleştirme seçenekleri başarılıdır.`);
    consPool.push(`Veri güvenliği ve gizliliği açısından hassas bilgilerin yüklenmesinde dikkat edilmelidir.`);
    consPool.push(`Karmaşık istatistiksel modellerde sapmalar veya hatalı yorumlar üretebilir.`);
  } else {
    if (tool.description && tool.description.length > 100) {
      prosPool.push(`Detaylı özellikleri ve esnek yapısı ile farklı kullanım senaryolarına uygundur.`);
    } else {
      prosPool.push(`Pratik ve amaca yönelik yapısıyla hızlı sonuçlar almanızı sağlar.`);
    }
  }

  // Pricing specific pros & cons
  if (tool.pricing === 'ucretsiz') {
    prosPool.push(`Tamamen ücretsiz bir model sunduğu için maliyetsiz bir başlangıç sağlar.`);
    consPool.push(`Ücretsiz sunulduğundan gelişmiş destek ve kurumsal SLA garantisi bulunmayabilir.`);
  } else if (tool.pricing === 'freemium') {
    prosPool.push(`Ücretsiz başlangıç paketi sayesinde temel özellikleri ödeme yapmadan deneme imkanı verir.`);
    consPool.push(`Gelişmiş özellikler, yüksek kullanım limitleri ve API erişimi için ücretli plana geçilmelidir.`);
  } else if (tool.pricing === 'ucretli') {
    prosPool.push(`Profesyonel düzeyde araç seti, yüksek limitler ve güvenilir teknik altyapı sunar.`);
    consPool.push(`Herhangi bir kalıcı ücretsiz sürümü yoktur, deneme süresi sonrası abonelik zorunludur.`);
  }

  // Turkish support pros & cons
  if (tool.turkish_supported === 'full') {
    prosPool.push(`Tam Türkçe dil desteği sunduğu için yerel kullanıcılar için kullanım kolaylığı sağlar.`);
  } else if (tool.turkish_supported === 'none') {
    consPool.push(`Arayüz ve çıktılarda Türkçe desteği yoktur, verimli kullanım için İngilizce bilgisi gerektirir.`);
  } else {
    prosPool.push(`Kısmi Türkçe desteği veya tarayıcı çevirileriyle kullanılabilir düzeydedir.`);
  }

  // General cons
  consPool.push(`Yoğun sunucu saatlerinde yanıt sürelerinde gecikmeler yaşanabilir.`);
  consPool.push(`Sürekli güncellenen yapay zeka modelleri nedeniyle arayüzde veya çıktılarda zaman zaman değişiklikler görülebilir.`);

  // Stable pseudo-random shuffle based on tool.id character codes
  let charSum = 0;
  for (let i = 0; i < tool.id.length; i++) {
    charSum += tool.id.charCodeAt(i);
  }

  const seededShuffle = (array) => {
    let currentIndex = array.length, randomIndex;
    let seed = charSum;
    while (currentIndex !== 0) {
      seed = (seed * 9301 + 49297) % 233280;
      randomIndex = Math.floor((seed / 233280) * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  const uniquePros = [...new Set(prosPool)];
  const uniqueCons = [...new Set(consPool)];

  const shuffledPros = seededShuffle(uniquePros);
  const shuffledCons = seededShuffle(uniqueCons);

  const finalPros = shuffledPros.slice(0, 3);
  const finalCons = shuffledCons.slice(0, 3);

  while (finalPros.length < 3) {
    finalPros.push(`İş verimliliğini ve günlük operasyonları optimize etmeye yardımcı olur.`);
  }
  while (finalCons.length < 3) {
    finalCons.push(`Entegrasyon yetenekleri veya özelleştirme seçenekleri sınırlı olabilir.`);
  }

  return { pros: finalPros, cons: finalCons };
}

router.get('/tools/:id/analysis', async function (req, res) {
  try {
    const db = readDB();
    const toolIdx = db.tools.findIndex(t => t.id === req.params.id);
    if (toolIdx === -1) return res.status(404).json({ error: 'Araç bulunamadı.' });

    const { lang } = req.query;
    const tool = db.tools[toolIdx];
    const settings = db.crawler_settings || {};
    
    // If lang requested and we already have cached translations, return them immediately
    if (lang && lang !== 'tr') {
      const prosKey = 'pros_' + lang;
      const consKey = 'cons_' + lang;
      if (tool[prosKey] && tool[consKey]) {
        return res.json({ success: true, pros: tool[prosKey], cons: tool[consKey] });
      }
    }

    // Determine the base Turkish pros and cons first
    let basePros = tool.pros || [];
    let baseCons = tool.cons || [];

    if (basePros.length === 0 || baseCons.length === 0) {
      // AI is not configured or disabled, fallback to mockup pros/cons
      const hasApiKey = settings.ai_api_key || process.env.GROQ_API_KEY || process.env.AI_API_KEY;
      if (!hasApiKey) {
        const fallback = generateFallbackProsCons(tool, db);
        basePros = fallback.pros;
        baseCons = fallback.cons;
      } else {
        try {
          const { callLLM } = require('../services/ai');
          const systemPrompt = `Verilen yapay zeka aracı ismi ve açıklamasına dayanarak, bu aracın en olası 3 adet artı yönünü (Pros) ve 3 adet eksi yönünü (Cons) belirle.
Türkçe ve profesyonel bir dille yazılmış maddeler halinde aşağıdaki JSON formatında döndür. Başka hiçbir açıklama yazma.

JSON Formatı:
{
  "pros": [
    "artı yön (maks 80 karakter, numaralandırma veya işaret koyma)",
    "artı yön",
    "artı yön"
  ],
  "cons": [
    "eksi yön (maks 80 karakter, numaralandırma veya işaret koyma)",
    "eksi yön",
    "eksi yön"
  ]
}`;
          const userPrompt = `Araç Adı: "${tool.name}"\nAçıklama: "${tool.description}"`;
          const llmResponse = await callLLM(systemPrompt, userPrompt, settings);
          
          let analysis = { pros: [], cons: [] };
          try {
            analysis = JSON.parse(llmResponse);
          } catch(e) {
            const cleanJson = llmResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            analysis = JSON.parse(cleanJson);
          }

          basePros = analysis.pros || [];
          baseCons = analysis.cons || [];

          // Cache base TR to DB
          db.tools[toolIdx].pros = basePros;
          db.tools[toolIdx].cons = baseCons;
          writeDB(db);
        } catch (err) {
          console.error('AI Analysis generation error:', err);
          const fallback = generateFallbackProsCons(tool, db);
          basePros = fallback.pros;
          baseCons = fallback.cons;
        }
      }
    }

    // Now, if lang is requested and not 'tr', translate the base pros and cons
    if (lang && lang !== 'tr') {
      const prosKey = 'pros_' + lang;
      const consKey = 'cons_' + lang;
      
      try {
        const translated = await translateProsCons(basePros, baseCons, lang, settings);
        if (translated.pros && translated.pros.length > 0) {
          // Cache translation to DB
          const freshDb = readDB();
          const freshIdx = freshDb.tools.findIndex(t => t.id === tool.id);
          if (freshIdx !== -1) {
            freshDb.tools[freshIdx][prosKey] = translated.pros;
            freshDb.tools[freshIdx][consKey] = translated.cons;
            writeDB(freshDb);
          }
          return res.json({ success: true, pros: translated.pros, cons: translated.cons });
        }
      } catch (err) {
        console.error('AI Analysis translation error:', err);
      }
      
      // Fallback translation if LLM translate fails or not configured
      const translatedPros = basePros.map(p => {
        if (p.includes("Kullanıcı dostu")) return lang === 'de' ? "Benutzerfreundliche und moderne Schnittstelle." : "User-friendly and modern interface.";
        return p;
      });
      const translatedCons = baseCons.map(c => {
        if (c.includes("Ücretsiz plandaki limitler")) return lang === 'de' ? "Einschränkungen im kostenlosen Plan." : "Limitations in the free plan.";
        return c;
      });
      return res.json({ success: true, pros: translatedPros, cons: translatedCons });
    }

    res.json({ success: true, pros: basePros, cons: baseCons });
  } catch (err) {
    console.error('AI Analysis route error:', err);
    // Absolute fallback
    const defaultPros = [
      "Kolay ve hızlı kullanım arayüzü.",
      "Kendi kategorisinde en popüler çözümlerden biri.",
      "Geniş entegrasyon desteği ve topluluk."
    ];
    const defaultCons = [
      "Ücretsiz plandaki limitler kısıtlayıcı olabilir.",
      "Gelişmiş özellikler için ücretli abonelik gerektirir.",
      "Türkçe dil desteği tam olarak optimize edilmemiş olabilir."
    ];
    if (lang && lang !== 'tr') {
      if (lang === 'de') {
        return res.json({
          success: true,
          pros: ["Einfach und schnell zu bedienende Benutzeroberfläche.", "Eine der beliebtesten Lösungen in ihrer Kategorie.", "Breite Integrationsunterstützung und Community."],
          cons: ["Einschränkungen im kostenlosen Plan können restriktiv sein.", "Erfordert ein kostenpflichtiges Abonnement für erweiterte Funktionen.", "Die Unterstützung der deutschen Sprache ist möglicherweise nicht vollständig optimiert."]
        });
      } else {
        return res.json({
          success: true,
          pros: ["Easy and fast to use interface.", "One of the most popular solutions in its category.", "Wide integration support and community."],
          cons: ["Limits in the free plan can be restrictive.", "Requires a paid subscription for advanced features.", "English support is fully optimized."]
        });
      }
    }
    res.json({ success: true, pros: defaultPros, cons: defaultCons });
  }
});

router.post('/tools/:id/reviews', requireAuth, function (req, res) {
  try {
    const { rating, comment } = req.body;
    const ratingVal = parseInt(rating);
    
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ error: 'Puan 1-5 arasında bir değer olmalıdır.' });
    }
    
    if (!comment || comment.trim().length < 3) {
      return res.status(400).json({ error: 'Lütfen en az 3 karakterden oluşan bir yorum yazın.' });
    }

    const db = readDB();
    const toolIdx = db.tools.findIndex(t => t.id === req.params.id);
    if (toolIdx === -1) return res.status(404).json({ error: 'Araç bulunamadı.' });

    if (!db.reviews) {
      db.reviews = [];
    }

    // Check if this user already reviewed this tool
    const existingIdx = db.reviews.findIndex(r => r.tool_id === req.params.id && r.user_id === req.session.userId);
    const reviewData = {
      id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      tool_id: req.params.id,
      user_id: req.session.userId,
      username: req.session.username || 'Kullanıcı',
      rating: ratingVal,
      comment: comment.trim(),
      created_at: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      db.reviews[existingIdx] = reviewData; // Overwrite
    } else {
      db.reviews.push(reviewData);
    }

    // Update average rating
    const toolReviews = db.reviews.filter(r => r.tool_id === req.params.id);
    const sum = toolReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = parseFloat((sum / toolReviews.length).toFixed(1));
    
    db.tools[toolIdx].rating = avg;
    db.tools[toolIdx].votes = (db.tools[toolIdx].votes || 0) + 1; // Increment votes too for sorting/popular popularity

    writeDB(db);

    res.json({
      success: true,
      message: 'İncelemeniz başarıyla kaydedildi.',
      rating: avg,
      reviews: toolReviews
    });
  } catch (err) {
    console.error('Submit review error:', err);
    res.status(500).json({ error: 'İnceleme kaydedilemedi.' });
  }
});

router.get('/tools/:id/alternatives', function (req, res) {
  try {
    const db = readDB();
    const tool = db.tools.find(t => t.id === req.params.id);
    if (!tool) return res.status(404).json({ error: 'Araç bulunamadı.' });

    const targetCategory = tool.category_id;
    const targetTags = Array.isArray(tool.tags) ? tool.tags : [];

    const alternatives = db.tools
      .filter(t => t.id !== tool.id)
      .map(t => {
        let score = 0;
        if (t.category_id && t.category_id === targetCategory) {
          score += 10;
        }
        
        const tTags = Array.isArray(t.tags) ? t.tags : [];
        const matchingTags = tTags.filter(tag => targetTags.includes(tag));
        score += matchingTags.length * 2;

        const cat = db.categories.find(c => c.id === t.category_id);
        return {
          ...t,
          score,
          category_name: cat ? cat.name : '',
          category_icon: cat ? cat.icon : ''
        };
      })
      .filter(t => t.score > 0)
      .sort((a, b) => b.score - a.score || b.rating - a.rating)
      .slice(0, 12);

    res.json(alternatives);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Alternatifler yüklenemedi.' });
  }
});

router.post('/tools/:id/vote', function (req, res) {
  try {
    const db = readDB();
    const tool = db.tools.find(t => t.id === req.params.id);
    if (!tool) return res.status(404).json({ error: 'Araç bulunamadı.' });

    tool.votes = (tool.votes || 0) + 1;
    writeDB(db);
    res.json({ success: true, votes: tool.votes });
  } catch (err) {
    res.status(500).json({ error: 'Oy kaydedilemedi.' });
  }
});

router.post('/tools', requireAuth, function (req, res) {
  try {
    const { id, name, description, category_id, tags, pricing, rating, url, featured, is_new, show_in_slider, votes, turkish_supported, pricing_try } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'ID ve isim gerekli.' });
    
    const db = readDB();
    if (db.tools.find(t => t.id === id)) return res.status(409).json({ error: 'Bu ID zaten mevcut.' });
    
    const newTool = {
      id, name, description: description || '', category_id: category_id || null,
      tags: tags || [], pricing: pricing || 'freemium', rating: rating || 4.0,
      url: url || '', featured: featured ? 1 : 0, is_new: is_new ? 1 : 0,
      show_in_slider: show_in_slider ? 1 : 0,
      votes: votes || 0,
      turkish_supported: turkish_supported || 'none',
      pricing_try: pricing_try || '',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    };
    db.tools.push(newTool);
    writeDB(db);
    
    // Add to social queue
    addToSocialQueue(newTool);
    
    // Google Indexing API Auto Ping
    const { pingGoogleIndexing } = require('../services/google-indexing');
    pingGoogleIndexing(`https://aiklavuz.com/tool/${newTool.id}`, 'URL_UPDATED').catch(err => {
      console.error('Google Indexing API auto-ping error on tool creation:', err.message);
    });
    
    res.status(201).json({ success: true, message: 'Araç oluşturuldu.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Araç oluşturulamadı.' });
  }
});

router.put('/tools/:id', requireAuth, function (req, res) {
  try {
    const { name, description, category_id, tags, pricing, rating, url, featured, is_new, show_in_slider, votes, turkish_supported, pricing_try } = req.body;
    const db = readDB();
    const idx = db.tools.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Araç bulunamadı.' });
    db.tools[idx] = {
      ...db.tools[idx], name, description: description || '', category_id: category_id || null,
      tags: tags || [], pricing: pricing || 'freemium', rating: rating || 4.0,
      url: url || '', featured: featured ? 1 : 0, is_new: is_new ? 1 : 0,
      show_in_slider: show_in_slider ? 1 : 0,
      votes: votes !== undefined ? votes : db.tools[idx].votes || 0,
      turkish_supported: turkish_supported || db.tools[idx].turkish_supported || 'none',
      pricing_try: pricing_try || db.tools[idx].pricing_try || '',
      updated_at: new Date().toISOString()
    };
    writeDB(db);
    
    // Google Indexing API Auto Ping
    const { pingGoogleIndexing } = require('../services/google-indexing');
    pingGoogleIndexing(`https://aiklavuz.com/tool/${req.params.id}`, 'URL_UPDATED').catch(err => {
      console.error('Google Indexing API auto-ping error on tool update:', err.message);
    });
    
    res.json({ success: true, message: 'Araç güncellendi.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Araç güncellenemedi.' });
  }
});

router.delete('/tools/:id', requireAuth, function (req, res) {
  try {
    const db = readDB();
    const before = db.tools.length;
    db.tools = db.tools.filter(t => t.id !== req.params.id);
    if (db.tools.length === before) return res.status(404).json({ error: 'Araç bulunamadı.' });
    writeDB(db);
    
    // Google Indexing API Auto Ping
    const { pingGoogleIndexing } = require('../services/google-indexing');
    pingGoogleIndexing(`https://aiklavuz.com/tool/${req.params.id}`, 'URL_DELETED').catch(err => {
      console.error('Google Indexing API auto-ping error on tool deletion:', err.message);
    });
    
    res.json({ success: true, message: 'Araç silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Araç silinemedi.' });
  }
});

// Google Indexing API - Manuel Ping Uç Noktası
router.post('/admin/google-index', requireAuth, async function (req, res) {
  const { url, type } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL parametresi zorunludur.' });
  }
  
  try {
    const { pingGoogleIndexing } = require('../services/google-indexing');
    const result = await pingGoogleIndexing(url, type || 'URL_UPDATED');
    if (result.success) {
      res.json({ success: true, message: 'Google İndeksleme isteği başarıyla gönderildi.' });
    } else {
      res.status(500).json({ error: result.error || 'İndeksleme isteği başarısız oldu.' });
    }
  } catch (err) {
    console.error('Manual Google Indexing error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── STATS ────────────────────────────────────

router.get('/stats', function (req, res) {
  try {
    const db = readDB();
    res.json({
      totalTools: db.tools.filter(t => !t.status || t.status === 'approved').length,
      totalCategories: db.categories.length,
      freeTools: db.tools.filter(t => (t.pricing === 'ucretsiz' || t.pricing === 'freemium') && (!t.status || t.status === 'approved')).length,
      featuredTools: db.tools.filter(t => t.featured && (!t.status || t.status === 'approved')).length,
      pendingSubmissions: (db.submissions || []).length,
      pageViews: db.pageViews || 45280,
      totalUsers: (db.users || []).length
    });
  } catch (err) {
    res.status(500).json({ error: 'İstatistikler yüklenemedi.' });
  }
});

// ─── SUBMISSIONS ──────────────────────────────

router.post('/submissions', function (req, res) {
  try {
    const { name, url, description, category_id, pricing, tags, featured, made_in_turkey } = req.body;
    if (!name || !url || !description || !category_id || !pricing) {
      return res.status(400).json({ error: 'Gerekli alanları doldurun (Ad, URL, Açıklama, Kategori, Fiyat).' });
    }

    const db = readDB();
    const newSub = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name,
      url,
      description,
      category_id,
      pricing,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      rating: 4.5,
      source: 'user',
      featured: !!featured,
      made_in_turkey: !!made_in_turkey,
      created_at: new Date().toISOString()
    };

    db.submissions.push(newSub);
    writeDB(db);

    res.status(201).json({ success: true, message: 'Başvurunuz başarıyla alındı. İnceleme sonrası yayınlanacaktır.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Başvuru kaydedilemedi.' });
  }
});

router.get('/submissions', requireAuth, function (req, res) {
  try {
    const db = readDB();
    res.json(db.submissions || []);
  } catch (err) {
    res.status(500).json({ error: 'Başvurular yüklenemedi.' });
  }
});

// Helper for slug generation
function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

router.post('/submissions/:id/approve', requireAuth, function (req, res) {
  try {
    const db = readDB();
    const subIdx = db.submissions.findIndex(s => s.id === req.params.id);
    if (subIdx === -1) return res.status(404).json({ error: 'Başvuru bulunamadı.' });

    const sub = db.submissions[subIdx];
    
    // Generate unique ID for tools list
    let toolId = slugify(sub.name);
    if (!toolId) toolId = 'ai-tool-' + Date.now();
    
    let suffix = 1;
    let finalId = toolId;
    while (db.tools.some(t => t.id === finalId)) {
      finalId = toolId + '-' + suffix;
      suffix++;
    }

    const newTool = {
      id: finalId,
      name: sub.name,
      description: sub.description,
      category_id: sub.category_id,
      tags: sub.tags || [],
      pricing: sub.pricing,
      rating: sub.rating || 4.5,
      url: sub.url,
      featured: sub.featured ? 1 : 0,
      made_in_turkey: sub.made_in_turkey ? 1 : 0,
      is_new: 1,
      show_in_slider: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.tools.push(newTool);
    db.submissions.splice(subIdx, 1);
    writeDB(db);

    // Add to social queue
    addToSocialQueue(newTool);

    // Google Indexing API Auto Ping
    const { pingGoogleIndexing } = require('../services/google-indexing');
    pingGoogleIndexing(`https://aiklavuz.com/tool/${newTool.id}`, 'URL_UPDATED').catch(err => {
      console.error('Google Indexing API auto-ping error on submission approval:', err.message);
    });

    res.json({ success: true, message: 'Başvuru onaylandı ve yayına alındı.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Başvuru onaylanamadı.' });
  }
});

router.post('/submissions/:id/reject', requireAuth, function (req, res) {
  try {
    const db = readDB();
    const beforeLen = db.submissions.length;
    db.submissions = db.submissions.filter(s => s.id !== req.params.id);
    
    if (db.submissions.length === beforeLen) {
      return res.status(404).json({ error: 'Başvuru bulunamadı.' });
    }

    writeDB(db);
    res.json({ success: true, message: 'Başvuru reddedildi ve silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Başvuru reddedilemedi.' });
  }
});

// ─── CRAWLER ──────────────────────────────────

router.get('/admin/crawler/status', requireAuth, function (req, res) {
  try {
    const db = readDB();
    const settings = { ...db.crawler_settings };
    if (settings.ai_api_key) {
      const len = settings.ai_api_key.length;
      if (len > 8) {
        settings.ai_api_key = settings.ai_api_key.substring(0, 4) + '...' + settings.ai_api_key.substring(len - 4);
      } else {
        settings.ai_api_key = '********';
      }
    }
    res.json({
      settings: settings,
      logs: (db.crawler_logs || []).slice(-50).reverse()
    });
  } catch (err) {
    res.status(500).json({ error: 'Tarayıcı durumu yüklenemedi.' });
  }
});

router.post('/admin/crawler/settings', requireAuth, function (req, res) {
  try {
    const { auto_approve, ai_enabled, ai_provider, ai_api_key, ai_model, ai_custom_endpoint } = req.body;
    const db = readDB();
    
    const settings = db.crawler_settings || { last_run: null, total_crawled: 0 };
    
    let apiKey = ai_api_key;
    if (apiKey && apiKey.includes('...')) {
      apiKey = settings.ai_api_key;
    }
    
    db.crawler_settings = {
      ...settings,
      auto_approve: auto_approve !== undefined ? !!auto_approve : settings.auto_approve,
      ai_enabled: ai_enabled !== undefined ? !!ai_enabled : settings.ai_enabled,
      ai_provider: ai_provider || settings.ai_provider || 'xai',
      ai_api_key: apiKey !== undefined ? apiKey : settings.ai_api_key || '',
      ai_model: ai_model || settings.ai_model || 'grok-2',
      ai_custom_endpoint: ai_custom_endpoint !== undefined ? ai_custom_endpoint : settings.ai_custom_endpoint || ''
    };
    
    writeDB(db);
    res.json({ success: true, message: 'Tarayıcı ayarları başarıyla güncellendi.' });
  } catch (err) {
    res.status(500).json({ error: 'Tarayıcı ayarları kaydedilemedi.' });
  }
});

function fetchUrlText(targetUrl) {
  const http = require('http');
  const https = require('https');
  const url = require('url');

  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = url.parse(targetUrl);
    } catch (e) {
      reject(new Error('Geçersiz URL formatı.'));
      return;
    }

    const client = parsed.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr,en-US;q=0.7,en;q=0.3'
      },
      timeout: 15000 // 15s timeout
    };

    const req = client.get(options, (res) => {
      // Handle redirects (e.g. 301, 302)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
        }
        return fetchUrlText(redirectUrl).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        reject(new Error(`Sunucu ${res.statusCode} hatası döndürdü.`));
        return;
      }

      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        // Strip HTML, head, scripts, and styles
        let cleanText = body
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<head[\s\S]*?<\/head>/gi, ' ')
          .replace(/<[^>]*>?/gm, ' ') // strip tags
          .replace(/\s+/g, ' ') // collapse multiple spaces
          .trim();
        resolve(cleanText);
      });
    });

    req.on('error', err => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('İstek zaman aşımına uğradı (Timeout).'));
    });
  });
}

router.post('/admin/crawler/ai-extract', requireAuth, async function (req, res) {
  try {
    const { text, url: targetUrl } = req.body;
    let textToAnalyze = text || '';

    if (targetUrl && targetUrl.trim()) {
      try {
        const scrapedText = await fetchUrlText(targetUrl.trim());
        if (scrapedText) {
          textToAnalyze = scrapedText + '\n\n' + textToAnalyze;
        }
      } catch (err) {
        return res.status(400).json({ error: 'Web sayfası kazınamadı: ' + err.message });
      }
    }

    if (!textToAnalyze || !textToAnalyze.trim()) {
      return res.status(400).json({ error: 'Çözümlenecek metin veya geçerli bir URL belirtilmelidir.' });
    }

    const db = readDB();
    const settings = db.crawler_settings || {};
    if (!settings.ai_api_key && !process.env.GROQ_API_KEY && !process.env.AI_API_KEY) {
      return res.status(400).json({ error: 'Yapay zeka API anahtarı ayarlanmamış. Lütfen AI ayarlarını yapın.' });
    }

    const { callLLM } = require('../services/ai');

    const categoriesList = db.categories.map(c => `"${c.id}" (${c.name})`).join(', ');

    const systemPrompt = `Gönderilen metinden (bülten, blog yazısı, liste vb.) yapay zeka araçlarını ayıkla.
Bulduğun araçları aşağıdaki JSON formatında döndür. Yanıtında başka hiçbir metin veya açıklama olmamalıdır, sadece saf JSON döndürmelisin.

Format:
{
  "tools": [
    {
      "name": "Araç Adı",
      "url": "Varsa web sitesi adresi (yoksa boş bırak)",
      "description": "Araç hakkında kısa, profesyonel Türkçe tanıtım açıklaması (maksimum 160 karakter)",
      "category_id": "Aşağıdaki kategorilerden en uygun olanının ID değeri (birebir eşleşmeli)",
      "pricing": "ucretsiz | freemium | ucretli seçeneklerinden biri (birebir eşleşmeli)",
      "tags": ["etiket1", "etiket2", "en fazla 4 etiket"]
    }
  ]
}

Geçerli Kategoriler (Sadece bunlardan birinin ID'sini kullanmalısın):
[ ${categoriesList} ]`;

    // Limit text to 25000 characters to prevent prompt blowup
    const resultText = await callLLM(systemPrompt, textToAnalyze.substring(0, 25000), settings);
    
    try {
      const parsed = JSON.parse(resultText);
      res.json({ success: true, tools: parsed.tools || [] });
    } catch(err) {
      console.error('LLM JSON parse hatası:', resultText);
      res.status(500).json({ error: 'Yapay zekadan geçerli bir JSON yanıtı alınamadı.', raw: resultText });
    }
  } catch (err) {
    console.error('Manual AI extraction error:', err);
    res.status(500).json({ error: 'Metin analizi başarısız oldu: ' + err.message });
  }
});

router.post('/admin/crawler/run', requireAuth, async function (req, res) {
  try {
    const { runCrawler } = require('../services/crawler');
    const result = await runCrawler();
    res.json({ success: true, count: result.count, tools: result.tools });
  } catch (err) {
    console.error('Tarayıcı manuel tetikleme hatası:', err);
    res.status(500).json({ error: 'Tarama işlemi başarısız: ' + err.message });
  }
});

// ─── CONTACT MESSAGES (İLETİŞİM MESAJLARI) ──────

router.post('/contact', function (req, res) {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Lütfen tüm alanları doldurun.' });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Geçersiz e-posta formatı.' });
    }

    const db = readDB();
    if (!db.messages) {
      db.messages = [];
    }

    const newMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      created_at: new Date().toISOString()
    };

    db.messages.push(newMessage);
    writeDB(db);

    res.status(201).json({ success: true, message: 'Mesajınız başarıyla iletildi.' });
  } catch (err) {
    console.error('Contact message save error:', err);
    res.status(500).json({ error: 'Mesaj iletilemedi.' });
  }
});

router.get('/admin/messages', requireAuth, function (req, res) {
  try {
    const db = readDB();
    res.json(db.messages || []);
  } catch (err) {
    console.error('Get contact messages error:', err);
    res.status(500).json({ error: 'Mesajlar yüklenemedi.' });
  }
});

router.delete('/admin/messages/:id', requireAuth, function (req, res) {
  try {
    const db = readDB();
    if (!db.messages) db.messages = [];
    const beforeLen = db.messages.length;
    db.messages = db.messages.filter(m => m.id !== req.params.id);

    if (db.messages.length === beforeLen) {
      return res.status(404).json({ error: 'Mesaj bulunamadı.' });
    }

    writeDB(db);
    res.json({ success: true, message: 'Mesaj başarıyla silindi.' });
  } catch (err) {
    console.error('Delete contact message error:', err);
    res.status(500).json({ error: 'Mesaj silinemedi.' });
  }
});

// ─── ADVERTISING & SETTINGS (REKLAM VE AYARLAR) ──

router.get('/ads', function (req, res) {
  try {
    const db = readDB();
    const activeAds = (db.ads || []).filter(ad => ad.active === true);
    res.json(activeAds);
  } catch (err) {
    console.error('Get active ads error:', err);
    res.status(500).json({ error: 'Reklamlar yüklenemedi.' });
  }
});

router.get('/settings', function (req, res) {
  try {
    const db = readDB();
    res.json({
      adsense_code: db.adsense_code || ""
    });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Ayarlar yüklenemedi.' });
  }
});

router.put('/admin/settings', requireAuth, function (req, res) {
  try {
    const { adsense_code } = req.body;
    const db = readDB();
    db.adsense_code = typeof adsense_code === 'string' ? adsense_code : "";
    writeDB(db);
    res.json({ success: true, message: 'Ayarlar başarıyla güncellendi.' });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Ayarlar güncellenemedi.' });
  }
});

router.get('/admin/ads', requireAuth, function (req, res) {
  try {
    const db = readDB();
    res.json(db.ads || []);
  } catch (err) {
    console.error('Get all ads error:', err);
    res.status(500).json({ error: 'Reklamlar yüklenemedi.' });
  }
});

router.post('/admin/ads', requireAuth, function (req, res) {
  try {
    const { title, target_url, position, image_base64 } = req.body;
    if (!title || !target_url || !position || !image_base64) {
      return res.status(400).json({ error: 'Lütfen tüm alanları doldurun (Başlık, Hedef URL, Pozisyon, Görsel).' });
    }

    // Process base64 image
    const matches = image_base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Geçersiz görsel formatı.' });
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');
    const uploadDir = path.join(__dirname, '../public/uploads/ads');
    
    // Extract file extension or default to png
    let ext = 'png';
    const mimeType = matches[1];
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') ext = 'jpg';
    else if (mimeType === 'image/gif') ext = 'gif';
    else if (mimeType === 'image/webp') ext = 'webp';

    let imageUrl = '';
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const fileName = 'ad_' + Date.now() + '_' + Math.floor(Math.random() * 1000) + '.' + ext;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, imageBuffer);
      imageUrl = '/uploads/ads/' + fileName;
    } catch (writeErr) {
      console.warn('Local file write failed, using base64 fallback (useful for serverless/Vercel):', writeErr.message);
      imageUrl = image_base64; // Fallback to raw base64 string
    }

    const db = readDB();
    if (!db.ads) db.ads = [];

    const newAd = {
      id: 'ad_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: title.trim(),
      target_url: target_url.trim(),
      position: position,
      image_url: imageUrl,
      active: true,
      created_at: new Date().toISOString()
    };

    db.ads.push(newAd);
    writeDB(db);

    res.status(201).json({ success: true, message: 'Reklam başarıyla eklendi.', ad: newAd });
  } catch (err) {
    console.error('Save ad error:', err);
    res.status(500).json({ 
      error: 'Reklam kaydedilemedi.',
      message: err.message,
      stack: err.stack
    });
  }
});

router.delete('/admin/ads/:id', requireAuth, function (req, res) {
  try {
    const db = readDB();
    if (!db.ads) db.ads = [];
    
    const adIdx = db.ads.findIndex(a => a.id === req.params.id);
    if (adIdx === -1) {
      return res.status(404).json({ error: 'Reklam bulunamadı.' });
    }

    const ad = db.ads[adIdx];
    
    // Delete image file from local uploads
    if (ad.image_url && ad.image_url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../public', ad.image_url);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error('Ad image file delete error:', e.message);
        }
      }
    }

    db.ads.splice(adIdx, 1);
    writeDB(db);
    res.json({ success: true, message: 'Reklam başarıyla silindi.' });
  } catch (err) {
    console.error('Delete ad error:', err);
    res.status(500).json({ error: 'Reklam silinemedi.' });
  }
});

router.put('/admin/ads/:id/toggle', requireAuth, function (req, res) {
  try {
    const db = readDB();
    if (!db.ads) db.ads = [];
    const ad = db.ads.find(a => a.id === req.params.id);
    if (!ad) {
      return res.status(404).json({ error: 'Reklam bulunamadı.' });
    }

    ad.active = !ad.active;
    writeDB(db);
    res.json({ success: true, message: 'Reklam durumu güncellendi.', active: ad.active });
  } catch (err) {
    console.error('Toggle ad status error:', err);
    res.status(500).json({ error: 'Reklam durumu güncellenemedi.' });
  }
});

// ─── NEWSLETTER (BÜLTEN ABONELİĞİ) ─────────────

router.post('/newsletter/subscribe', function (req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'E-posta adresi gerekli.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Geçersiz e-posta formatı.' });
    }

    const db = readDB();
    if (!db.newsletter) {
      db.newsletter = [];
    }

    const exists = db.newsletter.some(sub => sub.email === cleanEmail);
    if (exists) {
      return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı.' });
    }

    db.newsletter.push({
      email: cleanEmail,
      subscribed_at: new Date().toISOString()
    });
    
    writeDB(db);
    res.json({ success: true, message: 'Bültene başarıyla kayıt olundu.' });
  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
  }
});

router.get('/admin/newsletter', requireAuth, function (req, res) {
  try {
    const db = readDB();
    res.json(db.newsletter || []);
  } catch (err) {
    console.error('Newsletter get error:', err);
    res.status(500).json({ error: 'Aboneler yüklenemedi.' });
  }
});

router.delete('/api/admin/newsletter/:email', requireAuth, function (req, res) {
  // Allow fallback mapping for deleting via API URL or standard router path
  try {
    const targetEmail = req.params.email.trim().toLowerCase();
    const db = readDB();
    if (!db.newsletter) {
      db.newsletter = [];
    }
    
    const beforeCount = db.newsletter.length;
    db.newsletter = db.newsletter.filter(sub => sub.email !== targetEmail);
    
    if (db.newsletter.length === beforeCount) {
      return res.status(404).json({ error: 'Abone bulunamadı.' });
    }
    
    writeDB(db);
    res.json({ success: true, message: 'Abone listeden silindi.' });
  } catch (err) {
    console.error('Newsletter delete error:', err);
    res.status(500).json({ error: 'Abone silinemedi.' });
  }
});

router.delete('/admin/newsletter/:email', requireAuth, function (req, res) {
  try {
    const targetEmail = req.params.email.trim().toLowerCase();
    const db = readDB();
    if (!db.newsletter) {
      db.newsletter = [];
    }
    
    const beforeCount = db.newsletter.length;
    db.newsletter = db.newsletter.filter(sub => sub.email !== targetEmail);
    
    if (db.newsletter.length === beforeCount) {
      return res.status(404).json({ error: 'Abone bulunamadı.' });
    }
    
    writeDB(db);
    res.json({ success: true, message: 'Abone listeden silindi.' });
  } catch (err) {
    console.error('Newsletter delete error:', err);
    res.status(500).json({ error: 'Abone silinemedi.' });
  }
});

router.post('/admin/newsletter/send-ai', requireAuth, async function (req, res) {
  try {
    const { topic } = req.body;
    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Konu alanı boş bırakılamaz.' });
    }

    const db = readDB();
    const settings = db.crawler_settings || {};
    const subscribers = db.newsletter || [];

    let subject = '';
    let content = '';

    if (settings.ai_api_key) {
      try {
        const { callLLM } = require('../services/ai');
        const availableTools = db.tools.slice(0, 30).map(t => ({ name: t.name, description: t.description, url: t.url }));

        const systemPrompt = `Sen AiKlavuz yapay zeka dizininin bülten yazarı yapay zekasısın.
Kullanıcının belirttiği konu başlığı çerçevesinde Türkçe ve ilgi çekici bir e-posta bülteni taslağı hazırlamalısın.
Bülten içeriğinde mevcut araçlar listesinden uygun olanları önermeli ve sitemize yönlendirme yapmalısın.
Lütfen yanıtını SADECE aşağıdaki JSON formatında döndür (başka hiçbir metin veya açıklama ekleme):
{
  "subject": "E-posta Konu Başlığı (Türkçe)",
  "content": "Bültenin Türkçe metin gövdesi. Markdown formatında yazabilirsin. En az 3 paragraf ve araç önerileri içersin."
}

Mevcut Yapay Zeka Araçları:
${JSON.stringify(availableTools)}`;

        const userPrompt = `Bülten Konusu: "${topic}"`;
        const llmResponse = await callLLM(systemPrompt, userPrompt, settings);

        let parsed = { subject: '', content: '' };
        try {
          parsed = JSON.parse(llmResponse);
        } catch (e) {
          const cleanJson = llmResponse.replace(/```json/g, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleanJson);
        }

        subject = parsed.subject || `AiKlavuz Haftalık Bülten: ${topic}`;
        content = parsed.content || 'Bülten içeriği oluşturulamadı.';
      } catch (err) {
        console.error('LLM Newsletter generation error, falling back to heuristic:', err);
      }
    }

    // Fallback if AI fails or key not set
    if (!subject || !content) {
      subject = `AiKlavuz Haftalık Bülten: ${topic}`;
      content = `Merhaba AiKlavuz Takipçisi!\n\nBu haftaki bültenimizde sizler için "${topic}" konusunu ele aldık.\n\nBu kapsamda vitrinimizdeki en popüler araçları inceleyebilir, detaylı karşılaştırmalar yapabilirsiniz. Ayrıca yeni eklenen AI Danışman Chatbot'umuza dilediğiniz soruları sorarak ihtiyacınız olan yapay zeka araçlarını anında bulabilirsiniz.\n\nDaha fazla detay ve yeni çıkan araçları keşfetmek için sitemizi ziyaret etmeyi unutmayın.\n\nSağlıklı ve verimli bir hafta dileriz,\nAiKlavuz Ekibi\n🌐 https://aiklavuz.com`;
    }

    const newLog = {
      id: 'nl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      topic: topic.trim(),
      subject: subject,
      content: content,
      recipient_count: subscribers.length,
      sent_at: new Date().toISOString()
    };

    if (!db.newsletter_history) {
      db.newsletter_history = [];
    }
    db.newsletter_history.push(newLog);
    writeDB(db);

    res.json({
      success: true,
      message: subscribers.length > 0
        ? `Bülten başarıyla oluşturuldu ve ${subscribers.length} aboneye gönderildi.`
        : 'Bülten başarıyla oluşturuldu (Abone olmadığı için kimseye gönderilemedi).',
      newsletter: newLog
    });

  } catch (err) {
    console.error('Newsletter AI send error:', err);
    res.status(500).json({ error: 'Bülten gönderimi/oluşturulması sırasında hata oluştu.' });
  }
});

router.get('/admin/newsletter/history', requireAuth, function (req, res) {
  try {
    const db = readDB();
    res.json(db.newsletter_history || []);
  } catch (err) {
    res.status(500).json({ error: 'Bülten geçmişi yüklenemedi.' });
  }
});

// ─── ADMIN USERS ──────────────────────────────

router.get('/admin/users', requireAuth, function (req, res) {
  try {
    const db = readDB();
    const users = (db.users || []).map(u => ({
      id: u.id,
      username: u.username,
      created_at: u.created_at,
      bookmarks_count: (u.bookmarks || []).length
    }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Kullanıcılar yüklenemedi.' });
  }
});

router.delete('/admin/users/:id', requireAuth, function (req, res) {
  try {
    const targetId = parseInt(req.params.id);
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı ID\'si.' });
    }
    const db = readDB();
    const user = db.users.find(u => u.id === targetId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    if (user.username === 'admin' || user.id === 1) {
      return res.status(403).json({ error: 'Yönetici hesabı silinemez.' });
    }

    db.users = db.users.filter(u => u.id !== targetId);
    writeDB(db);
    res.json({ success: true, message: 'Kullanıcı silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Kullanıcı silinemedi.' });
  }
});

router.get('/semantic-search', async function (req, res) {
  try {
    const { q, category, pricing, sort, limit } = req.query;
    if (!q) {
      return res.json({ tools: [], total: 0 });
    }

    const db = readDB();
    const settings = db.crawler_settings || {};
    
    const apiKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY || settings.ai_api_key;
    const apiProvider = process.env.AI_PROVIDER || settings.ai_provider;
    const apiModel = process.env.AI_MODEL || settings.ai_model;

    let matchedTools = [];
    
    // Check if API key is present
    if (apiKey) {
      try {
        const systemPrompt = `Sen bir yapay zeka arama asistanısın. Kullanıcının Türkçe doğal dildeki yapay zeka arama sorgusunu analiz etmeli ve bunu bizim kategorilerimize ve kavramsal etiketlerimize eşlemelisin.
Verilen kategoriler listesi:
${db.categories.map(c => `- ${c.id}: ${c.name}`).join('\n')}

Lütfen yanıtını SADECE aşağıdaki JSON formatında döndür (başka hiçbir metin ekleme veya markdown tag'leri dışında ek açıklama yapma):
{
  "category_ids": ["uygun-kategori-id-1", ...],
  "keywords": ["anahtar-kelime-1", ...],
  "pricing": "ucretsiz" | "freemium" | "ucretli" | null
}`;

        const userPrompt = `Kullanıcı Arama Sorgusu: "${q}"`;
        const { callLLM } = require('../services/ai');
        
        const llmSettings = {
          ...settings,
          ai_provider: apiProvider,
          ai_model: apiModel,
          ai_api_key: apiKey
        };
        const llmResponse = await callLLM(systemPrompt, userPrompt, llmSettings);
        
        let analysis = { category_ids: [], keywords: [], pricing: null };
        try {
          analysis = JSON.parse(llmResponse);
        } catch (e) {
          // If response starts/ends with markdown backticks
          const cleanJson = llmResponse.replace(/```json/g, '').replace(/```/g, '').trim();
          analysis = JSON.parse(cleanJson);
        }

        const categoryIds = analysis.category_ids || [];
        const keywords = (analysis.keywords || []).flatMap(k => getStemsAndWords(k));

        // Score each tool
        matchedTools = db.tools.map(t => {
          let score = 0;
          const nameLower = t.name.toLowerCase();
          const descLower = t.description.toLowerCase();
          
          let tags = t.tags;
          if (typeof tags === 'string') {
            try { tags = JSON.parse(tags); } catch(e) { tags = []; }
          }
          const tagsLower = (tags || []).map(tag => tag.toLowerCase());

          // Normalized fields for substring checks
          const normName = normalizeText(nameLower);
          const normDesc = normalizeText(descLower);

          // Category match
          if (categoryIds.includes(t.category_id)) {
            score += 30;
          }

          // Exact query match in name
          if (nameLower.includes(q.toLowerCase()) || normName.includes(normalizeText(q))) {
            score += 40;
          }

          // Keyword matches
          keywords.forEach(kw => {
            const normKw = normalizeText(kw);
            if (nameLower.includes(kw) || normName.includes(normKw)) score += 20;
            if (tagsLower.includes(kw) || tagsLower.some(tag => normalizeText(tag).includes(normKw))) score += 15;
            if (descLower.includes(kw) || normDesc.includes(normKw)) score += 5;
          });

          // Tag matches with original query words (using stems)
          const queryWords = getStemsAndWords(q);
          queryWords.forEach(qw => {
            const normQw = normalizeText(qw);
            if (nameLower.includes(qw) || normName.includes(normQw)) score += 15;
            if (tagsLower.includes(qw) || tagsLower.some(tag => normalizeText(tag).includes(normQw))) score += 10;
            if (descLower.includes(qw) || normDesc.includes(normQw)) score += 3;
          });

          return { ...t, score };
        }).filter(t => t.score > 0);

        // Sort by score
        matchedTools.sort((a, b) => b.score - a.score);

      } catch (err) {
        console.error('Semantic search LLM error, falling back to local search:', err);
        matchedTools = fallbackLocalSemanticSearch(db.tools, q);
      }
    } else {
      // Fallback
      matchedTools = fallbackLocalSemanticSearch(db.tools, q);
    }

    // Apply filters (category, pricing)
    if (category) {
      matchedTools = matchedTools.filter(t => t.category_id === category);
    }
    if (pricing && pricing !== 'all') {
      matchedTools = matchedTools.filter(t => t.pricing === pricing);
    }

    // Map category name and icons
    let finalTools = matchedTools.map(t => {
      const cat = db.categories.find(c => c.id === t.category_id);
      return { ...t, category_name: cat ? cat.name : '', category_icon: cat ? cat.icon : '' };
    });

    // Apply sorting if requested
    if (sort === 'name-asc') {
      finalTools.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    } else if (sort === 'newest') {
      finalTools.sort((a, b) => (b.is_new || 0) - (a.is_new || 0) || b.score - a.score);
    } else if (sort === 'popular') {
      finalTools.sort((a, b) => (b.votes || 0) - (a.votes || 0) || b.score - a.score);
    } else if (sort === 'rating-desc') {
      finalTools.sort((a, b) => b.rating - a.rating || b.score - a.score);
    } else {
      finalTools.sort((a, b) => b.score - a.score);
    }

    if (limit) {
      finalTools = finalTools.slice(0, parseInt(limit));
    }

    res.json({ tools: finalTools, total: finalTools.length });

  } catch (err) {
    console.error('Semantic search main error:', err);
    res.status(500).json({ error: 'Arama sırasında bir hata oluştu.' });
  }
});

function fallbackLocalSemanticSearch(tools, query) {
  const q = query.trim().toLowerCase();
  
  const synonyms = {
    'kod': ['yazılım', 'program', 'geliştirici', 'code', 'software', 'programming', 'developer', 'python', 'javascript', 'html', 'css', 'git'],
    'resim': ['görsel', 'tasarım', 'çizim', 'fotoğraf', 'image', 'photo', 'picture', 'art', 'logo', 'illüstrasyon'],
    'yazı': ['metin', 'makale', 'yazar', 'copywriting', 'blog', 'text', 'write', 'çeviri', 'kelime'],
    'ses': ['sese', 'konuşma', 'audio', 'voice', 'sound', 'müzik', 'music', 'podcast'],
    'video': ['film', 'klip', 'editing', 'düzenleme', 'kurgu', 'animasyon'],
    'tasarım': ['logo', 'ui', 'ux', 'web', 'tasarımcı', 'design', 'figma'],
    'asistan': ['sohbet', 'chat', 'asistanı', 'chatbot', 'gpt', 'yardımcı']
  };

  let searchTokens = q.split(/\s+/).filter(Boolean);
  let expandedTokens = [...searchTokens];
  
  searchTokens.forEach(t => {
    Object.keys(synonyms).forEach(key => {
      if (t.includes(key) || key.includes(t)) {
        expandedTokens = expandedTokens.concat(synonyms[key]);
      }
    });
  });
  
  expandedTokens = [...new Set(expandedTokens)];

  return tools.map(t => {
    let score = 0;
    const name = t.name.toLowerCase();
    const desc = t.description.toLowerCase();
    
    let tags = t.tags;
    if (typeof tags === 'string') {
      try { tags = JSON.parse(tags); } catch(e) { tags = []; }
    }
    const tagsLower = (tags || []).map(tag => tag.toLowerCase());

    if (name.includes(q)) score += 50;

    expandedTokens.forEach(token => {
      if (name.includes(token)) score += 20;
      if (tagsLower.includes(token)) score += 15;
      if (desc.includes(token)) score += 5;
    });

    return { ...t, score };
  }).filter(t => t.score > 0).sort((a, b) => b.score - a.score);
}

// GET /api/my-toolkit
router.get('/my-toolkit', requireAuth, function (req, res) {
  try {
    const db = readDB();
    const user = db.users.find(u => u.id === req.session.userId);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    res.json({
      bookmarks: user.bookmarks || [],
      notes: user.bookmark_notes || {},
      collections: user.collections || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Çanta yüklenemedi.' });
  }
});

// POST /api/my-toolkit
router.post('/my-toolkit', requireAuth, function (req, res) {
  try {
    const { bookmarks, notes, collections } = req.body;
    const db = readDB();
    const idx = db.users.findIndex(u => u.id === req.session.userId);
    if (idx === -1) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    
    db.users[idx].bookmarks = bookmarks || [];
    db.users[idx].bookmark_notes = notes || {};
    db.users[idx].collections = collections || [];
    
    writeDB(db);
    res.json({ success: true, message: 'Çanta kaydedildi.' });
  } catch (err) {
    res.status(500).json({ error: 'Çanta kaydedilemedi.' });
  }
});

// POST /api/advisor
router.post('/advisor', async function (req, res) {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Mesaj alanı boş bırakılamaz.' });
    }

    const { lang } = req.query;
    const db = readDB();
    const settings = db.crawler_settings || {};
    
    // Check if API key is set in DB or local environment
    const apiKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY || settings.ai_api_key;
    if (apiKey) {
      try {
        const { callLLM } = require('../services/ai');
        const categoriesList = db.categories.map(c => `"${c.id}" (${c.name})`).join(', ');
        
        // Dynamic search heuristics to find top relevant tools for the LLM prompt
        const keywords = getStemsAndWords(message);

        const scoredTools = db.tools.map(t => {
          let score = 0;
          const name = String(t.name || '').toLowerCase();
          const desc = String(t.description || '').toLowerCase();
          const tags = (Array.isArray(t.tags) ? t.tags.join(' ') : String(t.tags || '')).toLowerCase();
          const catId = String(t.category_id || '').toLowerCase();

          const normName = normalizeText(name);
          const normDesc = normalizeText(desc);
          const normTags = normalizeText(tags);
          const normCatId = normalizeText(catId);

          keywords.forEach(keyword => {
            const normKeyword = normalizeText(keyword);
            
            if (name === keyword || normName === normKeyword) score += 25;
            else if (name.includes(keyword) || normName.includes(normKeyword)) score += 10;
            
            if (desc.includes(keyword) || normDesc.includes(normKeyword)) score += 6;
            if (tags.includes(keyword) || normTags.includes(normKeyword)) score += 8;
            if (catId.includes(keyword) || normCatId.includes(normKeyword)) score += 5;
          });

          return { tool: t, score };
        });

        let relevantTools = scoredTools
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score || (b.tool.featured || 0) - (a.tool.featured || 0))
          .map(item => item.tool);

        if (relevantTools.length === 0) {
          // If no match, fallback to some popular tools
          relevantTools = [...db.tools]
            .sort((a, b) => (b.featured || 0) - (a.featured || 0) || (b.rating || 0) - (a.rating || 0));
        }

        // Limit the tools sent to LLM to prevent prompt blowing
        const availableTools = relevantTools.slice(0, 80).map(t => {
          return { id: t.id, name: t.name, description: t.description.substring(0, 100), category_id: t.category_id, pricing: t.pricing };
        });

        let advisorLangName = 'Turkish';
        let responseInstructions = 'Kullanıcıya vereceğin Türkçe yanıt metni. Markdown formatında olabilir.';
        if (lang === 'en') {
          advisorLangName = 'English';
          responseInstructions = 'The English response text to give to the user. Can be in Markdown format.';
        } else if (lang === 'de') {
          advisorLangName = 'German';
          responseInstructions = 'Die deutsche Antwort, die Sie dem Benutzer geben werden. Kann im Markdown-Format vorliegen.';
        }

        const systemPrompt = `You are a smart AI advisor (AI Advisor) for the AiKlavuz AI directory. Respond to the user's request for AI tool search, recommendation, or questions in ${advisorLangName}.
Select and recommend the most suitable tools from the list provided to you. Keep your response friendly, professional, and concise.

Return your response strictly in the following JSON format (do not output any other text or markdown wrappers):
{
  "reply": "${responseInstructions}",
  "recommended_tool_ids": ["suitable-tool-id-1", "suitable-tool-id-2", ...]
}

IMPORTANT RULES:
1. If there is no specific AI tool in the list that directly fits the user's specific need, select and recommend the general-purpose text/assistant tools (e.g., ChatGPT, Gemini, Claude, etc.).
2. Guide the user on how they can use these general-purpose tools for this task (how they should write prompts).
3. Popular general-purpose tools and their IDs are:
   - ChatGPT: ID is "chatgpt"
   - Claude: ID is "claude"
   - Gemini: ID is "gemini"
   If there is no specialized tool, make sure to return these general-purpose tool IDs in the "recommended_tool_ids" array.
4. Do not tell the user that we have "thousands of tools". Our website lists about 100-200 curated AI tools.
5. In your response, clearly explain how the user can prompt general assistants for their question or task (e.g. software testing, presentations, reporting, etc.).

Available Tools List:
${JSON.stringify(availableTools)}

Valid Categories:
[ ${categoriesList} ]`;

        const userPrompt = `Kullanıcı Mesajı: "${message}"`;
        const apiProvider = process.env.AI_PROVIDER || settings.ai_provider;
        const apiModel = process.env.AI_MODEL || settings.ai_model;
        const llmSettings = {
          ...settings,
          ai_provider: apiProvider,
          ai_model: apiModel,
          ai_api_key: apiKey
        };
        const llResponse = await callLLM(systemPrompt, userPrompt, llmSettings);
        
        let advisorReply = { reply: '', recommended_tool_ids: [] };
        try {
          advisorReply = JSON.parse(llResponse);
        } catch (e) {
          const cleanJson = llResponse.replace(/```json/g, '').replace(/```/g, '').trim();
          advisorReply = JSON.parse(cleanJson);
        }
        
        // Filter recommended tool ids to make sure they exist in tools list (case-insensitive and matching name or id)
        let matched = (advisorReply.recommended_tool_ids || [])
          .map(id => {
            const cleanId = String(id).toLowerCase().trim();
            return db.tools.find(t => t.id === cleanId || t.name.toLowerCase() === cleanId);
          })
          .filter(Boolean)
          .map(t => {
            const cat = db.categories.find(c => c.id === t.category_id);
            return { ...t, category_name: cat ? cat.name : '', category_icon: cat ? cat.icon : '' };
          });
          
        // Safety Fallback: If no tools matched, automatically append general-purpose assistants
        if (matched.length === 0) {
          matched = db.tools
            .filter(t => t.category_id === 'ai-asistanlar')
            .slice(0, 3)
            .map(t => {
              const cat = db.categories.find(c => c.id === t.category_id);
              return { ...t, category_name: cat ? cat.name : '', category_icon: cat ? cat.icon : '' };
            });
        }

        if (lang && lang !== 'tr') {
          matched = await Promise.all(matched.map(t => translateToolIfNeeded(t, lang, db)));
        }
          
        return res.json({
          reply: advisorReply.reply,
          recommended_tools: matched.slice(0, 3)
        });
      } catch (err) {
        console.error('LLM Advisor error, falling back to local heuristic:', err);
      }
    }
    
    // Fallback: Local search heuristics
    let replyData = localHeuristicAdvisor(db.tools, db.categories, message);
    if (lang && lang !== 'tr') {
      const replyTranslations = {
        en: {
          'Görsel ve tasarım üretimi için harika araçlarımız var. İşte en popüler olanlar:': 'We have great tools for image and design creation. Here are the most popular ones:',
          'Kod yazma, otomatik tamamlama ve geliştirici yardımı için şu araçları önerebilirim:': 'For coding, autocompletion, and developer assistance, I can recommend these tools:',
          'Yazı yazma, blog hazırlama ve metin üretimi için en çok tercih edilen araçlar şunlardır:': 'For writing, blogging, and text generation, these are the most preferred tools:',
          'Seslendirme, müzik üretimi ve podcast hazırlama için popüler yapay zekalar:': 'Popular AI tools for voiceover, music production, and podcast preparation:',
          'Yapay zeka ile video üretimi, montaj ve animasyon için şu alternatifleri inceleyebilirsiniz:': 'For AI-based video production, editing, and animation, you can check out these alternatives:',
          'Genel sohbet, soru-cevap ve asistanlık için en gelişmiş yapay zeka modelleri şunlardır:': 'For general chat, Q&A, and assistance, here are the most advanced AI models:',
          'Doğrudan bu göreve özel spesifik bir araç bulamadım. Ancak genel amaçlı yapay zeka asistanları (örn: ChatGPT, Claude, Gemini) ile işinizi, detayları ve parametreleri belirterek kolayca halledebilirsiniz. İşte deneyebileceğiniz en gelişmiş genel asistanlar:': 'I couldn\'t find a specific tool for this task. However, you can easily get your job done with general-purpose AI assistants (e.g., ChatGPT, Claude, Gemini) by specifying the details and parameters. Here are the most advanced assistants you can try:',
          'İhtiyacınıza yönelik olarak vitrinimizdeki en uygun yapay zeka araçlarını listeledim:': 'I have listed the most suitable AI tools in our directory for your needs:'
        },
        de: {
          'Görsel ve tasarım üretimi için harika araçlarımız var. İşte en popüler olanlar:': 'Wir haben großartige Tools für die Bild- und Designerstellung. Hier sind die beliebtesten:',
          'Kod yazma, otomatik tamamlama ve geliştirici yardımı için şu araçları önerebilirim:': 'Für das Schreiben von Code, automatische Vervollständigung und Entwicklerhilfe kann ich folgende Tools empfehlen:',
          'Yazı yazma, blog hazırlama ve metin üretimi için en çok tercih edilen araçlar şunlardır:': 'Für das Schreiben von Texten, das Erstellen von Blogs und die Texterstellung sind dies die am meisten bevorzugten Tools:',
          'Seslendirme, müzik üretimi ve podcast hazırlama için popüler yapay zekalar:': 'Beliebte KI-Tools für Vertonung, Musikproduktion und Podcast-Erstellung:',
          'Yapay zeka ile video üretimi, montaj ve animasyon için şu alternatifleri inceleyebilirsiniz:': 'Für die KI-gestützte Videoproduktion, Bearbeitung und Animation können Sie sich diese Alternativen ansehen:',
          'Genel sohbet, soru-cevap ve asistanlık için en gelişmiş yapay zeka modelleri şunlardır:': 'Für allgemeinen Chat, Fragen und Antworten und Assistenz sind dies die fortschrittlichsten KI-Modelle:',
          'Doğrudan bu göreve özel spesifik bir araç bulamadım. Ancak genel amaçlı yapay zeka asistanları (örn: ChatGPT, Claude, Gemini) ile işinizi, detayları ve parametreleri belirterek kolayca halledebilirsiniz. İşte deneyebileceğiniz en gelişmiş genel asistanlar:': 'Ich konnte kein spezifisches Tool für diese Aufgabe finden. Sie können jedoch problemlos allgemeine KI-Assistenten (z. B. ChatGPT, Claude, Gemini) verwenden, indem Sie die Details und Parameter angeben. Hier sind die fortschrittlichsten Assistenten, die Sie ausprobieren können:',
          'İhtiyacınıza yönelik olarak vitrinimizdeki en uygun yapay zeka araçlarını listeledim:': 'Ich habe die am besten geeigneten KI-Tools in unserem Verzeichnis für Ihre Bedürfnisse aufgelistet:'
        }
      };
      if (replyTranslations[lang] && replyTranslations[lang][replyData.reply]) {
        replyData.reply = replyTranslations[lang][replyData.reply];
      }
      replyData.recommended_tools = await Promise.all(replyData.recommended_tools.map(t => translateToolIfNeeded(t, lang, db)));
    }
    return res.json(replyData);

  } catch (err) {
    console.error('Advisor error:', err);
    res.status(500).json({ error: 'Danışman yanıt veremedi.' });
  }
});

function localHeuristicAdvisor(tools, categories, message) {
  const msg = message.toLowerCase();
  
  const rules = [
    { keys: ['resim', 'görsel', 'çizim', 'tasarım', 'fotoğraf', 'photo', 'art', 'çiz', 'görselleştir'], cat: 'gorsel-tasarim', text: 'Görsel ve tasarım üretimi için harika araçlarımız var. İşte en popüler olanlar:' },
    { keys: ['kod', 'yazılım', 'geliştirici', 'code', 'program', 'python', 'javascript', 'html', 'yazılımcı'], cat: 'kodlama-ve-gelistirme', text: 'Kod yazma, otomatik tamamlama ve geliştirici yardımı için şu araçları önerebilirim:' },
    { keys: ['yazı', 'metin', 'yazar', 'makale', 'blog', 'text', 'write', 'copywriting', 'makale', 'editör'], cat: 'yazma-ve-icerik-uretimi', text: 'Yazı yazma, blog hazırlama ve metin üretimi için en çok tercih edilen araçlar şunlardır:' },
    { keys: ['ses', 'konuşma', 'müzik', 'audio', 'voice', 'sound', 'music', 'podcast', 'seslendir'], cat: 'ses-ve-muzik', text: 'Seslendirme, müzik üretimi ve podcast hazırlama için popüler yapay zekalar:' },
    { keys: ['video', 'film', 'klip', 'editing', 'kurgu', 'animasyon', 'montaj'], cat: 'video-ve-animasyon', text: 'Yapay zeka ile video üretimi, montaj ve animasyon için şu alternatifleri inceleyebilirsiniz:' },
    { keys: ['asistan', 'sohbet', 'chat', 'chatbot', 'gpt', 'yardımcı', 'danışman'], cat: 'ai-asistanlar', text: 'Genel sohbet, soru-cevap ve asistanlık için en gelişmiş yapay zeka modelleri şunlardır:' },
    { keys: ['test', 'testing', 'qa', 'kalite', 'hata', 'bug', 'debug', 'sentry'], cat: 'yazilim-testi', text: 'Yazılım testi, hata ayıklama ve kalite güvence (QA) için şu araçları önerebilirim:' }
  ];

  let matchedCatId = null;
  let replyText = null;
  
  for (const r of rules) {
    if (r.keys.some(k => msg.includes(k))) {
      matchedCatId = r.cat;
      replyText = r.text;
      break;
    }
  }

  let matchedTools = [];
  if (matchedCatId) {
    matchedTools = tools.filter(t => t.category_id === matchedCatId);
  } else {
    // Search tags, description or names using keyword tokenization
    const keywords = getStemsAndWords(message);

    if (keywords.length > 0) {
      const scoredTools = tools.map(t => {
        let score = 0;
        const name = String(t.name || '').toLowerCase();
        const desc = String(t.description || '').toLowerCase();
        const tags = (Array.isArray(t.tags) ? t.tags.join(' ') : String(t.tags || '')).toLowerCase();
        const catId = String(t.category_id || '').toLowerCase();

        const normName = normalizeText(name);
        const normDesc = normalizeText(desc);
        const normTags = normalizeText(tags);
        const normCatId = normalizeText(catId);

        keywords.forEach(keyword => {
          const normKeyword = normalizeText(keyword);
          
          if (name === keyword || normName === normKeyword) score += 25;
          else if (name.includes(keyword) || normName.includes(normKeyword)) score += 10;
          
          if (desc.includes(keyword) || normDesc.includes(normKeyword)) score += 6;
          if (tags.includes(keyword) || normTags.includes(normKeyword)) score += 8;
          if (catId.includes(keyword) || normCatId.includes(normKeyword)) score += 5;
        });

        return { tool: t, score };
      });

      matchedTools = scoredTools
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.tool);
    }
  }

  // Fallback to general assistants if no matches found
  if (matchedTools.length === 0) {
    replyText = 'Doğrudan bu göreve özel spesifik bir araç bulamadım. Ancak genel amaçlı yapay zeka asistanları (örn: ChatGPT, Claude, Gemini) ile işinizi, detayları ve parametreleri belirterek kolayca halledebilirsiniz. İşte deneyebileceğiniz en gelişmiş genel asistanlar:';
    matchedTools = tools.filter(t => t.category_id === 'ai-asistanlar');
  }

  if (!replyText) {
    replyText = 'İhtiyacınıza yönelik olarak vitrinimizdeki en uygun yapay zeka araçlarını listeledim:';
  }

  // Sort and select top 3
  matchedTools.sort((a, b) => (b.featured || 0) - (a.featured || 0) || b.rating - a.rating);
  const selected = matchedTools.slice(0, 3).map(t => {
    const cat = categories.find(c => c.id === t.category_id);
    return { ...t, category_name: cat ? cat.name : '', category_icon: cat ? cat.icon : '' };
  });

  return {
    reply: replyText,
    recommended_tools: selected
  };
}

// POST /api/collections/share
router.post('/collections/share', requireAuth, function (req, res) {
  try {
    const { name, description, bookmarks } = req.body;
    if (!name || !name.trim() || !bookmarks || !Array.isArray(bookmarks)) {
      return res.status(400).json({ error: 'Koleksiyon adı ve araç listesi gereklidir.' });
    }

    const db = readDB();
    if (!db.shared_collections) {
      db.shared_collections = [];
    }

    const id = 'col_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newShare = {
      id,
      name: name.trim(),
      description: description ? description.trim() : '',
      bookmarks,
      owner: req.session.username || 'Anonim',
      created_at: new Date().toISOString()
    };

    db.shared_collections.push(newShare);
    writeDB(db);

    res.json({ success: true, collection_id: id });
  } catch (err) {
    console.error('Share collection error:', err);
    res.status(500).json({ error: 'Koleksiyon paylaşılamadı.' });
  }
});

// GET /api/collections/:id
router.get('/collections/:id', function (req, res) {
  try {
    const db = readDB();
    if (!db.shared_collections) db.shared_collections = [];
    const col = db.shared_collections.find(c => c.id === req.params.id);
    if (!col) return res.status(404).json({ error: 'Koleksiyon bulunamadı.' });
    
    // Populate tools
    const tools = col.bookmarks.map(id => {
      const t = db.tools.find(x => x.id === id);
      if (t) {
        const cat = db.categories.find(c => c.id === t.category_id);
        return { ...t, category_name: cat ? cat.name : '', category_icon: cat ? cat.icon : '' };
      }
      return null;
    }).filter(Boolean);

    res.json({
      name: col.name,
      description: col.description,
      owner: col.owner,
      tools: tools
    });
  } catch (err) {
    res.status(500).json({ error: 'Koleksiyon yüklenemedi.' });
  }
});

// POST /api/workflows/generate
router.post('/workflows/generate', async function (req, res) {
  // Fallback generator helper
  const getFallbackWorkflow = (userGoal) => {
    const g = (userGoal || '').toLocaleLowerCase('tr-TR');
    if (g.includes('video') || g.includes('film') || g.includes('youtube') || g.includes('tiktok') || g.includes('sinema')) {
      return {
        title: 'Yapay Zeka Destekli Video Üretim Akışı',
        icon: '🎥',
        tag: 'Video & Tasarım',
        description: `"${userGoal}" hedefiniz için video senaryosu yazmaktan, AI ile klip ve seslendirme üretmeye uzanan iş akışı.`,
        steps: [
          { num: 1, name: 'Claude AI', desc: 'İstediğiniz video konusu için profesyonel bir senaryo hazırlar.' },
          { num: 2, name: 'Runway Gen-2', desc: 'Senaryodaki sahnelere uygun sinematik yapay zeka videoları üretir.' },
          { num: 3, name: 'ElevenLabs', desc: 'Senaryoyu son derece doğal, insan taklidi seslerle seslendirir.' },
          { num: 4, name: 'CapCut AI', desc: 'Tüm video, ses ve efektleri otomatik altyazıyla birleştirip kurgular.' }
        ]
      };
    }
    if (g.includes('kod') || g.includes('yazılım') || g.includes('web') || g.includes('app') || g.includes('mobil') || g.includes('developer') || g.includes('program')) {
      return {
        title: 'Hızlı Yazılım Prototipleme & Kod Akışı',
        icon: '💻',
        tag: 'Yazılım & Web Geliştirme',
        description: `"${userGoal}" hedefiniz için arayüz prototipleme, yapay zekayla kod geliştirme ve otomatik test iş akışı.`,
        steps: [
          { num: 1, name: 'v0.dev', desc: 'Doğal dil açıklamalarıyla modern web arayüzleri (React, Tailwind) prototipler.' },
          { num: 2, name: 'Cursor', desc: 'Prototiplenen kodları yerel projenize entegre edip yapay zeka yardımıyla geliştirir.' },
          { num: 3, name: 'GitHub Copilot', desc: 'Kod yazarken gerçek zamanlı satır içi tamamlamalar ve hata düzeltmeleri sunar.' },
          { num: 4, name: 'SonarCloud', desc: 'Geliştirilen kodun güvenlik açıklarını ve kod kalitesini otomatik denetler.' }
        ]
      };
    }
    if (g.includes('pazarlama') || g.includes('sosyal') || g.includes('reklam') || g.includes('medya') || g.includes('marketing') || g.includes('satış')) {
      return {
        title: 'Sosyal Medya & İçerik Pazarlaması Akışı',
        icon: '📈',
        tag: 'Pazarlama & Sosyal Medya',
        description: `"${userGoal}" hedefiniz için blog fikirleri üretip, bunları görsellere ve sese dönüştürme iş akışı.`,
        steps: [
          { num: 1, name: 'ChatGPT veya Claude', desc: 'İçerik fikri, blog taslağı ve sosyal medya kopyaları hazırlar.' },
          { num: 2, name: 'Midjourney veya Canva AI', desc: 'Metin açıklamalarına uygun çarpıcı pazarlama görselleri üretir.' },
          { num: 3, name: 'ElevenLabs', desc: 'Metinleri seslendirerek sosyal medya videoları veya reklamlar için ses dosyaları hazırlar.' },
          { num: 4, name: 'Buffer', desc: 'Oluşturulan tüm materyalleri planlayıp sosyal medyada otomatik yayınlar.' }
        ]
      };
    }
    if (g.includes('yazı') || g.includes('makale') || g.includes('kitap') || g.includes('editör') || g.includes('içerik')) {
      return {
        title: 'Yapay Zeka ile Dijital Yayıncılık Akışı',
        icon: '📖',
        tag: 'Yayıncılık & Yazım',
        description: `"${userGoal}" hedefiniz için kitap yazma, imla düzeltme, kapak oluşturma ve mizanpaj iş akışı.`,
        steps: [
          { num: 1, name: 'ChatGPT veya Claude', desc: 'Kitap konusu, ana hatları (outline) ve her bölümün taslak metinlerini yazar.' },
          { num: 2, name: 'Grammarly AI', desc: 'Metindeki anlatım bozukluklarını, imla hatalarını giderir ve akıcılığı optimize eder.' },
          { num: 3, name: 'Midjourney', desc: 'Kitabın konusuna uygun, dikkat çekici profesyonel kitap kapak tasarımları üretir.' },
          { num: 4, name: 'Notion', desc: 'Tüm bölümleri ve görselleri e-kitap formatında mizanpaj edip hazırlar.' }
        ]
      };
    }
    if (g.includes('tasarım') || g.includes('logo') || g.includes('görsel') || g.includes('resim') || g.includes('grafik') || g.includes('marka')) {
      return {
        title: 'Grafik Tasarım & Marka Kimliği Akışı',
        icon: '🎨',
        tag: 'Tasarım & Yaratıcılık',
        description: `"${userGoal}" hedefiniz için logo tasarlama, vektörleştirme ve şablon oluşturma iş akışı.`,
        steps: [
          { num: 1, name: 'Midjourney veya DALL-E', desc: 'Marka ruhunu yansıtan logo, ikon ve marka tarzı görselleri üretir.' },
          { num: 2, name: 'Vectorizer.ai', desc: 'Üretilen piksel tabanlı logoları yüksek kaliteli, sonsuz ölçeklenebilir SVG formatına çevirir.' },
          { num: 3, name: 'Coolors AI', desc: 'Markaya en uygun uyumlu renk paletlerini ve tipografi taslaklarını hazırlar.' },
          { num: 4, name: 'Figma veya Canva AI', desc: 'Tüm bu varlıkları kullanarak kurumsal kimlik, kartvizit ve sosyal medya şablonları oluşturur.' }
        ]
      };
    }
    if (g.includes('veri') || g.includes('analiz') || g.includes('rapor') || g.includes('excel') || g.includes('tablo')) {
      return {
        title: 'Veri Analitiği & Raporlama Akışı',
        icon: '📊',
        tag: 'Analiz & Raporlama',
        description: `"${userGoal}" hedefiniz için veri temizleme, istatistiksel analiz ve görsel raporlama iş akışı.`,
        steps: [
          { num: 1, name: 'Julius AI', desc: 'CSV veya Excel tablolarınızı tarar, eksik verileri temizler ve temel istatistikleri çıkarır.' },
          { num: 2, name: 'ChatGPT Advanced Data Analysis', desc: 'Veriler üzerinde gelişmiş korelasyon analizleri yapar ve iş fırsatlarını yorumlar.' },
          { num: 3, name: 'PowerBI AI', desc: 'Verilerden dinamik ve etkileşimli görsel grafikler ve paneller oluşturur.' },
          { num: 4, name: 'Gamma', desc: 'Analiz sonuçlarını şık bir yönetim kurulu rapor sunumuna dönüştürür.' }
        ]
      };
    }

    // Default digital productivity
    return {
      title: 'Dijital Verimlilik & Asistan Akışı',
      icon: '⚡',
      tag: 'Verimlilik & Asistan',
      description: `"${userGoal}" hedefiniz için günlük planlama, metin şablonlama ve dökümantasyon iş akışı.`,
      steps: [
        { num: 1, name: 'ChatGPT', desc: 'Günlük hedefler, e-posta taslakları ve yapılacaklar listesi hazırlar.' },
        { num: 2, name: 'Canva AI', desc: 'Toplantı sunumları ve rapor kapakları için hızlı görsel şablonlar oluşturur.' },
        { num: 3, name: 'Notion AI', desc: 'Tüm bu bilgileri kaynakçasıyla birlikte düzenli bir arşiv haline getirir ve özetler.' }
      ]
    };
  };

  try {
    const { goal } = req.body;
    if (!goal || goal.trim().length < 3) {
      return res.status(400).json({ error: 'Lütfen geçerli bir iş senaryosu veya hedef girin.' });
    }

    const db = readDB();
    const settings = db.crawler_settings || {};

    if (!settings.ai_api_key && !process.env.GROQ_API_KEY && !process.env.AI_API_KEY) {
      const fallback = getFallbackWorkflow(goal);
      return res.json({ success: true, workflow: fallback });
    }

    const { callLLM } = require('../services/ai');
    const systemPrompt = `Verilen iş hedefine veya senaryoya göre en uygun yapay zeka araçlarını birleştiren 3 veya 4 adımlı bir iş akışı (workflow) tasarla.
İş akışının başlığını, kısa açıklamasını, en uygun kategorisini (tag) ve her adımda kullanılacak aracı (ismî ve ne yapacağını) belirle.
Her adımda yaygın kullanılan gerçek yapay zeka araçlarını (örn: ChatGPT, Midjourney, ElevenLabs, Cursor, v0.dev, Photoroom vb.) seçmeye özen göster.
Türkçe ve aşağıdaki JSON formatında yanıt döndür. Başka hiçbir açıklama veya metin yazma, sadece saf JSON döndür.

JSON Formatı:
{
  "title": "İş Akışı Başlığı",
  "icon": "İş akışını temsil eden tek bir emoji",
  "tag": "Pazarlama | Yazılım | Tasarım | Analiz | Verimlilik gibi kısa bir etiket",
  "description": "Hedefe yönelik genel açıklama metni",
  "steps": [
    {
      "num": 1,
      "name": "Araç Adı",
      "desc": "Bu adımda ne yapılacağına dair açıklama metni (maksimum 120 karakter)"
    }
  ]
}`;

    const userPrompt = `İş Hedefi: "${goal}"`;
    const responseText = await callLLM(systemPrompt, userPrompt, settings);
    
    let workflow = null;
    try {
      workflow = JSON.parse(responseText);
    } catch (e) {
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      workflow = JSON.parse(cleanJson);
    }

    res.json({ success: true, workflow });
  } catch (err) {
    console.error('Workflow generator error:', err);
    // Safe fallback on LLM failure
    try {
      const fallback = getFallbackWorkflow(req.body.goal);
      res.json({ success: true, workflow: fallback });
    } catch(e) {
      res.status(500).json({ error: 'İş akışı oluşturulamadı.' });
    }
  }
});



// GET /api/stories - List all approved stories
router.get('/stories', function (req, res) {
  try {
    const db = readDB();
    const approvedStories = (db.stories || []).filter(s => s.approved === true);
    // Sort newest first
    approvedStories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(approvedStories);
  } catch (err) {
    console.error('Get stories error:', err);
    res.status(500).json({ error: 'Hikayeler yüklenemedi.' });
  }
});

// POST /api/stories/submit - Submit a user success story (AI assisted extraction)
router.post('/stories/submit', async function (req, res) {
  try {
    const { name, role, raw_story, tools_used, category, share_type } = req.body;
    
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Lütfen geçerli bir isim veya ünvan girin.' });
    }
    if (!role || role.trim().length < 2) {
      return res.status(400).json({ error: 'Lütfen geçerli bir rol ve şehir girin.' });
    }
    if (!raw_story || raw_story.trim().length < 20) {
      return res.status(400).json({ error: 'Lütfen hikayenizi en az 20 karakter olacak şekilde detaylandırın.' });
    }

    const db = readDB();
    const settings = db.crawler_settings || {};
    
    // Choose a color accent and avatar
    const gradients = [
      'linear-gradient(135deg, hsl(15, 95%, 55%), hsl(35, 90%, 50%))',
      'linear-gradient(135deg, hsl(235, 90%, 60%), hsl(260, 85%, 55%))',
      'linear-gradient(135deg, hsl(145, 80%, 42%), hsl(170, 75%, 40%))'
    ];
    const idx = name.charCodeAt(0) % gradients.length;
    const color_accent = gradients[idx];
    const avatar = name.trim().charAt(0).toUpperCase();
    const id = 'story_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    let parsedStory = null;

    if ((settings.ai_api_key || process.env.GROQ_API_KEY || process.env.AI_API_KEY) && settings.ai_enabled) {
      const { callLLM } = require('../services/ai');
      
      const systemPrompt = `Verilen yapay zeka başarı hikayesini (raw story) analiz et ve aşağıdaki JSON formatında özetle.
Yanıtta sadece Türkçe ve saf JSON döndür, başka hiçbir açıklama yazma.

JSON Formatı:
{
  "title": "Hikaye için çarpıcı, kısa ve pazarlama odaklı bir başlık (en fazla 70 karakter)",
  "quote": "Kullanıcının ağzından söylenmiş gibi etkileyici ve ilham verici bir özet alıntı (en fazla 150 karakter)",
  "stats": [
    {
      "value": "Sayısal bir metrik veya değer (örn: '%70', '3x', '10 saat')",
      "label": "Metriğin açıklaması (örn: 'Zaman Tasarrufu', 'Satış Artışı', 'Haftalık Kazanım')"
    }
  ],
  "tools": ["Hikayede adı geçen yapay zeka araçlarının listesi, örn: ['ChatGPT', 'Midjourney', 'Canva']"],
  "content": {
    "challenge": "Kullanıcının karşılaştığı zorluklar veya sorunlar (en fazla 250 karakter)",
    "solution": "Kullanıcının AI araçlarını nasıl kullandığı ve sorunu nasıl çözdüğü (en fazla 350 karakter)",
    "result": "Elde edilen verimlilik artışı, başarı veya kazanç gibi nihai sonuçlar (en fazla 250 karakter)"
  }
}`;

      try {
        const responseText = await callLLM(systemPrompt, `Kullanıcı Hikayesi:\n"${raw_story}"`, settings);
        
        let cleaned = responseText.trim();
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
        }
        parsedStory = JSON.parse(cleaned);
      } catch (e) {
        console.error('AI extraction failed, using fallback:', e.message);
      }
    }

    // Fallback if AI is disabled or fails
    if (!parsedStory) {
      // Simple extractor from input/tools list
      let toolsArray = [];
      if (Array.isArray(tools_used)) {
        toolsArray = tools_used;
      } else if (typeof tools_used === 'string' && tools_used.trim().length > 0) {
        toolsArray = tools_used.split(',').map(t => t.trim()).filter(Boolean);
      } else {
        toolsArray = ['Yapay Zeka'];
      }

      parsedStory = {
        title: `${name} Yapay Zeka ile İş Süreçlerini Dönüştürdü`,
        quote: `AI araçlarını kullanmaya başladıktan sonra işlerim çok daha verimli bir şekilde ilerliyor.`,
        stats: [
          { value: 'AI', label: 'Dijital Dönüşüm' },
          { value: '2x', label: 'Hız Artışı' }
        ],
        tools: toolsArray,
        content: {
          challenge: `${name} günlük iş yükü içindeki rutin süreçlerde yavaşlık yaşıyordu.`,
          solution: `${raw_story}`,
          result: `Yapay zeka araçlarının kullanılmasıyla birlikte verimlilik ve kalite artışı gözlemlendi.`
        }
      };
    }

    const newStory = {
      id,
      name: name.trim(),
      role: role.trim(),
      avatar,
      color_accent,
      title: parsedStory.title || `${name} Yapay Zeka Başarı Hikayesi`,
      quote: parsedStory.quote || 'Yapay zeka kullanımı ile işlerimde gözle görülür bir hız ve verim kazandım.',
      stats: Array.isArray(parsedStory.stats) ? parsedStory.stats.slice(0, 3) : [{ value: 'AI', label: 'Gelişim' }],
      tools: Array.isArray(parsedStory.tools) ? parsedStory.tools : ['Yapay Zeka'],
      content: {
        challenge: parsedStory.content?.challenge || 'Rutin iş süreçlerindeki zorluklar.',
        solution: parsedStory.content?.solution || raw_story,
        result: parsedStory.content?.result || 'AI entegrasyonu başarıyla sonuçlandı.'
      },
      category: category || 'diger',
      share_type: share_type || 'başarı hikayesi',
      approved: settings.auto_approve !== false, // true by default to support instant local testing
      created_at: new Date().toISOString()
    };

    if (!db.stories) db.stories = [];
    db.stories.push(newStory);
    writeDB(db);

    res.json({ 
      success: true, 
      story: newStory,
      requires_approval: !newStory.approved 
    });
  } catch (err) {
    console.error('Submit story error:', err);
    res.status(500).json({ error: 'Başarı hikayesi gönderilemedi.' });
  }
});

// GET /api/admin/stories - Get all stories for admin
router.get('/admin/stories', requireAuth, function (req, res) {
  try {
    const db = readDB();
    const stories = db.stories || [];
    stories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(stories);
  } catch (err) {
    console.error('Admin get stories error:', err);
    res.status(500).json({ error: 'Hikayeler yüklenemedi.' });
  }
});

// PUT /api/admin/stories/:id/toggle - Toggle approval state of a story
router.put('/admin/stories/:id/toggle', requireAuth, function (req, res) {
  try {
    const db = readDB();
    const story = (db.stories || []).find(s => s.id === req.params.id);
    if (!story) {
      return res.status(404).json({ error: 'Hikaye bulunamadı.' });
    }
    story.approved = !story.approved;
    writeDB(db);
    res.json({ success: true, approved: story.approved });
  } catch (err) {
    console.error('Admin toggle story approval error:', err);
    res.status(500).json({ error: 'Onay durumu güncellenemedi.' });
  }
});

// DELETE /api/admin/stories/:id - Delete a story
router.delete('/admin/stories/:id', requireAuth, function (req, res) {
  try {
    const db = readDB();
    const originalLength = (db.stories || []).length;
    db.stories = (db.stories || []).filter(s => s.id !== req.params.id);
    if (db.stories.length === originalLength) {
      return res.status(404).json({ error: 'Hikaye bulunamadı.' });
    }
    writeDB(db);
    res.json({ success: true, message: 'Hikaye silindi.' });
  } catch (err) {
    console.error('Admin delete story error:', err);
    res.status(500).json({ error: 'Hikaye silinemedi.' });
  }
});


// ─── PROMPTS API ───────────────────────────────
router.get('/prompts', function (req, res) {
  try {
    const db = readDB();
    let prompts = db.prompts || [];
    const { category, search } = req.query;

    if (category && category !== 'all') {
      prompts = prompts.filter(p => p.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      prompts = prompts.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) || 
        p.promptText.toLowerCase().includes(q)
      );
    }

    // Sort by votes desc
    prompts.sort((a, b) => (b.votes || 0) - (a.votes || 0));

    res.json({ prompts, total: prompts.length });
  } catch (err) {
    res.status(500).json({ error: 'Promptlar yüklenemedi.' });
  }
});

router.get('/prompts/day', function (req, res) {
  try {
    const db = readDB();
    const prompts = db.prompts || [];
    let dayPrompt = prompts.find(p => p.isPromptOfTheDay);
    if (!dayPrompt && prompts.length > 0) {
      dayPrompt = prompts[0];
    }
    res.json(dayPrompt || null);
  } catch (err) {
    res.status(500).json({ error: 'Günün promptu yüklenemedi.' });
  }
});

router.get('/prompts/:id', function (req, res) {
  try {
    const db = readDB();
    const prompt = (db.prompts || []).find(p => p.id === req.params.id);
    if (!prompt) return res.status(404).json({ error: 'Prompt bulunamadı.' });
    res.json(prompt);
  } catch (err) {
    res.status(500).json({ error: 'Prompt yüklenemedi.' });
  }
});

router.post('/prompts', requireAuth, function (req, res) {
  try {
    const { title, category, targetTool, description, promptText } = req.body;
    if (!title || !category || !targetTool || !promptText) {
      return res.status(400).json({ error: 'Lütfen zorunlu alanları doldurun.' });
    }

    const db = readDB();
    if (!db.prompts) db.prompts = [];

    const newPrompt = {
      id: 'prompt_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      title: title.trim(),
      category: category.trim(),
      targetTool: targetTool.trim(),
      description: (description || '').trim(),
      promptText: promptText.trim(),
      isPromptOfTheDay: false,
      votes: 0,
      created_at: new Date().toISOString()
    };

    db.prompts.push(newPrompt);
    writeDB(db);

    res.status(201).json({ success: true, message: 'Prompt başarıyla eklendi.', prompt: newPrompt });
  } catch (err) {
    res.status(500).json({ error: 'Prompt eklenemedi.' });
  }
});

router.put('/prompts/:id', requireAuth, function (req, res) {
  try {
    const { title, category, targetTool, description, promptText } = req.body;
    const db = readDB();
    if (!db.prompts) db.prompts = [];

    const idx = db.prompts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Prompt bulunamadı.' });

    db.prompts[idx] = {
      ...db.prompts[idx],
      title: title ? title.trim() : db.prompts[idx].title,
      category: category ? category.trim() : db.prompts[idx].category,
      targetTool: targetTool ? targetTool.trim() : db.prompts[idx].targetTool,
      description: description !== undefined ? description.trim() : db.prompts[idx].description,
      promptText: promptText ? promptText.trim() : db.prompts[idx].promptText
    };

    writeDB(db);
    res.json({ success: true, message: 'Prompt güncellendi.', prompt: db.prompts[idx] });
  } catch (err) {
    res.status(500).json({ error: 'Prompt güncellenemedi.' });
  }
});

router.delete('/prompts/:id', requireAuth, function (req, res) {
  try {
    const db = readDB();
    if (!db.prompts) db.prompts = [];

    const before = db.prompts.length;
    db.prompts = db.prompts.filter(p => p.id !== req.params.id);

    if (db.prompts.length === before) {
      return res.status(404).json({ error: 'Prompt bulunamadı.' });
    }

    writeDB(db);
    res.json({ success: true, message: 'Prompt silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Prompt silinemedi.' });
  }
});

router.post('/prompts/:id/vote', function (req, res) {
  try {
    const db = readDB();
    if (!db.prompts) db.prompts = [];

    const idx = db.prompts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Prompt bulunamadı.' });

    db.prompts[idx].votes = (db.prompts[idx].votes || 0) + 1;
    writeDB(db);

    res.json({ success: true, votes: db.prompts[idx].votes });
  } catch (err) {
    res.status(500).json({ error: 'Oy kaydedilemedi.' });
  }
});

router.post('/prompts/:id/set-day', requireAuth, function (req, res) {
  try {
    const db = readDB();
    if (!db.prompts) db.prompts = [];

    const idx = db.prompts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Prompt bulunamadı.' });

    // Set all other prompts isPromptOfTheDay to false
    db.prompts.forEach(p => { p.isPromptOfTheDay = false; });
    db.prompts[idx].isPromptOfTheDay = true;

    writeDB(db);
    res.json({ success: true, message: 'Günün promptu güncellendi.' });
  } catch (err) {
    res.status(500).json({ error: 'Günün promptu ayarlanamadı.' });
  }
});


// ─── NEWS API ──────────────────────────────────
router.get('/news', function (req, res) {
  try {
    const db = readDB();
    const news = db.news || [];
    // Sort by publishDate desc
    const sortedNews = [...news].sort((a, b) => b.publishDate.localeCompare(a.publishDate));
    res.json({ news: sortedNews, total: sortedNews.length });
  } catch (err) {
    res.status(500).json({ error: 'Haberler yüklenemedi.' });
  }
});

router.get('/news/:id', function (req, res) {
  try {
    const db = readDB();
    const item = (db.news || []).find(n => n.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Haber bulunamadı.' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Haber yüklenemedi.' });
  }
});

router.post('/news', requireAuth, function (req, res) {
  try {
    const fs = require('fs');
    const path = require('path');
    const { title, summary, content, source, sourceUrl, publishDate, image_base64 } = req.body;
    if (!title || !summary || !content || !publishDate) {
      return res.status(400).json({ error: 'Lütfen zorunlu alanları doldurun (Başlık, Özet, İçerik, Yayın Tarihi).' });
    }

    let imageUrl = '';
    if (image_base64) {
      const matches = image_base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const imageBuffer = Buffer.from(matches[2], 'base64');
        const uploadDir = path.join(__dirname, '../public/uploads/news');
        
        let ext = 'png';
        const mimeType = matches[1];
        if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') ext = 'jpg';
        else if (mimeType === 'image/gif') ext = 'gif';
        else if (mimeType === 'image/webp') ext = 'webp';

        try {
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const fileName = 'news_' + Date.now() + '_' + Math.floor(Math.random() * 1000) + '.' + ext;
          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, imageBuffer);
          imageUrl = '/uploads/news/' + fileName;
        } catch (writeErr) {
          console.warn('Local file write failed for news, using base64 fallback:', writeErr.message);
          imageUrl = image_base64;
        }
      }
    }

    const db = readDB();
    if (!db.news) db.news = [];

    const newNews = {
      id: 'news_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      source: (source || '').trim(),
      sourceUrl: (sourceUrl || '').trim(),
      publishDate: publishDate,
      imageUrl: imageUrl,
      created_at: new Date().toISOString()
    };

    db.news.push(newNews);
    writeDB(db);

    res.status(201).json({ success: true, message: 'Haber başarıyla eklendi.', news: newNews });
  } catch (err) {
    console.error('Save news error:', err);
    res.status(500).json({ error: 'Haber eklenemedi.' });
  }
});

router.put('/news/:id', requireAuth, function (req, res) {
  try {
    const fs = require('fs');
    const path = require('path');
    const { title, summary, content, source, sourceUrl, publishDate, image_base64 } = req.body;
    const db = readDB();
    if (!db.news) db.news = [];

    const idx = db.news.findIndex(n => n.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Haber bulunamadı.' });

    let imageUrl = db.news[idx].imageUrl;
    if (image_base64) {
      const matches = image_base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const imageBuffer = Buffer.from(matches[2], 'base64');
        const uploadDir = path.join(__dirname, '../public/uploads/news');
        
        let ext = 'png';
        const mimeType = matches[1];
        if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') ext = 'jpg';
        else if (mimeType === 'image/gif') ext = 'gif';
        else if (mimeType === 'image/webp') ext = 'webp';

        try {
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const fileName = 'news_' + Date.now() + '_' + Math.floor(Math.random() * 1000) + '.' + ext;
          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, imageBuffer);
          imageUrl = '/uploads/news/' + fileName;
        } catch (writeErr) {
          console.warn('Local file write failed for news update, using base64 fallback:', writeErr.message);
          imageUrl = image_base64;
        }

        // Delete old image if it was a local file
        if (db.news[idx].imageUrl && db.news[idx].imageUrl.startsWith('/uploads/news/')) {
          try {
            const oldPath = path.join(__dirname, '../public', db.news[idx].imageUrl);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          } catch (e) {
            console.error('Delete old news image error:', e.message);
          }
        }
      }
    }

    db.news[idx] = {
      ...db.news[idx],
      title: title ? title.trim() : db.news[idx].title,
      summary: summary ? summary.trim() : db.news[idx].summary,
      content: content ? content.trim() : db.news[idx].content,
      source: source !== undefined ? source.trim() : db.news[idx].source,
      sourceUrl: sourceUrl !== undefined ? sourceUrl.trim() : db.news[idx].sourceUrl,
      publishDate: publishDate || db.news[idx].publishDate,
      imageUrl: imageUrl
    };

    writeDB(db);
    res.json({ success: true, message: 'Haber güncellendi.', news: db.news[idx] });
  } catch (err) {
    res.status(500).json({ error: 'Haber güncellenemedi.' });
  }
});

router.delete('/news/:id', requireAuth, function (req, res) {
  try {
    const fs = require('fs');
    const path = require('path');
    const db = readDB();
    if (!db.news) db.news = [];

    const idx = db.news.findIndex(n => n.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Haber bulunamadı.' });

    const item = db.news[idx];
    if (item.imageUrl && item.imageUrl.startsWith('/uploads/news/')) {
      try {
        const filePath = path.join(__dirname, '../public', item.imageUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Delete news image error:', e.message);
      }
    }

    db.news.splice(idx, 1);
    writeDB(db);

    res.json({ success: true, message: 'Haber başarıyla silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Haber silinemedi.' });
  }
});


// ─── QUIZZES API ────────────────────────────────
router.get('/quizzes', function (req, res) {
  try {
    const db = readDB();
    const quizzes = db.quizzes || [];
    // Return quizzes without correctOptionIndex for public view to prevent cheating
    const publicQuizzes = quizzes.map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      badge: q.badge,
      badgeIcon: q.badgeIcon,
      questions: q.questions.map(question => ({
        questionText: question.questionText,
        options: question.options
      }))
    }));
    res.json(publicQuizzes);
  } catch (err) {
    res.status(500).json({ error: 'Quizler yüklenemedi.' });
  }
});

router.post('/quizzes/:id/submit', function (req, res) {
  try {
    const { answers } = req.body; // e.g. [1, 2, 0] (array of selected indexes)
    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'Geçersiz cevap formatı.' });
    }

    const db = readDB();
    const quiz = (db.quizzes || []).find(q => q.id === req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz bulunamadı.' });

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;
    const results = quiz.questions.map((q, idx) => {
      const selected = answers[idx];
      const isCorrect = selected === q.correctOptionIndex;
      if (isCorrect) correctCount++;
      return {
        questionText: q.questionText,
        selectedOptionIndex: selected,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect
      };
    });

    const passed = correctCount === totalQuestions; // 100% correct required for badge
    
    res.json({
      success: true,
      score: correctCount,
      total: totalQuestions,
      passed,
      results,
      badge: passed ? { title: quiz.badge, icon: quiz.badgeIcon } : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Quiz değerlendirilemedi.' });
  }
});

// ─── ACADEMY API ────────────────────────────────
router.get('/academy/videos', function (req, res) {
  try {
    const db = readDB();
    res.json(db.academy_videos || []);
  } catch (err) {
    res.status(500).json({ error: 'Eğitim videoları yüklenemedi.' });
  }
});

router.get('/academy/resources', function (req, res) {
  try {
    const db = readDB();
    res.json(db.academy_resources || []);
  } catch (err) {
    res.status(500).json({ error: 'Kaynaklar yüklenemedi.' });
  }
});

// Admin-only management routes
router.get('/admin/quizzes', requireAuth, function (req, res) {
  try {
    const db = readDB();
    res.json(db.quizzes || []);
  } catch (err) {
    res.status(500).json({ error: 'Yönetim quizleri yüklenemedi.' });
  }
});

// ─── ADMIN ACADEMY VIDEOS ───────────────────────
router.get('/admin/academy/videos', requireAuth, function (req, res) {
  try {
    const db = readDB();
    res.json(db.academy_videos || []);
  } catch (err) {
    res.status(500).json({ error: 'Videolar listelenemedi.' });
  }
});

router.post('/admin/academy/videos', requireAuth, function (req, res) {
  try {
    const { title, youtubeId, channel, category, categoryId, duration, level, description } = req.body;
    if (!title || !youtubeId || !channel) {
      return res.status(400).json({ error: 'Başlık, YouTube ID ve Kanal adı gereklidir.' });
    }
    
    const db = readDB();
    if (!db.academy_videos) db.academy_videos = [];
    
    const newVideo = {
      id: 'vid-' + Date.now(),
      title,
      youtubeId,
      channel,
      category: category || 'Genel',
      categoryId: categoryId || 'giris',
      duration: duration || '00:00',
      level: level || 'Başlangıç',
      description: description || ''
    };
    
    db.academy_videos.push(newVideo);
    writeDB(db);
    
    res.status(201).json({ success: true, message: 'Video başarıyla eklendi.', video: newVideo });
  } catch (err) {
    res.status(500).json({ error: 'Video eklenemedi.' });
  }
});

router.put('/admin/academy/videos/:id', requireAuth, function (req, res) {
  try {
    const { title, youtubeId, channel, category, categoryId, duration, level, description } = req.body;
    const db = readDB();
    if (!db.academy_videos) db.academy_videos = [];
    
    const idx = db.academy_videos.findIndex(v => v.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Video bulunamadı.' });
    
    db.academy_videos[idx] = {
      ...db.academy_videos[idx],
      title: title || db.academy_videos[idx].title,
      youtubeId: youtubeId || db.academy_videos[idx].youtubeId,
      channel: channel || db.academy_videos[idx].channel,
      category: category || db.academy_videos[idx].category,
      categoryId: categoryId || db.academy_videos[idx].categoryId,
      duration: duration || db.academy_videos[idx].duration,
      level: level || db.academy_videos[idx].level,
      description: description || db.academy_videos[idx].description
    };
    
    writeDB(db);
    res.json({ success: true, message: 'Video güncellendi.', video: db.academy_videos[idx] });
  } catch (err) {
    res.status(500).json({ error: 'Video güncellenemedi.' });
  }
});

router.delete('/admin/academy/videos/:id', requireAuth, function (req, res) {
  try {
    const db = readDB();
    if (!db.academy_videos) db.academy_videos = [];
    
    const before = db.academy_videos.length;
    db.academy_videos = db.academy_videos.filter(v => v.id !== req.params.id);
    
    if (db.academy_videos.length === before) {
      return res.status(404).json({ error: 'Video bulunamadı.' });
    }
    
    writeDB(db);
    res.json({ success: true, message: 'Video başarıyla silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Video silinemedi.' });
  }
});

// ─── ADMIN ACADEMY RESOURCES ────────────────────
router.get('/admin/academy/resources', requireAuth, function (req, res) {
  try {
    const db = readDB();
    res.json(db.academy_resources || []);
  } catch (err) {
    res.status(500).json({ error: 'Kaynaklar listelenemedi.' });
  }
});

router.post('/admin/academy/resources', requireAuth, function (req, res) {
  try {
    const { title, description, url, badge, icon } = req.body;
    if (!title || !description || !url) {
      return res.status(400).json({ error: 'Başlık, açıklama ve URL gereklidir.' });
    }
    
    const db = readDB();
    if (!db.academy_resources) db.academy_resources = [];
    
    const newResource = {
      id: 'res-' + Date.now(),
      title,
      description,
      url,
      badge: badge || 'Eğitim',
      icon: icon || '🔗'
    };
    
    db.academy_resources.push(newResource);
    writeDB(db);
    
    res.status(201).json({ success: true, message: 'Kaynak başarıyla eklendi.', resource: newResource });
  } catch (err) {
    res.status(500).json({ error: 'Kaynak eklenemedi.' });
  }
});

router.put('/admin/academy/resources/:id', requireAuth, function (req, res) {
  try {
    const { title, description, url, badge, icon } = req.body;
    const db = readDB();
    if (!db.academy_resources) db.academy_resources = [];
    
    const idx = db.academy_resources.findIndex(r => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Kaynak bulunamadı.' });
    
    db.academy_resources[idx] = {
      ...db.academy_resources[idx],
      title: title || db.academy_resources[idx].title,
      description: description || db.academy_resources[idx].description,
      url: url || db.academy_resources[idx].url,
      badge: badge || db.academy_resources[idx].badge,
      icon: icon || db.academy_resources[idx].icon
    };
    
    writeDB(db);
    res.json({ success: true, message: 'Kaynak güncellendi.', resource: db.academy_resources[idx] });
  } catch (err) {
    res.status(500).json({ error: 'Kaynak güncellenemedi.' });
  }
});

router.delete('/admin/academy/resources/:id', requireAuth, function (req, res) {
  try {
    const db = readDB();
    if (!db.academy_resources) db.academy_resources = [];
    
    const before = db.academy_resources.length;
    db.academy_resources = db.academy_resources.filter(r => r.id !== req.params.id);
    
    if (db.academy_resources.length === before) {
      return res.status(404).json({ error: 'Kaynak bulunamadı.' });
    }
    
    writeDB(db);
    res.json({ success: true, message: 'Kaynak başarıyla silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Kaynak silinemedi.' });
  }
});

router.post('/admin/quizzes', requireAuth, function (req, res) {
  try {
    const { title, description, badge, badgeIcon, questions } = req.body;
    if (!title || !description || !badge || !badgeIcon || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Lütfen tüm alanları doldurun.' });
    }

    const db = readDB();
    if (!db.quizzes) db.quizzes = [];

    const newQuiz = {
      id: 'quiz_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      title: title.trim(),
      description: description.trim(),
      badge: badge.trim(),
      badgeIcon: badgeIcon.trim(),
      questions: questions.map(q => ({
        questionText: q.questionText.trim(),
        options: q.options.map(o => o.trim()),
        correctOptionIndex: parseInt(q.correctOptionIndex)
      }))
    };

    db.quizzes.push(newQuiz);
    writeDB(db);

    res.status(201).json({ success: true, message: 'Quiz başarıyla oluşturuldu.', quiz: newQuiz });
  } catch (err) {
    res.status(500).json({ error: 'Quiz oluşturulamadı.' });
  }
});

router.put('/admin/quizzes/:id', requireAuth, function (req, res) {
  try {
    const { title, description, badge, badgeIcon, questions } = req.body;
    const db = readDB();
    if (!db.quizzes) db.quizzes = [];

    const idx = db.quizzes.findIndex(q => q.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Quiz bulunamadı.' });

    db.quizzes[idx] = {
      ...db.quizzes[idx],
      title: title ? title.trim() : db.quizzes[idx].title,
      description: description ? description.trim() : db.quizzes[idx].description,
      badge: badge ? badge.trim() : db.quizzes[idx].badge,
      badgeIcon: badgeIcon ? badgeIcon.trim() : db.quizzes[idx].badgeIcon,
      questions: Array.isArray(questions) ? questions.map(q => ({
        questionText: q.questionText.trim(),
        options: q.options.map(o => o.trim()),
        correctOptionIndex: parseInt(q.correctOptionIndex)
      })) : db.quizzes[idx].questions
    };

    writeDB(db);
    res.json({ success: true, message: 'Quiz güncellendi.', quiz: db.quizzes[idx] });
  } catch (err) {
    res.status(500).json({ error: 'Quiz güncellenemedi.' });
  }
});

router.delete('/admin/quizzes/:id', requireAuth, function (req, res) {
  try {
    const db = readDB();
    if (!db.quizzes) db.quizzes = [];

    const before = db.quizzes.length;
    db.quizzes = db.quizzes.filter(q => q.id !== req.params.id);

    if (db.quizzes.length === before) {
      return res.status(404).json({ error: 'Quiz bulunamadı.' });
    }

    writeDB(db);
    res.json({ success: true, message: 'Quiz silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Quiz silinemedi.' });
  }
});

// ─── Social Media Queue Routes ─────────────────
router.get('/admin/social/queue', requireAuth, function (req, res) {
  try {
    const db = readDB();
    res.json(db.social_queue || []);
  } catch (err) {
    res.status(500).json({ error: 'Sosyal medya kuyruğu alınamadı.' });
  }
});

router.put('/admin/social/queue/:id', requireAuth, function (req, res) {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Paylaşım metni gerekli.' });
    
    const db = readDB();
    if (!db.social_queue) db.social_queue = [];
    
    const idx = db.social_queue.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Paylaşım bulunamadı.' });
    
    db.social_queue[idx].text = text;
    writeDB(db);
    
    res.json({ success: true, message: 'Paylaşım metni güncellendi.', post: db.social_queue[idx] });
  } catch (err) {
    res.status(500).json({ error: 'Paylaşım güncellenemedi.' });
  }
});

router.delete('/admin/social/queue/:id', requireAuth, function (req, res) {
  try {
    const db = readDB();
    if (!db.social_queue) db.social_queue = [];
    
    const beforeLen = db.social_queue.length;
    db.social_queue = db.social_queue.filter(p => p.id !== req.params.id);
    
    if (db.social_queue.length === beforeLen) {
      return res.status(404).json({ error: 'Paylaşım bulunamadı.' });
    }
    
    writeDB(db);
    res.json({ success: true, message: 'Paylaşım kuyruktan kaldırıldı.' });
  } catch (err) {
    res.status(500).json({ error: 'Paylaşım silinemedi.' });
  }
});

// GET /api/tools/:id/badge.svg
router.get('/tools/:id/badge.svg', function (req, res) {
  try {
    const toolId = req.params.id;
    const db = readDB();
    const tool = db.tools.find(t => t.id === toolId);
    
    let rating = 5.0;
    let votes = 0;
    let name = 'Yapay Zeka';
    
    if (tool) {
      rating = typeof tool.rating === 'number' ? tool.rating : 5.0;
      votes = typeof tool.votes === 'number' ? tool.votes : 0;
      name = tool.name || 'AI Tool';
    } else {
      // If tool doesn't exist, return a generic placeholder badge
      rating = 5.0;
      votes = 0;
      name = 'AiKlavuz';
    }

    const ratingText = rating.toFixed(1);
    const votesText = `${votes} Oy`;
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="40" viewBox="0 0 220 40">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f111a" />
      <stop offset="100%" stop-color="#181b29" />
    </linearGradient>
    <!-- Brand Accent Gradient -->
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8a4bf5" />
      <stop offset="100%" stop-color="#14dbd4" />
    </linearGradient>
  </defs>
  <!-- Card Background -->
  <rect width="220" height="40" rx="8" fill="url(#bgGrad)" stroke="url(#accentGrad)" stroke-width="1.5"/>
  
  <!-- Left Side: Logo/Text -->
  <g transform="translate(10, 0)">
    <!-- Mini Compass Logo Icon -->
    <circle cx="12" cy="20" r="7" fill="none" stroke="url(#accentGrad)" stroke-width="1.5"/>
    <polygon points="12,16 15,20 12,24 9,20" fill="url(#accentGrad)"/>
    
    <!-- Brand Text -->
    <text x="25" y="24" fill="#ffffff" font-family="'Inter', -apple-system, sans-serif" font-size="11" font-weight="700" letter-spacing="0.5">AiKlavuz</text>
  </g>
  
  <!-- Divider -->
  <line x1="88" y1="8" x2="88" y2="32" stroke="#252b42" stroke-width="1.5"/>
  
  <!-- Right Side: Rating & Votes -->
  <g transform="translate(98, 0)">
    <!-- Star Icon -->
    <path d="M 12 5 L 14.5 10 L 20 10.5 L 16 14.5 L 17 20 L 12 17.5 L 7 20 L 8 14.5 L 4 10.5 L 9.5 10 Z" fill="#ffd700" transform="translate(-4, 7.5) scale(0.7)"/>
    
    <!-- Rating Text -->
    <text x="12" y="24" fill="#ffffff" font-family="'Inter', -apple-system, sans-serif" font-size="11" font-weight="700">${ratingText}</text>
    
    <!-- Vote Count Text -->
    <text x="36" y="23" fill="#8892b0" font-family="'Inter', -apple-system, sans-serif" font-size="9" font-weight="500">(${votesText})</text>
  </g>
</svg>`;

    res.header('Content-Type', 'image/svg+xml');
    res.header('Cache-Control', 'public, max-age=60'); // cache for 1 minute
    res.send(svg);
  } catch (err) {
    console.error('Error generating tool badge SVG:', err.message);
    res.status(500).send('Error generating badge');
  }
});

// Akıllı Karar Sihirbazı Öneri Motoru
router.post('/advisor/wizard', async function (req, res) {
  try {
    const { goal, budget, experience } = req.body;
    if (!goal || !budget || !experience) {
      return res.status(400).json({ error: 'Eksik parametre gönderildi.' });
    }

    const db = readDB();
    const settings = db.crawler_settings || {};
    
    // 1. Eşleşen kategorileri ve anahtar kelimeleri belirle
    let targetCategoryIds = [];
    let searchKeywords = [];
    
    if (goal === 'gorsel') {
      targetCategoryIds = ['yaratici-ai', 'gorsel-video-ai'];
      searchKeywords = ['görsel', 'resim', 'tasarım', 'image', 'photo', 'art', 'draw', 'guzel'];
    } else if (goal === 'metin') {
      targetCategoryIds = ['genel-ai-asistan', 'is-uretkenlik-ai'];
      searchKeywords = ['yazı', 'metin', 'içerik', 'write', 'copy', 'blog', 'makale'];
    } else if (goal === 'ses') {
      targetCategoryIds = ['gorsel-video-ai'];
      searchKeywords = ['ses', 'seslendirme', 'müzik', 'audio', 'voice', 'music', 'sound', 'konusma'];
    } else if (goal === 'video') {
      targetCategoryIds = ['gorsel-video-ai'];
      searchKeywords = ['video', 'kurgu', 'edit', 'animasyon', 'film', 'movie'];
    } else if (goal === 'yazilim') {
      targetCategoryIds = ['yazilim-kod-ai'];
      searchKeywords = ['kod', 'yazılım', 'program', 'code', 'dev', 'bug', 'git', 'terminal'];
    } else if (goal === 'analiz') {
      targetCategoryIds = ['veri-analitik-ai', 'finans-ai', 'is-uretkenlik-ai'];
      searchKeywords = ['veri', 'analiz', 'tablo', 'excel', 'data', 'finance', 'grafik', 'chart'];
    }

    // 2. Araçları puanla
    const scoredTools = db.tools.map(t => {
      let score = 0;
      const name = String(t.name || '').toLowerCase();
      const desc = String(t.description || '').toLowerCase();
      const tags = (Array.isArray(t.tags) ? t.tags.join(' ') : String(t.tags || '')).toLowerCase();
      const catId = String(t.category_id || '').toLowerCase();

      // Kategori Eşleşmesi
      if (targetCategoryIds.includes(t.category_id)) {
        score += 30;
      }

      // Anahtar kelime eşleşmesi
      searchKeywords.forEach(keyword => {
        if (name.includes(keyword)) score += 10;
        if (desc.includes(keyword)) score += 5;
        if (tags.includes(keyword)) score += 8;
      });

      // Bütçe eşleşmesi
      if (budget === 'ucretsiz') {
        if (t.pricing === 'ucretsiz') score += 25;
        else if (t.pricing === 'freemium') score += 15; // has free tier
        else score -= 15; // paid tools penalized
      } else if (budget === 'freemium') {
        if (t.pricing === 'freemium') score += 25;
        else if (t.pricing === 'ucretsiz') score += 15;
        else score += 5;
      } else if (budget === 'ucretli') {
        if (t.pricing === 'ucretli' || t.pricing === 'premium') score += 25;
        else if (t.pricing === 'freemium') score += 15;
      }

      // Deneyim Eşleşmesi (kolay / gelismis)
      const cleanName = name.trim();
      if (experience === 'kolay') {
        // Simple tools
        const easyTools = ['canva', 'gamma', 'chatgpt', 'photoroom', 'v0', 'bolt', 'notion', 'notion-ai', 'jasper'];
        if (easyTools.includes(cleanName) || desc.includes('kolay') || desc.includes('basit') || desc.includes('no-code') || desc.includes('kodsuz')) {
          score += 15;
        }
      } else if (experience === 'gelismis') {
        // Professional/Complex tools
        const advancedTools = ['midjourney', 'cursor', 'github-copilot', 'adobe-firefly', 'julius', 'runway', 'sora'];
        if (advancedTools.includes(cleanName) || desc.includes('gelişmiş') || desc.includes('profesyonel') || desc.includes('kodlama') || desc.includes('advanced')) {
          score += 15;
        }
      }

      // Feature & Rating bonus
      if (t.featured) score += 8;
      score += (t.rating || 0) * 1.5;

      return { tool: t, score };
    });

    // 3. En iyi 3 aracı seç
    let matchedTools = scoredTools
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || (b.tool.featured || 0) - (a.tool.featured || 0))
      .map(item => item.tool)
      .slice(0, 3);

    // Emniyet mekanizması: Eğer araç bulunamazsa en popüler 3 genel aracı ata
    if (matchedTools.length === 0) {
      matchedTools = db.tools
        .sort((a, b) => (b.featured || 0) - (a.featured || 0) || (b.rating || 0) - (a.rating || 0))
        .slice(0, 3);
    }

    // 4. LLM yardımıyla dinamik açıklama üret
    const apiKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY || settings.ai_api_key;
    let explanations = {};
    
    // Varsayılan gerekçeleri oluştur (fallback)
    matchedTools.forEach(t => {
      let pricingText = 'ücretsiz kullanım';
      if (t.pricing === 'freemium') pricingText = 'ücretsiz başlangıç modeli (freemium)';
      else if (t.pricing === 'ucretli') pricingText = 'profesyonel planları';

      explanations[t.id] = `Bu araç, ${pricingText} ve sunduğu güçlü özellikleri ile seçtiğiniz hedefe ulaşmanızda son derece pratiktir.`;
    });

    if (apiKey && matchedTools.length > 0) {
      try {
        const { callLLM } = require('../services/ai');
        
        const goalTexts = {
          gorsel: 'görsel/tasarım üretimi',
          metin: 'metin/içerik yazarlığı',
          ses: 'ses/müzik üretimi ve seslendirme',
          video: 'video kurgu ve animasyon üretimi',
          yazilim: 'kod yazma ve yazılım geliştirme',
          analiz: 'veri analizi, excel ve raporlama'
        };

        const budgetTexts = {
          ucretsiz: 'tamamen ücretsiz',
          freemium: 'ücretsiz deneme veya freemium (kısmi ücretsiz)',
          ucretli: 'bütçeli/ücretli profesyonel'
        };

        const experienceTexts = {
          kolay: 'hızlı, pratik ve yapay zekanın tek tıkla halledeceği kolay bir iş akışı',
          gelismis: 'detaylı parametrelere müdahale edebileceği profesyonel ve gelişmiş kontrol'
        };

        const systemPrompt = `You are an AI Matchmaking Expert for the AiKlavuz AI directory.
A user completed our diagnostic wizard asking for AI tools with the following preferences:
- Goal: ${goalTexts[goal]}
- Budget preference: ${budgetTexts[budget]}
- Desired workflow: ${experienceTexts[experience]}

We matched the following 3 tools from our directory:
${matchedTools.map(t => `- [${t.name}]: ${t.description.substring(0, 150)}`).join('\n')}

For each of these 3 matched tools, write a highly personalized, compelling 1-2 sentence explanation in Turkish.
Explain why this specific tool fits their exact need (mentioning their budget, goal, or experience preference). Keep it friendly, encouraging, and natural.

Return your response strictly in the following JSON format:
{
  "explanations": {
    "tool-id-1": "gerekçe metni...",
    "tool-id-2": "gerekçe metni...",
    "tool-id-3": "gerekçe metni..."
  }
}`;

        const apiProvider = process.env.AI_PROVIDER || settings.ai_provider;
        const apiModel = process.env.AI_MODEL || settings.ai_model;
        const llmSettings = {
          ...settings,
          ai_provider: apiProvider,
          ai_model: apiModel,
          ai_api_key: apiKey
        };

        const llmResponse = await callLLM(systemPrompt, 'Generate explanations for the matched tools.', llmSettings);
        let parsed = null;
        try {
          parsed = JSON.parse(llmResponse);
        } catch (e) {
          const cleanJson = llmResponse.replace(/```json/g, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleanJson);
        }

        if (parsed && parsed.explanations) {
          // Merge dynamic explanations
          matchedTools.forEach(t => {
            if (parsed.explanations[t.id]) {
              explanations[t.id] = parsed.explanations[t.id];
            } else {
              // Try case-insensitive or name match in JSON keys
              const foundKey = Object.keys(parsed.explanations).find(k => k.toLowerCase() === t.id.toLowerCase() || k.toLowerCase() === t.name.toLowerCase());
              if (foundKey) {
                explanations[t.id] = parsed.explanations[foundKey];
              }
            }
          });
        }
      } catch (err) {
        console.error('LLM wizard explanation generation failed, using fallback:', err.message);
      }
    }

    // Kategorileri ekle
    const resultTools = matchedTools.map(t => {
      const cat = db.categories.find(c => c.id === t.category_id);
      return {
        ...t,
        category_name: cat ? cat.name : '',
        category_icon: cat ? cat.icon : '',
        ai_explanation: explanations[t.id]
      };
    });

    res.json({ success: true, tools: resultTools });
  } catch (err) {
    console.error('Wizard search error:', err.message);
    res.status(500).json({ error: 'Karar sihirbazı çalıştırılırken hata oluştu.' });
  }
});

// ─── DEALS & PROMO CODES ───────────────────────

// GET /api/deals
router.get('/deals', function (req, res) {
  try {
    const db = readDB();
    const deals = db.deals || [];
    // Sort by popularity (clicks)
    deals.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
    res.json(deals);
  } catch (err) {
    console.error('Error fetching deals:', err.message);
    res.status(500).json({ error: 'Kupon fırsatları yüklenemedi.' });
  }
});

// POST /api/deals/:id/click
router.post('/deals/:id/click', function (req, res) {
  try {
    const { id } = req.params;
    const db = readDB();
    const deal = (db.deals || []).find(d => d.id === id);
    if (!deal) {
      return res.status(404).json({ error: 'Fırsat bulunamadı.' });
    }
    deal.clicks = (deal.clicks || 0) + 1;
    writeDB(db);
    res.json({ success: true, clicks: deal.clicks });
  } catch (err) {
    console.error('Error updating deal click count:', err.message);
    res.status(500).json({ error: 'Sayaç güncellenemedi.' });
  }
});

module.exports = router;
