const fs = require('fs');
const cp = require('child_process');

function sh(cmd) {
   return cp.execSync(cmd, { encoding: 'utf8' }).trim();
}

sh('mkdir -p src/bootstrap && mv src/shared/nexus/contracts/legacy.ts src/bootstrap/legacy.ts || true');

const files = sh('find src -type f -name "*.ts*"').split('\n').filter(Boolean);
for (const file of files) {
   let content = fs.readFileSync(file, 'utf8');
   if (content.includes('@/shared/nexus/contracts/legacy')) {
       content = content.replace(/@\/shared\/nexus\/contracts\/legacy/g, '@/bootstrap/legacy');
       fs.writeFileSync(file, content);
   }
}
console.log('Legacy barrel moved and imports updated.');
