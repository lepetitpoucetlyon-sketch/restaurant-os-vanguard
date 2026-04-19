const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      const ext = path.extname(file);
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

function parseImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  const regex = /from\s+['"](.*?)['"]/g;
  const regex2 = /import\(['"](.*?)['"]\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  while ((match = regex2.exec(content)) !== null) {
      imports.push(match[1]);
  }
  return imports;
}

function resolveImport(importPath, currentFilePath) {
  let resolvedPath = '';
  if (importPath.startsWith('@/')) {
    resolvedPath = path.join(SRC_DIR, importPath.substring(2));
  } else if (importPath.startsWith('.')) {
    resolvedPath = path.resolve(path.dirname(currentFilePath), importPath);
  } else {
    return null; // external
  }

  const exts = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '.d.ts'];
  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) return resolvedPath;
  for (const ext of exts) {
    if (fs.existsSync(resolvedPath + ext)) return resolvedPath + ext;
  }
  return null;
}

const allFiles = getAllFiles(SRC_DIR);
const referencedFiles = new Set();

allFiles.forEach(file => {
  const imports = parseImports(file);
  imports.forEach(imp => {
    const resolved = resolveImport(imp, file);
    if (resolved) referencedFiles.add(resolved);
  });
});

const orphans = allFiles.filter(file => {
  const relativePath = path.relative(SRC_DIR, file);
  
  // Rules for survival:
  // 1. Next.js Entry Points
  if (relativePath.startsWith('app/')) {
      if (relativePath.endsWith('page.tsx') || 
          relativePath.endsWith('layout.tsx') || 
          relativePath.endsWith('loading.tsx') || 
          relativePath.endsWith('error.tsx') ||
          relativePath.startsWith('app/api/')) {
          return false;
      }
  }
  // 2. Global entry points
  if (relativePath === 'middleware.ts' || relativePath === 'index.ts' || relativePath === 'lib/firebase.ts') return false;
  
  // 3. Referenced files
  if (referencedFiles.has(file)) return false;

  // 4. Index files that might be entry points for barrels but are unused themselves? 
  // If an index.ts is not referenced, but its folder contents are referenced individually? No, barrels are explicitly exported.

  return true;
});

console.log(`${orphans.length}`);
orphans.forEach(o => console.log(path.relative(ROOT_DIR, o)));
