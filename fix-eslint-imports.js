const fs = require('fs');
const path = require('path');

const eslintOutput = JSON.parse(fs.readFileSync('eslint-errors.json', 'utf-8'));
const moduleExports = new Map();

for (const result of eslintOutput) {
  let hasRestricted = false;
  for (const message of result.messages) {
    if (message.ruleId === 'no-restricted-imports') {
      hasRestricted = true;
    }
  }
  if (hasRestricted) {
    let content = fs.readFileSync(result.filePath, 'utf-8');
    
    // Multiline safe regex
    // 1. Module name must be word characters or hyphens
    // 2. deepPath must be word characters, hyphens, or slashes (no spaces, no quotes)
    const importRegex = /import\s+([\s\S]*?)\s+from\s+['"]@\/modules\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_/-]+)['"];?/g;
    
    let modified = false;
    
    content = content.replace(importRegex, (fullMatch, importsStr, moduleName, deepPath) => {
      modified = true;
      const moduleRoot = `@/modules/${moduleName}`;
      
      const cleanImports = importsStr.replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean);
      
      if (!moduleExports.has(moduleRoot)) {
        moduleExports.set(moduleRoot, new Map());
      }
      
      for (const imp of cleanImports) {
        let originalName = imp;
        if (imp.includes(' as ')) {
          originalName = imp.split(' as ')[0].trim();
        }
        moduleExports.get(moduleRoot).set(originalName, deepPath);
      }
      
      return `import { ${cleanImports.join(', ')} } from '${moduleRoot}';`;
    });
    
    if (modified) {
      fs.writeFileSync(result.filePath, content, 'utf-8');
      console.log(`Fixed imports in ${result.filePath}`);
    }
  }
}

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
    const regex = new RegExp(`\\b${name}\\b`);
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
