#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# zero-claim-guard.sh — PreToolUse hook Edit|Write sur CLAUDE.md.
#
# Enforce la Loi 7 (Zero-Claim Policy) :
# Bloque l'ajout de chiffres / métriques en dur dans CLAUDE.md.
# Toute métrique doit vivre dans docs/HEALTH.md ou être testée via invariants.test.ts.
# ══════════════════════════════════════════════════════════════════════════════
set -uo pipefail

INPUT=$(cat)

FILE=$(printf '%s' "$INPUT" | node -e '
  let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
    try{const j=JSON.parse(d);console.log(j.tool_input?.file_path||"")}
    catch{console.log("")}
  });
' 2>/dev/null)

CONTENT=$(printf '%s' "$INPUT" | node -e '
  let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
    try{const j=JSON.parse(d);const t=j.tool_input||{};
      console.log(t.new_string||t.content||"")}
    catch{console.log("")}
  });
' 2>/dev/null)

[ -z "$FILE" ] && exit 0
[ -z "$CONTENT" ] && exit 0

# Ne s'applique qu'aux écritures ciblant CLAUDE.md
case "$FILE" in
  *CLAUDE.md)
    ;;
  *)
    exit 0
    ;;
esac

# Détecte les nombres à 2 chiffres ou plus non autorisés
# Exceptions autorisées : ADR-*, port 9621, Next.js 16, 12 variantes, 000, 1 microunit
LEAKS=$(printf '%s\n' "$CONTENT" | grep -E '\b[0-9]{2,}\b' \
  | grep -vE 'ADR-[0-9]{3}|port 9621|Next\.js 16|12 variantes|000|HEALTH\.md|invariants\.test\.ts|100%|2026' || true)

if [ -n "$LEAKS" ]; then
  cat >&2 << 'EOF'
🛑 [Zero-Claim Guard] Violations détectées dans CLAUDE.md (Loi 7) !
   Ne jamais écrire de métrique en dur dans CLAUDE.md.
   Tout chiffre dynamique appartient à docs/HEALTH.md (auto-généré) ou à un test d'invariant.

Lignes suspectes :
EOF
  echo "$LEAKS" >&2
  exit 2
fi

exit 0
