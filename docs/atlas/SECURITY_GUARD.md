# 🛡️ SECURITY GUARD (SovereignGuard)

Le système d'isolation "Hardware-level" qui garantit que les données d'un restaurant ne "fuient" jamais vers un autre ou vers le Master.

## 1. Principes de l'Isolation (Shadow Context)

Le `SovereignGuard` surveille chaque accès aux données (Firestore/Nexus). Il vérifie que le `tenantId` du chemin demandé correspond au `tenantId` de la session active.

- **Master Mode** : Le tenant `restaurant-os` (Suzerain) est le seul autorisé à traverser les barrières sans déclencher d'alarme.
- **Fail-Safe** : Toute dérive (Drift) non autorisée provoque un **Logout Global Immédiat** et le verrouillage de la session.

## 2. Liste Blanche (Whitelists)

Pour éviter les faux positifs, certains services globaux sont autorisés pour tous les tenants :
- `heartbeat`, `telemetry`, `config`, `health`
- `system`, `time_sync` (Ajouté récemment pour stabiliser la synchro du temps)
- `auth`

## 3. Protocoles NF525 (Signature de Données)

Pour les données sensibles (commandes, fiscalité), le Guard exige une signature cryptographique (`__nf525`).
- **Collections Signées** : `orders`, `stockItems`, `inventoryMovements`, `journalEntries`, `fiscalSeals`, etc.

## 4. Points de Vigilance
- **Lancement au Boot** : Si le tenant n'est pas encore résolu par le Core, le Guard peut par défaut se baser sur `main`, ce qui peut causer des déconnexions intempestives lors du chargement initial.
