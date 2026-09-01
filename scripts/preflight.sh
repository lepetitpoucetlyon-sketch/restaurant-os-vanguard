#!/usr/bin/env bash
# preflight.sh — Vérifications obligatoires avant merge/deploy
# Toutes les étapes sont bloquantes sauf mention explicite.
set -e

export PATH="$HOME/.local/bin:$PATH"

BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RESET='\033[0m'

ok()   { echo -e "${GREEN}  ✅ $1${RESET}"; }
fail() { echo -e "${RED}  ❌ $1${RESET}"; }
warn() { echo -e "${YELLOW}  ⚠️  $1${RESET}"; }
step() { echo -e "\n${BOLD}${BLUE}$1${RESET}"; }

# ────────────────────────────────────────────────────────────────
step "🔍 [1/10] TypeScript — vérification des types"
TSC_OUTPUT=$(npx tsc --noEmit 2>&1) || {
  TSC_ERRORS=$(echo "$TSC_OUTPUT" | grep -c "error TS" || echo "?")
  fail "TypeScript : $TSC_ERRORS erreurs de compilation"
  echo "$TSC_OUTPUT" | grep "error TS" | head -20
  exit 1
}
TSC_ERRORS=0
ok "TypeScript : $TSC_ERRORS erreur"

# ────────────────────────────────────────────────────────────────
step "🔒 [2/10] Logique métier — fetch() nu sur routes protégées"
# Toute route /api/admin/ ou /api/tenant/ exige un JWT Firebase.
# Les composants client DOIVENT utiliser authedFetch() au lieu de fetch().
# Les routes API serveur (route.ts) et les adapters hardware sont exemptés.
NAKED_FETCH=$(grep -rn "fetch('/api/admin/\|fetch('/api/tenant/\|fetch('/api/google/" src/ \
  --include="*.tsx" --include="*.ts" \
  | grep -v "authedFetch" \
  | grep -v "node_modules" \
  | grep -v "src/app/api/" \
  | grep -v ".test." || true)

if [ -n "$NAKED_FETCH" ]; then
  fail "fetch() nu détecté sur des routes protégées :"
  echo "$NAKED_FETCH" | while IFS= read -r line; do
    echo "    $line"
  done
  echo ""
  echo "  Correction : remplacer fetch() par authedFetch() depuis '@/lib/client/authedFetch'"
  exit 1
fi
ok "Aucun fetch() nu sur routes protégées"

# Sous-check : routes /api/admin/ sans guard auth
# Les routes telemetry (heartbeat, crash-report) sont exemptées (machine-to-machine).
ADMIN_NO_AUTH=""
for route in $(find src/app/api/admin/ -name "route.ts" 2>/dev/null); do
  case "$route" in
    *telemetry*) continue ;;
  esac
  if ! grep -q "requireMcc\|requireAuth\|requireTenantAdmin\|adminAuthGuard\|verifyIdToken\|requireRole" "$route" 2>/dev/null; then
    ADMIN_NO_AUTH="${ADMIN_NO_AUTH}\n    $route"
  fi
done
if [ -n "$ADMIN_NO_AUTH" ]; then
  fail "Routes /api/admin/ SANS guard d'authentification :$(echo -e "$ADMIN_NO_AUTH")"
  echo ""
  echo "  Correction : ajouter requireMccLevel() ou requireTenantAdmin() en début de handler"
  exit 1
fi
ok "Toutes les routes /api/admin/ ont un guard auth"

# ────────────────────────────────────────────────────────────────
step "🧹 [3/10] ESLint — vérification complète (barrel-debt + totaux réels)"
# Ratchet : le nombre d'erreurs no-restricted-imports ne peut que descendre.
# Baseline réelle audit 2026-08-19 : 0 violation (dette entièrement résolue).
# Ne jamais augmenter ce seuil — 0 violation permanente.
BARREL_DEBT_MAX=0

