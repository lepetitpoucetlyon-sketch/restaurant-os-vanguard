# Registre des Promesses — Plateforme Souveraine

> Ce registre est la **source de vérité unique** pour le suivi de maturité de la plateforme.
> Il alimente le dashboard MCC et survit au détachement de piliers lors de la création
> de nouvelles plateformes industrie (Bâtiment OS, Retail OS, Hôtellerie OS, etc.).
>
> Chaque promesse porte un **ID stable** (`CORE-xxx`, `PIL-xxx`, `CON-xxx`, `MCC-xxx`, `DEBT-xxx`, `FIX-xx`)
> utilisé comme clé Nexus dans `mcc/promises/{id}`.

Date de mise à jour : 2026-08-01
Commit audité : `350b09198`
Plateforme courante : **Restaurant OS**
TypeScript : `npx tsc --noEmit` → **0 erreur**

### Contrat architectural : 8 piliers invariants

| # | Pilier | Fonction universelle | Domaines |
|---|---|---|---|
| 1 | `ops` | Produire / Servir / Exécuter | service, production, workflow |
| 2 | `commerce` | Acquérir / Retenir / Vendre | acquisition, relationship, transaction |
| 3 | `compliance` | Se conformer / Prouver | regulatory, legal, safety |
| 4 | `finance` | Compter / Facturer / Prévoir | accounting, treasury, control |
| 5 | `human` | Recruter / Planifier / Payer | workforce, operations, development |
| 6 | `intelligence` | Comprendre / Prédire | analytics, ai, knowledge |
| 7 | `logistics` | Approvisionner / Stocker | inbound, storage, outbound |
| 8 | `facility` | Héberger / Maintenir / Équiper | spaces, assets, maintenance |

> **Invariant** : ces 8 piliers et leurs domaines sont **figés pour toute plateforme**.
> Seuls les **modules** à l'intérieur des domaines changent par industrie.

---

## Résumé exécutif

| Métrique | Valeur |
|---|---:|
| Piliers | 8 (dont facility = NEW) |
| Promesses totales | 110 |
| OK | 45 (40,9%) |
| PARTIAL | 39 (35,5%) |
| STUB | 6 (5,5%) |
| DEAD | 1 (0,9%) |
| VIOLATION | 13 (11,8%) |
| DONE (correctifs appliqués) | 5 (4,5%) |
| NEW (facility) | 7 |

### Progression récente (depuis `8362ff337`)

| Commit | Action | Promesses impactées |
|---|---|---|
| `00f303b4e` | Architecture RBAC 3 niveaux déployée | CORE-010 → CORE-022 (13 items → OK) |
| `f1959b242` | Mur de Chine ESLint + PiiVault relocalisé | CORE-008, DEBT-001, DEBT-002 |
| `0d8ed8c7c` | Alias `@modules/` colmaté | DEBT-002 |
| `edebfd54c` | `import()` dynamique couvert par la règle | DEBT-002 |
| `350b09198` | Types cross-module → `domain/schemas/` + FIX-04 étendu | CORE-007, DEBT-001, FIX-04 |

---

## 1. Noyau Souverain (Core)

> Partagé par **toutes les plateformes**. C'est la valeur portative — ces promesses survivent
> intactes quand on détache les piliers restaurant pour monter une autre industrie.

### 1.1 Persistence & Data Layer

| ID | Promesse | Type | Statut | Détail | Vérification | Priorité |
|---|---|---|---|---|---|---|
| CORE-001 | NexusAdapter singleton guardé | Infrastructure | OK | `src/lib/nexus/NexusAdapter.ts` — enveloppe tout adapter avec `NexusInterceptor` + `SovereignGuard`. | `npx tsc --noEmit` + import graph | P1 |
| CORE-002 | Simulacra adapter (dev/test) | Infrastructure | OK/PARTIAL | `src/infrastructure/adapters/Simulacra/` — simulation identifiée, plusieurs refs restent dans tests/dev. | Grep `isSimulation` | P2 |
| CORE-003 | Domain schemas Zod | Schema | OK/PARTIAL | 31 fichiers `src/domain/schemas/`. Types exportés via `z.infer<>`. Utilisation inégale aux frontières API — plusieurs routes cast manuellement. | Grep `z.parse` vs routes mutantes | P1 |
| CORE-004 | ICM-lite (chargement sélectif) | Architecture | OK | `src/lib/icm/TaskContext.ts` — `TASK_MAPS` par route, `NexusSyncService.init()` ne charge que HIGH/MEDIUM. | Vérifier que chaque nouvelle route a une entrée | P2 |

### 1.2 Sécurité & Multi-tenancy

| ID | Promesse | Type | Statut | Détail | Vérification | Priorité |
|---|---|---|---|---|---|---|
| CORE-005 | SovereignGuard isolation tenant | Guard | OK/PARTIAL | Path `tenants/{tenantId}/...` enforced. Collections immutables protégées. Whitelist large à surveiller. | Test cross-tenant en intégration | P0 |
| CORE-006 | NF525 immutabilité fiscale | Service | OK | `FinancialNexusBridge` + `FiscalSealer` + `FiscalAdapter` : double-écriture, hash chain SHA-256, numérotation séquentielle, `serverTimestamp`. | Jamais delete/update sur `journalEntries`, `fiscalSeals`, `fiscalLedger` | P0 |
| CORE-007 | Domain contracts neutres | Architecture | PARTIAL | Types métier promus vers `domain/schemas/` (commit `350b09198`). CartItem, FloorTable, ComplianceAlert, PurchaseOrder, etc. Reste : certains types encore dupliqués entre domain/ et modules/. | `grep -r "import type.*@/modules/" src/domain/` doit être 0 | P1 |

### 1.3 RBAC & Contrôle d'accès

