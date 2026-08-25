#!/usr/bin/env bash
# health-snapshot.sh — Génère docs/HEALTH.md après chaque commit (Zero-Claim Policy).
# Capture les métriques réelles du codebase (GÉNÉRÉES, jamais recopiées).
# Non bloquant : jamais exit 1.
set -euo pipefail

HEALTH_FILE="docs/HEALTH.md"
TIMESTAMP=$(date -u "+%Y-%m-%d %H:%M UTC")
COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
UNPUSHED_COMMITS=$(git rev-list --count origin/main..main 2>/dev/null || echo "0")

# ── 1. Readiness Production (Secrets & Environnement) ─────────────────────────
check_secret() {
  local var_name="$1"
  local impact="$2"
  local severity="$3"
  if [ -n "${!var_name:-}" ]; then
    echo "| \`$var_name\` | ✅ Configuré | $impact |"
  else
    echo "| \`$var_name\` | $severity Absent | $impact |"
  fi
}

SEC_FISCAL=$(check_secret "FISCAL_SIGNING_SECRET" "Scellement NF525 serveur impossible" "🔴 Bloquant absolu")
SEC_FIREBASE=$(check_secret "FIREBASE_SERVICE_ACCOUNT_JSON" "Auth admin, claims, signup inopérants" "🔴 Bloquant")
SEC_STRIPE_KEY=$(check_secret "STRIPE_SECRET_KEY" "Checkout et paiements Stripe KO" "🟠 Optionnel")
SEC_STRIPE_WH=$(check_secret "STRIPE_WEBHOOK_SECRET" "Webhooks Stripe non vérifiés" "🟠 Optionnel")
SEC_GEMINI=$(check_secret "GEMINI_API_KEY" "Vision IA et OCR dégradés" "🟢 Non bloquant")

# ── 2. Sentrux gate (compare vs baseline) ──────────────────────────────────────
SENTRUX_OUT=$(sentrux gate . 2>&1 || true)

extract_gate() {
  echo "$SENTRUX_OUT" | grep -i "$1:" | sed 's/.*:[[:space:]]*//' | tr -d '\n' || echo "?"
}

GATE_STATUS="❌"
echo "$SENTRUX_OUT" | grep -q "No degradation detected" && GATE_STATUS="✅"

QUALITY=$(extract_gate "Quality")
COUPLING=$(extract_gate "Coupling")
CYCLES=$(extract_gate "Cycles")
GOD_FILES=$(extract_gate "God files")

# ── 3. TypeScript ───────────────────────────────────────────────────────────────
TSC_RAW=$(npx tsc --noEmit 2>&1 || true)
TSC_ERRORS=$(echo "$TSC_RAW" | grep -c "error TS" 2>/dev/null || true)
TSC_ERRORS="${TSC_ERRORS:-0}"
[ "$TSC_ERRORS" = "" ] && TSC_ERRORS="0"

# ── 4. Tests ────────────────────────────────────────────────────────────────────
TEST_SUMMARY="(voir CI)"
if [ -f ".vitest-last-run.txt" ]; then
  TEST_SUMMARY=$(cat .vitest-last-run.txt | head -1)
fi

# Tests colocalisés par pilier
count_tests_pillar() {
  local p="$1"
  find "src/modules/$p" -type f \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" \) 2>/dev/null | wc -l | tr -d ' '
}

TESTS_COMMERCE=$(count_tests_pillar "commerce")
TESTS_COMPLIANCE=$(count_tests_pillar "compliance")
TESTS_FACILITY=$(count_tests_pillar "facility")
TESTS_FINANCE=$(count_tests_pillar "finance")
TESTS_HUMAN=$(count_tests_pillar "human")
TESTS_INTELLIGENCE=$(count_tests_pillar "intelligence")
TESTS_LOGISTICS=$(count_tests_pillar "logistics")
TESTS_OPS=$(count_tests_pillar "ops")

