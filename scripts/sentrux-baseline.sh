#!/usr/bin/env bash
# sentrux-baseline.sh — Fige la référence qualité de l'archi (baseline anti-régression).
#
# À lancer UNE FOIS depuis ton Mac quand l'archi est dans un état que tu veux protéger
# (état actuel : Quality 7011/10000, 0 cycle, 14 règles ✅, le 2026-06-15).
# Ensuite, `preflight.sh` (étape 5) et `sentrux gate .` alertent si on passe sous ce niveau.
#
# Ré-exécute ce script seulement quand tu as VOLONTAIREMENT amélioré l'archi et que tu veux
# remonter la barre (jamais pour masquer une dégradation).
set -e

cd "$(dirname "$0")/.." || exit 1

if ! command -v sentrux >/dev/null 2>&1; then
  echo "❌ sentrux non trouvé sur le PATH."
  echo "   Installe-le : brew install sentrux/tap/sentrux   (voir .sentrux/README.md)"
  exit 1
fi

echo "📌 Capture de la baseline qualité actuelle…"
sentrux gate --save .
echo "✅ Baseline figée. preflight.sh la comparera désormais à chaque run."
