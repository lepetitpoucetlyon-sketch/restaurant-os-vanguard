# PLAN-CORRECTIF — LE RESTE — 2026-08-29

> Suite de `PLAN-CORRECTIF-2026-08-29.md`, après **vérification fichier par fichier** de
> l'arbre courant. Ce document ne reprend que **ce qui reste à faire**, plus trois défauts
> que la vérification elle-même a révélés.
>
> ⚠️ **Périmètre** — le plan initial a été écrit sur `perf/simulacra-coupe-circuit`
> (`e9a2895ff`). L'arbre courant est `main` (`8f48dd8e5`), **334 fichiers d'écart**. Tout ce
> qui suit a été re-vérifié sur `main` le 2026-08-29, pas recopié.
>
> ⚠️ **Loi 7** — chaque état porte la commande ou la ligne qui l'établit.

---

## 0. Où on en est

Sur les 24 items du plan initial, **23 sont faits ou partiellement faits**, **13 restent**.
Ce qui a été livré est réel et vérifié : `preflight` sort enfin en échec, trois routes
ouvertes sont fermées, le sceau fiscal persiste son `dataSnapshot`, l'audit de chaîne a été
réécrit correctement, l'ordre du bootstrap est inversé, la parité i18n est atteinte, et les
trois cliquets franchis sont résorbés.

**Ce qui reste n'est pas le reliquat facile.** C'est la partie structurelle : les deux
protocoles de scellement coexistent toujours, la garde souveraine est toujours hors du
chemin serveur, et `assertTenant` a été écrit sans jamais être appelé.

### 0.1 Tableau de reprise

| # | Item | État vérifié |
|---|---|---|
| 1 | `assertTenant` sur les 51 routes à tenantId d'entrée | 🔴 fonction écrite, **0 appelant** |
| 2 | Filtre `sentrux` dans `preflight` | 🔴 intact |
| 3 | `SovereignGuard` côté serveur | 🔴 intact |
| 4 | `set()` non gardé (intercepteur + transaction) | 🟠 `update`/`delete` gardés, `set` non |
| 5 | Deux protocoles de scellement | 🔴 **11 appelants** de `FiscalEngine.sealEntry` |
| 6 | Continuité de chaîne dans le contrôle quotidien | 🔴 intact |
| 7 | Idempotence Stripe (acompte) | 🔴 intact |
| 8 | `eventId` stable | 🔴 intact |
| 9 | Rejeu DLQ ciblé sur le handler fautif | 🔴 intact |
| 10 | Purge IndexedDB au logout | 🔴 intact |
| 11 | `/pms` — folios non persistés | 🔴 intact |
| 12 | Pourboires — « comptabilisés » sans écriture | 🟠 calcul branché, **écriture toujours absente** |
| 13 | `useLexicon` lit `platformVariant` | 🔴 intact |
| 14 | 12 écrans de verticale en stub 🚧 | 🔴 intact |
| 15 | Tests e2e jamais exécutés | 🔴 **aggravé** — l'exclusion est passée de 2 à 4 entrées |
| 16 | `STRICT_ISOLATION_TEST` dans `vitest.config.ts` | 🟠 le test a été réécrit, la variable n'est pas dans `env:` |
| 17 | Cliquets devenus lâches | 🆕 4 seuils, aucun avertissement |

---

## Lot A — Ce qui a été écrit et jamais branché *(≈ 3 h — priorité absolue)*

Trois correctifs existent dans le code et ne servent à rien. C'est la forme la plus coûteuse
de dette : le travail est payé, le risque est intact, et le prochain lecteur croit le
problème réglé.

### A.1 — `assertTenant` : 0 appelant

```bash
grep -rn "assertTenant(" src --include="*.ts" | grep -v "export function"   # → vide
```

La fonction existe (`src/lib/server/requireAnyAuth.ts:108`). Les trois routes du portail
comptable font toujours :

