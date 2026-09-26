'use strict';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load local .env file manually into process.env
try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '.env');
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

const express = require('express');
const compression = require('compression');
const session = require('express-session');
const path = require('path');
const { requireAuth } = require('./middleware/auth');

const app = express();
app.use(compression());
const PORT = process.env.PORT || 3000;

// ─── Database Synchronization Middleware ───
const { syncFromMongo, readDB, writeDB } = require('./db/database');

// Helper to serve HTML files with AdSense code injected server-side
function serveHtmlWithAdSense(req, res, filePath, extraHeadTags = '') {
  try {
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      let htmlContent = fs.readFileSync(filePath, 'utf8');
      const db = readDB();
      
      let headTags = extraHeadTags || '';
      const adsenseSnippet = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2978111918234260" crossorigin="anonymous"></script>';
      
      if (!htmlContent.includes('ca-pub-2978111918234260')) {
        headTags = `${adsenseSnippet}\n${headTags}`;
      } else if (db.adsense_code && !htmlContent.includes(db.adsense_code)) {
        headTags = `${db.adsense_code}\n${headTags}`;
      }
      
      if (headTags.trim()) {
        htmlContent = htmlContent.replace('</head>', `${headTags}\n</head>`);
      }
      return res.send(htmlContent);
    }
  } catch (err) {
    console.error('Error serving HTML with AdSense:', err.message);
  }
  res.sendFile(filePath);
}

// ─── Direct Route Handlers for AdSense & Crawlers ───
app.get('/ads.txt', function (req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send('google.com, pub-2978111918234260, DIRECT, f08c47fec0942fa0\n');
});

app.get('/robots.txt', function (req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send('User-agent: *\nAllow: /\n\nUser-agent: Mediapartners-Google\nAllow: /\n\nUser-agent: Googlebot\nAllow: /\n\nSitemap: https://aiklavuz.com/sitemap.xml\n');
});

// ─── Public Static Files (Registered FIRST to completely bypass MongoDB sync & sessions for assets) ───
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// ─── Database Sync Middleware (Bypasses files, favicon, manifest, sitemap, API requests, and admin panel) ───
app.use((req, res, next) => {
  if (req.path.includes('.') || 
      req.path.startsWith('/api') || 
      req.path.startsWith('/admin') || 
      req.path.startsWith('/favicon') || 
      req.path.startsWith('/manifest') || 
      req.path.startsWith('/sitemap')) {
    return next();
  }
  
  // Non-blocking background sync for HTML page requests
  syncFromMongo().catch(err => {
    console.error('Background database sync error:', err.message);
  });
  
  next();
});

// ─── Page View Tracking Middleware ───
let viewBuffer = 0;
app.use((req, res, next) => {
  if (req.method === 'GET' && 
      !req.path.startsWith('/api') && 
      !req.path.startsWith('/auth') && 
      !req.path.startsWith('/admin') &&
      !req.path.includes('.')) {
    try {
      const db = readDB();
      if (typeof db.pageViews !== 'number') {
        db.pageViews = 45280;
      }
      db.pageViews++;
      viewBuffer++;
      
      if (viewBuffer >= 10) {
        writeDB(db);
        viewBuffer = 0;
      }
    } catch (err) {
      console.error('Page view increment error:', err.message);
    }
  }
  next();
});

// ─── Middleware ───
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const sessionOptions = {
  secret: process.env.SESSION_SECRET || 'aiklavuz-gizli-anahtar-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: false }
};

if (process.env.MONGODB_URI) {
  const { MongoStore } = require('connect-mongo');
  sessionOptions.store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60 // 1 day
  });
}

app.use(session(sessionOptions));

// ─── Serve index.html dynamically to inject AdSense code server-side ───
app.get('/', function (req, res) {
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'index.html'));
});

// Admin login sayfası (auth gerekmez)
app.use('/admin/login.html', express.static(path.join(__dirname, 'admin', 'login.html')));
app.use('/admin/css', express.static(path.join(__dirname, 'admin', 'css')));
app.use('/admin/js', express.static(path.join(__dirname, 'admin', 'js')));

// Admin sayfaları (auth gerekli)
app.use('/admin', requireAuth, express.static(path.join(__dirname, 'admin')));

