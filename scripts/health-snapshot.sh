#!/usr/bin/env bash
# health-snapshot.sh — Génère docs/HEALTH.md après chaque commit.
# Capture les métriques clés du codebase pour que tout agent ait une vue d'ensemble.
# Non bloquant : jamais exit 1.
set -euo pipefail

HEALTH_FILE="docs/HEALTH.md"
TIMESTAMP=$(date -u "+%Y-%m-%d %H:%M UTC")
COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# ── Sentrux gate (compare vs baseline) ──────────────────────────────────────
SENTRUX_OUT=$(sentrux gate . 2>&1 || true)

extract_gate() {
  # "Cycles:       2 → 2" → "2 → 2"
  echo "$SENTRUX_OUT" | grep -i "$1:" | sed 's/.*:[[:space:]]*//' | tr -d '\n' || echo "?"
}

GATE_STATUS="❌"
echo "$SENTRUX_OUT" | grep -q "No degradation detected" && GATE_STATUS="✅"

QUALITY=$(extract_gate "Quality")
COUPLING=$(extract_gate "Coupling")
CYCLES=$(extract_gate "Cycles")
GOD_FILES=$(extract_gate "God files")

# ── TypeScript ───────────────────────────────────────────────────────────────
TSC_RAW=$(npx tsc --noEmit 2>&1 || true)
TSC_ERRORS=$(echo "$TSC_RAW" | grep -c "error TS" 2>/dev/null; true)

# ── Tests ────────────────────────────────────────────────────────────────────
# Lecture du dernier résultat vitest (fichier cache) — pas de relance ici
TEST_SUMMARY="(voir CI)"
if [ -f ".vitest-last-run.txt" ]; then
  TEST_SUMMARY=$(cat .vitest-last-run.txt | head -1)
fi

# ── Microunits migration ─────────────────────────────────────────────────────
MU_REMAINING=$(grep -rn "InCents\b" src/modules/ --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "sellingPriceInCents\|costInCents\|SovereignMath\|totalInCents\|htInCents\|priceInCents\|toCents" \
  | wc -l | tr -d ' ' || echo "?")

# ── Barrel violations ────────────────────────────────────────────────────────
BARREL_VIOLATIONS=$(grep -rn "from '@/modules/[^']*\/[^']*\/[^']*'" src/ --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "node_modules\|\.d\.ts\|__tests__\|\.test\." \
  | wc -l | tr -d ' ' || echo "?")

# ── Écriture du fichier ──────────────────────────────────────────────────────
mkdir -p docs

cat > "$HEALTH_FILE" << EOF
# Health Dashboard — RESTAURANT-OS-CORE

> Auto-généré le **${TIMESTAMP}** · commit \`${COMMIT}\`
> Source : \`scripts/health-snapshot.sh\` (hook post-commit)

## Gate sécurité structurelle

| Métrique | Valeur | Gate |
|---|---|---|
| Sentrux gate vs baseline | ${GATE_STATUS} | bloquant au push |
| Score qualité | ${QUALITY} | |
| Couplage | ${COUPLING} | |
| Cycles import | ${CYCLES} | max = 0 |
| God files | ${GOD_FILES} | max = 0 |
| TypeScript erreurs | ${TSC_ERRORS} | bloquant au push |

## Indicateurs de dette technique

| Dette | Mesure |
|---|---|
| Fichiers encore en \`*InCents\` (migration microunits) | ~${MU_REMAINING} occurrences |
| Imports profonds (barrel violations) | ~${BARREL_VIOLATIONS} |
| Tests | ${TEST_SUMMARY} |

## Lectures utiles

- Architecture complète : \`ARCHITECTURE.md\`
- Conventions et règles : \`CLAUDE.md\`
- Sessions en cours : \`.claude/sessions.md\`
- Plan audit 2026-08-25 : \`docs/plans/GRAPHIFY-CODEGRAPH-AUDIT-2026-08-25.md\`

## Interprétation rapide

\`\`\`
Sentrux gate ✅ + tsc 0 erreurs = codebase stable, commit sûr
Sentrux gate ❌ = régression structurelle introduite → à corriger avant push
Cycles > 0     = risque TDZ en SSR (Cannot access X before initialization)
InCents élevé  = migration microunits incomplète (P2 en cours)
\`\`\`
EOF

echo "[health-snapshot] docs/HEALTH.md mis à jour (commit ${COMMIT})"
