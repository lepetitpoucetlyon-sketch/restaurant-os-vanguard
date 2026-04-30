import os
import shutil

ROOT_DIR = "/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE"
NEXUS_DIR = os.path.join(ROOT_DIR, ".nexus")

def unify_nexus():
    # 1. Créer la structure
    os.makedirs(os.path.join(NEXUS_DIR, "agents"), exist_ok=True)
    os.makedirs(os.path.join(NEXUS_DIR, "memory"), exist_ok=True)

    # 2. Déplacer les agents
    if os.path.exists(os.path.join(ROOT_DIR, ".agents")):
        shutil.move(os.path.join(ROOT_DIR, ".agents"), os.path.join(NEXUS_DIR, "agents", ".agents"))
    if os.path.exists(os.path.join(ROOT_DIR, ".hermes")):
        shutil.move(os.path.join(ROOT_DIR, ".hermes"), os.path.join(NEXUS_DIR, "agents", ".hermes"))

    # 3. Déplacer les scripts vers hooks
    if os.path.exists(os.path.join(ROOT_DIR, "scripts")):
        shutil.move(os.path.join(ROOT_DIR, "scripts"), os.path.join(NEXUS_DIR, "hooks"))

    # 4. Fusionner les règles dans CONSTITUTION.md
    constitution_path = os.path.join(NEXUS_DIR, "CONSTITUTION.md")
    with open(constitution_path, "w") as out_f:
        out_f.write("# LA CONSTITUTION NEXUS (Directives et Rôles)\\n\\n")
        
        agents_md = os.path.join(ROOT_DIR, "AGENTS.md")
        if os.path.exists(agents_md):
            out_f.write("## PARTIE 1 : RÔLES (AGENTS.md)\\n\\n")
            with open(agents_md, "r") as f:
                out_f.write(f.read() + "\\n\\n")
            os.remove(agents_md)
            
        imperial_md = os.path.join(ROOT_DIR, "IMPERIAL_DIRECTIVES.md")
        if os.path.exists(imperial_md):
            out_f.write("## PARTIE 2 : DIRECTIVES IMPÉRIALES (Règles d'Or)\\n\\n")
            with open(imperial_md, "r") as f:
                out_f.write(f.read() + "\\n\\n")
            os.remove(imperial_md)

    print("✅ Opération Unification (Phase 2) : Dossier .nexus créé, agents et scripts migrés, constitution rédigée.")

if __name__ == "__main__":
    unify_nexus()
