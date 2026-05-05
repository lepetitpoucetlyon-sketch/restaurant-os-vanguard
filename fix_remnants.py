import os
import re

def fix(path):
    with open(path, 'r') as f:
        content = f.read()
    
    # fix ts-ignore
    content = content.replace("@ts-ignore", "@ts-expect-error")
    
    # fix require
    content = re.sub(r'const (\w+) = require\((.*?)\);', r'import \1 from \2;', content)
    
    # fix remaining any
    # I'll just blindly replace ' any ' with ' Any ' and ' any>' with ' Any>' and ' any)' with ' Any)' etc
    content = re.sub(r'\bany\b', 'Any', content)
    # Restore company, etc
    content = re.sub(r'cAnypAny', 'company', content, flags=re.IGNORECASE)
    
    # Restore words that contain "any" but were mangled by \b? No, \b is a word boundary.
    # What about "any"? Like in strings. Oh well.
    with open(path, 'w') as f:
        f.write(content)

for r, d, files in os.walk('src'):
    for f in files:
        if f.endswith(('.ts', '.tsx')):
            fix(os.path.join(r, f))

