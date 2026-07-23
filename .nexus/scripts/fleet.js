const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const INSTANCES_DIR = path.resolve(__dirname, '../instances');
const REPO_ROOT = path.resolve(__dirname, '..');

function getInstances() {
  if (!fs.existsSync(INSTANCES_DIR)) return [];
  return fs.readdirSync(INSTANCES_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => ({
      id: path.basename(file, '.json'),
      path: path.join(INSTANCES_DIR, file)
    }));
}

function list() {
  const instances = getInstances();
  console.log('\n--- 🏛️  FLOTTE RESTAURANT OS ---');
  if (instances.length === 0) {
    console.log('Aucune instance trouvée dans /instances');
    return;
  }
  instances.forEach(inst => {
    console.log(`- ${inst.id.padEnd(20)} (${inst.path})`);
  });
  console.log('-------------------------------\n');
}

function switchInstance(id) {
  const instances = getInstances();
  const target = instances.find(inst => inst.id === id);

  if (!target) {
    console.error(`❌ Instance '${id}' introuvable.`);
    process.exit(1);
  }

  console.log(`\n🔄 Basculement vers l'instance: ${id}...`);
  try {
    // On utilise le script existant pour générer le .env.local
    execSync(`node scripts/generate-instance-env.js instances/${id}.json .env.local`, {
      stdio: 'inherit',
      cwd: REPO_ROOT
    });
    console.log(`✅ Environnement local prêt pour ${id}\n`);
    console.log(`💡 Lancez 'npm run dev' pour voir le résultat.\n`);
  } catch (err) {
    console.error(`❌ Échec du basculement: ${err.message}`);
    process.exit(1);
  }
}

function deploy(id) {
  const instances = getInstances();
  const target = instances.find(inst => inst.id === id);

  if (!target) {
    console.error(`❌ Instance '${id}' introuvable.`);
    process.exit(1);
  }

  console.log(`\n🚀 Lancement du déploiement PRODUCTION pour: ${id}...`);
  try {
    // 1. Préparer l'environnement de production
    execSync(`node scripts/generate-instance-env.js instances/${id}.json .env.production`, {
      stdio: 'inherit',
      cwd: REPO_ROOT
    });
    
    // 2. Lancer le build et le deploy (via le script npm existant s'il existe ou via firebase)
    console.log(`📦 Construction de l'image optimisée...`);
    execSync(`npm run build`, { stdio: 'inherit', cwd: REPO_ROOT });
    
    console.log(`🛰️  Upload vers Firebase Hosting...`);
    execSync(`firebase deploy --only hosting:restaurant-os-web`, { stdio: 'inherit', cwd: REPO_ROOT });
    
    console.log(`\n🏆 Déploiement réussi pour ${id} !`);
  } catch (err) {
    console.error(`❌ Échec du déploiement: ${err.message}`);
    process.exit(1);
  }
}

const [cmd, arg] = process.argv.slice(2);

switch (cmd) {
  case 'list':
    list();
    break;
  case 'switch':
    if (!arg) {
      console.error('Usage: fleet switch <instance-id>');
      process.exit(1);
    }
    switchInstance(arg);
    break;
  case 'deploy':
    if (!arg) {
      console.error('Usage: fleet deploy <instance-id>');
      process.exit(1);
    }
    deploy(arg);
    break;
  default:
    console.log('Usage: node scripts/fleet.js <list|switch|deploy> [instance-id]');
    process.exit(1);
}
