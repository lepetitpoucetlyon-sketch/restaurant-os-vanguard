# Flexibilité temporelle — Audit & Plan d'ingénierie

> **Objet** — Rendre le système nativement tolérant aux décalages temporels de l'exploitation
> réelle : encaisser avant d'avoir saisi son stock, créer une fiche technique après 300 ventes,
> clôturer 15 jours d'un coup, pointer le vendredi pour toute la semaine, recevoir la facture
> du poisson quinze jours après l'avoir servi, reverser 600 tickets accumulés hors-ligne.
>
> **Statut** — Document d'audit + plan. Aucun code applicatif modifié par la session qui l'a rédigé.
> **Date** — 2026-09-03 · **Session** — `claude-audit-plan-flexibilite`
> **Portée** — bus d'événements, files (outbox/DLQ), chaîne fiscale NF525, stocks & BOM, RH,
> achats, RBAC des actions rétroactives, reprise d'antériorité, câblage UI bout-en-bout.

---

## 0. Verdict en une page

Le socle a **toutes les briques** d'un système résilient — outbox, DLQ avec backoff et quarantaine,
garde d'idempotence, scellement NF525 atomique et chaîné, `SovereignGuard` WORM, pipeline de reprise
d'antériorité, 235 abonnements au bus d'événements. Ce qui manque n'est pas une brique de plus :
**c'est la notion de temps métier.**

Le système sait *qu'*un fait s'est produit. Il ne sait pas *quand*, et il ne sait pas qu'il
l'apprend en retard. Conséquence directe, mesurée dans ce dépôt :

| Symptôme mesuré | Preuve (commande reproductible) |
|---|---|
| `order.paid` ne porte **aucun champ temporel** | `sed -n '14,26p' src/shared/eventBus/events/ops.events.ts` |
| 91 blocs d'événements sur 162 analysables n'exposent aucune date | script § 1.3 |
| 142 fichiers de handlers sur 161 lisent l'horloge murale | `grep -rlE "new Date\(\)\|Date\.now\(\)" src/shared/eventBus/handlers/*.ts \| wc -l` |
| 7 fichiers dérivent une **clé de journée métier** (`YYYY-MM-DD`) de `new Date()` | `grep -rlE "new Date\(\)\.toISOString\(\)\.(split\|slice)" src/shared/eventBus/handlers/*.ts src/lib/cron/*.ts` |
| **0** handler déclare `idempotent: true` | `grep -rn "idempotent: true" src/shared/eventBus/handlers/*.ts \| wc -l` |
| **174 abonnements sur 187** tournent sans garde d'idempotence | script § 1.4 |
| La consommation de stock issue des ventes **n'écrit aucun mouvement** | `grep -rln inventoryMovements src --include='*.ts'` → ni `StockDeductionHandler` ni aucun handler du bus |
| 21 actions RBAC déclarées sur 8 pages ; matrice **fail-open** par défaut | `src/shared/schemas/rbac.schemas.ts:95-133` + `src/shared/hooks/useActionAccess.ts:40` |
| `CronScheduler.start()` : **0 appelant applicatif** | `grep -rn "CronScheduler" src --include='*.ts' \| grep -v cron/CronScheduler.ts` |
| `OutboxService` : **0 consommateur applicatif** (doublon mort de `SyncManager`) | `grep -rn "OutboxService" src --include='*.ts' \| grep -v OutboxService.ts` |

Les cinq conséquences opérationnelles :

1. **Un ticket hors-ligne rejoué à J+3 crédite le Z d'aujourd'hui**, pas celui de son jour de vente
   (`TicketZHandler.ts:48` — `const today = new Date().toISOString().split('T')[0]`).
2. **Un ticket qui arrive après la clôture Z est silencieusement absorbé** : `if (existing.closed) return`
   (`TicketZHandler.ts:63`). La vente est scellée dans `journalEntries` mais absente du Z. Divergence
   permanente entre le journal et l'agrégat.
3. **Une vente sans article de stock, sans recette ou sans produit ne laisse aucune trace.**
   Trois `return` silencieux dans `StockDeductionHandler` (`:75`, `:81`, `:127`). Quand la fiche technique
   est enfin créée le dimanche soir, il n'existe **rien** à quoi la rattacher.
4. **Un ticket encaissé hors-ligne n'est jamais re-scellé.** `hash = 'PENDING_OFFLINE_SEAL'` est écrit
   (`FinancialNexusBridge.ts:110`) et **aucun code ne le relit** — la chaîne NF525 reste trouée.
5. **Le rejeu détruit les données.** Le rejeu de l'outbox et de la DLQ passe par des handlers non
   idempotents : double déstockage, double écriture comptable. Et `db.clearAll()` (qui vide `syncQueue`,
   donc les tickets NF525 non synchronisés) se déclenche **à chaque changement de route**
   (`NexusSyncProvider.tsx:22-37` — `taskContext` est une nouvelle référence à chaque `pathname`).

Le plan qui suit ne consiste pas à empiler des rustines par scénario. Il installe **huit primitives**
(§ 5) dont chacun des cas du cahier des charges devient une instance, puis les câble bout-en-bout
(§ 7) avec leurs écrans (§ 8), leurs événements (§ 9), leur RBAC (§ 10) et leurs tests (§ 12).

---

## 1. Méthode et preuves

### 1.1 Règle de citation (Loi 7 — Zero-Claim)

Chaque chiffre de ce document est mesuré dans la session de rédaction, avec la commande
reproductible en regard. Aucun chiffre n'est recopié d'un audit antérieur.

### 1.2 Mesures du dépôt à la date de rédaction

`npm run measure` (3 403 fichiers analysés) :

```
Composants sans consommateur 0 · Réglages déclarés non lus 0 · Clés i18n manquantes (fr) 0
Props handler inertes 0 · Erreurs potentiellement avalées 0 · Scellements non canoniques 0
Métriques codées en dur 0 · Écrans hors design system 0 · Boutons sans nom accessible 0
Chaînes françaises en dur dans le JSX 767 · Couleurs hex/rgba en dur 758
```

**Lecture critique** : « Erreurs potentiellement avalées : 0 » est vrai *pour la définition mesurée*
(`catch` vide). La sonde ne voit pas le motif réellement dangereux ici — le **`return` silencieux sur
référent absent** (`if (!recipe) return`). C'est un angle mort de mesure, pas une absence de dette.
Le § 13 propose deux mesures permanentes qui le couvrent.

### 1.3 Script de mesure des événements sans champ temporel

```bash
python3 - <<'EOF'
import re, glob
tot=0; missing=[]
for f in glob.glob('src/shared/eventBus/events/*.events.ts'):
    src=open(f,encoding='utf-8').read()
    for m in re.finditer(r"^  '([a-z0-9_]+\.[a-z0-9_.]+)':\s*\{(.*?)^  \};", src, re.S|re.M):
        name, body = m.group(1), m.group(2)
        tot+=1
        if not (re.search(r'[a-zA-Z]+At\??:', body) or 'timestamp' in body or 'date' in body.lower()):
            missing.append(name)
print(f"blocs analysés: {tot} | sans champ temporel: {len(missing)}")
print("\n".join(sorted(missing)))
EOF
```

Résultat : **162 blocs analysés, 91 sans champ temporel**, dont `order.paid`, `order.placed`,
`order.cancelled`, `order.comp`, `inventory.physical`, `inventory.stock_adjusted`,
`inventory.waste_logged`, `finance.cash_counted`, `finance.month_closed`, `finance.invoice_approved`,
`hr.overtime_alert`, `hr.payroll_exported`, toute la famille `kds.*`.

> Le parseur ne capture que les blocs multi-lignes terminés par `  };`. Les définitions sur une seule
> ligne (nombreuses dans `vertical.events.ts`) ne sont pas comptées. Le chiffre est donc un
> **plancher**, pas un total.

### 1.4 Script de mesure de l'exposition au rejeu

```bash
python3 - <<'EOF'
import glob
tot=crit=idem=0; buckets={"HIGH":0,"BACKGROUND":0,"CRITICAL":0,"(défaut HIGH)":0}
for f in glob.glob('src/shared/eventBus/handlers/*.ts'):
    for seg in open(f,encoding='utf-8').read().split('NexusEventBus.on(')[1:]:
        tot+=1; head=seg[:2500]
        if "idempotent: true" in head: idem+=1
        for k in ("CRITICAL","HIGH","BACKGROUND"):
            if f"priority: '{k}'" in head: buckets[k]+=1; break
        else: buckets["(défaut HIGH)"]+=1
        if "priority: 'CRITICAL'" in head: crit+=1
print(f"abonnements: {tot} | {buckets} | idempotent:true = {idem}")
print(f"non protégés par l'idempotence = {tot-crit}")
EOF
```

Résultat : **187 abonnements** dans `src/shared/eventBus/handlers/` —
13 `CRITICAL`, 79 `HIGH`, 31 sans priorité (donc `HIGH` par défaut), 64 `BACKGROUND`.
**0** déclare `idempotent: true`. Seuls les 13 `CRITICAL` bénéficient de la garde automatique :
**174 abonnements rejouent leur effet à chaque replay.**

---

## 2. Le problème racine : une seule horloge pour trois questions

Un système d'exploitation de restaurant doit répondre à trois questions distinctes sur chaque fait :

| Question | Réponse | Usage |
|---|---|---|
| **Quand est-ce arrivé ?** | `occurredAt` — instant réel, figé à l'origine, jamais recalculé | imputation fiscale, coût matière, heures travaillées |
| **À quel service ça appartient ?** | `businessDay` — clé `YYYY-MM-DD` de la **journée de service** | Ticket Z, food cost du jour, masse salariale du service |
| **Quand l'a-t-on appris ?** | `recordedAt` — instant d'enregistrement | traçabilité, détection du retard, journal d'audit |

Le code actuel ne connaît qu'une horloge : `new Date()` au moment où le handler s'exécute. Les trois
questions reçoivent donc la même réponse — celle de la troisième. Tout le reste en découle.

### 2.1 Le bug UTC, indépendant du retard

`new Date().toISOString().split('T')[0]` renvoie le jour **UTC**. Une vente encaissée à 00h30 en
France (CEST, UTC+2) est datée du **jour précédent**. Sur un service du soir qui déborde après minuit
— la norme en restauration — une partie des tickets bascule silencieusement sur le Z de la veille,
lequel est peut-être déjà clos (cf. § 0, point 2 : absorption silencieuse).

Ce défaut est présent **aujourd'hui, sans aucun décalage**, sur un restaurant parfaitement à jour.

### 2.2 La journée de service n'existe pas

Un restaurant ne ferme pas à minuit. Sa journée d'exploitation court typiquement de 05h00 à 05h00.
Aucun objet du dépôt ne porte cette notion : ni `TenantConfig`, ni le Ticket Z, ni le pointage RH,
ni l'agrégateur de pertes. La conséquence est que « le Z du lundi » et « les heures du lundi » et
« le food cost du lundi » ne désignent pas le même intervalle.

### 2.3 Les silences

Le motif structurant du code actuel face à l'inattendu est le `return` silencieux. Extraits littéraux :

```ts
// StockDeductionHandler.ts:72  — le produit vendu n'existe pas au catalogue
if (!product) return;

// StockDeductionHandler.ts:79  — le produit n'a pas (encore) de fiche technique
if (!recipe?.ingredients?.length) return;

// StockDeductionHandler.ts:121 — l'article de stock n'a pas (encore) été créé
if (!existing) return;

// AccountingSyncHandler.ts:33  — aucun connecteur comptable branché
if (stored?.status === 'active') { ... } return null;

// TicketZHandler.ts:63        — le Z du jour est déjà clos
if (existing.closed) return;
```

Chacun de ces `return` est **défendable individuellement** : il évite de bloquer le service.
Collectivement, ils constituent le défaut central : **le système absorbe l'anomalie au lieu de
l'enregistrer**. Un fait non enregistré est un fait non rattrapable. La fiche technique créée
dimanche soir n'a rien à rejouer, parce que personne n'a écrit « 300 plats vendus sans nomenclature ».

C'est le point de bascule de tout ce document : on ne remplace pas les `return` par des `throw`
(cela bloquerait le service, ce qui est pire). **On les remplace par une écriture dans un registre
de suspens.**

---

## 3. Cartographie critique de l'existant

### 3.1 Le bus d'événements — `src/shared/eventBus/NexusEventBus.ts`

**Ce qui est solide.** Trois priorités (`CRITICAL` séquentiel bloquant / `HIGH` parallèle attendu /
`BACKGROUND` non bloquant), circuit-breaker anti-boucle par `emissionId` avec profondeur max 15,
écriture DLQ sur échec des trois niveaux, `emitToHandler` pour un rejeu ciblé sur un seul handler.

**Défauts identifiés.**

| # | Défaut | Emplacement | Impact sur le retard |
|---|---|---|---|
| B1 | **`emit()` et `emitDurable()` calculent des `eventId` différents.** `emit` : `payload.eventId ?? payload.id ?? uuid()`. `emitDurable`/`emitToHandler` : `payload.eventId ?? "<event>:<id\|orderId\|transactionId\|invoiceId\|tableId\|reservationId>" ?? uuid()` | `:158` vs `:96` / `:280` | Le même fait métier émis par deux chemins reçoit deux identités → l'idempotence ne déduplique pas entre les chemins. Un rejeu manuel après un rejeu automatique double l'effet. |
| B2 | **Aucun handler n'est idempotent hors `CRITICAL`.** `isIdempotent = options.idempotent ?? (priority === 'CRITICAL')`, et `idempotent: true` n'apparaît **nulle part** dans le dépôt | `:58` | **174 des 187** abonnements de `handlers/` (79 `HIGH` + 31 sans priorité, donc `HIGH` par défaut, + 64 `BACKGROUND`) rejouent leur effet à chaque replay. `stock-deduction` est `HIGH` → **double déstockage garanti** au rejeu. |
| B3 | **Chaque échec crée une nouvelle ligne DLQ** (`id: crypto.randomUUID()`), sans clé de déduplication `eventId+handlerId` | `:196`, `:222`, `:243` | Un burst de 600 tickets qui échouent sur 3 handlers = 1 800 lignes DLQ, puis 1 800 rejeux planifiés toutes les 30 s. |
| B4 | **La DLQ n'existe que côté navigateur** (`typeof window !== 'undefined'`) | `:194`, `:220`, `:241` | Un échec côté serveur (route API, Cloud Function) n'est jamais rejoué par ce chemin. Il existe une seconde DLQ serveur (§ 3.2) sans passerelle avec celle-ci. |
| B5 | **`BACKGROUND` est un `forEach` sans limite de parallélisme** | `:233-252` | 600 tickets rejoués → 600×N handlers lancés simultanément, sans backpressure. |
| B6 | **Aucun champ de priorité fiscale à l'émission** — l'ordre de traitement d'un burst est l'ordre d'arrivée | — | Un rejeu massif traite les notifications marketing avant les sceaux fiscaux. |
| B7 | `emitDurable` n'écrit dans `busOutbox` que si `window` existe ; **le marquage `done` peut échouer silencieusement** (`.catch` → `logger.error`) | `:128-134` | Ligne restée `pending` → rejouée au boot suivant par `replayPendingEvents` → double effet (cf. B2). |

### 3.2 Les files : trois queues, deux implémentations, une morte

| File | Support | Écrivain | Draineur | État |
|---|---|---|---|---|
| `db.syncQueue` | Dexie (navigateur) | `SyncManager.enqueue`, `FinancialNexusBridge` (mode hors-ligne) | `SyncManager.processQueue` | **Actif** |
| `db.syncQueue` *(bis)* | Dexie — **même table** | `OutboxService.enqueue` | `OutboxService.drain` | **Mort** — 0 consommateur applicatif |
| `db.busOutbox` | Dexie | `NexusEventBus.emitDurable` | `replayPendingEvents` (au boot) | Actif |
| `db.deadLetterEvents` | Dexie | `NexusEventBus` (3 priorités) | `DLQRetryService` (30 s, max 5) | Actif — **navigateur uniquement** |
| `tenants/{id}/dead_letter_events` | Nexus (serveur) | `ServerEventBus` | `/api/admin/dlq/replay-batch` (MCC) | Actif — **cloisonné de la précédente** |

**Constat n°1 — `OutboxService` est un doublon mort.** C'est pourtant lui qui porte les tiers de
priorité de l'ADR-014 (`LEGAL` > `SANITAIRE` > `FISCAL` > `NORMAL`) et le mapping automatique
collection → priorité. Le seul draineur réel (`SyncManager`) ne connaît qu'un booléen `priority`.
La doctrine documentée n'est pas celle qui s'exécute.

**Constat n°2 — la documentation d'`OutboxService` est fausse.** Son en-tête promet « toute mutation
locale est enfilée avec un `eventId` **déterministe** (idempotence) ». L'implémentation fait
`evt_${Date.now()}_${Math.random()...}` (`:79`) — non déterministe par construction.

**Constat n°3 — deux DLQ sans passerelle.** La DLQ navigateur vit dans l'IndexedDB d'**une** tablette.
La tablette de terrasse qui a accumulé 600 échecs les perd si on la réinitialise, si l'utilisateur
vide les données du site, ou si `db.clearAll()` passe (§ 3.6). L'écran MCC `/admin/mcc/dlq` et la
route `replay-batch` lisent la collection **serveur** — ils ne voient pas ces 600 lignes.

