# Audit — Agnosticisme du provider de données (plug-and-play)

> Session : `claude-audit-db-agnostic` (Claude Code) — 2026-09-01
> **Loi 7 (Zero-Claim)** : tous les chiffres ci-dessous sont mesurés dans la session, commandes reproductibles indiquées.
> Périmètre : lecture seule. Aucun code applicatif modifié.

## Verdict en une phrase

**La couche DONNÉES est réellement agnostique** (contrat neutre, 768 fichiers passent par `Nexus.adapter`, 5 fichiers seulement importent le SDK Firestore). **La couche AUTH ne l'est pas**, la couche STORAGE non plus, et **le choix du provider n'est pas commutable par configuration** — il est écrit en dur dans deux fichiers de bootstrap. Ce que tu vois « partout », ce sont à ~85 % des **commentaires et des noms de fichiers**, pas du couplage.

---

## 1. Mesures

```bash
# Fichiers mentionnant firestore/firebase (texte, tous types)
grep -rlEi "firebase/firestore|firebase-admin|firestore" src --include="*.ts" --include="*.tsx" | wc -l
# → 126

# Fichiers important RÉELLEMENT le SDK Firebase
# (regex : from 'firebase[-admin]/{auth,app,functions,storage,firestore,messaging}' | import('firebase…'))
# → 13

# Adoption de l'abstraction
grep -rl "Nexus\.adapter" src --include="*.ts" --include="*.tsx" | wc -l   # → 768 fichiers
grep -rn "Nexus\.adapter" src --include="*.ts" --include="*.tsx" | wc -l   # → 2 215 occurrences
find src -name "*.ts" -o -name "*.tsx" | wc -l                            # → 3 751 fichiers
find src/app/api -name route.ts | wc -l                                   # → 216 routes
```

| Surface | Fichiers couplés au SDK | Verdict |
|---|---|---|
| **Données (Firestore)** | 5 (`FirestoreAdapter`, `FirestoreBatch`, `FirestoreDocumentStore`, `FirestoreServerAdapter`, `firebase.ts`) | ✅ confiné |
| **Auth** | 6 (`ServerAuthProvider`, `auth/mfa`, `firebase-admin-init`, `adminAuthGuard`, `requireAnyAuth`, `AuthSession.tsx`) | ❌ non confiné |
| **Functions (Cloud Functions)** | 2 (`AuthSession.tsx`, `AuthStaff.tsx`) | ❌ verrou GCP |
| **Storage** | 1 (`FirebaseStorageProvider`) | ⚠️ abstrait mais mono-implémentation |

**13 fichiers au total** sur 3 751. Le couplage est petit — mais il est aux **mauvais endroits**.

---

## 2. Ce qui est bien fait (à ne pas casser)

### 2.1 Le contrat de données est authentiquement neutre
`src/shared/nexus/contracts/infrastructure/storage.contracts.ts` définit `IDocumentStore`, `IQueryEngine`, `IRealtimeSubscriber`, `IBatchProcessor`, `IQueryOptions`, `NexusTimestamp`. Il **anticipe déjà Postgres** (commentaires explicites, `toNexusDate()` pour absorber les cinq représentations de timestamp, `PollingSnapshotMixin` documenté pour les providers sans temps réel natif).

### 2.2 Zéro fuite de types Firestore dans le métier
```bash
grep -rnE "\b(Timestamp|FieldValue|DocumentData|QuerySnapshot|DocumentSnapshot)\b" src/modules src/app src/shared \
  --include="*.ts" --include="*.tsx" | grep -vE "NexusTimestamp|serverTimestamp|^\s*(//|\*)"
# → 0 résultat
```
Aucun `Timestamp`, `FieldValue` ou `DocumentData` de Firestore ne traverse la frontière vers `modules/`. C'est le point le plus difficile d'une migration de provider, et il est tenu.

### 2.3 Quatre adapters implémentent le contrat complet
`FirestoreAdapter`, `FirestoreServerAdapter`, `MockAdapter`, `SqliteMemoryAdapter`, `SimulacraAdapter` — tous les 12 membres de `INexusAdapter` sont présents, aucun `TODO`/`throw not implemented`.

### 2.4 Deux invariants existent déjà
`src/__tests__/architecture/invariants.test.ts` — `INV-2` (confinement Firestore) et `INV-3` (ratchet de couplage auth). **32 tests passent** (`npx vitest run src/__tests__/architecture/invariants.test.ts`).

---