// ─── Routes ───
app.use('/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));

// ─── Dynamic Sitemap Generator for Google SEO ───
app.get('/sitemap.xml', function (req, res) {
  try {
    const { readDB } = require('./db/database');
    const db = readDB();
    const tools = db.tools || [];
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    const staticPages = [
      { path: '', priority: '1.0', changefreq: 'daily' },
      { path: 'alternatives', priority: '0.8', changefreq: 'daily' },
      { path: 'compare', priority: '0.8', changefreq: 'daily' },
      { path: 'workflows', priority: '0.8', changefreq: 'weekly' },
      { path: 'collection', priority: '0.8', changefreq: 'weekly' },
      { path: 'calculator', priority: '0.8', changefreq: 'weekly' },
      { path: 'professions', priority: '0.8', changefreq: 'weekly' },
      { path: 'stories', priority: '0.8', changefreq: 'daily' },
      { path: 'prompts', priority: '0.8', changefreq: 'daily' },
      { path: 'haberler', priority: '0.8', changefreq: 'daily' },
      { path: 'firsatlar', priority: '0.8', changefreq: 'weekly' },
      { path: 'akademi', priority: '0.8', changefreq: 'weekly' },
      { path: 'iletisim', priority: '0.5', changefreq: 'monthly' },
      { path: 'hakkimizda', priority: '0.5', changefreq: 'monthly' },
      { path: 'gizlilik-politikasi', priority: '0.3', changefreq: 'monthly' },
      { path: 'kullanim-kosullari', priority: '0.3', changefreq: 'monthly' }
    ];
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    staticPages.forEach(p => {
      xml += `  <url>\n`;
      xml += `    <loc>https://aiklavuz.com/${p.path}</loc>\n`;
      xml += `    <lastmod>${todayStr}</lastmod>\n`;
      xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
      xml += `    <priority>${p.priority}</priority>\n`;
      xml += `  </url>\n`;
    });
    
    tools.forEach(t => {
      if (t.id) {
        const lastmod = (t.updated_at || t.created_at || new Date().toISOString()).split('T')[0];
        xml += `  <url>\n`;
        xml += `    <loc>https://aiklavuz.com/tool/${t.id}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      }
    });

    // News & In-depth Guides Permalinks
    const news = db.news || [];
    news.forEach(n => {
      if (n.id) {
        const lastmod = (n.publishDate || todayStr);
        xml += `  <url>\n`;
        xml += `    <loc>https://aiklavuz.com/haber/${n.id}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }
    });
    
    // Categories
    const categories = db.categories || [];
    categories.forEach(c => {
      if (c.id) {
        xml += `  <url>\n`;
        xml += `    <loc>https://aiklavuz.com/category/${c.id}</loc>\n`;
        xml += `    <lastmod>${todayStr}</lastmod>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }
    });
    
    // Programmatic SEO: Generate comparisons for the top 10 most popular tools (45 permalinks)
    try {
      const popularTools = [...tools]
        .sort((a, b) => (b.votes || 0) - (a.votes || 0) || (b.rating || 0) - (a.rating || 0))
        .slice(0, 10);

      for (let i = 0; i < popularTools.length; i++) {
        for (let j = i + 1; j < popularTools.length; j++) {
          xml += `  <url>\n`;
          xml += `    <loc>https://aiklavuz.com/compare?t1=${popularTools[i].id}&amp;t2=${popularTools[j].id}</loc>\n`;
          xml += `    <lastmod>${todayStr}</lastmod>\n`;
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.6</priority>\n`;
          xml += `  </url>\n`;
        }
      }
    } catch (e) {
      console.error('Error generating comparison URLs for sitemap:', e.message);
    }
    
    xml += '</urlset>';
    
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Error generating sitemap:', err.message);
    res.status(500).end();
  }
});

app.get('/alternatives', function (req, res) {
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'alternatives.html'));
});

app.get('/compare', function (req, res) {
  const { t1, t2 } = req.query;
  const filePath = path.join(__dirname, 'public', 'compare.html');
  try {
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      let htmlContent = fs.readFileSync(filePath, 'utf8');
      
      let title = 'Yapay Zeka Araçlarını Karşılaştırın | AiKlavuz';
      let description = 'Yapay zeka araçlarının özelliklerini, puanlarını, fiyatlandırmalarını ve Türkçe dil desteklerini yan yana karşılaştırın.';
      
      if (t1 && t2) {
        const { readDB } = require('./db/database');
        const db = readDB();
        const tool1 = db.tools.find(t => t.id === t1);
        const tool2 = db.tools.find(t => t.id === t2);
        if (tool1 && tool2) {
          title = `${tool1.name} vs ${tool2.name} Karşılaştırması ve Farkları | AiKlavuz`;
          description = `${tool1.name} ile ${tool2.name} yapay zeka araçlarını yan yana karşılaştırın. Özellikler, puanlama, fiyatlandırma, Türkçe desteği ve kullanıcı yorumları arasındaki farkları inceleyin.`;
        }
      }
      
      const { readDB } = require('./db/database');
      const db = readDB();
      let headTags = '';
      if (db.adsense_code) {
        headTags = `${db.adsense_code}\n`;
      }
      
      // Inject new Title and Meta Description
      htmlContent = htmlContent.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
      htmlContent = htmlContent.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
      
      if (headTags) {
        htmlContent = htmlContent.replace('</head>', `${headTags}\n</head>`);
      }
      
      return res.send(htmlContent);
    }
  } catch (err) {
    console.error('Error serving compare with AdSense/SEO:', err.message);
  }
  res.sendFile(filePath);
});

app.get('/workflows', function (req, res) {
  const filePath = path.join(__dirname, 'public', 'workflows.html');
  try {
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      let htmlContent = fs.readFileSync(filePath, 'utf8');
      const db = readDB();

      const workflowsList = [
        {
          title: 'Sosyal Medya & İçerik Pazarlaması Akışı',
          icon: '📈',
          tag: 'Pazarlama & Sosyal Medya',
          description: 'Markanız için blog yazısı fikirleri bulmaktan, bunları podcast, sosyal medya gönderisi ve görsellere dönüştürmeye kadar olan uçtan uca yapay zeka zinciri.',
          steps: [
            { num: 1, name: 'ChatGPT veya Claude', desc: 'İçerik fikri, blog taslağı ve sosyal medya kopyaları hazırlar.' },
            { num: 2, name: 'Midjourney veya Canva AI', desc: 'Metin açıklamalarına uygun çarpıcı pazarlama görselleri üretir.' },
            { num: 3, name: 'ElevenLabs', desc: 'Hazırlanan blog metinlerini sese çevirerek profesyonel seslendirme veya podcast üretir.' },
            { num: 4, name: 'Buffer veya Hootsuite', desc: 'Oluşturulan tüm materyalleri planlayıp otomatik yayınlar.' }
          ]
        },
        {
          title: 'Hızlı Yazılım Prototipleme & Kod Akışı',
          icon: '💻',
          tag: 'Yazılım & Web Geliştirme',
          description: 'Fikrinizi dakikalar içinde çalışan bir web sitesine veya mobil arayüze dönüştürüp, kodunu yazıp analiz etme zinciri.',
          steps: [
            { num: 1, name: 'v0.dev', desc: 'Doğal dil açıklamalarıyla modern web arayüzleri (React, Tailwind) prototipler.' },
            { num: 2, name: 'Cursor IDE', desc: 'Prototiplenen kodları yerel projenize entegre edip yapay zeka yardımıyla geliştirir.' },
            { num: 3, name: 'GitHub Copilot', desc: 'Kod yazarken gerçek zamanlı satır içi tamamlamalar ve hata düzeltmeleri sunar.' },
            { num: 4, name: 'SonarCloud AI', desc: 'Geliştirilen kodun güvenlik açıklarını ve kod kalitesini otomatik denetler.' }
          ]
        },
        {
          title: 'E-Ticaret Ürün Listeleme & Satış Akışı',
          icon: '🛒',
          tag: 'E-Ticaret & Otomasyon',
          description: 'Yeni bir ürünü vitrine eklerken açıklama yazma, ürün fotoğrafını stüdyo kalitesine getirme ve bot otomasyonu kurma zinciri.',
          steps: [
            { num: 1, name: 'Jasper AI', desc: 'SEO uyumlu ve yüksek dönüşüm oranlı ürün açıklamaları yazar.' },
            { num: 2, name: 'Photoroom', desc: 'Evde çekilen ürün resimlerinin arka planını temizler ve profesyonel stüdyo ışığı ekler.' },
            { num: 3, name: 'ManyChat AI', desc: 'Instagram ve WhatsApp üzerinden gelen ürün sorularına yapay zekayla otomatik yanıt verir.' }
          ]
        },
        {
          title: 'Akademik Araştırma & Literatür Tarama Akışı',
          icon: '🔬',
          tag: 'Eğitim & Araştırma',
          description: 'Bir konu hakkında yayınlanan makaleleri bulma, özetleme ve kaynakçalandırarak akademik yazı hazırlama zinciri.',
          steps: [
            { num: 1, name: 'Consensus veya Elicit', desc: 'Bilimsel veritabanlarında sorularınıza doğrudan kanıt sunan makaleleri bulur.' },
            { num: 2, name: 'ChatPDF', desc: 'Uzun ve karmaşık bilimsel PDF dosyalarını analiz eder, sorularınızı yanıtlar ve özetler.' },
            { num: 3, name: 'Grammarly AI', desc: 'Yazılan makalenin dil bilgisi ve akademik üslup kontrollerini yapar.' }
          ]
        }
      ];

      const wfHtml = workflowsList.map(wf => `
        <div class="workflow-card visible" style="padding:28px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-lg); margin-bottom:24px;">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
            <span style="font-size:2rem;">${wf.icon}</span>
            <div>
              <h3 style="margin:0; font-size:1.25rem; font-family:'Outfit',sans-serif;">${wf.title}</h3>
              <span style="font-size:0.8rem; color:var(--accent-purple); font-weight:600;">${wf.tag}</span>
            </div>
          </div>
          <p style="color:var(--text-secondary); font-size:0.95rem; line-height:1.6; margin-bottom:20px;">${wf.description}</p>
          <div class="workflow-steps" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
            ${wf.steps.map(s => `
              <div style="padding:14px; background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:var(--radius-md);">
                <div style="font-weight:700; color:var(--accent-cyan); font-size:0.85rem; margin-bottom:4px;">Adım ${s.num}: ${s.name}</div>
                <div style="font-size:0.8rem; color:var(--text-secondary); line-height:1.5;">${s.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');

      htmlContent = htmlContent.replace(
        /<div class="workflows-grid[^"]*" id="workflows-grid">[\s\S]*?<\/div>/,
        `<div class="workflows-grid animate-on-scroll" id="workflows-grid">${wfHtml}</div>`
      );

      let headTags = '';
      const adsenseSnippet = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2978111918234260" crossorigin="anonymous"></script>';
      if (!htmlContent.includes('ca-pub-2978111918234260')) {
        headTags = `${adsenseSnippet}\n`;
      } else if (db.adsense_code && !htmlContent.includes(db.adsense_code)) {
        headTags = `${db.adsense_code}\n`;
      }
      if (headTags) {
        htmlContent = htmlContent.replace('</head>', `${headTags}\n</head>`);
      }
      return res.send(htmlContent);
    }
  } catch (e) {
    console.error('Error serving /workflows with SSR:', e.message);
  }
  serveHtmlWithAdSense(req, res, filePath);
});

app.get('/collection', function (req, res) {
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'collection.html'));
});

app.get('/calculator', function (req, res) {
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'calculator.html'));
});

// Category permalink handler
app.get(['/category/:id', '/kategori/:id'], function (req, res) {
  const catId = req.params.id;
  res.redirect(`/?category=${encodeURIComponent(catId)}#tools-section`);
});

app.get('/tool/:id', function (req, res) {
  const toolId = req.params.id;
  try {
    const db = readDB();
    const tool = db.tools.find(t => t.id === toolId);
    
    if (tool) {
      const fs = require('fs');
      const htmlPath = path.join(__dirname, 'public', 'tool.html');
      let htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Find top 3 alternatives for Programmatic SEO and pre-rendering
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
          return { ...t, score };
        })
        .filter(t => t.score > 0)
        .sort((a, b) => b.score - a.score || b.rating - a.rating)
        .slice(0, 3);
      
      const title = `${tool.name} Alternatifleri ve Benzeri Yapay Zeka Araçları | AiKlavuz`;
      // Clean and trim description to be SEO safe (max 160 chars)
      const cleanDesc = (tool.description || '').replace(/"/g, '&quot;').replace(/\n/g, ' ').trim();
      const description = `${tool.name} benzeri en iyi yapay zeka araçları ve alternatif rakipleri listesi. ${tool.name} özelliklerini, Türkçe kullanım detaylarını inceleyin.`;
      
      const ogImageUrl = `https://image.thum.io/get/width/1200/crop/800/maxAge/168/${tool.url}`;
      const pageUrl = `https://aiklavuz.com/tool/${tool.id}`;
      
      // Prepare JSON-LD Structured Data for rich search snippets
      const schemaData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": tool.name,
        "description": cleanDesc || description,
        "url": pageUrl,
        "applicationCategory": tool.category_name || "BusinessApplication",
        "operatingSystem": "All",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      };

      if (tool.rating && tool.votes) {
        schemaData.aggregateRating = {
          "@type": "AggregateRating",
          "ratingValue": tool.rating.toString(),
          "reviewCount": tool.votes.toString(),
          "bestRating": "5",
          "worstRating": "1"
        };
      }

      if (alternatives.length > 0) {
        schemaData.isSimilarTo = alternatives.map(alt => ({
          "@type": "WebApplication",
          "name": alt.name,
          "url": `https://aiklavuz.com/tool/${alt.id}`
        }));
      }
      
      // Replace generic meta tags in <head>
      htmlContent = htmlContent
        .replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`)
        .replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, `<meta name="description" content="${description}">`);
        
      // Inject Open Graph, Twitter Cards, Canonical URL, and JSON-LD before </head>
      let seoTags = `
  <!-- Dinamik SEO & Open Graph Tags -->
  <link rel="canonical" href="${pageUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:site_name" content="AiKlavuz">
  <meta property="og:locale" content="tr_TR">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${ogImageUrl}">
  
  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
  ${JSON.stringify(schemaData, null, 2)}
  </script>`;
      
      if (db.adsense_code) {
        seoTags = `${db.adsense_code}\n${seoTags}`;
      }
      
      htmlContent = htmlContent.replace('</head>', `${seoTags}\n</head>`);

      // Category & Metadata
      const cat = db.categories.find(c => c.id === tool.category_id);
      const catLabel = cat ? `${cat.icon} ${cat.name}` : (tool.category_name || 'Yapay Zeka Aracı');
      const rating = tool.rating || 4.5;
      const votes = tool.votes || 58;
      const stars = '★'.repeat(Math.round(rating));
      
      const pricingMap = { free: 'Ücretsiz', freemium: 'Freemium (Ücretsiz Başlangıç)', paid: 'Ücretli' };
      const pricingLabel = pricingMap[tool.pricing] || tool.pricing || 'Ücretsiz';
      const trSupportLabel = tool.turkish_support ? 'Tam Türkçe Desteği Mevcut' : 'Kısmi / İngilizce Arayüz';

      // Rich Editorial Description (ensures AdSense and bots see authoritative content)
      let fullDescription = tool.description || '';
      if (fullDescription.length < 200) {
        fullDescription += ` ${tool.name}, modern yapay zeka ekosisteminde kullanıcıların iş akışlarını hızlandırmak, üretkenliklerini artırmak ve operasyonel süreçlerini optimize etmek amacıyla tasarlanmış yenilikçi bir araçtır. ${catLabel} alanında sunduğu gelişmiş algoritmalar sayesinde hem bireysel kullanıcılar hem de kurumsal ekipler için pratik çözümler sağlar.`;
      }

      // Pros & Cons
      const prosList = [
        `${tool.name}, sezgisel ve modern arayüzü sayesinde hızlı öğrenme eğrisi sunar.`,
        `Kendi kategorisinde iş süreçlerini hızlandırarak önemli ölçüde zaman tasarrufu sağlar.`,
        `Gelişmiş yapay zeka mimarisi ile yüksek doğruluk ve istikrarlı performans sergiler.`
      ];
      const consList = [
        `Gelişmiş takım yönetimi ve yüksek API limitleri genellikle premium abonelik gerektirir.`,
        `Yoğun küresel trafik saatlerinde zaman zaman yanıt hızında dalgalanmalar görülebilir.`
      ];
      const prosHtml = prosList.map(p => `<li>${p}</li>`).join('');
      const consHtml = consList.map(c => `<li>${c}</li>`).join('');

      const tags = Array.isArray(tool.tags) ? tool.tags : [];
      const tagsHtml = tags.map(t => `<span class="tool-tag">#${t}</span>`).join(' ');

      // Server-side replacement of placeholders in tool.html
      htmlContent = htmlContent
        .replace('<h1 class="detail-title" id="tool-name" data-i18n="loading">Yükleniyor...</h1>', `<h1 class="detail-title" id="tool-name">${tool.name}</h1>`)
        .replace('<span id="tool-category">...</span>', `<span id="tool-category">${catLabel}</span>`)
        .replace('<span id="tool-rating-stars" style="color:var(--accent-amber);"></span>', `<span id="tool-rating-stars" style="color:var(--accent-amber);">${stars}</span>`)
        .replace('<span id="tool-rating-val">0.0</span>', `<span id="tool-rating-val">${rating}</span>`)
        .replace('<span id="tool-votes">0 oy</span>', `<span id="tool-votes">${votes} oy</span>`)
        .replace(/<p style="[^"]*" id="tool-desc" data-i18n="loading_details">[\s\S]*?<\/p>/, `<p style="font-size:1.15rem; color:var(--text-secondary); line-height:1.8; margin-bottom:30px;" id="tool-desc">${fullDescription}</p>`)
        .replace('<span class="spec-value" id="spec-pricing">...</span>', `<span class="spec-value" id="spec-pricing">${pricingLabel}</span>`)
        .replace('<span class="spec-value" id="spec-tr-support">...</span>', `<span class="spec-value" id="spec-tr-support">${trSupportLabel}</span>`)
        .replace('<div class="tool-tags" id="tool-tags-detail" style="margin-top:8px;">', `<div class="tool-tags" id="tool-tags-detail" style="margin-top:8px;">${tagsHtml}`)
        .replace('style="display: none; margin-bottom: 35px;', 'style="display: block; margin-bottom: 35px;')
        .replace('<!-- Dynamic content -->\n                </ul>', `${prosHtml}\n                </ul>`)
        .replace('<!-- Dynamic content -->\n                </ul>', `${consHtml}\n                </ul>`)
        .replace('id="vote-count-label">0<', `id="vote-count-label">${votes}<`)
        .replace('href="#" target="_blank" rel="noopener" class="btn-visit" id="btn-visit-link"', `href="${tool.url || '#'}" target="_blank" rel="noopener nofollow" class="btn-visit" id="btn-visit-link"`);

      // Pre-render alternatives cards for SEO crawling
      let altCardsHtml = '';
      if (alternatives.length > 0) {
        altCardsHtml = alternatives.map(alt => {
          const aCat = db.categories.find(c => c.id === alt.category_id);
          const aCatLabel = aCat ? `${aCat.icon} ${aCat.name}` : '';
          const aStars = '★'.repeat(Math.round(alt.rating || 4));
          const aPricingMap = { free: 'Ücretsiz', freemium: 'Freemium', paid: 'Ücretli' };
          const aPricingLabel = aPricingMap[alt.pricing] || alt.pricing || 'Ücretsiz';
          
          return `
            <div class="tool-card" data-id="${alt.id}" style="cursor:pointer" onclick="window.location.href='/tool/${alt.id}'">
              <div class="tool-card-header">
                <div class="tool-icon">${alt.name.charAt(0).toUpperCase()}</div>
                <div class="tool-info">
                  <h3 class="tool-name">${alt.name}</h3>
                  <span class="tool-category-badge">${aCatLabel}</span>
                </div>
              </div>
              <p class="tool-description">${alt.description}</p>
              <div class="tool-footer" style="margin-top:auto;">
                <div class="tool-rating">${aStars} <span>${alt.rating || '4.0'}</span></div>
                <span class="tool-pricing pricing-${alt.pricing}">${aPricingLabel}</span>
              </div>
            </div>
          `;
        }).join('');
      } else {
        altCardsHtml = `<p style="color:var(--text-muted); grid-column:1/-1;">Bu araç için benzer alternatif bulunamadı.</p>`;
      }

      htmlContent = htmlContent.replace(
        '<div class="grid-tools" id="alternatives-grid">',
        `<div class="grid-tools" id="alternatives-grid">${altCardsHtml}`
      );

      return res.send(htmlContent);
    }
  } catch (err) {
    console.error('Error injecting dynamic SEO tags:', err.message);
  }
  
  // Fallback to sending standard static file
  res.sendFile(path.join(__dirname, 'public', 'tool.html'));
});

app.get('/professions', function (req, res) {
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'professions.html'));
});

app.get('/asistan', function (req, res) {
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'assistant.html'));
});

app.get('/firsatlar', function (req, res) {
  const filePath = path.join(__dirname, 'public', 'firsatlar.html');
  try {
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      let htmlContent = fs.readFileSync(filePath, 'utf8');
      const db = readDB();
      const deals = db.deals || [];

      if (deals.length > 0) {
        const dealsHtml = deals.map(deal => {
          const firstLetter = (deal.tool_name || 'A').charAt(0).toUpperCase();
          const verifiedBadge = deal.verified ? `<span class="badge badge-featured" style="background:#10b981; color:white; font-size:0.75rem; border:none; margin-left:auto;">✓ Doğrulanmış</span>` : '';
          return `
            <div class="tool-card visible" style="display:flex; flex-direction:column; padding:24px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-lg);">
              <div class="tool-card-header" style="margin-bottom:12px; display:flex; align-items:center;">
                <div class="tool-icon" style="margin-right:12px;">${firstLetter}</div>
                <div class="tool-info" style="flex:1;">
                  <h3 class="tool-name" style="margin:0; font-size:1.15rem;">${deal.tool_name}</h3>
                  <span style="font-size:0.8rem; color:var(--accent-red); font-weight:700; background:rgba(239,68,68,0.1); padding:2px 8px; border-radius:50px; display:inline-block; margin-top:4px;">${deal.discount}</span>
                </div>
                ${verifiedBadge}
              </div>
              <p class="tool-description" style="margin-bottom:16px;">${deal.description || ''}</p>
              <div style="margin-top:auto; display:flex; flex-direction:column; gap:10px;">
                <div class="deal-code-box" style="border:2px dashed rgba(99,102,241,0.3); background:rgba(99,102,241,0.05); padding:8px 16px; border-radius:var(--radius-sm); font-family:monospace; font-size:1.05rem; font-weight:700; color:var(--accent-purple); text-align:center;">
                  ${deal.code || 'Kupon Kodu Gerekmiyor'}
                </div>
                <a href="${deal.url || '#'}" target="_blank" rel="noopener nofollow" style="padding:10px 16px; background:var(--gradient-primary); color:white; font-weight:600; border-radius:var(--radius-sm); text-decoration:none; text-align:center; font-size:0.85rem;">
                  Fırsatı Yakala &rarr;
                </a>
              </div>
            </div>
          `;
        }).join('');

        htmlContent = htmlContent.replace(
          /<div class="grid-tools" id="deals-grid">[\s\S]*?<\/div>\s*<\/div>/,
          `<div class="grid-tools" id="deals-grid">${dealsHtml}</div>`
        );
      }

      let headTags = '';
      const adsenseSnippet = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2978111918234260" crossorigin="anonymous"></script>';
      if (!htmlContent.includes('ca-pub-2978111918234260')) {
        headTags = `${adsenseSnippet}\n`;
      } else if (db.adsense_code && !htmlContent.includes(db.adsense_code)) {
        headTags = `${db.adsense_code}\n`;
      }
      if (headTags) {
        htmlContent = htmlContent.replace('</head>', `${headTags}\n</head>`);
      }
      return res.send(htmlContent);
    }
  } catch (e) {
    console.error('Error serving /firsatlar with SSR:', e.message);
  }
  serveHtmlWithAdSense(req, res, filePath);
});

app.get('/kurulum', function (req, res) {
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'kurulum.html'));
});