| ID | Promesse | Type | Statut | Détail | Vérification | Priorité |
|---|---|---|---|---|---|---|
| CORE-010 | Architecture 3 niveaux (Page→Tab→Action) | Architecture | OK | Séparation propre ; hooks indépendants ; Nexus delta transparent ; aucun bypass SovereignGuard. | Revue architecture | P0 |
| CORE-011 | `usePageAccess` (niveau 1) | Hook | OK | Whitelist 25 pages × 11 rôles via `DEFAULT_PAGE_ACCESS` + delta Nexus. | Tests par rôle | P1 |
| CORE-012 | `useTabAccess` (niveau 2) | Hook | OK | `PERMISSION_ROLE_LEVELS[role]` vs `DEFAULT_TAB_ACCESS` + overrides delta. | Tests par rôle/tab | P1 |
| CORE-013 | `useActionPermission` (niveau 3) | Hook | OK | ACTION_MAP : 140+ actions, 26 pages, flags `requiresPin`. | Tests par rôle/action | P1 |
| CORE-014 | `PageGuard` / `withPageGuard` | Component | OK | HOC sur tous les `page.tsx`. Spinner `isAuthLoading`, fallback `<AccessDenied>`. | Grep `withPageGuard` dans `app/` | P1 |
| CORE-015 | `TabGuard` déployé | Component | OK | Tabs protégés : payroll, recruitment (staff), treasury, audit (finance), oracle (analytics), duerp (registre). | Grep `<TabGuard` dans modules | P1 |
| CORE-016 | `TenantRBACConfigSchema` | Schema | OK | Zod : 25 pages, 11 rôles, `DEFAULT_PAGE_ACCESS`, `DEFAULT_TAB_ACCESS` dans `src/domain/schemas/rbac.ts`. | Compile | P1 |
| CORE-017 | `/api/admin/rbac` auth-protégée | API | OK | `requireTenantRole` GET(manager)/POST(directeur) + Zod parse + `caller.tenantId`. | Curl sans token → 401 | P1 |
| CORE-018 | `rbacConfigAtom` Jotai | Store | OK | Path `tenants/${tenantId}/config/rbac` ; delta-based ; fallback hardcoded. | — | P1 |
| CORE-019 | `RolesPermissionsPanel` | UI | PARTIAL | Config JSON brut + save fonctionnel. **Matrice visuelle rôle×page absente.** | Ouvrir /settings → Rôles | P2 |

### 1.4 EventBus & Communication inter-modules

| ID | Promesse | Type | Statut | Détail | Vérification | Priorité |
|---|---|---|---|---|---|---|
| CORE-020 | NexusEventBus | Service | OK | 93 handlers dans `src/shared/eventBus/handlers/`. `registerHandlers.ts` en enregistre 91. | — | P1 |
| CORE-021 | Handlers `isSimulation` | EventBus | PARTIAL | 26 handlers lisent explicitement `isSimulation`. Les 67 autres doivent être revus par priorité métier. | Grep `isSimulation` | P2 |
| CORE-022 | `SilaeExportHandler` | EventBus | DEAD | Remplacé par `PayrollExportHandler`, non enregistré. Résidu. | Vérifier 0 import | P2 |

### 1.5 Architecture & Boundaries

| ID | Promesse | Type | Statut | Détail | Vérification | Priorité |
|---|---|---|---|---|---|---|
| CORE-008 | Mur de Chine ESLint | Tooling | OK | `eslint-plugins/mur-de-chine.mjs` : `no-cross-imports` (client↔admin) + `no-inter-module-imports` (inter-pilier statique + dynamique). `import type` exclu (pas de couplage runtime). | `npx eslint .` | P1 |
| CORE-008b | FIX-04 vecteur shared/hooks→modules | Tooling | PARTIAL | Règle étendue à `src/shared/hooks/` et `src/lib/`. Composition roots whitelistés. 2 hooks marqués FIXME (`useActionPermission`, `useNexusFleet`). | Grep FIXME FIX-04 | P1 |
| CORE-009 | Sentrux gate | Tooling | OK/PARTIAL | `.sentrux/` : cycles, god files, couches. `./scripts/preflight.sh` inclut sentrux. Non câblé en CI. | `sentrux check .` | P2 |

### 1.6 Observabilité & Push

| ID | Promesse | Type | Statut | Détail | Vérification | Priorité |
|---|---|---|---|---|---|---|
| CORE-030 | WebPush client-safe | Service | OK | `src/lib/push/browserPush.ts` + `webPushService.ts`. Pattern `sendToUser` + ciblage rôle. Conditionné aux clés VAPID en env. | Grep `web-push` hors serveur = 0 | P2 |
| CORE-031 | Pillar sync registry | Service | VIOLATION | `src/infrastructure/services/sync/pillarSyncRegistry.ts` importe directement des modules depuis `infrastructure`. | Refactorer vers EventBus | P1 |

---

## 2. Piliers Métier (Restaurant OS)

> **Remplaçables par industrie.** Quand tu crées Bâtiment OS, tu remplaces `ops/pos` par `ops/site-management`,
> `compliance/haccp` par `compliance/construction-safety`, etc. Le noyau (section 1) reste identique.

### 2.1 ops — Opérations restaurant

| ID | Promesse | Type | Statut | Détail | Vérification | Priorité |
|---|---|---|---|---|---|---|
| PIL-OPS-001 | POS → Finance bridge | Adapter | OK | `FinancialNexusBridge` scelle et émet les événements. Double-écriture JournalEntry + FiscalSeal. | Tests POS/NF525 | P0 |
| PIL-OPS-002 | KDS handlers | EventBus | OK/PARTIAL | Handlers enregistrés ; simulation variable selon handler. | Matrice `isSimulation` | P2 |
| PIL-OPS-003 | Barrel violations ops | Architecture | VIOLATION | Core/shared imports directs vers `ops/engine/types`, providers, composants. 46 FIXME restants (runtime). | Grep FIXME Modular Monolith dans ops/ | P1 |

### 2.2 commerce — CRM, Marketing, Réservations

| ID | Promesse | Type | Statut | Détail | Vérification | Priorité |
|---|---|---|---|---|---|---|
| PIL-COM-001 | Marketing/CRM handlers | EventBus | OK/PARTIAL | RFM, loyalty, campaigns enregistrés. | Tests bus → Nexus | P2 |
| PIL-COM-002 | Widgets publics | API | PARTIAL | Routes publiques nécessaires mais sensibles. Pas de rate-limit ni validation tenant/api key. | Audit routes widget/ | P1 |

### 2.3 compliance — HACCP, Audit, RGPD

| ID | Promesse | Type | Statut | Détail | Vérification | Priorité |
|---|---|---|---|---|---|---|
| PIL-CMP-001 | HACCP append-only | Service | OK/PARTIAL | `haccpLogs`, `iotHistory` immuables dans SovereignGuard. | Test no update/delete en intégration | P1 |
| PIL-CMP-002 | `PeriodLockGuardHandler` | EventBus | PARTIAL | Update sous `tenants/{tenantId}/fiscalLedger/locks`. Devrait être append-only ou hors `fiscalLedger`. | Vérifier path Firestore | P1 |
| PIL-CMP-003 | PiiVault transverse | Service | OK | Déplacé vers `src/shared/nexus/vault/PiiVault.ts` (commit `f1959b242`). Chiffrement AES-GCM, PBKDF2. | 2 consommateurs pointent vers shared/nexus/vault | P1 |

