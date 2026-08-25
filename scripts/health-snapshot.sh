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
# Nombre de variantes déclarées dans le schéma (source de vérité) — jamais recopié
VARIANTS_DECLARED=$(grep -c "^    '" src/modules/system/domain/schemas/tenant.ts 2>/dev/null || echo "?")

# Cycles madge (résout les alias @/) — mesuré, pas supposé
MADGE_CYCLES=$({ node scripts/cycles-inspector.mjs --threshold=0 2>/dev/null || true; } \
  | grep "Total Cycles" | head -1 | sed -E 's/[^0-9]*([0-9]+).*/\1/')
MADGE_CYCLES="${MADGE_CYCLES:-?}"

# InCents dans les schémas Zod canoniques (doit rester à 0)
DOMAIN_INCENTS=$({ grep -rn "InCents" src/domain/ --include="*.ts" 2>/dev/null || true; } | wc -l | tr -d ' ')

# Baseline du ratchet microunits, lue dans preflight.sh — jamais recopiée ici
MU_BASELINE=$({ grep -oE "MICROUNITS_BASELINE=[0-9]+" scripts/preflight.sh 2>/dev/null || true; } | grep -oE "[0-9]+" | head -1)
MU_BASELINE="${MU_BASELINE:-?}"

# Exceptions barrel documentées (lues dans le doc, pas recopiées)
BARREL_DOCUMENTED=$({ grep -cE '^\| .src/' docs/BARREL-EXCEPTIONS.md 2>/dev/null || echo 0; } | head -1)
BARREL_DOCUMENTED="${BARREL_DOCUMENTED:-0}"

# ── 7. Exploitation & sécurité (issus des audits 2026-08-25) ───────────────────
API_ROUTES_TOTAL=$(find src/app/api -name "route.ts" 2>/dev/null | wc -l | tr -d ' ')
API_ROUTES_UNGUARDED=0
for f in $(find src/app/api -name "route.ts" 2>/dev/null); do
  grep -qE "requireAnyAuth|adminAuthGuard|requireMccLevel|requireAuth|verifySignature|stripe\.webhooks" "$f" \
    || API_ROUTES_UNGUARDED=$((API_ROUTES_UNGUARDED+1))
done

ERROR_PAGES=$(find src/app \( -name "error.tsx" -o -name "global-error.tsx" -o -name "not-found.tsx" \) 2>/dev/null | wc -l | tr -d ' ')
ARIA_COUNT=$({ grep -rn "aria-" src/ --include="*.tsx" 2>/dev/null || true; } | wc -l | tr -d ' ')

# ── 8. Pattern "construit mais non branché" ───────────────────────────────────
# Compte les consommateurs réels (hors définition et hors ré-export de barrel).
count_consumers() {
  { grep -rln "$1" src/ --include="*.tsx" 2>/dev/null || true; } \
    | { grep -v "/$1\.tsx$" || true; } | wc -l | tr -d ' '
}
C_LEXICON=$({ grep -rln "useLexicon" src/ --include="*.tsx" 2>/dev/null || true; } | wc -l | tr -d ' ')
C_WIDGETGRID=$(count_consumers "DashboardWidgetGrid")
C_CUSTOMFIELD=$(count_consumers "CustomFieldRenderer")
C_LAYOUTRENDER=$(count_consumers "DynamicLayoutRenderer")
C_FISCALSEAL=$(count_consumers "FiscalReceiptSealZone")

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
| Cycles import (Madge, alias @/ résolus) | ${MADGE_CYCLES} | Seuil ratchet = 0 |
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
| **Total suite Vitest** | ${TEST_SUMMARY} | \`npx vitest run\` |

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
| Occurrences \`*InCents\` (code source) | **${INCENTS_TOTAL}** | Ratchet preflight ≤ ${MU_BASELINE} |
| InCents dans \`src/domain/\` (schémas canoniques) | **${DOMAIN_INCENTS}** | doit rester à 0 |
| Imports profonds (Barrel violations) | **${BARREL_VIOLATIONS}** | dont ${BARREL_DOCUMENTED} documentés dans \`docs/BARREL-EXCEPTIONS.md\` |
| Verticales déployées | **${VERTICALS_COUNT}** | \`PLATFORM_VARIANTS\` en déclare ${VARIANTS_DECLARED} (INV-8) |

---

## 6. 🚨 Exploitation & Sécurité

| Indicateur | Mesure | Seuil / Note |
|---|---|---|
| Routes API sans garde détectée | **${API_ROUTES_UNGUARDED}** / ${API_ROUTES_TOTAL} | Certaines sont légitimement publiques — cf. \`AUDIT-23-AXES\` |
| Pages d'erreur (\`error.tsx\`, \`not-found\`, \`global-error\`) | **${ERROR_PAGES}** | 0 = écran blanc Next en cas d'exception |
| Attributs \`aria-\` | ${ARIA_COUNT} sur ${TOTAL_TSX} fichiers \`.tsx\` | Indicateur d'accessibilité |

---

## 7. 🔌 Construit mais non branché

> Pattern systémique du projet : des briques complètes, exportées par un barrel,
> que **aucun écran ne rend**. Mesuré ici pour éviter l'accumulation silencieuse.

| Brique | Consommateurs \`.tsx\` |
|---|---|
| \`useLexicon()\` (lexique par verticale) | ${C_LEXICON} |
| \`DashboardWidgetGrid\` | ${C_WIDGETGRID} |
| \`CustomFieldRenderer\` | ${C_CUSTOMFIELD} |
| \`DynamicLayoutRenderer\` | ${C_LAYOUTRENDER} |
| \`FiscalReceiptSealZone\` | ${C_FISCALSEAL} |

**Règle :** une brique à 0 consommateur depuis plus d'un mois doit être branchée,
supprimée, ou documentée comme gelée.

---

## 8. 💾 Synchronisation & Sauvegarde

- **Commits locaux en avance sur \`origin/main\`** : \`${UNPUSHED_COMMITS}\` commit(s).

---

## 📚 Références & Conventions

- Conventions & Règles : \`CLAUDE.md\`
- Lois des Agents : \`AGENTS.md\`
- Exceptions Barrel : \`docs/BARREL-EXCEPTIONS.md\`
- Plan Dette Technique : \`docs/plans/PLAN-DETTE-TECHNIQUE-2026-08-25.md\`
EOF

echo "[health-snapshot] docs/HEALTH.md mis à jour (commit ${COMMIT})"
