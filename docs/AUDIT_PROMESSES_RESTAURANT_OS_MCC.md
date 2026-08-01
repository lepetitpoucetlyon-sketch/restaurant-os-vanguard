# Audit des promesses — Restaurant OS + MCC

Date d'audit : 2026-08-01  
Commit local audité : `8362ff337`  
Mode : scans déterministes + lectures ciblées des chemins critiques. `graphify-out/GRAPH_REPORT.md` existe, mais il est construit sur `87542410`; il a donc servi de repère de corpus, pas de preuve courante.

## Résumé exécutif

- Total éléments audités : 377
- OK : 146 (38,7%)
- PARTIAL : 112 (29,7%)
- STUB : 26 (6,9%)
- MISSING : 8 (2,1%)
- BROKEN : 5 (1,3%)
- DEAD : 1 (0,3%)
- VIOLATION : 79 (21,0%)

Verdict : le socle critique compile (`npx tsc --noEmit` : 0 erreur) et les flux NF525 principaux sont bien plus matures que le reste : `FinancialNexusBridge`, `FiscalSealer`, `FiscalAdapter` et `SovereignGuard` contiennent une logique réelle de double-écriture, scellement, hash chain, numérotation séquentielle et isolation tenant. En revanche, la promesse "tête détachable + connecteurs plug-and-play + MCC production-grade" reste partielle : plusieurs factories n'ont pas de `ping()`, pas de catalogue client-safe, ni de registration dynamique; le core/shared importe encore des modules restaurant; le MCC contient encore des chemins simulés ou dépendants d'env vars absentes.

## Phase 1 — Cartographie

### Corpus

| Zone | Volume observé |
|---|---:|
| Fichiers TS/TSX sous `src/` | 1879 |
| Fichiers TS/TSX sous `src/modules/` | 802 |
| Routes API `src/app/api/**/route.ts(x)` | 143 |
| Handlers `src/shared/eventBus/handlers/` | 93 |
| Schémas Zod `src/domain/schemas/` | 30 |
| Panneaux MCC `src/shared/nexus/guards/admin/mcc/` | 30 |

### Piliers

| Pilier | Sous-modules observés | Fichiers | Hooks | UI | Services | Stores | Exports barrel | État |
|---|---|---:|---:|---:|---:|---:|---:|---|
| ops | `bar`, `connectors`, `constants`, `engine`, `frontdesk`, `kds`, `kitchen`, `pos`, `printers`, `providers`, `recipes`, `types` | 143 | 15 | 82 | 10 | 5 | 14 | PARTIAL |
| commerce | `connectors`, `crm`, `customers`, `delivery`, `landing`, `loyalty`, `marketing`, `quotes`, `reservations`, `seo`, `ui`, `widgets` | 155 | 7 | 78 | 19 | 6 | 13 | PARTIAL |
| compliance | `audit`, `calendar`, `connectors`, `donation`, `haccp`, `iot`, `recall`, `rgpd`, `services`, `types` | 99 | 10 | 43 | 18 | 3 | 15 | PARTIAL |
| finance | `accounting`, `analytics`, `ap`, `banking`, `billing`, `collection`, `components`, `connectors`, `documents`, `domain`, `fec`, `hooks`, `migration`, `payout`, `providers`, `repositories`, `services`, `store`, `tax`, `types` | 136 | 8 | 22 | 29 | 2 | 17 | OK/PARTIAL |
| human | `connectors`, `hr`, `payroll`, `services` | 79 | 6 | 24 | 15 | 4 | 8 | PARTIAL |
| intelligence | `agency`, `ai`, `analytics`, `anomaly`, `attendance`, `connectors`, `domain`, `fleet`, `migration`, `rag`, `reports`, `resilience`, `services`, `simulator`, `tools` | 97 | 1 | 13 | 10 | 2 | 9 | PARTIAL |
| logistics | `connectors`, `domain`, `hooks`, `inventory`, `migration`, `reception`, `services` | 55 | 11 | 17 | 9 | 2 | 7 | PARTIAL |

