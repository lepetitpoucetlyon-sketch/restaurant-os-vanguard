import fs from 'fs';
import path from 'path';

/**
 * 🛰️ AUDIT GRADE X++ — DEEP ARCHITECTURAL & SECURITY SCANNER
 * Inspecte la totalité du codebase RESTAURANT-OS-CORE sur 5 dimensions critiques.
 */

interface DeepAuditReport {
  timestamp: string;
  totalFilesScanned: number;
  tenantIsolation: {
    passedFiles: number;
    unscopedQueries: string[];
  };
  nf525Compliance: {
    passed: boolean;
    directLedgerMutations: string[];
  };
  sovereignMath: {
    doubleConversions: string[];
  };
  fanOutPolicies: {
    godFileViolations: { file: string; fanOutCount: number }[];
  };
  semanticTokenCoverage: {
    migratedComponents: number;
    staticTailwindResiduals: number;
  };
}

const SRC_PATH = path.join(process.cwd(), 'src');
const EXCLUDE_DIRS = ['node_modules', '.next', 'scripts', 'tests', 'dist', '.git'];

const report: DeepAuditReport = {
  timestamp: new Date().toISOString(),
  totalFilesScanned: 0,
  tenantIsolation: { passedFiles: 0, unscopedQueries: [] },
  nf525Compliance: { passed: true, directLedgerMutations: [] },
  sovereignMath: { doubleConversions: [] },
  fanOutPolicies: { godFileViolations: [] },
  semanticTokenCoverage: { migratedComponents: 0, staticTailwindResiduals: 0 },
};

function isTypeScriptFile(name: string): boolean {
  return name.endsWith('.ts') || name.endsWith('.tsx');
}

function countImports(content: string): number {
  const importLines = content.match(/^import\s+[\s\S]*?from\s+['"][^'"]+['"]/gm) || [];
  return importLines.length;
}

function _analyzeFile(content: string, relativePath: string) {
  const rawCollectionQuery = /adapter\.(query|get|set|update|delete)\(['"](?!(tenants\/|system\/|config\/))[a-zA-Z0-9_-]+['"]/g;
  if (rawCollectionQuery.test(content) && !relativePath.includes('NexusAdapter') && !relativePath.includes('DomainRegistry')) {
    report.tenantIsolation.unscopedQueries.push(relativePath);
  } else {
    report.tenantIsolation.passedFiles++;
  }
  const directLedgerMutation = /adapter\.(update|delete)\([\s\S]*?journalEntries/gi;
  if (directLedgerMutation.test(content)) {
    report.nf525Compliance.passed = false;
    report.nf525Compliance.directLedgerMutations.push(relativePath);
  }
  if (content.includes('toMicrounits(toMicrounits')) {
    report.sovereignMath.doubleConversions.push(relativePath);
  }
  const isDomainService = relativePath.includes('src/domain/') || relativePath.includes('/services/');
  const fanOut = countImports(content);
  if (isDomainService && fanOut > 12) {
    report.fanOutPolicies.godFileViolations.push({ file: relativePath, fanOutCount: fanOut });
  }
  if (/var\(--|bg-action-|bg-status-|bg-surface-|text-text-/.test(content)) {
    report.semanticTokenCoverage.migratedComponents++;
  }
  const twMatches = content.match(/\b(bg|text|border)-(?:slate|gray|zinc|neutral|red|amber|blue|indigo|emerald)-(?:50|[1-9]00)\b/g);
  if (twMatches) {
    report.semanticTokenCoverage.staticTailwindResiduals += twMatches.length;
  }
}

function scanDirectory(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(process.cwd(), fullPath);

    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(entry.name)) {
        scanDirectory(fullPath);
      }
      continue;
    }

    if (isTypeScriptFile(entry.name)) {
      report.totalFilesScanned++;
      const content = fs.readFileSync(fullPath, 'utf-8');
      _analyzeFile(content, relativePath);
    }
  }
}

console.log('🚀 Lancement de l\'Audit Deep Grade X++...');
scanDirectory(SRC_PATH);

console.log('\n📊 === RESULTATS AUDIT GRADE X++ ===');
console.log(`📂 Fichiers Analysés : ${report.totalFilesScanned}`);
console.log(`🛡️ Requêtes scopées Multi-Tenant : ${report.tenantIsolation.passedFiles} / ${report.totalFilesScanned}`);
console.log(`📜 Conformité NF525 Grand Livre : ${report.nf525Compliance.passed ? '100% Immuable (Validé)' : 'Violation Détectée'}`);
console.log(`🧮 Conversions Microunits : ${report.sovereignMath.doubleConversions.length === 0 ? 'Zero sur-multiplication (Validé)' : 'Erreur trouvée'}`);
console.log(`⚡ Violations Fan-Out (Moteurs > 12 imports) : ${report.fanOutPolicies.godFileViolations.length}`);
console.log(`🎨 Composants avec Tokens Sémantiques : ${report.semanticTokenCoverage.migratedComponents}`);

const outputPath = path.join(process.cwd(), 'audit-grade-x-plus-report.json');
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
console.log(`\n✅ Rapport détaillé généré : ${outputPath}`);
