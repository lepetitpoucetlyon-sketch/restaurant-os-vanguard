const { loadConfigInput, validateEnvMap } = require('./instance-utils');

function printUsage() {
  console.log('Usage: node scripts/validate-instance-config.js [config.json|.env.local]');
  console.log('Default: node scripts/validate-instance-config.js .env.local');
}

const [inputArg = '.env.local'] = process.argv.slice(2);

if (inputArg === '--help' || inputArg === '-h') {
  printUsage();
  process.exit(0);
}

try {
  const { resolvedPath, inputType, envMap } = loadConfigInput(inputArg);
  const { errors, warnings } = validateEnvMap(envMap);

  if (errors.length > 0) {
    console.error(`❌ Validation d’instance en echec (${inputType}): ${resolvedPath}`);
    for (const error of errors) {
      console.error(`   - ${error}`);
    }

    if (warnings.length > 0) {
      console.error('⚠️ Avertissements:');
      for (const warning of warnings) {
        console.error(`   - ${warning}`);
      }
    }

    process.exit(1);
  }

  console.log(`✅ Configuration d’instance valide (${inputType}): ${resolvedPath}`);

  if (warnings.length > 0) {
    console.warn('⚠️ Avertissements:');
    for (const warning of warnings) {
      console.warn(`   - ${warning}`);
    }
  }
} catch (error) {
  console.error(`❌ Validation impossible: ${error.message}`);
  process.exit(1);
}
