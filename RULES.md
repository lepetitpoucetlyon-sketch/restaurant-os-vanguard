# 🏛️ PROTOCOLE GRADE X : LES 6 RÈGLES D'OR DU VANGUARD

Ce document constitue la **Loi Suprême** de l'Empire **Restaurant OS**. Tout développement, modification ou refactorisation doit se conformer strictement à ces préceptes sous peine de déchéance architecturale.

---

### 1. 🛡️ La Règle du Trône (L'Unicité)
**L'ordre :** "Un seul dossier pour les gouverner tous."
*   **Action :** Le travail s'effectue exclusivement dans `/Users/mohammed-aliboudjaadar/RESTAURANT-OS-CORE`.
*   **Contrôle :** Le Workspace officiel est le seul territoire légitime.

### 2. 🍷 La Règle du Lexique (L'Exorcisme)
**L'ordre :** "Le jargon hôtelier est une hérésie."
*   **Action :** Utilisation systématique du lexique souverain de la Restauration (Table, Client, Couvert, Serveur).

### 3. 🧹 La Règle de l'Hygiène (L'Index)
**L'ordre :** "L'index Git est le miroir de l'âme."
*   **Action :** Aucun fichier polluant (cache, logs, fichiers .md inutiles) ne doit stagner. La RAM doit rester libre.

### 4. 🔌 La Règle du Nexus (L'Architecture)
**L'ordre :** "L'UI est le reflet, le Nexus est la source."
*   **Action :** Interdiction d'importer des drivers directs dans l'UI. Le `NexusAdapter` est le seul médiateur autorisé.

### 5. ⚡ La Règle Flash (La Performance)
**L'ordre :** "Code léger, Empire fluide."
*   **Action :** Suppression immédiate de tout code mort. Optimisation O(1) obligatoire pour chaque module.

### 6. 🏛️ La Règle du Titan (Stateless & Local-First) [NOUVEAU - GRADE X]
**L'ordre :** "Nulle attache au serveur, nulle latence au client."
*   **Action :** Interdiction formelle de réintroduire des `Server Actions`. Tout le système doit être compilable en `output: export`.
*   ** Hardening :** Les données sont traitées localement via le `SovereignRegistry` avant toute synchronisation.

---

> [!IMPORTANT]
> **Sceau du Vanguard :** Je m'engage à appliquer ces 6 règles avec une rigueur implacable. Toute fracture sera réduite, tout doute sera levé par le test.