```
pack/route.ts:15      const tenantId = searchParams.get('tenantId') || auth.tenantId;
summary/route.ts:15   const tenantId = searchParams.get('tenantId') || auth.tenantId;
transmit/route.ts:16  const { tenantId = auth.tenantId, period, provider } = body;
```

**Un compte staff d'un tenant lit toujours le pack comptable mensuel complet d'un
concurrent** — journal, TVA, NF525, anomalies — et déclenche une télétransmission en son nom.

**Correctif** — dans les trois routes :

```ts
const tenantId = assertTenant(auth, searchParams.get('tenantId'));
```

Puis le passer sur les 48 autres routes qui acceptent un `tenantId` d'entrée.

**Garde** : un test d'invariant qui échoue si un fichier `src/app/api/**/route.ts` lit
`tenantId` depuis `searchParams`/`body` sans appeler `assertTenant` dans la même fonction.

### A.2 — `STRICT_ISOLATION_TEST` absent de `vitest.config.ts`

`tests/falange/isolation.test.ts` a bien été réécrit en `.rejects.toThrow()` — **bon
correctif**. Mais il pose la variable lui-même :

```ts
process.env.STRICT_ISOLATION_TEST = '1';
try { await expect(SovereignGuard.validateAccess(…)).rejects.toThrow(); }
finally { delete process.env.STRICT_ISOLATION_TEST; }
```

Il prouve donc que la garde **peut** lever. Il ne la rend pas active pour les 2 400 autres
tests : `SovereignGuard.ts:319` retourne toujours silencieusement, et `vitest.config.ts`
n'a que `NEXUS_TENANT_SECRET` dans son bloc `env:`.

**Correctif** :

```ts
env: {
  NEXUS_TENANT_SECRET: 'test-secret-for-vitest',
  STRICT_ISOLATION_TEST: '1',
}
```

Puis retirer la pose/dépose locale du test, et faire du contournement un opt-in explicite
pour les rares tests qui en ont besoin. **Attendu : des tests vont tomber.** Chacun qui
tombe est une fuite qu'on ne voyait pas.

### A.3 — Les 12 lexiques sectoriels sont inatteignables *(30 min, le meilleur ratio du plan)*

`src/shared/hooks/useLexicon.ts:23` :

```ts
const variant = tenantState?.activeTenantConfig?.platformVariant ?? 'restaurant';
```

`platformVariant` n'existe **nulle part ailleurs** dans `src/`. Le champ canonique est
`variant` (`ConnectorHub.ts:52`, les 12 seeds). Le `?? 'restaurant'` s'applique donc
**toujours**, et le `switch` de 12 branches ne prend jamais que la branche par défaut.
`tsc` reste à 0 parce que `TenantConfig` (`ops-contract.ts:115`) ne déclare **ni l'un ni
l'autre**.

**Correctif** : lire `activeTenantConfig?.variant`, **typer** `variant?: PlatformVariant`
sur `TenantConfig` — le compilateur devient alors le garde — et remplacer le repli
silencieux par un repli journalisé. Ajouter un test qui **monte le hook** avec un tenant
`garage` (le test actuel importe les 12 constantes sans jamais appeler `useLexicon()`).

---

## Lot B — Réunifier la chaîne fiscale *(≈ 2 j — le gros morceau restant)*

Les correctifs 3.B et 3.C ont été livrés et sont bons. Il reste la racine.

### B.1 — Un seul protocole de scellement

```bash
grep -rn "FiscalEngine.sealEntry(" src --include="*.ts" | grep -vE "\.test\.|e2e" | wc -l   # → 11
grep -n "chainHead" src/lib/mcc/fiscal/FiscalEngine.ts                                      # → vide
```

Onze appelants de production passent toujours par `FiscalEngine.sealEntry`, qui déduit
`previousHash` d'un `query(orderBy timestamp desc, limit 1)` **hors transaction** et
n'écrit **jamais** `chainHead` :

