# 🔍 AUDIT EXHAUSTIF RESTAURANT-OS-CORE — Rapport partiel

**Date** : 2026-08-18
**Méthodologie** : audit multi-agents (workflow 12 dimensions en vagues parallèles) — 6 auditeurs spécialisés indépendants avec relevés factuels sur le code source (fichier + ligne + extrait). Chaque finding est vérifiable.
**Statut** : **PARTIEL** — 6/12 dimensions couvertes, workflow interrompu par la limite mensuelle de dépense atteinte. Les 6 dimensions manquantes sont listées en fin de rapport pour reprise ultérieure.

---

## 📊 Résumé exécutif

- **Score de santé moyen** : **53/100** — santé moyenne, la plateforme est fonctionnelle mais accumule une dette structurée qui va limiter la vélocité si non traitée.
- **66 findings** collectés sur 6 dimensions (moyenne : 11 findings/dimension).
- **6 critiques** — à traiter en priorité absolue (semaine).
- **19 élevés** — plan trimestriel obligatoire.

**Points saillants** :
1. La **couverture de tests (35/100)** est la dimension la plus fragile : chaînes fiscales, isolation cross-tenant et split bill invariants ne sont pas gardés par des tests automatisés — chaque refactor est un pari.
2. La **matrice RBAC (42/100)** souffre d'aliases obsolètes qui subsistent et de gardes uniquement côté UI sur plusieurs routes sensibles — vulnérabilité d'élévation de privilèges par manipulation client.
3. La **règle du barrel est massivement contournée (58 fichiers non-tests)** — couplage cross-pilier structurel qui compromet la modularité annoncée en 8 piliers.
4. Le socle **NF525** reste globalement solide (58/100) mais 2 critiques touchent l'immuabilité (méthodes update/delete présentes sur des collections scellées) → risque de non-conformité en audit fiscal.
5. La dimension **dette technique (74/100)** montre que le nettoyage récent (rapatriement, purge orphans) porte ses fruits — bonne base pour attaquer le reste.

---

## 🎯 Tableau de bord — 6 dimensions auditées

| Dimension | Score | 🔴 Crit | 🟠 High | 🟡 Med | 🔵 Low |
|:--|:--:|:--:|:--:|:--:|:--:|
| Architecture 8 piliers & Règle du Barrel | 58/100 | 0 | 3 | 4 | 2 |
| Sécurité multi-tenant, SovereignGuard & RGPD | 55/100 | 1 | 3 | 5 | 2 |
| RBAC & matrice des permissions | 42/100 | 1 | 3 | 4 | 4 |
| Conformité NF525 & fiscalité | 58/100 | 2 | 3 | 4 | 1 |
| Dette technique, god files & code mort | 74/100 | 0 | 2 | 4 | 4 |
| Couverture tests (Vitest + Playwright) | 35/100 | 2 | 5 | 5 | 1 |

---

## 🚨 Top actions prioritaires (critical + high triés par effort)

Les *quick wins* d'abord (effort XS/S puis M/L/XL) :

1. 🔴 **Provisioning MCC crée les propriétaires avec role='owner', absent du référentiel** — *effort S, dimension : RBAC & matrice des permissions*
   - **Où** : `src/lib/mcc/provisioning/steps/provisioningSteps.ts:87,96`
   - **Action** : Remplacer `role: 'owner'` par `role: 'admin'` (top-level tenant selon la mémoire projet) OU ajouter 'owner' à PermissionRole avec niveau 100 et le documenter comme alias d'admin. Ajouter un test end-to-end 'un tenant fraichement provisionné peut lire /pos, /finance, /settings'.

2. 🔴 **FiscalSealer chain test valide une chaîne SHA-256 mockée constante** — *effort S, dimension : Couverture tests (Vitest + Playwright)*
   - **Où** : `src/__tests__/infrastructure/FiscalSealer.test.ts:47-131`
   - **Action** : Ne PAS mocker CryptoService dans les tests de chaîne fiscale. Utiliser le vrai `CryptoService` (comme le fait déjà `src/__tests__/integration/nf525-fiscal-sealing.test.ts`) ou tester au minimum que hash1 ≠ hash2 pour deux données distinctes.

3. 🔴 **middleware /api/admin/* incompatible avec l'auth Firebase JWT — routes soit mortes, soit derrière un secret partagé** — *effort M, dimension : Sécurité multi-tenant, SovereignGuard & RGPD*
   - **Où** : `src/middleware.ts:25-34 ; src/lib/client/authedFetch.ts:13-29 ; src/lib/server/adminAuthGuard.ts:58-117`
   - **Action** : Remplacer le gate statique par une simple vérification 'a un Bearer' (délégation au adminAuthGuard qui vérifie déjà Firebase JWT + rôle + MFA + fingerprint), OU distinguer un canal server-to-server (ex : /api/admin/system/*) protégé par MCC_ADMIN_SECRET et un canal utilisateur (/api/admin/tenant/*, 

4. 🔴 **SovereignGuard ne bloque QUE le DELETE — SET/UPDATE sur seals et journalEntries est libre** — *effort M, dimension : Conformité NF525 & fiscalité*
   - **Où** : `src/lib/nexus/NexusInterceptor.ts:242-256 ; src/shared/nexus/guards/SovereignGuard.ts:38-47`
   - **Action** : Ajouter dans `intercept()` un contrôle `if (operation === 'WRITE' && this.guard.isFiscallySealed(path)) throw NF525_VIOLATION` avec un mode `merge/create-only` explicite pour la création initiale. Alternativement exposer un `canWrite(path, isNewDocument)` sur le guard qui autorise SET uniquement si 

5. 🔴 **Ticket client POS imprimé sans mentions NF525 (SIRET, hash, certification)** — *effort M, dimension : Conformité NF525 & fiscalité*
   - **Où** : `src/app/(client)/(ops)/pos/_hooks/usePrintReceipt.ts:30-66 ; src/modules/ops/service/printers/hardware/EscPosBuilder.ts:124-137`
   - **Action** : Câbler `usePrintReceipt` sur le résultat de `FinancialNexusBridge.processOrder()` : réutiliser le `receiptNumber` (séquentiel NF525) et le `fiscalSealHash` retournés. Charger `siret` depuis `tenantConfig.identity`. Retirer l'early-return dans `appendNf525Footer` — il DOIT toujours imprimer les menti

6. 🔴 **22 tests src/e2e/vanguard/ orphelins — aucun runner ne les exécute** — *effort M, dimension : Couverture tests (Vitest + Playwright)*
   - **Où** : `src/e2e/vanguard/ (22 fichiers), src/e2e/benchmarks/ (2 fichiers), src/e2e/simulator/`
   - **Action** : Décider : (a) intégrer ces suites via un projet Vitest dédié (`--project=vanguard`) ou (b) les rapatrier sous `src/__tests__/` avec la convention du reste du repo. Ne pas laisser 22 fichiers de tests fiscaux/chaos/offline se croire exécutés.

7. 🟠 **Bypass développeur `mcc-dev-bypass` accepté sans garde NODE_ENV=production** — *effort XS, dimension : Sécurité multi-tenant, SovereignGuard & RGPD*
   - **Où** : `src/lib/server/adminAuthGuard.ts:66-72 ; src/lib/mcc/devMode.ts:16-17`
   - **Action** : Ajouter `process.env.NODE_ENV !== 'production'` en préfixe de la garde, aligné avec le bypass tenant existant (line 194). Idéalement, refuser aussi le bypass si aucun `x-forwarded-for` de localhost/127.0.0.1. Ajouter un test qui vérifie que MCC_DEV_MODE=true + NODE_ENV=production ne permet PAS l'acc

8. 🟠 **MCC_DEV_MODE_SERVER=true = bypass total super_admin sans MFA ni garde NODE_ENV** — *effort XS, dimension : RBAC & matrice des permissions*
   - **Où** : `src/lib/mcc/devMode.ts:16 + src/lib/server/adminAuthGuard.ts:67-72`
   - **Action** : Verrouiller `MCC_DEV_MODE_SERVER = process.env.MCC_DEV_MODE === 'true' && process.env.NODE_ENV !== 'production'`. Ajouter un test qui set NODE_ENV=production et MCC_DEV_MODE=true et vérifie que le bypass est refusé. Idem pour dev-tenant-bypass (l:194-199) qui est déjà correctement gardé.

9. 🟠 **Doublon complet MarketOracle.ts (357 lignes, version shared morte)** — *effort XS, dimension : Dette technique, god files & code mort*
   - **Où** : `src/shared/providers/fleet/MarketOracle.ts vs src/modules/intelligence/ia/fleet/MarketOracle.ts`
   - **Action** : Supprimer src/shared/providers/fleet/MarketOracle.ts (et vérifier si tout le dossier shared/providers/fleet/ peut être retiré). Documenter dans .claude/sessions.md et re-runner sentrux.

10. 🟠 **Playwright webServer désactivé — les e2e dépendent d'un serveur lancé à la main** — *effort XS, dimension : Couverture tests (Vitest + Playwright)*
   - **Où** : `playwright.config.ts:26-35`
   - **Action** : Réactiver le bloc `webServer` avec `reuseExistingServer: !process.env.CI` (déjà écrit dans le commentaire). Sinon, documenter dans preflight.sh la commande dev à lancer en background.

11. 🟠 **/api/v1/menu accepte n'importe quel tenantId en query sans authentification** — *effort S, dimension : Sécurité multi-tenant, SovereignGuard & RGPD*
   - **Où** : `src/app/api/v1/menu/route.ts:7-30`
   - **Action** : Soit : (1) exiger requireTenantUser + valider que tenantId === caller.tenantId ; (2) si l'intention est un endpoint public 'showcase', ajouter un flag tenantConfig.publicMenuEnabled=true à vérifier + rate-limit par IP + ne renvoyer que le sous-ensemble marquéé 'showcaseVisible' des produits (pas la 

12. 🟠 **Rôles MCC (super_admin, mcc_junior_dev, mcc_support) absents du type PermissionRole** — *effort S, dimension : RBAC & matrice des permissions*
   - **Où** : `src/shared/nexus/contracts/permissions.types.ts:8 + src/lib/server/adminAuthGuard.ts:46 + src/shared/hooks/useTabAccess.ts:14`
   - **Action** : Fusionner `MccRole` et `PermissionRole` dans un unique `AppRole = PermissionRole | MccRole` avec PERMISSION_ROLE_LEVELS étendu (super_admin: 1000, mcc_support: 500, mcc_junior_dev: 200). Interdire par ESLint tout cast `as PermissionRole` sur une valeur non typée.

13. 🟠 **Collection wormArchives absente de IMMUTABLE_COLLECTIONS malgré le sceau légal 6 ans** — *effort S, dimension : Conformité NF525 & fiscalité*
   - **Où** : `src/shared/nexus/guards/SovereignGuard.ts:38-47 ; src/modules/finance/fiscalite/WormArchiveStorageService.ts:118-123,190-210`
   - **Action** : Ajouter 'wormArchives' à `IMMUTABLE_COLLECTIONS` et faire vérifier `enforceLegalImmutability` par NexusInterceptor sur toute WRITE. À défaut, wrapper les écritures via un service dédié qui refuse toute mise à jour post-scellement.

14. 🟠 **Double implémentation divergente de FiscalEngine — split brain sur verifyChain** — *effort S, dimension : Conformité NF525 & fiscalité*
   - **Où** : `src/modules/finance/fiscalite/FiscalAdapter.ts:70-83 ; src/modules/finance/services/FiscalEngine.ts:67-77`
   - **Action** : Supprimer l'un des deux modules (probablement `services/FiscalEngine.ts` qui n'est utilisé que par les tests d'intégration nf525-fiscal-sealing) et rediriger tous les imports vers `fiscalite/FiscalAdapter`. Garantit un seul comportement de vérification et évite les bugs de type de fallback.

15. 🟠 **5 composants finance _tabs orphelins (dette UI, ~33 KB)** — *effort S, dimension : Dette technique, god files & code mort*
   - **Où** : `src/modules/finance/components/_tabs/{AccountingTab,BankTab,TreasuryTab,BillingTab,AuditTab}.tsx`
   - **Action** : Confirmer avec `git log` la dernière utilisation, puis supprimer le dossier _tabs/. Si conservation temporaire souhaitée, déplacer sous src/_archive/ avec date.

---

## 📖 Détail par dimension

### Architecture 8 piliers & Règle du Barrel — 58/100

**Résumé** : La colonne vertébrale à 8 piliers est en place (chaque pilier a son index.ts, aucun résidu dans src/components ou src/domain), mais la Règle du Barrel est massivement contournée : 58 fichiers non-tests importent en chemin profond, dont ~20 à l'intérieur même de src/modules/ (imports cross-pilier profonds). Des dépendances bidirectionnelles existent entre presque toutes les paires de piliers, et plusieurs domaines non canoniques (menu-builder, catalog, franchise, forecasting, simulation, fleet, conventions) dévient de l'arborescence documentée.