### Connectors & factories

| Factory | Providers concrets | Catalogue | `register()` | `ping()` | Statut |
|---|---:|---|---|---|---|
| `PayrollConnectorFactory` | 2 | oui | oui | oui | OK |
| `RecruitmentProviderFactory` | 1 | non | non | non | PARTIAL |
| `TimeclockProviderFactory` | 2 | non | non | non | PARTIAL |
| `DeliveryProviderFactory` | 2 | non | non | non | PARTIAL |
| `ReservationProviderFactory` | 2 | non | non | non | PARTIAL |
| `ReviewProviderFactory` | 1 | non | non | non | PARTIAL |
| `EmailMarketingProviderFactory` | 2 | non | non | non | PARTIAL |
| `AccountingProviderFactory` | 1 | non | non | non | PARTIAL |
| `PaymentProviderFactory` | 1 | non | non | non | PARTIAL |
| `InvoiceProviderFactory` | 2 | non | non | non | PARTIAL |
| `OpenBankingProviderFactory` | 5 | non | non | non | PARTIAL |
| `IoTProviderFactory` | 2 | non | non | non | PARTIAL |
| `WeatherProviderFactory` | 3 | non | non | non | PARTIAL |
| `SupplierProviderFactory` | 1 | oui | non | non | PARTIAL |
| `TerminalAdapterFactory` | 14 | non | non | non | PARTIAL |
| `nexusNodeFactory` | n/a | non | oui | n/a | OK/PARTIAL |

### EventBus

- 93 fichiers handlers sous `src/shared/eventBus/handlers/`.
- `registerHandlers.ts` enregistre 91 handlers globaux.
- `SupportTicketAnalysisHandler` est volontairement enregistré côté serveur par `src/app/api/tenant/support/tickets/route.ts`, donc il n'est pas mort.
- `SilaeExportHandler.ts` n'est plus enregistré et coexiste avec `PayrollExportHandler`; c'est un résidu DEAD.
- Aucun import direct `web-push` dans les handlers globaux. Le signal sur `SovereignBreachHandler` est un faux positif : il utilise `fetch('/api/push/internal')`.
- 26 handlers lisent explicitement `isSimulation`; les autres doivent être revus par priorité métier.

### MCC

| Zone | Éléments | État |
|---|---:|---|
| Tabs `src/app/(admin)/admin/mcc/_tabs/` | 9 fichiers | OK/PARTIAL |
| Panels `src/shared/nexus/guards/admin/mcc/` | 30 fichiers | PARTIAL |
| Routes `src/app/api/admin/mcc/` | 6 routes directes + sous-routes | PARTIAL |
| Routes fleet admin liées MCC | 40+ routes | PARTIAL |
| Engines `src/shared/nexus/engines/mcc/` | provisioning + changelog | PARTIAL |

Panneaux avec API réelle ou Nexus réel : `DeploymentEngine`, `DisasterRecoveryPanel`, `MCCTreasury`, `TenantUsersPanel`, `SupportDraftsPanel`, `PluginEnginePanel`, `TenantOverridePanel`.  
Panneaux encore très dépendants de données calculées, statiques ou simulées : `FleetCommandTable`, `FleetDeviceInventory`, `FleetUpgradePanel`, `PluginCatalogManager`, `ResellerPortal`, `StrategyOracle`, `SupportAIPanel`, `TaxAuditPanel`, `TrustedDevicePanel`.

### Infrastructure & core

