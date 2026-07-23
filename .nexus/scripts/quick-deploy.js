const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 🚀 NEXUS QUICK DEPLOY
 * Usage: node quick-deploy.js --type=hook --pillar=ops --name=useFastLogic
 */

const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, value] = arg.replace('--', '').split('=');
    acc[key] = value;
    return acc;
}, {});

const { type, pillar, name } = args;

if (!type || !pillar || !name) {
    console.error('❌ Missing arguments. Usage: --type=[hook|component|service|util] --pillar=[ops|finance|...] --name=[name]');
    process.exit(1);
}

// Map types to folders
const typeMap = {
    hook: 'hooks',
    component: 'components',
    service: 'services',
    domain: 'domain',
    util: 'domain/utils',
    type: 'types',
    store: 'store'
};

const folder = typeMap[type] || type;
const extension = type === 'component' ? 'tsx' : 'ts';
const targetDir = path.resolve(__dirname, `../../src/modules/${pillar}/${folder}`);
const targetFile = path.join(targetDir, `${name}.${extension}`);

// 1. Create directory
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// 2. Create file with boilerplate
const boilerplate = `/**
 * 🛰️ NEXUS QUICK DEPLOY - ${name}
 * Pillar: ${pillar.toUpperCase()} | Type: ${type.toUpperCase()}
 */

export const ${name} = () => {
    // Logic here
};
`;

if (!fs.existsSync(targetFile)) {
    fs.writeFileSync(targetFile, boilerplate);
    console.log(`✅ Created: ${targetFile}`);
} else {
    console.log(`⚠️ File already exists: ${targetFile}`);
}

// 3. Trigger Smart Seal
console.log('🛰️ Triggering Smart Seal Suture...');
try {
    execSync('node .nexus/scripts/smart-seal.js', { stdio: 'inherit', cwd: path.resolve(__dirname, '../../') });
} catch (err) {
    console.error('❌ Smart Seal failed.');
}

console.log('🚀 Deployment Complete.');
