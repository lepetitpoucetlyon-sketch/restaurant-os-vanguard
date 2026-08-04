const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPLACEMENTS = [
    {
        from: /@\/?modules\/commerce\/acquisition/g,
        to: '@/verticals/restaurant/commerce/acquisition'
    },
    {
        from: /@\/?modules\/commerce\/catalog/g,
        to: '@/verticals/restaurant/catalog'
    },
    {
        from: /@\/?modules\/commerce\/fidelite/g,
        to: '@/verticals/restaurant/relation/loyalty'
    },
    {
        from: /@\/?modules\/commerce\/relation/g,
        to: '@/shared/nexus/engines/CRM'
    },
    {
        from: /@\/?modules\/commerce/g,
        to: '@/shared/nexus/engines/CRM' // Generic fallback for @modules/commerce exports
    },
    // Relative imports inside src/modules/commerce/index.ts
    {
        from: /'\.\/acquisition/g,
        to: "'@/verticals/restaurant/commerce/acquisition"
    },
    {
        from: /'\.\/catalog/g,
        to: "'@/verticals/restaurant/catalog"
    },
    {
        from: /'\.\/fidelite/g,
        to: "'@/verticals/restaurant/relation/loyalty"
    },
    {
        from: /'\.\/relation/g,
        to: "'@/shared/nexus/engines/CRM"
    }
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const rule of REPLACEMENTS) {
        if (rule.from.test(content)) {
            content = content.replace(rule.from, rule.to);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated: ${filePath}`);
    }
}

function run() {
    const files = execSync('find src -type f -name "*.ts" -o -name "*.tsx"').toString().split('\n').filter(Boolean);
    for (const file of files) {
        processFile(file);
    }
}

run();