```
app/api/reservations/deposit/route.ts:141      modules/compliance/services/QualityEngine.ts:42
app/api/finance/bank/sync/route.ts:111         modules/compliance/services/QualityEngine.ts:94
modules/intelligence/services/MacroBrain.ts:183 modules/finance/…/BlockchainLedgerService.ts:63
modules/compliance/services/LegalArchiveService.ts:12,13  modules/finance/…/AccountingService.ts:38
modules/finance/services/TransactionService.ts:57   modules/human/services/NexusPayrollEngine.ts:61
```

Le fork reste **déterministe, sans concurrence** : vente POS → S1, `chainHead`=S1 ; acompte
Stripe → S2(prev=S1) sans toucher `chainHead` ; vente suivante → S3(prev=S1). Deux sceaux
au même `previousHash`.

**Et l'audit de chaîne réécrit le verra maintenant** — il vérifie
`previousHash === prevSeal.hash`. Le correctif 3.C a donc rendu le défaut B.1 **visible** :
tout tenant qui encaisse et prend un acompte rendra `BREACH`.

**Correctif** : un seul point d'entrée, `FiscalSealer.sealDataAtomically`. Supprimer
`FiscalEngine.sealEntry`, ou le faire lire/écrire `chainHead` dans `runTransaction`.
Reprise de données : rejouer la chaîne existante par tenant et poser un `chainHead`
cohérent, sous point de reprise documenté.

**Ordre** : à faire **avant** de brancher un cron sur `chain-audit`, sinon l'alarme se
déclenche sur des chaînes que ce lot va réparer.

### B.2 — Trois compléments sur le même périmètre

| Item | Défaut | Correctif |
|---|---|---|
| Contrôle quotidien | `CryptoIntegrityCheckHandler.ts` ne compare toujours pas `sorted[i-1].hash` et se limite à une fenêtre d'une journée | ajouter la continuité, amorcer sur le dernier sceau de la veille |
| Idempotence Stripe | `reservations/deposit/route.ts` n'a ni table `stripeEvents`, ni court-circuit sur `depositJournalEntryId`. Stripe redélivre en at-least-once | écrire `tenants/{t}/stripeEvents/{event.id}` dans la même transaction que la pièce |
| Ancrage genesis | `chain-audit` ne vérifie pas que `sortedSeals[0].previousHash === GENESIS_ROOT`, et trie par `timestamp` client alors que `serverRecordedAt` existe maintenant | ancrer le premier maillon, trier par `serverRecordedAt` |

### B.3 — `set()` peut toujours écraser une pièce scellée

`NexusInterceptor.ts` : `update` et `delete` sont gardés (y compris dans `runTransaction`,
`:203`), mais **`set` ne l'est pas** — ni dans la transaction (`:197-200`, scope seul), ni
dans la branche principale (`operation === 'UPDATE'` ligne 285 ; `WRITE` n'est jamais
testé).

`Nexus.adapter.set('tenants/x/journalEntries/<id existant>', …)` écrase donc une pièce
scellée sans lever `NF525_VIOLATION`.

**Correctif** : dans la branche `WRITE`, tester `canUpdate` **quand le document existe
déjà** ; router `guardedTx.set` par la même garde.

---

## Lot C — La garde souveraine côté serveur *(≈ 1 j)*

```
src/lib/nexus/NexusAdapter.ts — registerServerAdapter(adapter) { … }
logger.info('[Nexus] Server adapter registered (raw, no interceptor)')
```

Inchangé. Le commentaire assume que « l'isolation est assurée par `adminAuthGuard` ». Or
l'Admin SDK **outrepasse `firestore.rules`** : côté serveur il n'existe donc aucune
barrière — ni garde (retirée), ni règles (contournées), ni middleware (matcher restreint à
`/api/admin`).

C'est le mécanisme qui a produit les quatre routes ouvertes du plan initial. Les fermer une
par une traite les symptômes ; ce lot traite la cause.

