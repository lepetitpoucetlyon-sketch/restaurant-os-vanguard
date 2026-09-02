# Plan — Reprise d'antériorité (migration données concurrent)

> Deep-think + plan. Session `claude-plan-reprise-anteriorite`, 2026-09-02.
> **Lecture seule sur le code.** Toutes les affirmations « existe / n'existe pas / non câblé »
> sont vérifiées dans le source à cette date.
> Décision utilisateur : **on garde Slayer et tout ce qu'il peut accueillir** — c'est un
> élément essentiel pour récupérer des clients importants (concurrents Zelty / Lightspeed / L'Addition…).

---

## 0. Pourquoi c'est stratégique

Un restaurateur qui tourne depuis 5 ans sur Zelty a **5 ans de données** : historique de ventes,
fichier clients, habitudes, comptabilité, stocks, fournisseurs. Le faire changer de logiciel, c'est
lui demander de **repartir aveugle**. La « reprise d'antériorité » — récupérer proprement son passé —
est **le** levier pour déverrouiller les gros comptes (groupes, franchises, établissements matures).

Trois promesses à tenir :

1. **« Tu ne perds rien »** — l'historique reste consultable (analyses, CRM, assistant IA).
2. **« Ta compta est juste dès le jour 1 »** — écriture d'ouverture (à-nouveaux) scellée NF525,
   pas un trou dans le grand livre.
3. **« Ton passé ne pollue pas ton présent »** — les vieilles ventes n'apparaissent pas en cuisine,
   ne faussent pas la clôture Z, ne cassent pas la chaîne fiscale.

Ces trois promesses sont **contradictoires si on les traite naïvement**. Le cœur de ce plan est
le **modèle de coexistence** (§3) qui les rend compatibles.

---

## 1. Constat — 3 systèmes de migration qui se chevauchent, aucun fini

| # | Emplacement | Ce que c'est | État de câblage |
|---|---|---|---|
| **A** | `src/modules/intelligence/migration/` | **L'Airlock** (« sas de décontamination ») : `AirlockPipeline` (PARSE → DEDUP → VALIDATE → ENRICH), `LegacyArchive` (coffre read-only, `seal()` irréversible, RAG-indexable), `airlock-report.ts` (`generateOpeningEntry` = écriture d'à-nouveaux). Types très complets : `LegacyImportConfig` avec **`genesisDate`** + 3 `IntegrationMode` (`TABULA_RASA` / `PONT` / `SUTURE_TOTALE`). | **100 % orphelin.** `grep` : 0 appelant de `AirlockPipeline`, `LegacyArchive`, `generateOpeningEntry`. |
| **B** | `src/modules/commerce/acquisition/onboarding/migration/` | **Le pipeline d'import** : `useImportPipeline` (state machine idle→reading→detecting→mapping→previewing→importing→done), **11 importers** (menu, staff, crm, suppliers, inventory, recipes, reservations, statements, fec, floorplan, haccp_history), **10 connecteurs** (`zenchef, thefork, zelty, laddition, lightspeed, tiller, pennylane, sage, cashpad, popina`), parsers CSV/XLSX/PDF/image (OCR), `ImportSnapshotService` (snapshot + rollback), UI de mapping de colonnes. | **Partiel.** `/migration` (ops) n'expose que **FEC + réservations**. `/onboarding` (wizard) expose **10 catégories** mais **PAS les ventes**. Connecteurs : seulement 7 fichiers sur 10 IDs, `ZeltyConnector.availableCategories = ['menu','crm','inventory']` — **pas de ventes**. |
| **C** | `src/modules/intelligence/services/Slayer.ts` + `DataDigester.ts` | **Slayer** = moteur d'ingestion massive de **commandes/ventes legacy** (`ingestMassive`, batch 100, `NexusTransaction`). `DataDigester` = décontamination (`decontaminate`, `resolvePrice`, `digestOrder({isLegacy})`, `digestBatch` chunk 250). `ExternalOrderSchema` (Zod). | **Orphelin** (seul appelant : `src/e2e/benchmarks/stress_test_omega.ts`). **Et viole le principe de l'Airlock** : `Slayer.ingestMassive` écrit **directement dans `tenants/{id}/orders/`** avec `status: 'PAID'` + `_fiscalSeal` inline, au lieu de passer par le sas et le coffre. |