| Élément | Observation | Statut |
|---|---|---|
| `src/lib/nexus/NexusAdapter.ts` | Singleton et adapter guardé; compile. | OK |
| `src/infrastructure/adapters/FinancialNexusBridge.ts` | POS -> `JournalEntry` + `FiscalSeal`; double-écriture; split/comp/refund events. | OK |
| `src/infrastructure/services/finance/FiscalSealer.ts` | Numérotation séquentielle transactionnelle, chainHead atomique, `serverTimestamp`. | OK |
| `src/infrastructure/adapters/FiscalAdapter.ts` | Hash SHA-256 via `CryptoService`, vérification chaîne. | OK |
| `src/shared/nexus/guards/SovereignGuard.ts` | Isolation tenant + immutables + signatures serveur; whitelist large à surveiller. | OK/PARTIAL |
| `src/lib/push/browserPush.ts` / `webPushService.ts` | Pattern client-safe présent; routes serveur importent `WebPushService`. | OK |
| `src/infrastructure/services/sync/pillarSyncRegistry.ts` | Sync cross-piliers assumée, mais importe directement les modules depuis `infrastructure`. | VIOLATION |
| `src/infrastructure/adapters/Simulacra/` | Simulation identifiée; plusieurs références restent dans tests/dev. | OK/PARTIAL |

### Domain schemas

Les schémas Zod existent et exportent des types via `z.infer<>`. Le point faible n'est pas l'absence de schémas, mais leur utilisation inégale aux frontières système : plusieurs routes valident leur body (`z.parse`), mais beaucoup s'appuient encore sur cast manuel ou objets partiels.

Schémas peu ou pas référencés par scan approximatif : `quality.ts`, plusieurs schémas compliance/loyalty/modules/periodClosure sont surtout des contrats dormants. Schémas très utilisés : `primitives.ts`, `orders.ts`, `tenant.ts`, `finance.ts`, `haccp.ts`, `users.ts`.

### Store / state

`src/store/pillars/` contient bien les 10 fichiers attendus. Les fichiers sont majoritairement des réexports/agrégateurs et ne montrent pas de fuite `cents`. `core.ts` dépend de `NexusNode`, `sovereign.ts` porte le contexte tenant. Pas de rupture TypeScript.

### API routes

143 routes auditées. Signal automatisé :

- 14 routes sans signal d'auth explicite. Certaines sont publiques par design (`widget/*`, `resolve-domain`, `health/rag`), d'autres demandent revue (`push/send`, `cron/weekly-report`, `connectors/*/sync`, telemetry heartbeat/crash).
- 16 routes sans signal tenant. Certaines sont globales/admin, mais `admin/mdm/erase`, `admin/mdm/lock`, `email/reservation-confirm`, `finance/bank/test-demo` méritent durcissement.
- 17 routes contiennent un signal mock/demo/TODO/simulation.

## Phase 2 — Audit des promesses

### Par pilier

#### ops

| Élément | Type | Statut | Détail | Correctif proposé | Priorité |
|---|---|---|---|---|---|
| POS -> Finance | Service/adapter | OK | `FinancialNexusBridge` scelle et émet les événements. | Garder tests de non-régression POS/NF525. | P1 |
| KDS handlers | EventBus | OK/PARTIAL | Handlers enregistrés; simulation variable selon handler. | Ajouter matrice `isSimulation` obligatoire. | P2 |
| Delivery connector | Factory | PARTIAL | 2 providers mais pas de catalog/register/ping. | Aligner sur PayrollConnectorFactory. | P2 |
| Imports directs vers sous-modules ops | Architecture | VIOLATION | Core/shared/imports directs vers `ops/engine/types`, providers, composants. | Exporter contrats publics depuis barrel ou shared contracts. | P1 |

#### commerce

| Élément | Type | Statut | Détail | Correctif proposé | Priorité |
|---|---|---|---|---|---|
| Marketing/CRM handlers | EventBus | OK/PARTIAL | RFM, loyalty, campaigns enregistrés. | Ajouter tests d'intégration bus -> Nexus. | P2 |
| Reviews/emailing connectors | Factory | PARTIAL | Providers présents, catalogue/ping absents. | Créer `PROVIDER_CATALOG`, `ping`, routes admin. | P2 |
| Widgets publics | API | PARTIAL | Routes publiques nécessaires mais sensibles. | Rate-limit et validation stricte tenant/api key. | P1 |

#### compliance

