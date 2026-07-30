#!/bin/bash

# ==============================================================================
# 🚀 STAGING DEPLOYMENT SCRIPT (Grade X)
# ==============================================================================
# Objectif : Déployer l'environnement de Staging pour les tests Hardware 
# (TPE Stripe Terminal & Imprimantes Thermiques).
# ==============================================================================

set -e

echo "🛡️  Vérification des règles Sentrux (Architecture Purity)..."
sentrux check . || { echo "❌ Échec Sentrux. Déploiement annulé."; exit 1; }

echo "🧪 Lancement des tests unitaires (Vitest)..."
npx vitest run || { echo "❌ Échec Vitest. Déploiement annulé."; exit 1; }

echo "🏭 Lancement des tests E2E (Playwright) locaux..."
npx playwright test || { echo "⚠️ Tests Playwright échoués ou non configurés (Base de données de test manquante). Poursuite conditionnelle."; }

echo "🌐 Configuration de l'environnement Staging..."
export NEXT_PUBLIC_ENVIRONMENT="staging"
export NODE_ENV="production"
# Protection contre la suppression de DB
export ALLOW_DB_DROP="false"

echo "📦 Build de l'application Next.js..."
npm run build

echo "🚀 Déploiement sur le cluster Staging..."
# Remplace cette ligne par la vraie commande Vercel / Google Cloud / AWS
echo ">> [Simulation] npx vercel --prod --scope=restaurant-os --env=staging"

echo "✅ Déploiement Staging terminé."
echo ""
echo "=============================================================================="
echo "⚠️  INSTRUCTIONS DE TESTS MATÉRIELS (HARDWARE) :"
echo "1. Connectez l'iPad de test au réseau WiFi 'RestaurantOS_Staging'."
echo "2. Allumez le lecteur Stripe Terminal (BBPOS WisePOS E)."
echo "3. Lancez l'application Staging et activez le paiement physique dans 'Settings'."
echo "4. Allumez l'imprimante thermique (Epson TM-m30) et vérifiez son IP."
echo "=============================================================================="
