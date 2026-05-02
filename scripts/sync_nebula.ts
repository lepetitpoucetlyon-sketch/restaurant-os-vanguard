import fs from 'fs';
import path from 'path';

const MODULES_PATH = './src/modules';
const TOPOLOGY_FILE = './cartographie/nexus_topology.html';
const GRAPH_REPORT = './graphify-out/GRAPH_REPORT.md';

// Map pillars to their potential physical folders
const PILLAR_FOLDERS = ['commerce', 'compliance', 'finance', 'human', 'infrastructure', 'intelligence', 'logistics', 'ops'];

const MODULE_TO_FOLDER: any = {
    'Tableau de Bord': 'engine',
    'Intelligence Exécutive': 'analytics',
    'Analytique BI': 'analytics',
    'Google Analytics': 'analytics',
    'Référencement IA': 'analytics',
    'CRM Clients': 'marketing',
    'Réservations Omnicanal': 'reservations',
    'Devis': 'marketing',
    'Groupes & Privatisation': 'marketing',
    'Marketing & Social': 'marketing',
    'SEO & Référencement': 'marketing',
    'Point de Vente': 'pos',
    'Plan de Salle': 'engine',
    'Réservations': 'reservations',
    'Gestion PMS (Notebook)': 'pos',
    'Production (KDS)': 'kitchen',
    'Gestion Cuisine': 'kitchen',
    'Bar & Sommellerie': 'pos',
    'HACCP & Qualité': 'haccp',
    'Plan des Stockages': 'inventory',
    'Stocks & Inventaire': 'inventory',
    'Contrôle Réception': 'inventory',
    'Prise de Poste': 'hr',
    'Ressources Humaines': 'hr',
    'Planning': 'hr',
    'Congés & Absences': 'hr',
    'Recrutement': 'hr',
    'Trésorerie & Prévisions': 'finance',
    'Gestion Comptable': 'accounting',
    'Registres Obligatoires': 'engine',
    'Cartographie 3D': 'engine',
    'Rechercher': 'infrastructure',
    'Paramètres': 'infrastructure',
    'Gestion des Accès': 'auth'
};

function sync() {
    console.log('🏛️ Starting Deep Forensic Sync...');

    let atlasContent = '';
    if (fs.existsSync(GRAPH_REPORT)) atlasContent = fs.readFileSync(GRAPH_REPORT, 'utf-8');

    const forensicStatus: any = {};
    const pillarIndexes: any = {};

    // Load ALL pillar indexes for search
    PILLAR_FOLDERS.forEach(folder => {
        const indexPath = path.join(MODULES_PATH, folder, 'index.ts');
        if (fs.existsSync(indexPath)) pillarIndexes[folder] = fs.readFileSync(indexPath, 'utf-8');
    });

    let html = fs.readFileSync(TOPOLOGY_FILE, 'utf-8');
    const dataMatch = html.match(/const data = (\{[\s\S]*?\});/);
    if (!dataMatch) return;
    
    const dataStr = dataMatch[1];
    const pillarBlocks = dataStr.split(/\n\s*[A-Z]+:/).slice(1);
    const pillarKeys = dataStr.match(/\n\s*([A-Z]+):/g)?.map(k => k.trim().replace(':', '')) || [];

    pillarKeys.forEach((pId, idx) => {
        if (pId === 'CORE') return;
        const block = pillarBlocks[idx];
        const modulesMatch = block.match(/modules: \[(.*?)\]/);
        if (!modulesMatch) return;
        
        const modules = modulesMatch[1].split(',').map(m => m.trim().replace(/'/g, '').replace(/"/g, ''));
        modules.forEach((mLabel, j) => {
            if (!mLabel) return;
            const mId = `${pId}_${j}`;
            const folderName = MODULE_TO_FOLDER[mLabel] || mLabel.toLowerCase();
            
            // --- SEARCH IN ALL PHYSICAL FOLDERS ---
            let physicalFolder = '';
            let isWelded = false;

            for (const folder of PILLAR_FOLDERS) {
                const modPath = path.join(MODULES_PATH, folder, folderName);
                if (fs.existsSync(modPath)) {
                    physicalFolder = folder;
                    // Check if welded in THIS pillar index
                    const index = pillarIndexes[folder] || '';
                    const strictSuturePattern = new RegExp(`export\\s+\\*\\s+from\\s+['"]\\.\\/${folderName}['"]`, 'i');
                    if (strictSuturePattern.test(index)) isWelded = true;
                    break;
                }
            }

            const exists = physicalFolder !== '';
            const isActive = atlasContent.toLowerCase().includes(folderName.toLowerCase());

            forensicStatus[mId] = {
                connected: isWelded,
                active: isActive && exists
            };
        });
    });

    const statusEntries = Object.entries(forensicStatus).map(([id, status]: any) => {
        return `"${id}": { connected: ${status.connected}, active: ${status.active} }`;
    }).join(',\n                        ');

    const injection = `// --- PHYSICAL CONNECTION AUDIT ---
                    const statusRegistry = {
                        ${statusEntries}
                    };`;

    const syncRegex = /\/\/ --- PHYSICAL CONNECTION AUDIT ---[\s\S]*?const statusRegistry = \{[\s\S]*?\};/;
    html = html.replace(syncRegex, injection);

    fs.writeFileSync(TOPOLOGY_FILE, html);
    console.log('✅ Deep Forensic Sync Complete.');
}

sync();