## 3. Défauts réels — par ordre de gravité

### 🔴 P0-1 — Aucun sélecteur de provider : le switch demande d'éditer du code
`src/infrastructure/bootstrapProviders.ts` :
```ts
Nexus.adapter = new FirestoreAdapter();            // en dur
StorageManager.provider = new FirebaseStorageProvider();  // en dur
```
`src/lib/nexus/serverNexus.ts` :
```ts
initFirebaseAdmin();
Nexus.registerServerAdapter(new FirestoreServerAdapter());  // en dur
```
Il n'existe **aucune** variable `NEXUS_PROVIDER` / `DB_PROVIDER`, aucune factory, aucun registre. Le pattern existe pourtant à côté et fonctionne : `getServerAuthProvider()` lit `process.env.AUTH_PROVIDER` et choisit entre `firebase` et `keycloak`. Il n'a jamais été appliqué à la donnée.
→ **« Plug-and-play » est faux aujourd'hui** : c'est « recompilable ».

### 🔴 P0-2 — Les gardes d'API contournent l'abstraction auth qui existe
`ServerAuthProvider.ts` expose `IServerAuthProvider` + `FirebaseAuthProvider` + `KeycloakAuthProvider` + factory `getServerAuthProvider()`. Excellent.
Mais **`adminAuthGuard.ts` (3 appels) et `requireAnyAuth.ts` (1 appel)** importent `getAuth` de `firebase-admin/auth` et font `verifyIdToken()` en direct, sans passer par la factory.
```bash
grep -rn "verifyIdToken" src --include="*.ts" | grep -v ServerAuthProvider
# → src/lib/server/requireAnyAuth.ts:81
#   src/lib/server/adminAuthGuard.ts:104, 270, 310
grep -rlE "from .@/lib/server/(adminAuthGuard|requireAnyAuth)" src/app/api | wc -l
# → 174
```
**174 des 216 routes API** dépendent transitivement de firebase-admin/auth. `AUTH_PROVIDER=keycloak` ne marcherait pas aujourd'hui.