### 2.4 finance — Comptabilité, Facturation, Banking

| ID | Promesse | Type | Statut | Détail | Vérification | Priorité |
|---|---|---|---|---|---|---|
| PIL-FIN-001 | NF525 bridge complète | Adapter | OK | Double-entry, hash chain, server timestamp, transaction. | Tests offline sync serveur | P0 |
| PIL-FIN-002 | Champs `*InCents` persistants | Modèle | VIOLATION | 118 occurrences dans `domain/` et `contracts/`. Surtout finance, logistics, accounting, procurement. | Grep InCents dans domain/+contracts/ | P1 |
| PIL-FIN-003 | Billing Stripe MCC | API/UI | PARTIAL | Portal Stripe réel si configuré ; fallback 503. | Tests e2e Stripe mock | P1 |

### 2.5 human — RH, Paie, Planning

| ID | Promesse | Type | Statut | Détail | Vérification | Priorité |
|---|---|---|---|---|---|---|
| PIL-HUM-001 | Payroll plug-and-play | Factory/UI/API | OK | Modèle canonical : `catalog`, `register`, `ping`, routes admin. | Garder comme template | P2 |

### 2.6 intelligence — IA, RAG, Analytics

| ID | Promesse | Type | Statut | Détail | Vérification | Priorité |
|---|---|---|---|---|---|---|
| PIL-INT-001 | RAG LightRAG | Service | PARTIAL | Client réel ; provisioning tolère absence sidecar. | Health gate explicite dans MCC | P2 |
| PIL-INT-002 | Support IA Gemini | Handler/API | OK/PARTIAL | Route tenant enregistre handler serveur ; Gemini réel si clé. | Queue durable/retry si absent | P2 |
| PIL-INT-003 | Core→intelligence imports | Architecture | VIOLATION | `shared/hooks`, `lib` importent directement des modules intelligence. 2 marqués FIXME FIX-04. | Extraire interfaces vers contracts | P1 |

### 2.7 logistics — Stocks, Fournisseurs, Procurement

| ID | Promesse | Type | Statut | Détail | Vérification | Priorité |
|---|---|---|---|---|---|---|
| PIL-LOG-001 | Inventory/stock engine | Services | PARTIAL | Logique présente ; encore champs coût `InCents`. | Migrer vers microunits | P1 |
| PIL-LOG-002 | Procurement | Domain | PARTIAL/VIOLATION | PO/three-way match en cents. Types promus vers `domain/schemas/inventory.ts` (commit `350b09198`). | Adapter microunits | P1 |

### 2.8 facility — Espace physique, Équipements, Maintenance (NOUVEAU)

> **Pilier 8.** Créé pour séparer la gestion de l'espace physique (plan de salle, zones, tables)
> et des actifs (équipements, maintenance) des opérations temps réel (POS, KDS).
> Domaines : `spaces/` (layout, capacité), `assets/` (cycle de vie), `maintenance/` (registres, GMAO).

| ID | Promesse | Type | Statut | Détail | Vérification | Priorité |
|---|---|---|---|---|---|---|
| PIL-FAC-001 | Floor plan editor (Konva) | UI/Component | OK | Éditeur 2D drag-n-drop, multi-étage, zones colorées. Rapatrié depuis `ops/engine/components/floor-plan/`. | Ouvrir /floor-plan | P1 |
| PIL-FAC-002 | Types Table/Floor/Zone | Domain | OK | `src/modules/facility/spaces/types.ts`. Re-export rétrocompat depuis `ops/engine/tables.types.ts`. | `npx tsc` | P1 |
| PIL-FAC-003 | Hooks floor-plan | Hook | PARTIAL | Proxy vers `ops/providers/hooks/floorHooks` (dépend guardedAction). Migration complète quand infra découplée. | — | P2 |
| PIL-FAC-004 | Registre sécurité (DUERP, incendie, PMR) | UI/Components | OK | 7 sections rapatriées depuis `ops/engine/components/registre/`. | Ouvrir /registre | P1 |
| PIL-FAC-005 | Settings tables/mobilier | UI/Settings | OK | `FloorArchitecture`, `MobilierConfig`, `ZoneService`, `TablesToolbar`. Rapatrié depuis `shared/components/settings/tables/`. | Ouvrir /settings → Tables | P2 |
| PIL-FAC-006 | Assets registry | Domain | STUB | Domaine `assets/` créé, pas encore de logique métier. Cible : inventaire matériel, cycle de vie, amortissement. | — | P3 |
| PIL-FAC-007 | Maintenance/GMAO | Domain | STUB | Domaine `maintenance/` contient registre sécurité. Manque : tickets maintenance, contrats prestataires, planning interventions. | — | P3 |

---

## 3. Connecteurs Plug-and-Play

> **Portables entre plateformes.** Un `PayrollConnectorFactory` fonctionne aussi bien pour Restaurant OS
> que pour Bâtiment OS — seuls les providers concrets changent. La structure `catalog/register/ping`
> est le contrat universel.

### Référence : PayrollConnectorFactory (modèle canonical)

Le seul connecteur complet. Tout nouveau connecteur doit s'aligner sur ce contrat.

### Inventaire

| ID | Factory | Pilier | Providers | Catalogue | `register()` | `ping()` | Route admin | Statut |
|---|---|---|---:|---|---|---|---|---|
| CON-001 | `PayrollConnectorFactory` | human | 2 (Silae, Merge) | oui | oui | oui | oui | OK |
| CON-002 | `RecruitmentProviderFactory` | human | 1 (Merge) | non | non | non | non | PARTIAL |
| CON-003 | `TimeclockProviderFactory` | human | 2 (Manual, QRCode) | non | non | non | non | PARTIAL |
| CON-004 | `DeliveryProviderFactory` | ops | 2 (UberEats, ClickCollect) | non | non | non | non | PARTIAL |
| CON-005 | `ReservationProviderFactory` | ops | 2 (Widget, Zenchef) | non | non | non | non | PARTIAL |
| CON-006 | `ReviewProviderFactory` | commerce | 1 (GoogleBusiness) | non | non | non | non | PARTIAL |
| CON-007 | `EmailMarketingProviderFactory` | commerce | 2 (Native, Brevo) | non | non | non | non | PARTIAL |
| CON-008 | `AccountingProviderFactory` | finance | 1 (Pennylane) | non | non | non | non | PARTIAL |
| CON-009 | `PaymentProviderFactory` | finance | 1 (Stripe) | non | non | non | non | PARTIAL |
| CON-010 | `InvoiceProviderFactory` | finance | 2 (Gmail, IMAP) | non | non | non | non | PARTIAL |
| CON-011 | `OpenBankingProviderFactory` | finance | 5 (Powens, Bridge, GoCardless, Tink, Qonto) | non | non | non | non | PARTIAL |
| CON-012 | `IoTProviderFactory` | compliance | 2 (MQTT, Webhook) | non | non | non | non | PARTIAL |
| CON-013 | `WeatherProviderFactory` | intelligence | 3 (OpenWeather, MeteoFrance, Ticketmaster) | non | non | non | non | PARTIAL |
| CON-014 | `SupplierProviderFactory` | logistics | 1 (EmailPDF) | oui | non | non | non | PARTIAL |
| CON-015 | `TerminalAdapterFactory` | ops/infra | 14 (Stripe, Sunday, Adyen, Conecs, Ingenico, LyfPay, PayGreen, Square, SumUp, Verifone, Worldline, Zettle, Manual, Simulator) | non | non | non | non | PARTIAL |

