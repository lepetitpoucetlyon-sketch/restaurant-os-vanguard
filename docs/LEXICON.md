# 📖 Lexique Nexus - Restaurant OS

### 🏛️ Architecture & Gouvernance
- **Nexus** : Le nom de code de la plateforme globale et de son moteur central.
- **Master Control Center (MCC)** : Le tableau de bord "Suzerain" qui pilote toute la flotte.
- **Suzerain** : Le MCC (Maître) qui dicte les politiques et surveille l'Empire.
- **Vassal** : Une instance locale (un restaurant) qui obéit aux ordres du Suzerain.
- **Omphalos** : Le "cordon ombilical" (NexusBridge) reliant le MCC aux restaurants en temps réel.
- **Grade VI** : Le niveau de certification garantissant une pureté architecturale totale.

### 🧠 État & Mémoire
- **GraphOS** : Le graphe de données qui connecte tous les modules entre eux.
- **Slotted Atoms** : Structure de mémoire où les données sont rangées dans des "tiroirs" (slots) interchangeables.
- **GlobalRegistry** : Le "cerveau" qui gère l'ouverture/fermeture des tiroirs mémoire.
- **O(1) Memory** : Garantie que la RAM consommée ne dépend pas du nombre de restaurants gérés.
- **Nuclear Purge** : Nettoyage atomique complet du cache et de la mémoire lors d'un changement de restaurant.
- **Jotai Mesh** : Le maillage d'atomes qui remplace les "God Nodes" (gros objets d'état centralisés).

### ⚙️ Services & Moteurs
- **The Weaver** : Le processus industriel de tissage de la logique métier vers des services isolés.
- **Nexus.adapter** : L'interprète universel permettant à l'UI de parler au moteur sans le polluer.
- **SovereignGuard** : La barrière de sécurité qui empêche les fuites de données entre restaurants.
- **Shadow Context** : Isolation de "niveau matériel" simulée pour garantir l'étanchéité des sessions.
- **CryptoService** : Le coffre-fort gérant les signatures fiscales et le hachage sécurisé.
- **Quantum Sync** : Moteur de synchronisation en temps réel avec résolution de conflits (futur).

### ⚖️ Conformité & Métier
- **NF 525** : Norme fiscale française garantissant l'inaltérabilité des données de vente.
- **HACCP** : Norme de sécurité alimentaire (traçabilité, températures, hygiène).
- **FiscalLedger** : Le registre inaltérable où chaque centime est tracé.
- **Centimes/Grammes** : Utilisation exclusive d'entiers pour éviter les erreurs d'arrondi flottant.
