# ADR-001 : Normalisation Obligatoire de l'eventId & Idempotence par Défaut

- **Statut** : ACCEPTÉ
- **Date** : 2026-08-18
- **Auteurs** : Fleet Vanguard & Architecture Core

## 1. Contexte & Problématique
Dans un environnement d'encaissement et de gestion opérationnelle multi-caisse et multi-device (tablettes mobiles, bornes, TPE, serveurs de fond), des événements métier critiques (`order.placed`, `payment.completed`, `stock.deducted`, `fiscal.sealed`) transitent via le bus d'événements (`NexusEventBus`).

Sans clé d'idempotence déterministe unique (`eventId`) :
1. Les rejeux réseau ou la synchronisation d'outbox déconnectée provoquent des déductions d'inventaire en double ou des écritures comptables redondantes.
2. Les émissions concurrentes de la même famille d'événement risquent la collision ou le blocage anti-boucle aveugle.

## 2. Décision Architecturale
1. **Normalisation de l'eventId** : Tout événement émis via `NexusEventBus.emit()` ou `NexusEventBus.emitDurable()` possède obligatoirement un `eventId` de type chaîne non vide (généré automatiquement via `crypto.randomUUID()` s'il n'est pas fourni dans le payload).
2. **IdempotencyGuard par défaut sur CRITICAL** : Tout handler inscrit avec la priorité `CRITICAL` est automatiquement protégé par `IdempotencyGuard` (Invariant #1 de la Charte d'Ingénierie), mémorisant l'exécution en RAM, IndexedDB et Firestore/Nexus (`events_processed_log`).
3. **Circuit-Breaker inFlight par emissionId** : Le verrou anti-boucle `inFlight` est indexé par clé qualifiée `${eventName}:${eventId}` plutôt que par le seul nom d'événement, autorisant les émissions concurrentes de multiples caisses et tables sans contention.

## 3. Conséquences & Invariants
- **Garantie At-Least-Once / Exactly-Once Handlers** : Le transport assure la livraison et les handlers critiques garantissent une exécution exactement unique.
- **Zéro Régression Multi-Caisse** : Deux caisses ouvertes simultanément peuvent émettre `order.placed` en parallèle sans blocage mutuel.
