#!/usr/bin/env bash
# 03_refactor/check.sh — vérif rapide après CHAQUE pas atomique.
# tsc seul (rapide) ; la vérif complète (tests) est l'étape 04.
set -uo pipefail
cd "$(dirname "$0")/../../.." || exit 1

echo "🔍 tsc --noEmit (incrémental)…"
if npx tsc --noEmit --incremental --tsBuildInfoFile .tsbuildinfo.refactor; then
  echo "✅ tsc: 0 erreur — pas suivant autorisé"
else
  echo "❌ tsc: erreurs — CORRIGER avant de continuer"
  exit 1
fi
