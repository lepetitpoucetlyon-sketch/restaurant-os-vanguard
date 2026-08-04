const fs = require('fs');
const { execSync } = require('child_process');

const REPLACEMENTS = [
    {
        from: /@\/?modules\/finance\/fiscalite/g,
        to: '@/shared/nexus/engines/FiscalEngine'
    },
    {
        from: /@\/?modules\/finance\/comptabilite/g,
        to: '@/shared/nexus/engines/Ledger'
    },
    {
        from: /@\/?modules\/finance\/tresorerie/g,
        to: '@/verticals/restaurant/finance/cash'
    },
    {
        from: /@\/?modules\/logistics\/approvisionnement/g,
        to: '@/verticals/restaurant/logistics/procurement'
    },
    {
        from: /@\/?modules\/logistics\/stock/g,
        to: '@/verticals/restaurant/logistics/inventory'
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