### Contrat cible universel (à implémenter sur CON-002 → CON-015)

```
interface ConnectorContract<T> {
  PROVIDER_CATALOG: Record<string, ProviderMeta>
  register(providerId: string, config: T): void
  ping(providerId: string): Promise<HealthStatus>
  getProvider(providerId: string): T
  // Route admin: GET /api/admin/connectors/{category}/providers
  // Route admin: POST /api/admin/connectors/{category}/test
}
```

---

## 4. MCC — Management Control Center

> **Partagé par toutes les plateformes.** Le MCC gère la flotte de tenants, le billing,
> le monitoring, le MDM, les plugins. Il ne contient aucune logique métier restaurant.

### 4.1 Infrastructure MCC

| Zone | Volume |
|---|---:|
| Tabs `src/app/(admin)/admin/mcc/_tabs/` | 9 |
| Panneaux `src/shared/nexus/guards/admin/mcc/` | 29 + composants |
| Routes `src/app/api/admin/mcc/` | 7 directes |
| Routes fleet `src/app/api/admin/fleet/` | 40 |
| Engines `src/shared/nexus/engines/mcc/` | provisioning + changelog |

### 4.2 Promesses MCC

| ID | Promesse | Type | Statut | Détail | Vérification | Priorité |
|---|---|---|---|---|---|---|
| MCC-001 | Provisioning tenant | Engine | PARTIAL | Crée config, Stripe customer, RAG bootstrap, admin Firebase. Stripe mock si env absente. **Pas de rollback en cas d'échec partiel.** | Test provisioning complet + rollback | P0 |
| MCC-002 | Disaster recovery PITR | API/UI | PARTIAL | PITR tenté via REST, fallback simulé. Restore cible une base séparée mais ne replay pas vers tenant actif. **NF525 non validé dans le restore.** | Test bout-en-bout restore | P0 |
| MCC-003 | Billing Stripe tenant | API/UI | PARTIAL | Portal Stripe réel si configuré ; fallback 503. | Tests contractuels | P1 |
| MCC-004 | Fleet monitoring | UI/Context | PARTIAL | Données via `useFleet`, panels calculés localement. Pas de télémétrie historisée. | Brancher heartbeat/crash auth | P1 |
| MCC-005 | MDM Mosyle/Apple | API | STUB | `MDM_SERVER_URL` absent → endpoint mock, JWT fictif. | Implémenter client réel ou expliciter simulation | P1 |
| MCC-006 | API Gateway | API | PARTIAL | Révocation clé réelle. Pas de rotation automatique ni rate-limit complet. | Ajouter rotate, usage metrics | P1 |
| MCC-007 | Plugin system | API/UI | PARTIAL | Catalogue et enable/disable réels. Proration billing TODO. | Émettre événement billing | P2 |
| MCC-008 | Changelog/PatchCenter | Service/UI | OK/PARTIAL | `ChangelogService` réel, dépend du wiring tenant. | Diff de config + signature opérateur | P2 |
| MCC-009 | Support IA | API/UI | OK/PARTIAL | Gemini + drafts ; fallback absent si env. | Queue et retry ; audit PII | P2 |
| MCC-010 | Reseller portal | API/UI | PARTIAL | CRUD/commissions signalés, panel encore mock par scan. | Test commissions Stripe invoices | P2 |
| MCC-011 | Certification center | UI | PARTIAL | Lit fleet/compliance, checklist à vérifier. | Checklist issue de règles versionnées | P2 |
| MCC-012 | Strategy Oracle | UI | PARTIAL | Signal mock/static. | Brancher route ou afficher indisponible | P3 |
| MCC-013 | Fiscal Chain Explorer | UI | OK/PARTIAL | Lit provider fiscal. Pas de recompute chain serveur ni export audit complet. | Recompute chain côté serveur | P1 |
| MCC-014 | Performance Monitor | UI | PARTIAL | Pas de fetch/API direct détecté. | Connecter Axiom/Sentry/heartbeat | P2 |

### 4.3 Panneaux MCC — Maturité

| Panneau | API réelle | Nexus réel | Mock/statique | Statut |
|---|---|---|---|---|
| `DeploymentEngine` | oui | oui | — | OK |
| `DisasterRecoveryPanel` | partiel | — | fallback simulé | PARTIAL |
| `MCCTreasury` | oui | oui | — | OK |
| `TenantUsersPanel` | oui | oui | — | OK |
| `SupportDraftsPanel` | oui | oui | — | OK |
| `PluginEnginePanel` | oui | partiel | — | OK/PARTIAL |
| `TenantOverridePanel` | oui | oui | — | OK |
| `TenantBillingPanel` | Stripe | oui | fallback 503 | PARTIAL |
| `TenantChangelogPanel` | oui | oui | — | OK |
| `FiscalChainExplorer` | oui | oui | — | OK/PARTIAL |
| `EventBusHealthPanel` | oui | oui | — | OK |
| `MCCAuditStream` | oui | oui | — | OK |
| `MCCInsights` | partiel | — | calcul local | PARTIAL |
| `FleetCommandTable` | — | — | données calculées | PARTIAL |
| `FleetDeviceInventory` | — | — | données calculées | PARTIAL |
| `FleetTelemetryPanel` | — | — | pas de fetch direct | PARTIAL |
| `FleetUpgradePanel` | — | — | statique | PARTIAL |
| `PluginCatalogManager` | partiel | partiel | mock scan | PARTIAL |
| `ResellerPortal` | partiel | — | mock scan | PARTIAL |
| `StrategyOracle` | — | — | statique | PARTIAL |
| `SupportAIPanel` | Gemini | oui | fallback absent | PARTIAL |
| `TaxAuditPanel` | — | — | statique | PARTIAL |
| `TrustedDevicePanel` | — | — | statique | PARTIAL |
| `PerformanceMonitor` | — | — | pas de fetch | PARTIAL |
| `CertificationCenter` | partiel | oui | checklist statique | PARTIAL |
| `AIWorkshop` | Gemini | — | fallback absent | PARTIAL |
| `DeviceManager` | partiel | oui | MDM mock | STUB |
| `LifecycleTreePanel` | oui | oui | — | OK |