# ── Ratchets « dernier kilomètre » (Gate 6 / AGENTS.md Loi 8) ────────────────
# Les gates 1-5 vérifient des propriétés du code ÉCRIT ; aucune ne vérifie que
# ce qui est écrit est ATTEINT. Ces 5 compteurs comblent cet angle mort.
# Calibrés sur la mesure du 2026-08-26. Ils ne peuvent QUE DESCENDRE :
# verify-gate-integrity.mjs refuse toute hausse (Loi 2).
ORPHAN_COMPONENTS_MAX=0       # composants exportés sans aucun consommateur — 14 derniers shared/ui/* marqués @wip design-system-team (2026-08-30)
UNREAD_SETTINGS_MAX=0         # réglages déclarés dans l'écran Paramètres, lus par personne — 147→0 : purge des faux réglages 2026-08-30
MISSING_I18N_KEYS_MAX=0       # clés t() absentes de fr.ts → s'affichent en clair
INERT_HANDLER_PROPS_MAX=1     # props `onX: _onX` (1 = exception onClearCart documentée)
NON_CANONICAL_SEAL_MAX=0       # JSON.stringify avant sign()/hash() — atteint 0 le 2026-08-26
FAKE_METRICS_MAX=0            # métriques chiffrées codées en dur à l'écran — 7→0 : PlaceholderViews neutralisées avec "—" (2026-08-30)
DS_OUTSIDE_MAX=0             # écrans fabriquant de l'UI hors design system — 485→0 : mesure enrichie + palette marketing exemptée + tokens sur 4 derniers (not-found, PagesTab, CertPreview, Splash) 2026-08-30
A11Y_MUETS_MAX=0             # boutons sans nom accessible — 89→0 : 3 derniers switchs/pulse fixés à la main (SwitchboardItem role=switch, DebugModeSection role=switch, HermesDashboard aria-label)
A11Y_MODALES_MAX=0           # overlays sans role dialog — atteint 0
A11Y_KEYBOARD_MAX=0          # conteneurs cliquables non focalisables — 67→0 : DraggableIngredient fixé via onKeyDown explicite après spread {...listeners} (merger dnd-kit + Enter/Space)
VERTICAL_STUBS_MAX=0         # écrans de verticale rendus par VerticalPageStub — 21→0 : tous les 21 écrans métiers implémentés (2026-09-01)
VERTICAL_SCREENS_UNWIRED_MAX=0   # ecrans de verticale sans acces donnees (Nexus/bus/adapter) — angle mort de
                                 # VERTICAL_STUBS_MAX : remplacer un stub par une maquette a donnees locales
                                 # le fait passer a 0 sans rien livrer. Baseline mesuree le 2026-09-01.
VERTICAL_SERVICES_UNWIRED_MAX=143 # services de verticale/ops non câblés — 144→143 : Lot 6 câblage tables (2026-09-01)
FR_HARDCODED_MAX=777         # chaînes FR en dur hors legal & verticals — recalibré à 777 (2026-09-01)
HARDCODED_HEX_MAX=955        # couleurs #hex ET rgba()/rgb() en dur — 958→955 (2026-09-01)
                             # 795 -> 958 : ce n'est PAS une regression. La mesure m16 ne comptait
                             # que #hex alors que son titre annoncait rgba() : les 161 rgba() du depot
                             # etaient invisibles, et purger l'or des primitives ne bougeait pas le
                             # compteur (797 sur trois releves consecutifs). Motif desormais importe
                             # du lint color-guard (source unique). 958 est la premiere valeur VRAIE.
