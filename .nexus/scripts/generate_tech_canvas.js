const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SRC_DIR = path.join(__dirname, '../src');
const OUTPUT_FILE = path.join(__dirname, '../MASTER_EMPIRE_FULL_TECH.canvas');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      const ext = path.extname(file);
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

function parseImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  // Regex for both static and dynamic imports
  const staticImportRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
  const dynamicImportRegex = /import\(['"](.*?)['"]\)/g;
  const exportFromRegex = /export\s+.*?\s+from\s+['"](.*?)['"]/g;

  let match;
  while ((match = staticImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  while ((match = exportFromRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports.filter(imp => imp.startsWith('.') || imp.startsWith('@/'));
}

function resolveImport(importPath, currentFilePath) {
  let resolvedPath = '';
  if (importPath.startsWith('@/')) {
    resolvedPath = path.join(SRC_DIR, importPath.substring(2));
  } else {
    resolvedPath = path.resolve(path.dirname(currentFilePath), importPath);
  }

  // Try extensions
  const exts = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) return resolvedPath;
  for (const ext of exts) {
    if (fs.existsSync(resolvedPath + ext)) return resolvedPath + ext;
  }
  return null;
}

function generateCanvas() {
  const files = getAllFiles(SRC_DIR);
  const nodes = [];
  const edges = [];
  const fileToIdMap = {};

  // Create nodes
  files.forEach((file, index) => {
    const relativePath = path.relative(SRC_DIR, file);
    const id = crypto.createHash('md5').update(relativePath).digest('hex');
    fileToIdMap[file] = id;

    // Cluster by directory
    const dir = path.dirname(relativePath);
    const dirParts = dir.split(path.sep);
    
    // Simple grid layout per directory cluster
    // We'll group them by top-level dir
    const mainGroup = dirParts[0] || 'root';
    
    nodes.push({
      id: id,
      type: 'text',
      text: `### ${path.basename(file)}\n---\n${relativePath}`,
      group: mainGroup,
      path: file
    });
  });

  // Create edges
  files.forEach(file => {
    const fromId = fileToIdMap[file];
    const imports = parseImports(file);
    imports.forEach(imp => {
      const resolved = resolveImport(imp, file);
      if (resolved && fileToIdMap[resolved]) {
        const toId = fileToIdMap[resolved];
        edges.push({
          id: crypto.randomUUID(),
          fromNode: fromId,
          toNode: toId
        });
      }
    });
  });

  // Position nodes
  const groups = {};
  nodes.forEach(node => {
    if (!groups[node.group]) groups[node.group] = [];
    groups[node.group].push(node);
  });

  let groupX = 0;
  let groupY = 0;
  const GROUP_SPACING = 2000;
  const NODE_SPACING = 400;

  Object.keys(groups).forEach((groupName, gIdx) => {
    const groupNodes = groups[groupName];
    const cols = Math.ceil(Math.sqrt(groupNodes.length));
    
    groupNodes.forEach((node, nIdx) => {
      const col = nIdx % cols;
      const row = Math.floor(nIdx / cols);
      node.x = groupX + col * NODE_SPACING;
      node.y = groupY + row * NODE_SPACING;
      node.width = 300;
      node.height = 180;
      
      // Assign color based on group
      const colors = ["1", "2", "3", "4", "5", "6"];
      node.color = colors[gIdx % colors.length];
    });

    groupX += GROUP_SPACING;
    if (groupX > 8000) {
      groupX = 0;
      groupY += GROUP_SPACING;
    }
  });

  // Add Legend
  nodes.push({
    id: 'legend-lvl2',
    type: 'text',
    text: "# NIVEAU 2 : VISION INGÉNIERIE\n---\n**Toutes les dépendances, imports de types, constantes et utilitaires.**\n\n[[MASTER_EMPIRE_CLEAN|<- Retour à la Vision Stratégique]]",
    x: -1000,
    y: -1000,
    width: 600,
    height: 300,
    color: "6"
  });

  const canvasData = {
    nodes: nodes.map(({id, type, text, x, y, width, height, color}) => ({id, type, text, x, y, width, height, color})),
    edges: edges
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(canvasData, null, 2));
  console.log(`Canvas generated with ${nodes.length} nodes and ${edges.length} edges.`);
}

generateCanvas();