---

## 5. Violations & Dette Technique

> Chaque violation a un ID `DEBT-xxx` stable pour le suivi dans le MCC.
> Le statut **DONE** signifie que le correctif est appliqué et vérifié.

| ID | Catégorie | Statut | Mesure | Détail | Correctif appliqué/prévu |
|---|---|---|---:|---|---|
| DEBT-001 | Tête/corps (FIX-04) | PARTIAL | 23 imports | `shared/hooks`, `lib`, `infrastructure` → `@/modules/`. | Règle ESLint étendue (commit `350b09198`). 2 hooks marqués FIXME FIX-04, 21 restants non couverts par la règle (settings, providers, contexts = composition roots). |
| DEBT-002 | Inter-module runtime | PARTIAL | 46 FIXME | Imports runtime cross-pilier marqués `eslint-disable`. | Mur de Chine actif (commit `f1959b242`). Aucun nouvel import autorisé. Migration progressive : EventBus ou extraction type vers domain/. |
| DEBT-003 | `import type` cross-module | DONE | 10 → 0 | `import type` n'est plus bloqué (faux positifs). Types promus vers `domain/schemas/`. | Commit `350b09198` : 10 types migrés. |
| DEBT-004 | Monnaie `*InCents` | VIOLATION | 118 occurrences | Dans contracts, finance, logistics, accounting, procurement. Légitime aux frontières PSP/import. | Plan de migration microunits par couches. Conserver cents seulement aux frontières PSP/imports. |
| DEBT-005 | Routes sans auth | VIOLATION | 134 routes | Beaucoup sont publiques par design (widget, health, resolve-domain). 13 routes sensibles sans auth. | FIX-07 : ajouter `requireTenantRole`, secret cron, signature webhook. `/api/admin/rbac` déjà résolu. |
| DEBT-006 | Barrel bypass | VIOLATION | ~250 imports | `@/modules/<pilier>/...` contourne le barrel `index.ts`. | Migration progressive par pilier. Exception tests/outils documentée. |
| DEBT-007 | Fiscal ledger lock | PARTIAL | 1 handler | `PeriodLockGuardHandler` update sous `fiscalLedger/locks`. | Déplacer vers `periodLocks` ou modéliser append-only. |
| DEBT-008 | `pillarSyncRegistry` | VIOLATION | 1 fichier | `src/infrastructure/services/sync/pillarSyncRegistry.ts` importe directement les modules. | Refactorer vers EventBus. |

---

## 6. Backlog Correctifs (FIX-xx)

> Ordonnés par priorité. Le champ **Statut** est suivi dans le MCC dashboard.
> `TODO` → `IN_PROGRESS` → `DONE` → `VERIFIED`

| ID | Priorité | Statut | Promesses | Effort | Action | Dépendances |
|---|---|---|---|---|---|---|
| FIX-01 | P0 | TODO | MCC-001 | L | Provisioning : refuser sans Stripe/Firebase/Resend en prod ; ajouter rollback Firestore/Auth/Stripe. | — |
| FIX-02 | P0 | TODO | MCC-002 | XL | Disaster recovery : job orchestré backup→restore→diff→replay hors NF525→validation opérateur. | FIX-01 |
| FIX-03 | P1 | TODO | MCC-005 | L | MDM : client concret avec contrat, secrets obligatoires en prod, test sandbox. | Choix fournisseur MDM |
| FIX-04 | P1 | IN_PROGRESS | DEBT-001, CORE-007 | XL | Types/interfaces vers `domain/schemas/` ou `shared/nexus/contracts`. **10/23 résolus** (commit `350b09198`). Reste : composition roots à auditer. | Tests TypeScript |
| FIX-05 | P1 | TODO | DEBT-004, PIL-FIN-002 | XL | Migration microunits : introduire `*InMicrounits`, adapters legacy, tests de conversion. | MIGRATION-microunits.md |
| FIX-06 | P1 | TODO | DEBT-007, PIL-CMP-002 | M | `PeriodLockGuardHandler` : déplacer dans `periodLocks` ou modéliser append-only. | FiscalGuard |
| FIX-07 | P1 | IN_PROGRESS | DEBT-005, CORE-017 | M | Routes sans auth : `requireTenantRole`, secret cron, signature webhook. **1/14 résolu** (`/api/admin/rbac`). 13 restantes. | SecuritySentinel |
| FIX-08 | P1 | TODO | CON-002→CON-015 | L | Standard provider contract : `ping()`, `PROVIDER_CATALOG`, `register()`, route admin test. | CON-001 template |
| FIX-09 | P2 | TODO | CORE-022 | S | Supprimer `SilaeExportHandler.ts` mort. | FIX-08 |
| FIX-10 | P2 | TODO | MCC-007 | M | Plugin billing : émettre événement + recalcul Stripe subscription item proration. | Billing tests |
| FIX-11 | P2 | TODO | MCC-010 | M | Reseller : calculer commissions depuis invoices Stripe payées → ledger reseller. | Stripe env |
| FIX-12 | P2 | TODO | MCC-014, MCC-004 | M | Monitoring : brancher Axiom/Sentry/heartbeat avec historique par tenant. | Auth telemetry |
| FIX-13 | P2 | TODO | CORE-003 | L | Validation Zod : `z.parse/safeParse` pour toutes routes mutantes + tests invalid body. | — |
| FIX-14 | P3 | TODO | — | S | Graphify stale : `graphify update .` après remédiations. | Après FIX-04/05 |

---

## 7. Corpus (Snapshot)

> Mis à jour à chaque audit. Permet de mesurer la croissance et détecter les dérives.

| Zone | Commit `350b09198` | Précédent (`8362ff337`) | Delta |
|---|---:|---:|---:|
| Fichiers TS/TSX sous `src/` | 1888 | 1879 | +9 |
| Fichiers TS/TSX sous `src/modules/` | 801 | 802 | −1 |
| Routes API | 144 | 143 | +1 |
| Handlers EventBus | 93 | 93 | 0 |
| Schémas Zod `domain/schemas/` | 31 | 30 | +1 |
| Panneaux MCC | 44 | 30 | +14 |

### Piliers — Volume par module (8 piliers)

