# Runbook — DLQ saturée (Dead Letter Queue)

## Symptôme
Alerte `dlq.pending > 50 events` — des événements ne sont pas traités et s'accumulent.

## Diagnostic

### 1. Vérifier le volume et la nature des events
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/api/admin/mcc/dlq?limit=100"
```
Identifier :
- Le **tenant** le plus affecté
- Le **type d'event** dominant (sync, webhook, email, etc.)
- L'**erreur** associée (timeout, 429, schema mismatch, etc.)

### 2. Vérifier si c'est un problème réseau transitoire
Si les events sont tous du même tenant et tous avec erreur `ECONNREFUSED` ou `503` → problème transitoire.
Attendre 10 min et re-vérifier.

## Remédiation

### Cas 1 — Erreur transitoire (réseau, timeout)
```bash
# Retry avec backoff exponentiel
curl -XPOST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "retry", "tenantId": "$TENANT_ID", "maxRetries": 5}' \
  "$BASE_URL/api/admin/mcc/dlq/process"
```

### Cas 2 — Schema mismatch ou event corrompu
```bash
# Quarantiner les events invalides
curl -XPOST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "quarantine", "tenantId": "$TENANT_ID", "eventType": "sync.order"}' \
  "$BASE_URL/api/admin/mcc/dlq/process"
```
→ Les events quarantinés sont archivés dans `_dlq_quarantine/` pour analyse manuelle.

### Cas 3 — Flood d'un webhook tiers
Identifier le webhook source et le désactiver temporairement dans les intégrations du tenant.

## Post-mortem
1. Analyser les events quarantinés pour identifier le pattern
2. Corriger le schema ou le handler
3. Re-jouer les events quarantinés si pertinent

## Escalade
Si > 500 events ou si la DLQ grossit malgré les retries → notifier le patron.