| Élément | Type | Statut | Détail | Correctif proposé | Priorité |
|---|---|---|---|---|---|
| HACCP append-only | Service/schema | OK/PARTIAL | `haccpLogs`, `iotHistory` immuables dans Guard. | Tester no update/delete en intégration. | P1 |
| IoT connector | Factory | PARTIAL | Providers présents, pas de ping/catalog/register. | Aligner factory. | P2 |
| `PeriodLockGuardHandler` | EventBus | PARTIAL | Update sous `tenants/{tenantId}/fiscalLedger/locks`. | Clarifier si `locks` est append-only ou déplacer hors `fiscalLedger`. | P1 |

#### finance

| Élément | Type | Statut | Détail | Correctif proposé | Priorité |
|---|---|---|---|---|---|
| NF525 bridge | Adapter | OK | Double-entry, hash chain, server timestamp, transaction. | Renforcer tests offline sync serveur. | P0 |
| Open banking | Factory | PARTIAL | 5 providers, mais pas catalog/register/ping uniforme. | Ajouter health check par provider. | P2 |
| Champs `*InCents` | Modèle | VIOLATION/PARTIAL | Encore présents dans contracts, accounting, procurement, dashboard. | Plan de migration microunits par frontières PSP/legacy. | P1 |
| Billing Stripe MCC | API/UI | PARTIAL | Portal réel si Stripe configuré; fallback 503. | Harmoniser chemin config tenant et tests e2e Stripe mock. | P1 |

#### human

| Élément | Type | Statut | Détail | Correctif proposé | Priorité |
|---|---|---|---|---|---|
| Payroll plug-and-play | Factory/UI/API | OK | `catalog`, `register`, `ping`, routes admin en place. | Garder comme modèle canonical. | P2 |
| `SilaeExportHandler.ts` | EventBus | DEAD | Remplacé par `PayrollExportHandler`, non enregistré. | Supprimer fichier et imports associés si aucun usage. | P2 |
| Recruitment/timeclock | Factory | PARTIAL | Providers mais pas contract `ping/catalog/register`. | Aligner sur paie. | P2 |

#### intelligence

| Élément | Type | Statut | Détail | Correctif proposé | Priorité |
|---|---|---|---|---|---|
| RAG LightRAG | Service | PARTIAL | Client réel; provisioning tolère absence sidecar. | Health gate explicite dans MCC. | P2 |
| Support IA | Handler/API/UI | OK/PARTIAL | Route tenant enregistre handler serveur; Gemini réel si clé. | Ajouter queue durable/retry si Gemini absent. | P2 |
| Weather connector | Factory | PARTIAL | 3 providers mais pas catalog/register/ping. | Aligner factory. | P2 |
| Core/shared -> intelligence | Architecture | VIOLATION | Plusieurs imports directs depuis `shared`, `lib`, `infrastructure`. | Extraire interfaces `shared/nexus/contracts/intelligence`. | P1 |

#### logistics

| Élément | Type | Statut | Détail | Correctif proposé | Priorité |
|---|---|---|---|---|---|
| Inventory/stock engine | Services | PARTIAL | Logique présente; encore champs coût `InCents`. | Migrer coûts vers microunits ou nommer explicitement frontière fournisseur. | P1 |
| Supplier connector | Factory | PARTIAL | Catalogue présent, mais pas `register`/`ping`. | Compléter interface fournisseur. | P2 |
| Procurement | Domain | PARTIAL/VIOLATION | PO/three-way match en cents. | Introduire `totalAmountInMicrounits` + adaptateur legacy. | P1 |

### MCC

