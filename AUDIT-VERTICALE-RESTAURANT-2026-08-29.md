# AUDIT — VERTICALE RESTAURANT — 2026-08-29

> **Périmètre** : RBAC, logique métier, cascades d'événements, complétude des actions,
> workflow de service et ses étapes — sur la verticale restaurant uniquement.
>
> **Méthode** : graphe de code GitNexus (index `restaurant-os-vanguard`, à jour sur
> `8f48dd8e5`, 0 cycle) croisé avec des mesures directes sur le corpus. Chaque chiffre porte
> sa commande. Chaque constat a fait l'objet d'une tentative de réfutation ; ceux qui n'y ont
> pas survécu sont listés en fin de document.
>
> **Arbre** : `main` @ `8f48dd8e5`.

---

## 0. Le constat qui prime sur tous les autres

**La TVA est déduite du nom du produit par expression régulière, et elle se trompe sur des
plats de carte ordinaires.**

`src/modules/finance/fiscalite/tax/vatResolver.ts:72-92` — `inferCategory` concatène
`categoryId + ' ' + productName`, puis teste des motifs dans l'ordre. Le motif « alcool »
passe **avant** le motif « alimentation » :

```ts
if (/alcool|vin|bière|cocktail|spiritueux|whisky|rhum|vodka|gin|champagne|prosecco|apéritif/
    .test(lower)) return 'alcohol';   // ← 20 %
…
if (/entrée|plat|dessert|salade|…/.test(lower)) return 'food';   // ← 10 % sur place
```

Résultat, mesuré en exécutant la fonction telle quelle :

| Article de carte | Catégorie inférée | TVA appliquée | TVA due |
|---|---|---:|---:|
| Coq au vin | `alcohol` | **20 %** | 10 % |
| Bœuf bourguignon au vin rouge | `alcohol` | **20 %** | 10 % |
| Baba au rhum | `alcohol` | **20 %** | 10 % |
| Poulet au champagne | `alcohol` | **20 %** | 10 % |
| Bière sans alcool | `alcohol` | **20 %** | 10 % |
| Supplément frites | `service` | **20 %** | 10 % |
| Tiramisu, Salade de gésiers, Menu du jour | `food` | 10 % ✅ | 10 % |
| Eau minérale | `beverage_soft` | 10 % ✅ | 10 % |

**Le `categoryId` ne protège pas** : il est concaténé au nom, et c'est le nom qui déclenche
le motif. Un article correctement catégorisé « plats » bascule en alcool s'il s'appelle
« Coq au vin ».

**Pourquoi c'est grave et pas cosmétique** :
1. Le client est **surtaxé** sur ces lignes ;
2. la ventilation TVA erronée entre dans `tvaBreakdown`, qui entre dans le `dataSnapshot`
   **scellé** par la chaîne NF525 (`FinancialNexusBridge.ts:46,52-61`) — l'erreur est donc
   figée dans une pièce inaltérable ;
3. la déclaration de TVA reprend cette ventilation : l'écart est déclaré à l'administration.