**Correctif** : envelopper l'adapter serveur d'un intercepteur, avec une variante serveur du
garde qui lit un tenant **ancré par requête** (`AsyncLocalStorage` alimenté par le guard
d'auth) et refuse tout chemin `tenants/{X}/…` où `X` diffère du tenant ancré, sauf contexte
MCC explicite. Le `SovereignGuard` est purement fonctionnel sur le chemin — il n'a pas
besoin du store Jotai.

**Bénéfice** : « une route qui oublie son garde est un point de fuite » devient « une route
qui oublie son garde échoue ».

### C.2 — Purger IndexedDB à la déconnexion

Aucune purge (`grep simulatorDb.delete|indexedDB.deleteDatabase|clearFork` sur le flux
logout → vide). La base Dexie est unique et globale (`Nexus_Simulator_Sandbox`) ; le logout
ne vide que `localStorage`/`sessionStorage`. Sur un poste de caisse partagé, les commandes,
stocks et clients du tenant précédent restent lisibles dans les devtools.

**Correctif** : `await simulatorDb.delete()` dans le flux logout **et** dans
`SovereignBreachHandler` ; préfixer le nom de la base par le `tenantId`.

---

## Lot D — L'identité d'événement *(≈ 1,5 j)*

Le correctif 4.B (ordre du bootstrap) et 4.D (agrégation des rejets de stock) sont livrés
et bons. La racine reste.

### D.1 — `eventId` stable

```bash
grep -c "eventId" src/shared/eventBus/events/ops.events.ts   # → 0
```

Le bus retombe sur `crypto.randomUUID()` à chaque émission. La dedup outbox
(`outbox_${eventId}_${event}`) et l'`IdempotencyGuard` (`${eventId}_${handlerId}`) sont
**toutes deux** clés dessus : l'ADR-001 reste structurellement neutralisé.

**Correctif** : dériver d'une clé métier stable (`order.paid:${orderId}`), **ou** rendre
`eventId: string` obligatoire dans les interfaces d'événements — le compilateur liste alors
exactement le travail. Idem pour `id` dans `EventHandlerOptions`.

⚠️ `src/__tests__/eventBus/idempotency-guard.test.ts:90-110` asserte le comportement fautif
(deux émissions sans `eventId` ⇒ handler appelé deux fois). À retourner en
`toHaveBeenCalledTimes(1)`.

### D.2 — Le rejeu DLQ vise toujours tous les handlers

`DLQRetryService.ts:55` fait `NexusEventBus.emit(entry.eventName, …)` alors que l'entrée
porte le `handlerId` fautif. Sept handlers sont abonnés à `order.paid` : si seul
`DigitalReceiptHandler` échoue, le retry rejoue les six autres — jusqu'à cinq fois.

**Correctif** : `emitToHandler(event, handlerId, payload)`, utilisé dans
`processRetryQueue`. **Note** : maintenant que 4.D fait remonter les échecs de stock en
`throw`, `StockDeductionHandler` **atteint réellement la DLQ** — ce qui rend D.2 plus urgent
qu'avant le correctif, pas moins.

---

## Lot E — Les écrans qui affirment sans écrire *(≈ 1 j)*

`PerishableAlertsTracker` est réparé (il lit Nexus). Restent deux écrans.

### E.1 — Pourboires : le calcul est vrai, l'enregistrement est faux

`TipPoolManager.tsx` appelle maintenant réellement
`TipDistributionService.distribute(totalMicrounits, staff, rule)` — bon correctif. Mais :

```bash
grep -cE "Nexus|emit|await" src/modules/human/effectifs/hr/components/TipPoolManager.tsx  # → 0
```

```ts
const handleCloture = () => {
  setIsDistributed(true);
  toast.success("Pourboires répartis et enregistrés selon la convention HCR");
};
```

**Le libellé est devenu plus affirmatif qu'avant** — « enregistrés selon la convention HCR »
— alors que rien n'est écrit. À la préparation de paie, aucun pourboire n'est déclaré.

**Correctif** : charger les employés du shift depuis le tenant (les participants sont encore
une liste locale), persister le résultat via Nexus, émettre l'écriture comptable, **puis**
seulement afficher la confirmation. Tant que l'écriture n'existe pas, le toast doit dire
« calculé », pas « enregistré ».

### E.2 — `/pms` : les folios ne survivent pas à un rechargement

`SAMPLE_ROOMS` toujours présent. `handleChargeRoom` fait `window.prompt` → state local →
`toast.success`. Aucun `JournalEntry`, aucun `FiscalSeal`. Viole en outre la convention
microunits (`balanceCents`/`chargeCents`).

**Correctif** : brancher `rooms`/`folios` sur Nexus, faire passer l'imputation par
`FinancialNexusBridge.processOrder()`, remplacer `window.prompt` par un modal, convertir en
`toMicrounits()`.

### E.3 — Douze écrans de verticale rendent 🚧

```bash
grep -rl "VerticalPageStub" src/verticals --include="*.tsx" | grep -v _shared | wc -l   # → 12
```

retail 5/5, bakery 4/4, salon 3/3. La route existe et est atteignable ; le composant rend un
placeholder. **Aggravant** : `/allergens` (bakery) porte le label « Allergènes INCO » —
obligation réglementaire UE 1169/2011 affichée comme livrée.

**Correctif** : implémenter, ou retirer les routes du blueprint et marquer la variante
`tier: 'preview'`. **Garde** : Gate 6 échoue quand un `componentPath` de blueprint résout
vers `VerticalPageStub`.

---

## Lot F — Refermer le dispositif de contrôle *(≈ 3 h)*

### F.1 — `preflight` filtre toujours les violations `sentrux`

`scripts/preflight.sh:179` :

```bash
BOUNDARY_VIOLATIONS=$(echo "$CHECK_OUT" | grep -E "\[Error\]" | grep -v "max_cc\|max_cycles\|no_god_files")
```

Réalité mesurée : `sentrux check .` → **2 violations** (1 cycle, 1 517 fonctions > cc12).
`no_god_files` a été résolu (18 → 0) et les cycles sont passés de 2 à 1 — mais preflight ne
l'aurait jamais dit dans un sens comme dans l'autre.

Et les deux `warn "sentrux non installé — étape sautée"` (`:172`, `:212`) laissent un poste
sans `sentrux` passer au vert sans aucun contrôle architectural.

**Correctif** : sortir `max_cycles` du filtre (`max_cycles = 0` est déclaré dans
`.sentrux/rules.toml:30`, il doit bloquer) ; faire de l'absence de `sentrux` une erreur en
CI ; ajouter `complex_fn_count` au cliquet, calibré à **1 517** et descendant — `sentrux
gate` ne le compare toujours pas.

### F.2 — Les tests e2e : l'exclusion a grossi

`vitest.config.ts:12` excluait `tests/e2e/**` et `src/e2e/**`. Il exclut maintenant **aussi**
`tests/verification/**` et `tests/falange/sync.test.ts`. Toujours aucun script `test:e2e`,
et `playwright.config.ts` pointe `testDir: './tests'`.

**Une liste d'exclusion qui grandit est un cliquet à l'envers.**

**Correctif** : script `test:e2e` branché dans `preflight.sh`, plus un projet Vitest dédié
pour `src/e2e` — **ou** suppression des fichiers. Et un cliquet sur la **longueur** de la
liste `exclude`, qui ne doit que descendre.

### F.3 — Quatre cliquets sont lâches, et rien ne le dit

| Compteur | Mesuré | Seuil | Marge |
|---|---:|---:|---:|
| Réglages déclarés non lus | 147 | 177 | **30** |
| Écrans hors design system | 472 | 478 | 6 |
| Composants sans consommateur | 76 | 77 | 1 |
| Erreurs avalées | 193 | — | — |

`gate-last-mile.mjs:64` ne teste que `valeur <= max`. Contrairement au ratchet BARREL de
`preflight.sh` qui affiche « baisse le seuil ! », rien ne resserre. **Trente réglages
peuvent mourir en silence sous le seuil de 177.**

**Correctif** : ajouter la branche `valeur < max` → avertissement explicite nommant le
nouveau seuil à écrire. Et resserrer les quatre seuils maintenant.

### F.4 — La parité i18n est atteinte, le plafond ne bouge pas

`i18nParity` 1024 → **0**, les 5 locales à 469 feuilles chacune. Travail réel.

Mais :

```bash
grep -rlE "\bt\(['\"\`]" src --include="*.tsx" | wc -l   # → 35 fichiers sur 931
grep -rlE ">[^<>{]*[éèêàçùôû][^<>{]*<" src --include="*.tsx" | wc -l   # → 406
```

**1 024 clés ont été traduites pour une interface traduisible à 4 %.** Le repli en cascade
`langue → fr → clé` a bien été ajouté (`NexusCoreProvider.tsx:69-70`), ce qui supprime
l'affichage de clés techniques — c'est le bon correctif. Reste à faire passer le texte par
`t()`.

**Correctif** : traiter par lots les chemins client (onboarding d'abord — premier écran d'un
nouveau tenant), et faire porter un cliquet sur le nombre de chaînes françaises en dur hors
`legal/*` (dont les 184 occurrences sont légitimes : libellés réglementaires).

---

## Ordonnancement

```
Lot A  Brancher ce qui est déjà écrit          3 h   ← assertTenant, STRICT_ISOLATION_TEST, useLexicon
Lot F  Refermer le dispositif de contrôle      3 h   ← parallélisable
Lot B  Réunifier la chaîne fiscale             2 j   ← avant tout cron sur chain-audit
Lot C  Garde souveraine serveur + IndexedDB    1 j
Lot D  Identité d'événement                  1,5 j   ← D.2 plus urgent depuis le correctif 4.D
Lot E  Écrans qui affirment sans écrire        1 j
                                           ────────
                                            ≈ 6 j
```

**Le Lot A d'abord, sans discussion** : trois correctifs sont déjà écrits et ne servent à
rien. Trois heures pour transformer du travail déjà payé en protection réelle — dont
`assertTenant`, qui ferme la dernière fuite cross-tenant P0.

**Le Lot B avant de brancher un cron sur `chain-audit`** : l'audit réécrit va maintenant
voir le fork produit par les onze appelants du protocole B. Brancher l'alarme avant de
réparer la chaîne, c'est fabriquer une alarme qu'on apprendra à ignorer — exactement ce que
l'ancien `chain-audit` faisait, en pire.

---

## Ce que la vérification a confirmé de sain

- `preflight.sh:267` — `exit 1` présent, bannière de succès déplacée en `:271`.
- Trois des quatre routes ouvertes sont fermées avec le bon motif (`caller.tenantId`).
- Le fail-open TheFork est fermé ; `requireAnyAuth` lève `UNAUTHORIZED_NO_TENANT` ;
  `webhookVerify` utilise `timingSafeEqual`.
- `FiscalSealer` persiste `dataSnapshot`, `transactionId` **et** un `serverRecordedAt` issu
  de l'horloge serveur — meilleur que ce que demandait le plan initial.
- `chain-audit` réécrit vérifie la continuité **et** l'intégrité, sans jointure fantôme.
- Le filtre de capabilities est passé en **fail-closed** (`navConfig:367`) — meilleur que le
  correctif proposé, qui demandait de déclarer 4 clés dans 11 DNA.
- `tsc` : 0 erreur. `sentrux` : `no_god_files` résolu, cycles 2 → 1.
