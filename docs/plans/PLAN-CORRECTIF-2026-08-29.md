# PLAN-CORRECTIF — 2026-08-29

> **Sujet** : ce qui, dans ce dépôt, **rend un vert alors que c'est rouge**.
> Routes ouvertes, chaîne fiscale forkée, gardes neutralisées en test, écrans qui
> affichent des données inventées, et un `preflight` qui imprime « prêt pour
> merge/deploy » avant de lancer la seule gate qui applique la Loi 8.
>
> ⚠️ **Loi 7 (Zero-Claim)** — chaque chiffre porte la commande qui l'a produit,
> exécutée le 2026-08-29 sur `perf/simulacra-coupe-circuit` (`e9a2895ff`).
> Ce sont des instantanés. Re-mesurer avant d'agir.
>
> ⚠️ **Loi 2** — trois cliquets sont actuellement **franchis** (§ 0.2).
> On les corrige à la source. On ne relève **jamais** un seuil.

---

## 0. La thèse en une phrase

Le dépôt a construit un appareil de contrôle impressionnant — 2 466 tests, 11 mesures
permanentes, 10 gates, un garde souverain, une chaîne de scellement — et **cet appareil
est branché à côté** : la garde multi-tenant est retirée côté serveur, la garde
cross-tenant s'auto-désactive sous `NODE_ENV=test`, l'audit de chaîne NF525 joint sur un
champ qui n'existe pas, les tests e2e ne sont exécutés par aucun runner, et l'échec de la
gate du dernier kilomètre n'a aucun effet sur le code de sortie.

**Ce n'est pas un problème de dette.** C'est un problème de **mesure de la dette** : les
instruments affichent vert. Tant qu'ils affichent vert, aucun des chantiers ci-dessous ne
se déclenchera tout seul.

### 0.1 Sept racines, quarante symptômes

| Racine | Symptômes qu'elle produit | Lot |
|---|---|---|
| **A** — `registerServerAdapter` monte l'adapter Admin SDK **brut**, sans `NexusInterceptor` ni `SovereignGuard` | 4 routes ouvertes, 51 routes à tenantId d'entrée, immuabilité NF525 non appliquée côté serveur | 1, 2 |
| **B** — **deux** protocoles de scellement écrivent dans la même collection `fiscalSeals` | fork déterministe de la chaîne, sceau sans `dataSnapshot`, audit de chaîne constant, verrouillage automatique de tenants sains | 3 |
| **C** — l'`eventId` est régénéré à chaque émission | idempotence ADR-001 inopérante, rejeu DLQ multipliant les handlers, double décrément de stock | 4 |
| **D** — les gardes ne se gardent pas elles-mêmes | `preflight` vert sur 3 cliquets franchis, `sentrux` filtré, mesure M2 fausse, garde désactivée en test, 32 fichiers e2e jamais exécutés | 0, 5 |
| **E** — des écrans affichent des données inventées | suivi DLC HACCP fictif, pourboires « comptabilisés » sans écriture, folios hôtel non persistés, 12 écrans de verticale en 🚧 | 6 |
| **F** — deux registres de navigation concurrents | 25 pages sans porte d'entrée, 2 liens vers du 404, 4 entrées restaurant qui fuient dans les 11 autres verticales | 7 |
| **G** — le polling ignore l'état de l'onglet et scanne intégralement | 10 scans complets d'IndexedDB toutes les 2 s écran éteint compris, purge « nucléaire » qui vide des écrans encore abonnés, **`previousHash` arbitraire en mode Simulacra** | 8 |
| **H** — le vocabulaire sectoriel et la langue sont câblés mais débranchés | `useLexicon` lit un champ inexistant ⇒ 11 lexiques sur 12 inatteignables, 1 406 chaînes FR en dur, devise verrouillée EUR **jusque sur les tickets imprimés** | 9 |

### 0.2 État mesuré des cliquets — trois sont franchis

```bash
node scripts/gate-last-mile.mjs ; echo "exit=$?"
```

| Compteur | Mesuré | Seuil | État |
|---|---:|---:|---|
| Écrans hors design system | **488** | 478 | ❌ franchi |
| Boutons sans nom accessible | **151** | 150 | ❌ franchi |
| Conteneurs cliquables sans clavier | **68** | 67 | ❌ franchi |
| Composants sans consommateur | 77 | 77 | ⚠️ à la limite |
| Réglages déclarés non lus | 177 | 177 | ⚠️ à la limite (et **faux**, cf. § 5.3) |
| Clés i18n absentes · props inertes · sceaux non canoniques · modales | 0 · 1 · 0 · 0 | 0 · 1 · 0 · 0 | ✅ |

`gate-last-mile.mjs` **sort en 1**. `preflight.sh` **sort en 0**. Voir § 0.3.

### 0.3 Le défaut qui explique tous les autres

`scripts/preflight.sh:263-269` :

```bash
echo -e "${GREEN}${BOLD}✅ Preflight complet — prêt pour merge/deploy${RESET}"   # ← ligne 263
step "🔗 [11/11] Dernier kilomètre — ce qui est écrit est-il atteint ?"
if node scripts/gate-last-mile.mjs; then
  ok "Dernier kilomètre : aucun compteur en hausse."
else
  fail "Dernier kilomètre : un compteur a augmenté (…)."                        # ← pas d'exit
fi
```

`fail()` est défini ligne 16 comme un simple `echo` en rouge. Les dix autres gates font
`fail … ; exit 1` — celle-ci, non. Et la bannière de succès est imprimée **avant** que la
gate ne tourne. Le fichier se termine sur un `echo` : le script sort en 0.

**Conséquence mesurable** : `.measures/history.jsonl` compte 24 points entre le
2026-08-26 et le 2026-08-29. `unreadSettings` 177 → 177, `i18nParity` 1024 → 1024,
`duplicates` 27 → 27. Trois indicateurs ont **monté** : `dsAdoption` 478 → 488,
`responsive` 107 → 111, `a11yKeyboard` 67 → 68. La dette n'a pas baissé parce que rien ne
l'y oblige.

---

## Lot 0 — Rendre les gardes bloquantes *(≈ 2 h — à faire avant tout le reste)*

Sans ce lot, tous les autres se dégraderont silencieusement dès leur livraison.

### 0.A — `preflight.sh` doit sortir en échec quand la Gate 6 échoue

- **Défaut** : `scripts/preflight.sh:268` — `fail` sans `exit 1`.
- **Correctif** : déplacer la bannière de succès **après** la gate, et ajouter `exit 1`
  dans la branche `else`, comme les dix autres gates du fichier.
- **Garde anti-régression** : étendre `scripts/verify-gate-integrity.mjs` pour exiger que
  chaque `fail "` de `preflight.sh` soit suivi d'un `exit 1` dans la même branche.
- **Effet immédiat attendu** : `npm run preflight` passe au rouge sur 488/478, 151/150,
  68/67. **C'est le résultat recherché.** Les trois écarts se résorbent à la source
  (Lot 7.C), jamais par relèvement de seuil.

### 0.B — `sentrux` : cesser de filtrer les violations et de sauter l'étape

- **Défaut** : `scripts/preflight.sh:179` filtre `grep -v "max_cc\|max_cycles\|no_god_files"`
  puis imprime `0 violation de frontière`. La réalité :

```bash
sentrux check .
# ✗ max_cycles: Found 2 circular dependencies, maximum allowed is 0
# ✗ max_cc: 1521 function(s) exceed max cyclomatic complexity of 12
# ✗ no_god_files: 18 god file(s) found
# ✗ 3 violation(s) found
```

- **Second défaut** : lignes 171-173 et 211-213 — si `sentrux` n'est pas installé, les
  étapes 7 **et** 8 sont sautées avec un `warn`. Un poste sans `sentrux` obtient un
  preflight vert sans aucun contrôle architectural.
- **Troisième défaut** : `.sentrux/baseline.json` (figée le 2026-08-24) enregistre
  `complex_fn_count: 1032` ; on est à **1521** (+47 %). Or `sentrux gate` compare
  Quality / Coupling / Cycles / God files — **jamais la complexité** — et répond
  `✓ No degradation detected`. La seule métrique qui a explosé est la seule qui n'est pas
  surveillée.
