const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../src');

const replacements = [
  { from: /'@\/hooks'/g, to: "'@/shared/hooks'" },
  { from: /"@\/hooks"/g, to: '"@/shared/hooks"' },
  { from: /'@\/context'/g, to: "'@/shared/contexts'" },
  { from: /"@\/context"/g, to: '"@/shared/contexts"' },
  { from: /\.\/providers\/UIThemeProvider/g, to: './UIThemeProvider' },
  { from: /\.\/providers\/NotificationProvider/g, to: './NotificationProvider' },
  { from: /@\/shared\/contexts\/ThemeContext/g, to: '@/shared/contexts/ThemeContext' }, // Ensure path
  { from: /useTheme/g, to: 'useTheme' } // Let's check why ThemeContext has no useTheme
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      
      for (const rule of replacements) {
        content = content.replace(rule.from, rule.to);
      }
      
      if (content !== originalContent) {
        console.log(`Updated: ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  }
}

processDirectory(directoryPath);
console.log("Done fixing exact hooks/context matches.");