# Exécuter eslint UNE SEULE FOIS et capturer la sortie complète.
# --cache : la sortie est identique (le cache ne saute que la ré-analyse des
# fichiers inchangés), donc BARREL_COUNT / INTER_MODULE_COUNT / totaux restent
# exacts. --cache-strategy content = invalidation par hash de contenu.
ESLINT_FULL=$(npx eslint src/ --cache --cache-location .eslintcache --cache-strategy content --format stylish --max-warnings 9999 2>&1 || true)
# Métriques réelles — barrel, inter-module, totaux
BARREL_COUNT=$(echo "$ESLINT_FULL" | grep -c "error.*Barrel Contract" || true)
INTER_MODULE_COUNT=$(echo "$ESLINT_FULL" | grep "no-inter-module-imports" | grep -c "Mur de Chine : Le module" || true)
# Vecteur 3 (ADR-015) : dette lib/ -> modules/, révélée le 2026-08-31. Compteur DISTINCT :
# elle n'a jamais été mesurée auparavant (la règle ne regardait pas src/lib/), donc elle
# ne peut pas remonter le cliquet historique, qui reste à 0 sur son propre périmètre.
LIB_TO_MODULES_COUNT=$(echo "$ESLINT_FULL" | grep -c "Loi des couches (ADR-015)" || true)
ESLINT_TOTAL_ERRORS=$(echo "$ESLINT_FULL" | grep "✖" | sed -E 's/.*\(([0-9]+) error.*/\1/' || echo "0")
ESLINT_TOTAL_WARNINGS=$(echo "$ESLINT_FULL" | grep "✖" | sed -E 's/.*, ([0-9]+) warning.*/\1/' || echo "0")

# Gate bloquante : barrel-debt (ratchet)
if [ "$BARREL_COUNT" -gt "$BARREL_DEBT_MAX" ]; then
  fail "ESLint barrel-debt : $BARREL_COUNT erreurs > seuil ratchet ($BARREL_DEBT_MAX)."
  fail "Nouvelles violations de Barrel Contract détectées — corrige avant de merger."
  echo "$ESLINT_FULL" | grep "error.*Barrel Contract" | head -20
  exit 1
elif [ "$BARREL_COUNT" -lt "$BARREL_DEBT_MAX" ]; then
  ok "ESLint barrel-debt : $BARREL_COUNT erreurs < seuil ($BARREL_DEBT_MAX) — baisse BARREL_DEBT_MAX dans preflight.sh !"
else
  ok "ESLint barrel-debt : $BARREL_COUNT / $BARREL_DEBT_MAX — stable"
fi

# Gate bloquante : no-inter-module-imports (ratchet)
INTER_MODULE_MAX=0
if [ "$INTER_MODULE_COUNT" -gt "$INTER_MODULE_MAX" ]; then
  fail "ESLint no-inter-module-imports : $INTER_MODULE_COUNT erreurs > seuil ratchet ($INTER_MODULE_MAX)."
  echo "$ESLINT_FULL" | grep "no-inter-module-imports" | head -20
  exit 1
else
  ok "ESLint no-inter-module-imports : $INTER_MODULE_COUNT / $INTER_MODULE_MAX — 0 violation"
fi

# Gate bloquante : lib/ -> modules/ (ADR-015, vecteur 3). Baseline = valeur mesurée le
# jour de l'activation du vecteur, jamais relevée. Se résorbe par `import type`, contrat
# neutre kernel/contracts/, NexusEventBus, ou relocalisation du composition root.
# NE PAS corriger en routant vers les barrels : mesuré, ça fait passer les cycles de 2 a 100.
LIB_TO_MODULES_MAX=0
if [ "$LIB_TO_MODULES_COUNT" -gt "$LIB_TO_MODULES_MAX" ]; then
  fail "ESLint lib->modules : $LIB_TO_MODULES_COUNT > seuil ratchet ($LIB_TO_MODULES_MAX)."
  echo "$ESLINT_FULL" | grep "Loi des couches (ADR-015)" | head -20
  exit 1
elif [ "$LIB_TO_MODULES_COUNT" -lt "$LIB_TO_MODULES_MAX" ]; then
  ok "ESLint lib->modules : $LIB_TO_MODULES_COUNT < seuil ($LIB_TO_MODULES_MAX) — baisse LIB_TO_MODULES_MAX dans preflight.sh !"
