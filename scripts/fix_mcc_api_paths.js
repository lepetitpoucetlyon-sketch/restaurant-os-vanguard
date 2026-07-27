const fs = require('fs');
const path = require('path');

const replacements = [
  { from: /\/api\/admin\/mcc\/trusted-devices/g, to: '/api/admin/fleet/trusted-devices' },
  { from: /\/api\/admin\/mcc\/support-ai/g, to: '/api/admin/fleet/support-ai' }
];

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !file.includes('node_modules')) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      
      for (const rule of replacements) {
        content = content.replace(rule.from, rule.to);
      }
      
      if (content !== originalContent) {
        console.log(`Updated API paths: ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  }
}

processDirectory(path.join(__dirname, '../src'));
console.log("Done fixing API paths.");
