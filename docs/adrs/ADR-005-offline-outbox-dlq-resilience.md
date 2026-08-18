# ADR-005 : Résilience Déconnectée, Outbox Atomique & Dead Letter Queue (DLQ)

- **Statut** : ACCEPTÉ
- **Date** : 2026-08-18
- **Auteurs** : Fleet Vanguard & Operations Advisor

## 1. Contexte & Problématique
Les opérations en restaurant (prise de commande en salle, encaissement, bons de préparation KDS) doivent continuer à fonctionner même lors de coupures réseau Internet ou de latence extrême.

Le risque de perte d'événements lors d'un crash avant synchronisation ou de blocage en boucle sur des erreurs de handler nécessitait un mécanisme de résilience de grade industriel.

## 2. Décision Architecturale
1. **Event Outbox Durable (`emitDurable`)** :
   - Tout événement critique émis en mode hors-ligne ou connecté est d'abord persisté dans IndexedDB (`db.busOutbox`) avec le statut `pending` avant son dispatch en mémoire.
   - Dès la résolution des handlers, l'enregistrement Outbox passe à `done`.
   - Lors de la reconnexion ou du redémarrage applicatif, le moteur de rejeu déduplique les événements déjà traités pour éviter toute double exécution.
2. **Dead Letter Queue Multi-Niveau (Client & Serveur)** :
   - Côté client : les handlers rejetés enregistrent une entrée dans `db.deadLetterEvents` avec statut `retry`, horodatage d'échec et backoff exponentiel (`nextRetryAt`).
   - Côté serveur : `dispatchServerEvent()` capture les échecs critiques et les consigne sous `tenants/${tenantId}/dead_letter_events/*` dans le stockage persistant Nexus.
3. **Supervision & Quarantaine** :
   - L'interface d'administration et les outils de diagnostic (`useDLQQuarantine`) permettent d'inspecter, de rejouer ou d'acquitter les événements mis en quarantaine.

## 3. Conséquences
- Zéro perte de commande ou de transaction financière en mode hors-ligne.
- Traçabilité et observabilité complètes des erreurs d'intégration asynchrones.
