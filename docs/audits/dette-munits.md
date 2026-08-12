# Dette technique : Migration `*InCents` → `*InMicrounits`

> Généré le 2026-07-23 — 569 occurrences dans 138 fichiers.

## Priorité 1 — Contrats & schémas (propagation maximale)

Ces fichiers définissent les types que tout le reste consomme. Les migrer d'abord maximise l'impact.

| Fichier | Occ. | Notes |
|---------|------|-------|
| `src/shared/nexus/contracts/finance.types.ts` | 48 | Type racine finance, touche tout le pilier |
| `src/shared/nexus/contracts/logistics.ts` | 11 | Types stocks/procurement |
| `src/shared/nexus/contracts/commerce.types.ts` | 6 | Types commerce/commandes |
| `src/shared/nexus/contracts/marketing.types.ts` | 6 | Types CRM/marketing |
| `src/shared/nexus/contracts/common.types.ts` | 3 | `priceModifierInCents` |
| `src/shared/nexus/contracts/customer.types.ts` | 2 | Dépenses client |
| `src/shared/nexus/contracts/ops.types.ts` | 2 | Types ops |
| `src/shared/nexus/contracts/domain.types.ts` | 2 | Types domaine |
| `src/shared/nexus/contracts/hr.types.ts` | 1 | Types RH |
| `src/domain/schemas/finance.ts` | 4 | Schéma Zod JournalEntry |
| `src/domain/schemas/orders.ts` | 3 | Schéma Zod commandes |
| `src/domain/schemas/commerce.ts` | 2 | Schéma Zod commerce |
| `src/modules/ops/engine/types.ts` | 4 | CartItem ops |
| `src/modules/ops/engine/groups.types.ts` | 1 | Types groupes |
| `src/modules/ops/engine/tables.types.ts` | 2 | Types tables |

## Priorité 2 — Services finance & comptabilité (logique métier critique)

| Fichier | Occ. |
|---------|------|
| `src/domain/services/SovereignLedger.ts` | 21 |
| `src/modules/finance/hooks/useAccounting.ts` | 27 |
| `src/modules/finance/billing/domain/InvoiceEngine.ts` | 10 |
| `src/modules/finance/accounting/domain/AccountingService.ts` | 9 |
| `src/modules/finance/accounting/domain/PayrollAccountingMapper.ts` | 8 |
| `src/modules/finance/services/FiscalHACCPMapper.ts` | 6 |
| `src/modules/finance/services/NF525Service.ts` | 3 |
| `src/modules/finance/accounting/domain/FECExporter.ts` | 4 |
| `src/modules/finance/accounting/domain/StatementIngestionService.ts` | 2 |
| `src/modules/finance/domain/utils/taxCalc.ts` | 5 |
| `src/domain/finance/billing/CronosBillingEngine.ts` | 4 |
| `src/domain/finance/billing/types.ts` | 4 |
| `src/domain/finance/fec/FECMapper.ts` | 4 |
| `src/domain/finance/payout/SovereignPayout.ts` | 6 |
| `src/domain/finance/payout/types.ts` | 3 |
| `src/domain/finance/tax/EDIMapper.ts` | 3 |
| `src/domain/finance/tax/FiscalTransmitter.ts` | 3 |
| `src/domain/finance/tax/types.ts` | 3 |
| `src/domain/finance/banking/FinancialNexusBridge.ts` | 4 |
| `src/domain/finance/banking/types.ts` | 4 |
| `src/domain/services/AccountingReportService.ts` | 6 |
| `src/domain/services/TreasuryCalculator.ts` | 6 |
| `src/domain/services/TransactionService.ts` | 4 |
| `src/infrastructure/adapters/FinancialNexusBridge.ts` | 4 |
| `src/infrastructure/adapters/LedgerAdapter.ts` | 3 |

## Priorité 3 — POS & commerce (flux client)

| Fichier | Occ. |
|---------|------|
| `src/modules/ops/pos/hooks/usePos.ts` | 4 |
| `src/modules/ops/pos/components/Cart.tsx` | 8 |
| `src/modules/ops/pos/components/ProductDetailsDialog.tsx` | 2 |
| `src/modules/commerce/ui/pos/VoidModal.tsx` | 6 |
| `src/domain/services/SplitBillDomainService.ts` | 8 |
| `src/app/(client)/(ops)/pos/page.tsx` | 4 |
| `src/components/modals/ProductFormModal.tsx` | 9 |
| `src/components/modals/product-form/ProductFinancials.tsx` | 6 |

## Priorité 4 — Paiement terminal (adapters)

| Fichier | Occ. |
|---------|------|
| `src/lib/payment-terminal/adapters/SundayAdapter.ts` | 8 |
| `src/lib/payment-terminal/adapters/StripeTerminalAdapter.ts` | 4 |
| `src/lib/payment-terminal/adapters/SquareAdapter.ts` | 3 |
| `src/lib/payment-terminal/adapters/AdyenAdapter.ts` | 4 |
| `src/lib/payment-terminal/adapters/ConecsAdapter.ts` | 3 |
| `src/lib/payment-terminal/adapters/IngenicoDirectAdapter.ts` | 4 |
| `src/lib/payment-terminal/adapters/LyfPayAdapter.ts` | 3 |
| `src/lib/payment-terminal/adapters/PayGreenAdapter.ts` | 3 |
| `src/lib/payment-terminal/adapters/VerifoneAdapter.ts` | 3 |
| `src/lib/payment-terminal/adapters/WorldlineAdapter.ts` | 3 |
| `src/lib/payment-terminal/adapters/ZettleAdapter.ts` | 3 |

