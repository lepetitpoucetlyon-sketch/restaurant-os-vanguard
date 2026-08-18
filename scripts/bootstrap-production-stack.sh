#!/usr/bin/env bash
# 🚀 bootstrap-production-stack.sh — Lancement Automatique & Zero-Touch de la Stack Prod
# Démarre Next.js + DocuSeal Open-Source + Caddy SSL + DB choisie en 1 seule commande
#
# Usage :
#   ./scripts/bootstrap-production-stack.sh
#   NEXUS_PROVIDER=postgres ./scripts/bootstrap-production-stack.sh   # non-interactif
#
# Providers supportés :
#   firestore  (défaut, cloud managé)  - clé Firebase
#   postgres   (Supabase / OVH managé) - DATABASE_URL Postgres
#   mongo      (MongoDB Atlas)         - DATABASE_URL Mongo + credentials Atlas
#   sqlite     (fichier local — dev/single-node prod)
#
# Sortie : .env.production autogénéré + docker compose profile activé pour la DB choisie.

set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

ok()   { echo -e "${GREEN}  ✅ $1${RESET}"; }
warn() { echo -e "${YELLOW}  ⚠️  $1${RESET}"; }
fail() { echo -e "${RED}  ❌ $1${RESET}"; exit 1; }
step() { echo -e "\n${BOLD}${BLUE}$1${RESET}"; }

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo -e "${BOLD}  🏛️  Restaurant OS — Déploiement Stack Production Plug-and-Play${RESET}"
echo "══════════════════════════════════════════════════════════════════"

# ────────────────────────────────────────────────────────────────
# 1. Docker requis
# ────────────────────────────────────────────────────────────────
step "🐳 [1/6] Vérification Docker"
command -v docker >/dev/null || fail "Docker n'est pas installé. Installe Docker Engine + Compose puis relance ce script."
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 requis (docker compose ...)."
ok "Docker + Compose v2 détectés"

# ────────────────────────────────────────────────────────────────
# 2. Sélection du DB provider (interactive ou via env NEXUS_PROVIDER)
# ────────────────────────────────────────────────────────────────
step "🗄️  [2/6] Choix du fournisseur de base de données (NEXUS_PROVIDER)"

PROVIDER="${NEXUS_PROVIDER:-}"

if [ -z "$PROVIDER" ]; then
  if [ -t 0 ]; then
    echo ""
    echo "  Sélectionne le provider de données :"
    echo "    1) firestore   — Firebase Firestore (défaut, cloud Google, PITR géré)"
    echo "    2) postgres    — Postgres managé (Supabase, OVH, RDS, ...)"
    echo "    3) mongo       — MongoDB Atlas (cluster managé)"
    echo "    4) sqlite      — SQLite (fichier local, mono-nœud)"
    echo ""
    read -rp "  Ton choix [1-4, défaut=1] : " CHOICE
    case "${CHOICE:-1}" in
      1) PROVIDER="firestore" ;;
      2) PROVIDER="postgres"  ;;
      3) PROVIDER="mongo"     ;;
      4) PROVIDER="sqlite"    ;;
      *) fail "Choix invalide : $CHOICE" ;;
    esac
  else
    PROVIDER="firestore"
    warn "Terminal non-interactif → fallback provider=firestore"
  fi
fi

PROVIDER=$(echo "$PROVIDER" | tr '[:upper:]' '[:lower:]')
case "$PROVIDER" in
  firestore|postgres|mongo|sqlite) ok "Provider sélectionné : ${BOLD}$PROVIDER${RESET}" ;;
  *) fail "Provider inconnu : $PROVIDER (attendu : firestore|postgres|mongo|sqlite)" ;;
esac

# ────────────────────────────────────────────────────────────────
# 3. Collecte des variables d'env spécifiques au provider
# ────────────────────────────────────────────────────────────────
step "🔑 [3/6] Configuration provider $PROVIDER"

PROVIDER_ENV_BLOCK=""
COMPOSE_PROFILES=""

read_var() {
  local var_name="$1"
  local prompt="$2"
  local default="$3"
  local existing="${!var_name:-}"
  if [ -n "$existing" ]; then
    echo "$existing"
    return
  fi
  if [ -t 0 ]; then
    if [ -n "$default" ]; then
      read -rp "    $prompt [$default] : " val
      echo "${val:-$default}"
    else
      read -rp "    $prompt : " val
      echo "$val"
    fi
  else
    echo "$default"
  fi
}

