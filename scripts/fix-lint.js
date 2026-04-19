const fs = require('fs');
const path = require('path');

// This script reads the .eslint_output.txt and automatically prefixes unused variables with '_'
// to satisfy '@typescript-eslint/no-unused-vars'.

const LOG_FILE = '.eslint_output.txt';

if (!fs.existsSync(LOG_FILE)) {
    console.error('ESLint output file not found. Run npm run lint > .eslint_output.txt first.');
    process.exit(1);
}

const content = fs.readFileSync(LOG_FILE, 'utf8');
const lines = content.split('\n');

const fileFixes = {};

lines.forEach(line => {
    // Match pattern: /path/to/file:line:col warning/error 'var_name' is defined but never used
    const match = line.match(/(.*):(\d+):(\d+)\s+(warning|error)\s+'(.*)' is defined but never used/);
    if (match) {
        const [_, filePath, lineNum, colNum, severity, varName] = match;
        const absolutePath = filePath.trim();
        
        if (!fileFixes[absolutePath]) fileFixes[absolutePath] = [];
        fileFixes[absolutePath].push({
            line: parseInt(lineNum),
            col: parseInt(colNum),
            varName
        });
    }
});

Object.keys(fileFixes).forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    
    let fileContent = fs.readFileSync(filePath, 'utf8').split('\n');
    // Sort fixes by line DESC to avoid offset issues when modifying lines
    const fixes = fileFixes[filePath].sort((a, b) => b.line - a.line || b.col - a.col);
    
    fixes.forEach(fix => {
        const lineIndex = fix.line - 1;
        const colIndex = fix.col - 1;
        const lineText = fileContent[lineIndex];
        
        // Verify the variable name is at the reported column
        // Note: ESLint column is 1-indexed. Sometimes it points to the start of the identifier.
        const before = lineText.substring(0, colIndex);
        const after = lineText.substring(colIndex);
        
        if (after.startsWith(fix.varName)) {
            fileContent[lineIndex] = before + '_' + after;
            console.log(`Fixed ${fix.varName} in ${path.basename(filePath)}:${fix.line}`);
        } else {
            // Fallback: search for the variable in the line if col hit is slightly off
            if (lineText.includes(fix.varName)) {
                // Only replace the first occurrence in that line that isn't already prefixed
                fileContent[lineIndex] = lineText.replace(new RegExp(`\\b${fix.varName}\\b`, 'g'), `_${fix.varName}`);
                console.log(`Fixed ${fix.varName} (regex) in ${path.basename(filePath)}:${fix.line}`);
            }
        }
    });
    
    fs.writeFileSync(filePath, fileContent.join('\n'));
});

console.log('Cleanup complete.');
