#!/bin/bash
# Hook PreToolUse (Edit|Write) — Garde de coordination inter-sessions.
#
# BLOQUE une écriture si le fichier visé tombe dans le périmètre déclaré d'une
# AUTRE session `active` de .claude/sessions.md. C'est la garde technique qui
# rend « ne pas écraser le travail d'un autre agent » obligatoire, pas optionnel.
#
# Identité : la session courante s'auto-déclare dans .claude/.active-session
# (un seul nom, écrit à l'inscription). Le hook s'en sert pour ne jamais se
# bloquer sur son propre périmètre.
#
# Dégradation sûre : si .active-session est absent (session non déclarée), le
# hook AVERTIT sans bloquer (exit 0) plutôt que de bloquer à tort.
#
# Matching : on extrait de la colonne « Périmètre » les jetons qui ressemblent à
# des chemins (src/…, scripts/…, docs/…, .claude/…, .githooks/…, eslint…). Une
# collision = le fichier visé commence par l'un de ces chemins.

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
[ -z "$ROOT" ] && exit 0
SESSIONS_FILE="$ROOT/.claude/sessions.md"
[ ! -f "$SESSIONS_FILE" ] && exit 0

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"//;s/"$//')
[ -z "$FILE_PATH" ] && exit 0

# Normaliser en chemin relatif au repo
REL="${FILE_PATH#$ROOT/}"

# Qui suis-je ? (vide si non déclaré)
ME=""
[ -f "$ROOT/.claude/.active-session" ] && ME=$(head -1 "$ROOT/.claude/.active-session" | xargs 2>/dev/null)

CONFLICTS=""
while IFS='|' read -r _ session perimetre _ status _; do
  status=$(echo "$status" | xargs 2>/dev/null)
  echo "$status" | grep -qi 'active' || continue
  echo "$status" | grep -qi 'termin' && continue

  session_name=$(echo "$session" | xargs 2>/dev/null | tr -d '`*')
  [ -n "$ME" ] && [ "$session_name" = "$ME" ] && continue   # jamais me bloquer moi-même

  # Extraire les jetons ressemblant à des chemins du périmètre
  for token in $(echo "$perimetre" | grep -oE '(src|scripts|docs|\.claude|\.githooks|eslint[a-z.-]*)[A-Za-z0-9/_.\-]*'); do
    token=$(echo "$token" | sed 's#/*$##')
    case "$REL" in
      "$token"|"$token"/*)
        CONFLICTS="$CONFLICTS\n  ⛔ Session '$session_name' possède le périmètre '$token'"
        ;;
    esac
  done
done < "$SESSIONS_FILE"

if [ -n "$CONFLICTS" ]; then
  {
    echo "COLLISION DE PÉRIMÈTRE sur : $REL"
    echo -e "$CONFLICTS"
    echo ""
    if [ -n "$ME" ]; then
      echo "Tu es la session '$ME'. Ce fichier appartient au périmètre déclaré d'une AUTRE session active."
      echo "→ NE PAS écraser. Coordonne-toi (sessions.md) ou demande à l'utilisateur avant de forcer."
      exit 2   # bloque l'outil, renvoie ce message au modèle
    else
      echo "Session courante NON déclarée dans .claude/sessions.md (.active-session absent)."
      echo "→ Inscris-toi d'abord ; avertissement seul pour l'instant."
      exit 0   # dégradation sûre : avertir sans bloquer
    fi
  } >&2
fi

exit 0
