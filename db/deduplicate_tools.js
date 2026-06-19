'use strict';
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

// Normalize name: lowercase, strip non-alphanumeric, strip "AI" / "Yapay Zeka" suffix/prefix
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/ai$/, '')
    .replace(/^ai/, '')
    .replace(/yapayzeka$/, '')
    .replace(/^yapayzeka/, '')
    .trim();
}

// Score a tool record to determine the best candidate to keep
function calculateScore(tool) {
  let score = 0;
  
  // Rule 1: Favor official URLs over Google Search fallbacks
  if (tool.url && tool.url.startsWith('http') && !tool.url.includes('google.com/search')) {
    score += 1000;
  }
  
  // Rule 2: Description length
  if (tool.description) {
    score += tool.description.trim().length;
  }
  
  // Rule 3: Tags count
  if (Array.isArray(tool.tags)) {
    score += tool.tags.length * 10;
  }
  
  // Rule 4: Featured gets extra points
  if (tool.featured) {
    score += 50;
  }

  // Rule 5: Shorter ID usually means it was seeded or is cleaner
  if (tool.id) {
    score -= tool.id.length * 0.1;
  }

  return score;
}

if (!fs.existsSync(DB_PATH)) {
  console.error('Database file not found at:', DB_PATH);
  process.exit(1);
}

try {
  const fileContent = fs.readFileSync(DB_PATH, 'utf8');
  const data = JSON.parse(fileContent);

  if (!Array.isArray(data.tools)) {
    console.error('No tools array found in database.');
    process.exit(1);
  }

  const initialCount = data.tools.length;
  const groups = {};

  data.tools.forEach(tool => {
    const norm = normalizeName(tool.name);
    if (!groups[norm]) {
      groups[norm] = [];
    }
    groups[norm].push(tool);
  });

  const finalTools = [];
  let duplicatesRemoved = 0;

  console.log('--- Deduplication Process Logs ---');
  for (const norm in groups) {
    if (groups.hasOwnProperty(norm)) {
      const groupList = groups[norm];
      if (groupList.length === 1) {
        finalTools.push(groupList[0]);
      } else {
        // Sort candidates by score descending
        groupList.sort((a, b) => {
          const scoreA = calculateScore(a);
          const scoreB = calculateScore(b);
          if (scoreB !== scoreA) {
            return scoreB - scoreA;
          }
          // Fallback: keep the one with shorter ID or created first
          return (a.created_at || '').localeCompare(b.created_at || '');
        });
        
        const best = groupList[0];
        finalTools.push(best);
        duplicatesRemoved += (groupList.length - 1);
        
        const removedDetails = groupList.slice(1).map(x => `${x.id} (URL: ${x.url})`);
        console.log(`Kept "${best.name}" (ID: ${best.id}, URL: ${best.url}) -> Removed: [${removedDetails.join(', ')}]`);
      }
    }
  }

  data.tools = finalTools;
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');

  console.log('\n--- Deduplication Completed ---');
  console.log(`Initial tools count: ${initialCount}`);
  console.log(`Duplicate records removed: ${duplicatesRemoved}`);
  console.log(`Final tools count: ${data.tools.length}`);

} catch (err) {
  console.error('Deduplication failed:', err);
  process.exit(1);
}
