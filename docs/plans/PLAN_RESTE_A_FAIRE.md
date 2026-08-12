# Plan — Reste à faire

> **Repo** : RESTAURANT-OS-CORE · branche `fix/coherence-ui-backend-securite` · HEAD `2acb5dab9`
> **Rédigé le** : 2026-08-09 · **mis à jour** le 2026-08-09 après commit · session `ui-backend-coherence`
>
> ⚠️ Le commit `2acb5dab9` n'est **pas** sur `main` (qui reste sur `31319cc61`) et
> n'a **pas** été poussé — migration GitLab en cours, commits locaux uniquement.
> **Public** : toute session (humaine ou Claude Code) reprenant ces chantiers.
>
> Ce document est **autonome** : chaque chantier contient le diagnostic, la preuve,
> le fichier exact, la correction proposée et le critère de validation. Aucun besoin
> de relire l'historique de conversation.

---

## Sommaire

| # | Chantier | Sévérité | Effort | Bloquant |
|---|----------|----------|--------|----------|
| [1](#chantier-1--292-tests-en-échec-mock-vitest-4) | 292 tests en échec — résolution de mock Vitest 4 | 🔴 CRITIQUE | ~2 h | Oui — masque toute régression |
| [2](#chantier-2--54-handlers-abonnés-au-vide) | 54 handlers abonnés au vide | 🔴 HIGH | Variable | Non |
| [3](#chantier-3--stocktransferhandler-sémantique-contradictoire) | `StockTransferHandler` — sémantique contradictoire | 🔴 HIGH | ~1 h | Non |
| [4](#chantier-4--85-événements-émis-sans-écouteur) | 85 événements émis sans écouteur | 🟠 MEDIUM | Variable | Non |
| [5](#chantier-5--erreur-de-scellement-nf525-non-journalisée) | Échec scellement NF525 non journalisé | 🔴 HIGH | 5 min | Non |
| [6](#chantier-6--117-catch-silencieux-dans-lui) | 117 `catch` silencieux dans l'UI | 🟠 MEDIUM | ~3 h | Non |
| [7](#chantier-7--wastemanagementhaccp-données-mockées) | `WasteManagementHACCP` — données mockées | 🟠 MEDIUM | ~1 h | Non |
| [8](#chantier-8--117-routes-api-sans-consommateur) | 117 routes API sans consommateur UI | 🟠 MEDIUM | Variable | Non |
| [9](#chantier-9--127-composants-construits-jamais-affichés) | 127 composants jamais affichés | 🟡 LOW | Variable | Non |
| [10](#chantier-10--17-routes-hors-navigation) | 17 routes hors navigation | 🟡 LOW | ~2 h | Non |
| [11](#chantier-11--icm-taskcontext-incomplet) | ICM TaskContext incomplet (15 routes) | 🟡 LOW | ~1 h | Non |
| [12](#chantier-12--sessionsmd-sessions-actives-fantômes) | `sessions.md` — sessions actives fantômes | 🟡 LOW | 2 min | Non |
| [13](#chantier-13--handlers-non-tier-aware--demo--test--ref) | Handlers non tier-aware (DEMO/TEST/REF) | 🔴 CRITIQUE | ~4 h | Oui — aggravé par les correctifs livrés |
| ~~[14](#chantier-14--nexustenantoverride--fuite-cross-tenant-sous-concurrence)~~ | ~~`Nexus.tenantOverride` — fuite cross-tenant~~ | ✅ **FAIT** | — | — |
| [15](#chantier-15--emitdurable-nest-pas-durable-côté-serveur) | `emitDurable` non durable côté serveur | 🔴 HIGH | ~3 h | Non |
| [16](#chantier-16--rbac-échec-ouvert-sur-action-inconnue) | RBAC — échec ouvert sur action inconnue | 🟠 **Phase 1 faite** — phase 2 à venir | 15 min | Non |

---

## Prérequis de lecture : les 3 tiers par verticale

**Tout chantier de ce document doit être pensé et validé sur les 3 tiers**, pas
seulement sur un tenant client. Référence complète : `docs/versionbase.md`.

Chaque verticale (8 au total) dispose de **3 tenants système** permanents, soit
**24 tenants système**. Registre : `src/lib/mcc/SystemTenantRegistry.ts`.

| Tier | tenantId | Rôle | Règle d'écriture |
|---|---|---|---|
| **DEMO** | `_demo_{variant}` | Vitrine prospect, données figées | Simulacra Mode — écritures détournées vers un fork |
| **TEST** | `_test_{variant}` | Bac à sable dev, reset libre | **Seul tier acceptant les écritures directes** |
| **REFERENCE** | `_ref_{variant}` | Maître cloneable pour nouveaux clients | Écriture **bloquée**, sauf promotion MCC |

Variantes : `restaurant`, `hotel`, `bakery`, `garage`, `salon`, `clinic`, `retail`, `custom`.

Un vrai client est un deep-copy de `_ref_{variant}` vers `tenant_{siret}`.
`SovereignGuard` filtre les tenants `_*` de la fleet MCC cliente.

API utile :

```ts
import {
  getSystemTenantId,      // (variant, tier) → '_ref_restaurant'
  isSystemTenant,         // (tenantId) → boolean
  getSystemTenantTier,    // (tenantId) → 'DEMO' | 'TEST' | 'REFERENCE' | null
  isWritable,             // (tenantId) → boolean  (true seulement pour _test_*)
} from '@/lib/mcc/SystemTenantRegistry';
```

> ⚠️ **Conséquence transverse** : un correctif validé sur un tenant client peut
> échouer sur `_ref_*` (écriture refusée) ou se comporter différemment sur `_demo_*`
> (Simulacra). Voir [chantier 13](#chantier-13--handlers-non-tier-aware--demo--test--ref).

---

## Contexte : ce qui a déjà été corrigé

Ne pas refaire ces points, ils sont livrés et vérifiés.

| Correctif | Fichier | Vérification |
|---|---|---|
| Freeze POS — `AnimatePresence mode="wait"` retiré | `src/modules/ops/service/pos/components/ProductGrid.tsx` | Changement de catégorie fluide |
| Freeze POS — référence `stockItems` stabilisée par `useMemo` | idem | Grille ne recalcule plus à chaque render |
| Rapatriement POS — 6 composants `commerce/ui/pos/` → `ops/service/pos/components/` | `CashDrawerModal`, `CourseManager`, `ModifierModal`, `PinModal`, `TipPanel`, `VoidModal` | 6 `eslint-disable no-restricted-imports` supprimés ; `commerce/ui/` n'existe plus |
| `toMicrounits` — validation runtime réelle | `src/shared/schemas/primitives.ts` | dev/test lève, prod normalise + journalise |
| `crypto.integrity_failed` — émetteur créé | `src/modules/finance/fiscalite/FiscalAdapter.ts` | 8 tests dans `src/e2e/vanguard/fiscal-breach-alert.test.ts` — vanguard 56 → **64/64** |
| Cycle d'import cassé | `src/lib/NexusSyncService.ts` | `VerticalRegistry`/`CoreContext` en import dynamique dans `init()` |
| `audit_id` — entropie 25 bits → UUID v4 | `src/lib/axiom.ts` | `crypto.randomUUID()` |
| Doublon `NexusFiscalProvider` supprimé | `src/shared/providers/finance/` supprimé | Le provider monté lit `fiscalSealsNodeAtom` |
| 20 handlers — `throw` ajouté dans le `catch` | `src/shared/eventBus/handlers/` | La DLQ voit enfin les échecs |
| Violation barrel `ops → finance` | `src/modules/ops/domain/schemas/pos.ts` | Import via `@/modules/finance` |
| **Chantier 14** — `tenantOverride` interdit côté serveur | `src/lib/nexus/NexusAdapter.ts` | Le setter lève hors navigateur |
| **Chantier 14** — propriété des snapshots vérifiée | `src/modules/.../ImportSnapshotService.ts` | `assertOwnership()` sur `restore`/`delete`, filtrage sur `list` |
| **Chantier 14** — tenant explicite dans la route | `src/app/api/tenant/onboarding/rollback/route.ts` | `caller.tenantId` passé en paramètre, 403 sinon |
| **Chantier 14** — `setServerSideTenantOverride()` supprimée | `src/lib/firebase.ts` | Fonction morte qui institutionnalisait l'anti-pattern |
| **Chantier 16 (phase 1)** — accès anonyme RBAC fermé | `src/shared/hooks/useActionPermission.ts` | Contrôle `!currentUser` remonté avant le cas « action non déclarée » |

**État de référence après ces correctifs** : `npx tsc --noEmit` → **0 erreur** · vanguard → **64/64** · isolation multi-tenant → **8/8** · suite globale → **292 échecs / 476 succès** (les 292 échecs sont ceux de la baseline `main`, aucune régression introduite ; +16 tests ajoutés).

Ces correctifs sont figés dans le commit `2acb5dab9` (84 fichiers), qui regroupe aussi
des remédiations antérieures restées non commitées (C-01, C-02, `prefetch` navigation,
plan S11, 4 tests vanguard fiscaux). Sur `NexusSyncService.ts` et `FiscalAdapter.ts`,
les deux couches sont imbriquées dans les mêmes fonctions.

---

## Chantier 1 — 292 tests en échec (mock Vitest 4)

> 🔴 **CRITIQUE — à traiter en premier.** Tant que ce chantier n'est pas fait, aucune
> régression n'est détectable : 38 % de la suite est rouge en permanence, donc plus
> personne ne lit le résultat des tests.

### Symptôme

```bash
npx vitest run
# Test Files  26 failed | 59 passed | 1 skipped (86)
#      Tests  292 failed | 468 passed | 1 skipped (761)
```

Erreurs typiques :
```
TypeError: capturedHandlers.order.comp is not a function
AssertionError: expected "vi.fn()" to be called at least once
```

### Répartition

**249 des 292 échecs** proviennent de 13 fichiers partageant le même harnais :

| Fichier | Échecs |
|---|---|
| `src/__tests__/handlers/saga-handlers.test.ts` | 28 |
| `src/__tests__/helpers/saga.intelligence.test.ts` | 27 |
| `src/__tests__/helpers/saga.ops2.test.ts` | 26 |
| `src/__tests__/helpers/saga.finance2.test.ts` | 25 |
| `src/__tests__/helpers/saga.crm.test.ts` | 23 |
| `src/__tests__/helpers/saga.human.test.ts` | 22 |
| `src/__tests__/helpers/saga.stock.test.ts` | 18 |
| `src/__tests__/helpers/saga.commerce2.test.ts` | 18 |
| `src/__tests__/helpers/saga.finance.test.ts` | 14 |
| `src/__tests__/helpers/saga.compliance.test.ts` | 14 |
| `src/__tests__/helpers/saga.ops.test.ts` | 13 |
| `src/__tests__/helpers/saga.logistics2.test.ts` | 11 |
| `src/__tests__/helpers/saga.handlers.test.ts` | 10 |

Les 43 échecs restants (autres fichiers) sont à diagnostiquer séparément, **après** ce correctif — une partie disparaîtra probablement avec lui.

### Cause racine — démontrée

Le projet est sur **Vitest 4.1.2**. Vitest 4 ne réconcilie plus un `vi.mock` déclaré
sur un chemin **alias** avec un import du même fichier fait en chemin **relatif** :
ce sont deux identifiants de module distincts.

- Les tests mockent : `vi.mock('@/shared/eventBus/NexusEventBus', …)`
- Les handlers importent : `import { NexusEventBus } from '../NexusEventBus';`

Résultat : le handler s'enregistre sur le **vrai** bus, le test observe un **mock**
jamais appelé, `capturedHandlers` reste vide.

**Preuve reproductible** — trois sondes exécutées sur ce repo :

| Sonde | Montage | `mockOn.mock.calls.length` |
|---|---|---|
| A | mock alias + import **direct** par le test | **1** ✅ |
| B | mock alias + import **relatif** par le handler | **0** ❌ |
| C | mock relatif-depuis-test + import relatif par le handler | **0** ❌ |

La sonde A prouve que le mock est valide. La sonde B isole la cause : la forme du
spécificateur d'import.

Script de la sonde B (à replacer dans `src/__tests__/probe.test.ts` pour rejouer) :

```ts
import { describe, it, expect, vi } from 'vitest';
const { mockOn } = vi.hoisted(() => ({ mockOn: vi.fn(() => () => {}) }));
vi.mock('@/shared/eventBus/NexusEventBus', () => ({
  NexusEventBus: { on: mockOn, emit: vi.fn(), emitDurable: vi.fn() },
}));
vi.mock('@/lib/nexus/NexusAdapter', () => ({ Nexus: { adapter: { get: vi.fn(), set: vi.fn(), update: vi.fn() } } }));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/audit', () => ({ empireAudit: { log: vi.fn() } }));
vi.mock('@/lib/shared-kernel', () => ({ SharedKernel: { generateId: vi.fn((p: string) => `${p}-id`) } }));

import { registerCompJournalHandler } from '@/shared/eventBus/handlers/CompJournalHandler';

describe('sonde', () => {
  it('le mock intercepte-t-il ?', () => {
    registerCompJournalHandler();
    expect(mockOn.mock.calls.length).toBe(-1); // échoue en affichant la vraie valeur
  });
});
```

### Ampleur

```
162  handlers important NexusEventBus en RELATIF   ('../NexusEventBus')
  1  handler important en ALIAS                    ('@/shared/eventBus/NexusEventBus')
 12  fichiers de test utilisant capturedHandlers
```

### Correctif recommandé — normaliser les imports des handlers

C'est l'option privilégiée : elle corrige la cause, ne touche pas les tests, et
aligne le code sur la règle du barrel (`CLAUDE.md`) qui proscrit déjà les chemins
relatifs traversants.

```bash
# Depuis la racine du repo
grep -rl "from '\.\./NexusEventBus'" src/shared/eventBus/handlers/ \
  | xargs sed -i '' "s|from '\.\./NexusEventBus'|from '@/shared/eventBus/NexusEventBus'|g"

npx tsc --noEmit          # doit rester à 0
npx vitest run            # attendu : chute massive du nombre d'échecs
```

⚠️ **Vérifier après le sed** : certains handlers sont dans des sous-dossiers
(`handlers/support/`, etc.) et utilisent `'../../NexusEventBus'`. Adapter le motif :

```bash
grep -rn "from '\.\..*NexusEventBus'" src/shared/eventBus/
```

### Alternatives (si le correctif ci-dessus est refusé)

- **B — aliaser dans `vitest.config.ts`** : ajouter une entrée `alias` faisant
  pointer les deux formes vers le même chemin résolu. Moins invasif mais masque le
  problème plutôt que de le corriger, et ne protège pas les futurs tests.
- **C — mocker par chemin absolu** dans les 12 fichiers de test via
  `path.resolve(__dirname, …)`. Rejeté : duplique la fragilité dans chaque test.

### Critère de validation

```bash
npx vitest run
# Objectif : 0 échec, ou à défaut une liste réduite et diagnostiquée nommément.
```

Comparer impérativement à la baseline avant/après avec la méthode du chantier
« Protocole de non-régression » en fin de document.

---

## Chantier 2 — 54 handlers abonnés au vide

> 🔴 **HIGH** — mais **ne pas câbler mécaniquement**. Lire l'avertissement.

### Symptôme

54 handlers sont **enregistrés au boot** (`registerNexusHandlers()` via
`src/shared/eventBus/registerHandlers/`) et tournent en production, abonnés à des
événements que **personne n'émet**. Chacun représente une fonctionnalité qui
paraît livrée mais ne se déclenche jamais.

Un seul handler est du code mort intégral (ni enregistré, ni émis) :
`SupportEscalationHandler.ts` (`support.ticket_escalated`).

### ⚠️ Avertissement — pourquoi ne PAS écrire les 54 émetteurs

L'investigation a montré que ce ne sont **pas** des bugs de câblage mais deux
situations distinctes :

**(a) Fonctionnalités à moitié construites.** Le back réactif existe, le
déclencheur n'a jamais été écrit. Vérifié par recherche exhaustive dans
`src/modules/` et `src/app/` (hors `eventBus/handlers/`) :

| Événement | Déclencheur côté UI / API |
|---|---|
| `table.locked`, `table.transferred` | ❌ `tableLocks` et tout flux de transfert **absents** du codebase |
| `staff.clock_in`, `staff.clock_out`, `hr.clock_in` | ❌ aucun appelant de `clock-in` |
| `inventory.physical` | ❌ aucun écran d'inventaire physique |
| `review.negative` | ❌ aucun flux d'avis |
| `quote.sent` | ❌ aucun envoi de devis |
| `hardware.printer_mapped` | ❌ aucun mapping imprimante |
| `kds.fire_next_course` | ❌ aucun bouton « envoyer service suivant » |
| `recipe.updated` | ❌ aucune émission à l'édition de recette |

Écrire ces émetteurs = **développement produit**, pas correction de bug. Chaque cas
demande une décision : où exactement déclencher, avec quelle charge utile, sous
quelle permission.

**(b) Handlers à sémantique contradictoire.** Voir [chantier 3](#chantier-3--stocktransferhandler-sémantique-contradictoire).

Brancher un émetteur sur un handler dont la sémantique est fausse **aggrave** la
situation : le handler écrit alors réellement en base, potentiellement au mauvais
endroit.

### Méthode de travail recommandée

Traiter **par domaine métier**, pas en masse. Pour chaque handler :

1. Lire le handler — que fait-il réellement en base ?
2. Lire le contrat d'événement dans `src/shared/eventBus/events/*.events.ts`
3. Décider : **(i)** écrire l'émetteur + l'UI, **(ii)** supprimer le handler,
   **(iii)** garder en attente avec un commentaire explicite
4. Si (i) : écrire un test qui prouve le couplage émetteur → handler

### Liste complète des 54

| Événement | Handler(s) | Domaine |
|---|---|---|
| `ai.document_uploaded` | `AutoIndexationHandler.ts` | intelligence |
| `ai.fleet_brief_requested` | `FleetStratBriefingHandler.ts` | intelligence |
| `ai.weekly_report_due` | `WeeklyReportHandler.ts` | intelligence |
| `biggroup.confirmed` | `BigGroupAlertHandler.ts` | commerce |
| `compliance.deadline_approaching` | `ComplianceDeadlineHandler.ts` | compliance |
| `crm.reward_redeemed` | `LoyaltyEngineHandler.ts` | commerce |
| `crm.segment_matched` | `SegmentTargetingHandler.ts` | commerce |
| `delivery.delivered` | `DeliveryDriverUnlockHandler.ts` | commerce |
| `finance.bank_transaction_synced` | `BankSyncAuditHandler.ts`, `ReconciliationEngineHandler.ts` | finance |
| `finance.invoice_approved` | `SupplierInvoiceLedgerHandler.ts` | finance |
| `finance.payment_failed` | `FleetOutboxHandler.ts`, `StripePaymentRetryHandler.ts` | finance |
| `finance.tax_mismatch` | `TaxMismatchAlertHandler.ts` | finance |
| `haccp.cooling_cycle_logged` | `CoolingCycleHandler.ts` | compliance |
| `hardware.printer_mapped` | `PrinterMappingHandler.ts` | ops |
| `hr.application_received` | `RecruitmentRouterHandler.ts` | human |
| `hr.break_checked` | `HRBreakCheckHandler.ts` | human |
| `hr.clock_in` | `PayrollTimeclockHandler.ts` | human |
| `hr.payroll_exported` | `PayrollComplianceHandler.ts` | human |
| `hr.schedule_published` | `ScheduleNotifierHandler.ts` | human |
| `hr.shift_ended` | `LaborCostAnalyzerHandler.ts`, `OvertimeAlertHandler.ts` | human |
| `hr.training_expired` | `TrainingComplianceAlertHandler.ts` | human |
| `integration.menu_sync_requested` | `AggregatorMenuSyncHandler.ts` | commerce |
| `integration.reservation_received` | `AntiCorruptionLayerHandler.ts` | commerce |
| `inventory.physical` | `PhysicalInventoryHandler.ts` | logistics |
| `invoice.overdue` | `OverdueInvoiceHandler.ts` | finance |
| `kds.dish_rebound` | `DishReboundHandler.ts` | ops |
| `kds.fire_next_course` | `FireNextCourseHandler.ts` | ops |
| `kds.item_done` | `KDSReadyHandler.ts`, `KdsPrepTimeAnalyzerHandler.ts` | ops |
| `kds.printer_failed` | `KdsPrintFallbackHandler.ts` | ops |
| `kds.ticket_delayed` | `KdsPrepDelayAlertHandler.ts` | ops |
| `llm.timeout` | `LLMFallbackHandler.ts` | intelligence |
| `mcc.feature_flag_toggled` | `FeatureFlagSyncHandler.ts` | mcc |
| `order.proforma_printed` | `ProformaHandler.ts` | finance |
| `overtime.threshold` | `OvertimeAlertHandler.ts`, `OvertimeJournalHandler.ts` | human |
| `payment.rejected` | `PaymentRejectAuditHandler.ts` | finance |
| `pos.terminal_login` | `HRClockInGuardHandler.ts` | ops / human |
| `quote.sent` | `QuoteFollowUpHandler.ts` | commerce |
| `recipe.updated` | `RecipeChangeKDSHandler.ts` | ops |
| `reservation.large_group` | `GroupPrepTasksHandler.ts` | commerce |
| `review.negative` | `NegativeReviewHandler.ts` | commerce |
| `service.end` | `FoodDonationHandler.ts` | compliance |
| `staff.clock_in` | `PayrollTimeclockHandler.ts` | human |
| `staff.clock_out` | `PayrollTimeclockHandler.ts` | human |
| `stock.transfer` | `StockTransferHandler.ts` | logistics — **voir chantier 3** |
| `store.shift_ended` | `EndOfServiceActionHandler.ts` | ops |
| `supplier.delivery_received` | `SupplierDeliveryReceivedHandler.ts` | logistics |
| `supplier.invoice_processed` | `FoodCostRecomputer.ts` | logistics |
| `table.assigned` | `TableTurnoverAnalyzerHandler.ts` | ops |
| `table.cleared` | `TableAutoReleaseHandler.ts` | ops |
| `table.locked` | `TableLockHandler.ts` | ops |
| `table.transferred` | `TableTransferHandler.ts` | ops |
| `tenant.onboarding_step_completed` | `OnboardingProgressHandler.ts` | commerce |
| `tenant.subscription_expired` | `GracePeriodHandler.ts` | mcc |
| `support.ticket_escalated` | `SupportEscalationHandler.ts` | **code mort intégral** |

### Script de régénération de cette liste

À rejouer après chaque lot pour mesurer l'avancement :

```python
# python3 - <<'PYEOF'  (depuis la racine du repo)
import re, glob, os

handled, emitted = {}, set()
for f in glob.glob("src/shared/eventBus/**/*.ts", recursive=True):
    c = open(f).read()
    for m in re.finditer(r"NexusEventBus\.on\s*(?:<[^>]*>)?\s*\(\s*['\"]([a-z_]+\.[a-z_]+)['\"]", c):
        handled.setdefault(m.group(1), set()).add(os.path.basename(f))
for root in ["src/modules","src/shared","src/lib","src/app","src/verticals"]:
    for f in glob.glob(f"{root}/**/*.ts", recursive=True)+glob.glob(f"{root}/**/*.tsx", recursive=True):
        if '.test.' in f or '.spec.' in f: continue
        for m in re.finditer(r"\.emit(?:Durable)?\s*(?:<[^>]*>)?\s*\(\s*['\"]([a-z_]+\.[a-z_]+)['\"]", open(f).read()):
            emitted.add(m.group(1))

reg = "\n".join(open(f).read() for f in glob.glob("src/shared/eventBus/registerHandlers/*.ts"))
for e in sorted(set(handled) - emitted):
    files = handled[e]
    live = any(os.path.splitext(fn)[0] in reg for fn in files)
    print(f"{'ACTIF ' if live else 'MORT  '} {e:38s} {', '.join(sorted(files))}")
# PYEOF
```

> ⚠️ Le registre des handlers est `src/shared/eventBus/registerHandlers/` (répertoire).
> Le fichier `registerHandlers.ts` n'est qu'un `export * from './registerHandlers/index'`
> — chercher dedans donne un faux négatif à 100 %.

---

## Chantier 3 — `StockTransferHandler` sémantique contradictoire

> 🔴 **HIGH** — risque d'écriture cross-tenant.

### Le problème

`src/shared/eventBus/handlers/StockTransferHandler.ts` contient l'incertitude de
son propre auteur, non résolue, en commentaire :

```ts
// En réalité "tenantId" pourrait être the main tenant, et "from/to" seraient des sous-locations.
// Si c'est inter-tenant, il faudrait modifier les path. On suppose ici des sous-locations d'un même tenant,
// ou bien fromLocation/toLocation sont les tenantIds ?
// L'énoncé dit "déduction A, crédit B". Supposons que fromLocationId et toLocationId = tenantIds.

const fromPath = `tenants/${fromLocationId}/stockItems/${itemId}`;
const toPath   = `tenants/${toLocationId}/stockItems/${itemId}`;
```

Le contrat de l'événement (`src/shared/eventBus/events/ops.events.ts:132`) déclare
pourtant :

```ts
'stock.transfer': {
  v: 1; isSimulation?: boolean;
  tenantId: string;
  fromLocationId: string;   // ← emplacement de stockage
  toLocationId: string;     // ← emplacement de stockage
  itemId: string; quantity: number; operatorId: string;
};
```

Le handler traite donc un **identifiant d'emplacement de stockage comme un tenantId**,
et ignore le `tenantId` réel (déstructuré en `_tenantId`).

### Pourquoi c'est urgent

L'UI existe (`StockTransferModal.tsx`, monté dans `src/app/(client)/(ops)/inventory/page.tsx:192`)
et le hook `transferStock` écrit déjà en base :

```ts
// src/modules/logistics/stock/inventory/hooks/useInventory.ts:117
const transferStock = async (id: string, locationId: string, _qty: number) => {
    if (!tenantId) return;
    const path = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}/${id}`;
    await Nexus.adapter.update(path, { locationId, updatedAt: new Date().toISOString() });
};
```

Il ne manque **que** l'émission. Une session pressée pourrait l'ajouter en une
ligne — et déclencher des écritures sur `tenants/{identifiant_d_emplacement}/stockItems/…`,
c'est-à-dire des documents sous un tenant inexistant, avec un `SovereignGuard`
contourné par une clé invalide.

### Correction attendue

1. **Trancher la sémantique** : le transfert est-il inter-emplacements d'un même
   tenant (probable, vu `DEFAULT_STORAGE_LOCATIONS` et `storageLocationId`), ou
   inter-tenants ?
2. Réécrire le handler en conséquence — pour l'hypothèse inter-emplacements :
   ```ts
   const fromPath = `tenants/${tenantId}/stockItems/${itemId}`;
   // + mise à jour de storageLocationId, pas deux documents distincts
   ```
3. Retirer le commentaire d'incertitude.
4. **Ensuite seulement** émettre depuis `transferStock`, avec `fromLocationId`
   dérivé de `currentItem.storageLocationId`.
5. Écrire un test prouvant qu'aucun chemin ne sort de `tenants/{tenantId}/`.

---

## Chantier 4 — 85 événements émis sans écouteur

> 🟠 **MEDIUM**

### Répartition

**~70 événements** proviennent des adapters des verticales non-restaurant. Elles
émettent dans le vide car ces verticales n'ont ni route Next.js ni handler :

`src/verticals/{hotel,bakery,salon,retail,clinic,garage}/adapters/*.ts`

Exemples : `hotel.guest_checked_in`, `bakery.batch_started`, `salon.appointment_booked`,
`retail.sale_completed`, `health.patient_admitted`, `auto.vehicle_checked_in`.

**Décision à prendre** : ces verticales sont-elles au roadmap ? Si oui, laisser en
l'état (les handlers viendront avec). Si non, c'est du code à retirer.

### Les orphelins du périmètre restaurant (à traiter)

| Événement | Émetteur | Conséquence de l'absence de handler |
|---|---|---|
| `haccp.temperature_logged` | `src/app/api/haccp/log-temp/route.ts` | La sonde IoT écrit, **aucune cascade** (pas d'alerte seuil) |
| `inventory.stock_adjusted` | `src/app/api/inventory/adjust/route.ts` | Ajustement sans répercussion |
| `cash_drawer.opened_unauthorized` | `src/modules/ops/service/pos/hooks/useCashDrawer.ts` | Ouverture non autorisée **non tracée** |
| `connectors.sync_failed` | `api/connectors/[id]/{test,sync}/route.ts` | Échec de synchronisation silencieux |
| `connectors.activated` / `deactivated` / `config_saved` / `sync_completed` | `api/connectors/[id]/*` | Cycle de vie connecteur invisible |
| `fleet.vehicle_assigned` | `src/app/api/fleet/assign-vehicle/route.ts` | Aucune notification |
| `hr.transfer_offer` | `src/modules/human/effectifs/hr/services/LiquidStaffingEngine.ts` | Offre de transfert perdue |
| `commerce.yield_updated` | `src/modules/commerce/acquisition/marketing/services/YieldEngine.ts` | Yield calculé, jamais consommé |
| `system.reference_promoted` | `api/admin/mcc/system-tenants/promote/route.ts` | Promotion sans trace |
| `anomaly.detected` | `AbsenceUnderstaffingHandler.ts`, `CashDrawerAnomalyHandler.ts` | Anomalies détectées, non routées |
| `oracle.query` | `LLMFallbackHandler.ts` | — |
| `kds.ticket_received` | `KdsRoutingHandler.ts` | — |
| `crm.allergen_flagged` | `ResaAllergenCheckHandler.ts` | **Allergène signalé sans destinataire** |
| `finance.refund_issued` | `RestaurantFinanceAdapter.ts`, `SalonFinanceAdapter.ts` | Remboursement sans cascade comptable |
| `finance.z_report_requested` | `ZReportAutoJob.ts`, `RetailFinanceAdapter.ts` | Demande de Z sans traitement |

**Priorité suggérée** : `crm.allergen_flagged` (sécurité alimentaire),
`cash_drawer.opened_unauthorized` (sécurité caisse), `haccp.temperature_logged`
(conformité), `finance.refund_issued` (comptabilité).

---

## Chantier 5 — Erreur de scellement NF525 non journalisée

> 🔴 **HIGH — correctif de 5 minutes, valeur élevée.**

### Le problème

`src/modules/ops/service/pos/hooks/usePos.ts` ligne ~189 :

```ts
} catch (_error) {
    showToast("Transaction Échouée", "error");
}
```

Un échec de la chaîne complète
`processPayment → FinancialNexusBridge.processOrder → FiscalSealer.sealDataAtomically`
affiche un toast générique et **l'erreur est jetée sans aucun log**. Aucun
diagnostic possible en production sur la transaction fiscale la plus critique du
système.

### La chaîne concernée (vérifiée intacte par ailleurs)

```
pos/page.tsx  PaymentDialog onPaymentComplete
  └→ usePos.ts:194  handlePaymentComplete
      └→ usePos.ts:170  finalizePayment
          └→ posOrderSubmit.ts:32  processPayment
              └→ FinancialNexusBridge.processOrder()
                  ├→ FiscalSealer.generateSequentialReceiptNumber()   (ligne 171)
                  ├→ FiscalSealer.sealDataAtomically()                (ligne 175)
                  ├→ tenants/{id}/journalEntries                      (ligne 206)
                  └→ emitDurable('order.paid')                        (ligne 48)
```

### Correctif

```ts
} catch (error) {
    logger.error('[POS] Échec finalisation paiement / scellement NF525', {
        tenantId: activeTenantId,
        tableId: selectedTableId,
        itemCount: cartItems.length,
        error: toError(error).message,
    });
    showToast("Transaction Échouée", "error");
}
```

Importer `logger` depuis `@/lib/logger` et `toError` depuis `@/lib/toError`
(tous deux déjà utilisés massivement dans le repo).

---

## Chantier 6 — 117 `catch` silencieux dans l'UI

> 🟠 **MEDIUM** — passe mécanique, faible risque.

### Symptôme

117 blocs `catch` dans `src/modules/**/*.{ts,tsx}` (hors tests) n'appellent ni
`logger` ni `console`. Motif typique :

```ts
} catch { toast.error("Erreur lors de l'annulation"); }
```

L'utilisateur voit un message, l'exploitant n'a **aucune trace**.

### Concentrations principales

| Fichier | Occurrences | Nature |
|---|---|---|
| `src/modules/commerce/relation/reservations/hooks/useReservationsPage.ts` | 7 | annulation, no-show, création, MAJ, arrivée, groupe |
| `src/modules/ops/service/pos/components/CashDrawerModal.tsx` | 3 | ouverture / fermeture caisse |
| `src/modules/commerce/relation/reservations/components/EventQuoteModal.tsx` | 2 | devis événement |
| `VisitHistory.tsx`, `LoyaltyCard.tsx`, `EmailAutomations.tsx`, `CRMContactForm.tsx` | 4 | CRM |

### Commande de recensement

```bash
grep -rn "catch (_error)\|catch (_err)\|catch (_e)\|catch {" src/modules \
  --include="*.tsx" --include="*.ts" | grep -v test | grep -v "logger\|console"
```

### Correctif

Ajouter systématiquement un `logger.error` **avant** le toast, avec le contexte
métier (tenantId, id de l'entité, action). Ne pas se contenter de `logger.error(e)`.

---

## Chantier 7 — `WasteManagementHACCP` données mockées

> 🟠 **MEDIUM**

### Le problème

`src/modules/compliance/qualite/haccp/components/haccp/WasteManagementHACCP.tsx`
lignes 19-33 :

```ts
const { logWaste: _logWaste } = useHACCP();          // ← hook backend récupéré puis IGNORÉ
const { hottesDoc, prestataires: _prestataires } = useRegistre();

// Mock recent waste logs
const recentLogs = [
    { id: '1', type: 'biodechets', quantity: 45, provider: 'EcoCollect Lyon', date: '2026-03-27', status: 'collected' },
    { id: '2', type: 'huiles',     quantity: 20, provider: 'RecupOil',       date: '2026-03-20', status: 'collected' },
    { id: '3', type: 'biodechets', quantity: 12, provider: '-',              date: '2026-03-29', status: 'pending'  },
];
const stats = [
    { label: 'Bio-déchets / Mois',   value: '184 kg' },   // codé en dur
    { label: 'Huiles récupérées',    value: '45 L'   },   // codé en dur
    { label: 'Dernier curage bac',   value: '10 Jan.' },  // codé en dur
];
```

Le préfixe `_` sur `logWaste` confirme l'intention : la fonction backend est
disponible et branchée, puis délibérément désactivée.

Ce composant n'est de toute façon **monté nulle part** (voir chantier 9).

### Correctif

1. Brancher `logWaste` sur le formulaire de saisie
2. Lire les logs réels via `wasteLogsNodeAtom` (`@/modules/compliance`)
3. Calculer les 3 KPI à partir des données (agrégation par mois)
4. Monter le composant dans un onglet `/haccp?tab=waste`

### Même motif ailleurs (backend récupéré, jamais appelé)

| Fichier | Ligne | Fonction inutilisée |
|---|---|---|
| `src/modules/ops/production/kds/components/KDSDashboard.tsx` | 57 | `floorOps: _floorOps` |
| `src/modules/finance/components/accounting/FiscalAuditView.tsx` | 12 | `isLoading: _sealsLoading` |
| `src/modules/ops/service/pos/components/ProductFormModal.tsx` | 37 | `data: _recipes` |
| `src/modules/commerce/acquisition/landing/components/LandingDashboard.tsx` | 149 | `showToast: _showToast` |

---

## Chantier 8 — 117 routes API sans consommateur

> 🟠 **MEDIUM** — décision produit requise avant tout code.

**117 routes sur 164 (71 %)** n'ont aucun appelant dans la couche client.
En retirant webhooks et crons (légitimement sans UI), il reste **~100 APIs métier
orphelines**.

### Cockpit MCC — ~40 routes sans interface

```
/api/admin/fleet/{backup,restore,churn,contracts,rollout,dns,region,drain-outbox,
                  rgpd-purge,shadow-mode,trusted-devices,device-activation,
                  tenant-override,tenant-users,upgrade,users/reset-pin,users/role,
                  telemetry/crash-report,telemetry/heartbeat,support-gate,…}
/api/admin/mdm/{devices,lock,erase}
/api/admin/compliance/{chain-audit,fiscal-tenant-audit,nf525-certificate}
/api/admin/mcc/reseller{,/commissions}
```

### Métier tenant — API construite, aucun bouton

| Route | UI qui devrait l'appeler | Composant déjà construit ? |
|---|---|---|
| `/api/finance/cash-count` | Comptage de caisse | ✅ `CashCounterModal` (non monté) |
| `/api/connectors/[id]/{activate,test,sync,credentials}` | Hub connecteurs | ✅ `ConnectorConfigModal` (non monté) |
| `/api/reservations/{deposit,card-imprint}` | Empreinte CB réservation | ✅ `CardImprintStep` (non monté) |
| `/api/hr/dsn`, `/api/hr/employees` | Export DSN, gestion employés | ❌ |
| `/api/inventory/adjust` | Ajustement de stock manuel | ❌ |
| `/api/crm/{customers,consent,ab-test,anti-spam,campaign-analytics}` | 5 fonctionnalités CRM | ❌ |
| `/api/google/reserve/{availability,bookings,merchants,services}` | Intégration Google Reserve | ❌ |
| `/api/billing/{checkout,signup,dunning}` | Tunnel d'abonnement SaaS | ❌ |
| `/api/delivery/{rush-mode,oauth/connect}` | Mode rush livraison | ❌ |

### Commande de recensement

```bash
for route in $(find "src/app/api" -name "route.ts"); do
  apipath=$(echo "$route" | sed 's|src/app||' | sed 's|/route.ts||')
  n=$(grep -rl "$apipath" src/modules src/shared "src/app/(client)" \
      --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
  [ "$n" -eq 0 ] && echo "$apipath"
done | grep -vE "webhook|/cron/|/health|/status" | sort
```

### Décision attendue

Pour chaque bloc : **construire l'UI**, **exposer via MCC**, ou **supprimer la route**.
Une route API sans consommateur est une surface d'attaque et une dette de maintenance.

---

## Chantier 9 — 127 composants construits, jamais affichés

> 🟡 **LOW** — inventaire complet disponible.

**127 composants `.tsx`** n'ont aucune référence depuis `src/app/`.

Un inventaire détaillé par domaine (HACCP 29, KDS/cuisine 25, marketing 13,
onboarding 15, réservations 12, plan de salle 10, finance 9, POS 8, intelligence 8,
inventaire 7, RH 5) existe déjà dans **`PLAN_IMPLEMENTATION_UI.md`** à la racine du
repo — s'y référer plutôt que de refaire le recensement.

### ⚠️ Deux corrections à apporter à ce document

`PLAN_IMPLEMENTATION_UI.md` contient deux affirmations **fausses**, vérifiées depuis :

1. **`/onboarding` n'est pas un stub.** `src/app/(client)/(ops)/onboarding/page.tsx`
   rend `OnboardingWizard`, qui câble réellement `ProgressStepper`,
   `SourceSystemSelector`, `ConnectorOAuthPanel`, `ImportCategoryPanel`,
   `SimpleFloorPlanEditor`, `OnboardingHelpButton`. Seuls `OCRUploadZone` et
   `PreviewTable` restent non montés.
2. **`/pos-mobile` et `/mon-espace` sont dans `navConfig`** (lignes 243-244). La
   liste réelle des routes hors navigation est de **17**, pas 13.

### Commande de recensement

```bash
find src/modules -name "*.tsx" | grep -v test | while IFS= read -r f; do
  b=$(basename "$f" .tsx)
  [ "$(grep -rl "$b" src/app/ 2>/dev/null | wc -l)" -eq 0 ] && echo "$b | $f"
done
```

---

## Chantier 10 — 17 routes hors navigation

> 🟡 **LOW**

Ces pages existent dans Next.js mais n'ont aucune entrée dans
`src/config/navConfig.ts` — inaccessibles sans URL directe.

```
/                    /aide                /auth/logout        /landing
/leaves              /login               /marketing/seo      /menu-engineering
/migration           /onboarding          /planning           /recruitment
/showcase            /signup              /staff              /timeclock
/welcome
```

**Nuances** :
- `/staff`, `/planning`, `/leaves`, `/recruitment` sont atteignables via
  `?tab=` depuis `navConfig` — il leur manque une route directe, pas la page.
- `/login`, `/signup`, `/auth/logout`, `/showcase`, `/landing`, `/welcome`, `/`
  sont des routes publiques : leur absence de `navConfig` est **normale**.

**Réellement à câbler** : `/aide`, `/menu-engineering`, `/migration`, `/onboarding`,
`/timeclock`, `/marketing/seo`.

### Commande de vérification

```bash
grep -oE 'href: "/[a-z0-9/-]+"' src/config/navConfig.ts | sed 's/href: //' | tr -d '"' | sort -u > /tmp/nav.txt
find "src/app/(client)" -name "page.tsx" | while read f; do
  r=$(dirname "$f" | sed 's|src/app/(client)||;s|(ops)||;s|(public)||;s|//*|/|g')
  grep -qx "$r" /tmp/nav.txt || echo "$r"
done | grep -v "\[" | sort
```

---

## Chantier 11 — ICM TaskContext incomplet

> 🟡 **LOW**

15 routes n'ont pas d'*importance map* déclarée dans `src/lib/icm/TaskContext.ts`
et retombent sur `TASK_MAPS.default` — donc chargent plus de données que nécessaire.

```
/nf525   /migration   /onboarding   /integrations   /menu-engineering
/aide    /landing     /showcase     /welcome        /signup
/login   /marketing/seo             /vanguard-simulator
/auth/logout          /
```

**Cas le plus coûteux** : `/nf525` — page d'audit fiscal qui charge la map par
défaut au lieu de cibler `finance` + `compliance`.

### Marche à suivre (documentée dans `CLAUDE.md`)

1. Ajouter une entrée dans `TASK_MAPS` (`src/lib/icm/TaskContext.ts`)
2. Ajouter le cas correspondant dans `resolveTaskContext()`

Modèle, calqué sur la map `pos` existante :

```ts
nf525: {
  taskId: 'nf525',
  importance: {
    ...OFF_ALL,
    finance:    'HIGH',
    compliance: 'HIGH',
  },
},
```

---

## Chantier 12 — `sessions.md` sessions actives fantômes

> 🟡 **LOW** — 2 minutes.

`.claude/sessions.md` porte deux sessions au statut `active` datées du **2026-08-07**,
manifestement non clôturées :

| Session | Périmètre déclaré |
|---|---|
| `audit-complet-v3` | Audit global structure projet (lecture seule) |
| `typing-unknown-eradication` | Éradication des 913 `unknown` — périmètre large `src/` |

Le protocole de `CLAUDE.md` impose de vérifier les collisions avant toute action.
Des sessions fantômes `active` rendent ce contrôle inopérant (tout devient une
collision apparente, donc plus personne ne regarde).

**Action** : confirmer auprès de leurs auteurs puis passer à `terminée`.

---

## Chantier 13 — Handlers non tier-aware (DEMO / TEST / REF)

> 🔴 **CRITIQUE** — et **aggravé par un correctif livré cette session**.
> Lire avant de toucher au bus événementiel.

### Le problème

```
164  handlers dans src/shared/eventBus/handlers/
  0  handlers qui vérifient le tier avant d'écrire
  0  filtre de tier dans NexusEventBus.ts
```

Aucun handler n'appelle `isSystemTenant`, `getSystemTenantTier` ni `isWritable`.
Le bus n'en tient pas compte non plus.

Or `SovereignGuard` **lève une exception** sur toute écriture vers `_ref_*` ou
`_demo_*` — `src/shared/nexus/guards/SovereignGuard.ts:219` :

```ts
if (pathTenantId && isSystemTenant(pathTenantId) && !isWritable(pathTenantId)) {
    throw new NexusError(
        NexusErrorCode.ACCESS_DENIED,
        `[SovereignGuard] Écriture refusée sur tenant système ${pathTenantId}. ` +
            `Seul _test_* accepte les écritures directes. ` +
            `Pour _ref_* : utiliser la procédure de promotion MCC.`,
    );
}
```

### Enchaînement du défaut

1. Un prospect navigue sur `_demo_restaurant`, ou un opérateur MCC consulte `_ref_restaurant`
2. Une action émet un événement (ex. `order.paid`)
3. Le handler se déclenche et tente `Nexus.adapter.set(...)`
4. `SovereignGuard` lève `ACCESS_DENIED`
5. **Le correctif de cette session a ajouté `throw err` à 20 handlers** → l'erreur
   remonte désormais jusqu'à la DLQ au lieu d'être avalée
6. `DLQRetryService` réessaie **5 fois** (`MAX_ATTEMPTS = 5`, scan toutes les 30 s)
7. Mise en quarantaine → émission de `mcc.dlq_quarantine`
8. Si l'événement est fiscal → escalade `mcc.fiscal_audit_required`

**Résultat** : sur `_ref_*`, chaque événement déclenchant un handler écrivain
inonde la DLQ et déclenche de **fausses alertes d'audit fiscal**.

> Ce n'est pas une raison de revenir sur le `throw err` : avaler l'erreur rendait
> simplement le défaut invisible. Le correctif a rendu un problème préexistant
> observable — c'est le comportement souhaité. Il faut maintenant traiter la cause.

### Nuance sur DEMO

`_demo_*` est censé être intercepté **en amont** par Simulacra Mode, qui détourne
les écritures vers un fork mémoire. L'activation n'est cependant **pas automatique
à la détection du tenant** — elle dépend d'appels explicites :

| Appelant | Fichier |
|---|---|
| `SplashGate` | `src/shared/providers/SplashGate.tsx:74` |
| `useNexusTenantLogic` | `src/shared/providers/hooks/useNexusTenantLogic.ts:72` |
| Simulateur temporel | `src/modules/intelligence/ia/simulator/{SimulationService,TemporalSimulator}.ts` |

**Si l'un de ces chemins ne s'exécute pas** (accès direct par URL, rechargement,
route hors `SplashGate`), `_demo_*` se comporte exactement comme `_ref_*` : les
écritures atteignent `SovereignGuard` et lèvent.

### Vérifications à mener

```bash
# 1. Aucun handler n'est tier-aware — doit renvoyer 0 aujourd'hui
grep -rl "isSystemTenant\|getSystemTenantTier\|isWritable" src/shared/eventBus/handlers/ | wc -l

# 2. Le bus n'a aucun filtre — doit ne rien renvoyer aujourd'hui
grep -nE "isSystemTenant|_demo_|_ref_|isWritable" src/shared/eventBus/NexusEventBus.ts

# 3. Compter les handlers qui écrivent (donc exposés)
grep -rl "Nexus\.adapter\.\(set\|update\|create\|delete\)" src/shared/eventBus/handlers/ | wc -l
```

### Correctifs possibles

**Option A — filtre central dans le bus (recommandé).** Un seul point de contrôle,
164 handlers inchangés. Dans `NexusEventBus`, avant dispatch : si la charge utile
porte un `tenantId` non inscriptible, ne pas exécuter les handlers écrivains et
journaliser en `debug` (pas en `error` — ce n'est pas une anomalie).

Difficulté : distinguer handler « écrivain » de handler « lecteur/notifieur ». Peut
se déclarer dans les options de `NexusEventBus.on(...)`, qui accepte déjà
`{ id, priority }` — ajouter `writes: true`.

**Option B — garde par handler.** Explicite mais 164 fichiers à modifier, et tout
nouveau handler pourra oublier la garde.

**Option C — rendre Simulacra systématique.** Activer le fork dès qu'un tenant `_demo_*`
ou `_ref_*` est résolu, quel que soit le chemin d'entrée. Traite la cause pour DEMO,
mais pas la sémantique REFERENCE (où l'écriture doit rester refusée).

**Recommandation** : A + C. A protège la DLQ, C garantit que le mode démo reste
fonctionnel quel que soit le point d'entrée.

### Critère de validation

1. Naviguer sur `_ref_restaurant`, déclencher une vente → **aucune entrée DLQ**,
   aucune alerte `mcc.dlq_quarantine`
2. Naviguer sur `_demo_restaurant` par **URL directe** (sans passer par `SplashGate`)
   → les écritures partent dans le fork Simulacra, pas d'exception
3. Sur `_test_restaurant` → comportement inchangé, écritures réelles
4. Sur un `tenant_{siret}` → comportement inchangé

### Impact sur les autres chantiers

| Chantier | Ce que le tiering change |
|---|---|
| [2](#chantier-2--54-handlers-abonnés-au-vide) — 54 handlers | Chaque émetteur écrit doit être neutre sur `_demo_`/`_ref_` |
| [3](#chantier-3--stocktransferhandler-sémantique-contradictoire) — `StockTransferHandler` | Il construit `tenants/{fromLocationId}/…` : sur un tenant système, la clé invalide **contourne** la détection `isSystemTenant`. Aggrave le risque déjà signalé |
| [5](#chantier-5--erreur-de-scellement-nf525-non-journalisée) — log NF525 | Un échec de scellement sur `_ref_*` est **attendu**, pas une anomalie : le log doit le distinguer d'un vrai échec |
| [8](#chantier-8--117-routes-api-sans-consommateur) — routes API | Les routes d'écriture doivent refuser proprement (400/403 explicite) sur tenant non inscriptible, pas remonter une exception brute |

### Question ouverte — scellement fiscal sur tenants système

À trancher : `_demo_restaurant` et `_ref_restaurant` produisent-ils des sceaux
NF525 (`fiscalSeals`, `journalEntries`) ?

- Si **oui** : ces collections sont immuables par contrat — comment reset `_test_*` ?
- Si **non** : où est le point de coupure, et `FiscalSealer` en tient-il compte ?

Aucun code n'exprime aujourd'hui cette décision. `FiscalSealer.sealDataAtomically()`
ne consulte pas le tier.

---

## Chantier 14 — `Nexus.tenantOverride` : fuite cross-tenant sous concurrence

> ✅ **CORRIGÉ le 2026-08-09.** Conservé comme documentation du défaut et de sa
> barrière de non-retour. Ce qui a été livré :
>
> | Fichier | Changement |
> |---|---|
> | `src/lib/nexus/NexusAdapter.ts` | Le setter `tenantOverride` **lève** hors navigateur — le motif est structurellement interdit |
> | `src/modules/.../ImportSnapshotService.ts` | `restore`/`list`/`delete` prennent un `tenantId` explicite ; chaque appel Nexus porte son `NexusContext { vassalId }` |
> | idem | `assertOwnership()` — un snapshot d'un autre tenant est refusé (**second défaut trouvé** : `restore()` ne vérifiait aucune propriété) |
> | `src/app/api/tenant/onboarding/rollback/route.ts` | POST et GET passent `caller.tenantId` explicitement ; 403 si le tenant n'est pas résolu |
> | `src/lib/firebase.ts` | `setServerSideTenantOverride()` **supprimée** — fonction morte qui institutionnalisait l'anti-pattern |
> | `src/__tests__/security/tenant-isolation.test.ts` | **8 tests** verrouillant les deux barrières |
>
> Vérifié : TSC 0 · 8/8 tests d'isolation · aucune régression (292 échecs baseline inchangés, 468 → **476** succès).

### Le problème

`Nexus.tenantOverride` est un **setter sur le singleton** `Nexus`
(`src/lib/nexus/NexusAdapter.ts:95`), utilisé par `validateAccess` comme ancrage
tenant (ligne 111).

Côté navigateur, c'est sans risque : un tenant par session.

Côté **serveur**, le singleton `Nexus` est partagé par **toutes les requêtes
concurrentes du même process Node**. Or `src/app/api/tenant/onboarding/rollback/route.ts`
l'écrit dans le chemin de requête, aux lignes 22 (POST) et 45 (GET) :

```ts
Nexus.tenantOverride = caller.tenantId ?? null;
await ImportSnapshotService.restore(snapshotId);   // ← point de yield
```

### Course exploitable

```
T0  Requête A (tenant X)  →  Nexus.tenantOverride = X
T1  Requête A             →  await ImportSnapshotService.restore(…)   ← rend la main
T2  Requête B (tenant Y)  →  Nexus.tenantOverride = Y
T3  Requête A reprend, lit Nexus.tenantOverride  →  Y                 ← MAUVAIS TENANT
```

La requête A restaure alors un snapshot **dans les données du tenant Y**, ou liste
les snapshots de Y. En SaaS multi-tenant, deux requêtes concurrentes de tenants
différents sont le cas **nominal**, pas un cas limite.

### Portée

```bash
grep -rn "tenantOverride\s*=" src/ --include="*.ts" --include="*.tsx" | grep -v test
```

| Fichier | Contexte | Risque |
|---|---|---|
| `src/app/api/tenant/onboarding/rollback/route.ts:22` (POST) | **Serveur, par requête** | 🔴 course |
| `src/app/api/tenant/onboarding/rollback/route.ts:45` (GET) | **Serveur, par requête** | 🔴 course |
| `src/shared/providers/hooks/useNexusTenantLogic.ts:62` | Client | ✅ sans objet |
| `src/lib/NexusSyncService.ts:52` | Client | ✅ sans objet |
| `src/lib/firebase.ts:76` | À qualifier | ⚠️ à vérifier |

### Correctif

Ne **jamais** ancrer le tenant par état global dans un chemin serveur. Passer le
`tenantId` **explicitement** à travers l'appel :

```ts
// Au lieu de :
Nexus.tenantOverride = caller.tenantId ?? null;
await ImportSnapshotService.restore(snapshotId);

// Passer le tenant en paramètre :
await ImportSnapshotService.restore(snapshotId, { tenantId: caller.tenantId });
```

`ImportSnapshotService` doit propager ce `tenantId` jusqu'aux appels Nexus plutôt
que de lire l'ancrage global. Vérifier au passage les autres méthodes du service
(`list`, `delete`).

**Garde-fou recommandé** : faire lever le setter `tenantOverride` lorsqu'il est
appelé hors navigateur, pour interdire structurellement le motif :

```ts
set tenantOverride(tenantId: string | null) {
    if (typeof window === 'undefined') {
        throw new Error(
            '[Nexus] tenantOverride est interdit côté serveur : le singleton est ' +
            'partagé entre requêtes concurrentes. Passer le tenantId explicitement.'
        );
    }
    this._tenantOverride = tenantId;
}
```

### Critère de validation

Test d'intégration lançant deux requêtes concurrentes sur `/api/tenant/onboarding/rollback`
avec deux tenants distincts, et vérifiant qu'aucune écriture ne sort de son propre
`tenants/{tenantId}/`.

---

## Chantier 15 — `emitDurable` n'est pas durable côté serveur

> 🔴 **HIGH** — le nom promet une garantie que le code ne tient pas hors navigateur.

### Le problème

`src/shared/eventBus/NexusEventBus.ts:73` :

```ts
async emitDurable<E extends NexusEventName>(event: E, payload: NexusEventPayload<E>) {
  const id = crypto.randomUUID();

  // 1. Outbox : Persister l'intention d'émettre
  if (typeof window !== 'undefined') {          // ← NAVIGATEUR UNIQUEMENT
    try {
      await db.busOutbox.put({ id, eventName: event, payload, createdAt: Date.now(), attempts: 0, status: 'pending' });
    } catch (err) {
      logger.error(`[EventBus] Failed to write to Outbox for ${event}`, err);
    }
  }

  // 2. Émettre en RAM
  await this.emit(event, payload);
  …
}
```

L'outbox vit dans **Dexie/IndexedDB**, indisponible côté serveur. La garde
`typeof window !== 'undefined'` fait donc dégrader silencieusement `emitDurable`
en `emit` volatil pour tout code serveur.

Si le process meurt entre l'émission et le traitement, l'événement est **perdu
sans rejeu possible** — alors que l'appelant croit avoir une garantie de livraison.

### Portée mesurée

```
13  routes API appelant emitDurable
 9  jobs cron appelant emitDurable
```

Cas les plus sensibles :

| Appelant | Événement | Enjeu |
|---|---|---|
| `src/app/api/haccp/log-temp/route.ts:12` | `haccp.temperature_logged` | Conformité sanitaire — relevé IoT perdu |
| `src/app/api/connectors/delivery/webhook/[provider]/route.ts:84` | `integration.delivery_order_received` | **Commande client perdue** |
| `src/app/api/connectors/delivery/webhook/[provider]/route.ts:95` | `order.cancelled` | Annulation non propagée |
| `src/app/api/crm/customers/route.ts:12` | `crm.customer_created` | Client non enregistré en aval |

> ⚠️ L'émission `crypto.integrity_failed` ajoutée cette session dans
> `FiscalAdapter.runAudit()` hérite de cette limite : `runAudit` est appelé
> côté serveur par `FiscalAuditTool` et `LegalArchiveService`.

### Correctif

Doter le serveur d'un outbox persistant — Firestore convient, la collection existe
déjà pour la DLQ :

```ts
if (typeof window !== 'undefined') {
    await db.busOutbox.put({ … });              // Dexie / IndexedDB
} else {
    await Nexus.adapter.set(                     // Firestore côté serveur
        `busOutbox/${id}`,
        { id, eventName: event, payload, createdAt: Date.now(), attempts: 0, status: 'pending' }
    );
}
```

Prévoir le rejeu serveur symétrique de `replayPendingEvents()`
(`src/lib/sync/outboxReplayer.ts`, aujourd'hui côté client uniquement).

**À défaut** — si la durabilité serveur n'est pas retenue — **renommer** la méthode
côté serveur ou journaliser explicitement la dégradation. Une API nommée `emitDurable`
qui n'est pas durable est un piège pour toute future session.

### Critère de validation

Tuer le process pendant le traitement d'un webhook livraison → l'événement doit
être rejoué au redémarrage.

---

## Chantier 16 — RBAC : échec ouvert sur action inconnue

> 🟠 **PHASE 1 LIVRÉE le 2026-08-09** — phase 2 en attente de données de production.
>
> **Un second défaut, plus grave, a été trouvé en corrigeant** : le contrôle
> d'authentification venait **après** le cas « action non déclarée ». Un utilisateur
> **non authentifié** était donc autorisé sur toute action absente de l'`ACTION_MAP`.
>
> Livré dans `src/shared/hooks/useActionPermission.ts` :
> - Le contrôle `!currentUser` est remonté **en premier** — plus aucun accès anonyme
> - Un `logger.warn` nomme chaque action non déclarée rencontrée
> - `allowed: true` **conservé** pour ne pas casser un écran en production
>
> **Phase 2 — à faire** : relever les `[RBAC] Action non déclarée` en production,
> ajouter les actions manquantes à `actionPermissionMap.ts`, puis basculer le retour
> sur `{ allowed: false, reason: 'Action non déclarée' }`.

### Le problème

`src/shared/hooks/useActionPermission.ts:24` :

```ts
if (!config) return { allowed: true, requiresPin: false };
```

Quand aucune configuration n'est trouvée pour une action, elle est **autorisée pour
tout le monde, sans PIN**. Conséquences :

- Faute de frappe dans une clé d'action → accès libre
- Nouvelle action non déclarée dans `ACTION_MAP` → accès libre
- Échec de chargement de la configuration → tout devient permis

Les deux hooks voisins échouent correctement **fermé** (`usePageAccess.ts:11` et
`useTabAccess.ts:11` : `if (!currentUser) return false;`). L'incohérence est donc
interne au module RBAC.

### Exposition actuelle

`src/shared/hooks/actionPermissionMap.ts` déclare **~250 actions**, et les 12
actions réellement demandées dans le code y figurent toutes. Le défaut n'est donc
**pas exploité aujourd'hui** — il est latent.

Vérification :

```bash
grep -rhoE "useActionPermission\(\s*['\"][a-z_]+['\"]\s*,\s*['\"][a-z_]+['\"]" src/ \
  --include="*.tsx" --include="*.ts" | grep -v test | sed "s/useActionPermission(//" | tr -d "\"' " | sort -u
```

### Correctif

```ts
if (!config) {
    logger.warn(`[RBAC] Action non déclarée dans ACTION_MAP : ${pageKey}.${actionKey} — refusée par défaut.`);
    return { allowed: false, requiresPin: false, reason: 'Action non déclarée' };
}
```

⚠️ Refuser par défaut peut casser un écran s'appuyant sur une action non déclarée.
Déployer en deux temps : **d'abord** le `logger.warn` seul (une version), relever
les actions manquantes en production, les déclarer, **ensuite** basculer sur le refus.

`useActionPermission.test.ts` fait partie des 7 fichiers en échec du chantier 1 —
le corriger en même temps.

---

## Points vérifiés et sains

Contrôlés durant l'audit, **aucun défaut trouvé**. Documentés pour éviter qu'une
future session ne refasse le travail.

| Point | Verdict |
|---|---|
| `CryptoService.signFiscalData` | ✅ Vrai HMAC-SHA256 (`node:crypto` puis repli WebCrypto), **refuse de signer sans clé**. Pas de signature factice. |
| `firestore.rules` — immuabilité NF525 | ✅ `journalEntries`, `fiscalSeals`, `fiscalLedger`, `ticketZ`, `haccpLogs`, `iotHistory` : `update`/`delete` interdits **y compris pour `fleet_admin`**. |
| `firestore.rules` — cas `fiscalMeta` | ✅ Piège anticipé et traité : le compteur séquentiel et le `chainHead` **doivent** être incrémentés à chaque vente. Une règle spécifique (lignes 95-99) réautorise `create + update` tout en gardant `delete: if false`, Firestore combinant les règles en OR. Raisonnement documenté dans le fichier. |
| `usePageAccess` / `useTabAccess` | ✅ Échouent **fermé** (`if (!currentUser) return false`). |
| Chaîne POS → NF525 | ✅ Complète et correcte : `handlePaymentComplete → finalizePayment → processPayment → FinancialNexusBridge.processOrder → FiscalSealer.sealDataAtomically → journalEntries + emitDurable('order.paid')`. |
| `DLQRetryService` | ✅ Conforme à sa documentation : scan 30 s, `MAX_ATTEMPTS = 5`, quarantaine + escalade fiscale. |

---

## Protocole de non-régression

À appliquer **systématiquement** avant de livrer un lot, tant que le chantier 1
n'est pas terminé (la suite étant rouge, seul le différentiel a du sens).

```bash
# 1. Baseline sur HEAD, sans les modifications en cours
git stash push --include-untracked -m "baseline"
npx vitest run 2>&1 | grep -E "^ FAIL" \
  | grep -oE "src/[^ ]+\.test\.tsx?|demo/[^ ]+\.test\.ts" | sort -u > /tmp/fail_before.txt
git stash pop

# 2. Avec les modifications
npx vitest run 2>&1 | grep -E "^ FAIL" \
  | grep -oE "src/[^ ]+\.test\.tsx?|demo/[^ ]+\.test\.ts" | sort -u > /tmp/fail_after.txt

# 3. Différentiel — doit être vide
echo "--- RÉGRESSIONS ---"; comm -13 /tmp/fail_before.txt /tmp/fail_after.txt
echo "--- CORRIGÉS ---";    comm -23 /tmp/fail_before.txt /tmp/fail_after.txt
```

Compléter avec :

```bash
npx tsc --noEmit                                                  # doit rester à 0
npx vitest run src/e2e/vanguard/ --config vitest.vanguard.config.ts   # doit rester 64/64
```

> 💡 `timeout` n'existe pas sur ce macOS — ne pas l'utiliser dans les scripts.
> Une exécution complète de `vitest run` prend **2 à 3 minutes**.

### Validation sur les 3 tiers

Tout correctif touchant une **écriture** (handler, route API, hook, service) doit
être vérifié sur les trois tiers, pas seulement sur un tenant client :

| Tenant | Attendu |
|---|---|
| `_test_restaurant` | Écriture réelle, comportement nominal |
| `_ref_restaurant` | Écriture **refusée proprement** — pas d'exception non gérée, pas d'entrée DLQ |
| `_demo_restaurant` | Écriture détournée vers le fork Simulacra — y compris en **accès direct par URL**, sans passer par `SplashGate` |
| `tenant_{siret}` | Comportement nominal, inchangé |

Le tier d'un tenant se lit avec `getSystemTenantTier(tenantId)` et son droit
d'écriture avec `isWritable(tenantId)` (`src/lib/mcc/SystemTenantRegistry.ts`).

---

## Pièges rencontrés — à ne pas refaire

| Piège | Détail |
|---|---|
| **Cycle d'import via `VerticalRegistry`** | Importer statiquement `VerticalRegistry` dans `NexusSyncService` referme le cycle `NexusSyncService → VerticalRegistry → RestaurantVertical → … → NexusSyncService`. `RestaurantVertical` reste partiellement initialisée et **ses handlers ne s'enregistrent plus** (`restaurant-vertical.test.ts` passe de 15/15 à 6/15). Utiliser un `import()` dynamique dans `init()`. |
| **`registerHandlers.ts` n'est pas le registre** | C'est un simple `export * from './registerHandlers/index'`. Le vrai registre est le **répertoire** `src/shared/eventBus/registerHandlers/` (16 fichiers). Chercher dans le fichier donne un faux négatif à 100 %. |
| **Fuzzy matching des noms d'événements** | Rapprocher un handler orphelin d'un événement émis par similarité de chaîne produit des non-sens (`mcc.feature_flag_toggled ≈ haccp.temperature_logged`). Classifier sur le **contenu** du handler, jamais sur le nom. |
| **`toMicrounits` n'était qu'un cast** | Avant correction : `val as Microunits`. `CLAUDE.md` promettait une garantie que le code n'offrait pas. Désormais l'invariant est appliqué (dev/test lève, prod normalise + journalise). |
| **Un fichier `D` en `git status`** | Sur ce repo en rapatriement, un fichier supprimé est souvent un **déplacement**. Vérifier par `grep` dans `src/` avant de conclure à une disparition. |
| **Valider sur un seul tenant** | Un correctif d'écriture validé sur un tenant client peut lever sur `_ref_*` et se comporter autrement sur `_demo_*`. Toujours les 3 tiers — voir le protocole de non-régression. |
| **`throw err` ajouté aux handlers** | Correct sur le fond (la DLQ voit enfin les échecs), mais rend visible l'absence de tier-awareness : sur `_ref_*` chaque handler écrivain part désormais en quarantaine. Ne pas revenir sur le `throw` — traiter le chantier 13. |

---

## Ordre d'exécution recommandé

```
✅ FAIT ── Chantier 14 ── tenantOverride + propriété des snapshots (commit 2acb5dab9)
✅ FAIT ── Chantier 16 phase 1 ── accès anonyme RBAC fermé (commit 2acb5dab9)

── Sécurité / intégrité (avant toute mise en production) ──
1. Chantier 1  ── 292 tests (débloque la détection de régression)
2. Chantier 13 ── handlers tier-aware (stoppe l'inondation DLQ sur _ref_/_demo_)
      ↓
── Rapides, valeur immédiate ──
3. Chantier 5  ── log NF525 (5 min)
4. Chantier 12 ── sessions.md (2 min)
      ↓
── Fiabilité ──
5. Chantier 15 ── emitDurable serveur (perte d'événements métier)
6. Chantier 3  ── StockTransferHandler (cross-tenant, aggravé par le tiering)
7. Chantier 4  ── événements orphelins prioritaires (allergènes, caisse, HACCP)
      ↓
── Qualité ──
8. Chantier 6  ── catch silencieux (passe mécanique)
9. Chantier 7  ── WasteManagementHACCP
10. Chantier 11 ── ICM TaskContext
11. Chantier 16 phase 2 ── RBAC refus par défaut (après relevé des warns en prod)
      ↓
── Décisions produit ──
12. Chantier 2  ── 54 handlers (par domaine)
13. Chantier 8  ── routes API
14. Chantier 9  ── composants inutilisés (voir PLAN_IMPLEMENTATION_UI.md)
15. Chantier 10 ── routes hors navigation
```

**Pourquoi 1 et 13 d'abord** : le chantier 1 rend les régressions détectables, le
chantier 13 arrête la pollution de la DLQ. Sans eux, tout travail ultérieur avance
à l'aveugle et génère du bruit d'alerte qui masque les vrais incidents.

---

## Invariants à ne jamais violer

Rappel de `CLAUDE.md` — s'applique à tous les chantiers ci-dessus.

| Règle | Portée |
|---|---|
| `journalEntries`, `fiscalSeals`, `fiscalLedger` : **jamais `delete`, jamais `update`** | NF525 |
| `SovereignGuard` : barrière cross-tenant, **ne jamais contourner** | Multi-tenant |
| Toute écriture Nexus : chemin `tenants/{tenantId}/{collection}/{id}` | Multi-tenant |
| `tenantId` = `activeTenantId` depuis `useTenant()` — **jamais codé en dur** | Multi-tenant |
| Monnaie en microunités (`*InMicrounits`), cast via `toMicrounits()` | Finance |
| Import uniquement depuis le barrel racine `@/modules/<pilier>` | Architecture |
| Tout nouveau code d'un pilier va dans `src/modules/<pilier>/` | Architecture |
| **Ne jamais `git push`** — migration GitLab en cours, commits locaux uniquement | Process |
| S'inscrire dans `.claude/sessions.md` avant toute action | Process |
