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
const session = require('express-session');
const path = require('path');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Database Synchronization Middleware ───
const { syncFromMongo, readDB, writeDB } = require('./db/database');
app.use(async (req, res, next) => {
  try {
    await syncFromMongo();
  } catch (err) {
    console.error('Database sync middleware error:', err.message);
  }
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

// ─── Static Files ───
app.use(express.static(path.join(__dirname, 'public')));

// Admin login sayfası (auth gerekmez)
app.use('/admin/login.html', express.static(path.join(__dirname, 'admin', 'login.html')));
app.use('/admin/css', express.static(path.join(__dirname, 'admin', 'css')));
app.use('/admin/js', express.static(path.join(__dirname, 'admin', 'js')));

// Admin sayfaları (auth gerekli)
app.use('/admin', requireAuth, express.static(path.join(__dirname, 'admin')));

// ─── Routes ───
app.use('/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));

app.get('/alternatives', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'alternatives.html'));
});

app.get('/compare', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'compare.html'));
});

app.get('/workflows', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'workflows.html'));
});

app.get('/collection', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'collection.html'));
});

app.get('/calculator', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'calculator.html'));
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
      
      const title = `${tool.name} — Türkçe Detaylı İnceleme & Alternatifleri | AiKlavuz`;
      // Clean and trim description to be SEO safe (max 160 chars)
      const cleanDesc = (tool.description || '').replace(/"/g, '&quot;').replace(/\n/g, ' ').trim();
      const description = `${tool.name} yapay zeka aracının özellikleri, fiyatlandırması, kullanıcı yorumları, Türkçe dil desteği ve en iyi alternatif rakipleri. ${cleanDesc}`.substring(0, 160);
      
      const ogImageUrl = `https://image.thum.io/get/width/1200/crop/800/maxAge/168/${tool.url}`;
      const pageUrl = `https://aiklavuz.com/tool/${tool.id}`;
      
      // Replace generic meta tags in <head>
      htmlContent = htmlContent
        .replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`)
        .replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, `<meta name="description" content="${description}">`);
        
      // Inject Open Graph & Twitter Cards before </head>
      const seoTags = `
  <!-- Dinamik SEO & Open Graph Tags -->
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
  <meta name="twitter:image" content="${ogImageUrl}">`;
      
      htmlContent = htmlContent.replace('</head>', `${seoTags}\n</head>`);
      return res.send(htmlContent);
    }
  } catch (err) {
    console.error('Error injecting dynamic SEO tags:', err.message);
  }
  
  // Fallback to sending standard static file
  res.sendFile(path.join(__dirname, 'public', 'tool.html'));
});

app.get('/professions', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'professions.html'));
});

app.get('/asistan', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'assistant.html'));
});

app.get('/stories', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'stories.html'));
});

app.get('/prompts', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'prompts.html'));
});

app.get('/haberler', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'haberler.html'));
});

app.get('/haber-detay', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'haber-detay.html'));
});

app.get('/akademi', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'akademi.html'));
});

app.get('/iletisim', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'iletisim.html'));
});

app.get('/gizlilik-politikasi', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'gizlilik-politikasi.html'));
});

app.get('/kullanim-kosullari', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'kullanim-kosullari.html'));
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
  });
}

// Vercel serverless export
module.exports = app;

