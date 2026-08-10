const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function sh(cmd) {
   return cp.execSync(cmd, { encoding: 'utf8' }).trim();
}

// 1. Move eventBus handlers & registerHandlers to src/bootstrap/eventBus
sh('mkdir -p src/bootstrap/eventBus');
sh('mv src/shared/eventBus/handlers src/bootstrap/eventBus/handlers || true');
sh('mv src/shared/eventBus/registerHandlers src/bootstrap/eventBus/registerHandlers || true');

// Update imports pointing to them
// Since we moved it, anything importing from @/shared/eventBus/handlers or registerHandlers needs to point to @/bootstrap/eventBus/..
const files = sh('find src -type f -name "*.ts" -o -name "*.tsx"').split('\n').filter(Boolean);
for (const file of files) {
   let content = fs.readFileSync(file, 'utf8');
   if (content.includes('@/shared/eventBus/registerHandlers') || content.includes('@/shared/eventBus/handlers') || content.includes('../registerHandlers')) {
       content = content.replace(/@\/shared\/eventBus\/registerHandlers/g, '@/bootstrap/eventBus/registerHandlers');
       content = content.replace(/@\/shared\/eventBus\/handlers/g, '@/bootstrap/eventBus/handlers');
       fs.writeFileSync(file, content);
   }
}

// Inside the moved handlers, they imported from `../NexusEventBus` which is still in `shared`.
// So `../NexusEventBus` becomes `@/shared/eventBus/NexusEventBus`
// Also `../onValidated`, `../middleware/withRoleGuard` etc.
const movedFiles = sh('find src/bootstrap/eventBus -type f').split('\n').filter(Boolean);
for (const file of movedFiles) {
   let content = fs.readFileSync(file, 'utf8');
   content = content.replace(/from\s+['"]\.\.\/NexusEventBus['"]/g, "from '@/shared/eventBus/NexusEventBus'");
   content = content.replace(/from\s+['"]\.\.\/ServerEventBus['"]/g, "from '@/shared/eventBus/ServerEventBus'");
   content = content.replace(/from\s+['"]\.\.\/onValidated['"]/g, "from '@/shared/eventBus/onValidated'");
   content = content.replace(/from\s+['"]\.\.\/middleware\//g, "from '@/shared/eventBus/middleware/");
   fs.writeFileSync(file, content);
}

// 2. Move store/pillars to src/bootstrap/store/pillars (or just ignore for now and see what's left)
sh('mkdir -p src/bootstrap/store');
sh('mv src/store/pillars src/bootstrap/store/pillars || true');
for (const file of files) {
   let content = fs.readFileSync(file, 'utf8');
   if (content.includes('@/store/pillars')) {
       content = content.replace(/@\/store\/pillars/g, '@/bootstrap/store/pillars');
       fs.writeFileSync(file, content);
   }
}

console.log("Moved eventBus and store pillars.");