### Le vrai problème

Il **manque la brique la plus importante** — l'import des **ventes historiques** — et les 3
systèmes qui pourraient la porter ne se parlent pas. `Slayer` la ferait, mais **au mauvais endroit**
(collection live). L'Airlock a le bon modèle (`genesisDate`, coffre séparé, écriture d'ouverture)
mais n'est branché à rien.

### Ce qui est DÉJÀ bien fait (à conserver et généraliser)

- **Réservations historiques** → `crms/{id}.visitHistory` (agrégat sur la fiche client).
  Commentaire dans `reservationsImporter.ts:5-7` : *« They must NOT be injected into reservations/
  collection (would appear as active bookings) »*. **C'est exactement le bon pattern.**
- **FEC année N-1** → `journalEntries/` **scellé immédiatement, hash chaîné** depuis la dernière
  entrée (`fecImporter.ts:40-45`), immuable (SovereignGuard). Legalement correct.
- **`ImportSnapshotService`** : snapshot avant import, `restore()` si échec → rollback propre.
- **`DataDigester`** : décontamination + arrondi fiscal 2 décimales + tag `_metadata.isLegacy`.
- **`AirlockPipeline`** : dedup fuzzy (>0.85), validation fiscale (TVA, équilibre débit/crédit),
  `MigrationReport` (stats, top issues, opening balances) pour validation client.

---

## 2. Vocabulaire (à figer dans les types)

| Terme | Définition |
|---|---|
| **Genesis Date** (`genesisDate`) | La date de bascule. Tout ce qui est **strictement avant** = *reprise* (archive). Tout ce qui est **à partir de** = *exploitation* (NF525 vivant). Choisie par le client, typiquement le 1er du mois de mise en service. |
| **Écriture d'ouverture** (à-nouveaux, `OpeningEntry`) | **Une seule** écriture comptable, équilibrée, scellée, `sequence = 1`, `previousHash = GENESIS_ROOT`. Elle porte les soldes de chaque compte (701 ventes, 607 achats, 512 banque…) **au** Genesis Date. C'est le **premier maillon** de la chaîne fiscale NF525 du tenant. |
| **Coffre de reprise** (`LegacyArchive`) | Collection **read-only** (`legacyArchive/…`), scellée après validation client. Contient le détail décontaminé (PII strippée), indexable par le RAG. **Aucune donnée du coffre n'entre dans le grand livre vivant** (principe gravé dans `LegacyArchive.ts`). |
| **3 modes d'intégration** | `TABULA_RASA` (rien, page blanche) · `PONT` (écriture d'ouverture uniquement — ~80 % des clients) · `SUTURE_TOTALE` (détail transaction par transaction, prestation premium). |
| **`origin`** | Discriminateur porté par **chaque** donnée reprise : `origin: 'legacy'` (+ `legacySource`, `migrationSessionId`, `originalDate`). Toute requête opérationnelle filtre `origin != 'legacy'` par défaut. |

> ⚠️ Écart à corriger : le type **réellement utilisé** par le wizard est
> `OnboardingMode = 'from_zero' | 'migration' | 'skipped'` (`onboarding.types.ts:33`) — binaire.
> Les 3 `IntegrationMode` granulaires n'existent que dans les types orphelins de l'Airlock.
> **Le plan adopte les 3 modes** et fait de `OnboardingMode='migration'` un parent des deux
> sous-modes `PONT` / `SUTURE_TOTALE`.

---

## 3. Le modèle de coexistence des données (cœur du deep-think)

### 3.1 — Trois espaces, une frontière

