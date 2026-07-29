# 📜 CHANGELOG : RESTAURANT-OS [GRADE X]

## [1.9.2] - 2026-07-29 - SÉCURITÉ FIRESTORE + STUBS RÉELS 🔐

### 🔐 AUDIT FIRESTORE — Règles privilege escalation systemConfig
- **Problème** : Firestore évalue les blocs `match` en **OR logique** — le bloc spécifique `systemConfig` (owner-only) ne neutralise pas le bloc générique `/{collection}/{document=**}`. Un manager pouvait écrire sur `role_permissions` via la règle générique malgré le bloc restrictif.
- **Fonction `isOwnerOnlyCollection`** ajoutée dans `firestore.rules` — liste les collections réservées à l'owner/MCC.
- **Gardes injectés** dans les 3 opérations du bloc générique (`create`, `update`, `delete`) : `!isOwnerOnlyCollection(collection)`. La route d'escalade via wildcard est fermée.

### 🩹 STUBS → CODE RÉEL
- **`LiquidStaffingEngine.auditGroupStaffing`** : Suppression du mock `i % 2 === 0 ? 2 : 6` — remplacé par une vraie requête `Nexus.adapter.get(tenants/${id}/timeclock/${today})`. Calcule `currentStaff` en comptant les employés qui ont un `clock_in` sans `clock_out` ultérieur. `requiredStaff` lu depuis `settings.planningConfig.minStaff` avec fallback à 3. Fail-safe par tenant sur erreur (log + `currentStaff: 0`).
- **`auth/google/callback` — `encryptToken`** : Suppression du fallback "stocker en clair si pas de secret". `NEXUS_TENANT_SECRET` manquant → `throw` immédiat (fail-closed). Le callback renvoie une redirection `/settings?error=internal` — aucun token OAuth n'est jamais écrit en clair dans Nexus.

### 📝 ENV VARS — `.env.example` complété
8 secrets utilisés dans les routes API mais absents du fichier d'exemple :
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` — OAuth Google Business
- `CONNECTORS_WEBHOOK_SECRET` — Bearer fallback webhooks delivery/réservations/IoT
- `CRON_SECRET` — protection des routes cron (reviews, reservations sync)
- `INTERNAL_API_SECRET` — appels M2M internes (chain-audit, widget/book)
- `PUSH_SECRET` — autorisation envoi notifications push
- `AXIOM_DATASET` / `AXIOM_TOKEN` — observabilité logs production (Axiom)

---

## [1.9.1] - 2026-07-29 - FINITIONS 4-5-6 🏛️

### 🏛️ FIX 4 — Rapatriement progressif (domain/ → modules/)
- **`domain/types/bar.ts`** → `src/modules/ops/types/bar.ts` (canonical). Stub de compat backward en place.
- **`domain/types/quality.ts`** → `src/modules/compliance/types/quality.ts` (canonical). Stub backward.
- **`domain/constants/bar-data.ts`** → `src/modules/ops/constants/bar-data.ts` (canonical). Stub backward.
- **`domain/repositories/IFinanceRepository.ts`** → `src/modules/finance/repositories/IFinanceRepository.ts` (canonical). Stub backward.
- **11 importeurs mis à jour** : `ops/pos/components/bar/*` (5), `compliance/haccp/**` (4), `infrastructure/repositories/` (2) → tous pointent désormais sur le canonical dans le pilier.
- Les stubs `@domain/*` restent pour les imports existants dans `app/` — migration progressive conforme à la règle barrel.

### 🩹 FIX 5 — Demo page : correction du mensonge "24h auto-destroy"
- `src/app/(public)/demo/page.tsx` : "Cet environnement s'auto-détruira dans 24h" remplacé par "Environnement local à votre navigateur — les données disparaissent à la fermeture de l'onglet." — `SimulacraAdapter` est in-memory only ; aucun cron ni TTL n'a jamais existé côté serveur.

### 🔌 FIX 6 — useExtensions câblé dans IntegrationSettings
- `IntegrationSettings.tsx` importe désormais `useExtensions()` — `isExtensionActive(id)` compare l'état local (toggle non sauvegardé) avec l'état Nexus persisté.
- Badge "Non sauvegardé" (orange) apparaît automatiquement si l'état local diverge du Nexus. Disparaît dès que `handleSave()` est appelé et que le hook relit les settings. Source unique de vérité : `settings.integrations[].isActive` (Nexus via SettingsContext).

---

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

### ✅ FINITION WALKTHROUGH MÉTA-PLAN (Phases 3 & 4)

**Phase 3 — RBAC : custom roles effectifs côté serveur**
- **`/api/admin/users/assign-role`** (nouveau) : route `requireTenantAdmin` — valide le rôle contre `ROLE_LABELS` ET les `customRoles` du tenant stockés dans Nexus (DB-agnostique) ; écrit via `Nexus.adapter.set()` ; met à jour les Firebase Auth custom claims en best-effort non-bloquant (`try/catch` avec `logger.warn`). Cross-tenant impossible : le `tenantId` vient du token.
- **`AuthAccess.tsx`** : `assignRoleToUser(userId, role)` exposé via `authedFetch` → appelle la route ci-dessus.
- **`useNexusAuthLogic.ts`** : `assignRoleToUser` propagé dans `NexusAuthState`.
- **`nexus.types.ts`** : `NexusAuthState.assignRoleToUser` déclaré.
- **`AccountSettingsDashboard.tsx`** : sélecteur de rôle inline sur chaque chip utilisateur — change de rôle en 1 clic, désactivé pendant l'appel (`disabled={reassigningUserId === user.id}`).
- Les rôles custom sont désormais reconnus côté serveur (ils apparaissent dans les claims Firebase et dans Nexus).

**Phase 4 — Extensions : source unique de vérité Nexus**
- **`src/shared/providers/hooks/useExtensions.ts`** (nouveau) : hook `useExtensions()` → `{ isExtensionActive(id), activeExtensions[] }`. Lit `settings.integrations[].isActive` depuis `SettingsContext` (déjà persisté dans Nexus via `updateList()`). Aucune dépendance Firebase, aucun fichier statique.
- `nexus-ledger.json` conservé en snapshot de référence projet, mais n'est plus la source de vérité runtime des toggles.

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
