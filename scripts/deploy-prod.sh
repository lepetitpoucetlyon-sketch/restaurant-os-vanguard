#!/usr/bin/env bash
# deploy-prod.sh — Déploiement complet en production (Firebase Functions + règles)
# Pré-requis : firebase CLI installé et connecté (firebase login), .env.production rempli
set -e

FAIL=0
ko()   { echo "   ❌ $1"; FAIL=1; }
ok()   { echo "   ✅ $1"; }
info() { echo "   ℹ️  $1"; }

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  Restaurant OS — Déploiement Production"
echo "══════════════════════════════════════════════════════════"
echo ""

# ─── 1. Vérification des prérequis ───────────────────────────────────────────
echo "🔍 [1/5] Vérification des prérequis..."

if ! command -v firebase &>/dev/null; then
  ko "firebase CLI non installé. Lancer : npm install -g firebase-tools"
fi

if ! firebase projects:list &>/dev/null; then
  ko "Non connecté à Firebase. Lancer : firebase login"
fi

[ -z "$FIREBASE_SERVICE_ACCOUNT_JSON" ] && ko "FIREBASE_SERVICE_ACCOUNT_JSON absent dans l'env" || ok "FIREBASE_SERVICE_ACCOUNT_JSON présent"
[ -z "$STRIPE_SECRET_KEY" ]             && ko "STRIPE_SECRET_KEY absent"                        || ok "STRIPE_SECRET_KEY présent"
[ -z "$STRIPE_WEBHOOK_SECRET" ]         && ko "STRIPE_WEBHOOK_SECRET absent"                    || ok "STRIPE_WEBHOOK_SECRET présent"
[ -z "$RESEND_API_KEY" ]                && ko "RESEND_API_KEY absent"                           || ok "RESEND_API_KEY présent"
[ -z "$STRIPE_PRICE_STANDARD" ]         && ko "STRIPE_PRICE_STANDARD absent"                    || ok "STRIPE_PRICE_STANDARD présent"

if [ "$FAIL" = "1" ]; then
  echo ""
  echo "❌ Variables manquantes — remplir .env.production puis relancer."
  echo "   Aide : voir les commentaires dans .env.production"
  exit 1
fi

# ─── 2. Build des Firebase Functions ─────────────────────────────────────────
echo ""
echo "🔨 [2/5] Build Firebase Functions..."
cd functions
npm ci --quiet
npm run build
cd ..
ok "Functions compilées (lib/ généré)"

# ─── 3. Déploiement des Functions ────────────────────────────────────────────
echo ""
echo "🚀 [3/5] Déploiement des Firebase Functions..."
info "Fonctions déployées : loginWithPin, listLoginProfiles, askGeminiAgent, onJournalEntryCreated"
firebase deploy --only functions --project kitchen-os-gastro
ok "Functions déployées"

# ─── 4. Déploiement des règles Firestore ─────────────────────────────────────
echo ""
echo "🔒 [4/5] Déploiement des règles Firestore..."
firebase deploy --only firestore:rules --project kitchen-os-gastro
ok "Règles Firestore déployées"

# ─── 5. Vérification post-déploiement ────────────────────────────────────────
echo ""
echo "✅ [5/5] Vérification..."
info "loginWithPin  → firebase functions:call loginWithPin (test manuel)"
info "Logs         → firebase functions:log --only loginWithPin"
info "Status page  → https://TON_DOMAINE/status"
echo ""
echo "══════════════════════════════════════════════════════════"
echo "  Déploiement terminé."
echo ""
echo "  ÉTAPES SUIVANTES (manuelles) :"
echo "  1. Ajouter FIREBASE_SERVICE_ACCOUNT_JSON dans Vercel/Render env"
echo "  2. Ajouter STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET dans Vercel"
echo "  3. Ajouter RESEND_API_KEY dans Vercel"
echo "  4. Ajouter STRIPE_PRICE_* et STRIPE_PRODUCT_* dans Vercel"
echo "  5. Configurer les 2 webhooks Stripe (voir .env.production)"
echo "══════════════════════════════════════════════════════════"