```
       AVANT Genesis Date                    │  Genesis Date  │       APRÈS Genesis Date
─────────────────────────────────────────────┼───────────────┼──────────────────────────────
                                             │               │
  ┌─────────────────────────────┐            │  ┌──────────┐ │   ┌────────────────────────┐
  │  COFFRE DE REPRISE          │            │  │ ÉCRITURE │ │   │  EXPLOITATION VIVANTE   │
  │  legacyArchive/             │────agrège──┼─▶│ D'OUVER- │─┼──▶│  orders/ journalEntries│
  │  (read-only, scellé,        │   soldes   │  │ TURE     │ │   │  fiscalSeals/ …        │
  │   RAG-indexable)            │            │  │ (1 seule,│ │   │  chaîne NF525 continue │
  │                             │            │  │  scellée)│ │   │  depuis l'ouverture     │
  │  détail ventes, achats,     │            │  └──────────┘ │   │                        │
  │  résa, stocks, docs…        │            │   seq=1        │   │                        │
  └─────────────────────────────┘            │   prevHash=    │   └────────────────────────┘
            │                                │   GENESIS_ROOT │
            │ (mode SUTURE_TOTALE seulement) │               │
            ▼                                │               │
  ┌─────────────────────────────┐            │               │
  │  legacyOrders/  (miroir     │            │               │
  │  transaction par transaction│            │               │
  │  origin:'legacy', JAMAIS    │            │               │
  │  lu par KDS / caisse / Z)   │            │               │
  └─────────────────────────────┘            │               │
```

### 3.2 — Règle d'or

> **Aucune transaction legacy individuelle ne devient une écriture du grand livre vivant.**
> Le seul pont comptable entre « avant » et « après » est **l'écriture d'ouverture** (agrégat).
> Le FEC de l'exercice antérieur, lui, entre dans `journalEntries/` **en tant qu'archive scellée**
> (déjà fait par `fecImporter`) — il n'est pas « rejoué », il est **conservé**.

Pourquoi : NF525 certifie l'**inaltérabilité des ventes produites par le système certifié**.
Les ventes d'avant ont été produites par le système d'avant (lui-même certifié ou non — ce n'est
plus notre responsabilité). Les rejouer dans notre chaîne créerait une chaîne fiscale **falsifiée**
(dates rétro-datées, séquence incohérente). L'INSEE/DGFiP attend une **écriture d'à-nouveaux**, pas
une réémission.

### 3.3 — Impact par domaine

| Domaine | Comportement des données reprises | Où c'est aujourd'hui | À faire |
|---|---|---|---|
| **Chaîne fiscale** (`fiscalSeals`, `journalEntries`, `fiscalLedger`) | Reçoit **1** écriture d'ouverture (scellée, `seq=1`) + le FEC N-1 (scellé, chaîné). **Zéro** vente legacy individuelle. | `fecImporter` OK. `generateOpeningEntry` **existe mais n'est jamais persisté** (`fiscalSealHash: seal_${Date.now()}` = placeholder). | Câbler `OpeningEntry` → `FiscalSealer.sealDataAtomically` → `journalEntries/` (vraie chaîne). |
| **Clôture Z / FEC export** | **Ignore** `origin:'legacy'`. Le Z du jour de bascule démarre à zéro. Le FEC de l'exercice courant part de l'écriture d'ouverture. | Pas de filtre `origin` (n'existe pas). | Ajouter `where origin != 'legacy'` dans les générateurs Z et FEC. Le FEC N-1 importé s'exporte séparément (« FEC repris »). |
| **KDS / caisse / plan de salle / live ops** | **Ne voit jamais** les données legacy. | Slayer écrit dans `orders/` → **polluerait le KDS**. | `legacyOrders/` = collection distincte. `useOrders`, `useKDSController`, `useTables` filtrent `origin != 'legacy'` (ceinture + bretelles). |
| **Analytics / prévisions / rapports** | **Opt-in** : bascule « inclure l'historique repris ». **Off** pour tout rapport à valeur légale (Z, TVA, FEC). **On** possible pour les tendances (saisonnalité, prévision de rush, mix produits sur 3 ans). Marqueur visuel « données reprises » + date de bascule affichée. | Analytics lit `orders/` sans filtre → compterait le legacy comme réel. | Paramètre `includeLegacy` dans les services analytiques + `AnalyticsScope { from, to, includeLegacy }`. Badge UI. |
| **CRM / fidélité** | Agrégats sur la fiche : `visitHistory`, `lifetimeValueInMicrounits`, `lastVisitAt`, `favoriteDishes`, `averageTicket`. Nourrit `GuestRecognition` (« client fidèle depuis 2019 »). | `reservationsImporter` fait déjà `crms/{id}.visitHistory`. | Étendre aux **ventes** : `crmImporter` + un agrégateur ventes→CRM. Marquer les visites reprises (`source: 'legacy'`) pour ne pas déclencher de campagnes anniversaire sur de vieux événements. |
| **Menu engineering** | Popularité historique utilisable, **pondérée** et **datée**. Un plat retiré il y a 2 ans ne « pollue » pas la matrice BCG courante. | `MenuEngineeringService` lit `orders/`. | Fenêtre glissante + option « comparer à l'historique repris ». |
| **Stock / inventaire** | **Photo d'ouverture uniquement** : `stockItems/` avec les quantités au Genesis Date. **Aucun** mouvement de stock legacy (`inventoryMovements/` reste vierge avant Genesis). | `inventoryImporter` fait un import simple. | Marquer l'import stock comme « inventaire d'ouverture » (1 `stockCount` daté Genesis). |
| **RAG / Knowledge Graph** | `LegacyArchive` entries `ragIndexable: true` (PII strippée). L'assistant IA répond « ton meilleur mois l'an dernier était décembre à 82 k€ » depuis le coffre. | `LegacyArchive.getRAGIndexableEntries()` existe, jamais appelé. | `HermesKnowledgeManager` indexe le coffre après `seal()`. Scope RAG : `workspace = tenantId`, sous-espace `legacy`. |
| **Réservations** | Historique → `crms/{id}.visitHistory` **uniquement**. Jamais dans `reservations/` (planning actif). | ✅ Déjà correct. | Rien. |
| **Comptes / grand livre (vue)** | La vue « Grand Livre » affiche l'écriture d'ouverture en tête, puis les mouvements. Le FEC repris est dans un onglet séparé « Antériorité ». | `GeneralLedgerView` lit `journalEntries/`. | Filtrer/grouper par `origin` dans la vue. |

