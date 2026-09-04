# Plan commun à jour — Remédiation architecture et industrialisation

Date : 2026-09-04  
Statut : **document canonique d’exécution**  
Public : Codex, Claude, Antigravity et mainteneurs humains

## 1. But produit

Restaurant OS est une plateforme SaaS multi-tenant pilotée depuis la MCC. Le restaurant est la verticale de référence ; chaque nouvelle verticale doit pouvoir être étudiée, déclarée, générée, provisionnée et exploitée sans modifier le noyau fiscal ni introduire un fallback silencieux vers une autre activité.

Le but de ce plan n’est ni de découper artificiellement le monolithe, ni de cocher des scripts. Il est de rendre démontrables ces propriétés :

1. un tenant ne peut jamais lire ou modifier les données d’un autre ;
2. la MCC ne peut livrer qu’une verticale réellement certifiée ;
3. une vente, un stock, une paie, un avoir ou une clôture ne sont jamais appliqués deux fois ;
4. les tâches planifiées et intégrations externes sont reprises de manière sûre ;
5. toute verticale peut être ouverte rapidement avec un contrat, des seeds, des rôles, des écrans et des preuves explicites.

## 2. Sources et règle de vérité

Ce document consolide :

- `docs/audits/AUDIT-ARCHITECTURE-BYTEBYTEGO-REAUDIT-2026-09-04.md` ;
- `docs/plans/2026-09-04-gitnexus-plan-audit-remediation-roadmap.md` ;
- les commits présents sur `chore/audit-remediation-sd101` au moment de la rédaction.

Les audits sont des photographies historiques. Une ligne est marquée **livrée** seulement si le correctif est présent dans l’historique courant ; elle n’est **certifiée** qu’après les preuves définies à la section 9 sur l’arbre final. Aucun chiffre historique ne doit être recopié comme vérité actuelle sans mesure fraîche.

## 3. État consolidé

| Domaine | État | Ce qui est déjà intégré | Ce qui manque réellement |
|---|---|---|---|
| EventBus | partiellement durci | eventId métier, handlers de mutation idempotents par défaut, DLQ avec jitter, correlation-id, appariement strict | réservation persistante et atomique multi-worker ; test de compétition sur stockage partagé |
| Cron | exécutable | tick durable, `runDue`, DLQ serveur, Grand Total fiscal câblé | contrat Vercel Bearer, aucun secret en URL, verrou distribué et rattrapage démontré |
| Tenants | cœur corrigé | contexte par requête, whitelist d’isolation, protections MCC/rate-limit | branchement obligatoire aux entrées de toutes les familles de routes et refus sans contexte |
| APIs | progrès ciblé | helper cursor, listes MCC/tenant/opérationnelles ciblées, rate-limit login | manifeste de routes, couverture pagination/rate-limit, middleware de corrélation |
| Fournisseurs | progrès ciblé | Stripe centralisé avec délai/retry bornés ; plusieurs appels externes bornés | fournisseurs Open Banking, comptabilité, Gmail et e-facturation à normaliser avec tests sans réseau |
| Finance/fiscal | cœur préservé | sceau non modifié ; `order.paid` attendu ; KDS conservé ; Stripe BillingService centralisé | migration monétaire contrôlée, fournisseurs finance, tests E2E de reprise et d’absence de double écriture |
| Verticales | socle présent | blueprints, forge, bridges gym/coworking/florist/vétérinaire | certificat de disponibilité, statut produit par verticale, provisioning strict et seeds par capacités |
| Qualité/gates | renforcée | bootstrap, idempotence et appariement strict dans preflight ; dernier kilomètre | resserrer uniquement les seuils déjà en baisse après mesure ; test E2E parcours métier |

## 4. Ordre impératif de livraison

Les phases 0 à 3 empêchent une fausse promesse de plateforme. Les phases 4 à 6 améliorent la capacité à opérer et à ouvrir de nouvelles verticales. Les phases 7 et 8 sont des décisions de produit ou d’infrastructure : elles ne doivent pas être simulées par du code.

### Phase 0 — Préparer une exécution sûre

**Objectif :** repartir d’une branche lisible et d’un inventaire généré.

- Relire les commits de remédiation, ouvrir la PR et ne pas mélanger de nouvelles fonctionnalités avec les correctifs structurels.
- Générer l’inventaire de routes, événements, handlers, intégrations, verticales et réglages ; chaque élément doit être classé `certifié`, `en cours`, `non applicable` ou `non commercialisable`.
- Réindexer GitNexus/Graphify avant les modifications transversales, puis utiliser les résultats pour les analyses d’impact.
- Ajouter un registre des décisions irréversibles : moteur de persistance, Vercel cron, observabilité, statut commercial des verticales, migration Firestore/Postgres.

