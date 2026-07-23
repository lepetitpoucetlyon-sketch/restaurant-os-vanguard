#!/bin/bash

# 🛰️ BRAND GATE — SPECTRE VANGUARD
# Vérifie qu'aucune couleur statique (Hex) n'est réintroduite dans le code.

THRESHOLD=10
echo "🔍 Vérification de la conformité sémantique (Seuil: $THRESHOLD hex max)..."

# Liste des hex en dur hors tokens et fichiers exclus
COUNT=$(grep -rn "#[0-9a-fA-F]\{3,8\}" src/ \
    --include="*.ts" --include="*.tsx" \
    | grep -v "shared/nexus/tokens" \
    | grep -v "node_modules" \
    | grep -v "\.next" \
    | grep -v "//" \
    | wc -l)

if [ "$COUNT" -gt "$THRESHOLD" ]; then
  echo "❌ Brand Gate FAILED: $COUNT couleurs statiques détectées."
  echo "Veuillez utiliser les tokens sémantiques (bg-action-primary, var(--color-brand-*), etc.)."
  exit 1
fi

echo "✅ Brand Gate PASSED: $COUNT couleurs statiques (Seuil respecté)."
exit 0
