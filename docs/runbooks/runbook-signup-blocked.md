# Runbook — Signup bloqué

## Symptôme
Un prospect signale qu'il ne peut pas créer son compte, ou le funnel PostHog montre un drop à l'étape checkout.

## Diagnostic

### 1. Vérifier les logs signup
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/api/admin/logs?source=signup&last=1h"
```

### 2. Vérifier Stripe
- Dashboard Stripe → Checkout Sessions → filtrer par email du prospect
- Vérifier que le `priceId` est valide (test vs live)
- Vérifier le webhook `checkout.session.completed` dans Stripe Dashboard → Webhooks

### 3. Vérifier le rate limiter
Si l'erreur est `429 Trop de tentatives` → le prospect a fait > 3 tentatives en 1h.
Attendre ou reset manuellement le rate limiter.

### 4. Vérifier Firebase Auth
- Console Firebase → Authentication → chercher l'email
- Si user existe déjà → le prospect a déjà un compte (mot de passe oublié ?)

## Remédiation

### Cas 1 — Checkout Stripe échoué
Le tenant n'existe pas encore. Le prospect peut re-essayer.
Vérifier que les prix Stripe (`STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`) sont corrects dans les variables d'environnement.

### Cas 2 — Provisioning échoué (user créé mais tenant non)
```bash
# Vérifier s'il y a un user Firebase orphelin
# Si oui, le supprimer pour permettre un nouveau signup
curl -XDELETE -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/api/admin/auth/user?email=$EMAIL"
```

### Cas 3 — Webhook Stripe non reçu
Vérifier l'URL du webhook dans Stripe Dashboard.
Relancer manuellement l'event depuis Stripe Dashboard → Webhooks → Resend.

## Escalade
Si le prospect est bloqué > 24h → contact direct par email, provisionner manuellement via le MCC.
