# Plan de corrections — Vertical Restaurant
> Basé sur AUDIT_VERTICAL_RESTAURANT.md · 2026-08-07
> Ordre d'exécution : P0 → P1 → P2

---

## P0 — Bloquants production (à faire en premier, dans cet ordre)

### P0-1 · Supprimer les 7 boucles infinies

**Fichier** : `src/verticals/restaurant/RestaurantVertical.ts`

**Problème** : 7 handlers écoutent un event X et appellent un adapter qui ré-émet le même event X.

**Règle de correction** : un handler dans la vertical ne doit jamais ré-émettre l'event qu'il vient de recevoir. Il doit soit :
- Appeler un service directement (ex: `FiscalSealer.seal()`)
- Émettre un event **différent** en aval (ex: écouter `order.placed` → émettre `finance.order_sealed`)

**Corrections par boucle** :

| Ligne | Event écouté | Action correcte |
|-------|-------------|-----------------|
| 50 | `table.released` | Notifier le plan de salle via `FloorPlanService.releaseTable(tableId)` directement — pas via event |
| 57 | `reservation.confirmed` | Émettre `kitchen.prep_task_created` (event différent) via `RestaurantOpsAdapter` |
| 73 | `finance.z_report_requested` | Appeler `TicketZHandler.closeTicketZForDay()` directement |
| 81 | `sensor.temperature_anomaly` | Émettre `compliance.alert_created` (event différent) |
| 92 | `hr.shift_started` | Émettre `hr.shift_acknowledged` (event différent) ou rien |
| 100 | `dlc.expired` | Émettre `logistics.dlc_alert_sent` (event différent) |
| 108 | `intelligence.menu_engineering_requested` | Appeler `MenuEngineeringService.compute()` directement |

---

### P0-2 · Ajouter un circuit-breaker sur NexusEventBus

**Fichier** : `src/shared/eventBus/NexusEventBus.ts`

**Problème** : aucune protection contre les boucles d'events — une émission récursive consomme toute la mémoire.

**Solution** : ajouter un `Set<string>` d'events en cours de traitement dans le call stack courant.

```typescript
// Dans NexusEventBus.emit() :
const inFlight = new Set<string>()

function emit(event: string, payload: unknown) {
  const key = `${event}:${JSON.stringify(payload)}`
  if (inFlight.has(event)) {
    logger.warn(`[NexusEventBus] Boucle détectée sur "${event}" — émission bloquée`)
    return
  }
  inFlight.add(event)
  try {
    // dispatch aux handlers...
  } finally {
    inFlight.delete(event)
  }
}
```

---

### P0-3 · Brancher `finance.order_sealed` → handler NF525

**Fichiers** :
- `src/shared/eventBus/handlers/` → créer `OrderSealedNF525Handler.ts`
- `src/shared/eventBus/handlers/registerHandlers.ts` → enregistrer le nouveau handler

**Problème** : `RestaurantFinanceAdapter.emitOrderFiscalSeal()` émet `finance.order_sealed` mais aucun handler ne le consomme. La chaîne NF525 via la vertical est morte.

**Solution** : créer un handler qui consomme `finance.order_sealed` et appelle `FiscalSealer.sealDataAtomically()`.

```typescript
// OrderSealedNF525Handler.ts
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus'
import { FiscalSealer } from '@/modules/finance/fiscalite/tax'

export function registerOrderSealedNF525Handler() {
  NexusEventBus.on('finance.order_sealed', async (payload) => {
    const { tenantId, orderId, totalInMicrounits, operatorId } = payload
    await FiscalSealer.sealDataAtomically({
      tenantId,
      orderId,
      totalInMicrounits,
      operatorId,
      sealedAt: new Date().toISOString(),
    })
  })
}
```

**Ajouter dans `registerHandlers.ts`** :
```typescript
import { registerOrderSealedNF525Handler } from './OrderSealedNF525Handler'
registerOrderSealedNF525Handler()
```

---

### P0-4 · Brancher `inventory.deducted` → handler stock

**Fichiers** :
- Handler existant dans `src/shared/eventBus/handlers/` (écoute `order.paid` — mauvais nom)
- `src/verticals/restaurant/adapters/RestaurantLogisticsAdapter.ts`

**Problème** : `RestaurantLogisticsAdapter.emitStockDeducted()` émet `inventory.deducted` mais le handler de déduction stock écoute `order.paid`. Les deux parlent de choses différentes.

**Décision d'architecture** : deux options.

**Option A** (recommandée) — aligner les noms, un seul event :
- Le POS émet `order.paid` à la validation de commande
- Le handler stock écoute `order.paid` et déduit le stock → **garder tel quel, supprimer `inventory.deducted`**
- `RestaurantLogisticsAdapter.emitStockDeducted()` devient `emitOrderPaid()` et émet `order.paid`

