const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { formatEnvFile, loadConfigInput, validateEnvMap } = require('./instance-utils');

const PRODUCT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_ENV_FILE = path.join(PRODUCT_ROOT, '.env.local');

function runStep(label, command, args, options = {}) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, {
    cwd: PRODUCT_ROOT,
    stdio: 'inherit',
    shell: false,
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${label} a echoue avec le code ${result.status}.`);
  }
}

function printUsage() {
  console.log('Usage: node scripts/preflight-instance.js [config.json|.env.local]');
  console.log('Examples:');
  console.log('  node scripts/preflight-instance.js .env.local');
  console.log('  node scripts/preflight-instance.js client-configs/maison-atlas.json');
}

async function main() {
  const [inputArg = '.env.local'] = process.argv.slice(2);

  if (inputArg === '--help' || inputArg === '-h') {
    printUsage();
    process.exit(0);
  }

  const { resolvedPath, inputType, envMap } = loadConfigInput(inputArg);
  const { errors, warnings } = validateEnvMap(envMap);

  if (errors.length > 0) {
    console.error(`❌ Configuration invalide (${inputType}): ${resolvedPath}`);
    for (const error of errors) {
      console.error(`   - ${error}`);
    }
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn(`⚠️ Validation avec avertissements (${inputType}): ${resolvedPath}`);
    for (const warning of warnings) {
      console.warn(`   - ${warning}`);
    }
  }

  const previousEnvExists = fs.existsSync(DEFAULT_ENV_FILE);
  const previousEnvContent = previousEnvExists ? fs.readFileSync(DEFAULT_ENV_FILE, 'utf8') : null;
  let tempEnvWasWritten = false;

  try {
    if (inputType === 'json') {
      fs.writeFileSync(DEFAULT_ENV_FILE, formatEnvFile(envMap), 'utf8');
      tempEnvWasWritten = true;
      console.log(`ℹ️ .env.local temporaire genere depuis ${resolvedPath} pour le preflight.`);
    } else if (path.resolve(resolvedPath) !== DEFAULT_ENV_FILE) {
      fs.copyFileSync(resolvedPath, DEFAULT_ENV_FILE);
      tempEnvWasWritten = true;
      console.log(`ℹ️ .env.local temporaire copie depuis ${resolvedPath} pour le preflight.`);
    }

    runStep('Compilation des Cloud Functions', 'npm', ['--prefix', 'functions', 'run', 'build']);
    runStep('Verification TypeScript app', 'npx', ['tsc', '--noEmit', '--pretty', 'false']);
    runStep('Build production app', 'npm', ['run', 'build']);

    console.log('\n✅ Preflight d’instance termine avec succes.');
  } finally {
    if (tempEnvWasWritten) {
      if (previousEnvExists && previousEnvContent !== null) {
        fs.writeFileSync(DEFAULT_ENV_FILE, previousEnvContent, 'utf8');
      } else if (fs.existsSync(DEFAULT_ENV_FILE)) {
        fs.unlinkSync(DEFAULT_ENV_FILE);
      }
    }
  }
}

main().catch((error) => {
  console.error(`\n❌ Preflight impossible: ${error.message}`);
  process.exit(1);
});
