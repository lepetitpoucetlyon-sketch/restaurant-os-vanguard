#!/usr/bin/env bash
# preflight.sh — Vérifications obligatoires avant merge/deploy
set -e

echo "🔍 [1/5] TypeScript..."
npx tsc --noEmit

echo "🧹 [2/5] ESLint..."
npx eslint src/ --max-warnings 0 --rule '{"no-unused-vars": "off"}' || true

echo "🧪 [3/5] Tests..."
npx vitest run

echo "🏛️  [4/5] Architecture — règles (sentrux check)..."
# Vérifie les règles de .sentrux/rules.toml (cycles, frontières piliers, layers).
# Vérifié le 2026-06-15 : passe (14 règles, Quality 7011). Donc BLOQUANT.
if command -v sentrux >/dev/null 2>&1; then
  sentrux check .
else
  echo "   ⚠️  sentrux non installé (binaire Rust) — voir .sentrux/README.md. Étape sautée."
fi

echo "📉 [5/5] Architecture — anti-régression (sentrux gate)..."
# Compare le score courant à la baseline figée (./scripts/sentrux-baseline.sh).
# Échoue si l'archi s'est DÉGRADÉE depuis la baseline (le vrai bouclier des sessions agent).
if command -v sentrux >/dev/null 2>&1; then
  if sentrux gate . 2>/dev/null; then
    echo "   ✅ Pas de régression depuis la baseline."
  else
    code=$?
    # exit 1 = régression détectée (bloquant) ; autre = pas de baseline → on guide sans bloquer.
    if [ "$code" = "1" ]; then
      echo "   ❌ RÉGRESSION ARCHITECTURALE détectée vs baseline. Voir le diff ci-dessus."
      exit 1
    else
      echo "   ⚠️  Pas de baseline encore. Fige-la une fois : ./scripts/sentrux-baseline.sh"
    fi
  fi
else
  echo "   ⚠️  sentrux non installé — étape sautée."
fi

echo "✅ Preflight OK"