### 🔴 P0-3 — Le ratchet INV-3 est un instrument faussé
`INV-3` compte les fichiers matchant `/firebase(-admin)?\/(auth|app)|getAuth|initFirebaseAdmin/` et exige ≤ 17. Il affiche **16/17** — l'air presque saturé.
Or **6 des 16 sont des faux positifs** : le motif nu `getAuth` attrape `getAuthToken` (`lib/api/client.ts`), `getAuthTag` (`credentialCipher.ts`, `tokenCipher.ts`, `SensitiveDataCryptoService.ts`) et `getAuthorized Tools` (`AssistantActionDispatcher/Validator`, `UniversalSystemPromptBuilder`).
Le couplage auth **réel est de 10 fichiers**. Conséquence : le cliquet laisse entrer **7 nouveaux couplages réels** sans jamais broncher. Il rassure au lieu de protéger.
→ Corriger la regex (`getAuth\s*\(` + ancrage sur l'import), **et redescendre le seuil au réel** — jamais le relever (cf. Loi 2 / `verify-gate-integrity.mjs`).

### 🟠 P1-1 — INV-2 a un trou et une liste d'exemptions périmée
La règle ne teste que `from 'firebase/firestore'`. Elle **ignore** `firebase-admin/firestore`, `firebase/auth`, `firebase/functions`, `firebase/storage`, et les `import()` dynamiques.
Preuve : `src/lib/adapters/FirestoreServerAdapter.ts` importe `firebase-admin/firestore`, **n'est pas dans la liste `allowedFiles`**, et passe quand même. La liste autorise par ailleurs `src/e2e/vanguard/mocks.ts` alors que les tests sont déjà exclus du scan.

### 🟠 P1-2 — Le client écrit directement dans Firestore ; la sécurité repose sur `firestore.rules`
`bootstrapDefaultProviders()` (appelé par `useNexusTenantLogic.ts`) installe `FirestoreAdapter` **dans le navigateur** : `getFirestore(app)` avec le SDK client. La barrière d'isolation multi-tenant est donc à **deux étages** : `SovereignGuard` côté client (contournable, c'est du JS) + `firestore.rules` côté serveur Google (149 lignes, 11 blocs `match`, dont l'immuabilité NF525 `allow delete: if false` sur `fiscalMeta`).
**Sur un provider Postgres/Supabase-sans-RLS, le second étage disparaît.** Il faudrait soit réécrire les règles en RLS, soit router 100 % des écritures client par les routes API. Ce n'est pas un détail d'adapter : c'est un changement de topologie.

### 🟠 P1-3 — Trois Cloud Functions sont du verrou dur GCP
`functions/src/index.ts` exporte :
- `loginWithPin` + `listLoginProfiles` — appelées via `httpsCallable` depuis `AuthSession.tsx` et `AuthStaff.tsx`. **Le login PIN du POS ne fonctionne pas sans Firebase Functions.**
- `askGeminiAgent`
- `onJournalEntryCreated` — **trigger `onDocumentCreated('journalEntries/{entryId}')`** qui miroite le journal NF525 vers BigQuery. Un déclencheur Firestore natif : il n'a aucun équivalent sur un autre provider, et il porte de la donnée fiscale.

### 🟡 P2-1 — `SqliteMemoryAdapter` ne fait pas ce que son nom dit
`src/lib/adapters/SqliteMemoryAdapter.ts` : `private readonly store = new Map<string, SovereignData>()`. **Aucun SQLite.** C'est un `MockAdapter` bis. Son `onSnapshot` appelle le callback une fois puis retourne `() => {}` — **pas de réactivité**, alors que le contrat marque `onSnapshot` « OBLIGATOIRE — le POS et le KDS en dépendent ». Idem pour `MockAdapter`.
Le `PollingSnapshotMixin` prévu pour ça n'est utilisé que par `SimulacraAdapter`.
→ Aujourd'hui **aucun adapter non-Firestore ne peut faire tourner le POS**. La preuve de portabilité n'existe pas.

### 🟡 P2-2 — Pas de test de conformité d'adapter
`DataArchitecture.test.ts` a un seul cas CRUD sur `SqliteMemoryAdapter`. Il n'existe pas de suite « contract test » rejouée à l'identique sur chaque implémentation d'`INexusAdapter`. Sans elle, rien ne garantit que deux adapters se comportent pareil sur `query` avec `where`+`orderBy`+`limit`, sur `increment` concurrent, ou sur `runTransaction`.

### 🟡 P2-3 — Dette de nommage : la principale source de ton impression
Ces fichiers passent **tous** par `Nexus.adapter` et ne connaissent pas Firestore. Seul leur nom ment :
`src/modules/finance/comptabilite/FirestoreFinanceRepository.ts`, `src/lib/sovereign/firestoreHydrator.ts`, `src/shared/hooks/useFirestoreBrand.ts`.
S'ajoutent ~40 commentaires « forme Firestore », « query Firebase », « état Firestore » dans `src/shared/eventBus/handlers/` et `src/app/api/`.

### 🟡 P2-4 — Code mort et arbres dupliqués
- `src/lib/types/firestore.types.ts` et `src/infrastructure/types/firestore.types.ts` : exposent `RawFirestore<T>`, `WhereFilterOp`, `FirestoreQueryConstraint` — **importés par zéro fichier**. Contenu différent entre les deux copies.
- Trois paires divergentes `src/lib/…` / `src/infrastructure/…` : `storage/FirebaseStorageProvider.ts`, `types/firestore.types.ts`, `sovereign/firestoreHydrator.ts` (`diff` → différents). Les consommateurs sont éclatés entre les deux chemins (`bootstrapProviders` et `useBrandEditor` prennent `@/infrastructure/services/storage`, `FirestoreFinanceRepository` prend `@/lib/sovereign/firestoreHydrator`).

### 🟡 P2-5 — Fuites de vocabulaire provider dans le modèle
- `firebaseUid` — 13 occurrences (routes `assign-role`, `fleet/users/role`). Devrait être `authProviderUid` ou `externalAuthId`.
- `firestore_reads` / `firestore_writes` dans la télémétrie flotte (`api/admin/fleet/hotspot/route.ts`).
- `firestoreId` dans l'assignation de région (`api/admin/fleet/region/route.ts`).

---

## 4. Plan de remise à niveau

### Lot A — Rendre le switch réel (P0-1)
1. Créer `src/lib/nexus/providerFactory.ts` : `createClientAdapter()` / `createServerAdapter()` lisant `process.env.NEXT_PUBLIC_DB_PROVIDER` / `DB_PROVIDER` (`firestore` | `sqlite` | `mock`, extensible).
2. `bootstrapProviders.ts` et `serverNexus.ts` appellent la factory au lieu de `new FirestoreAdapter()`.
3. Idem pour `StorageManager.provider` via `STORAGE_PROVIDER`.
4. Documenter les variables dans `.env.example`.

### Lot B — Fermer la brèche auth (P0-2)
1. `adminAuthGuard.ts` et `requireAnyAuth.ts` remplacent `getAuth().verifyIdToken(t)` par `getServerAuthProvider().verifyToken(t)`.
2. Sortir `initFirebaseAdmin()` de ces deux fichiers.
3. Ajouter une abstraction client `IClientAuthProvider` (login PIN, session, claims) et faire passer `AuthSession.tsx` / `AuthStaff.tsx` par une route API au lieu de `httpsCallable` — ce qui débloque aussi P1-3.

### Lot C — Réparer les instruments (P0-3, P1-1)
1. `INV-3` : regex `getAuth\s*\(` + `from ['"]firebase(-admin)?/(auth|app)` ; recompter ; **fixer le seuil au réel mesuré** (10 aujourd'hui, moins après le Lot B).
2. `INV-2` : étendre à `firebase-admin/firestore`, `firebase/auth`, `firebase/functions`, `firebase/storage` et aux `import()` dynamiques ; nettoyer `allowedFiles` (ajouter `FirestoreServerAdapter.ts`, retirer `e2e/vanguard/mocks.ts`).
3. Ajouter `INV-2b` : **aucun `new FirestoreAdapter()` hors de la factory**.

### Lot D — Prouver la portabilité (P2-1, P2-2)
1. Écrire `src/__tests__/infrastructure/AdapterConformance.test.ts` : une suite unique paramétrée, rejouée sur `MockAdapter`, `SqliteMemoryAdapter` et `SimulacraAdapter` (CRUD, `query` composée, `increment` concurrent, `runTransaction` rollback, `onSnapshot` réactif).
2. Brancher `pollingSnapshot`/`pollingQuerySnapshot` sur `MockAdapter` et `SqliteMemoryAdapter` pour que `onSnapshot` soit réellement réactif.
3. Renommer `SqliteMemoryAdapter` → `InMemoryAdapter`, ou lui donner un vrai backend SQLite.

### Lot E — Nettoyage de surface (P2-3, P2-4, P2-5)
1. Renommer `FirestoreFinanceRepository` → `NexusFinanceRepository`, `firestoreHydrator` → `sovereignHydrator`, `useFirestoreBrand` → `useTenantBrand`.
2. Supprimer les deux `firestore.types.ts` (code mort, 0 import).
3. Dédupliquer les trois paires `lib/` ↔ `infrastructure/`.
4. Renommer `firebaseUid` → `authProviderUid` ; `firestore_reads/writes` → `db_reads/db_writes`.
5. Passe de commentaires : « forme Firestore » → « forme persistée ».

### Lot F — Décider la topologie de sécurité (P1-2) — **décision produit, pas technique**
Deux voies mutuellement exclusives, à trancher avant tout portage :
- **(a) Écritures client conservées** → chaque provider doit fournir son équivalent de `firestore.rules` (RLS Postgres, policies Supabase). Coût récurrent par provider.
- **(b) Toutes les écritures passent par les routes API** → `firestore.rules` devient une ceinture de secours, `SovereignGuard` serveur devient l'unique barrière. Coût : refonte du chemin d'écriture du POS, perte du offline-first direct.

---

## 5. Récapitulatif

| # | Défaut | Gravité | Lot |
|---|---|---|---|
| P0-1 | Pas de factory provider — switch = édition de code | 🔴 | A |
| P0-2 | 174 routes API contournent `IServerAuthProvider` | 🔴 | B |
| P0-3 | Ratchet INV-3 faussé (6/16 faux positifs) | 🔴 | C |
| P1-1 | INV-2 aveugle à `firebase-admin/*` et aux imports dynamiques | 🟠 | C |
| P1-2 | Sécurité client adossée à `firestore.rules` | 🟠 | F |
| P1-3 | 3 Cloud Functions dont un trigger Firestore NF525→BigQuery | 🟠 | B |
| P2-1 | `SqliteMemoryAdapter` mal nommé, `onSnapshot` non réactif | 🟡 | D |
| P2-2 | Aucun test de conformité inter-adapters | 🟡 | D |
| P2-3 | Noms de fichiers/commentaires « Firestore » trompeurs | 🟡 | E |
| P2-4 | `firestore.types.ts` mort ×2 + 3 paires dupliquées | 🟡 | E |
| P2-5 | `firebaseUid`, `firestore_reads`, `firestoreId` dans le modèle | 🟡 | E |