| Élément | Type | Statut | Détail | Correctif proposé | Priorité |
|---|---|---|---|---|---|
| Provisioning tenant | Engine | PARTIAL | Crée config, Stripe customer, RAG bootstrap, admin Firebase; Stripe mock si env absente. | Fail explicite en prod sans Stripe/Resend/Firebase; rollback réel. | P0 |
| Billing tenant | API/UI | PARTIAL | Portal Stripe réel, treasury réel si Stripe; fallback théorique/503. | Tests contractuels + chemin unique `tenantConfig`. | P1 |
| Fleet monitoring | UI/context | PARTIAL | Données via `useFleet`, mais plusieurs panels calculés localement. | Brancher telemetry heartbeat/crash authée et historisée. | P1 |
| MDM Mosyle/Apple | API | STUB/PARTIAL | `MDM_SERVER_URL` absent -> endpoint mock, JWT fictif. | Implémenter client MDM réel ou rendre promesse explicite "simulation". | P1 |
| API Gateway | API | PARTIAL | Révocation clé réelle; pas de rotation/rate-limit complet dans route audité. | Ajouter rotate, usage metrics, rate limiter. | P1 |
| Disaster recovery | API/UI | PARTIAL | PITR tenté via REST, fallback simulated; restore cible une base restaurée séparée. | Implémenter workflow restore tenant bout-en-bout + validation NF525. | P0 |
| Plugin system | API/UI | PARTIAL | Catalogue et enable/disable; proration TODO. | Connecter billing/event bus/plugin runtime. | P2 |
| Changelog/PatchCenter | Service/UI | OK/PARTIAL | `ChangelogService` réel; dépend du wiring tenant. | Ajouter diff de config et signature opérateur. | P2 |
| Support IA | API/UI/handler | OK/PARTIAL | Gemini + drafts; fallback absent si env. | Queue et retry; audit PII. | P2 |
| Reseller | API/UI | PARTIAL | CRUD/commissions signalés mais panel encore marqué mock par scan. | Test calcul commissions Stripe invoices. | P2 |
| Certification | UI | PARTIAL | Lit fleet/compliance mais checklist à vérifier. | Rendre checklist issue de règles versionnées. | P2 |
| Strategy Oracle | UI | PARTIAL | Signal mock/static. | Brancher route strategy-oracle ou afficher indisponible. | P3 |
| Fiscal Chain Explorer | UI | OK/PARTIAL | Lit provider fiscal; pas de preuve export audit complet. | Ajouter recompute chain côté serveur. | P1 |
| Performance Monitor | UI | PARTIAL | Pas de fetch/API direct détecté. | Connecter métriques Axiom/Sentry/heartbeat. | P2 |

### Violations architecturales

| Élément | Statut | Détail | Correctif proposé | Priorité |
|---|---|---|---|---|
| Tête/corps | VIOLATION | 58 fichiers core/shared/lib/infrastructure importent `@/modules/...`. | Extraire contrats neutres et passer par barrels publics. | P1 |
| Barrel bypass | VIOLATION | 299 imports `@/modules/<pilier>/...` détectés. | Migration progressive par pilier; exception tests/outils documentée. | P2 |
| Monnaie | VIOLATION | Nombreuses occurrences `cents`, surtout contracts finance/logistics/accounting. | Migration microunits par couches; conserver cents seulement aux frontières PSP/imports. | P1 |
| API auth | PARTIAL/VIOLATION | 14 routes sans signal auth; certaines publiques légitimes. | Annoter routes publiques + middleware/rate-limit pour les autres. | P1 |
| Fiscal ledger lock | PARTIAL | `PeriodLockGuardHandler` update sous `fiscalLedger/locks`. | Déplacer vers `periodLocks` ou faire append-only. | P1 |

## Phase 3 — Correctifs priorisés

