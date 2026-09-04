# Plan d’application de l’audit — MCC, verticales, tenants et piliers

> Destinataire : Claude (exécution). Ceci est une feuille de route de remédiation, pas une attestation de conformité. Les audits existants donnent le périmètre historique ; chaque état doit être re-mesuré sur l’arbre reçu avant une conclusion.

## 1. Objectif

RESTAURANT-OS-CORE doit fonctionner comme une plateforme B2B multi-tenant :

~~~mermaid
flowchart LR
  MCC[Console MCC : pilotage central] --> P[Provisionnement canonique]
  P --> C[Certificat de verticale]
  C --> B[Blueprint et capacités]
  B --> T[Tenant client isolé]
  T --> U[Piliers de base activés]
  MCC --> O[Support, gouvernance et observabilité]
  U --> E[Événements, données et intégrations]
~~~

Le restaurant est une verticale de référence, non l’unique produit. Une verticale ne peut être proposée à un client que si le blueprint, le seed, les droits, les routes, les événements, les intégrations et les obligations métier ont un niveau de preuve correspondant à sa maturité.

### Piliers de base inclus

| Pilier de base | Contrôle par verticale |
|---|---|
| Identité, RBAC, organisation, tenant et configuration | Portée MCC/tenant, rôle, source du tenant, réglages lus |
| Données, API et EventBus | Schémas, tenantId, événements, idempotence, DLQ, audit |
| Commande, vente, POS, paiement et encaissement | Parcours, droits, offline, double effet, paiement |
| Fiscalité, finance et comptabilité | Montants entiers, scellement, clôture et traçabilité |
| Salle, réservation, planning et opérations | Capacité pertinente, rôles, matériel et parcours réels |
| Cuisine, production, stock, recettes et achats | Déductions, unités, inventaire, fournisseurs et intégrité |
| CRM, fidélité, acquisition et communication | PII, consentement, intégrations et visibilité tenant |
| RH, temps, planning et paie | Rôles, données personnelles et piste d’audit |
| Reporting, analytics et prévisions | Lecture tenant, bornage, source et exposition MCC |
| Intégrations, matériel, offline et réseau | Secret, délai, retry, clé d’idempotence, reprise |
| Interface, i18n, accessibilité et responsive | Montage, traduction, réglage lu, handler et rôle |
| Conformité, sécurité et exploitation | NF525, HACCP si applicable, logs, sauvegarde, reprise |

Chaque verticale déclare pour chaque pilier : activé, bridge spécialisé, hors niveau ou non applicable avec justification. Une absence ne peut jamais être comblée par un bouton, un fallback ou un seed restaurant fictif.

### Invariants

- Le tenant côté serveur provient de l’identité et de la portée autorisée, jamais d’une entrée client ou d’un défaut global.
- La MCC administre et observe, mais ne contourne ni RBAC ni isolation des données.
- Une activation/provisioning incomplet conduit à un état FAILED ou BLOCKED, jamais à un client affiché comme prêt.
- Les faits financiers et fiscaux restent intacts : aucune suppression de journal, scellement ou clôture.
- Un effet asynchrone est unique par clé stable, traçable et rejouable sans double écriture.
- Aucun seuil, hook, test ou lint n’est assoupli pour faire passer une gate.

## 2. État observé : écarts prioritaires

Les points suivants sont ancrés dans les sources de l’annexe. Certains fichiers sont locaux/non suivis ou modifiés : ils décrivent le snapshot capturé, pas une base déjà intégrée.

1. Chaîne MCC → verticale → tenant. TenantProvisioningService provisionne le client B2B alors que ProvisioningEngine possède une autre séquence. TenantSeeder installe des données de référence restaurant. Ces responsabilités doivent converger vers une seule orchestration.
2. Succès de verticale non fiable. Le service de provisioning intercepte une erreur d’activation puis poursuit, et VerticalRegistry.resolve peut recourir à custom. SystemTenantRegistry déclare des variantes qui ne sont pas toutes inscrites dans le registre. Un client ne doit pas pouvoir être créé sur cette base.
3. Contexte tenant serveur. ServerTenantStorage associe AsyncLocalStorage à une projection globale, lue par SovereignGuard et NexusAdapter. Une preuve de deux requêtes serveur concurrentes et isolées est obligatoire.
4. Cron. La route tick lit un header personnalisé ou un secret d’URL. La documentation Vercel indique Authorization: Bearer CRON_SECRET ; le contrat doit être aligné et testé avant déploiement. CronScheduler.runDue n’expose pas de bail distribué dans le code vérifié.
5. EventBus et DLQ. Le guard d’idempotence fait vérifier puis traiter puis marquer ; deux workers peuvent franchir cette fenêtre. La DLQ et son retry doivent passer par une réservation atomique et une corrélation complète.
6. Gates et tests. Le préflight capture actuellement ESLint avant de poursuivre sur des contrôles ciblés ; le hook seul ne prouve donc pas un lint général. Les problèmes DNS/espace disque doivent être séparés du code et la suite rendue hermétique.
7. Réseau. SafeFetcher protège contre SSRF, mais son DNS direct rend les tests dépendants du réseau. Les transports/résolveurs doivent être injectables sans diminuer la sécurité.
8. Composants et dernier kilomètre. Les audits historiques sont des pistes, non une mesure actuelle. Le plan exige un inventaire généré de chaque route, composant, réglage, handler, événement et intégration.

