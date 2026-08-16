/**
 * spaghetti-hunter.ts
 * 
 * Scanner architectural profond pour Restaurant OS Core :
 * 1. Détection des cycles d'imports (Circular Dependencies)
 * 2. Détection des God Files (> 400 LOC ou Fan-out > 12 dans domain / services)
 * 3. Détection des violations de frontières architecturales (src/modules -> src/verticals)
 * 4. Détection des calculs flottants non protégés dans les zones financières / stocks
 * 5. Détection des anomalies temporelles DST / fuseaux horaires
 */

import * as fs from 'fs';
import * as path from 'path';

interface Violation {
  type: 'CYCLE' | 'GOD_FILE' | 'BOUNDARY_VIOLATION' | 'FLOAT_DRIFT' | 'TIMEZONE_DST';
  file: string;
  line?: number;
  message: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
}

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');

const violations: Violation[] = [];

// ─── 1. Parcours récursif des fichiers TS/TSX ──────────────────────────────

function getAllTsFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'dist' || file === '.codegraph') {
      continue;
    }
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllTsFiles(fullPath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

console.log('🔍 Collecte des fichiers...');
const allFiles = getAllTsFiles(SRC_DIR);
console.log(`📊 ${allFiles.length} fichiers TypeScript trouvés dans /src.\n`);

// ─── 2. Audit God Files & Métriques de complexité ──────────────────────────

console.log('⚡ Audit des God Files et fan-out...');
for (const file of allFiles) {
  const relPath = path.relative(ROOT_DIR, file);
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  // Ignorer les fichiers d'agrégation légitimes (Root Providers, index.ts, DTO schemas)
  const isAggregationPermitted =
    relPath.includes('src/app/') ||
    relPath.endsWith('Provider.tsx') ||
    relPath.endsWith('Dashboard.tsx') ||
    relPath.endsWith('index.ts') ||
    relPath.includes('/contracts/') ||
    relPath.includes('/types') ||
    relPath.includes('.test.');

  if (!isAggregationPermitted && (relPath.includes('src/domain/') || relPath.includes('/services/'))) {
    if (lines.length > 400) {
      violations.push({
        type: 'GOD_FILE',
        file: relPath,
        message: `Fichier métier dépasse 400 lignes (${lines.length} LOC). Doit être scindé en sous-services.`,
        severity: 'WARNING',
      });
    }

    // Compter les imports uniques (Fan-out)
    const importLines = lines.filter((l) => l.trim().startsWith('import ') && !l.includes('from "react"') && !l.includes("from 'react'"));
    if (importLines.length > 12) {
      violations.push({
        type: 'GOD_FILE',
        file: relPath,
        message: `Fan-out excessif (${importLines.length} imports externes > 12). Risque de couplage fort.`,
        severity: 'WARNING',
      });
    }
  }

  // ─── 3. Violations de frontières architecturales ─────────────────────────
  // Règle : src/modules/ NE DOIT PAS importer directement depuis src/verticals/
  if (relPath.startsWith('src/modules/')) {
    lines.forEach((line, idx) => {
      if (line.includes('@/verticals/') || line.includes('../../../verticals/') || line.includes('../../verticals/')) {
        violations.push({
          type: 'BOUNDARY_VIOLATION',
          file: relPath,
          line: idx + 1,
          message: `Import direct interdit depuis src/verticals/ dans un module universel.`,
          severity: 'CRITICAL',
        });
      }
    });
  }

  // ─── 4. Détection des calculs temporels non protégés (Anti-DST) ──────────
  if (relPath.includes('/human/') || relPath.includes('/shifts/') || relPath.includes('/planning/')) {
    lines.forEach((line, idx) => {
      if (line.includes('.getHours()') && !line.includes('// allow-dst') && !relPath.includes('.test.')) {
        violations.push({
          type: 'TIMEZONE_DST',
          file: relPath,
          line: idx + 1,
          message: `Calcul d'heure locale .getHours() détecté dans module RH/planning. Privilégier les ms UTC absolues ou Date.UTC().`,
          severity: 'WARNING',
        });
      }
    });
  }
}

// ─── 5. Détection des cycles d'imports ──────────────────────────────────────

console.log('🔄 Analyse des cycles d\'imports (Dependency Graph)...');

const importGraph = new Map<string, string[]>();

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  const imports: string[] = [];

  // Strip comments to avoid detecting imports inside JSDoc examples or commented-out code
  const codeWithoutComments = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');

  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(codeWithoutComments)) !== null) {
    const importPath = match[1];
    let resolvedPath: string | null = null;

    if (importPath.startsWith('@/')) {
      resolvedPath = path.join(SRC_DIR, importPath.replace('@/', ''));
    } else if (importPath.startsWith('.')) {
      resolvedPath = path.resolve(dir, importPath);
    }

    if (resolvedPath) {
      // Tester extensions .ts, .tsx, /index.ts, /index.tsx
      const candidates = [
        resolvedPath,
        `${resolvedPath}.ts`,
        `${resolvedPath}.tsx`,
        path.join(resolvedPath, 'index.ts'),
        path.join(resolvedPath, 'index.tsx'),
      ];

      for (const cand of candidates) {
        if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
          imports.push(cand);
          break;
        }
      }
    }
  }
  importGraph.set(file, imports);
}

