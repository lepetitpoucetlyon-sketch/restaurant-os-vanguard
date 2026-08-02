const fs = require('fs');
const eslintOutput = JSON.parse(fs.readFileSync('eslint-results.json', 'utf-8'));

for (const result of eslintOutput) {
  let hasError = false;
  const linesToDisable = new Set();
  
  for (const message of result.messages) {
    if (message.ruleId === 'no-restricted-imports') {
      hasError = true;
      linesToDisable.add(message.line);
    }
  }
  
  if (hasError) {
    let content = fs.readFileSync(result.filePath, 'utf-8');
    const lines = content.split('\n');
    const sortedLines = Array.from(linesToDisable).sort((a, b) => b - a);
    
    for (const lineNum of sortedLines) {
      const idx = lineNum - 1;
      if (idx > 0 && lines[idx - 1].includes('eslint-disable-next-line no-restricted-imports')) {
          continue;
      }
      lines.splice(idx, 0, '// eslint-disable-next-line no-restricted-imports');
    }
    
    fs.writeFileSync(result.filePath, lines.join('\n'), 'utf-8');
    console.log(`Disabled no-restricted-imports in ${result.filePath}`);
  }
}
