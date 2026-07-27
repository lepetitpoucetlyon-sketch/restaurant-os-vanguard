const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../src');

const replacements = [
  { from: /@\/engines\/ops/g, to: '@/modules/ops/providers' },
  { from: /@\/engines\/fiscal/g, to: '@/modules/finance/providers' },
  { from: /@\/engines\/fleet/g, to: '@/modules/intelligence/fleet/providers' },
  { from: /@\/engines\/core/g, to: '@/shared/providers' },
  { from: /@\/engines\/mcc/g, to: '@/shared/nexus/engines/mcc' },
  { from: /@\/engines\/Simulacra/g, to: '@/infrastructure/adapters/Simulacra' },
  { from: /@\/engines\/NexusPulseOrchestrator/g, to: '@/shared/providers/NexusPulseOrchestrator' }
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
console.log("Done updating imports for Engines.");
