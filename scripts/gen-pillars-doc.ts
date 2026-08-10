import * as fs from 'fs';
import * as path from 'path';

const IGNORE_DIRS = new Set([
  'providers', 'connectors', 'hooks', 'services', 'store', 'domain', 
  'migration', 'types', 'components', 'actions', 'utils', 'constants',
  'ui', 'api', 'schemas', 'assets', 'registre', 'models'
]);

function getModules(srcPath: string) {
  const result = new Map<string, Map<string, string[]>>();
  const pillars = fs.readdirSync(srcPath, { withFileTypes: true }).filter(d => d.isDirectory());
  
  for (const pillar of pillars) {
    if (pillar.name === 'index.ts') continue;
    
    result.set(pillar.name, new Map());
    const domainMap = result.get(pillar.name)!;
    
    const domains = fs.readdirSync(path.join(srcPath, pillar.name), { withFileTypes: true }).filter(d => d.isDirectory());
    for (const domain of domains) {
      if (IGNORE_DIRS.has(domain.name)) continue;
      
      domainMap.set(domain.name, []);
      const moduleArr = domainMap.get(domain.name)!;
      
      const domainPath = path.join(srcPath, pillar.name, domain.name);
      const modules = fs.readdirSync(domainPath, { withFileTypes: true }).filter(d => d.isDirectory());
      
      for (const mod of modules) {
        if (IGNORE_DIRS.has(mod.name)) continue;
        moduleArr.push(mod.name);
      }
    }
  }
  return result;
}

const modulesMap = getModules('./src/modules');

let table = '| Pilier | Domaines | Modules principaux |\n|--------|----------|-------------------|\n';
for (const [pillar, domainMap] of modulesMap.entries()) {
  if (domainMap.size === 0) continue;
  
  const domains = Array.from(domainMap.keys()).map(d => `\`${d}/\``).join(' · ');
  
  const modulesList = Array.from(domainMap.entries()).map(([domain, mods]) => {
    if (mods.length === 0) return '';
    return `${domain}: ${mods.join(', ')}`;
  }).filter(Boolean).join(' · ');
  
  table += `| **${pillar}** | ${domains} | ${modulesList} |\n`;
}

const claudeMdPath = './CLAUDE.md';
if (fs.existsSync(claudeMdPath)) {
  const content = fs.readFileSync(claudeMdPath, 'utf8');
  const startMarker = '### Arborescence des piliers et domaines\n\n';
  const endMarker = '\n**Règle du Barrel renforcée**';
  
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);
  
  if (startIndex !== -1 && endIndex !== -1) {
    const newContent = content.substring(0, startIndex + startMarker.length) + table + content.substring(endIndex);
    fs.writeFileSync(claudeMdPath, newContent);
    console.log('CLAUDE.md updated successfully.');
  } else {
    console.log('Markers not found in CLAUDE.md');
  }
} else {
  console.log('CLAUDE.md not found');
}
