const fs = require('fs');
const cp = require('child_process');

function sh(cmd) {
   return cp.execSync(cmd, { encoding: 'utf8' }).trim();
}

// Map of source file -> new destination in shared/nexus/contracts or similar
const moves = [
  ['src/modules/ops/workflow/engine/types.ts', 'src/shared/nexus/contracts/ops.engine.types.ts'],
  ['src/modules/ops/workflow/engine/groups.types.ts', 'src/shared/nexus/contracts/ops.groups.types.ts'],
  ['src/modules/compliance/qualite/haccp/types.ts', 'src/shared/nexus/contracts/compliance.haccp.types.ts'],
  ['src/modules/system/types/index.ts', 'src/shared/nexus/contracts/system.types.ts'],
  ['src/modules/logistics/types/index.ts', 'src/shared/nexus/contracts/logistics.types.ts'],
  // And services from before
  ['src/modules/intelligence/knowledge/rag/types.ts', 'src/shared/nexus/contracts/intelligence.types.ts']
];

for (const [src, dest] of moves) {
  if (fs.existsSync(src)) {
     sh(`mv ${src} ${dest}`);
     const oldImport = src.replace('src/', '@/').replace(/\.tsx?$/, '');
     const newImport = dest.replace('src/', '@/').replace(/\.tsx?$/, '');
     // Update all files globally
     sh(`find src -type f -name "*.ts*" -exec sed -i '' "s|${oldImport}|${newImport}|g" {} + || true`);
  }
}

console.log("Moved types and updated imports.");
