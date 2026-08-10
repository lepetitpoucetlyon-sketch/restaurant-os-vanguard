const fs = require('fs');
const cp = require('child_process');

const grepOut = cp.execSync("grep -rn \"from '@/modules/\" src/shared src/lib src/store || true", { encoding: 'utf8' });

const importedThings = new Set();
for (const line of grepOut.split('\n')) {
   if (!line) continue;
   const match = line.match(/import\s+\{([^}]+)\}\s+from\s+'@\/modules/);
   if (match) {
      const parts = match[1].split(',').map(s => s.trim()).filter(Boolean);
      for (const p of parts) importedThings.add(p);
   } else {
      const matchDefault = line.match(/import\s+(\w+)\s+from\s+'@\/modules/);
      if (matchDefault) importedThings.add(matchDefault[1]);
   }
}

console.log([...importedThings]);
