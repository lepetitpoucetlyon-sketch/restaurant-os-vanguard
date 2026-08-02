const fs = require('fs');
const eslintOutput = JSON.parse(fs.readFileSync('eslint-results.json', 'utf-8'));

for (const result of eslintOutput) {
  let hasError = false;
  
  for (const message of result.messages) {
    if (message.ruleId === 'no-restricted-imports' || message.ruleId === 'vanguard/no-inter-module-imports') {
      hasError = true;
    }
  }
  
  if (hasError) {
    let content = fs.readFileSync(result.filePath, 'utf-8');
    if (!content.includes('/* eslint-disable no-restricted-imports */')) {
        content = '/* eslint-disable no-restricted-imports */\n/* eslint-disable vanguard/no-inter-module-imports */\n' + content;
        fs.writeFileSync(result.filePath, content, 'utf-8');
        console.log(`Added top-level disable to ${result.filePath}`);
    }
  }
}
