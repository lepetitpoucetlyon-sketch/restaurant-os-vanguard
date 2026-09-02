#!/usr/bin/env bash
# 01_audit/run.sh — mesures automatiques (aucune édition de code).
# Travail mécanique : ne nécessite pas d'IA. Sortie destinée à findings.md.
set -uo pipefail
cd "$(dirname "$0")/../../.." || exit 1

echo "===================== AUDIT — $(date '+%Y-%m-%d %H:%M') ====================="

echo ""
echo "## TypeScript (doit être 0 erreur)"
npx tsc --noEmit && echo "✅ tsc: 0 erreur" || echo "❌ tsc: erreurs ci-dessus"

echo ""
echo "## Architecture (sentrux : cycles, god files, complexité)"
if command -v sentrux >/dev/null 2>&1; then
  sentrux check . || true
else
  echo "⚠️  sentrux non installé — métriques sentrux indisponibles (voir .sentrux/README.md)"
fi

echo ""
echo "## Plus gros fichiers source (proxy god files)"
find src -name '*.ts' -o -name '*.tsx' | xargs wc -l 2>/dev/null | sort -rn | sed -n '2,16p'

echo ""
echo "## Dette cents/microunits restante"
echo -n "Occurrences InCents : "
grep -rE "InCents" src --include='*.ts' --include='*.tsx' | wc -l

echo ""
echo "===================== FIN AUDIT ====================="
echo "→ Reporter ces mesures dans 01_audit/output/findings.md"
