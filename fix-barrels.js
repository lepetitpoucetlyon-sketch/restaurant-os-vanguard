const fs = require('fs');
const path = require('path');

const eslintOutput = JSON.parse(fs.readFileSync('eslint-errors.json', 'utf-8'));

// Collect all remaining restricted imports from ESLint JSON
const moduleExports = new Map(); // moduleRoot -> Map of {exportName -> deepPath}

for (const result of eslintOutput) {
  for (const message of result.messages) {
    if (message.ruleId !== 'no-restricted-imports') continue;
    
    // Extract the import path from the message
    const match = message.message.match(/'@\/modules\/([a-zA-Z0-9_-]+)\/([^']+)'/);
    if (!match) continue;
    
    const moduleName = match[1];
    const deepPath = match[2];
    const moduleRoot = `@/modules/${moduleName}`;
    
    // Read the actual source file at that line to get the imported symbols
    const content = fs.readFileSync(result.filePath, 'utf-8');
    const lines = content.split('\n');
    const lineContent = lines[message.line - 1];
    
    if (!lineContent) continue;
    
    // Extract imported symbols
    const importMatch = lineContent.match(/import\s+\{([^}]+)\}/);
    if (!importMatch) {
      // Handle default imports or namespace imports  
      const defaultMatch = lineContent.match(/import\s+(\w+)\s+from/);
      if (defaultMatch) {
        if (!moduleExports.has(moduleRoot)) moduleExports.set(moduleRoot, new Map());
        moduleExports.get(moduleRoot).set(defaultMatch[1], deepPath);
      }
      continue;
    }
    
    const symbols = importMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    
    if (!moduleExports.has(moduleRoot)) moduleExports.set(moduleRoot, new Map());
    
    for (const sym of symbols) {
      let name = sym;
      if (sym.includes(' as ')) name = sym.split(' as ')[0].trim();
      moduleExports.get(moduleRoot).set(name, deepPath);
    }
  }
}

// Update barrels
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
    // Escape special regex chars in name
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`);
    if (!regex.test(indexContent)) {
      indexContent += `\nexport { ${name} } from './${deepPath}';`;
      appended = true;
    }
  }
  
  if (appended) {
    fs.writeFileSync(indexPath, indexContent.trim() + '\n', 'utf-8');
    console.log(`Updated barrel: ${indexPath}`);
  }
}
