'use strict';

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'Yetkilendirme gerekli.' });
  }
  return res.redirect('/admin/login.html');
}

module.exports = { requireAuth };