**Sortie :** un inventaire versionné et une PR de remédiation relisible.

### Phase 1 — Isoler les tenants à l’entrée serveur

**Priorité : P0. Bloque l’ouverture large de nouveaux clients.**

1. Créer un wrapper de route unique par audience : publique, tenant, MCC et webhook signé.
2. Déduire `tenantId` uniquement d’un claim, d’un sous-domaine vérifié ou d’une signature vérifiée ; ne jamais le prendre du body sans comparaison.
3. Installer `runWithServerTenant` à chaque entrée tenant et supprimer tout fallback serveur vers le store client/tenant par défaut.
4. Imposer un refus explicite lorsqu’une route tenant n’a pas de contexte.
5. Ajouter des tests de requêtes concurrentes entrelacées, y compris après plusieurs `await` et dans les routes MCC/support.

**Preuve de fin :** test concurrent vert ; toutes les routes du manifeste ont une audience et une source de tenant ; aucune lecture serveur ne dépend d’un état global mutable.

### Phase 2 — Rendre les effets métier atomiques et rejouables

**Priorité : P0. Finance, stock, paie, fidélité et Ticket Z.**

1. Choisir la primitive de persistance : transaction ou insert conditionnel partagé par tous les workers.
2. Persister la clé `(tenantId, eventId, handlerId)` avant l’effet, avec états `leased`, `completed`, `failed` et expiration de bail.
3. Raccorder l’adaptateur de persistance de l’IdempotencyGuard au chemin serveur réel.
4. Inventorier les handlers ayant déjà leur propre idempotence afin d’éviter le double emballage.
5. Créer des tests de compétition : deux workers, reprise DLQ, double tick cron et crash après réservation.
6. Conserver le principe fiscal : aucune correction d’écriture scellée ; erreur et reprise via écriture compensatrice ou rejeu idempotent.

**Preuve de fin :** chaque événement de mutation possède un test de rejeu concurrent démontrant un seul effet persistant.

### Phase 3 — MCC et provisioning honnêtes

**Priorité : P0. Condition pour vendre une nouvelle verticale.**

1. Remplacer les deux orchestrateurs de provisioning par une orchestration canonique persistée.
2. Définir les états : `draft`, `validating`, `provisioning`, `ready`, `failed`, `repairing`, `suspended`.
3. Rendre l’activation de verticale bloquante : aucun `ready` après un échec de plugin, blueprint, RBAC, seed, matériel ou obligation métier.
4. Produire un certificat de disponibilité : plugin enregistré, blueprint valide, seeds, routes, rôles, événements, matériel, obligations et tests.
5. Générer les seeds à partir des capacités déclarées par le blueprint. Aucun plan de salle/menu restaurant par défaut hors verticale qui le déclare.
6. Prévoir une reprise idempotente par étape et un journal MCC exploitable.

**Preuve de fin :** une verticale non certifiée ne peut pas être sélectionnée dans la MCC ; deux reprises du même provisioning ne créent pas de doublons.

### Phase 4 — Cron, sécurité API et exploitation

**Priorité : P1, P0 avant montée en charge.**

1. Accepter `Authorization: Bearer ${CRON_SECRET}` pour les crons Vercel et retirer les secrets des query strings.
2. Utiliser une comparaison sûre de secret et un verrou distribué par `(job, tenant, fenêtre)`.
3. Enregistrer l’exécution et permettre le rattrapage contrôlé d’une fenêtre manquée.
4. Construire le manifeste API : audience, guard, rôle, source tenant, pagination, limite, schéma, idempotency key et test associé.
5. Ajouter un middleware `correlation-id` propagé aux logs, EventBus, tâches cron, DLQ et fournisseurs.
6. Terminer la pagination puis le rate-limit famille par famille ; les routes d’agrégation doivent être traitées séparément si leur contrat ne se prête pas au cursor standard.

**Preuve de fin :** tests Bearer, tick doublé, fenêtre manquée et bail expiré ; chaque route du manifeste est couverte par un test de contrat.

### Phase 5 — Politique unique des intégrations et finance

**Priorité : P1.**

