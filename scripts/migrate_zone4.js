const fs = require('fs');
const path = require('path');

const moves = {
  "simulatorAtoms.ts": "modules/intelligence/simulator/store/simulatorAtoms.ts",
  "tutorialAtoms.ts": "shared/store/tutorialAtoms.ts",
  "languageAtoms.ts": "shared/store/languageAtoms.ts"
};

const importReplacements = [
  { from: "store/simulatorAtoms", to: "modules/intelligence/simulator/store/simulatorAtoms" },
  { from: "store/tutorialAtoms", to: "shared/store/tutorialAtoms" },
  { from: "store/languageAtoms", to: "shared/store/languageAtoms" }
];

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

for (const [src, dest] of Object.entries(moves)) {
  const fullSrc = path.join('src/store', src);
  const fullDest = path.join('src', dest);
  if (fs.existsSync(fullSrc)) {
    ensureDir(fullDest);
    fs.renameSync(fullSrc, fullDest);
    console.log(`Moved file: ${fullSrc} -> ${fullDest}`);
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
    // Look for "@/store/from" and replace with "@/to"
    const regex1 = new RegExp(`@/store/${repl.from.replace('store/', '')}\\b`, 'g');
    if (regex1.test(content)) {
      content = content.replace(regex1, `@/${repl.to}`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated imports in ${file}`);
  }
}

console.log("Zone 4 Done.");