## Priorité 5 — UI & vues (propagation après types)

| Fichier | Occ. |
|---------|------|
| `src/modules/finance/components/accounting/views/SimpleDashboardView.tsx` | 7 |
| `src/modules/finance/components/accounting/views/GeneralLedgerView.tsx` | 7 |
| `src/modules/finance/components/accounting/views/BalanceSheetView.tsx` | 6 |
| `src/modules/finance/components/accounting/views/ProfitLossView.tsx` | 4 |
| `src/modules/finance/components/accounting/views/JournalEntriesView.tsx` | 4 |
| `src/modules/ops/kitchen/components/tabs/MarginsTab.tsx` | 7 |
| `src/modules/ops/kitchen/components/RecipeDetailDialog.tsx` | 2 |
| `src/modules/ops/kitchen/components/recipe-editor/RecipeCompositionTab.tsx` | 3 |
| `src/app/(client)/(ops)/finance/page.tsx` | 7 |
| `src/app/(client)/(ops)/analytics/page.tsx` | 4 |
| `src/app/(client)/(ops)/kds/components/KDSTicket.tsx` | 3 |
| `src/components/crm/BasketAnalysis.tsx` | 4 |
| `src/components/crm/RFMSegmentation.tsx` | 4 |
| `src/components/crm/VisitHistory.tsx` | 3 |

## Priorité 6 — Logistics, procurement, marketing, reste

| Fichier | Occ. |
|---------|------|
| `src/modules/logistics/inventory/services/inventory-service.ts` | 9 |
| `src/modules/logistics/inventory/types.ts` | 4 |
| `src/modules/logistics/inventory/store/inventoryAtoms.ts` | 3 |
| `src/modules/logistics/inventory/hooks/inventoryMappers.ts` | 4 |
| `src/modules/logistics/inventory/components/inventory/*` | ~10 |
| `src/modules/commerce/marketing/quotes.types.ts` | 9 |
| `src/modules/commerce/marketing/components/quotes/NewQuoteDialog.tsx` | 7 |
| `src/modules/commerce/marketing/components/crm/*` | ~6 |
| `src/modules/commerce/marketing/store/analyticsAtoms.ts` | 2 |
| `src/modules/commerce/customers/components/*` | ~6 |
| `src/domain/procurement/types.ts` | 4 |
| `src/domain/procurement/ProcurementBridge.ts` | 4 |
| `src/domain/services/ProcurementService.ts` | 3 |
| `src/domain/services/StockEngine.ts` | 4 |
| `src/modules/human/hr/types.ts` | 1 |

## Priorité 7 — Utilitaires, AI, tests

| Fichier | Occ. |
|---------|------|
| `src/lib/formatters.ts` | 4 |
| `src/lib/shared-kernel.ts` | 4 |
| `src/lib/audit.ts` | 2 |
| `src/lib/quotes-service.ts` | 8 |
| `src/lib/reports/weeklyReport.ts` | 2 |
| `src/lib/mock-data.ts` | 4 |
| `src/lib/RuntimeValidator.ts` | 2 |
| `src/lib/sovereign/firestoreHydrator.ts` | 2 |
| `src/lib/migration/CustomerCSVImporter.ts` | 1 |
| `src/lib/events/handlers/TicketZHandler.ts` | 2 |
| `src/domain/agent/tools/FinanceTool.ts` | 4 |
| `src/domain/agent/tools/MenuTool.ts` | 3 |
| `src/domain/agents/MonkeyChaos.ts` | 3 |
| `src/domain/agents/MonkeyChaosAgent.ts` | 3 |
| `src/domain/services/ChaosMonkey.ts` | 4 |
| `src/domain/services/KitchenService.ts` | 2 |
| `src/domain/services/InventoryVisionService.ts` | 2 |
| `src/domain/services/OracleEngine.ts` | 2 |
| `src/domain/services/Slayer.ts` | 1 |
| `src/domain/services/StaffService.ts` | 1 |
| `src/domain/services/TenantSeeder.ts` | 2 |
| `src/domain/services/ZKBenchmarkEngine.ts` | 1 |
| `src/modules/intelligence/migration/AirlockPipeline.ts` | 7 |
| `src/modules/intelligence/migration/types.ts` | 3 |
| `src/modules/intelligence/rag/HermesKnowledgeManager.ts` | 2 |
| `src/modules/intelligence/rag/PulseSanitizer.ts` | 1 |
| `src/modules/compliance/haccp/types/domain.ts` | 1 |
| `src/shared/nexus/engines/internal/SchemaRegistry.ts` | 3 |
| `src/shared/services/SovereignMath.ts` | 2 |
| `src/engines/Simulacra/SinfoniaGradeXProof.ts` | 1 |

## Ordre de sortie recommandé

1. **Contrats** (`shared/nexus/contracts/`) — les types racines, changement = cascade automatique tsc
2. **Schémas Zod** (`domain/schemas/`) — validation runtime
3. **Finance pilier** (`modules/finance/`) — le plus gros volume (27+10+9+8…)
4. **POS + commerce** (`modules/ops/pos/`, `modules/commerce/`) — flux client
5. **Payment adapters** (`lib/payment-terminal/`) — mécanique, ×10000 uniforme
6. **Logistics + procurement** — volume moyen
7. **UI views** — derniers car propagation descendante
8. **Utilitaires** — formatters, mock-data, AI tools

> **Note** : `usePos.ts` est le bridge legacy cents→µunits principal — le traiter avec le lot POS.