| Pilier | Domaines | Sous-modules | Fichiers | État |
|---|---|---|---:|---|
| ops | service, production | bar, connectors, constants, engine, frontdesk, kds, kitchen, pos, printers, providers, recipes, types | 143 | PARTIAL |
| commerce | acquisition, relationship, transaction | connectors, crm, customers, delivery, landing, loyalty, marketing, quotes, reservations, seo, ui, widgets | 155 | PARTIAL |
| compliance | regulatory, legal, safety | audit, calendar, connectors, donation, haccp, iot, recall, rgpd, services, types | 99 | PARTIAL |
| finance | accounting, treasury, control | accounting, analytics, ap, banking, billing, collection, components, connectors, documents, domain, fec, hooks, migration, payout, providers, repositories, services, store, tax, types | 136 | OK/PARTIAL |
| human | workforce, operations, development | connectors, hr, payroll, services | 79 | PARTIAL |
| intelligence | analytics, ai, knowledge | agency, ai, analytics, anomaly, attendance, connectors, domain, fleet, migration, rag, reports, resilience, services, simulator, tools | 97 | PARTIAL |
| logistics | inbound, storage, outbound | connectors, domain, hooks, inventory, migration, reception, services | 55 | PARTIAL |
| **facility** | **spaces, assets, maintenance** | **floor-plan, settings, registre** | **22** | **NEW** |

---

## 8. Schéma Nexus MCC (pour dashboard auto-sync)

> Chaque promesse est persistée dans Nexus à `mcc/promises/{id}`.
> Le dashboard MCC lit cette collection pour afficher le suivi en temps réel.

```
// ─── Collection 1 : mcc/promises/{id} ─────────────────────────────────────
Promise {
  id: string                    // "CORE-001", "PIL-OPS-001", "MCC-001", etc.
  name: string                  // Titre court
  layer: 'core' | 'pillar' | 'connector' | 'mcc' | 'debt'
  pillar?: string               // "ops", "finance", etc. (null pour core/mcc/debt)
  platform: string[]            // ["*"] pour core/mcc, ["restaurant-os"] pour piliers
  status: 'OK' | 'PARTIAL' | 'STUB' | 'DEAD' | 'VIOLATION' | 'DONE'
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  detail: string
  verification: string          // Comment prouver que ça marche
  fixIds: string[]              // ["FIX-04", "FIX-07"] si lié à un correctif
  files: string[]               // Fichiers clés
  lastVerifiedCommit?: string
  lastVerifiedAt?: number       // timestamp
  updatedAt: number
}

// ─── Collection 2 : mcc/fixes/{id} ────────────────────────────────────────
FixItem {
  id: string                    // "FIX-01"
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'VERIFIED'
  effort: 'S' | 'M' | 'L' | 'XL'
  promiseIds: string[]          // Promesses impactées
  action: string
  dependencies: string[]        // Autres FIX IDs
  assignedTo?: string
  updatedAt: number
}

// ─── Collection 3 : mcc/events/{handlerId} ────────────────────────────────
// Cartographie complète EventBus — 93 handlers enregistrés
EventHandler {
  id: string                    // "stock-deduction", "kds-routing", etc.
  name: string                  // "StockDeductionHandler"
  file: string                  // "src/shared/eventBus/handlers/StockDeductionHandler.ts"
  pillar: string                // "ops", "finance", "compliance", etc.
  domain: string                // "stock", "kds", "payment", "haccp", "crm", etc.
  eventType: string             // Event name listened to
  emits?: string[]              // Events emitted by this handler (cascades)
  isSimulation: boolean         // true si handler a un guard `isSimulation`
  isRegistered: boolean         // true si présent dans registerHandlers.ts
  hasDLQ: boolean               // true si dead-letter-queue supporté
  platform: string[]            // ["restaurant-os"] ou ["*"]
  status: 'active' | 'dead' | 'stub'
  dependencies: string[]        // Autres handlers déclenchés en cascade
  updatedAt: number
}

// ─── Collection 4 : mcc/rbac/pages/{pageKey} ──────────────────────────────
// Matrice RBAC complète — Page Access (niveau 1)
RBACPageEntry {
  pageKey: string               // "pos", "kds", "floor-plan", "analytics", etc.
  allowedRoles: string[]        // ["super_admin", "directeur", "manager", ...]
  guardType: 'withPageGuard'    // HOC utilisé
  file: string                  // "src/app/(client)/(ops)/pos/page.tsx"
  platform: string[]            // ["restaurant-os"]
  updatedAt: number
}

// ─── Collection 5 : mcc/rbac/tabs/{pageKey}/{tabKey} ──────────────────────
// Matrice RBAC — Tab Access (niveau 2)
RBACTabEntry {
  pageKey: string               // "finance", "staff", "analytics", "registre"
  tabKey: string                // "treasury", "payroll", "oracle", "duerp"
  minLevel: number              // PERMISSION_ROLE_LEVELS seuil (ex: 70 = directeur+)
  guardComponent: 'TabGuard'
  file: string                  // Fichier du tab protégé
  platform: string[]
  updatedAt: number
}

// ─── Collection 6 : mcc/rbac/actions/{pageKey}/{actionKey} ────────────────
// Matrice RBAC — Action Permissions (niveau 3)
RBACActionEntry {
  pageKey: string               // "pos", "finance", "stock", etc.
  actionKey: string             // "void_ticket", "apply_discount_above_30", etc.
  minLevel: number              // Seuil rôle requis
  requiresPin: boolean          // true si PIN manager requis
  platform: string[]
  updatedAt: number
}

// ─── Collection 7 : mcc/connectors/{category} ─────────────────────────────
// Inventaire connecteurs cross-plateforme
ConnectorEntry {
  id: string                    // "CON-001"
  category: string              // "payroll", "delivery", "payment", etc.
  factoryName: string           // "PayrollConnectorFactory"
  pillar: string                // "human", "ops", "finance", etc.
  providerCount: number
  providers: string[]           // ["silae", "merge"]
  hasCatalog: boolean
  hasRegister: boolean
  hasPing: boolean
  hasAdminRoute: boolean
  platform: string[]            // ["*"] si portable, ["restaurant-os"] si spécifique
  status: 'OK' | 'PARTIAL' | 'STUB'
  updatedAt: number
}

// ─── Collection 8 : mcc/boundaries/{ruleId} ───────────────────────────────
// État des frontières architecturales (Mur de Chine, barrels, FIX-04)
BoundaryRule {
  id: string                    // "no-cross-imports", "no-inter-module-imports", "barrel-only"
  tool: string                  // "eslint", "sentrux", "tsc"
  scope: string                 // "src/modules/", "src/shared/hooks/", "src/lib/"
  violationCount: number        // Nombre actuel de violations
  whitelistedPaths: string[]    // Composition roots, etc.
  lastScanCommit: string
  lastScanAt: number
  platform: string[]            // ["*"]
  updatedAt: number
}
```

