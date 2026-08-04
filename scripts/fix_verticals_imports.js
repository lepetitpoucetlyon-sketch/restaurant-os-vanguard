/**
 * fix_verticals_imports.js
 * 
 * Corrige les imports dans src/verticals/restaurant/ qui pointent encore
 * vers @modules/ alors que les fichiers ont été migrés vers @verticals/restaurant/.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VERTICALS_DIR = path.join(ROOT, 'src/verticals/restaurant');

const IMPORT_REPLACEMENTS = [
  { from: '@modules/compliance/qualite/haccp/types', to: '@verticals/restaurant/compliance/haccp/types' },
  { from: '@modules/compliance/qualite/haccp/HACCPLogService', to: '@verticals/restaurant/compliance/haccp/HACCPLogService' },
  { from: '@modules/compliance/qualite/haccp/store/complianceAtoms', to: '@verticals/restaurant/compliance/haccp/store/complianceAtoms' },
  { from: '@modules/compliance/qualite/haccp/store/qualityAtoms', to: '@verticals/restaurant/compliance/haccp/store/qualityAtoms' },
  { from: '@modules/compliance/qualite/haccp/components', to: '@verticals/restaurant/compliance/haccp/components' },
  { from: '@modules/compliance/qualite/haccp/services/HACCPTelemetryBridge', to: '@verticals/restaurant/compliance/haccp/services/HACCPTelemetryBridge' },
  { from: '@modules/compliance/qualite/haccp/services/PlanMaitriseSanitaire', to: '@verticals/restaurant/compliance/haccp/services/PlanMaitriseSanitaire' },
  { from: '@modules/compliance/qualite/haccp', to: '@verticals/restaurant/compliance/haccp' },
  { from: '@modules/ops/production/kds', to: '@verticals/restaurant/ops/kds' },
  { from: '@modules/ops/service/pos/store/posAtoms', to: '@verticals/restaurant/ops/bar/store/posAtoms' },
  { from: '@modules/ops/service/pos/store/orderAtoms', to: '@verticals/restaurant/ops/bar/store/orderAtoms' },
  { from: '@modules/ops/service/pos/components/PaymentDialog', to: '@verticals/restaurant/ops/bar/components/PaymentDialog' },
  { from: '@modules/ops/service/pos/services/ReservationService', to: '@verticals/restaurant/ops/bar/services/ReservationService' },
];

function getAllFiles(dir, ext = ['.ts', '.tsx']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, ext));
    } else if (ext.some(e => entry.name.endsWith(e))) {
      results.push(fullPath);
    }
  }
  return results;
}

let totalUpdated = 0;
let totalReplacements = 0;
const files = getAllFiles(VERTICALS_DIR);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  for (const { from, to } of IMPORT_REPLACEMENTS) {
    const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (regex.test(content)) {
      content = content.replace(regex, to);
      modified = true;
      totalReplacements++;
    }
  }
  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    totalUpdated++;
    console.log(`Updated ${path.relative(ROOT, file)}`);
  }
}

console.log(`\nDone. Updated ${totalUpdated} files with ${totalReplacements} replacements.`);