case "$PROVIDER" in
  firestore)
    FIRESTORE_PROJECT_ID=$(read_var FIRESTORE_PROJECT_ID "FIRESTORE_PROJECT_ID (id projet Firebase)" "")
    FIREBASE_SERVICE_ACCOUNT_JSON=$(read_var FIREBASE_SERVICE_ACCOUNT_JSON "FIREBASE_SERVICE_ACCOUNT_JSON (JSON base64 ou chemin fichier)" "")
    PROVIDER_ENV_BLOCK="FIRESTORE_PROJECT_ID=${FIRESTORE_PROJECT_ID}
FIREBASE_SERVICE_ACCOUNT_JSON=${FIREBASE_SERVICE_ACCOUNT_JSON}"
    ok "Firestore configuré — PITR REST API géré par NexusInfra"
    ;;

  postgres)
    DATABASE_URL=$(read_var DATABASE_URL "DATABASE_URL (ex: postgresql://user:pass@host:5432/dbname)" "postgresql://restauros:restauros@postgres:5432/restauros")
    SUPABASE_PROJECT_REF=$(read_var SUPABASE_PROJECT_REF "SUPABASE_PROJECT_REF (optionnel, pour PITR Supabase)" "")
    SUPABASE_ACCESS_TOKEN=$(read_var SUPABASE_ACCESS_TOKEN "SUPABASE_ACCESS_TOKEN (optionnel)" "")
    PROVIDER_ENV_BLOCK="DATABASE_URL=${DATABASE_URL}
SUPABASE_PROJECT_REF=${SUPABASE_PROJECT_REF}
SUPABASE_ACCESS_TOKEN=${SUPABASE_ACCESS_TOKEN}
POSTGRES_USER=restauros
POSTGRES_PASSWORD=$(openssl rand -hex 16 2>/dev/null || echo "changeme_prod")
POSTGRES_DB=restauros"
    COMPOSE_PROFILES="postgres"
    ok "Postgres configuré — service postgres inclus dans la stack"
    ;;

  mongo)
    DATABASE_URL=$(read_var DATABASE_URL "DATABASE_URL (ex: mongodb+srv://user:pass@cluster/dbname)" "mongodb://restauros:restauros@mongo:27017/restauros")
    MONGO_ATLAS_PROJECT_ID=$(read_var MONGO_ATLAS_PROJECT_ID "MONGO_ATLAS_PROJECT_ID (optionnel, pour PITR)" "")
    MONGO_ATLAS_API_KEY=$(read_var MONGO_ATLAS_API_KEY "MONGO_ATLAS_API_KEY (optionnel)" "")
    PROVIDER_ENV_BLOCK="DATABASE_URL=${DATABASE_URL}
MONGO_ATLAS_PROJECT_ID=${MONGO_ATLAS_PROJECT_ID}
MONGO_ATLAS_API_KEY=${MONGO_ATLAS_API_KEY}
MONGO_INITDB_ROOT_USERNAME=restauros
MONGO_INITDB_ROOT_PASSWORD=$(openssl rand -hex 16 2>/dev/null || echo "changeme_prod")"
    COMPOSE_PROFILES="mongo"
    ok "MongoDB configuré — service mongo inclus dans la stack"
    ;;

  sqlite)
    DATABASE_URL=$(read_var DATABASE_URL "DATABASE_URL (chemin fichier)" "file:/app/storage/restauros.db")
    PROVIDER_ENV_BLOCK="DATABASE_URL=${DATABASE_URL}"
    warn "SQLite mono-nœud — pas de PITR ni de réplication, prévoir backup manuel du volume."
    ;;
esac

# ────────────────────────────────────────────────────────────────
# 4. Génération du .env.production (idempotent : ne casse pas l'existant)
# ────────────────────────────────────────────────────────────────
step "📝 [4/6] Génération .env.production"

if [ -f .env.production ]; then
  BACKUP=".env.production.bak.$(date +%s)"
  cp .env.production "$BACKUP"
  warn ".env.production existant sauvegardé dans $BACKUP"
fi

