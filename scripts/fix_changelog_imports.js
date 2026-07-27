const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/admin/fleet/changelog/route.ts',
  'src/app/api/admin/fleet/tenant-override/route.ts',
  'src/app/api/admin/fleet/upgrade/route.ts'
];

for (const file of files) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    content = content.replace(/@\/lib\/mcc\/ChangelogService/g, '@/shared/nexus/engines/mcc/ChangelogService');
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated ' + file);
    }
  }
}
