const fs = require('fs');
const path = require('path');

/**
 * 🏛️ ANTIGRAVITY ARCHITECTURAL AUDITOR v1.0
 * Goal: Verify that codebase edits respect the Nexus Graph structure.
 */

const REPO_ROOT = path.resolve(__dirname, '..');
const GRAPH_PATH = path.join(REPO_ROOT, 'graphify-out/graph.json');

function loadGraph() {
    if (!fs.existsSync(GRAPH_PATH)) {
        throw new Error('❌ Nexus Graph missing. Run `npm run atlas` first.');
    }
    return JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf8'));
}

function auditFile(graph, relativePath) {
    const absolutePath = path.resolve(REPO_ROOT, relativePath);
    console.log(`\n🔍 Auditing: ${relativePath}`);

    const nodes = graph.nodes.filter(n => {
        if (!n.source_file) return false;
        // Normalize: compare relative paths from project root
        const nRel = n.source_file.split('RESTAURANT-OS-CORE/').pop();
        const tRel = absolutePath.split('RESTAURANT-OS-CORE/').pop();
        return nRel === tRel;
    });

    if (nodes.length === 0) {
        console.warn('⚠️  Target not found in graph. Subject is unmapped (Ghost Code).');
        return;
    }

    const communities = [...new Set(nodes.map(n => n.community))];
    console.log(`📍 Logical Communities: ${communities.join(', ')}`);

    // Dependency check
    const nodeIds = new Set(nodes.map(n => n.id));
    const outgoing = [];
    const incoming = [];

    if (graph.edges) {
        graph.edges.forEach(edge => {
            if (nodeIds.has(edge.source) && !nodeIds.has(edge.target)) outgoing.push(edge.target);
            if (nodeIds.has(edge.target) && !nodeIds.has(edge.source)) incoming.push(edge.source);
        });
    }

    console.log(`🔗 Outgoing Flows: ${outgoing.slice(0, 3).join(', ')}${outgoing.length > 3 ? '...' : ''}`);
    console.log(`📥 Incoming Flows: ${incoming.slice(0, 3).join(', ')}${incoming.length > 3 ? '...' : ''}`);

    // Violation Check (Simple Rule: Core should not depend on UI)
    const violations = outgoing.filter(dep => dep.includes('view') || dep.includes('component') || dep.includes('UI'));
    if (relativePath.includes('core') || relativePath.includes('domain')) {
        if (violations.length > 0) {
            console.error('❌ ARCHITECTURAL VIOLATION: Core logic depending on UI-layer nodes.');
            violations.forEach(v => console.error(`   -> ${v}`));
            return false;
        }
    }

    console.log('✅ Integrity Confirmed.');
    return true;
}

const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Usage: node scripts/antigravity-audit.js <file_path1> <file_path2> ...');
    process.exit(1);
}

try {
    const graph = loadGraph();
    let success = true;
    args.forEach(file => {
        if (!auditFile(graph, file)) success = false;
    });
    process.exit(success ? 0 : 1);
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
