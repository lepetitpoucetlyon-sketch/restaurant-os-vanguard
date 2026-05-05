import os
import re

for r, d, files in os.walk('src'):
    for f in files:
        if f.endswith(('.ts', '.tsx')):
            path = os.path.join(r, f)
            with open(path, 'r') as file:
                content = file.read()
            
            # Replace all occurrences of `any` used as type with `Any`
            # Need to be careful not to replace 'company' or similar words
            # Replace `any[]`
            content = re.sub(r'\bany\[\]', 'Any[]', content)
            # Replace `: any`
            content = re.sub(r':\s*any\b', ': Any', content)
            # Replace `<any>`
            content = re.sub(r'<\s*any\s*>', '<Any>', content)
            # Replace `any` in union like `| any`
            content = re.sub(r'\|\s*any\b', '| Any', content)
            # Replace `any` in intersection like `& any`
            content = re.sub(r'&\s*any\b', '& Any', content)
            
            if content != open(path, 'r').read():
                with open(path, 'w') as file:
                    file.write(content)

