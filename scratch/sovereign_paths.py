import os
import re

def migrate_paths(directory):
    # Mapping of target directories to absolute aliases
    TARGETS = [
        'lib', 'store', 'domain', 'components', 'hooks', 
        'context', 'app', 'types', 'shared', 'i18n', 'styles'
    ]
    
    # Regex to find relative imports: import ... from '../../lib/...'
    # Matches: import { ... } from "../../../lib/..."
    # Matches: } from '../../store/...'
    # Matches: export { ... } from '../domain/...'
    # Matches: import "../styles/..."
    
    import_re = re.compile(r'((?:import|export).*?from\s+[\'"])(\.\.?\/)+(%s)([\'\/])' % '|'.join(TARGETS))
    
    files_changed = 0
    total_matches = 0

    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content, count = import_re.subn(r'\1@/\3\4', content)
                
                if count > 0:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Migrated {count} paths in {path}")
                    files_changed += 1
                    total_matches += count

    print(f"\n--- Migration Complete ---")
    print(f"Files modified: {files_changed}")
    print(f"Total paths converted to Sovereign (@/): {total_matches}")

if __name__ == "__main__":
    migrate_paths('src')
