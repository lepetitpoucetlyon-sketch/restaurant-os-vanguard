const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../src');

const replacements = [
  { from: /@\/modules\/intelligence\/agency\/types/g, to: '@/modules/intelligence/domain/agency/types' },
  { from: /@\/modules\/intelligence\/agency\/Zeus/g, to: '@/modules/intelligence/domain/agency/Zeus' },
  { from: /@\/modules\/intelligence\/agency\/useExpert/g, to: '@/modules/intelligence/domain/agency/useExpert' },
  { from: /@\/modules\/intelligence\/tools\/types/g, to: '@/modules/intelligence/domain/agent/tools/types' }
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
console.log("Done updating imports for Phase A.");
