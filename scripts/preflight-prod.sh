#!/usr/bin/env bash
# preflight-prod.sh — Garde-fou AVANT toute mise en production.
# Cloud-agnostique : seul FISCAL_SIGNING_SECRET est universel ; les secrets
# Firebase/Stripe ne sont exigés que si le backend correspondant est actif.
set -e

FAIL=0
warn() { echo "   ⚠️  $1"; }
ko()   { echo "   ❌ $1"; FAIL=1; }
ok()   { echo "   ✅ $1"; }

echo "🔑 [1/4] Secrets serveur..."
# Universel — le scellement NF525 échoue explicitement sans clé.
if [ -z "$FISCAL_SIGNING_SECRET" ]; then
  ko "FISCAL_SIGNING_SECRET absent — AUCUN scellement possible côté serveur."
else
  ok "FISCAL_SIGNING_SECRET présent."
fi

# Backend Firestore (adapter par défaut en prod).
if [ -z "$FIREBASE_SERVICE_ACCOUNT_JSON" ]; then
  ko "FIREBASE_SERVICE_ACCOUNT_JSON absent — auth admin (JWT, claims, signup) inopérante."
else
  ok "FIREBASE_SERVICE_ACCOUNT_JSON présent."
fi

# Billing.
[ -z "$STRIPE_SECRET_KEY" ]     && ko "STRIPE_SECRET_KEY absent — checkout signup KO."     || ok "STRIPE_SECRET_KEY présent."
[ -z "$STRIPE_WEBHOOK_SECRET" ] && ko "STRIPE_WEBHOOK_SECRET absent — webhooks rejetés."   || ok "STRIPE_WEBHOOK_SECRET présent."

# IA (non bloquant : vision/brand-extract dégradent proprement).
[ -z "$GEMINI_API_KEY" ] && warn "GEMINI_API_KEY absent — vision IA et extraction de marque désactivées." || ok "GEMINI_API_KEY présent."

echo "🚫 [2/4] Fuites côté client..."
# Aucun secret ne doit être exposé en NEXT_PUBLIC_*.
if env | grep -E '^NEXT_PUBLIC_.*(SECRET|SERVICE_ACCOUNT|PRIVATE|SIGNING)' >/dev/null 2>&1; then
  ko "Un secret est exposé en NEXT_PUBLIC_* :"; env | grep -E '^NEXT_PUBLIC_.*(SECRET|SERVICE_ACCOUNT|PRIVATE|SIGNING)' | cut -d= -f1 | sed 's/^/      /'
else
  ok "Aucun secret exposé en NEXT_PUBLIC_*."
fi

echo "📜 [3/4] Règles de sécurité serveur..."
if [ -f firestore.rules ]; then
  if git diff --quiet HEAD -- firestore.rules 2>/dev/null; then
    ok "firestore.rules committées. Penser à : firebase deploy --only firestore:rules"
  else
    warn "firestore.rules modifiées non committées — déployer la version validée uniquement."
  fi
else
  warn "Pas de firestore.rules (backend non-Firestore ? vérifier l'équivalent du backend actif)."
fi

echo "🏗️  [4/4] Build de production (sortie brute)..."
npx next build

if [ "$FAIL" = "1" ]; then
  echo ""
  echo "❌ PREFLIGHT PROD ÉCHOUÉ — corriger les points ci-dessus avant tout déploiement."
  exit 1
fi
echo ""
echo "✅ Preflight PROD OK — déployable."
