const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../src');

const replacements = [
  { from: /@\/components\/inventory/g, to: '@/modules/logistics/inventory/components' },
  { from: /@\/components\/migration/g, to: '@/lib/migration' },
  { from: /@\/components\/a11y/g, to: '@/shared/utils/a11y' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      
      for (const rule of replacements) {
        content = content.replace(rule.from, rule.to);
      }
      
      if (content !== originalContent) {
        console.log(`Updated: ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  }
}

processDirectory(directoryPath);
console.log("Done updating imports for Phase 6.");
