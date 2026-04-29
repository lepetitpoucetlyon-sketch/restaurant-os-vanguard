# 🏛️ Restaurant OS Core — Architecture Vanguard (Grade X)

## 🌌 Vision Philosophique : "Zéro Théâtre, Cent Souveraineté"
Le Système d'Exploitation Restaurant OS n'est pas une "Web App". C'est une infrastructure de gestion souveraine, multi-tenant, industrialisée et conforme NF525.

## 🏛️ Structure des Pôles

### 1. Nexus Engine (`src/engines/`)
Le cœur battant. Orchestration des états atomiques (Jotai) et synchronisation physique via les Adapters.
- **NexusCoreProvider** : Boot séquence, authentification souveraine.
- **NexusOpsProvider** : Façade opérationnelle (Tables, KDS, Stock).
- **NexusFiscalProvider** : Scellage cryptographique et immuabilité.

### 2. Infrastructure & Adapters (`src/infrastructure/`)
L'unique point de contact avec le monde extérieur (Firebase, API).
- **FirestoreAdapter** : Classe souveraine implémentant `INexusAdapter`. Isolation par `tenantId` forcée.
- **SovereignMath** : Arithmétique Microunits (Précision $10^{-6}$).

### 3. Domaine Pur (`src/domain/`)
Le sanctuaire de la logique métier. **Interdiction formelle d'importer React ou Firebase ici.**
- Services déterministes, testables à 100% via Vitest.
- `InstanceGuard` : Le verrou Host + ProjectID.

### 4. Modules UI (`src/modules/`)
Composants premium (Empire Design System) consommant exclusivement les hooks du `NexusOpsProvider`.

## 🔐 Protocole de Sécurité Vanguard

1.  **Isolation Tenant** : Tout accès data doit passer par le chemin `/tenants/{tenantId}/`. Aucun fallback sur les collections racine.
2.  **Validation Physique** : L'application ne démarre que si `window.location.hostname` ET `process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID` correspondent à la whitelist dans `InstanceGuard`.
3.  **Immuabilité NF525** : Les collections `fiscal_ledger` et `audit_logs` sont protégées par des Firestore Rules interdisant `update` et `delete`.

## 🛠️ Stack Technique
- **Logic** : Next.js 15 (App Router), TypeScript (Strict Mode).
- **State** : Jotai (Atoms).
- **Security** : Firebase Auth (Custom Tokens), Argon2id (PIN Hashing).
- **Intelligence** : Gemini 3.1 Flash (Oracle Agent).

---
*Généré par Antigravity — Unité de Grade X-Vanguard*