## 3. Architecture cible et responsabilités

| Couche | Responsabilité | Garantie |
|---|---|---|
| MCC / control plane | Catalogue, certificat, provisioning, support, gouvernance, supervision | Guard MCC explicite et portée autorisée |
| Contrat de verticale | Blueprint L0–L3, capacités, routes, événements, matériel, contraintes | Pas de fallback silencieux client |
| Provisioning canonique | Machine d’états, seeding, RBAC, branding, plugins, reprise | Une seule orchestration et état honnête |
| Data plane tenant | Données, opérations et configurations du client | Tenant serveur authentifié, aucune valeur par défaut |
| Piliers de base | Capacités universelles et bridges spécialisés | Fonction activée, bridgée ou explicitement hors niveau |
| Asynchrone | Outbox/DLQ, cron, retry, idempotence, observabilité | Effet unique par clé tenant+événement+handler |

VerticalBlueprint reste la source de vérité de qualification L0–L3. Le niveau est un contrat d’exécution : il pilote les actions MCC disponibles et le droit de créer un tenant client.

## 4. GitNexus : limite constatée et méthode de preuve

L’index GitNexus consulté était à 185 commits derrière HEAD. Il a aidé à retrouver les familles EventBus, cron et guards, mais il n’est pas utilisé comme preuve d’impact ; un résultat d’impact vide est contredit par des routes locales non suivies. La couche PDG/runner locale n’était pas disponible pendant cette préparation.

Avant tout changement transversal, Claude doit réindexer le dépôt, analyser l’impact des symboles modifiés, vérifier le résultat dans les sources et tests, puis consigner l’impact dans le lot. Tant que l’index n’est pas actualisé, les lectures directes, rg et les tests ciblés font autorité. Une dépendance absente du graphe ne prouve pas son absence réelle.

## 5. Dépendances à recalculer après réindexation

- runWithServerTenant → guards, adaptateurs, route wrappers et accès aux données après await.
- TenantProvisioningService et ProvisioningEngine → points MCC/API/UI, écritures, plugins et seeds.
- VerticalRegistry.resolve → catalogue MCC, provisioning, seed, clonage et capacités UI.
- NexusEventBus.emit/emitDurable → handlers, ServerEventBus, DLQ, Ticket Z et effets financiers.
- CronScheduler.runDue et ServerDLQRetryJob → route tick, calendrier Vercel, jobs tenant et effets métiers.

## 6. Plan d’implémentation

### A. Inventaire produit obligatoire : composants, fonctionnalités et piliers

Créer un générateur versionné, par exemple docs/generated/PRODUCT-COVERAGE.md et son JSON source. Il contient une ligne par :

- route, page, endpoint API, worker et cron ;
- composant UI, écran qui le monte, réglage et lecteur effectif ;
- handler onX et invocation réelle ;
- clé i18n et locale ;
- événement, handler, effet, DLQ et job ;
- collection/ressource tenant, guard et rôle ;
- intégration, matériel, offline et fournisseur ;
- capacité de pilier et bridge de verticale.

Chaque ligne porte : propriétaire, verticale(s), niveau L0–L3, statut discovered/mapped/tested/certified/wip, chemin/route, rôle, dernière commande de preuve et test associé. Le statut wip exige propriétaire et échéance. C’est le mécanisme qui garantit la prise en compte de tous les composants et fonctionnalités, au lieu de prétendre les avoir relus sans preuve.

### B. Catalogue de verticales et certificat de disponibilité

Fichiers pivots : src/verticals/_shared/blueprint/VerticalBlueprint.ts, src/shared/plugins/VerticalRegistry.ts, src/lib/mcc/SystemTenantRegistry.ts.

1. Définir une résolution explicite : registered, supportedLevel, missingRequirements, fallbackReason.
2. Réserver un fallback éventuel aux aperçus/dev ; le provisioning client refuse toute verticale non enregistrée ou non certifiée.
3. Générer une matrice de parité : variante MCC, registre, blueprint, niveau, routes, événements, RBAC, initialiseur, seed, connecteurs, matériel, exigences et tests.
4. Pour chaque variante déclarée mais non enregistrée : l’implémenter au niveau vendu, la borner L0/L1 non provisionnable, ou la retirer du catalogue MCC.
5. Exposer un certificat exécutable à la MCC : l’action créer un client est possible seulement lorsque le certificat est complet.
6. Étendre les tests Forge et provisioning à la totalité de la matrice.

