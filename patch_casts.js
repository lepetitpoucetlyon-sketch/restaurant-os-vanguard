const fs = require('fs');

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

  const newContent = content
    .replace(/as unknown as /g, 'as ')
    .replace(/Record<string, unknown>/g, 'Record<string, import("@/shared/nexus-contract").SovereignValue>')
    .replace(/unknown\[\]/g, 'import("@/shared/nexus-contract").SovereignValue[]');

  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
  }
});
console.log("Removed as unknown as casts.");
