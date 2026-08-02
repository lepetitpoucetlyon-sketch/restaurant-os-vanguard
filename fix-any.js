const fs = require('fs');
const path = require('path');

const eslintOutput = JSON.parse(fs.readFileSync('eslint-errors.json', 'utf-8'));

for (const result of eslintOutput) {
  let hasAny = false;
  for (const m of result.messages) {
    if (m.ruleId === '@typescript-eslint/no-explicit-any') { hasAny = true; break; }
  }
  if (!hasAny) continue;
  
  let content = fs.readFileSync(result.filePath, 'utf-8');
  let modified = false;
  
  // Strategy: replace common patterns of `any` with `unknown` or `Record<string, unknown>`
  // Pattern 1: `: any)` in function params -> `: unknown)`
  // Pattern 2: `as any` -> `as unknown`
  // Pattern 3: `<any>` -> `<unknown>`
  // Pattern 4: `any[]` -> `unknown[]`
  // Pattern 5: `Record<string, any>` -> `Record<string, unknown>`
  
  const replacements = [
    [/Record<string,\s*any>/g, 'Record<string, unknown>'],
    [/:\s*any\[\]/g, ': unknown[]'],
    [/:\s*any\)/g, ': unknown)'],
    [/:\s*any,/g, ': unknown,'],
    [/:\s*any;/g, ': unknown;'],
    [/:\s*any\s*=>/g, ': unknown =>'],
    [/as\s+any\b/g, 'as unknown'],
    [/<any>/g, '<unknown>'],
    [/<any,/g, '<unknown,'],
  ];
  
  for (const [pattern, replacement] of replacements) {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(result.filePath, content, 'utf-8');
    console.log(`Fixed any in ${result.filePath.replace('/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE/', '')}`);
  }
}
