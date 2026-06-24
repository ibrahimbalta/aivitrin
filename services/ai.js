'use strict';
const https = require('https');

/**
 * OpenAI-compatible LLM completion caller.
 * Works with xAI (Grok), OpenAI, OpenRouter, and custom endpoints.
 */
function callLLM(systemPrompt, userPrompt, settings) {
  return new Promise((resolve, reject) => {
    let { ai_provider, ai_api_key, ai_model, ai_custom_endpoint } = settings;

    // Load local .env if it exists
    const fs = require('fs');
    const pathModule = require('path');
    const envPath = pathModule.join(__dirname, '../.env');
    let envVars = {};
    if (fs.existsSync(envPath)) {
      try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split(/\r?\n/).forEach(line => {
          const parts = line.split('=');
          if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim();
            envVars[key] = val;
          }
        });
      } catch (e) {
        console.error('Error reading .env file:', e.message);
      }
    }

    const keyFromEnv = envVars.AI_API_KEY || envVars.GROQ_API_KEY || process.env.AI_API_KEY || process.env.GROQ_API_KEY;
    const providerFromEnv = envVars.AI_PROVIDER || process.env.AI_PROVIDER;
    const modelFromEnv = envVars.AI_MODEL || process.env.AI_MODEL;

    if (!ai_api_key && keyFromEnv) {
      ai_api_key = keyFromEnv;
    }
    if (!ai_provider && providerFromEnv) {
      ai_provider = providerFromEnv;
    }
    if (!ai_model && modelFromEnv) {
      ai_model = modelFromEnv;
    }

    if (!ai_api_key) {
      return reject(new Error('API Anahtarı bulunamadı. Lütfen ayarlardan kaydedin.'));
    }

    let host = 'api.x.ai';
    let path = '/v1/chat/completions';
    
    if (ai_provider === 'openai') {
      host = 'api.openai.com';
      path = '/v1/chat/completions';
    } else if (ai_provider === 'gemini') {
      host = 'generativelanguage.googleapis.com';
      path = '/v1beta/openai/chat/completions';
    } else if (ai_provider === 'groq') {
      host = 'api.groq.com';
      path = '/openai/v1/chat/completions';
    } else if (ai_provider === 'openrouter') {
      host = 'openrouter.ai';
      path = '/api/v1/chat/completions';
    } else if (ai_provider === 'custom' && ai_custom_endpoint) {
      try {
        // Parse custom endpoint URL
        let cleanEndpoint = ai_custom_endpoint.trim();
        if (!cleanEndpoint.startsWith('http://') && !cleanEndpoint.startsWith('https://')) {
          cleanEndpoint = 'https://' + cleanEndpoint;
        }
        const url = new URL(cleanEndpoint);
        host = url.host;
        path = url.pathname;
        if (path === '/') {
          path = '/v1/chat/completions';
        } else if (!path.endsWith('/chat/completions')) {
          path = path + (path.endsWith('/') ? '' : '/') + 'chat/completions';
        }
      } catch (e) {
        return reject(new Error('Geçersiz özel endpoint URL\'i.'));
      }
    }

    let modelName = ai_model;
    if (!modelName) {
      if (ai_provider === 'gemini') {
        modelName = 'gemini-2.5-flash';
      } else if (ai_provider === 'openai') {
        modelName = 'gpt-4o-mini';
      } else if (ai_provider === 'groq') {
        modelName = 'llama-3.3-70b-versatile';
      } else {
        modelName = 'grok-2';
      }
    }

    const postDataObj = {
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2
    };

    if (settings.jsonMode !== false) {
      postDataObj.response_format = { type: 'json_object' };
    }

    const postData = JSON.stringify(postDataObj);

    const options = {
      hostname: host,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ai_api_key}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    // OpenRouter and some custom APIs require extra headers
    if (ai_provider === 'openrouter') {
      options.headers['HTTP-Referer'] = 'https://aiklavuz.com';
      options.headers['X-Title'] = 'AiKlavuz';
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          try {
            const errObj = JSON.parse(data);
            return reject(new Error(`API Hatası (HTTP ${res.statusCode}): ${errObj.error?.message || data}`));
          } catch(e) {
            return reject(new Error(`API Hatası (HTTP ${res.statusCode}): ${data}`));
          }
        }
        try {
          const responseJson = JSON.parse(data);
          if (responseJson.choices && responseJson.choices.length > 0) {
            const content = responseJson.choices[0].message.content.trim();
            resolve(content);
          } else {
            reject(new Error('Yapay zekadan boş yanıt alındı.'));
          }
        } catch (err) {
          reject(new Error('Yapay zeka yanıtı çözümlenemedi: ' + err.message));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    // Timeout configurations
    req.setTimeout(60000, () => {
      req.destroy(new Error('Yapay zeka API bağlantısı zaman aşımına uğradı.'));
    });

    req.write(postData);
    req.end();
  });
}

module.exports = { callLLM };
