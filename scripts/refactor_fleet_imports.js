const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);
const fleetImports = [
  'NexusFleetProvider', 'useNexusFleet', 'FleetCommander', 'FleetComplianceService',
  'SiteIntegrityReport', 'GlobalComplianceCertificate', 'FleetTelemetryService',
  'fleetTelemetry', 'QuantumOrchestrator', 'MarketOracle'
];

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;

  // Regex to match imports from @/modules/intelligence
  const importRegex = /import\s+{([^}]+)}\s+from\s+['"]@\/modules\/intelligence['"]/g;
  
  content = content.replace(importRegex, (match, importsStr) => {
    const imports = importsStr.split(',').map(i => i.trim()).filter(i => i);
    
    const fleetList = [];
    const otherList = [];
    
    imports.forEach(imp => {
      // Handle "import { type X }"
      const cleanImp = imp.replace(/^type\s+/, '');
      if (fleetImports.includes(cleanImp)) {
        fleetList.push(imp);
      } else {
        otherList.push(imp);
      }
    });

    if (fleetList.length > 0) {
      changed = true;
      let newImports = `import { ${fleetList.join(', ')} } from '@/shared/nexus/engines/mcc/fleet';`;
      if (otherList.length > 0) {
        newImports += `\nimport { ${otherList.join(', ')} } from '@/modules/intelligence';`;
      }
      return newImports;
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Updated ${file}`);
    changedFiles++;
  }
});

console.log(`Updated ${changedFiles} files.`);
