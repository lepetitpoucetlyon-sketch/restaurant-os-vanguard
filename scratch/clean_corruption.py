import re
import os

files_to_clean = [
    'src/components/layout/VoiceAssistantOverlay.tsx',
    'src/domain/services/AccessPolicyManager.ts',
    'src/lib/sovereign/lockdown.ts',
    'src/shared/nexus/contracts/auth.types.ts',
    'src/shared/nexus/guards/admin/mcc/index.ts',
    'src/shared/nexus/guards/RoleGate.tsx'
]

def clean_file(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    cleaned_lines = []
    pattern = re.compile(r'^\s*\d+\|')
    
    for line in lines:
        cleaned_line = pattern.sub('', line)
        cleaned_lines.append(cleaned_line)
    
    with open(filepath, 'w') as f:
        f.writelines(cleaned_lines)
    print(f"Cleaned: {filepath}")

for f in files_to_clean:
    clean_file(f)