- **Correctif** : (1) faire de l'absence de `sentrux` une **erreur** en CI (tolérée en
  local avec un flag explicite) ; (2) sortir `max_cycles` du filtre — `max_cycles = 0`
  est déclaré dans `.sentrux/rules.toml:30`, il doit bloquer ; (3) ajouter
  `complex_fn_count` au cliquet, calibré à 1521 et **descendant** ; (4) remplacer le
  message `0 violation de frontière` par le décompte réel des trois familles.

### 0.C — Réactiver la garde cross-tenant dans les tests *(TESTS-01)*

- **Défaut** : `src/shared/nexus/guards/SovereignGuard.ts:318-321` —
  `if (process.env.NODE_ENV === 'test' && !process.env.STRICT_ISOLATION_TEST) return;`
  Or `STRICT_ISOLATION_TEST` n'est posée qu'en deux endroits :
  `src/e2e/vanguard/simulacra.test.ts:49` et `src/e2e/simulator/vanguard.sim.test.ts:68`
  — c'est-à-dire dans `src/e2e/**`, **le répertoire que `vitest.config.ts:12` exclut et
  que `playwright.config.ts` ne couvre pas** (§ 0.D). Les deux seuls fichiers qui activent
  la garde sont donc précisément ceux qui ne sont jamais exécutés.
  **Aucun des 2 466 tests qui tournent ne peut voir une fuite cross-tenant.**
- **Aggravant** : `tests/falange/isolation.test.ts:30-34` grave le trou en invariant en
  assertant que l'accès cross-tenant `resolves`. **Réparer la garde rendrait ce test rouge.**
- **Correctif** : poser `STRICT_ISOLATION_TEST=1` dans le bloc `env:` de `vitest.config.ts`
  (à côté de `NEXUS_TENANT_SECRET`), faire du contournement un opt-in par test, et
  réécrire `tests/falange/isolation.test.ts:30` en `.rejects.toThrow(NexusError)`.
- **Attendu** : des tests vont tomber. Chacun qui tombe est une fuite qu'on ne voyait pas.

### 0.D — Exécuter les tests e2e, ou les supprimer *(TESTS-02)*

- **Défaut** : `vitest.config.ts:13` exclut `src/e2e/**` et `tests/e2e/**` ;
  `playwright.config.ts` pointe `testDir: './tests'` ; le seul script Playwright du
  `package.json` est `measure:runtime` → `tests/measure`. **22 fichiers / 162 tests de
  `src/e2e` et 10 fichiers de `tests/e2e` ne tournent jamais** — dont
  `fiscal-signature`, `financial-bridge`, `event-bus`, `shield`, `rbac-matrix`,
  `pos-split-payment`.
- **Correctif** : script `test:e2e` branché dans `preflight.sh`, plus un projet Vitest
  dédié pour `src/e2e`. **Ou** suppression des 32 fichiers. Pas d'entre-deux : un filet de
  sécurité qui ne tourne pas est pire qu'un filet absent, il rassure.

---

## Lot 1 — Fermer les routes ouvertes *(≈ 4 h — P0, exploitable aujourd'hui)*

Quatre routes sont atteignables **sans aucun jeton**. Le `matcher` de
`src/middleware.ts:120` ne contient qu'une seule entrée API (`/api/admin/:path*`) : aucune
de ces quatre routes ne traverse le middleware.

| Route | Méthode | Ce que fait un anonyme | Fichier |
|---|---|---|---|
| `/api/promotions` | POST | écrit `tenants/{tenantId choisi}/promotions/{id}`, `discountPercent` non borné, émet `commerce.promotion_activated` | `src/app/api/promotions/route.ts:9,15,27` |
| `/api/mcc/contracts` | GET / POST | **lit toute la base commerciale de l'éditeur** (clients, verticales, pricing, statuts) ; crée un contrat au nom d'un client et récupère son `signingToken` | `src/app/api/mcc/contracts/route.ts:7-40` |
| `/api/facility/hardware/diagnostics` | GET / POST | énumère l'inventaire matériel d'un établissement tiers (nom du technicien, du directeur) ; déclenche des diagnostics écrivant des rapports | `src/app/api/facility/hardware/diagnostics/route.ts:8,25` |
| `/api/webhooks/thefork` | POST | garde **fail-open** : `if (process.env.THEFORK_WEBHOOK_SECRET && …)` — secret absent de `.env.example` ⇒ aucun contrôle, y compris en production. Annule ou crée des réservations chez n'importe quel tenant | `src/app/api/webhooks/thefork/route.ts:10,22` |

**Correctif commun** — pour chacune : `requireTenantRole` / `requireMccLevel` en tête,
puis n'utiliser **que** `caller.tenantId` pour composer le chemin, en ignorant le
`tenantId` d'entrée. Pour TheFork : refuser quand le secret est absent (comme
`checkFallbackWebhookSecret` le fait déjà), vérifier un HMAC du corps brut, et dériver le
tenant d'un mapping serveur `externalAccountId → tenantId`.

**Garde** : un test d'invariant qui échoue si un fichier `src/app/api/**/route.ts`
contenant la chaîne `` tenants/${ `` n'importe aucun garde de `adminAuthGuard`.

### 1.B — La confusion de député sur le tenant (51 routes)

- **Défaut** : `requireAnyAuth` authentifie mais n'expose **aucun** `assertTenant`. Le motif
  `searchParams.get('tenantId') || auth.tenantId` préfère donc l'entrée au jeton.
  **51 routes** prennent un `tenantId` de l'entrée ; **une seule** contient un contrôle de
  correspondance.
- **Cas le plus grave** : le portail comptable —
  `src/app/api/finance/accounting-portal/{pack,summary,transmit}/route.ts:15-16`. Un
  simple compte staff d'un tenant lit le **pack comptable mensuel complet** d'un
  concurrent (journal, TVA, NF525, anomalies) et déclenche une télétransmission comptable
  en son nom.
- **Correctif** : exposer `assertTenant(requested)` dans `requireAnyAuth` (403 si
  `requested !== auth.tenantId`, sauf rôle flotte) et l'appeler dans les 51 routes. Le
  motif correct existe déjà dans le dépôt : `fec/export` prend `caller.tenantId`.

### 1.C — Trois défauts d'authentification structurels

| ID | Défaut | Fichier | Correctif |
|---|---|---|---|
| API-04 | `requireAnyAuth` retombe silencieusement sur `tenantId = 'default'` quand le jeton ne porte aucun claim de tenant | `src/lib/server/requireAnyAuth.ts:83-88` | lever 401, ne pas fabriquer un tenant implicite |
| API-05 | **un secret unique** (`CONNECTORS_WEBHOOK_SECRET`) pour ubereats / deliveroo / justeat / google-reserve / sms-inbound, comparé avec `===` alors que `timingSafeCompareHex` est défini juste au-dessus et jamais appelé ; tenant cible pris dans `x-tenant-id` | `src/lib/server/webhookVerify.ts:40`, `webhooks/delivery/[provider]/route.ts:13` | un secret par provider **et** par tenant, HMAC du corps brut, comparaison à temps constant |
| T4 | `/api/haccp/iot-push` : `HACCP_GATEWAY_TOKEN` unique pour toute la flotte, physiquement déployé chez chaque client, + `tenantId` dans le corps | `src/app/api/haccp/iot-push/route.ts:23,32,46` | dériver le tenant du jeton présenté (`tenants/{id}/apiKeys`, comme `/api/tenant/api-keys/validate`) |

> **T4 mérite d'être lu deux fois.** `iotHistory` et `haccpLogs` sont dans
> `IMMUTABLE_COLLECTIONS` : append-only. N'importe quel détenteur du token — c'est-à-dire
> n'importe quel client équipé d'une passerelle — peut insérer un relevé falsifié dans le
> registre sanitaire d'un concurrent, **qui ne pourra ni le corriger ni le supprimer**.
> Registre HACCP durablement faux face à un contrôle DDPP.

---

## Lot 2 — Remettre `SovereignGuard` dans le chemin serveur *(≈ 1 j — racine A)*

- **Défaut** : `src/lib/nexus/NexusAdapter.ts:52-56` — le setter `adapter` enveloppe
  systématiquement d'un `NexusInterceptor` + `SovereignGuard` ; `registerServerAdapter`
  pose l'adapter **brut**, avec un commentaire assumant que « l'isolation est assurée par
  `adminAuthGuard` ».
- **Pourquoi c'est circulaire** : `firestore.rules` est correct (catch-all `if false`,
  `isImmutableCollection` refusant `update`/`delete` y compris au `fleet_admin`) — mais
  **l'Admin SDK outrepasse les règles**. C'est précisément pour cette raison que le garde
  applicatif serveur serait nécessaire. Il n'y a donc, côté serveur, **aucune barrière** :
  ni garde (retiré), ni règles (contournées), ni middleware (matcher restreint).
