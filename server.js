'use strict';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const session = require('express-session');
const path = require('path');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'yapayzekavitrini-gizli-anahtar-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: false }
}));

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

app.get('/stories', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'stories.html'));
});

// ─── Start ───
app.listen(PORT, function () {
  console.log('');
  console.log('⚡ ═══════════════════════════════════════════');
  console.log('   AIvitrin Sunucusu Çalışıyor!');
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