**Option B** — deux events distincts avec responsabilités séparées :
- `order.paid` → déclenche la déduction
- La déduction réussie émet `inventory.deducted` → handler analytics/alertes stock bas
- Créer un `InventoryDeductedHandler` qui écoute `inventory.deducted` pour les alertes

→ **Choisir Option A si la déduction est toujours liée au paiement. Option B si la déduction peut arriver sans paiement (perte, dégustation, inventaire).**

---

### P0-5 · Importer `RestaurantFacilityAdapter` dans la vertical

**Fichier** : `src/verticals/restaurant/RestaurantVertical.ts`

**Problème** : `RestaurantFacilityAdapter` est dans `adapters/index.ts` mais absent des imports de la vertical — floor plan et maintenance n'émettent jamais depuis la vertical.

**Correction** :
```typescript
// Ajouter dans les imports :
import { RestaurantFacilityAdapter } from './adapters'

// Ajouter dans initialize() :
context.registerEventHandler('floor_plan.table_moved', ({ tenantId, tableId, x, y }) => {
  RestaurantFacilityAdapter.emitTableLayoutChanged({ tenantId, tableId, newX: x, newY: y })
})

context.registerEventHandler('maintenance.issue_reported', ({ tenantId, assetId, description }) => {
  RestaurantFacilityAdapter.emitMaintenanceRequired({ tenantId, assetId, description, reportedAt: new Date().toISOString() })
})
```

---

## P1 — Fonctionnellement silencieux

### P1-1 · Ajouter `/intelligence` dans l'ICM

**Fichier** : `src/lib/icm/TaskContext.ts`

**Problème** : `/intelligence` absent des `ROUTE_SEGMENTS` → `resolveTaskContext('/intelligence')` retourne `TASK_MAPS.default` avec `intelligence: 'OFF'` → les modules LLM ne s'initialisent jamais.

**Correction** : ajouter dans `ROUTE_SEGMENTS` :
```typescript
['/intelligence', 'intelligence'],
```

Et créer la task map `TASK_MAPS.intelligence` :
```typescript
intelligence: {
  taskId: 'intelligence',
  modules: {
    intelligence: 'HIGH',
    analytics:    'MEDIUM',
    orders:       'LOW',
  }
}
```

---

### P1-2 · Corriger les 3 events aux mauvais handlers

**Problème** : noms d'events divergents entre les adapters et les handlers.

| Adapter émet | Handler écoute | Correction |
|-------------|---------------|------------|
| `hr.overtime_alert` | `hr.shift_ended` | Changer le handler pour écouter `hr.overtime_alert` OU changer l'adapter pour émettre `hr.shift_ended` |
| `inventory.deducted` | `order.paid` | Voir P0-4 |
| `crm.rfm_trigger` | `crm.points_earned` | Changer le handler pour écouter `crm.rfm_trigger` OU renommer l'event adapter |

**Règle** : toujours aligner sur le nom le plus sémantiquement correct. `crm.rfm_trigger` est plus précis que `crm.points_earned` — changer le handler.

---

### P1-3 · Brancher les dead events analytics/KDS/tip

Créer les handlers manquants :

| Event | Handler à créer | Action |
|-------|----------------|--------|
| `analytics.sales_data_ready` | `SalesDataReadyHandler.ts` | Pousser vers le pipeline BI / `intelligenceAtom` |
| `analytics.anomaly_detected` | `AnomalyDetectedHandler.ts` | Notifier le MCC (`mcc.anomaly_alert`) |
| `kds.course_passed` | `KdsCoursePassedHandler.ts` | Mettre à jour le statut de l'order |
| `hr.tip_distributed` | `TipDistributedHandler.ts` | Persister la distribution dans Nexus |

---

### P1-4 · Brancher `registerRbacConfig()` dans la vertical

**Fichier** : `src/verticals/restaurant/RestaurantVertical.ts`

**Problème** : le RBAC restaurant (`DEFAULT_PAGE_ACCESS`, `DEFAULT_TAB_ACCESS`) est défini dans `domain/schemas/rbac.ts` comme constante statique mais n'est jamais injecté dans Nexus via `registerRbacConfig()`.

**Correction** :
```typescript
// Dans initialize() :
context.registerRbacConfig({
  version: 1,
  pageOverrides:   DEFAULT_PAGE_ACCESS,
  tabOverrides:    DEFAULT_TAB_ACCESS,
  actionOverrides: DEFAULT_ACTION_ACCESS,
})
```

Et dans `ProvisioningEngine.ts`, remplacer :
```typescript
// Avant :
const defaultRbac = TenantRBACConfigSchema.parse({})

// Après :
const defaultRbac = TenantRBACConfigSchema.parse({
  pageOverrides:   DEFAULT_PAGE_ACCESS,
  tabOverrides:    DEFAULT_TAB_ACCESS,
})
```

