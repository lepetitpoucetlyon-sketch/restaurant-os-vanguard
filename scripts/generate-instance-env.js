const fs = require('fs');
const path = require('path');
const {
  buildEnvMapFromClientConfig,
  formatEnvFile,
  readJsonFile,
  validateEnvMap,
} = require('./instance-utils');

function printUsage() {
  console.log('Usage: node scripts/generate-instance-env.js <client-config.json> [output-file]');
  console.log('Example: node scripts/generate-instance-env.js templates/client-instance.template.json .env.local');
}

const [inputArg, outputArg = '.env.local'] = process.argv.slice(2);

if (!inputArg) {
  printUsage();
  process.exit(1);
}

const inputPath = path.resolve(process.cwd(), inputArg);
const outputPath = path.resolve(process.cwd(), outputArg);

try {
  const clientConfig = readJsonFile(inputPath);
  const envMap = buildEnvMapFromClientConfig(clientConfig);
  const { errors, warnings } = validateEnvMap(envMap);

  if (errors.length > 0) {
    console.error('❌ Configuration client incomplete ou invalide:');
    for (const error of errors) {
      console.error(`   - ${error}`);
    }

    if (warnings.length > 0) {
      console.error('⚠️ Points d’attention:');
      for (const warning of warnings) {
        console.error(`   - ${warning}`);
      }
    }

    process.exit(1);
  }

  fs.writeFileSync(outputPath, formatEnvFile(envMap), 'utf8');

  console.log(`✅ Fichier d’instance genere: ${outputPath}`);
  console.log(`   Source client: ${inputPath}`);

  if (warnings.length > 0) {
    console.warn('⚠️ Validation avec avertissements:');
    for (const warning of warnings) {
      console.warn(`   - ${warning}`);
    }
  }
} catch (error) {
  console.error(`❌ Impossible de generer le fichier d’instance: ${error.message}`);
  process.exit(1);
}
