const fs = require('fs');
const path = require('path');

/**
 * 🛰️ ANTIGRAVITY NEXUS ENGINE v1.0
 * Goal: Map codebase clusters and propose refactoring plans.
 * Usage: node scripts/antigravity-nexus.js src/app/bar/page.tsx
 */

const REPO_ROOT = path.resolve(__dirname, '..');
const GRAPH_PATH = path.join(REPO_ROOT, 'graphify-out/graph.json');

function analyzeFile(filePath) {
    if (!fs.existsSync(GRAPH_PATH)) {
        console.error('❌ Graph Nexus introuvable. Lance `npm run atlas` d\'abord.');
        process.exit(1);
    }

    const graph = JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf8'));
    const absoluteTargetPath = path.resolve(REPO_ROOT, filePath);
    
    console.log(`🛰️  Analyse Nexus pour : ${absoluteTargetPath}`);

    // 1. Find nodes belonging to this file (normalize paths for matching)
    const fileNodes = graph.nodes.filter(n => {
        if (!n.source_file) return false;
        const nodePath = path.isAbsolute(n.source_file) ? n.source_file : path.resolve(REPO_ROOT, n.source_file);
        return nodePath === absoluteTargetPath;
    });
    
    if (fileNodes.length === 0) {
        console.log('📭 Aucun nœud identifié pour ce fichier dans le Nexus.');
        return;
    }

    console.log(`📍 ${fileNodes.length} points d'ancrage identifiés.`);

    // 2. Identify Communities (Clusters)
    const communities = {};
    fileNodes.forEach(node => {
        if (!communities[node.community]) communities[node.community] = [];
        communities[node.community].push(node);
    });

    console.log('\n🧩 Clusters Logiques (Propositions de Modules) :');
    Object.entries(communities).forEach(([id, nodes]) => {
        console.log(`\n--- [Cluster Community #${id}] ---`);
        nodes.forEach(n => {
            const loc = n.source_location ? ` [${n.source_location}]` : '';
            console.log(`  • ${n.label}${loc} (${n.file_type})`);
        });
    });

    // 3. Dependency Analysis (Simplified for v1)
    console.log('\n🔗 Analyse des Dépendances Externes :');
    const nodeIds = new Set(fileNodes.map(n => n.id));
    const externalDeps = new Set();

    if (graph.edges) {
        graph.edges.forEach(edge => {
            if (nodeIds.has(edge.source) && !nodeIds.has(edge.target)) externalDeps.add(edge.target);
            if (nodeIds.has(edge.target) && !nodeIds.has(edge.source)) externalDeps.add(edge.source);
        });
    }

    Array.from(externalDeps).slice(0, 5).forEach(dep => console.log(`  -> ${dep}`));
    if (externalDeps.size > 5) console.log(`  ... et ${externalDeps.size - 5} autres.`);
}

const targetFile = process.argv[2];
if (!targetFile) {
    console.log('Usage: node scripts/antigravity-nexus.js <file_path>');
    process.exit(1);
}

analyzeFile(targetFile);
