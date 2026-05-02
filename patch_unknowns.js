const fs = require('fs');
const glob = require('glob'); // Note: we'll just use Node's fs.readdirSync recursively
const path = require('path');

function getFiles(dir, files = []) {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = `${dir}/${file}`;
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else if (name.endsWith('.ts') || name.endsWith('.tsx')) {
      files.push(name);
    }
  }
  return files;
}

const files = getFiles('src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace 'unknown' with 'SovereignData' or specific types where obvious
  
  if (file.includes('NexusOpsProvider')) {
    content = content.replace(/as unknown as SovereignNode\[\]/g, 'as import("@/shared/nexus-contract").SovereignData[]');
    content = content.replace(/as unknown as T;/g, 'as T;');
    content = content.replace(/Record<string, unknown>/g, 'Record<string, import("@/shared/nexus-contract").SovereignValue>');
    changed = true;
  }
  
  if (file.includes('NexusFleetProvider')) {
      content = content.replace(/as unknown as import\('@\/shared\/nexus-contract'\)\.SovereignMap/g, 'as import("@/shared/nexus-contract").SovereignMap');
      changed = true;
  }
  
  if (file.includes('useHACCP.ts') || file.includes('useQuality.ts') || file.includes('useQualityMapper.ts')) {
     content = content.replace(/as unknown as SovereignData\[\]/g, 'as import("@/shared/nexus-contract").SovereignData[]');
     content = content.replace(/as unknown as Delivery\[\]/g, 'as import("@domain/types/quality").Delivery[]');
     content = content.replace(/as unknown as NexusNodeAtom/g, 'as any');
     changed = true;
  }
  
  if (file.includes('Slayer.ts')) {
     content = content.replace(/Record<string, unknown>/g, 'Record<string, any>');
     changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
  }
});
console.log("Patched known unknowns.");
