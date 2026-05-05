import os
import re

for r, d, files in os.walk('src'):
    for f in files:
        if f.endswith(('.ts', '.tsx')):
            path = os.path.join(r, f)
            with open(path, 'r') as file:
                content = file.read()
            
            if "as unknown as any" in content:
                content = content.replace("as unknown as any", "as unknown")
                with open(path, 'w') as file:
                    file.write(content)

