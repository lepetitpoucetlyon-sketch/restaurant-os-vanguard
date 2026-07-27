const fs = require('fs');
const path = require('path');

const moves = {
  "modals/ProductFormModal.tsx": "modules/ops/pos/components/ProductFormModal.tsx",
  "shared/VisionScanner.tsx": "shared/components/VisionScanner.tsx",
  "system/AlertSync.tsx": "shared/components/AlertSync.tsx",
  "system/DocumentationPortal.tsx": "shared/components/DocumentationPortal.tsx",
  "system/ErrorBoundary.tsx": "shared/components/ErrorBoundary.tsx",
  "system/MigrationPlaceholder.tsx": "modules/onboarding/components/MigrationPlaceholder.tsx",
  "system/NexusServiceInitializer.tsx": "shared/components/NexusServiceInitializer.tsx",
  "system/RecipeTechnicalSheet.tsx": "modules/ops/kitchen/components/RecipeTechnicalSheet.tsx",
  "system/SovereignShield.tsx": "shared/components/SovereignShield.tsx",
  "system/TutorialBubble.tsx": "shared/components/TutorialBubble.tsx",
  "system/VoiceCommandListener.tsx": "shared/components/voice/VoiceCommandListener.tsx"
};

const dirMoves = {
  "modals/product-form": "modules/ops/pos/components/product-form",
  "widget": "modules/commerce/widgets",
  "seo": "modules/commerce/seo",
  "layout/voice": "shared/components/voice/ui",
  "shared/atomic": "shared/components/atomic"
};

const importReplacements = [
  { from: "components/modals/ProductFormModal", to: "modules/ops/pos/components/ProductFormModal" },
  { from: "components/modals/product-form", to: "modules/ops/pos/components/product-form" },
  { from: "components/widget", to: "modules/commerce/widgets" },
  { from: "components/seo", to: "modules/commerce/seo" },
  { from: "components/layout/voice", to: "shared/components/voice/ui" },
  { from: "components/shared/VisionScanner", to: "shared/components/VisionScanner" },
  { from: "components/shared/atomic", to: "shared/components/atomic" },
  { from: "components/system/AlertSync", to: "shared/components/AlertSync" },
  { from: "components/system/DocumentationPortal", to: "shared/components/DocumentationPortal" },
  { from: "components/system/ErrorBoundary", to: "shared/components/ErrorBoundary" },
  { from: "components/system/MigrationPlaceholder", to: "modules/onboarding/components/MigrationPlaceholder" },
  { from: "components/system/NexusServiceInitializer", to: "shared/components/NexusServiceInitializer" },
  { from: "components/system/RecipeTechnicalSheet", to: "modules/ops/kitchen/components/RecipeTechnicalSheet" },
  { from: "components/system/SovereignShield", to: "shared/components/SovereignShield" },
  { from: "components/system/TutorialBubble", to: "shared/components/TutorialBubble" },
  { from: "components/system/VoiceCommandListener", to: "shared/components/voice/VoiceCommandListener" }
];

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

for (const [src, dest] of Object.entries(moves)) {
  const fullSrc = path.join('src/components', src);
  const fullDest = path.join('src', dest);
  if (fs.existsSync(fullSrc)) {
    ensureDir(fullDest);
    fs.renameSync(fullSrc, fullDest);
    console.log(`Moved file: ${fullSrc} -> ${fullDest}`);
  }
}

for (const [src, dest] of Object.entries(dirMoves)) {
  const fullSrc = path.join('src/components', src);
  const fullDest = path.join('src', dest);
  if (fs.existsSync(fullSrc)) {
    if (fs.existsSync(fullDest)) {
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
  if (!fs.existsSync(dir)) return fileList;
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
    // Look for "@/components/from" and replace with "@/to"
    const regex1 = new RegExp(`@/${repl.from}\\b`, 'g');
    if (regex1.test(content)) {
      content = content.replace(regex1, `@/${repl.to}`);
      changed = true;
    }
    const regex1b = new RegExp(`@/${repl.from}/`, 'g');
    if (regex1b.test(content)) {
      content = content.replace(regex1b, `@/${repl.to}/`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated imports in ${file}`);
  }
}

console.log("Zone 3 Done.");