**Correctif** : la catégorie fiscale doit être une **donnée du produit**, saisie et
persistée (`taxCategory` sur la fiche article), pas inférée. Garder `inferCategory`
strictement comme aide à la saisie lors de l'import d'une carte, jamais comme source au
moment de l'encaissement. À défaut immédiat : n'inférer que depuis `categoryId`, jamais
depuis le nom, et inverser la priorité des motifs (alimentation avant alcool, l'alcool
n'étant retenu que sur la catégorie « boissons alcoolisées »).

**Test à ajouter** : une table de cas de carte réelle (`Coq au vin`, `Baba au rhum`,
`Bière sans alcool`) avec le taux attendu. Il échouerait aujourd'hui.

---

## 1. RBAC — quatre vocabulaires, une matrice appliquée, un défaut fail-open

### 1.1 L'état des lieux

Le dépôt contient **quatre** représentations des droits, qui ne se recouvrent pas :

| Mécanisme | Fichier | Contenu | Consommateurs |
|---|---|---|---|
| Vocabulaire déclaré | `shared/nexus/contracts/permissions.types.ts` | **25 PageKey, 194 actions** réparties en 20 types (`POSAction`, `KDSAction`, …) | aucun contrôle ne le lit |
| Matrice `ActionGuard` | `shared/schemas/rbac.schemas.ts` → `DEFAULT_ACTION_ACCESS` | **6 pages, 20 actions**, rôles autorisés | `useActionAccess` — **1 fichier** |
| Matrice par niveau | `shared/hooks/actionPermissionMap.ts` | **26 pages, 303 actions**, `minLevel` + `requiresPin` (57 actions à PIN) | `useActionPermission` — **7 fichiers** |
| Garde de page | `shared/components/rbac/PageGuard.tsx` | `PageKey` → accès | `usePageAccess` — 41 fichiers via `withPageGuard` |

**Une seule action est commune aux deux matrices d'action : `adjust_stock`.** Les 19 autres
de `DEFAULT_ACTION_ACCESS` (`void_line`, `bump_order`, `recall_ticket`, `seal_zday`,
`export_fec`…) n'existent pas dans `actionPermissionMap`, et réciproquement.

### 1.2 Le défaut mécanique : `useActionAccess` est fail-open

`src/shared/hooks/useActionAccess.ts` :

```ts
const pageDefaults = DEFAULT_ACTION_ACCESS[pageKey];
const actionRoles = pageDefaults ? pageDefaults[actionKey] : undefined;
if (actionRoles && actionRoles.length > 0) return actionRoles.includes(role);
// Par défaut autorisé si aucune restriction explicite n'est définie
return true;
```

**Toute action absente de la matrice est autorisée à tout rôle authentifié.** La matrice
compte 20 actions ; le vocabulaire en déclare 194. Les 174 restantes — `refund`,
`cancel_order`, `modify_price`, `offer_product`, `delete_employee`, `modify_salary`,
`reset_password`, `manage_roles`, `close_period`, `erase_customer` — sont ouvertes à tous
**du point de vue de `ActionGuard`**.

Nuance importante, vérifiée avant de classer ce constat : le POS ne dépend pas que de ce
mécanisme. `pos/page.tsx:248-250` utilise `offerPerm.requiresPin`, `cancelPerm.requiresPin`,
`refundPerm.requiresPin`, issus d'`actionPermissionMap` — la matrice riche, qui couvre bien
ces trois actions avec PIN. **Les actions sensibles du POS sont donc protégées** — par
l'autre mécanisme. Le défaut n'est pas « le POS est ouvert », c'est **« deux systèmes
coexistent, l'un est fail-open, et rien ne dit lequel s'applique où »**.

### 1.3 Le bloc d'override tenant ne fait rien

```ts
if (config?.actionOverrides?.[pageKey]?.[actionKey]) {
  const overrides = config.actionOverrides[pageKey][actionKey];
  if (overrides.minLevel !== undefined) {
    // Comparer minLevel si configuré
  }
}
```

Le `if` est **vide**. Un gérant qui configure des overrides de droits dans les réglages du
tenant ne change rien au comportement. C'est un réglage inerte au sens de la Loi 8, dans le
domaine le plus sensible du produit.

### 1.4 Couverture des gardes de page

51 pages sous `src/app/(client)`, **11 sans garde de page** — toutes légitimes après examen :
`(public)/login`, `(public)/landing`, `(public)/showcase`, `(public)/welcome`,
`(public)/groups`, `(public)/docs/[category]`, `(public)/auth/logout`,
`(ordering)/order/[tenantId]`, `(public)/menu/[tenantId]/[tableId]` (entrées par QR code),
`(public)/studio`, et `(ops)/vanguard-simulator`.

**Ce dernier est le seul à interroger** : il est sous `(ops)` — donc dans l'espace
authentifié — sans `withPageGuard`. Toutes les autres pages `(ops)` en ont une.

**Correctifs RBAC, par ordre** :
1. Choisir **une** matrice. `actionPermissionMap` est la bonne candidate : 303 actions,
   niveaux, PIN. Faire lire `ActionGuard` cette matrice et supprimer `DEFAULT_ACTION_ACCESS`.
2. Rendre `useActionAccess` **fail-closed** : une action inconnue est refusée. Le passage
   fera apparaître exactement les actions non déclarées — c'est le but.
3. Typer `ActionGuard.action` sur l'union réelle des actions au lieu de `string`
   (`ActionGuard.tsx:22 — action: string`), pour que `tsc` refuse un nom inexistant.
4. Implémenter le bloc `actionOverrides`, ou retirer le réglage de l'écran.
5. `withPageGuard` sur `/vanguard-simulator`.

---

## 2. Cascades d'événements — trois chaînes cassées par divergence de nom

### 2.1 Vue d'ensemble

| Indicateur | Mesuré |
|---|---:|
| Événements déclarés (`shared/eventBus/events/`) | **408** |
| Types réellement émis (hors tests) | **337** |
| Types réellement écoutés | **156** |
| **Émis sans aucun écouteur** | **237** |
| **Écoutés jamais émis** | **56** |
| Déclarés ni émis ni écoutés | 15 |

Par domaine restaurant :

| Domaine | Déclarés | Émis | Écoutés | Émis sans écouteur | Jamais touchés |
|---|---:|---:|---:|---:|---:|
| `order` | 7 | 6 | 7 | 0 | 0 |
| `table` | 6 | 3 | 6 | 0 | 0 |
| `reservation` | 7 | 6 | 7 | 0 | 0 |
| `inventory` | 5 | 4 | 5 | 0 | 0 |
| `haccp` | 4 | 3 | 3 | 1 | 0 |
| `pos` | 8 | 7 | **1** | **7** | 0 |
| `kds` | 22 | 16 | 9 | **11** | 2 |
| `stock` | 16 | 15 | **4** | **12** | 0 |
| `staff` | 2 | **0** | 2 | 0 | 0 |

La cascade de vente elle-même est **saine** : `order.paid` est émis 3 fois et écouté par
8 handlers (ledger, stock, fidélité, VIP, ticket, Z, intelligence).

### 2.2 CASSÉ — Le pointage n'alimente jamais la paie

`PayrollTimeclockHandler.ts:55-56` écoute `staff.clock_in` et `staff.clock_out`, plus un
troisième abonnement avec ce commentaire explicite :

```
// Bridge: l'API route /api/hr/clock-in émet hr.clock_in
```

**Ce contrat n'existe pas.** `src/app/api/hr/clock-in/route.ts` écrit dans `shiftEntries`
(`:41`) et logge (`:56`) — **aucun `emit`** dans tout le fichier.

Et ce que la pointeuse émet réellement, c'est autre chose :

```
TimeClockPunchService.ts:42   NexusEventBus.emit('hr.time_clock_punched', …)
BadgeClockoutAtZService.ts:65 NexusEventBus.emit('hr.auto_clockout_at_z', …)
```

**Trois écouteurs, aucun émetteur correspondant.** Le pointage remplit `shiftEntries` ; le
registre de paie n'est jamais alimenté. À la préparation de paie, les heures pointées sont
absentes.

**Correctif** : faire écouter `hr.time_clock_punched` et `hr.auto_clockout_at_z` au handler
de paie — ou renommer à la source. Puis supprimer le commentaire qui décrit un contrat
inexistant. **Test** : un pointage doit produire une ligne de registre de paie.

### 2.3 CASSÉ — La table n'est jamais libérée automatiquement

`TableAutoReleaseHandler.ts:11` — le seul handler qui remette une table à l'état libre
(`Nexus.adapter.update('tenants/{t}/tables/{id}', …)` ligne 21) — écoute **`table.cleared`**.

`table.cleared` **n'est émis nulle part**. Ce qui est émis, c'est `table.released`, par
quatre sources :

```
modules/ops/service/pos/services/TableLockService.ts      (table.locked / table.unlocked)
shared/eventBus/handlers/NoShowHandler.ts                 (table.released)
shared/eventBus/handlers/OrderCancelRestockHandler.ts     (table.released)
shared/eventBus/handlers/TableTransferHandler.ts          (table.released)
verticals/restaurant/adapters/RestaurantOpsAdapter.ts     (table.released)
```

Et **personne n'écoute `table.released`** (`grep .on('table.released')` → vide).

De plus, `FinancialNexusBridge.processOrder` ne touche jamais au statut de la table : le
`tableId` n'y sert qu'à composer la description de l'écriture comptable (`:67-68`).

**Conséquence** : après encaissement, la table reste occupée à l'écran. Le personnel doit la
libérer à la main — ou la salle se remplit de tables fantômes pendant le service.

**Correctif** : un seul nom (`table.released`), écouté par `TableAutoReleaseHandler`, et
émis par le chemin d'encaissement. **Test** : encaisser une table doit la rendre disponible.

### 2.4 Onze émissions KDS sans consommateur

`kds.item_done`, `kds.ticket_delayed`, `kds.printer_failed`, `kds.dish_rebound` sont
**écoutés et jamais émis** ; onze autres `kds.*` sont **émis et jamais écoutés** ;
`kds.item_started` et `kds.bumped` ne sont ni l'un ni l'autre.

Autrement dit : la moitié de la sémantique KDS déclarée ne produit aucun effet. Les alertes
de retard (`ticket_delayed`) et de panne d'imprimante (`printer_failed`) ont un
consommateur qui n'est jamais réveillé — **une panne d'imprimante en cuisine ne remonte
nulle part**.

### 2.5 Douze émissions `stock.*` sans consommateur

16 événements `stock.*` déclarés, 15 émis, **4 écoutés**. Le pilier logistique parle, presque
personne n'écoute.

---

## 3. Workflow de service — quatorze étapes sur quinze existent

Reconstruction du parcours réel d'un service, et existence du mécanisme correspondant :

| # | Étape | Mécanisme | État |
|---|---|---|---|
| 1 | Ouverture de caisse | `CashSession`, `useCashDrawer` | ✅ |
| 2 | Ouverture de table | `assignTable` | ✅ |
| 3 | Prise de commande | `CartLine` | ✅ |
| 4 | Envoi en cuisine | `sendToKitchen` | ✅ (1 seul point d'appel) |
| 5 | Réception KDS | `kds.ticket_received`, `KDSDashboard` | ✅ |
| 6 | Bump / prêt | `kds.ticket_done` | ✅ |
| 7 | Addition / proforma | `proforma` | ✅ |
| 8 | Partage d'addition | `splitBill`, `SplitBillDialog` | ✅ |
| 9 | Encaissement | `processOrder`, `FinancialNexusBridge` | ✅ |
| 10 | **Clôture / libération de table** | — | ❌ **manquant** (§ 2.3) |
| 11 | Clôture Z | `TicketZHandler`, `seal_zday` | ✅ |
| 12 | Décrément de stock | `StockDeductionHandler` | ✅ |
| 13 | Écriture comptable | `PaymentLedgerHandler` | ✅ |
| 14 | Fidélité | `LoyaltyEngine`, `LoyaltyPointsAccrual` | ✅ |
| 15 | Ticket imprimé | `EscPosReceiptFormatter` | ✅ |

**La boucle du service ne se referme pas.** Quatorze étapes sur quinze sont implémentées ;
celle qui manque est celle qui rend la table à la salle.

### 3.1 Le KDS ne reçoit rien par le bus entre deux appareils

Sur 57 fichiers KDS, 12 s'abonnent au `NexusEventBus` et 9 lisent l'état via
`Nexus.adapter`/atomes. Or le bus est **strictement en mémoire par onglet** — aucun
`BroadcastChannel`, aucune SSE, aucun WebSocket dans `shared/eventBus` ni `lib/nexus`.

Ce qui parvient réellement au poste cuisine vient donc de la **synchronisation documentaire
Nexus des `orders`**, pas des douze abonnements. Ces abonnements ne se déclenchent que si
l'émetteur est dans le même onglet — c'est-à-dire jamais, en exploitation réelle, entre une
caisse et un écran de cuisine.

**Conséquence pratique** : tout ce qui est posé dans un handler KDS abonné au bus (routage,
alerte allergène, priorisation) ne s'exécute pas sur le poste cuisine. Voir le plan
correctif, lot D, pour le choix de fond à trancher (documenter le bus comme intra-onglet, ou
lui ajouter un relais).

---

## 4. Complétude des actions — c'est sain

Contrairement au reste, ce chapitre est court parce qu'il n'y a rien à signaler.

Sur les **102 fichiers** des écrans POS, KDS, bar, plan de salle et réservations :

```
244 onClick  |  0 handler vide  |  0 TODO / FIXME
```

Un seul reliquat, déjà documenté comme exception assumée dans le dépôt :
`modules/ops/service/pos/components/Cart.tsx` déstructure `onClearCart` en `_onClearCart`
(arbitrage produit tracé par l'invariant INV-10).

Les boutons de la verticale restaurant sont branchés. Le défaut de complétude n'est pas au
niveau du bouton — il est **une couche plus bas**, dans les cascades (§ 2) : le clic
fonctionne, l'écriture a lieu, et c'est la conséquence attendue en aval qui n'arrive pas.

---

## 5. État de santé mesuré

| Indicateur | Mesuré ce jour | Commande |
|---|---|---|
| TypeScript | **0 erreur** | `rtk proxy npx tsc --noEmit` |
| Tests | **2 450 total · 2 428 passés · 22 en échec sur 8 fichiers** | `./node_modules/.bin/vitest run --reporter=json` |
| Cycles (graphe GitNexus) | **0** | `check({repo})` |
| Cycles (sentrux) | 1 | `sentrux check .` |
| Complexité > cc12 | 1 517 fonctions | `sentrux check .` |
| Cliquets dernier kilomètre | 10/10 verts | `node scripts/gate-last-mile.mjs` |

### 5.1 La suite de tests ne finit plus — et les échecs sont des délais dépassés

Sur `main` @ `8f48dd8e5`, la suite **ne se termine pas** dans un temps exploitable. Fichiers
en échec relevés pendant l'exécution :

```
src/__tests__/handlers/saga-handlers.test.ts        (28 tests | 10 failed)  1 249 931 ms
src/__tests__/kernel/ai/TenantAIRegistry.test.ts    ( 7 tests |  3 failed)    161 531 ms
src/modules/compliance/services/QualityEngine.test.ts (3 tests |  3 failed)   154 225 ms
src/__tests__/kernel/ai/MCCAIRegistry.isolation.test.ts (9 tests | 2 failed)  117 343 ms
src/modules/human/services/NexusStaffingOracle.test.ts (3 tests | 2 failed)    97 719 ms
src/__tests__/commerce/anglemorts-tier-critique.test.ts (17 tests | 1 failed)  57 238 ms
src/__tests__/anglemorts/anglemorts-batch4a.test.ts (22 tests | 1 failed)      41 781 ms
```

**Dix-sept des vingt-deux échecs sont des délais dépassés**, pas des assertions fausses :
leurs durées sont calées sur 30 000 ms — la signature du timeout Vitest — et montent
jusqu'à 927 s. `saga-handlers.test.ts`, le fichier qui teste précisément les cascades de la
verticale restaurant (ticket Z, déduction de stock, réception, notifications), occupe à lui
seul **20 minutes**.

**Cinq échecs sont de vraies assertions**, et l'un d'eux est une régression produit :

| Test | Durée | Message | Lecture |
|---|---:|---|---|
| `restaurant → certification HACCP obligatoire` | 117 ms | `expected undefined to be true` | 🔴 **régression — voir § 5.2** |
| `clinic → DPC obligatoire renouvellement 36 mois` | 28 ms | `expected undefined to be true` | même cause |
| `gym → BPJEPS obligatoire` | 3 ms | `expected undefined to be true` | même cause |
| `santé → cold_glacier après 60 mois` | 9 ms | `expected 36 to be 60` | même cause |
| `ignore les événements simulation` | 15,8 s | `expected "update" to not be called at all, but actually been called 1 times` | ⚪ artefact de test — voir ci-dessous |

Le dernier a été vérifié avant d'être imputé au produit : `CertExpiryHandler.ts:10` **porte
bien** la garde `if (payload.isSimulation) return;`. Le test précédent du même `describe`
appelle `Nexus.adapter.update` et le mock n'est pas réinitialisé entre les deux — c'est un
défaut d'isolation de test, dans un fichier par ailleurs en timeout. **Ce n'est pas une
fuite de données de simulation.**

En revanche, une mesure adjacente mérite d'être notée : **102 des 174 handlers du bus
écrivent dans Nexus sans jamais tester `isSimulation`**
(`for f in src/shared/eventBus/handlers/*.ts` : contient `Nexus.adapter.update|set` et pas
`isSimulation`). Le motif de protection existe et est appliqué dans 72 handlers ; il est
absent dans les 102 autres. À trier : selon qu'un événement simulé peut ou non les
atteindre, c'est une dette de cohérence ou une fuite.

### 5.2 RÉGRESSION — la certification HACCP obligatoire n'est plus dérivée

`src/__tests__/verticals/p2d-derivers.test.ts:134-142` :

```ts
const f = deriveFormation({ answers: defaultAnswers(), variant: 'restaurant', tier: 'L1',
                            effectiveCapabilities: { mod_pos: true } });
const haccp = f.certificationsRequired.find(c => c.id === 'cert.haccp');
expect(haccp?.required).toBe(true);        // ← reçoit undefined
expect(haccp?.renewalMonths).toBe(60);
```

`expected undefined to be true` : `cert.haccp` n'est plus **produit du tout** par
`deriveFormation` pour la verticale restaurant. Les trois autres variantes testées (clinic,
gym, santé) échouent de la même façon.

Dernier commit touchant le dériveur :

```bash
git log --oneline -1 -- src/verticals/_shared/derivation/FormationDeriver.ts
# de4616b64 refactor(complexity): simplify high-CC functions across custom-fields, outbox, compiler, and derivation
```

**Un refactoring de complexité a supprimé la dérivation des certifications obligatoires.**
Pour un restaurant, la formation HACCP est une obligation réglementaire : le socle ne la
déclare plus. Le test le prouve et il est rouge — mais noyé dans 17 timeouts, personne ne
l'a vu.

Vérifications faites avant de conclure :
- aucun autre processus `vitest` ne tournait en parallèle (`ps aux | grep -c "[v]itest"` → 0) :
  ce n'est pas une contention de ma propre session ;
- au début de cette session, sur la branche `perf/simulacra-coupe-circuit` (`e9a2895ff`), la
  même commande rendait **2 466 passés / 1 ignoré en 129,92 s**. Le comportement est donc
  propre à `main`, pas à l'outillage.

⚠️ **Deux pièges de mesure rencontrés, à connaître** :
1. `--reporter=basic` n'existe pas en Vitest 4 : le lancement échoue au chargement du
   reporter. Les lignes « PASS (n) FAIL (n) » que renvoie alors le terminal proviennent du
   proxy **`rtk`**, pas de Vitest — elles ne doivent pas être citées comme mesure.
2. `rtk` masque le code de sortie : le même run est sorti une fois en 1, une fois en 0.
   Pour une vérité terrain sur les tests, lancer `./node_modules/.bin/vitest run`.

**C'est le constat le plus urgent de cet audit après la TVA** : les cascades métier de la
verticale restaurant ne sont plus couvertes, et le mécanisme qui devrait le signaler
(`preflight`, étape 4) hérite du même masquage.

---

## 6. Ce qui a été vérifié et qui tient

- **La cascade d'encaissement est complète et correctement branchée** : `order.paid` est
  écouté par 8 handlers ; ledger, stock, fidélité, ticket Z, reçu numérique sont tous câblés.
- **Les domaines `order`, `table`, `reservation`, `inventory` n'ont aucune émission
  orpheline** — les divergences sont localisées, pas systémiques.
- **Toutes les pages `(ops)` sont gardées** sauf `/vanguard-simulator` ; les 10 autres pages
  sans garde sont publiques par conception.
- **Les actions sensibles du POS (offrir, annuler, rembourser) exigent un PIN**, via
  `actionPermissionMap` — la protection existe, elle passe simplement par l'autre mécanisme.
- **`actionPermissionMap` est une matrice sérieuse** : 26 pages, 303 actions, 57 exigeant un
  PIN, avec des niveaux de rôle. C'est l'actif à conserver dans l'unification du § 1.
- **Aucun bouton mort, aucun TODO** dans les 102 écrans de la verticale restaurant.
- **Le taux de TVA lui-même est correctement modélisé** (`RATE_MAP` : 10 % sur place /
  5,5 % à emporter pour l'alimentaire, 20 % pour l'alcool et les prestations) — c'est
  l'**affectation** à une catégorie qui est fausse, pas le barème.

## 7. Pistes explorées et écartées

- **`/reservations` non gardée** — faux positif de ma première mesure : elle porte bien
  `withPageGuard(ReservationsPage, "reservations")` (`:153`). Mon `find` avait attrapé la
  page publique `src/app/[slug]/reservations/page.tsx`, qui n'a pas à être gardée.
- **« 194 actions déclarées, 1 seule gardée »** — chiffre erroné produit par un parseur
  d'indentation défectueux. La matrice appliquée couvre bien les 11 actions gardées dans
  l'UI ; le vrai constat est la coexistence de deux matrices (§ 1.1), pas l'absence de
  matrice.
- **Handlers vides dans les écrans restaurant** — cherchés, aucun trouvé.
- **`RATE_MAP` incomplet** — vérifié, les trois modes de consommation sont couverts pour les
  six catégories.

---

## 8. Ordre de traitement recommandé

| Priorité | Constat | Effort | Pourquoi d'abord |
|---|---|---|---|
| **P0** | TVA inférée par regex (§ 0) | 1 j | Erreur fiscale scellée dans une pièce inaltérable, sur des plats de carte ordinaires |
| **P0** | Certification HACCP obligatoire supprimée par un refactoring (§ 5.2) | 2 h | Obligation réglementaire que le socle ne déclare plus pour la verticale restaurant ; `de4616b64` en cause, test rouge à l'appui |
| **P0** | Suite de tests qui ne finit plus — 22 échecs dont 17 timeouts (§ 5.1) | ? | `saga-handlers.test.ts` met 20 min et échoue 10 fois ; les 17 timeouts noient les 5 vraies régressions, et `rtk` masque le code de sortie |
| **P1** | Table jamais libérée (§ 2.3) | 2 h | Une divergence de nom entre 4 émetteurs et 1 écouteur ; casse le service en salle |
| **P1** | Pointage → paie (§ 2.2) | 2 h | Trois écouteurs, aucun émetteur ; les heures pointées n'arrivent jamais en paie |
| **P1** | `useActionAccess` fail-open + 2 matrices (§ 1) | 1 j | Un seul système de droits, fail-closed, typé |
| **P2** | Alertes KDS mortes (§ 2.4) | 0,5 j | Panne d'imprimante et retard cuisine ne remontent nulle part |
| **P2** | `actionOverrides` inerte (§ 1.3) | 0,5 j | Réglage exposé au gérant qui ne pilote rien |
| **P3** | 237 émissions sans écouteur (§ 2.1) | — | Tri à faire : légitimes (télémétrie) vs cascades manquantes |