---

### P1-5 · Activer `pos-to-fiscal.test.ts`

**Fichier** : `src/__tests__/integration/pos-to-fiscal.test.ts`

**Action** : retirer `describe.skip(...)` → `describe(...)`. Si le test échoue, c'est un signal de bug à corriger, pas à ignorer.

---

### P1-6 · Écrire les tests manquants

**Fichiers à créer** :
```
src/__tests__/verticals/restaurant/RestaurantVertical.test.ts
src/__tests__/verticals/restaurant/adapters/RestaurantFinanceAdapter.test.ts
src/__tests__/verticals/restaurant/adapters/RestaurantOpsAdapter.test.ts
src/__tests__/verticals/restaurant/adapters/RestaurantLogisticsAdapter.test.ts
```

**Tests prioritaires** :
1. Vérifier qu'aucune boucle infinie n'est déclenchée (`table.released`, `reservation.confirmed`, etc.)
2. Vérifier que `finance.order_sealed` a bien un handler enregistré
3. Vérifier que `RestaurantFacilityAdapter` est bien importé et ses méthodes appellables
4. Vérifier que `initialize()` enregistre > 3 routes

---

## P2 — Lisibilité et maintenabilité

### P2-1 · Corriger l'incohérence DNA / ProvisioningEngine

**Fichier** : `src/lib/ProvisioningEngine.ts`

**Correction** : remplacer `bar: false` hardcodé par la valeur du DNA :
```typescript
bar: dna.capabilities?.mod_bar ?? false,
```

---

### P2-2 · Ajouter `/menu-builder`, `/leaves`, `/welcome-staff` dans l'ICM

**Fichier** : `src/lib/icm/TaskContext.ts`

Ajouter dans `ROUTE_SEGMENTS` :
```typescript
['/menu-builder',    'menu_builder'],
['/leaves',          'leaves'],
['/welcome-staff',   'welcome_staff'],
```

Et créer les task maps correspondantes.

---

### P2-3 · Nettoyer les capabilities orphelines du DNA

**Fichier** : `src/shared/seeds/restaurant-full-dna.ts`

`mod_omnichannel`, `mod_pms`, `mod_agent_dashboard`, `mod_fleet_management` → soit ajouter leur `requiredCapability` dans navConfig, soit les retirer du DNA si les features n'existent pas encore.

---

### P2-4 · Seeder des produits par défaut

**Fichier** : `src/lib/TenantSeeder.ts`

Un restaurant créé doit avoir au minimum une carte de démonstration (5-10 produits, 3 catégories) pour que le POS soit immédiatement utilisable.

```typescript
// Dans TenantSeeder.seed() après les tables :
await seedDemoMenu(tenantId, variant) // depuis src/shared/seeds/demo-menu/
```

---

### P2-5 · Implémenter ou supprimer `VerticalRoute[]`

**Fichier** : `src/shared/plugins/IVerticalPlugin.ts`

`routes?: VerticalRoute[]` est défini dans l'interface mais jamais utilisé par aucune vertical.

**Option A** : l'implémenter dans `RestaurantVertical` (label, icon, roles par route) et s'en servir dans navConfig pour remplacer les entrées hardcodées.
**Option B** : supprimer la propriété de l'interface si elle est morte.

---

## Ordre d'exécution suggéré

```
Jour 1 (matin)   P0-2  Circuit-breaker NexusEventBus
Jour 1 (matin)   P0-1  Corriger les 7 boucles infinies
Jour 1 (après)   P0-3  Handler finance.order_sealed → NF525
Jour 1 (après)   P0-4  Décision + fix inventory.deducted
Jour 1 (après)   P0-5  Import RestaurantFacilityAdapter

Jour 2 (matin)   P1-5  Activer pos-to-fiscal.test.ts
Jour 2 (matin)   P1-6  Tests RestaurantVertical + adapters
Jour 2 (après)   P1-1  ICM /intelligence
Jour 2 (après)   P1-2  Corriger les 3 mauvais noms d'events
Jour 2 (après)   P1-3  Handlers analytics/KDS/tip

Jour 3           P1-4  registerRbacConfig() dans la vertical
Jour 3           P2-1  Fix bar:false hardcodé
Jour 3           P2-2  ICM /menu-builder /leaves /welcome-staff
Jour 3           P2-3  Capabilities orphelines DNA
Jour 3           P2-4  Seeder produits par défaut
```

**Validation après chaque jour** :
```bash
npx tsc --noEmit
npx vitest run
./scripts/preflight.sh
```

---

*Plan basé sur AUDIT_VERTICAL_RESTAURANT.md · Session restaurant-vertical-audit · 2026-08-07*
