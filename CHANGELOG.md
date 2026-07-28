# 📜 CHANGELOG : RESTAURANT-OS [GRADE X]

## [1.9.0] - 2026-07-28 - AUDIT MULTI-DIMENSIONNEL & SÉCURISATION WEBHOOKS 🔒🧪

### 🔬 AUDIT 1 — LOGIQUE MÉTIER (BUSINESS LOGIC)
- **TicketZHandler NF525** : Réécriture de `closeTicketZForDay` — appelle désormais `FiscalSealer.sealDataAtomically()` pour écriture atomique JournalEntry + FiscalSeal ; protection post-clôture contre les accumulations tardives.
- **SovereignGuard** : `fiscalLedger` ajouté aux collections `SIGNED_WRITE_COLLECTIONS` ; toute écriture sur le grand livre requiert une signature HMAC.
- **MenuTool** : Guard cross-tenant ajouté — injection impossible depuis un autre `tenantId`.
- **StripePaymentProvider** : Conversion `BigInt → toMicrounits()` — suppression du cast unsafe.
- **finance/sync** : `amountInCents` remplacé par `totalInMicrounits` sur toutes les entrées.

### 🛡️ AUDIT 2 — SÉCURITÉ
- **finance/sync** : `tenantId` extrait depuis le token Firebase (jamais depuis le body) — vecteur d'escalade de privilège éliminé.
- **Quotes** : Migration `cents → microunits` sur 2 fichiers de types, 1 service et 1 dialog.
- **Campaign** : `budgetInCents → budgetInMicrounits` (convention microunits stricte).
- **4× Google Reserve routes** : Passage de `fail-open → fail-closed` — routes refusent si le marchand ou le service est introuvable.

### ✅ AUDIT 3 — VALIDATION ZOD
- **`/api/reservations`** : Schémas Zod ajoutés ; suppression du `body spread` non validé.
- **`/api/hr/employees`** : Schéma Zod + regex NIR (numéro de sécurité sociale) ; suppression du `body spread`.

### ⚡ AUDIT 4 — PERFORMANCE (ICM-lite)
- **3 routes HR sans ICM** : `planning`, `timeclock`, `recruitment` ajoutées dans `TASK_MAPS` avec `staff: 'HIGH'` → les modules RH ne chargent plus en `LAZY` sur ces routes.

### 🧪 AUDIT 5 — TESTS
- **`TicketZHandler.test.ts`** (nouveau) : 7 cas couvrant `registerTicketZHandler` et `closeTicketZForDay` — protection post-clôture, idempotence, format `Z_YYYYMMDD`.
- **`SovereignGuard.test.ts`** : +2 cas `requiresSignedWrite` — vérifie que `orders` est signé et que `products`/`reservations`/`categories` ne le sont pas.

### 🏛️ AUDIT 6 — ARCHITECTURE (CYCLES)
- **2 cycles import circulaires (onboarding/migration)** : `crmImporter` et `reservationsImporter` importaient `isMaskedEmail` via le barrel du module → réimportation directe depuis `../emailFilters`.
- **1 cycle commerce/marketing** : `NewQuoteDialog` importait `useCRM` via `@/modules/commerce` (barrel circulaire) → import direct depuis `@/modules/ops/providers/hooks/commerceHooks`.
- **Résultat sentrux** : 3 cycles → 0 cycles après corrections.

### 📡 AUDIT 7 — OBSERVABILITÉ
- **`/api/admin/finance/fec/export`** : `logger.info` à l'entrée (tenant + période) et en succès (nombre d'entrées + nom de fichier) ; `logger.error` dans le catch (fin du catch vide).
- **`/api/finance/bank/callback`** : `logger.info` en succès ; `catch {}` remplacé par `logger.error`.
- **`/api/admin/intelligence/strategy-oracle`** : `String(err)` exposé au client remplacé par message générique + `logger.error` côté serveur (GET + POST).

### 🔐 SÉCURISATION WEBHOOKS (HMAC)
- **`src/lib/server/webhookVerify.ts`** (nouveau) : Utilitaire partagé — `computeHmacHex`, `timingSafeCompareHex` (comparaison timing-safe via `node:crypto`), `checkFallbackWebhookSecret` (Bearer fallback).
- **Interfaces providers** : `verifySignature?(rawBody, headers): boolean` ajouté sur `IDeliveryProvider`, `IReservationProvider`, `IIoTProvider`.
- **UberEatsProvider** : HMAC `UBEREATS_WEBHOOK_SECRET` sur header `x-uber-signature` (strip préfixe `sha256=`).
- **ZenchefProvider** : HMAC `ZENCHEF_WEBHOOK_SECRET` sur header `x-zenchef-signature`.
- **3 routes webhook** (`/delivery`, `/reservations`, `/iot`) : Lecture du `rawBody` brut avant parse ; vérification `provider.verifySignature()` ou fallback `CONNECTORS_WEBHOOK_SECRET` (Bearer) ; retour 401 si non vérifié ; avertissement si aucun mécanisme configuré.