- **Correctif** : envelopper aussi l'adapter serveur, avec une variante serveur du garde
  qui lit un tenant **ancré par requête** (`AsyncLocalStorage` alimenté par le guard
  d'auth) au lieu du store Jotai, et refuse tout chemin `tenants/{X}/…` où `X` diffère du
  tenant ancré — sauf contexte MCC explicite.
- **Bénéfice** : c'est la défense en profondeur qui aurait empêché le Lot 1 d'exister.
  Elle transforme « chaque nouvelle route est un point de fuite potentiel » en « une route
  qui oublie son garde échoue ».

### 2.B — Deux trous dans l'intercepteur, côté client aussi

| ID | Défaut | Fichier |
|---|---|---|
| NF525-7 | `runTransaction` remet au callback un `guardedTx` qui **scope le chemin sans appeler `canUpdate`/`canDelete`** | `src/lib/nexus/NexusInterceptor.ts:192-204` |
| NF525-7 | `set()` passe par `intercept('WRITE')`, branche qui ne teste **jamais** `canUpdate` — le test ligne 270 n'est atteint que si `operation === 'UPDATE'` | `src/lib/nexus/NexusInterceptor.ts:269-272` |

`Nexus.adapter.set('tenants/x/journalEntries/<id existant>', …)` écrase donc une pièce
scellée sans lever `NF525_VIOLATION` ni émettre `ILLEGAL_WRITE_ATTEMPT`.

### 2.C — Purger IndexedDB à la déconnexion *(T6)*

`SimulatorDB.ts:22` — base Dexie **unique et globale** (`Nexus_Simulator_Sandbox`),
partagée par tous les tenants du navigateur. Le logout ne purge que `localStorage` et
`sessionStorage` (`auth/logout/page.tsx:36-38`) ; `SovereignStorage.clearAppStorage()` se
limite lui aussi à `localStorage.clear()`. Sur un poste de caisse partagé — le cas
nominal en restauration — les commandes, stocks et clients du tenant précédent restent
lisibles dans les devtools après déconnexion. **Correctif** : `await simulatorDb.delete()`
dans le flux logout et dans `SovereignBreachHandler`, et préfixer le nom de la base par le
`tenantId`.

---

## Lot 3 — Réunifier la chaîne fiscale *(≈ 2 j — P0 réglementaire)*

C'est le lot le plus sensible : il touche le cœur NF525. À traiter **après** le Lot 2
(l'immuabilité serveur en dépend) et avec une reprise de données.

### 3.A — Un seul protocole de scellement *(NF525-1, NF525-2)*

Deux mécanismes écrivent dans `tenants/{t}/fiscalSeals` :

| | Protocole A (correct) | Protocole B (racé) |
|---|---|---|
| Point d'entrée | `FiscalSealer.sealDataAtomically` | `FiscalEngine.sealEntry` |
| Chaînage | `runTransaction` lit/écrit `fiscalMeta/chainHead` | `query(orderBy timestamp desc, limit 1)` **hors transaction** |
| Met à jour `chainHead` | ✅ (`FiscalSealer.ts:130,158`) | ❌ **jamais** |
| Appelants | `FinancialNexusBridge.processOrder` (POS) | `reservations/deposit/route.ts:141`, `finance/bank/sync/route.ts:111`, `TransactionService.ts:57`, `MacroBrain.ts:183`, `AccountingService.ts:38`, `QualityEngine.ts:42,94`, `LegalArchiveService.ts:13`, `BlockchainLedgerService.ts:63` |

**Le fork est déterministe, sans même de concurrence** : vente POS → S1, `chainHead`=S1 ;
acompte Stripe (protocole B) → S2(prev=S1) mais `chainHead` reste S1 ; vente POS suivante
→ S3(prev=S1). **Deux sceaux portent le même `previousHash`.**

Pire encore, `QualityEngine.ts:42` et `:94` scellent **sans `lastSeal`** : chaque sceau
HACCP a `previousHash = GENESIS_ROOT`. Ce n'est pas une chaîne, c'est une empreinte
isolée — la suppression d'un enregistrement entier est indétectable.

**Correctif** : un seul point d'entrée, `sealDataAtomically`. Supprimer
`FiscalEngine.sealEntry` ou le faire lire/écrire `chainHead` dans `runTransaction`.
Supprimer le cache statique `BlockchainLedgerService.lastSealCache` (faux dès qu'il y a
plus d'un process). Migration : rejouer la chaîne existante et poser un `chainHead`
cohérent, sous scellement d'un point de reprise documenté.

### 3.B — Persister `dataSnapshot` dans le sceau *(NF525-3)*

`FiscalSealer.ts:160-167` écrit `{ id, hash, signature, previousHash, timestamp,
serverRecordedAt, isTrainingMode, registerId }` — **sans `dataSnapshot` ni
`transactionId`**. Le `FiscalSeal` complet est construit en mémoire par
`FinancialNexusBridge.ts:134-143` et seulement **retourné**.

Double défaillance :

1. `CryptoIntegrityCheckHandler` fait `if (!seal.dataSnapshot) continue` puis journalise
   « chaîne validée » — **un vert menteur** sur 100 % des sceaux POS ;
2. `FiscalEngine.verifyChain` (`FiscalEngine.ts:70-75`) recalcule sur une chaîne vide et
   renvoie `false` pour **tout tenant qui encaisse** — ce qui, via `FleetAdapter.ts:95` et
   `admin/fleet/cron/nf525-audit/route.ts:34`, pose `status: 'locked_nf525_breach'` :
   **verrouillage automatique de tenants sains**.

### 3.C — L'audit de chaîne ne peut rendre qu'un verdict constant *(NF525-4)*

`src/app/api/admin/compliance/chain-audit/route.ts:48` :

```js
const sealMap = new Map(seals.map(s => [s.entryId ?? '', s.hash ?? '']));
```

`entryId` **n'existe dans aucun schéma** — `finance.types.ts:8-20` déclare `transactionId`.
Toutes les clés valent `''`. Et lignes 53-58, `entry.dataSnapshot` / `entry.previousHash`
sont absents des `journalEntries` écrits. Vérifié :

```
clés de sealMap : [""]
entrée JE-1 → expectedHash=e3b0c44298fc1c14…  storedHash=""  → BREACH=true
sha256("") = e3b0c44298fc1c14 … (constante pour TOUTE entrée)
```

**`integrity` vaut `'BREACH'` sur 100 % des entrées, toujours.** Un tampering réel est
indiscernable d'un état sain. Et le docstring annonce « appelé par le cron hebdomadaire » :
`grep -rn "chain-audit" src scripts .github` ne rend **aucun appelant**.

**Correctif** : joindre par `transactionId` (ou par `journalEntry.fiscalSealHash`),
recalculer depuis le `dataSnapshot` du sceau une fois 3.B livré. **Deux tests
obligatoires** : un qui falsifie une pièce et exige `BREACH`, un sur base saine qui exige
`OK`. Sans les deux, on ne saura pas que le détecteur détecte.

### 3.D — Trois défauts de couverture du sceau

| ID | Défaut | Correctif |
|---|---|---|
| NF525-5 | `CryptoIntegrityCheckHandler.ts:32-42` recalcule chaque sceau **isolément** — la boucle ne référence jamais `sorted[i-1]` — et se limite à une fenêtre d'une journée : le maillon entre deux jours n'est jamais contrôlé | ajouter `seals[i].previousHash === seals[i-1].hash`, amorcer sur le dernier sceau de la veille |
| NF525-9 | `FinancialNexusBridge.ts:51-59` ne scelle que `{id, receiptNumber, operatorId, tableId, totalTTCInMicrounits, tvaBreakdown, timestamp}` — les `lines`, le `status`, `isValidated` et le `paymentMode` ne sont **pas** couverts. Une bascule espèces → CB laisse le hash valide | sceller le `journalEntry` canonique complet, ajouter `paymentMode` |
| NF525-8 | `reservations/deposit/route.ts:118-152` ne mémorise pas `event.id` Stripe et ne vérifie pas `depositJournalEntryId`. Stripe redélivre en at-least-once | table d'idempotence `tenants/{t}/stripeEvents/{event.id}` dans la même transaction |

### 3.E — Deux pièges latents repérés à la lecture

- **Le contrôle anti-fraude de la resynchro hors-ligne lit un champ jamais écrit.**
  `src/app/api/finance/sync/route.ts:44` — `entry.totalInMicrounits ?? (entry.amountInCents ?? 0) * 10_000`.
  Or `totalInMicrounits` est un champ des **commandes**, pas des `JournalEntry` :
  `buildEntryBase` écrit `amountInCents` **et** `amountInMicrounits`. Le contrôle ne
  fonctionne aujourd'hui **que grâce au champ cents déprécié**. Le jour où la migration
  microunits le retire — ce que `CLAUDE.md` prescrit — `declaredTotal` tombe à 0 et le
  contrôle dégénère en `0 === 0`, ou rejette tous les tickets. **Correctif** : lire
  `amountInMicrounits`, et couvrir par un test.
- **Le snapshot de la resynchro hors-ligne diffère de celui du POS en ligne**
  (`sync/route.ts:68-75` : `operatorId: 'OFFLINE_SYNC'`, **pas de `tvaBreakdown`**). La
  même vente n'est pas scellée sur le même périmètre selon qu'elle est passée en ligne ou
  hors ligne.
- **NF525-10 (à confirmer)** : `admin/fleet/cron/nf525-audit/route.ts:34` écrit sur
  `tenants/{tenantId}/tenantConfig` — chemin à 3 segments, donc une **collection**. Si
  l'adapter ne normalise pas, le kill-switch échoue au moment précis où il doit agir.

> **Ce qui est sain dans le fiscal, et qu'il ne faut pas casser** : la numérotation
> séquentielle des tickets (`generateSequentialReceiptNumber`, transaction atomique sur
> compteur), l'horodatage serveur autoritaire, l'isolation du mode formation, l'étanchéité
> du mode Simulacra, le contenu de `firestore.rules`, la resynchro hors-ligne (`tenantId`
> pris **exclusivement** du JWT, recalcul serveur des totaux), et le test
> `nf525-fiscal-sealing.test.ts:87-111` qui corrompt réellement un `dataSnapshot` signé et
> exige `verifyChain() === false` sur le vrai moteur, sans mock.

---

## Lot 4 — Rendre l'identité d'événement stable *(≈ 1,5 j — racine C)*

### 4.A — `eventId` dérivé d'une clé métier *(R3 — corrige R4, R5, R9)*

`ops.events.ts:14-26` : le payload `order.paid` ne déclare **ni `eventId` ni `id`**.
`NexusEventBus.ts:95,157` retombe donc sur `crypto.randomUUID()` **à chaque émission**.
Or la dedup outbox (`outbox_${eventId}_${event}`) et `IdempotencyGuard`
(`${eventId}_${handlerId}`) sont **toutes deux** clés sur cet `eventId`.

**L'ADR-001 est structurellement neutralisé.** Le « replay dedup » commenté
`NexusEventBus.ts:104-108` ne peut jamais se déclencher.

**Correctif** : dériver l'`eventId` d'une clé métier stable (`order.paid:${orderId}`), ou
rendre `eventId: string` **obligatoire** dans les interfaces d'événements — le compilateur
liste alors exactement le travail à faire. Idem pour `id` dans `EventHandlerOptions`
(*R10* : 216 abonnements sur 245 sans identifiant stable, donc clé d'idempotence et
référence DLQ instables d'un montage à l'autre).

⚠️ `src/__tests__/eventBus/idempotency-guard.test.ts:90-110` **asserte le comportement
fautif** (deux émissions sans `eventId` ⇒ handler appelé deux fois). Il faudra le retourner
en `toHaveBeenCalledTimes(1)`.

### 4.B — Inverser l'ordre du bootstrap *(R2 — 3 lignes, effet majeur)*

`NexusSyncBootstrap.ts:51` rejoue l'outbox ; ligne 54 seulement, les handlers sont
enregistrés. Or `NexusEventBus.ts:174-175` sort immédiatement quand la liste de handlers
est vide, et `outboxReplayer.ts:28-29` marque l'entrée `'done'` sans vérifier qu'un handler
a tourné — puis `empireAudit.log('OFFLINE_SYNC_VERIFIED')` **certifie une synchro qui n'a
rien fait**.

Sur un chargement à froid — le cas exact que l'outbox existe pour couvrir — la cascade est
drainée dans le vide et la preuve effacée.

**Correctif** : `registerNexusHandlers()` **puis** `replayPendingEvents()`. Et faire
retourner à `emit()` le nombre de handlers exécutés, pour ne marquer `'done'` que si au
moins un a tourné.

### 4.C — Le rejeu DLQ doit viser le handler fautif *(R4)*

`DLQRetryService.ts:52-57` rejoue avec `NexusEventBus.emit(entry.eventName, …)` alors que
l'entrée porte le `handlerId` fautif. Sept handlers sont abonnés à `order.paid`. Si seul
`DigitalReceiptHandler` échoue (SMTP indisponible), le retry rejoue les six autres :
**fidélité créditée deux fois, stock décrémenté deux fois, ticket Z alimenté deux fois** —
jusqu'à cinq fois (`MAX_ATTEMPTS = 5`).

**Correctif** : exposer `emitToHandler(event, handlerId, payload)` et l'utiliser dans
`processRetryQueue`.

### 4.D — Le décrément de stock ne doit plus avaler ses échecs *(R5)*

`StockDeductionHandler.ts:103` est en priorité `HIGH` (donc `isIdempotent = false` par
défaut, `NexusEventBus.ts:58`) et applique `increment(path, 'quantity', -qty)` — cumulatif,
rejouable à l'infini. Ses trois `Promise.allSettled` (`:30,:63,:77`) ne sont **jamais
inspectés** : aucun rejet ne remonte, le handler ne rejette jamais, il n'atteint jamais la
DLQ. Une écriture stock refusée passe **totalement** inaperçue.

**Correctif** : `{ idempotent: true }` explicite une fois 4.A livré, et agrégation des
rejets remontée en `throw` — à comparer avec `NexusEventBus.ts:210-233` qui, lui, inspecte
correctement ses rejets.

### 4.E — Deux constats à trancher en décision produit

- **R1 — le bus est strictement in-memory par onglet.** Aucun `BroadcastChannel`, aucune
  SSE, aucun WebSocket dans `src/shared/eventBus` ni `src/lib/nexus`. `ServerEventBus`
  appelle le même singleton dans le process Node. **Toute cascade supposée relier deux
  appareils (caisse → cuisine) est fausse** : ce qui parvient au KDS vient de la synchro
  documentaire Nexus des `orders`, pas du bus. → Soit on documente « bus = intra-onglet »
  et on retire toute promesse de cascade inter-postes, soit on ajoute un relais
  (BroadcastChannel multi-onglets + collection `events` écoutée en temps réel, avec
  élection de leader).
- **R7 — deux DLQ disjointes.** Le bus écrit dans `db.deadLetterEvents` (IndexedDB, local
  au poste) ; le dashboard MCC lit `tenants/{tid}/dead_letter_events` (serveur), alimentée
  uniquement par le `catch` de `ServerEventBus`. Nuance honnête : les entrées restent
  consultables localement via `EventBusHealthPanel` et `DLQDiagnosticPanel` — ce n'est pas
  « la DLQ meurt en silence », c'est « celle que le MCC affiche n'est pas celle qui se
  remplit », et elle disparaît si l'utilisateur vide les données du site.
- **R6** — 29 `NexusEventBus.emit` directs dans `src/app/api` contre 7 `dispatchServerEvent`.
  Les handlers serveur ne sont montés que par `dispatchServerEvent`. Le défaut n'est pas
  « ça ne marche jamais » mais pire : **c'est non déterministe**, fonction du recyclage
  d'instance (froide vs chaude). → règle ESLint interdisant `emit` sous `src/app/api/**`.
- **R8** — `DLQRetryService.ts:34` sort immédiatement hors navigateur : **aucun rejeu
  serveur**. Et `ServerEventBus.ts:47` écrit `status: 'pending_retry'`, absent du
  vocabulaire de l'UI (`'retry' | 'quarantine'`) — un filtre par statut ne le remontera
  jamais.

> **Ce qui est sain dans le bus** : zéro abonnement dans un composant React (les 245
> abonnements sont dans des `register*Handler()` en `.ts` renvoyant tous un `unsub`,
> effectivement libérés par `NexusSyncShutdown.ts:48`) — **la chasse aux fuites d'écouteurs
> est un faux problème sur ce dépôt** ; l'anti-boucle `inFlight` + profondeur 15 ; le
> backoff exponentiel plafonné avec quarantaine et escalade fiscale ; le rejeu manuel MCC
> protégé par RBAC ; et `PaymentLedgerHandler` idempotent par construction.

---

## Lot 5 — Réparer les instruments de mesure *(≈ 0,5 j)*

### 5.A — La mesure M2 est fausse depuis le 2026-08-26

`scripts/measure/measures.mjs:70` :

```js
for (const m of src.matchAll(/getSetting\(\s*['"]([a-z0-9_]+)['"]/g)) lus.add(m[1]);
```

Deux défauts : le motif capture le **premier** argument alors que la signature est
`getSetting<T>('page', 'clé', défaut)` ; et il exige `getSetting(` littéral, donc **rate
tous les appels génériques** `getSetting<number>(`. Contre-mesure indépendante :

```
declares(uniques)= 184 · lus en PROD = 38 · lus en TEST seulement = 3 · MORTS = 143
```

Le vrai chiffre est **143 morts, pas 177** ; **38 câblés, pas 7**. `CABLAGE.md` l'avait
établi le 2026-08-27 — **le correctif n'a jamais été porté dans le script**. Chaque
`npm run measure` sert donc encore le faux chiffre, et `UNREAD_SETTINGS_MAX=177` protège un
seuil qui n'a pas de sens.

**Correctif** : corriger le motif, recalibrer le cliquet à **143** (jamais au-dessus), et
relire les autres motifs de `measures.mjs` avec la même défiance.

### 5.B — Les autres chiffres de surface, remis d'aplomb

| Affirmation courante | Réalité mesurée | Commande |
|---|---|---|
| `tsc` 0 erreur | ✅ exact (sortie vide, exit 0) | `rtk proxy npx tsc --noEmit` |
| 2 466 tests passés | ✅ exact — mais **+ 1 fichier et 1 test ignorés**, et **32 fichiers e2e hors runner** (§ 0.D) | `rtk proxy npx vitest run` |
| 0 cycle | ✅ sur `src/` avec madge — mais `sentrux` en trouve **2** hors de ce périmètre | `npx madge --circular …` / `sentrux check .` |
| 0 violation sentrux | ❌ **3 violations** | `sentrux check .` |
| 177 réglages morts | ❌ **143** | § 5.A |
| 1 024 clés i18n manquantes | ⚠️ vrai mais hors sujet : **35 fichiers `.tsx` sur 925** appellent `t()` (115 sites). L'UI est traduisible à **~4 %** | `grep -rlE "\bt\(['\"\`]" src --include="*.tsx" \| wc -l` |
| 808 occurrences `InCents` | à re-mesurer : le cliquet du dépôt est calibré à **818** (`preflight.sh:127`) | `grep -rn "InCents" src/ --include="*.ts*" \| wc -l` |

`src/i18n/translations.ts:4` porte d'ailleurs son propre diagnostic : *« STATUT : DORMANT
— 0 composant UI n'utilise `t()` en dehors de `NexusCoreProvider`. Marché cible France →
monolingue assumé. »* — en contradiction frontale avec `CLAUDE.md` qui affirme
« i18n : infrastructure câblée et fonctionnelle ». **L'un des deux textes doit être
corrigé** ; tant que les deux coexistent, personne ne sait quelle est la cible.

### 5.C — Dette de test à combler *(TESTS-03, TESTS-05, TESTS-06)*

- Les **199 tests** de `src/__tests__/helpers/saga.*.test.ts` posent un `vi.spyOn`
  directement sur `Nexus.adapter` — **l'adapter déjà enveloppé**. La membrane
  interceptor + guard est court-circuitée dans la famille de tests la plus volumineuse.
  *Nuance honnête : ces tests ne sont pas tautologiques — le vrai code des handlers
  s'exécute, les mocks sont à la frontière. Le défaut est le contournement de la membrane.*
  → ajouter, par pilier, au moins un test de saga passant par le vrai `Nexus.adapter`.
- **14 des 18 fichiers** de `src/shared/nexus/guards` n'ont aucun test (`AuthGate`,
  `RoleGate`, `TwoFactorChallenge`, `InstanceGuard`, `SovereignLockout`…), ni la chaîne de
  transmission **EDI DGFiP** (`FiscalTransmitter`, `EDIMapper`, `EdiDgfipAdapter`).
  → prioriser `RoleGate` (matrice rôle → autorisé/refusé, cas rôle indéterminé),
  `InstanceGuard` (fail-closed attendu), `EDIMapper` (snapshot d'une CA3 connue).
- **11 assertions vides** (`expect(true).toBe(true)`), toutes concentrées dans
  `tests/falange/` et `tests/verification/` — c'est-à-dire les suites aux noms les plus
  rassurants. → les supprimer plutôt que de les laisser gonfler le compteur, et activer
  `vitest/expect-expect`.

> **Point positif notable** : **zéro** `.skip`, `.todo`, `.only`, `xit`, `xdescribe` dans
> tout le dépôt, et un seul test sans assertion sur 2 203. La discipline est là ; c'est le
> périmètre qui est mal découpé.

---

## Lot 6 — Débrancher les écrans qui mentent *(≈ 2 j — racine E)*

Un écran absent, le client le réclame. Un écran qui affiche des chiffres inventés, il le
croit.

| ID | Écran | Ce qu'il affiche | Ce qu'il fait |
|---|---|---|---|
| **F4** (P0) | `/haccp` → `PerishableAlertsTracker` | 4 lots inventés, `status` **codé en dur** (jamais calculé depuis `expiresAt`), dates gelées au 2026-08-2x | rien — aucun import Nexus |
| **F5** (P0) | `/pms` → `PmsPage` | 6 chambres inventées, soldes de folio de clients fictifs | `window.prompt` → state local → `toast.success`. **Aucune persistance, aucun `JournalEntry`, aucun `FiscalSeal`** |
| **F3** (P1) | `/staff?tab=planning` → `TipPoolManager` | 3 salariés fictifs | le bouton n'exécute que `setIsDistributed(true)` et bascule le libellé sur **« Pourboires Clôturés & Comptabilisés »** |

**F4 est un faux négatif sanitaire.** Le gérant ouvre `/haccp` pour son contrôle DLC, lit
« 2 à consommer rapidement, 1 périmé » — chiffres qui ne correspondent à aucun lot réel.
Ses vraies denrées proches de la DLC ne sont jamais signalées. En contrôle sanitaire,
l'écran ne prouve rien. → lire les lots depuis `logistics/stock`, calculer le statut depuis
`expiresAt` vs `Date.now()`, brancher `DLCExpiryJob` **qui existe déjà** dans
`src/lib/cron/`.

**F3 est aggravé par le fait que le vrai moteur existe.**
`TipDistributionService` (`src/modules/human/effectifs/hr/services/tipDistribution.ts`)
implémente la répartition déterministe, est testé, est utilisé par `PrepaieBuilder.ts:16`
— et **n'est jamais appelé par cette UI**. Bonus : le montant y est faux au regard de la
convention (`(45.5 * 10_000) as any` = 0,455 € au lieu de 45,50 €), compensé à l'affichage
par une division, avec un `as any` qui contourne le type branded `Microunits`.

### 6.B — Douze écrans de verticale sont des stubs 🚧

Traité au **Lot 9.B** — c'est le même mécanisme que la généralisation multi-verticale.

### 6.C — `/audit-portal` sert des chiffres gelés *(F8)*

`src/app/(admin)/audit-portal/page.tsx:14` — `snapshotDate: '2026-07-20'`, `62K LOC`,
`Trust Margin 7.2/10`, plus une arborescence de **prompts de refactoring destinés à une
IA**, expédiés dans le bundle client. Contraire à la Zero-Claim Policy. → brancher sur
`.measures/latest.json`, ou sortir la page du bundle.

---

## Lot 7 — Rendre le produit atteignable *(≈ 1,5 j — racine F)*

### 7.A — Deux registres de navigation concurrents *(F7)*

`CAPABILITY_WIRING` (`src/verticals/_shared/catalog/CapabilityWiring.ts`) associe à chaque
capability ses routes produit. **Ses seuls importateurs sont deux fichiers de test, un
script de certification et un ré-export de barrel** — aucun composant de layout. La nav
runtime est exclusivement `NAV_SECTIONS` (`src/config/navConfig.ts`), consommée par
`DesktopSidebar.tsx:6` et `LayoutResolver.tsx:12`.

**`/kiosk` et `/pms` sont câblés, testés, certifiés par `scripts/certify-vertical.ts` — et
inatteignables au clic.** La certification valide un câblage qu'aucun menu n'affiche.
Toute nouvelle verticale scaffoldée héritera du même angle mort.

→ Faire consommer `routesForCapabilities(activeKeys)` par `LayoutResolver`, **ou**
supprimer le registre. Puis ajouter à la Gate 6 : toute route de `CAPABILITY_WIRING` doit
apparaître dans une nav rendue.

### 7.B — 25 pages sur 86 sans porte d'entrée, 2 liens vers du 404 *(F1, F2)*

Après écartement des cas légitimes (`/offline`, entrées par QR code, pages légales), il
reste une vingtaine d'écrans applicatifs réels sans lien : `/hygiene`, `/suppliers`,
`/recruitment`, `/kiosk`, `/migration`, `/pms`, `/settings/branding`, `/settings/security`,
`/admin/mcc/dlq`, `/admin/simulation`, `/admin/dashboard`…

Et deux liens pointent vers une route inexistante : `/admin/settings` (depuis
`OnboardingChecklist.tsx` — **l'écran d'accueil d'un nouveau gérant** — et depuis
`MigrationGuide.tsx`) et `/blueprint/index.html` (depuis `Map3DOverlay.tsx`).

→ Pour chaque orphelin : lien depuis l'écran parent naturel, ou suppression. Étendre
`gate-last-mile.mjs` avec ce croisement, dans les deux sens.

### 7.C — La nav restaurant fuit dans les 11 autres verticales *(F6)*

`navConfig.ts:365-368` — `capabilities[item.requiredCapability] !== false` : une capability
**absente** reste **visible**. Or 4 des 31 capabilities exigées par la nav ne figurent dans
**aucun** des 12 `*-full-dna.ts` : `mod_purchasing`, `mod_delivery`, `mod_dark_kitchen`,
`mod_loyalty`. Le DNA `custom` en laisse **11** non déclarées.

Un cabinet vétérinaire, un garage, un salon de coiffure voient donc « Dark Kitchen & Hubs »,
« Commandes Livraison », « Achats & Économat » et « Fidélité & Gift Cards » dans leur menu.
**La promesse multi-verticale est trahie à l'endroit le plus visible du produit.**

→ Déclarer les 4 clés dans les 12 DNA, puis basculer le filtre en **fail-closed**
(`=== true`). Test d'invariant : tout `requiredCapability` de `navConfig` doit être présent
dans chacun des 12 DNA.

### 7.D — Résorber les trois cliquets franchis *(à la source)*

488 → 478 (design system), 151 → 150 (boutons muets), 68 → 67 (clavier). Le Lot 0.A rend
ces trois écarts bloquants ; ce lot les résorbe. `gate-last-mile.mjs` nomme les fichiers.

---

## Lot 8 — Performance et comportement runtime *(≈ 1 j — racine G)*

### 8.A — Le constat qui n'est pas une question de performance *(PERF-3, à traiter avec le Lot 3)*

`SimulacraAdapter.query` récupère les documents virtuels par un `.filter()` Dexie sur
`path` — champ **non indexé**, donc scan complet du fork — puis les fusionne en O(n·m) via
`findIndex`. Et **`options` (`limit`, `where`, `orderBy`) n'est jamais réappliqué au
résultat fusionné** : il n'agit que sur la source cloud.

Or `FiscalSealer.getLastSeal` (`FiscalSealer.ts:54`) demande précisément
`orderBy timestamp desc, limit 1`. En mode Simulacra **avec le coupe-circuit actif**,
`realResults` est vide : l'appel retourne **tous** les sceaux virtuels dans l'ordre
d'itération Dexie. `seals[0]` n'est plus le dernier sceau, et **le `previousHash` de la
chaîne NF525 devient arbitraire**.

**Le coupe-circuit `e9a2895ff` a donc rendu ce cas atteignable.** C'est une régression de
correction, pas de performance. → indexer `path` dans `simulatorDb.virtualStore`, puis
appliquer `options` au tableau fusionné pour que le contrat de l'adapter soit identique
quelle que soit la source.

### 8.B — La purge « nucléaire » vide des écrans encore abonnés *(PERF-4)*

`GlobalRegistryService.release(id)` appelle `forceNuclearPurge(store)` →
`purgeInactive(store, -1)`, qui parcourt **tout** le registre et remet
`{ data: [], loading: true }` sur chaque atome dont `usageCount === 0` — **pas seulement
celui relâché** (`GlobalRegistryService.ts:78-84,93,101-104,118`). La purge ne désabonne
rien : le poller garde son `lastSeen`, la donnée réelle n'a pas changé, donc `callback`
n'est plus jamais rappelé.

**Scénario** : le serveur ferme un écran secondaire (`usageCount` tombe à 0) ; la liste des
produits du POS resté ouvert ailleurs **se vide et affiche un spinner permanent** jusqu'à
la prochaine écriture dans `products`. Aucun message d'erreur, aucune reprise.

→ Ne purger que l'atome effectivement relâché, et couper l'abonnement en même temps que la
donnée (ou réinitialiser `lastSeen`).

### 8.C — Le coupe-circuit coupe le réseau, pas la boucle *(PERF-1, PERF-2)*

- `e9a2895ff` ne modifie qu'un fichier (`SimulacraAdapter.ts`, +54/−6) et n'entoure que
  `realAdapter.get` (`:82`) et `realAdapter.query` (`:101`). La boucle qui les émettait est
  intacte : `PollingSnapshotMixin.ts:67` (2 s par souscription), `:88`
  `JSON.stringify(data)` **à chaque tick**, que quelque chose ait changé ou non.
  → **~300 réveils du thread principal par minute** sur un POS au repos à 10 collections.
  Le gain annoncé (45×) est réel côté réseau, **nul côté CPU et batterie**.
- **Aucune conscience de l'onglet caché dans tout `src/`** :
  `grep -rn "visibilitychange\|document.hidden\|requestIdleCallback" src` → **0 occurrence**.
  Les 35 `setInterval` et les `setTimeout` récursifs tournent identiquement écran éteint.
  Les plus rapides : `KDSDashboard.tsx:66` et `KDSTicket.tsx:78` (1 s, pour une horloge),
  `TimeclockDashboard.tsx:76` (1 s), `DLQDiagnosticPanel.tsx:50` (4 s),
  `EventBusHealthPanel.tsx:33` (5 s). Tablette POS en veille sur un service de 8 à 12 h.

→ Un hook unique `useVisibleInterval` suspendant sur `document.hidden` et resynchronisant
au retour ; backoff adaptatif dans `createPoller` quand la donnée ne change pas ;
comparaison de version/`updatedAt` au lieu d'une sérialisation intégrale.

### 8.D — Trois dettes fiscales dormantes dans `BlockchainLedgerService`

| ID | Défaut | Sévérité |
|---|---|---|
| PERF-5 | `auditFullChain()` lit **toute** la collection WORM `fiscalSeals` sans `limit` ni pagination, **côté client** (`BlockchainLedgerService.ts:83-88`). À 150 tickets/jour sur 350 jours : ~52 500 documents, 25-30 Mo désérialisés dans l'onglet à chaque clic sur « auditer ». Sur tablette, l'onglet tombe avant la facture Firestore | P2 |
| PERF-6 | `lastSealCache` est un **statique de classe jamais purgé** ; le seul appelant de `reset()` est un benchmark e2e. Un `super_admin` MCC qui bascule du tenant A au tenant B sans recharger fait servir **le sceau de A comme `previousHash` du premier sceau de B** | P2 |
| PERF-7 | `sealWithChain` enchaîne sur `this.sealQueue = this.sealQueue.then(...)` **sans aucun `.catch`** : le premier rejet (clé fiscale absente) laisse la file en état rejeté **définitivement** — tous les scellements suivants de la session échouent sans reprise | P3 |

> Sévérités contenues parce que le seul appelant actuel de `sealWithChain` est le benchmark
> e2e — le chemin de production passe par `FiscalSealer`/`chainHead`. **Mais le cache est
> armé dès le premier `getLastSeal()`, et le piège attend le premier appelant de production.**
> À traiter en même temps que le Lot 3, qui unifie précisément ces chemins.

### 8.E — Le bundle : la Règle du Barrel empêche tout élagage *(PERF-8)*

41 `export *` répartis sur les 8 barrels piliers ; `package.json` ne déclare pas
`"sideEffects": false` ; `next.config.ts:90` ne liste `optimizePackageImports` que pour
`framer-motion`. Une page `"use client"` qui n'affiche qu'un export FEC
(`nf525/page.tsx:1,4`) rend candidats au bundle `BlockchainLedgerService`, `FiscalSealer`,
`TaxCalculator`, les atomes comptables et tous les schémas Zod du pilier.

→ Ajouter `"sideEffects": false` et déclarer les barrels piliers dans
`optimizePackageImports`. **Les deux sont compatibles avec la Règle du Barrel**, qui porte
sur la surface d'import, pas sur le bundling.

> **Ce qui est sain, vérifié** : **aucune fuite de timer** (pour chacun des 20 fichiers
> hors test armant un `setInterval`, un `clearInterval` existe) ; aucun timer au niveau
> module ; **aucun secret ni module serveur importé depuis un composant client** (sur 886
> fichiers `"use client"`, aucun n'importe `firebase-admin`, `node:*`, `fs` ou
> `server-only`) ; le poller lui-même est bien conçu (`setTimeout` récursif pour éviter le
> chevauchement, backoff plafonné, muselage d'`onError`) ; `GlobalRegistryService` utilise
> `WeakRef` + `FinalizationRegistry`.
>
> **Faux positif écarté** : les 33 % de fichiers `"use client"` sont une statistique de
> surface, pas un défaut — pour un POS temps réel la majorité des écrans doivent être
> interactifs. Le vrai levier de bundle est 8.E.

---

## Lot 9 — Généralisation multi-verticale et langue *(≈ 2 j — racine H)*

### 9.A — `useLexicon` lit un champ qui n'existe pas *(VERT-01 — une ligne)*

`src/shared/hooks/useLexicon.ts:23` :

```ts
const variant = tenantState?.activeTenantConfig?.platformVariant ?? 'restaurant';
```

**`platformVariant` n'existe nulle part ailleurs dans `src/`.** Le champ canonique, écrit
par les seeds et lu partout ailleurs, est `variant` — `ConnectorHub.ts:52` fait
`tenant.variant ?? 'restaurant'`, `florist-full-dna.ts:5` écrit `variant: 'florist'`.

L'optional chaining avale l'absence, le `?? 'restaurant'` s'applique **systématiquement**,
et le `switch` de 12 branches ne prend **jamais que la branche par défaut**. Et
`tsc` reste à 0 erreur parce que `interface TenantConfig` (`ops-contract.ts:115`) ne
déclare **ni** `variant` **ni** `platformVariant`.

**Conséquence** : un tenant `variant: 'garage'` ouvrant le sélecteur de postes du POS lit
« Table » (`TableButton.tsx:114`) et « Plan de Salle » (`TableSelectorHeader.tsx:28`) au
lieu de « Pont Élévateur ». Le ternaire
`lexicon.tableLabel === 'Table' ? 'Salle' : …` prouve que l'auteur traitait le restaurant
comme l'exception — **c'est le seul cas qui se produise jamais**.

Aucun test ne l'attrape : `lexicon.test.ts` importe les 12 constantes `*_LEXICON`
directement et **n'appelle jamais `useLexicon()`**.

→ Lire `activeTenantConfig?.variant`, **typer** `variant?: PlatformVariant` sur
`TenantConfig` (le compilateur devient alors le garde), remplacer le repli silencieux par
un repli journalisé, et monter le hook avec un tenant garage dans le test.

### 9.B — Douze routes de verticale rendent un placeholder 🚧 *(VERT-02)*

Le blueprint déclare `route` + `componentPath`, `XVertical.ts` la `lazy()`-importe :
**la route existe et est atteignable**, le composant retourne `VerticalPageStub`. Douze
fichiers `.tsx` de `src/verticals` font exactement **2 lignes**.

- **retail** : 5/5 (`RetailPOSPage`, `Catalog`, `Returns`, `Promotions`, `RetailStock`)
- **bakery** : 4/4 (`BatchProduction`, `Preorder`, `DisplayStock`, **`AllergenRegistry`**)
- **salon** : 3/3 (`AppointmentCalendar`, `StylistDashboard`, `CabinStock`)

Un tenant provisionné avec `RETAIL_FULL_DNA` (`mod_pos: true`, 102 lignes de seed) ouvre la
caisse de sa verticale et obtient un écran 🚧. **Aggravant** : la route `/allergens` de
bakery porte le label « Allergènes INCO » — **obligation réglementaire** (règlement UE
1169/2011) affichée comme livrée.

**Profondeur réelle mesurée** : `src/verticals` = 11 704 lignes dont ~6 000 dans
`_shared/`, soit **~390 lignes de code propre par secteur**, tests et types inclus. L'écran
métier le plus fourni du dépôt fait **104 lignes**.

→ Implémenter, ou retirer les routes du blueprint et marquer la variante `tier: 'preview'`.
**Garde** : faire échouer la Gate 6 quand un `componentPath` de blueprint résout vers un
module dont le seul export appelle `VerticalPageStub`.

### 9.C — `t()` n'a pas de repli, et le sélecteur de langue est exposé *(VERT-03, VERT-07)*

- `NexusCoreProvider.tsx:48,55` : sur clé absente, `t` retourne `fallback ?? key` —
  **aucun repli vers `fr`**. Le repli de `translations.ts:27-31` ne joue que si l'`import()`
  du module échoue, pas sur clé manquante. Et **108 des 109 appels `t()`** ne passent aucun
  second argument.
- Feuilles par locale : **fr 469 · en 473 · es 149 · ja 132 · pt 132**. Neuf sections de
  premier niveau présentes en `fr` sont **absentes de `es`** : `allergens`, `crm`,
  `customer`, `inventory`, `planning`, `pos`, `reservations`, `settings`, `sidebar`.
- Le sélecteur est **réellement exposé** (`LaunchpadStatusHub.tsx:84`). Un utilisateur qui
  choisit Español voit, sur le POS, l'inventaire, les réservations, les réglages et la
  sidebar, des chaînes du type `pos.checkout` — **pas du français de repli, la clé technique**.
- `NexusCoreProvider.tsx:34` initialise par `useState<Language>('fr')` : **aucune
  persistance**. `src/shared/store/languageAtoms.ts`, prévu pour ça, n'a aucun consommateur.
  L'utilisateur bascule en espagnol, voit des clés brutes, recharge, retrouve le français :
  le comportement paraît aléatoire.

→ Repli en cascade `langue → fr → key` ; persistance via `languageAtoms` + réglage tenant ;
Gate de parité qui échoue si une clé `fr` manque dans une locale **exposée par le
sélecteur**. Sinon : retirer `es`/`ja`/`pt` du sélecteur tant que la parité n'est pas là.

### 9.D — La devise est verrouillée sur EUR, jusque sur les tickets imprimés *(VERT-04)*

Trois implémentations concurrentes de formatage monétaire (`lib/formatters.ts:41-63,72`,
`lib/constants.ts:57`, `lib/shared-kernel.ts:59`) codent `'fr-FR'` et `'EUR'` en
**littéraux**, sans aucun paramètre. En face, `LocalizationDeriver` dérive correctement
CHF/GBP/USD et le plan comptable par pays — **et sa sortie n'a aucun consommateur en
production** : son unique référence hors tests est une carte descriptive du MCC dont le
`sampleOutput` est lui-même codé en dur.

**191 occurrences de `'fr-FR'`** et **76 de `currency:'EUR'`** dans `src`, dont **3 dans
`EscPosReceiptFormatter.ts`**. Un tenant suisse qualifié obtient `currency:'CHF'` du
dériveur et **imprime un ticket en euros**. Ce n'est pas cosmétique : c'est fiscal.

→ `formatCurrency(amount, { locale, currency })` alimenté par un `useMoneyFormat()`
résolvant depuis le contexte tenant ; fusionner les trois formateurs ; brancher
`deriveLocalization` sur le provisioning.

### 9.E — La portée du lexique et le texte en dur *(VERT-05, VERT-06, VERT-08)*

- `IVerticalLexicon` n'expose que **6 champs**, `useLexicon()` n'est appelé que dans
  **2 fichiers `.tsx` sur 887**, et **seul `tableLabel` est consommé**. Même une fois 9.A
  corrigé, la généralisation ne toucherait que le sélecteur de tables du POS. Restent
  **121 occurrences** de vocabulaire strictement restaurant en dur hors `src/verticals`
  (top : `RBACTenantMatrix` 7, `SimpleFloorPlanEditor` 5, `analytics/page` 4). **Aucun
  n'est réglementaire** — NF525/FEC/PCG n'emploient pas ce vocabulaire : tous sont
  généralisables.
- **1 406 chaînes françaises en dur dans le JSX**, sur **403 fichiers `.tsx` sur 887**
  (45 %), contre 109 appels `t()` — un rapport de **13:1**. Les 184 occurrences des 6 pages
  `legal/*` (13 %) sont **légitimes** au titre de la règle « ne jamais traduire les
  libellés réglementaires ». Le reste — dont `OnboardingWizard` (17), **le premier écran
  d'un nouveau tenant** — est à traiter.
- `VerticalPageStub.tsx:8` affiche « Module en cours de développement » en dur, et chaque
  `label` de route de blueprint est une chaîne française : **la navigation générée depuis
  les blueprints est mono-langue par construction**. → `labelKey` au lieu de `label`.

> **Ce qui est sain** : les 12 seeds DNA (93-105 lignes chacun) sont **réellement
> différenciés** — `florist-full-dna.ts` désactive `mod_kds`/`mod_haccp`/`mod_bar` et active
> `mod_storage_map`/`mod_quotes` : ce n'est pas un copier-coller. Les 12 blueprints
> (82-120 lignes) aussi. `KICKERS_BY_VARIANT` (209 lignes, 12 variantes × 8 piliers, cascade
> `variant → custom → restaurant`) est **le seul mécanisme de vocabulaire sectoriel
> correctement conçu du dépôt** — c'est le modèle à suivre pour 9.E. Les 14 derivers de
> `_shared/derivation/` (RbacDeriver 357 l., RgpdDeriver 242 l.) sont du code réel et testé :
> **la forge est substantielle, c'est son branchement en production qui manque.** Et le
> gating de navigation passe par `capabilities`, pas par `variant` — 9.A ne casse donc que
> le vocabulaire, pas la nav (vérifié avant de le classer P1 et non P0).
>
> **Faux positif écarté** : un premier motif « 788 fichiers teintés restaurant » capturait
> `<table>` HTML, les tables de base de données et `TableSelector`. Resserré aux termes sans
> homonyme technique : **121 occurrences réelles**.

---

## Ordonnancement

```
Lot 0  Rendre les gardes bloquantes           2 h    ← prérequis de tout le reste
Lot 1  Fermer les 4 routes ouvertes           4 h    ← exploitable aujourd'hui
Lot 9.A  useLexicon : le bon nom de champ    30 min  ← une ligne, 11 verticales réparées
Lot 2  SovereignGuard côté serveur            1 j    ← supprime la classe entière du Lot 1
Lot 3  Réunifier la chaîne fiscale            2 j    ← après Lot 2, avec reprise de données
   + 8.A (options ignorées) et 8.D (cache/file) : même périmètre, à faire ensemble
Lot 4  Identité d'événement stable          1,5 j
Lot 5  Réparer les instruments             0,5 j    ← parallélisable
Lot 6  Débrancher les écrans qui mentent      2 j
Lot 7  Rendre le produit atteignable        1,5 j
Lot 8  Performance (reste : 8.B, 8.C, 8.E)  0,5 j
Lot 9  Généralisation et langue (reste)      2 j
                                          ─────────
                                          ≈ 12 j
```

**Les Lots 0 et 1 ne se négocient pas** : le premier parce que sans lui rien ne tient dans
le temps, le second parce que quatre routes sont ouvertes en écriture sur les données de
n'importe quel client.

**Le Lot 9.A est sorti de son lot exprès** : c'est un nom de champ à corriger dans une
ligne, et il rend d'un coup atteignables les onze lexiques sectoriels qui existent déjà.
Meilleur rapport effet/effort du plan.

**Trois regroupements comptent plus que l'ordre** :
- **8.A avec le Lot 3** — l'`options` ignoré par Simulacra produit un `previousHash`
  arbitraire : c'est un défaut fiscal logé dans l'adapter, pas une question de vitesse.
- **8.D avec le Lot 3** — le cache statique de tête de chaîne et la file de scellement
  empoisonnable vivent dans `BlockchainLedgerService`, que le Lot 3 unifie de toute façon.
- **9.B avec le Lot 6** — un écran 🚧 et un écran qui affiche des données inventées sont le
  même problème vu par deux bouts : une promesse affichée sans mécanisme derrière.

---

## Ce qui est sain — à ne pas casser

L'inventaire ci-dessus est sévère parce qu'il cherche les défauts. Ce qui suit a été
vérifié et **tient** :

- **`adminAuthGuard`** dérive le tenant du claim JWT et **bloque explicitement** un
  `x-nexus-tenant-id` divergent pour un non-fleet, avec log.
- **`firestore.rules`** existe, se termine par un catch-all `if false`, et interdit
  `update`/`delete` sur `journalEntries` / `fiscalSeals` / `fiscalLedger` / `auditTrails`
  **y compris au `fleet_admin`**. Le client navigateur ne peut pas lire un autre tenant.
- **La resynchro hors-ligne** (`/api/finance/sync`) est exemplaire : `tenantId` pris
  **exclusivement** du JWT (`« tenantId du body intentionnellement ignoré »`), recalcul
  serveur obligatoire des totaux débit/crédit, scellement atomique.
- **La numérotation séquentielle des tickets** passe par une transaction sur compteur.
- **Le test de la chaîne fiscale** corrompt réellement un `dataSnapshot` signé et exige
  `verifyChain() === false`, sur le vrai `FiscalEngine`, sans mock.
- **Zéro fuite d'écouteur** : les 245 abonnements au bus sont dans des `register*Handler()`
  renvoyant tous un `unsub`, effectivement libérés au shutdown.
- **Le backoff DLQ** est sain (exponentiel plafonné, quarantaine, escalade fiscale) —
  c'est sa cible qui est fausse, pas sa mécanique.
- **Aucun import direct de `firebase/firestore`** hors des trois adapters dédiés.
- **Zéro `.skip` / `.todo` / `.only`** dans tout le dépôt.
- **`tsc` : 0 erreur**, sur 3 638 fichiers.

---

## Méthode

Chaque constat de ce plan a été produit par une commande exécutée le 2026-08-29 et
contre-vérifié par une tentative de réfutation explicite (le code est-il mort ? une garde
ailleurs rend-elle le scénario impossible ? le motif produisait-il un faux positif ?).
Les constats qui n'ont pas survécu à cette tentative ne figurent pas ici — par exemple la
chasse aux fuites d'écouteurs React, ouverte puis refermée : le dépôt est propre sur ce
point.

**Couverture** : neuf axes ont été instruits — contre-mesure, NF525, étanchéité tenant,
surface API, résilience, atteignabilité, qualité des tests, performance, généralisation —
plus l'intégrité du dispositif de contrôle, traitée en direct (§ 0.2, § 0.3, Lot 0).
**Soixante-quatre constats** ont été retenus sur ces axes — **18 P0, 23 P1, 63 confirmés,
1 à confirmer** — auxquels s'ajoutent ceux établis en direct (§ 0.2, § 0.3, § 5.A,
§ 5.B). Les faux positifs
écartés sont documentés dans les encadrés « ce qui est sain » de chaque lot, et ils sont
nombreux — c'est voulu : un audit qui ne dit jamais « j'ai regardé, c'est bon » n'est pas
un audit, c'est un réquisitoire.

**Un seul constat reste marqué « à confirmer »** : NF525-10, le chemin du kill-switch du
cron (§ 3.E). Tous les autres ont été confirmés par une commande relancée.

**Ce que ce plan ne couvre pas** : la dette de surface déjà inventoriée ailleurs
(`CABLAGE.md` pour les réglages et le bus, `UIUX.md` pour l'accessibilité et le design
system, `bouton.md` pour les boutons inertes). Ce plan ne la reprend que là où elle croise
un mécanisme cassé — les trois cliquets franchis du § 0.2, parce qu'ils sont le symptôme
visible du § 0.3.
