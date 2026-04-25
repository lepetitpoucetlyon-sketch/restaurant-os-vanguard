# 🌀 CORE ENGINE (NexusCoreProvider)

L'intelligence centrale qui orchestre l'ensemble du système Restaurant OS.

## 1. Cycle de Vie du Démarrage (Boot Sequence)

1. **Initialisation de l'Adaptateur** : `Nexus.adapter` est réglé sur `FirestoreAdapter`.
2. **Résolution du Tenant** :
    - Cherche `?tenant=` dans l'URL.
    - Fallback par défaut : `lepetitpoucet`.
3. **Chargement de la Configuration** : Appelle `getTenantConfig(tenantId)` depuis `src/instances/index.ts`.
4. **Synchronisation Globale** : Met à jour l'atome `tenantConfigAtom` (via `operationalAtoms`).
5. **Initialisation Auth & Staff** : Charge la session Firebase et les profils utilisateurs rattachés au tenant.

## 2. État du "Split-Brain" (Dette Technique Identifiée)

> [!WARNING]
> Le système souffre actuellement d'une fragmentation de la source de vérité pour la configuration du restaurant.

- **Atome Opérationnel** : Défini dans `authAtoms.ts`, importé par le `NexusCoreProvider`. Il est **non-persistant**.
- **Atome Master** : Défini dans `masterAtoms.ts`, utilisé par le `LayoutResolver`. Il est **persistant** (localStorage).
- **Conséquence** : Si le cache est vidé, le `LayoutResolver` repart sur une config par défaut (SIDEBAR MODE) alors que le `NexusCoreProvider` travaille sur une config Restaurant (EMPIRE UI).

## 3. Points de Rigidité
- **Dépendance searchParams** : L'initialisation du tenant dépend des paramètres d'URL, ce qui peut causer des problèmes d'hydratation si non wrappé dans un `Suspense`.
- **Bypass 9999** : Un code de secours est hardcodé pour le développement (`9999`).

## 4. Recommandations Architecturables
- Fusionner tous les `tenantConfigAtom` en une seule source dans `fleetAtoms.ts`.
- S'assurer que le `LayoutResolver` écoute toujours l'atome mis à jour par le `NexusCoreProvider`.
