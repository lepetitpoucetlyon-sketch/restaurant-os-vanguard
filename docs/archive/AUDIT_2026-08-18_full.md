# Audit exhaustif RESTAURANT-OS-CORE — 2026-08-18

## Méthodologie

Audit statique en 12 dimensions, mené en parallèle par 12 auditeurs spécialisés opérant en lecture seule sur le tree `main` au commit `9054d08c1`. Chaque auditeur a produit un rapport structuré (score de santé 0-100, résumé, points forts, findings typés critical/high/medium/low/info). Aucune exécution de test, de build ou de déploiement n'a été effectuée : les findings s'appuient sur la lecture du code, la corrélation entre `CLAUDE.md`, `ARCHITECTURE.md`, la configuration sentrux, les tests existants, et les preuves grep/ripgrep.

Les 12 dimensions couvertes :

1. Architecture 8 piliers & Règle du Barrel
2. Sécurité multi-tenant, SovereignGuard & RGPD
3. Conformité NF525 & fiscalité
4. RBAC & matrice des permissions
5. Dette technique, god files & code mort
6. Couverture tests (Vitest + Playwright)
7. Performance, bundle & PWA
8. Verticales non-restaurant (hotel, bakery, garage, salon, clinic, retail, custom + futures)
9. MCC (Multi-Cloud-Control) — console admin plateforme
10. Bus événementiel & saga réactive (NexusEventBus + outbox/DLQ)
11. Accessibilité (WCAG) & UX critique
12. Documentation, CI/CD & tooling

Volumétrie collectée : **138 findings** au total, **score moyen 52/100**.

---

## Résumé exécutif

RESTAURANT-OS-CORE présente une **colonne vertébrale architecturale solide** (8 piliers en place, Nexus + SovereignGuard opérationnels, chaîne NF525 SHA-256 chaînée, MCC RBAC 3-niveaux avec MFA, tooling sentrux 47 règles + preflight 8 étapes) mais souffre de **trous de bord qui neutralisent partiellement ces briques** dès qu'on quitte le happy path. Le socle est bien pensé, l'exécution des invariants critiques est incomplète.

Trois findings méritent une intervention **immédiate** :

- 🔴 **middleware `/api/admin/*` incompatible avec l'auth Firebase JWT réelle** — soit toutes les routes MCC renvoient 404 en prod, soit un secret partagé neutralise MFA/Trusted Device (dimension Sécurité).
- 🔴 **Outbox non-atomique + IdempotencyGuard no-op + circuit-breaker indexé par nom d'événement** — combinaison qui garantit un double-scellement fiscal NF525 en cas de crash ou de multi-caisse concurrent (dimension Bus événementiel).
- 🔴 **SovereignGuard ne bloque QUE le DELETE sur `journalEntries`/`fiscalSeals`** — un `Nexus.adapter.set()` peut écraser un sceau NF525 existant sans erreur, cassant la chaîne cryptographique (dimension NF525).

Autres zones structurellement fragiles : la couverture composants React est de **3 tests pour 784 fichiers .tsx**, les modules verticaux (`appointments`, `rooms`, `bays`, `consultation`) sont des squelettes vides bloquant les 4 nouvelles verticales, et le composant `Modal` canonique — utilisé par 15+ dialogues — n'expose ni `role="dialog"`, ni focus trap, ni `aria-labelledby`.

---

## Tableau de bord global

| Dimension | Score | 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low | ⚪ Info |
|---|---:|---:|---:|---:|---:|---:|
| Architecture 8 piliers & Règle du Barrel | 58 | 0 | 3 | 4 | 2 | 0 |
| Sécurité multi-tenant, SovereignGuard & RGPD | 55 | 1 | 3 | 6 | 1 | 1 |
| Conformité NF525 & fiscalité | 58 | 2 | 3 | 4 | 1 | 0 |
| RBAC & matrice des permissions | 42 | 1 | 3 | 4 | 4 | 0 |
| Dette technique, god files & code mort | 74 | 0 | 2 | 4 | 4 | 0 |
| Couverture tests (Vitest + Playwright) | 35 | 2 | 5 | 5 | 1 | 0 |
| Performance, bundle & PWA | 55 | 0 | 4 | 7 | 4 | 0 |
| Verticales non-restaurant | 32 | 2 | 2 | 4 | 2 | 0 |
| MCC (Multi-Cloud-Control) | 62 | 1 | 3 | 5 | 3 | 0 |
| Bus événementiel & saga réactive | 48 | 3 | 4 | 3 | 1 | 0 |
| Accessibilité (WCAG) & UX critique | 38 | 1 | 4 | 4 | 2 | 0 |
| Documentation, CI/CD & tooling | 62 | 0 | 3 | 6 | 4 | 0 |
| **TOTAL** | **52** | **13** | **39** | **56** | **29** | **1** |

Trois dimensions sous la barre des 40/100 (Verticales, Couverture tests, Accessibilité) constituent la **zone rouge structurelle**. Le socle NF525/Sécurité est autour de 55-58 : bon en surface, faille en profondeur.

---

## Top 10 des actions prioritaires

Triage : gravité d'abord, effort ensuite (quick wins prioritaires à gravité égale).

| # | Finding | Sévérité | Effort | Dimension |
|---:|---|:---:|:---:|---|
| 1 | Bypass `mcc-dev-bypass` sans garde `NODE_ENV=production` — MCC_DEV_MODE fuit = super_admin flotte | 🟠 High | XS | Sécurité + RBAC + MCC |
| 2 | Provisioning MCC crée les owners avec `role: 'owner'` absent de `PERMISSION_ROLE_LEVELS` — tenants fraîchement provisionnés inaccessibles | 🔴 Critical | S | RBAC + MCC |
| 3 | Émissions fiscales `.catch(() => {})` swallow silencieusement erreurs `order.paid`/`order.refunded` | 🟠 High | XS | Bus événementiel |
| 4 | PIN owner généré mais jamais envoyé dans l'email de bienvenue — tenant inaccessible au premier login | 🟠 High | XS | MCC |
| 5 | `custom-full-dna.ts` absent du `DNA_REGISTRY` → fallback silencieux vers `RESTAURANT_FULL_DNA` | 🔴 Critical | XS | Verticales |
| 6 | SovereignGuard ne bloque QUE le DELETE sur `journalEntries`/`fiscalSeals` — SET/UPDATE libre | 🔴 Critical | M | NF525 |
| 7 | Middleware `/api/admin/*` incompatible avec Firebase JWT (Bearer statique vs JWT dynamique) | 🔴 Critical | M | Sécurité |
| 8 | `/api/v1/menu` accepte n'importe quel `tenantId` en query sans auth — exfiltration catalogues flotte | 🟠 High | S | Sécurité |
| 9 | Circuit-breaker `inFlight` indexé par NOM d'événement — bloque le 2ᵉ `order.paid` concurrent en multi-caisse | 🔴 Critical | M | Bus événementiel |
| 10 | Outbox non-atomique + replay sans dedupe + IdempotencyGuard no-op → double-scellement NF525 garanti sur crash | 🔴 Critical | L | Bus événementiel |

**Séquence recommandée** : #1 → #3 → #4 → #5 (quick wins < 1 j) puis #2 → #6 → #7 → #8 → #9 (1-3 j) puis #10 (chantier 1 semaine).

---

## Détail par dimension

### 1. Architecture 8 piliers & Règle du Barrel

**Score : 58/100**

**Résumé.** La colonne vertébrale à 8 piliers est en place (chaque pilier a son `index.ts`, aucun résidu dans `src/components` ou `src/domain`), mais la Règle du Barrel est massivement contournée : 58 fichiers non-tests importent en chemin profond, dont ~20 à l'intérieur même de `src/modules/` (imports cross-pilier profonds). Des dépendances bidirectionnelles existent entre presque toutes les paires de piliers, et plusieurs domaines non canoniques (`menu-builder`, `catalog`, `franchise`, `forecasting`, `simulation`, `fleet`, `conventions`) dévient de l'arborescence documentée.

**Points forts**

- Les 8 piliers et le pilier `system` ont tous un `index.ts` (barrel) présent.
- Aucun résidu dans `src/components/`, `src/domain/`, `src/engines/` : le rapatriement historique est terminé.
- La convention des canaux cross-module est clairement documentée dans CLAUDE.md et globalement respectée.
- `src/store/pillars/*.ts` documente explicitement le workaround `eslint-disable` avec la raison (TDZ SSR), traçabilité conservée.
- Les shims deprecated (`src/store/settingsAtoms.ts`, `dashboardAtoms.ts`) portent le tag `@deprecated`.

#### 🟠 High

