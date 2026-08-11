#!/usr/bin/env bash
# =============================================================================
# agent-gate.sh — LE GATE DE VÉRITÉ (Antigravity ⇄ Claude)
# -----------------------------------------------------------------------------
# À lancer APRÈS chaque commit (sur le HEAD commité). Il mesure les métriques
# du §0 et produit un BLOC DE PREUVE horodaté et LIÉ AU HASH DU COMMIT.
#
# Pourquoi le hash ? Leçon §AUDIT-2 : un « 0 » collé sans hash a traversé
# l'audit. Ici, l'auditeur (Claude) fait `git checkout <hash>` et relance ce
# même script : si ton bloc ne correspond pas, l'écart est immédiat et total.
# Falsifier devient inutile — la preuve est reproductible bit à bit.
#
# Usage :
#   ./scripts/agent-gate.sh            # gate rapide (tsc + compteurs + cycles)
#   ./scripts/agent-gate.sh --full     # + vitest (long : ~40 s)
#
# Colle la sortie ENTIÈRE (le bloc entre les lignes ===) dans ton entrée de
# journal. Ne la résume pas, ne la tronque pas.
# =============================================================================
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 1

FULL=0
[ "${1:-}" = "--full" ] && FULL=1

HASH=$(git rev-parse --short=9 HEAD)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
DIRTY=$(git status --porcelain | grep -vE '^\?\?' | wc -l | tr -d ' ')

echo "=== AGENT-GATE PROOF ============================================"
echo "commit   : $HASH   (branche $BRANCH)"
echo "arbre    : $DIRTY fichier(s) suivi(s) non commité(s)  (doit être 0 pour une preuve valable)"
echo "----------------------------------------------------------------"

# 1. TSC — TOUJOURS en premier. Un dépôt qui ne compile pas rend tout le reste faux.
TSC=$(npx tsc --noEmit 2>&1 | grep -c "error TS")
echo "TSC error TS            : $TSC        (cible 0)"

# 2. Cycles (madge = chaînes lisibles ; sentrux = gate officiel)
CYC=$(npx madge --circular --extensions ts,tsx src 2>/dev/null | grep -cE '^[0-9]+\)')
echo "cycles (madge)          : $CYC        (cible 0 ; baseline tolérée 3)"

# 3. Inversions de couche (le kernel ne doit dépendre de RIEN)
K2M=$(grep -rn "from '@/modules/" src/kernel  --include='*.ts*' | grep -v '\.test\.' | wc -l | tr -d ' ')
S2M=$(grep -rn "from '@/modules/" src/shared  --include='*.ts*' | grep -v '\.test\.' | wc -l | tr -d ' ')
L2M=$(grep -rn "from '@/modules/" src/lib     --include='*.ts*' | grep -v '\.test\.' | wc -l | tr -d ' ')
ST2M=$(grep -rn "from '@/modules/" src/store  --include='*.ts*' | grep -v '\.test\.' | wc -l | tr -d ' ')
echo "kernel -> modules       : $K2M         (cible 0)"
echo "shared -> modules       : $S2M         (cible 0)"
echo "lib    -> modules       : $L2M         (cible 0)"
echo "store  -> modules       : $ST2M         (cible 0)"

# 4. Barrel par pilier
echo -n "barrel (viol/pilier)    : "
for P in facility logistics human ops compliance finance commerce intelligence; do
  C=$(grep -rn "from '@/modules/$P/[a-z]" src --include='*.ts*' | grep -v "__tests__\|\.test\." | wc -l | tr -d ' ')
  echo -n "$P=$C "
done
echo ""

# 5. Monnaie
INC=$(grep -rn "InCents" src --include='*.ts*' | grep -v '\.test\.' | wc -l | tr -d ' ')
ASM=$(grep -rn "as Microunits" src --include='*.ts*' | wc -l | tr -d ' ')
echo "InCents                 : $INC       (cible 0)"
echo "as Microunits (direct)  : $ASM         (cible 0)"

# 6. Tests (optionnel, --full)
if [ "$FULL" = "1" ]; then
  echo "----------------------------------------------------------------"
  echo "vitest (extrait) :"
  npx vitest run --reporter=dot 2>&1 | grep -E "Test Files|Tests " | tail -2
fi

echo "----------------------------------------------------------------"
# Verdict machine — le gate passe-t-il le seuil dur ?
if [ "$TSC" = "0" ]; then echo "VERDICT tsc  : ✅ VERT (0 erreur)"; else echo "VERDICT tsc  : ❌ ROUGE ($TSC erreurs) — NE PAS déclarer DONE"; fi
if [ "$DIRTY" = "0" ]; then echo "VERDICT arbre: ✅ propre"; else echo "VERDICT arbre: ⚠️ $DIRTY non commité — la preuve ne reflète pas un commit"; fi
echo "================================================================"
