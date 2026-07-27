const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../src');

const replacements = [
  // components
  { from: /@\/components\/finance/g, to: '@/modules/finance/components' },
  { from: /@\/components\/staff/g, to: '@/modules/human/hr/components' },
  { from: /@\/components\/mcc/g, to: '@/shared/nexus/guards/admin/mcc/components' },
  { from: /@\/components\/compliance/g, to: '@/modules/compliance/components' },
  
  // lib infra
  { from: /@\/lib\/cash-drawer/g, to: '@/infrastructure/hardware/cash-drawer' },
  { from: /@\/lib\/payment-terminal/g, to: '@/infrastructure/hardware/payment-terminal' },
  { from: /@\/lib\/backup/g, to: '@/infrastructure/services/backup' },
  { from: /@\/lib\/telemetry/g, to: '@/infrastructure/services/telemetry' },
  { from: /@\/lib\/rate-limiter/g, to: '@/infrastructure/services/rate-limiter' },
  { from: /@\/lib\/offline/g, to: '@/infrastructure/services/offline' },
  { from: /@\/lib\/storage/g, to: '@/infrastructure/services/storage' },
  { from: /@\/lib\/motion/g, to: '@/shared/utils/motion' },
  { from: /@\/lib\/a11y/g, to: '@/shared/utils/a11y' },
  
  // lib metier
  { from: /@\/lib\/payroll/g, to: '@/modules/human/payroll' },
  { from: /@\/lib\/billing/g, to: '@/modules/finance/billing' },

  // domain
  { from: /@\/domain\/human\/hr/g, to: '@/modules/human/domain/hr' },
  { from: /@\/domain\/procurement/g, to: '@/modules/logistics/domain/procurement' },
  { from: /@\/domain\/agent/g, to: '@/modules/intelligence/domain/agent' },
  { from: /@\/domain\/agency/g, to: '@/modules/intelligence/domain/agency' }
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
console.log("Done updating imports.");
