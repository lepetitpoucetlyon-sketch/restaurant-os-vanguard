const fs = require('fs');
const { execSync } = require('child_process');

const REPLACEMENTS = [
    {
        from: /@\/?modules\/facility\/spaces/g,
        to: '@/verticals/restaurant/ops/table-management'
    },
    {
        from: /@\/?modules\/facility\/maintenance/g,
        to: '@/verticals/restaurant/compliance/maintenance'
    },
    {
        from: /@\/?modules\/facility\/assets/g,
        to: '@/shared/nexus/engines/AssetManager'
    },
    {
        from: /@\/?modules\/ops\/production\/kds/g,
        to: '@/verticals/restaurant/ops/kitchen/kds'
    },
    {
        from: /@\/?modules\/ops\/production\/kitchen/g,
        to: '@/verticals/restaurant/ops/kitchen'
    },
    {
        from: /@\/?modules\/ops\/production\/recipes/g,
        to: '@/verticals/restaurant/ops/recipes'
    },
    {
        from: /@\/?modules\/ops\/service\/pos/g,
        to: '@/verticals/restaurant/ops/pos'
    },
    {
        from: /@\/?modules\/ops\/service\/bar/g,
        to: '@/verticals/restaurant/ops/bar'
    },
    {
        from: /@\/?modules\/ops\/service\/printers/g,
        to: '@/verticals/restaurant/ops/printers'
    },
    {
        from: /@\/?modules\/ops\/workflow/g,
        to: '@/verticals/restaurant/ops/workflow'
    }
];

// Special relative imports fixing for files that have been moved but still use relative imports going out to `@modules/...` equivalents
const RELATIVE_TO_ABSOLUTE_FIXES = [
    {
        from: /import { (.*?) } from '(\.\.\/\.\.\/.*?|.*?\.\.\/.*?)\/providers\/NexusOpsProvider'/g,
        to: "import { $1 } from '@/modules/ops/providers/NexusOpsProvider'"
    },
    {
        from: /import (.*?) from '(\.\.\/\.\.\/.*?|.*?\.\.\/.*?)\/workflow\/engine\/types'/g,
        to: "import $1 from '@/verticals/restaurant/ops/workflow/engine/types'"
    },
    {
        from: /import (.*?) from '(\.\.\/\.\.\/.*?|.*?\.\.\/.*?)\/workflow\/engine(.*?)'/g,
        to: "import $1 from '@/verticals/restaurant/ops/workflow/engine$3'"
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
    
    for (const rule of RELATIVE_TO_ABSOLUTE_FIXES) {
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
