const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const moves = {
  // Already moved
};

const dirMoves = {
  // "sync": "infrastructure/services/sync", // moved
  // "sovereign": "infrastructure/services/sovereign", // moved
  // "branding": "infrastructure/branding", // manually moved
  "ai": "modules/intelligence/ai",
  "rag": "modules/intelligence/rag",
  "simulator": "modules/intelligence/simulator",
  "migration": "modules/onboarding/migration",
  "documents": "modules/finance/documents",
  "reports": "modules/intelligence/reports"
};

const importReplacements = [
  // Need to run replacements for ALL moves, including the ones that already completed
  { from: "MasterBridge", to: "infrastructure/adapters/MasterBridge" },
  { from: "NexusSyncService", to: "infrastructure/services/NexusSyncService" },
  { from: "NexusTransaction", to: "infrastructure/adapters/NexusTransaction" },
  { from: "QuantumCrypto", to: "infrastructure/services/QuantumCrypto" },
  { from: "RuntimeValidator", to: "infrastructure/services/RuntimeValidator" },
  { from: "SelfHealingEngine", to: "infrastructure/services/SelfHealingEngine" },
  { from: "TimeSync", to: "infrastructure/services/TimeSync" },
  { from: "audit", to: "infrastructure/services/audit" },
  { from: "marketing-engine", to: "modules/commerce/marketing/marketing-engine" },
  { from: "quotes-service", to: "modules/commerce/quotes/quotes-service" },
  { from: "brands", to: "infrastructure/branding/brands" },
  { from: "sync", to: "infrastructure/services/sync" },
  { from: "sovereign", to: "infrastructure/services/sovereign" },
  { from: "branding", to: "infrastructure/branding" },
  { from: "ai", to: "modules/intelligence/ai" },
  { from: "rag", to: "modules/intelligence/rag" },
  { from: "simulator", to: "modules/intelligence/simulator" },
  { from: "migration", to: "modules/onboarding/migration" },
  { from: "documents", to: "modules/finance/documents" },
  { from: "reports", to: "modules/intelligence/reports" }
];

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

for (const [src, dest] of Object.entries(dirMoves)) {
  const fullSrc = path.join('src/lib', src);
  const fullDest = path.join('src', dest);
  if (fs.existsSync(fullSrc)) {
    if (fs.existsSync(fullDest)) {
       // if exists, move contents
       const files = fs.readdirSync(fullSrc);
       for (const file of files) {
           fs.renameSync(path.join(fullSrc, file), path.join(fullDest, file));
       }
       fs.rmdirSync(fullSrc);
    } else {
       ensureDir(fullDest);
       fs.renameSync(fullSrc, fullDest);
    }
    console.log(`Moved dir: ${fullSrc} -> ${fullDest}`);
  }
}

// 2. Update imports in all ts/tsx files
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === 'dist' || file === '.git') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = getAllFiles('src');

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  for (const repl of importReplacements) {
    // Look for "@/lib/from" and replace with "@/to"
    const regex1 = new RegExp(`@/lib/${repl.from}\\b`, 'g');
    if (regex1.test(content)) {
      content = content.replace(regex1, `@/${repl.to}`);
      changed = true;
    }
    const regex1b = new RegExp(`@/lib/${repl.from}/`, 'g');
    if (regex1b.test(content)) {
      content = content.replace(regex1b, `@/${repl.to}/`);
      changed = true;
    }
    
    // Also @lib/
    const regex2 = new RegExp(`@lib/${repl.from}\\b`, 'g');
    if (regex2.test(content)) {
      content = content.replace(regex2, `@/${repl.to}`);
      changed = true;
    }
  }

  // Handle generic @/lib/services/... since we moved its contents directly to infrastructure/services/
  if (content.includes('@/lib/services/')) {
    content = content.replace(/@\/lib\/services\//g, '@/infrastructure/services/');
    changed = true;
  }

  // Handle generic ../lib/
  // It's tricky to resolve absolute paths from relative ones with a regex.
  // I will check if there are many `../lib/` or `../../lib/` usage.
  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated imports in ${file}`);
  }
}

console.log("Done.");
