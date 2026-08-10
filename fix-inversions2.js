const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function sh(cmd) {
   return cp.execSync(cmd, { encoding: 'utf8' }).trim();
}

const files = sh('find src -type f -name "*.ts" -o -name "*.tsx"').split('\n').filter(Boolean);
for (const file of files) {
   let content = fs.readFileSync(file, 'utf8');
   let modified = false;
   if (content.includes('@/store/pillars')) {
       content = content.replace(/@\/store\/pillars/g, '@/bootstrap/store/pillars');
       modified = true;
   }
   if (modified) {
       fs.writeFileSync(file, content);
   }
}

console.log("Fixed store/pillars imports.");