### C. Provisioning canonique et état honnête

Fichiers pivots : src/lib/mcc/provisioning/TenantProvisioningService.ts, src/lib/ProvisioningEngine.ts, src/lib/TenantSeeder.ts.

1. Faire de TenantProvisioningService la façade unique, ou extraire un orchestrateur unique consommé par les deux chemins.
2. Persister une machine d’états REQUESTED → VALIDATING → SEEDING → ACTIVATING → READY, avec FAILED et REQUIRES_ACTION.
3. Donner une clé d’idempotence à la demande et un journal par étape ; une reprise ne relance que ce qui est incomplet.
4. Bloquer le succès client si validation, seed requis, RBAC ou activation échouent.
5. Séparer le seed universel du seed par blueprint. Les zones/tables restaurant ne sont créées que si la capacité le demande.
6. Conserver un clonage par liste blanche : jamais de journal fiscal, scellement, document financier ou identifiant sensible d’un tenant de référence.
7. Afficher dans la MCC l’état, les erreurs corrélées, la version de blueprint et l’action de reprise autorisée.

### D. Frontière tenant serveur

Fichiers pivots : src/lib/server/ServerTenantStorage.ts, src/shared/nexus/guards/SovereignGuard.ts, src/lib/nexus/NexusAdapter.ts, route wrappers après inventaire.

1. Supprimer la projection mutable globalThis des décisions de données serveur.
2. Utiliser AsyncLocalStorage côté serveur ou injecter le contexte tenant explicitement ; ne pas importer de primitive Node dans le client.
3. Créer un wrapper unique : classification publique/MCC/tenant, auth, rôle, résolution de tenant depuis claims/portée, installation du contexte et réponse.
4. Migrer les routes par famille seulement après inventaire. Une route tenant sans contexte prouvé échoue ; aucune sélection tenant depuis query/body/header client.
5. Ajouter un test concurrent de deux tenants à travers plusieurs await, des tests de spoofing/refus et un test d’intégration de route. Le scan statique reste un filet, non la preuve principale.

### E. Idempotence durable, EventBus, DLQ et Ticket Z

Fichiers pivots : src/shared/eventBus/IdempotencyGuard.ts, src/shared/eventBus/NexusEventBus.ts, src/shared/eventBus/ServerEventBus.ts, src/shared/eventBus/mutationEvents.ts, src/lib/cron/ServerDLQRetryJob.ts.

1. Utiliser une clé stable tenantId + eventId + handlerId acquise par transaction/insert conditionnel réel.
2. Modéliser processing, completed, retryable et un bail expirant ; ne terminer qu’après l’effet durable.
3. Définir criticité, retry, cause/correlation id, erreur classifiée et destination DLQ pour chaque handler.
4. La DLQ doit stocker payload validé, tenant, handler ciblé, tentative et contexte, afin de rejouer sans rediffuser aveuglément.
5. Réindexer le graphe et vérifier les boucles event→handler→event avant activation.
6. Reproduire le cas Ticket Z, corriger le vrai chemin de persistance/scellement puis maintenir l’assertion de test.

### F. Cron authentifié, verrouillé et rattrapable

Fichiers pivots : src/app/api/cron/tick/route.ts, src/lib/cron/CronScheduler.ts, src/lib/cron/ServerDLQRetryJob.ts, configuration de déploiement à inventorier.

1. Écrire les tests avant le correctif : production accepte Authorization Bearer CRON_SECRET, rejette les secrets d’URL et ne les logue pas. Définir un développement local explicite.
2. Ajouter un bail distribué par job/fenêtre, avec expiration, propriétaire et corrélation, jamais un booléen mémoire.
3. Prévoir ticks doublés, ticks manqués, exécutions concurrentes et reprise de bail.
4. Mettre ce lot après l’idempotence durable : cron et DLQ rejouent des effets métier.

### G. Gates, tests et environnement déterministes

Fichiers pivots : scripts/preflight.sh, .githooks/pre-commit, scripts de mesure et suites concernées.

1. Séparer les contrôles informatifs des contrôles bloquants : une erreur ESLint applicable doit échouer au bon endroit.
2. Corriger les diagnostics dans le code ; aucune exemption, seuil augmenté, skip, suppression de test ou hook contourné.
3. Injecter horloge, DNS, transport, stockage et variables nécessaires ; les tests ne font aucune sortie Internet.
4. Qualifier la capacité CI avant suite lourde. Une limite disque/mémoire est une tâche d’infrastructure, pas une raison de masquer un test.
5. Utiliser pendant le développement : npm run measure, npx tsc --noEmit, npm run lint:fast, node scripts/gate-last-mile.mjs, tests ciblés. Réserver le préflight complet à la clôture.

