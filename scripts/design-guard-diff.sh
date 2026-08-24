#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# design-guard-diff.sh — verifie le diff staged contre les patterns bannis.
# Utilise par le hook .githooks/pre-commit (etape 5/5).
#
# Zones exemptees (dark-brand delibere) : (marketing)/, (ordering)/,
# (admin)/admin/mcc/, (admin)/simulator/.
# Fichiers doc/hook/config exempts : *.md, *.mdx, .claude/hooks/**,
# .githooks/**, scripts/**, .impeccable/**.
#
# Escape hatch : commentaire 'vibe-allow' sur la ligne autorise l'exception.
#
# exit 1 = bloque le commit, exit 0 = passe.
# ══════════════════════════════════════════════════════════════════════════════
set -uo pipefail
cd "$(git rev-parse --show-toplevel)" || exit 1

RED='\033[0;31m'; YEL='\033[1;33m'; GRN='\033[0;32m'; RST='\033[0m'

# Recupere les fichiers staged, filtre code app
FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null \
  | grep -E '\.(tsx?|jsx?|css)$' \
  | grep -vE '\.(md|mdx|txt)$' \
  | grep -vE '^\.claude/hooks/|^\.githooks/|^scripts/|^\.impeccable/' \
  | grep -vE 'src/app/\(marketing\)/|src/app/\(ordering\)/|src/app/\(admin\)/admin/mcc/|src/app/\(admin\)/simulator/' \
  || true)

[ -z "$FILES" ] && exit 0

PATTERNS=(
  'bg-white/\[0\.0'
  'text-slate-[0-9]+'
  'bg-slate-[0-9]+'
  'border-slate-[0-9]+'
  'text-zinc-[0-9]+'
  'bg-zinc-[0-9]+'
  'text-neutral-(300|400|500|600|700)'
  'text-\[9px\] font-black uppercase tracking-widest'
  'text-\[10px\] font-black uppercase tracking-widest'
  'bg-red-500'
  'text-red-500'
  'text-amber-400'
)

BAD=0
for f in $FILES; do
  # Recupere uniquement les lignes ajoutees dans le diff staged
  ADDED=$(git diff --cached --unified=0 -- "$f" | grep -E '^\+' | grep -v '^\+\+\+' | grep -v 'vibe-allow' || true)
  [ -z "$ADDED" ] && continue

  for pat in "${PATTERNS[@]}"; do
    hit=$(printf '%s' "$ADDED" | grep -E "$pat" | head -3 || true)
    if [ -n "$hit" ]; then
      if [ $BAD -eq 0 ]; then
        echo -e "${RED}❌ design-guard : patterns bannis introduits dans le commit${RST}"
        echo -e "${YEL}   → Consulte CLAUDE-VIBE.md pour les tokens semantiques.${RST}"
        echo -e "${YEL}   → Escape hatch : 'vibe-allow' inline sur la ligne (avec raison ecrite).${RST}"
        echo ""
      fi
      echo -e "${RED}$f${RST}   ${YEL}[$pat]${RST}"
      printf '%s\n' "$hit" | sed 's/^/    /'
      BAD=1
    fi
  done
done

if [ $BAD -eq 1 ]; then
  echo ""
  echo -e "${YEL}   Corrige le CODE — ne desserre pas la gate.${RST}"
  exit 1
fi

echo -e "${GRN}✅ [5/5] design-guard : 0 pattern banni dans le diff.${RST}"
exit 0
