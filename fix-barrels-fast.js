const fs = require('fs');
const cp = require('child_process');
const path = require('path');

// 1. Get all files with barrel imports
const grepCmd = `grep -rl "from '@/modules/" src | grep -v fix-barrels-fast.js`;
const files = cp.execSync(grepCmd, { encoding: 'utf8' }).split('\n').filter(Boolean);

// 2. Build symbol map by parsing all exports in src/modules
// (This is a simplified AST approach using regex to find where symbols are exported)
// To do this reliably, it's better to just use ts-morph but limit it strictly to simple re-exports.
// Actually, let's just use ripgrep to build a map of `export const X`, `export function X`, `export class X`, `export type X`, `export interface X`
const symbolMap = new Map();

console.log("Building export map...");
const exportsRaw = cp.execSync(`rg "^\\s*export\\s+(const|let|var|function|class|type|interface|enum)\\s+([a-zA-Z0-9_]+)" src/modules --no-heading --line-number`, { encoding: 'utf8' });

for (const line of exportsRaw.split('\n')) {
   const match = line.match(/(src\/modules\/.*?):.*?export\s+(const|let|var|function|class|type|interface|enum)\s+([a-zA-Z0-9_]+)/);
   if (match) {
      const filePath = match[1];
      const symbol = match[3];
      if (!filePath.endsWith('index.ts') && !filePath.endsWith('index.tsx')) {
         const importPath = '@/' + filePath.replace(/\.tsx?$/, '');
         symbolMap.set(symbol, importPath);
      }
   }
}

// Also handle export { X } from './X'
const reexportsRaw = cp.execSync(`rg "^\\s*export\\s+\\{\\s*([a-zA-Z0-9_,\\s]+)\\s*\\}" src/modules --no-heading`, { encoding: 'utf8' });
for (const line of reexportsRaw.split('\n')) {
   const match = line.match(/(src\/modules\/.*?):.*?export\s+\{(.*?)\}/);
   if (match) {
       const filePath = match[1];
       if (filePath.endsWith('index.ts') || filePath.endsWith('index.tsx')) continue;
       const symbols = match[2].split(',').map(s => s.trim()).filter(Boolean);
       const importPath = '@/' + filePath.replace(/\.tsx?$/, '');
       for (const sym of symbols) {
           const cleanSym = sym.split(' as ')[0].trim();
           const alias = sym.split(' as ')[1]?.trim() || cleanSym;
           symbolMap.set(alias, importPath);
       }
   }
}

console.log(`Found ${symbolMap.size} symbols.`);

// 3. Replace barrel imports
let fixCount = 0;
for (const file of files) {
   let content = fs.readFileSync(file, 'utf8');
   let modified = false;

   content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]@\/modules\/([^'"]+)['"]/g, (match, importsStr, modulePath) => {
      // If it already points to a specific file, don't change it unless it's an index
      if (modulePath.split('/').length > 2 && !modulePath.endsWith('/index')) {
         return match;
      }
      
      const symbols = importsStr.split(',').map(s => s.trim()).filter(Boolean);
      const newImports = new Map(); // path -> symbols
      
      let allFound = true;
      for (const sym of symbols) {
         const cleanSym = sym.split(' as ')[0].trim();
         const alias = sym.split(' as ')[1]?.trim();
         
         const targetPath = symbolMap.get(cleanSym);
         if (targetPath) {
             if (!newImports.has(targetPath)) newImports.set(targetPath, []);
             newImports.get(targetPath).push(sym);
         } else {
             allFound = false;
         }
      }
      
      if (allFound && newImports.size > 0) {
         let replacement = '';
         for (const [tPath, tSyms] of newImports.entries()) {
             replacement += `import { ${tSyms.join(', ')} } from '${tPath}';\n`;
         }
         modified = true;
         return replacement.trim();
      }
      
      return match;
   });

   if (modified) {
      fs.writeFileSync(file, content);
      fixCount++;
   }
}

console.log(`Fixed barrels in ${fixCount} files.`);
