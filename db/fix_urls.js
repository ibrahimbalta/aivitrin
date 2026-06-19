'use strict';
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

const mapping = {
  'chatgpt': 'https://chat.openai.com',
  'claude': 'https://claude.ai',
  'gemini': 'https://gemini.google.com',
  'perplexity': 'https://www.perplexity.ai',
  'midjourney': 'https://www.midjourney.com',
  'leonardo ai': 'https://leonardo.ai',
  'runway': 'https://runwayml.com',
  'copilot': 'https://copilot.microsoft.com',
  'microsoft copilot': 'https://copilot.microsoft.com',
  'dall-e': 'https://openai.com/dall-e-3',
  'flux': 'https://flux.ai',
  'stable diffusion': 'https://stability.ai',
  'canva': 'https://www.canva.com',
  'elevenlabs': 'https://elevenlabs.io',
  'suno': 'https://suno.com',
  'udio': 'https://www.udio.com',
  'viggle': 'https://viggle.ai',
  'luma dream machine': 'https://lumalabs.ai/dream-machine',
  'clipdrop': 'https://clipdrop.co',
  'photoroom': 'https://www.photoroom.com',
  'pixlr': 'https://pixlr.com',
  'fotor': 'https://www.fotor.com',
  'dreamstudio': 'https://dreamstudio.ai',
  'nightcafe': 'https://creator.nightcafe.studio',
  'artbreeder': 'https://www.artbreeder.com',
  'playground ai': 'https://playground.com',
  'lexica': 'https://lexica.art',
  'kaiber': 'https://kaiber.ai',
  'adobe firefly': 'https://firefly.adobe.com',
  'ideogram': 'https://ideogram.ai',
  'pika': 'https://pika.art'
};

function fixUrl(name, url) {
  if (!url) {
    url = '';
  }
  url = url.trim();
  name = (name || '').trim();

  // If already starts with http:// or https://, it's valid
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // If it's a domain name (contains a dot, no spaces)
  if (url && url.includes('.') && !url.includes(' ')) {
    return 'https://' + url;
  }

  // Check mapping (case-insensitive)
  const nameLower = name.toLowerCase();
  for (const [key, value] of Object.entries(mapping)) {
    if (nameLower === key || nameLower.includes(key)) {
      return value;
    }
  }

  // Fallback to Google search
  return `https://www.google.com/search?q=${encodeURIComponent(name)}+AI`;
}

if (!fs.existsSync(DB_PATH)) {
  console.error('Database file not found at:', DB_PATH);
  process.exit(1);
}

try {
  const fileContent = fs.readFileSync(DB_PATH, 'utf8');
  const data = JSON.parse(fileContent);

  let toolsFixed = 0;
  let submissionsFixed = 0;

  if (Array.isArray(data.tools)) {
    data.tools.forEach(tool => {
      const originalUrl = tool.url;
      const fixed = fixUrl(tool.name, tool.url);
      if (originalUrl !== fixed) {
        tool.url = fixed;
        toolsFixed++;
      }
    });
  }

  if (Array.isArray(data.submissions)) {
    data.submissions.forEach(sub => {
      const originalUrl = sub.url;
      const fixed = fixUrl(sub.name, sub.url);
      if (originalUrl !== fixed) {
        sub.url = fixed;
        submissionsFixed++;
      }
    });
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');

  console.log(`Successfully completed migration!`);
  console.log(`Fixed ${toolsFixed} tools URLs.`);
  console.log(`Fixed ${submissionsFixed} submissions URLs.`);

} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
}
