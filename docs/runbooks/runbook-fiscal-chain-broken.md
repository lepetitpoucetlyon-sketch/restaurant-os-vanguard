# Runbook — Chaîne fiscale NF525 cassée

## Symptôme
Alerte `fiscal.chain.broken` ou `fiscal.seal.invalid` sur un tenant.
**CRITICITÉ MAXIMALE** — non-conformité fiscale potentielle.

## ⚠️ RÈGLE ABSOLUE
**Aucune auto-remédiation.** Ce runbook est TOUJOURS exécuté par un humain.

## Diagnostic

### 1. Identifier le point de cassure
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/api/admin/tenant/$TENANT_ID/fiscal-integrity"
```
Réponse attendue :
```json
{
  "chainValid": false,
  "breakpoint": "JE-2026-08-19-00142",
  "lastValidSeal": "JE-2026-08-19-00141",
  "invalidSeals": ["JE-2026-08-19-00142", "JE-2026-08-19-00143"]
}
```

### 2. Vérifier le WORM archive
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/api/admin/tenant/$TENANT_ID/worm?from=JE-2026-08-19-00140&limit=10"
```
Comparer les hashes de la réponse avec les hashes attendus.

### 3. Identifier la cause
- **Modification directe en base** (hors application) → intrusion ou erreur manuelle
- **Bug de scellement** → identifier le commit fautif
- **Restauration partielle** → backup a écrasé des sceaux

## Actions immédiates

### Étape 1 — Isoler le tenant IMMÉDIATEMENT
```bash
curl -XPOST -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE_URL/api/admin/tenant/$TENANT_ID/lock"
```

### Étape 2 — Geler la facturation
Stripe Dashboard → client → pause subscription.

### Étape 3 — Forensics
1. Exporter les journal entries du tenant (avant et après le breakpoint)
2. Exporter le WORM archive complet
3. Comparer avec le dernier backup valide

### Étape 4 — Décision
- **Si les données sont récupérables** : restaurer depuis le backup le plus récent AVANT la cassure, re-sceller la chaîne.
- **Si la corruption est irréversible** : signaler à l'administration fiscale (obligation légale si données altérées), documenter l'incident.

## Escalade
1. Notifier le patron IMMÉDIATEMENT (SMS + appel)
2. Ouvrir un incident formel : `mcc/incidents/FISCAL-{date}`
3. Conserver toutes les preuves (exports, logs, snapshots)
4. Si nécessaire, consulter un expert-comptable sur les obligations de déclaration
