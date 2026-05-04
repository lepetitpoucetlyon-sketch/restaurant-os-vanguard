import os
import json
import re

# Configuration
SOURCE_DIR = "src"
OUTPUT_FILE = "scripts/slm/dataset.jsonl"
EXCLUDE_DIRS = ["node_modules", ".next", ".git", "dist", "build"]
EXCLUDE_FILES = ["README.md", "LICENSE", ".gitignore", "package-lock.json"]

def extract_file_content(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return None

def generate_qa_pairs(filepath, content):
    filename = os.path.basename(filepath)
    relative_path = os.path.relpath(filepath, SOURCE_DIR)
    
    pairs = []
    
    # 1. General discovery question
    pairs.append({
        "instruction": f"Décris le rôle du fichier {relative_path} dans le projet Restaurant OS.",
        "input": "",
        "output": f"Le fichier {filename} situé dans {relative_path} est responsable de la logique suivante :\n\n{content[:500]}..." # Plus de logique de résumé pourrait être ajoutée ici
    })
    
    # 2. Structure / Interface extraction
    interfaces = re.findall(r'interface\s+(\w+)\s*{([^}]+)}', content)
    for name, fields in interfaces:
        pairs.append({
            "instruction": f"Quelle est la structure de l'interface '{name}' dans {relative_path} ?",
            "input": "",
            "output": f"L'interface '{name}' est définie comme suit :\n```typescript\ninterface {name} {{\n{fields.strip()}\n}}\n```"
        })
        
    # 3. Component/Hook logic
    if filename.endswith('.tsx'):
        component_match = re.search(r'export function (\w+)', content)
        if component_match:
            comp_name = component_match.group(1)
            pairs.append({
                "instruction": f"Quels sont les hooks ou contextes utilisés par le composant '{comp_name}' ?",
                "input": "",
                "output": f"Le composant '{comp_name}' utilise les éléments suivants :\n" + "\n".join(re.findall(r'use\w+\(\)', content))
            })

    return pairs

def main():
    dataset = []
    
    # Add project metadata (package.json)
    pkg_path = "package.json"
    if os.path.exists(pkg_path):
        content = extract_file_content(pkg_path)
        dataset.append({
            "instruction": "Quelles sont les dépendances principales du projet Restaurant OS ?",
            "input": "",
            "output": f"Le projet utilise les dépendances suivantes :\n{content}"
        })

    # Walk through source directory
    for root, dirs, files in os.walk(SOURCE_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            if file in EXCLUDE_FILES:
                continue
                
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                path = os.path.join(root, file)
                content = extract_file_content(path)
                if content:
                    dataset.extend(generate_qa_pairs(path, content))

    # Save as JSONL
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        for entry in dataset:
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')
            
    print(f"✅ Dataset généré avec {len(dataset)} entrées dans {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
