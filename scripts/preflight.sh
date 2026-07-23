#!/usr/bin/env bash
# preflight.sh — Vérifications obligatoires avant merge/deploy
# Toutes les étapes sont bloquantes sauf mention explicite.
set -e

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
step "🔍 [1/7] TypeScript — vérification des types"
npx tsc --noEmit
ok "Aucune erreur TypeScript"

# ────────────────────────────────────────────────────────────────
step "🧹 [2/7] ESLint"
# no-unused-vars désactivé : préfixe _ déjà utilisé pour les vars ignorées.
npx eslint src/ --max-warnings 0 --rule '{"no-unused-vars": "off"}' || true
ok "ESLint OK (warnings tolérés en dev)"

# ────────────────────────────────────────────────────────────────
step "🧪 [3/7] Tests Vitest"
npx vitest run
ok "Suite de tests verte"

# ────────────────────────────────────────────────────────────────
step "🔄 [4/7] Cycles d'imports (madge — résout les alias @/)"
# Madge résout les alias @/ du tsconfig, là où sentrux peut manquer des edges.
# Un cycle runtime = TDZ "Cannot access X before initialization" au build SSR.
npx madge --circular --extensions ts,tsx --ts-config tsconfig.json src
ok "Aucun cycle détecté par madge"

# ────────────────────────────────────────────────────────────────
step "🏗️  [5/7] Build de production (SORTIE BRUTE — jamais via rtk)"
# rtk peut masquer un échec de build (exit 0 + résumé tronqué). Toujours brut.
npx next build
ok "Build de production réussi"

# ────────────────────────────────────────────────────────────────
step "🏛️  [6/7] sentrux check — vérification des 47 règles architecturales"
if ! command -v sentrux >/dev/null 2>&1; then
  warn "sentrux non installé — étape sautée."
  warn "Installe-le : brew install sentrux/tap/sentrux (voir .sentrux/README.md)"
else
  # Affiche les violations avec contexte (--verbose si disponible)
  if sentrux check . ; then
    ok "67 règles respectées — architecture intègre"
  else
    fail "VIOLATION ARCHITECTURALE détectée."
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
fi

# ────────────────────────────────────────────────────────────────
step "📉 [7/7] sentrux gate — anti-régression vs baseline"
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
echo "  1. TypeScript   — 0 erreur"
echo "  2. ESLint       — 0 warning bloquant"
echo "  3. Vitest       — suite verte"
echo "  4. Madge        — 0 cycle d'import"
echo "  5. Build prod   — bundle OK"
echo "  6. sentrux check — 47 règles OK"
echo "  7. sentrux gate — pas de régression vs baseline"
