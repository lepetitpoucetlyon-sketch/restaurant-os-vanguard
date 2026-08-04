const fs = require('fs');
const { execSync } = require('child_process');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Undo the generic replacement where CRM is imported without subpaths
    const regex = /from ['"]@\/shared\/nexus\/engines\/CRM['"]/g;
    
    if (regex.test(content)) {
        content = content.replace(regex, "from '@/modules/commerce'");
        fs.writeFileSync(filePath, content);
        console.log(`Reverted: ${filePath}`);
    }
}

function run() {
    const files = execSync('find src -type f -name "*.ts" -o -name "*.tsx"').toString().split('\n').filter(Boolean);
    for (const file of files) {
        processFile(file);
    }
}

run();