### 🔐 AUDIT 9 — RBAC COMPLETENESS
- **15 routes sans guard Firebase** auditées — toutes légitimes : `signup`, `status`, `menu.json`, `resolve-domain`, `health/rag`, `auth/google/callback`, `finance/bank/callback`, `google/reserve/*` (4), `widget/availability`, `widget/setup-intent` (rate-limit IP), `haccp/iot-push` (Bearer `HACCP_GATEWAY_TOKEN`).
- **`fleet/rgpd-purge` et `fleet/restore`** : double-handler vérifié — POST (`fleet_admin`) / GET (`mcc_support`). Pattern correct, pas de trou.
- **`tenant/api-keys/validate`** ❌→✅ : ajout rate-limit 20 req / 15 min par IP — empêche le brute-force de hashes SHA-256 de clés API.
- **Hiérarchie MCC confirmée** : toutes les opérations destructives (rgpd-purge POST, restore POST, backup POST, fleet command, dns, contracts POST, billing feature-flags POST, device-activation POST) requièrent `fleet_admin`. Opérations de lecture / support à `mcc_support`. Lecture seule drafts AI à `mcc_junior_dev`. Cohérent.

### 🔁 AUDIT 8 — IDEMPOTENCE WEBHOOKS
- **`delivery/webhook/[provider]`** : Lecture de l'existence de la commande AVANT `set()` — `NexusEventBus.emit('order.placed')` n'est émis que si la commande n'existait pas encore → les retries provider ne créent plus de doublons KDS.
- **`iot/webhook/[provider]`** : Clé Firestore `iotHistory/${sensorId}/${Date.now()}` remplacée par `iotHistory/${sensorId}/${reading.timestamp}` (clé stable) ; guard `alreadyProcessed` en early-return → retries ignorés sans créer de doublons, `HACCPLogService.recordNonConformity()` n'est plus appelé deux fois pour le même relevé.
- **`reservations/webhook/[provider]`** : Idempotent nativement via `set()` sur l'id réservation — aucune modification nécessaire.
- **`billing/webhook` (Stripe)** : Dédup côté Stripe SDK — idempotent par conception.

## [1.8.0] - 2026-05-08 - SOVEREIGN RAG & OMNI-REFACTOR 🧠🏛️
### 🧠 SOVEREIGN RAG & FAST BRAIN (ATLAS-X)
- **Fast Brain Architecture** : Déploiement de l'ingestion de données structurées et de la distillation des connaissances via les Sovereign Knowledge Items (KIs).
- **LightRAG & GraphRAG** : Intégration de Docker et des pipelines de requêtage sémantique hybride (Graphes + Vecteurs) pour une latence sub-500ms sur les données fiscales NF525.
- **Benchmarks & Stress Tests** : Finalisation du `benchmark_rag.py` et des simulations de données "dirty" pour garantir 100% de fiabilité juridique.

### 🏛️ OMNI-REFACTOR & GRADE X
- **Sécurisation Admin & Ops** : Refonte massive et durcissement des modules `src/app/(admin)` et `src/app/(client)/(ops)`.
- **Infrastructure SaaS Multi-Tenant** : Clarification de l'isolation des données et du déploiement via DNA Injector.
## [1.7.0] - 2026-05-02 - DÉCOMPOSITION ATOMIQUE & RBAC-X ⚛️🛡️
### ⚛️ DÉCOMPOSITION ATOMIQUE (ATOMIC-DECOMPOSITION-X)
- **Scission des God Files** : Extraction de `MutationValidator`, `DomainRegistry` et `NexusTelemetryEngine` depuis le `NexusManager` et `NexusCoreProvider`.
- **Purification des Contrats** : `nexus-contract.ts` est désormais un fichier de types purs, le runtime ayant été déplacé dans des moteurs atomiques.
- **Réduction de la Densité** : Baisse de 28 connexions et suppression de 23 communautés de bruit via Graphify.

### 🛡️ ÉTANCHÉITÉ & RBAC (MODULE-EXTRACTOR-X)
- **Indice de Friction Zéro** : Élimination des dépendances directes entre Piliers (Finance <-> Logistics, Logistics <-> Commerce).
- **Forecast Genome** : Centralisation des données prédictives dans le `SovereignGenome` pour un partage de données sans dépendance d'import.
- **Lockdown-X (RBAC)** : Intégration d'un garde-fou RBAC obligatoire dans `useNexusMutation` basé sur les permissions du `DomainRegistry`.
- **Sutures Headless** : Déploiement de `NexusSutures` pour la synchronisation asynchrone des états inter-domaines.

