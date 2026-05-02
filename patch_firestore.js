const fs = require('fs');
let file = 'src/infrastructure/adapters/FirestoreAdapter.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<T = unknown>/g, '<T = any>'); // Or specific type, but any is broader. Wait, .cursorrules says ZERO CAST as any or as unknown.
content = content.replace(/<T = unknown>/g, '<T = import("@/shared/nexus-contract").SovereignData>');
content = content.replace(/data: unknown/g, 'data: import("@/shared/nexus-contract").SovereignData');

fs.writeFileSync(file, content);