**Constat n°4 — `SyncManager` n'a pas de sortie de secours.** `processQueue` rejoue indéfiniment les
opérations `failed` (par choix explicite et défendable : « une op fiscale n'est JAMAIS abandonnée »),
mais sans quarantaine ni plafond. Un message empoisonné (schéma invalide, tenant supprimé) tourne en
boucle à chaque `online`, `boot` et `enqueue`. De plus `this.isSyncing = false` n'est pas dans un
`finally` : une exception hors du `try` interne verrouille la synchronisation pour la durée de la session.

### 3.3 Les cinq handlers du cahier des charges

#### `StockDeductionHandler` — priorité `HIGH`, non idempotent

```
order.paid ──► pour chaque item
                 ├─ produit absent ..................... return  (silence)
                 ├─ produit.recipeId ─► recette absente  return  (silence)
                 │                    └─ recette présente ─► pour chaque ingrédient
                 │                                             └─ stockItem absent → return (silence)
                 └─ produit.linkedStockItemId ─► stockItem absent → return (silence)
```

- Les `Promise.allSettled` de la branche `order.paid` **n'inspectent jamais les rejets** : un échec
  réel ne remonte pas, n'atteint pas la DLQ, ne produit aucune alerte. (La fonction
  `deductStockForLines`, utilisée par `inventory.deducted`, le fait correctement — asymétrie.)
- La décrémentation est atomique (`Nexus.adapter.increment`), mais **aucun mouvement n'est écrit**.
  `stockItems.quantity` est un scalaire muté en place : on ne peut ni auditer, ni annuler, ni
  recalculer, ni imputer un coût. `inventoryMovements` n'est alimenté que par la réception et
  les écrans de stock, jamais par la vente.
- `_deductStock` fait **quatre allers-retours** par ingrédient (`get`, `increment`, `update`, `get`).
  Un burst de 600 tickets × 4 lignes × 5 ingrédients = 12 000 déductions × 4 requêtes = 48 000 I/O.

#### `TicketZHandler` — priorité `BACKGROUND`

- `const today = new Date().toISOString().split('T')[0]` (`:48`) — horloge murale **et** UTC.
- `if (existing.closed) return` (`:63`) — **absorption silencieuse** d'un ticket tardif.
- La libération de table et l'agrégation Z sont dans **deux transactions distinctes** : un crash entre
  les deux libère la table sans compter la vente.
- `closeTicketZForDay` est correctement idempotent (test d'existence de `journalEntries/Z_{date}` avant
  tout) et scelle atomiquement (`sealDataAtomically` + mise à jour du ticket dans la même transaction).
  **C'est la meilleure implémentation du dépôt** et le patron à généraliser.
- Mais son numéro de pièce séquentiel est généré **au moment de la clôture** : clôturer 15 jours d'un
  coup produit 15 numéros consécutifs dans l'ordre de traitement, sans garantie qu'il corresponde à
  l'ordre chronologique des journées.
- Aucun appelant automatique : `ZReportAutoJob` existe, il est enregistré dans `CronScheduler.jobs`,
  mais **`CronScheduler.start()` n'est appelé nulle part**. La clôture automatique de 23h59 ne tourne pas.
- `GrandTotalScheduler` (cumul mensuel/annuel, art. 88 CGI) n'est **même pas enregistré** dans
  `CronScheduler.jobs`.

#### `AccountingSyncHandler` — priorité `BACKGROUND`

- `date: new Date().toISOString().slice(0, 10)` — la vente poussée vers Pennylane porte **la date de
  synchronisation**, pas la date de vente. Un rattrapage de 15 jours écrase toute la ventilation.
- `catch { logger.error(...) }` sans relance ni DLQ, assumé en commentaire (« une DLQ dédiée sera un
  chantier séparé »). Un push perdu l'est définitivement, sans compteur ni écran.
- Aucun contrôle de verrouillage de période avant le push.

#### `LaborCostAnalyzerHandler` — priorité `BACKGROUND`

- `LaborCostAnalyzer.analyzeDailyLaborCost(tenantId, 0)` — le chiffre d'affaires passé en second
  argument est **la constante `0`**. Le ratio masse salariale / CA est donc calculé contre zéro.
- Se déclenche sur `hr.shift_ended` et `staff.clock_out` uniquement : **un pointage saisi a posteriori
  ne recalcule rien**, puisqu'aucun événement de correction n'existe.
- `handleShiftCompleted` recalcule toujours « aujourd'hui » (`endedAt || Date.now()` → `dateStr`).

#### `OutboxService`

Voir § 3.2 — code mort, doctrine ADR-014 non exécutée, promesse d'idempotence non tenue.

### 3.4 La chaîne fiscale NF525

**Ce qui est solide.** `FiscalSealer.sealDataAtomically` écrit sceau + écriture de journal dans une
**seule transaction**, avec `previousHash` lu dans la même transaction (pas de fenêtre de course).
`SovereignGuard` interdit structurellement `update`/`delete` sur `journalEntries`, `fiscalSeals`,
`fiscalLedger`, `grandTotals`, `wormArchives`, `legacyArchive`, `legacyOrders`. `closeTicketZForDay`
scelle le Z dans la même transaction que le marquage `closed`.

**Le trou hors-ligne.** Dans `FinancialNexusBridge.processOrder`, la branche `!navigator.onLine` écrit :

```ts
hash        = 'PENDING_OFFLINE_SEAL';
signature   = 'PENDING_OFFLINE_SEAL';
previousHash= 'PENDING_OFFLINE';
// écriture de journal en status 'draft', pieceNumber = `OFFLINE-${entryId}`
```

puis enfile un `COMMIT_BATCH` qui, à la reconnexion, **écrit cet objet tel quel** dans
`tenants/{id}/journalEntries/{entryId}`.

`grep -rn "PENDING_OFFLINE" src` retourne **6 occurrences, toutes des écritures** (bridge + refund).
**Aucun lecteur.** Il n'existe aucun processus de re-scellement. Résultat sur le scénario « terrasse
isolée, 3 jours, 600 tickets » : 600 écritures de journal en brouillon, avec un numéro de pièce
provisoire, un hash factice, hors de la chaîne de sceaux, et — puisque `journalEntries` est immuable —
**impossibles à corriger par `update`**.

**Autres défauts fiscaux.**

- `ReconciliationEngineHandler` fait `Nexus.adapter.update('tenants/{id}/fiscalLedger/ap_entry_...')`.
  `fiscalLedger` est dans `IMMUTABLE_COLLECTIONS` et `NexusInterceptor:129` refuse l'écriture
  (`NF525_UPDATE_IMMUTABLE_FORBIDDEN`). **Le lettrage d'une facture fournisseur ne peut pas aboutir.**
- `RefundExtourneHandler` cherche l'écriture d'origine à `journalEntries/{orderId}`, alors que
  `processOrder` génère `SharedKernel.generateId('JE')`. Le commentaire du fichier admet lui-même
  l'ambiguïté. En prod, l'extourne lève « Original JournalEntry not found » — et comme le handler est
  `BACKGROUND`, l'échec part en DLQ sans escalade fiscale (`order.refunded` n'est pas dans
  `FISCAL_CRITICAL_EVENTS`, qui liste `payment.refunded`).
- `PeriodLockGuardHandler.assertPeriodNotLocked` existe et est correct. **Aucun handler du bus ne
  l'appelle.** Le verrou de période est déclaré, pas appliqué.

### 3.5 RBAC

Niveaux réels (`src/kernel/contracts/rbac.ts`) :

```
1000/900/800 mcc_*  ·  100 admin  ·  90 directeur  ·  70 manager  ·  60 comptable
50 chef_rang/chef_atelier/praticien  ·  45 chef_cuisinier  ·  40 serveur/vendeur/...
35 cuisinier/barman  ·  30 hotesse  ·  10 plongeur
```

> **Écart avec l'énoncé de la mission** : le cahier des charges situe le chef de cuisine au niveau 70.
> Dans le dépôt il est à **45**, soit *en dessous* du comptable (60). Ce n'est pas une erreur à
> corriger : c'est la démonstration que **les pouvoirs rétroactifs ne sont pas hiérarchiques**.
> Le chef doit pouvoir inventorier et pas le comptable ; le comptable doit pouvoir passer une OD et
> pas le chef. Un seuil numérique unique ne peut pas exprimer deux pouvoirs orthogonaux.
> **Conclusion d'architecture** : le RBAC rétroactif doit être une matrice de capacités (§ 10),
> jamais un `minLevel`.

Défauts :

- **`useActionAccess` est fail-open** : « Par défaut autorisé si aucune restriction explicite n'est
  définie » (`:40`). Toute action rétroactive non déclarée serait ouverte au plongeur.
- **La branche `actionOverrides` est morte** : elle lit `overrides.minLevel` et ne fait rien
  (`// Comparer minLevel si configuré`). Réglage déclaré, jamais lu — violation Loi 8 point 2.
- **Aucun équivalent serveur.** `useActionAccess` est un hook React. Les routes API tenant n'ont pas
  de `requireTenantAction`. Seul le MCC a `requireMccLevel`.
- La matrice ne contient que **21 actions sur 8 pages**, aucune rétroactive.

### 3.6 Le rejeu et la destruction de données

`NexusSyncProvider` :

```tsx
useEffect(() => {
    NexusSyncService.init(tenantId, taskContext);
    ...
    return () => { NexusSyncService.stopAll(); ... };
}, [tenantId, taskContext, store]);
```

`taskContext` vient de `useTaskContext()` = `useMemo(() => resolveTaskContext(pathname), [pathname])`
→ **nouvelle référence d'objet à chaque changement de pathname**, même vers un contexte logiquement
identique. Le cleanup s'exécute donc **à chaque navigation** :

`stopAll()` → `shutdownNexusSync()` → `db.clearAll()` → `syncQueue.clear()`.

**`syncQueue` est la file des tickets NF525 non synchronisés.** Naviguer de `/pos` vers `/kds` pendant
une coupure réseau détruit les encaissements en attente. Le commentaire de `clearAll()` prend soin de
préserver `immunityLogs` (« la Boîte Noire est inaltérable par conception ») mais efface la file fiscale.

`clearAll()` ne purge en revanche ni `busOutbox`, ni `deadLetterEvents`, ni `processedEvents` : ces
trois tables croissent **sans borne ni purge** (`processedEvents` accumule une ligne par
couple `eventId×handlerId`, pour toujours).

### 3.7 Reprise d'antériorité — le client qui migre

`AirlockPipeline` (PARSE → DEDUP → VALIDATE → ENRICH → `commit`) est **conceptuellement juste** :
trois modes d'intégration (`TABULA_RASA` / `PONT` / `SUTURE_TOTALE`), écriture d'ouverture scellée,
archive WORM dans `legacyArchive` (collection immuable), miroir `legacyOrders` marqué `origin: 'legacy'`.

Mais l'écran `/migration` qui l'expose :

- **n'a pas d'import de fichier.** Le seul bouton alimentant `rawRows` est `handleLoadSampleData()`,
  qui injecte **5 lignes en dur** (`zelty_export_2026_sample.csv`). Aucun `<input type="file">`,
  aucun parseur CSV.
- **fabrique `genesisDate: new Date().toISOString()`** — la date de reprise est « maintenant », non
  choisie par le restaurateur.
- **code en dur `initiatedBy: 'manager@restaurant.fr'`** au lieu de l'utilisateur courant.
- enchaîne quatre `setTimeout` cosmétiques (600/700/600/500 ms) qui **simulent** la progression des
  étapes avant d'exécuter le pipeline réel d'un bloc.

`dedup()` est en **O(n²)** (double boucle sur tous les documents). Un export annuel Zelty de 50 000
lignes = 1,25 milliard de comparaisons dans le thread principal du navigateur.

Enfin, `AirlockPipeline` ne produit **aucun mouvement de stock** ni **aucune ligne de suspens** :
un client qui migre arrive avec un historique de ventes et un stock d'ouverture qui ne se parlent pas.

### 3.8 L'ouverture « jour 0 » — le nouveau restaurateur

`OnboardingWizard` déclare dix catégories d'import avec un drapeau `requiredForZero` :

| Catégorie | Requis pour une ouverture à blanc |
|---|---|
| Menu & Produits, Plan de salle, Équipe | **oui** |
| Fournisseurs, Stocks initiaux, Clients CRM, Historique résa, FEC, Relevés, **Recettes** | **non** |

Le produit **autorise donc explicitement** d'ouvrir sans stock initial et sans fiches techniques.
C'est le bon choix produit — c'est la réalité du terrain. Mais rien en aval n'assume cette décision :
les handlers de stock traitent l'absence de recette comme un cas impossible qu'on ignore, au lieu
d'un état d'ouverture normal qu'on enregistre pour le rattraper.

### 3.9 Synthèse — tableau des défauts

| Id | Défaut | Gravité | Pilier | Fichier |
|---|---|---|---|---|
| **F1** | `order.paid` et 90 autres événements sans champ temporel | **Critique** | 1,2,3,5 | `events/*.events.ts` |
| **F2** | Ticket Z agrégé sur l'horloge murale UTC | **Critique** | 2 | `TicketZHandler.ts:48` |
| **F3** | Ticket tardif absorbé silencieusement après clôture Z | **Critique** | 2 | `TicketZHandler.ts:63` |
| **F4** | Aucun re-scellement des tickets hors-ligne (`PENDING_OFFLINE_SEAL`) | **Critique** | 2,3 | `FinancialNexusBridge.ts:110` |
| **F5** | `db.clearAll()` (donc `syncQueue.clear()`) à chaque navigation | **Critique** | 3 | `NexusSyncProvider.tsx:34` |
| **F6** | 0 handler idempotent hors CRITICAL → double effet au rejeu | **Critique** | 3 | `NexusEventBus.ts:58` |
| **F7** | Consommation de vente n'écrit aucun mouvement de stock | **Critique** | 1 | `StockDeductionHandler.ts:124` |
| **F8** | Trois `return` silencieux sur référent absent | **Critique** | 1 | `StockDeductionHandler.ts:72,79,121` |
| **F9** | `useActionAccess` fail-open par défaut | **Haute** | 4 | `useActionAccess.ts:40` |
| **F10** | `CronScheduler.start()` sans appelant → clôture Z auto morte | **Haute** | 2 | `CronScheduler.ts:58` |
| **F11** | `fiscalLedger` immuable ⇒ lettrage AP structurellement impossible | **Haute** | 2,5 | `ReconciliationEngineHandler.ts:24` |
| **F12** | Extourne cherche l'écriture par `orderId` au lieu de l'id JE | **Haute** | 2 | `RefundExtourneHandler.ts:17` |
| **F13** | DLQ sans clé de déduplication → explosion en burst | **Haute** | 3 | `NexusEventBus.ts:196` |
| **F14** | Deux DLQ (navigateur / serveur) sans passerelle | **Haute** | 3 | `ServerEventBus.ts:52` |
| **F15** | `assertPeriodNotLocked` : 0 appelant | **Haute** | 2 | `PeriodLockGuardHandler.ts:31` |
| **F16** | `eventId` divergent entre `emit` et `emitDurable` | **Haute** | 3 | `NexusEventBus.ts:158` vs `:96` |
| **F17** | Facture tardive écrase `lastCostInMicrounits` sans historisation | **Haute** | 5 | `FoodCostRecomputer.ts:86` |
| **F18** | Inventaire physique : `update` non transactionnel, écart non tracé | **Haute** | 1 | `PhysicalInventoryHandler.ts:21` |
| **F19** | Pointages non appariés, absence de détection de sortie manquante | **Haute** | 5 | `PayrollTimeclockHandler.ts` |
| **F20** | Écran de migration sans import de fichier (5 lignes en dur) | **Haute** | — | `AirlockMigrationPanel.tsx:70` |
| **F21** | `OutboxService` mort ⇒ tiers de priorité ADR-014 non exécutés | Moyenne | 3 | `OutboxService.ts` |
| **F22** | `SyncManager` : pas de quarantaine, `isSyncing` hors `finally` | Moyenne | 3 | `sync-manager.ts:77` |
| **F23** | `GrandTotalScheduler` non enregistré (art. 88 CGI) | Moyenne | 2 | `CronScheduler.ts:29` |
| **F24** | `LaborCostAnalyzer.analyzeDailyLaborCost(tenantId, 0)` — CA figé à 0 | Moyenne | 5 | `LaborCostAnalyzerHandler.ts:49` |
| **F25** | `processedEvents` / `busOutbox` / `deadLetterEvents` sans purge | Moyenne | 3 | `offline-store.ts:134` |
| **F26** | `dedup()` en O(n²) sur l'import legacy | Moyenne | — | `AirlockPipeline.ts:84` |
| **F27** | `actionOverrides.minLevel` lu et ignoré | Moyenne | 4 | `useActionAccess.ts:28` |
| **F28** | Aucune garde RBAC serveur côté tenant | Moyenne | 4 | `src/app/api/**` |

---

## 4. Les trois profils temporels

Toute la conception doit servir trois profils simultanément. Ils partagent les mêmes moteurs mais
n'ont pas les mêmes entrées ni les mêmes garde-fous.

### Profil A — Le nouveau restaurateur qui ouvre

