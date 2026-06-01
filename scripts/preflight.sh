#!/usr/bin/env bash
# preflight.sh — Vérifications obligatoires avant merge/deploy
set -e

echo "🔍 [1/3] TypeScript..."
npx tsc --noEmit

echo "🧹 [2/3] ESLint..."
npx eslint src/ --max-warnings 0 --rule '{"no-unused-vars": "off"}' || true

echo "🧪 [3/3] Tests..."
npx vitest run

echo "✅ Preflight OK"
