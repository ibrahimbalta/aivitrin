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
const { syncFromMongo } = require('./db/database');
app.use(async (req, res, next) => {
  try {
    await syncFromMongo();
  } catch (err) {
    console.error('Database sync middleware error:', err.message);
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