**Réalité.** Il ouvre lundi. Il a saisi sa carte (obligatoire) et son plan de salle. Il n'a **ni stock
initial ni fiche technique** — le wizard le lui permet (§ 3.8). Il encaisse dès le premier service.
Son premier inventaire physique aura lieu à J+5, un dimanche soir, à la fermeture. Ses fiches
techniques arriveront par vagues sur trois semaines.

**Ce que le système doit garantir.**
- Encaisser n'est **jamais** bloqué par l'absence de stock ou de recette.
- Chaque vente non résolue produit une **ligne de suspens** horodatée à `occurredAt`.
- Le stock démarre à une **date de genèse** explicite : avant elle, aucune quantité n'est réputée
  connue ; le stock théorique n'est pas « 0 », il est **indéterminé** — distinction essentielle,
  sans quoi tout part en négatif dès le premier service.
- À J+5, l'inventaire physique **ferme la période d'indétermination** : il fixe la quantité de
  référence, produit un écart *non valorisé* (pas de coût connu avant), et solde ou classe les suspens
  antérieurs.
- À J+21, quand la fiche technique du plat vendu 300 fois arrive, le système **propose** un rattrapage
  chiffré et **n'applique rien sans validation explicite**.

### Profil B — Le client qui migre avec ses données

**Réalité.** Il tourne depuis 4 ans sur Zelty. Il bascule un lundi. Il apporte : un export de ventes,
un FEC, un fichier fournisseurs, un stock d'ouverture compté la veille, un historique de réservations.
Il veut que son CA cumulé, son food cost et sa TVA soient cohérents dès le premier jour.

**Ce que le système doit garantir.**
- Une **date de genèse** (`genesisDate`) explicitement choisie par le restaurateur, pas `Date.now()`.
- Une frontière **étanche** entre l'avant (archive WORM `legacyArchive`, non fiscalement rejouable)
  et l'après (chaîne NF525 propre à partir de la genèse) — le mode `PONT` de l'`AirlockPipeline`
  fait exactement ça, il faut le rendre atteignable depuis un vrai import.
- Une **écriture d'ouverture scellée** (séquence 1) portant les soldes repris — déjà implémentée
  (`generateOpeningEntry`), jamais atteignable en production faute d'import réel.
- Un **stock d'ouverture posé comme mouvement daté** de `genesisDate`, avec un coût unitaire repris
  → c'est la première couche de coût du `CostLayerLedger` (§ 5.7). Sans elle, le premier food cost
  est faux et le restera.
- Aucun événement fiscal rejoué : l'historique importé **n'émet pas** `order.paid`. Il alimente les
  agrégats analytiques et le RAG, jamais la chaîne de sceaux.

### Profil C — Le restaurant en exploitation qui oublie

**Réalité.** C'est le profil le plus fréquent et le seul permanent. La compta n'est pas vérifiée
pendant 15 jours. Les pointages sont saisis le vendredi pour la semaine. La facture du poisson arrive
15 jours après le service. La caisse de terrasse est restée hors-ligne 3 jours.

**Ce que le système doit garantir.**
- Le retard est **visible** : un compteur unique, permanent, dans l'en-tête.
- Le retard est **quantifié** : « 3 clôtures Z en attente · 47 suspens de stock · 12 pointages
  incomplets · 2 factures non rapprochées ».
- Le retard est **rattrapable en lot**, avec simulation préalable et journal d'audit.
- Le retard **ne dégrade jamais** l'exploitation courante : le rattrapage est borné, mis en file, et
  n'entre jamais en concurrence avec l'encaissement.
- Passé un seuil, le retard **alerte** au lieu d'attendre qu'on le découvre.

---

## 5. Doctrine cible — huit primitives

Chaque scénario du cahier des charges est une instance de ces huit primitives. On ne code pas de
rustine par scénario.

### 5.1 `BusinessClock` — le temps métier

`src/kernel/time/BusinessClock.ts` (kernel : aucune dépendance vers `modules/`)

```ts
export interface TemporalStamp {
  occurredAt: string;   // ISO 8601 avec offset — instant réel du fait, FIGÉ à l'origine
  businessDay: string;  // 'YYYY-MM-DD' — journée de SERVICE, dérivée de occurredAt
  recordedAt: string;   // ISO 8601 — instant d'enregistrement système
}

export interface ServiceDayConfig {
  timezone: string;      // 'Europe/Paris' — dans TenantConfig
  cutoverHour: number;   // 5 → la journée de service court de 05h00 à 05h00
}

export const BusinessClock = {
  /** Estampille un fait qui vient de se produire. */
  stampNow(cfg: ServiceDayConfig): TemporalStamp,
  /** Estampille un fait passé (rejeu hors-ligne, saisie a posteriori). */
  stampAt(occurredAt: string, cfg: ServiceDayConfig): TemporalStamp,
  /** Journée de service d'un instant, en heure locale du tenant. */
  resolveServiceDay(iso: string, cfg: ServiceDayConfig): string,
  /** Retard en heures entre le fait et son enregistrement. */
  lagHours(stamp: TemporalStamp): number,
  /** Bornes UTC d'une journée de service, pour les requêtes. */
  serviceDayBounds(day: string, cfg: ServiceDayConfig): { fromIso: string; toIso: string },
};
```

**Règles d'usage — non négociables.**

1. Aucun handler n'appelle `new Date()` pour dater un **fait métier**. Il lit `payload.occurredAt`.
   `new Date()` reste légitime pour `recordedAt`, les logs et les métriques techniques.
2. Tout événement du catalogue gagne `occurredAt: string` (obligatoire) et `businessDay: string`
   (obligatoire pour les événements comptables, stock, RH). Migration par `PayloadMigrator`
   (§ 6.2) : un payload `v1` sans `occurredAt` reçoit `occurredAt = recordedAt` et un drapeau
   `temporalFallback: true` qui le rend visible dans les mesures.
3. `cutoverHour` et `timezone` vont dans `TenantConfigSchema`, avec défaut `Europe/Paris` / `5`.
   Ils sont **lus** par `BusinessClock`, donc pas de réglage mort.

**Ce que ça règle** : F1, F2, et la moitié de F3.

### 5.2 `LedgeredStock` — le stock est un journal

Le scalaire `stockItems.quantity` devient une **projection**, jamais la source de vérité.

Collection `tenants/{id}/stockMovements` (append-only, ajoutée à `SIGNED_WRITE_COLLECTIONS`) :

```ts
interface StockMovement {
  id: string;                 // déterministe : `${sourceType}:${sourceId}:${itemId}`
  itemId: string;
  quantity: number;           // SIGNÉ : négatif = sortie
  unit: string;
  reason: 'SALE' | 'RECEPTION' | 'WASTE' | 'INVENTORY_ADJUSTMENT'
        | 'BACKFILL_RECIPE' | 'REVERSAL' | 'OPENING' | 'TRANSFER' | 'PRODUCTION';
  sourceType: 'order' | 'reception' | 'inventory' | 'waste' | 'backfill' | 'migration';
  sourceId: string;
  occurredAt: string;         // ─┐
  businessDay: string;        //  ├─ BusinessClock
  recordedAt: string;         // ─┘
  costLayerId?: string;       // rattachement à une couche de coût (§ 5.7)
  unitCostInMicrounits?: number;
  reversedByMovementId?: string;   // annulation = mouvement inverse, jamais suppression
  reversesMovementId?: string;
  actorId: string;
  note?: string;
}
```

**Invariants.**
- `quantity` de `stockItems` = somme des mouvements. Recalculable à tout instant, à toute date.
- On n'annule **jamais** un mouvement : on en écrit un inverse (`REVERSAL`) qui référence l'original.
- L'id est **déterministe** : rejouer deux fois `order.paid#JE_x` produit le même id de mouvement →
  le `set` est naturellement idempotent, même si le handler est rejoué.
- Avant `genesisDate`, la quantité est **indéterminée** (`null`), pas zéro. `stockItems` gagne
  `knownSince?: string`.

**Ce que ça règle** : F7, la traçabilité de F8, la réversibilité de tout rattrapage.

### 5.3 `SuspenseRegistry` — le registre des faits non résolus

C'est la primitive centrale. Là où le code fait aujourd'hui `return` silencieux, il **écrit une ligne**.

Collection `tenants/{id}/suspense` :

```ts
interface SuspenseEntry {
  id: string;                 // déterministe : `${domain}:${sourceId}:${subjectId}`
  domain: 'stock' | 'accounting' | 'hr' | 'purchasing' | 'fiscal';
  reason:
    | 'NO_PRODUCT'            // vendu, absent du catalogue
    | 'NO_RECIPE'             // vendu, pas de fiche technique
    | 'NO_STOCK_ITEM'         // recette OK, article de stock inexistant
    | 'STOCK_UNKNOWN_BEFORE_GENESIS'
    | 'Z_CLOSED_LATE_TICKET'  // ticket arrivé après clôture Z
    | 'OFFLINE_SEAL_PENDING'  // ticket hors-ligne non re-scellé
    | 'PERIOD_LOCKED'         // écriture visant une période verrouillée
    | 'NO_ACCOUNTING_CONNECTOR'
    | 'MISSING_CLOCK_OUT' | 'MISSING_CLOCK_IN' | 'SHIFT_UNPAIRED'
    | 'INVOICE_WITHOUT_RECEPTION' | 'RECEPTION_WITHOUT_INVOICE'
    | 'PO_AMOUNT_MISMATCH';
  subjectId: string;          // productId, employeeId, invoiceId…
  subjectLabel: string;       // libellé lisible, figé au moment du constat
  sourceType: string; sourceId: string;
  quantity?: number;
  amountInMicrounits?: number;
  occurredAt: string; businessDay: string; recordedAt: string;
  status: 'pending' | 'resolved' | 'waived' | 'superseded';
  resolution?: {
    strategy: 'BACKFILL' | 'ADJUSTMENT' | 'REGULARIZATION' | 'MANUAL' | 'WAIVE';
    resolvedBy: string; resolvedAt: string; reason: string;
    producedMovementIds?: string[]; producedEntryIds?: string[];
  };
  tenantId: string;
}
```

**Écriture — le patron de remplacement des `return` silencieux :**

```ts
// AVANT
if (!recipe?.ingredients?.length) return;

// APRÈS
if (!recipe?.ingredients?.length) {
  await SuspenseRegistry.record({
    domain: 'stock', reason: 'NO_RECIPE',
    subjectId: item.productId, subjectLabel: item.name,
    sourceType: 'order', sourceId: orderId,
    quantity: item.quantity,
    ...BusinessClock.stampAt(payload.occurredAt, cfg),
  });
  return;   // le service n'est JAMAIS bloqué
}
```

`SuspenseRegistry.record` est **idempotent par construction** (id déterministe + `set`), et **agrège**
plutôt que de dupliquer : 300 ventes du même plat sans recette produisent 300 lignes détaillées mais
une seule ligne d'agrégat lisible dans l'UI (`suspenseGroups`, projection par `domain+reason+subjectId`).

**Ce que ça règle** : F3, F8, et rend possible tout ce qui suit.

### 5.4 `BackfillEngine` — le rejeu rétroactif borné

`src/kernel/backfill/BackfillEngine.ts`. Trois temps, jamais deux.

```
PLAN ──────────► SIMULATE ─────────► APPLY
(lecture seule)  (lecture seule,     (transactionnel, journalisé,
                  chiffrage complet)  réversible)
```

```ts
interface BackfillPlan {
  id: string;
  kind: 'RECIPE_RETRO_DEDUCTION' | 'STOCK_GENESIS' | 'Z_CATCHUP'
      | 'TIMECLOCK_REPAIR' | 'COST_REALLOCATION' | 'OFFLINE_RESEAL';
  scope: { from: string; to: string; subjectIds: string[] };   // bornes de journée de service
  sourceSuspenseIds: string[];
  effects: BackfillEffect[];       // mouvements / écritures / pointages projetés
  impact: {
    stockDeltaByItem: Record<string, number>;
    stockWouldGoNegative: { itemId: string; at: string; qty: number }[];
    amountInMicrounits: number;
    touchesLockedPeriods: string[];   // ['2026-07', '2026-08']
    affectedBusinessDays: string[];
  };
  policy: BackfillPolicy;
  createdBy: string; createdAt: string;
  status: 'draft' | 'simulated' | 'applied' | 'rejected' | 'expired';
}

interface BackfillPolicy {
  /** Que faire si le stock passerait sous zéro. */
  onNegativeStock: 'CLAMP_AT_ZERO' | 'ALLOW_NEGATIVE' | 'ABORT' | 'CREATE_ADJUSTMENT';
  /** Que faire des journées déjà couvertes par un inventaire physique. */
  onCountedDay: 'SKIP' | 'APPLY_BEFORE_COUNT';
  /** Que faire si la période comptable est verrouillée. */
  onLockedPeriod: 'REGULARIZE_TODAY' | 'ABORT';
  maxRetroDays: number;            // borne dure issue du RBAC (§ 10)
  dryRun: boolean;
}
```

**Le point d'architecture le plus délicat — `onCountedDay`.**

Un inventaire physique **écrase** l'histoire théorique : au 5 septembre, le stock compté fait foi.
Rejouer après coup les déductions du 1er au 4 septembre **doublerait la démarque**, puisque le comptage
du 5 a déjà constaté la disparition physique de ces ingrédients.

Règle : **le `BackfillEngine` ne franchit jamais un point de comptage.** Il découpe automatiquement
son périmètre aux bornes des inventaires physiques :

```
1er ─ 2 ─ 3 ─ 4 ─ [INVENTAIRE 5 sept] ─ 6 ─ 7 ─ 8 ─► aujourd'hui
└──── segment A : SKIP par défaut ────┘└─ segment B : rejeu applicable ─┘
```

`APPLY_BEFORE_COUNT` reste disponible (le comptage du 5 est alors recalculé comme un écart, pas comme
une vérité), mais **`SKIP` est le défaut** et l'UI l'explique en une phrase.

C'est la réponse directe à la question « comment éviter un stock négatif artificiel » : on ne
l'évite pas par un `Math.max(0, …)` — on l'évite en **ne rejouant pas ce qui a déjà été constaté
physiquement**, et en signalant explicitement le reliquat.

### 5.5 `LateArrivalRouter` — l'arbitre du fait tardif

Un seul point de décision, appelé par tous les handlers qui écrivent un fait daté :

```ts
type Verdict =
  | { route: 'NORMAL' }                                            // période ouverte, Z non clos
  | { route: 'LATE_OPEN'; businessDay: string }                    // Z non clos, imputation d'origine
  | { route: 'POST_Z'; businessDay: string; suspenseId: string }   // Z clos, période ouverte
  | { route: 'LOCKED'; periodId: string; suspenseId: string };     // période verrouillée

LateArrivalRouter.route(tenantId, stamp): Promise<Verdict>
```

| Verdict | Condition | Traitement |
|---|---|---|
| `NORMAL` | `businessDay` = journée courante | Chemin nominal |
| `LATE_OPEN` | journée passée, Z **non** clos | Imputation sur la journée d'origine — c'est ce que le code ne sait pas faire aujourd'hui |
| `POST_Z` | Z clos, mois non verrouillé | Écriture **complémentaire** sur la journée d'origine + **Z rectificatif** `Z_{date}_R{n}` scellé, chaîné après le Z initial. Le Z initial reste intact (NF525). |
| `LOCKED` | mois verrouillé (`fiscalPeriodLocks`) | **Interdiction absolue** d'écrire dans la période. Suspens `PERIOD_LOCKED` + proposition d'OD de régularisation datée du jour, référençant la pièce d'origine. |

C'est ici que `PeriodLockGuardHandler.assertPeriodNotLocked` (aujourd'hui à 0 appelant) trouve
son unique et vrai point d'appel. **Ce que ça règle** : F3, F15.

### 5.6 `RegularizationEngine` — corriger sans altérer

Trois primitives légales, et rien d'autre. Aucune ne touche à une pièce scellée.

| Primitive | Écrit | Date d'écriture | Date d'effet | Cas |
|---|---|---|---|---|
| **Extourne** | écriture inverse scellée, `referenceType: 'reversal'`, `reversesEntryId` | aujourd'hui | période d'origine si ouverte, sinon aujourd'hui | erreur de ventilation TVA, mauvais moyen de paiement |
| **OD de régularisation** | écriture nouvelle scellée, `referenceType: 'adjustment'`, motif obligatoire | aujourd'hui | aujourd'hui | rattrapage sur période verrouillée, démarque d'inventaire |
| **Avoir** | ticket négatif scellé, chaîné, `referenceType: 'refund'` | aujourd'hui | aujourd'hui | remboursement client |

**Le Grand Total ne bouge jamais rétroactivement.** Il est cumulatif et chaîné : une extourne ajoute
un montant négatif au cumul du jour où elle est passée. C'est la seule lecture conforme de
l'art. 286-I-3° bis CGI.

Cette primitive corrige aussi **F12** : la recherche de l'écriture d'origine se fait sur
`referenceId`/`orderId` **indexé**, pas en supposant que l'id du document est l'id de commande.

### 5.7 `CostLayerLedger` — la facture qui arrive après le service

Aujourd'hui `FoodCostRecomputer` écrase `lastCostInMicrounits` sur l'article de stock. Une facture
reçue le 20 pour une livraison du 5 réécrit donc le coût de **tout** — y compris de ce qui a été
consommé avant la livraison. Le food cost passé devient faux, silencieusement, et sans trace.

