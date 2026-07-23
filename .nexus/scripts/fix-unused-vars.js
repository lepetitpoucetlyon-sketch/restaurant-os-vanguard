const fs = require('fs');
const path = require('path');

const reportFile = 'lint.txt';
if (!fs.existsSync(reportFile)) {
    console.error('lint.txt not found');
    process.exit(1);
}

const content = fs.readFileSync(reportFile, 'utf8');
const lines = content.split('\n');

const errorsByFile = {};
let currentFile = '';

lines.forEach(line => {
    // Match file paths (absolute starting with /Users/...)
    if (line.startsWith('/Users/')) {
        currentFile = line.trim();
        return;
    }

    // Match unused var errors: "  12:34  error  'foo' is defined but never used  @typescript-eslint/no-unused-vars"
    const match = line.match(/^\s+(\d+):(\d+)\s+error\s+'([^']+)' is defined but never used/);
    if (match && currentFile) {
        const row = parseInt(match[1]);
        const col = parseInt(match[2]);
        const varName = match[3];

        if (!errorsByFile[currentFile]) errorsByFile[currentFile] = [];
        errorsByFile[currentFile].push({ row, col, varName });
    }
});

Object.keys(errorsByFile).forEach(filePath => {
    if (!fs.existsSync(filePath)) return;

    let fileContent = fs.readFileSync(filePath, 'utf8');
    const contentLines = fileContent.split('\n');

    // Sort by row descending, then col descending to avoid offset issues
    const errors = errorsByFile[filePath].sort((a, b) => {
        if (b.row !== a.row) return b.row - a.row;
        return b.col - a.col;
    });

    errors.forEach(err => {
        const lineIdx = err.row - 1;
        const colIdx = err.col - 1;
        const line = contentLines[lineIdx];

        if (line && line.substring(colIdx, colIdx + err.varName.length) === err.varName) {
            const newLine = line.substring(0, colIdx) + '_' + line.substring(colIdx);
            contentLines[lineIdx] = newLine;
        } else {
            console.warn(`Mismatch in ${filePath}:${err.row}:${err.col} for ${err.varName}`);
        }
    });

    fs.writeFileSync(filePath, contentLines.join('\n'), 'utf8');
    console.log(`Fixed ${errors.length} issues in ${path.basename(filePath)}`);
});
