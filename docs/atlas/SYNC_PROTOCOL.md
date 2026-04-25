# 🛰️ SYNC PROTOCOL (NexusSyncService)

L'orchestrateur haute performance qui maintient le restaurant synchronisé en temps réel.

## 1. Architecture de Synchronisation (Parallèle)

Le service utilise un `Mutex` pour garantir qu'une seule initialisation se produit à la fois, évitant les fuites de mémoire et les doublons de listeners.

### Séquence d'Initialisation (Cible < 180ms)
1. **Cleanup** : Arrêt de tous les services précédents et purge du cache.
2. **Anchor** : Verrouillage du `tenantOverride` dans l'adaptateur Nexus.
3. **Bridges** : Initialisation du `NexusBridge`, `TelemetryService` et `TimeSync`.
4. **Gates (Sécurité)** : 
    - **Privacy Shield** : Vérifie les accès pour les tenants autres que `restaurant-os` et `lepetitpoucet`.
    - **Genome Health Gate** : Vérification de l'intégrité du "DNA" avant de lancer la synchro.
5. **Parallel Boot** : Lance simultanément tous les sous-services (Orders, Stocks, Finance, HACCP, Marketing, Staff).

## 2. Auto-Réparation (Self-Healing)
Un moteur de "Self-Healing" tourne toutes les 60 secondes pour auditer les nœuds critiques (ex: `orders`) et corriger les dérives éventuelles entre le cache local et Firestore.

## 3. Sous-Services Spécialisés
- `OpsSyncService` : Temps réel pur pour les commandes et KDS.
- `InventorySyncService` : Déductions de stock basées sur les recettes.
- `FinanceSyncService` : Synchronisation des écritures comptables.
- `HACCPSyncService` : Journalisation légale et température.

## 4. Points de Vigilance
- **Goulot d'Étranglement** : Si un sous-service est lent, il peut retarder l'ensemble du `Promise.all`.
- **Genome Gate** : Si l'intégrité du DNA échoue, la synchro est totalement bloquée avec une erreur `GENOME_INTEGRITY_FAILURE`.