app.get('/stories', function (req, res) {
  const filePath = path.join(__dirname, 'public', 'stories.html');
  try {
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      let htmlContent = fs.readFileSync(filePath, 'utf8');
      const db = readDB();
      const stories = (db.stories || []).filter(s => s.approved !== false);

      let storiesHtml = '';
      if (stories.length > 0) {
        storiesHtml = stories.map(s => {
          const statsHtml = Array.isArray(s.stats) 
            ? s.stats.map(st => `<span style="background:rgba(245, 158, 11, 0.06); color:#f59e0b; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:600; margin-right:6px;">${st.value} ${st.label}</span>`).join('')
            : '';
          const toolsHtml = Array.isArray(s.tools)
            ? s.tools.map(t => `<span style="background:rgba(99, 102, 241, 0.06); color:var(--accent-purple); padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:500; margin-right:4px;">${t}</span>`).join('')
            : '';
          const cleanNick = '@' + (s.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

          return `
            <article class="story-card visible" id="${s.id}" style="padding: 24px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); margin-bottom: 20px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                <div>
                  <h3 style="margin:0 0 6px 0; font-size:1.2rem; color:var(--text-primary); font-family:'Outfit',sans-serif;">${s.title}</h3>
                  <div style="font-size:0.85rem; color:var(--text-secondary);">
                    <strong>${s.name}</strong> (${cleanNick}) • <span>${s.role || 'Girişimci'}</span>
                  </div>
                </div>
              </div>
              <div style="margin: 12px 0;">
                <p style="color:var(--text-primary); font-size:0.95rem; line-height:1.7; margin-bottom:12px;">
                  <em>"${s.quote || (s.content && s.content.solution) || ''}"</em>
                </p>
                ${s.content && s.content.challenge ? `<p style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:8px;"><strong>Zorluk:</strong> ${s.content.challenge}</p>` : ''}
                ${s.content && s.content.solution ? `<p style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:8px;"><strong>Yapay Zeka Çözümü:</strong> ${s.content.solution}</p>` : ''}
                ${s.content && s.content.result ? `<p style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:12px;"><strong>Elde Edilen Sonuç:</strong> ${s.content.result}</p>` : ''}
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; border-top:1px solid var(--border-color); padding-top:12px; margin-top:12px;">
                ${statsHtml}
                ${toolsHtml}
              </div>
            </article>
          `;
        }).join('');
      }

      if (storiesHtml) {
        htmlContent = htmlContent.replace(
          /<div class="stories-grid" id="dynamic-stories-container">[\s\S]*?<\/div>/,
          `<div class="stories-grid" id="dynamic-stories-container">${storiesHtml}</div>`
        );
      }

      let headTags = '';
      const adsenseSnippet = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2978111918234260" crossorigin="anonymous"></script>';
      if (!htmlContent.includes('ca-pub-2978111918234260')) {
        headTags = `${adsenseSnippet}\n`;
      } else if (db.adsense_code && !htmlContent.includes(db.adsense_code)) {
        headTags = `${db.adsense_code}\n`;
      }
      if (headTags) {
        htmlContent = htmlContent.replace('</head>', `${headTags}\n</head>`);
      }
      return res.send(htmlContent);
    }
  } catch (e) {
    console.error('Error serving /stories with SSR:', e.message);
  }
  serveHtmlWithAdSense(req, res, filePath);
});

app.get('/prompts', function (req, res) {
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'prompts.html'));
});

app.get('/haberler', function (req, res) {
  const filePath = path.join(__dirname, 'public', 'haberler.html');
  try {
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      let htmlContent = fs.readFileSync(filePath, 'utf8');
      const db = readDB();
      const news = db.news || [];
      
      let newsCardsHtml = '';
      if (news.length > 0) {
        newsCardsHtml = news.map(item => {
          const imgUrl = item.imageUrl || '/uploads/ads/ad_1782015572826_609.png';
          return `
            <div class="news-card" onclick="window.location.href='/haber/${item.id}'">
              <div class="news-card-img">
                <img src="${imgUrl}" alt="${item.title}">
              </div>
              <div class="news-card-body">
                <div class="news-meta">
                  <span>📅 ${item.publishDate}</span>
                  <span>👤 ${item.source || 'AiKlavuz'}</span>
                </div>
                <h3 class="news-title">${item.title}</h3>
                <p class="news-summary">${item.summary}</p>
                <div style="margin-top: auto; color: var(--accent-cyan); font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 4px;">
                  Devamını Oku 
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
              </div>
            </div>
          `;
        }).join('');
      } else {
        newsCardsHtml = '<p style="color: var(--text-secondary); text-align: center; grid-column: 1/-1;">Henüz yapay zeka haberi eklenmemiş.</p>';
      }

      htmlContent = htmlContent.replace(
        /<div class="news-grid" id="news-grid-list">[\s\S]*?<\/div>/,
        `<div class="news-grid" id="news-grid-list">${newsCardsHtml}</div>`
      );

      let headTags = '';
      const adsenseSnippet = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2978111918234260" crossorigin="anonymous"></script>';
      if (!htmlContent.includes('ca-pub-2978111918234260')) {
        headTags = `${adsenseSnippet}\n`;
      } else if (db.adsense_code && !htmlContent.includes(db.adsense_code)) {
        headTags = `${db.adsense_code}\n`;
      }
      if (headTags) {
        htmlContent = htmlContent.replace('</head>', `${headTags}\n</head>`);
      }
      return res.send(htmlContent);
    }
  } catch (e) {
    console.error('Error serving /haberler with SSR:', e.message);
  }
  serveHtmlWithAdSense(req, res, filePath);
});

function renderNewsDetail(req, res, articleId) {
  const filePath = path.join(__dirname, 'public', 'haber-detay.html');
  try {
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      let htmlContent = fs.readFileSync(filePath, 'utf8');
      const db = readDB();
      const newsList = db.news || [];
      const item = newsList.find(n => n.id === articleId);

      if (item) {
        const title = `${item.title} | AiKlavuz`;
        const description = (item.summary || '').replace(/"/g, '&quot;');
        const pageUrl = `https://aiklavuz.com/haber/${item.id}`;
        const imgUrl = item.imageUrl || 'https://aiklavuz.com/uploads/ads/ad_1782015572826_609.png';

        const schemaData = {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "headline": item.title,
          "description": item.summary,
          "datePublished": item.publishDate || "2026-06-24",
          "url": pageUrl,
          "image": [imgUrl],
          "author": {
            "@type": "Organization",
            "name": item.source || "AiKlavuz Teknoloji Editörleri"
          },
          "publisher": {
            "@type": "Organization",
            "name": "AiKlavuz",
            "url": "https://aiklavuz.com"
          }
        };

        const seoTags = `
  <link rel="canonical" href="${pageUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:image" content="${imgUrl}">
  <script type="application/ld+json">
  ${JSON.stringify(schemaData, null, 2)}
  </script>`;

        htmlContent = htmlContent
          .replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`)
          .replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, `<meta name="description" content="${description}">`)
          .replace('</head>', `${seoTags}\n</head>`);

        const articleHtml = `
          <div class="article-header">
            <h1 class="article-title">${item.title}</h1>
            <div class="article-meta">
              <span>📅 Yayın Tarihi: <strong>${item.publishDate}</strong></span>
              <span>👤 Kaynak: <strong>${item.source || 'AiKlavuz Editörleri'}</strong></span>
              ${item.sourceUrl ? `<span>🔗 <a href="${item.sourceUrl}" target="_blank" rel="noopener" style="color: var(--accent-cyan); text-decoration: none;">Kaynak Site</a></span>` : ''}
            </div>
          </div>
          <div class="article-image">
            <img src="${imgUrl}" alt="${item.title}">
          </div>
          <div class="article-content">
            ${item.content}
          </div>
          <div class="article-footer">
            <a href="/haberler" class="btn-back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transform: rotate(180deg); margin-right: 4px; vertical-align: middle;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              Haberlere Geri Dön
            </a>
            <button id="btn-share-news" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); color: var(--text-primary); padding: 10px 20px; border-radius: var(--radius-md); cursor: pointer; font-size: 0.9rem; font-weight: 500;">
              🔗 Haberi Paylaş
            </button>
          </div>
        `;

        htmlContent = htmlContent.replace(
          '<article class="article-container" id="article-view">\n      <p style="color: var(--text-secondary); text-align: center;">Haber yükleniyor...</p>\n    </article>',
          `<article class="article-container" id="article-view">${articleHtml}</article>`
        );

        let headTags = '';
        const adsenseSnippet = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2978111918234260" crossorigin="anonymous"></script>';
        if (!htmlContent.includes('ca-pub-2978111918234260')) {
          headTags = `${adsenseSnippet}\n`;
        } else if (db.adsense_code && !htmlContent.includes(db.adsense_code)) {
          headTags = `${db.adsense_code}\n`;
        }
        if (headTags) {
          htmlContent = htmlContent.replace('</head>', `${headTags}\n</head>`);
        }
        return res.send(htmlContent);
      }
    }
  } catch (e) {
    console.error('Error rendering news detail SSR:', e.message);
  }
  serveHtmlWithAdSense(req, res, filePath);
}

app.get('/haber/:id', function (req, res) {
  renderNewsDetail(req, res, req.params.id);
});

app.get('/haber-detay', function (req, res) {
  const id = req.query.id;
  if (id) {
    return renderNewsDetail(req, res, id);
  }
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'haber-detay.html'));
});

app.get('/akademi', function (req, res) {
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'akademi.html'));
});

app.get('/iletisim', function (req, res) {
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'iletisim.html'));
});

app.get('/gizlilik-politikasi', function (req, res) {
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'gizlilik-politikasi.html'));
});

app.get('/kullanim-kosullari', function (req, res) {
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'kullanim-kosullari.html'));
});

app.get('/hakkimizda', function (req, res) {
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'hakkimizda.html'));
});

// ─── Start ───
if (!process.env.VERCEL) {
  app.listen(PORT, function () {
    // Preload database from MongoDB Atlas on startup
    const { syncFromMongo } = require('./db/database');
    syncFromMongo().catch(err => {
      console.error('Database preload error on startup:', err.message);
    });

    console.log('');
    console.log('⚡ ═══════════════════════════════════════════');
    console.log('   AiKlavuz Sunucusu Çalışıyor!');
    console.log('   🌐 Site:  http://localhost:' + PORT);
    console.log('   🔧 Admin: http://localhost:' + PORT + '/admin/login.html');
    console.log('   👤 Admin: admin / admin123');
    console.log('═══════════════════════════════════════════════');
    console.log('');

    // ─── Otomatik Tarayıcı Zamanlayıcısı ───
    try {
      const { runCrawler } = require('./services/crawler');
      // Sunucu açıldıktan 15 saniye sonra ilk otomatik taramayı başlat
      setTimeout(function () {
        runCrawler().catch(function (err) {
          console.error('İlk otomatik tarama hatası:', err);
        });
      }, 15000);

      // Her 6 saatte bir çalıştır (6 * 60 * 60 * 1000 ms)
      setInterval(function () {
        runCrawler().catch(function (err) {
          console.error('Zamanlanmış otomatik tarama hatası:', err);
        });
      }, 6 * 60 * 60 * 1000);
    } catch (err) {
      console.error('Tarayıcı zamanlayıcı hatası:', err.message);
    }

    // ─── Otomatik Sosyal Medya Paylaşım Zamanlayıcısı ───
    try {
      const initSocialAutoShare = function () {
        const ONE_DAY = 24 * 60 * 60 * 1000;
        
        const runAutoShare = async function () {
          try {
            const { readDB, writeDB } = require('./db/database');
            const { addToSocialQueue, sharePost } = require('./services/social');
            
            const db = readDB();
            const tools = db.tools || [];
            if (tools.length === 0) {
              console.log('[Auto-Share] Paylaşılacak yapay zeka aracı bulunamadı.');
              return;
            }
            
            if (!db.shared_tool_ids) db.shared_tool_ids = [];
            
            let candidates = tools.filter(t => !db.shared_tool_ids.includes(t.id));
            if (candidates.length === 0) {
              db.shared_tool_ids = [];
              candidates = tools;
            }
            
            // Prioritize featured or newer tools
            candidates.sort((a, b) => (b.featured || 0) - (a.featured || 0) || (b.is_new || 0) - (a.is_new || 0));
            
            const pool = candidates.slice(0, 10);
            const selected = pool[Math.floor(Math.random() * pool.length)];
            
            if (selected) {
              console.log(`[Auto-Share] Günün seçilen yapay zeka aracı: ${selected.name}`);
              const post = addToSocialQueue(selected);
              if (post) {
                db.shared_tool_ids.push(selected.id);
                writeDB(db);
                
                console.log(`[Auto-Share] Araç kuyruğa eklendi. Sosyal medyada paylaşılıyor...`);
                const sharedPost = await sharePost(post.id);
                if (sharedPost.status === 'shared') {
                  console.log(`[Auto-Share] ${selected.name} başarıyla paylaşıldı.`);
                } else {
                  console.warn(`[Auto-Share] Paylaşım hatası:`, sharedPost.error);
                }
              }
            }
          } catch (e) {
            console.error('[Auto-Share] Otomatik paylaşım hatası:', e.message);
          }
        };

        // Sunucu açıldıktan 30 saniye sonra çalıştır, sonra her 24 saatte bir tekrarla
        setTimeout(runAutoShare, 30000);
        setInterval(runAutoShare, ONE_DAY);
      };

      initSocialAutoShare();
    } catch (err) {
      console.error('Otomatik paylaşım zamanlayıcı hatası:', err.message);
    }
  });
}

// Vercel serverless export
module.exports = app;

