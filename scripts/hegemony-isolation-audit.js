const fs = require('fs');
const path = require('path');

/**
 * 🛰️ HEGEMONY ISOLATION AUDITOR v1.3 [GRADE X]
 * Goal: Transitive Bridge Trailing & Kernel Leaf Certification.
 */

const REPO_ROOT = path.resolve(__dirname, '..');
const GRAPH_PATH = path.join(REPO_ROOT, 'graphify-out/graph.json');
const SHARED_KERNEL_PATH = 'src/lib/shared-kernel.ts';

const HEGEMONIES = {
    admin: ['settings', 'audit-portal', 'account-settings', 'admin', 'system-map', 'actions', 'api', 'blueprint', 'simulator'],
    backoffice: ['haccp', 'accounting', 'quality', 'quotes', 'storage-map', 'inventory', 'finance'],
    hr: ['leaves', 'recruitment', 'planning', 'staff', 'onboarding'],
    marketing: ['intelligence', 'reservations', 'analytics-integration', 'crm', 'ai-referencing', 'omnichannel-reservations', 'social-marketing', 'reserve', 'seo', 'analytics'],
    ops: ['kds', 'operations', 'pos', 'registre', 'bar', 'kitchen', 'floor-plan'],
    public: ['landing', 'auth', 'groups', 'docs', 'welcome', 'simulator', 'showcase']
};

function getHegemony(sourceFile) {
    if (!sourceFile || !sourceFile.includes('src/app/')) return null;
    const relPath = sourceFile.split('src/app/')[1];
    if (!relPath) return null;
    const firstPart = relPath.split('/')[0];
    for (const [name, folders] of Object.entries(HEGEMONIES)) {
        if (folders.includes(firstPart)) return name;
    }
    return null;
}

function verifyInCode(source, target) {
    if (!source || !fs.existsSync(path.resolve(REPO_ROOT, source))) return false;
    try {
        const content = fs.readFileSync(path.resolve(REPO_ROOT, source), 'utf8');
        // Simple heuristic for imports
        const targetBase = target.split('/').pop().split('.')[0];
        return content.includes(targetBase); 
    } catch {
        return false;
    }
}

function runAudit() {
    console.log('🏛️  SINGULARITY TRANSITIVE AUDIT [GRADE X]\n');
    
    if (!fs.existsSync(GRAPH_PATH)) {
        console.error('❌ Nexus Graph missing.');
        process.exit(1);
    }

    const graph = JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf8'));
    const nodeTable = {};
    const adj = {};

    graph.nodes.forEach(n => {
        nodeTable[n.id] = n;
        adj[n.id] = [];
    });

    if (graph.edges) {
        graph.edges.forEach(e => {
            if (adj[e.source]) adj[e.source].push(e.target);
        });
    }

    // 1. Kernel Leaf Certification
    console.log('🛡️  CERTIFICATION KERNEL (Feuille Morte) :');
    const kernelNodeId = Object.keys(nodeTable).find(id => nodeTable[id].source_file && nodeTable[id].source_file.includes(SHARED_KERNEL_PATH));
    
    if (kernelNodeId) {
        const kernelDeps = adj[kernelNodeId] || [];
        const hegemonyDeps = kernelDeps.filter(depId => getHegemony(nodeTable[depId]?.source_file));
        
        if (hegemonyDeps.length === 0) {
            console.log('   ✅ SHARED KERNEL : État de "Feuille Morte" confirmé. 0 dépendance vers les hégémonies.\n');
        } else {
            console.error(`   ❌ VIOLATION : Le Kernel dépend de : ${hegemonyDeps.join(', ')}\n`);
        }
    } else {
        console.warn('   ⚠️  Kernel node not found in graph.\n');
    }

    // 2. Traque des Ponts Transitifs (DFS)
    function findPath(start, targetH, visited = new Set()) {
        if (visited.has(start)) return null;
        visited.add(start);

        const neighbors = adj[start] || [];
        for (const neighborId of neighbors) {
            const neighborNode = nodeTable[neighborId];
            if (!neighborNode) continue;

            const nH = getHegemony(neighborNode.source_file);
            if (nH === targetH) return [start, neighborId];
            
            const subPath = findPath(neighborId, targetH, visited);
            if (subPath) return [start, ...subPath];
        }
        return null;
    }

    const backofficeNodes = graph.nodes.filter(n => getHegemony(n.source_file) === 'backoffice').map(n => n.id);
    const bridges = [];

    console.log('🔍 RECHERCHE DE PONTS (Backoffice -> Public) :');
    backofficeNodes.forEach(nodeId => {
        const pathFound = findPath(nodeId, 'public');
        if (pathFound) {
            const isReal = verifyInCode(nodeTable[nodeId].source_file, nodeTable[pathFound[1]].source_file);
            bridges.push({ path: pathFound, isReal });
        }
    });

    if (bridges.length === 0) {
        console.log('   ✅ Aucun pont transitif détecté entre Backoffice et Public.\n');
    } else {
        const realBridges = bridges.filter(b => b.isReal);
        console.error(`   ⚠️  ${bridges.length} ponts théoriques trouvés, dont ${realBridges.length} confirmés RÉELS.\n`);
        realBridges.slice(0,3).forEach(b => {
            console.error(`   🚩 PONT RÉEL : ${b.path.map(id => nodeTable[id].source_file || id).join(' -> ')}`);
        });
    }

    console.log('--- RAPPORT DE PROPRETÉ RÉELLE ---');
    const sealScore = bridges.length === 0 ? 100 : Math.round(((bridges.length - bridges.filter(b => b.isReal).length) / bridges.length) * 100);
    console.log(`💎 Score d'étanchéité : ${sealScore}%`);
}

runAudit();
