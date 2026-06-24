'use strict';

const crypto = require('crypto');
const { readDB, writeDB } = require('../db/database');

// OAuth 1.0a Signature Generator for Twitter (X) API v2
function generateTwitterOAuthHeader(method, url, consumerKey, consumerSecret, token, tokenSecret) {
  const nonce = crypto.randomBytes(32).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: token,
    oauth_version: '1.0'
  };

  // Sort parameters
  const sortedParams = {};
  Object.keys(oauthParams).sort().forEach(key => {
    sortedParams[key] = oauthParams[key];
  });

  // Construct parameter string
  const paramString = Object.keys(sortedParams).map(key => {
    return encodeURIComponent(key) + '=' + encodeURIComponent(sortedParams[key]);
  }).join('&');

  // Signature base string
  const baseString = method.toUpperCase() + '&' + encodeURIComponent(url) + '&' + encodeURIComponent(paramString);

  // Signing key
  const signingKey = encodeURIComponent(consumerSecret) + '&' + encodeURIComponent(tokenSecret || '');

  // Generate signature
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

  oauthParams.oauth_signature = signature;

  // Header string
  const headerParts = Object.keys(oauthParams)
    .filter(key => key.startsWith('oauth_'))
    .map(key => encodeURIComponent(key) + '="' + encodeURIComponent(oauthParams[key]) + '"');

  return 'OAuth ' + headerParts.join(', ');
}

// Generate the social post draft for a new tool
function generatePostText(tool, categoryName) {
  const hashtags = [
    'yapayzeka',
    'ai',
    'aiklavuz',
    tool.made_in_turkey ? 'yerliteknoloji' : null,
    categoryName ? categoryName.toLowerCase().replace(/\s+/g, '') : null
  ].filter(Boolean).map(t => `#${t}`).join(' ');

  const summary = tool.description ? tool.description.substring(0, 140) + (tool.description.length > 140 ? '...' : '') : '';

  return `🚀 AiKlavuz'da yeni bir yapay zeka aracı listelendi: ${tool.name}!

💡 ${summary}

👉 Detaylar, alternatifleri ve Türkçe incelemesi için tıklayın:
https://aiklavuz.com/tool/${tool.id}

${hashtags}`;
}

// Add a tool to the social sharing queue
function addToSocialQueue(tool) {
  try {
    const db = readDB();
    if (!db.social_queue) db.social_queue = [];

    // Find category label
    const cat = db.categories.find(c => c.id === tool.category_id);
    const catLabel = cat ? cat.name : '';

    const text = generatePostText(tool, catLabel);
    const newPost = {
      id: 'post-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      tool_id: tool.id,
      tool_name: tool.name,
      text: text,
      status: 'pending', // 'pending' | 'shared' | 'failed'
      error: null,
      share_platforms: {
        twitter: { status: 'pending', error: null },
        linkedin: { status: 'pending', error: null }
      },
      created_at: new Date().toISOString()
    };

    db.social_queue.unshift(newPost); // Most recent at the beginning
    writeDB(db);
    return newPost;
  } catch (err) {
    console.error('[Social Service] Failed to add to queue:', err.message);
    return null;
  }
}

// Share a post from the queue automatically
async function sharePost(postId) {
  const db = readDB();
  if (!db.social_queue) db.social_queue = [];
  
  const idx = db.social_queue.findIndex(p => p.id === postId);
  if (idx === -1) throw new Error('Post bulunamadı.');

  const post = db.social_queue[idx];
  const tool = db.tools.find(t => t.id === post.tool_id) || { name: post.tool_name, url: 'https://aiklavuz.com' };

  let twitterShared = false;
  let linkedinShared = false;
  let twitterError = null;
  let linkedinError = null;

  // 1. Twitter Share
  const hasTwitterCreds = 
    process.env.TWITTER_API_KEY && 
    process.env.TWITTER_API_SECRET && 
    process.env.TWITTER_ACCESS_TOKEN && 
    process.env.TWITTER_ACCESS_SECRET;

  if (hasTwitterCreds) {
    try {
      const url = 'https://api.twitter.com/2/tweets';
      const authHeader = generateTwitterOAuthHeader(
        'POST',
        url,
        process.env.TWITTER_API_KEY,
        process.env.TWITTER_API_SECRET,
        process.env.TWITTER_ACCESS_TOKEN,
        process.env.TWITTER_ACCESS_SECRET
      );

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: post.text })
      });

      const data = await res.json();
      if (res.ok && data.data && data.data.id) {
        twitterShared = true;
        console.log('[Social Service] Successfully posted tweet:', data.data.id);
      } else {
        twitterError = data.errors ? data.errors[0].message : (data.detail || 'Twitter API Hatası');
        console.error('[Social Service] Twitter post failed:', twitterError);
      }
    } catch (e) {
      twitterError = e.message;
      console.error('[Social Service] Twitter request error:', e.message);
    }
  } else {
    twitterError = 'API anahtarları eksik (.env dosyasını kontrol edin)';
  }

  // 2. LinkedIn Share
  const hasLinkedinCreds = !!process.env.LINKEDIN_ACCESS_TOKEN;
  if (hasLinkedinCreds) {
    try {
      const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
      
      // Get Person ID (Me)
      const meRes = await fetch('https://api.linkedin.com/v2/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (!meRes.ok) {
        throw new Error('LinkedIn profil ID alınamadı (Token geçersiz olabilir).');
      }
      
      const meData = await meRes.json();
      const personId = meData.id;

      const url = 'https://api.linkedin.com/v2/ugcPosts';
      const body = {
        author: `urn:li:person:${personId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: post.text
            },
            shareMediaCategory: 'ARTICLE',
            media: [
              {
                status: 'READY',
                description: {
                  text: tool.description || post.tool_name
                },
                originalUrl: `https://aiklavuz.com/tool/${post.tool_id}`,
                title: {
                  text: `${post.tool_name} — Yapay Zeka Aracı`
                }
              }
            ]
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        linkedinShared = true;
        console.log('[Social Service] Successfully shared on LinkedIn');
      } else {
        linkedinError = data.message || 'LinkedIn API Hatası';
        console.error('[Social Service] LinkedIn share failed:', linkedinError);
      }
    } catch (e) {
      linkedinError = e.message;
      console.error('[Social Service] LinkedIn request error:', e.message);
    }
  } else {
    linkedinError = 'Access Token eksik (.env dosyasını kontrol edin)';
  }

  // Update status in the database
  post.share_platforms.twitter.status = twitterShared ? 'shared' : 'failed';
  post.share_platforms.twitter.error = twitterError;
  post.share_platforms.linkedin.status = linkedinShared ? 'shared' : 'failed';
  post.share_platforms.linkedin.error = linkedinError;

  if (twitterShared || linkedinShared) {
    post.status = 'shared';
    post.error = null;
  } else {
    post.status = 'failed';
    post.error = `Twitter: ${twitterError || 'Tamamlandı'} | LinkedIn: ${linkedinError || 'Tamamlandı'}`;
  }

  db.social_queue[idx] = post;
  writeDB(db);

  return post;
}

module.exports = {
  addToSocialQueue,
  sharePost
};