### 3.4 — Le champ `origin` (schéma)

À ajouter au schéma `Order` (`src/modules/ops/domain/schemas/orders.ts`) et aux schémas
concernés (`crm`, `stockItem`, `journalEntry`) :

```ts
origin: z.enum(['live', 'legacy', 'seeded']).default('live'),
legacyMeta: z.object({
  source: z.string(),               // 'zelty' | 'lightspeed' | …
  migrationSessionId: z.string(),
  originalId: z.string().optional(), // id dans le système source
  originalDate: z.string(),          // date réelle de l'événement
  ingestedAt: z.string(),
}).optional(),
```

> `_metadata.isLegacy` de `DataDigester` devient `origin: 'legacy'` + `legacyMeta` (canonique,
> dans le schéma Zod, pas un `catchall`).

---

## 4. Architecture cible unifiée

Une seule chaîne, 3 briques qui se parlent :

```
┌────────────┐   ┌─────────────────┐   ┌──────────────────────┐   ┌───────────────────┐
│  SOURCE    │──▶│  DÉCONTAMINATION │──▶│  SAS (Airlock)       │──▶│  DESTINATIONS      │
│            │   │  DataDigester    │   │  PARSE→DEDUP→VALIDATE │   │                   │
│ • Connecteur│   │  decontaminate   │   │  →ENRICH             │   │ • legacyArchive/   │
│   (API pull)│   │  resolvePrice    │   │  → MigrationReport   │   │   (coffre + RAG)   │
│ • Fichier   │   │  digestBatch     │   │  → validation client │   │ • OpeningEntry     │
│   CSV/XLSX/ │   │                  │   │  → LegacyArchive.seal│   │   → journalEntries/│
│   PDF/OCR   │   │                  │   │                     │   │ • legacyOrders/    │
│ • Slayer    │   │                  │   │                     │   │   (si SUTURE)      │
│   (batch)   │   │                  │   │                     │   │ • crms/*.history   │
└────────────┘   └─────────────────┘   └──────────────────────┘   └───────────────────┘
```

### Rôle de chaque brique existante dans la cible