### Panels MCC correspondants

| Collection Nexus | Panel Dashboard MCC | Vue |
|---|---|---|
| `mcc/promises/` | **PromiseTracker** | Kanban par statut, filtrable par layer/pillar/platform |
| `mcc/fixes/` | **FixBacklog** | Table triée par priorité, workflow drag-n-drop |
| `mcc/events/` | **EventBusCartography** | Graphe interactif handlers→events→cascades, filtre par pilier |
| `mcc/rbac/pages/` | **RBACPageMatrix** | Heatmap rôles × pages (vert=accès, rouge=bloqué) |
| `mcc/rbac/tabs/` | **RBACTabMatrix** | Sous-matrice tabs par page, seuils numériques |
| `mcc/rbac/actions/` | **RBACActionMatrix** | Grille actions × rôles, indicateur PIN requis |
| `mcc/connectors/` | **ConnectorRegistry** | Catalogue providers, health ping, couverture contrat |
| `mcc/boundaries/` | **ArchitecturalHealth** | Jauge violations, tendance par commit, alertes régression |

---

## 9. Cartographie EventBus (93 handlers)

> Donnée source pour le panel **EventBusCartography** dans le MCC.
> Chaque handler est un nœud dans le graphe ; les cascades (handler A émet → handler B consomme) sont les arêtes.

### 9.1 Par domaine métier

| Domaine | Handlers | Exemples | Pilier |
|---|---:|---|---|
| Stock/Inventory | 10 | StockDeduction, StockAlert, StockReception, StockRestitution, StockTransfer, StockZeroBlocker, PhysicalInventory, WasteStockReconciliation, FoodCostRecomputer, MarginWarning | ops/logistics |
| KDS/Kitchen | 5 | KdsRouting, KdsCourseManager, KdsPrepTimeAnalyzer, KdsPassNotifier, KdsPrintFallback | ops |
| Payment/Finance | 7 | PaymentLedger, SplitPayment, CompEntry, RefundExtourne, RefundJournal, CashflowForecast, StripePaymentRetry | finance |
| Payroll/HR | 8 | PayrollTimeclock, PayrollAutoCalc, PayrollCompliance, PayrollExport, AbsenceUnderstaffing, LaborCostAnalyzer, ScheduleNotifier, OvertimeAlert | human |
| CRM/Marketing | 7 | CustomerRFMAnalyzer, LoyaltyEngine, MarketingCampaignRouter, BirthdayOffer, NegativeReview, InactiveCustomer, PromotionExpiry | commerce |
| Compliance/HACCP | 8 | HaccpCheckArchiver, NonConformAction, TrainingComplianceAlert, ComplianceDeadline, ComplianceCalendar, QuarantineActivated, Quarantine, DLCExpiry | compliance |
| Reservations/Floor | 7 | ReservationNotifier, FloorPlanCapacity, NoShowPenalty, NoShowCRM, NoShowTableRelease, TableAutoRelease, TableTurnoverAnalyzer | ops |
| Delivery/Aggregator | 4 | OrderAcceptanceWindow, AggregatorMenuSync, AggregatorStockSync, DeliveryRushMode | ops/commerce |
| POS/Fiscal | 3 | TicketZ, RecallPOSBlocker, CashDrawerAnomaly | ops |
| Supplier/Banking | 4 | SupplierInvoiceLedger, SepaExport, BankSyncAudit, ReconciliationEngine | finance |
| Sovereign/Security | 3 | SovereignBreach, PeriodLockGuard, PinLockoutNotifier | core |
| Intelligence/Fleet | 4 | Intelligence, FleetOutbox, FleetStratBriefing, OracleQueryAudit | intelligence |
| Cross-cutting | 9 | AntiCorruptionLayer, PrivacyConsent, RecruitmentRouter, OnboardingProgress, MedicalVisitAlert, ContractRenewalAlert, BigGroupAlert, OverdueInvoice, PromotionPrice | multi |
| Resilience/Ops | 4 | ReportRetry, LLMFallback, GracePeriod, WeeklyReport | core/intelligence |
| Support | 1 | SupportTicketAnalysis | intelligence |
| Migration | 2 | CertExpiry, BankConnectionExpired | compliance/finance |
| Paie export | 2 | SilaeExport (DEAD), RainStaffing, WasteToFoodCost | human/compliance |
| Resa kitchen | 2 | ResaKitchenTask, ResaReminder | ops |

### 9.2 Handlers non enregistrés (DEAD / orphelins)

| Handler | Raison | Action |
|---|---|---|
| `SilaeExportHandler` | Remplacé par `PayrollExportHandler` agnostique | Supprimer (FIX-09) |

### 9.3 Cascades critiques (séquences événementielles)

```
order.closed → [StockDeduction, TicketZ, PaymentLedger, TableTurnoverAnalyzer, FoodCostRecomputer]
stock.threshold_reached → [StockAlert → (push notification)]
haccp.check_failed → [NonConformAction → QuarantineActivated → RecallPOSBlocker]
reservation.noshow → [NoShowPenalty, NoShowCRM, NoShowTableRelease]
payroll.period_closed → [PayrollAutoCalc → PayrollExport → SepaExport]
delivery.order_received → [OrderAcceptanceWindow → KdsRouting → AggregatorStockSync]
```

---

## 10. Matrice RBAC complète

> Donnée source pour les panels **RBACPageMatrix**, **RBACTabMatrix**, **RBACActionMatrix**.
> 11 rôles × 25 pages × ~90 tabs × 140+ actions.

### 10.1 Rôles (ordonnés par niveau)

| Rôle | Niveau | Accès type |
|---|---:|---|
| `super_admin` | 100 | Tout |
| `directeur` | 90 | Tout sauf nexus/migration/governance |
| `manager` | 70 | Gestion quotidienne complète |
| `comptable` | 60 | Finance, analytics, inventory |
| `chef_rang` | 50 | Salle, réservations, CRM |
| `chef_cuisinier` | 45 | Cuisine, recettes, HACCP |
| `barman` | 35 | Bar, POS, timeclock |
| `serveur` | 35 | POS, salle, timeclock |
| `hotesse` | 30 | Réservations, accueil |
| `cuisinier` | 25 | Cuisine, HACCP |
| `plongeur` | 10 | Mon espace uniquement |

### 10.2 Matrice Pages (niveau 1) — `DEFAULT_PAGE_ACCESS`

