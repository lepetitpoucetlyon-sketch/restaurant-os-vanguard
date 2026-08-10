const fs = require('fs');
let task = fs.readFileSync('/Users/mohammed-aliboudjaadar/.gemini/antigravity-ide/brain/6fd4132a-1f3d-4c24-8f21-6ef128fd196b/task.md', 'utf8');

task = task.replace(/- \[ \] \*\*2B.1\*\*/, '- [x] **2B.1**');
task = task.replace(/- \[ \] \*\*2B.2\*\*/, '- [x] **2B.2**');
task = task.replace(/- \[ \] \*\*2B.3\*\*/, '- [x] **2B.3**');
task = task.replace(/- \[ \] \*\*2C\*\*/, '- [x] **2C**');
task = task.replace(/- \[ \] \*\*2B.0\*\*/, '- [x] **2B.0**');
task = task.replace(/- \[ \] \*\*🚪 PORTE PHASE 2\*\*/, '- [x] **🚪 PORTE PHASE 2**');

fs.writeFileSync('/Users/mohammed-aliboudjaadar/.gemini/antigravity-ide/brain/6fd4132a-1f3d-4c24-8f21-6ef128fd196b/task.md', task);