DOCUSEAL_SECRET=$(openssl rand -hex 32 2>/dev/null || date +%s%N)
DOCUSEAL_API_KEY=$(openssl rand -hex 24 2>/dev/null || echo "prod_key_$(date +%s)")
DOCUSEAL_WEBHOOK_SECRET=$(openssl rand -hex 32 2>/dev/null || date +%s%N)
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || date +%s%N)

cat > .env.production <<EOF
# ═══════════════════════════════════════════════════════════════
# .env.production — Généré par bootstrap-production-stack.sh
# Date : $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Provider DB : ${PROVIDER}
# ═══════════════════════════════════════════════════════════════

# ─── App ────────────────────────────────────────────────────────
NODE_ENV=production
DOMAIN=webapp.fr
APP_URL=https://app.webapp.fr
NEXT_PUBLIC_APP_URL=https://app.webapp.fr

# ─── DB / Nexus Provider ────────────────────────────────────────
NEXUS_PROVIDER=${PROVIDER}
${PROVIDER_ENV_BLOCK}

# ─── Secrets cryptographiques (générés automatiquement) ─────────
JWT_SECRET=${JWT_SECRET}
DOCUSEAL_SECRET_KEY=${DOCUSEAL_SECRET}
DOCUSEAL_API_KEY=${DOCUSEAL_API_KEY}
DOCUSEAL_API_URL=http://docuseal:3000
DOCUSEAL_WEBHOOK_SECRET=${DOCUSEAL_WEBHOOK_SECRET}

# ─── Docker Compose Profiles (active la DB adéquate) ────────────
COMPOSE_PROFILES=${COMPOSE_PROFILES}
EOF

ok ".env.production régénéré (secrets rotatés, provider=${PROVIDER})"
if [ -n "$COMPOSE_PROFILES" ]; then
  ok "Profils compose actifs : $COMPOSE_PROFILES"
fi

# ────────────────────────────────────────────────────────────────
# 5. Lancement de la stack (profile provider auto)
# ────────────────────────────────────────────────────────────────
step "🐳 [5/6] Démarrage stack Docker Compose (build inclus)"
echo ""
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# ────────────────────────────────────────────────────────────────
# 6. Health-check DocuSeal
# ────────────────────────────────────────────────────────────────
step "❤️  [6/6] Vérification santé DocuSeal"
MAX_RETRIES=20
COUNT=0
while [ $COUNT -lt $MAX_RETRIES ]; do
  if docker exec restaurant-os-docuseal curl -s -f http://localhost:3000/health >/dev/null 2>&1; then
    ok "DocuSeal opérationnel"
    break
  fi
  COUNT=$((COUNT + 1))
  sleep 2
done

if [ $COUNT -eq $MAX_RETRIES ]; then
  warn "DocuSeal ne répond pas après $((MAX_RETRIES * 2))s — vérifier logs : docker compose -f docker-compose.prod.yml logs docuseal"
fi

# ────────────────────────────────────────────────────────────────
# Récap final
# ────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════════════════"
echo -e "${GREEN}${BOLD}  🎉 Stack de Production Déployée avec Succès !${RESET}"
echo "══════════════════════════════════════════════════════════════════"
echo -e "  🌐 Application         : https://webapp.fr (et *.webapp.fr)"
echo -e "  ✍️  Moteur signature    : https://sign.webapp.fr"
echo -e "  🔒 SSL Let's Encrypt   : renouvellement automatique par Caddy"
echo -e "  🗄️  Provider DB actif   : ${BOLD}${PROVIDER}${RESET}"
echo -e "  🛡️  Webhook DocuSeal    : HMAC signé (DOCUSEAL_WEBHOOK_SECRET)"
echo -e "  🦭 E-Signature         : 100% souverain, zéro tiers, zéro coût / contrat"
echo "══════════════════════════════════════════════════════════════════"
echo ""
echo "  Prochaines étapes :"
echo "    - Configure ton domaine dans DNS → IP du serveur (A record wildcard *.webapp.fr)"
echo "    - Enregistre l'URL du webhook DocuSeal : https://webapp.fr/api/webhooks/docuseal"
echo "    - Copie DOCUSEAL_WEBHOOK_SECRET dans la console DocuSeal pour signer les événements"
echo ""
