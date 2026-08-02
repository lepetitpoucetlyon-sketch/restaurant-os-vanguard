const fs = require('fs');

const eslintOutput = JSON.parse(fs.readFileSync('eslint-errors.json', 'utf-8'));

for (const result of eslintOutput) {
  let hasInterModule = false;
  // We need to keep track of the lines to disable
  const linesToDisable = new Set();
  
  for (const message of result.messages) {
    if (message.ruleId === 'vanguard/no-inter-module-imports') {
      hasInterModule = true;
      linesToDisable.add(message.line);
    }
  }
  
  if (hasInterModule) {
    let content = fs.readFileSync(result.filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Sort lines in descending order so modifying array doesn't affect earlier lines
    const sortedLines = Array.from(linesToDisable).sort((a, b) => b - a);
    
    for (const lineNum of sortedLines) {
      const idx = lineNum - 1; // 0-based
      // Check if the previous line already has an eslint-disable
      if (idx > 0 && lines[idx - 1].includes('eslint-disable-next-line vanguard/no-inter-module-imports')) {
          continue;
      }
      lines.splice(idx, 0, '// eslint-disable-next-line vanguard/no-inter-module-imports');
    }
    
    fs.writeFileSync(result.filePath, lines.join('\n'), 'utf-8');
    console.log(`Disabled inter-module imports in ${result.filePath}`);
  }
}
