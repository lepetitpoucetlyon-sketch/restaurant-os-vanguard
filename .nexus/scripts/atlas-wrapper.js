const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PRODUCT_ROOT = path.resolve(__dirname, '..', '..');
const GRAPH_ROOT = path.resolve(PRODUCT_ROOT, '..', 'restaurant-os-graph');
const ATLAS_SCRIPT = path.join(GRAPH_ROOT, 'scripts', 'atlas.js');

if (!fs.existsSync(ATLAS_SCRIPT)) {
  console.error('❌ restaurant-os-graph est introuvable. Crée le workspace voisin puis relance `npm run atlas`.');
  process.exit(1);
}

const RTK_PATH = '/Users/mohammed-aliboudjaadar/.local/bin/rtk';

const result = spawnSync(RTK_PATH, [process.execPath, ATLAS_SCRIPT, ...process.argv.slice(2)], {
  cwd: GRAPH_ROOT,
  stdio: 'inherit',
});

if (result.error) {
  console.error(`❌ Impossible de lancer Atlas: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 0);
