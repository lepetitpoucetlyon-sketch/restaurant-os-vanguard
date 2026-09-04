# Ré-audit d’architecture — référentiel ByteByteGo System Design 101

Date : 2026-09-04  
Nature : lecture et mesures fraîches ; aucun changement applicatif dans cette session.

## Verdict simple

Le projet possède déjà un socle produit très large et des gardes de qualité utiles. Il n’est toutefois pas encore sûr de le présenter comme une plateforme multi-tenant industrialisée de bout en bout.

Les risques les plus importants ne sont pas dans l’interface ou le typage : ils se situent à la frontière serveur des tenants, dans le provisioning MCC, dans l’idempotence réellement persistante des effets financiers, et dans l’exécution planifiée.

Le résultat attendu n’est pas de remplacer le monolithe par des microservices. Le référentiel ByteByteGo sert ici de grille de conception : contrats d’API, frontières de données, tolérance aux pannes, verrous, idempotence, observabilité, paiements et exploitabilité. Une architecture modulaire unique peut très bien satisfaire ces critères.

## Référentiel et méthode

Le référentiel comparé est [ByteByteGoHq/system-design-101](https://github.com/ByteByteGoHq/system-design-101), commit local `b28380a4710c5ec9638ec037d4168e288f334cba`. Il couvre notamment les APIs, systèmes distribués, stockage, paiements, sécurité, cache/performance, CI/CD et architecture logicielle.

Graphify a mesuré les corpus avant analyse :

| Corpus | Fichiers | Mots approximatifs | Observation |
|---|---:|---:|---|
| Restaurant OS | 4 464 | 3 424 808 | 3 fichiers sensibles exclus automatiquement ; analyse découpée par couches et points critiques |
| ByteByteGo | 422 | 129 240 | 419 documents de référence et 1 image |

Le corpus applicatif dépasse le seuil de lecture sémantique monolithique. Le rapport n’affirme donc pas une relecture humaine de chaque ligne : il combine l’inventaire, les mesures automatisées, les sources critiques, les tests ciblés et la recherche de dépendances. Les zones restant à cartographier ligne par ligne sont nommées comme telles.

### Commandes exécutées dans cette session

| Commande | Résultat observé |
|---|---|
| `npm run measure` | 3 421 fichiers analysés en 30 832 ms ; résultats détaillés ci-dessous |
| `npx tsc --noEmit` | sortie brute sans diagnostic, code de sortie 0 |
| `npm run lint:fast` | oxlint sur `src/`, code de sortie 0 |
| `node scripts/gate-last-mile.mjs` | tous les cliquets bloquants de dernier kilomètre à leur seuil ou sous celui-ci |
| `node scripts/verify-gate-integrity.mjs` | intégrité des gates confirmée par le script |
| Vitest ciblé tenant/EventBus/cron/provisioning | 5 fichiers et 24 tests passés en 6,24 s |

Ces résultats ne constituent pas un préflight complet ni une certification de l’arbre courant.

## Ce qui est objectivement en place

### Qualité de dernier kilomètre

La mesure fraîche ne détecte aucun composant orphelin, réglage non lu, clé i18n manquante, handler inerte, scellement non canonique, métrique factice, écran de verticale rendu par un stub ou écran de verticale sans câblage données. Les valeurs informatives restantes sont : une largeur fixe responsive, 6 noms de composants dupliqués, 593 chaînes françaises en dur et 758 couleurs codées en dur. Ces deux derniers compteurs sont dans leurs seuils actuels ; ils restent une dette de cohérence, pas une preuve d’absence de dette.

### Durabilité fonctionnelle déjà amorcée

- Une route durable de tick cron existe et appelle le planificateur : `src/app/api/cron/tick/route.ts`.
- Une reprise serveur de DLQ existe : `src/lib/cron/ServerDLQRetryJob.ts`.
- Le registre `src/shared/eventBus/mutationEvents.ts` déclare 28 événements qui impliquent argent, stock ou paie ; le bus applique désormais l’enveloppe d’idempotence par défaut à leurs handlers.
- Les tenants système sont listés pour les 12 variantes déclarées dans `src/lib/mcc/SystemTenantRegistry.ts`.
- Les tests ciblés de sécurité tenant, idempotence, matching cron et provisioning système s’exécutent actuellement sans échec.

Ces éléments réduisent des risques réels, mais les sections suivantes montrent les maillons encore manquants entre l’intention et l’exécution serveur.

## Écarts critiques

### P0 — Contexte tenant serveur : primitive présente, mais non branchée

`src/lib/server/ServerTenantStorage.ts:41` expose `runWithServerTenant`, mais une recherche fraîche dans `src/app` et `src/__tests__` ne trouve aucun appel. La recherche globale ne retourne que la définition et des commentaires.

Le contexte contient encore une projection mutable `globalThis.__nexusServerTenant` (`ServerTenantStorage.ts:31-48`), lue par `src/lib/nexus/NexusAdapter.ts:109-110` et par le guard tenant (`src/shared/nexus/guards/SovereignGuard.ts:38-40`). Après un `await`, seule l’AsyncLocalStorage peut conserver une portée de requête correcte ; or les lecteurs opérationnels consultent la projection globale. Le guard prévoit aussi un fallback vers un état client ou un tenant par défaut quand le contexte n’est pas installé.

**Risque :** la frontière qui doit lier authentification, rôle et tenant n’est pas appliquée à l’entrée des routes. Ce rapport ne prétend pas avoir reproduit une fuite de données, mais l’absence de branchement rend l’isolement serveur non démontré et rend les comportements de fallback dangereux.

**À faire avant extension client :** wrapper unique de route publique/MCC/tenant, tenant issu des claims autorisés, accès serveur via AsyncLocalStorage ou contexte injecté, refus sans contexte, et test de deux requêtes concurrentes entrelacées après plusieurs `await`.

### P0 — Provisioning MCC : un client peut être déclaré prêt malgré une verticale incomplète

Le catalogue déclare 12 variantes dans `src/kernel/contracts/tenant.ts:6-19`, mais `src/shared/plugins/VerticalRegistry.ts:43-50` n’enregistre que 8 plugins. Pour une variante absente, `VerticalRegistry.resolve` bascule vers `custom` et journalise seulement un avertissement (`VerticalRegistry.ts:25-34`).

Les deux orchestrateurs `src/lib/mcc/provisioning/TenantProvisioningService.ts` et `src/lib/ProvisioningEngine.ts` dupliquent seeding, RBAC, activation verticale, branding et services annexes. Chacun intercepte l’échec d’activation de verticale et poursuit (`TenantProvisioningService.ts:111-123`, `ProvisioningEngine.ts:132-147`). Le premier retourne ensuite le statut `SUCCESS` (`TenantProvisioningService.ts:171`).

`src/lib/TenantSeeder.ts:181-253` ajoute par défaut sol, zones et tables de restauration avant de conditionner seulement le menu démo aux variantes food. Ce seed doit devenir déclaratif par blueprint, pas seulement par variante en dur.

**Risque :** la MCC peut provisionner une verticale annoncée mais incomplète, avec un fallback ou des données restaurant incompatibles. C’est un problème de vérité produit autant que de fiabilité technique.

**À faire :** résolution stricte pour un tenant client, certificat de disponibilité par verticale, machine d’états persistée, orchestration unique, reprise idempotente et seeds guidés par les capacités du blueprint.

### P0 — Idempotence serveur : contrat renforcé, persistance et atomicité absentes

Le progrès est réel : `NexusEventBus.on` rend idempotents par défaut les handlers critiques et les événements du registre de mutation (`src/shared/eventBus/NexusEventBus.ts:49-72`).

Mais `IdempotencyGuard.withIdempotencyGuard` conserve le schéma « vérifier → exécuter l’effet → marquer traité » (`src/shared/eventBus/IdempotencyGuard.ts:158-168`). Deux workers peuvent donc valider la même clé avant l’écriture finale. La persistance optionnelle est encore plus préoccupante : `setEventBusPersistenceAdapter` n’apparaît qu’à sa propre définition dans tout `src`, donc l’adaptateur de persistance n’est pas raccordé au chemin serveur actuel.

**Risque :** un retry concurrent, une DLQ ou deux ticks peuvent encore entraîner un effet financier, stock ou paie en double malgré le registre d’événements. Les tests ciblés valident l’implémentation locale actuelle ; ils ne prouvent pas une réservation transactionnelle multi-worker.

**À faire :** clé tenantId + eventId + handlerId, acquisition transactionnelle ou insert conditionnel avant effet, état de bail/reprise et test de compétition sur stockage partagé. Les handlers qui ont leur propre idempotence doivent être inventoriés pour éviter le double emballage.

### P0 — Secret d’administration généré et écrit dans les logs

Quand un PIN administrateur est manquant ou faible, `src/lib/TenantSeeder.ts:72-80` génère un PIN puis le concatène dans un message `logger.warn`. Le commentaire confirme que le PIN généré est journalisé.

**Risque :** tout lecteur des logs applicatifs ou d’un export de télémétrie peut obtenir un secret de connexion administrateur.

**À faire immédiatement :** ne jamais logger le PIN. Remplacer le flux par une invitation de configuration, un lien à durée limitée ou un canal de remise séparé ; invalider/régénérer les secrets possiblement exposés selon la rétention de logs.

## Écarts importants

### P1 — Cron : déclencheur ajouté, contrat Vercel et concurrence non traités

La route tick lit `x-vercel-cron-signature`, `x-cron-secret` ou le paramètre URL `secret` (`src/app/api/cron/tick/route.ts:18-26`). Le contrat documenté par Vercel pour `CRON_SECRET` est `Authorization: Bearer <secret>`, et l’URL ne doit pas transporter un secret. La même forme est présente dans les routes daily-backup et weekly-report.

`CronScheduler.runDue` liste les tenants puis lance chaque job dû, sans bail distribué ni enregistrement d’exécution par job/fenêtre (`src/lib/cron/CronScheduler.ts:71-96`). `ServerDLQRetryJob` peut rediffuser des événements depuis la DLQ toutes les cinq minutes.

**Risque :** en production, le tick peut être rejeté malgré un secret correctement configuré ; deux invocations concurrentes ou une reprise peuvent exécuter deux fois une tâche. Les jobs individuels peuvent offrir une défense partielle, mais elle n’est pas une garantie centrale vérifiée.

**À faire :** test de contrat Authorization Bearer, retrait du secret de query string, comparaison sûre, bail distribué par job/tenant/fenêtre et tests de tick doublé, fenêtre manquée et bail expiré.

### P1 — APIs : contrôle de volume et traçage hétérogènes

Un scan reproductible trouve 222 fichiers `route.ts` sous `src/app/api`. Il trouve 16 routes avec un signal statique de rate-limit, 12 avec un signal de pagination, 180 avec un signal d’authentification ou de signature. Ces nombres ne déterminent pas à eux seuls si une route est correctement gardée ; ils montrent que l’approche n’est pas centralisée et exigent une revue par famille de routes.

La même mesure trouve 0 occurrence de `correlationId`, `x-request-id` ou `X-Request-Id` dans les routes API. Sans identifiant de corrélation, relier une requête à une tâche cron, une émission, une DLQ, Stripe et une action MCC reste coûteux en incident.

**À faire :** manifeste de routes (audience, guard, rôle, tenant source, limite, pagination, schéma et test), middleware de corrélation, et migration famille par famille. Ne pas déduire l’absence de protection d’une simple recherche de texte.

### P1 — Intégrations externes : politiques non uniformes

La recherche fraîche dénombre 16 constructions de client Stripe dans `src`. Plusieurs fournisseurs HTTP possèdent des délais explicites, mais les clients Stripe et les appels externes ne partagent pas une politique visible unique de délai, retry, idempotency key, classification d’erreur et redaction des secrets.

**À faire :** inventaire par fournisseur, adaptateur avec budget de délai/retry, retry autorisé seulement lorsqu’une clé d’idempotence fournisseur est présente, et tests sans réseau réel. Conserver les protections SSRF déjà présentes dans SafeFetcher tout en injectant résolveur et transport en test.

### P1 — Couverture des verticales : catalogue, UI et données doivent converger

La structure contient 13 dossiers sous `src/verticals` et 12 variantes publiques. Les cliquets de mesure ne détectent pas de stub ou écran de verticale non câblé, ce qui est positif pour leurs règles précises. Cela ne prouve pas qu’une verticale est commercialisable : il manque un certificat qui relie catalogue, plugin enregistré, blueprint, seed, routes, RBAC, événements, matériel, obligations et tests.

Les quatre variantes non enregistrées ne doivent pas devenir des clients via un fallback. Elles doivent être explicitement L0/L1 non provisionnables, achevées au niveau vendu, ou retirées du catalogue MCC.

## Lecture par pilier

| Pilier | Situation observée | Priorité |
|---|---|---|
| Tenant, identité et RBAC | Guards et tests existent ; contexte par requête non branché | P0 |
| Données et EventBus | Registre de mutations et DLQ serveur présents ; réservation persistante non raccordée/non atomique | P0 |
| Commande, paiement et encaissement | Protections de bus améliorées ; risque de double effet sous concurrence à fermer | P0 |
| Fiscalité et finance | Cliquet de scellement canonique à zéro ; éviter tout retry non transactionnel | P0 |
| Provisioning MCC | Deux flux et activation best-effort | P0 |
| Cron et exploitation | Route et reprise DLQ existent ; auth, lock et rattrapage central manquent | P1, P0 avant activation large |
| Stock, cuisine, salle et opérations | Mesures de dernier kilomètre propres ; audit de concurrence des mutations à étendre | P1 |
| API, sécurité et intégrations | Guards présents mais hétérogènes ; rate-limit, pagination et corrélation à normaliser | P1 |
| UI, i18n, a11y et responsive | Cliquets bloquants respectés ; chaînes/couleurs en dur restent une dette mesurée | P2 |
| Verticales | Structure et tenants système présents ; parité plugin/blueprint/provisioning non certifiée | P0 produit |
| Analytics, IA et support | Pas de corrélation route→événement→fournisseur démontrée dans les routes API | P1 |
| Déploiement et qualité | Typecheck, lint rapide et tests ciblés réussissent ; préflight complet non exécuté dans cette session | P2 |

## Ordre de correction recommandé

1. Stopper le log de PIN généré et traiter les secrets potentiellement exposés.
2. Câbler la frontière tenant à chaque famille de routes et ajouter le test concurrent multi-tenant.
3. Raccorder un stockage d’idempotence serveur et le rendre atomique avant effet ; ne pas activer davantage de replays avant cette étape.
4. Rendre le provisioning MCC strict : une seule orchestration, un état de préparation persistant, pas de succès après une activation de verticale échouée.
5. Corriger les crons : Authorization Bearer, sans secret d’URL, bail distribué et tests de concurrence.
6. Construire le manifeste API et la corrélation, puis normaliser pagination, rate limiting et politique fournisseur.
7. Produire la matrice de certification des verticales et la fiche de couverture de chaque pilier.
8. Réduire ensuite les dettes UI/i18n/couleurs sans relâcher les seuils existants.

## Limites et prochaines preuves nécessaires

- L’index GitNexus était en retard de 185 commits et son analyse n’a pas pu être rafraîchie dans cette session : l’accès au registre npm échouait par DNS. Les conclusions de dépendance sont donc fondées sur les sources et tests, non sur un graphe à jour.
- Cet audit ne réalise pas un test E2E fiscal ou de paiement réel ; il identifie les conditions d’architecture à vérifier avant un tel test.
- La protection réelle de chaque API doit être établie par le manifeste et les tests de route, pas par le seul scan de motifs.
- Après les correctifs P0/P1, réexécuter les mesures, les tests ciblés, la suite complète et le préflight complet en sortie brute avant toute déclaration de livraison.

## Sources principales

- [Référentiel ByteByteGo System Design 101](https://github.com/ByteByteGoHq/system-design-101)
- `src/lib/server/ServerTenantStorage.ts`
- `src/shared/nexus/guards/SovereignGuard.ts`
- `src/lib/nexus/NexusAdapter.ts`
- `src/lib/mcc/provisioning/TenantProvisioningService.ts`
- `src/lib/ProvisioningEngine.ts`
- `src/lib/TenantSeeder.ts`
- `src/shared/plugins/VerticalRegistry.ts`
- `src/shared/eventBus/IdempotencyGuard.ts`
- `src/shared/eventBus/NexusEventBus.ts`
- `src/app/api/cron/tick/route.ts`
- `src/lib/cron/CronScheduler.ts`
