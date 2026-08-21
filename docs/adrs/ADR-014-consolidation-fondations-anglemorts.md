# ADR-014 — Consolidation des 4 fondations préparatoires aux angles morts

- **Statut** : Adopté (2026-08-21)
- **Contexte** : Prérequis avant d'attaquer les Top 15 de `docs/anglemort-restaurant-mcc.md`

## Contexte

L'audit d'angles morts (`docs/anglemort-restaurant-mcc.md`, 159 items) a identifié
que plusieurs items critiques ne peuvent pas être implémentés proprement sans
consolider d'abord 4 briques d'infrastructure qui existaient partiellement :

1. `CrossScopeAuthority` — storage volatile en mémoire, perdu au reboot
2. `OutboxService` — 2 tiers de priorité seulement (fiscal / normal)
3. `AuditLogger` — 7 types d'actions, pas de hash chain, pas d'export forensique
4. `DLQ` — retry unitaire seulement, pas de batch replay, pas d'export

Sans ces fondations, chaque item bloquant serait implémenté avec un shortcut
qui violerait un invariant architectural.

## Décisions

### Chantier 1 — CrossScopeAuthority persistant

- **Storage Nexus** : `mcc/crossScopeTokens/{tokenId}` — survit au reboot
- **Audit trail persistant** : `mcc/crossScopeAudit/{grant|reveal|revoke}_{id}`
- **Helper `revealScope(tokenId, callerModule)`** : vérifie ET révèle la liste
  des `targetScopes` autorisés (whitelist stricte)
- **Cache mémoire 5 min TTL** avec fallback Nexus si miss
- **API async** : `grant() / verify() / revealScope() / revoke()` — Promise

Débloque : L60 (RappelConso fanout), L83 (VIP palace link), L82 (rétro-commission), StrategyOracle cross-tenant.

### Chantier 2 — OutboxService tiers P2/P3

- **Constantes** : `OutboxPriority.NORMAL(0) / FISCAL(1) / SANITAIRE(2) / LEGAL(3)`
- **`resolvePriority(collection)`** : mapping automatique
  - LEGAL : `legal`, `dgfip`, `urssaf`, `inspection`, `personnelInstantane`
  - SANITAIRE : `haccp`, `chilling`, `refroidiss`, `recall`, `rappelconso`, `tiac`, `biohazard`
  - FISCAL : `fiscal`, `journal`, `seal`, `ticketz`, `grandtotal`, `fec`
- **Alertes `OpsAlertGateway`** différenciées par tier

Débloque : L58 (refroidissement HACCP), L60/L61 (RappelConso/biodéchets), L67, L25, L26.

### Chantier 3 — AuditLogger hash chain SHA-256

- **30+ AuditAction types étendus** (fiscal, sanitaire, RBAC, provisioning, RGPD, IA)
- **Hash chain SHA-256** : `previousHash` + `hash` calculé sur toutes propriétés canoniques
- **Storage tête chaîne** : `mcc/audit_chain/head`
- **`verifyChain(logs)`** : détecte falsifications
- **`exportChain(fromTs, toTs)`** : bundle forensique opposable en audit externe

Débloque : L6, L25, L51 (DAG immuable), L55 (anomalie hash), MCC-E4.

### Chantier 4 — DLQ batch replay + export forensique

- **`POST /api/admin/dlq/replay-batch`** : rejoue tous les events d'un handler
  après fix root cause (options `dryRun`, `transformPayload`, `statusFilter`, `limit`)
- **`GET /api/admin/dlq/export`** : dump JSON signé (`Content-Disposition: attachment`)
- **Audit trail** systématique via `AuditLogger`
- **RBAC** : `mcc_support` (batch) / `mcc_super_admin` (export)

Débloque : L52 (poubelles fix), L46 (blackout mesh), investigation post-incident.

## Conséquences

### Positives
- **Socle robuste** pour attaquer les Top 15 sans shortcut
- **26 nouveaux tests** verts (12 + 7 + 7)
- **0 erreur TypeScript**
- Audit forensique désormais **opposable en justice**

### Négatives
- `CrossScopeAuthority` API sync → async (aucun caller réel impacté)
- Hash chain = 2 writes Nexus par log (impact minimal)
- Export DLQ potentiellement lourd — TTL rétention à définir

## Livrables

| Fichier | Type |
|---|---|
| `src/kernel/ai/core/CrossScopeAuthority.ts` | Refonte complète |
| `src/__tests__/kernel/ai/CrossScopeAuthority.test.ts` | Réécrit (12 tests) |
| `src/lib/offline/OutboxService.ts` | Ajout `OutboxPriority` + `resolvePriority()` |
| `src/__tests__/infrastructure/OutboxPriority.test.ts` | Nouveau (7 tests) |
| `src/modules/compliance/securite/AuditLogger.ts` | Refonte (hash chain) |
| `src/__tests__/compliance/AuditLoggerHashChain.test.ts` | Nouveau (7 tests) |
| `src/app/api/admin/dlq/replay-batch/route.ts` | Nouveau |
| `src/app/api/admin/dlq/export/route.ts` | Nouveau |
| `docs/adrs/ADR-014-consolidation-fondations-anglemorts.md` | Cette ADR |

## Prochaine étape

Les Top 15 peuvent maintenant être attaqués sans dette architecturale :
- L58, L60, L61, L25, L11, MCC-E2 → utilisent tous ces 4 briques.
