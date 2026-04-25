# ⚛️ ATOMIC MAP (Final Audit)

Cartographie exhaustive des états Jotai et détection des zones de conflit.

## 1. Conflits Identifiés (Split-Brain)

### A. Configuration du Tenant (Le plus critique)
- **Source 1** : `src/store/masterAtoms.ts` -> `tenantConfigAtom` (Persistant : `nexus_tenant_config`).
- **Source 2** : `src/modules/auth/store/authAtoms.ts` -> `tenantConfigAtom` (Non-persistant).
- **Source 3** : `src/store/tenantAtoms.ts` -> `activeTenantConfigAtom`.
- **Problème** : Le `NexusCoreProvider` écrit dans Source 2, mais le `LayoutResolver` lit Source 1. Si le cache est vidé, Source 1 revient à sa valeur par défaut (`sidebar`) alors que Source 2 est à `null`.

### B. Identifiant du Tenant (ID)
- **Source 1** : `src/store/tenantAtoms.ts` -> `activeTenantIdAtom` (Persistant : `nexus_tenant_id`).
- **Source 2** : `src/store/fleetAtoms.ts` -> `tenantIdAtom` (Défaut : `lepetitpoucet`).
- **Source 3** : `src/store/instanceGuardAtoms.ts` -> `activeTenantAtom`.
- **Problème** : Risque de désynchronisation entre l'ID utilisé pour l'auth et celui utilisé pour le filtrage des données.

### C. Thème & UI
- **Source 1** : `src/store/uiAtoms.ts` -> `themeAtom` (Persistant : `nexus_theme`).
- **Source 2** : `src/store/themeAtoms.ts` -> `themeModeAtom` (Persistant : `nexus_theme_mode`).
- **Problème** : Deux clés de localStorage différentes pour la même donnée.

---

## 2. Inventaire par Fichier Source

### `operationalAtoms.ts` (L'Aiguillage)
Ce fichier est le point d'export central. Il mélange actuellement des exports de `authAtoms`, `uiAtoms`, `orderAtoms`, `complianceAtoms`, etc.
- **Rôle** : Doit devenir l'unique point d'entrée pour les composants.

### `masterAtoms.ts` (Le Cerveau Suzerain)
- `tenantConfigAtom`
- `orchestratorSignalAtom`
- `globalPolicyAtom`
- `emergencyLockoutAtom`

### `uiAtoms.ts` (L'Ergonomie)
- `isSidebarCollapsedAtom`
- `isLaunchpadOpenAtom`
- `notificationsAtom`
- `addToastAtom`

---

## 3. Stratégie de Suture Finale

1. **Suppression des Doublons** : Choisir une seule définition pour `tenantConfigAtom` (recommandé : dans `fleetAtoms.ts`) et l'importer partout ailleurs.
2. **Standardisation des Clés Storage** : Utiliser un préfixe unique `nexus_v2_...` pour toutes les nouvelles clés persistantes.
3. **Nettoyage des Exports** : Faire en sorte que `operationalAtoms.ts` ne ré-exporte que des atomes uniques et non des versions concurrentes.
