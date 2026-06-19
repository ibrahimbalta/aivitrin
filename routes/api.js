'use strict';
const express = require('express');
const { readDB, writeDB } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ─── CATEGORIES ───────────────────────────────

router.get('/categories', function (req, res) {
  try {
    const db = readDB();
    const cats = db.categories
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(c => ({
        ...c,
        count: db.tools.filter(t => t.category_id === c.id).length
      }));
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

router.get('/tools', function (req, res) {
  try {
    const { search, category, pricing, sort, limit, made_in_turkey, profession } = req.query;
    const db = readDB();

    let tools = db.tools.map(t => {
      const cat = db.categories.find(c => c.id === t.category_id);
      return { ...t, category_name: cat ? cat.name : '', category_icon: cat ? cat.icon : '' };
    });

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

    if (sort === 'name-asc') tools.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    else if (sort === 'newest') tools.sort((a, b) => (b.is_new || 0) - (a.is_new || 0) || new Date(b.created_at) - new Date(a.created_at));
    else if (sort === 'popular') tools.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    else tools.sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name, 'tr'));

    if (limit) tools = tools.slice(0, parseInt(limit));

    res.json({ tools, total: tools.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Araçlar yüklenemedi.' });
  }
});

router.get('/tools/:id', function (req, res) {
  try {
    const db = readDB();
    const tool = db.tools.find(t => t.id === req.params.id);
    if (!tool) return res.status(404).json({ error: 'Araç bulunamadı.' });
    const cat = db.categories.find(c => c.id === tool.category_id);
    const reviews = (db.reviews || []).filter(r => r.tool_id === tool.id);
    res.json({ 
      ...tool, 
      category_name: cat ? cat.name : '', 
      category_icon: cat ? cat.icon : '',
      reviews: reviews
    });
  } catch (err) {
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

    const tool = db.tools[toolIdx];
    
    // If already has pros/cons, return them
    if (tool.pros && tool.cons && tool.pros.length > 0) {
      return res.json({ success: true, pros: tool.pros, cons: tool.cons });
    }

    const settings = db.crawler_settings || {};
    // If AI is not configured or disabled, fallback to mockup pros/cons
    if (!settings.ai_api_key) {
      const fallback = generateFallbackProsCons(tool, db);
      return res.json({ success: true, pros: fallback.pros, cons: fallback.cons });
    }

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

    // Cache to DB
    db.tools[toolIdx].pros = analysis.pros || [];
    db.tools[toolIdx].cons = analysis.cons || [];
    writeDB(db);

    res.json({ success: true, pros: db.tools[toolIdx].pros, cons: db.tools[toolIdx].cons });
  } catch (err) {
    console.error('AI Analysis error:', err);
    try {
      const fallbackDb = readDB();
      const fallbackTool = fallbackDb.tools.find(t => t.id === req.params.id);
      if (fallbackTool) {
        const fallback = generateFallbackProsCons(fallbackTool, fallbackDb);
        return res.json({ success: true, pros: fallback.pros, cons: fallback.cons });
      }
    } catch (fallbackErr) {
      console.error('Fallback generator error:', fallbackErr);
    }
    // Absolute fallback if database read fails
    res.json({
      success: true,
      pros: [
        "Kolay ve hızlı kullanım arayüzü.",
        "Kendi kategorisinde en popüler çözümlerden biri.",
        "Geniş entegrasyon desteği ve topluluk."
      ],
      cons: [
        "Ücretsiz plandaki limitler kısıtlayıcı olabilir.",
        "Gelişmiş özellikler için ücretli abonelik gerektirir.",
        "Türkçe dil desteği tam olarak optimize edilmemiş olabilir."
      ]
    });
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
    const { id, name, description, category_id, tags, pricing, rating, url, featured, is_new, votes, turkish_supported, pricing_try } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'ID ve isim gerekli.' });
    const db = readDB();
    if (db.tools.find(t => t.id === id)) return res.status(409).json({ error: 'Bu ID zaten mevcut.' });
    db.tools.push({
      id, name, description: description || '', category_id: category_id || null,
      tags: tags || [], pricing: pricing || 'freemium', rating: rating || 4.0,
      url: url || '', featured: featured ? 1 : 0, is_new: is_new ? 1 : 0,
      votes: votes || 0,
      turkish_supported: turkish_supported || 'none',
      pricing_try: pricing_try || '',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    });
    writeDB(db);
    res.status(201).json({ success: true, message: 'Araç oluşturuldu.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Araç oluşturulamadı.' });
  }
});

router.put('/tools/:id', requireAuth, function (req, res) {
  try {
    const { name, description, category_id, tags, pricing, rating, url, featured, is_new, votes, turkish_supported, pricing_try } = req.body;
    const db = readDB();
    const idx = db.tools.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Araç bulunamadı.' });
    db.tools[idx] = {
      ...db.tools[idx], name, description: description || '', category_id: category_id || null,
      tags: tags || [], pricing: pricing || 'freemium', rating: rating || 4.0,
      url: url || '', featured: featured ? 1 : 0, is_new: is_new ? 1 : 0,
      votes: votes !== undefined ? votes : db.tools[idx].votes || 0,
      turkish_supported: turkish_supported || db.tools[idx].turkish_supported || 'none',
      pricing_try: pricing_try || db.tools[idx].pricing_try || '',
      updated_at: new Date().toISOString()
    };
    writeDB(db);
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
    res.json({ success: true, message: 'Araç silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Araç silinemedi.' });
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
      pendingSubmissions: (db.submissions || []).length
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.tools.push(newTool);
    db.submissions.splice(subIdx, 1);
    writeDB(db);

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
    if (!settings.ai_api_key) {
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

        const systemPrompt = `Sen AIvitrin yapay zeka dizininin bülten yazarı yapay zekasısın.
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

        subject = parsed.subject || `AIvitrin Haftalık Bülten: ${topic}`;
        content = parsed.content || 'Bülten içeriği oluşturulamadı.';
      } catch (err) {
        console.error('LLM Newsletter generation error, falling back to heuristic:', err);
      }
    }

    // Fallback if AI fails or key not set
    if (!subject || !content) {
      subject = `AIvitrin Haftalık Bülten: ${topic}`;
      content = `Merhaba AIvitrin Takipçisi!\n\nBu haftaki bültenimizde sizler için "${topic}" konusunu ele aldık.\n\nBu kapsamda vitrinimizdeki en popüler araçları inceleyebilir, detaylı karşılaştırmalar yapabilirsiniz. Ayrıca yeni eklenen AI Danışman Chatbot'umuza dilediğiniz soruları sorarak ihtiyacınız olan yapay zeka araçlarını anında bulabilirsiniz.\n\nDaha fazla detay ve yeni çıkan araçları keşfetmek için sitemizi ziyaret etmeyi unutmayın.\n\nSağlıklı ve verimli bir hafta dileriz,\nAIvitrin Ekibi\n🌐 https://aivitrin.com`;
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
    
    let matchedTools = [];
    
    // Check if API key is present
    if (settings.ai_api_key) {
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
        const llmResponse = await callLLM(systemPrompt, userPrompt, settings);
        
        let analysis = { category_ids: [], keywords: [], pricing: null };
        try {
          analysis = JSON.parse(llmResponse);
        } catch (e) {
          // If response starts/ends with markdown backticks
          const cleanJson = llmResponse.replace(/```json/g, '').replace(/```/g, '').trim();
          analysis = JSON.parse(cleanJson);
        }

        const categoryIds = analysis.category_ids || [];
        const keywords = (analysis.keywords || []).map(k => k.toLowerCase());

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

          // Category match
          if (categoryIds.includes(t.category_id)) {
            score += 30;
          }

          // Exact query match in name
          if (nameLower.includes(q.toLowerCase())) {
            score += 40;
          }

          // Keyword matches
          keywords.forEach(kw => {
            if (nameLower.includes(kw)) score += 20;
            if (tagsLower.includes(kw)) score += 15;
            if (descLower.includes(kw)) score += 5;
          });

          // Tag matches with original query words
          const queryWords = q.toLowerCase().split(/\s+/).filter(w => w.length > 2);
          queryWords.forEach(qw => {
            if (nameLower.includes(qw)) score += 15;
            if (tagsLower.includes(qw)) score += 10;
            if (descLower.includes(qw)) score += 3;
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

    const db = readDB();
    const settings = db.crawler_settings || {};
    
    // Check if API key is set
    if (settings.ai_api_key) {
      try {
        const { callLLM } = require('../services/ai');
        const categoriesList = db.categories.map(c => `"${c.id}" (${c.name})`).join(', ');
        
        // Pick a small subset of tools to prevent prompt blowing
        const availableTools = db.tools.slice(0, 150).map(t => {
          return { id: t.id, name: t.name, description: t.description.substring(0, 100), category_id: t.category_id, pricing: t.pricing };
        });

        const systemPrompt = `Sen AIvitrin yapay zeka dizini için akıllı bir yapay zeka danışmanısın (AI Advisor). Kullanıcıların Türkçe dilindeki yapay zeka aracı bulma, tavsiye alma veya soru sorma isteklerini yanıtla.
Sana verilen araç listesinden en uygun olanları seç ve öner. Yanıtını dost canlısi, profesyonel ve kısa bir dille ver.

Yanıtını SADECE aşağıdaki JSON formatında döndür (başka hiçbir metin ekleme):
{
  "reply": "Kullanıcıya vereceğin Türkçe yanıt metni. Markdown formatında olabilir.",
  "recommended_tool_ids": ["uygun-arac-id-1", "uygun-arac-id-2", ...]
}

Mevcut Araçlar Listesi:
${JSON.stringify(availableTools)}

Geçerli Kategoriler:
[ ${categoriesList} ]`;

        const userPrompt = `Kullanıcı Mesajı: "${message}"`;
        const llmResponse = await callLLM(systemPrompt, userPrompt, settings);
        
        let advisorReply = { reply: '', recommended_tool_ids: [] };
        try {
          advisorReply = JSON.parse(llmResponse);
        } catch (e) {
          const cleanJson = llmResponse.replace(/```json/g, '').replace(/```/g, '').trim();
          advisorReply = JSON.parse(cleanJson);
        }
        
        // Filter recommended tool ids to make sure they exist in tools list
        const matched = (advisorReply.recommended_tool_ids || [])
          .map(id => db.tools.find(t => t.id === id))
          .filter(Boolean)
          .map(t => {
            const cat = db.categories.find(c => c.id === t.category_id);
            return { ...t, category_name: cat ? cat.name : '', category_icon: cat ? cat.icon : '' };
          });
          
        return res.json({
          reply: advisorReply.reply,
          recommended_tools: matched.slice(0, 3)
        });
      } catch (err) {
        console.error('LLM Advisor error, falling back to local heuristic:', err);
      }
    }
    
    // Fallback: Local search heuristics
    const replyData = localHeuristicAdvisor(db.tools, db.categories, message);
    return res.json(replyData);

  } catch (err) {
    console.error('Advisor error:', err);
    res.status(500).json({ error: 'Danışman yanıt veremedi.' });
  }
});

function localHeuristicAdvisor(tools, categories, message) {
  const msg = message.toLowerCase();
  
  const rules = [
    { keys: ['resim', 'görsel', 'çizim', 'tasarım', 'fotoğraf', 'photo', 'art', 'çiz'], cat: 'yaratici-ai', text: 'Görsel ve tasarım üretimi için harika araçlarımız var. İşte en popüler olanlar:' },
    { keys: ['kod', 'yazılım', 'geliştirici', 'code', 'program', 'python', 'javascript', 'html'], cat: 'yazilim-kod-ai', text: 'Kod yazma, otomatik tamamlama ve geliştirici yardımı için şu araçları önerebilirim:' },
    { keys: ['yazı', 'metin', 'yazar', 'makale', 'blog', 'text', 'write', 'copywriting'], cat: 'is-uretkenlik-ai', text: 'Yazı yazma, blog hazırlama ve metin üretimi için en çok tercih edilen araçlar şunlardır:' },
    { keys: ['ses', 'konuşma', 'müzik', 'audio', 'voice', 'sound', 'music', 'podcast'], cat: 'yaratici-ai', text: 'Seslendirme, müzik üretimi ve podcast hazırlama için popüler yapay zekalar:' },
    { keys: ['video', 'film', 'klip', 'editing', 'kurgu', 'animasyon'], cat: 'yaratici-ai', text: 'Yapay zeka ile video üretimi, montaj ve animasyon için şu alternatifleri inceleyebilirsiniz:' },
    { keys: ['asistan', 'sohbet', 'chat', 'chatbot', 'gpt', 'yardımcı'], cat: 'genel-ai-asistan', text: 'Genel sohbet, soru-cevap ve asistanlık için en gelişmiş yapay zeka modelleri şunlardır:' }
  ];

  let matchedCatId = null;
  let replyText = 'Size yardımcı olmaktan mutluluk duyarım. Belirttiğiniz konuda vitrinimizde binlerce yapay zeka aracı bulunmaktadır. İşte göz atabileceğiniz popüler araçlardan bazıları:';
  
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
    // Search tags or names directly
    matchedTools = tools.filter(t => {
      const name = t.name.toLowerCase();
      const desc = t.description.toLowerCase();
      return name.includes(msg) || desc.includes(msg);
    });
  }

  // Get top 3 tools sorted by rating/featured
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
  try {
    const { goal } = req.body;
    if (!goal || goal.trim().length < 3) {
      return res.status(400).json({ error: 'Lütfen geçerli bir iş senaryosu veya hedef girin.' });
    }

    const db = readDB();
    const settings = db.crawler_settings || {};
    
    // Fallback generator helper
    const getFallbackWorkflow = (userGoal) => {
      const g = userGoal.toLowerCase('tr-TR');
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

    if (!settings.ai_api_key) {
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
    const { name, role, raw_story, tools_used } = req.body;
    
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

    if (settings.ai_api_key && settings.ai_enabled) {
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
      approved: !!settings.auto_approve, // false by default unless auto_approve settings is true
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

module.exports = router;
