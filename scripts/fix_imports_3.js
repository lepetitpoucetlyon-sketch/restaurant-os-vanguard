const fs = require('fs');

const replacements = [
  {
    file: 'src/components/layout/VoiceAssistantOverlay.tsx',
    replaces: [
      { from: "'./voice/NexusSphere'", to: "'@/shared/components/voice/ui/NexusSphere'" },
      { from: "'./voice/ChatThread'", to: "'@/shared/components/voice/ui/ChatThread'" },
      { from: "'./voice/SessionHistory'", to: "'@/shared/components/voice/ui/SessionHistory'" },
      { from: "'./voice/ChatInput'", to: "'@/shared/components/voice/ui/ChatInput'" },
      { from: "'./voice/voice-utils'", to: "'@/shared/components/voice/ui/voice-utils'" },
      { from: /toggleHistory\(\(id\) =>/g, to: 'toggleHistory((id: any) =>' },
      { from: /const handleUpload = \(e\) =>/g, to: 'const handleUpload = (e: any) =>' }
    ]
  },
  {
    file: 'src/shared/components/DocumentationPortal.tsx',
    replaces: [
      { from: "'./RecipeTechnicalSheet'", to: "'@/modules/ops/kitchen/components/RecipeTechnicalSheet'" }
    ]
  }
];

for (const { file, replaces } of replacements) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    for (const r of replaces) {
      if (typeof r.from === 'string') {
        content = content.replace(new RegExp(r.from, 'g'), r.to);
        // Also cover double quotes just in case
        if (r.from.startsWith("'") && r.from.endsWith("'")) {
          const fromDouble = '"' + r.from.slice(1, -1) + '"';
          const toDouble = '"' + r.to.slice(1, -1) + '"';
          content = content.replace(new RegExp(fromDouble, 'g'), toDouble);
        }
      } else {
        content = content.replace(r.from, r.to);
      }
    }
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