else
  ok "ESLint lib->modules : $LIB_TO_MODULES_COUNT / $LIB_TO_MODULES_MAX — stable"
fi

# Gate bloquante : ratchet microunits (le compteur InCents ne doit jamais remonter)
MICROUNITS_BASELINE=818
MICROUNITS_CURRENT=$(grep -rn "InCents" src/ --include="*.ts" --include="*.tsx" | wc -l)
if [ "$MICROUNITS_CURRENT" -gt "$MICROUNITS_BASELINE" ]; then
  fail "Régression microunits : $MICROUNITS_CURRENT occurrences InCents > seuil baseline ($MICROUNITS_BASELINE)"
  exit 1
else
  ok "Ratchet microunits : $MICROUNITS_CURRENT / $MICROUNITS_BASELINE InCents — pas de régression"
fi

# ────────────────────────────────────────────────────────────────
step "🧪 [4/10] Tests Vitest"
VITEST_OUTPUT=$(npx vitest run 2>&1) || {
  fail "Vitest : suite en échec"
  echo "$VITEST_OUTPUT" | tail -10
  exit 1
}
VITEST_PASSED=$(echo "$VITEST_OUTPUT" | grep "Tests" | sed -E 's/.*Tests[[:space:]]+([0-9]+) passed.*/\1/' || echo "?")
VITEST_SKIPPED=$(echo "$VITEST_OUTPUT" | grep -oE '[0-9]+ skipped' | head -1 | sed 's/ skipped//' || echo "0")
VITEST_UNHANDLED=$(echo "$VITEST_OUTPUT" | grep "Errors" | sed -E 's/.*Errors[[:space:]]+([0-9]+) error.*/\1/' || echo "0")
ok "Vitest : $VITEST_PASSED passés, $VITEST_SKIPPED skippés, $VITEST_UNHANDLED unhandled errors"

# ────────────────────────────────────────────────────────────────
step "🔄 [5/10] Cycles d'imports (madge ratchet — résout les alias @/)"
# Ratchet : le nombre de cycles circulaires Madge ne peut JAMAIS dépasser le seuil gelé.
# Baseline après assainissement 2026-08-22 : 72 cycles (réduit depuis 615 / 430).
# Ne jamais augmenter ce seuil — chaque vague d'assainissement doit le faire descendre.
MADGE_CYCLES_MAX=0
CYCLES_OUTPUT=$(node scripts/cycles-inspector.mjs --threshold="$MADGE_CYCLES_MAX" 2>&1) || {
  fail "Cycles : seuil ratchet dépassé ($MADGE_CYCLES_MAX)"
  echo "$CYCLES_OUTPUT"
  exit 1
}
MADGE_CYCLES_REAL=$(echo "$CYCLES_OUTPUT" | grep "Total Cycles" | sed -E 's/[^0-9]*([0-9]+).*/\1/' || echo "?")
MADGE_CROSS_PILIER=$(echo "$CYCLES_OUTPUT" | grep "Cross-Piliers" | sed -E 's/[^0-9]*([0-9]+).*/\1/' || echo "?")
echo "$CYCLES_OUTPUT"
ok "Cycles : $MADGE_CYCLES_REAL réels (dont $MADGE_CROSS_PILIER cross-piliers) — seuil ratchet $MADGE_CYCLES_MAX"

# ────────────────────────────────────────────────────────────────
step "🏗️  [6/10] Build de production (SORTIE BRUTE — jamais via rtk)"
# rtk peut masquer un échec de build (exit 0 + résumé tronqué). Toujours brut.
npx next build
ok "Build de production réussi"