Collection `tenants/{id}/costLayers` (append-only) :

```ts
interface CostLayer {
  id: string; itemId: string;
  quantityIn: number; quantityRemaining: number;
  unitCostInMicrounits: number;
  costStatus: 'PROVISIONAL' | 'CONFIRMED';   // PROVISIONAL = reçu sans facture
  receivedAt: string; businessDay: string;
  supplierId?: string; receptionId?: string; invoiceId?: string;
  supersededByLayerId?: string;
}
```

- La **réception** crée une couche `PROVISIONAL` au dernier prix connu (ou au prix du bon de commande).
- Les **sorties** (`stockMovements` de raison `SALE`, `WASTE`…) consomment les couches selon la méthode
  du tenant (`FIFO` par défaut, `CUMP` en option — réglage `TenantConfig.costingMethod`, **lu**).
- La **facture tardive** ne réécrit rien : elle **confirme** la couche (`CONFIRMED`) avec le prix réel
  et émet `finance.cost_layer_confirmed { deltaInMicrounits, affectedBusinessDays }`.
- Un delta non nul déclenche un `BackfillPlan` de type `COST_REALLOCATION` : recalcul du food cost des
  journées touchées + proposition d'OD si la période est verrouillée.

**C'est la réponse à « comment répercuter le coût réel d'achat sur une période déjà écoulée »** :
on ne réécrit pas le passé, on **confirme des couches** et on **recalcule des indicateurs** ; seule
la comptabilité reçoit une écriture, datée du jour, référençant la période d'origine.

### 5.8 `BurstGovernor` — le dépilage massif sans saturation

`src/kernel/queue/BurstGovernor.ts` — un ordonnanceur devant le bus, appliqué au rejeu (jamais au
temps réel).

```ts
interface BurstConfig {
  maxConcurrent: number;        // 4 — nombre de faits traités en parallèle
  batchSize: number;            // 25 — taille d'un lot avant respiration
  yieldMs: number;              // 50 — respiration entre deux lots (garde l'UI fluide)
  priorityOrder: ['LEGAL','SANITAIRE','FISCAL','NORMAL'];   // tiers ADR-014, enfin exécutés
  circuitBreaker: { failureRateThreshold: 0.3; windowSize: 50; cooldownMs: 60_000 };
}
```

Comportement sur le scénario « 600 tickets, 3 jours hors-ligne » :

