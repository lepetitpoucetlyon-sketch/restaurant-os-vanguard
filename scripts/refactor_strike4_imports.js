const fs = require('fs');
const { execSync } = require('child_process');

const REPLACEMENTS = [
    {
        from: /@\/?modules\/compliance\/securite/g,
        to: '@/shared/nexus/vault/audits'
    },
    {
        from: /@\/?modules\/compliance\/qualite/g,
        to: '@/verticals/restaurant/compliance/haccp'
    },
    {
        from: /@\/?modules\/compliance\/reglementaire/g,
        to: '@/verticals/restaurant/compliance/regulatory'
    },
    {
        from: /@\/?modules\/intelligence\/ia/g,
        to: '@/shared/nexus/engines/AI/ia'
    },
    {
        from: /@\/?modules\/intelligence\/simulation/g,
        to: '@/shared/nexus/engines/AI/simulation'
    },
    {
        from: /@\/?modules\/human\/effectifs/g,
        to: '@/verticals/restaurant/human/staffing'
    },
    {
        from: /@\/?modules\/human\/remuneration/g,
        to: '@/verticals/restaurant/human/tip-pooling'
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
