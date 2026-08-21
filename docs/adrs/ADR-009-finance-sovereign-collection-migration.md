# ADR-009 — Migration du pilier finance vers useSovereignCollection

- **Statut** : Adopté (Phase 1 — 2026-08-21)
- **Décideur** : session Claude Code + patron
- **Contexte** : Plan Master P4.3
- **Successeur ADR** : à définir (Phase 2 sur les piliers ops, logistics, commerce)

## Contexte

Le kernel `src/kernel/hooks/useSovereignCollection.ts` (Vague 5 finalisée)
expose un hook offline-first :

1. Lectures depuis Nexus (adapters Firestore/Simulacra/Mock via `Nexus.adapter.query`)
2. Écritures optimistes locales immédiates (setData)
3. Enfilement dans `OutboxService` (Dexie persistant)
4. Réconciliation en tâche de fond (`OutboxService.drain()`)
5. Garde-fou NF525 : refuse toute collection présente dans
   `NF525_IMMUTABLE_COLLECTIONS` (journalEntries, fiscalSeals, wormArchives, …)

Avant cette ADR, **aucun pilier ne consommait ce hook** — l'usage réel restait
à valider en production. Le Plan Master listait comme bloqueur commercial :
"Migration effective d'un pilier vers useSovereignCollection (P4.3) — pour
l'instant, le hook existe mais n'est pas déployé".

## Décision

**Migrer le pilier finance en priorité**, en commençant par la collection
`expenseClaims` (notes de frais) qui coche tous les critères d'éligibilité :

| Critère | Statut |
|---|---|
| Collection mutable (workflow multi-status) | ✅ pending → approved/rejected → reimbursed |
| Hors `NF525_IMMUTABLE_COLLECTIONS` | ✅ vérifié par test |
| Cas d'usage offline pertinent | ✅ soumission terrain sans réseau (livreur, chef) |
| Volume manipulable (< 10 000 lignes/tenant) | ✅ typique < 500/mois |
| Pas de dépendance transactionnelle avec journalEntries | ✅ (le lien fiscal se fait à la clôture via un autre chemin) |

### Implémentation

**Nouveau hook adapter** : `useSovereignExpenseClaims`
(`src/modules/finance/hooks/useSovereignExpenseClaims.ts`)

- Wrappe `useSovereignCollection<ExpenseClaim>('expenseClaims', { tenantId })`
- Expose une API métier propre : `submit / approve / reject / reimburse / remove`
- Génère l'ID `exp_<timestamp>_<random>`, stamp `submittedAt`, `processedAt`
- Filtre optionnel `statusFilter` (all/pending/approved/rejected/reimbursed)

**Nouveau composant** : `ExpenseClaimsList`
(`src/modules/finance/components/accounting/ExpenseClaimsList.tsx`)

- 1er composant du pilier finance à consommer la stack souveraine
- Optimistic UI, indicateur de synchro (`isSyncing`)
- Actions inline (approve / reject / reimburse / delete) selon le statut

**Tests** : 8 tests bloquants dans
`src/__tests__/finance/useSovereignExpenseClaims.test.ts` — cycle de vie
complet, filtrage, isolation multi-tenant, non-régression NF525.

### Ne PAS migrer (pilier finance)

Ces collections restent sur leur pipeline actuel (atoms Jotai + hooks legacy) :

| Collection | Raison |
|---|---|
| `journalEntries` | IMMUABLE NF525 — passe par `FinancialNexusBridge.processOrder()` |
| `fiscalSeals` | IMMUABLE NF525 — chaîne SHA-256 via `FiscalEngine.sealEntry()` |
| `fiscalLedger` | IMMUABLE NF525 — WORM, jamais update/delete |
| `wormArchives` | IMMUABLE NF525 |
| `bankTransactions` | Import-only (Pennylane/CSV), muté par ReconciliationEngineHandler côté serveur |
| `accounts` | Plan comptable rarement muté côté UI (setup admin) — pas prioritaire |

## Conséquences

### Positives
- Le pilier finance est le **premier de la flotte** à valider la stack souveraine
  end-to-end : cache Dexie, Outbox atomique, réconciliation cloud.
- Modèle réutilisable : les prochains piliers (ops, logistics) peuvent copier
  le pattern (adapter métier + composant liste + test 8+).
- Résilience terrain : soumettre une note de frais sans réseau fonctionne,
  la synchro reprend dès reconnexion.
- 0 impact sur les collections NF525 — la barrière kernel refuse tout usage
  incorrect.

### Négatives / Points d'attention
- Le filtre `statusFilter` du hook est appliqué **au chargement uniquement**,
  pas sur les updates optimistes. Cas d'usage : les vues filtrées peuvent
  contenir temporairement des items qui viennent de changer de statut ;
  le prochain refresh ou remount cleane. Documenté dans le test 8.
- La migration progressive coexiste avec `useAccounting` (atoms + `useNexusMutation`).
  Les composants existants ne sont **pas migrés** (rupture évitée). Nouvelle
  règle : tout nouveau code sur une collection mutable finance passe par un
  adapter `useSovereign<X>`.

### Plan de suite (Phase 2+)

| Phase | Pilier | Collections cibles | Effort estimé |
|---|---|---|---|
| 2 | ops | `orders` (KDS), `tables`, `reservations` | 1-2 j |
| 3 | logistics | `stocks`, `receipts`, `supplierInvoices` | 1-2 j |
| 4 | commerce | `customers`, `quotes`, `loyaltyRewards` | 1 j |
| 5 | facility | `floorPlanElements`, `maintenanceLogs` | 0,5 j |

Chaque phase = 1 ADR successeur, 1 adapter par collection, 1 composant preuve,
suite de tests > 5.

## Enforcement

Aucun nouveau garde CI à ajouter — la barrière `NF525_IMMUTABLE_COLLECTIONS`
du kernel refuse déjà toute tentative de manipulation frauduleuse. Les tests
`src/__tests__/kernel/useSovereignCollection.test.ts` (déjà verts) couvrent
la garde côté hook.

## Références

- Kernel : [useSovereignCollection.ts](../../src/kernel/hooks/useSovereignCollection.ts)
- Adapter : [useSovereignExpenseClaims.ts](../../src/modules/finance/hooks/useSovereignExpenseClaims.ts)
- Composant : [ExpenseClaimsList.tsx](../../src/modules/finance/components/accounting/ExpenseClaimsList.tsx)
- Tests : [useSovereignExpenseClaims.test.ts](../../src/__tests__/finance/useSovereignExpenseClaims.test.ts)
- Plan Master : [PLAN_MEGA_100_CLIENTS.md § P4](../plans/PLAN_MEGA_100_CLIENTS.md)
