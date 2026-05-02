const fs = require('fs');
const TOPOLOGY_FILE = './cartographie/nexus_topology.html';
const html = fs.readFileSync(TOPOLOGY_FILE, 'utf-8');

const statusMatch = html.match(/const statusRegistry = \{([\s\S]*?)\};/);
if (!statusMatch) { console.log('❌ Registre introuvable'); process.exit(1); }

const registryStr = statusMatch[1];
const status = {};
const entryRegex = /"(\w+)":\s*{\s*connected:\s*(true|false),\s*active:\s*(true|false)\s*}/g;
let match;
while ((match = entryRegex.exec(registryStr)) !== null) {
    status[match[1]] = { connected: match[2] === 'true', active: match[3] === 'true' };
}

const dataBlockMatch = html.match(/const data = \{([\s\S]*?)\};/);
const dataBlock = dataBlockMatch[1];
const pillars = dataBlock.split(/\n\s*[A-Z]+:/).slice(1);
const pillarNames = dataBlock.match(/\n\s*([A-Z]+):/g).map(k => k.trim().replace(':', ''));

console.log('| Pilier | Module | Dossier | Soudé | Actif | Complétion |');
console.log('| :--- | :--- | :---: | :---: | :---: | :---: |');

pillarNames.forEach((pId, idx) => {
    if (pId === 'CORE') return;
    const block = pillars[idx];
    const modulesMatch = block.match(/modules: \[(.*?)\]/);
    if (!modulesMatch) return;
    
    const modules = modulesMatch[1].split(',').map(m => m.trim().replace(/'/g, '').replace(/"/g, ''));
    modules.forEach((mLabel, j) => {
        if (!mLabel) return;
        const mId = `${pId}_${j}`;
        const s = status[mId] || { connected: false, active: false };
        const exists = s.active || s.connected;
        let score = 0;
        if (exists) score += 50;
        if (s.connected) score += 25;
        if (s.active) score += 25;
        console.log(`| ${pId} | ${mLabel} | ${exists ? '✅' : '❌'} | ${s.connected ? '✅' : '❌'} | ${s.active ? '✅' : '❌'} | **${score}%** |`);
    });
});
