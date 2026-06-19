const fs = require('fs');
const readline = require('readline');

async function findStart() {
  const logPath = 'C:\\Users\\A\\.gemini\\antigravity\\brain\\6ceb7ce6-8a77-422b-9fb3-4b5959beabb0\\.system_generated\\logs\\transcript_full.jsonl';
  if (!fs.existsSync(logPath)) {
    console.error('Log file does not exist at:', logPath);
    return;
  }

  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.step_index === 195) {
        console.log(`=== MODEL RESPONSE STEP 195 ===`);
        console.log(obj.content);
        console.log('=============================================\n');
        break;
      }
    } catch (e) {
      // ignore
    }
  }
}

findStart();
