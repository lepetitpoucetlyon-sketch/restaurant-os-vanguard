const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { EXEC_OPTS, config } = require('./antigravity-config');

const REPO_ROOT = config.repoRoot;
const REPORT_PATH = path.join(REPO_ROOT, '.antigravity/sentinel-report.json');
const WISDOM_PATH = path.join(REPO_ROOT, '.antigravity/intelligence/lessons.json');

const CONFIG = {
  maxLines: 500,
  maxImports: 15,
  criticalPaths: ['src/domain/services', 'src/context', 'src/app/admin']
};

function runAudit() {
  console.log('🛡️  Starting Antigravity Sentinel Audit...');
  const startTime = Date.now();

  const report = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    metrics: {
      typeSafety: 0,
      testCoverage: 0,
      architectureHealth: 0,
      overallStability: 0
    },
    alerts: [],
    sessions: [],
    complexity: {
      godObjects: [],
      circularDeps: []
    }
  };

  try {
    // 1. Atlas Knowledge Sync
    console.log('🛰️  Syncing Knowledge Nexus (Atlas)...');
    execSync(`${config.binaries.npm} run atlas`, EXEC_OPTS);
    report.metrics.knowledgeSync = 'synced';

    // 2. Type Checking (TSC)
    console.log('🛡️  Verifying Type Safety...');
    try {
      execSync(`${config.binaries.npx} tsc --noEmit`, EXEC_OPTS);
      report.metrics.typeSafety = 100;
    } catch (err) {
      report.metrics.typeSafety = 85; // Partial
      report.alerts.push({ type: 'error', message: 'TypeScript issues detected in current workspace.' });
    }

    // 3. Unit Testing (Vitest)
    console.log('🧪  Executing Logic Validation...');
    try {
      execSync(`${config.binaries.npx} vitest run --reporter=json --outputFile=.antigravity/vitest-results.json`, EXEC_OPTS);
      const vitestOutput = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.antigravity/vitest-results.json'), 'utf8'));
      report.metrics.testCoverage = vitestOutput.numPassedTests / vitestOutput.numTotalTests * 100;
    } catch (err) {
      report.metrics.testCoverage = 50; // Faulty
      report.alerts.push({ type: 'warning', message: 'Logic tests are failing or incomplete.' });
    }

    // 4. Complexity Audit
    console.log('🏛️  Auditing Architectural Stability...');
    const complexityResults = auditComplexity(path.join(REPO_ROOT, 'src'));
    report.complexity.godObjects = complexityResults.godObjects;
    report.metrics.architectureHealth = 100 - (report.complexity.godObjects.length * 10);

    // 5. Final Stability Calculation
    report.metrics.overallStability = (report.metrics.typeSafety + report.metrics.testCoverage + report.metrics.architectureHealth) / 3;
    
    if (report.metrics.overallStability < 90) report.status = 'warning';
    if (report.metrics.overallStability < 70) report.status = 'critical';

    // Save report
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
    
    console.log(`✅ Audit complete in ${(Date.now() - startTime) / 1000}s. Stability: ${report.metrics.overallStability.toFixed(1)}%`);
  } catch (error) {
    console.error('❌ Sentinel Audit Failed:', error.message);
  }
}

function auditComplexity(dir) {
  const godObjects = [];
  const files = getAllFiles(dir);

  files.forEach(file => {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) return;
    
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n').length;
    const imports = (content.match(/^import/gm) || []).length;

    if (lines > CONFIG.maxLines || imports > CONFIG.maxImports) {
      // Proactive Decomposition Analysis
      const clusters = identifyClusters(file);
      godObjects.push({
        path: path.relative(REPO_ROOT, file),
        lines,
        imports,
        proposals: clusters
      });
    }
  });

  return { godObjects };
}

function identifyClusters(file) {
  const GRAPH_PATH = path.join(REPO_ROOT, 'graphify-out/graph.json');
  if (!fs.existsSync(GRAPH_PATH)) return ["Graph Nexus uninitialized. Run `npm run atlas` first."];

  try {
    const graph = JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf8'));
    const absolutePath = path.resolve(file);
    const nodes = graph.nodes.filter(n => n.source_file === absolutePath);
    
    const communities = {};
    nodes.forEach(n => {
      if (!communities[n.community]) communities[n.community] = [];
      communities[n.community].push(n.label);
    });

    return Object.entries(communities).map(([id, items]) => {
      return `Cluster #${id}: ${items.slice(0, 3).join(', ')}${items.length > 3 ? '...' : ''} (${items.length} units)`;
    });
  } catch (e) {
    return ["Cluster analysis failed."];
  }
}

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (['node_modules', '.next', 'dist'].includes(file)) return;
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

runAudit();
