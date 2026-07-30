const fs = require('fs');
const path = require('path');
const { config } = require('./antigravity-config');

const REPO_ROOT = config.repoRoot;
const GRAPH_PATH = path.join(REPO_ROOT, 'graphify-out/graph.json');

function _suggestComponentName(symbols) {
  const has = (kw1, kw2) => symbols.some(s => s.toLowerCase().includes(kw1) || s.toLowerCase().includes(kw2));
  if (has('modal', 'form')) return 'StaffMemberForm';
  if (has('list', 'card')) return 'StaffList';
  if (has('audit', 'log')) return 'StaffAuditLog';
  if (has('pay', 'salary')) return 'StaffPayroll';
  return 'Component';
}

function weave(targetFile) {
  if (!fs.existsSync(GRAPH_PATH)) {
    console.error('❌ Graph Nexus uninitialized. Run `npm run atlas` first.');
    process.exit(1);
  }

  const absoluteTarget = path.resolve(targetFile);
  const graph = JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf8'));
  
  const nodes = graph.nodes.filter(n => n.source_file === absoluteTarget);
  
  if (nodes.length === 0) {
    console.warn(`⚠️ No nodes found for ${targetFile}. Is it indexed?`);
    return;
  }

  const clusters = {};
  nodes.forEach(n => {
    if (!clusters[n.community]) clusters[n.community] = {
      id: n.community,
      symbols: [],
      lines: []
    };
    
    clusters[n.community].symbols.push(n.label);
    if (n.source_location && n.source_location.startsWith('L')) {
      clusters[n.community].lines.push(parseInt(n.source_location.slice(1)));
    }
  });

  console.log(`\n🧵 Antigravity Weaver: Stitch Map for ${path.basename(targetFile)}`);
  console.log('='.repeat(60));

  Object.values(clusters).sort((a, b) => a.lines[0] - b.lines[0]).forEach(c => {
    const minLine = Math.min(...c.lines);
    const maxLine = Math.max(...c.lines);
    console.log(`\n📦 Cluster #${c.id} [Lines ${minLine}-${maxLine}+]`);
    console.log(`   Symbols: ${c.symbols.join(', ')}`);
    
    console.log(`   💡 Potential Extraction: ${_suggestComponentName(c.symbols)}.tsx`);
  });
}

const target = process.argv[2];
if (!target) {
  console.error('Usage: node scripts/antigravity-weaver.js <file_path>');
  process.exit(1);
}

weave(target);