## [1.6.0] - 2026-05-01 - LA SOUVERAINETÉ FINALE (GRADE X) 🏛️🚀
### 🏛️ SUTURE TOTALE & INTÉGRITÉ ABSOLUE
- **Grade X Sovereignty Achieve** : Élimination totale des erreurs TypeScript (`0 Errors`) sur l'ensemble du projet (1691 fichiers).
- **Harcèlement des Types (Nuclear Hardening)** : Enforcement strict des contrats `SovereignNode` et `SovereignField` (support natif de `Date` et `Date[]`).
- **Purification Physique** : Éradication complète du module `gateway` et migration de l'infrastructure vers des composants souverains (`TenantOrchestrator`, `ProvisioningWizard`).
- **Suture des Barrels** : Normalisation des exports nommés pour tous les composants MCC et Guards.
- **Chaos & Résilience** : Stabilisation de l'agent adversarial `ChaosMonkey` et sécurisation du moteur d'ingestion `Slayer`.
- **Omni-Certification** : Validation physique et logique de l'intégrité du disque via le protocole **Atlas Bridge V5**.

## [1.5.0] - 2026-04-22 - LA PURIFICATION VANGUARD 🏛️
### 🏛️ RÉCONCILIATION & PURIFICATION (PHASES 1-7)
- **Purification Multi-Pôles** : Liquidation de ~110 errors TSC dans les domaines `Marketing`, `CRM`, `Ops` et `Fleet`.
- **Aliasing de Souveraineté** : Implémentation d'alias temporels (`expirationDate`, `priceInCents`, `lastVisitDate`) pour assurer une compatibilité Grade X sans migration de données.
- **Moteur Hermes & Vanguard** : Stabilisation de l'orchestrateur autonome, durcissement des types `OracleToolArgs` et déploiement du protocole **DNA Injection**.
- **Sceau Fiscal NF525** : Éradication totale des `as any` dans le `NF525Service` et extension des collections signées (`vouchers`, `coupons`).
- **Certification Nexus** : Alignement strict du `NexusFleetProvider` avec le shared-kernel.


## [1.4.0] - 2026-04-21 - LA CONFÉDÉRATION SOUVERAINE 🏛️
### 🧩 MODULARISATION (HÉGÉMONIES SOVERAINES)
- **Migration Confédérée** : Liquidation totale de `src/components`, `src/hooks`, `src/lib` et `src/types` au profit de modules isolés : `Finance`, `HR`, `HACCP`, `Inventory`, `Marketing`, `Ops`.
- **Souveraineté des Modules** : Chaque domaine possède désormais son propre cycle de vie, ses composants et sa logique de mutation (NexusMutation).
- **Nexus Pulse Orchestrator** : Déploiement du moteur de réactivité centralisé pour la synchronisation inter-modules.
- **Gouvernance & Manifeste** : Publication de `NEXUS_GOVERNANCE.md` et `NEXUS_MANIFEST.md` définissant les lois de l'Empire Modularisé.

## [1.3.1] - 2026-04-20 - LA SUTURE SOUVERAINE 🧵
### 💉 ARCHITECTURE (FORGE DE SOUVERAINETÉ)
- **Suture des Hooks Primaires** : `useHACCP`, `useKitchen`, `useOrders`, `useReservations`, `useHumanResources`, and `useAccounting` sont désormais scellés via `useNexusMutation`.
- **Éradication des Stubs** : Remplacement des actions serveur directes par le pattern transactionnel Forge.
- **Liquidation Type Safety** : Renforcement des types HACCP et HR via des interfaces strictes.

## [1.3.0] - 2026-04-19 - LA SINGULARITÉ 🌌
Lancement du protocole Grade X. L'Empire est désormais souverain, audité et multi-agents.

### 🏛️ ARCHITECTURE (HEGEMONIES)
- **Restructuration Étanche** : Définition des 6 Hégémonies souveraines.
- **Audit d'Isolation** : Déploiement du `hegemony-isolation-audit.js` (Score: 100%).
- **Sceau du Kernel** : Certification "Feuille Morte" du `SharedKernel.ts`.

### 🔮 SIMULATION & ORACLE
- **Temporal Simulator** : Moteur Monte-Carlo off-thread (WebWorker) avec distribution de Poisson.
- **Simulator Console** : Interface Premium (Glassmorphism, Neon Glow & Stress-meter).

### 🤖 MULTI-AGENT (LA FLOTTE)
- **Protocoles Vassaux** : Création des instructions specialized pour `Vassal-UI` et `Vassal-QA`.
- **Suzerain Orchestrator** : Antigravity pilote désormais la flotte via le `NexusSync`.

### 🛡️ INFRASTRUCTURE & SÉCURITÉ
- **EMPIRE_BOB.md** : Scellage de tous les protocoles de souveraineté.
- **Grade X Typing** : Purge totale des `any` dans le `NexusCoreProvider` et le `StockEngine`.
- **GitPush Bridge** : Automatisation du Sceau Royal pour les commits certifiés.

---
*Fait en présence de Mohammed, par Antigravity.*