### H. APIs, fournisseurs, données et observabilité

1. Générer un manifeste API : audience, guard, source tenant, rôle, rate limit, pagination, schéma, log d’audit et test.
2. Inventorier par fournisseur : appelant, données tenant, délai, annulation, retry permis, idempotency key, secret, mock et alerte.
3. Normaliser l’adaptateur réseau par fournisseur avec délai, classification d’erreur et redaction des secrets. Pas de retry de paiement sans clé fournisseur.
4. Préserver la sécurité SSRF de SafeFetcher, mais injecter résolveur/transport pour les tests.
5. Inventorier les représentations monétaires et migrer progressivement vers les microunités avec rétrocompatibilité. Aucun backfill ne réécrit un fait fiscal scellé.
6. Propager correlation id, tenant id, verticale/version et résultat dans provisioning, cron, EventBus/DLQ et fournisseurs ; mesurer backlog, lock, tentative, échec et latence.

### I. Piliers métier, UI, i18n, accessibilité et dernier kilomètre

Pour chaque pilier de base, remplir la fiche de couverture du lot A : cas d’usage, route atteignable, rôle, données tenant, événements, réglages lus, i18n, offline/matériel, conformité et test de parcours.

Les corrections UI doivent prouver : composant monté, réglage lu, libellé présent dans les locales, handler réellement invoqué, RBAC UI cohérent avec le serveur, accessibilité et responsive. Les travaux i18n/UI déjà actifs sont intégrés uniquement après coordination écrite dans .claude/sessions.md.

## 7. Ordre de livraison

| Ordre | Lot | Dépendances | Preuve de sortie |
|---:|---|---|---|
| 0 | Sessions, worktree, réindexation GitNexus, mesures | — | Baseline fraîche, propriétaires et périmètres |
| 1 | Générateur de couverture produits/piliers | 0 | Inventaire versionné de tout le périmètre |
| 2 | Frontière tenant serveur | 0, 1 | Tests concurrents et routes classifiées |
| 3 | Registre, blueprint et certificat de verticale | 0, 1 | Parité catalogue et refus sans certificat |
| 4 | Orchestrateur de provisioning | 2, 3 | États persistants, reprises sûres, seed conditionnel |
| 5 | EventBus, idempotence, DLQ et Ticket Z | 2 | Effet unique, reprise contrôlée, preuve Ticket Z |
| 6 | Cron | 5 | Auth, bail, rattrapage et tests de concurrence |
| 7 | Gates et environnement hermétique | 0, 5, 6 | Contrôles honnêtes et tests déterministes |
| 8 | APIs, fournisseurs et observabilité | 2, 7 | Manifeste, contrats et alertes testés |
| 9 | Données financières et piliers à risque | 2, 5, 7 | Migrations contrôlées et fiches de preuve |
| 10 | UI, i18n, a11y et responsive | 1, coordination active | Dernier kilomètre mesuré par écran |
| 11 | Certification verticale et recette MCC→tenant | 3–10 | Matrice L0–L3 et parcours complet |
| 12 | Clôture | tous | Preflight brut frais, impacts GitNexus et commits atomiques |

Chaque lot est un commit à chemins explicitement stageés. Aucun git add global, reset destructif ou écrasement de travail parallèle.

## 8. Tests à ajouter ou étendre

| Risque | Preuve |
|---|---|
| Fuite tenant | Test adjacent à ServerTenantStorage : deux tenants intercalés après plusieurs await, lecteurs guard/adapter et nettoyage final |
| Route MCC/tenant | Tests d’intégration : refus sans auth, rôle insuffisant, spoofing tenant, route publique sans accès tenant |
| Verticale incomplète | Extension de vertical-forge.test.ts et system-tenants-provisioning.test.ts à toute la matrice |
| Provisioning partiel | Tests état par état, reprise, seconde demande identique, activation en échec, seed non-restaurant, clonage sans fiscal |
| Double événement/DLQ | Extension de idempotency-guard.test.ts : concurrence, crash/bail, persistance simulée |
| Ticket Z | Extension de TicketZHandler.test.ts : persistance et scellement réels |
| Cron | Nouveau test de route : Bearer, refus, lock, double tick, fenêtre manquée et contexte tenant |
| SSRF/réseau | Résolveur/transport mockés : IP interdite, redirect, timeout, DNS sans Internet |
| Dernier kilomètre | npm run measure, gate last-mile et parcours visuels par pilier |

Séquence de feedback :

~~~bash
npm run measure
npx tsc --noEmit
npm run lint:fast
node scripts/gate-last-mile.mjs
node scripts/verify-gate-integrity.mjs
npx vitest run <tests-ciblés>
~~~

À la clôture finale seulement : suite complète et préflight complet avec sortie brute fraîche. Une sortie RTK résumée ne fonde aucune affirmation de certification.