| ID | Priorité | Fichiers | Cassé/manquant | Action concrète | Effort | Dépendances |
|---|---|---|---|---|---|---|
| FIX-01 | P0 | `src/shared/nexus/engines/mcc/provisioning/TenantProvisioningService.ts` | Provisioning peut réussir avec Stripe mocké et email non envoyé. | En prod, refuser sans `STRIPE_SECRET_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `RESEND_API_KEY`; ajouter rollback Firestore/Auth/Stripe. | L | Aucun |
| FIX-02 | P0 | `src/app/api/admin/fleet/restore/route.ts`, `DisasterRecoveryPanel.tsx` | Restore PITR est souvent simulé et ne restaure pas réellement le tenant actif. | Créer job orchestré : backup source, restore db temporaire, diff, replay hors collections NF525, validation opérateur. | XL | FIX-01 |
| FIX-03 | P1 | `src/app/api/admin/mcc/fleet/devices/lock/route.ts`, `devices/delivery/route.ts`, `src/app/api/admin/mdm/*` | MDM/JWT et endpoint mock si env absente. | Implémenter client MDM concret avec contrat, secrets obligatoires en prod, test sandbox. | L | Choix fournisseur MDM |
| FIX-04 | P1 | `src/shared`, `src/lib`, `src/infrastructure` | 58 imports core -> modules violent la tête détachable. | Déplacer types/interfaces vers `src/shared/nexus/contracts` ou `src/domain/schemas`; remplacer imports directs. | XL | Tests TypeScript |
| FIX-05 | P1 | `src/shared/nexus/contracts/finance.types.ts`, `src/modules/finance/**`, `src/modules/logistics/**` | Champs `*InCents` encore présents hors frontières. | Introduire champs `*InMicrounits`, adapters legacy, tests de conversion; renommer seulement après migration. | XL | MIGRATION-microunits.md |
| FIX-06 | P1 | `src/shared/eventBus/handlers/PeriodLockGuardHandler.ts` | Update sous `fiscalLedger/locks`. | Déplacer dans `periodLocks` ou modéliser append-only `periodLockEvents`. | M | FiscalGuard |
| FIX-07 | P1 | `src/app/api/push/send/route.ts`, `cron/weekly-report`, `connectors/*/sync`, telemetry routes | Routes sans auth signal. | Ajouter `requireTenantRole`, secret cron, signature webhook ou documenter public + rate-limit. | M | SecuritySentinel |
| FIX-08 | P1 | `src/modules/*/connectors/**` | Factories non uniformes. | Standard provider contract : `ping()`, `PROVIDER_CATALOG`, `register()`, route `/connectors/<cat>/test`. | L | Payroll as template |
| FIX-09 | P2 | `src/shared/eventBus/handlers/SilaeExportHandler.ts` | Handler mort, provider-specific. | Supprimer et vérifier absence d'import; conserver migration note vers `PayrollExportHandler`. | S | FIX-08 paie déjà OK |
| FIX-10 | P2 | `src/shared/nexus/guards/admin/mcc/PluginCatalogManager.tsx`, `src/app/api/admin/fleet/plugins/route.ts` | Plugin enable/disable réel partiel, billing proration TODO. | Émettre événement billing + recalcul Stripe subscription item. | M | Billing tests |
| FIX-11 | P2 | `ResellerPortal.tsx`, `src/app/api/admin/mcc/reseller/**` | Commissions à valider de bout en bout. | Calculer commissions depuis invoices Stripe payées et écrire ledger reseller. | M | Stripe env |
| FIX-12 | P2 | `PerformanceMonitor.tsx`, `FleetTelemetryPanel.tsx` | Monitoring encore UI/context first. | Brancher Axiom/Sentry/heartbeat avec historique par tenant. | M | Auth telemetry |
| FIX-13 | P2 | `src/domain/schemas/**`, routes API | Validations Zod inégales aux frontières. | Exiger `z.parse/safeParse` pour toutes routes mutantes; ajouter tests invalid body. | L | Aucun |
| FIX-14 | P3 | `graphify-out/` | Graph stale (`87542410` vs `8362ff337`). | Lancer `graphify update .` ou `npm run atlas` après remédiations. | S | Après changements |

## Notes de vérification

- `npx tsc --noEmit` via RTK : OK, aucune erreur TypeScript.
- Aucun import direct `web-push` hors serveur applicatif, sauf `src/lib/push/webPushService.ts` et routes API.
- Les handlers EventBus globaux ne doivent pas être tous considérés morts si non présents dans `registerHandlers.ts`; `SupportTicketAnalysisHandler` est un cas serveur explicitement enregistré dans la route tenant.
- Les occurrences `cents` ne sont pas toutes des bugs : certaines sont légitimes aux frontières Stripe/PSP/import CSV/factures fournisseurs. Elles deviennent violation quand elles polluent les contrats internes ou les domaines finance/logistics comme source de vérité.
