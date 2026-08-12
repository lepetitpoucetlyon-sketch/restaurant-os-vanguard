# Plan Cleanup Final — 2026-08-06

> Exécution séquentielle sans arrêt.  
> ✅ = terminé · 🔄 = en cours · ✅ = à faire

---

## Bloc A — RBAC : 3 gaps de câblage

| # | Tâche | Fichier(s) | Statut |
|---|-------|-----------|--------|
| A1 | `fetchRbacConfigAtom` appelé dans `switchTenant` au boot | `useNexusTenantLogic.ts` | ✅ |
| A2 | `registerRbacConfig()` dans `ICoreContext` + `CoreContext.ts` | `IVerticalPlugin.ts`, `CoreContext.ts` | ✅ |
| A3 | RBAC seeding dans `ProvisioningEngine.provisionNewInstance()` | `ProvisioningEngine.ts` | ✅ |

### Détail A1
- `switchTenant` dans `useNexusTenantLogic.ts` appelle `NexusTelemetryEngine.initSession` mais jamais `fetchRbacConfigAtom`
- Ajouter `const fetchRbac = useSetAtom(fetchRbacConfigAtom)` + appel dans `switchTenant` après `setGlobalTenantConfig`

### Détail A2
- `ICoreContext` n'a pas de `registerRbacConfig(config: TenantRBACConfig): void`
- `CoreContext.ts` n'implémente donc pas ce contrat
- Ajouter méthode : stocke la config et appelle `set(rbacConfigAtom, config)` via Nexus

### Détail A3  
- `ProvisioningEngine` (étape 3 seed) ne seede pas `tenants/{key}/config/rbac`
- Ajouter étape : lire les défauts `TenantRBACConfigSchema.parse({})`, persister dans Firestore

---

## Bloc B — engines/ état

| # | Tâche | Fichier(s) | Statut |
|---|-------|-----------|--------|
| B1 | Vérifier `shared/nexus/engines/` — 3 fichiers cross-pillar OK ou à déplacer ? | `DomainRegistry.ts`, `MutationValidator.ts`, `NexusTelemetryEngine.ts` | ✅ |

> **Conclusion B** : Les 3 fichiers sont déjà dans `shared/nexus/engines/` (infrastructure Nexus cross-cutting, importés par ops/finance/logistics/intelligence). Ce n'est pas une violation — ils ne peuvent pas être dans un pilier spécifique. Rien à faire.

---

## Bloc C — SAGA coverage : 15 handlers critiques

124 handlers, 0 tests. Objectif : écrire les tests pour les 15 handlers les plus critiques (chemin revenu + NF525 + compliance + sécurité).

| # | Handler | Événement | Statut |
|---|---------|-----------|--------|
| C01 | `TicketZHandler` | `order.paid` → agrégat Z + table released | ✅ |
| C02 | `StockDeductionHandler` | `order.paid` → BOM expansion + déduction 1:1 | ✅ |
| C03 | `StockReceptionHandler` | `stock.reception_validated` → update stock | ✅ |
| C04 | `CertExpiryHandler` | `compliance.cert_expiry` → alerte + audit | ✅ |
| C05 | `ComplianceCalendarHandler` | `compliance.calendar_due` → rappel | ✅ |
| C06 | `DLCExpiryHandler` | `dlc.expired` → blocage + notif | ✅ |
| C07 | `SupplierInvoiceLedgerHandler` | `invoice.received` → écriture comptable | ✅ |
| C08 | `CompJournalHandler` | `comp.created` → journal | ✅ |
| C09 | `SovereignBreachHandler` | `security.breach` → alert + lock | ✅ |
| C10 | `CryptoIntegrityCheckHandler` | `fiscal.integrity_check` → hash verify | ✅ |
| C11 | `CustomerRFMAnalyzerHandler` | `customer.scored` → segment update | ✅ |
| C12 | `ReservationNotifierHandler` | `reservation.confirmed` → notify | ✅ |
| C13 | `StockAlertHandler` | `stock.below_threshold` → alerte | ✅ |
| C14 | `WasteValidatedHandler` | `waste.validated` → déduction + audit | ✅ |
| C15 | `TableAutoReleaseHandler` | `table.auto_release` → libération | ✅ |

---

## Résumé final

- Bloc A : 3 items RBAC
- Bloc B : 0 action (déjà en ordre)
- Bloc C : 15 tests SAGA
- **Total : 18 items**

Commit à la fin de chaque bloc.
