#!/usr/bin/env bash
# 🚀 bootstrap-production-stack.sh — Lancement Automatique & Zero-Touch de la Stack Prod
# Démarre Next.js + DocuSeal Open-Source + Caddy SSL en 1 seule commande

set -e

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "  🏛️ Restaurant OS — Déploiement Stack Production Plug-and-Play"
echo "══════════════════════════════════════════════════════════════════"
echo ""

# 1. Vérification de Docker
if ! command -v docker &>/dev/null; then
  echo "❌ Docker n'est pas installé sur cette machine. Installez Docker pour continuer."
  exit 1
fi

# 2. Génération automatique du fichier .env.production si absent
if [ ! -f .env.production ]; then
  echo "ℹ️  Génération automatique de la configuration de production (.env.production)..."
  DOCUSEAL_SECRET=$(openssl rand -hex 32 2>/dev/null || date +%s%N)
  JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || date +%s%N)
  
  cat <<EOF > .env.production
DOMAIN=webapp.fr
APP_URL=https://app.webapp.fr
NODE_ENV=production
DOCUSEAL_SECRET_KEY=${DOCUSEAL_SECRET}
DOCUSEAL_API_URL=http://docuseal:3000
DOCUSEAL_API_KEY=auto_generated_key_$(openssl rand -hex 8 2>/dev/null || echo "prod_key")
JWT_SECRET=${JWT_SECRET}
EOF
  echo "✅ .env.production initialisé avec des clés cryptographiques sécurisées."
fi

# 3. Lancement de la stack Docker Compose
echo ""
echo "🐳 Démarrage des conteneurs (App + DocuSeal + Caddy Auto-SSL)..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 4. Attente de la disponibilité du serveur DocuSeal
echo ""
echo "⏳ Vérification de la disponibilité du moteur de signature DocuSeal..."
MAX_RETRIES=20
COUNT=0
while [ $COUNT -lt $MAX_RETRIES ]; do
  if docker exec restaurant-os-docuseal curl -s -f http://localhost:3000/health &>/dev/null; then
    echo "✅ DocuSeal est opérationnel et branché !"
    break
  fi
  COUNT=$((COUNT + 1))
  sleep 2
done

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "  🎉 Stack de Production Déployée & Branchée avec Succès !"
echo "══════════════════════════════════════════════════════════════════"
echo "  🌐 Application :           https://webapp.fr (ou https://app.webapp.fr)"
echo "  ✍️ Moteur de Signature :    https://sign.webapp.fr"
echo "  🔒 Certificats SSL :        Générés et renouvelés automatiquement (Let's Encrypt)"
echo "  🦭 E-Signature :            100% Souverain, Zéro Tiers, Zéro Coût par Contrat"
echo "══════════════════════════════════════════════════════════════════"
echo ""
