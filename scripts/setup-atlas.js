const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const PRODUCT_ROOT = path.join(__dirname, '..');
const GRAPH_ROOT = path.resolve(PRODUCT_ROOT, '..', 'restaurant-os-graph');
const TOOL_DIR = path.join(GRAPH_ROOT, 'graphify_tool');

console.log('🏛️ Vérification de l\'Atlas Restaurant OS...');

if (!fs.existsSync(GRAPH_ROOT)) {
  console.error('❌ Erreur : le workspace ../restaurant-os-graph est introuvable.');
  process.exit(1);
}

if (!fs.existsSync(TOOL_DIR)) {
  console.error('❌ Erreur : le dossier restaurant-os-graph/graphify_tool est introuvable.');
  process.exit(1);
}

let graphifyBinary = '';
const commonPaths = [
  '/usr/local/bin/graphify',
  '/opt/homebrew/bin/graphify',
  path.join(process.env.HOME || '', 'Library/Python/3.11/bin/graphify')
];

try {
  graphifyBinary = execFileSync('which', ['graphify'], { encoding: 'utf8' }).trim();
} catch {
  // Try common paths instead
  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      graphifyBinary = p;
      break;
    }
  }
  
  if (!graphifyBinary) {
    console.error('❌ Erreur : la commande `graphify` est introuvable.');
    console.error('   Essai de recherche dans: ' + commonPaths.join(', '));
    process.exit(1);
  }
}

const firstLine = fs.readFileSync(graphifyBinary, 'utf8').split('\n')[0] || '';
const pythonCommand = firstLine.startsWith('#!') ? firstLine.slice(2).trim() : 'python3.11';
const commonPyPaths = [
  '/usr/local/bin/python3.11',
  '/opt/homebrew/bin/python3.11',
  '/usr/bin/python3'
];

let finalPyCommand = pythonCommand;
if (!fs.existsSync(finalPyCommand)) {
  for (const pyP of commonPyPaths) {
    if (fs.existsSync(pyP)) {
      finalPyCommand = pyP;
      break;
    }
  }
}

const probe = spawnSync(
  finalPyCommand,
  ['-c', 'import graphify, graphify.extract, graphify.build, graphify.cluster, graphify.analyze, graphify.report, graphify.export; print(graphify.__file__)'],
  { encoding: 'utf8' },
);

if (probe.error || probe.status !== 0) {
  console.error('❌ Erreur : le runtime Graphify Python n\'est pas exploitable avec cet interpréteur.');
  console.error('   Vérifie l\'installation liée à ta commande `graphify`.');
  process.exit(1);
}

console.log(`✅ Commande graphify détectée : ${graphifyBinary}`);
console.log(`✅ Interpréteur utilisé : ${pythonCommand}`);
console.log(`✅ Package Graphify chargé depuis : ${probe.stdout.trim()}`);
console.log(`✅ Source checkout déplacée dans : ${TOOL_DIR}`);
console.log('✨ Atlas prêt : le repo produit pointe désormais vers le workspace restaurant-os-graph.');