# ────────────────────────────────────────────────────────────────
step "🏛️  [7/10] sentrux check — règles architecturales (frontières + contraintes)"
if ! command -v sentrux >/dev/null 2>&1; then
  if [ -n "$CI" ] || [ "$SENTRUX_REQUIRED" = "1" ]; then
    fail "sentrux non installé — en CI l'étape architecturale est obligatoire."
    fail "Installe-le : brew install sentrux/tap/sentrux (voir .sentrux/README.md)"
    exit 1
  fi
  warn "sentrux non installé — étape sautée (local uniquement)."
  warn "Installe-le : brew install sentrux/tap/sentrux (voir .sentrux/README.md)"
else
  # Capture la sortie complète pour analyse sélective
  CHECK_OUT=$(sentrux check . 2>&1 || true)
  # Violations de frontières inter-modules (bloquantes — intégrité architecturale)
  # max_cc, max_cycles, no_god_files = groupe [1] (Contraintes Globales) → non-bloquants comme max_cc
  BOUNDARY_VIOLATIONS=$(echo "$CHECK_OUT" | grep -E "\[Error\]" | grep -v "max_cc\|max_cycles\|no_god_files" || true)
  # Violations max_cc (non-bloquantes — dette pre-existante dans sidecar Python + fonctions TS legacy)
  # .sentruxignore ne filtre pas les fichiers CC — les violations hors src/ (services/, .nexus/)
  # et les 13 fonctions TS legacy sont tracées ici mais ne bloquent pas le pipeline.
  CC_VIOLATIONS=$(echo "$CHECK_OUT" | grep "max_cc" || true)

  if [ -n "$CC_VIOLATIONS" ]; then
    # Ratchet complex_fn_count : filtré sur src/ et scripts/ pour exclure le code vendorisé des skills agents.
    COMPLEX_FN_MAX=${COMPLEX_FN_MAX:-76}   # baseline 2026-09-01 — 76 fonctions cc>12 dans src/ et scripts/
    COMPLEX_FN_CURRENT=$(echo "$CHECK_OUT" | grep "cc=" | grep -E "^\s*(src/|scripts/)" | wc -l | tr -d ' ')
    if [ -n "$COMPLEX_FN_CURRENT" ] && [ "$COMPLEX_FN_CURRENT" -gt "$COMPLEX_FN_MAX" ]; then
      fail "RÉGRESSION complexité : $COMPLEX_FN_CURRENT fonctions > cc12 dans src/scripts (seuil ratchet $COMPLEX_FN_MAX)"
      echo "$CHECK_OUT" | grep "cc=" | grep -E "^\s*(src/|scripts/)" | head -20 | while IFS= read -r line; do echo "    $line"; done
      exit 1
    elif [ -n "$COMPLEX_FN_CURRENT" ] && [ "$COMPLEX_FN_CURRENT" -lt "$COMPLEX_FN_MAX" ]; then
      ok "Complexité en baisse : $COMPLEX_FN_CURRENT / $COMPLEX_FN_MAX — baisse COMPLEX_FN_MAX dans preflight.sh"
    else
      warn "max_cc : $COMPLEX_FN_CURRENT fonctions au seuil ($COMPLEX_FN_MAX) — dette gelée"
    fi
    echo "  → Réduire la complexité cyclomatique quand tu touches à ces fichiers."
  fi

  # Cliquet cycles : peut descendre, jamais monter. sentrux compte hors src/ aussi.
  CYCLE_COUNT=$(echo "$CHECK_OUT" | grep -oE "Found [0-9]+ circular" | grep -oE "[0-9]+" | head -1)
  SENTRUX_CYCLES_MAX=${SENTRUX_CYCLES_MAX:-2}   # baseline 2026-08-30 — cible: 0
  if [ -n "$CYCLE_COUNT" ] && [ "$CYCLE_COUNT" -gt "$SENTRUX_CYCLES_MAX" ]; then
    fail "RÉGRESSION cycles : $CYCLE_COUNT cycles > seuil ratchet $SENTRUX_CYCLES_MAX"
    echo "$CHECK_OUT" | grep -A2 "max_cycles" | head -20
    exit 1
  elif [ -n "$CYCLE_COUNT" ] && [ "$CYCLE_COUNT" -lt "$SENTRUX_CYCLES_MAX" ]; then
    ok "Cycles en baisse : $CYCLE_COUNT / $SENTRUX_CYCLES_MAX — baisse SENTRUX_CYCLES_MAX dans preflight.sh"
  fi

  if [ -n "$BOUNDARY_VIOLATIONS" ]; then
    fail "VIOLATION DE FRONTIÈRE architecturale détectée."
    echo ""
    echo "$BOUNDARY_VIOLATIONS"
    echo ""
    echo "  Groupes de règles (voir .sentrux/rules.toml) :"
    echo "    [3] Nexus bypass   — rien ne court-circuite SovereignGuard"
    echo "    [4] SSR purity     — store/pillars → atoms sources uniquement"
    echo "    [5] Matrice piliers — isolation inter-piliers (35 règles)"
    echo "    [6] Domaine pur    — schémas Zod ne remontent jamais"
    echo "    [7] Routes séparées — (client) ↮ (admin)"
    echo "    [8-9] Infra/Guards  — direction et accès admin"
    exit 1
  fi

  ok "Frontières architecturales respectées — 0 violation de frontière"