- **58 fichiers non-tests violent la Règle du Barrel (`@/modules/<pilier>/<domaine>/...`).** Top : `commerce/acquisition` (50), `ops/service` (36), `intelligence/ia` (24), `finance/comptabilite` (19), `finance/fiscalite` (18). *Location* : `src/lib/NexusTelemetryService.ts`, `src/lib/MaintenanceAgent.ts`, `src/app/(client)/(ops)/**`, `src/shared/components/settings/**`, `src/store/pillars/*`. *Recommandation* : ré-exporter depuis les barrels, migrer les 58 imports, ajouter lint `no-restricted-imports/pattern '@/modules/*/*/**'`. *Effort* : L.

- **Cross-pilier profonds à l'intérieur même de `src/modules/`.** Ex. : `human/domain/schemas/rbac.ts` → `@/modules/compliance/domain/schemas/rbac` ; `ops/workflow/engine/tables.types.ts` → `@/modules/facility/spaces/types` ; `commerce/ui/pos/CashDrawerModal` → `@/modules/ops/service/pos/...`. *Recommandation* : exposer via barrel du pilier propriétaire ou déplacer vers un domaine `contracts` explicite. Bloquer via ESLint `'@/modules/<X>/**'` depuis `src/modules/<Y>/**`. *Effort* : L.

- **Dépendances bidirectionnelles entre piliers (risque de cycles).** 10 paires : `commerce<->ops` (19/2), `finance<->ops` (14/4), `finance<->human`, `finance<->logistics`, `finance<->intelligence`, `compliance<->finance`, `compliance<->human`, `logistics<->ops`, `intelligence<->logistics`, `facility<->ops`. *Recommandation* : intégrer `madge --circular src/modules` dans `preflight.sh`, extraire contrats communs vers `shared/contracts`. *Effort* : XL.

#### 🟡 Medium

- **Domaines non canoniques présents dans plusieurs piliers.** `ops/menu-builder/`, `commerce/catalog/`, `commerce/franchise/`, `intelligence/forecasting/`, `intelligence/simulation/`, `logistics/fleet/`, `human/conventions/`. *Recommandation* : soit rattacher aux domaines canoniques, soit amender CLAUDE.md. *Effort* : M.

- **Doublon `src/verticals/` vs `src/shared/seeds/` + `modules/`.** 13 sous-dossiers avec pipeline complet parallèle aux 8 piliers, un seul consommateur externe (`menu-engineering/page.tsx`). *Recommandation* : clarifier statut (standard, WIP `_staging/`, ou legacy). *Effort* : L.

- **`src/store/` contient encore des ré-exports profonds et des atomes non migrés.** Shims deprecated + `src/store/pillars/*.ts` avec `eslint-disable no-restricted-imports` justifié par cycle TDZ SSR. *Recommandation* : extraire atomes purs vers `src/store/base.ts` ou assumer la façade `pillars/*`. *Effort* : M.

- **`src/modules/system/` ne couvre pas la 'plomberie transversale' attendue.** Barrel exporte 4 schémas Zod seulement ; la vraie plomberie vit dans `src/lib/`, `src/shared/`, `src/kernel/`. *Recommandation* : renommer en `platform-schemas` ou rapatrier les briques transversales. *Effort* : M.

#### 🔵 Low

- **`src/shared/` contient encore des composants et hooks métier des piliers.** `PrinterSettings`, `TablesSettings`, `TipsDistributionSettingsSection`, `useUniversalAssistant`. *Effort* : M.
- **Canal cross-module #3 (NexusEventBus) massivement utilisé.** 381 fichiers référencent NexusEventBus — recommander registre typé + tests d'intégration. *Effort* : M.

---

### 2. Sécurité multi-tenant, SovereignGuard & RGPD

**Score : 55/100**

**Résumé.** L'architecture SovereignGuard/NexusInterceptor est sérieusement pensée (wrapping automatique, guard-first listener, batch avec pending guards, path scoping) mais souffre de plusieurs échappatoires exploitables : middleware `/api/admin` incompatible avec le vrai flow d'auth (Bearer statique vs Firebase JWT), bypass `MCC_DEV_MODE` serveur sans garde `NODE_ENV=production`, absence de signature HMAC côté client (rendant `NF525_WRITE_V1` optionnel), route `/api/v1/menu` totalement non authentifiée, absence de bannière de consentement cookies pourtant référencée par la page RGPD.

**Points forts**

- SovereignGuard automatiquement injecté par le setter `Nexus.adapter` (`NexusAdapter.ts:29`).
- Guard-First Listener Pattern dans `onSnapshot` (`NexusInterceptor.ts:52-89`) — élimine le TOCTOU.
- Batch écritures : `pendingGuards` + `pendingWrites` attendus AVANT `rawBatch.commit`.
- Purge RGPD complète et signée (`api/admin/fleet/rgpd-purge/route.ts`) avec certificat SHA-256, préservation NF525 conforme.
- Anonymisation asynchrone via `PrivacyConsentHandler`.

#### 🔴 Critical

- **middleware `/api/admin/*` incompatible avec l'auth Firebase JWT.** `checkAdminApiGate` exige `Authorization === Bearer ${MCC_ADMIN_SECRET}` (statique) alors que `authedFetch.ts:27` envoie `Bearer <FirebaseJWT>` (dynamique). Les deux valeurs ne peuvent être égales simultanément. Sans MCC_ADMIN_SECRET en prod → 100 % des `/api/admin` renvoient 404 ; avec → il faut l'exposer au client, détruisant MFA + Trusted Device. *Location* : `src/middleware.ts:31-32` ; `src/lib/client/authedFetch.ts:13-29`. *Recommandation* : remplacer par vérification 'a un Bearer' (délégation à `adminAuthGuard`) OU distinguer canal server-to-server et canal utilisateur. Test d'intégration bout-en-bout. *Effort* : M.

#### 🟠 High

- **Bypass `mcc-dev-bypass` accepté sans garde `NODE_ENV=production`.** `requireMccLevel` retourne `{ uid: 'dev_admin', role: 'super_admin' }` dès que `MCC_DEV_MODE_SERVER=true`, sans check `NODE_ENV`. Contraste avec `verifyCaller` (ligne 194) correctement gardé. Fuite variable en prod = super_admin sur toute la flotte. *Location* : `src/lib/server/adminAuthGuard.ts:66-72`. *Recommandation* : ajouter `process.env.NODE_ENV !== 'production'` en préfixe. *Effort* : XS.

- **`SovereignGuard.protectWrite` renvoie des écritures NON signées côté navigateur.** Le champ `__nf525` n'existe que pour les écritures serveur ; toutes les écritures POS client passent sans signature. `verifyWriteSignature` devient inutile en pratique. *Location* : `src/shared/nexus/guards/SovereignGuard.ts:207-257`. *Recommandation* : exiger passage par endpoint serveur pour toute `SIGNED_WRITE_COLLECTIONS` OU canal d'obtention de signature courte-durée. *Effort* : L.

- **`/api/v1/menu` accepte n'importe quel `tenantId` en query sans authentification.** Renvoie catalogue complet, sans rate-limit, sans vérification flag `publicMenuEnabled`. Un attaquant énumère les slugs (déjà exposés via subdomain) et extrait tous les catalogues. *Location* : `src/app/api/v1/menu/route.ts:7-30`. *Recommandation* : `requireTenantUser` + validation `tenantId === caller.tenantId`, OU flag `tenantConfig.publicMenuEnabled=true` + rate-limit + sous-ensemble `showcaseVisible`. *Effort* : S.

#### 🟡 Medium

- **`NexusAdapter.getTenantPath` lit `?tenant=` de l'URL comme source de vérité tenant côté client.** Triviallement modifiable ; force SovereignGuard à jouer les fail-safes avec logout global (DoS). *Location* : `src/lib/nexus/NexusAdapter.ts:108-122`. *Effort* : S.

- **`SovereignGuard.canDelete` utilise `path.includes(collection)` — sur-blocage silencieux.** Substring matching (déjà signalé pour `config`, subsiste pour `canDelete`). *Location* : `src/shared/nexus/guards/SovereignGuard.ts:53-73, 78-81`. *Effort* : XS.

- **Aucune bannière/mécanisme de consentement cookies déployé.** La page RGPD (`/legal/rgpd:359`) mentionne le cookie `cookie-consent` mais aucun composant `CookieBanner` n'existe. Non-conformité GDPR/ePrivacy. *Effort* : M.

- **Clés API tenant émises en JWT SANS expiration.** `jwt.sign({ tenantId }, secret)` sans `expiresIn`, `iat`, `jti`. Révocation dépend d'un lookup Firestore ; en cas de perte de hash, clés éternelles. *Location* : `src/app/api/tenant/api-keys/route.ts:21-26`. *Effort* : S.

- **`SovereignGuard.validateAccess` bypass silencieusement en `NODE_ENV=test`.** Retour sans log ni émission `ACCESS_DENIED`. Si `NODE_ENV=test` fuit en preview prod, isolation cross-tenant tombe. *Location* : `src/shared/nexus/guards/SovereignGuard.ts:287-292`. *Effort* : S.

#### 🔵 Low

- **`resolveTenantFromHost` ne valide pas l'existence du tenant — surface d'énumération.** Fallback via `x-resolved-tenant-id` accepté par `requireTenantAdmin`. *Effort* : M.

#### ⚪ Info

- **Deux bypass dev (`dev-tenant-bypass` vs `mcc-dev-bypass`) avec sémantiques divergentes.** Nommer uniformément et gardes symétriques. *Effort* : S.

Note : la finding « SIGNED_WRITE_COLLECTIONS incomplet — collections RBAC/tenants/users non signées » est reprise implicitement dans le finding High #3 (signature HMAC absente côté client).

---

### 3. Conformité NF525 & fiscalité

**Score : 58/100**

**Résumé.** La chaîne NF525 (JournalEntry + FiscalSeal chaîné SHA-256, séquenceur atomique, WORM 6 ans, FEC, clôture Z) est présente et testée dans le noyau, mais plusieurs failles de bord invalident la certification en pratique : les écritures UPDATE/SET sur `journalEntries`/`fiscalSeals` ne sont pas bloquées par SovereignGuard, les tickets clients POS n'impriment JAMAIS le footer NF525, le mode offline émet un pseudo-sceau non persisté et un `pieceNumber` non séquentiel, la collection `wormArchives` n'est pas verrouillée, et deux `FiscalEngine` divergents coexistent.

**Points forts**

- Chaîne SHA-256 chaînée correctement implémentée avec GENESIS_ROOT constant et test anti-falsification.
- Séquenceur atomique du `pieceNumber` via `runTransaction`.
- SovereignGuard bloque le DELETE sur `fiscalSeals`/`journalEntries`/`fiscalLedger` avec pulse CRITICAL.
- Scellement atomique multi-écritures (`sealDataAtomically`) — bonne prévention des désynchronisations.
- `FiscalKeyService` abandonne l'ancienne signature devinable au profit d'une clé provisionnée par tenant.

#### 🔴 Critical

- **SovereignGuard ne bloque QUE le DELETE — SET/UPDATE sur seals et journalEntries est libre.** `IMMUTABLE_COLLECTIONS` contient `fiscalSeals` et `journalEntries` mais `NexusInterceptor` consulte `isFiscallySealed`/`canDelete` uniquement dans la branche DELETE. Un appelant peut donc écraser un JournalEntry ou un FiscalSeal via `Nexus.adapter.set(...)` sans erreur. *Location* : `src/lib/nexus/NexusInterceptor.ts:242-256`. *Recommandation* : `if (operation === 'WRITE' && this.guard.isFiscallySealed(path)) throw NF525_VIOLATION` avec mode `create-only` pour la création initiale. *Effort* : M.

- **Ticket client POS imprimé sans mentions NF525 (SIRET, hash, certification).** `EscPosBuilder.appendNf525Footer` early-return si `ticket.nf525Hash || ticket.siret` n'est pas défini. `usePrintReceipt.ts` ne renseigne aucun de ces champs et utilise `T-${Date.now()}` en place du ticketNumber séquentiel. Violation art. 286-I-3 bis CGI. *Location* : `src/app/(client)/(ops)/pos/_hooks/usePrintReceipt.ts:30-66`. *Recommandation* : câbler `usePrintReceipt` sur `FinancialNexusBridge.processOrder()`, réutiliser `receiptNumber` et `fiscalSealHash`. Retirer l'early-return. *Effort* : M.

#### 🟠 High

- **Collection `wormArchives` absente de `IMMUTABLE_COLLECTIONS`.** Malgré le sceau légal 6 ans, un `Nexus.adapter.set()`/`delete()` sur `wormArchives` passe. Stockage 'WORM' réversible. *Location* : `src/shared/nexus/guards/SovereignGuard.ts:38-47`. *Effort* : S.

- **Mode offline : sceau factice non persisté et `pieceNumber` non séquentiel.** `hash='PENDING_OFFLINE_SEAL'` + `pieceNumber = OFFLINE-${entryId}` — non séquentiel, non persisté localement. Perte de données garantie si queue Dexie perdue avant sync. *Location* : `src/modules/finance/comptabilite/FinancialNexusBridge.ts:112-138`. *Effort* : L.

- **Double implémentation divergente de `FiscalEngine` — split brain sur `verifyChain`.** `fiscalite/FiscalAdapter.ts` utilise `FISCAL_CONSTANTS.GENESIS_ROOT` en fallback, `services/FiscalEngine.ts` utilise `''`. Résultat divergent selon l'import. *Effort* : S.

#### 🟡 Medium

- **Comptes journal écrits en `amountInCents` malgré la règle microunits stricte.** `FinancialJournalBuilder.makeLine` renseigne les deux ; `microToCents = Math.round(mu / 10_000)` introduit perte de précision fiscale. FEC lit les cents → cents = source de vérité DGFiP. *Effort* : M.

- **`FiscalSealer` sans `registerId` : un seul `chainHead` partagé pour toutes les caisses.** Aucun callsite ne passe `registerId`. NF525 demande une chaîne par « point d'encaissement » (LNE 001). *Effort* : M.

- **FEC : aucun contrôle du format SIREN, `EcritureLet`/`DateLet` toujours vides, arrondi cents brut.** Comparer avec `GenerateCA3Declaration.ts:18` qui valide `siret.length !== 14`. Non conforme art. A47 A-1 du LPF. *Effort* : S.

- **`FiscalKeyService` : fallback `FISCAL_SIGNING_SECRET` partagé entre tous les tenants côté serveur.** Sans garde `NODE_ENV !== 'production'`. En cas de fuite, tous les tenants compromis. *Effort* : S.

#### 🔵 Low

- **Test d'intégration NF525 ne couvre pas `sealDataAtomically`.** Uniquement `FiscalEngine.sealEntry` (fonction pure) ; le chemin de production réel (Nexus + chainHead + séquenceur) n'est jamais joué. *Effort* : M.

---

### 4. RBAC & matrice des permissions

**Score : 42/100** *(le plus bas des 12 dimensions après Verticales et Tests)*

**Résumé.** La matrice RBAC est fragmentée sur au moins 4 sources non synchronisées (`PermissionRole` enum, `MccRole`, `ROLE_LABELS`/`AccessPolicyManager`, `resolveRoleLevel`) avec des rôles legacy anglais et des rôles MCC hors typage. Le pire défaut : le provisioning MCC crée les propriétaires de tenant avec `role: 'owner'`, un rôle absent de tout le référentiel — ces utilisateurs ont donc `accessLevel = 0` et échouent toutes les gardes serveur/UI sauf les bypass 'admin'/'super_admin' hardcodés. La couche Nexus n'applique aucun contrôle RBAC (SovereignGuard n'enforce que l'isolation tenant).

**Points forts**

- Aliases `fleet_admin` effectivement purgés (0 occurrence dans src).
- Hiérarchie MCC à 3 niveaux (`mcc_junior_dev < mcc_support < super_admin`) claire, MFA obligatoire pour super_admin.
- SovereignGuard garantit l'isolation tenant au niveau adapter.
- Configuration RBAC personnalisable par tenant via overrides.
- `requireTenantRole` (`adminAuthGuard.ts:330-354`) fournit un contrôle par niveau (bon primitif quand utilisé).

#### 🔴 Critical

- **Provisioning MCC crée les propriétaires avec `role='owner'`, absent du référentiel.** `PERMISSION_ROLE_LEVELS['owner']` vaut 0 → refusé sur toutes les routes `requireTenantRole(_, 'manager')`. Côté client, `usePageAccess` ne bypass que `admin || super_admin` → aucune page accessible. **Un tenant fraîchement provisionné ne peut pas se connecter.** *Location* : `src/lib/mcc/provisioning/steps/provisioningSteps.ts:87,96`. *Recommandation* : remplacer par `role: 'admin'` (cohérent avec `/api/signup/route.ts:119`) OU ajouter 'owner' à `PermissionRole` niveau 100. *Effort* : S.

#### 🟠 High

- **`MCC_DEV_MODE_SERVER=true` = bypass total super_admin sans MFA ni garde `NODE_ENV`.** Cf. finding équivalent dimension Sécurité. *Effort* : XS.

- **Aucun contrôle RBAC au niveau Nexus adapter — RBAC purement UI pour les lectures tenant.** Un utilisateur `serveur` (level 40) peut, depuis la console navigateur, faire `Nexus.adapter.get('tenants/<son_tenant>/fiscalLedger/...')` ou lister `payroll`. RoleGate/PageAccess cachent l'UI mais ne bloquent pas le canal Nexus. *Location* : `src/shared/nexus/guards/SovereignGuard.ts:263-298`. *Recommandation* : mapping `COLLECTION → PermissionRole[]` minimum au NexusInterceptor pour collections sensibles. *Effort* : M.

- **Rôles MCC absents du type `PermissionRole`.** `useTabAccess.ts:14` cast `role as PermissionRole` sur des rôles MCC → `undefined` → level 0. `mcc_support`/`mcc_junior_dev` connectés sur UI tenant sont bloqués partout. *Effort* : S.

#### 🟡 Medium

- **Rôles legacy anglais (`server`, `staff`, `commis`, `kitchen`, `bartender`...) traînent hors typage.** Divergence entre `AccessPolicyManager` (labels anglais), `Zeus.ts` (`staff`/`commis`), `MigrationService.ts` (fallback `'server'`), `analyticsAtoms.ts` (filtre `role === 'server'`). *Effort* : M.

- **Trois sources de vérité disjointes pour le gating des écrans.** `navConfig.ts` (`requiredCapability`), `DEFAULT_PAGE_ACCESS` (`pageKey → roles[]`), `RoleGate.tsx` (`pathname → CategoryKey`). Divergences silencieuses. *Effort* : M.

- **`TENANT_ADMIN_ROLES` exclut `directeur` (level 90) — incohérence avec la hiérarchie.** Un directeur qui devrait avoir plus de droits qu'un manager (70) est refusé par `requireTenantAdmin`. *Effort* : XS.

- **Aucun test unitaire sur `usePageAccess`/`useTabAccess`/`DEFAULT_PAGE_ACCESS`.** 1 seule occurrence dans les tests (`franchise.test.ts:130`). Matrice 30 pages × 22 rôles jamais testée. *Effort* : S.

#### 🔵 Low

- **`resolveRoleLevel` (Assistant IA) référence des rôles absents de `PermissionRole`.** `owner`, `proprietaire`, `responsable_site`, `receptionniste`, `apprenti`, `stagiaire`. Deux matrices RBAC divergent. *Effort* : S.

- **`staffAtoms` hardcode `'admin' || 'manager'` — `directeur` oublié.** Symptôme du problème check par égalité de string plutôt que par niveau. *Effort* : XS.

- **Config RBAC tenant écrite/lue via `config/rbac` sans vérification du rôle appelant.** Aucun guard n'exige un rôle admin pour READ/WRITE. *Effort* : S.

- **Nomenclature `super_admin` MCC vs mémoire projet 'renommage prévu'.** Contradiction non résolue, confusion `TENANT_ADMIN_ROLES` qui inclut `super_admin` "pour laisser passer les fleet admins". *Effort* : L.

---

### 5. Dette technique, god files & code mort

**Score : 74/100** *(la meilleure des 12 dimensions)*

**Résumé.** Dette technique globalement bien maîtrisée : très peu de TODO/FIXME (43 total), pas de `console.log` sauvage en production, pas de `@ts-nocheck`, peu de fichiers > 500 lignes (9 dont 4 tests). Les foyers de dette sont concentrés : doublon complet `MarketOracle.ts` entre `shared/providers/fleet/` et `modules/intelligence/ia/fleet/` (357 lignes chacun, version shared morte), 28 FIXME "Modular Monolith" documentant des imports cross-module non résolus, tabs finance orphelins, god file d'événements 796 lignes.

**Points forts**

- 43 TODO/FIXME au total, 28 catégorisés 'Modular Monolith' (traçables).
- Aucun `console.log` sauvage — les 11 usages sont dans `logger.ts`, `axiom.ts` ou benchmarks légitimes.
- Aucun `@ts-nocheck` dans le repo.
- Seulement 9 fichiers > 500 lignes dont 4 sont des tests saga légitimes.
- Pas de mocks dans du code non-test.

#### 🟠 High

- **Doublon complet `MarketOracle.ts` (357 lignes, version shared morte).** `shared/providers/fleet/MarketOracle.ts` a 0 import ; seule la version `modules/intelligence/ia/fleet/` est utilisée. *Effort* : XS.

- **5 composants finance `_tabs` orphelins (~33 KB).** `AccountingTab`, `BankTab`, `TreasuryTab`, `BillingTab`, `AuditTab` sans aucun import. *Effort* : S.

#### 🟡 Medium

- **28 FIXME 'Modular Monolith' — imports cross-module non résolus.** Contournés par `eslint-disable next-line vanguard/no-inter-module-imports`. Dette architecturale reconnue mais non priorisée. *Effort* : L.

- **God file `common.events.ts` (796 lignes).** Concentre tous les schémas d'événements transverses ; les autres piliers ont leurs propres fichiers events. *Effort* : M.

- **God file `accounting-portal/page.tsx` (593 lignes).** Logique métier dans une page Next.js (anti-pattern App Router). *Effort* : M.

- **Bloc commenté de 25 lignes dans `google/sync-hours/route.ts` (TODO intégration GBP).** Endpoint zombie qui répond OK sans écrire chez Google. *Effort* : S.

#### 🔵 Low

- **FIXME facility x4 — `PaymentDialog` (ops) importé dans `facility/floor-plan`.** Marqué FIXME mais non résolu, `eslint-disable` en place. *Effort* : M.
- **11 `@ts-expect-error` dont un dans provider IMAP de production** (`ImapInvoiceProvider.ts:50`). *Effort* : XS.
- **116 `eslint-disable` dispersés** — burndown chart trimestriel recommandé. *Effort* : S.
- **`FranchiseDashboard.tsx` à 505 lignes** — composant monolithique. *Effort* : M.

---

### 6. Couverture tests (Vitest + Playwright)

**Score : 35/100** *(la plus basse des 12 dimensions)*

**Résumé.** 176 tests unitaires Vitest + 9 spécifications Playwright pour ~2 745 fichiers source (ratio ~6,4 %). Le socle NF525/SovereignGuard/microunits est adressé, mais plusieurs tests critiques sont désactivés, mocqués au point d'être inopérants, ou orphelins (jamais exécutés). La couverture composants (3/784 .tsx) et l'ICM-lite (0 test) sont quasi nulles ; les Playwright utilisent massivement `if isVisible / catch(()=>{})` et passent verts même sur UI cassée.

**Points forts**

- Suite d'intégration NF525 réelle (`src/__tests__/integration/nf525-fiscal-sealing.test.ts`).
- Suite d'isolation multi-tenant riche (`src/__tests__/security/multi-tenant-isolation.test.ts`).
- Invariant #5 (reliquat split) testé au niveau microunits (`pos-split-remainder.test.ts`).
- Bonne présence de tests HACCP, IoT cold-chain, KDS multiposte, WORM archive.
- Setup env `NEXUS_TENANT_SECRET` dans vitest.config évite fausse validation.

#### 🔴 Critical

- **22 tests `src/e2e/vanguard/` orphelins — aucun runner ne les exécute.** Vitest exclut `src/e2e/**`, Playwright pointe sur `./tests/e2e`. Les tests fiscal-signature, financial-bridge, sovereign-math, chaos, event-bus, offline-resilience, tenant-seeder, invoice-extraction ne sont jamais lancés. *Location* : `src/e2e/vanguard/` (22 fichiers). *Effort* : M.

- **`FiscalSealer` chain test valide une chaîne SHA-256 mockée constante.** `mockResolvedValue('test_hash_abc123')` → les deux seals reçoivent le même hash constant, donc `seal2.previousHash === seal1.hash` est trivialement vrai. *Location* : `src/__tests__/infrastructure/FiscalSealer.test.ts:47-131`. *Effort* : S.

#### 🟠 High

- **Test d'intégration POS→Fiscal silencieusement skippé en CI.** `describe.skipIf(!RUN_INTEGRATION)` masque le test si `FIRESTORE_EMULATOR_HOST` non défini. Aggravant : clé privée RSA en dur dans le fichier. *Effort* : M.

- **Playwright e2e — pattern `isVisible`/`catch` rend les specs incapables d'échouer.** 46 blocs `if (await X.isVisible())` + 13 blocs `.catch(() => {})`. Le "Flux Vital POS→Bilan Z" n'est pas testé, il est mimé. *Effort* : L.

- **Couverture composants React quasi nulle : 3 `.test.tsx` pour 784 `.tsx`.** `Cart`, `ProductGrid`, `TableSelector`, `KDSBoard`, `FloorPlanEditor` sans aucun test. *Effort* : XL.

- **Playwright `webServer` désactivé — les e2e dépendent d'un serveur lancé à la main.** Aucun `preflight.sh` ne le fait. *Effort* : XS.

- **Zéro test ICM-lite / TaskContext.** CLAUDE.md décrit ICM-lite comme mécanisme critique. Aucun test ne vérifie `resolveTaskContext()`. *Effort* : S.

#### 🟡 Medium

- **Aucun seuil de couverture configuré — impossible de faire régresser un gate.** `thresholds` absent, `all: false` masque les fichiers non importés. *Effort* : XS.

- **Tests dispersés sur 4 conventions incompatibles.** `src/__tests__/`, `src/modules/**/*.test.ts`, `src/e2e/vanguard/` (orphelins), `tests/falange/`, `tests/verification/`, `tests/benchmarks/`, `tests/e2e/`. *Effort* : L.

- **Noms de tests dupliqués créent une ambiguïté dans les logs.** 4 basenames identiques (`domain.test.ts`, `isolation.test.ts`, `AuditService.test.ts`, `NexusYieldEngine.test.ts`). *Effort* : XS.

- **Tests métier sagas mockent `CryptoService` — chaîne fiscale non couverte dans les handlers.** *Effort* : S.

- **Setup timeout global 30 s + hookTimeout 30 s masque des vraies fuites.** *Effort* : XS.

#### 🔵 Low

- **Ratio tests unitaires / fichiers source ~6,4 %.** Loin du benchmark industrie (15-25 %) surtout en contexte NF525/RGPD/HACCP. *Effort* : XL.

---

### 7. Performance, bundle & PWA

**Score : 55/100**

**Résumé.** Fondations correctes (ICM-lite bien conçu, Firestore local-first configuré, next/font, next/image config, dynamic imports systématiques dans MCC), mais surface d'attaque significative sur le bundle client (Konva, jsPDF, framer-motion, xlsx dead-code chargés en statique), un Service Worker rudimentaire cache-first sans versioning ni invalidation (stale forever), et une utilisation quasi-nulle de next/image (24 `<img>` bruts pour seulement 6 `next/image` dans src/). Un bug silencieux dans `TaskContext` (clé `analytics` inexistante sur intelligence route) prouve que le typage ICM est court-circuité par un cast.

**Points forts**

- ICM-lite (`src/lib/icm/TaskContext.ts`) bien conçu : 26 routes déclarées avec priorités HIGH/MEDIUM/LAZY/OFF.
- Firestore local-first configuré (`persistentLocalCache` + `persistentMultipleTabManager`).
- `next.config.ts` images configuré avec formats AVIF+WebP, deviceSizes tuned.
- MCC dashboard exemplaire : 18 dynamic imports next/dynamic avec loading skeletons.
- `next/font` utilisé pour les 3 polices avec variables CSS (self-hosting automatique).

#### 🟠 High

- **Service Worker cache-first sans versioning ni invalidation — contenu stale permanent.** `public/sw.js` applique `caches.match(request).then(cached || fetch)` sur toutes les requêtes GET, sans nom de cache, sans stratégie de version, sans nettoyage `activate`. Incompatible avec NF525 : le JS scellant les tickets doit correspondre à la version déployée. *Effort* : M.

- **Konva / react-konva chargés en statique dans FloorPlanEditor (~300 KB gzipped).** Toute route qui touche floor-plan tire konva dans son chunk initial. *Effort* : S.

- **jsPDF importé en statique dans FinancialNexusBridge / documents PDF.** ~180 KB gzipped alourdissent chaque page finance. *Effort* : S.

- **24 balises `<img>` brutes dans src/ vs 6 next/image — coverage image optimization ~20 %.** LCP + CLS. *Effort* : M.

#### 🟡 Medium

- **Dépendance `xlsx` (~460 KB) déclarée mais aucun import dans src/.** Soit code mort, soit exports Excel jamais implémentés. CVE-2023-30533. *Effort* : XS.

- **framer-motion importé en statique dans 30+ composants.** ~90 KB gzipped chargés sur presque toutes les routes. *Effort* : L.

- **d3 complet importé pour un seul MindMap.** `import * as d3 from 'd3'` alors que seulement selection/force/drag utilisés. *Effort* : S.

- **`TaskContext.ts` — clé `analytics` inexistante sur `ICMImportanceMap` forcée par un cast.** La route `intelligence` déclare `analytics: 'MEDIUM'` mais la clé n'existe pas dans l'interface, cast `as ICMImportanceMap` bypass TypeScript. Bug silencieux. *Effort* : XS.

- **PWA viewport bloque userScalable — violation WCAG 2.1 SC 1.4.4.** `maximumScale: 1, userScalable: false`. *Effort* : XS.

- **1 seul `loading.tsx` pour 66 routes.** Pas de streaming Suspense par route. *Effort* : M.

- **48 fichiers `'use client'` sur 66 pages — RSC quasi-inutilisé.** 72 % basculent en client-side. *Effort* : L.

#### 🔵 Low

- **Seulement 4 `React.memo` dans tout le codebase.** 318 `useAtomValue`, 0 `selectAtom`/`atomFamily` — re-renders probablement non maîtrisés. *Effort* : L.
- **`themeColor` sur `metadata` déprécié depuis Next 14 — doit être dans `viewport`.** *Effort* : XS.
- **Aucun preload de font woff2 malgré 3 fonts Google.** Cormorant Garamond avec 5 poids ≈ 200 KB. *Effort* : XS.
- **CSP autorise `'unsafe-inline'` et `'unsafe-eval'` pour script-src.** *Effort* : M.

---

### 8. Verticales non-restaurant (hotel, bakery, garage, salon, clinic, retail, custom + futures)

**Score : 32/100** *(la deuxième plus basse)*

**Résumé.** Divergence architecturale critique entre 4 sources de vérité verticales : `PlatformVariant` enum (8), `DNA_REGISTRY` seeds (7, custom oublié), `VerticalBlueprintRegistry` (12), dossiers `src/verticals/` (12). 4 nouvelles verticales (gym, coworking, veterinary, florist) ont un blueprint mais sont invalides à la validation Zod. Modules métier verticaux (`appointments`, `rooms`, `bays`, `consultation`) sont des squelettes vides. `custom` variant retombe silencieusement sur `restaurant` DNA.

**Points forts**

- Blueprint déclaratif riche (`VerticalBlueprint.ts` 197 lignes) avec `resolveSubVariant`, `precisionTier` L0-L3.
- `VerticalBlueprintRegistry` centralisé avec `hasVerticalBlueprint`/`getAllBlueprintSlugs`.
- `CapabilityCatalog` typé (`isKnownCapability` + `resolveCapabilityDependencies`).
- `vertical-forge` (`generateVertical.ts` 17.6K + `SectorStudyAgent.ts` 9.3K) : moteur de scaffolding présent et fonctionnel.
- 6 DNA templates non-restaurant substantiels (capabilities finement modulées).

#### 🔴 Critical

- **`PlatformVariant` enum incohérent avec `VerticalBlueprintRegistry` (4 verticales orphelines).** Enum n'accepte que 8 valeurs, `VerticalBlueprintRegistry` enregistre 12 blueprints. Toute écriture `TenantConfig` avec variant=`gym|coworking|veterinary|florist` est rejetée par Zod. *Location* : `src/modules/system/domain/schemas/tenant.ts:4-13` vs `src/verticals/_shared/catalog/VerticalBlueprintRegistry.ts:30-46`. *Recommandation* : générer `PLATFORM_VARIANTS` à partir des slugs du registry. *Effort* : S.

- **Modules métier verticaux 100 % vides (`appointments`, `rooms`, `bays`, `consultation`).** Squelettes avec `.gitkeep` uniquement et `export {};`. Impossible pour salon/clinic de créer un RDV, pour hotel de gérer une chambre, pour garage d'attribuer une baie. *Location* : `src/modules/commerce/relation/appointments`, `src/modules/facility/spaces/rooms`, `src/modules/facility/spaces/bays`, `src/modules/ops/service/consultation`. *Effort* : XL.

#### 🟠 High

- **`custom-full-dna.ts` absent du `DNA_REGISTRY` — fallback silencieux sur `restaurant`.** Le fichier existe (93 lignes) mais n'est ni importé ni enregistré. `resolveDNA('custom')` retourne `RESTAURANT_FULL_DNA` via l'opérateur `??`. Un tenant custom hérite silencieusement de toutes les capabilities restaurant. *Effort* : XS.

- **4 nouvelles verticales sans plugin ni adapters (juste un blueprint 60 lignes).** `coworking`, `florist`, `gym`, `veterinary` livrées avec un unique fichier blueprint. Comparer à hotel/clinic (adapters + commerce + finance + ops + pms + HotelVertical.ts 6 KB). *Effort* : L.

#### 🟡 Medium

- **Handlers de notification finance codés en dur pour un restaurant.** Fallback string `'Notre restaurant'` sans utiliser la variant du tenant. *Effort* : S.

- **Aucun test pour retail, gym, coworking, florist, veterinary.** Seuls bakery, garage, salon, clinic, hotel ont __tests__. *Effort* : M.

- **`filterByVertical` utilise une whitelist `FOOD_VARIANTS` hardcodée (3 valeurs).** Le filtrage nav ne dérive pas des capabilities du blueprint. *Effort* : S.

- **`VERTICAL_NAV_OVERRIDES` référence `luxury_vault`, verticale inexistante.** Code mort / vestige d'un pivot abandonné. *Effort* : XS.

#### 🔵 Low

- **`BrandingService` fallback `default 'restaurant'` au lieu de `'custom'`.** Contradiction entre commentaire et implémentation. *Effort* : XS.
- **Verticales matures divergent en profondeur d'implémentation (hotel 6K vs custom 1.5K).** `CustomVertical.ts` est un stub non alerté. *Effort* : S.

---

### 9. MCC (Multi-Cloud-Control) — console admin plateforme

**Score : 62/100**

**Résumé.** La couche MCC est cadrée (`src/lib/mcc/` + `src/app/(admin)/admin/mcc/` + `src/app/api/admin/mcc/` + `api/admin/mdm`) avec RBAC 3-niveaux, MFA obligatoire, Trusted Device Registry, `ChangelogService`, `ResellerPortal`, `MosyleClient` MDM, provisioning Saga et `cloneFromReference` NF525-safe. La règle « MCC ne consomme pas les events métier tenant » est bien respectée. Mais plusieurs zones critiques restent des stubs (`wipeTenantData`, PIN owner non délivré), un doublon de moteur de provisioning subsiste, et `DataIntegrityService.deleteReseller` écrit sur des chemins inexistants — c'est un kill-switch RGPD factice.

**Points forts**

- Aucune subscription `NexusEventBus.on` aux events métier tenant dans `src/lib/mcc` ni dans les routes `/api/admin/mcc` — invariant respecté.
- RBAC MCC 3-niveaux avec hiérarchie numérique + MFA obligatoire sur super_admin + Trusted Device Registry fail-closed.
- `provisionNewClient` implémente une vraie Saga de compensation LIFO — pattern reference-quality.
- `cloneFromReference` exclut explicitement `fiscalSeals` et `journalEntries` du clonage NF525.
- `SystemTenantRegistry` propre : 24 tenants système (8 variants × 3 tiers).

#### 🔴 Critical

- **`wipeTenantData()` est un stub — Kill Switch RGPD non implémenté.** Appelée comme « Kill Switch Ultime » RGPD/liquidation mais ne supprime AUCUNE donnée, uniquement log d'audit. Le commentaire admet : « Le code implémenterait ici la suppression ». No-op déguisé. *Location* : `src/lib/mcc/fleet/services/DataIntegrityService.ts:71-84`. *Effort* : L.

#### 🟠 High

- **`DataIntegrityService.deleteReseller` — chemins Nexus incorrects.** Écrit `resellers/${resellerId}` alors que la source de vérité utilise `mcc/resellers/${id}`. La query cherche `tenants` avec `resellerId==X` mais le lien réel est `tenantConfig.referredBy=affiliateCode`. Cascade delete ne trouve rien. *Effort* : S.

- **PIN owner généré mais jamais envoyé — nouveau tenant sans accès.** `setupOwnerAccount` génère PIN, l'email de bienvenue ne l'interpole nulle part. Régression bloquante en production. *Effort* : XS.

- **`cloneFromReference` sans Saga de compensation et sans seed RBAC.** Réécrit 7+ collections sans compensation, sans le bloc RBAC defaults présent dans le flow normal. Un échec en milieu de clone laisse un tenant orphelin. *Effort* : M.

#### 🟡 Medium

- **Doublon Provisioning : `ProvisioningEngine` vs `TenantProvisioningService`.** Deux moteurs coexistent (213 + 332 lignes), logique dupliquée avec risque de divergence. *Effort* : M.

- **`FleetRolloutService.rolloutMenu` contourne `ChangelogService`.** Chaque tenant reçoit une mutation MCC sans entrée dans `mcc/changelog` — impossible à auditer. *Effort* : XS.

- **Rôle `'owner'` provisionné mais absent de `TENANT_ADMIN_ROLES`.** Combiné au PIN non-délivré, le premier login est doublement cassé. *Effort* : S.

- **Commissions revendeur non-idempotentes — double-comptage si rejeu.** Rejouer le calcul pour la même période additionne 2× au total. *Effort* : S.

- **Décommission tenant : pas d'entrée `ChangelogService`, pas de coupure Auth.** Un employé authentifié conserve son JWT valide jusqu'à expiration naturelle. *Effort* : S.

#### 🔵 Low

- **`FleetBenchmarkingService` utilise `averageTicketInCents` — viole convention microunits.** *Effort* : S.
- **MDM POST devices — race condition sur la liste des serials.** Read-modify-write non-transactionnel. *Effort* : S.
- **`MCC_DEV_MODE` bypass — surface d'attaque si mal configuré en prod.** Cf. finding équivalent dimensions Sécurité et RBAC. *Effort* : XS.

---

### 10. Bus événementiel & saga réactive (NexusEventBus + outbox/DLQ)

**Score : 48/100**

**Résumé.** L'infrastructure existe (NexusEventBus + IdempotencyGuard + busOutbox Dexie + DLQ avec backoff exponentiel + escalade fiscale NF525 + 170 handlers + tests saga par pilier) et 203 sites d'émission montrent une adoption réelle. Mais plusieurs invariants critiques sont cassés ou absents : le circuit-breaker `inFlight` est indexé par NOM d'événement, l'`IdempotencyGuard` lit `payload.eventId` alors qu'AUCUN contrat dans `events/*.ts` ne définit `eventId` (déduplication permanente no-op), aucun `correlationId` de bout en bout, et l'outbox n'a AUCUNE atomicité (2 transactions Dexie séparées + replay sans dedupe → double-scellement fiscal possible). Côté serveur, `dispatchServerEvent` court-circuite entièrement outbox et DLQ.

**Points forts**

- Bus événementiel unifié `NexusEventBus` avec catalogue typé par domaine — 203 sites d'émission, adoption réelle.
- Outbox persistant en IndexedDB Dexie + replay au boot via `replayPendingEvents`.
- DLQ complet avec backoff exponentiel plafonné 60 s, 5 tentatives, ESCALADE `mcc.fiscal_audit_required` pour les 6 events NF525 critiques.
- Priorisation à 3 niveaux CRITICAL/HIGH/BACKGROUND avec sémantique claire.
- Couverture tests saga par pilier (12 fichiers).

#### 🔴 Critical

- **Circuit-breaker `inFlight` indexé par nom d'événement — bloque toute émission concurrente légitime.** `Set<string>` indexé par NOM d'événement. Deux paiements simultanés (caisses différentes) = second paiement jamais dispatché aux handlers CRITICAL/HIGH. En production multi-caisse c'est fatal. *Location* : `src/shared/eventBus/NexusEventBus.ts:40,137,145,226`. *Recommandation* : indexer par (event + emissionId unique). *Effort* : M.

- **`IdempotencyGuard` permanent no-op : aucun contrat d'événement ne définit `eventId`.** Le guard fait `if (!eventId) return false;`. Aucun des ~170 events typés ne déclare un champ `eventId`. Les 32 handlers qui passent `idempotent: true` n'ont AUCUNE déduplication effective. *Location* : `src/shared/eventBus/IdempotencyGuard.ts:113-136`. *Effort* : L.

- **Outbox non-atomique + replay sans dedupe → double-scellement fiscal NF525 possible.** `emitDurable` écrit outbox, exécute handlers, update outbox — 3 transactions Dexie séparées. Si crash entre exécution et update, l'entrée reste `pending`. Au boot, `replayPendingEvents` re-émet SANS vérifier si les handlers ont déjà tourné (l'idempotence étant no-op). Le sceau NF525 est chaîné DEUX FOIS. *Location* : `src/shared/eventBus/NexusEventBus.ts:82-115` ; `src/lib/sync/outboxReplayer.ts:12-43`. *Effort* : L.

#### 🟠 High

- **Aucun `correlationId` / `causationId` propagé à travers les cascades d'événements.** Impossible de tracer une saga. En production, debugging d'une cascade cassée demande de grep les timestamps. *Effort* : M.

- **Côté serveur, `dispatchServerEvent` court-circuite outbox ET DLQ.** Toutes les écritures outbox/DLQ sont gardées par `if (typeof window !== 'undefined')`. Événements CRITICAL émis serveur sur crash = perdus. *Effort* : L.

- **Handlers CRITICAL (scellement NF525, HACCP, IoT) non protégés par idempotence.** Seuls 32/~170 handlers passent `idempotent: true`, aucun des CRITICAL identifiés (OrderSealedNF525Handler, HaccpCorrectiveActionHandler, IotOfflineAlertHandler...) ne le fait. Retry DLQ ou replay outbox = double scellement. *Effort* : M.

- **Émissions fiscales masquées par `.catch(() => {})`.** `FinancialNexusEvents.emitPaymentEvents` swallow silencieusement toute erreur sur `order.paid`, `order.split`, `order.comp`, `order.refunded`. *Location* : `src/modules/finance/comptabilite/FinancialNexusEvents.ts:22,33,43,52`. *Effort* : XS.

#### 🟡 Medium

- **DLQ handlers BACKGROUND : écriture DLQ fire-and-forget dans fire-and-forget.** Si le processus se termine, la promise catch n'a jamais lieu et l'échec ne va PAS en DLQ. *Effort* : M.

- **`PayloadMigrator` est un no-op déguisé — pas de vraie chaîne de migration v1→v2.** Le jour où un event passe à `v: 2`, le replay échouera. *Effort* : S.

- **Cascades non documentées — impossible d'auditer la vente POS → stock → KDS → compta.** Aucune carte des cascades, aucun test end-to-end par cascade. *Effort* : M.

#### 🔵 Low

- **`inFlight.delete(event)` dans le finally avant que BACKGROUND ait tourné.** Brèche du circuit-breaker sur BACKGROUND. *Effort* : S.

---

### 11. Accessibilité (WCAG) & UX critique

**Score : 38/100** *(troisième plus basse)*

**Résumé.** L'app livre les briques cosmétiques (glassmorphism, motion, offline banner, palette Cmd+K, empty states dédiés) mais échoue sur les fondations WCAG opérables. Le composant `Modal` canonique — utilisé par 15+ dialogues (paiement, stock, HR, floor-plan, showcase) — n'expose ni `role="dialog"`, ni `aria-modal`, ni `aria-labelledby`, ni focus trap. La règle `prefers-reduced-motion` n'est pas propagée aux 320+ composants framer-motion (`useReducedMotion` jamais importé). Les prix POS et chronomètres KDS ignorent `tabular-nums` que la design bible impose.

**Points forts**

- Escape ferme les modales (`Modal.tsx:82-87`).
- Command Palette Cmd+K câblée globalement.
- `ConnectivityBanner` offline dédié avec animation réconciliation.
- Empty states métier soignés (`KDSEmptyState`, panier vide).
- Composants POS majeurs à 56px — conforme minimum POS 48px.

#### 🔴 Critical

- **Modal canonique sans ARIA ni focus trap — régression globale sur tous les dialogues.** `src/shared/components/ui/Modal.tsx` (utilisé par la quasi-totalité des dialogues métier) ne pose aucun `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, et n'implémente aucun focus trap. Bouton fermer sans `aria-label`. Lecteurs d'écran ne signalent pas le contexte modal, tabulation clavier s'échappe derrière le backdrop. *Location* : `src/shared/components/ui/Modal.tsx:64-200`. *Recommandation* : ajouter `role='dialog'`, `aria-modal='true'`, `aria-labelledby`, wrapper `FocusTrap`, `aria-label` sur bouton X, restaurer focus au close. Un seul patch corrige 15+ écrans. *Effort* : S.

#### 🟠 High

- **`prefers-reduced-motion` non propagé à framer-motion (320+ composants animés).** `useReducedMotion` importé nulle part ; 320 fichiers avec `animate=`/`motion.`. Non-conformité WCAG 2.3.3 et 2.2.2. *Effort* : S.

- **`tabular-nums` absent des prix POS et chronomètres KDS.** Design bible impose `font-variant-numeric: tabular-nums` sur prix/TVA/chronomètres. Le total qui passe de 12,80 € à 12,90 € voit les digits se décaler entre deux frames. *Effort* : S.

- **Focus visible clavier absent sur la majorité des boutons interactifs custom.** ~320 fichiers avec bouton sans ring focus visible. Non-conformité WCAG 2.4.7. *Effort* : M.

- **Raccourci clavier `/` pour focaliser la recherche non implémenté.** Design bible mentionne `/ focus search`. 0 handler global. *Effort* : S.

#### 🟡 Medium

- **Day Mode / contraste AAA extérieur soleil non implémenté.** Aucune feuille de style haute-contraste, aucun toggle Day Mode. *Effort* : M.

- **Touch targets KDS < 64 px requis par la design bible.** Modal close 40px (< 44px WCAG 2.5.5 AAA), badge chrono/avatar KDS 32px. *Effort* : S.

- **`ConnectivityBanner` : hauteur et couleur non conformes.** Rendu ≈ 26-28px au lieu de 32px, colore en rouge au lieu d'ambre pour offline. *Effort* : XS.

- **Icônes lucide sans `aria-hidden` ni `aria-label` sur boutons icon-only.** Lecteurs d'écran annoncent 'bouton' sans contexte. *Effort* : M.

#### 🔵 Low

- **Focus trap absent y compris pour la Command Palette (Cmd+K).** *Effort* : XS.
- **`prefers-reduced-motion` : couverture CSS incomplète.** N'anéantit pas `backdrop-blur`, `animate-pulse`, `animate-spin`. *Effort* : XS.

---

### 12. Documentation, CI/CD & tooling

**Score : 62/100**

**Résumé.** Le tooling architectural (sentrux 47 règles, preflight 8 étapes, baseline gate) est mature et solide, mais la documentation dérive : `ARCHITECTURE.md` a 2+ mois de retard, cite un pilier `kds` mort et ignore le 8ᵉ pilier `facility`, `tsconfig` prétend `strict` tout en désactivant 4 sous-flags. `README` racine est squelettique et pointe vers docs manquants. `sessions.md` souffre de dette de discipline (sessions `active` non fermées depuis 11 jours).

**Points forts**

- `.sentrux/rules.toml` très mature : 47 règles couvrant cycles, layers, boundaries.
- `scripts/preflight.sh` solide : 8 étapes bloquantes (tsc, fetch nu, ESLint ratchet, vitest, madge, build, sentrux check + gate).
- `sessions.md` rigoureusement tenu : 100+ sessions journalisées.
- Hook Claude PreToolUse actif (`check-session-collision.sh`).
- Baseline sentrux présente : le gate anti-régression a une référence stable.

#### 🟠 High

- **`tsconfig` strict partiellement désactivé alors que docs promettent strict.** `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch` désactivés. *Location* : `tsconfig.json:12-24`. *Effort* : M.

- **`ARCHITECTURE.md` obsolète de 2+ mois et incohérent avec la structure actuelle.** Date 2026-06-14. Liste `kds` comme pilier indépendant (migré sous `ops/production/kds/`). Ne liste PAS le 8ᵉ pilier `facility`. *Effort* : S.

- **Incohérence sidecar RAG : docs disent LightRAG:9621, docker dit sovereign-rag:8000.** Un nouveau développeur cherche LightRAG:9621 introuvable. *Effort* : XS.

#### 🟡 Medium

- **`README.md` racine ne documente ni les 8 piliers, ni Nexus, ni preflight, ni tests.** Renvoie vers `docs/ARCHITECTURE.md` qui n'est qu'un stub 2.2K (doublon partiel du vrai document racine). *Effort* : S.

- **CLAUDE.md liste sélectivement les domaines : dérive silencieuse non documentée.** Omet `menu-builder`, `catalog`, `franchise`, `forecasting`, `simulation`, `fleet`, `conventions`, etc. *Effort* : M.

- **Aucun CLAUDE.md par pilier — impossible d'avoir conventions locales.** Seul `finance/FINANCE_MANIFEST.md` existe mais n'est pas un CLAUDE.md reconnu. *Effort* : S.

- **Sessions actives non fermées depuis 11 jours — dette de discipline `sessions.md`.** `audit-complet-v3` et `typing-unknown-eradication` marquées `active` depuis 2026-08-07. Faux positifs pour le hook de collision. *Effort* : XS.

- **Preflight non branché sur npm scripts ni sur git hooks.** `preflight.sh` solide mais aucun script npm ne l'appelle, aucun husky configuré. Contrat 'preflight avant PR' repose sur discipline humaine. *Effort* : S.

- **Hook de collision session est warning-only (`exit 0` toujours).** Rassure faussement. *Effort* : XS.

- **Doublon documentaire `ARCHITECTURE.md` racine vs `docs/ARCHITECTURE.md`.** 19.5K vs 2.2K stub. README pointe vers le stub. *Effort* : XS.

#### 🔵 Low

- **Playwright installé mais aucun script npm e2e.** *Effort* : XS.
- **`tsconfig` exclut `scripts/` du typecheck malgré fichiers `.ts` présents.** *Effort* : XS.
- **Aucun `CHANGELOG.md` à la racine — le CHANGELOG existe dans `docs/` (peu visible).** *Effort* : XS.

---

## Recommandations transversales

Cinq patterns reviennent dans plusieurs dimensions et méritent une décision architecturale unifiée (ADR).

### ADR-001 — Unifier la déduplication d'événements (finding critical bus + high MCC + medium tests)

Impose un champ `eventId: string` (UUID) obligatoire dans **tous** les payloads d'événements, injecté automatiquement par `emit`/`emitDurable` si absent. Refuser en runtime toute émission sans `eventId`. Sans cette base, `IdempotencyGuard` restera no-op, le replay outbox restera dangereux, et les handlers CRITICAL ne pourront jamais être marqués `idempotent: true` de manière effective.

### ADR-002 — Aligner les 5 sources de vérité RBAC (findings RBAC + MCC + Sécurité + Intelligence)

Fusionner `PermissionRole`, `MccRole`, rôles legacy anglais, `resolveRoleLevel` (Assistant IA), `TENANT_ADMIN_ROLES` dans une source unique typée `AppRole = TenantRole | MccRole`. Décider en particulier si `owner` existe (et l'ajouter à `PERMISSION_ROLE_LEVELS`) ou si le provisioning doit poser `admin`. Le tenant fraîchement provisionné doit pouvoir se connecter.

### ADR-003 — Trancher la stratégie « écritures sensibles côté client » (findings NF525 + Sécurité + RBAC)

Décider entre (a) toutes les `SIGNED_WRITE_COLLECTIONS` passent obligatoirement par un endpoint serveur qui scelle et écrit (le client n'écrit jamais directement) OU (b) canal de délivrance de tickets HMAC courte durée. Sans décision, la signature `__nf525` reste optionnelle côté client et `verifyWriteSignature` reste théâtral. Étendre à `journalEntries`/`fiscalSeals` en SET/UPDATE (finding critical NF525 #1) et aux collections RBAC-sensibles (`users`, `tenantConfig`, `apiKeys`).

### ADR-004 — Canonicaliser les 4 sources de vérité verticales (findings Verticales + Architecture + Doc)

Aligner `PLATFORM_VARIANTS` (Zod enum), `DNA_REGISTRY` (seeds), `VerticalBlueprintRegistry` (blueprints), `src/verticals/` (dossiers) sur une source unique — probablement les slugs du `VerticalBlueprintRegistry` avec génération de l'enum Zod. Ajouter un test de cohérence qui échoue si un slug manque dans une des sources. Prendre position sur `src/verticals/` vs `src/shared/seeds/` (chantier vertical-forge à isoler ou promouvoir).

### ADR-005 — Institutionnaliser un contrat clavier + ARIA global (findings Accessibilité + Perf)

Un unique passage sur `src/shared/components/ui/Modal.tsx` (ajout `role="dialog"`, `aria-modal`, `focus trap`, `aria-labelledby`, restauration focus) corrige 15+ écrans dépendants. Idem `useReducedMotion` global via `MotionConfig` au root layout. Ajouter `eslint-plugin-jsx-a11y` en `severity: error` sur les composants icon-only, focus-visible et click-events-have-key-events.

### Boucle de gouvernance

- Ajouter au `preflight.sh` : `madge --circular src/modules` (Architecture), `eslint-plugin-jsx-a11y` en error (Accessibilité), un compteur `eslint-disable` avec seuil (Dette).
- Rendre le hook `check-session-collision.sh` bloquant (`exit 2`) sur collision `active`.
- Créer `npm run preflight` + un `.husky/pre-push` léger (`tsc + vitest + sentrux check`).

---

## Plan d'action séquencé

### Semaine 1 — Zone critique (les 13 critical + les 4 quick-wins high)

1. **RBAC-C1** — Fix `role: 'owner'` provisioning MCC (Effort S, débloque tous les nouveaux tenants).
2. **MCC-H1** — Interpoler `pinPlain` dans l'email owner (Effort XS).
3. **Bus-H4** — Remplacer `.catch(() => {})` par `.catch(logger.error)` dans `FinancialNexusEvents` (Effort XS).
4. **Verticales-H1** — Ajouter `CUSTOM_FULL_DNA` au `DNA_REGISTRY` (Effort XS).
5. **Sécurité-H1 / RBAC-H2 / MCC-L3** — Ajouter `NODE_ENV !== 'production'` au bypass `mcc-dev-bypass` (Effort XS, cross-dimensions).
6. **NF525-C1** — Étendre `NexusInterceptor` : SET/UPDATE sur `IMMUTABLE_COLLECTIONS` throw sauf création initiale (Effort M).
7. **NF525-C2** — Câbler `usePrintReceipt` sur `FinancialNexusBridge.processOrder()` + retirer early-return `appendNf525Footer` (Effort M).
8. **Sécurité-C1** — Refactor middleware `/api/admin/*` (JWT ou canal séparé) (Effort M).
9. **Sécurité-H3** — `requireTenantUser` sur `/api/v1/menu` OU flag `publicMenuEnabled` (Effort S).
10. **Bus-C1** — Refactor `inFlight` par `emissionId` (Effort M).

### Mois 1 — Zone haute (39 high total)

- **Bus événementiel** : introduire `eventId` obligatoire, `correlationId`/`causationId`, marquer handlers CRITICAL `idempotent: true`, rendre `emitDurable` atomique (ADR-001).
- **NF525** : verrouiller `wormArchives`, corriger mode offline (pieceNumber séquentiel + persistance locale), supprimer double `FiscalEngine`.
- **RBAC** : aligner les 5 sources (ADR-002), ajouter contrôle RBAC au NexusInterceptor pour collections sensibles.
- **Accessibilité** : corriger `Modal` canonique (ADR-005), propager `useReducedMotion`, ajouter `tabular-nums`, focus-visible global.
- **Tests** : réactiver Playwright `webServer`, migrer les 22 tests orphelins `src/e2e/vanguard/`, supprimer les mocks `CryptoService` des tests fiscaux.
- **Architecture** : traiter les 58 imports profonds barrel + ajouter lint `no-restricted-imports/pattern`.
- **MCC** : implémenter `wipeTenantData()` réel, corriger `deleteReseller`, ajouter Saga à `cloneFromReference`.
- **Perf** : dynamic import Konva + jsPDF, versioning Service Worker.
- **Doc** : mettre à jour `ARCHITECTURE.md`, aligner LightRAG/sovereign-rag, activer `strict: true` complet.

### Trimestre 1 — Zone medium (56 medium)

- Fusion `ProvisioningEngine` / `TenantProvisioningService`.
- Canonicalisation verticales (ADR-004) + implémentation minimale `appointments`/`rooms`/`bays`/`consultation` (débloque salon/clinic/hotel/garage).
- Consolidation matrice RBAC 3 sources (`navConfig` + `DEFAULT_PAGE_ACCESS` + `RoleGate`).
- Rapatrier `src/shared/components/settings/` vers les piliers propriétaires.
- Framer-motion : audit + downgrade partiel vers CSS transitions.
- Ajout seuils de couverture Vitest + convention unique tests.
- CLAUDE.md par pilier (finance, compliance, intelligence a minima).
- Rate-limit + validation sur toutes les routes `/api/v1/*`.

### Backlog — Zone basse (29 low + 1 info)

- Renommer nomenclature `super_admin` MCC (décision utilisateur nécessaire).
- Suppression code mort `luxury_vault`, `MarketOracle.ts` shared, tabs finance `_tabs/`.
- Documentation : CHANGELOG racine, ARCHITECTURE canonicalisation.
- Migration `React.memo` + `selectAtom` sur composants haute fréquence.
- `themeColor` metadata → viewport (Next 14+).

---

## Colophon

**Outils utilisés** : lecture directe du tree via ripgrep/grep, croisement avec `CLAUDE.md`, `ARCHITECTURE.md`, `.sentrux/rules.toml`, `.claude/sessions.md`, `docker-compose.yml`, `package.json`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, les schémas Zod dans `src/domain/schemas/` et `src/shared/nexus/contracts/`, et l'inspection systématique des barrels (`src/modules/*/index.ts`).

**Limites de l'audit** :

- Audit **statique sans exécution** : aucun `npm test`, aucun `npm run build`, aucun démarrage Firestore emulator, aucun benchmark de bundle réel. Les tailles gzipped citées sont des estimations basées sur la documentation publique des dépendances.
- Aucun test de sécurité offensif (pas de pentest, pas de fuzzing, pas d'injection réelle).
- La conformité NF525 est évaluée sur la structure du code et non sur un dossier d'homologation LNE/AFNOR — un audit LNE tiers reste nécessaire pour certification.
- Les scores de santé sont calibrés sur les critères des auditeurs individuels (fondations solides + failles de bord = 55-65 ; fondations manquantes = < 40). Ils ne sont pas comparables à un référentiel externe (SonarQube, CodeClimate).
- L'audit se base sur le tree `main` au commit `9054d08c1` (2026-08-18). Toute évolution ultérieure n'est pas reflétée.

**Reproductibilité** : chaque finding est ancré à un fichier et à une ligne (ou une preuve grep). Les recommandations sont formulées comme des actions concrètes avec effort estimé (XS < 1h, S < 1j, M < 3j, L < 1 semaine, XL > 1 semaine). Un CTO peut vérifier chaque item indépendamment.

**Total** : 138 findings (13 critical, 39 high, 56 medium, 29 low, 1 info) — score moyen 52/100 — 12 dimensions.
