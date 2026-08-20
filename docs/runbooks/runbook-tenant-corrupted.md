# Runbook — Tenant corrompu

## Symptôme
Un tenant signale que ses commandes ne se chargent plus, ou que le dashboard affiche des erreurs.

## Diagnostic

### 1. Vérifier la santé du tenant
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/api/admin/fleet/universal-health"
```
Chercher le tenant dans la réponse JSON → vérifier `healthScore` et `breakdown`.

### 2. Vérifier la DLQ
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/api/admin/mcc/dlq?tenant=$TENANT_ID"
```
Si > 50 events pending → voir `runbook-dlq-flooded.md`.

### 3. Vérifier l'âge du dernier backup
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/api/admin/fleet/backup?tenant=$TENANT_ID"
```

## Remédiation

### Étape 1 — Isoler le tenant
```bash
curl -XPOST -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/api/admin/tenant/$TENANT_ID/lock"
```
→ Met le tenant en maintenance mode (users voient un écran "Maintenance en cours").

### Étape 2 — Restaurer depuis backup
```bash
curl -XPOST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "$TENANT_ID", "snapshotId": "latest"}' \
  "$BASE_URL/api/admin/fleet/restore"
```

### Étape 3 — Vérifier la chaîne fiscale
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/api/admin/tenant/$TENANT_ID/fiscal-integrity"
```
Si `chainValid: false` → **NE PAS DÉBLOQUER** le tenant. Escalader immédiatement.

### Étape 4 — Débloquer
```bash
curl -XPOST -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/api/admin/tenant/$TENANT_ID/unlock"
```

## Escalade
Si le restore échoue ou si la chaîne fiscale est cassée :
1. Notifier le patron sur Slack #ops-critical
2. Geler la facturation du tenant
3. Ouvrir un incident formel dans le registre MCC
