# Plan de remédiation — Audit commits 2026-08-09 12h → 2026-08-10

> **Branche** : `fix/coherence-ui-backend-securite`
> **Rédigé le** : 2026-08-10 · session `audit-5-commits`
> **Basé sur** : 5 commits (271 fichiers, +8 476 / −3 098 lignes)
>
> Ce document est **autonome** : chaque item contient le diagnostic, la preuve,
> la correction exacte, et les tests de validation. À lire dans l'ordre des
> priorités (P0 → P3).

---

## Tableau de bord

| ID | Priorité | Domaine | Impact | Statut |
|---|---|---|---|---|
| [R-01](#r-01) | **P0** | Sécurité / Auth | Toute Server Action exploitable sans auth | ✅ à faire |
| [R-02](#r-02) | **P0** | Données | 9/13 actions → perte silencieuse | ✅ à faire |
| [R-03](#r-03) | **P0** | EventBus / Sécu | Garde tenantId plante au runtime | ✅ à faire |
| [R-04](#r-04) | **P0** | HACCP / NF525 | 2 handlers débranchés | ✅ à faire |
| [R-05](#r-05) | **P1** | TypeScript | 12 erreurs TSC (3 crash-tests) | ✅ à faire |
| [R-06](#r-06) | **P1** | Tests | 1 test rouge PrepaieBuilder | ✅ à faire |
| [R-07](#r-07) | **P1** | Architecture | 36 violations Barrel Rule | ✅ à faire |
| [R-08](#r-08) | **P2** | Crash-tests | Scripts non câblés / non compilants | ✅ à faire |
| [R-09](#r-09) | **P2** | MacroBrain | Orchestrateur inaccessible | ✅ à faire |
| [R-10](#r-10) | **P3** | Hardening RBAC | `requireFleetAdmin` importé jamais appelé | ✅ à faire |

---

## P0 — Bloquants prod immédiats

### R-01

**`verifySession()` est un no-op : les 13 Server Actions sont non-authentifiées**

#### Diagnostic

`verifySession()` ([src/lib/server/verifySession.ts](src/lib/server/verifySession.ts)) lit
`authorization: Bearer <token>` depuis les en-têtes HTTP. Les Server Actions Next.js
sont invoquées via POST same-origin sur cookie de session — **cet en-tête n'est jamais
présent**. La fonction retourne `null` sans lever. Les 54 appels `await verifySession(tenantId)`
ignorent la valeur de retour (`return_checked = 0` sur les 13 fichiers).

Le `tenantId` est fourni **par le client** comme paramètre d'action — il n'est jamais
confronté au token JWT du caller → BOLA/IDOR complet sur toutes les actions.

```
┌─ Client ──────────────────────────────────────────────────┐
│  deleteFloorNodeAction("tenant_victime", "table-42")       │
│    → POST /__nextjs/actions/xxxx                          │
│    → verifySession("tenant_victime")  → null (no-op)      │
│    → emitDurable('floor.node.deleted', ...)               │
│    → { success: true }   ← aucun contrôle                 │
└────────────────────────────────────────────────────────────┘
```

Actions affectées :

| Fichier | Fonctions exposées |
|---|---|
| `src/modules/ops/service/pos/actions/floor.action.ts` | `updateFloorNodeAction`, `createFloorNodeAction`, `deleteFloorNodeAction`, `updateFloorZoneAction`, `createFloorZoneAction`, `deleteFloorZoneAction` |
| `src/modules/ops/service/pos/actions/kitchen.action.ts` | `updateKitchenOrderAction`, `updateKitchenRecipeAction`, `markKitchenOrderReadyAction`, `togglePrepTaskAction`, `updateKitchenTableStatusAction`, `completePrepTaskAction` _(×3 actions)_ |
| `src/modules/ops/service/pos/actions/commerce.action.ts` | `markReservationArrivedAction`, `updateCampaignAction`, `createCampaignAction`, `updateCrmCustomerAction`, `createCrmCustomerAction` |
| `src/modules/ops/service/pos/actions/void.action.ts` | `processVoidOrRefundAction` _(NF525 — le plus critique)_ |
| `src/modules/ops/service/pos/actions/cashdrawer.action.ts` | `openCashDrawerAction`, `closeCashDrawerAction`, `recordCashMovementAction` |
| `src/modules/commerce/actions/marketing.action.ts` | `createPromoCodeAction`, `updatePromoCodeAction`, `activateLoyaltyCardAction`, `issueLoyaltyCardAction`, `toggleBookingAction` |
| `src/modules/commerce/relation/reservations/actions/eventQuote.action.ts` | `saveEventQuoteDraftAction`, `updateEventQuoteAction` |
| `src/modules/compliance/qualite/haccp/actions/haccp.action.ts` | `saveCleaningRecordAction`, `logCoolingCycleAction`, `resolveHaccpAlertAction` |
| `src/modules/compliance/qualite/haccp/actions/nonConformity.action.ts` | `createNonConformityAction`, `resolveNonConformityAction`, `deleteNonConformityAction` |
| `src/modules/finance/actions/finance.action.ts` | `dispatchPaymentAction`, `validateFinanceEntryAction` |
| `src/modules/human/effectifs/hr/actions/timeclock.action.ts` | `processTimeclockAction`, `forceClockOutAction` |
| `src/modules/logistics/stock/inventory/actions/inventory.action.ts` | `adjustStockAction`, `receiveDeliveryAction`, `createDeliveryAction`, `updateStockLevelAction` |
| `src/shared/actions/settings.action.ts` | `updateTenantSettingsAction`, `updateProductAction` |

#### Correction

**Option A — Couche `requireAuthenticatedAction()` (recommandée)**

Créer un helper `src/lib/server/requireAuthenticatedAction.ts` qui utilise
`cookies()` de Next.js (disponible en Server Action) pour lire la session Firebase
ou le cookie de session, et lève une erreur si absent ou si le `tenantId` du
token ne correspond pas au `tenantId` du paramètre.

```ts
// src/lib/server/requireAuthenticatedAction.ts
"use server";
import { cookies } from 'next/headers';
import { getServerAuthProvider } from '@/lib/auth/ServerAuthProvider';
import type { DecodedAuthToken } from '@/lib/auth/ServerAuthProvider';
import { FLEET_ROLES } from '@/lib/server/adminAuthGuard';

export async function requireAuthenticatedAction(
    tenantId: string,
    minRole?: string,
): Promise<DecodedAuthToken> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (!sessionCookie) {
        throw new Error('Non authentifié');
    }

    const provider = getServerAuthProvider();
    let decoded: DecodedAuthToken;
    try {
        decoded = await provider.verifyIdToken(sessionCookie);
    } catch {
        throw new Error('Session invalide ou expirée');
    }

    // Isolation tenant : un utilisateur ne peut agir que sur son tenant
    // sauf les Fleet Admins qui ont accès cross-tenant.
    const isFleet = (FLEET_ROLES as readonly string[]).includes(decoded.role ?? '');
    if (!isFleet && decoded.tenantId !== tenantId) {
        throw new Error(`Accès interdit au tenant ${tenantId}`);
    }

    return decoded;
}
```

Puis remplacer **dans chaque action** :
```ts
// AVANT (no-op)
await verifySession(tenantId);

// APRÈS (contrôle réel)
const caller = await requireAuthenticatedAction(tenantId);
// caller.uid, caller.tenantId, caller.role sont maintenant vérifiés
```

**Option B — Retour au pattern `requireTenantUser` (pour les actions qui passent `Request`)**

Pour les actions appelées depuis une API Route Handler (non Client Component),
utiliser directement `requireTenantUser(req)` de `src/lib/server/adminAuthGuard.ts`
qui lève une `NextResponse 401` si non-authentifié.

#### Fichiers à modifier

- `src/lib/server/verifySession.ts` — ajouter le support cookie et `throw` si null
- OU créer `src/lib/server/requireAuthenticatedAction.ts` (nouvelle fonction)
- Les 13 fichiers `*.action.ts` — remplacer `await verifySession(tenantId)` par
  `const caller = await requireAuthenticatedAction(tenantId)`

#### Tests de validation

```ts
// test : appel sans cookie → throw
// test : appel avec cookie tenant B sur action tenant A → throw
// test : appel avec cookie Fleet Admin → ok cross-tenant
// test : appel avec cookie tenant correct → retourne DecodedAuthToken
```

---

### R-02

**9 Server Actions sur 13 n'écrivent rien — perte de données silencieuse**

#### Diagnostic

Le pattern CQRS introduit émet un événement `emitDurable()` en pensant qu'un handler
va persister la donnée. Or aucun handler n'est enregistré pour ces événements.
Le code retourne `{ success: true }` alors que rien n'a été écrit.

```
API Layer (floorHooks.tsx)
  → updateFloorNodeAction(tenantId, id, { x, y })
    → verifySession()  [no-op]
    → NexusEventBus.emitDurable('floor.node.updated', ...)
       → 0 handler → drop
    → { success: true }   ← MENSONGE
```

Avant la refonte (commit `835459e5f`), le hook persistait directement :
```ts
await Nexus.adapter.update(`tenants/${tenantId}/nodes/${id}`, { x, y, updatedAt: ... });
```

**Répartition par action :**

| Action | Nexus write | Événements sans handler |
|---|---|---|
| `floor.action.ts` | 0 | `floor.node.updated/created/deleted`, `floor.zone.updated/created/deleted` |
| `kitchen.action.ts` | 0 | `kitchen.order.updated/created`, `kitchen.recipe.updated`, `kitchen.preptask.toggled`, `ops.prepTask.completed` |
| `commerce.action.ts` | 0 | `commerce.reservation.arrived`, `commerce.campaign.updated/created`, `crm.customer.updated/created` |
| `marketing.action.ts` | 0 | `marketing.promocode.created/updated`, `marketing.loyaltycard.issued/updated`, `marketing.booking.toggled` |
| `settings.action.ts` | 0 | `system.settings.updated` (×2) |
| `eventQuote.action.ts` | 0 | `eventQuote.draft.saved` |
| `haccp.action.ts` | 0 | `haccp.cleaning.completed`, `haccp.cooling_cycle_logged` |
| `nonConformity.action.ts` | 0 | `haccp.nonconformity.saved/resolved` |
| `finance.action.ts` | 0 | `finance.payment_dispatched` |

Les 4 actions correctes (`cashdrawer`, `void`, `timeclock`, `inventory`) écrivent
directement via `Nexus.adapter.batch().set()` — le pattern à reproduire.

#### Correction

**Option A — Écriture directe dans l'action (conforme au pattern existant)**

C'est la voie **la plus sûre et la plus rapide**. Chaque action écrit via
`Nexus.adapter` puis émet l'événement pour les side-effects (KDS, notifications).

Exemple pour `floor.action.ts` :

```ts
// src/modules/ops/service/pos/actions/floor.action.ts
export async function updateFloorNodeAction(
    tenantId: string,
    id: string,
    data: Partial<SovereignNode>
) {
    const caller = await requireAuthenticatedAction(tenantId); // R-01
    try {
        const batch = Nexus.adapter.batch();
        batch.set(`tenants/${tenantId}/nodes/${id}`, {
            ...data,
            updatedAt: new Date().toISOString(),
        });
        await batch.commit();

        // Side-effect async (KDS, sync realtime) — failure non-bloquante
        NexusEventBus.emitDurable('floor.node.updated', {
            tenantId,
            id,
            data,
        }).catch(err => logger.warn('[floor] Event emit failed', { err }));

        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}
```

**Option B — Créer les handlers manquants (CQRS pur)**

Si on veut garder le pattern event-sourcing : créer un handler pour chaque
événement orphelin qui écrit dans Nexus.

Exemple pour `FloorNodePersistenceHandler` :

```ts
NexusEventBus.on('floor.node.updated', async (payload) => {
    const { tenantId, id, data } = payload;
    const batch = Nexus.adapter.batch();
    batch.set(`tenants/${tenantId}/nodes/${id}`, { ...data, updatedAt: new Date().toISOString() });
    await batch.commit();
}, { id: 'floor-node-persistence', priority: 'CRITICAL' });
```

**Recommandation : Option A** — elle est alignée sur les 4 actions déjà correctes,
ne crée pas de handlers supplémentaires à maintenir, et la latence est synchrone
(feedback immédiat à l'UI).

#### Fichiers UI à vérifier post-correction

Ces fichiers affichent `toast.success` sur `res.success` — ils marcheront sans
modification une fois les actions fixées :
- `src/modules/ops/providers/hooks/floorHooks.tsx`
- `src/shared/components/settings/AnalyticsSettings.tsx`
- `src/shared/components/settings/ReviewsSettings.tsx`
- `src/shared/components/settings/ReservationWidgetSettings.tsx`
- `src/app/(client)/(ops)/menu-builder/page.tsx`

**Anomalie à corriger dans `menu-builder/page.tsx:90`** :
```ts
// AVANT (tenant hardcodé — anti-pattern multi-tenant)
await updateProductAction(editingProduct.tenantId || 'default', editingProduct.id, ...)

// APRÈS
const { slug } = useTenant();
await updateProductAction(slug, editingProduct.id, ...)
```

#### Tests de validation

Pour chaque action fixée :
```ts
it('persiste réellement la donnée', async () => {
    await updateFloorNodeAction('tenant-test', 'table-01', { x: 10, y: 20 });
    const row = await Nexus.adapter.get(`tenants/tenant-test/nodes/table-01`);
    expect(row.x).toBe(10);
});
```

---

### R-03

**`NexusErrorCode.VALIDATION_ERROR` inexistant → garde EventBus cassée au runtime**

#### Diagnostic

`src/shared/eventBus/NexusEventBus.ts:70` :
```ts
throw new NexusError(
    NexusErrorCode.VALIDATION_ERROR,   // ← n'existe pas dans l'enum
    `[EventBus] SECURITY BREACH...`
);
```

`NexusErrorCode` (`src/shared/nexus/errors.ts`) ne contient que :
`ACCESS_DENIED | NF525_VIOLATION | INFRASTRUCTURE_ERROR | HYDRATION_FAILURE | BATCH_ACCESS_DENIED`

**Conséquence** : `NexusErrorCode.VALIDATION_ERROR` vaut `undefined` à l'exécution.
`new NexusError(undefined, '...')` appelle `super('[undefined] ...')`, le champ
`this.code` vaut `undefined`. Tout `catch` qui route sur `err.code ===
NexusErrorCode.VALIDATION_ERROR` ne matche jamais → les BREA SECURITY messages
passent silencieusement dans certains contextes.

La `tsc` le confirme :
```
src/shared/eventBus/NexusEventBus.ts(70,24): error TS2339:
Property 'VALIDATION_ERROR' does not exist on type 'typeof NexusErrorCode'.
```

**Risque connexe — émissions sans `tenantId`** : `enforceTierPolicies()` lance
désormais sur tout payload sans `tenantId`. Avant ce commit il n'y avait aucun
garde. **403 sites d'émission** ont été écrits sans `tenantId` explicite (imports
d'adapters verticaux, panels MCC). Exemple :

```ts
// src/app/(admin)/admin/mcc/components/EventBusHealthPanel.tsx:45
await NexusEventBus.emit(entry.eventName, migratedPayload, { skipDLQWrite: true });
// → si migratedPayload.tenantId est absent → THROW → le panel DLQ crashe
```

#### Correction

**Étape 1 — Ajouter `VALIDATION_ERROR` à l'enum** :

```ts
// src/shared/nexus/errors.ts
export enum NexusErrorCode {
    ACCESS_DENIED = 'ACCESS_DENIED',
    NF525_VIOLATION = 'NF525_VIOLATION',
    INFRASTRUCTURE_ERROR = 'INFRASTRUCTURE_ERROR',
    HYDRATION_FAILURE = 'HYDRATION_FAILURE',
    BATCH_ACCESS_DENIED = 'BATCH_ACCESS_DENIED',
    VALIDATION_ERROR = 'VALIDATION_ERROR',   // ← ajouter
}
```

**Étape 2 — Inventaire des émissions sans `tenantId`** avant d'activer le garde en prod.
Commande de détection :

```bash
grep -rn "NexusEventBus\.\(emit\|emitDurable\)(" src \
  --include="*.ts" --include="*.tsx" \
  | grep -v "tenantId" \
  | grep -v "events/(common|ops|finance)\.events\.ts"
```

Les adapteurs verticaux utilisent `{ v: 1 as const, ...payload }` — si `payload`
contient `tenantId` c'est ok. Sinon à corriger avant activation.

**Étape 3 — EventBusHealthPanel** : s'assurer que `migratedPayload` contient `tenantId`
ou passer `skipTenantCheck: true` sur le rejeu DLQ (à ajouter en option de `emit`).

---

### R-04

**`HaccpCorrectiveActionHandler` et `ProformaHandler` débranchés sans raison**

#### Diagnostic

Commit `835459e5f`, diff `registerHandlers/compliance.ts` et `registerHandlers/ops.ts` :

```diff
-import { registerHaccpCorrectiveActionHandler } from '../handlers/HaccpCorrectiveActionHandler';
-    registerHaccpCorrectiveActionHandler(),
```

```diff
-import { registerProformaHandler } from '../handlers/ProformaHandler';
-    registerProformaHandler(),
```

Les fichiers handler existent toujours (`src/shared/eventBus/handlers/`), ils ne
sont plus appelés nulle part sauf dans des tests unitaires.

**Impact métier** :
- `haccp.nonconform` → plus d'action corrective automatique, plus d'alerte chef/manager
- `pos.proforma_printed` → plus de log proforma, plus d'alerte 2h si non encaissé (NF525)

Le message de commit ne mentionne pas ces suppressions.

#### Correction

Remettre les enregistrements supprimés :

**`src/shared/eventBus/registerHandlers/compliance.ts`** :
```ts
import { registerHaccpCorrectiveActionHandler } from '../handlers/HaccpCorrectiveActionHandler';
// dans registerComplianceHandlers() :
registerHaccpCorrectiveActionHandler(),
```

**`src/shared/eventBus/registerHandlers/ops.ts`** :
```ts
import { registerProformaHandler } from '../handlers/ProformaHandler';
// dans registerOpsHandlers() :
registerProformaHandler(),
```

#### Tests de validation

```ts
// src/__tests__/bus/chain-integration.test.ts — déjà présent pour HACCP
// Vérifier que ce test passe sans importer le handler manuellement
it('P0-1.12: haccp.nonconform triggers HaccpCorrectiveActionHandler', ...)
```

---

## P1 — Sérieux (cette semaine)

### R-05

**12 erreurs TypeScript dans 4 fichiers**

Les 12 erreurs `tsc` introduites par les commits (le message `835459e5f` annonce 0).

#### Fichier 1 : `src/scripts/crash-test/audit_hr_payroll.ts`

```
audit_hr_payroll.ts(34,24): error TS2339: Property 'confidence' does not exist on type 'AgentAction[]'.
audit_hr_payroll.ts(34,55): error TS2339: Property 'reason' does not exist on type 'AgentAction[]'.
audit_hr_payroll.ts(35,102): error TS2339: Property 'reason' does not exist on type 'AgentAction[]'.
audit_hr_payroll.ts(36,32): error TS2339: Property 'isApproved' does not exist on type 'AgentAction[]'.
audit_hr_payroll.ts(37,84): error TS2339: Property 'reason' does not exist on type 'AgentAction[]'.
```

**Cause** : Le script accède à des propriétés sur un tableau `AgentAction[]`
au lieu d'accéder à `AgentAction[].[0]`.

**Correction** : Accéder au premier élément ou typer correctement :
```ts
const action = (actions as unknown as { confidence: number; reason: string; isApproved: boolean }[])[0];
```
Ou mieux, aligner le type `AgentAction` pour inclure ces champs.

#### Fichier 2 : `src/scripts/crash-test/audit_mcc_fleet.ts`

```
audit_mcc_fleet.ts(13,22): error TS2345: '"system.alert"' non assignable à NexusEventName
audit_mcc_fleet.ts(14,21): error TS2339: Property 'message' does not exist ...
audit_mcc_fleet.ts(27,32): même erreur
```

**Cause** : L'événement `'system.alert'` n'existe pas dans le catalogue. L'événement
existant probable est `'mcc.fleet_alert'` ou similaire.

**Correction** : Remplacer `'system.alert'` par l'événement correct du catalogue,
ou ajouter `'system.alert': { tenantId: string; message: string }` dans
`src/shared/eventBus/events/common.events.ts`.

#### Fichier 3 : `src/scripts/crash-test/audit_rag_security.ts`

```
audit_rag_security.ts(11,21): Expected 2-3 arguments, but got 1.
audit_rag_security.ts(18,23): Property 'ingestPulse' does not exist on HermesKnowledgeManager.
audit_rag_security.ts(39,39): Property 'searchSimilar' does not exist on HermesKnowledgeManager.
```

**Cause** : Le script utilise une API de `HermesKnowledgeManager` qui a été
modifiée (méthodes renommées ou supprimées).

**Correction** : Aligner avec l'API courante — vérifier les méthodes exposées
par `src/modules/intelligence/knowledge/rag/HermesKnowledgeManager.ts` et
mettre à jour les appels dans le script.

#### Fichier 4 : `src/shared/eventBus/NexusEventBus.ts`

Couvert par [R-03](#r-03).

---

### R-06

**1 test rouge : `PayrollExportHandler` → `entriesRaw is not iterable`**

#### Diagnostic

```
TypeError: entriesRaw is not iterable
    at Object.build (PrepaieBuilder.ts:70:25)
    at PayrollExportHandler.ts:38:25
```

`PrepaieBuilder.ts:70` fait un `for (const e of entriesRaw)` où `entriesRaw`
est le résultat d'un `Promise.all([...])` qui retourne un tableau. La valeur
reçue n'est pas itérable → le mock Nexus dans le test retourne `undefined` ou
un objet non-tableau pour la query `shiftEntries`.

**Contexte** : `PrepaieBuilder.build()` exécute :
```ts
const [usersRaw, entriesRaw, leaveRequests] = await Promise.all([
    Nexus.adapter.query<Employee>(...),
    Nexus.adapter.query<ShiftEntry>(...),  // ← retourne undefined dans le test
    Nexus.adapter.query<LeaveRequest>(...),
]);
for (const e of entriesRaw) { ... }  // crash
```

#### Correction

Dans le test, s'assurer que le mock retourne `[]` (tableau vide) et non `undefined`
pour chaque `query` :

```ts
// Dans le beforeEach du test concerné
vi.spyOn(Nexus.adapter, 'query').mockImplementation(async (path: string) => {
    if (path.includes('shiftEntries')) return [];      // ← explicitement []
    if (path.includes('employees')) return mockEmployees;
    if (path.includes('leaveRequests')) return [];
    return [];  // fallback sûr
});
```

Alternative : ajouter un guard défensif dans `PrepaieBuilder.ts` :
```ts
const entries: ShiftEntry[] = Array.isArray(entriesRaw) ? entriesRaw : [];
```

---

### R-07

**36 violations de la Barrel Rule introduites**

#### Diagnostic

Le commit `835459e5f` importe directement des chemins internes de modules :

| Import direct (violation) | Fichiers concernés |
|---|---|
| `@/modules/finance/services/FiscalKeyService` | ×5 |
| `@/modules/finance/fiscalite/FiscalAdapter` | ×5 |
| `@/modules/ops/service/pos/components/POSModalSkeleton` | ×4 |
| `@/modules/intelligence/knowledge/rag/SovereignRAGClient` | ×3 |
| `@/modules/intelligence/knowledge/rag/HermesKnowledgeManager` | ×3 |
| `@/modules/intelligence/ia/ai/LLMManager` | ×2 |
| `@/modules/finance/fiscalite/FiscalSealer` | ×2 |
| `@/modules/finance/comptabilite/FinancialNexusBridge` | ×2 |
| autres | ×10 |

#### Correction

Vérifier que chaque symbole est exporté par le barrel du pilier :

```bash
# Détecter les violations
grep -rn "from '@/modules/[a-z]*/[a-z]" src --include="*.ts" --include="*.tsx" \
  | grep -vE "from '@/modules/[a-z]+'" | grep -v "\.test\." | wc -l
```

Pour chaque violation :
1. Vérifier que `src/modules/<pilier>/index.ts` exporte le symbole
2. Si oui → remplacer l'import direct par `@/modules/<pilier>`
3. Si non → ajouter l'export dans le barrel, puis corriger l'import

Exemple :
```ts
// AVANT (violation)
import { FiscalSealer } from '@/modules/finance/fiscalite/FiscalSealer';

// APRÈS
import { FiscalSealer } from '@/modules/finance';
```

---

## P2 — À traiter dans les 2 semaines

### R-08

**10 crash-tests non câblés et non compilants**

#### Diagnostic

`src/scripts/crash-test/` contient 10 scripts TypeScript ajoutés par les commits
`49a9c6967` et `c84616cbb`. Aucun n'est référencé dans `package.json` ni dans
les configs vitest. 3 ne compilent pas (R-05). Plusieurs auto-assertions sont
circulaires (le script lève sa propre exception puis vérifie le message qu'il vient
d'écrire — aucune mutation Nexus réelle n'est tentée).

#### Correction

**Option A — Supprimer les crash-tests s'ils ne font que dupliquer les tests Vitest**

**Option B — Les câbler comme tests Vitest** (recommandée si la valeur est réelle) :

```ts
// vitest.config.ts — ajouter l'inclusion
include: [
    'src/__tests__/**/*.test.ts',
    'src/scripts/crash-test/**/*.test.ts',  // ← ajouter
],
```

Les transformer en vrais tests Vitest :
```ts
// src/scripts/crash-test/audit_nf525.test.ts
import { describe, it, expect } from 'vitest';
import { SovereignGuard } from '@/shared/nexus/guards/SovereignGuard';

describe('NF525 — Crash-Test', () => {
    it('SovereignGuard bloque la suppression d\'un sceau fiscal', () => {
        expect(() => SovereignGuard.canDelete('fiscalLedger/_ref_test_ticket_888'))
            .toThrow();
    });
});
```

---

### R-09

**`MacroBrainOrchestrator` inaccessible depuis l'application**

#### Diagnostic

`src/modules/intelligence/agents/MacroBrainOrchestrator.ts` a 0 référence externe.
`AtlasLogisticsAgent` et `ThemisHRAgent` ont des références mais celles-ci semblent
être dans des tests ou des fichiers orphelins.

#### Correction

Soit :
- **Câbler** `MacroBrainOrchestrator` dans la route IA existante
  (`src/app/api/admin/fleet/support-ai/`) ou dans un gestionnaire d'agents
- **Ou documenter** qu'il est en cours de développement en ajoutant un commentaire
  explicite et une issue de suivi

---

## P3 — Dette (prochain sprint)

### R-10

**`requireFleetAdmin` importé dans 63 routes admin, jamais appelé dans 46**

#### Diagnostic

Le diff `835459e5f` ajoute `requireFleetAdmin` à l'import de 56 routes mais
ne l'appelle pas. Exemple :

```ts
// src/app/api/admin/compliance/chain-audit/route.ts
import { requireFleetAdmin, requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
// requireFleetAdmin n'est jamais appelé dans ce fichier
```

**Nota** : Ce n'est pas un trou de sécurité réel — `requireMccLevel` était déjà
présent et fonctionnel dans ces routes. C'est de la dette morte.

#### Correction

Deux sous-options :
1. **Nettoyer les imports morts** (simple) : retirer `requireFleetAdmin` des
   imports où il n'est pas appelé
2. **Remplacer `requireMccLevel` par `requireFleetAdmin`** dans les routes
   où le niveau d'accès Fleet Admin est plus approprié (à décider au cas par cas)

Commande de détection :

```bash
for f in $(grep -rl "requireFleetAdmin" src/app/api/admin/); do
  if ! grep -q "requireFleetAdmin(" "$f"; then
    echo "IMPORT MORT: $f"
  fi
done
```

---

## Ordre d'exécution recommandé

```
Jour 1 (urgent — prod)
  R-01 : Créer requireAuthenticatedAction.ts + câbler les 13 actions
  R-04 : Rebrancher HaccpCorrectiveActionHandler + ProformaHandler

Jour 2 (urgent — données)
  R-02 : Ajouter Nexus.adapter.batch().set() dans les 9 actions sans persistance
  R-03 : Ajouter VALIDATION_ERROR à NexusErrorCode + inventorier émissions sans tenantId

Jour 3 (stabilité)
  R-05 : Corriger les 12 erreurs TSC (3 crash-tests + NexusEventBus)
  R-06 : Fixer le mock PrepaieBuilder dans le test

Cette semaine
  R-07 : 36 violations barrel (peut se faire en une passe grep + sed)

Prochain sprint
  R-08 : Câbler crash-tests dans vitest OU les supprimer
  R-09 : Décider du sort de MacroBrainOrchestrator
  R-10 : Nettoyer imports morts requireFleetAdmin
```

---

## Métriques attendues post-remédiation

| Indicateur | Avant | Cible |
|---|---|---|
| `npx tsc --noEmit` | 12 erreurs | 0 erreur |
| `npx vitest run` | 785/786 | 786/786 |
| Server Actions authentifiées | 0/54 appels | 54/54 |
| Server Actions avec persistance réelle | 4/13 | 13/13 |
| Handlers EventBus actifs (HACCP + Proforma) | 0 | 2 restaurés |
| Violations Barrel Rule | 36 | 0 |

---

*Ce plan est lié à l'audit `audit-5-commits` inscrit dans `.claude/sessions.md`.*
*Aucune modification de code n'a été effectuée lors de l'audit — ce document
est le seul artefact produit.*
