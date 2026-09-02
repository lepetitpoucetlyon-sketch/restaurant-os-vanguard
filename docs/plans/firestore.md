# Plan de résorption du couplage Firestore / Firebase

> **Source** : `docs/audits/AUDIT-DB-AGNOSTICISME-2026-09-01.md` (audit du 2026-09-01, session `claude-audit-db-agnostic`).
> **Loi 7 (Zero-Claim)** : tous les chiffres proviennent de mesures faites en session, commandes reproductibles données en §2.
> **Statut** : plan non exécuté. Aucun code applicatif modifié à la rédaction.

---

## 0. Objectif et critère de sortie

**Objectif** — passer d'« agnostique par intention » à « agnostique par preuve » : changer de provider de données doit être une **variable d'environnement**, pas une modification de code.

**Critère de sortie unique et vérifiable** :

```bash
DB_PROVIDER=memory AUTH_PROVIDER=keycloak npm run preflight
```
…doit passer, et l'application doit démarrer, se connecter et prendre une commande POS **sans qu'aucun module Firebase ne soit chargé**.

Tant que cette commande ne passe pas, le système n'est pas plug-and-play — quelle que soit la qualité des interfaces.

**Sous-critères** :

| # | Critère | Vérification |
|---|---|---|
| S1 | Aucun `new FirestoreAdapter()` hors factory | `INV-2b` (nouveau) |
| S2 | Aucun import SDK Firebase hors de 6 fichiers autorisés | `INV-2` durci |
| S3 | Couplage auth ≤ 6 fichiers (aujourd'hui 10 réels) | `INV-3` réparé |
| S4 | Les 5 adapters passent la même suite de conformité | `AdapterConformance.test.ts` (nouveau) |
| S5 | Le login POS fonctionne sans Cloud Functions | E2E `login-pin` |

---

## 1. Principe directeur : le patron existe déjà dans le dépôt

Ne rien inventer. **Trois** factories provider-agnostiques fonctionnent déjà ici :

| Factory | Fichier | Variable | Implémentations réelles |
|---|---|---|---|
| `getBackupProvider()` | `src/infrastructure/services/backup/BackupProvider.ts:233` | `BACKUP_PROVIDER` | `gcs` · `s3` · `local` |
| `getServerAuthProvider()` | `src/lib/auth/ServerAuthProvider.ts:183` | `AUTH_PROVIDER` | `firebase` · `keycloak` (squelette) |
| `createLLMProvider()` | `@/modules/intelligence` | cf. ADR-008 | 5 providers |

`getBackupProvider()` est la référence **canonique** : interface `IBackupProvider`, trois classes complètes, `switch` sur `process.env`, défaut sûr. Les lots A et B ne font que **répliquer ce patron** sur la donnée, le stockage et l'auth.

> **Règle du plan** : tout nouveau code de sélection de provider doit être lisible côte à côte avec `BackupProvider.ts:233-238` sans détonner.

---

## 2. Carte du couplage réel

### 2.1 Mesures de référence (à rejouer avant/après chaque lot)

```bash
# M1 — mentions textuelles (bruit inclus)
grep -rlEi "firebase/firestore|firebase-admin|firestore" src --include="*.ts" --include="*.tsx" | wc -l
# Référence 2026-09-01 : 126

# M2 — imports SDK réels (le seul chiffre qui compte)
node -e '
const fs=require("fs"),path=require("path");
const walk=(d,a=[])=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
 if(e.isDirectory()){if(e.name==="node_modules")continue;walk(p,a)}else if(/\.(ts|tsx)$/.test(e.name))a.push(p)}return a};
const re=/from\s+[\x27"]firebase(-admin)?\/(auth|app|functions|storage|firestore|messaging)[\x27"]|import\(\s*[\x27"]firebase(-admin)?\//;
const h=walk("src").filter(f=>re.test(fs.readFileSync(f,"utf8")));
console.log(h.length);h.forEach(f=>console.log("  "+f));'
# Référence 2026-09-01 : 13

# M3 — adoption de l abstraction
grep -rl "Nexus\.adapter" src --include="*.ts" --include="*.tsx" | wc -l   # 768 fichiers
grep -rn "Nexus\.adapter" src --include="*.ts" --include="*.tsx" | wc -l   # 2 215 occurrences
find src -name "*.ts" -o -name "*.tsx" | wc -l                            # 3 751 fichiers

# M4 — routes API dépendant des gardes couplés
grep -rlE "from .@/lib/server/(adminAuthGuard|requireAnyAuth)" src/app/api | wc -l  # 174
find src/app/api -name route.ts | wc -l                                            # 216
```

### 2.2 Les 13 fichiers couplés — verdict et destination

| Fichier | Surface | Verdict cible | Lot |
|---|---|---|---|
| `src/lib/firebase.ts` | app + auth + firestore + storage + functions | ✅ **reste** (init du SDK) | — |
| `src/lib/firebase-admin-init.ts` | admin/app | ✅ **reste** (init Admin SDK) | — |
| `src/lib/adapters/FirestoreAdapter.ts` | firestore | ✅ **reste** (adapter) | — |
| `src/lib/adapters/FirestoreBatch.ts` | firestore | ✅ **reste** (adapter) | — |
| `src/lib/adapters/FirestoreDocumentStore.ts` | firestore | ✅ **reste** (adapter) | — |
| `src/lib/adapters/FirestoreServerAdapter.ts` | admin/firestore | ✅ **reste** (adapter) | — |
| `src/lib/auth/ServerAuthProvider.ts` | admin/auth | ✅ **reste** (l'abstraction elle-même) | — |
| `src/lib/storage/FirebaseStorageProvider.ts` | storage | ✅ **reste** (provider) | A |
| `src/lib/server/adminAuthGuard.ts` | admin/auth | ❌ **à découpler** | B1 |
| `src/lib/server/requireAnyAuth.ts` | admin/auth | ❌ **à découpler** | B1 |
| `src/lib/auth/mfa.ts` | firebase/auth (client) | ❌ **à découpler** | B2 |
| `src/shared/providers/hooks/auth/AuthSession.tsx` | auth + functions | ❌ **à découpler** | B2 |
| `src/shared/providers/hooks/auth/AuthStaff.tsx` | functions | ❌ **à découpler** | B2 |

**Cible : 8 fichiers autorisés** (les 7 « reste » + `e2e/vanguard/mocks.ts`), soit **−5**.

### 2.3 Couplages hors `src/`

| Élément | Nature | Lot |
|---|---|---|
| `functions/src/modules/infrastructure/auth.ts` | `loginWithPin`, `listLoginProfiles` — **le login POS en dépend** | B2 |
| `functions/src/bigquery/accounting-mirror.ts` | trigger `onDocumentCreated('journalEntries/{entryId}')` → BigQuery. **Donnée fiscale NF525** | B3 |
| `functions/src/modules/intelligence/oracle.ts` | `askGeminiAgent` | B3 |
| `firestore.rules` | 149 lignes, 11 blocs `match`, immuabilité NF525 `allow delete: if false` | F |
| `firebase.json` | hosting + rules + functions | F |

---

## 3. Lot A — Rendre le switch réel

> **Résout** : P0-1. **Bloque** : tous les autres lots. **Risque** : faible (ajout pur, aucun comportement changé par défaut).

### A.1 Créer `src/lib/nexus/providerFactory.ts`

Nouveau fichier, calqué sur `BackupProvider.ts:233-238`.

```ts
import type { INexusAdapter } from './types';

export type DbProviderName = 'firestore' | 'memory' | 'mock';

/** Adapter CLIENT (navigateur). Appelé par bootstrapDefaultProviders(). */
export async function createClientAdapter(): Promise<INexusAdapter> {
  const p = (process.env.NEXT_PUBLIC_DB_PROVIDER ?? 'firestore').toLowerCase();
  if (p === 'firestore') {
    const { FirestoreAdapter } = await import('@/lib/adapters/FirestoreAdapter');
    return new FirestoreAdapter();
  }
  if (p === 'memory') {
    const { InMemoryAdapter } = await import('@/lib/adapters/InMemoryAdapter');
    return new InMemoryAdapter();
  }
  if (p === 'mock') {
    const { MockAdapter } = await import('@/lib/adapters/MockAdapter');
    return new MockAdapter();
  }
  throw new Error(`NEXT_PUBLIC_DB_PROVIDER inconnu : "${p}". Valides : firestore | memory | mock`);
}

/** Adapter SERVEUR (Node). Appelé par ensureServerNexus(). */
export async function createServerAdapter(): Promise<INexusAdapter | null> { /* idem, branche 'firestore' → FirestoreServerAdapter */ }
```

**Point critique — l'import dynamique est obligatoire, pas cosmétique.** Un `import { FirestoreAdapter }` statique en haut de la factory ferait entrer le SDK Firebase dans le bundle même avec `DB_PROVIDER=memory`, et le critère de sortie §0 (« aucun module Firebase chargé ») serait faux. C'est aussi ce qui permet à `next build` de tree-shaker `firebase/firestore` hors du bundle client.

### A.2 Réécrire `src/infrastructure/bootstrapProviders.ts`

État actuel (lignes 12-14) :
```ts
Nexus.adapter = new FirestoreAdapter();                    // ← en dur
LLMManager.provider = createLLMProvider();                 // ← déjà agnostique
StorageManager.provider = new FirebaseStorageProvider();   // ← en dur
```

Cible :
```ts
export async function bootstrapDefaultProviders(): Promise<void> {
  try {
    Nexus.adapter = await createClientAdapter();
    LLMManager.provider = createLLMProvider();
    StorageManager.provider = await createStorageProvider();
  } catch (err) {
    logger.warn('[bootstrap] Provider non initialisé', toError(err).message);
  }
}
```

⚠️ **La fonction devient `async`.** Son unique appelant est `src/shared/providers/hooks/useNexusTenantLogic.ts:33` — il faut y gérer l'attente avant tout accès à `Nexus.adapter` (sinon `[Nexus] CRITICAL: No adapter registered.`). **Ne pas** faire un `void bootstrapDefaultProviders()` : c'est exactement la race que le `try/catch` silencieux actuel masquerait.

⚠️ Le `catch {}` actuel est **muet** — il avale toute erreur de bootstrap. Le remplacer par un `logger.warn` fait partie du lot (règle mémoire « jamais d'erreur avalée », mesure M-erreurs-avalées).

### A.3 Réécrire `src/lib/nexus/serverNexus.ts`

État actuel (lignes 30-31) :
```ts
initFirebaseAdmin();
Nexus.registerServerAdapter(new FirestoreServerAdapter());
```

Cible : `ensureServerNexus()` devient `async`, appelle `createServerAdapter()`, et le garde-fou `if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return;` **descend dans la branche `firestore` de la factory** (aujourd'hui il bloque le boot serveur même en provider mémoire).

Appelants à mettre à jour : `src/instrumentation.ts` + toute route qui appelle `ensureServerNexus()` par précaution.

### A.4 Factory de stockage

Même patron dans `src/lib/storage/providerFactory.ts` : `STORAGE_PROVIDER` ∈ `firebase | s3 | local`. `IStorageProvider` (`src/lib/storage/types.ts`) n'a que 3 méthodes (`upload`, `getDownloadUrl`, `delete`) — une implémentation S3 est directement transposable depuis `S3BackupProvider` (`BackupProvider.ts:103`), qui utilise déjà le SDK S3 avec endpoint configurable (OVH / R2 / Scaleway).

### A.5 Documenter dans `.env.example`

Section à ajouter à côté de `AUTH_PROVIDER=firebase` (ligne 151) :
```bash
# ── Provider de données (Nexus) ──
DB_PROVIDER=firestore              # firestore | memory | mock   (serveur)
NEXT_PUBLIC_DB_PROVIDER=firestore  # idem, exposé au navigateur
STORAGE_PROVIDER=firebase          # firebase | s3 | local
```

### A.6 Critère de sortie du lot A

- [ ] `grep -rn "new FirestoreAdapter()\|new FirestoreServerAdapter()" src | grep -v providerFactory` → **0 résultat**
- [ ] `DB_PROVIDER=firestore npm run preflight` → identique à avant (non-régression)
- [ ] `DB_PROVIDER=memory npx tsc --noEmit && npx vitest run` → passe
- [ ] `.env.example` documente les 3 variables

---

## 4. Lot B — Fermer la brèche auth

> **Résout** : P0-2, P1-3. **Le plus gros lot.** Découpé en B1 (serveur, mécanique) / B2 (client, structurel) / B3 (Cloud Functions).

### B1 — Serveur : faire passer les gardes par la factory

**Fichiers** : `src/lib/server/adminAuthGuard.ts`, `src/lib/server/requireAnyAuth.ts`.

**Les 4 appels à remplacer** :

| Fichier:ligne | Fonction englobante |
|---|---|
| `adminAuthGuard.ts:104` | `requireMccLevel` |
| `adminAuthGuard.ts:270` | `getCallerAuth` / garde tenant |
| `adminAuthGuard.ts:310` | `requireFleetAdmin` |
| `requireAnyAuth.ts:81` | `requireAnyAuth` |

Motif de remplacement :
```ts
// AVANT
initFirebaseAdmin();
const decoded = await getAuth().verifyIdToken(authHeader.slice('Bearer '.length));

// APRÈS
const decoded = await getServerAuthProvider().verifyIdToken(authHeader.slice('Bearer '.length));
```

**B1.a — `requireAnyAuth.ts` : substitution directe.** Il ne lit que `uid`, `tenantId`, `clientId`, `role` — les quatre sont déjà dans `DecodedAuthToken` (`ServerAuthProvider.ts:20-26`). Aucune extension d'interface nécessaire. **À faire en premier : c'est le cas le plus simple et il valide le motif.**

**B1.b — `adminAuthGuard.ts` : nécessite d'étendre le contrat.** Le MFA (`checkFleetAdminMFA`, lignes ~198-220) lit deux choses **spécifiques à Firebase** :
```ts
const userRecord = await getAuth().getUser(uid);
const enrolled  = (userRecord.multiFactor?.enrolledFactors?.length ?? 0) > 0;  // ← Firebase
const usedMFA   = !!decoded.firebase?.sign_in_second_factor;                    // ← Firebase
```

Extension à porter dans `ServerAuthProvider.ts` :
```ts
export interface DecodedAuthToken {
  uid: string; email?: string; role?: string; tenantId?: string; clientId?: string;
  /** true si la session a été établie avec un second facteur. */
  mfaUsed?: boolean;                    // ← AJOUT
}
export interface AuthUser {
  uid: string; email?: string; displayName?: string; customClaims?: Record<string, unknown>;
  /** true si le compte a au moins un second facteur enrôlé. */
  mfaEnrolled?: boolean;                // ← AJOUT
}
```
- `FirebaseAuthProvider` mappe `decoded.firebase?.sign_in_second_factor` → `mfaUsed`, et `userRecord.multiFactor?.enrolledFactors?.length > 0` → `mfaEnrolled`.
- `KeycloakAuthProvider` mappe `amr` / `acr` du JWT OIDC → `mfaUsed`.
- `checkFleetAdminMFA` ne connaît plus que `mfaUsed` / `mfaEnrolled` et perd son import `DecodedIdToken` de `firebase-admin/auth`.

**⛔ Interdit de simplifier ici.** Le MFA obligatoire sur `mcc_super_admin` (mcc-core-3) et les erreurs `MFA_ENROLLMENT_REQUIRED` / `MFA_REAUTHENTICATION_REQUIRED` doivent se comporter **à l'identique** après le lot. Un provider qui ne sait pas répondre doit renvoyer `MFA_CHECK_FAILED`, jamais `true`.

**B1.c — Ce qui ne change pas** : les bypass dev (`DEV_PIN_BYPASS_HEADER`, `MCC_DEV_MODE_SERVER`), le kill-switch `isDeviceRevoked`, le registre d'appareils, `isTenantReadOnly`, la sémantique « hidden door » (404). Ces branches s'exécutent **avant** la vérification de token et sont déjà agnostiques.

**Portée réelle** : 174 des 216 routes API héritent du correctif **sans être touchées**. C'est tout l'intérêt de corriger les deux gardes plutôt que les routes.

### B2 — Client : abstraire l'auth navigateur et supprimer `httpsCallable`

> ✅ **Livré le 2026-09-01.** `src/lib/auth/clientAuthProvider.ts` (nouveau, seul
> point d'entrée `firebase/auth` côté client) ; `mfa.ts`, `AuthSession.tsx`,
> `AuthStaff.tsx`, `authedFetch.ts` découplés. Routes `/api/auth/login-pin` et
> `/api/auth/login-profiles` créées (cascade Argon2id → PBKDF2 → SHA-256 legacy
> → clair, migration silencieuse, anti-brute-force 5/15min identiques à
> l'ancienne Cloud Function). `IServerAuthProvider.createSessionToken()` ajouté
> (Firebase : `createCustomToken` ; Keycloak : JWT HS256 local + `verifyIdToken`
> étendu pour le revérifier). Dépendance `argon2@^0.44.0` installée à la racine
> (validée par l'utilisateur avant install). INV-3 mesuré et redescendu 10 → **5**
> fichiers réels (`firebase.ts`, `firebase-admin-init.ts`, `serverNexus.ts`,
> `ServerAuthProvider.ts`, `clientAuthProvider.ts`) ; INV-2 allégé des 2
> exemptions devenues inutiles. 9 tests dédiés (`KeycloakAuthProvider.test.ts`
> ×8 déjà existants + `login-pin.test.ts` ×8 nouveaux). Preuves : `tsc` 0 erreur,
> `eslint` 0 violation (Barrel Contract inclus), `vitest run` 2574/2574,
> cycles madge 7/430 inchangé, gate-last-mile aucun compteur en hausse.

C'est le morceau structurel. Trois surfaces :

**B2.a — `src/lib/auth/mfa.ts`** — importe `getAuth`, `multiFactor`, etc. de `firebase/auth` (ligne 16). Introduire `IClientAuthProvider` dans `src/lib/auth/clientAuthProvider.ts` :
```ts
export interface IClientAuthProvider {
  readonly name: string;
  onAuthStateChanged(cb: (uid: string | null) => void): () => void;
  signInWithToken(token: string): Promise<void>;
  signOut(): Promise<void>;
  getIdToken(): Promise<string | null>;
  currentUserId(): string | null;
  // MFA
  isMfaEnrolled(): Promise<boolean>;
  enrollMfa(...): Promise<void>;
}
export function getClientAuthProvider(): IClientAuthProvider  // switch NEXT_PUBLIC_AUTH_PROVIDER
```

**B2.b — Remplacer les deux Cloud Functions par des routes API.** C'est ce qui débloque P1-3.

| Cloud Function | Route de remplacement | Appelants actuels |
|---|---|---|
| `loginWithPin` | `POST /api/auth/login-pin` | `AuthSession.tsx:45`, `useNexusAuthLogic.ts:100` |
| `listLoginProfiles` | `GET /api/auth/login-profiles` | `AuthStaff.tsx:44,65` |

**Le gabarit existe déjà** : `src/app/api/timeclock/verify-pin/route.ts` fait exactement ça — lecture via `Nexus.adapter`, vérification via `PinHashService`, aucun couplage Firestore.

⚠️ **Piège majeur — trois schémas de hash de PIN coexistent aujourd'hui** :

| Schéma | Champ | Où |
|---|---|---|
| Argon2id | `pinHashArgon2` | `functions/src/modules/infrastructure/auth.ts:56` |
| PBKDF2-SHA256 (100k) | `pinHash` + `pinSalt` | `src/lib/server/PinHashService.ts` |
| SHA-256 salé par `userId` | `pinHash` | `src/lib/shared-kernel.ts` (`hashPin`), utilisé par `api/admin/fleet/users/reset-pin/route.ts:52` |

Porter le login PIN **sans unifier ces schémas casserait des comptes existants**. La route `/api/auth/login-pin` doit donc :
1. essayer `pinHashArgon2` (dépendance `argon2` à ajouter au `package.json` racine — **demander avant d'installer**) ;
2. sinon `pinHash`+`pinSalt` via `PinHashService.verify` ;
3. sinon legacy `hashPin(pin, userId)` ;
4. **re-hasher en Argon2id à la volée** en cas de succès (le code Functions le fait déjà, lignes 145-155 — le reprendre tel quel) ;
5. conserver l'anti-brute-force : `MAX_PIN_ATTEMPTS = 5`, `PIN_LOCKOUT_MS = 15 min`, `failedPinAttempts`, `pinLockedUntil`.

⚠️ **Deuxième piège** : `loginWithPin` lit `db.collection('users').doc(userId)` — collection **racine**, non scopée tenant. La route Next.js passera par `Nexus.adapter`, donc par `SovereignGuard`. Vérifier que `users/` est bien traité comme collection plateforme et non `tenants/{id}/users` (cf. `firestore.rules:46`), sinon le login casse.

**B2.c — Émission du jeton de session.** `loginWithPin` finit par `adminAuth.createCustomToken(userId, claims)` (ligne 162), puis le client fait `signInWithCustomToken`. `IServerAuthProvider` n'a **pas** de méthode d'émission. Ajout :
```ts
/** Émet un jeton de session opaque pour `uid`, portant `claims`. */
createSessionToken(uid: string, claims: Record<string, unknown>): Promise<string>;
```
- `FirebaseAuthProvider` → `getAuth().createCustomToken(uid, claims)`.
- `KeycloakAuthProvider` / provider souverain → JWT signé avec `jsonwebtoken` (**déjà dépendance racine**, `package.json:63`) et une clé `AUTH_SESSION_SECRET`.

Côté client, `signInWithCustomToken` devient `getClientAuthProvider().signInWithToken(token)`.

**B2.d — `src/lib/client/authedFetch.ts`** — 66 fichiers l'utilisent. Il fait `auth.currentUser.getIdToken()` depuis `firebase/auth`. Le faire passer par `getClientAuthProvider().getIdToken()`. **Un seul fichier à modifier, 66 corrigés.** Même levier que B1.

**B2.e — `AuthSession.tsx` / `AuthStaff.tsx`** — supprimer `getFunctions`, `httpsCallable`, `onAuthStateChanged`, `signInWithCustomToken`, `signOut`, `setPersistence` au profit de `getClientAuthProvider()`. `loginWithPinCallable` (retourné par le hook et consommé par `useNexusAuthLogic.ts:100`) devient `loginWithPin(userId, pin)` — un `fetch` vers la route API. Adapter `attemptCloudLogin` en conséquence.

### B3 — Cloud Functions restantes

| Function | Décision |
|---|---|
| `askGeminiAgent` (`oracle.ts`) | Porter vers une route API + `TenantAIRegistry` (ADR-008). Le routage LLM est déjà agnostique côté app. |
| `onJournalEntryCreated` (`accounting-mirror.ts`) | **Le plus délicat.** Trigger Firestore natif `onDocumentCreated('journalEntries/{entryId}')` qui miroite le journal NF525 vers BigQuery. Aucun équivalent hors Firestore. → Remplacer par un abonnement **NexusEventBus** sur l'événement de création de `JournalEntry` (canal légitime ADR-015 §1) + un `IAnalyticsMirror` avec implémentations BigQuery / Postgres / no-op. |

⚠️ `onJournalEntryCreated` touche de la **donnée fiscale scellée** (ADR-003). Toute modification passe par un test de non-régression sur la chaîne de scellement (`FiscalSealer.test.ts`, `WormImmutableCollections.test.ts`) avant fusion.

### B.4 Critère de sortie du lot B

- [ ] `grep -rn "verifyIdToken" src --include="*.ts" | grep -v ServerAuthProvider` → **0 résultat**
- [ ] `grep -rn "httpsCallable\|firebase/functions" src --include="*.ts" --include="*.tsx" | grep -v __tests__ | grep -v e2e` → **0 résultat**
- [ ] `AUTH_PROVIDER=keycloak` : les 216 routes répondent 401 (jeton invalide) et non 500 (provider manquant)
- [ ] E2E : login PIN opérationnel avec `DB_PROVIDER=memory`, Functions non déployées
- [ ] Les comptes aux 3 formats de hash se connectent toujours (test dédié par format)

---

## 5. Lot C — Réparer les instruments

> **Résout** : P0-3, P1-1. **À faire tôt** — sans instruments justes, on ne sait pas si A et B tiennent.
> Fichier unique : `src/__tests__/architecture/invariants.test.ts`.

### C.1 `INV-3` (ligne 87) — le ratchet faussé

Regex actuelle :
```ts
/from\s+['"]firebase(-admin)?\/(auth|app)['"]|getAuth|initFirebaseAdmin/
```
Le motif **`getAuth` nu** attrape 6 faux positifs sans aucun rapport avec Firebase :

| Fichier | Ce qui matche |
|---|---|
| `src/lib/api/client.ts` | `getAuthToken` |
| `src/lib/server/credentialCipher.ts` | `cipher.getAuthTag()` |
| `src/modules/finance/tresorerie/banking/openBanking/tokenCipher.ts` | `cipher.getAuthTag()` |
| `src/shared/security/SensitiveDataCryptoService.ts` | `cipher.getAuthTag()` |
| `src/modules/intelligence/services/AssistantActionDispatcher.ts` | `getAuthorizedTools` |
| `src/modules/intelligence/services/AssistantActionValidator.ts` | `getAuthorizedTools` |
| `src/modules/intelligence/services/UniversalSystemPromptBuilder.ts` | `getAuthorizedTools` |

Résultat : le cliquet affiche **16/17** (l'air saturé) alors que le couplage réel est de **10**. Il laisserait donc entrer **7 nouveaux couplages réels** sans broncher. C'est un instrument qui rassure au lieu de protéger — exactement la famille de piège encodée dans `scripts/measure/measures.mjs`.

Regex corrigée :
```ts
/from\s+['"]firebase(-admin)?\/(auth|app)['"]|import\(\s*['"]firebase(-admin)?\/(auth|app)['"]|\binitFirebaseAdmin\b/
```
(`getAuth` nu supprimé : tout usage réel de `getAuth` s'accompagne obligatoirement de son import — le motif est redondant, pas protecteur.)

**Puis descendre le seuil au réel mesuré.** `17 → 10` immédiatement après C.1, `→ 6` après B1, `→ 3` après B2.
⛔ **Ne jamais le relever** (Loi 2, `verify-gate-integrity.mjs`). Un couplage qui ferait dépasser le seuil se corrige à la source.

### C.2 `INV-2` (ligne 62) — le trou et la liste périmée

Test actuel : `/from\s+['"]firebase\/firestore['"]/` — **ignore** `firebase-admin/firestore`, `firebase/auth`, `firebase/functions`, `firebase/storage`, et tous les `import()` dynamiques.

**Preuve du trou** : `src/lib/adapters/FirestoreServerAdapter.ts` importe `firebase-admin/firestore`, **n'est pas dans `allowedFiles` (lignes 65-71)**, et passe quand même.

Corrections :
1. Regex étendue à `firebase(-admin)?/(firestore|auth|functions|storage|messaging)` + forme `import()`.
2. `allowedFiles` refaite depuis §2.2 : ajouter `FirestoreServerAdapter.ts`, `ServerAuthProvider.ts`, `FirebaseStorageProvider.ts` ; **retirer `src/e2e/vanguard/mocks.ts`** (les tests sont déjà exclus du scan ligne 64 — l'entrée ne sert à rien et donne une fausse impression de permissivité).
3. À mesure que B avance, retirer `adminAuthGuard.ts`, `requireAnyAuth.ts`, `mfa.ts`, `AuthSession.tsx`, `AuthStaff.tsx` de toute exemption temporaire.

### C.3 `INV-2b` (nouveau) — verrouiller la factory

```ts
it("aucune instanciation d'adapter hors de la factory", () => {
  // Interdit : new FirestoreAdapter() / new FirestoreServerAdapter() / new FirebaseStorageProvider()
  // Autorisé  : src/lib/nexus/providerFactory.ts, src/lib/storage/providerFactory.ts
});
```
Sans cet invariant, le lot A se fait défaire au premier `bootstrap` ajouté ailleurs.

### C.4 Critère de sortie du lot C

- [ ] `npx vitest run src/__tests__/architecture/invariants.test.ts` → passe (32 tests aujourd'hui, +1 avec INV-2b)
- [ ] INV-3 compte **10** fichiers, pas 16, et son seuil vaut 10
- [ ] Retirer `FirestoreServerAdapter.ts` d'`allowedFiles` fait **échouer** INV-2 (preuve que le test mord)

---

## 6. Lot D — Prouver la portabilité

> **Résout** : P2-1, P2-2. Sans ce lot, l'agnosticisme reste une intention.

### D.1 `SqliteMemoryAdapter` ne fait pas ce que son nom dit

`src/lib/adapters/SqliteMemoryAdapter.ts:9` :
```ts
private readonly store = new Map<string, SovereignData>();
```
**Aucun SQLite.** C'est un `MockAdapter` bis. Deux options :
- **(recommandé)** renommer `InMemoryAdapter`, assumer que c'est un adapter mémoire, et écrire plus tard un vrai `SqliteAdapter` séparé ;
- écrire un vrai backend SQLite (`better-sqlite3` — **dépendance à faire valider avant installation**).

Le renommage est un `git mv` + 3 lignes dans `src/__tests__/infrastructure/DataArchitecture.test.ts` (lignes 3, 18, 19) + 2 commentaires (`SnapshotService.ts:5`, `SnapshotService.test.ts:17`). ⚠️ `SqliteMemoryAdapter` **n'est pas exporté par `src/lib/adapters/index.ts`** — il n'est atteignable que par import profond, ce qui explique qu'aucun code applicatif ne l'utilise. Le lot A doit l'ajouter au barrel en même temps que la factory.

### D.2 `onSnapshot` non réactif = POS impossible hors Firestore

`storage.contracts.ts:82-95` déclare `onSnapshot` **« OBLIGATOIRE dans tout adapter client — le POS (ops.sync.ts) et le KDS en dépendent »**, et pointe vers `PollingSnapshotMixin` pour les providers sans temps réel natif.

Or :
```ts
// SqliteMemoryAdapter.ts:47-57  ET  MockAdapter.ts:61-64
onSnapshot(path, callback) { this.get(path).then(d => d && callback(d)); return () => {}; }
```
→ **un seul appel, aucune réactivité, désabonnement vide.** `PollingSnapshotMixin` n'est utilisé que par `SimulacraAdapter` (lignes 199 et 206).

**Conséquence directe : aucun adapter non-Firestore ne peut faire tourner le POS.** Le critère de sortie §0 est aujourd'hui inatteignable pour cette seule raison.

Correctif : brancher `pollingSnapshot` / `pollingQuerySnapshot` sur `InMemoryAdapter` et `MockAdapter`, en recopiant l'usage de `SimulacraAdapter.ts:199-210`.

### D.3 Suite de conformité — le cœur du lot

Nouveau `src/__tests__/infrastructure/AdapterConformance.test.ts` : **une suite unique paramétrée**, rejouée à l'identique sur chaque implémentation d'`INexusAdapter`.

```ts
const ADAPTERS = [
  ['MockAdapter',      () => new MockAdapter()],
  ['InMemoryAdapter',  () => new InMemoryAdapter()],
  ['SimulacraAdapter', () => new SimulacraAdapter(new MockAdapter(), 'conformance')],
] as const;

describe.each(ADAPTERS)('Conformité INexusAdapter — %s', (_name, make) => { /* … */ });
```

Cas à couvrir — ce sont précisément les endroits où deux providers divergent en silence :

| # | Cas | Pourquoi ça diverge |
|---|---|---|
| 1 | CRUD simple + `get` sur chemin inexistant → `null` | certains renvoient `undefined` ou throw |
| 2 | `set` avec `{ merge: true }` vs sans | écrasement partiel vs total |
| 3 | `query` avec `where` + `orderBy` + `limit` combinés | ordre d'application des contraintes |
| 4 | `query` avec chaque `StorageQueryOperator` (11 opérateurs, `storage.contracts.ts:1-3`) | `in`, `not-in`, `array-contains` souvent non implémentés |
| 5 | `increment` concurrent ×100 → total exact | atomicité (Invariant #2 de `StockDeductionHandler.ts:123`) |
| 6 | `runTransaction` qui throw → **aucune écriture visible** | rollback réellement implémenté ? |
| 7 | `batch()` : `set`+`update`+`delete`+`increment` puis `commit()` unique | atomicité du lot |
| 8 | `onSnapshot` : écriture après abonnement → callback rappelé | **le test qui échoue aujourd'hui** |
| 9 | fonction de désabonnement → plus aucun callback | fuite mémoire POS/KDS |
| 10 | `serverTimestamp()` → `toNexusDate()` donne une `Date` valide | les 5 formes de `NexusTimestamp` |
| 11 | `generateId()` × 10 000 → aucune collision | |
| 12 | chemin cross-tenant → refusé par `NexusInterceptor` | isolation identique quel que soit le provider |

> `FirestoreAdapter` et `FirestoreServerAdapter` sont exclus de cette suite unitaire (ils exigent l'émulateur). Prévoir la même suite en test d'intégration derrière l'émulateur Firestore, en tâche séparée.

### D.4 Critère de sortie du lot D

- [ ] `AdapterConformance.test.ts` passe pour les 3 adapters, **12 cas chacun**
- [ ] Casser volontairement `increment` d'un adapter fait échouer la suite (preuve que le test mord)
- [ ] `grep -rn "SqliteMemoryAdapter" src` → 0 résultat (renommage complet)
- [ ] `DB_PROVIDER=memory` : le POS affiche une commande créée depuis un autre onglet (réactivité réelle)

---

## 7. Lot E — Nettoyage de surface

> **Résout** : P2-3, P2-4, P2-5. **Aucun risque fonctionnel**, gros effet sur la lisibilité — c'est ce lot qui répond à l'impression « il y a du Firestore partout ».

### E.1 Renommages — fichiers qui passent tous par `Nexus.adapter`

| Actuel | Cible | Vérification |
|---|---|---|
| `src/modules/finance/comptabilite/FirestoreFinanceRepository.ts` | `NexusFinanceRepository.ts` | imports : `IFinanceRepository`, `Nexus`, `FirestoreHydrator` — **zéro Firebase** |
| `src/lib/sovereign/firestoreHydrator.ts` | `sovereignHydrator.ts` (classe `SovereignHydrator`) | |
| `src/shared/hooks/useFirestoreBrand.ts` | `useTenantBrand.ts` | imports : `Nexus`, Jotai, Zod — **zéro Firebase** |

Chacun est un `git mv` + mise à jour des barrels. Respecter la **Règle du Barrel** (CLAUDE.md) : ne pas créer d'import profond au passage.

### E.2 Code mort à supprimer

`src/lib/types/firestore.types.ts` et `src/infrastructure/types/firestore.types.ts` exportent `RawFirestore<T>`, `WhereFilterOp`, `FirestoreQueryConstraint`.
```bash
grep -rn "RawFirestore\|FirestoreQueryConstraint\|firestore.types" src --include="*.ts" --include="*.tsx" \
  | grep -v "types/firestore.types.ts:"
# → 0 résultat
```
**Zéro import.** Les deux copies sont mortes, et divergentes. → suppression pure.

### E.3 Arbres dupliqués `lib/` ↔ `infrastructure/`

Trois paires **divergentes** (`diff` → différent) :

| Paire | Consommateurs actuels |
|---|---|
| `lib/storage/FirebaseStorageProvider.ts` ↔ `infrastructure/services/storage/FirebaseStorageProvider.ts` | `bootstrapProviders.ts:5` prend `lib/`, mais `StorageManager` (ligne 4) prend `infrastructure/` — **les deux à la fois** |
| `lib/types/firestore.types.ts` ↔ `infrastructure/types/firestore.types.ts` | aucun (cf. E.2) |
| `lib/sovereign/firestoreHydrator.ts` ↔ `infrastructure/services/sovereign/firestoreHydrator.ts` | `FirestoreFinanceRepository.ts:4` prend `lib/` |

⚠️ **Piège connu** (mémoire `project_lib_deep_imports_load_bearing`) : router `lib/` vers un barrel a déjà fait passer les cycles `madge` de 2 à 100 sur ce dépôt. **Mesurer les cycles AVANT et APRÈS** :
```bash
sentrux check .   # ou npx madge --circular src
```
Si la déduplication fait remonter les cycles, la reporter et documenter le pourquoi — ne pas forcer.

### E.4 Vocabulaire provider dans le modèle de données

| Terme | Occurrences | Cible | Où |
|---|---|---|---|
| `firebaseUid` | 13 | `authProviderUid` | `api/admin/users/assign-role/route.ts:77,98-107`, `api/admin/fleet/users/role/route.ts:58,75-80` |
| `firestore_reads` / `firestore_writes` | 2 | `db_reads` / `db_writes` | `api/admin/fleet/hotspot/route.ts:53-54` |
| `firestoreId` | 2 | `providerRegionId` | `api/admin/fleet/region/route.ts:64,75` |

⚠️ `firebaseUid` est un **champ persisté**. Le renommage exige une migration à double lecture (`authProviderUid ?? firebaseUid`) pendant une release, puis un backfill via `MigrationRunner`. **Ne pas renommer sèchement** — des documents existants portent l'ancien nom.

### E.5 Commentaires trompeurs

```bash
grep -rniE "firestore|firebase" src/shared/eventBus src/app/api --include="*.ts" | wc -l   # → 73 lignes
grep -rliE "firestore|firebase" src/shared/eventBus --include="*.ts" | wc -l                # → 11 fichiers
```
**73 lignes de commentaires** (« forme Firestore », « état Firestore », « query Firebase », « claims Firebase ») réparties sur 11 fichiers d'`eventBus/handlers/` et les routes `app/api/`. **Aucun de ces fichiers n'importe Firebase.**
→ Passe de remplacement : « forme Firestore » → « forme persistée », « query Firebase » → « query Nexus », « claims Firebase » → « claims du provider d'auth ».

C'est **la première cause de l'impression « Firestore partout »** : 126 fichiers mentionnent Firestore, 13 seulement l'importent.

### E.6 Critère de sortie du lot E

- [ ] `find src -iname "*firestore*" -o -iname "*firebase*"` → seuls les fichiers de §2.2 marqués « reste »
- [ ] M1 (mentions textuelles) : **126 → < 40**
- [ ] Cycles `madge` inchangés ou en baisse
- [ ] `npx tsc --noEmit` → 0 erreur

---

## 8. Lot F — Topologie de sécurité (décision produit)

> **Résout** : P1-2. **Ce lot n'est pas technique : c'est un arbitrage à trancher avant tout portage réel.**

### F.1 Le problème

`bootstrapDefaultProviders()` installe `FirestoreAdapter` **dans le navigateur** (`FirestoreAdapter.ts:38` → `getFirestore(app)`, SDK client). L'isolation multi-tenant repose donc sur **deux étages** :

1. `SovereignGuard` côté client — du JavaScript, contournable par un utilisateur déterminé ;
2. `firestore.rules` côté serveur Google — **149 lignes, 11 blocs `match`**, la seule barrière réellement inviolable. Elle porte notamment l'immuabilité NF525 : `firestore.rules:98` → `allow delete: if false` sur `fiscalMeta`, plus `isImmutableCollection(collection)` (lignes 116, 125).

**Sur un provider Postgres/Supabase sans RLS équivalent, l'étage 2 disparaît purement et simplement.** Le système deviendrait ouvert en écriture directe depuis le navigateur.

### F.2 Les deux voies (exclusives)

**Voie (a) — conserver les écritures client.**
Chaque provider doit fournir son équivalent de `firestore.rules` : politiques RLS PostgreSQL, policies Supabase, etc.
- ✅ conserve l'offline-first direct et la latence POS
- ❌ coût récurrent **par provider** ; la règle NF525 doit être réécrite et re-certifiée à chaque fois
- ❌ « plug-and-play » reste faux : brancher un provider = écrire un jeu de règles de sécurité

**Voie (b) — router toutes les écritures par les routes API.**
`SovereignGuard` serveur devient l'unique barrière ; `firestore.rules` devient une ceinture de secours.
- ✅ un seul modèle de sécurité, valable pour tous les providers — **la seule voie qui rend §0 vraiment atteignable**
- ✅ le NF525 n'est plus scellé que par du code applicatif testé (`WormImmutableCollections.test.ts`)
- ❌ refonte du chemin d'écriture du POS, de l'`OutboxService` et du `sync-manager`
- ❌ perte de l'écriture offline directe → l'outbox devient obligatoire pour **toute** mutation

**Recommandation** : voie (b), mais **après** les lots A→E, et comme chantier propre avec son propre ADR (`ADR-021 — Topologie d'écriture et barrière unique`). Elle touche le cœur temps réel du POS ; la mener en même temps qu'un changement de provider serait cumuler deux risques.

### F.3 Ne pas oublier

`firebase.json` déclare `hosting`, `firestore.rules` et `functions`. Après le lot B3, la section `functions` devient vide. Décider si le déploiement reste Firebase Hosting ou bascule (Vercel / OVH / auto-hébergé) — **hors périmètre de ce plan**, mais à tracer.

---

## 9. Ordonnancement

```
C.1  Réparer INV-3          ─┐  (indépendant, à faire en premier :
                             │   sans instrument juste, on ne sait pas si le reste tient)
A    Factory provider       ─┤
                             ├─→ C.2/C.3  Durcir INV-2 + créer INV-2b
B1   Auth serveur           ─┤
                             │
D    Conformité + réactivité ┤   (D peut démarrer en parallèle de B1 :
                             │    aucun fichier commun)
B2   Auth client + Functions ┘   (dépend de A et B1)
                             │
B3   Cloud Functions restantes
                             │
E    Nettoyage de surface        (aucune dépendance — peut se faire à tout moment,
                                  mais après A/B pour ne pas renommer deux fois)
                             │
F    Décision topologie          (chantier séparé, ADR-021 — voie (b) obligatoire si G)
                             │
G    Souveraineté (§12)          (chantier à part entière : PostgresAdapter,
                                  Keycloak complet, S3, RLS, docker-compose)
```

**Chemin critique** : `C.1 → A → B1 → B2`. Les lots D et E sont parallélisables.

**Découpage en commits** (un lot ≠ un commit) :

| Commit | Contenu | Vert après |
|---|---|---|
| 1 | C.1 — regex INV-3 + seuil 17→10 | `vitest run invariants` |
| 2 | A.1+A.5 — factory + `.env.example` (aucun appelant changé) | `tsc` |
| 3 | A.2+A.3 — bascule des 2 bootstraps + `useNexusTenantLogic` | `preflight` |
| 4 | C.3 — INV-2b | `vitest run invariants` |
| 5 | B1.a — `requireAnyAuth` | `preflight` |
| 6 | B1.b — extension `IServerAuthProvider` (MFA) + `adminAuthGuard` | `preflight` |
| 7 | C.2 — INV-2 durci + `allowedFiles` refaite | `vitest run invariants` |
| 8 | D.1+D.2 — renommage `InMemoryAdapter` + polling réactif | `preflight` |
| 9 | D.3 — `AdapterConformance.test.ts` | `vitest run` |
| 10 | B2.a-d — `IClientAuthProvider` + `authedFetch` | `preflight` |
| 11 | B2.b — routes `/api/auth/login-pin` + `/login-profiles` | E2E login |
| 12 | B2.e — `AuthSession`/`AuthStaff` débranchés des Functions | E2E login |
| 13 | B3 — `askGeminiAgent` + `onJournalEntryCreated` → EventBus | tests fiscaux |
| 14 | E.1-E.5 — nettoyage | `preflight` |

**Chaque commit doit laisser `npm run preflight` vert.** Aucun commit ne relève un cliquet.

---

## 10. Ce que ce plan ne fait PAS

- **Les lots A→F n'écrivent pas d'adapter PostgreSQL.** Ils rendent son écriture possible sans toucher au reste. L'adapter Postgres fait l'objet du **lot G** (§12), qui ne peut démarrer qu'une fois la suite de conformité (D.3) en place — elle en est le cahier des charges exécutable.
- **Il ne retire pas Firebase.** Firestore reste le provider par défaut (`DB_PROVIDER=firestore`, `AUTH_PROVIDER=firebase`). L'objectif est la **réversibilité**, pas la migration.
- **Il ne touche pas au scellement fiscal NF525** (ADR-003), sauf sur le point B3 (`onJournalEntryCreated`), explicitement encadré par les tests fiscaux existants.
- **Il n'installe aucune dépendance sans validation** : `argon2` (B2.b, ✅ installé le 2026-09-01 après validation utilisateur), un éventuel `better-sqlite3` (D.1), puis `pg`, `jose` (ou `jsonwebtoken` + cache JWKS manuel — finalement évité, cf. G.2.1 : `crypto.createPublicKey` suffit) et un éventuel `node-pg-migrate` (lot G) doivent être demandés avant installation.
- **Il ne chiffre pas l'extension du cache offline.** Passer à Postgres fait perdre le cache IndexedDB que Firestore fournit sur toutes les collections (cf. §12 G.0.bis). L'ampleur du rattrapage Dexie est un arbitrage à part, préalable au lot G.
- **Il ne relève aucun cliquet.** Un seuil qui gêne se corrige à la source.

---

## 11. Tableau de bord

| Lot | Défaut résolu | Gravité | Fichiers touchés | Dépend de |
|---|---|---|---|---|
| **C.1** | P0-3 — ratchet INV-3 faussé | 🔴 | 1 | — |
| **A** | P0-1 — pas de factory provider | 🔴 | 5 + 2 nouveaux | — |
| **B1** | P0-2 — 174 routes contournent l'abstraction | 🔴 | 3 | A |
| **C.2/C.3** | P1-1 — INV-2 aveugle | 🟠 | 1 | A |
| **B2** ✅ | P1-3 — login POS dépend des Cloud Functions | 🟠 | 6 + 2 routes (livré 2026-09-01, INV-3 réel : 10 → 5) | A, B1 |
| **B3** | P1-3 — trigger fiscal Firestore→BigQuery | 🟠 | 3 (dont `functions/`) | B2 |
| **D** | P2-1/P2-2 — portabilité non prouvée | 🟡 | 3 + 1 nouveau | — |
| **E** | P2-3/4/5 — dette de nommage et doublons | 🟡 | ~20 | A, B |
| **F** | P1-2 — sécurité adossée à `firestore.rules` | 🟠 | ADR-021 | A→E |
| **G** | Auto-hébergement — aucun adapter persistant souverain | 🟠 | 4 nouveaux + ~10 routes + SQL | D.3, F(b) |

### Trajectoire des mesures

| Mesure | Aujourd'hui | Après A+B | Après E | Après G |
|---|---|---|---|---|
| M1 — mentions textuelles | 126 | 126 | **< 40** | < 40 |
| M2 — imports SDK réels | 13 | **8** | 8 | 8 (tous optionnels) |
| INV-3 — couplage auth (réel) | 10 (affiché 16) | **5** (mesuré 2026-09-01, estimation initiale 3) | 5 | 5 |
| Routes API couplées à firebase-admin | 174 / 216 | **0** | 0 | 0 |
| Adapters passant la conformité | 0 / 5 | 3 / 5 | 3 / 5 | **4 / 6** |
| Providers persistants non-Firebase | 0 | 0 | 0 | **1 (Postgres)** |
| Démarrage sans compte cloud | ❌ | ❌ | ❌ | **✅** |


## 12. Lot G — Souveraineté : auto-hébergement complet

> **Ajouté le 2026-09-01** après arbitrage : l'objectif n'est pas seulement la réversibilité, c'est de pouvoir **installer le système sur des serveurs propres**.
> **Ce lot est un chantier à part entière** — plus lourd que A→F réunis. Il ne commence pas avant que D.3 (suite de conformité) soit vert et que F ait tranché.

### G.0 Pourquoi G dépend de F, et pas l'inverse

C'est le point qu'il faut comprendre avant tout le reste.

Aujourd'hui, le **navigateur parle directement à Firestore** (`FirestoreAdapter.ts:38`, SDK client). Deux choses en découlent :

1. **PostgreSQL n'est pas joignable depuis un navigateur.** Il n'existe aucun équivalent client au SDK Firestore. Donc dès qu'on passe à Postgres, **toutes** les lectures/écritures client doivent transiter par les routes Next.js. C'est exactement la **voie (b) du lot F** — elle n'est donc pas une option pour l'auto-hébergement, c'est un **préalable technique**.
2. **`onSnapshot` client ne peut plus être une souscription DB.** Il devient un flux SSE/WebSocket servi par une route Next.js qui, elle, écoute la base (§G.1.7).

> **Conclusion** : `F(voie b)` → `G`. Tenter G en gardant les écritures client est une impasse.

### G.0.bis Ce que l'auto-hébergement fait perdre — à assumer explicitement

`src/lib/firebase.ts:48-52` active le cache persistant Firestore :
```ts
initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
})
```
**Firestore fournit gratuitement un cache offline IndexedDB sur *toutes* les collections, synchronisé multi-onglets.** C'est ce qui fait tenir le POS quand le réseau tombe.

Ce que le dépôt possède en propre (`src/lib/offline/offline-store.ts`, Dexie v7) ne couvre que **8 tables** : `orders`, `stockItems`, `inventoryMovements`, `journalEntries`, `fiscalSeals`, `syncQueue`, `immunityLogs`, `processedEvents`.

→ **Passer à Postgres, c'est perdre le cache offline sur toutes les autres collections** (produits, catégories, tables, recettes, configuration, personnel…). Le chemin d'écriture est couvert (`OutboxService`), **le chemin de lecture ne l'est pas**.

C'est un travail réel, non chiffré ici, et **il doit être arbitré avant de lancer G** : soit on étend le cache Dexie aux collections lues par le POS/KDS, soit on accepte qu'une coupure réseau dégrade plus qu'aujourd'hui.

---

### G.1 — `PostgresAdapter` (le gros morceau)

Nouveau : `src/lib/adapters/PostgresAdapter.ts`, implémentant les 12 méthodes d'`INexusAdapter`.

#### G.1.1 Le modèle de tables : document store émulé

`INexusAdapter` est un **contrat document à chemins dynamiques** : `Nexus.adapter.query('tenants/x/orders')` ne connaît aucun schéma à la compilation (268 appels `query()` mesurés dans le dépôt, sur des chemins construits à l'exécution). Une table typée par collection casserait le contrat.

→ **Table unique, JSONB.**

```sql
CREATE TABLE documents (
  path        text PRIMARY KEY,                 -- 'tenants/lepetitpoucet/orders/ord_123'
  collection  text NOT NULL,                    -- 'orders'
  doc_id      text NOT NULL,                    -- 'ord_123'
  tenant_id   text GENERATED ALWAYS AS (
                CASE WHEN path LIKE 'tenants/%'
                     THEN split_part(path, '/', 2) END
              ) STORED,                          -- infalsifiable : dérivé du chemin
  data        jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON documents (tenant_id, collection);
CREATE INDEX ON documents USING gin (data jsonb_path_ops);
CREATE INDEX ON documents (collection, (data->>'createdAt') DESC);
```

`tenant_id` en colonne **générée** est le point clé : il ne peut pas mentir, puisqu'il est dérivé du chemin lui-même. C'est ce qui rend la RLS (§G.5) fiable.

#### G.1.2 Convention de chemin — à respecter au caractère près

`FirestoreAdapter.ts:88` :
```ts
const isCollection = path.split('/').length % 2 !== 0;
```
Segments **impairs = collection**, **pairs = document**. `buildTenantPath()` (`src/lib/nexus/utils/tenantPath.ts`) produit `tenants/{tenantId}/{...}`, sauf pour les tenants suzerains (`restaurant-os`, `main`) où le chemin reste global.

`PostgresAdapter` doit reproduire cette arithmétique **exactement**, sinon `SovereignGuard` et `NexusInterceptor` — qui parsent les chemins — se désynchronisent silencieusement.

#### G.1.3 Table de correspondance des 12 méthodes

| `INexusAdapter` | SQL | Piège à ne pas rater |
|---|---|---|
| `get(path)` | `SELECT doc_id, data FROM documents WHERE path=$1` | doit renvoyer `{id: doc_id, ...data}` — l'`id` est **injecté**, il n'est pas dans `data` (cf. `FirestoreAdapter.ts:45`) |
| `query(coll, opts)` | `WHERE collection=$1 AND tenant_id=$2` + filtres compilés | voir G.1.4 |
| `set(path, data)` | `INSERT … ON CONFLICT (path) DO UPDATE SET data = EXCLUDED.data` | remplacement **total** |
| `set(path, data, {merge:true})` | `… DO UPDATE SET data = documents.data \|\| EXCLUDED.data` | `\|\|` jsonb = fusion **de surface**, ce qui correspond bien à `merge:true` Firestore au 1er niveau |
| `update(path, partial)` | `UPDATE … SET data = data \|\| $2 WHERE path=$1 RETURNING 1` | **si 0 ligne → `throw`.** `updateDoc` Firestore échoue sur document inexistant : `set` crée, `update` non. Perdre cette distinction casse silencieusement les appelants qui s'appuient dessus |
| `increment(path, f, n)` | `UPDATE … SET data = jsonb_set(data, ARRAY[$2], (COALESCE((data->>$2)::numeric,0) + $3)::text::jsonb)` | atomique sous MVCC **parce que c'est une seule instruction**. Un `SELECT` puis `UPDATE` perdrait l'atomicité et casserait l'Invariant #2 de concurrence stock (`StockDeductionHandler.ts:123`) |
| `create(path, data)` | `id = generateId()` puis `INSERT` sans `ON CONFLICT` | `addDoc` Firestore génère l'id ; ici c'est l'adapter qui le fait |
| `delete(path)` | `DELETE WHERE path=$1` | ne throw pas si absent (idem Firestore) |
| `generateId(coll)` | 20 caractères base62 tirés de `crypto.randomBytes` | même longueur/alphabet que Firestore : des ids sont stockés et comparés |
| `serverTimestamp()` | sentinelle interne → `now()` à l'écriture | **voir G.1.5 — critique NF525** |
| `batch()` | une transaction, opérations accumulées, `commit()` = 1 aller-retour | l'atomicité du lot est testée (D.3 cas 7) |
| `runTransaction(cb)` | `BEGIN` … `COMMIT`, `tx.get()` en `SELECT … FOR UPDATE` | le `FOR UPDATE` reproduit le verrouillage optimiste de Firestore. Rollback complet sur throw (D.3 cas 6) |

#### G.1.4 Compilation des filtres

`IQueryOptions.where` est un `QueryFilter[]` avec 11 opérateurs (`storage.contracts.ts:1-3`). Correspondances :

| Opérateur | SQL |
|---|---|
| `==` `!=` `<` `<=` `>` `>=` | `data->>'field' <op> $n` (avec cast selon le type de `value`) |
| `in` / `not-in` | `data->>'field' = ANY($n)` / `<> ALL($n)` |
| `array-contains` | `data->'field' @> $n::jsonb` |
| `contains` | `data->>'field' ILIKE '%'\|\|$n\|\|'%'` |

⚠️ **Notation pointée.** Le dépôt l'utilise déjà : `KDSDashboard.tsx:95` interroge `field: 'attributes.status'`. Le compilateur de filtres doit détecter le `.` et produire `data #>> '{attributes,status}'`, pas `data->>'attributes.status'`. **Un seul cas aujourd'hui, mais il casse silencieusement le KDS s'il est raté** — à mettre dans la suite de conformité.

⚠️ **Typage.** `data->>'x'` renvoie toujours du `text`. Un `where('total','>',100)` comparerait des chaînes (`"9" > "100"` est vrai en texte). Le compilateur doit caster selon `typeof value` : `(data->>'total')::numeric`.

#### G.1.5 `serverTimestamp()` — point NF525

`storage.contracts.ts:10-25` décrit `NexusTimestamp` comme opaque en écriture, avec « *Futur Postgres : `'NOW()'` SQL literal ou Date JS* ».

**Choisir `NOW()` côté serveur, pas `new Date()` côté client.** Renvoyer une `Date` JS ferait dépendre l'horodatage de l'horloge du poste — dérive d'horloge sur un horodatage qui entre dans la **chaîne de scellement fiscal** (ADR-003, `FiscalAdapter.sealEntry()`). L'implémentation renvoie donc un sentinelle interne que `set`/`update`/`batch` remplacent par `now()` dans le SQL généré.

Vérification obligatoire : `toNexusDate()` (`storage.contracts.ts:31`) doit accepter la valeur relue (Postgres renvoie une `Date` via `pg` — déjà couvert par la branche `ts instanceof Date`).

#### G.1.6 Immuabilité WORM — **meilleure qu'aujourd'hui**

`SovereignGuard.IMMUTABLE_COLLECTIONS` (`SovereignGuard.ts:39-52`) liste 12 collections : `fiscalLedger`, `haccpLogs`, `iotHistory`, `auditTrails`, `tenantConfig`, `ledger`, `fiscalSeals`, `seals`, `grandTotals`, `fiscalArchives`, `journalEntries`, `wormArchives`.

En Postgres, cette règle descend **dans la base** :
```sql
CREATE FUNCTION nexus_worm_guard() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'NF525_IMMUTABLE_COLLECTION: %', OLD.collection;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER worm_guard BEFORE UPDATE OR DELETE ON documents
  FOR EACH ROW WHEN (OLD.collection = ANY(ARRAY['fiscalLedger','journalEntries',…]))
  EXECUTE FUNCTION nexus_worm_guard();
```

**C'est plus fort que `firestore.rules`** : l'Admin SDK Firestore **outrepasse** les règles (c'est d'ailleurs assumé dans `NexusAdapter.ts:44-49`), alors qu'un trigger Postgres s'applique aussi au superutilisateur applicatif. Point à faire valoir dans le dossier NF525.

#### G.1.7 `onSnapshot` — le vrai point dur

Trois étages :

1. **Base** : trigger `AFTER INSERT OR UPDATE OR DELETE` → `pg_notify('nexus_changes', json_build_object('path',…,'collection',…,'tenant_id',…))`.
2. **Serveur** : une connexion `pg` persistante en `LISTEN nexus_changes`, qui relaie vers les clients abonnés (route Next.js en SSE, filtrée par tenant **côté serveur**).
3. **Client** : `getClientAuthProvider()` fournit le jeton, `EventSource` consomme le flux, l'adapter client (`HttpNexusAdapter`, §G.1.8) expose l'API `onSnapshot` habituelle.

⚠️ `pg_notify` est **plafonné à 8 000 octets** de charge utile et **non durable** (un message émis pendant une déconnexion est perdu). Donc : ne notifier **que le chemin modifié**, jamais le document ; le client refait un `get`. Et prévoir une resynchronisation au reconnect.

⚠️ En déploiement serverless (pas de processus long), `LISTEN` est impossible → repli sur `pollingSnapshot` / `pollingQuerySnapshot` (`src/lib/nexus/adapters/PollingSnapshotMixin.ts`, déjà écrit et déjà utilisé par `SimulacraAdapter.ts:199-210`). L'auto-hébergement sur serveur propre n'a pas ce problème.

#### G.1.8 L'adapter client devient un adapter HTTP

Conséquence directe de G.0 : côté navigateur, `DB_PROVIDER=postgres` n'installe **pas** `PostgresAdapter` (impossible), mais un **`HttpNexusAdapter`** qui implémente `INexusAdapter` en tapant des routes Next.js génériques :

```
POST /api/nexus/get         { path }
POST /api/nexus/query       { collectionPath, options }
POST /api/nexus/set         { path, data, options }
POST /api/nexus/update      { path, data }
POST /api/nexus/increment   { path, field, amount }
POST /api/nexus/create      { path, data }
POST /api/nexus/delete      { path }
POST /api/nexus/batch       { operations[] }
POST /api/nexus/transaction { operations[] }
GET  /api/nexus/subscribe   (SSE)
```

⚠️ **Ces routes sont la surface d'attaque la plus sensible de tout le système** : elles exposent un accès données générique par chemin. Elles doivent :
- passer par `requireAnyAuth` (corrigé au lot B1) ;
- **dériver le `tenantId` du jeton, jamais du chemin envoyé par le client** ;
- réappliquer `SovereignGuard` **côté serveur** (`NexusInterceptor` — `NexusAdapter.ts:29`), sans exception ;
- refuser tout chemin qui ne commence pas par `tenants/{tenantIdDuJeton}/` pour un appelant non-suzerain.

C'est exactement ce que `firestore.rules` fait aujourd'hui à la place de l'application. **Le lot G déplace cette responsabilité dans le code — c'est le cœur du risque du chantier**, et la raison pour laquelle la suite `SovereignGuard.test.ts` doit être étendue avant, pas après.

---

### G.2 — Compléter `KeycloakAuthProvider`

> **Contient une correction de sécurité à faire immédiatement, indépendamment du reste du lot.**

#### G.2.1 🔴 `jwt.decode` ne vérifie pas la signature

`src/lib/auth/ServerAuthProvider.ts:144` :
```ts
const decoded = jwt.decode(token, { json: true }) as Record<string, unknown> | null;
if (!decoded) throw new Error('Invalid Keycloak ID token');
```
`jwt.decode` **lit** le jeton, il ne le **vérifie pas**. Avec `AUTH_PROVIDER=keycloak`, un jeton forgé à la main portant `role: "mcc_super_admin"` serait accepté par les 216 routes API.

Non exploitable aujourd'hui (aucun environnement ne pose cette variable), mais c'est **le premier bug de production d'une bascule souveraine**. Correctif :
```ts
import { createRemoteJWKSet, jwtVerify } from 'jose';
const JWKS = createRemoteJWKSet(new URL(`${this.issuer}/protocol/openid-connect/certs`));
const { payload } = await jwtVerify(token, JWKS, { issuer: this.issuer, audience: process.env.KEYCLOAK_AUDIENCE });
```
(`jose` est à ajouter — **dépendance à faire valider**. Alternative sans nouvelle dépendance : `jwt.verify` de `jsonwebtoken`, déjà présent, avec récupération et cache manuels de la JWKS.)

**À traiter comme un correctif de sécurité autonome, avant le reste de G**, et à couvrir par un test « un jeton mal signé est refusé ».

#### G.2.2 Les 4 méthodes vides

| Méthode | État | À écrire |
|---|---|---|
| `createUser` | `throw not yet implemented` | `POST {issuer}/admin/realms/{realm}/users` |
| `setCustomClaims` | `throw not yet implemented` | attributs utilisateur + *protocol mapper* pour les exposer dans le jeton |
| `deleteUser` | `throw not yet implemented` | `DELETE .../users/{id}` |
| `getUser` / `getUserByEmail` | `return null` | `GET .../users?email=` |

Plus les deux ajouts des lots B1/B2 :
- `mfaUsed` / `mfaEnrolled` → mapper `amr` / `acr` du jeton OIDC et l'API *credentials* du realm ;
- `createSessionToken(uid, claims)` → JWT signé (`jsonwebtoken`, déjà dépendance racine) avec `AUTH_SESSION_SECRET`.

**Sans `createUser` et `setCustomClaims`, `POST /api/signup` (`route.ts:108,120`) et l'attribution de rôles (`api/admin/users/assign-role`) sont morts.** Ce ne sont pas des raffinements : c'est le provisioning tenant.

---

### G.3 — `S3StorageProvider`

Le plus léger du lot. `IStorageProvider` n'a que 3 méthodes (`src/lib/storage/types.ts`) : `upload`, `getDownloadUrl`, `delete`.

- `@aws-sdk/client-s3` est **déjà installé** (`package.json:43`).
- `S3BackupProvider` (`BackupProvider.ts:103-130`) fournit le gabarit exact : endpoint configurable (`BACKUP_S3_ENDPOINT` vide = AWS, sinon OVH / R2 / Scaleway / MinIO), région, clés.
- `getDownloadUrl` → URL pré-signée (`@aws-sdk/s3-request-presigner`) avec TTL court, **jamais** un bucket public : le stockage porte des pièces jointes RH et des justificatifs comptables.
- Conserver `tenantScopedKey.ts` pour le préfixage des clés — c'est ce qui isole les tenants dans le bucket.

Variables : `STORAGE_PROVIDER=s3`, `STORAGE_S3_ENDPOINT`, `STORAGE_S3_BUCKET`, `STORAGE_S3_REGION`, `STORAGE_S3_ACCESS_KEY`, `STORAGE_S3_SECRET_KEY`.

---

### G.4 — Schéma et migrations SQL

**Distinction à ne pas confondre** : `src/lib/migrations/MigrationRunner.ts` migre des **documents** (données), via `Nexus.adapter` — il est déjà provider-agnostique et **n'a rien à faire ici**.

Ce qui manque est le **DDL** : création de `documents`, des index, des triggers WORM, des policies RLS, et leur versionnement.

- Fichiers `sql/001_init.sql`, `sql/002_worm_triggers.sql`, `sql/003_rls.sql`…
- Un exécuteur simple au démarrage (table `schema_migrations`), ou `node-pg-migrate` (**dépendance à valider**).
- **Le DDL n'est pas multi-tenant** : une seule table `documents` pour tous les tenants, l'isolation vient de la RLS (§G.5). Pas de schéma par tenant — ça exploserait au-delà de quelques dizaines d'établissements.

---

### G.5 — Isolation : RLS PostgreSQL

L'équivalent souverain de `firestore.rules`.

```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON documents
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true));
```

Chaque requête ouvre avec `SET LOCAL app.tenant_id = $1`, valeur issue **du jeton vérifié**, jamais d'un en-tête.

⚠️ **Piège du pool de connexions.** `SET LOCAL` ne vit que le temps de la transaction — correct. Mais un `SET` **sans** `LOCAL` fuiterait d'un tenant à l'autre via une connexion recyclée par le pool. En mode *transaction pooling* (pgbouncer), c'est une faille d'isolation cross-tenant silencieuse, exactement ce que `SovereignGuard` existe pour empêcher. → **Toute requête doit être encapsulée dans une transaction**, y compris les lectures simples.

**La RLS ne remplace pas `SovereignGuard`, elle le double.** Défense en profondeur : `NexusInterceptor` (application) + RLS (base) + triggers WORM (base). Trois étages là où Firestore en offre deux.

---

### G.6 — `docker-compose` souverain

`docker-compose.yml` fait déjà tourner `app` + `sovereign-rag` (SQLite locale, volume monté). À étendre :

```yaml
services:
  app:            # existant — + DB_PROVIDER=postgres, AUTH_PROVIDER=keycloak, STORAGE_PROVIDER=s3
  postgres:       # postgres:17, volume persistant, DDL de G.4 au premier boot
  keycloak:       # realm préprovisionné (import JSON), volume
  minio:          # S3-compatible, buckets storage + backups
  sovereign-rag:  # existant, inchangé
```

Avec ça, `docker compose up` sur une machine sans aucun compte cloud doit lever une instance complète. **C'est le critère de sortie du lot G.**

---

### G.7 — Étendre la suite de conformité

`AdapterConformance.test.ts` (lot D.3) gagne une 4ᵉ entrée, derrière un Postgres de test (Testcontainers ou service CI) :

```ts
const ADAPTERS = [
  ['MockAdapter',      …],
  ['InMemoryAdapter',  …],
  ['SimulacraAdapter', …],
  ['PostgresAdapter',  () => new PostgresAdapter(TEST_DSN)],   // ← G
];
```

Les 12 cas de D.3 s'appliquent tels quels. **La suite écrite au lot D est le cahier des charges exécutable du lot G** : `PostgresAdapter` est fini quand elle est verte, pas avant.

Cas supplémentaires propres à G :

| # | Cas | Vise |
|---|---|---|
| 13 | `update` sur document inexistant → **throw** | G.1.3, divergence la plus probable |
| 14 | `where('attributes.status','in',[…])` → notation pointée | G.1.4, casse le KDS |
| 15 | `where('total','>',100)` sur 20 documents → comparaison **numérique** | G.1.4, cast |
| 16 | `UPDATE` / `DELETE` sur les 12 collections WORM → exception SQL | G.1.6 |
| 17 | Requête avec `app.tenant_id` du tenant B sur un chemin du tenant A → 0 ligne | G.5 |
| 18 | 100 `increment` concurrents sur **connexions distinctes** → total exact | G.1.3, atomicité réelle (pas simulée en mémoire) |
| 19 | `pg_notify` reçu après écriture dans une autre connexion | G.1.7 |

---

### G.8 Critère de sortie du lot G

- [ ] `docker compose up` sur une machine **sans aucun identifiant cloud** lève app + postgres + keycloak + minio + rag
- [ ] `AdapterConformance.test.ts` vert sur `PostgresAdapter` (12 cas communs + 7 cas G)
- [ ] Un jeton Keycloak **mal signé** est refusé (test dédié — G.2.1)
- [ ] Création d'un tenant de bout en bout via MCC : `signup` → `createUser` → `setCustomClaims` → `TenantSeeder` → login PIN → prise de commande POS → `JournalEntry` scellé
- [ ] `UPDATE` sur `journalEntries` renvoie une exception **au niveau base**, pas seulement applicative
- [ ] Un client authentifié tenant A ne peut lire aucun document tenant B, même en forgeant le chemin (test d'intégration sur `/api/nexus/get`)
- [ ] `grep -rn "firebase" package.json` → **peut être supprimé** sans casser le démarrage en mode souverain

---

### G.9 Charge et ordonnancement interne

| # | Travail | Poids | Dépend de |
|---|---|---|---|
| G.2.1 | 🔴 `jwt.verify` + JWKS — **correctif de sécurité** | léger | — *(à faire tout de suite)* |
| G.3 | `S3StorageProvider` | léger | A.4 |
| G.4 | DDL + versionnement SQL | moyen | — |
| G.1 | `PostgresAdapter` + `HttpNexusAdapter` + routes `/api/nexus/*` | **lourd** | D.3, F(b), G.4 |
| G.5 | RLS + triggers WORM | moyen | G.4 |
| G.2.2 | Keycloak Admin REST (4 méthodes + MFA + `createSessionToken`) | moyen | B1, B2 |
| G.7 | Conformance étendue | moyen | G.1 |
| G.6 | `docker-compose` souverain | léger | tout |
| — | **Extension du cache offline Dexie** (cf. G.0.bis) | **non chiffré** | arbitrage préalable |

**Dépendances non négociables** : `D.3 → G.1`, `F(voie b) → G.1`, `G.4 → G.5`.

---

## 13. Récapitulatif final

| Étape | Ce qu'on obtient | État |
|---|---|---|
| Lots **A→C** | Le switch de provider existe, les instruments sont justes | architecture réversible |
| Lot **D** | La portabilité est **prouvée** par une suite de conformité | portable, non porté |
| Lot **E** | Le code ne ment plus sur ce qu'il fait | lisible |
| Lot **F** | La barrière de sécurité ne dépend plus de Firestore | prérequis à G |
| Lot **G** | Un provider persistant souverain existe et tourne en local | **auto-hébergeable** |

**Formulation honnête à chaque étape** :
- après A→C : *« commutable »*
- après D : *« portable, prouvé portable, pas encore porté »*
- après G : *« installable sur des serveurs propres, sans compte cloud »*

Firestore reste le provider **par défaut** à toutes les étapes. L'objectif n'est pas de le retirer, c'est de pouvoir s'en passer.
