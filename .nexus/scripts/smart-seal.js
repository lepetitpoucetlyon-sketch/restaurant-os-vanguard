const fs = require('fs');
const path = require('path');

/**
 * 🏛️ NEXUS SMART SEAL GENERATOR
 * Automates the creation of barrel files (index.ts) across the Restaurant OS Core.
 */

const TARGET_DIR = path.resolve(__dirname, '../../src/modules');
const IGNORE_PATTERNS = [/index\.ts$/, /\.test\./, /\.spec\./, /\.d\.ts$/, /__internal__/];
const SMART_SEAL_HEADER = `/**
 * 🏛️ NEXUS SMART SEAL - Grade X Barrel
 * This file is automatically maintained. Do not edit manually.
 * Manual changes will be overwritten unless you remove this header.
 */\n\n`;

function getFilesAndDirs(dir) {
    const dirName = path.basename(dir);
    return fs.readdirSync(dir).filter(item => {
        // Special case: Allow .d.ts files if we are inside a 'types' folder
        if (dirName === 'types' && item.endsWith('.d.ts')) {
            return ![/index\.ts$/, /\.test\./, /\.spec\./, /__internal__/].some(pattern => pattern.test(item));
        }
        return !IGNORE_PATTERNS.some(pattern => pattern.test(item));
    });
}

function generateBarrel(dir) {
    const items = getFilesAndDirs(dir);
    if (items.length === 0) return;

    const exports = [];
    const subDirsToProcess = [];

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Check if directory has an index.ts or should have one
            const subItems = getFilesAndDirs(fullPath);
            if (subItems.length > 0) {
                exports.push(`export * from './${item}';`);
                subDirsToProcess.push(fullPath);
            }
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
            const name = path.parse(item).name;
            exports.push(`export * from './${name}';`);
        }
    });

    if (exports.length > 0) {
        const indexPath = path.join(dir, 'index.ts');
        const content = SMART_SEAL_HEADER + exports.join('\n') + '\n';

        let shouldWrite = true;
        if (fs.existsSync(indexPath)) {
            const existingContent = fs.readFileSync(indexPath, 'utf8');
            if (!existingContent.includes('NEXUS SMART SEAL')) {
                console.log(`[Smart Seal] Skipping manual barrel: ${indexPath}`);
                shouldWrite = false;
            }
        }

        if (shouldWrite) {
            fs.writeFileSync(indexPath, content);
            console.log(`[Smart Seal] Sealed: ${indexPath}`);
        }
    }

    subDirsToProcess.forEach(subDir => generateBarrel(subDir));
}

console.log('🛰️ Initializing Smart Seal Sequence...');
generateBarrel(TARGET_DIR);
generateBarrel(path.resolve(__dirname, '../../src/domain'));
console.log('✅ Suture Complete.');
