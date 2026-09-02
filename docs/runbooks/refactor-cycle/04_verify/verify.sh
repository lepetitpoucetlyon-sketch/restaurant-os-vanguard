#!/usr/bin/env bash
# 04_verify/verify.sh — vérification complète avant merge.
# N'échoue pas durement (|| true) pour pouvoir tout collecter dans le rapport,
# mais le VERDICT du rapport doit refléter le moindre rouge.
set -uo pipefail
cd "$(dirname "$0")/../../.." || exit 1

echo "===================== VERIFY — $(date '+%Y-%m-%d %H:%M') ====================="

echo ""
echo "## 1. TypeScript"
npx tsc --noEmit && echo "✅ tsc: 0 erreur" || echo "❌ tsc: ÉCHEC"

echo ""
echo "## 2. Tests (vitest)"
npx vitest run --reporter=dot || echo "❌ vitest: ÉCHEC ou non exécutable (le noter dans le rapport)"

echo ""
echo "## 3. Architecture (sentrux)"
if command -v sentrux >/dev/null 2>&1; then
  sentrux check . || echo "⚠️ sentrux: violations (voir ci-dessus)"
else
  echo "⚠️ sentrux non installé — à relancer sur une machine équipée"
fi

echo ""
echo "## 4. Périmètre du diff"
git diff --stat 2>/dev/null | tail -25

echo ""
echo "===================== FIN VERIFY ====================="
echo "→ Rédiger le VERDICT dans 04_verify/output/report.md"