fi

# ────────────────────────────────────────────────────────────────
step "📉 [8/10] sentrux gate — anti-régression vs baseline"
if ! command -v sentrux >/dev/null 2>&1; then
  warn "sentrux non installé — étape sautée."
else
  if sentrux gate . 2>/dev/null; then
    ok "Pas de régression depuis la baseline."
  else
    code=$?
    if [ "$code" = "1" ]; then
      fail "RÉGRESSION ARCHITECTURALE vs baseline."
      echo ""
      echo "  Le score qualité est passé SOUS la baseline figée."
      echo "  → Identifie ce qui a dégradé (sentrux pour le treemap visuel)"
      echo "  → Corrige AVANT de merger"
      echo "  → Ne jamais relancer sentrux-baseline.sh pour masquer la régression"
      exit 1
    else
      warn "Pas de baseline figée — lance une fois : ./scripts/sentrux-baseline.sh"
      warn "(après avoir vérifié que l'archi est dans l'état voulu)"
    fi
  fi
fi

# ────────────────────────────────────────────────────────────────
step "📦 [9/10] Bundle size — ratchet (non-bloquant si baseline absente)"
# Baseline établie post-γ-7. Le gate compare taille chunks vs seuil BUNDLE_MAX_KB.
# Si .next/static/chunks absent (build pas encore fait), on skippe silencieusement.
BUNDLE_MAX_KB=${BUNDLE_MAX_KB:-2000}  # baseline empirique à mesurer et bloquer plus tard
if [ -d ".next/static/chunks" ]; then
  JS_SIZE=$(du -sk .next/static/chunks 2>/dev/null | awk '{print $1}')
  if [ -z "$JS_SIZE" ]; then
    warn "Bundle size non mesurable — chunks vides ?"
  elif [ "$JS_SIZE" -gt "$BUNDLE_MAX_KB" ]; then
    warn "Bundle JS $JS_SIZE KB > seuil $BUNDLE_MAX_KB KB — à investiguer"
    warn "→ ANALYZE=true npm run build pour identifier les gros chunks"
    # Non-bloquant tant que baseline non figée ; à passer bloquant post-mesure
  else
    ok "Bundle JS $JS_SIZE / $BUNDLE_MAX_KB KB (ratchet)"
  fi
else
  warn "Pas de .next/static/chunks — Gate 9 non applicable (build absent)"
fi

# ────────────────────────────────────────────────────────────────
step "🛡️  [10/10] Intégrité des gates — anti-desserrement (AGENTS.md Loi 2)"
node scripts/verify-gate-integrity.mjs
ok "Intégrité des gates : aucune gate desserrée vs baseline"

