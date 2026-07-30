#!/usr/bin/env node
/**
 * NEXUS LINT SURGEON v2.0
 * Grade VI Auto-Remediation Script
 * Targets: no-unused-vars | no-unescaped-entities | no-require-imports | @ts-ignore
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const LINT_FILE = process.argv[2] || path.join(__dirname, '..', 'lint.txt');

// Parse lint.txt to extract: file -> [{line, col, rule, message}]
function parseLintFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const fileMap = new Map();
  let currentFile = null;

  for (const line of lines) {
    const fileLine = line.trim();
    // Match file paths (absolute paths)
    if (fileLine.startsWith('/') && !fileLine.match(/^\d+:\d+/)) {
      currentFile = fileLine;
      if (!fileMap.has(currentFile)) fileMap.set(currentFile, []);
      continue;
    }
    
    if (!currentFile) continue;
    
    // Match error lines: "  LINE:COL  error/warning  MESSAGE  RULE"
    const match = fileLine.match(/^(\d+):(\d+)\s+(error|warning)\s+(.+?)\s{2,}(.+)$/);
    if (match) {
      fileMap.get(currentFile).push({
        line: parseInt(match[1]),
        col: parseInt(match[2]),
        severity: match[3],
        message: match[4].trim(),
        rule: match[5].trim(),
      });
    }
  }

  return fileMap;
}

// Fix 1: Remove unused imports (no-unused-vars on import lines)
function _fixImportLine(line, unusedName) {
  const namedImportMatch = line.match(/^(\s*import\s*\{)([^}]+)(\}\s*from\s*.+)$/);
  if (namedImportMatch) {
    const imports = namedImportMatch[2].split(',').map(s => s.trim());
    const filtered = imports.filter(i => {
      const parts = i.split(/\s+as\s+/);
      return parts[parts.length - 1].trim() !== unusedName;
    });
    if (filtered.length === 0) return '';
    if (filtered.length !== imports.length) return `${namedImportMatch[1]} ${filtered.join(', ')} ${namedImportMatch[3]}`;
    return line;
  }
  const defaultImportMatch = line.match(/^(\s*import\s+)([A-Za-z_$][A-Za-z0-9_$]*)(\s*from\s*.+)$/);
  if (defaultImportMatch && defaultImportMatch[2] === unusedName) return '';
  const nsImportMatch = line.match(/^(\s*import\s+\*\s+as\s+)([A-Za-z_$][A-Za-z0-9_$]*)(\s*from\s*.+)$/);
  if (nsImportMatch && nsImportMatch[2] === unusedName) return '';
  return line;
}

function fixUnusedImports(content, errors) {
  const unusedImportErrors = errors.filter(e =>
    e.rule === '@typescript-eslint/no-unused-vars' &&
    e.message.match(/'(.+)' is defined but never used|'(.+)' is assigned a value but never used/)
  );

  if (unusedImportErrors.length === 0) return content;

  const lines = content.split('\n');

  for (const error of unusedImportErrors) {
    const lineIdx = error.line - 1;
    if (lineIdx < 0 || lineIdx >= lines.length) continue;
    const line = lines[lineIdx];

    const nameMatch = error.message.match(/'([^']+)' is (defined|assigned)/);
    if (!nameMatch) continue;

    if (!line.trim().startsWith('import ')) continue;

    lines[lineIdx] = _fixImportLine(line, nameMatch[1]);
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}

// Fix 2: Escape unescaped entities in JSX text
function fixUnescapedEntities(content, errors) {
  const entityErrors = errors.filter(e => e.rule === 'react/no-unescaped-entities');
  if (entityErrors.length === 0) return content;

  const lines = content.split('\n');

  for (const error of entityErrors) {
    const lineIdx = error.line - 1;
    if (lineIdx < 0 || lineIdx >= lines.length) continue;
    const line = lines[lineIdx];

    // Determine which character needs escaping
    let escaped = line;
    if (error.message.includes("`'`")) {
      // Replace raw apostrophes in JSX text context with &apos;
      // We need to be careful not to replace inside attribute strings or JS expressions
      escaped = replaceInJSXText(line, "'", '&apos;');
    } else if (error.message.includes('`"`')) {
      escaped = replaceInJSXText(line, '"', '&quot;');
    } else if (error.message.includes('`>`')) {
      escaped = replaceInJSXText(line, '>', '&gt;');
    } else if (error.message.includes('`}`')) {
      escaped = replaceInJSXText(line, '}', '&#125;');
    }
    
    lines[lineIdx] = escaped;
  }

  return lines.join('\n');
}

function _updateJSXExprState(c, state) {
  if (!state.inString && !state.inTag && c === '{') { state.inJSExpr++; return true; }
  if (!state.inString && !state.inTag && c === '}' && state.inJSExpr > 0) { state.inJSExpr--; return true; }
  if (!state.inString && !state.inJSExpr && c === '<') { state.inTag = true; return true; }
  return false;
}

function _updateJSXTagState(c, state) {
  if (c === '>') { state.inTag = false; return true; }
  if (c === '"' || c === "'") {
    if (!state.inString) { state.inString = true; state.stringChar = c; }
    else if (c === state.stringChar) { state.inString = false; }
    return true;
  }
  return false;
}

// Naive JSX text replacer - replaces only in text context (not inside {}, <>, "")
function replaceInJSXText(line, char, replacement) {
  const state = { inString: false, stringChar: '', inJSExpr: 0, inTag: false };
  let result = '';
  let i = 0;

  while (i < line.length) {
    const c = line[i];
    if (_updateJSXExprState(c, state)) {
      result += c;
    } else if (state.inTag && _updateJSXTagState(c, state)) {
      result += c;
    } else if (!state.inTag && !state.inJSExpr && !state.inString && c === char) {
      result += replacement;
    } else {
      result += c;
    }
    i++;
  }

  return result;
}

// Fix 3: Convert require() to import (for .ts/.tsx files in scripts)
function fixRequireImports(content, errors) {
  const requireErrors = errors.filter(e => e.rule === '@typescript-eslint/no-require-imports');
  if (requireErrors.length === 0) return content;

  // Convert: const X = require('Y') -> import X from 'Y'
  // Convert: const { A, B } = require('Y') -> import { A, B } from 'Y'
  let fixed = content;
  
  fixed = fixed.replace(/const\s+(\{[^}]+\})\s*=\s*require\(['"]([^'"]+)['"]\);?/g, 
    (match, imports, module) => `import ${imports} from '${module}';`
  );
  
  fixed = fixed.replace(/const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*require\(['"]([^'"]+)['"]\);?/g, 
    (match, name, module) => `import ${name} from '${module}';`
  );

  return fixed;
}

// Fix 4: Replace @ts-ignore with @ts-expect-error
function fixTsIgnore(content) {
  return content.replace(/\/\/\s*@ts-ignore/g, '// @ts-expect-error');
}

// Fix 5: Prefix unused caught errors with _
function fixUnusedCaughtErrors(content, errors) {
  const caughtErrors = errors.filter(e => 
    e.rule === '@typescript-eslint/no-unused-vars' &&
    e.message.match(/'(err|error|e|_err)' is defined but never used/)
  );
  
  if (caughtErrors.length === 0) return content;
  
  const lines = content.split('\n');
  for (const error of caughtErrors) {
    const lineIdx = error.line - 1;
    if (lineIdx < 0 || lineIdx >= lines.length) continue;
    const line = lines[lineIdx];
    
    // Match catch clauses
    lines[lineIdx] = line.replace(/\}\s*catch\s*\(\s*(err|error|e)\s*\)/, (m, name) => 
      m.replace(name, `_${name}`)
    );
  }
  
  return lines.join('\n');
}

// Main orchestrator
async function main() {
  console.log('🔬 NEXUS LINT SURGEON — Démarrage...\n');
  
  if (!fs.existsSync(LINT_FILE)) {
    console.error(`❌ Fichier lint introuvable: ${LINT_FILE}`);
    process.exit(1);
  }

  const fileMap = parseLintFile(LINT_FILE);
  console.log(`📋 Fichiers à opérer: ${fileMap.size}\n`);

  let totalFixed = 0;
  let filesProcessed = 0;
  let filesSkipped = 0;
  const errorLog = [];

  for (const [filePath, errors] of fileMap.entries()) {
    const cleanPath = filePath.split(':')[0]; // Remove line:col suffixes if any
    
    if (!fs.existsSync(cleanPath)) {
      filesSkipped++;
      continue;
    }

    const ext = path.extname(cleanPath);
    if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      filesSkipped++;
      continue;
    }

    try {
      let content = fs.readFileSync(cleanPath, 'utf8');
      const originalContent = content;

      // Apply all surgical fixes
      content = fixUnusedImports(content, errors);
      content = fixUnescapedEntities(content, errors);
      content = fixUnusedCaughtErrors(content, errors);
      content = fixTsIgnore(content);
      
      // Only fix require() in .js files (in .ts files this might break things)
      if (ext === '.js') {
        content = fixRequireImports(content, errors);
      }

      if (content !== originalContent) {
        fs.writeFileSync(cleanPath, content, 'utf8');
        const fixedCount = errors.length;
        totalFixed += fixedCount;
        filesProcessed++;
        console.log(`✅ ${path.basename(cleanPath)} — ${fixedCount} erreur(s) corrigée(s)`);
      }
    } catch (err) {
      errorLog.push({ file: cleanPath, error: err.message });
      console.warn(`⚠️  Échec sur ${path.basename(cleanPath)}: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`🏁 RAPPORT FINAL NEXUS LINT SURGEON`);
  console.log('='.repeat(60));
  console.log(`✅ Fichiers corrigés: ${filesProcessed}`);
  console.log(`⏭️  Fichiers ignorés (inexistants): ${filesSkipped}`);
  console.log(`❌ Fichiers en échec: ${errorLog.length}`);
  console.log(`🎯 Erreurs adressées: ~${totalFixed}`);
  
  if (errorLog.length > 0) {
    console.log('\nDétail des échecs:');
    for (const e of errorLog) {
      console.log(`  - ${e.file}: ${e.error}`);
    }
  }
  
  console.log('\n⚡ Relancez "npm run lint" pour mesurer le nouveau score.');
}

main().catch(console.error);