| Page | super_admin | directeur | manager | comptable | chef_rang | serveur | chef_cuisinier | cuisinier | barman | hotesse | plongeur |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| pos | x | x | x | | x | x | | | x | | |
| pos_mobile | x | x | x | | x | x | | | x | | |
| kds | x | x | x | | x | x | x | x | x | | |
| kitchen | x | x | x | | | | x | x | | | |
| bar | x | x | x | | x | | | | x | | |
| floor_plan | x | x | x | | x | x | | | | x | |
| reservations | x | x | x | | x | x | | | | x | |
| staff | x | x | x | | x | | | | | | |
| planning | x | x | x | | x | | x | | | | |
| timeclock | x | x | x | x | x | x | x | x | x | x | x |
| recruitment | x | x | x | | | | | | | | |
| leaves | x | x | x | x | x | x | x | x | x | x | x |
| finance | x | x | x | x | | | | | | | |
| haccp | x | x | x | | | | x | x | | | |
| inventory | x | x | x | x | | | x | x | x | | |
| crm | x | x | x | x | x | | | | | x | |
| marketing | x | x | x | | x | | | | | | |
| analytics | x | x | x | x | | | | | | | |
| intelligence | x | x | x | | | | | | | | |
| menu_builder | x | x | x | | | | x | | | | |
| registre | x | x | x | x | | | x | | | | |
| operations | x | x | x | | x | | x | | | | |
| settings | x | x | x | | | | | | | | |
| mon_espace | x | x | x | x | x | x | x | x | x | x | x |
| migration | x | x | | | | | | | | | |

### 10.3 Matrice Tabs (niveau 2) — seuils numériques

> Un rôle accède au tab si son niveau ≥ seuil indiqué. Ex: `oracle: 90` → seuls directeur+ y accèdent.

| Page | Tab | Seuil | Accès effectif |
|---|---|---:|---|
| kitchen | mise-en-place | 35 | serveur+ |
| kitchen | prep-journalier | 35 | serveur+ |
| kitchen | recipes | 35 | serveur+ |
| kitchen | ingredients | 45 | chef_cuisinier+ |
| kitchen | margins | 70 | manager+ |
| kitchen | waste | 35 | serveur+ |
| kitchen | suppliers | 70 | manager+ |
| kitchen | allergens | 45 | chef_cuisinier+ |
| bar | kds | 35 | barman+ |
| bar | wines | 35 | barman+ |
| bar | sommelier | 50 | chef_rang+ |
| bar | cocktails | 35 | barman+ |
| bar | stocks | 50 | chef_rang+ |
| staff | team | 50 | chef_rang+ |
| staff | planning | 50 | chef_rang+ |
| staff | timesheet | 50 | chef_rang+ |
| staff | **payroll** | 70 | **manager+** |
| staff | skills | 50 | chef_rang+ |
| staff | leaves | 50 | chef_rang+ |
| staff | **recruitment** | 70 | **manager+** |
| finance | accounting | 60 | comptable+ |
| finance | billing | 60 | comptable+ |
| finance | bank | 60 | comptable+ |
| finance | **treasury** | 70 | **manager+** |
| finance | **audit** | 90 | **directeur+** |
| haccp | haccp | 35 | cuisinier+ |
| haccp | quality | 45 | chef_cuisinier+ |
| haccp | planning | 45 | chef_cuisinier+ |
| haccp | compliance | 70 | manager+ |
| haccp | lots | 45 | chef_cuisinier+ |
| analytics | profitability | 70 | manager+ |
| analytics | reputation | 70 | manager+ |
| analytics | compliance | 60 | comptable+ |
| analytics | **oracle** | 90 | **directeur+** |
| registre | overview | 45 | chef_cuisinier+ |
| registre | **duerp** | 90 | **directeur+** |
| registre | incendie | 70 | manager+ |
| registre | prestataires | 70 | manager+ |
| registre | interventions | 70 | manager+ |
| registre | pmr | 70 | manager+ |
| registre | conformite | 45 | chef_cuisinier+ |
| crm | pipeline | 30 | hotesse+ |
| crm | customers | 30 | hotesse+ |
| crm | history | 50 | chef_rang+ |
| crm | import | 70 | manager+ |
| crm | promos | 50 | chef_rang+ |
| crm | emails | 70 | manager+ |
| crm | automations | 70 | manager+ |
| crm | rfm | 70 | manager+ |
| crm | analytics | 60 | comptable+ |
| marketing | campaigns | 70 | manager+ |
| marketing | social | 70 | manager+ |
| marketing | quotes | 50 | chef_rang+ |
| marketing | ai | 70 | manager+ |
| marketing | seo | 70 | manager+ |
| settings | profile | 10 | tous |
| settings | **security** | 90 | **directeur+** |
| settings | **integrations** | 90 | **directeur+** |
| settings | **legal** | 90 | **directeur+** |
| settings | **governance** | 90 | **directeur+** |
| settings | **nexus** | 90 | **directeur+** |
| settings | **migration** | 90 | **directeur+** |

### 10.4 TabGuard déployés (composants React)

| Page | Tab | Fichier | Guard |
|---|---|---|---|
| staff | payroll | `app/(client)/(ops)/staff/page.tsx` | `<TabGuard pageKey="staff" tabKey="payroll">` |
| staff | recruitment | `app/(client)/(ops)/staff/page.tsx` | `<TabGuard pageKey="staff" tabKey="recruitment">` |
| finance | treasury | `app/(client)/(finance)/page.tsx` | `<TabGuard pageKey="finance" tabKey="treasury">` |
| finance | audit | `app/(client)/(finance)/page.tsx` | `<TabGuard pageKey="finance" tabKey="audit">` |
| analytics | oracle | `app/(client)/(ops)/analytics/page.tsx` | `<TabGuard pageKey="analytics" tabKey="oracle">` |
| registre | duerp | `app/(client)/(ops)/registre/page.tsx` | `<TabGuard pageKey="registre" tabKey="duerp">` |

---

## Notes de vérification

- `npx tsc --noEmit` : **0 erreur** (commit `350b09198`)
- Mur de Chine : 2 règles ESLint `error`, couvrent statique + dynamique + alias `@modules/`
- `import type` cross-module : autorisé (0 couplage runtime) — types doivent résider dans `domain/schemas/`
- `web-push` : aucun import direct hors serveur applicatif
- `cents` : légitime aux frontières Stripe/PSP/import CSV — violation quand utilisé comme source de vérité interne
- Composition roots (`shared/components/layout`, `shared/providers`, `shared/contexts`) : whitelistés dans la règle ESLint, importent légitimement des modules pour assembler l'app