1. À la reconnexion, `SyncManager` remonte 600 opérations. Le gouverneur les **trie** par tier
   (`FISCAL` d'abord) puis par `occurredAt` — l'ordre chronologique est obligatoire pour la chaîne
   de sceaux.
2. Il les traite par lots de 25, 4 en parallèle, avec 50 ms de respiration : ~6 s de traitement,
   UI fluide, encaissement courant jamais bloqué.
3. **Disjoncteur** : si plus de 30 % des 50 derniers échouent, le rejeu s'arrête 60 s et remonte une
   alerte. On n'inonde pas la DLQ de 1 800 lignes pour une cause unique (réseau, tenant, schéma).
4. La DLQ reçoit **une ligne par `eventId×handlerId`** (clé déterministe, § 6.1) avec un compteur
   `occurrences`, pas une ligne par échec. 600 échecs de même cause = 1 ligne, `occurrences: 600`.
5. Un `BurstSession` est ouvert : `{ id, startedAt, totalCount, processedCount, failedCount, tier }`,
   observable dans l'UI (§ 8.9) et clôturé par un rapport.

**Ce que ça règle** : F13, l'exécution réelle de l'ADR-014 (F21), la moitié de F5 (voir § 6.4).

---

## 6. Corrections structurelles du socle

Les huit primitives ne tiennent que si le socle cesse de perdre des données. Six corrections sont
des **prérequis durs**.

### 6.1 Identité d'événement unifiée

Extraire une fonction unique, utilisée par `emit`, `emitDurable` et `emitToHandler` :

```ts
// src/shared/eventBus/eventIdentity.ts
export function resolveEventId(event: string, payload: Record<string, unknown>): string {
  if (payload.eventId) return String(payload.eventId);
  const businessId = payload.id ?? payload.orderId ?? payload.transactionId
                  ?? payload.invoiceId ?? payload.tableId ?? payload.reservationId
                  ?? payload.shiftId ?? payload.receptionId ?? payload.inventoryId;
  return businessId ? `${event}:${businessId}` : `${event}:${crypto.randomUUID()}`;
}
export const dlqKey = (eventId: string, handlerId: string) => `${eventId}__${handlerId}`;
```

Corrige **F16** et donne à **F13** sa clé de déduplication.

### 6.2 Idempotence par défaut, transactionnelle

1. **Inverser le défaut** : `isIdempotent = options.idempotent ?? true`. On déclare `idempotent: false`
   pour les rares handlers réellement non déduplicables (notifications purement décoratives), au lieu
   d'oublier `idempotent: true` 186 fois.
2. **Réserver avant d'agir** (`claim-before-run`) : `IdempotencyGuard` actuel fait `isDuplicate` →
   `fn()` → `markProcessed`, un enchaînement non atomique — deux rejeux concurrents passent tous deux
   la vérification, et un plantage entre `fn()` et `markProcessed` provoque un double effet au boot
   suivant. Le remplacer par une réservation transactionnelle :

```ts
const claim = await IdempotencyGuard.claim(eventId, handlerId, tenantId);
// claim = 'ACQUIRED' | 'ALREADY_DONE' | 'IN_PROGRESS_STALE'
if (claim === 'ALREADY_DONE') return;
try   { await fn(payload); await IdempotencyGuard.commit(eventId, handlerId); }
catch { await IdempotencyGuard.release(eventId, handlerId); throw; }
```

3. **Purge** : `processedEvents` reçoit un TTL (90 jours) purgé au boot. Corrige une partie de **F25**.

Corrige **F6**.

### 6.3 Re-scellement des tickets hors-ligne

Nouveau service `src/modules/finance/fiscalite/OfflineResealService.ts`, déclenché au retour en ligne,
**avant** tout autre drainage :

```
1. Lire journalEntries où fiscalSealHash == 'PENDING_OFFLINE_SEAL', triés par occurredAt croissant
2. Pour chacun, dans l'ordre chronologique strict :
   a. générer le numéro de pièce séquentiel définitif
   b. sealDataAtomically(snapshot, tenantId, …) — chaînage sur le head courant
   c. écrire une NOUVELLE écriture 'sealed' + une ligne de correspondance
      offlineSealMap/{provisionalId} = { finalEntryId, finalReceiptNumber, resealedAt }
   d. le brouillon d'origine reste, marqué status: 'superseded' (journalEntries est immuable :
      on n'écrase pas, on ajoute et on référence)
3. Émettre fiscal.offline_batch_resealed { count, from, to, firstReceipt, lastReceipt }
4. Solder les suspens OFFLINE_SEAL_PENDING correspondants
```

**Point de conformité.** Le numéro de pièce définitif est attribué **au re-scellement**, donc dans
l'ordre chronologique des ventes, pas dans l'ordre de reconnexion. Le ticket client imprimé
hors-ligne porte le numéro provisoire `OFFLINE-JE_x` : la table de correspondance `offlineSealMap`
est l'élément qui rend le contrôle DGFiP traçable. Elle rejoint `IMMUTABLE_COLLECTIONS`.

Corrige **F4**.

### 6.4 Arrêter de détruire la file de synchronisation

Trois corrections, indépendantes et cumulatives :

1. **`clearAll()` ne touche plus aux files.** Retirer `syncQueue.clear()` de `clearAll()`. Une file
   d'opérations non synchronisées n'est pas un cache : c'est de la donnée métier non encore persistée.
   Renommer la méthode `clearReadCaches()` pour que l'intention soit lisible.
2. **Stabiliser `useTaskContext`.** Retourner un objet **mémoïsé sur `taskId`**, pas sur `pathname` :

```ts
const taskId = useMemo(() => resolveTaskContext(pathname ?? '/').taskId, [pathname]);
return useMemo(() => TASK_MAPS[taskId], [taskId]);   // même référence tant que le taskId ne change pas
```

3. **Garde de sécurité.** `shutdownNexusSync` refuse de purger si `syncQueue` contient des opérations
   `pending`/`failed`, journalise et alerte.

Corrige **F5**, et rend le scénario du burst survivable.

### 6.5 Fusionner les deux DLQ

- La DLQ navigateur (`db.deadLetterEvents`) devient un **tampon local**, répliqué vers
  `tenants/{id}/dead_letter_events` dès que le réseau revient (via `SyncManager`, tier `FISCAL` si
  l'événement est fiscal).
- L'écran MCC et `DLQDiagnosticPanel` lisent la **même** source côté serveur, avec l'origine
  (`deviceId`) en colonne.
- La quarantaine cesse d'être un cul-de-sac : `status: 'quarantine'` ouvre une ligne de suspens
  `domain: 'fiscal'` visible **côté tenant**, pas seulement côté MCC.

Corrige **F14**, et rend le retard observable par celui qui doit le traiter.

### 6.6 Réanimer l'ordonnanceur

- Appeler `CronScheduler.start()` — côté serveur (route de santé / worker), pas dans un `useEffect`
  client où l'onglet fermé arrête tout.
- Respecter le champ `schedule` : `CronScheduler` l'ignore aujourd'hui et exécute **tous** les jobs
  toutes les 15 minutes. Sans correctif, réanimer l'ordonnanceur déclencherait 96 clôtures Z par jour.
- Enregistrer `GrandTotalScheduler` (art. 88 CGI), `DLCExpiryJob`, `QuoteReminderJob`,
  `IotOfflineMonitorJob`, `DailyBackupJob` — présents dans `src/lib/cron/` et absents de `jobs[]`.
- Ajouter `ZCatchupJob` : détecte les journées de service sans clôture Z et ouvre un suspens
  `domain: 'fiscal'` au lieu d'attendre que le gérant s'en aperçoive à J+15.

Corrige **F10**, **F23**.

---

## 7. Matrice de décision opérationnelle

Livrable n°2 du cahier des charges. Pour chaque anomalie de retard : état avant, action de
régularisation, impact système, acteur habilité.

### 7.1 Pilier 1 — Stocks & explosion BOM rétroactive

| # | Anomalie | État avant (aujourd'hui) | État cible | Action de régularisation | Impact système | Acteur habilité |
|---|---|---|---|---|---|---|
| S1 | Plat vendu, **article de stock inexistant** | `return` silencieux (`StockDeductionHandler:121`) | Suspens `NO_STOCK_ITEM`, vente encaissée | À la création de l'article : proposition de rattrapage borné aux ventes postérieures à sa date de genèse | `stockMovements` `BACKFILL_RECIPE` + solde du suspens | `chef_cuisinier` (45), `manager` (70) |
| S2 | Plat vendu, **fiche technique absente** | `return` silencieux (`:79`) | Suspens `NO_RECIPE` agrégé par produit | À la création de la recette : `BackfillPlan RECIPE_RETRO_DEDUCTION`, simulation obligatoire, application explicite | N mouvements datés à `occurredAt` de chaque vente + recalcul food cost | `chef_cuisinier`, `manager` |
| S3 | Plat vendu, **produit absent du catalogue** | `return` silencieux (`:72`) | Suspens `NO_PRODUCT` | Création du produit → rattachement du suspens → cascade S1/S2 | idem + alerte carte incomplète | `manager`, `directeur` |
| S4 | **Premier inventaire physique à J+5**, aucun stock initial | `update` brut de `quantity`, écart non tracé, non valorisé (`PhysicalInventoryHandler:21`) | Comptage transactionnel ; avant `genesisDate` la quantité est **indéterminée**, pas zéro | Le comptage **pose la vérité** : mouvement `INVENTORY_ADJUSTMENT` daté, `knownSince = businessDay`. Écart non valorisé (aucun coût antérieur connu) — mention explicite dans l'UI | Fixe la base de tous les calculs ultérieurs. Pose un **point de comptage** que le `BackfillEngine` ne franchira pas | `chef_cuisinier`, `manager` |
| S5 | **Inventaire physique en régime établi**, écart constaté | idem — pas de mouvement, pas de valorisation | Écart = mouvement signé + valorisation aux couches de coût consommées | Mouvement `INVENTORY_ADJUSTMENT` + OD de démarque (compte 6037) si le montant dépasse le seuil du tenant | comptage : `chef_cuisinier` · OD : `comptable` (60) |
| S6 | **Recette créée après 300 ventes** | Aucun rattrapage possible (rien n'a été enregistré) | Le suspens agrégé porte les 300 ventes datées | Simulation : « 300 ventes du 12/08 au 20/08 · 14,2 kg de farine · stock projeté −3,1 kg le 18/08 ». Application segmentée aux bornes de comptage | Mouvements datés + food cost recalculé + suspens soldés | `chef_cuisinier` (≤30 j) · `directeur` (>30 j) |
| S7 | **Stock négatif artificiel** après rattrapage | N/A (pas de rattrapage) | Détecté **en simulation**, jamais découvert en production | 4 politiques explicites : `SKIP` avant comptage (défaut), `CLAMP_AT_ZERO`, `ALLOW_NEGATIVE` (visible), `CREATE_ADJUSTMENT` (écart de démarque assumé) | Aucune application sans choix conscient | `manager` |
| S8 | **Perte / casse déclarée en retard** | `WasteStockReconciliationHandler` déduit à la date du jour | Déduction à `occurredAt` déclaré, borné par le RBAC | Mouvement `WASTE` daté ; si journée close → suspens + OD | `chef_cuisinier` (≤7 j) · `manager` (≤30 j) |

### 7.2 Pilier 2 — NF525 & régularisation comptable

| # | Anomalie | État avant | État cible | Action de régularisation | Impact système | Acteur |
|---|---|---|---|---|---|---|
| C1 | **Ticket hors-ligne rejoué à J+3** | Crédite le Z d'aujourd'hui (`TicketZHandler:48`) | Crédite le Z de sa journée de service d'origine | `LateArrivalRouter` → `LATE_OPEN` si le Z n'est pas clos | Z historique correct, aucune écriture supplémentaire | automatique |
| C2 | **Ticket arrivé après clôture Z** | Silencieusement ignoré (`:63`) | Z rectificatif | `Z_{date}_R1` scellé, chaîné après le Z initial, portant le seul complément. Le Z initial reste intact | Deux pièces au lieu d'une, cumul exact, chaîne intacte | automatique jusqu'au seuil du tenant, sinon validation `manager` |
| C3 | **Ticket hors-ligne jamais scellé** | Brouillon avec hash factice, chaîne trouée (**F4**) | Re-scellement chronologique au retour en ligne | `OfflineResealService` (§ 6.3) + `offlineSealMap` immuable | Chaîne NF525 complète, correspondance provisoire→définitif traçable | automatique · audit `directeur` |
| C4 | **Erreur de moyen de paiement constatée à J+7** | Aucun chemin (aucune UI, `journalEntries` immuable) | Extourne + réimputation | 2 écritures scellées datées du jour, `reversesEntryId` renseigné, motif obligatoire | Grand Total inchangé rétroactivement ; ventilation corrigée à partir du jour de correction | `comptable` (60) · **jamais** `chef_cuisinier` |
| C5 | **Erreur de ventilation TVA à J+7** | idem | idem C4, ligne à ligne | Extourne + réimputation par taux | Déclaration de TVA du mois corrigée si le mois est ouvert ; sinon OD sur le mois courant avec renvoi | `comptable` |
| C6 | **15 jours de Z non clôturés** | `ZReportAutoJob` mort (**F10**) ; découverte fortuite | Détection + alerte dès J+2 ; clôture en lot | `ZCatchupJob` ouvre un suspens par journée · écran de clôture différée en lot, une transaction par journée, **ordre chronologique strict** | 15 écritures `Z_{date}` scellées et chaînées dans l'ordre des journées | `manager` (action `seal_zday` déjà déclarée) |
| C7 | **Compilation d'un mois non consulté** | Recalcul intégral à la demande | Agrégat incrémental persistant + Z scellés | Le Z de chaque journée est une écriture scellée : la compilation mensuelle est une **somme de 30 documents**, pas un balayage de tickets | Instantané et mathématiquement exact par construction | lecture : `comptable` |
| C8 | **Écriture visant une période verrouillée** | `assertPeriodNotLocked` à 0 appelant (**F15**) | Refus systématique + chemin de sortie | Suspens `PERIOD_LOCKED` → OD de régularisation datée du jour, référençant la pièce d'origine | Aucune écriture dans une période close, jamais | `comptable` |
| C9 | **Remboursement à J+7** | Handler cherche l'écriture par `orderId` → échoue (**F12**) | Recherche indexée sur `referenceId` | Avoir scellé chaîné + extourne | Chaîne intacte | `manager` (avoir) · `comptable` (extourne) |
| C10 | **Facture fournisseur non lettrable** | `update` sur `fiscalLedger` immuable → refus (**F11**) | Le lettrage n'écrit plus dans une collection immuable : collection `reconciliations` dédiée, l'entrée AP la référence | Écriture nouvelle, jamais mutation | Lettrage possible, WORM préservé | `comptable` |

### 7.3 Pilier 3 — Files, événements, burst

| # | Anomalie | État avant | État cible | Action | Impact | Acteur |
|---|---|---|---|---|---|---|
| Q1 | **600 tickets à la reconnexion** | Dépilage brut, 600 opérations en série, DLQ saturable | `BurstGovernor` : tri par tier + `occurredAt`, lots de 25, 4 en parallèle, disjoncteur 30 % | Traitement ~6 s, UI fluide, encaissement jamais bloqué | Session de burst observable, rapport de clôture | automatique · supervision `manager` |
| Q2 | **Rejeu = double effet** | 174/187 abonnements non idempotents (**F6**) | Idempotence par défaut + réservation transactionnelle | Aucune action utilisateur | Rejeu sûr par construction | — |
| Q3 | **DLQ inondée** | 1 ligne par échec (**F13**) — 600 tickets × 9 abonnés = jusqu'à 5 400 lignes | 1 ligne par `eventId×handlerId`, compteur `occurrences` | Rejeu en lot par cause après correction | 600 échecs de même cause = 1 ligne | `mcc_support` · lecture tenant |
| Q4 | **File détruite par la navigation** | `db.clearAll()` à chaque route (**F5**) | `clearAll` ne touche plus aux files + `taskContext` stabilisé + garde | — | Plus aucune perte de ticket | — |
| Q5 | **DLQ navigateur invisible du tenant** | Deux DLQ cloisonnées (**F14**) | Réplication vers la DLQ serveur, une seule vue | Le quarantaine ouvre un suspens tenant | Le retard est visible par celui qui doit le traiter | `manager` |
| Q6 | **Message empoisonné en boucle** | `SyncManager` rejoue sans plafond (**F22**) | Quarantaine après N tentatives, tier `FISCAL` alerte au lieu d'abandonner | Suspens + alerte | Plus de boucle chaude | `mcc_support` |

### 7.4 Pilier 4 — RBAC des actions rétroactives

Voir la matrice complète § 10. Points de décision structurants :

| # | Question | Réponse retenue | Motif |
|---|---|---|---|
| R1 | Un seuil de niveau suffit-il ? | **Non** — matrice de capacités | `chef_cuisinier` (45) doit inventorier, `comptable` (60) non ; l'inverse pour les OD. Pouvoirs orthogonaux, pas hiérarchiques |
| R2 | Le serveur (40) peut-il corriger le passé ? | **Non**, jamais — borne dure à son service courant | Art. 286-I-3° bis + risque de fraude interne |
| R3 | Le rattrapage doit-il pouvoir remonter indéfiniment ? | **Non** — `maxRetroDays` par rôle et par action | Un rattrapage à 6 mois n'est plus une correction, c'est une réécriture |
| R4 | La délégation par PIN suffit-elle ? | **Oui** pour l'opérationnel (`ActionGuard requiresPin`, déjà implémenté), **non** pour le fiscal | Le PIN ne trace pas d'intention motivée |
| R5 | Faut-il un motif obligatoire ? | **Oui** sur toute action rétroactive touchant la compta | Le journal d'audit sans motif n'est pas opposable |

### 7.5 Pilier 5 — RH & achats

| # | Anomalie | État avant | État cible | Action | Impact | Acteur |
|---|---|---|---|---|---|---|
| H1 | **Sortie de badgeuse oubliée** | Aucune détection ; le shift reste ouvert indéfiniment | `TimeclockReconciler` détecte à la clôture Z et ouvre un suspens `MISSING_CLOCK_OUT` | Saisie corrective **à côté** du log brut, jamais dessus | Le log brut reste intact (opposabilité prud'homale) ; les heures payées sont recalculées | `manager` (70) |
| H2 | **Semaine entière pointée le vendredi** | Insertion directe, aucun contrôle | Saisie a posteriori marquée `source: 'manual_retro'`, motif + auteur + date réelle | `hr.timeclock_corrected` → recalcul heures sup / coupures IDCC 1979 / repos | Bulletins et masse salariale recalculés pour les journées touchées | `manager` |
| H3 | **Heures sup / coupures recalculées** | `analyzeDailyLaborCost(tenantId, 0)` — CA figé à 0 (**F24**) | Recalcul sur la journée de service, CA réel injecté | Recalcul déclenché par `hr.timeclock_corrected`, borné aux journées touchées | Ratio masse salariale / CA exact | automatique |
| H4 | **Log brut vs heures payées** | Confusion : une seule donnée | **Deux couches distinctes** : `timeclock` (brut, append-only, jamais modifié) et `workedHours` (calculé, versionné, motivé) | Toute correction ajoute une version, ne remplace rien | Conformité prud'homale préservée | `manager` |
| P1 | **Facture d'achat à J+15** | `recordedAt: Date.now()`, coût écrasé globalement (**F17**) | Confirmation de couche de coût datée de la **réception** | `finance.cost_layer_confirmed` + `BackfillPlan COST_REALLOCATION` | Food cost des journées concernées recalculé ; OD si période verrouillée | `comptable` (écriture) · `manager` (validation de l'écart) |
| P2 | **Marchandise reçue sans facture** | Aucun suivi | Couche `PROVISIONAL` + suspens `RECEPTION_WITHOUT_INVOICE` | Relance fournisseur, écriture de charge à payer si clôture mensuelle | Résultat mensuel non faussé | `comptable` |
| P3 | **Facture sans réception** | Rapprochement PO par montant ±5 %, premier trouvé | Rapprochement pondéré : fournisseur + montant + **proximité de date** + lignes | Suspens `INVOICE_WITHOUT_RECEPTION` si aucun candidat sûr | Plus de faux rapprochements | `comptable` |
| P4 | **Écart PO ↔ facture** | `procurement.mismatch_detected` émis, non tracé | Suspens `PO_AMOUNT_MISMATCH` + écran de résolution | Acceptation (avenant) ou litige (avoir attendu) | Traçable, chiffré | `manager` |

---

## 8. Câblage bout-en-bout (Loi 8)

Une fonctionnalité écrite n'est pas une fonctionnalité livrée. Pour chaque brique, les quatre points
de la Gate 6 doivent être vrais : **rendu · réglage lu · libellés présents · handlers invoqués**.

### 8.1 Tableau de câblage

| Brique | Événements | Handler / Service | Collections | Route API | Écran | Clés i18n | RBAC | Test |
|---|---|---|---|---|---|---|---|---|
| `BusinessClock` | — (traverse tout) | `kernel/time` | `tenantConfig.timezone`, `.cutoverHour` | — | `settings` → onglet Établissement | `settings.serviceDay.*` | `admin` | `business-clock.test.ts` |
| `SuspenseRegistry` | `suspense.recorded`, `suspense.resolved`, `suspense.waived` | `SuspenseRegistry` + `SuspenseProjectionHandler` | `suspense`, `suspenseGroups` | `GET/POST /api/tenant/suspense` | `/regularisation` | `regul.suspense.*` | lecture ≥45, action selon § 10 | `suspense-registry.test.ts` |
| `LedgeredStock` | `inventory.movement_recorded` | `StockDeductionHandler` réécrit, `StockMovementProjector` | `stockMovements`, `stockItems` | — | `/inventory` → onglet Mouvements | `inventory.movements.*` | lecture ≥35 | `stock-ledger.test.ts` |
| `BackfillEngine` | `backfill.planned`, `.simulated`, `.applied`, `.rejected` | `BackfillEngine` + `BackfillApplyHandler` | `backfillPlans` | `POST /api/tenant/backfill/{plan,simulate,apply}` | `BackfillPreviewModal` | `regul.backfill.*` | § 10 | `backfill-engine.test.ts` |
| `LateArrivalRouter` | — (appelé) | `LateArrivalRouter` | `fiscalPeriodLocks`, `ticketZ` | — | bandeau `LateArrivalBanner` | `regul.late.*` | — | `late-arrival-router.test.ts` |
| `RegularizationEngine` | `finance.regularization_posted` | `RegularizationEngine` | `journalEntries`, `fiscalSeals`, `regularizationJournal` | `POST /api/tenant/finance/regularization` | `/finance` → onglet Régularisations | `finance.regul.*` | `comptable` | `regularization-nf525.test.ts` |
| `OfflineResealService` | `fiscal.offline_batch_resealed` | `OfflineResealService` | `journalEntries`, `fiscalSeals`, `offlineSealMap` | — | `OfflineBurstMonitor` | `regul.offline.*` | lecture `manager` | `offline-reseal.test.ts` |
| `CostLayerLedger` | `finance.cost_layer_confirmed` | `CostLayerLedger` + `FoodCostRecomputer` réécrit | `costLayers` | — | `/suppliers` → onglet Écarts de coût | `finance.costlayer.*` | `comptable` | `cost-layer.test.ts` |
| `BurstGovernor` | `system.burst_started`, `.progress`, `.completed` | `BurstGovernor` | `burstSessions` | — | `OfflineBurstMonitor` | `regul.burst.*` | lecture `manager` | `burst-governor.test.ts` |
| `TimeclockReconciler` | `hr.timeclock_gap_detected`, `hr.timeclock_corrected` | `TimeclockReconciler` | `timeclock` (brut), `workedHours` (calculé) | `POST /api/tenant/hr/timeclock/correct` | `/timeclock` → onglet Anomalies | `hr.timeclock.gap.*` | `manager` | `timeclock-reconciler.test.ts` |
| `ZCatchupJob` | `finance.z_report_requested` | `ZCatchupJob` (cron) | `ticketZ`, `suspense` | — | `DeferredZClosurePanel` | `finance.zcatchup.*` | `manager` | `z-catchup.test.ts` |

### 8.2 Nouvelles collections et leur régime

| Collection | Régime | `SIGNED_WRITE` | `IMMUTABLE` | Purge |
|---|---|---|---|---|
| `stockMovements` | append-only | oui | non (correction = mouvement inverse) | jamais |
| `suspense` | mutable sur `status`/`resolution` uniquement | oui | non | archivage après 24 mois |
| `suspenseGroups` | projection recalculable | non | non | reconstructible |
| `backfillPlans` | mutable jusqu'à `applied`, figé ensuite | oui | non | archivage 24 mois |
| `costLayers` | append-only, `quantityRemaining` mutable | oui | non | jamais |
| `regularizationJournal` | append-only | oui | **oui** | jamais |
| `offlineSealMap` | append-only | oui | **oui** | jamais |
| `workedHours` | versionné (append d'une version) | oui | non | jamais |
| `burstSessions` | mutable pendant la session | non | non | 90 jours |

> `timeclock` (log brut de badgeuse) doit **rejoindre `IMMUTABLE_COLLECTIONS`**. C'est la pièce
> opposable en cas de litige prud'homal : elle ne doit jamais pouvoir être modifiée, y compris par
> le gérant. Les corrections vivent dans `workedHours`.

---

## 9. Composants UI — conception détaillée

### 9.0 Doctrine d'interface

Cinq règles qui gouvernent tous les écrans de ce chantier.

1. **Le retard n'interrompt jamais le service.** Aucune modale bloquante en salle, aucun écran de
   rattrapage sur le chemin de l'encaissement. Le rattrapage se fait quand le restaurateur le décide,
   pas quand le système le découvre.
2. **Un seul endroit pour tout le retard.** Un restaurateur ne va pas chercher ses oublis dans sept
   écrans. `/regularisation` est le point d'entrée unique ; les écrans métier n'affichent qu'un
   **rappel contextuel** qui y renvoie.
3. **Jamais d'application sans simulation.** Toute action rétroactive affiche l'avant/après chiffré
   avant de s'exécuter. Le bouton d'application est désactivé tant que la simulation n'a pas tourné.
4. **Le motif est une donnée, pas un commentaire.** Champ obligatoire, typé (liste + texte libre),
   stocké dans le journal d'audit, exporté avec le FEC.
5. **Vocabulaire métier strict** (Loi 11). On dit « Régularisation », « Rattrapage », « Écart
   d'inventaire », « Écriture d'extourne », « Journée de service ». Jamais de jargon technique
   (« backfill », « suspens » reste acceptable car c'est un terme comptable réel), jamais de lore.

Toutes les chaînes passent par `t()` (`useLanguage`) et les libellés métier par `useLexicon`
(12 verticales : « couvert » chez un restaurant, « client » chez un coiffeur). **Interdit de traduire**
les libellés réglementaires : « Ticket Z », « NF525 », « FEC », « OD », « Extourne », « TVA ».

### 9.1 `RegularizationCenter` — `/regularisation`

Le hub. Un `PageShell` avec cinq onglets alimentés par la projection `suspenseGroups`.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Exploitation / Régularisation                              [Journal] [?]   │
│ CENTRE DE RÉGULARISATION                                    ⬤ 62 en attente  │
│ Les oublis, les retards et les corrections du passé, au même endroit.        │
├──────────────────────────────────────────────────────────────────────────────┤
│ [ Stocks 47 ] [ Caisse 3 ] [ Comptabilité 2 ] [ Personnel 8 ] [ Achats 2 ]   │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────┬──────────┬──────────┬──────────┐                                │
│ │ 47       │ 3        │ 14,2 kg  │ 18 j     │   ← StatGrid / StatCard        │
│ │ suspens  │ journées │ matière  │ retard   │                                │
│ │ stock    │ sans Z   │ à imputer│ le + anc.│                                │
│ └──────────┴──────────┴──────────┴──────────┘                                │
│                                                                              │
│ [Filtres: Période ▾] [Motif ▾] [Montant ▾]        [Tout sélectionner] (12)   │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ☐ Risotto aux cèpes                        Fiche technique manquante    │ │
│ │   312 ventes · 12/08 → 02/09 · 21 jours de retard                       │ │
│ │   Aucune matière déduite depuis l'ouverture.        [ Rattraper → ]      │ │
│ ├──────────────────────────────────────────────────────────────────────────┤ │
│ │ ☐ Burrata di Puglia                        Article de stock inexistant  │ │
│ │   88 ventes · 20/08 → 02/09 · 13 jours                                  │ │
│ │   ⚠ 1 inventaire physique le 25/08 dans la période.  [ Rattraper → ]     │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                        [ Rattraper la sélection (12) ]       │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Décisions de conception.**

- **Regroupement par sujet, pas par événement.** 312 ventes sans recette = **une** ligne, pas 312.
  Le détail est accessible mais replié. C'est la différence entre un écran utilisable et un journal
  système illisible.
- **L'âge est la métrique dominante**, affichée en jours, pas en date. « 21 jours de retard » est
  actionnable ; « depuis le 12/08 » demande un calcul mental.
- **L'avertissement de point de comptage est visible dès la liste** (⚠ inventaire dans la période) :
  c'est l'information qui change la nature du rattrapage, elle ne doit pas être découverte dans la
  modale.
- **Sélection multiple + action groupée** : un restaurateur qui rentre 20 fiches techniques le
  dimanche soir doit pouvoir tout rattraper en une passe, avec **une seule** simulation consolidée.
- **Onglets = domaines**, pas = types techniques. Un restaurateur pense « mes stocks », « ma caisse »,
  « mon personnel ».

**Primitives** : `PageShell` (`kicker`/`title`/`subtitle`/`tabs`/`actions`/`badge`), `PageShellTab`,
`StatGrid` + `StatCard`, `FilterBar`, `DataView`, `Chip`, `Badge`, `EmptyState`, `SkeletonList`.

**États.**

| État | Rendu |
|---|---|
| Chargement | `SkeletonList` 5 lignes, `StatCard` en `Skeleton` |
| Vide (aucun suspens) | `EmptyState` — « Tout est à jour. Aucune régularisation en attente. » + illustration sobre + lien vers le Journal |
| Vide (onglet seul) | `EmptyState` local, les autres onglets gardent leur compteur |
| Erreur de chargement | `Feedback` tonalité `critical` + bouton Réessayer, jamais d'écran blanc |
| Sans droit | `AccessDenied` avec CTA « Demander à un responsable » (motif pré-rempli) |

**Responsive.** En dessous de 768 px : les `StatCard` passent en bandeau horizontal scrollable, les
onglets deviennent un `Combobox`, chaque suspens devient une carte pleine largeur, et l'action
groupée se loge dans une barre collée en bas (`ActionBar`) au-dessus de `MobileNavBar`.
`BackfillPreviewModal` devient un `BottomSheet` plein écran.

### 9.2 `PendingRegularizationBadge` — la conscience permanente du retard

Dans `Header.tsx`, à côté des notifications. C'est le composant le plus important de tout le
chantier : **sans lui, aucun des autres n'est jamais ouvert.**

```
   ⏱ 62        ← pastille ambre si 1..N, rouge si un suspens dépasse le seuil critique
```

- Compteur alimenté par un atome Jotai `pendingSuspenseCountAtom` (projection `suspenseGroups`,
  pas de comptage à la volée).
- **Trois tonalités** : neutre (0, badge masqué), `warning` (retard < seuil), `critical`
  (journée sans Z depuis > 2 jours, ou suspens fiscal, ou burst en échec).
- Clic → `/regularisation`. Survol → `Popover` avec les 3 sujets les plus anciens.
- **Ne s'affiche pas sur `/pos`, `/kds`, `/bar`** : en service, on ne montre pas le passé.
  C'est une règle d'ergonomie, pas une optimisation.

### 9.3 `BackfillPreviewModal` — la simulation avant l'application

Le composant de sécurité central. Aucun rattrapage ne s'applique sans passer par lui.

```
┌───────────────────────────────────────────────────────────────────────┐
│  Rattrapage de matière — Risotto aux cèpes                       [×]  │
├───────────────────────────────────────────────────────────────────────┤
│  Période        12/08/2026 → 02/09/2026   (312 ventes)                │
│  Fiche          Risotto aux cèpes · 6 ingrédients                     │
│                                                                       │
│  ⚠ Un inventaire physique a été enregistré le 25/08/2026.             │
│     Le rattrapage s'arrêtera à cette date.                            │
│     ( ) Rattraper aussi avant le comptage — recalcule l'écart du 25/08│
│     (•) Ne rattraper qu'après le comptage  (recommandé)               │
│                                                                       │
│  ── Impact sur le stock ─────────────────────────────────────────────  │
│  Ingrédient          Avant      Déduction      Après      Alerte      │
│  Riz Carnaroli      18,4 kg     −14,2 kg      4,2 kg       —          │
│  Cèpes séchés        0,8 kg      −2,1 kg     −1,3 kg      ⚠ négatif   │
│  Parmesan 24 mois    6,0 kg      −3,4 kg      2,6 kg       —          │
│                                                                       │
│  Le stock de « Cèpes séchés » deviendrait négatif.                    │
│  (•) Arrêter à zéro et enregistrer un écart de démarque (recommandé)  │
│  ( ) Autoriser le stock négatif  ( ) Ne pas rattraper cet ingrédient  │
│                                                                       │
│  ── Impact financier ───────────────────────────────────────────────   │
│  Coût matière imputé              284,60 €                            │
│  Food cost recalculé   12/08→24/08   28,4 % → 31,7 %                  │
│  Périodes verrouillées touchées   août 2026 → OD de régularisation    │
│                                                                       │
│  Motif *  [ Fiche technique saisie a posteriori          ▾ ]          │
│           [ ................................................. ]        │
├───────────────────────────────────────────────────────────────────────┤
│                    [ Annuler ]   [ Simuler à nouveau ]  [ Appliquer ] │
└───────────────────────────────────────────────────────────────────────┘
```

**Décisions.**

- **Trois blocs, toujours dans cet ordre** : bornes temporelles → impact stock → impact financier.
  C'est l'ordre dans lequel un restaurateur décide.
- **Les choix de politique sont dans la modale**, en radio, avec un défaut recommandé explicite.
  On ne cache pas `onNegativeStock` dans un réglage : c'est une décision par cas.
- **`Appliquer` est désactivé** tant que la simulation n'a pas tourné avec les options courantes
  (changer une option invalide la simulation → le bouton repasse à « Simuler à nouveau »).
- **Motif obligatoire**, liste + libre. Écrit dans `regularizationJournal` et dans `empireAudit`.
- **Aucun montant sans son unité et sa devise.** Microunits → euros au rendu uniquement.
- Le tableau d'impact **scrolle horizontalement dans son conteneur** au-delà de 3 colonnes visibles ;
  le corps de page ne scrolle jamais horizontalement.

**Primitives** : `Modal` (desktop) / `BottomSheet` (mobile), `DataView`, `StatusBadge`, `Select`,
`Textarea`, `Feedback`, `Spinner`, `PageShellActionCTA` (tonalité `primary` / `danger`).

**A11y.** `role="dialog"` + `aria-modal`, focus piégé, `Échap` ferme, le premier élément focusé est
le titre. Les alertes de stock négatif sont `aria-live="polite"`. Les radios sont dans un `fieldset`
avec `legend`. Cible tactile ≥ 44×44 px.

### 9.4 `RecipeBackfillPrompt` — l'invitation au bon moment

Intégré à `/menu-builder`, il apparaît **au moment exact où la fiche technique est enregistrée** —
c'est le seul instant où le restaurateur a le contexte en tête.

```
┌──────────────────────────────────────────────────────────────────┐
│ ✓ Fiche technique enregistrée — Risotto aux cèpes                │
│                                                                  │
│ Ce plat a été vendu 312 fois depuis le 12/08 sans que sa         │
│ matière soit déduite du stock.                                   │
│                                                                  │
│ [ Rattraper maintenant ]   [ Plus tard ]   [ Ne pas rattraper ]  │
└──────────────────────────────────────────────────────────────────┘
```

- « Plus tard » laisse le suspens ouvert → il reste dans `/regularisation`. **Aucune perte.**
- « Ne pas rattraper » demande un motif et passe le suspens en `waived` — un état explicite,
  journalisé, réversible. Ce n'est pas une suppression.
- Le composant est un `Feedback` de tonalité `info`, jamais une modale : on n'interrompt pas la
  saisie des 20 fiches suivantes.

**Le même patron s'applique** à la création d'un article de stock (`/inventory`) et d'un produit
(`/menu-builder`) : `SuspenseResolutionPrompt`, un seul composant paramétré par `domain` + `reason`.

### 9.5 `InventoryReconciliationSheet` — l'inventaire physique

Refonte de la saisie d'inventaire dans `/inventory`.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Inventaire physique — 05/09/2026 · service du 05/09                      │
│ Compté par : Marc D. (Chef cuisinier)                    [Enregistrer]   │
├──────────────────────────────────────────────────────────────────────────┤
│ ⓘ Premier inventaire. Avant aujourd'hui, les quantités sont inconnues :  │
│   les écarts ne seront pas valorisés et aucune démarque ne sera passée.  │
├──────────────────────────────────────────────────────────────────────────┤
│ Article              Théorique     Compté      Écart      Valeur         │
│ Riz Carnaroli          18,4 kg   [ 17,9 ]    −0,5 kg     −1,85 €         │
│ Cèpes séchés            0,8 kg   [  0,0 ]    −0,8 kg    −22,40 € ⚠       │
│ Parmesan 24 mois        6,0 kg   [ ____ ]    non compté      —           │
├──────────────────────────────────────────────────────────────────────────┤
│ 47 articles · 32 comptés · 15 non comptés                                │
│ Écart total : −68,20 €   ( ) Passer l'OD de démarque   (•) Écart seul    │
└──────────────────────────────────────────────────────────────────────────┘
```

**Décisions.**

- **« Non compté » ≠ « zéro ».** Un champ vide laisse l'article intact ; seul un `0` saisi vaut
  comptage à zéro. C'est la source d'erreur n°1 des inventaires en restauration.
- Le **théorique est figé à l'ouverture de la feuille** (`countStartedAt`). Si une vente survient
  pendant le comptage, l'écriture est **transactionnelle** : le mouvement d'ajustement est calculé
  comme `compté − (théorique au moment de l'écriture)`, pas comme un `set` de quantité. Corrige **F18**.
- L'**OD de démarque est un choix séparé** : le chef compte (45), le comptable écrit (60). L'écran
  propose, l'écriture attend le rôle habilité. Si le chef coche la case, un suspens
  `domain: 'accounting'` est ouvert pour le comptable.
- Le bandeau de premier inventaire explique en une phrase pourquoi l'écart n'est pas valorisé.

**Primitives** : `SectionCard`, `DataView`, `Input` (numérique, `inputMode="decimal"`),
`QuantitySelector` sur mobile, `StatusBadge`, `Feedback`, `ActionBar` collante.

**Mobile.** L'inventaire se fait **en chambre froide, sur téléphone, avec des gants**. Une ligne =
une carte pleine largeur, champ de saisie ≥ 56 px de haut, clavier numérique, bouton « Suivant » qui
passe à l'article suivant sans replier le clavier, et un compteur de progression collant en haut.
`CameraCapture` (déjà présent) permet le scan d'un code-barres pour sauter à l'article.

### 9.6 `DeferredZClosurePanel` — 15 jours de Z en une passe

Dans `/finance`, onglet Caisse.

```
┌────────────────────────────────────────────────────────────────────┐
│ Clôtures Z en attente                                    3 jours   │
├────────────────────────────────────────────────────────────────────┤
│ ⚠ Les clôtures doivent être scellées dans l'ordre chronologique.   │
│                                                                    │
│ ☑ 31/08/2026   42 tickets    3 284,50 €   TVA 10 % : 298,59 €     │
│ ☑ 01/09/2026   38 tickets    2 910,00 €   TVA 10 % : 264,55 €     │
│ ☑ 02/09/2026   51 tickets    4 102,30 €   ⚠ 2 tickets hors-ligne  │
│                                            non encore re-scellés   │
├────────────────────────────────────────────────────────────────────┤
│ Total 3 journées · 131 tickets · 10 296,80 €                       │
│                              [ Clôturer les 3 journées ]           │
└────────────────────────────────────────────────────────────────────┘
```

- **L'ordre chronologique est imposé**, pas suggéré : décocher le 31/08 décoche automatiquement les
  suivantes, avec une explication. La chaîne de sceaux ne supporte pas les trous.
- Un avertissement bloquant si des tickets hors-ligne de la journée ne sont pas encore re-scellés :
  clôturer un Z incomplet est irréversible.
- Après clôture : `Feedback` succès avec les numéros de pièce attribués, et lien vers le journal.
- Le panneau **n'existe pas** quand tout est à jour (pas de carte vide qui occupe l'écran).

### 9.7 `TimeclockGapEditor` — les pointages oubliés

Dans `/timeclock`, onglet Anomalies.

```
┌───────────────────────────────────────────────────────────────────────┐
│ Anomalies de pointage                                   8 à traiter   │
├───────────────────────────────────────────────────────────────────────┤
│ Sophie L.   mardi 02/09    Entrée 18:02   Sortie —      ⚠ manquante   │
│   Badgeuse (brut, non modifiable) : 18:02:14 · terminal Cuisine       │
│   Sortie corrigée  [ 23:30 ]   Motif [ Oubli de badgeage      ▾ ]     │
│   → 5 h 28 · dont 0 h 28 en heures supplémentaires                    │
│                                          [ Enregistrer la correction ]│
├───────────────────────────────────────────────────────────────────────┤
│ Karim B.    mer. 03/09     Amplitude 13 h 10   ⚠ dépassement légal    │
│   Repos quotidien : 9 h 50 (minimum 11 h) — IDCC 1979                 │
│                                    [ Justifier ]  [ Voir le planning ]│
└───────────────────────────────────────────────────────────────────────┘
```

**Décisions.**

- **Le log brut est affiché, grisé, non éditable**, au-dessus du champ de correction. C'est ce qui
  rend la correction opposable : on voit ce qui a été badgé **et** ce qui a été corrigé.
- Le recalcul (heures sup, coupures, repos IDCC 1979) est affiché **avant** l'enregistrement.
- L'alerte réglementaire (repos quotidien, amplitude) est distincte de l'anomalie de saisie : deux
  natures, deux traitements.
- Toute correction porte `source: 'manual_retro'`, l'auteur, la date réelle de saisie et le motif.

### 9.8 `LateInvoiceImpactPanel` — la facture qui arrive après coup

Dans `/suppliers`, onglet Écarts de coût.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Facture Metro 2026-08-1847 · reçue le 03/09 · livrée le 19/08          │
│ ⏱ 15 jours d'écart                                                     │
├────────────────────────────────────────────────────────────────────────┤
│ Article            Prix provisoire   Prix facturé   Écart              │
│ Bar de ligne         28,00 €/kg       32,40 €/kg    +15,7 %            │
│ Cèpes séchés         84,00 €/kg       84,00 €/kg        —              │
│                                                                        │
│ Consommé sur la période : 12,4 kg de bar                               │
│ Coût matière sous-évalué : +54,56 €                                    │
│ Food cost 19/08 → 03/09 : 29,1 % → 30,4 %                              │
│                                                                        │
│ Août 2026 est verrouillé → OD de régularisation datée du 03/09         │
│ Motif *  [ Facture fournisseur reçue avec retard        ▾ ]            │
│                          [ Confirmer les coûts et passer l'OD ]        │
└────────────────────────────────────────────────────────────────────────┘
```

- Le panneau affiche **ce qui a déjà été consommé** au prix provisoire — c'est l'information qui
  justifie l'écriture.
- La mention du verrouillage de période et le basculement automatique vers une OD datée du jour
  sont explicites : le restaurateur ne découvre pas après coup que son mois d'août a bougé (il n'a
  pas bougé).

### 9.9 `OfflineBurstMonitor` — les 600 tickets qui remontent

Un `Toast` persistant pendant le rejeu, puis une carte dans `/regularisation` → onglet Caisse.

```
Pendant :
┌──────────────────────────────────────────────────┐
│ ⟳ Synchronisation — Caisse Terrasse              │
│ 412 / 600 tickets · 3 jours hors-ligne           │
│ ████████████████░░░░░░░  69 %      [ Détails ]   │
└──────────────────────────────────────────────────┘

Après :
┌──────────────────────────────────────────────────────────────┐
│ ✓ Caisse Terrasse — 600 tickets intégrés                     │
│   Période : 31/08 → 02/09 · scellés dans l'ordre             │
│   Numéros de pièce : 001284 → 001883                         │
│   ⚠ 3 tickets en échec — [ Voir les 3 ]                      │
│   → 3 clôtures Z désormais possibles  [ Clôturer ]           │
└──────────────────────────────────────────────────────────────┘
```

- **La progression est réelle**, alimentée par `system.burst_progress` émis par le `BurstGovernor` —
  pas une animation temporisée (contrairement aux `setTimeout` cosmétiques de l'écran de migration
  actuel, cf. § 3.7, à corriger au passage).
- Le rapport de fin est **actionnable** : il propose directement la clôture des Z devenus possibles.
- Les échecs mènent à la vue DLQ tenant, pas à un message d'erreur technique.

### 9.10 `RegularizationJournal` — la trace opposable

Onglet dédié, lecture seule, exportable.

| Date | Auteur | Rôle | Action | Portée | Montant | Motif | Pièces |
|---|---|---|---|---|---|---|---|
| 03/09 21:14 | Marc D. | Chef cuisinier | Rattrapage de matière | Risotto · 12/08→24/08 · 312 ventes | −284,60 € | Fiche saisie a posteriori | 6 mouvements |
| 03/09 21:20 | Claire T. | Comptable | OD de régularisation | Août 2026 | 284,60 € | Rattrapage période close | `OD_2026-09-03_004` |

- Colonnes **auteur + rôle + date réelle + motif** : c'est l'exigence de `AuditLogger.logAction` du
  cahier des charges, rendue consultable.
- Export CSV/PDF joint au FEC lors d'un contrôle.
- Filtres : période, auteur, domaine, montant. Aucun droit de modification, pour personne.

### 9.11 Rappels contextuels — le maillage discret

Bandeaux `Feedback` de tonalité `info`, une ligne, jamais bloquants, toujours avec un lien direct :

| Écran | Condition | Texte |
|---|---|---|
| `/inventory` | suspens stock > 0 | « 47 ventes n'ont pas été déduites du stock. » → Régulariser |
| `/menu-builder` | produits vendus sans recette | « 3 plats vendus n'ont pas de fiche technique. » → Voir |
| `/finance` | journées sans Z | « 3 journées ne sont pas clôturées. » → Clôturer |
| `/timeclock` | anomalies > 0 | « 8 pointages incomplets cette semaine. » → Corriger |
| `/suppliers` | couches provisoires anciennes | « 2 livraisons attendent leur facture depuis plus de 30 jours. » |
| `/pos`, `/kds`, `/bar` | — | **aucun bandeau, jamais** |

---

## 10. Cartographie des événements

### 10.1 Événements ajoutés

| Événement | Émetteur | Consommateurs | Priorité | Idempotence |
|---|---|---|---|---|
| `suspense.recorded` | `SuspenseRegistry` | `SuspenseProjectionHandler`, `NotificationThresholdHandler` | `BACKGROUND` | id déterministe |
| `suspense.resolved` | `SuspenseRegistry` | `SuspenseProjectionHandler`, `RegularizationJournalHandler` | `BACKGROUND` | idem |
| `suspense.waived` | `SuspenseRegistry` | idem + audit | `BACKGROUND` | idem |
| `backfill.planned` | `BackfillEngine` | `RegularizationJournalHandler` | `BACKGROUND` | `planId` |
| `backfill.applied` | `BackfillEngine` | `StockMovementProjector`, `FoodCostRecomputer`, `SuspenseRegistry`, `RegularizationJournalHandler` | `HIGH` | `planId` |
| `inventory.movement_recorded` | `LedgeredStock` | `StockProjectionHandler`, `StockAlertHandler`, `CostLayerLedger` | `HIGH` | `movementId` |
| `inventory.discrepancy_recorded` | `InventoryReconciler` | `AccountingSuspenseHandler`, `MenuEngineeringHandler` | `HIGH` | `inventoryId+itemId` |
| `finance.z_rectified` | `LateArrivalRouter` | `AccountingSyncHandler`, `MonthlyFECExportHandler` | `CRITICAL` | `Z_{date}_R{n}` |
| `finance.regularization_posted` | `RegularizationEngine` | `AccountingSyncHandler`, `RegularizationJournalHandler`, `MccFiscalAuditHandler` | `CRITICAL` | `entryId` |
| `finance.cost_layer_confirmed` | `CostLayerLedger` | `FoodCostRecomputer`, `MarginWarningHandler` | `HIGH` | `layerId+invoiceId` |
| `fiscal.offline_batch_resealed` | `OfflineResealService` | `TicketZHandler`, `SuspenseRegistry`, `MccFiscalAuditHandler` | `CRITICAL` | `batchId` |
| `hr.timeclock_gap_detected` | `TimeclockReconciler` | `SuspenseRegistry`, `NotificationUrgentDispatchHandler` | `HIGH` | `employeeId+businessDay` |
| `hr.timeclock_corrected` | `TimeclockReconciler` | `PayrollAutoCalcHandler`, `LaborCostAnalyzerHandler`, `OvertimeJournalHandler` | `HIGH` | `correctionId` |
| `system.burst_started` / `_progress` / `_completed` | `BurstGovernor` | `OfflineBurstMonitor` (UI), `MccHealthPingHandler` | `BACKGROUND` | `sessionId` |

### 10.2 Topologie et analyse anti-boucle (Loi 12)

Le risque de cascade est réel : le rattrapage produit des mouvements, qui produisent des alertes,
qui peuvent produire des suspens, qui peuvent produire des rattrapages.

```
                     ┌─────────────────────────────────────────┐
order.paid ──────────┤ StockDeductionHandler                   │
 (occurredAt)        │  ├─ référent présent → inventory.movement_recorded
                     │  └─ référent absent  → suspense.recorded │
                     └─────────────────────────────────────────┘
                                    │                    │
                    ┌───────────────┘                    └──────────────┐
                    ▼                                                   ▼
      StockProjectionHandler                              SuspenseProjectionHandler
      StockAlertHandler → stock.low / stock.zero          (projection seule, N'ÉMET RIEN)
      CostLayerLedger  → consomme des couches
                    │
                    ▼
      ⛔ stock.low NE DÉCLENCHE PAS de mouvement — feuille de cascade


recipe.created ──► RecipeBackfillPrompt (UI) ──► [décision humaine] ──► backfill.applied
                                                                              │
                       ┌──────────────────────────────────────────────────────┤
                       ▼                          ▼                           ▼
        inventory.movement_recorded    suspense.resolved         finance.cost_layer_* (si OD)
                       │                          │
                       ▼                          ▼
        (branche déjà parcourue ci-dessus)  ⛔ SuspenseProjectionHandler n'émet rien
```

**Trois règles structurelles qui garantissent l'absence de boucle :**

1. **`SuspenseRegistry` n'écoute aucun événement.** Il est appelé directement par les handlers.
   Il est **puits**, jamais source de cascade métier. `suspense.recorded` n'a que des consommateurs
   de projection et de notification, qui n'émettent rien de métier.
2. **`backfill.applied` n'est jamais émis par un handler.** Il est émis exclusivement par
   `BackfillEngine.apply()`, lui-même appelé exclusivement par une route API après action humaine
   authentifiée. **Il ne peut pas exister de rattrapage déclenché par un rattrapage.**
3. **Les mouvements produits par un rattrapage portent `sourceType: 'backfill'`.**
   `StockDeductionHandler` ignore par construction tout mouvement dont `sourceType === 'backfill'`.
   Barrière de type, vérifiée par un test dédié.

Profondeur maximale de cascade mesurable : **3** (`order.paid` → `inventory.movement_recorded` →
`stock.low` → notification, feuille). La limite du bus est 15 — marge confortable, et l'invariant
est testé (`cascade-depth.test.ts`, § 12).

### 10.3 Migration des payloads existants

`PayloadMigrator` (déjà présent) reçoit une règle générique `v1 → v2` :

```ts
// tout événement v1 sans occurredAt reçoit une estampille de repli, marquée
{ ...payload, v: 2,
  occurredAt: payload.occurredAt ?? payload.timestamp ?? new Date(payload._recordedAt ?? Date.now()).toISOString(),
  temporalFallback: payload.occurredAt ? undefined : true }
```

Le drapeau `temporalFallback` est **compté par une mesure permanente** (§ 13) : il doit décroître
vers 0 au fil de la migration des émetteurs, et un cliquet empêche sa remontée.

---

## 11. Dimensionnement du burst et de la DLQ

### 11.1 Le scénario de référence

Caisse de terrasse, 3 jours hors-ligne, 600 tickets, 4 lignes en moyenne, 5 ingrédients par ligne.

| Grandeur | Aujourd'hui | Cible |
|---|---|---|
| Opérations `syncQueue` à drainer | 600 | 600 |
| Écritures de journal à re-sceller | 600 (**jamais faites**) | 600, chronologiques |
| Événements `order.paid` rejoués | 600 | 600, tri par `occurredAt` |
| Handlers déclenchés (9 abonnés à `order.paid`) | 600 × 9 = 5 400 | idem, mais 4 en parallèle |
| Requêtes de déduction de stock | 600 × 4 × 5 × 4 = 48 000 | 600 × 4 × 5 × 1 = 12 000 (`set` déterministe, pas de re-lecture) |
| Lignes DLQ si panne réseau au milieu | jusqu'à 5 400 | ≤ 9 (un par handler), avec `occurrences` |
| Temps de traitement | non borné, séquentiel | ~6 s (25 × 4, respiration 50 ms) |
| Perte si navigation pendant le drainage | **totale** (`clearAll`) | nulle |

### 11.2 Budgets et seuils

| Paramètre | Valeur | Justification |
|---|---|---|
| `maxConcurrent` | 4 | Au-delà, la concurrence sur `runTransaction` du même document `ticketZ` provoque des retries |
| `batchSize` | 25 | ~1 s de travail, en dessous du seuil de perception d'un blocage d'UI |
| `yieldMs` | 50 | Laisse passer 3 frames à 60 fps |
| `failureRateThreshold` | 0,3 sur 50 | Au-delà, la cause est systémique : inutile d'inonder la DLQ |
| `cooldownMs` | 60 000 | Laisse le temps à une reprise réseau ou à un correctif |
| DLQ `MAX_ATTEMPTS` | 5 (inchangé) | Cohérent avec `DLQRetryService` existant |
| DLQ backoff | 2 s → 60 s (inchangé) | idem |
| `processedEvents` TTL | 90 j | Couvre le délai de rejeu maximal réaliste |
| Seuil d'alerte « Z manquant » | 2 journées | Au-delà, le rattrapage devient coûteux |
| Seuil d'alerte « suspens stock » | 20 ou 7 jours | Déclenche la tonalité `critical` du badge |

> Le commentaire de `backoffMs` dans `DLQRetryService` annonce « 3+ → quarantaine » alors que
> `MAX_ATTEMPTS = 5`. Dérive doc/code à corriger dans le même lot.

### 11.3 Ordre de traitement — la contrainte non négociable

Le rejeu fiscal doit être **strictement chronologique** : la chaîne de sceaux impose que le sceau
N+1 référence le hash du sceau N. Le `BurstGovernor` trie donc par `occurredAt` **avant** de
paralléliser, et le re-scellement (`OfflineResealService`) s'exécute **en série stricte**, sans
concurrence, avant le rejeu des événements métier :

```
1. SÉRIE   : OfflineResealService  — 600 sceaux chaînés, ordre chronologique, aucune concurrence
2. PARALLÈLE: BurstGovernor        — 600 order.paid, 4 en parallèle (stock, food cost, analytics)
3. SÉRIE   : ZCatchup              — 3 clôtures Z, ordre chronologique
```

Seule l'étape 2 est parallélisable, parce que les mouvements de stock portent des ids déterministes
et sont commutatifs. Les étapes 1 et 3 ne le sont pas.

---

## 12. RBAC des actions rétroactives

### 12.1 Le modèle : capacités, pas seuils

```ts
// src/kernel/contracts/retroActions.ts
export interface RetroActionPolicy {
  roles: readonly RbacRole[];        // liste explicite — jamais un minLevel
  maxRetroDays: number;              // borne dure ; Infinity interdit
  requiresReason: boolean;
  requiresPin: boolean;              // délégation ActionGuard (déjà implémentée)
  requiresSecondApproval?: RbacRole[];
  blockedIfPeriodLocked: boolean;    // true = refus ; false = bascule en OD
  auditSeverity: AuditSeverity;
}
export const RETRO_ACTIONS: Record<string, RetroActionPolicy> = { /* § 12.2 */ };
```

### 12.2 La matrice

| Action | Rôles habilités | `maxRetroDays` | Motif | PIN | 2ᵉ validation | Période verrouillée |
|---|---|---|---|---|---|---|
| `stock.backfill_recipe` | `chef_cuisinier`, `manager`, `directeur`, `admin` | 30 (chef) / 90 (directeur) | oui | non | non | bascule en OD |
| `stock.physical_inventory` | `chef_cuisinier`, `manager`, `directeur`, `admin` | 2 | oui si > J | non | non | bascule en OD |
| `stock.retro_waste` | `chef_cuisinier` (7 j), `manager` (30 j) | 7 / 30 | oui | non | non | bascule en OD |
| `stock.adjust` | `chef_cuisinier`, `manager`, `directeur`, `admin` | 0 (jour courant) | oui | non | non | — |
| `stock.waive_suspense` | `manager`, `directeur`, `admin` | — | **oui** | non | non | — |
| `finance.close_z_deferred` | `manager`, `directeur`, `admin` | 31 | oui si > 2 j | non | `directeur` si > 7 j | refus |
| `finance.post_reversal` (extourne) | `comptable`, `directeur`, `admin` | 365 | **oui** | non | `directeur` si > 10 000 € | bascule en OD |
| `finance.post_adjustment` (OD) | `comptable`, `directeur`, `admin` | 365 | **oui** | non | `directeur` si > 10 000 € | autorisé (c'est le chemin de sortie) |
| `finance.issue_credit_note` (avoir) | `manager`, `comptable`, `directeur`, `admin` | 90 | **oui** | oui | non | bascule en OD |
| `finance.lock_period` | `comptable`, `directeur`, `admin` | — | oui | non | `directeur` | — |
| `finance.confirm_cost_layer` | `comptable`, `manager`, `directeur`, `admin` | 180 | oui | non | non | bascule en OD |
| `hr.correct_timeclock` | `manager`, `directeur`, `admin` | 31 | **oui** | non | `directeur` si > 7 j | — |
| `hr.recompute_payroll` | `manager`, `directeur`, `admin` | 62 | oui | non | `directeur` | refus si paie exportée |
| `ops.replay_dlq_batch` | `admin` + `mcc_support` | — | oui | non | non | — |
| `migration.commit_airlock` | `admin`, `directeur` | — | **oui** | oui | non | — |

**Interdictions absolues, quel que soit le rôle :**

- Modifier ou supprimer une écriture de journal, un sceau, un Ticket Z clos, un log de badgeuse brut,
  une archive `legacyArchive`. Structurellement bloqué par `SovereignGuard`, et jamais contourné.
- Écrire dans une période fiscale verrouillée. La seule sortie est l'OD datée du jour.
- Pour tout rôle de niveau ≤ 50 (`serveur`, `barman`, `cuisinier`, `hotesse`, `plongeur`,
  `chef_rang`) : **aucune action rétroactive**, à l'exception de la délégation par PIN d'un
  responsable présent, qui trace le responsable comme auteur — jamais le porteur du compte.

### 12.3 Corrections du socle RBAC exigées par cette matrice

1. **Fermer le fail-open.** `useActionAccess` doit renvoyer `false` pour toute action préfixée
   `retro.` ou déclarée dans `RETRO_ACTIONS` et non explicitement autorisée. Le fail-open reste
   toléré pour les actions d'affichage existantes, pour ne pas régresser l'existant — mais un
   commentaire et un test le bornent.
2. **Câbler `actionOverrides.minLevel`** ou le supprimer. Un réglage lu et ignoré est une dette
   (Loi 8 point 2). Recommandation : le supprimer et le remplacer par `actionOverrides.roles`,
   cohérent avec le modèle par capacités.
3. **Créer `requireTenantAction(req, action)`** côté serveur, miroir de `requireMccLevel`. Toutes
   les routes de régularisation (§ 8.1) l'utilisent. Sans cela, l'UI est la seule barrière, ce qui
   n'en est pas une.
4. **Journaliser systématiquement** : chaque action rétroactive appelle `AuditLogger.logAction` avec
   auteur, rôle effectif (délégué par PIN le cas échéant), date réelle, motif, portée, montant.

---

## 13. Plan d'implémentation

Sept lots. Chaque lot est livrable, testé et mesurable indépendamment. Les lots 0 et 1 sont des
**prérequis durs** : rien d'autre n'a de sens tant qu'ils ne sont pas verts.

### Lot 0 — Arrêter l'hémorragie *(prérequis, ~1 j)*

| # | Tâche | Corrige |
|---|---|---|
| 0.1 | Retirer `syncQueue.clear()` de `db.clearAll()`, renommer en `clearReadCaches()` | F5 |
| 0.2 | Stabiliser `useTaskContext` (mémoïsation sur `taskId`) | F5 |
| 0.3 | Garde : `shutdownNexusSync` refuse de purger si des opérations sont en attente | F5 |
| 0.4 | `SyncManager` : `isSyncing` dans un `finally`, quarantaine après N tentatives | F22 |
| 0.5 | Corriger `RefundExtourneHandler` (recherche indexée sur `referenceId`) | F12 |
| 0.6 | Déplacer le lettrage hors de `fiscalLedger` (collection `reconciliations`) | F11 |

**Sortie** : test `offline-queue-survives-navigation.test.ts` vert. Aucun ticket ne peut plus être perdu.

### Lot 1 — Le temps métier *(prérequis, ~3 j)*

| # | Tâche |
|---|---|
| 1.1 | `BusinessClock` + `ServiceDayConfig` dans `TenantConfigSchema` (`timezone`, `cutoverHour`), **lus** |
| 1.2 | Ajouter `occurredAt` / `businessDay` aux 15 événements du noyau (`order.*`, `inventory.*`, `finance.*`, `hr.clock_*`) |
| 1.3 | Règle `PayloadMigrator` v1→v2 + drapeau `temporalFallback` |
| 1.4 | Réécrire `TicketZHandler` sur `payload.businessDay` (fin du `new Date()` et du bug UTC) |
| 1.5 | Réécrire `AccountingSyncHandler` et `WasteDailyAggregatorHandler` idem |
| 1.6 | Écran `settings` → réglage Journée de service (heure de bascule, fuseau) |
| 1.7 | `resolveEventId` unifié + `dlqKey` |

**Sortie** : `business-clock.test.ts`, `service-day-boundary.test.ts` (vente à 00h30 CEST → bon jour),
mesure `temporalFallback` instrumentée. **Corrige F1, F2, F16.**

### Lot 2 — Idempotence et burst *(~3 j)*

| # | Tâche |
|---|---|
| 2.1 | Idempotence **par défaut** (`options.idempotent ?? true`) |
| 2.2 | `IdempotencyGuard` transactionnel (`claim` / `commit` / `release`) + TTL 90 j |
| 2.3 | DLQ dédupliquée par `dlqKey`, compteur `occurrences` |
| 2.4 | `BurstGovernor` + `burstSessions` |
| 2.5 | Réplication DLQ navigateur → serveur ; vue unifiée |
| 2.6 | Supprimer `OutboxService` (mort) ; porter ses tiers de priorité dans `SyncManager` |

**Sortie** : `burst-600-tickets.test.ts` (rejeu de 600 événements → effets appliqués **une seule
fois**, ≤ 12 lignes DLQ, ordre chronologique respecté). **Corrige F6, F13, F14, F21.**

### Lot 3 — Le stock devient un journal *(~4 j)*

| # | Tâche |
|---|---|
| 3.1 | Collection `stockMovements` + `SIGNED_WRITE_COLLECTIONS` + ids déterministes |
| 3.2 | `SuspenseRegistry` + `suspense` + `suspenseGroups` |
| 3.3 | Réécrire `StockDeductionHandler` : mouvements + suspens à la place des 3 `return` |
| 3.4 | `StockProjectionHandler` : `stockItems.quantity` devient une projection ; `knownSince` |
| 3.5 | `PhysicalInventoryHandler` transactionnel, écart tracé, « non compté » ≠ 0 |
| 3.6 | Migration : dériver un mouvement `OPENING` par article existant à la date de genèse |

**Sortie** : `stock-ledger.test.ts`, `suspense-registry.test.ts`, `physical-inventory-race.test.ts`.
**Corrige F7, F8, F18.**

### Lot 4 — Le rattrapage *(~4 j)*

| # | Tâche |
|---|---|
| 4.1 | `BackfillEngine` : `plan` / `simulate` / `apply`, segmentation aux points de comptage |
| 4.2 | Routes `POST /api/tenant/backfill/{plan,simulate,apply}` + `requireTenantAction` |
| 4.3 | `RETRO_ACTIONS` + fermeture du fail-open + `requireTenantAction` |
| 4.4 | UI : `RegularizationCenter`, `BackfillPreviewModal`, `PendingRegularizationBadge` |
| 4.5 | UI : `SuspenseResolutionPrompt` (menu-builder, inventory) |
| 4.6 | `regularizationJournal` (immuable) + `RegularizationJournal` (écran) |

**Sortie** : `backfill-engine.test.ts` (dont non-franchissement du point de comptage),
`retro-rbac.test.ts`. **Corrige F9, F27, F28.**

### Lot 5 — La chaîne fiscale *(~4 j)*

| # | Tâche |
|---|---|
| 5.1 | `OfflineResealService` + `offlineSealMap` (immuable) |
| 5.2 | `LateArrivalRouter` + Z rectificatif `Z_{date}_R{n}` |
| 5.3 | Câbler `assertPeriodNotLocked` sur tous les chemins d'écriture comptable |
| 5.4 | `RegularizationEngine` (extourne / OD / avoir) + route + UI onglet Régularisations |
| 5.5 | Réanimer `CronScheduler` (côté serveur, `schedule` respecté) + `ZCatchupJob` + `GrandTotalScheduler` |
| 5.6 | UI : `DeferredZClosurePanel`, `OfflineBurstMonitor` |

**Sortie** : `offline-reseal.test.ts`, `z-rectification-nf525.test.ts`, `period-lock-enforced.test.ts`,
`grand-total-immutability.test.ts`. **Corrige F3, F4, F10, F15, F23.**

### Lot 6 — RH et achats *(~3 j)*

| # | Tâche |
|---|---|
| 6.1 | Séparer `timeclock` (brut, **immuable**) et `workedHours` (calculé, versionné) |
| 6.2 | `TimeclockReconciler` : détection de sortie manquante à la clôture Z, appariement |
| 6.3 | Recalcul heures sup / coupures / repos IDCC 1979 sur correction |
| 6.4 | Corriger `analyzeDailyLaborCost(tenantId, 0)` — injecter le CA réel de la journée |
| 6.5 | `CostLayerLedger` (FIFO/CUMP), réglage `costingMethod` **lu** |
| 6.6 | Réécrire `FoodCostRecomputer` : confirmer une couche, ne plus écraser le coût |
| 6.7 | Rapprochement PO ↔ facture pondéré (fournisseur + montant + date + lignes) |
| 6.8 | UI : `TimeclockGapEditor`, `LateInvoiceImpactPanel` |

**Sortie** : `timeclock-reconciler.test.ts`, `cost-layer-fifo.test.ts`, `late-invoice-impact.test.ts`.
**Corrige F17, F19, F24.**

### Lot 7 — Migration et ouverture *(~3 j)*

| # | Tâche |
|---|---|
| 7.1 | Import de fichier réel dans `AirlockMigrationPanel` (CSV/XLSX, mapping de colonnes, aperçu) |
| 7.2 | `genesisDate` choisie par le restaurateur ; `initiatedBy` = utilisateur courant |
| 7.3 | Supprimer les `setTimeout` cosmétiques ; progression réelle par étape |
| 7.4 | `dedup()` : passer de O(n²) à un index de blocage (clé date+montant) |
| 7.5 | Stock d'ouverture → mouvements `OPENING` + première couche de coût |
| 7.6 | Onboarding « jour 0 » : `genesisDate` = date d'ouverture ; `knownSince` posé |
| 7.7 | Garde : l'import n'émet **jamais** d'événement fiscal (`order.paid` interdit depuis `legacy`) |

**Sortie** : `airlock-import-real-file.test.ts`, `migration-no-fiscal-emission.test.ts`,
`opening-stock-cost-layer.test.ts`. **Corrige F20, F26.**

### Séquencement

```
Lot 0 ──► Lot 1 ──┬──► Lot 2 ──┬──► Lot 5 (fiscal)
                  │            │
                  └──► Lot 3 ──┴──► Lot 4 (rattrapage) ──► Lot 6 (RH/achats)
                                                            │
                                              Lot 7 (migration) ◄┘
```

Lots 2 et 3 sont parallélisables. Lot 4 dépend de 3. Lot 5 dépend de 1 et 2. Lot 6 dépend de 3 et 4.

---

## 14. Spécification des tests

Tous en Vitest, dans `src/__tests__/flexibilite/`. Les tests d'invariant sont branchés dans
`preflight.sh` comme cliquets. **Aucun seuil ne sera jamais relevé** (Loi 2).

### 14.1 Temps métier

| Test | Assertion |
|---|---|
| `service-day-boundary.test.ts` | Vente à `2026-09-02T00:30:00+02:00`, `cutoverHour: 5` → `businessDay === '2026-09-01'` |
| `service-day-utc-regression.test.ts` | Le même instant ne produit **jamais** `'2026-09-01'` par accident d'UTC : test explicite du fuseau |
| `occurred-vs-recorded.test.ts` | Un `order.paid` rejoué 3 jours après crédite le Z de `businessDay`, jamais celui du jour de rejeu |
| `temporal-fallback-ratchet.test.ts` | Le nombre d'événements sans `occurredAt` ne remonte pas |

### 14.2 Idempotence et burst

| Test | Assertion |
|---|---|
| `burst-600-tickets.test.ts` | 600 `order.paid` rejoués 2× → chaque `stockMovement` existe **une** fois ; `stockItems.quantity` identique après le 2ᵉ rejeu |
| `dlq-dedup.test.ts` | 600 échecs de même cause → 1 ligne DLQ, `occurrences === 600` |
| `burst-ordering.test.ts` | Les sceaux produits sont chaînés dans l'ordre croissant des `occurredAt`, pas de l'ordre d'arrivée |
| `circuit-breaker.test.ts` | Au-delà de 30 % d'échec sur 50, le rejeu s'arrête et émet une alerte |
| `offline-queue-survives-navigation.test.ts` | Une navigation pendant un drainage ne vide pas `syncQueue` |
| `cascade-depth.test.ts` | Aucune chaîne d'événements ne dépasse une profondeur de 5 |
| `backfill-not-reentrant.test.ts` | Un mouvement `sourceType: 'backfill'` ne redéclenche jamais `StockDeductionHandler` |

### 14.3 Stock et rattrapage

| Test | Assertion |
|---|---|
| `suspense-on-missing-recipe.test.ts` | Vente sans recette → 1 suspens `NO_RECIPE` ; **aucune** exception ; l'encaissement aboutit |
| `suspense-idempotent.test.ts` | Le même `order.paid` rejoué produit 1 suspens, pas 2 |
| `backfill-stops-at-count.test.ts` | Rattrapage sur 12/08→02/09 avec inventaire le 25/08 → aucun mouvement avant le 25/08 en politique `SKIP` |
| `backfill-negative-clamp.test.ts` | Politique `CLAMP_AT_ZERO` → quantité finale ≥ 0 **et** un écart de démarque est enregistré |
| `backfill-simulation-is-pure.test.ts` | `simulate()` n'écrit **aucun** document (mock d'adapter en lecture seule) |
| `physical-inventory-race.test.ts` | Une vente pendant le comptage n'est pas écrasée : le mouvement d'ajustement est relatif |
| `stock-projection-rebuild.test.ts` | Reconstruire `quantity` depuis `stockMovements` redonne exactement la valeur projetée |

### 14.4 NF525

| Test | Assertion |
|---|---|
| `offline-reseal.test.ts` | 600 brouillons `PENDING_OFFLINE_SEAL` → 600 sceaux chaînés, `previousHash` continu, numéros séquentiels dans l'ordre chronologique |
| `offline-reseal-idempotent.test.ts` | Rejouer le re-scellement ne crée pas de doublon |
| `z-rectification-nf525.test.ts` | Ticket après clôture → `Z_{date}_R1` scellé, `Z_{date}` **inchangé** (hash identique avant/après) |
| `sealed-entry-immutable.test.ts` | Toute tentative d'`update`/`delete` sur `journalEntries`, `fiscalSeals`, `offlineSealMap`, `regularizationJournal`, `timeclock` est refusée |
| `period-lock-enforced.test.ts` | Écriture visant un mois verrouillé → refus + suspens `PERIOD_LOCKED` |
| `reversal-preserves-grand-total.test.ts` | Après extourne, le Grand Total de la période d'origine est **inchangé** ; l'effet est sur le cumul du jour de l'extourne |
| `z-catchup-order.test.ts` | Clôturer 15 journées en lot produit 15 pièces dans l'ordre chronologique des journées |
| `grand-total-monthly.test.ts` | Le cumul mensuel est la somme des Z scellés, calculée sans balayage de tickets |

### 14.5 RH, achats, RBAC, migration

| Test | Assertion |
|---|---|
| `timeclock-raw-immutable.test.ts` | Une correction n'altère jamais la ligne `timeclock` d'origine |
| `timeclock-gap-detection.test.ts` | Entrée sans sortie → `hr.timeclock_gap_detected` à la clôture Z |
| `overtime-recompute-retro.test.ts` | Une correction à J+5 recalcule les heures sup de la journée d'origine, pas d'aujourd'hui |
| `cost-layer-fifo.test.ts` | Les sorties consomment les couches en FIFO ; une facture tardive confirme la bonne couche |
| `late-invoice-impact.test.ts` | Confirmation d'une couche à J+15 → food cost des journées concernées recalculé, aucun `update` de `lastCost` global |
| `retro-rbac.test.ts` | Un `serveur` ne peut déclencher **aucune** action de `RETRO_ACTIONS` ; un `chef_cuisinier` peut rattraper une recette mais pas passer une OD ; un `comptable` l'inverse |
| `retro-rbac-fail-closed.test.ts` | Une action `retro.*` non déclarée est **refusée**, pas autorisée |
| `retro-server-guard.test.ts` | Les routes de régularisation refusent un appel sans rôle habilité, indépendamment de l'UI |
| `migration-no-fiscal-emission.test.ts` | L'import legacy n'émet aucun événement de `FISCAL_CRITICAL_EVENTS` |
| `airlock-import-real-file.test.ts` | Un CSV de 1 000 lignes est parsé, dédupliqué et validé en < 2 s |

---

## 15. Nouvelles mesures permanentes

À ajouter dans `scripts/measure/measures.mjs`. Elles rendent la dette de flexibilité **visible dans
le temps** (`.measures/history.jsonl`) plutôt que redécouvrable à chaque audit.

| Mesure | Définition | Cible | Cliquet |
|---|---|---|---|
| `m-silent-skip` | `return` / `return null` immédiatement précédé d'un test de nullité sur un référent chargé depuis `Nexus.adapter.get`, dans `handlers/` et `modules/**/services/` | 0 dans les handlers du bus | oui |
| `m-wallclock-business-key` | `new Date()` / `Date.now()` dont le résultat alimente une clé `YYYY-MM-DD` ou un champ `date`/`businessDay` d'une écriture métier | 0 | oui |
| `m-events-without-time` | Événements du catalogue sans `occurredAt` | ↓ vers 0 | oui |
| `m-temporal-fallback` | Événements traités avec `temporalFallback: true` (runtime, remonté par télémétrie) | ↓ vers 0 | oui |
| `m-non-idempotent-handlers` | Abonnements `NexusEventBus.on` avec `idempotent: false` explicite | ≤ liste blanche | oui |
| `m-retro-actions-undeclared` | Actions `retro.*` référencées dans le JSX et absentes de `RETRO_ACTIONS` | 0 | oui |
| `m-suspense-age-p95` | Âge du 95ᵉ centile des suspens `pending` (runtime, par tenant) | < 7 j | non (informatif) |
| `m-immutable-writes` | Appels `adapter.update`/`delete` ciblant une collection de `IMMUTABLE_COLLECTIONS` (analyse statique) | 0 | oui |

> `m-immutable-writes` aurait détecté **F11** (`ReconciliationEngineHandler` écrivant dans
> `fiscalLedger`) sans aucune lecture humaine. C'est la mesure au meilleur rapport coût/valeur du lot.

---

## 16. Risques, arbitrages et questions ouvertes

### 16.1 Risques techniques

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| La migration de `stockItems.quantity` vers une projection casse les écrans existants | moyenne | fort | Double écriture pendant un lot : le scalaire reste maintenu, la projection est vérifiée en parallèle par `stock-projection-rebuild.test.ts` avant bascule |
| L'ajout de `occurredAt` sur 15 événements casse des tests existants | forte | faible | `PayloadMigrator` rend le champ optionnel à la lecture ; les tests existants passent inchangés |
| L'idempotence par défaut change le comportement de 174 abonnements | forte | moyen | Basculer par lot de domaine, avec une liste blanche `idempotent: false` explicite et documentée |
| Réanimer `CronScheduler` déclenche 96 clôtures Z/jour | **certaine** si fait naïvement | **critique** | Le respect du champ `schedule` est un **prérequis** de la tâche 5.5, pas une amélioration ultérieure |
| Le re-scellement de 600 tickets dépasse le temps d'une session navigateur | moyenne | fort | Reprise sur incident : le service est idempotent et repart du dernier `PENDING_OFFLINE_SEAL` |
| `stockMovements` grossit sans limite | certaine | faible | ~50 mouvements/service × 350 j = ~17 500 documents/an/tenant. Acceptable ; archivage annuel prévu |

### 16.2 Arbitrages assumés

1. **Le service passe avant l'exactitude immédiate.** Aucun contrôle de flexibilité ne bloque un
   encaissement. On enregistre l'anomalie, on ne l'empêche pas. C'est la seule doctrine compatible
   avec un coup de feu.
2. **`SKIP` est le défaut au franchissement d'un point de comptage.** Un rattrapage qui double la
   démarque est pire qu'un rattrapage incomplet et signalé.
3. **On ne supprime jamais, on ajoute et on référence.** Y compris pour les brouillons hors-ligne
   (`superseded`), les suspens abandonnés (`waived`) et les corrections de pointage (`workedHours`).
4. **Le rattrapage est toujours humain.** Aucun `backfill.applied` automatique. Le système propose,
   chiffre et trace ; il ne décide pas.
5. **`OutboxService` est supprimé, pas réparé.** Deux implémentations sur la même table Dexie, dont
   une morte, est une dette plus coûteuse que la fonctionnalité qu'elle promet. Ses tiers de priorité
   sont portés dans `SyncManager`, seul draineur réel.

### 16.3 Questions ouvertes — décisions produit

| # | Question | Options | Recommandation |
|---|---|---|---|
| Q1 | **Heure de bascule de la journée de service** — réglage par tenant ou constante ? | Réglage (05h00 par défaut) / Constante | **Réglage.** Une boulangerie ouvre à 05h00, un bar ferme à 04h00. Constante = faux pour la moitié des 12 verticales |
| Q2 | **`maxRetroDays` du chef de cuisine** — 30 j est-il le bon plafond ? | 7 / 30 / 90 | **30 j.** Couvre le cycle de saisie des fiches techniques d'une ouverture sans autoriser la réécriture d'un trimestre |
| Q3 | **Seuil de Z rectificatif automatique** | Toujours automatique / seuil en montant / toujours validé | **Seuil.** Automatique en dessous de 50 € (erreur de manipulation), validation `manager` au-delà |
| Q4 | **Méthode de valorisation par défaut** | FIFO / CUMP | **FIFO.** Plus lisible pour un restaurateur, et cohérent avec la gestion des DLC |
| Q5 | **Les suspens sont-ils visibles du comptable externe ?** | Oui / Non / Lecture seule | **Lecture seule.** Il doit voir ce qui n'est pas imputé sans pouvoir y toucher |
| Q6 | **Que faire des tickets hors-ligne d'un appareil jamais reconnecté ?** | Perte assumée / archive DGFiP / alerte | **Alerte à J+7** dans le Centre de régularisation + procédure de récupération manuelle documentée |
| Q7 | **Fenêtre de conservation des mouvements de stock** | 1 an / 3 ans / illimité | **3 ans glissants** en ligne, archive WORM au-delà — aligné sur la prescription fiscale |

### 16.4 Ce que ce plan ne traite pas

- La **résolution de conflits multi-appareils** hors-ligne (deux caisses modifiant la même table) —
  couverte par l'ADR-007, hors périmètre.
- La **paie exportée** : si un bulletin est déjà transmis à Silae, la correction de pointage devient
  un sujet de régularisation de paie, pas de flexibilité système. Le plan se borne à **refuser** le
  recalcul et à ouvrir un suspens.
- Le **contrôle DGFiP inopiné** : le mode inspection existe (`/api/tenant/compliance/inspection-mode`).
  L'interaction entre ce mode et un rattrapage en cours mérite un chantier dédié.

---

## 17. Ce que le restaurateur voit, au bout

Trois phrases, à comparer avec l'état actuel.

**Ouverture (Profil A).** « J'ai encaissé pendant cinq jours sans rien avoir saisi. Dimanche soir,
j'ai compté mon stock et rentré mes fiches. Le logiciel m'a montré ce qu'il avait mis de côté,
m'a dit ce que ça changeait, je l'ai validé, et mon food cost était juste lundi matin. »
*Aujourd'hui : le logiciel n'a rien mis de côté. Il n'y a rien à valider.*

**Migration (Profil B).** « J'ai chargé mon export Zelty, choisi ma date de reprise, et mon
historique est consultable sans polluer ma caisse. Ma première clôture Z est repartie de zéro,
proprement. » *Aujourd'hui : l'écran de migration charge cinq lignes de démonstration.*

**Exploitation (Profil C).** « J'ai vu le compteur passer à 62. J'ai ouvert, tout était trié :
trois Z à clôturer, huit pointages à corriger, une facture en écart. Une heure le dimanche soir,
et j'étais à jour. » *Aujourd'hui : aucun compteur, aucun tri, et les 600 tickets de la terrasse
ont disparu à la première navigation.*

---

*Fin du document. Cartographie et défauts mesurés le 2026-09-03 sur `main` — toute reprise ultérieure
doit rejouer les commandes du § 1 avant de citer un chiffre (Loi 7).*