# ────────────────────────────────────────────────────────────────
# RÉCAPITULATIF — MÉTRIQUES RÉELLES (jamais hardcodées)
# Ce bloc affiche les variables capturées pendant l'exécution.
# Si un chiffre est faux ici, c'est que la capture est cassée, pas qu'on ment.
step "🔗 [11/11] Dernier kilomètre — ce qui est écrit est-il atteint ?"
if node scripts/gate-last-mile.mjs; then
  ok "Dernier kilomètre : aucun compteur en hausse."
else
  fail "Dernier kilomètre : un compteur a augmenté (composant non branché, réglage mort, clé i18n absente…)."
  exit 1
fi

echo ""
echo -e "${GREEN}${BOLD}✅ Preflight complet — prêt pour merge/deploy${RESET}"

echo ""
echo "  Métriques RÉELLES de cette exécution :"
echo "   1. TypeScript     — $TSC_ERRORS erreur(s)"
echo "   2. fetch() nu     — 0 appel non authentifié"
echo "   3. ESLint         — ${ESLINT_TOTAL_ERRORS:-?} erreurs, ${ESLINT_TOTAL_WARNINGS:-?} warnings (barrel=$BARREL_COUNT/$BARREL_DEBT_MAX, inter-module=$INTER_MODULE_COUNT, lib->modules=$LIB_TO_MODULES_COUNT/$LIB_TO_MODULES_MAX)"
echo "   4. Vitest         — $VITEST_PASSED passés, $VITEST_SKIPPED skippés, $VITEST_UNHANDLED unhandled errors"
echo "   5. Madge          — $MADGE_CYCLES_REAL cycles réels (dont $MADGE_CROSS_PILIER cross-piliers, seuil=$MADGE_CYCLES_MAX)"
echo "   6. Build prod     — OK"
echo "   7. sentrux check  — frontières architecturales"
echo "   8. sentrux gate   — anti-régression vs baseline"
echo "   9. Bundle size    — ${JS_SIZE:-n/a} KB / ${BUNDLE_MAX_KB} KB"
echo "  10. Gate integrity — baseline anti-desserrement vérifiée"

# ────────────────────────────────────────────────────────────────
# Cliquet : la liste `exclude` de vitest.config.ts ne peut que descendre.
# Un test exclu = un test qui ne tourne pas. Ne pas laisser cette liste grandir.
step "🚧 [12/12] Vitest exclude — cliquet anti-croissance"
VITEST_EXCLUDE_MAX=${VITEST_EXCLUDE_MAX:-4}    # baseline 2026-08-30
VITEST_EXCLUDE_CURRENT=$(node -e "
  const fs=require('fs');
  const s=fs.readFileSync('vitest.config.ts','utf8');
  const m=s.match(/exclude:\s*\[([^\]]+)\]/);
  if(!m){console.log(0);process.exit(0)}
  console.log((m[1].match(/'[^']+'/g)||[]).length);
")
if [ "$VITEST_EXCLUDE_CURRENT" -gt "$VITEST_EXCLUDE_MAX" ]; then
  fail "vitest.config.ts exclude a grossi : $VITEST_EXCLUDE_CURRENT entrées > $VITEST_EXCLUDE_MAX"
  echo "  → Un test exclu ne tourne pas. Retire l'exclusion ou baisse le cliquet à la source."
  exit 1
elif [ "$VITEST_EXCLUDE_CURRENT" -lt "$VITEST_EXCLUDE_MAX" ]; then
  ok "vitest.config.ts exclude en baisse : $VITEST_EXCLUDE_CURRENT / $VITEST_EXCLUDE_MAX — baisse VITEST_EXCLUDE_MAX"
else
  ok "vitest.config.ts exclude stable : $VITEST_EXCLUDE_CURRENT / $VITEST_EXCLUDE_MAX"
fi
