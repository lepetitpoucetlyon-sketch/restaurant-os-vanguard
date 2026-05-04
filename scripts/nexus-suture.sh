#!/bin/bash
# 🔪 nexus-suture.sh — Version Vanguard V5.3 (Predator Edition)
# Suture agressive et recherche récursive des composants

MODULE=$1
PILIER=$2
SOURCE="scratch/old-repo/src"
TARGET="src/modules/$MODULE"

if [ -z "$MODULE" ] || [ -z "$PILIER" ]; then
  echo "❌ Usage: ./scripts/nexus-suture.sh <nom_module> <pilier>"
  exit 1
fi

MODULE_CAP=$(echo "$MODULE" | perl -pe 's/(^|[-_])(.)/uc($2)/ge; s/[-_]//g')

echo "🔪 Début de suture : $MODULE → $TARGET (pilier: $PILIER)"

# 1. Créer la structure
mkdir -p "$TARGET"/{ui,hooks,schemas,types}

# 2. Recherche PREDATOR des composants UI
echo "📦 Recherche Predator des composants UI..."
# On cherche partout où le nom du module apparaît dans un dossier "components" ou "app"
find "$SOURCE" -type d \( -path "*components/$MODULE" -o -path "*app*/$MODULE" \) | while read -r dir; do
    echo "  ✓ Source trouvée : $dir"
    cp -r "$dir/"*.tsx "$TARGET/ui/" 2>/dev/null
done

# 3. Recherche de la logique (Hooks/Services)
echo "🧠 Recherche de la logique métier..."
find "$SOURCE" -name "*${MODULE}*" -name "*.ts" | grep -vE "node_modules|types|schemas" | while read -r file; do
    echo "  ✓ Logique trouvée : $file"
    # Si c'est un fichier volumineux (>100 lignes), c'est probablement le service
    if [ $(wc -l < "$file") -gt 50 ]; then
        cp "$file" "$TARGET/hooks/use${MODULE_CAP}.ts"
        echo "  ✓ Service copié en use${MODULE_CAP}.ts"
    fi
done

# 4. Fallback Hook
if [ ! -f "$TARGET/hooks/use${MODULE_CAP}.ts" ]; then
    echo "  🔧 Génération du squelette hook use${MODULE_CAP}..."
    cat > "$TARGET/hooks/use${MODULE_CAP}.ts" << HOOKEOF
import { useAtom } from 'jotai';
export function use${MODULE_CAP}() { return {}; }
HOOKEOF
fi

# 5. Schéma Zod
cat > "$TARGET/schemas/${MODULE}.schema.ts" << SCHEMAAEOF
import { z } from 'zod';
export const ${MODULE_CAP}Schema = z.object({ id: z.string().uuid() });
export type ${MODULE_CAP} = z.infer<typeof ${MODULE_CAP}Schema>;
SCHEMAAEOF

echo ""
echo "✅ Suture physique terminée pour : $MODULE"
