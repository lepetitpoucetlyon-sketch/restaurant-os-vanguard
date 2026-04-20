# 🏛️ NEXUS GOVERNANCE - Restaurant OS (Grade X)

## 1. Philosophie de l'Espace
Le système est une **Confédération de Domaines**. Chaque domaine est souverain dans son dossier mais sujet aux lois du Nexus.
- **Isolation Radicale** : Un module ne peut JAMAIS importer directement depuis un autre module.
- **Communication par Pulse** : Le flux de données inter-domaine se fait via des événements (Pulses) ou via le Shared Kernel.

## 2. Cartographie des Flux Critiques (The Golden Flux)

### A. Flux "Pertes & Finance" (Waste -> Ledger)
- **Déclencheur** : `DOMAIN_MUTATION_HACCP` (action: WASTE_LOG).
- **Conséquence** : Création automatique d'une `JournalEntry` de type 'EXPENSE' dans le module Finance.
- **Impact** : Réajustement immédiat de la marge brute (`grossMarginInCents`).

### B. Flux "Sécurité & Maintenance" (Sensor -> Ops)
- **Déclencheur** : `SENSORS_ALERT` (HACCP).
- **Conséquence** : Création d'une tâche de maintenance curative dans `maintenanceLogs`.
- **Impact** : Notification prioritaire Brigade sur le KDS (Kitchen Display System).

### C. Flux "Réception & Stock" (Reception -> Inventory)
- **Déclencheur** : `RECEPTION_VALIDATED`.
- **Conséquence** : Incrémentation du stock (`stockItems`) et mise à jour de la DLC moyenne par ingrédient.

## 3. Hiérarchie des Vérités
1. **La Base de Données (Sovereign Ledger)** : La seule source de vérité persistante (Dexie/Firestore).
2. **Le Manifeste de Module** : La vérité sur la logique interne d'un domaine.
3. **Le Nexus Pulse** : La vérité sur l'interaction temporelle (ce qui vient de se passer).

## 4. Politique de "Zéro Bruit" (Token Hygiene)
- Ne charger que le Manifeste du module en cours de modification.
- Consulter ce document uniquement pour valider les effets bords lors d'une mutation.