## 9. Risques de déploiement

| Risque | Garde-fou |
|---|---|
| Fuite cross-tenant | Tests concurrents, refus par défaut, migration des routes par famille |
| Corruption fiscale | Machine d’états/reprise idempotente, transactions documentées, aucun effacement de fait scellé |
| Double effet cron | Idempotence avant cron, bail distribué, tests doublon/rattrapage |
| Fallback invisible | Certificat MCC et résolution stricte au provisioning |
| Pilier/composant oublié | Inventaire généré, mesure last-mile, fiche de preuve par verticale |
| Travail parallèle perdu | .claude/sessions.md, zones explicites, commits atomiques |
| Test flakey | Doubles DNS/temps/réseau et diagnostic CI séparé |
| Graphe périmé | Réindexation et vérification source avant toute conclusion |

## 10. Questions à trancher avant changements irréversibles

1. Quelle primitive de transaction/insert conditionnel est approuvée pour l’idempotence et les baux cron ?
2. Vercel est-il le déploiement de production du tick et CRON_SECRET y est-il configuré ?
3. Quelles variantes déclarées mais non enregistrées sont vendables maintenant, et lesquelles doivent rester L0/L1 ?
4. Quels piliers sont universels, bridgés ou explicitement exclus par verticale ?
5. Quelle capacité CI est allouée à la suite complète et au build ?

## 11. Définition de fin d’application

L’audit n’est considéré appliqué que lorsque :

- l’inventaire généré couvre chaque route, composant, réglage, handler, événement, intégration et pilier, avec preuve ou exclusion explicite ;
- une verticale MCC non enregistrée/non certifiée ne peut pas créer de client ;
- le contexte tenant serveur reste isolé sous concurrence et les routes sont classifiées/guardées ;
- le provisioning est unique, observable, reprenable et honnête sur ses erreurs ;
- EventBus, DLQ et cron sont idempotents, verrouillés et traçables ;
- les parcours fiscaux/Ticket Z préservent persistance et scellement ;
- APIs et fournisseurs ont des contrats testés sans réseau réel ;
- UI, i18n, accessibilité et dernier kilomètre sont mesurés par écran/pilier ;
- les contrôles ciblés, suite complète et préflight ont été exécutés en sortie brute sur l’arbre final, sans contournement.

## 12. Context

