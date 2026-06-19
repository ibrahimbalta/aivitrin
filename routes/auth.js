'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const { readDB } = require('../db/database');

const router = express.Router();

// POST /auth/login
router.post('/login', function (req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Kullanıcı adı ve şifre gerekli.' });
    }
    const db = readDB();
    const user = db.users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Kullanıcı bulunamadı.' });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, message: 'Şifre hatalı.' });
    }
    req.session.userId = user.id;
    req.session.username = user.username;
    return res.json({ success: true, message: 'Giriş başarılı.' });
  } catch (err) {
    console.error('Login hatası:', err);
    return res.status(500).json({ success: false, message: 'Sunucu hatası.' });
  }
});

// POST /auth/register
router.post('/register', function (req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Kullanıcı adı ve şifre gerekli.' });
    }
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ success: false, message: 'Kullanıcı adı en az 3 karakter olmalıdır.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Şifre en az 6 karakter olmalıdır.' });
    }

    const { writeDB } = require('../db/database');
    const db = readDB();
    
    // Check if user exists
    const exists = db.users.find(u => u.username.toLowerCase() === cleanUsername);
    if (exists) {
      return res.status(409).json({ success: false, message: 'Bu kullanıcı adı zaten alınmış.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    
    const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    
    const newUser = {
      id: newId,
      username: cleanUsername,
      password: hashedPassword,
      created_at: new Date().toISOString()
    };
    
    db.users.push(newUser);
    writeDB(db);

    // Auto-login
    req.session.userId = newUser.id;
    req.session.username = newUser.username;

    return res.status(201).json({ success: true, message: 'Kayıt başarılı.', username: newUser.username });
  } catch (err) {
    console.error('Register hatası:', err);
    return res.status(500).json({ success: false, message: 'Sunucu hatası.' });
  }
});

// POST /auth/logout
router.post('/logout', function (req, res) {
  req.session.destroy(function (err) {
    if (err) return res.status(500).json({ success: false, message: 'Çıkış yapılamadı.' });
    res.clearCookie('connect.sid');
    return res.json({ success: true, message: 'Çıkış yapıldı.' });
  });
});

// GET /auth/check
router.get('/check', function (req, res) {
  if (req.session && req.session.userId) {
    return res.json({ authenticated: true, username: req.session.username });
  }
  return res.json({ authenticated: false });
});

module.exports = router;
