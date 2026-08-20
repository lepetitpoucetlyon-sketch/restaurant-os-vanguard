# Runbook — Échec de paiement abonnement (Billing / Dunning)

## Symptôme
Alerte `billing.payment.failed` ou webhook Stripe `invoice.payment_failed` reçu.
Un client actif voit son prélèvement mensuel échouer.

## Diagnostic

### 1. Identifier le tenant et l'état de facturation
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/api/admin/billing/status?tenant=$TENANT_ID"
```
Vérifier :
- `stripeCustomerId`
- `subscriptionStatus` (`past_due`, `unpaid`, `canceled`)
- `attemptCount` (nombre de tentatives de prélèvement)
- `lastPaymentError` (code erreur Stripe : `insufficient_funds`, `expired_card`, etc.)

### 2. Vérifier l'accès au service du client
Vérifier si le client est en période de grâce (dunning standard : 7 jours avant suspension).

## Remédiation

### Cas 1 — Première tentative échouée (Jour 0 à 3)
- Stripe réessaie automatiquement selon la politique Smart Retries.
- Un email d'information doux est envoyé au client avec le lien vers le portail de facturation :
```bash
curl -XPOST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "send_dunning_reminder", "tenantId": "$TENANT_ID", "level": 1}' \
  "$BASE_URL/api/admin/billing/dunning"
```

### Cas 2 — Échec persistant (Jour 7 — Fin de période de grâce)
1. Envoyer une notification in-app d'urgence sur le dashboard du restaurant.
2. Proposer la mise à jour immédiate du moyen de paiement.
3. Si le gérant est joignable, l'appeler pour éviter la suspension du service de caisse.

### Cas 3 — Non-paiement prolongé (Jour 14)
- **Attention** : En conformité NF525, les données fiscales et les archives WORM **ne doivent jamais être supprimées**.
- Passer le tenant en mode lecture seule (`READ_ONLY`) pour permettre la consultation fiscale tout en bloquant l'émission de nouveaux tickets de caisse :
```bash
curl -XPOST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "READ_ONLY", "reason": "UNPAID_SUBSCRIPTION"}' \
  "$BASE_URL/api/admin/tenant/$TENANT_ID/access-mode"
```

## Rétablissement
Dès que la facture est payée (webhook `invoice.paid`) :
1. Le statut repasse automatiquement en `ACTIVE`.
2. Le mode lecture seule est levé instantanément.

## Escalade
Si le client conteste ou si le compte bancaire est clôturé :
- Contacter le support commercial.
- Ne jamais effacer les collections de base du tenant.
