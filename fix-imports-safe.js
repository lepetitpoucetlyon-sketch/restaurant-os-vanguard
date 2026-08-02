const fs = require('fs');
const path = require('path');

const eslintOutput = JSON.parse(fs.readFileSync('eslint-errors.json', 'utf-8'));
const moduleExports = new Map();

// Phase 1: Fix imports in source files (line by line, safe)
for (const result of eslintOutput) {
  const restrictedLines = new Set();
  for (const m of result.messages) {
    if (m.ruleId === 'no-restricted-imports') restrictedLines.add(m.line);
  }
  if (restrictedLines.size === 0) continue;
  
  let content = fs.readFileSync(result.filePath, 'utf-8');
  const lines = content.split('\n');
  let modified = false;
  
  for (const lineNum of restrictedLines) {
    const line = lines[lineNum - 1];
    if (!line) continue;
    
    // Match import from @/modules/MODULE/deep/path
    const match = line.match(/import\s+([\s\S]*?)\s+from\s+['"]@\/modules\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_./-]+)['"];?/);
    if (!match) continue;
    
    const importsStr = match[1];
    const moduleName = match[2];
    const deepPath = match[3];
    const moduleRoot = `@/modules/${moduleName}`;
    
    // Extract symbols from { Foo, Bar as Baz }
    const braceMatch = importsStr.match(/\{([^}]+)\}/);
    const symbols = braceMatch 
      ? braceMatch[1].split(',').map(s => s.trim()).filter(Boolean)
      : [importsStr.trim()]; // default import
    
    if (!moduleExports.has(moduleRoot)) moduleExports.set(moduleRoot, new Map());
    
    for (const sym of symbols) {
      let name = sym;
      if (sym.includes(' as ')) name = sym.split(' as ')[0].trim();
      // Skip 'type' keyword prefix
      if (name === 'type') continue;
      moduleExports.get(moduleRoot).set(name, deepPath);
    }
    
    // Reconstruct import with barrel
    lines[lineNum - 1] = `import ${importsStr} from '${moduleRoot}';`;
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(result.filePath, lines.join('\n'), 'utf-8');
    console.log(`Fixed: ${result.filePath.replace('/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/', '')}`);
  }
}

// Phase 2: Update barrels
for (const [moduleRoot, exportsMap] of moduleExports.entries()) {
  const moduleName = moduleRoot.replace('@/modules/', '');
  const indexPath = path.join(__dirname, 'src', 'modules', moduleName, 'index.ts');
  
  let indexContent = '';
  if (fs.existsSync(indexPath)) {
    indexContent = fs.readFileSync(indexPath, 'utf-8');
  } else {
    fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  }
  
  let appended = false;
  for (const [name, deepPath] of exportsMap.entries()) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      const regex = new RegExp('\\b' + escaped + '\\b');
      if (!regex.test(indexContent)) {
        indexContent += '\nexport { ' + name + ' } from ' + "'./" + deepPath + "'" + ';';
        appended = true;
      }
    } catch(e) {
      console.warn('Skipped regex for:', name);
    }
  }
  
  if (appended) {
    fs.writeFileSync(indexPath, indexContent.trim() + '\n', 'utf-8');
    console.log('Barrel: ' + indexPath.replace('/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/', ''));
  }
}

console.log('\nDone!');