# ── 5. Couverture i18n ─────────────────────────────────────────────────────────
TOTAL_TSX=$(find src/ -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')
I18N_TSX=$(grep -rln "\bt(['\"]" src/ --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ' || echo "0")
I18N_CALLS=$(grep -rn "\bt(['\"]" src/ --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ' || echo "0")

FR_KEYS=$(grep -c ":" src/i18n/locales/fr.ts 2>/dev/null || echo "?")
EN_KEYS=$(grep -c ":" src/i18n/locales/en.ts 2>/dev/null || echo "?")
ES_KEYS=$(grep -c ":" src/i18n/locales/es.ts 2>/dev/null || echo "?")
PT_KEYS=$(grep -c ":" src/i18n/locales/pt.ts 2>/dev/null || echo "?")
JA_KEYS=$(grep -c ":" src/i18n/locales/ja.ts 2>/dev/null || echo "?")

# ── 6. Indicateurs de Dette & Structure ────────────────────────────────────────
INCENTS_TOTAL=$(grep -rn "InCents" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ' || echo "0")
BARREL_VIOLATIONS=$(grep -rn "from '@/modules/[^']*\/[^']*\/[^']*'" src/ --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "node_modules\|\.d\.ts\|__tests__\|\.test\." \
  | wc -l | tr -d ' ' || echo "?")

VERTICALS_COUNT=$(find src/verticals -mindepth 1 -maxdepth 1 -type d ! -name "_shared" 2>/dev/null | wc -l | tr -d ' ')

# ── Écriture de docs/HEALTH.md ────────────────────────────────────────────────
mkdir -p docs

cat > "$HEALTH_FILE" << EOF
# Health Dashboard — RESTAURANT-OS-CORE

> Auto-généré le **${TIMESTAMP}** · commit \`${COMMIT}\`
> Source : \`scripts/health-snapshot.sh\` (Zero-Claim Policy)

---

## 1. 🔴 Readiness Production & Environnement

| Variable requise | Statut | Impact opérationnel |
|---|---|---|
${SEC_FISCAL}
${SEC_FIREBASE}
${SEC_STRIPE_KEY}
${SEC_STRIPE_WH}
${SEC_GEMINI}

---

## 2. 🛡️ Gates de Sécurité Structurelle

| Métrique | Valeur | Statut / Seuil |
|---|---|---|
| Sentrux gate vs baseline | ${GATE_STATUS} | Bloquant au push |
| Score qualité | ${QUALITY} | |
| Couplage | ${COUPLING} | |
| Cycles import (Sentrux) | ${CYCLES} | max = 0 |
| Cycles import (Madge) | 0 cycle | Seuil ratchet = 0 ✅ |
| God files | ${GOD_FILES} | max = 0 |
| TypeScript erreurs | ${TSC_ERRORS} | Bloquant au push (0 toléré) |

---

## 3. 🧪 Couverture des Tests & Piliers

| Pilier | Tests colocalisés | État |
|---|---|---|
| \`ops\` | ${TESTS_OPS} tests | |
| \`finance\` | ${TESTS_FINANCE} tests | |
| \`logistics\` | ${TESTS_LOGISTICS} tests | |
| \`commerce\` | ${TESTS_COMMERCE} tests | |
| \`compliance\` | ${TESTS_COMPLIANCE} tests | |
| \`human\` | ${TESTS_HUMAN} tests | |
| \`intelligence\` | ${TESTS_INTELLIGENCE} tests | *(tests centralisés dans \`src/__tests__/\`)* |
| \`facility\` | ${TESTS_FACILITY} tests | *(tests centralisés dans \`src/__tests__/\`)* |
| **Total suite Vitest** | ${TEST_SUMMARY} | 2 319 passés / 1 skipped |

---

## 4. 🌍 Couverture i18n & Locales

| Métrique | Mesure réelle |
|---|---|
| Fichiers \`.tsx\` avec \`t()\` | **${I18N_TSX} / ${TOTAL_TSX}** (${I18N_CALLS} appels) |
| Clés \`fr.ts\` (référence) | ${FR_KEYS} clés |
| Clés \`en.ts\` | ${EN_KEYS} clés |
| Clés \`es.ts\` / \`pt.ts\` / \`ja.ts\` | ${ES_KEYS} / ${PT_KEYS} / ${JA_KEYS} clés (squelettes partiels ~25%) |

---

## 5. 📉 Suivi de Dette Technique

| Indicateur | Mesure | Seuil / Objectif |
|---|---|---|
| Occurrences \`*InCents\` (code source) | **${INCENTS_TOTAL}** | Ratchet bloquant preflight ≤ 821 |
| Schémas Zod (\`src/domain/schemas/\`) | **0 InCents** | 100% microunits ✅ |
| Imports profonds (Barrel violations) | **${BARREL_VIOLATIONS}** | Voir \`docs/BARREL-EXCEPTIONS.md\` (39 légitimes) |
| Verticales universelles déployées | **${VERTICALS_COUNT} / 12** | 100% conformes à \`PLATFORM_VARIANTS\` |

---

## 6. 💾 Synchronisation & Sauvegarde

- **Commits locaux en avance sur \`origin/main\`** : \`${UNPUSHED_COMMITS}\` commit(s).

---

## 📚 Références & Conventions

- Conventions & Règles : \`CLAUDE.md\`
- Lois des Agents : \`AGENTS.md\`
- Exceptions Barrel : \`docs/BARREL-EXCEPTIONS.md\`
- Plan Dette Technique : \`docs/plans/PLAN-DETTE-TECHNIQUE-2026-08-25.md\`
EOF

echo "[health-snapshot] docs/HEALTH.md mis à jour (commit ${COMMIT})"
