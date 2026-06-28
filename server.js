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
      if (db.adsense_code) {
        headTags = `${db.adsense_code}\n${headTags}`;
      }
      
      if (headTags) {
        htmlContent = htmlContent.replace('</head>', `${headTags}\n</head>`);
      }
      return res.send(htmlContent);
    }
  } catch (err) {
    console.error('Error serving HTML with AdSense:', err.message);
  }
  res.sendFile(filePath);
}

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
      { path: 'akademi', priority: '0.8', changefreq: 'weekly' },
      { path: 'iletisim', priority: '0.5', changefreq: 'monthly' }
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
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'workflows.html'));
});

app.get('/collection', function (req, res) {
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'collection.html'));
});

app.get('/calculator', function (req, res) {
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'calculator.html'));
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

      // Pre-render alternatives cards for SEO crawling
      let altCardsHtml = '';
      if (alternatives.length > 0) {
        altCardsHtml = alternatives.map(alt => {
          const cat = db.categories.find(c => c.id === alt.category_id);
          const catLabel = cat ? `${cat.icon} ${cat.name}` : '';
          const stars = '★'.repeat(Math.round(alt.rating || 4));
          const pricingMap = { free: 'Ücretsiz', freemium: 'Freemium', paid: 'Ücretli' };
          const pricingLabel = pricingMap[alt.pricing] || alt.pricing || 'Ücretsiz';
          
          return `
            <div class="tool-card" data-id="${alt.id}" style="cursor:pointer" onclick="window.location.href='/tool/${alt.id}'">
              <div class="tool-card-header">
                <div class="tool-icon">${alt.name.charAt(0).toUpperCase()}</div>
                <div class="tool-info">
                  <h3 class="tool-name">${alt.name}</h3>
                  <span class="tool-category-badge">${catLabel}</span>
                </div>
              </div>
              <p class="tool-description">${alt.description}</p>
              <div class="tool-footer" style="margin-top:auto;">
                <div class="tool-rating">${stars} <span>${alt.rating || '4.0'}</span></div>
                <span class="tool-pricing pricing-${alt.pricing}">${pricingLabel}</span>
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
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'firsatlar.html'));
});

app.get('/stories', function (req, res) {
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'stories.html'));
});

app.get('/prompts', function (req, res) {
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'prompts.html'));
});

app.get('/haberler', function (req, res) {
  serveHtmlWithAdSense(req, res, path.join(__dirname, 'public', 'haberler.html'));
});

app.get('/haber-detay', function (req, res) {
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

