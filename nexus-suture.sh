#!/bin/bash
# 🏺 NEXUS-SUTURE.SH — V5.1 (Fixed Bash 3)
# Outil de transplantation Grade X pour Restaurant OS Vanguard

MODULE=$1
PILIER=$2
SOURCE="scratch/old-repo/src"
TARGET="src/modules/$MODULE"

if [ -z "$MODULE" ] || [ -z "$PILIER" ]; then
    echo "❌ Usage: ./nexus-suture.sh <nom_module> <pilier>"
    exit 1
fi

echo "🔪 Suture de FER : $MODULE → Pilier $PILIER"

# Helper pour Capitalize (Bash 3 compatible)
CAP_MODULE=$(echo "$MODULE" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')

# 1. Création de la structure étanche
mkdir -p "$TARGET"/{ui,hooks,schemas,types}

# 2. Transplantation UI (Extraction sélective et flexible)
echo "📦 Extraction UI de old-repo..."
FOUND_UI=false
SEARCH_PATHS=(
    "$SOURCE/components/$MODULE"
    "$SOURCE/modules/$PILIER/components/$MODULE"
    "$SOURCE/modules/ops/components/$MODULE"
    "$SOURCE/modules/commerce/components/$MODULE"
)

for PATH_UI in "${SEARCH_PATHS[@]}"; do
    if [ -d "$PATH_UI" ]; then
        cp "$PATH_UI/"*.{tsx,ts} "$TARGET/ui/" 2>/dev/null
        echo "  ✓ Composants transplantés depuis $PATH_UI"
        FOUND_UI=true
        break
    fi
done

if [ "$FOUND_UI" = false ]; then
    echo "  ⚠ Aucun composant UI trouvé pour $MODULE"
fi

# 3. Branchement du Hook Souverain
HOOK_FILE="$TARGET/hooks/use$CAP_MODULE.ts"
if [ ! -f "$HOOK_FILE" ]; then
    echo "🧠 Injection du Hook Souverain use$CAP_MODULE..."
    cat > "$HOOK_FILE" << EOF
"use client";

import { useAtom } from 'jotai';
import { ${MODULE}Schema } from '../schemas/${MODULE}.schema';
import { /* atoms requis */ } from '@/store/pillars/index'; 

export function use$CAP_MODULE() {
  return {};
}
EOF
fi

# 4. Scellage Zod
SCHEMA_FILE="$TARGET/schemas/${MODULE}.schema.ts"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "🛡️ Scellage du schéma Zod..."
    cat > "$SCHEMA_FILE" << EOF
import { z } from 'zod';

export const ${MODULE}Schema = z.object({
  id: z.string().uuid(),
});

export type ${CAP_MODULE} = z.infer<typeof ${MODULE}Schema>;
EOF
fi

# 5. Audit de contamination
echo "🔍 Scan de reliques fantômes dans $TARGET..."
CONTAMINATION=$(grep -r "old-repo\|operationalAtoms\|infrastructure" "$TARGET" | wc -l)
if [ "$CONTAMINATION" -gt 0 ]; then
    echo "🚨 ALERTE : $CONTAMINATION imports toxiques détectés."
else
    echo "✅ ÉTANCHÉITÉ : Aucune relique détectée."
fi

echo "🚀 MODULE $MODULE PRÊT POUR VALIDATION ATLAS."
