const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;

  const importRegex = /import\s+{([^}]+)}\s+from\s+['"]@\/shared\/nexus\/engines\/mcc\/compliance\/NexusFiscalProvider['"]/g;
  
  content = content.replace(importRegex, (match, importsStr) => {
    changed = true;
    return `import { ${importsStr} } from '@/shared/providers/finance/NexusFiscalProvider';`;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated ${file}`);
    changedFiles++;
  }
});

console.log(`Updated ${changedFiles} files.`);