~~~yaml
implementation_context:
  task_summary: >-
    Appliquer l'audit complet comme feuille de route de plateforme multi-tenant :
    la MCC pilote des verticales certifiées qui provisionnent des clients isolés ;
    le restaurant est une référence, non la seule verticale.
  user_intent:
    - Le plan est destiné à être exécuté côté Claude.
    - La couverture inclut composants, fonctionnalités et piliers de base.
    - Aucune fausse précision : l'inventaire généré est obligatoire avant certification.
  scope:
    - control-plane MCC, provisioning, verticales et tenants
    - isolation serveur, RBAC, API et données tenant
    - EventBus, DLQ, cron, fiscalité, intégrations et observabilité
    - piliers métier, UI, i18n, accessibilité, tests, mesures et gates
  constraints:
    - Respecter AGENTS.md, ADR-015, NF525 et .claude/sessions.md.
    - Ne jamais relâcher une gate ni masquer une erreur/test.
    - Ne pas certifier depuis audit historique ou sortie RTK résumée.
    - Les fichiers locaux non suivis/modifiés listés ci-dessous restent à leur auteur jusqu'à intégration explicite.
  gitnexus_status:
    index_staleness: 185 commits behind HEAD during plan preparation
    pdg_status: unavailable locally; reindex and rerun before symbol edits
    authoritative_method_until_reindex: direct source verification plus targeted tests
  evidence_provenance_json: |
    {
      "schema_version": 2,
      "head_commit": "1ba23998590238f3316cf03440943a9cbdb600c8",
      "generated_plan_path": "docs/plans/2026-09-04-gitnexus-plan-audit-remediation-roadmap.md",
      "global_dirty_digest": {
        "algorithm": "sha256",
        "canonicalization": "gitnexus-evidence-provenance-v2 NUL-framed UTF-8 records",
        "value": "bbc708815708aab5c7163b38b67673b4fed106ec231542757963bb1a9519a995"
      },
      "cited_path_manifest": [
        {
          "path": ".githooks/pre-commit",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:faa3c0b5574ce8653eb86936be7ebca30436b4362c7c9d789da24c63f0931da3",
          "index_digest": "sha256:faa3c0b5574ce8653eb86936be7ebca30436b4362c7c9d789da24c63f0931da3",
          "worktree_digest": "sha256:faa3c0b5574ce8653eb86936be7ebca30436b4362c7c9d789da24c63f0931da3",
          "untracked_digest": "absent"
        },
        {
          "path": "docs/audits/AUDIT-HOLISTIQUE-360-2026-09-02.md",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:9af690faaf9adc6f5a5565487c1528f599c0756a9c4400d0b1c8f5cada31f286",
          "index_digest": "sha256:9af690faaf9adc6f5a5565487c1528f599c0756a9c4400d0b1c8f5cada31f286",
          "worktree_digest": "sha256:9af690faaf9adc6f5a5565487c1528f599c0756a9c4400d0b1c8f5cada31f286",
          "untracked_digest": "absent"
        },
        {
          "path": "package.json",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:9a7776c970fbbc76230da8fa6e0e8ee2ee7a49ae5b1f66f54581bba48b27df5f",
          "index_digest": "sha256:9a7776c970fbbc76230da8fa6e0e8ee2ee7a49ae5b1f66f54581bba48b27df5f",
          "worktree_digest": "sha256:9a7776c970fbbc76230da8fa6e0e8ee2ee7a49ae5b1f66f54581bba48b27df5f",
          "untracked_digest": "absent"
        },
        {
          "path": "scripts/preflight.sh",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:a252548eaec921d12363d0fd69ad709514a6db0bbe4777d1f066ab733ebe01dc",
          "index_digest": "sha256:a252548eaec921d12363d0fd69ad709514a6db0bbe4777d1f066ab733ebe01dc",
          "worktree_digest": "sha256:a252548eaec921d12363d0fd69ad709514a6db0bbe4777d1f066ab733ebe01dc",
          "untracked_digest": "absent"
        },
        {
          "path": "src/__tests__/eventBus/idempotency-guard.test.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "unstaged",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:2a1c00d1ea4e8d8110f8c5cfe8606361e33c067816c9abbf7f215658d9c2eae4",
          "index_digest": "sha256:2a1c00d1ea4e8d8110f8c5cfe8606361e33c067816c9abbf7f215658d9c2eae4",
          "worktree_digest": "sha256:3a697f1ebef5b00f9e48d27305d717273e788ad0e0f43411be4caaa45982230e",
          "untracked_digest": "absent"
        },
        {
          "path": "src/__tests__/forge/vertical-forge.test.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:469fd89445226caa1db62a4160c0607b1ad5e6e8e3a2899a210fce3382a9b555",
          "index_digest": "sha256:469fd89445226caa1db62a4160c0607b1ad5e6e8e3a2899a210fce3382a9b555",
          "worktree_digest": "sha256:469fd89445226caa1db62a4160c0607b1ad5e6e8e3a2899a210fce3382a9b555",
          "untracked_digest": "absent"
        },
        {
          "path": "src/__tests__/infrastructure/TicketZHandler.test.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:dfc418df8e1446a409ca02d89cd9c4fca1028c1a3309a2646162fd796d051893",
          "index_digest": "sha256:dfc418df8e1446a409ca02d89cd9c4fca1028c1a3309a2646162fd796d051893",
          "worktree_digest": "sha256:dfc418df8e1446a409ca02d89cd9c4fca1028c1a3309a2646162fd796d051893",
          "untracked_digest": "absent"
        },
        {
          "path": "src/__tests__/mcc/system-tenants-provisioning.test.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:326a3c60ca4fb6e2d615bdfa8b2d442694d032dbee4bef11a899920713073cdf",
          "index_digest": "sha256:326a3c60ca4fb6e2d615bdfa8b2d442694d032dbee4bef11a899920713073cdf",
          "worktree_digest": "sha256:326a3c60ca4fb6e2d615bdfa8b2d442694d032dbee4bef11a899920713073cdf",
          "untracked_digest": "absent"
        },
        {
          "path": "src/__tests__/security/multi-tenant-isolation.test.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:a709904065ea6847233748f962870a9f62e10441864b92fa224cd1fd83ab6f34",
          "index_digest": "sha256:a709904065ea6847233748f962870a9f62e10441864b92fa224cd1fd83ab6f34",
          "worktree_digest": "sha256:a709904065ea6847233748f962870a9f62e10441864b92fa224cd1fd83ab6f34",
          "untracked_digest": "absent"
        },
        {
          "path": "src/__tests__/security/tenant-isolation-invariant.test.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:971e8affbc4085447581fb154f15a5cd32ab28ab505f03bb36e17d4f2f84954e",
          "index_digest": "sha256:971e8affbc4085447581fb154f15a5cd32ab28ab505f03bb36e17d4f2f84954e",
          "worktree_digest": "sha256:971e8affbc4085447581fb154f15a5cd32ab28ab505f03bb36e17d4f2f84954e",
          "untracked_digest": "absent"
        },
        {
          "path": "src/__tests__/verticals/p4-tenant-seeder-branding.test.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:2d7d38e183af4fed18d5f26cd9144151eccf17f6ac4f917cc1e146291034627d",
          "index_digest": "sha256:2d7d38e183af4fed18d5f26cd9144151eccf17f6ac4f917cc1e146291034627d",
          "worktree_digest": "sha256:2d7d38e183af4fed18d5f26cd9144151eccf17f6ac4f917cc1e146291034627d",
          "untracked_digest": "absent"
        },
        {
          "path": "src/app/api/cron/tick/route.ts",
          "object_kind": {
            "head": "absent",
            "index": "absent",
            "worktree": "absent",
            "untracked": "regular"
          },
          "state": "untracked",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "absent",
          "index_digest": "absent",
          "worktree_digest": "absent",
          "untracked_digest": "sha256:0b7a86d6f07dc344c6abfa889001eccee897634cbb149a77d51c16157a7efd7f"
        },
        {
          "path": "src/lib/ProvisioningEngine.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:5e61d9a23a83374a3d429656dffab140230a2b16012b441bc901a99ba99e0f44",
          "index_digest": "sha256:5e61d9a23a83374a3d429656dffab140230a2b16012b441bc901a99ba99e0f44",
          "worktree_digest": "sha256:5e61d9a23a83374a3d429656dffab140230a2b16012b441bc901a99ba99e0f44",
          "untracked_digest": "absent"
        },
        {
          "path": "src/lib/TenantSeeder.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:58f9003d9c0c92499b6c658bd031bfc01d0222a872476d485a4b00deb548b232",
          "index_digest": "sha256:58f9003d9c0c92499b6c658bd031bfc01d0222a872476d485a4b00deb548b232",
          "worktree_digest": "sha256:58f9003d9c0c92499b6c658bd031bfc01d0222a872476d485a4b00deb548b232",
          "untracked_digest": "absent"
        },
        {
          "path": "src/lib/cron/CronScheduler.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "unstaged",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:b91c0690d32e42b5166a6a48e4418c0910670827db2f8994d1ab306e6552f789",
          "index_digest": "sha256:b91c0690d32e42b5166a6a48e4418c0910670827db2f8994d1ab306e6552f789",
          "worktree_digest": "sha256:4bc4f0f08fe7cff6e1739daccb0a5ec0052403ac9c5d422bf97b70e9fcb3ef67",
          "untracked_digest": "absent"
        },
        {
          "path": "src/lib/cron/ServerDLQRetryJob.ts",
          "object_kind": {
            "head": "absent",
            "index": "absent",
            "worktree": "absent",
            "untracked": "regular"
          },
          "state": "untracked",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "absent",
          "index_digest": "absent",
          "worktree_digest": "absent",
          "untracked_digest": "sha256:4ac0d9dda2ea9e3ac6c3d235e24f3f0fede157d0539a174aa253e7b62448f685"
        },
        {
          "path": "src/lib/cron/cronMatch.test.ts",
          "object_kind": {
            "head": "absent",
            "index": "absent",
            "worktree": "absent",
            "untracked": "regular"
          },
          "state": "untracked",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "absent",
          "index_digest": "absent",
          "worktree_digest": "absent",
          "untracked_digest": "sha256:30d7427f3f8331ff68e5a2e0e0f30895ce00641d719cdcf206e731d5855b5e7f"
        },
        {
          "path": "src/lib/mcc/SystemTenantRegistry.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:7e442961a216aa0c634452f4f2df99daa0c4c9453acf3a908b2db91473253dd4",
          "index_digest": "sha256:7e442961a216aa0c634452f4f2df99daa0c4c9453acf3a908b2db91473253dd4",
          "worktree_digest": "sha256:7e442961a216aa0c634452f4f2df99daa0c4c9453acf3a908b2db91473253dd4",
          "untracked_digest": "absent"
        },
        {
          "path": "src/lib/mcc/provisioning/TenantProvisioningService.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:6d5f55c883cb5d132c6756272928906458f95088aab4bf664506b92628b98c2e",
          "index_digest": "sha256:6d5f55c883cb5d132c6756272928906458f95088aab4bf664506b92628b98c2e",
          "worktree_digest": "sha256:6d5f55c883cb5d132c6756272928906458f95088aab4bf664506b92628b98c2e",
          "untracked_digest": "absent"
        },
        {
          "path": "src/lib/nexus/NexusAdapter.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:bff5117928c3a5cb321e53a9d1b8101f0d12f3f0721b2377aa8840fe81e6e7f2",
          "index_digest": "sha256:bff5117928c3a5cb321e53a9d1b8101f0d12f3f0721b2377aa8840fe81e6e7f2",
          "worktree_digest": "sha256:bff5117928c3a5cb321e53a9d1b8101f0d12f3f0721b2377aa8840fe81e6e7f2",
          "untracked_digest": "absent"
        },
        {
          "path": "src/lib/server/ServerTenantStorage.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:d93a3b2ae601eed3386886d486ce61f25f5c80416d53a3655d3d3c0fd259197b",
          "index_digest": "sha256:d93a3b2ae601eed3386886d486ce61f25f5c80416d53a3655d3d3c0fd259197b",
          "worktree_digest": "sha256:d93a3b2ae601eed3386886d486ce61f25f5c80416d53a3655d3d3c0fd259197b",
          "untracked_digest": "absent"
        },
        {
          "path": "src/modules/commerce/acquisition/onboarding/services/scrape/SafeFetcher.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:6e76737e640b0f6759df434a196a1fecdfc616deadb319d2cc4af1a0bb0e4d01",
          "index_digest": "sha256:6e76737e640b0f6759df434a196a1fecdfc616deadb319d2cc4af1a0bb0e4d01",
          "worktree_digest": "sha256:6e76737e640b0f6759df434a196a1fecdfc616deadb319d2cc4af1a0bb0e4d01",
          "untracked_digest": "absent"
        },
        {
          "path": "src/shared/eventBus/IdempotencyGuard.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "unstaged",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:53014ce52aeacd0ff95b3db63fbb8bed29185447a2f2a0d04078943f2eff4bba",
          "index_digest": "sha256:53014ce52aeacd0ff95b3db63fbb8bed29185447a2f2a0d04078943f2eff4bba",
          "worktree_digest": "sha256:46fafdc7380787a697b7827816ba3117a782ed7d6b1b39d29e5dd7f6128d5d49",
          "untracked_digest": "absent"
        },
        {
          "path": "src/shared/eventBus/NexusEventBus.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "unstaged",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:ef9b40d58e72558c4f34befe21a325b715b051138a8bbfd27388108abe7a9fe9",
          "index_digest": "sha256:ef9b40d58e72558c4f34befe21a325b715b051138a8bbfd27388108abe7a9fe9",
          "worktree_digest": "sha256:fc408e6b6374e37dd808e192628d3e43aa4deb57c836ade38f0aa3df5b3d0517",
          "untracked_digest": "absent"
        },
        {
          "path": "src/shared/eventBus/ServerEventBus.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:9c5d6eea483afa84706eea58f80cb6998418791683c8b1fb700f7da10f0a8709",
          "index_digest": "sha256:9c5d6eea483afa84706eea58f80cb6998418791683c8b1fb700f7da10f0a8709",
          "worktree_digest": "sha256:9c5d6eea483afa84706eea58f80cb6998418791683c8b1fb700f7da10f0a8709",
          "untracked_digest": "absent"
        },
        {
          "path": "src/shared/eventBus/mutationEvents.ts",
          "object_kind": {
            "head": "absent",
            "index": "absent",
            "worktree": "absent",
            "untracked": "regular"
          },
          "state": "untracked",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "absent",
          "index_digest": "absent",
          "worktree_digest": "absent",
          "untracked_digest": "sha256:f2eca91178799c1260d1dc03897061ff0bc6f2283a45c7ee9a5337cae4a2bec1"
        },
        {
          "path": "src/shared/nexus/guards/SovereignGuard.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "unstaged",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:fcc35ef040164efa7ddbd887e4f4fad3be61eb5b6a7e17c6267694552afdaafc",
          "index_digest": "sha256:fcc35ef040164efa7ddbd887e4f4fad3be61eb5b6a7e17c6267694552afdaafc",
          "worktree_digest": "sha256:dd54b7586d18d9c5b375befca45d9f291b51d5b4438e0a34db62984da2250050",
          "untracked_digest": "absent"
        },
        {
          "path": "src/shared/plugins/VerticalRegistry.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:f89ff275e12d3b4a8a4e946cbde5ad8daeb8d4b772f8d931f31f020a18bea7e7",
          "index_digest": "sha256:f89ff275e12d3b4a8a4e946cbde5ad8daeb8d4b772f8d931f31f020a18bea7e7",
          "worktree_digest": "sha256:f89ff275e12d3b4a8a4e946cbde5ad8daeb8d4b772f8d931f31f020a18bea7e7",
          "untracked_digest": "absent"
        },
        {
          "path": "src/verticals/_shared/blueprint/VerticalBlueprint.ts",
          "object_kind": {
            "head": "regular",
            "index": "regular",
            "worktree": "regular",
            "untracked": "absent"
          },
          "state": "clean",
          "rename_from": null,
          "rename_to": null,
          "head_digest": "sha256:c008eebdbf41472b90e2d40d6bc9530ac5933b5105f2565d4f14273e83834694",
          "index_digest": "sha256:c008eebdbf41472b90e2d40d6bc9530ac5933b5105f2565d4f14273e83834694",
          "worktree_digest": "sha256:c008eebdbf41472b90e2d40d6bc9530ac5933b5105f2565d4f14273e83834694",
          "untracked_digest": "absent"
        }
      ]
    }
~~~