**Points forts** :
- ✅ Les 8 piliers et le pilier system ont tous un index.ts (barrel) présent
- ✅ Aucun résidu dans src/components/, src/domain/, src/engines/ : le rapatriement historique est terminé
- ✅ La convention des canaux cross-module est clairement documentée dans CLAUDE.md et globalement respectée (imports barrel + NexusEventBus)
- ✅ src/store/pillars/*.ts documente explicitement le workaround eslint-disable avec la raison (TDZ SSR), traçabilité conservée
- ✅ Les shims deprecated (src/store/settingsAtoms.ts, dashboardAtoms.ts) portent explicitement le tag @deprecated, facilitant la suppression future

#### 🟠 HIGH (3)

##### 58 fichiers non-tests violent la Règle du Barrel (@/modules/<pilier>/<domaine>/...)
- **Description** : La règle exige d'importer uniquement depuis '@/modules/<pilier>'. rg trouve 172 imports profonds (dont 58 hors tests) répartis sur tous les piliers. Top: commerce/acquisition (50), ops/service (36), intelligence/ia (24), finance/comptabilite (19), finance/fiscalite (18).
- **Preuve** : ```$ rg -l "from ['\"]@/modules/[a-z]+/[a-z]+/" src/ | grep -vE '__tests__|\.test\.|\.spec\.' | wc -l -> 58
Extraits: src/lib/NexusTelemetryService.ts:1: import { fleetTelemetry } from '@/modules/intelligence/ia/fleet/FleetTelemetryService'; src/lib/MaintenanceAgent.ts: import { DNAInjector } from '@/modules/intelligence/ia/ai/DNAInjector';```
- **Emplacement** : `src/lib/NexusTelemetryService.ts, src/lib/MaintenanceAgent.ts, src/app/(client)/(ops)/**, src/shared/components/settings/**, src/store/pillars/*`
- **Recommandation** : Ré-exporter les symboles manquants depuis les barrels des piliers, puis migrer les 58 imports profonds. Ajouter un lint no-restricted-imports/pattern '@/modules/*/*/**' pour bloquer les nouvelles régressions.
- **Effort estimé** : L

##### Cross-pilier profonds à l'intérieur même de src/modules/ (le pilier saute le barrel du pilier voisin)
- **Description** : Des modules d'un pilier importent en chemin profond dans un autre pilier, ce qui court-circuite l'API publique du pilier importé. Exemples confirmés: human/domain/schemas/rbac -> @/modules/compliance/domain/schemas/rbac ; ops/workflow/engine/tables.types.ts -> @/modules/facility/spaces/types ; commerce/ui/pos/CashDrawerModal -> @/modules/ops/service/pos/... ; ops/service/pos/hooks/posOrderSubmit -> @/modules/finance/... ; finance/comptabilite/analytics/hooks/useAnalyticsPage -> @/modules/compliance/...
- **Preuve** : ```src/modules/human/domain/schemas/rbac.ts:3: } from '@/modules/compliance/domain/schemas/rbac';
src/modules/ops/workflow/engine/tables.types.ts:1: export type { TableStatus, TableShape, ZoneId, Floor, Zone, Table, Area } from '@/modules/facility/spaces/types';
src/modules/commerce/ui/pos/CashDrawerModal.tsx: import { cashDrawerService } from '@/modules/ops/service/pos/infrastructure/cash-drawer/CashDrawerService';```
- **Emplacement** : `src/modules/human/domain/schemas/rbac.ts:3, src/modules/ops/workflow/engine/tables.types.ts:1, src/modules/commerce/ui/pos/CashDrawerModal.tsx, src/modules/commerce/ui/pos/VoidModal.tsx, src/modules/commerce/ui/pos/cash-drawer/CashDrawerCloseSection.tsx, src/modules/ops/service/pos/hooks/posOrderSubmit.ts, src/modules/finance/comptabilite/analytics/hooks/useAnalyticsPage.ts`
- **Recommandation** : Exposer ces types/services via le barrel du pilier propriétaire (@/modules/facility, @/modules/compliance, @/modules/finance) ou déplacer les surfaces partagées vers un domaine 'contracts' explicitement partagé. Bloquer via ESLint le pattern '@/modules/<X>/**' depuis src/modules/<Y>/**.
- **Effort estimé** : L

##### Dépendances bidirectionnelles entre piliers (risque de cycles)
- **Description** : 10 paires de piliers présentent des dépendances mutuelles : commerce<->ops (19/2), finance<->ops (14/4), finance<->human, finance<->logistics, finance<->intelligence, compliance<->finance, compliance<->human, logistics<->ops, intelligence<->logistics, facility<->ops. Même passant par des barrels, la co-dépendance viole la topologie DAG attendue entre piliers et fragilise le build SSR (cf. commentaire TDZ dans store/pillars/ops.ts).
- **Preuve** : ```Script bash bidirectional check -> CYCLE: commerce<->ops (a->b:19, b->a:2), CYCLE: finance<->ops (a->b:14, b->a:4), CYCLE: finance<->human (a->b:1, b->a:2), CYCLE: compliance<->finance (a->b:2, b->a:4), CYCLE: logistics<->ops (a->b:7, b->a:3), CYCLE: facility<->ops (a->b:4, b->a:3), CYCLE: intelligence<->logistics (a->b:1, b->a:2)```
- **Emplacement** : `src/modules/{ops,commerce,finance,compliance,human,logistics,intelligence,facility}/**`
- **Recommandation** : Introduire un script de vérification (madge --circular src/modules) dans preflight.sh, cartographier les cycles réels, et déplacer les contrats communs dans un module 'shared/contracts' pour rompre les liens A<->B au profit de A->C<-B.
- **Effort estimé** : XL

#### 🟡 MEDIUM (4)

##### Domaines non canoniques présents dans plusieurs piliers (dérive vs CLAUDE.md)
- **Description** : CLAUDE.md liste 2-3 domaines par pilier. Or on trouve : ops/menu-builder/, commerce/catalog/, commerce/franchise/, intelligence/forecasting/, intelligence/simulation/, logistics/fleet/, human/conventions/ — non présents dans la table officielle. Soit CLAUDE.md est obsolète, soit ces dossiers sont mal placés (menu-builder relèverait de production/, franchise pourrait être un pilier commerce/relation, forecasting/simulation relèvent de intelligence/ia).
- **Preuve** : ```ls src/modules/ops -> ...menu-builder, production, service, workflow...
ls src/modules/commerce -> ...acquisition, catalog, fidelite, franchise, relation...
ls src/modules/intelligence -> ...analytique, forecasting, ia, knowledge, simulation...
ls src/modules/logistics -> ...approvisionnement, fleet, stock...
ls src/modules/human -> ...conventions, effectifs, remuneration...```
- **Emplacement** : `src/modules/ops/menu-builder/, src/modules/commerce/catalog/, src/modules/commerce/franchise/, src/modules/intelligence/forecasting/, src/modules/intelligence/simulation/, src/modules/logistics/fleet/, src/modules/human/conventions/`
- **Recommandation** : Décider explicitement : soit rattacher ces domaines aux 2-3 domaines canoniques et mettre à jour l'arborescence, soit amender CLAUDE.md pour refléter l'état réel (5 domaines pour commerce, 5 pour intelligence, etc.). Documenter la décision dans ARCHITECTURE.md.
- **Effort estimé** : M

##### Doublon d'implémentation : src/verticals/ vs src/shared/seeds/ + modules/
- **Description** : CLAUDE.md indique que les templates de variants vivent dans src/shared/seeds/. Or src/verticals/ contient 13 sous-dossiers (restaurant, hotel, clinic, garage, salon, retail, bakery, coworking, florist, gym, veterinary, custom, _shared) avec leur propre pipeline (adapters, presentation, ops, pms, finance) et de nombreux imports internes. Un seul consommateur externe hors src/verticals lui-même: src/app/(client)/(ops)/menu-engineering/page.tsx. C'est un chantier vertical-forge qui n'est pas branché sur les 8 piliers officiels — risque de code mort ou de double vérité.
- **Preuve** : ```ls src/verticals/ -> _shared bakery clinic coworking custom florist garage gym hotel restaurant retail salon veterinary
rg -l 'from "@/verticals' src/{lib,modules,app} -> src/app/(client)/(ops)/menu-engineering/page.tsx (seul consommateur hors verticals/)
src/verticals/hotel/ contient adapters/ domain/ finance/ ops/ pms/ presentation/ (structure parallèle à src/modules/)```
- **Emplacement** : `src/verticals/**, src/shared/seeds/`
- **Recommandation** : Clarifier le statut : (a) src/verticals/ est le nouveau standard remplaçant seeds/ -> mettre à jour CLAUDE.md ; (b) c'est un WIP vertical-forge à isoler (via _staging/) ; (c) c'est du legacy -> planifier suppression. Aujourd'hui l'ambiguïté génère deux surfaces d'API divergentes.
- **Effort estimé** : L

##### src/store/ contient encore des ré-exports profonds et des atomes non migrés
- **Description** : CLAUDE.md décrit Jotai 'par pilier' mais src/store/ garde des shims deprecated (settingsAtoms.ts, dashboardAtoms.ts) et surtout src/store/pillars/*.ts qui importent 15+ symboles depuis '@/modules/<pilier>/<domaine>/store/...' avec eslint-disable no-restricted-imports. Le commentaire justifie par un cycle 'store -> module -> hooks/components -> store' : le workaround révèle que le graph d'imports n'est pas nettoyé au niveau du pilier.
- **Preuve** : ```src/store/settingsAtoms.ts:1-5: @deprecated Importer depuis '@/modules/facility/spaces/settings/store/settingsAtoms'.
src/store/pillars/ops.ts:1: /* eslint-disable no-restricted-imports */
src/store/pillars/ops.ts:18: from '@/modules/ops/service/pos/store/orderAtoms';```
- **Emplacement** : `src/store/pillars/ops.ts:1, src/store/pillars/commerce.ts, src/store/pillars/compliance.ts, src/store/pillars/human.ts, src/store/pillars/logistics.ts, src/store/settingsAtoms.ts, src/store/dashboardAtoms.ts, src/store/assistantAtoms.ts`
- **Recommandation** : Extraire les atomes 'pures' vers un module neutre (déjà amorcé via src/store/base.ts). Sinon assumer que src/store/pillars/* est LA façade et interdire tout import direct des store/ des modules depuis les composants.
- **Effort estimé** : M

##### src/modules/system/ ne couvre pas la 'plomberie transversale' attendue
- **Description** : Le mandat définit system/ comme la plomberie transversale, mais son barrel n'exporte que 4 schémas Zod (tenant, license, modules, supportTicket). Toute la vraie plomberie (Nexus, adapters, providers, MCC, RBAC, event bus) vit ailleurs (src/lib/, src/shared/, src/kernel/ probable). Le pilier 'system' est donc quasi-vide et son rôle est mal défini par rapport à src/lib/ et src/shared/nexus/.
- **Preuve** : ```src/modules/system/index.ts (4 exports):
export * from './domain/schemas/tenant';
export * from './domain/schemas/license';
export * from './domain/schemas/modules';
export * from './domain/schemas/supportTicket';
ls src/modules/system/ -> domain/ index.ts (seul)```
- **Emplacement** : `src/modules/system/index.ts, src/modules/system/domain/schemas/`
- **Recommandation** : Soit renommer 'system' en 'platform-schemas' et retirer la mention 'plomberie transversale', soit rapatrier progressivement les briques transversales (auth adapters, tenant guard, event bus contracts) depuis src/lib et src/shared vers src/modules/system.
- **Effort estimé** : M

#### 🔵 LOW (2)

##### src/shared/ contient encore des composants et hooks métier qui appartiennent aux piliers
- **Description** : src/shared/components/settings/ (PrinterSettings, TablesSettings, PaymentTerminalSettings, TipsDistributionSettingsSection, CashDrawerSettings, payment-terminal/*) et src/shared/hooks/useUniversalAssistant.ts font des imports profonds vers ops/human/facility/intelligence. Ce sont des composants UI de pilier hébergés dans shared/ — soit à rapatrier vers modules/facility/spaces/settings/, modules/ops/service/, modules/human/remuneration/, soit à explicitement statuer comme couche 'settings partagée'.
- **Preuve** : ```src/shared/components/settings/PrinterSettings.tsx:9: import { BRAND_LABELS, ROLE_LABELS, CONNECTION_LABELS } from '@/modules/ops/service/printers/...';
src/shared/components/settings/TablesSettings.tsx:12: import { TablesToolbar, FloorArchitecture, ZoneService, MobilierConfig } from '@/modules/facility/...';
src/shared/components/settings/TipsDistributionSettingsSection.tsx:11: from '@/modules/human/remuneration/services/TipsDistributionEngine';
src/shared/hooks/useUniversalAssistant.ts:7: from '@/modules/intelligence/services/AssistantAction...';```
- **Emplacement** : `src/shared/components/settings/, src/shared/hooks/useUniversalAssistant.ts, src/shared/nexus/state/SovereignGenome.ts`
- **Recommandation** : Auditer chaque fichier de src/shared/components/settings/ : rapatrier dans le pilier propriétaire ou re-catégoriser comme composant réellement transversal (ex: settings shell). Cible : shared/ ne contient plus que la plomberie UI (design-system, kernel/) selon le rapatriement déjà entamé.
- **Effort estimé** : M

##### Canal cross-module #3 (NexusEventBus) massivement utilisé : à surveiller
- **Description** : 381 fichiers référencent NexusEventBus, dont beaucoup dans src/modules/. C'est conforme aux 3 canaux légitimes, mais l'ampleur montre un couplage évènementiel dense. Sans registre typé et sans documentation du contrat d'événement par pilier, ce canal peut devenir un fourre-tout qui masque de nouvelles dépendances implicites entre piliers.
- **Preuve** : ```$ rg -l 'NexusEventBus' src | wc -l -> 381```
- **Emplacement** : `src/modules/**, src/lib/**`
- **Recommandation** : Publier un registre typé des événements par pilier (schéma Zod des payloads) et un test d'intégration qui échoue si un pilier écoute un événement d'un autre pilier non déclaré comme public. À rattacher à Plan Op Bus Événementiel (URL stable 42bc755c-...).
- **Effort estimé** : M

---

### Sécurité multi-tenant, SovereignGuard & RGPD — 55/100

**Résumé** : L'architecture SovereignGuard/NexusInterceptor est sérieusement pensée (wrapping automatique, guard-first listener, batch avec pending guards, path scoping) mais souffre de plusieurs échappatoires exploitables : middleware /api/admin incompatible avec le vrai flow d'auth (Bearer statique vs Firebase JWT), bypass MCC_DEV_MODE serveur sans garde NODE_ENV=production, absence de signature HMAC côté client (rendant NF525_WRITE_V1 optionnel), route /api/v1/menu totalement non authentifiée, absence de bannière de consentement cookies pourtant référencée par la page RGPD. Risque global : contournement possible du contrôle tenant sur le canal API v1 public et attaques par surface admin élargie si MCC_DEV_MODE fuit.

**Points forts** :
- ✅ SovereignGuard automatiquement injecté par le setter Nexus.adapter (NexusAdapter.ts:29) — impossible d'enregistrer un adapter client sans interceptor
- ✅ Guard-First Listener Pattern dans onSnapshot (NexusInterceptor.ts:52-89) : la souscription au flux n'est déclenchée qu'APRÈS validation asynchrone, éliminant le TOCTOU sur les listeners
- ✅ Batch écritures : pendingGuards + pendingWrites attendus AVANT rawBatch.commit (NexusInterceptor.ts:100-141) — cohérent avec le fix documenté du precedent flottant
- ✅ Purge RGPD complète et signée (api/admin/fleet/rgpd-purge/route.ts) avec certificat SHA-256, préservation explicite journalEntries/fiscalSeals/fiscalLedger conforme NF525
- ✅ Anonymisation asynchrone via PrivacyConsentHandler (deleteRequested → PII écrasées, ID conservé pour la traçabilité NF525)

#### 🔴 CRITICAL (1)

##### middleware /api/admin/* incompatible avec l'auth Firebase JWT — routes soit mortes, soit derrière un secret partagé
- **Description** : checkAdminApiGate exige Authorization === `Bearer ${MCC_ADMIN_SECRET}` pour TOUTES les routes /api/admin/*. Or authedFetch.ts:27 envoie systématiquement `Bearer <FirebaseJWT>` (jeton dynamique). Les deux valeurs ne peuvent pas être égales simultanément. Conséquence : si MCC_ADMIN_SECRET n'est pas défini en prod → 100% des /api/admin renvoient 404 (adminAuthGuard/requireMccLevel jamais atteints, panneau MCC totalement inutilisable). Si MCC_ADMIN_SECRET est défini → il faudrait qu'il soit exposé au client pour appeler les routes, ce qui détruit le modèle d'auth individuelle avec MFA et Trusted Device Registry documenté juste après. Le test middleware.test.ts:60-68 confirme le comportement.
- **Preuve** : ```src/middleware.ts:31-32 — `const secret = process.env.MCC_ADMIN_SECRET; if (!secret || !auth || auth !== \`Bearer ${secret}\`) return new NextResponse(null, { status: 404 });` ↔ src/lib/client/authedFetch.ts:27 — `headers.set('Authorization', \`Bearer ${token}\`)` (token = user.getIdToken())```
- **Emplacement** : `src/middleware.ts:25-34 ; src/lib/client/authedFetch.ts:13-29 ; src/lib/server/adminAuthGuard.ts:58-117`
- **Recommandation** : Remplacer le gate statique par une simple vérification 'a un Bearer' (délégation au adminAuthGuard qui vérifie déjà Firebase JWT + rôle + MFA + fingerprint), OU distinguer un canal server-to-server (ex : /api/admin/system/*) protégé par MCC_ADMIN_SECRET et un canal utilisateur (/api/admin/tenant/*, /api/admin/fleet/*) protégé par JWT. Ajouter un test d'intégration bout-en-bout qui appelle une route MCC avec un vrai JWT.
- **Effort estimé** : M

#### 🟠 HIGH (3)

##### Bypass développeur `mcc-dev-bypass` accepté sans garde NODE_ENV=production
- **Description** : requireMccLevel accepte inconditionnellement le token `Bearer mcc-dev-bypass` dès que MCC_DEV_MODE_SERVER=true, quel que soit NODE_ENV. Il retourne alors uid='dev_admin' et role='super_admin' sans MFA, sans Trusted Device Registry. Comparer avec verifyCaller line 194 qui EST correctement gardé par `process.env.NODE_ENV !== 'production'`. Si la variable MCC_DEV_MODE=true est accidentellement positionnée dans un environnement partagé (staging cloné en prod, secret Vercel dupliqué), toute personne connaissant la chaîne `mcc-dev-bypass` obtient super_admin sur toute la flotte. Le simple log warning n'est pas une barrière.
- **Preuve** : ```src/lib/server/adminAuthGuard.ts:66-72 — `if (MCC_DEV_MODE_SERVER && authHeader === 'Bearer mcc-dev-bypass') { logger.warn(...); return { uid: 'dev_admin', role: 'super_admin' }; }` (aucun check NODE_ENV) ; src/lib/mcc/devMode.ts:16-17 — `MCC_DEV_MODE_SERVER = process.env.MCC_DEV_MODE === 'true'````
- **Emplacement** : `src/lib/server/adminAuthGuard.ts:66-72 ; src/lib/mcc/devMode.ts:16-17`
- **Recommandation** : Ajouter `process.env.NODE_ENV !== 'production'` en préfixe de la garde, aligné avec le bypass tenant existant (line 194). Idéalement, refuser aussi le bypass si aucun `x-forwarded-for` de localhost/127.0.0.1. Ajouter un test qui vérifie que MCC_DEV_MODE=true + NODE_ENV=production ne permet PAS l'accès.
- **Effort estimé** : XS

##### SovereignGuard.protectWrite renvoie des écritures NON signées quand exécuté côté navigateur
- **Description** : protectWrite déclare qu'il ne peut pas produire de signature HMAC côté client car NEXUS_TENANT_SECRET n'existe pas dans le browser, et retourne alors les données non signées (`return data`). Résultat : le champ `__nf525` (SovereignWriteSignature) n'est présent QUE pour les écritures serveur ; toutes les écritures POS depuis le navigateur (createOrder, POS, KDS, etc.) passent sans signature. Les collections listées dans SIGNED_WRITE_COLLECTIONS (orders, journalEntries, fiscalSeals, etc.) contiennent donc un mix de documents signés/non signés, rendant `verifyWriteSignature` inutile en pratique. Le commentaire dit s'appuyer sur le FiscalSealer serveur pour NF525, mais cela présuppose un chemin serveur systématique — or les orders sont clairement écrits depuis le client (usePos, order-workflow).
- **Preuve** : ```src/shared/nexus/guards/SovereignGuard.ts:232-241 — `const isServer = typeof process !== 'undefined' && !!process.versions?.node; if (!isServer) { return data; }` — commentaire explicite : « POS inutilisable » sans ce bypass```
- **Emplacement** : `src/shared/nexus/guards/SovereignGuard.ts:207-257`
- **Recommandation** : Deux voies acceptables : (a) exiger que toute écriture SIGNED_WRITE_COLLECTIONS passe par un endpoint serveur (POST /api/pos/order → serveur scelle → écrit) et bloquer côté client — cohérent avec NF525 ; (b) implémenter un canal d'obtention de signature courte-durée (ephemeral HMAC ticket délivré par le serveur pour cette écriture précise). Documenter clairement que verifyWriteSignature n'est PAS une barrière tant que (a) ou (b) n'est pas en place.
- **Effort estimé** : L

##### /api/v1/menu accepte n'importe quel tenantId en query sans authentification
- **Description** : Route publique qui prend `?tenantId=` en query et renvoie la totalité du catalogue produits du tenant demandé, sans requireTenantUser/requireTenantAdmin, sans rate-limit, sans vérification que ce tenant a bien exposé son menu publiquement. Contrastant avec /api/v1/orders qui, elle, appelle requireTenantUser. Un attaquant peut énumérer les slugs (déjà exposés via subdomain routing) et extraire tous les catalogues (prix, marges, stocks si joints) de toute la flotte.
- **Preuve** : ```src/app/api/v1/menu/route.ts:7-16 — `export async function GET(req: NextRequest) { const { searchParams } = new URL(req.url); const tenantId = searchParams.get('tenantId'); if (!tenantId) ...; const productsMap = await Nexus.adapter.get(\`tenants/${tenantId}/products\`);````
- **Emplacement** : `src/app/api/v1/menu/route.ts:7-30`
- **Recommandation** : Soit : (1) exiger requireTenantUser + valider que tenantId === caller.tenantId ; (2) si l'intention est un endpoint public 'showcase', ajouter un flag tenantConfig.publicMenuEnabled=true à vérifier + rate-limit par IP + ne renvoyer que le sous-ensemble marquéé 'showcaseVisible' des produits (pas la totalité incluant prix internes/coût de revient). Ajouter un test négatif.
- **Effort estimé** : S

#### 🟡 MEDIUM (5)

##### NexusAdapter.getTenantPath lit `?tenant=` de l'URL comme source de vérité tenant côté client
- **Description** : Résolution du tenantId dans getTenantPath : override explicite > _tenantOverride > URLSearchParams > SovereignStorage. Le paramètre URL est trivialement modifiable par l'utilisateur (ou par une injection dans un lien externe qu'il clique). Certes SovereignGuard.validateAccess est censé rattraper les mismatchs, mais seulement si l'anchor tenant (ctx.vassalId) est correctement positionné — ce qui n'est PAS garanti quand getTenantPath est appelé pour construire un path AVANT de connaître le tenantOverride. Attaquer : injecter `?tenant=victim` dans un lien envoyé à un opérateur du tenant `main`, qui charge la page et déclenche un onSnapshot vers `tenants/victim/...` avec vassalId='main' — SovereignGuard doit rejeter, mais la surface d'attaque et le nombre de fail-safes déclenchés (avec logout global) devient un DoS.
- **Preuve** : ```src/lib/nexus/NexusAdapter.ts:109-113 — `const tenantId = tenantIdOverride || this._tenantOverride || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tenant') : null) || SovereignStorage.get(...).data;````
- **Emplacement** : `src/lib/nexus/NexusAdapter.ts:108-122`
- **Recommandation** : Retirer la lecture URLSearchParams de la résolution automatique. Le tenant doit être résolu une seule fois au bootstrap (via subdomain host, JWT claims, ou action utilisateur explicite d'impersonation avec whitelist) et exposé via _tenantOverride. Si un `?tenant=` doit être supporté pour des redirects de landing, l'exiger explicitement via une fonction dédiée `Nexus.setTenantFromUrlParam(x)` avec validation.
- **Effort estimé** : S

##### SovereignGuard.canDelete utilise path.includes(collection) — sur-blocage silencieux
- **Description** : Boucle sur IMMUTABLE_COLLECTIONS avec `path.includes(col) || collection === col`. `path.includes('config')` (WHITELIST) et `path.includes('ledger/')` (canDelete) sont deux exemples de matching substring déjà signalés comme problématiques dans le commentaire ligne 272 (fuite `tenants/victime/systemConfig/x`). Le pattern subsiste dans canDelete/isFiscallySealed : `path.includes('fiscal/')` déclencherait aussi sur une collection légitime nommée `fiscalOnboarding` ou un doc-id `fiscal_notes`. Le risque n'est pas une exfiltration mais un blocage silencieux d'opérations légitimes classées 'DELETE' → dette de debug et confusion opérateur.
- **Preuve** : ```src/shared/nexus/guards/SovereignGuard.ts:57-70 — `Array.from(this.IMMUTABLE_COLLECTIONS).some((col) => path.includes(col) || collection === col)` + `path.includes('ledger/') || path.includes('config/master') || path.includes('fiscal/')````
- **Emplacement** : `src/shared/nexus/guards/SovereignGuard.ts:53-73, 78-81`
- **Recommandation** : Aligner sur la logique WHITELIST (segments) : `path.split('/').some(seg => IMMUTABLE_COLLECTIONS.has(seg))` et retirer les substring matches. Ajouter un test qui vérifie qu'une collection nommée `fiscalNotes` ou `ledgerAnnotations` reste supprimable si non listée explicitement.
- **Effort estimé** : XS

##### Aucune bannière/mécanisme de consentement cookies déployé alors que la page RGPD référence `cookie-consent`
- **Description** : Recherche exhaustive : aucun composant CookieBanner / ConsentBanner / cookie-consent modal dans src/. La page /legal/rgpd:359 mentionne le cookie `cookie-consent` (durée 6 mois) comme s'il était utilisé pour stocker le choix, mais aucun code ne l'écrit ni ne le lit. Si l'application dépose des cookies non-essentiels (analytics, marketing, session cross-tenant), la conformité GDPR/ePrivacy est en défaut : le consentement doit être recueilli AVANT dépôt, avec possibilité de refus aussi visible que d'accepter (CNIL 2020).
- **Preuve** : ```src/app/(public)/legal/rgpd/page.tsx:359 — `<td>cookie-consent</td>` + description « Stockage du choix de consentement » sans implémentation ; `grep -rn 'CookieBanner|ConsentBanner|showConsent' src` → 0 résultat```
- **Emplacement** : `src/app/(public)/legal/rgpd/page.tsx:359 (documentation) ; src/ (absence de composant)`
- **Recommandation** : Implémenter un composant `<CookieConsentBanner>` monté dans le layout public (avant NexusOpsProvider), qui : (1) bloque tout script tiers tant que consentement non donné ; (2) écrit le cookie `cookie-consent` avec valeurs 'accepted' | 'rejected' + timestamp ; (3) offre bouton Refuser en même niveau visuel qu'Accepter ; (4) rejoue le consent choice dans PrivacyConsentHandler pour audit.
- **Effort estimé** : M

##### Clés API tenant émises en JWT SANS expiration (jwt.sign sans expiresIn)
- **Description** : generateApiKey appelle `jwt.sign({ tenantId }, secret)` sans option `expiresIn`, ni `iat`, ni `jti`. Les clés sont donc valides éternellement tant que le secret INTERNAL_API_SECRET n'est pas rotaté. La révocation via `revokedAt` en Firestore fonctionne, mais si le hash Firestore est perdu (backup restauré, tenant supprimé puis re-créé sur même slug, migration), les clés continueraient à valider la signature JWT. De plus, l'absence de `jti` empêche toute liste de révocation centrale et empêche de détecter deux usages simultanés depuis IPs différentes.
- **Preuve** : ```src/app/api/tenant/api-keys/route.ts:21-26 — `function generateApiKey(tenantId: string): string { const secret = process.env.INTERNAL_API_SECRET; ...; const token = jwt.sign({ tenantId }, secret); return \`ros_${token}\`; }````
- **Emplacement** : `src/app/api/tenant/api-keys/route.ts:21-26`
- **Recommandation** : Ajouter `{ expiresIn: '365d', jwtid: crypto.randomUUID() }` à jwt.sign. Persister le jti dans StoredApiKey. Documenter la durée de vie dans l'UI de création + email d'alerte 30 jours avant expiration. Envisager de retirer complètement le JWT (il n'apporte rien puisque le hash sert d'auth) et n'utiliser que le hash Firestore.
- **Effort estimé** : S

##### SovereignGuard.validateAccess bypass silencieusement en NODE_ENV=test
- **Description** : En test (`NODE_ENV === 'test'` sans `STRICT_ISOLATION_TEST`), validateAccess retourne SILENCIEUSEMENT sans lever d'erreur ni logger, même en cas de mismatch tenant. Le risque : si NODE_ENV=test se retrouve accidentellement dans un pipeline CI/CD qui déploie en preview production, ou dans un container mal configuré, toute isolation cross-tenant tombe silencieusement. Le kill-switch documenté (fail-safe logout, MessageChannel) est court-circuité. Contrairement à STRICT_ISOLATION_TEST qui doit être opt-in par test, la posture par défaut devrait être fail-closed.
- **Preuve** : ```src/shared/nexus/guards/SovereignGuard.ts:288-290 — `if (process.env.NODE_ENV === 'test' && !process.env.STRICT_ISOLATION_TEST) { return; }` — retour sans log, sans emit ACCESS_DENIED```
- **Emplacement** : `src/shared/nexus/guards/SovereignGuard.ts:287-292`
- **Recommandation** : Inverser la logique : les tests devraient OPT-IN dans un mode `RELAX_ISOLATION_TEST` explicite, avec assertion que ce mode n'est jamais actif hors CI. Ajouter un log warn même dans le mode relâché. Bloquer via un guard runtime : `if (process.env.NODE_ENV === 'test' && process.env.CI !== 'true') throw new Error(...)` pour rendre impossible NODE_ENV=test hors CI.
- **Effort estimé** : S

#### 🔵 LOW (2)

##### resolveTenantFromHost ne valide pas l'existence du tenant — surface d'énumération
- **Description** : Toute requête vers `<n'importe-quoi>.restaurant-os.app` (sauf 6 subdomains RESERVED) est acceptée comme tenant valide et son slug est injecté dans le header `x-resolved-tenant-id`, puis consommé par requireTenantAdmin/requireTenantUser en fallback si les claims du JWT n'ont pas de tenantId. Un attaquant peut : (a) énumérer les slugs actifs (les inactifs renverront 404 côté page mais 200 côté API) ; (b) forger un JWT sans tenantId + subdomain victim pour tenter des reqs.
- **Preuve** : ```src/lib/server/tenantFromHost.ts:11-17 — Aucune vérification `tenants/${sub}` existe ; src/lib/server/adminAuthGuard.ts:290-293 — `const hostTenant = request.headers.get('x-resolved-tenant-id') ?? undefined; const tenantId = ... (caller.tenantId ?? hostTenant);` fallback sur host```
- **Emplacement** : `src/lib/server/tenantFromHost.ts:11-17 ; src/lib/server/adminAuthGuard.ts:282-323`
- **Recommandation** : Cache LRU des slugs valides interrogé par le middleware (TTL 60s). Pour les routes non-fleet, préférer strictement caller.tenantId du JWT et n'utiliser hostTenant que si claim absent ET header signé cryptographiquement par le middleware. Retirer le fallback sur x-resolved-tenant-id pour requireTenantAdmin — un admin doit avoir un tenant dans son claim.
- **Effort estimé** : M

##### SIGNED_WRITE_COLLECTIONS incomplet — collections RBAC/tenants/users non signées
- **Description** : La liste SIGNED_WRITE_COLLECTIONS couvre les entités fiscales (orders, journalEntries, fiscalSeals, wasteLogs...) mais omet les collections à impact RBAC/multi-tenant : `users`, `tenantConfig` (pourtant IMMUTABLE), `roles`, `permissions`, `apiKeys`, `paymentMethods` (celui-là présent, `sessions`, `webhooks`, `connectors`. Ces collections dictent qui peut faire quoi ; les modifier sans signature vérifiable ouvre la porte à des attaques de type replay / man-in-the-middle sur le canal d'écriture.
- **Preuve** : ```src/shared/nexus/guards/SovereignGuard.ts:20-36 — liste `SIGNED_WRITE_COLLECTIONS` ne contient PAS users/tenantConfig/roles/permissions/apiKeys/sessions/webhooks/connectors```
- **Emplacement** : `src/shared/nexus/guards/SovereignGuard.ts:20-36`
- **Recommandation** : Étendre la liste aux collections RBAC-sensibles, ou définir une deuxième catégorie `RBAC_SIGNED_COLLECTIONS` avec signature obligatoire côté serveur uniquement (write server-only via API dédiée + refus pur côté client). Documenter les critères qui poussent une collection dans SIGNED_WRITE.
- **Effort estimé** : S

#### ⚪ INFO (1)

##### Deux bypass dev nommés différemment avec sémantiques divergentes
- **Description** : Cohabitation de `dev-tenant-bypass` (verifyCaller ligne 195, gardé NODE_ENV !== 'production') et `mcc-dev-bypass` (requireMccLevel ligne 68, gardé seulement par MCC_DEV_MODE_SERVER). Naming inconsistant + garde asymmetric — source de confusion pour un opérateur qui tenterait d'auditer les bypass. Recommandation cosmétique : uniformiser en `<scope>-dev-bypass` avec la même politique de garde.
- **Preuve** : ```src/lib/server/adminAuthGuard.ts:66-72 vs 194-200 — deux flags nommés différemment, gardes différentes```
- **Emplacement** : `src/lib/server/adminAuthGuard.ts:66-72, 194-200`
- **Recommandation** : Créer un module `devBypass.ts` avec fonction `isDevBypassAllowed(request, scope)` unique, forçant NODE_ENV !== 'production' + flag env explicite + origine localhost. Migrer les deux call sites vers cette API.
- **Effort estimé** : S

---

### RBAC & matrice des permissions — 42/100

**Résumé** : La matrice RBAC est fragmentée sur au moins 4 sources non synchronisées (PermissionRole enum, MccRole, ROLE_LABELS/AccessPolicyManager, resolveRoleLevel) avec des rôles legacy anglais et des rôles MCC hors typage. Le pire défaut : le provisioning MCC crée les propriétaires de tenant avec `role: 'owner'`, un rôle absent de tout le référentiel — ces utilisateurs ont donc `accessLevel = 0` et échouent toutes les gardes serveur/UI sauf les bypass 'admin'/'super_admin' hardcodés. La couche Nexus n'applique aucun contrôle RBAC (SovereignGuard n'enforce que l'isolation tenant), les gardes sont exclusivement UI + adminAuthGuard côté serveur.

**Points forts** :
- ✅ Aliases 'fleet_admin' effectivement purgés (0 occurrence dans src)
- ✅ Hiérarchie MCC à 3 niveaux (mcc_junior_dev < mcc_support < super_admin) claire et enforced avec MFA obligatoire pour super_admin (adminAuthGuard.ts:90-94)
- ✅ SovereignGuard garantit l'isolation tenant au niveau adapter (path tenantId vs ancré) — barrière cross-tenant en place
- ✅ Configuration RBAC personnalisable par tenant via overrides (rbac.ts:6-33) — permet aux clients d'adapter la matrice
- ✅ requireTenantRole (adminAuthGuard.ts:330-354) fournit un contrôle par niveau (pas juste par string) — bon primitif quand utilisé

#### 🔴 CRITICAL (1)

##### Provisioning MCC crée les propriétaires avec role='owner', absent du référentiel
- **Description** : src/lib/mcc/provisioning/steps/provisioningSteps.ts fixe le rôle du propriétaire à 'owner' (custom claims Firebase + document Nexus). Or 'owner' n'existe ni dans PermissionRole (permissions.types.ts:8-30), ni dans PERMISSION_ROLE_LEVELS (l:57-80). Conséquence : PERMISSION_ROLE_LEVELS['owner'] ?? 0 vaut 0 dans requireTenantRole (adminAuthGuard.ts:341) → le propriétaire est refusé sur toutes les routes /api/... requireTenantRole(_, 'manager'). Côté client, usePageAccess ne bypass que role==='admin'||'super_admin' (usePageAccess.ts:12) → owner tombe sur DEFAULT_PAGE_ACCESS où il n'est listé nulle part → aucune page accessible.
- **Preuve** : ```src/lib/mcc/provisioning/steps/provisioningSteps.ts:87 `await authProvider.setCustomClaims(userUid, { tenantId, role: 'owner', permissions: ['*'] });` + l:96 `role: 'owner'` dans users/{uid}. À comparer avec /api/signup/route.ts:119 `role: 'admin'` (cohérent).```
- **Emplacement** : `src/lib/mcc/provisioning/steps/provisioningSteps.ts:87,96`
- **Recommandation** : Remplacer `role: 'owner'` par `role: 'admin'` (top-level tenant selon la mémoire projet) OU ajouter 'owner' à PermissionRole avec niveau 100 et le documenter comme alias d'admin. Ajouter un test end-to-end 'un tenant fraichement provisionné peut lire /pos, /finance, /settings'.
- **Effort estimé** : S

#### 🟠 HIGH (3)

##### MCC_DEV_MODE_SERVER=true = bypass total super_admin sans MFA ni garde NODE_ENV
- **Description** : adminAuthGuard.ts:66-72 accepte `Authorization: Bearer mcc-dev-bypass` et retourne `{ uid: 'dev_admin', role: 'super_admin' }` dès que MCC_DEV_MODE=true en env. Aucune vérification `NODE_ENV !== 'production'` — devMode.ts:16-17 ne teste que la variable d'env. Une fuite/mauvaise config de la var en prod = accès MCC complet avec un simple header, sans passer par MFA (checkFleetAdminMFA est court-circuité par le return anticipé).
- **Preuve** : ```src/lib/mcc/devMode.ts:16 `export const MCC_DEV_MODE_SERVER = process.env.MCC_DEV_MODE === 'true';` — pas de `&& process.env.NODE_ENV !== 'production'`. adminAuthGuard.ts:67 `if (MCC_DEV_MODE_SERVER && authHeader === 'Bearer mcc-dev-bypass') { ...; return { uid: 'dev_admin', role: 'super_admin' }; }````
- **Emplacement** : `src/lib/mcc/devMode.ts:16 + src/lib/server/adminAuthGuard.ts:67-72`
- **Recommandation** : Verrouiller `MCC_DEV_MODE_SERVER = process.env.MCC_DEV_MODE === 'true' && process.env.NODE_ENV !== 'production'`. Ajouter un test qui set NODE_ENV=production et MCC_DEV_MODE=true et vérifie que le bypass est refusé. Idem pour dev-tenant-bypass (l:194-199) qui est déjà correctement gardé.
- **Effort estimé** : XS

##### Aucun contrôle RBAC au niveau Nexus adapter — RBAC purement UI pour les lectures tenant
- **Description** : SovereignGuard.validateAccess (SovereignGuard.ts:263-298) n'applique QUE l'isolation tenant (path tenantId vs tenant ancré). Aucune vérification du rôle du caller pour l'accès aux collections sensibles (fiscalSeals, journalEntries, payroll, users). Un utilisateur `serveur` (level 40) connecté peut, depuis la console navigateur, faire `Nexus.adapter.get('tenants/<son_tenant>/fiscalLedger/...')` ou lister payroll et récupérer les données sensibles. Les gardes usePageAccess/useTabAccess/RoleGate cachent l'UI, mais ne bloquent pas le canal Nexus.
- **Preuve** : ```src/shared/nexus/guards/SovereignGuard.ts:263-298 : validateAccess ne consulte jamais le rôle du currentUser. `NexusInterceptor` (voir SovereignGuard.test.ts:15-52) teste `canDelete` sur les collections immuables mais aucune règle par rôle.```
- **Emplacement** : `src/shared/nexus/guards/SovereignGuard.ts:263-298`
- **Recommandation** : Ajouter au NexusInterceptor un mapping COLLECTION → PermissionRole[] minimum (au moins pour fiscalLedger, journalEntries, users, payroll, timeclock). Rejeter la lecture si `currentUser.accessLevel < requiredLevel`. Alternative : imposer que ces collections ne soient lues que via API server (requireTenantRole) et non via Nexus adapter client.
- **Effort estimé** : M

##### Rôles MCC (super_admin, mcc_junior_dev, mcc_support) absents du type PermissionRole
- **Description** : permissions.types.ts:8-30 déclare `type PermissionRole` sans les 3 rôles MCC. Mais useTabAccess.ts:14 cast `currentUser.role as PermissionRole` et PERMISSION_ROLE_LEVELS[role] est consulté sur des rôles MCC → renvoie undefined → level 0. Pour super_admin, la garde explicite `role === 'admin' || role === 'super_admin'` fonctionne, mais pour mcc_support/mcc_junior_dev connectés sur une UI tenant, ils tombent à 0 et sont bloqués partout. Aucune source unique des rôles ne les déclare tous.
- **Preuve** : ```src/shared/nexus/contracts/permissions.types.ts:8-30 (aucun super_admin/mcc_*) + adminAuthGuard.ts:46 déclare `type MccRole = 'mcc_junior_dev' | 'mcc_support' | 'super_admin'` isolément. useTabAccess.ts:14 `const role = currentUser.role as PermissionRole;` — cast unsafe.```
- **Emplacement** : `src/shared/nexus/contracts/permissions.types.ts:8 + src/lib/server/adminAuthGuard.ts:46 + src/shared/hooks/useTabAccess.ts:14`
- **Recommandation** : Fusionner `MccRole` et `PermissionRole` dans un unique `AppRole = PermissionRole | MccRole` avec PERMISSION_ROLE_LEVELS étendu (super_admin: 1000, mcc_support: 500, mcc_junior_dev: 200). Interdire par ESLint tout cast `as PermissionRole` sur une valeur non typée.
- **Effort estimé** : S

#### 🟡 MEDIUM (4)

##### Rôles legacy anglais (server, staff, commis, kitchen, bartender…) traînent hors typage
- **Description** : AccessPolicyManager.ts:105-119 (ROLE_LABELS) référence 'server', 'kitchen', 'kds-view', 'pos-standard', 'guest-view', 'floor_manager', 'kitchen_chef', 'kitchen_line', 'bartender', 'host', 'cashier' — aucun n'est dans PermissionRole (qui est 100% français : serveur, cuisinier, barman, hotesse, plongeur). Zeus.ts:11 impose `z.enum(['admin', 'manager', 'staff', 'commis'])` (staff/commis inconnus ailleurs). MigrationService.ts:42 fallback `emp.role || 'server'` (crée des rôles invalides). analyticsAtoms.ts:88 filtre `role === 'server'` (jamais matchera un tenant récent). Diverses handlers utilisent `roles: ['directeur', 'admin']` sans schéma.
- **Preuve** : ```src/lib/AccessPolicyManager.ts:105-119 + src/modules/intelligence/domain/agency/Zeus.ts:11 + src/lib/MigrationService.ts:42 + src/store/pillars/analyticsAtoms.ts:88```
- **Emplacement** : `src/lib/AccessPolicyManager.ts:105-119, src/modules/intelligence/domain/agency/Zeus.ts:11, src/lib/MigrationService.ts:42`
- **Recommandation** : Extraire toutes les valeurs de rôle dans src/shared/nexus/contracts/permissions.types.ts (source unique). Supprimer les strings legacy 'server'/'staff'/'commis'/'kitchen'/'bartender'/'host'/'cashier'/'kds-view'/'floor_manager' des labels et des schémas Zod, ou les mapper explicitement vers la nouvelle taxonomie (serveur, cuisinier, barman, hotesse). Ajouter un test `for (const r of PermissionRoleValues) expect(ROLE_LABELS[r]).toBeDefined()`.
- **Effort estimé** : M

##### Trois sources de vérité disjointes pour le gating des écrans
- **Description** : Le gating d'une même route se calcule dans 3 endroits sans lien : (1) navConfig.ts porte `requiredCapability` (mod_pos, mod_kds…) — capabilité tenant, pas rôle. (2) DEFAULT_PAGE_ACCESS (rbac.ts:37-67) porte `pageKey → PermissionRole[]`. (3) RoleGate.tsx:12-44 (PATH_TO_CATEGORY) porte `pathname → CategoryKey`. Ces trois maps ne référencent pas les mêmes clés (`pos`, `POS`, `operations`, `mod_pos`) et peuvent diverger silencieusement — un écran peut être visible dans nav (capability OK) mais bloqué au RoleGate, ou l'inverse.
- **Preuve** : ```src/config/navConfig.ts:129 `{ key: 'pos', ..., requiredCapability: 'mod_pos' }` (pas de rôle) ; src/modules/compliance/domain/schemas/rbac.ts:38 `pos: ['admin', 'directeur', 'manager', 'chef_rang', 'serveur', 'barman']` ; src/shared/nexus/guards/RoleGate.tsx:33 `'/pos': 'operations'` (catégorie 'operations' réutilisée pour /kds, /registre).```
- **Emplacement** : `src/config/navConfig.ts:129 + src/modules/compliance/domain/schemas/rbac.ts:37-67 + src/shared/nexus/guards/RoleGate.tsx:12-44`
- **Recommandation** : Consolider dans navConfig une matrice `{ key, href, requiredCapability, requiredRole|minLevel, category }` et faire dériver DEFAULT_PAGE_ACCESS + PATH_TO_CATEGORY depuis cette source. Ajouter un test 'chaque item de NAV_SECTIONS a une entrée DEFAULT_PAGE_ACCESS et une entrée PATH_TO_CATEGORY'.
- **Effort estimé** : M

##### TENANT_ADMIN_ROLES exclut 'directeur' (level 90) — incohérence avec la hiérarchie
- **Description** : adminAuthGuard.ts:37 `const TENANT_ADMIN_ROLES = ['super_admin', 'admin', 'manager'] as const;`. Or PERMISSION_ROLE_LEVELS place `directeur: 90` entre admin (100) et manager (70). requireTenantAdmin refuse donc un directeur qui devrait avoir plus de droits qu'un manager. requireTenantRole gère bien les niveaux mais la route qui utilise requireTenantAdmin (ex: /api/admin/rbac) bloque les directeurs.
- **Preuve** : ```src/lib/server/adminAuthGuard.ts:37 `const TENANT_ADMIN_ROLES = ['super_admin', 'admin', 'manager'] as const;` + permissions.types.ts:58-60 `admin: 100, directeur: 90, manager: 70`.```
- **Emplacement** : `src/lib/server/adminAuthGuard.ts:37`
- **Recommandation** : Ajouter 'directeur' à TENANT_ADMIN_ROLES OU (mieux) remplacer requireTenantAdmin par `requireTenantRole(req, 'manager')` partout — la logique par niveau est la seule cohérente avec PERMISSION_ROLE_LEVELS.
- **Effort estimé** : XS

##### Aucun test unitaire sur usePageAccess / useTabAccess / DEFAULT_PAGE_ACCESS
- **Description** : Une recherche `usePageAccess|useTabAccess|DEFAULT_PAGE_ACCESS|DEFAULT_TAB_ACCESS` dans src/__tests__ ne renvoie qu'une seule occurrence (franchise.test.ts:130 vérifie que 'directeur' est dans DEFAULT_PAGE_ACCESS['franchise']). La matrice complète de 30 pages × 22 rôles n'est jamais testée. Aucune régression détectée si quelqu'un supprime 'serveur' de la clé 'pos' ou change 'admin' → 'owner'.
- **Preuve** : ````rg 'usePageAccess|useTabAccess|DEFAULT_PAGE_ACCESS|DEFAULT_TAB_ACCESS' src/__tests__` = 2 matches, uniquement franchise.test.ts:130.```
- **Emplacement** : `src/__tests__/ (absence)`
- **Recommandation** : Créer src/__tests__/rbac/matrix.test.ts qui itère sur (page × role) et vérifie l'accès attendu. Snapshot testing recommandé. Ajouter aussi un test 'un role hors PermissionRole (ex: unknown_role) est refusé partout' pour se prémunir des rôles hors typage.
- **Effort estimé** : S

#### 🔵 LOW (4)

##### resolveRoleLevel (UniversalSystemPromptBuilder) référence des rôles absents de PermissionRole
- **Description** : src/modules/intelligence/services/UniversalSystemPromptBuilder.ts:102 (resolveRoleLevel) reconnaît 'owner', 'proprietaire', 'responsable_site', 'receptionniste', 'apprenti', 'stagiaire' — vérifié par universal-assistant-rbac.test.ts:8-32. Aucun de ces rôles n'existe dans PermissionRole/PERMISSION_ROLE_LEVELS. Deux matrices RBAC (Assistant IA vs UI/API) divergent, ce qui rend impossible un raisonnement unifié.
- **Preuve** : ```src/modules/intelligence/services/UniversalSystemPromptBuilder.ts:102 `resolveRoleLevel(role?: string)` + src/__tests__/intelligence/universal-assistant-rbac.test.ts:9-11,16,25,30-32.```
- **Emplacement** : `src/modules/intelligence/services/UniversalSystemPromptBuilder.ts:102`
- **Recommandation** : Aligner resolveRoleLevel sur PERMISSION_ROLE_LEVELS (import direct). Si owner/proprietaire/receptionniste sont légitimes → les ajouter à PermissionRole. Sinon → les mapper vers les rôles canoniques (owner→admin, receptionniste→hotesse, stagiaire→plongeur).
- **Effort estimé** : S

##### staffAtoms hardcode 'admin'||'manager' — 'directeur' oublié
- **Description** : src/modules/human/effectifs/hr/store/staffAtoms.ts:28,43,55 : `if (role === 'admin' || role === 'manager') return all;`. Un 'directeur' (level 90 > manager 70) ne voit pas l'équipe complète. Symptôme du problème d'absence de check par niveau plutôt que par égalité de string.
- **Preuve** : ```src/modules/human/effectifs/hr/store/staffAtoms.ts:28 `if (role === 'admin' || role === 'manager') return all;` (répété l:43, 55)```
- **Emplacement** : `src/modules/human/effectifs/hr/store/staffAtoms.ts:28,43,55`
- **Recommandation** : Remplacer par `if ((PERMISSION_ROLE_LEVELS[role] ?? 0) >= PERMISSION_ROLE_LEVELS.manager) return all;` (ou passer par un helper `hasMinLevel(user, 'manager')`).
- **Effort estimé** : XS

##### Config RBAC tenant écrite/lue via path 'config/rbac' sans vérification du rôle appelant
- **Description** : src/store/pillars/rbac.ts fetch `tenants/{tenantId}/config/rbac` via Nexus adapter. Aucun guard n'exige un rôle admin pour READ/WRITE de cette collection. En pratique, ce sont les règles Firestore (côté provider) qui pourraient bloquer, mais côté adapter la porte est ouverte. Toute modification du RBAC (blocked/allowed/minLevel) est donc contrôlée uniquement par la couche BDD, pas par le NexusInterceptor.
- **Preuve** : ```src/store/pillars/rbac.ts:22-44 fetch de config/rbac sans check RBAC en amont. SovereignGuard.SIGNED_WRITE_COLLECTIONS n'inclut pas 'config'.```
- **Emplacement** : `src/store/pillars/rbac.ts:22-44 + src/shared/nexus/guards/SovereignGuard.ts:20-36`
- **Recommandation** : Ajouter 'tenantConfig'/'config/rbac' dans SIGNED_WRITE_COLLECTIONS et exiger un rôle >= admin au niveau NexusInterceptor pour les mutations. Documenter dans SovereignGuard le rationale d'immutabilité (déjà présent pour tenantConfig dans IMMUTABLE_COLLECTIONS mais uniquement pour delete).
- **Effort estimé** : S

##### Nomenclature 'super_admin' pour MCC vs mémoire projet 'renommage prévu'
- **Description** : La mémoire projet indique 'admin = plus haut RBAC tenant (super_admin tenant à renommer)' — le renommage n'est pas fait : super_admin est utilisé comme rôle MCC dans 30+ fichiers (adminAuthGuard.ts:36-46, MFAGate.tsx:6-37, layout.tsx:10, etc.) tandis que 'admin' est le top-level tenant. La cohabitation crée une confusion visible dans TENANT_ADMIN_ROLES qui inclut 'super_admin' 'pour laisser passer les fleet admins' (adminAuthGuard.ts:337-339).
- **Preuve** : ```src/lib/server/adminAuthGuard.ts:37 `const TENANT_ADMIN_ROLES = ['super_admin', 'admin', 'manager'] as const;` + commentaire l:278 'Exige un admin/manager de tenant (ou un super_admin)'.```
- **Emplacement** : `src/lib/server/adminAuthGuard.ts:37,278`
- **Recommandation** : Renommer 'super_admin' MCC en 'mcc_admin' ou 'fleet_admin' (mémoire dit 'fleet_admin à renommer' — contradiction avec l'usage actuel où fleet_admin est PURGÉ). Clarifier la convention avec l'utilisateur avant refactor : deux nomenclatures possibles se contredisent.
- **Effort estimé** : L

---

### Conformité NF525 & fiscalité — 58/100

**Résumé** : La chaîne NF525 (JournalEntry + FiscalSeal chaîné SHA-256, séquenceur atomique, WORM 6 ans, FEC, clôture Z) est présente et testée dans le noyau, mais plusieurs failles de bord invalident la certification en pratique : les écritures UPDATE/SET sur `journalEntries`/`fiscalSeals` ne sont pas bloquées par SovereignGuard (seul DELETE l'est), les tickets clients POS n'impriment JAMAIS le footer NF525 (SIRET/hash absents), le mode offline émet un pseudo-sceau non persisté et un pieceNumber non séquentiel, la collection `wormArchives` n'est pas verrouillée, et deux FiscalEngine divergents coexistent. La gravité globale est HIGH — l'infra est bonne mais des trous permettent la fraude ou la non-conformité.

**Points forts** :
- ✅ Chaîne cryptographique SHA-256 chaînée correctement implémentée avec un GENESIS_ROOT constant et un test anti-falsification (nf525-fiscal-sealing.test.ts §3)
- ✅ Séquenceur atomique du pieceNumber via runTransaction (FiscalSealer.generateSequentialReceiptNumber) garantit la numérotation continue par année et par tenant
- ✅ SovereignGuard bloque le DELETE sur fiscalSeals/journalEntries/fiscalLedger avec émission d'un pulse CRITICAL ILLEGAL_DELETE_ATTEMPT
- ✅ Scellement atomique multi-écritures (`sealDataAtomically`) qui persiste JournalEntry + FiscalSeal + chainHead + mutations optionnelles dans la même transaction — bonne prévention des désynchronisations
- ✅ FiscalKeyService abandonne l'ancienne signature devinable (hash+instanceId) au profit d'une clé provisionnée par tenant, avec échec explicite en absence de clé

#### 🔴 CRITICAL (2)

##### SovereignGuard ne bloque QUE le DELETE — SET/UPDATE sur seals et journalEntries est libre
- **Description** : IMMUTABLE_COLLECTIONS contient 'fiscalSeals' et 'journalEntries', et NexusInterceptor consulte `isFiscallySealed`/`canDelete` UNIQUEMENT dans la branche DELETE (ligne 243). Les méthodes `set()`, `update()`, `create()`, `runTransaction()` de NexusInterceptor n'appellent aucune vérification d'immuabilité. Un appelant (admin, hook, migration, script) peut donc écraser un JournalEntry ou un FiscalSeal existant via `Nexus.adapter.set('tenants/x/fiscalSeals/<id>', modifiedSeal)` sans erreur. NF525 exige l'inaltérabilité stricte des documents fiscaux — une écriture idempotente d'un sceau modifié casse la chaîne sans être détectée à l'écriture (seule `verifyChain` a posteriori la détecte).
- **Preuve** : ```src/lib/nexus/NexusInterceptor.ts:242-256 — `if (operation === 'DELETE') { const isSealed = await this.guard.isFiscallySealed(path, context); if (isSealed) { ... throw NF525_VIOLATION } }` — aucune vérification symétrique pour WRITE. src/shared/nexus/guards/SovereignGuard.ts:38-47 déclare pourtant fiscalSeals/journalEntries dans IMMUTABLE_COLLECTIONS.```
- **Emplacement** : `src/lib/nexus/NexusInterceptor.ts:242-256 ; src/shared/nexus/guards/SovereignGuard.ts:38-47`
- **Recommandation** : Ajouter dans `intercept()` un contrôle `if (operation === 'WRITE' && this.guard.isFiscallySealed(path)) throw NF525_VIOLATION` avec un mode `merge/create-only` explicite pour la création initiale. Alternativement exposer un `canWrite(path, isNewDocument)` sur le guard qui autorise SET uniquement si `!exists`. Couvrir par un test de tentative d'écrasement.
- **Effort estimé** : M

##### Ticket client POS imprimé sans mentions NF525 (SIRET, hash, certification)
- **Description** : `EscPosBuilder.appendNf525Footer` ne s'exécute que si `ticket.nf525Hash || ticket.siret` est défini (early-return ligne 125). Le seul callsite qui construit un ticket pour l'impression client (`usePrintReceipt.ts`) ne renseigne JAMAIS `siret`, `nf525Hash`, `certifiedAt`, ni le `ticketNumber` séquentiel — il utilise `T-${Date.now()}`. Conséquence : le ticket remis au client n'affiche ni SIRET, ni numéro de certification NF525, ni la signature du sceau — mention pourtant obligatoire (LNE/AFNOR NF525 §5.2 et art. 286-I-3 bis CGI).
- **Preuve** : ```src/app/(client)/(ops)/pos/_hooks/usePrintReceipt.ts:46-56 — construit `const ticket: ReceiptTicket = { businessName, ticketNumber: 'T-${Date.now()}', tvaRatePercent, totalInMicrounits, items }` sans siret/nf525Hash/certifiedAt. src/modules/ops/service/printers/hardware/EscPosBuilder.ts:125 — `if (!ticket.nf525Hash && !ticket.siret) return;` fait sortir la fonction avant toute impression NF525.```
- **Emplacement** : `src/app/(client)/(ops)/pos/_hooks/usePrintReceipt.ts:30-66 ; src/modules/ops/service/printers/hardware/EscPosBuilder.ts:124-137`
- **Recommandation** : Câbler `usePrintReceipt` sur le résultat de `FinancialNexusBridge.processOrder()` : réutiliser le `receiptNumber` (séquentiel NF525) et le `fiscalSealHash` retournés. Charger `siret` depuis `tenantConfig.identity`. Retirer l'early-return dans `appendNf525Footer` — il DOIT toujours imprimer les mentions ou refuser l'impression.
- **Effort estimé** : M

#### 🟠 HIGH (3)

##### Collection wormArchives absente de IMMUTABLE_COLLECTIONS malgré le sceau légal 6 ans
- **Description** : `WormArchiveStorageService.sealPeriodArchive` écrit dans `tenants/${tenantId}/wormArchives/${archiveId}` avec `wormStatus: 'ACTIVE_LOCKED'` et `immutableUntilTimestamp = now + 6ans`. Or `wormArchives` n'est PAS déclarée dans `SovereignGuard.IMMUTABLE_COLLECTIONS` — un `Nexus.adapter.set()` ou `delete()` sur ce chemin passe. La méthode `enforceLegalImmutability` du service vérifie côté lecture mais n'est jamais appelée par l'intercepteur avant une écriture. Le stockage 'WORM' est donc réversible depuis n'importe quel code applicatif.
- **Preuve** : ```src/modules/finance/fiscalite/WormArchiveStorageService.ts:118-123 écrit `wormStatus: 'ACTIVE_LOCKED'`. `rg wormArchives src/shared/nexus src/lib/nexus` renvoie 0 match. src/shared/nexus/guards/SovereignGuard.ts:38-47 : la liste IMMUTABLE_COLLECTIONS ne contient pas 'wormArchives'.```
- **Emplacement** : `src/shared/nexus/guards/SovereignGuard.ts:38-47 ; src/modules/finance/fiscalite/WormArchiveStorageService.ts:118-123,190-210`
- **Recommandation** : Ajouter 'wormArchives' à `IMMUTABLE_COLLECTIONS` et faire vérifier `enforceLegalImmutability` par NexusInterceptor sur toute WRITE. À défaut, wrapper les écritures via un service dédié qui refuse toute mise à jour post-scellement.
- **Effort estimé** : S

##### Mode offline : sceau factice non persisté et pieceNumber non séquentiel
- **Description** : Quand `navigator.onLine === false`, `FinancialNexusBridge.processOrder` fabrique `hash='PENDING_OFFLINE_SEAL'`, `signature='PENDING_OFFLINE_SEAL'`, `previousHash='PENDING_OFFLINE'` et attribue le pieceNumber `OFFLINE-${entryId}` (non séquentiel). Le sceau retourné n'est écrit nulle part immédiatement — uniquement le JournalEntry est enfilé via SyncManager. Deux problèmes NF525 : (1) le numéro de pièce OFFLINE-… viole la numérotation continue chronologique exigée ; (2) si la queue Dexie est perdue (device volé, cache navigateur purgé, panne disque) avant sync, la vente est définitivement perdue sans trace scellée locale — pas de conservation légale.
- **Preuve** : ```src/modules/finance/comptabilite/FinancialNexusBridge.ts:112-137 — `const provisional = \`OFFLINE-${entryId}\`;` puis `hash = 'PENDING_OFFLINE_SEAL'` et enqueue uniquement l'instruction SET, sans persister le seal côté client ni réserver de numéro séquentiel réservé.```
- **Emplacement** : `src/modules/finance/comptabilite/FinancialNexusBridge.ts:112-138`
- **Recommandation** : Réserver un bloc de numéros séquentiels au boot (mode 'plage offline' NF525) et écrire immédiatement le JournalEntry + FiscalSeal locaux dans une store persistée (Dexie/IndexedDB) marquée `pendingSync: true`, avec un vrai hash SHA-256 chaîné sur le dernier hash local connu — pas une constante PENDING. Le sync réconcilie hashes serveur.
- **Effort estimé** : L

##### Double implémentation divergente de FiscalEngine — split brain sur verifyChain
- **Description** : `src/modules/finance/fiscalite/FiscalAdapter.ts` et `src/modules/finance/services/FiscalEngine.ts` exposent tous deux un `FiscalEngine` avec `sealEntry`/`verifyChain`/`runAudit`. Les deux versions divergent sur la reconstruction du hash : FiscalAdapter utilise `current.previousHash ?? FISCAL_CONSTANTS.GENESIS_ROOT`, services/FiscalEngine utilise `current.previousHash ?? ''`. Selon le chemin d'import, un même jeu de seals peut passer/échouer la vérification — c'est un antipattern majeur pour un composant certifié.
- **Preuve** : ```src/modules/finance/fiscalite/FiscalAdapter.ts:76-79 — `CryptoService.generateHash(current.dataSnapshot ?? "", current.previousHash ?? FISCAL_CONSTANTS.GENESIS_ROOT)`. src/modules/finance/services/FiscalEngine.ts:73 — `CryptoService.generateHash(current.dataSnapshot ?? "", current.previousHash ?? "")`.```
- **Emplacement** : `src/modules/finance/fiscalite/FiscalAdapter.ts:70-83 ; src/modules/finance/services/FiscalEngine.ts:67-77`
- **Recommandation** : Supprimer l'un des deux modules (probablement `services/FiscalEngine.ts` qui n'est utilisé que par les tests d'intégration nf525-fiscal-sealing) et rediriger tous les imports vers `fiscalite/FiscalAdapter`. Garantit un seul comportement de vérification et évite les bugs de type de fallback.
- **Effort estimé** : S

#### 🟡 MEDIUM (4)

##### Comptes journal écrits en amountInCents malgré la règle microunits stricte
- **Description** : CLAUDE.md impose : « Tous les prix en champs `*InMicrounits` (jamais `*InCents` dans le nouveau code) ». Or `FinancialJournalBuilder.makeLine` renseigne systématiquement `amountInCents`, `debitInCents`, `creditInCents`, `runningBalanceInCents` en même temps que leurs homologues microunits. Pire, `microToCents = Math.round(mu / 10_000)` (ligne 14) introduit une perte de précision fiscale : la TVA est calculée en µ puis arrondie à la ronde en cents, ce qui peut créer un écart TVA_collectée vs TVA_calculée dans les rapports téléchargés (`fromCents` puis affichage). FEC/CA3 lit ensuite `debitInCents` (`FECMapper.mapLine:16-17`) donc les cents sont la source de vérité DGFiP — le microunits devient décoratif.
- **Preuve** : ```src/modules/finance/comptabilite/FinancialJournalBuilder.ts:14 — `export const microToCents = (mu: number): number => Math.round(mu / 10_000);` ; lignes 46-63 la fonction `makeLine` remplit à la fois amountInCents et amountInMicrounits. src/modules/finance/comptabilite/fec/FECMapper.ts:16-17 — `line.debitInCents ?? 0` puis `SovereignMath.fromMicrounits(SovereignMath.fromCents(debitCents))` : double conversion cents→µ→€.```
- **Emplacement** : `src/modules/finance/comptabilite/FinancialJournalBuilder.ts:14,45-63 ; src/modules/finance/comptabilite/fec/FECMapper.ts:15-42`
- **Recommandation** : Faire de `*InMicrounits` la source unique dans JournalLine, et calculer `debitInCents` à la volée dans le FECMapper (Math.floor pour les montants au débit, comme le veut l'arrondi fiscal). Marquer les champs `*InCents` `@deprecated` et retirer leur écriture des chemins neufs.
- **Effort estimé** : M

##### FiscalSealer sans registerId : un seul chainHead partagé pour toutes les caisses d'un tenant
- **Description** : `FiscalSealer.sealDataAtomically` accepte un `registerId?` optionnel qui route vers `chainHead_${registerId}`, mais AUCUN callsite ne le passe (`OrderSealedNF525Handler`, `TicketZHandler`, `/api/finance/sync`, `FinancialNexusBridge` — tous appellent sans registerId). Résultat : toutes les caisses d'un même tenant partagent `chainHead` et sérialisent leurs sceaux dans une seule chaîne. Sous forte contention (multi-caisses simultanées) la transaction retry sérialise, ce qui est correct pour la cohérence mais perd la traçabilité par caisse. NF525 demande une chaîne par « point d'encaissement » (LNE 001) — la traçabilité inter-caisse est perdue.
- **Preuve** : ```src/modules/finance/fiscalite/FiscalSealer.ts:97-103 — `const chainHeadPath = registerId ? ... : \`tenants/${tenantId}/fiscalMeta/chainHead\`;`. Tous les appels vérifiés (rg sealDataAtomically) : `FinancialNexusBridge.ts:98-103`, `TicketZHandler.ts:157`, `OrderSealedNF525Handler.ts:11`, `api/finance/sync/route.ts:77` — aucun n'inclut registerId.```
- **Emplacement** : `src/modules/finance/comptabilite/FinancialNexusBridge.ts:98-103 ; src/shared/eventBus/handlers/OrderSealedNF525Handler.ts:11 ; src/shared/eventBus/handlers/TicketZHandler.ts:157 ; src/app/api/finance/sync/route.ts:77`
- **Recommandation** : Résoudre le `registerId` depuis le contexte de session (device/POS active) via `useTenant()` ou un service `RegisterContext`, et le propager dans `BridgePayload`. Ajouter un test qui vérifie deux caisses en parallèle produisent bien deux chaînes distinctes.
- **Effort estimé** : M

##### FEC : aucun contrôle du format SIREN, EcritureLet/DateLet toujours vides, arrondi cents brut
- **Description** : `FECGenerator.generate(entries, siren, yearMonth)` accepte la chaîne SIREN sans validation (doit être 9 chiffres pour DGFiP — un SIRET est 14). `FECMapper.mapLine` renvoie `EcritureLet: ''` et `DateLet: ''` en dur : le lettrage n'est jamais restitué même quand des règlements ont clôturé une écriture, ce qui rend le FEC non conforme à l'art. A47 A-1 du LPF pour les entreprises ayant du lettrage. `CompAuxNum`/`CompAuxLib` toujours vides même quand un tiers auxiliaire (client/fournisseur) existe.
- **Preuve** : ```src/modules/finance/comptabilite/fec/FECGenerator.ts:16 — `generate(entries: JournalEntry[], siren: string, yearMonth: string)` — pas de contrôle `if (!/^\d{9}$/.test(siren))`. src/modules/finance/comptabilite/fec/FECMapper.ts:37-38 — `EcritureLet: ''`, `DateLet: ''`. Comparer avec `GenerateCA3Declaration.ts:18` qui LUI valide `siret.length !== 14`.```
- **Emplacement** : `src/modules/finance/comptabilite/fec/FECGenerator.ts:16 ; src/modules/finance/comptabilite/fec/FECMapper.ts:23-42`
- **Recommandation** : Ajouter un guard `if (!/^\d{9}$/.test(siren)) throw new Error('SIREN invalide (9 chiffres)')`. Résoudre EcritureLet/DateLet depuis un futur `LetteringService` (à minima renseigner les paiements complétés). Renseigner CompAuxNum lorsque la ligne a un `line.thirdPartyId`.
- **Effort estimé** : S

##### FiscalKeyService : fallback FISCAL_SIGNING_SECRET partagé entre tous les tenants côté serveur
- **Description** : En absence de clé provisionnée par tenant, `requireKey` retourne `process.env.FISCAL_SIGNING_SECRET`. Ce secret unique est utilisé pour signer les sceaux de N tenants — la signature ne prouve plus l'origine du tenant. En cas de fuite, tous les tenants sont compromis. La classe le documente comme intentionnel (« Fallback serveur »), mais aucun garde-fou n'empêche un tenant nouvellement provisionné (sans clé) de tomber sur ce fallback en production.
- **Preuve** : ```src/modules/finance/services/FiscalKeyService.ts:41-56 — `const envKey = ... process.env?.FISCAL_SIGNING_SECRET; if (envKey) return envKey;` — pas de garde `NODE_ENV !== 'production'` ni de log CRITICAL.```
- **Emplacement** : `src/modules/finance/services/FiscalKeyService.ts:41-56`
- **Recommandation** : Refuser le fallback en production (`NODE_ENV === 'production'` sans clé provisionnée → throw + alerte). Émettre un `NexusTelemetry.CRITICAL` à chaque usage du fallback. Rendre `provision(tenantId, key)` obligatoire dans le seeder tenant, avec test d'invariant.
- **Effort estimé** : S

#### 🔵 LOW (1)

##### Test d'intégration NF525 ne couvre pas le chemin adapter atomique (sealDataAtomically)
- **Description** : `nf525-fiscal-sealing.test.ts` teste uniquement `FiscalEngine.sealEntry` (pure fonction) — pas `FinancialNexusBridge.processOrder` ni `FiscalSealer.sealDataAtomically`, qui sont le chemin de production réel (transaction Nexus, chainHead, séquenceur reçu). Aucun test bout-en-bout ne vérifie qu'une vente POS produit bien un JournalEntry ET un FiscalSeal ET un chainHead mis à jour dans la même transaction. Les tests existants (`FinancialNexusBridge.test.ts`, `FiscalSealer.test.ts`, `pos-to-fiscal.test.ts`) devraient être audités pour compléter.
- **Preuve** : ```src/__tests__/integration/nf525-fiscal-sealing.test.ts:1-112 — tous les `it()` invoquent uniquement `FiscalEngine.sealEntry(...)`. Aucun appel à `FinancialNexusBridge`, `sealDataAtomically`, `Nexus.adapter`.```
- **Emplacement** : `src/__tests__/integration/nf525-fiscal-sealing.test.ts`
- **Recommandation** : Ajouter une suite `pos-to-fiscal-end-to-end.test.ts` qui : (1) monte un adapter Mock/Simulacra ; (2) appelle `FinancialNexusBridge.processOrder(cart)` ; (3) vérifie la présence de `tenants/x/journalEntries/*` ET `tenants/x/fiscalSeals/*` ET `tenants/x/fiscalMeta/chainHead` avec chaînage correct ; (4) rejoue avec 2 caisses concurrentes.
- **Effort estimé** : M

---

### Dette technique, god files & code mort — 74/100

**Résumé** : Dette technique globalement bien maîtrisée : très peu de TODO/FIXME (43 total), pas de console.log sauvage en production, pas de @ts-nocheck, peu de fichiers > 500 lignes (9 dont 4 tests). Les foyers de dette sont concentrés : (1) doublon complet MarketOracle.ts entre shared/providers/fleet/ et modules/intelligence/ia/fleet/ (357 lignes chacun, la version shared est morte car 0 import), (2) 28 FIXME "Modular Monolith" documentant des imports cross-module non résolus, (3) tabs finance orphelins (5 composants Accounting/Audit/Bank/Billing/Treasury dans _tabs/), (4) god file d'événements 796 lignes. Aucun problème bloquant, mais nettoyage recommandé avant nouveaux sprints.

**Points forts** :
- ✅ Discipline exemplaire sur les TODO/FIXME : seulement 43 occurrences totales dans tout le repo, avec 28 explicitement catégorisées 'Modular Monolith' (rendues traçables)
- ✅ Aucun console.log sauvage en code de production : les 11 usages sont tous dans logger.ts, axiom.ts ou benchmarks légitimes (silence intentionnel de console pour bench)
- ✅ Aucun @ts-nocheck dans le repo ; les 11 @ts-expect-error sont concentrés dans les tests avec commentaire explicatif (vitest mocks)
- ✅ Seulement 9 fichiers > 500 lignes dont 4 sont des tests saga légitimes (agrégats couvrant plusieurs handlers) — code de production reste sous contrôle
- ✅ Pas de mocks laissés dans du code non-test (grep 'Mock' hors __tests__/ et __mocks__/ = 0 fichier) — bonne séparation des environnements

#### 🟠 HIGH (2)

##### Doublon complet MarketOracle.ts (357 lignes, version shared morte)
- **Description** : Le fichier MarketOracle.ts existe à deux emplacements avec exactement 357 lignes chacun et une différence minime (23 lignes ajoutées / 23 supprimées, en-tête différent). Seule la version dans modules/intelligence/ia/fleet/ est importée (5 imports); shared/providers/fleet/MarketOracle.ts a 0 import dans src/ — code totalement mort, source de divergences futures et confusion développeur.
- **Preuve** : ```wc -l shared/providers/fleet/MarketOracle.ts modules/intelligence/ia/fleet/MarketOracle.ts -> 357 / 357 ; rg 'shared/providers/fleet' src -> 0 matches ; rg 'modules/intelligence/ia/fleet' src -> 5 matches```
- **Emplacement** : `src/shared/providers/fleet/MarketOracle.ts vs src/modules/intelligence/ia/fleet/MarketOracle.ts`
- **Recommandation** : Supprimer src/shared/providers/fleet/MarketOracle.ts (et vérifier si tout le dossier shared/providers/fleet/ peut être retiré). Documenter dans .claude/sessions.md et re-runner sentrux.
- **Effort estimé** : XS

##### 5 composants finance _tabs orphelins (dette UI, ~33 KB)
- **Description** : Le dossier src/modules/finance/components/_tabs/ contient 5 composants (AccountingTab 12.2KB, BankTab 10.9KB, TreasuryTab 5.4KB, BillingTab 3.9KB, AuditTab 1.4KB) sans aucun import détecté dans src/. Semblent être des reliquats d'une ancienne architecture par onglets remplacée. Poids inutile qui gonfle le pilier finance et brouille la lecture de la dette.
- **Preuve** : ```for f in AccountingTab BankTab AuditTab TreasuryTab BillingTab; do rg "from.*${f}" src -> 0 match hors du fichier lui-même ; ls src/modules/finance/components/_tabs/ -> 5 fichiers .tsx```
- **Emplacement** : `src/modules/finance/components/_tabs/{AccountingTab,BankTab,TreasuryTab,BillingTab,AuditTab}.tsx`
- **Recommandation** : Confirmer avec `git log` la dernière utilisation, puis supprimer le dossier _tabs/. Si conservation temporaire souhaitée, déplacer sous src/_archive/ avec date.
- **Effort estimé** : S

#### 🟡 MEDIUM (4)

##### 28 FIXME 'Modular Monolith' — imports cross-module non résolus
- **Description** : 28 occurrences de commentaires FIXME (Modular Monolith): Remove cross-module import. Use domain/ or Nexus... marquent explicitement des violations de la Règle du Barrel non traitées. Concentrés dans ops/pos, ops/inventory, intelligence/ia/agency, logistics/hooks. Ces violations sont contournées par des eslint-disable next-line vanguard/no-inter-module-imports (visible dans OracleEngine.ts:129, InventoryReceptionDashboard.tsx:20). Dette architecturale reconnue mais non priorisée.
- **Preuve** : ```rg 'FIXME \(Modular Monolith\)' src | wc -l -> 28 ; ex: src/modules/ops/service/pos/components/Cart.tsx:15,11 ; src/modules/intelligence/services/OracleEngine.ts:128 avec eslint-disable next-line vanguard/no-inter-module-imports```
- **Emplacement** : `src/modules/ops/service/pos/components/Cart.tsx, src/modules/intelligence/services/OracleEngine.ts, src/modules/logistics/hooks/useStockPrediction.ts (+25 autres)`
- **Recommandation** : Créer un ticket unique 'purge FIXME Modular Monolith' avec traitement par lot pilier par pilier via déplacement des types partagés vers @/kernel ou @/modules/<pilier>/index (barrel). Bloquer nouveaux ajouts via la règle vanguard/no-inter-module-imports en severity: error.
- **Effort estimé** : L

##### God file common.events.ts (796 lignes) — event bus non domain-split
- **Description** : src/shared/eventBus/events/common.events.ts fait 796 lignes, largement au-dessus des autres fichiers (le suivant non-test fait 593). Concentre tous les schémas d'événements transverses en un seul module, ce qui casse le principe pilier par pilier appliqué ailleurs (ops.events.ts, ops2, finance2, etc. existent bien). Devient un point de contention (merge conflicts, ownership flou).
- **Preuve** : ```wc -l src/shared/eventBus/events/common.events.ts -> 796 ; à comparer avec ops.events.ts:365, human.events.ts (via saga.human.test) etc. Les autres fichiers events/ sont scindés par pilier alors que common.events reste monolithique.```
- **Emplacement** : `src/shared/eventBus/events/common.events.ts`
- **Recommandation** : Scinder par thématique (session.events, notification.events, integration.events, telemetry.events...) puis re-exporter depuis un index.ts. Ajouter une lint rule bloquant les fichiers > 500 lignes dans events/.
- **Effort estimé** : M

##### God file accounting-portal/page.tsx (593 lignes) — logique métier dans page Next.js
- **Description** : src/app/(client)/(ops)/accounting-portal/page.tsx atteint 593 lignes dans une page Next.js. Contient probablement de la logique métier (fetch, formatting, state) qui devrait être déportée dans src/modules/finance/comptabilite/. Anti-pattern App Router (le page.tsx doit rester un shell).
- **Preuve** : ```wc -l src/app/(client)/(ops)/accounting-portal/page.tsx -> 593 ; rg 'accounting-portal' src révèle des fetch inline `/api/finance/accounting-portal/summary` et `/api/finance/accounting-portal/pack` directement dans la page (lignes 40, 58)```
- **Emplacement** : `src/app/(client)/(ops)/accounting-portal/page.tsx`
- **Recommandation** : Extraire les hooks de fetch, dialogs, sections en composants du pilier finance/comptabilite. Objectif: ramener page.tsx sous 150 lignes (shell + composition).
- **Effort estimé** : M

##### Bloc commenté de 25 lignes dans google/sync-hours/route.ts (intégration TODO)
- **Description** : src/app/api/google/sync-hours/route.ts contient un bloc de 25 lignes commentées consécutives, accompagné d'un TODO `Appel PUT vers l'API Google Business Profile (GBP)` (ligne 53). Endpoint API partiellement implémenté : la route existe mais l'appel réel Google est désactivé. Risque de fausse assurance côté produit (l'endpoint répond OK sans écrire chez Google).
- **Preuve** : ```awk '/^[[:space:]]*\/\//{c++;if(c>max)max=c;next}{c=0}END{print max}' -> 25 ; grep TODO -> line 53: 'Appel PUT vers l API Google Business Profile (GBP)'```
- **Emplacement** : `src/app/api/google/sync-hours/route.ts:53 (et bloc commenté environnant)`
- **Recommandation** : Soit implémenter l'appel GBP réel, soit remplacer par un 501 Not Implemented explicite avec log, soit désactiver la route derrière un feature flag. Ne pas laisser en zombie.
- **Effort estimé** : S

#### 🔵 LOW (4)

##### FIXME facility x4 — PaymentDialog (ops) importé dans facility/floor-plan
- **Description** : Le pilier facility importe des composants du pilier ops (PaymentDialog dans FloorPlanEditor.tsx, TableInsightPanel.tsx). Marqué FIXME (facility-rapatriement) mais non résolu. Viole la frontière entre piliers. Un eslint-disable no-restricted-imports + vanguard/no-inter-module-imports masque le problème.
- **Preuve** : ```src/modules/facility/spaces/floor-plan/FloorPlanEditor.tsx:15: '// FIXME (facility-rapatriement): PaymentDialog est un composant ops' ; src/modules/facility/spaces/floor-plan/TableInsightPanel.tsx:17: '// eslint-disable-next-line vanguard/no-inter-module-imports, no-restricted-impo...'```
- **Emplacement** : `src/modules/facility/spaces/floor-plan/FloorPlanEditor.tsx:15, src/modules/facility/spaces/floor-plan/TableInsightPanel.tsx:17`
- **Recommandation** : Extraire PaymentDialog vers un contrat public @/modules/ops (barrel) ou événement NexusEventBus 'facility.table.payment.requested' consommé par ops. Retirer eslint-disable après refactor.
- **Effort estimé** : M

##### 11 @ts-expect-error dont un dans provider IMAP de production
- **Description** : 11 suppressions TypeScript au total, essentiellement dans tests (vitest mocks). Un cas préoccupant en code de production: src/modules/finance/tresorerie/collection/providers/ImapInvoiceProvider.ts:50 utilise `@ts-expect-error — imap-simple optionnel`. Dépendance optionnelle non typée qui peut casser à l'installation ou masquer un breaking change silencieusement.
- **Preuve** : ```rg '@ts-ignore|@ts-expect-error' src : 9 matches dans 4 fichiers (3 tests + ImapInvoiceProvider.ts:50) ; commentaire: 'imap-simple optionnel, installer avec: npm i imap-simple'```
- **Emplacement** : `src/modules/finance/tresorerie/collection/providers/ImapInvoiceProvider.ts:50`
- **Recommandation** : Ajouter @types/imap-simple ou écrire un types.d.ts local avec la signature utilisée. Documenter dans README la nécessité d'installer imap-simple si le provider IMAP est activé.
- **Effort estimé** : XS

##### 116 eslint-disable dispersés (visibilité dette)
- **Description** : 116 directives eslint-disable dans le code source. Non-bloquant mais mérite un rapport périodique. Concentrations principales sur vanguard/no-inter-module-imports (dette Modular Monolith), no-restricted-imports (deep paths infrastructure), @typescript-eslint/no-explicit-any (plugins/CoreContext.ts), et @next/next/no-img-element (SplashScreen).
- **Preuve** : ```rg 'eslint-disable' src | wc -l -> 116 ; échantillon: src/shared/plugins/CoreContext.ts:35 (no-explicit-any), src/shared/plugins/IVerticalUIPlugin.ts:18 (no-explicit-any), src/app/(client)/(ops)/reservations/page.tsx:19 (no-restricted-imports)```
- **Emplacement** : `src/**/*.ts,tsx (116 occurrences)`
- **Recommandation** : Ajouter au script preflight un compteur eslint-disable qui alerte si la valeur augmente. Créer un burndown chart trimestriel.
- **Effort estimé** : S

##### FranchiseDashboard.tsx à 505 lignes — composant monolithique
- **Description** : src/modules/commerce/franchise/components/FranchiseDashboard.tsx atteint 505 lignes pour un seul composant React. Chargé via dynamic import depuis src/app/(client)/(ops)/franchise/page.tsx. Un composant de cette taille rend les tests et le refactor risqués (souvent plusieurs sections/tabs à scinder).
- **Preuve** : ```wc -l src/modules/commerce/franchise/components/FranchiseDashboard.tsx -> 505 ; usage: src/app/(client)/(ops)/franchise/page.tsx:6-22 (dynamic import + <FranchiseDashboard />)```
- **Emplacement** : `src/modules/commerce/franchise/components/FranchiseDashboard.tsx`
- **Recommandation** : Scinder en sous-composants par section (network view, revenue tiles, franchisee list, etc.) sous src/modules/commerce/franchise/components/dashboard/.
- **Effort estimé** : M

---

### Couverture tests (Vitest + Playwright) — 35/100

**Résumé** : 176 tests unitaires Vitest + 9 spécifications Playwright pour ~2 745 fichiers source (ratio ~6,4 %). Le socle NF525/SovereignGuard/microunits est adressé, mais plusieurs tests critiques sont désactivés, mocqués au point d'être inopérants, ou orphelins (jamais exécutés). La couverture composants (3/784 .tsx) et l'ICM-lite (0 test) sont quasi nulles ; les Playwright utilisent massivement `if isVisible / catch(()=>{})` et passent verts même sur UI cassée.

**Points forts** :
- ✅ Suite d'intégration NF525 réelle en place (src/__tests__/integration/nf525-fiscal-sealing.test.ts) qui teste chaînage, corruption et audit avec vrais CryptoService+FiscalEngine
- ✅ Suite d'isolation multi-tenant riche (src/__tests__/security/multi-tenant-isolation.test.ts) couvrant ShieldedContext, DNAInjector, SovereignGuard, PIN hashing salé
- ✅ Invariant #5 (reliquat de split) explicitement testé au niveau microunits (src/__tests__/pos/pos-split-remainder.test.ts) avec 100€/3 parts et hook usePosSplit
- ✅ Bonne présence de tests HACCP, IoT cold-chain, KDS multiposte, WORM archive — piliers compliance/logistics/ops couverts au niveau service
- ✅ Setup env NEXUS_TENANT_SECRET dans vitest.config évite qu'un test signe avec une clé absente et laisse échapper une fausse validation

#### 🔴 CRITICAL (2)

##### 22 tests src/e2e/vanguard/ orphelins — aucun runner ne les exécute
- **Description** : Vitest exclut explicitement `src/e2e/**` et Playwright pointe uniquement sur `./tests/e2e`. Les 22 fichiers `.test.ts` sous `src/e2e/vanguard/` (fiscal-signature, financial-bridge, sovereign-math, chaos, event-bus, offline-resilience, tenant-seeder, invoice-extraction, etc.) et `src/e2e/benchmarks/` ne sont donc jamais lancés en CI ni en local — ce sont des tests morts.
- **Preuve** : ```vitest.config.ts:12  exclude: ['tests/e2e/**', 'src/e2e/**']
playwright.config.ts:8  testDir: './tests/e2e'
ls src/e2e/vanguard/ → 22 fichiers .test.ts```
- **Emplacement** : `src/e2e/vanguard/ (22 fichiers), src/e2e/benchmarks/ (2 fichiers), src/e2e/simulator/`
- **Recommandation** : Décider : (a) intégrer ces suites via un projet Vitest dédié (`--project=vanguard`) ou (b) les rapatrier sous `src/__tests__/` avec la convention du reste du repo. Ne pas laisser 22 fichiers de tests fiscaux/chaos/offline se croire exécutés.
- **Effort estimé** : M

##### FiscalSealer chain test valide une chaîne SHA-256 mockée constante
- **Description** : Le test 'chaque seal contient le hash du précédent' spy sur `CryptoService.generateHash` avec `.mockResolvedValue('test_hash_abc123')` : les deux seals reçoivent le même hash constant, donc `seal2.previousHash === seal1.hash` est trivialement vrai. Aucune vérification du vrai chaînage cryptographique NF525.
- **Preuve** : ```src/__tests__/infrastructure/FiscalSealer.test.ts:50  vi.spyOn(CryptoService, 'generateHash').mockResolvedValue('test_hash_abc123');
src/__tests__/infrastructure/FiscalSealer.test.ts:106  it('chaque seal contient le hash du précédent'...)
:109  expect(seal2.previousHash).toBe(seal1.hash)```
- **Emplacement** : `src/__tests__/infrastructure/FiscalSealer.test.ts:47-131`
- **Recommandation** : Ne PAS mocker CryptoService dans les tests de chaîne fiscale. Utiliser le vrai `CryptoService` (comme le fait déjà `src/__tests__/integration/nf525-fiscal-sealing.test.ts`) ou tester au minimum que hash1 ≠ hash2 pour deux données distinctes.
- **Effort estimé** : S

#### 🟠 HIGH (5)

##### Test d'intégration POS→Fiscal silencieusement skippé en CI
- **Description** : `describe.skipIf(!RUN_INTEGRATION)` masque le test si `FIRESTORE_EMULATOR_HOST` n'est pas défini. En CI sans démarrage explicite de l'émulateur, ce test — pourtant le seul qui vérifie la vraie écriture Firestore de la chaîne POS→JournalEntry→FiscalSeal — passe vert sans rien tester. Aggravant : une clé privée RSA en dur est embarquée dans le fichier.
- **Preuve** : ```src/__tests__/integration/pos-to-fiscal.test.ts:8  const RUN_INTEGRATION = process.env.FIRESTORE_EMULATOR_HOST !== undefined;
:10  describe.skipIf(!RUN_INTEGRATION)('Integration: POS to Fiscal',...)
:20  private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvAIB...'```
- **Emplacement** : `src/__tests__/integration/pos-to-fiscal.test.ts:8-27`
- **Recommandation** : Démarrer `firebase emulators` dans le script CI (via `firebase-tools` ou `testcontainers`) et faire échouer le run si le test est skippé. Extraire la clé privée dans un fixture ou générer dynamiquement (`crypto.generateKeyPair`).
- **Effort estimé** : M

##### Playwright e2e — pattern isVisible/catch rend les specs incapables d'échouer
- **Description** : Les 5 specs Playwright critiques (vital-flow, pos-split-payment, cash-drawer-lifecycle, kds-kitchen-flow, onboarding) contiennent 46 blocs `if (await X.isVisible())` gardant chaque action et 13 blocs `.catch(() => {})` qui avalent les assertions. Résultat : si le PIN pad, la table, ou le bouton d'encaissement ne s'affiche pas, le test se termine en succès. Le 'Flux Vital POS→Bilan Z' n'est pas testé, il est mimé.
- **Preuve** : ```tests/e2e/vital-flow.spec.ts:14  if (await pinPad.isVisible()) { ... }
:21  await expect(page.getByText('Caisse ouverte')).toBeVisible({ timeout: 5000 }).catch(() => {});
tests/e2e/pos-split-payment.spec.ts:60-62  await expect(page.getByText(/Convive 1/i)).toBeVisible().catch(() => {});```
- **Emplacement** : `tests/e2e/*.spec.ts (5 fichiers, 46+13 occurrences)`
- **Recommandation** : Bootstraper les fixtures avant test (session PIN pré-loggée, table pré-sélectionnée) et retirer tous les `if isVisible` / `.catch(()=>{})`. Une assertion doit pouvoir échouer sinon elle n'existe pas.
- **Effort estimé** : L

##### Couverture composants React quasi nulle : 3 .test.tsx pour 784 .tsx
- **Description** : 784 composants `.tsx` (Cart, ProductGrid, TableSelector, KDSBoard, FloorPlanEditor, CashCounterModal, PosView, etc.) pour seulement 3 tests unitaires composants : CardImprintStep, ReservationCapacitySection, AddPrinterWizard. Les composants critiques du POS/KDS/FloorPlan n'ont aucun test de rendu ni d'interaction — seule logique service est testée.
- **Preuve** : ```find src -name '*.test.tsx' → 3 fichiers
find src -name '*.tsx' -not -name '*.test.*' → 784 fichiers
src/modules/ops/service/pos/components/ (Cart, ProductGrid, TableSelector, ...) : 0 test```
- **Emplacement** : `src/modules/**/components/ (majorité sans test)`
- **Recommandation** : Prioriser Cart, ProductGrid, CashCounterModal, KDS board, SplitBillDialog — composants dont la logique UI porte l'invariant fiscal. React Testing Library + jsdom (déjà configuré ligne 6).
- **Effort estimé** : XL

##### Playwright webServer désactivé — les e2e dépendent d'un serveur lancé à la main
- **Description** : La section `webServer` est commentée dans playwright.config.ts. En CI, il faut démarrer `npm run dev` séparément avant `npx playwright test`, sinon toutes les specs échouent au premier `page.goto('/pos')`. Aucun script `preflight.sh` ou pipeline visible ne le fait — les e2e sont donc probablement jamais joués en CI.
- **Preuve** : ```playwright.config.ts:26-35  /* Configuration du serveur local - Désactivée pour utiliser le serveur actif */
/*
webServer: { command: 'npm run dev', ... }
*/```
- **Emplacement** : `playwright.config.ts:26-35`
- **Recommandation** : Réactiver le bloc `webServer` avec `reuseExistingServer: !process.env.CI` (déjà écrit dans le commentaire). Sinon, documenter dans preflight.sh la commande dev à lancer en background.
- **Effort estimé** : XS

##### Zéro test ICM-lite / TaskContext
- **Description** : CLAUDE.md décrit ICM-lite comme mécanisme critique (chargement sélectif des modules HIGH/MEDIUM par route via `src/lib/icm/TaskContext.ts`). Aucun test ne vérifie `resolveTaskContext()`, ni que `/pos` charge bien orders/tables/products, ni qu'une route inconnue tombe sur un fallback. Une régression silencieuse chargerait tout ou rien.
- **Preuve** : ```rg 'resolveTaskContext|TASK_MAPS' src/__tests__ → 0 hit
rg 'TaskContext' src/__tests__ → 0 hit```
- **Emplacement** : `src/lib/icm/TaskContext.ts (non testé)`
- **Recommandation** : Ajouter un test unitaire dédié : cartographie route → modules attendus, comportement fallback sur route inconnue, ordre de chargement.
- **Effort estimé** : S

#### 🟡 MEDIUM (5)

##### Aucun seuil de couverture configuré — impossible de faire régresser un gate
- **Description** : vitest.config.ts définit `coverage: { reporter: ['text','lcov'], all: false }` mais aucun `thresholds.global.branches/lines/functions/statements`. Toute PR peut baisser la couverture sans alerte. `all: false` masque en plus les fichiers non importés par un test, donnant un score artificiellement élevé.
- **Preuve** : ```vitest.config.ts:13-19  coverage: { provider: 'v8', reporter: ['text','lcov'], all: false, include: [...], exclude: [...] }```
- **Emplacement** : `vitest.config.ts:13-19`
- **Recommandation** : Passer `all: true` et fixer un plancher progressif : `thresholds: { lines: 40, statements: 40, functions: 35, branches: 30 }` puis augmenter par palier de 5 pts.
- **Effort estimé** : XS

##### Tests dispersés sur 4 conventions incompatibles
- **Description** : Tests répartis entre `src/__tests__/` (104 fichiers), `src/modules/**/*.test.ts` (46), `src/e2e/vanguard/` (22, orphelins), `tests/falange/` (5), `tests/verification/` (3), `tests/benchmarks/` (2), `tests/e2e/` (9). Deux styles co-existent : co-location vs pool centralisé. Aucune règle documentée n'oriente le développeur.
- **Preuve** : ```src/__tests__/ : 33 sous-dossiers (api, b2b, bus, ...)
src/modules/**/*.test.ts : 46 fichiers
tests/falange/, tests/verification/, tests/benchmarks/ : 10 fichiers
src/e2e/vanguard/ : 22 orphelins```
- **Emplacement** : `src/__tests__/, src/modules/, src/e2e/, tests/`
- **Recommandation** : Trancher : co-location stricte (`src/modules/<pilier>/**/*.test.ts`) ou pool centralisé (`src/__tests__/`). Documenter la règle dans CLAUDE.md et migrer.
- **Effort estimé** : L

##### Noms de tests dupliqués créent une ambiguïté dans les logs
- **Description** : 4 basenames identiques : `domain.test.ts` (src/e2e + tests/falange), `isolation.test.ts` (tests/falange + tests/verification), `AuditService.test.ts` (compliance + shared/nexus/vault), `NexusYieldEngine.test.ts` (src/e2e + finance/services). Les outputs Vitest les affichent avec le même label, rendant la triage d'échec pénible.
- **Preuve** : ```find src tests -name 'AuditService.test.ts'
→ src/modules/compliance/securite/audit/AuditService.test.ts
→ src/shared/nexus/vault/audits/audit/AuditService.test.ts```
- **Emplacement** : `src/modules/compliance/securite/audit/AuditService.test.ts, src/shared/nexus/vault/audits/audit/AuditService.test.ts, src/e2e/vanguard/domain.test.ts vs tests/falange/domain.test.ts, src/e2e/vanguard/NexusYieldEngine.test.ts vs src/modules/finance/services/NexusYieldEngine.test.ts`
- **Recommandation** : Renommer avec un préfixe module (`AuditService.compliance.test.ts` / `AuditService.vault.test.ts`).
- **Effort estimé** : XS

##### Tests métier sagas mockent CryptoService — chaîne fiscale non couverte dans les handlers
- **Description** : `saga-handlers.test.ts` et `saga.finance2.test.ts` spy sur `CryptoService.generateHash` avec une valeur constante avant de tester les handlers financiers. Les handlers pilotent la génération de scellements — vérifier avec un hash constant ne prouve pas que le scellement est correctement produit ou chaîné.
- **Preuve** : ```src/__tests__/handlers/saga-handlers.test.ts:78  vi.spyOn(CryptoService, 'generateHash').mockResolvedValue('expected-hash');
src/__tests__/helpers/saga.finance2.test.ts:78  vi.spyOn(CryptoService, 'generateHash').mockResolvedValue('hash-abc' as never);```
- **Emplacement** : `src/__tests__/handlers/saga-handlers.test.ts:78, src/__tests__/helpers/saga.finance2.test.ts:78`
- **Recommandation** : Laisser CryptoService réel (rapide en Node crypto) et n'observer que le contrat handler (a-t-il émis JournalEntry + SealId ?). Les mocks masquent tout bug de sérialisation canonique.
- **Effort estimé** : S

##### Setup timeout global 30 s + hookTimeout 30 s masque des vraies fuites
- **Description** : vitest.config.ts fixe `testTimeout: 30000` et `hookTimeout: 30000`. À l'échelle du repo (300+ tests), cela allonge un run cassé jusqu'à 2h30 avant d'échouer et cache les tests qui attendent réellement des ressources externes (émulateur, LightRAG). Un test qui prend >2 s doit être diagnostiqué, pas cache.
- **Preuve** : ```vitest.config.ts:9  testTimeout: 30000
vitest.config.ts:10  hookTimeout: 30000```
- **Emplacement** : `vitest.config.ts:9-10`
- **Recommandation** : Redescendre à `testTimeout: 5000` (10 000 pour intégration) et laisser les rares tests lents surcharger via `it('...', {timeout: 20000}, ...)`.
- **Effort estimé** : XS

#### 🔵 LOW (1)

##### Ratio tests unitaires / fichiers source ~6,4 %
- **Description** : 176 fichiers de test pour 2 745 fichiers source non-test (hors .d.ts). Même si beaucoup de fichiers source sont des barrels/types, l'écart avec le benchmark industrie (15-25 % de fichiers testés) est significatif — surtout dans un domaine à contrainte réglementaire (NF525, RGPD, HACCP).
- **Preuve** : ```find src -type f -name '*.test.*' -o -name '*.spec.*' | wc -l → 176
find src -type f \( -name '*.ts' -o -name '*.tsx' \) -not \( -name '*.test.*' -o -name '*.spec.*' -o -name '*.d.ts' \) | wc -l → 2745```
- **Emplacement** : `src/`
- **Recommandation** : Fixer un objectif par pilier (ex : finance et compliance → ≥30 % couverture lignes, ops → ≥20 %) et instrumenter avec le seuil vitest.
- **Effort estimé** : XL

---

## ⏸️ Dimensions non couvertes (à auditer ultérieurement)

Le workflow s'est arrêté après le batch 3/6 (limite mensuelle atteinte). Reste à couvrir :

- **Performance, bundle & PWA** — Code splitting, ICM-lite, images, N+1, bundle size, PWA
- **Verticales non-restaurant** — hotel, bakery, garage, salon, clinic, retail, custom — état réel
- **MCC (Multi-Cloud-Control)** — Console admin plateforme, provisioning, ChangelogService
- **Bus événementiel & saga réactive** — NexusEventBus, outbox, DLQ, cascades, idempotence
- **Accessibilité WCAG & UX critique** — tabular-nums, cibles tactiles, ARIA, focus trap, prefers-reduced-motion
- **Documentation, CI/CD & tooling** — CLAUDE.md, ARCHITECTURE.md, .sentrux, preflight, hooks Git

Reprise possible via workflow avec `resumeFromRunId: 'wf_32f2c212-ff0'` : les 6 audits ci-dessus sont en cache et ne consommeront pas de tokens.

---

## 🔄 Recommandations transversales

Patterns qui reviennent dans plusieurs dimensions :

1. **Gardes fiscales/fiscales manquantes** — plusieurs findings pointent vers l'absence de test automatique sur les invariants NF525 et cross-tenant. Une suite `tests/invariants/` dédiée serait un investissement fort levier.
2. **Aliases legacy** — SUPER_ADMIN, fleet_admin, InCents subsistent dans le code alors qu'ils devraient être supprimés selon les mémoires de session. Un ménage global unique est plus efficace que du pilier-par-pilier.
3. **Documentation dérive** — les mémoires des sessions passées affirment des choses (« MCC ne consomme pas les events métier », « aliases supprimés ») qui ne sont pas toutes vérifiables dans le code. Nécessité d'un contrôle continu docs↔code (script `check-doc-drift.sh` en pre-commit).

---

## 🗓️ Plan d'action séquencé

### Semaine 1 (critiques bloquants)
Traiter les findings 🔴 CRITICAL — impact fiscal ou sécurité.

### Mois 1 (haut priorité)
Traiter les findings 🟠 HIGH d'effort XS/S/M — quick wins qui remontent significativement le score.

### Trimestre 1 (structurel)
Chantiers de fond : refactor Règle du Barrel, couverture tests critiques, unification RBAC.

### Backlog (moyenne/basse priorité)
Documentation, cleanups, amélioration UX/DX.

---

## Colophon

- **Outils** : audit statique via Read/Grep/Bash — pas d'exécution ni d'analyse dynamique. Certains findings sont probabilistes ; chaque référence fichier:ligne est à re-vérifier manuellement.
- **Limites** : audit sans instrumentation (pas de trace prod, pas de coverage réel exécuté, pas de bundle analyzer). Un audit dynamique complémentaire est recommandé.
- **Version** : rapport partiel v1 — sera mis à jour dès complétion des 6 dimensions manquantes.