| Brique | Rôle cible | Modif |
|---|---|---|
| **`DataDigester`** | Primitive de décontamination — inchangée. Utilisée par l'Airlock ET Slayer. | Retirer le tag `_metadata` → produire `origin/legacyMeta`. |
| **`AirlockPipeline`** | **Le moteur unique.** Toute reprise passe par lui (PARSE→DEDUP→VALIDATE→ENRICH). Le mode (`PONT`/`SUTURE_TOTALE`) décide des destinations en sortie. | Le brancher : `execute()` doit **persister** (aujourd'hui il retourne des objets en mémoire). Ajouter `commit(mode)` qui écrit dans les destinations. |
| **`LegacyArchive`** | Le coffre. Persisté en collection `legacyArchive/` (IMMUTABLE_COLLECTIONS). `seal()` = flip `sealed` + write-lock SovereignGuard. | Le persister via Nexus (aujourd'hui `entries` est un array en RAM). |
| **`generateOpeningEntry`** | Génère l'`OpeningEntry`. | Remplacer `fiscalSealHash: seal_${Date.now()}` par un vrai scellement `FiscalSealer`. Persister dans `journalEntries/`. |
| **`Slayer`** | **Exécuteur du mode SUTURE_TOTALE.** `ingestMassive` ne fait plus `orders/` + `_fiscalSeal` bidon → il passe le flux à `AirlockPipeline`, qui écrit dans `legacyOrders/` (origin:'legacy') + agrège vers CRM + coffre. | Réécrire la sortie. Supprimer le fallback `|| 'legacy-slayer-seal'`. `DEFAULT_TENANT_ID` en param obligatoire (plus de défaut). |
| **`useImportPipeline` + importers** | Restent pour les catégories **config** (menu, staff, plan de salle, fournisseurs, recettes) — celles-là entrent **vraiment** dans l'exploitation (ce ne sont pas des « données d'antériorité », c'est le paramétrage). | Séparer conceptuellement : *paramétrage* (menu, staff…) vs *antériorité* (ventes, FEC, résa, stocks). |
| **Connecteurs** (`ZeltyConnector`…) | `pull(category, creds)` → `ParsedFile` → entre dans le sas. Ajouter la catégorie `sales`/`orders`. | `ZeltyConnector.availableCategories` += `'orders'`. Compléter les 3 connecteurs manquants (`sage`, `cashpad`, `popina`) ou retirer leurs IDs. |
| **`ImportSnapshotService`** | Rollback — inchangé, étendu au sas. | — |

---

## 5. Ce qu'on garde / répare / supprime

### On GARDE (décision utilisateur) et on développe

- ✅ **`Slayer`** — devient l'exécuteur SUTURE_TOTALE. Tout ce qu'il peut accueillir : commandes,
  lignes, clients embarqués, modes de règlement, remises. (`ExternalOrderSchema` couvre déjà
  items + options + taxRate + customer + status.)
- ✅ **`DataDigester`** — primitive de décontamination, réutilisée partout.
- ✅ **Tout `intelligence/migration/`** (Airlock, LegacyArchive, opening entry) — on le **branche**.
- ✅ **Tous les connecteurs + importers de `commerce/…/migration/`**.
- ✅ Le pattern « historique → agrégat CRM, jamais dans le planning actif ».

### On RÉPARE

- 🔧 `generateOpeningEntry` : `fiscalSealHash` placeholder → vrai `FiscalSealer`.
- 🔧 `Slayer` : sortie `orders/` → `legacyOrders/` via l'Airlock ; secret bidon supprimé.
- 🔧 `AirlockPipeline.execute()` : ne persiste rien → ajouter `commit()`.
- 🔧 `LegacyArchive` : array RAM → collection Nexus + SovereignGuard.
- 🔧 Wizard `mode` : binaire → 3 modes (`TABULA_RASA`/`PONT`/`SUTURE_TOTALE`).
- 🔧 Connecteurs : 10 IDs mais 7 fichiers — compléter ou réduire la liste ; ajouter `'orders'`.

### On SUPPRIME

- ❌ Le doublon `src/infrastructure/adapters/Simulacra/MonkeyChaos.ts` (0 appelant, name-collision
  avec `SimulacraStressEngine.ts` juste à côté qui est le vrai). *(Hors périmètre migration mais
  repéré au passage.)*
- ❌ Rien d'autre. On ne jette pas de code de migration.

---

## 6. Plan d'exécution

### Lot 1 — Fondations du modèle (2 j)

1. **Schéma `origin`** : ajouter `origin` + `legacyMeta` aux schémas `Order`, `CrmRecord`,
   `StockItem`, `JournalEntry`. Migration de schéma (`schemaVersion` bump).
2. **Collections** : déclarer `legacyArchive` et `legacyOrders` dans `SovereignGuard`
   (`legacyArchive` → IMMUTABLE ; `legacyOrders` → SIGNED_WRITE mais **pas** dans la chaîne NF525).
3. **`LegacyImportConfig`** : promouvoir depuis `intelligence/migration/types.ts` vers
   `src/shared/nexus/contracts/migration.types.ts` (contrat partagé). Aligner `IntegrationMode`
   avec `OnboardingMode`.
4. **Filtres opérationnels** : `useOrders` / `useKDSController` / `useTables` / clôture Z /
   FEC export → `where origin != 'legacy'`. Tests d'invariant : « une commande `origin:'legacy'`
   n'apparaît jamais en KDS / Z / FEC courant ».

### Lot 2 — Brancher l'Airlock (3 j)

5. `AirlockPipeline.commit(mode, { archive, ledger, orders })` : persistance réelle.
   - `PONT` → `LegacyArchive` (coffre) + `OpeningEntry` (journalEntries) uniquement.
   - `SUTURE_TOTALE` → idem + `legacyOrders/` (via Slayer) + agrégats CRM.
6. `LegacyArchive` persistant (collection `legacyArchive/`), `seal()` = write-lock SovereignGuard.
7. `generateOpeningEntry` → `FiscalSealer.sealDataAtomically` → `journalEntries/{id}` avec
   `origin: 'legacy'`, `sequence: 1`, `previousHash: GENESIS_ROOT`. C'est le maillon 1.
8. Tests : équilibre débit=crédit de l'ouverture, chaîne NF525 démarre bien à l'ouverture,
   dedup > 0.85, `MigrationReport` cohérent.

### Lot 3 — Réintégrer Slayer (2 j)

9. `Slayer.ingestMassive(stream, tenantId, sessionId, onProgress)` — `tenantId` obligatoire :
   - décontamine (`DataDigester.digestBatch`)
   - passe à `AirlockPipeline` (parse/dedup/validate/enrich sur le flux ventes)
   - `commit('SUTURE_TOTALE')` → `legacyOrders/` + agrégats CRM + coffre
   - **plus jamais** `orders/` ni `_fiscalSeal` inline ni secret bidon.
10. `stress_test_omega.ts` mis à jour.
11. `Slayer` reste exporté par `@/modules/intelligence` (barrel) + ajouté au wizard.

### Lot 4 — Agrégats CRM ventes (2 j)

12. `LegacySalesToCrmAggregator` : depuis `legacyOrders/` (ou le flux Airlock), calcule par client
    `visitCount`, `lifetimeValueInMicrounits`, `lastVisitAt`, `firstVisitAt`, `favoriteDishes[]`,
    `averageTicketInMicrounits` → `crms/{id}` (merge, `source: 'legacy'` sur les visites).
13. `GuestRecognition` : afficher « client depuis {firstVisitAt} · {visitCount} visites ».
14. Garde-fou : pas de campagne anniversaire / relance sur un événement `originalDate` < Genesis.

### Lot 5 — RAG (1 j)

15. Après `LegacyArchive.seal()` : `HermesKnowledgeManager.insertBatch(archive.getRAGIndexableEntries())`
    dans le workspace `tenantId`, tag `legacy`.
16. Prompt système : « Tu as accès à l'historique repris de {source} jusqu'au {genesisDate}. »

### Lot 6 — Analytics opt-in (2 j)

17. `AnalyticsScope { from, to, includeLegacy }` propagé dans les services analytiques.
    Défaut `includeLegacy: false`. Interdit `true` pour Z / TVA / FEC.
18. UI : bascule « Inclure l'historique repris (avant {genesisDate}) » + badge sur les graphes.
19. `MenuEngineeringService` : fenêtre glissante + mode comparaison historique.

### Lot 7 — UI unifiée (3 j) — voir §7

### Lot 8 — Connecteurs (2 j)

20. Ajouter `'orders'` / `'sales'` à `ImportCategory` + `CATEGORY_CONFIGS` + `targetFields`.
21. `ZeltyConnector` / `LightspeedConnector` / `LAdditionConnector` : implémenter `pull('orders')`.
22. Compléter ou retirer `sage` / `cashpad` / `popina`.
23. `exportGuides.ts` : ajouter le guide « exporter mes ventes depuis {système} ».

### Lot 9 — Garde-fous & invariants (1 j)

24. `INV-migration-1` : aucune donnée `origin:'legacy'` dans un rapport à valeur légale.
25. `INV-migration-2` : la chaîne NF525 d'un tenant migré commence par une `OpeningEntry` `seq=1`.
26. `INV-migration-3` : `legacyArchive/` et `legacyOrders/` refusent `update`/`delete` après `seal()`.
27. `INV-migration-4` : `Slayer` n'écrit jamais dans `orders/` (lint/grep gate).

**Total ≈ 21 j** (hors itérations). Livrable client minimal viable : **Lot 1 + 2 + 7** (mode PONT
seul = 80 % des clients) ≈ 8 j.

---

## 7. UI cible

### 7.1 — `/onboarding` (wizard, première mise en service)

Étape `mode` → 3 choix explicites :

| Choix | Sous-titre | Suite |
|---|---|---|
| **Je démarre à neuf** (`TABULA_RASA`) | « Configuration fraîche. Vous importerez éventuellement votre menu et votre équipe. » | → `domain` |
| **Reprise standard** (`PONT`) | « On récupère vos soldes comptables au jour J (écriture d'ouverture scellée) + votre fichier clients + votre historique de réservations. **Recommandé.** » | → `source` → `genesisDate` → `connect`/`upload` → `review` → `domain` |
| **Reprise intégrale** (`SUTURE_TOTALE`) | « Tout le détail : chaque vente des 3 dernières années, consultable dans vos analyses et par l'assistant IA. Prestation accompagnée. » | idem + volume ventes |

Nouvelle étape **`genesisDate`** : sélecteur de date (défaut = 1er du mois courant) + explication
« Toutes vos données d'avant cette date seront archivées, pas mélangées à votre exploitation. »

Nouvelle étape **`review`** (avant `done`) : affiche le `MigrationReport` —
- X documents prêts / Y à revoir / Z rejetés
- doublons détectés (liste + action fusionner/garder/écarter)
- anomalies fiscales (TVA, déséquilibres) auto-corrigées + celles à valider
- **soldes d'ouverture** par compte (701, 607, 512…) avec total débit = total crédit
- bouton **« Valider et sceller la reprise »** → `LegacyArchive.seal()` + persiste l'ouverture

### 7.2 — `/migration` (ops, post-onboarding — « compléter l'antériorité »)

Aujourd'hui : 2 onglets (FEC, Réservations). Cible : onglets par catégorie d'antériorité —
**Ventes**, **FEC comptable**, **Réservations**, **Clients**, **Stocks (inventaire d'ouverture)**,
**Fournisseurs**, **Documents (contrats, licences)**. Chaque onglet : dropzone universelle +
sélecteur de connecteur + aperçu + rapport. Le Genesis Date est verrouillé (celui de l'onboarding),
affiché en bandeau.

### 7.3 — Écran « Antériorité » (nouveau, sous Analyses ou Réglages)

- Résumé du coffre : `LegacyArchive.getSummary()` (total, par type, par source, plage de dates, scellé ✓)
- Timeline : « Reprise Zelty du 12/01/2026 — 14 320 ventes, 2 108 clients, 3 ans d'historique »
- Bascule globale « Afficher l'historique repris dans mes analyses »
- Bouton « Exporter le FEC de l'antériorité » (séparé du FEC courant)
- Accès lecture seule au détail (table filtrable) — jamais éditable

### 7.4 — Marqueurs transverses

- Badge **« Repris »** (couleur neutre) sur toute ligne `origin:'legacy'` dans les vues qui les montrent.
- Bandeau discret sur les écrans d'analyse quand `includeLegacy` est actif : « Inclut l'historique
  repris avant le {genesisDate} ».

---

## 8. Points d'arbitrage (à trancher avant Lot 1)

| # | Question | Reco |
|---|---|---|
| 1 | `legacyOrders/` = collection séparée, **ou** `orders/` avec `origin:'legacy'` + filtre partout ? | **Collection séparée.** Un filtre oublié = une vieille vente en cuisine ou dans le Z. La séparation physique est le garde-fou le plus sûr. |
| 2 | Mode `SUTURE_TOTALE` : payant / accompagné ? | Oui — c'est du volume (10⁴–10⁶ lignes), du support, de la valeur. `PONT` gratuit inclus. |
| 3 | Rétention du coffre `legacyArchive/` ? | Illimitée tant que le tenant est actif (c'est un argument de vente : « ton passé t'appartient »). Purge à la résiliation (RGPD). |
| 4 | Le FEC N-1 importé : dans `journalEntries/` (fait) **ou** dans le coffre ? | Garder dans `journalEntries/` **avec `origin:'legacy'`** — c'est une obligation légale de conservation, il doit être exportable en FEC. Mais exclu des totaux de l'exercice courant. |
| 5 | Genesis Date modifiable après coup ? | **Non.** Une fois la reprise scellée, la date est figée (comme un exercice comptable clos). |
| 6 | Que faire des 3 connecteurs sans fichier (`sage`, `cashpad`, `popina`) ? | Les marquer `comingSoon` (comme les 7 connecteurs métier déjà gérés ainsi) ou retirer les IDs. Ne pas laisser un bouton mort. |

---

## 9. Risques

- **Sur-ingénierie** : 21 j c'est un vrai chantier. Le MVP (`PONT` seul) à 8 j couvre 80 % des cas —
  livrer ça d'abord, `SUTURE_TOTALE` ensuite selon la demande commerciale.
- **Qualité des exports concurrents** : Zelty/Lightspeed exportent en centimes, encodages variables,
  colonnes non standard. `DataDigester` + `buildAutoMappings` + les warnings par source gèrent déjà
  beaucoup — mais chaque nouveau système = du travail de mapping.
- **Équilibre de l'écriture d'ouverture** : si les soldes extraits ne s'équilibrent pas
  (débit ≠ crédit), il faut une saisie manuelle du solde de trésorerie / capital pour boucler.
  L'écran `review` doit le permettre (compte 471 « attente » en dernier recours, à ne pas laisser).
- **Cycle d'import** : `AirlockPipeline` importe `NexusTelemetryService` (`@/shared/nexus/telemetry`).
  Vérifier qu'ajouter `commit()` (qui touchera `@/modules/finance` pour `FiscalSealer`) ne rouvre
  pas un cycle — passer par le contrat neutre `kernel/contracts/` ou l'event bus, comme pour le
  reste du socle.

---

## Annexe — fichiers clés

| Fichier | Rôle |
|---|---|
| `src/modules/intelligence/migration/AirlockPipeline.ts` | Sas 4 étapes (à brancher) |
| `src/modules/intelligence/migration/LegacyArchive.ts` | Coffre read-only (à persister) |
| `src/modules/intelligence/migration/airlock-report.ts` | `generateOpeningEntry` (à sceller pour de vrai) |
| `src/modules/intelligence/migration/types.ts` | `LegacyImportConfig`, `IntegrationMode`, `OpeningEntry` |
| `src/modules/intelligence/services/Slayer.ts` | Ingestion ventes (à rediriger vers l'Airlock) |
| `src/modules/intelligence/services/DataDigester.ts` | Décontamination (primitive) |
| `src/modules/commerce/acquisition/onboarding/migration/` | Pipeline import + 11 importers + 10 connecteurs |
| `src/modules/commerce/acquisition/onboarding/migration/hooks/useImportPipeline.ts` | State machine d'import |
| `src/modules/commerce/acquisition/onboarding/migration/importers/fecImporter.ts` | FEC → journalEntries scellé (modèle correct) |
| `src/modules/commerce/acquisition/onboarding/migration/importers/reservationsImporter.ts` | Résa → crms/*.visitHistory (modèle correct) |
| `src/modules/commerce/acquisition/onboarding/wizard/OnboardingWizard.tsx` | Wizard (mode binaire → 3 modes) |
| `src/app/(client)/(ops)/onboarding/page.tsx` | Monte le wizard |
| `src/app/(client)/(ops)/migration/page.tsx` | `/migration` (FEC + résa seulement) |
| `src/shared/nexus/contracts/onboarding.types.ts` | `OnboardingMode` |
| `src/shared/nexus/guards/SovereignGuard.ts` | `IMMUTABLE_COLLECTIONS` / `SIGNED_WRITE_COLLECTIONS` |
| `src/modules/ops/domain/schemas/orders.ts` | Schéma `Order` (ajouter `origin`) |
