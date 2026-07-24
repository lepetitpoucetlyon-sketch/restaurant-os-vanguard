#!/bin/bash
# Hook PreToolUse (Edit/Write) — vérifie qu'une autre session active
# ne travaille pas sur le même fichier/périmètre avant d'écrire.
#
# Lit le JSON de l'outil depuis stdin, extrait le file_path,
# puis scanne sessions.md pour les périmètres actifs.

SESSIONS_FILE="$(git rev-parse --show-toplevel 2>/dev/null)/.claude/sessions.md"
[ ! -f "$SESSIONS_FILE" ] && exit 0

# Lire le file_path depuis le JSON en stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"//;s/"$//')
[ -z "$FILE_PATH" ] && exit 0

# Extraire les périmètres des sessions actives
CONFLICTS=""
while IFS='|' read -r _ session perimetre _ status _; do
  # Nettoyer les espaces
  status=$(echo "$status" | xargs 2>/dev/null)
  perimetre=$(echo "$perimetre" | xargs 2>/dev/null | tr -d '`')

  [ "$status" != "active" ] && continue
  [ -z "$perimetre" ] && continue

  # Vérifier si le fichier modifié est dans le périmètre d'une autre session
  if echo "$FILE_PATH" | grep -q "$perimetre"; then
    session_name=$(echo "$session" | xargs 2>/dev/null)
    CONFLICTS="$CONFLICTS\n⚠️  Session '$session_name' travaille sur '$perimetre'"
  fi
done < <(grep '|.*|.*|.*active' "$SESSIONS_FILE" 2>/dev/null)

if [ -n "$CONFLICTS" ]; then
  echo "COLLISION DÉTECTÉE sur $FILE_PATH"
  echo -e "$CONFLICTS"
  echo "Vérifier avec l'utilisateur avant de modifier ce fichier."
  # Exit 0 = warning only (ne bloque pas). Exit 2 = bloquerait l'outil.
  exit 0
fi

exit 0
