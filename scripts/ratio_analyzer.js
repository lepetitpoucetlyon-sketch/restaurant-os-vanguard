const fs = require('fs');
const path = require('path');

const modulesPath = './src/modules';
if (!fs.existsSync(modulesPath)) {
    console.log('Modules path not found');
    process.exit(1);
}

const pillars = fs.readdirSync(modulesPath).filter(f => fs.statSync(path.join(modulesPath, f)).isDirectory());

let nodes = pillars.length;
let connections = 0;
const fanIn = {};

pillars.forEach(p => {
    const pPath = path.join(modulesPath, p);
    function scanDir(dir) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                scanDir(fullPath);
            } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                const imports = content.match(/import.*from.*'@\/modules\/([^/']+)'/g) || [];
                imports.forEach(i => {
                    const match = i.match(/'@\/modules\/([^/']+)'/);
                    if (match && match[1] !== p) {
                        connections++;
                        fanIn[match[1]] = (fanIn[match[1]] || 0) + 1;
                    }
                });
            }
        });
    }
    scanDir(pPath);
});

console.log('Nodes (Pillars):', nodes);
console.log('Connections:', connections);
console.log('Ratio:', (connections / nodes).toFixed(2));
console.log('Top Fan-In:', JSON.stringify(Object.entries(fanIn).sort((a,b) => b[1] - a[1]).slice(0, 5)));
