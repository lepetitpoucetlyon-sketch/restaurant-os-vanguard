# Sessions Claude Code Actives

> **Protocole automatique** — chaque session Claude Code doit :
> 1. Lire ce fichier AVANT toute action
> 2. Ajouter sa ligne au tableau ci-dessous
> 3. Vérifier qu'aucune session `active` ne couvre le même périmètre
> 4. Passer en `terminée` à la fin du travail
>
> Le hook `.claude/hooks/check-session-collision.sh` alerte en cas de collision sur Edit/Write.

## Sessions

| Session | Périmètre | Dernière activité | Status |
|---------|-----------|-------------------|--------|
| bible-tutos | `docs/BIBLE_TECHNIQUE.html` | 2026-07-24 | terminée |
| mcc-coord | `CLAUDE.md`, `.claude/` | 2026-07-24 | terminée |
| mobile-audit | MCC + client layouts, responsive CSS | 2026-07-24 | terminée |
| tech-debt | Dette technique : rapatriement, god files, tests POS/fiscal + Bible checklist | 2026-07-25 | terminée |
| mcc-patch-center | MCC Patch Center : ChangelogService, tenant-override, upgrade, changelog API + UI panels | 2026-07-25 | terminée |
| structural-5steps | God Files (step2), cents leaks (step3), context rapatriation (step4), duplicate filenames (step5) | 2026-07-25 | terminée |
| perf-audit-fix | Fixes perf : useBilling ICM, N+1 queries, bundle (use client, dynamic, Image) | 2026-07-25 | terminée |
| jotai-perf-audit | Audit lecture seule : src/store/, src/modules/*/store/, composants POS/KDS | 2026-07-25 | terminée |
| jotai-perf-fix | Fixes re-renders : updateNexusNode guard, floorHooks useMemo, opsCore useMemo, kitchenHooks useCallback, useInventory now, stockTransfer useState, currentDateAtom, useAtomValue×5, filteredCandidates useMemo | 2026-07-25 | terminée |
| sprint-10-vague-a | Vague A : PWA manifest+icons (mob-1), dynamic imports modales (perf-5), infinite scroll grilles (perf-6), img→Image Next.js (perf-7) | 2026-07-25 | terminée |
| sprint-10-vague-b | Vague B : MCCTreasury données réelles + portal Stripe (mcc-bill-1), Mosyle MDM routes + MDMPanel (mcc-deploy-adv-3) | 2026-07-25 | terminée |
| sprint-10-vague-c | Vague C : API Gateway clés externes (mcc-billing-adv-3), status page (mcc-growth-1), landing per-restaurant (res-arch-2), SAV L0 IA (mcc-support-ai-1) | 2026-07-25 | terminée |
| sprint-vague-d | Vague D : mob-2/3/4, mcc-mdm-1/3, res-arch-3, rh-9, goo-9/10, hac-6, mcc-growth-2 | 2026-07-25 | terminée |
| audit-360-fix | Vérif + correction remédiations commit b17b4e20c : NF525 double-entrée (FinancialNexusBridge), rules fiscalMeta/immutable, SovereignGuard client-signing, offline sync, tenant-billing Stripe TSC | 2026-07-26 | terminée |
| tier-a-hardening | Tier A FAIT : bug période FEC, chaînage FEC SHA-256 réel, backdoor PIN 9999 supprimé, lockout PIN serveur (functions), + bootstrap adapter Nexus serveur (FirestoreServerAdapter firebase-admin + registerServerAdapter + ensureServerNexus + instrumentation.ts, 7 tests). Activation runtime = poser FIREBASE_SERVICE_ACCOUNT_JSON en env | 2026-07-26 | terminée |
| tier-b | Tier B FAIT : split payment persistant, unification déduction stock, lint 15→0, backend HACCP (HACCPLogService : iotHistory immuable + haccpLogs + nonConformities auto sur seuil IoT, +test), cookie banner mort supprimé. FAIT aussi : .firebase/ dé-tracké (66930 fichiers, staged non commité) + supprimé du disque + gitignoré → sentrux propre (0 cycle réel ; restent 2 violations dette préexistante : 10 fns cc>20, 3 god-files Providers). Server-adapter livré (voir tier-a) | 2026-07-26 | terminée |
| finale | Horodatage NF525 autoritaire serveur (serverRecordedAt/serverTimestamp sur sceau+écriture, FiscalSealer) + doc : chapitre 25 « Audit 360 & Remédiations » ajouté à docs/BIBLE_TECHNIQUE.html (+ meta charset utf-8 manquant). 454/454 tests, TSC 0, ESLint 0 | 2026-07-26 | terminée |
| mcc-audit | Analyse structure MCC (lecture seule) : shared/nexus/guards/admin/mcc/, shared/nexus/engines/mcc/, lib/mcc/, app/(admin)/admin/mcc/ | 2026-07-27 | terminée |
| support-ai-flow | Support self-service : supportTicket schema, tickets route, SupportTicketAnalysisHandler, drafts route, SupportDraftsPanel, MCC page.tsx | 2026-07-27 | terminée |
| mcc-support-drafts | Implémentation : requêtes tenant self-service → agent IA (Gemini) → brouillon évolution/bug dans MCC (approve/correct/reject). Fichiers : domain/schemas/supportTicket.ts, api/tenant/support/tickets, shared/eventBus/handlers/SupportTicketAnalysisHandler.ts, api/admin/fleet/support-ai/drafts, shared/nexus/guards/admin/mcc/SupportDraftsPanel.tsx + wiring page.tsx/index.ts. Suppression SupportEngine.ts (mort/cassé) | 2026-07-27 | terminée |
| pos-audit | Audit POS + 6 corrections critiques : prix options (microunits/cents), statut dirty TableSelector, activeCartAtom sync Jotai, split by-item/custom UI, TVA PaymentDialog, nom restaurant ticket + TVA effective usePrintReceipt. TSC 0 / 426 tests OK | 2026-07-27 | terminée |
| kds-audit | Audit complet KDS : src/modules/ops/kds/, src/app/(client)/(ops)/kds/, composants écran cuisine | 2026-07-27 | terminée |
| ops-audit | Audit ops (hors KDS) : ops/engine, ops/kitchen, ops/prep, ops/pos, ops/recipes, store/pillars/ops.ts, pages kitchen/prep/tables/floor | 2026-07-27 | terminée |
| commerce-audit | Audit lecture seule : src/modules/commerce/, app/(client)/(commerce)/, domain/schemas liés commerce | 2026-07-27 | terminée |
| finance-audit | Audit lecture seule : src/modules/finance/, src/infrastructure/adapters/Financial*, src/engines/fiscal/, src/domain/schemas/finance.ts, finance pages | 2026-07-27 | terminée |
| compliance-audit | Audit lecture seule : src/modules/compliance/, src/app/(client)/(compliance)/, src/domain/schemas/ (HACCP, audit, RGPD, rappels), src/infrastructure/adapters/ (compliance) | 2026-07-27 | terminée |
| human-audit | Audit lecture seule : src/modules/human/, src/app/(client)/(ops)/staff/, src/domain/schemas/hr.ts+employeeDocument.ts, store/pillars/human.ts | 2026-07-27 | terminée |
| logistics-audit | Audit lecture seule : src/modules/logistics/, domain/schemas stocks/fournisseurs, store/pillars/logistics*, app logistics pages, lien POS→stock | 2026-07-27 | terminée |
| intelligence-audit | Audit lecture seule : src/modules/intelligence/, api/ routes IA, domain/services/, app intelligence pages | 2026-07-27 | terminée |
| full-rewire | Câblage réel de tous les stubs/no-ops/cross-tenant sur les 7 piliers — 263 findings, 6 patterns | 2026-07-27 | terminée |
| rapatriment-services | Migration domain/services/ orphelins → modules/<pilier>/services/ (29 fichiers, 7 piliers) | 2026-07-28 | terminée |
| prod-blockers-phase1 | Phase 1 bloquants prod : page /login, branding dans Apparence, welcome successUrl | 2026-07-28 | terminée |
| prod-blockers-phase2 | Phase 2 bloquants prod : .env.production secrets documentés, deploy-prod.sh, fix .env.example STRIPE_PRODUCT | 2026-07-28 | terminée |
| bible-deploy-tutos | Ajout Bible §08 : 4 tutoriels déploiement (Firebase SA, Stripe, Resend, Functions) + checklist §19 items inf-9→inf-15 | 2026-07-28 | terminée |
| connectors-arch | Implémentation plan connecteurs : types + factories + providers (P1) pour toutes les catégories + routes API | 2026-07-28 | terminée |
| suite-fixes-firestore | Fixes 4-5-6 (rapatriement, demo, useExtensions), audit Firestore rules privilege escalation systemConfig | 2026-07-29 | terminée |
| preflight-green | Preflight complet : cycles Madge 0, SSR purity (ops pages), playwright/mqtt externals, fan-out KitchenDashboard+FinanceDashboard, baseline v2.0, hook pre-push, CC -3 (resolveTaskContext/middleware/AnomalyDetector) | 2026-07-30 | terminée |
| cc-reduction | Réduction CC 10 fonctions TS : usePos, useReservationsPage, InventoryReceptionDashboard, NexusFleetProvider, fileDetector, BrandingProvider, ReservationHistoryImporter, useFloorPlanControls, NewQuoteDialog, useInventory | 2026-07-30 | terminée |
| cc-reduction-15 | Chantier 8 — abaissement seuil cc≤15 : ~28 fonctions TS (plateforme + bridge + MCC) | 2026-07-30 | terminée |
| cc-wave2 | Chantier 9 wave 2 — abaissement cc≤12 : 17 fonctions cc=14, puis 12 fonctions cc=15 | 2026-07-30 | terminée |
| cc-wave2-finish | Finalisation cc-wave2 : réduction CC ≤12 + correction arborescence (MCC manquant) | 2026-07-30 | terminée |
| full-audit | Audit complet structure/code/arborescence (lecture seule) | 2026-07-30 | terminée |
| god-files-microunits | God files (6 fichiers >400L) + migration InCents→Microunits (478 occ.) | 2026-07-30 | terminée |
| cc-python | Chantier 9 Python — réduction CC ≤12 : 10 fonctions sovereign-rag + scripts | 2026-07-30 | terminée |
| microunits-lot2 | Migration µ Lot 2 : ProductFormModal/Financials, menu-builder, TreasuryCalculator, FiscalHACCPMapper, SovereignPayout, FiscalTransmitter, taxCalc, BankingNexusBridge, airlock-report, SinfoniaGradeXProof, financeUtils, usePos, marketing CRM | 2026-07-30 | terminée |
| microunits-fix | Correction MicrounitAdapter.ts : facteur 100→10 000 (toPSP / toDomain) | 2026-07-30 | terminée |
| event-cartography | Audit lecture seule — EventBus, EventEmitter, PubSub, NexusEvents, .emit(, .on(, dispatch( — cartographie exhaustive Saga Pattern | 2026-07-30 | terminée |
| saga-plan-md | Rédaction docs/SAGA_PLAN.md — plan opérationnel complet bus événementiel (P0→P3) | 2026-07-30 | terminée |
| rbac-hardening | Correction 4 lacunes RBAC : PIN hashing PBKDF2, rate limit serveur, role gate cash drawer, requireTenantRole sur finance/sync + print/network | 2026-07-30 | terminée |
| structural-hardening | Failles structurelles : barrels violations, ArchitecturalHealthService, domain/types rapatriation | 2026-07-30 | terminée |
| sprint1-audit-plan | Sprints 1-5 plan audit : allergènes INCO, menu-builder Nexus, registres/HACCP/bar Nexus, bus events (cert.expired, compliance.calendar, anomaly.detected), treasury+SEPA UI, Oracle chat, capacité plan de salle | 2026-07-31 | terminée |
| partial-39-sweep | Éradication 39 promesses partielles restantes (CAT-01/04/05/06/07/08/09/10/12) — tous piliers | 2026-07-31 | terminée |
| p08-handlers | src/shared/eventBus/handlers/ReportRetryHandler.ts, LLMFallbackHandler.ts, NexusEventBus.ts, registerHandlers.ts | 2026-08-01 | terminée |
| v6-handlers | src/shared/eventBus/handlers/ (CompJournalHandler, ResaReminderHandler, ResaKitchenTaskHandler, NoShowCRMHandler, NoShowTableReleaseHandler, TableAutoReleaseHandler, BigGroupAlertHandler), NexusEventBus.ts, registerHandlers.ts | 2026-08-01 | terminée |
| payroll-plugplay | Architecture paie plug-and-play : IPayrollConnectorProvider+ping(), PROVIDER_CATALOG, PayrollIntegrationPanel dynamique, browserPush/api/push/internal, PayrollConnectorFactory registry, PayrollExportHandler agnostique, routes API admin/hr/payroll/* | 2026-08-01 | terminée |
| promise-audit | Audit promesses Restaurant OS + MCC : scans lecture seule + rapport docs/AUDIT_PROMESSES_RESTAURANT_OS_MCC.md | 2026-08-01 | terminée |
| ui-audit-prompt | Rédaction mega-prompt Codex audit UI client (26 catégories, RBAC, calculs, flux cross-cat) — lecture seule | 2026-08-01 | terminée |
| ui-client-audit | Audit UI client 26 catégories : connexions, calculs, flux cross-cat, RBAC + rapport docs/AUDIT_UI_CLIENT_26_CATEGORIES.md | 2026-08-01 | terminée |
| rbac-verify | Vérification déploiement RBAC 3 niveaux : schemas, hooks, guards, pages, API, commit | 2026-08-01 | terminée |
| mcc-skeleton | Restructuration AUDIT_PROMESSES → squelette multi-plateforme MCC + bootstrap pilier 8 (facility) + rapatriement floor-plan/registre/settings | 2026-08-01 | terminée |
| genesis-variant | Multi-variant provisioning + restructuration 7 piliers en domaines universels (ops/commerce/finance/compliance/human/logistics/intelligence) | 2026-08-01 | terminée |
| arch-diagram | Lecture seule — création schéma architectural réel (SVG artifact) | 2026-08-01 | terminée |
| migration-finisher | src/modules/, src/verticals/, tsconfig, preflight | 2026-08-04 | terminée |
| sprint0-cycles | 55 barrel self-imports → relatifs, 375→331 cycles, kdsUtils.ts extrait | 2026-08-04 | terminée |
| phase1-doublons | src/modules/ vs src/verticals/ — suppression doublons purs + quasi-identiques | 2026-08-04 | terminée |
| phase2-dep-audit | Audit dépendances runtime 6 modules Phase 2 (lecture seule) : haccp, kds, kitchen, recipes, fiscalite, hr | 2026-08-04 | terminée |
| debt-a-intel-alias | Debt A : alias @/modules/intelligence dans tsconfig pointe sur engines/Intelligence/ — fix bloqué par cycle fleet→index→fleet ; prérequis : retirer export fleet du barrel modules/intelligence/index.ts | 2026-08-05 | terminée |
| goal-mode | Exécution séquentielle : Debt A → SAGA P0→P3 → legacy_monolith migration → tests coverage | 2026-08-05 | terminée |

| restaurant-vertical | src/verticals/restaurant/ — NF525, menu-engineering, tip-pooling, perishables, table-service | 2026-08-05 | terminée |
| sprint-plan-exec | Plan S1→S10 + exécution sprints : accounting test, verticals doublons, engines/Intelligence migration, CRM/Ledger/Fiscal/MCC, barrel debt, SAGA tests | 2026-08-05 | terminée |
| s8-s10-finish | S8 SAGA tests 562/562 ✓ — S10 : cross-cutting services → src/lib/ (CryptoService, IdentityManager, AmbianceService, BrandingService, SettingsManager, AccessPolicyManager, ProvisioningEngine, MaintenanceAgent, GenomeValidator, TenantSeeder) + ProductAvailabilityService → modules/logistics/ | 2026-08-05 | terminée |
| s10-etape2-3 | Verticals 8-pilier adapters (restaurant/hotel/health/auto) + MCC câblage (health ping + fiscal audit handlers) — src/verticals/*/adapters/, src/shared/eventBus/ | 2026-08-06 | terminée |
| cleanup-final | RBAC 3 gaps (boot/ICoreContext/provisioning) + SAGA coverage 124 handlers — src/shared/providers/hooks/useNexusTenantLogic.ts, src/shared/plugins/, src/lib/ProvisioningEngine.ts, src/__tests__/handlers/ | 2026-08-06 | terminée |
| audit-360-v2 | Audit 4 axes (archi/sécu/tests/dette) + plan PLAN_AUDIT_FIXES.md — lecture seule + fixes TSC/txMock | 2026-08-06 | terminée |
| connector-hub-p0 | src/shared/connector-manifest/, src/modules/intelligence/connectors/hub/, src/shared/hooks/useConnector.ts | 2026-08-06 | terminée |
| connector-auto-activate | src/lib/TenantSeeder.ts, src/shared/eventBus/NexusEventBus.ts | 2026-08-06 | terminée |
| connector-api-routes | src/lib/server/credentialCipher.ts, src/app/api/connectors/[id]/* | 2026-08-06 | terminée |
| connector-ui | src/app/(client)/(ops)/integrations/, src/modules/intelligence/connectors/hub/components/, navConfig.ts | 2026-08-06 | terminée |
| branding-splash | BrandTokensSchema (splashEnabled/brandingMode), ProvisioningDNA, MCC modal branding, SplashScreen, SplashGate, lastPath tracking | 2026-08-07 | terminée |
| audit-fixes-exec | Exécution PLAN_AUDIT_FIXES.md : P0 (secret hardcodé, IDOR, microunits), P1 (NF525, XSS, SAGA, Resend, tenantId, @ts-ignore), P2 (dead code, eval, InCents, auth, barrels, console.log), P3 (infra doublons, lib rapatriation, barrel violations) | 2026-08-06 | terminée |
| nf525-remediation | Remédiation NF525 Grade X : FiscalSealer.ts (additionalMutations atomique), TicketZHandler.ts (race condition clôture Z + TVA parseFloat), PeriodLockGuardHandler.ts (assertPeriodNotLocked), TaxCalculator.ts (entiers purs BigInt) | 2026-08-06 | terminée |
| onboarding-plan | Plan complet onboarding B2B (from-scratch + migration concurrents) — docs/PLAN_ONBOARDING_B2B.md | 2026-08-06 | terminée |
| onboarding-impl | Implémentation complète onboarding B2B : LLM agnostique, 7 connecteurs, OCR, wizard UI, DNA seeds, rollback, APIs — src/modules/onboarding/, src/modules/intelligence/ia/, src/app/api/tenant/onboarding/, src/shared/seeds/ | 2026-08-06 | terminée |
| onboarding-finish | S2.4→S7.5 : guides export, tests importers/connecteurs, floor-plan wizard, redirect post-login, bouton aide, E2E, catalogue Metro/Pomona, HACCP historique, archivage coffre | 2026-08-06 | terminée |
| mcc-sprint-finish | P1 déjà ✅ (TenantSeeder câblé) — P2: AdminLayout roles, fiscal emit, health ping 7j, MCC_DEV_MODE unification, CLI — P3: tests handlers, mock routes, billing plugins, changelog tests | 2026-08-06 | terminée |
| mcc-debug-env | Debug 404 /admin/mcc → middleware bloquait APP_MODE=tenant ; fix NEXT_PUBLIC_APP_MODE=mcc dans .env.local | 2026-08-06 | terminée |
| restaurant-vertical-audit | Audit complet vertical restaurant : routes, RBAC, atoms, ICM, events, adapters, DNA, blind spots — lecture seule + docs/AUDIT_VERTICAL_RESTAURANT.md | 2026-08-07 | terminée |
| ui-plan-execution | Exécution plan AUDIT_UI.md phases 0→7 : prérequis structurels, doublons, orphelins, barrel, tokens CSS, atomiques, responsive, dark mode | 2026-08-07 | terminée |
| ui-audit-global | Audit UI global : inventaire composants, tokens hardcodés, couverture routes, dark mode, responsive — lecture seule + docs/AUDIT_UI.md | 2026-08-07 | terminée |
| plan-vertical-exec | Exécution PLAN_VERTICAL_RESTAURANT.md P0→P2 : 6 erreurs TSC corrigées (adapters/MenuEngineering), 4 dead-event handlers (SalesDataReady/AnomalyDetected/KdsCourse/TipDistributed), RBAC registerRbacConfig, test fiscal activé, 15 tests RestaurantVertical, menu démo TenantSeeder, VerticalRoute[] statiques, ICM routes, circuit-breaker NexusEventBus. 0 erreurs TSC, 668 tests OK. | 2026-08-07 | terminée |
| ui-refactor-phases1-6 | Exécution plan AUDIT_UI.md Ph1→Ph6 : doublons (25 fichiers), orphelins, barrel ui/index.ts, tokens CSS hex→variables, couche atomique, floor-plan responsive — src/shared/components/, src/modules/, globals.css | 2026-08-07 | terminée |
| versionbase-plan | Rédaction docs/versionbase.md — plan DEMO/TEST/REFERENCE par verticale (lecture + écriture docs/) | 2026-08-07 | terminée |
| integrations-rbac-audit | Audit intégrations verticales + vérification RBAC — lecture seule src/verticals/, src/modules/intelligence/connectors/, src/shared/connector-manifest/, navConfig.ts | 2026-08-07 | terminée |
| audit-structure-exec | Exécution docs/audit-structure.md items 5→10 : marketing pillar merge, store orphan atoms, lib/ barrels (services/utils/adapters), CLAUDE.md doc routes + lib/nexus split | 2026-08-07 | terminée |
| versionbase-exec | docs/versionbase.md S1→S7 : SystemTenantRegistry, SovereignGuard write-guard, TenantSeeder brandTokens, bootstrap script, SplashGate Simulacra, cloneFromReference, seed-demo-data, SystemTenantsTab MCC + API routes, CTASection showcase | 2026-08-07 | terminée |
| audit-complet-v3 | Audit global structure projet tous angles : TSC, tests, arborescence, barrels, cycles, orphelins, CLAUDE.md drift | 2026-08-07 | active |
| typing-unknown-eradication | Éradication des 913 `unknown` — typage strict par catégorie (catch/Record/casts/generics/adapters). Périmètre large src/ + nouveaux types partagés (JsonValue, toError) | 2026-08-07 | active |
| dlq-rbac-audit | Audit lecture seule — logique métier DLQ + bus événementiel + RBAC : NexusEventBus, handlers, DLQ, RBAC guards, intégration cross-piliers | 2026-08-08 | terminée |
| docs-roadmap-sync | Sync docs : BACKLOG.md (effort+déps), DEBT.md (10 catégories + cold-start ML/HDS amont/BSDD/VISABIO/RGPD photos), ARCHITECTURE_METAPLATFORM (42 règles VerticalEventBridge, backoff DLQ, états erreur POS, ordre handlers), ROADMAP_STRATEGY (4e parcours E2E offline, hypothèses CAC/churn/LTV), VERTICALS_SPEC (push max 8 verticales), UI_MATRIX (push max 16 zones/~806 composants), sync visuels ROADMAP.md + docs/plans/roadmap2.md, correction métriques codebase (2686→3433) | 2026-08-15 | terminée |
| invariants-2-3-4 | Invariant #2 Stock Atomique (useStockDeduction.ts → Nexus.adapter.increment + test), vérification #3 CAS (déjà livré), vérification #4 UTC (déjà livré) | 2026-08-15 | terminée |
| vertical-forge | Skill Vertical Forge — analyse infra verticales (src/verticals/, IVerticalPlugin, VerticalRegistry, seeds DNA, SystemTenantRegistry, LegalContractGenerator, HardwareProvisioningService, vertical.events) puis développement verticale(s) manquante(s) | 2026-08-15 | terminée |
| quality-audit | Audit qualité : tout ce qui a été implémenté récemment — TSC, tests, graphify, diff commits GMAO + vertical-forge | 2026-08-16 | terminée |
| audit-global-all | Audit global multi-angles (docs/AUDIT_GLOBAL_2026-08-16.md) : TSC, tests, CC, cycles, barrels, event bus, NF525, microunits, RBAC, MCC, vertical forge, dead code, i18n. P0 corrigés (IDOR v1/orders, IDOR tenant/contracts, XSS EmailCampaign). 30 erreurs TSC corrigées dans 7 fichiers test. | 2026-08-16 | terminée |
| backlog-h1-fixes | Corrections BACKLOG H1 P1 : debounce pointeuse, acompte grands groupes, waitlist_ready+SMS, no-show enforcement, atomicité stock, préférences clients structurées | 2026-08-17 | terminée |