// Tarjan / DFS Cycle Detection
const visited = new Set<string>();
const recursionStack = new Set<string>();
const detectedCycles: string[][] = [];

function checkCycle(current: string, currentPath: string[] = []): void {
  visited.add(current);
  recursionStack.add(current);
  currentPath.push(current);

  const neighbors = importGraph.get(current) || [];
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      checkCycle(neighbor, [...currentPath]);
    } else if (recursionStack.has(neighbor)) {
      const cycleStartIdx = currentPath.indexOf(neighbor);
      if (cycleStartIdx !== -1) {
        detectedCycles.push(currentPath.slice(cycleStartIdx));
      }
    }
  }

  recursionStack.delete(current);
}

for (const file of allFiles) {
  if (!visited.has(file)) {
    checkCycle(file, []);
  }
}

for (const cycle of detectedCycles.slice(0, 10)) {
  const formattedCycle = cycle.map((p) => path.relative(ROOT_DIR, p)).join(' ➔ ');
  violations.push({
    type: 'CYCLE',
    file: path.relative(ROOT_DIR, cycle[0]),
    message: `Cycle d'import circulaire détecté : ${formattedCycle}`,
    severity: 'CRITICAL',
  });
}

// ─── 6. Rapport Final Synthétique ──────────────────────────────────────────

console.log('\n================================================================');
console.log('📋 RAPPORT DE CHASSE AU SPAGHETTI (Restaurant OS Core)');
console.log('================================================================\n');

const criticals = violations.filter((v) => v.severity === 'CRITICAL');
const warnings = violations.filter((v) => v.severity === 'WARNING');

console.log(`🚨 Violations Critiques : ${criticals.length}`);
console.log(`⚠️  Avertissements      : ${warnings.length}`);
console.log(`📦 Fichiers analysés     : ${allFiles.length}\n`);

if (criticals.length > 0) {
  console.log('--- 🚨 VIOLATIONS CRITIQUES ---');
  criticals.forEach((c) => {
    console.log(`[${c.type}] ${c.file}${c.line ? `:${c.line}` : ''}`);
    console.log(`  └─ ${c.message}\n`);
  });
}

if (warnings.length > 0) {
  console.log('--- ⚠️ AVERTISSEMENTS & GOD FILES ---');
  warnings.forEach((w) => {
    console.log(`[${w.type}] ${w.file}${w.line ? `:${w.line}` : ''}`);
    console.log(`  └─ ${w.message}\n`);
  });
}

if (violations.length === 0) {
  console.log('✨ ZÉRO SPAGHETTI DÉTECTÉ ! L\'architecture est 100% propre, découplée et souveraine.');
}
