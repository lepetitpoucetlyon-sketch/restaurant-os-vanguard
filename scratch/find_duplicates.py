import os
from collections import defaultdict

def find_quasi_duplicates(root_dir):
    files_by_basename = defaultdict(list)
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        if '.next' in dirs:
            dirs.remove('.next')
        
        for f in files:
            path = os.path.join(root, f)
            basename = f.lower()
            # Remove extension for quasi-identical check
            name_no_ext = os.path.splitext(basename)[0]
            files_by_basename[name_no_ext].append(path)

    print("--- QUASI-DUPLICATES / CASE CONFLCTS ---")
    for name, paths in files_by_basename.items():
        if len(paths) > 1:
            # Check if they are actually different in case or just different extensions
            basenames = [os.path.basename(p) for p in paths]
            if len(set(basenames)) > 1:
                print(f"Potential Conflict for '{name}':")
                for p in paths:
                    print(f"  - {p}")

find_quasi_duplicates('.')
