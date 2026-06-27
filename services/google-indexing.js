const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Load Google Service Account credentials
let credentials = null;
const credPath = path.join(__dirname, '..', 'google-services.json');

try {
  if (fs.existsSync(credPath)) {
    credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    console.log('Google Indexing API: Loaded credentials from google-services.json');
  } else if (process.env.GOOGLE_SEO_KEY) {
    credentials = JSON.parse(process.env.GOOGLE_SEO_KEY);
    console.log('Google Indexing API: Loaded credentials from environment variable GOOGLE_SEO_KEY');
  }
} catch (e) {
  console.error('Google Indexing API: Error loading credentials:', e.message);
}

// Helper to base64url encode
function base64url(str, encoding = 'utf8') {
  return Buffer.from(str, encoding)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Generate Google Auth Access Token using native crypto JWT signing
function getAccessToken() {
  return new Promise((resolve, reject) => {
    if (!credentials) {
      return reject(new Error('Google credentials not configured. Please add google-services.json or GOOGLE_SEO_KEY.'));
    }

    const header = JSON.stringify({ alg: 'RS256', typ: 'JWT' });
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;

    const payload = JSON.stringify({
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      exp: exp,
      iat: iat
    });

    const headerBase64 = base64url(header);
    const payloadBase64 = base64url(payload);
    const signatureInput = `${headerBase64}.${payloadBase64}`;

    try {
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(signatureInput);
      const signature = base64url(sign.sign(credentials.private_key), 'binary');
      const jwt = `${signatureInput}.${signature}`;

      // POST to OAuth2 token server
      const postData = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`;
      
      const req = https.request({
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.access_token) {
              resolve(data.access_token);
            } else {
              reject(new Error(`OAuth failed: ${body}`));
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Pings Google Indexing API with a URL
 * @param {string} url The page URL to index (must be https://aiklavuz.com/...)
 * @param {string} type Notification type: 'URL_UPDATED' or 'URL_DELETED'
 * @returns {Promise<object>} Response data
 */
async function pingGoogleIndexing(url, type = 'URL_UPDATED') {
  if (!credentials) {
    console.warn('Google Indexing API: Credentials missing. Skipping ping for:', url);
    return { success: false, error: 'Kimlik doğrulama anahtarı (google-services.json) bulunamadı.' };
  }

  try {
    const token = await getAccessToken();

    const postData = JSON.stringify({
      url: url,
      type: type
    });

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'indexing.googleapis.com',
        path: '/v3/urlNotifications:publish',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode === 200) {
              console.log(`Google Indexing API: Success pinging ${url} (${type})`);
              resolve({ success: true, data });
            } else {
              console.error(`Google Indexing API Error for ${url}:`, body);
              resolve({ success: false, error: data.error ? data.error.message : body });
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  } catch (err) {
    console.error(`Google Indexing API Token error:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  pingGoogleIndexing
};