1. Établir un adaptateur commun : timeout, classification d’erreur, redaction, retry et clé d’idempotence fournisseur.
2. N’autoriser les retries de mutation externe que si le fournisseur reçoit une clé idempotente vérifiée.
3. Migrer Open Banking (Bridge, Powens, Qonto, Tink, GoCardless), Pennylane, Gmail et e-facturation vers cette politique.
4. Conserver les protections SSRF de scraping ; injecter transport/résolveur dans les tests plutôt que dépendre du réseau.
5. Migrer les usages restants `InCents` vers les microunits par petits lots, en testant à chaque commit l’égalité exacte des totaux avant/après.
6. Éliminer les flottants utilisés pour les totaux, TVA, grand livre et rapprochements ; les conversions d’affichage restent explicitement séparées du calcul.

**Preuve de fin :** tests sans réseau pour chaque fournisseur ; aucun retry de paiement/écriture sans idempotency key ; invariants de conservation de total pour chaque migration monétaire.

### Phase 6 — Industrialiser les verticales

**Priorité : P1 produit.**

1. Définir pour chaque verticale son niveau : `L0 catalogue`, `L1 prototype`, `L2 interne`, `L3 commercialisable`.
2. Déclarer une matrice : capacités, routes, données, rôles, événements, matériel, intégrations, conformité, dashboard et tests.
3. Étendre Vertical Forge pour générer le squelette, puis interdire la certification tant que la matrice n’est pas complète.
4. Garder le noyau fiscal universel ; les écarts métier passent par adapters et événements typés.
5. Pour le sur-mesure, définir une voie gouvernée : blueprint signé, capacités autorisées, migrations et révocation.

**Preuve de fin :** l’ouverture d’une nouvelle activité produit un plan de génération, un certificat et un tenant de démonstration sans contamination restaurant.

### Phase 7 — Expérience, accessibilité et dette mesurée

**Priorité : P2.**

- Résorber les chaînes métier non traduites et les couleurs en dur sans augmenter les cliquets.
- Ajouter des tests E2E de parcours : onboarding MCC, prise de commande, paiement, Ticket Z, reprise offline, réservation et flux d’une verticale non restaurant.
- Analyser le bundle et réduire les gros chunks réels ; ne pas augmenter le seuil pour masquer le problème.

### Phase 8 — Décisions humaines obligatoires

| Décision | Pourquoi elle ne doit pas être devinée | Effet sur le plan |
|---|---|---|
| Persistance d’idempotence/verrous | dépend de l’architecture de données et du coût opérationnel | débloque phases 2 et 4 |
| Déploiement Vercel cron | exige que les secrets et la fréquence soient configurés en production | finalise phase 4 |
| Statut commercial des verticales | évite de vendre un scaffold comme un produit | finalise phase 3 et 6 |
| Observabilité | Sentry, OpenTelemetry ou autre affecte budget, PII et exploitation | finalise phase 4/5 |
| Firestore vers Postgres | migration de données, coût et fenêtres de maintenance | chantier séparé après phases 1 à 5 |

## 5. Règles d’exécution pour les agents

- Lire et mettre à jour `.claude/sessions.md` avant toute écriture ; périmètres explicites, commits atomiques.
- Une phase ne commence pas si elle contourne une gate ou nécessite de modifier un sceau fiscal historique.
- Chaque modification d’événement, de route ou de schéma inclut l’analyse des impacts : EventBus, RBAC, tenant, offline, fiscalité et rétrocompatibilité.
- Les migrations monétaires sont limitées à un pilier par commit et incluent l’invariant `total avant === total après` à l’unité de microunit.
- Une verticale est `@wip` avec propriétaire/échéance ou explicitement non provisionnable ; elle n’est jamais silencieusement mappée vers `custom`.

## 6. Jalons de livraison

| Jalon | Résultat livré |
|---|---|
| M1 — Frontières sûres | tenant serveur, idempotence persistante et cron verrouillé |
| M2 — MCC fiable | provisioning unique et certificat de disponibilité |
| M3 — Plateforme opérable | manifeste API, corrélation, fournisseurs résilients et observabilité choisie |
| M4 — Forge commerciale | verticales classifiées, certificats, génération et seeds par capacités |
| M5 — Certification | E2E, audit final, mesures fraîches et préflight brut de l’arbre de release |

## 7. Définition finale de « fait »

Le programme n’est terminé que lorsqu’un ré-audit frais peut démontrer : isolation tenant sous concurrence, absence de double effet métier, provisioning honnête, cron sécurisé/rejouable, contrat de chaque route et fournisseur, verticales réellement classifiées, et parcours E2E des actions fiscales et opérationnelles critiques. Les audits initiaux et les commits intermédiaires ne remplacent pas cette preuve finale.
