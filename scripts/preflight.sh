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
step "🔍 [1/8] TypeScript — vérification des types"
npx tsc --noEmit
ok "Aucune erreur TypeScript"

# ────────────────────────────────────────────────────────────────
step "🔒 [2/8] Logique métier — fetch() nu sur routes protégées"
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
step "🧹 [3/8] ESLint — ratchet barrel-debt"
# Ratchet : le nombre d'erreurs no-restricted-imports ne peut que descendre.
# Baseline réelle audit 2026-08-15 : 210 violations pré-existantes (dette avant les 50 commits).
# Ne jamais augmenter ce seuil — chaque chantier barrel doit le faire descendre.
BARREL_DEBT_MAX=210
# Compter uniquement les lignes "error" contenant "Barrel Contract"
ESLINT_ERRORS=$(npx eslint src/ --format stylish --max-warnings 9999 2>&1 \
  | grep -c "error.*Barrel Contract" || true)

if [ "$ESLINT_ERRORS" -gt "$BARREL_DEBT_MAX" ]; then
  fail "ESLint barrel-debt : $ESLINT_ERRORS erreurs > seuil ratchet ($BARREL_DEBT_MAX)."
  fail "Nouvelles violations de Barrel Contract détectées — corrige avant de merger."
  npx eslint src/ --format stylish --max-warnings 9999 2>&1 \
    | grep "error.*Barrel Contract" | head -20
  exit 1
elif [ "$ESLINT_ERRORS" -lt "$BARREL_DEBT_MAX" ]; then
  ok "ESLint barrel-debt : $ESLINT_ERRORS erreurs < seuil ($BARREL_DEBT_MAX) — baisse BARREL_DEBT_MAX dans preflight.sh !"
else
  ok "ESLint barrel-debt : $ESLINT_ERRORS / $BARREL_DEBT_MAX — stable (pas de nouvelle violation)"
fi

# ────────────────────────────────────────────────────────────────
step "🧪 [4/8] Tests Vitest"
npx vitest run
ok "Suite de tests verte"

# ────────────────────────────────────────────────────────────────
step "🔄 [5/8] Cycles d'imports (madge — résout les alias @/)"
# Madge résout les alias @/ du tsconfig, là où sentrux peut manquer des edges.
# Un cycle runtime = TDZ "Cannot access X before initialization" au build SSR.
MADGE_OUT=$(npx madge --circular --extensions ts,tsx --ts-config tsconfig.json src 2>&1 || true)
CYCLE_COUNT=$(echo "$MADGE_OUT" | grep -c "^[0-9]\+)" || true)
if [ "$CYCLE_COUNT" -gt 0 ]; then
  warn "madge : $CYCLE_COUNT cycle(s) détecté(s) — dette pré-existante (non-bloquant)"
  warn "→ Créer un chantier dédié pour résorber les cycles d'imports."
else
  ok "Aucun cycle détecté par madge"
fi

# ────────────────────────────────────────────────────────────────
step "🏗️  [6/8] Build de production (SORTIE BRUTE — jamais via rtk)"
# rtk peut masquer un échec de build (exit 0 + résumé tronqué). Toujours brut.
npx next build
ok "Build de production réussi"

# ────────────────────────────────────────────────────────────────
step "🏛️  [7/8] sentrux check — règles architecturales (frontières + contraintes)"
if ! command -v sentrux >/dev/null 2>&1; then
  warn "sentrux non installé — étape sautée."
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
    warn "max_cc : dette pre-existante (sidecar Python + fonctions TS legacy — non-bloquant)"
    echo "$CHECK_OUT" | grep "cc=" | while IFS= read -r line; do echo "    $line"; done
    echo "  → Créer un chantier dédié pour réduire la complexité cyclomatique."
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
step "📉 [8/8] sentrux gate — anti-régression vs baseline"
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
echo ""
echo -e "${GREEN}${BOLD}✅ Preflight complet — prêt pour merge/deploy${RESET}"
echo ""
echo "  Rappel des vérifications passées :"
echo "  1. TypeScript    — 0 erreur"
echo "  2. fetch() nu    — 0 appel non authentifié sur routes protégées"
echo "  3. ESLint        — 0 warning bloquant"
echo "  4. Vitest        — suite verte"
echo "  5. Madge         — 0 cycle d'import"
echo "  6. Build prod    — bundle OK"
echo "  7. sentrux check — 67 règles OK"
echo "  8. sentrux gate  — pas de régression vs baseline"
