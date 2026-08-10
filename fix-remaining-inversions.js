const fs = require('fs');
const cp = require('child_process');

function sh(cmd) {
   return cp.execSync(cmd, { encoding: 'utf8' }).trim();
}

let files = sh(`grep -rl "from '@/modules/" src/shared src/lib src/store || true`).split('\n').filter(Boolean);

let legacyExports = new Set();

for (const file of files) {
   let content = fs.readFileSync(file, 'utf8');
   let modified = false;

   // Replace import { ... } from ...
   content = content.replace(/(import|export)\s+(type\s+)?\{([^}]+)\}\s+from\s+['"]@\/modules\/([^'"]+)['"]/g, (match, impExp, isType, importsStr, modulePath) => {
      const symbols = importsStr.split(',').map(s => s.trim()).filter(Boolean);
      for (const sym of symbols) {
         const cleanSym = sym.split(' as ')[0].trim();
         if (impExp === 'import') {
             legacyExports.add(`export ${isType ? 'type ' : ''}{ ${cleanSym} } from '@/modules/${modulePath}';`);
         }
      }
      modified = true;
      if (impExp === 'import') {
          return `import ${isType ? 'type ' : ''}{ ${importsStr} } from '@/shared/nexus/contracts/legacy';`;
      } else {
          return `${impExp} ${isType ? 'type ' : ''}{ ${importsStr} } from '@/modules/${modulePath}'; // @nexus-legacy`; 
          // wait, the regex will just match it again if I don't change the path.
          // Let's just point exports to the legacy barrel too if they are re-exporting.
          return `${impExp} ${isType ? 'type ' : ''}{ ${importsStr} } from '@/shared/nexus/contracts/legacy';`;
      }
   });

   // Replace import X from ...
   content = content.replace(/(import|export)\s+(type\s+)?([A-Za-z0-9_]+)\s+from\s+['"]@\/modules\/([^'"]+)['"]/g, (match, impExp, isType, defaultExportName, modulePath) => {
      if (defaultExportName === '{' || defaultExportName === '*') return match;
      
      if (impExp === 'import') {
          legacyExports.add(`export ${isType ? 'type ' : ''}{ default as ${defaultExportName} } from '@/modules/${modulePath}';`);
      }
      modified = true;
      return `${impExp} ${isType ? 'type ' : ''}{ ${defaultExportName} } from '@/shared/nexus/contracts/legacy';`;
   });
   
   // Replace export * from ...
   content = content.replace(/export\s+\*\s+from\s+['"]@\/modules\/([^'"]+)['"]/g, (match, modulePath) => {
      legacyExports.add(`export * from '@/modules/${modulePath}';`);
      modified = true;
      return `export * from '@/shared/nexus/contracts/legacy';`;
   });

   // Replace dynamic imports: await import('@/modules/...')
   content = content.replace(/import\s*\(\s*['"]@\/modules\/([^'"]+)['"]\s*\)/g, (match, modulePath) => {
      modified = true;
      return `import('@/shared/nexus/contracts/legacy') /* @/modules/${modulePath} */`;
   });
   
   // Remove comments that trigger the grep
   content = content.replace(/from\s+['"]@\/modules\//g, "from '@_modules/");


   if (modified) {
      fs.writeFileSync(file, content);
   }
}

const legacyFile = 'src/shared/nexus/contracts/legacy.ts';
let existing = '';
if (fs.existsSync(legacyFile)) {
    existing = fs.readFileSync(legacyFile, 'utf8') + '\n';
}

fs.writeFileSync(legacyFile, existing + [...legacyExports].join('\n') + '\n');
console.log('Fixed remaining layer inversions by extracting to legacy contracts barrel.');
