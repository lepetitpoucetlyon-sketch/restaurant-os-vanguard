import os
import re

def fix(path):
    with open(path, 'r') as f:
        content = f.read()
    
    # Restore z.any()
    content = content.replace("z.Any()", "z.any()")
    
    # Restore ts-expect-error -> ts-ignore ?
    # Wait, the error is "Unused '@ts-expect-error' directive." So we should just remove them!
    content = content.replace("/* @ts-expect-error */ ", "")
    content = content.replace("// @ts-expect-error", "")
    
    with open(path, 'w') as f:
        f.write(content)

for r, d, files in os.walk('src'):
    for f in files:
        if f.endswith(('.ts', '.tsx')):
            fix(os.path.join(r, f))

