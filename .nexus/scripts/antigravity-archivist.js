const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const WISDOM_PATH = path.join(REPO_ROOT, '.antigravity/intelligence/lessons.json');

function archive(key, value, context) {
  if (!fs.existsSync(WISDOM_PATH)) {
    fs.mkdirSync(path.dirname(WISDOM_PATH), { recursive: true });
    fs.writeFileSync(WISDOM_PATH, JSON.stringify({ wisdom: [] }, null, 2));
  }

  const wisdom = JSON.parse(fs.readFileSync(WISDOM_PATH, 'utf8'));
  
  wisdom.wisdom.push({
    key,
    value,
    context,
    timestamp: new Date().toISOString()
  });

  fs.writeFileSync(WISDOM_PATH, JSON.stringify(wisdom, null, 2));
  console.log(`✅ Wisdom Archived: ${key}`);
}

const args = process.argv.slice(2);
const keyArg = args.indexOf('--key');
const valueArg = args.indexOf('--value');
const contextArg = args.indexOf('--context');

if (keyArg === -1 || valueArg === -1) {
  console.error('Usage: node scripts/antigravity-archivist.js --key <key> --value <value> [--context <context>]');
  process.exit(1);
}

const key = args[keyArg + 1];
const value = args[valueArg + 1];
const context = contextArg !== -1 ? args[contextArg + 1] : 'Manual insight capture.';

archive(key, value, context);
