'use strict';
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

// Varsayılan veri yapısı
const defaultData = {
  users: [],
  categories: [],
  tools: [],
  submissions: [],
  newsletter: [],
  stories: [],
  crawler_settings: {
    auto_approve: false,
    last_run: null,
    total_crawled: 0,
    ai_enabled: false,
    ai_provider: 'xai',
    ai_api_key: '',
    ai_model: 'grok-beta',
    ai_custom_endpoint: ''
  },
  crawler_logs: []
};

// Veritabanını oku
function readDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      const data = JSON.parse(raw);
      // Eksik alanları otomatik tamamla
      if (!data.submissions) data.submissions = [];
      if (!data.newsletter) data.newsletter = [];
      if (!data.stories) data.stories = [];
      if (!data.crawler_settings) {
        data.crawler_settings = {
          auto_approve: false,
          last_run: null,
          total_crawled: 0,
          ai_enabled: false,
          ai_provider: 'xai',
          ai_api_key: '',
          ai_model: 'grok-beta',
          ai_custom_endpoint: ''
        };
      } else {
        if (data.crawler_settings.ai_enabled === undefined) data.crawler_settings.ai_enabled = false;
        if (data.crawler_settings.ai_provider === undefined) data.crawler_settings.ai_provider = 'xai';
        if (data.crawler_settings.ai_api_key === undefined) data.crawler_settings.ai_api_key = '';
        if (data.crawler_settings.ai_model === undefined) data.crawler_settings.ai_model = 'grok-beta';
        if (data.crawler_settings.ai_custom_endpoint === undefined) data.crawler_settings.ai_custom_endpoint = '';
      }
      if (!data.crawler_logs) data.crawler_logs = [];
      return data;
    }
  } catch (e) {
    console.error('DB okuma hatası:', e.message);
  }
  return JSON.parse(JSON.stringify(defaultData));
}

// Veritabanına yaz
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// İlk başlatmada dosya yoksa oluştur
if (!fs.existsSync(DB_PATH)) {
  writeDB(defaultData);
}

module.exports = { readDB, writeDB, DB_PATH };
