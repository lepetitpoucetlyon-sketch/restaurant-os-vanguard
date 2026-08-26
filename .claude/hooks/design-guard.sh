#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# design-guard.sh — PreToolUse hook Edit|Write|NotebookEdit.
#
# Bloque (exit 2) l'ecriture d'un pattern design retire du codebase lors du
# chantier dette structurelle plan v3.1 (2026-08-24). Voir sessions
# `dette-structurelle-p1` + commits 5f1663aec / 2f67b9d84 / 3421bffa1 / …
#
# Zones exemptees (dark-brand delibere) :
#   - src/app/(marketing)/     : landing page publique
#   - src/app/(ordering)/      : flow QR ordering client-final
#   - src/app/(admin)/admin/mcc/ + (admin)/simulator/ : MCC console (toi)
#
# Escape hatch : commentaire inline `vibe-allow` sur la meme ligne autorise
# le pattern (a n'utiliser que si tu sais vraiment ce que tu fais).
#
# Input Claude Code : JSON stdin { tool_input: { file_path, content|new_string } }
# ══════════════════════════════════════════════════════════════════════════════
set -uo pipefail

# Lit le payload
INPUT=$(cat)

# Extrait file_path (compatible Edit + Write + NotebookEdit)
FILE=$(printf '%s' "$INPUT" | node -e '
  let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
    try{const j=JSON.parse(d);console.log(j.tool_input?.file_path||"")}
    catch{console.log("")}
  });
' 2>/dev/null)

# Extrait le contenu ecrit (Edit: new_string ; Write: content)
CONTENT=$(printf '%s' "$INPUT" | node -e '
  let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
    try{const j=JSON.parse(d);const t=j.tool_input||{};
      console.log(t.new_string||t.content||"")}
    catch{console.log("")}
  });
' 2>/dev/null)

# Pas de fichier ou contenu vide => let it pass
[ -z "$FILE" ] && exit 0
[ -z "$CONTENT" ] && exit 0

# Fichiers exemptes (documentation, config, hooks eux-memes)
case "$FILE" in
  *.md|*.mdx|*.txt|*/CHANGELOG*|*/README*)
    exit 0 ;;
  */.claude/hooks/*|*/.githooks/*|*/scripts/*|*/.impeccable/*)
    exit 0 ;;
esac

# Zones code exemptees (dark-brand delibere)
if echo "$FILE" | grep -qE '/\(marketing\)/|/\(ordering\)/|/\(admin\)/admin/mcc/|/\(admin\)/simulator/'; then
  exit 0
fi

# Patterns bannis (7 familles, avec message pedagogique)
declare -a PATTERNS_LABELS=(
  "bg-white/\[0\.0@Utilise bg-surface-glass, bg-surface-glass-hover ou bg-surface-glass-active — mode-aware light/dark."
  "text-slate-[0-9]+@Utilise text-text-primary/secondary/muted — mode-aware tenant."
  "bg-slate-[0-9]+@Utilise bg-surface-card, bg-surface-sidebar ou bg-surface-glass* — theme-safe."
  "border-slate-[0-9]+@Utilise border-border ou border-border/40 — mode-aware."
  "text-zinc-[0-9]+@Utilise text-text-primary/secondary/muted."
  "bg-zinc-[0-9]+@Utilise bg-surface-* tokens."
  "bg-gray-9(00|50)@Utilise bg-surface-card ou bg-surface-glass — theme-safe."
  "bg-neutral-9(00|50)@Utilise bg-surface-card ou bg-surface-glass — theme-safe."
  "bg-\[#0[0-9a-fA-F]{5}\]@Utilise bg-surface-card ou bg-surface-glass — pas de hex sombre en dur."
  "text-neutral-(300|400|500|600|700)@Utilise text-text-muted variants — mode-aware."
  "text-\[9px\] font-black uppercase tracking-widest@Utilise className='text-chip-label-sm' — utility semantique."
  "text-\[10px\] font-black uppercase tracking-widest@Utilise className='text-chip-label' — utility semantique."
  "bg-red-500@Utilise bg-status-danger — token semantique."
  "text-red-500@Utilise text-status-danger — token semantique."
  "text-amber-400@Utilise text-accent-gold — token brand."
)

# Verifie chaque pattern
VIOLATIONS=""
for entry in "${PATTERNS_LABELS[@]}"; do
  IFS='@' read -r pat msg <<< "$entry"
  # Filtre les lignes qui ont l'escape hatch 'vibe-allow'
  matched=$(printf '%s' "$CONTENT" | grep -E "$pat" | grep -v "vibe-allow" || true)
  if [ -n "$matched" ]; then
    VIOLATIONS+="  ❌ Pattern interdit : $pat
     → $msg
     Ligne matchee : $(printf '%s' "$matched" | head -1 | cut -c1-140)
"
  fi
done

if [ -n "$VIOLATIONS" ]; then
  {
    echo "🎨 design-guard : ecriture refusee sur $FILE"
    echo ""
    printf '%s' "$VIOLATIONS"
    echo ""
    echo "📖 Consultation rapide : CLAUDE-VIBE.md pour la checklist tokens."
    echo "🔓 Escape hatch : ajouter le commentaire 'vibe-allow' sur la meme ligne (a n'utiliser que si vraiment justifie)."
  } >&2
  exit 2
fi

exit 0
