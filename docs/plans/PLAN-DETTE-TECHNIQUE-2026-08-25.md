# Plan de résorption de la dette technique — 5 chantiers

> Rédigé le **2026-08-25** · ground truth mesuré sur `main@b9a3198b3`
> Méthode : chaque chiffre de ce document provient d'une commande exécutée, pas d'une estimation.
> Suivi santé continu : `docs/HEALTH.md` (auto-généré post-commit)

---

## Tableau de bord des 5 chantiers

| # | Chantier | Priorité | Volume réel mesuré | Effort | Risque | Bloque un client ? |
|---|---|---|---|---|---|---|
| 1 | Migration microunits | P1 | **821** occurrences `*InCents` (≠ 496 annoncé) | Grande | Moyen | Non |
| 2 | Cycles sentrux | P1 | 2 signalés — **probables faux positifs** | Petit (investigation) | Faible | Non |
| 3 | Modules vides | P2 | 2 scaffolds × 14 fichiers `.gitkeep` | Petit (décision) | Faible | Non |
| 4 | i18n | P2 | **33/902** fichiers `.tsx` traduits (3,6 %) | Grande | Faible | Seulement si client non-FR |
| 5 | Barrel violations | P3 | 48 dont **~9 vraies** violations ADR-015 | Petit | Faible | Non |

**Verdict global :** aucun des 5 chantiers ne bloque un premier client francophone en restaurant.
Ils protègent la **maintenabilité à 6-12 mois**, pas la mise en production immédiate.

---

## CHANTIER 1 — Migration microunits (P1)

### 1.1 État réel mesuré

```
Total src/ : 821 occurrences de *InCents
```

**Répartition par pilier :**

| Pilier | Occurrences | Fichiers |
|---|---|---|
| finance | 270 | 49 |
| ops | 168 | 39 |
| commerce | 53 | 19 |
| logistics | 40 | 15 |
| intelligence | 32 | 11 |
| human | 20 | 5 |
| facility | 2 | 2 |
| compliance | 1 | 1 |

**Hors piliers :**

| Zone | Occurrences | Nature |
|---|---|---|
| `src/shared/` | 103 | Contrats runtime + eventBus + SovereignMath |
| `src/lib/` | 39 | Adapters, services |
| `src/app/` | 22 | Routes API + pages |
| `src/domain/` | **0** | ✅ Schémas Zod déjà 100 % microunits |
| `src/store/` | **0** | ✅ Propre |
| `src/verticals/` | **0** | ✅ Propre |

### 1.2 Découverte structurante — la dette est plus faible qu'elle n'en a l'air

Trois constats changent radicalement l'estimation d'effort :

**(a) `src/domain/schemas/` est déjà entièrement migré.**
La source de vérité Zod ne contient plus aucun `InCents`. La dette est **en aval** (interfaces runtime + consommateurs), pas dans le modèle de données.

**(b) La majorité des champs ont déjà leur jumeau `InMicrounits`.**
Le pattern « miroir de parité » est en place dans `src/shared/nexus/contracts/` :

| Champ legacy | Jumeau microunits présent |
|---|---|
| `amountInCents` | ✅ (12 déclarations) |
| `costInCents` | ✅ (5) |
| `priceInCents` | ✅ (3) |
| `creditInCents` / `debitInCents` | ✅ (2 chacun) |
| `balanceInCents` | ✅ (2) |
| `ebitdaInCents`, `netProfitInCents`, `laborCostInCents`… | ✅ (1-2) |

**Champs SANS jumeau — à créer avant migration :**
- `averageTicketInCents`
- `discountAmountInCents`
- `maxDiscountInCents`
- `minOrderAmountInCents`
- `revenueInCents`

**(c) Le contrat de dépréciation est déjà écrit et documenté.**
`src/shared/services/SovereignMath.ts:109-119` :

> `totalInMicrounits` is the source of truth. `totalInCents` is a deprecated [mirror].
> Value-preserving: a legacy order with `totalInCents = 1500` resolves to [1500 × 10 000].

Et `FinancialNexusBridge.ts:73` écrit `amountInCents: microToCents(totalTTCInMicrounits)` — la valeur en centimes est **dérivée**, jamais source.

**Conséquence :** la migration n'est pas une conversion de valeurs (risque élevé, données faussées).
C'est une **suppression de miroirs dépréciés** (risque faible, réversible).

### 1.3 Découpage en 6 lots

Ordre imposé par le sens des dépendances : contrats → piliers producteurs → piliers consommateurs → UI.

---

#### Lot 1 — Compléter les jumeaux manquants (préalable bloquant)

**Périmètre :** `src/shared/nexus/contracts/`

**Actions :**
1. Pour chacun des 5 champs sans jumeau, ajouter le champ `*InMicrounits` en optionnel.
2. Marquer le champ `*InCents` avec `/** @deprecated miroir legacy — utiliser *InMicrounits */`.
3. Ne rien supprimer à ce stade.

**Critère de sortie :** `npx tsc --noEmit` = 0 erreur. Aucun comportement modifié.
**Effort :** 1 session courte.

---

#### Lot 2 — `src/shared/` (103 occurrences)

**Périmètre :**
- `src/shared/nexus/contracts/*.ts` (finance, ops, commerce, hr, logistics, customer, marketing, franchise, domain, common, api)
- `src/shared/eventBus/events/finance.events.ts`
- `src/shared/eventBus/handlers/{RefundJournalHandler,CompJournalHandler}.ts`
- `src/shared/services/SovereignMath.ts`

**Actions :**
1. Basculer chaque **producteur** d'événement sur `*InMicrounits`.
2. Conserver le miroir `*InCents` en écriture (dérivé) pour ne pas casser les consommateurs.
3. `SovereignMath` : garder `toCents()` (nécessaire pour l'affichage et les exports FEC), supprimer les helpers de lecture legacy une fois les consommateurs migrés.

**Point de vigilance NF525 :** les événements durables (`emitDurable`) peuvent avoir des payloads persistés en Outbox/DLQ. **Ne jamais supprimer un champ d'un événement durable sans vérifier l'Outbox.** Migration additive uniquement sur ces payloads.

**Critère de sortie :** tsc 0, `npx vitest run` vert, `sentrux gate .` sans régression.
**Effort :** 1-2 sessions.

---

#### Lot 3 — Pilier `finance` (270 occurrences / 49 fichiers) — le plus gros

**Périmètre :** `src/modules/finance/{comptabilite,tresorerie,fiscalite}/`

**Sous-découpage recommandé (3 sessions) :**

| Sous-lot | Cible | Champs dominants |
|---|---|---|
| 3a | `comptabilite/` — journal, ledger, FEC | `debitInCents`, `creditInCents`, `amountInCents`, `runningBalanceInCents` |
| 3b | `tresorerie/` — banking, payout, collection, AP | `balanceInCents`, `totalAmountInCents`, `expectedAmountInCents` |
| 3c | `fiscalite/` + analytics | `totalRevenueInCents`, `netProfitInCents`, `totalAssets/Liabilities/EquityInCents` |

**⚠️ Contrainte NF525 absolue :**
`journalEntries`, `fiscalSeals`, `fiscalLedger` sont **immuables** — jamais de `delete`, jamais d'`update`.
- Les enregistrements **déjà scellés** conservent leur `amountInCents` historique. On ne les réécrit pas.
- La migration porte sur le **code qui produit** les nouveaux enregistrements, pas sur les données passées.
- Le hash de chaîne SHA-256 inclut le `dataSnapshot` — modifier rétroactivement un champ **casserait la chaîne de scellement**.

**Procédure obligatoire pour ce lot :**
1. Ajouter `amountInMicrounits` aux nouveaux `JournalEntry` (additif).
2. Conserver `amountInCents` dérivé en écriture — **définitivement**, pour la lisibilité des exports FEC (l'administration fiscale attend des centimes).
3. Migrer uniquement les **calculs internes** vers microunits.

**Critère de sortie :** tests fiscaux verts + vérification manuelle qu'un export FEC produit les mêmes montants qu'avant.
**Effort :** 3 sessions.

---

#### Lot 4 — Pilier `ops` (168 occurrences / 39 fichiers)

**Périmètre :** POS, KDS, recettes, bar.

**Champs dominants :** `totalInCents`, `unitPriceInCents`, `sellPriceInCents`, `sellingPriceInCents`, `costInCents`, `htInCents`, `orderTotalInCents`.

**Dette connue documentée dans `CLAUDE.md` :**
> `CartItem` ops = `workflow/engine/types.ts` (microunits)
> `CartItem` legacy = `service/pos/hooks/usePos.ts` (cents → bridge via `toMicrounits`)

**Ce lot résout ce double modèle.** Cibles précises repérées :
- `components/ProductFormModal.tsx` — état local `sellPriceInCents` + double écriture `sellingPriceInCents` / `sellingPriceInMicrounits` (lignes 158-161)
- `components/Cart.tsx` — `totalInCents` / `htInCents` sont des « parity mirrors kept for legacy callers (POSService.getProjectedMargin) » (ligne 154)
- `hooks/usePos.ts` — `cartTvaInCents`, `handlePaySplit(amountInCents)`

**Ordre :** migrer `POSService.getProjectedMargin` en premier (c'est lui qui force les miroirs dans `Cart.tsx`), puis supprimer les miroirs devenus inutiles.

**Effort :** 2 sessions.

---

#### Lot 5 — Piliers secondaires (148 occurrences)

`commerce` (53) → `logistics` (40) → `intelligence` (32) → `human` (20) → `facility` (2) → `compliance` (1).

Chacun est petit et indépendant. Peut être traité en 1 session groupée ou distribué en fin d'autres sessions.

**Effort :** 1-2 sessions.

---

#### Lot 6 — `src/lib/` (39) + `src/app/` (22) + suppression des miroirs

Dernier lot : une fois **tous** les consommateurs migrés, supprimer les champs `@deprecated`.

**Exception permanente à ne PAS supprimer :**
- `SovereignMath.toCents()` — nécessaire à l'affichage et aux exports
- `amountInCents` dans les enregistrements fiscaux NF525 — attendu par l'administration

**Effort :** 1 session.

### 1.4 Garde-fou automatisé à mettre en place dès le Lot 1

Ajouter une gate ratchet dans `scripts/preflight.sh` (sur le modèle du ratchet cycles existant) :

```bash
# Ratchet microunits — le compteur ne doit jamais remonter
CURRENT=$(grep -rn "InCents" src/ --include="*.ts" --include="*.tsx" | wc -l)
BASELINE=821   # à décrémenter à chaque lot livré
if [ "$CURRENT" -gt "$BASELINE" ]; then
  echo "❌ Régression microunits : $CURRENT > $BASELINE"
  exit 1
fi
```

Sans ce ratchet, chaque nouvelle session d'agent risque de réintroduire des `InCents`.

### 1.5 Effort total et critère de sortie

**Effort :** 9-11 sessions réparties en 6 lots.
**Critère de sortie global :**
- `grep -rn "InCents" src/` ≤ 40 occurrences (les exceptions permanentes documentées)
- tsc 0 · vitest vert · sentrux gate sans régression
- Export FEC identique avant/après (vérification manuelle obligatoire)

---

## CHANTIER 2 — Les 2 cycles sentrux (P1)

### 2.1 État réel : forte présomption de faux positif

**Ce que sentrux rapporte :**

```
✗ max_cycles: Found 2 circular dependencies, maximum allowed is 0
    src/modules/ops/providers/hooks/index.ts
    src/modules/ops/providers/hooks/kitchenHooks.tsx
    src/modules/ops/providers/index.ts
    src/modules/ops/service/pos/index.ts
    src/modules/ops/service/pos/infrastructure/cash-drawer/CashDrawerService.ts
```

**Ce que disent tous les autres outils :**

| Outil | Verdict | Résolution des imports |
|---|---|---|
| madge (`--circular`, tsconfig-aware) | **0 cycle** | Exacte (tsconfig paths) |
| gate cycles de `preflight.sh` (madge) | **0 cycle** (ratchet validé) | Exacte |
| `npx tsc --noEmit` | **0 erreur** | Exacte |
| Next.js build | passe | Exacte |
| **sentrux** | **2 cycles** | **par suffixe** |

### 2.2 Mécanisme suspecté

Les logs de sentrux révèlent son mode de résolution :

```
[resolve] 11284 resolved, 4712 unresolved (of 15996 total specs)
[resolve_imports] project_map 104ms, suffix_idx 8.1ms, suffix_resolve 42.6ms
```

**29 % des specs ne sont pas résolus**, et la résolution passe par un index de **suffixes** — pas par les `paths` du `tsconfig.json`.

Or le codebase est saturé d'homonymes :

| Nom de dossier | Nombre de `index.ts` homonymes |
|---|---|
| `hooks/` | **22** |
| `core/` | 22 |
| `components/` | 21 |
| `services/` | 17 |
| `providers/` | **16** |
| `adapters/` | 14 |
| `store/` | 11 |

Et 4 dossiers `pos/` distincts :
```
src/__tests__/pos
src/app/(client)/(ops)/pos
src/modules/commerce/ui/pos        ← contient aussi un cash-drawer/
src/modules/ops/service/pos        ← contient aussi un cash-drawer/
```

Un `export * from './hooks'` dans `providers/index.ts` a **22 cibles candidates** pour un résolveur par suffixe. La probabilité d'une mauvaise attribution créant un cycle fantôme est élevée.

### 2.3 Tests déjà effectués (résultats consignés)

| Hypothèse testée | Méthode | Résultat |
|---|---|---|
| Re-export redondant dans `NexusOpsProvider.tsx` | Suppression du bloc | 3 → 2 cycles ✅ (1 vrai cycle corrigé) |
| `export * from './opsCore'` dans `providers/index.ts` | Suppression | Inclus dans le gain ci-dessus |
| Barrel ambigu `'./hooks'` dans `pos/index.ts` | Remplacé par `'./hooks/usePos'` explicite | **Aucun changement** — 2 cycles persistent |
| `CashDrawerService` importe quelque chose de cyclique | Lecture des imports | **Non** — n'importe que `tenantScopedKey` + `authedFetch` |
| `CashDrawerAnomalyHandler` crée le lien | Lecture des imports | **Non** — n'importe que EventBus, Nexus, logger, audit |
| `providers/` importe `pos/` | grep exhaustif | **Non — aucun import** |
| `pos/` importe `providers/` via barrel | grep exhaustif | **Non** — imports directs `providers/hooks/*` uniquement |

**Aucun chemin ES module réel n'a été trouvé.** Les deux dossiers ne s'importent pas mutuellement.

### 2.4 Plan d'action en 3 étapes

#### Étape A — Confirmer définitivement le faux positif (1 session courte)

1. Lancer le serveur MCP de sentrux pour obtenir les arêtes exactes :
   ```bash
   sentrux mcp
   ```
   Demander le dump des arêtes du cycle. C'est la seule source qui dira **quelle arête** sentrux croit voir.

2. Test de contrôle par renommage temporaire :
   ```bash
   git mv src/modules/commerce/ui/pos src/modules/commerce/ui/pos-ui
   sentrux check .   # si les cycles disparaissent → ambiguïté confirmée
   git checkout .    # revert
   ```

3. Vérifier l'absence de TDZ réel en production :
   ```bash
   npm run build && npm start
   ```
   Un vrai cycle SSR produirait `Cannot access 'X' before initialization`. Aucune erreur = pas de cycle réel.

**Critère de sortie :** verdict tranché — faux positif ou vrai cycle.

#### Étape B (si faux positif confirmé) — Désambiguïser les homonymes

Le problème n'est pas seulement cosmétique : **22 `hooks/index.ts` homonymes gênent aussi les humains et les agents IA** qui lisent le code.

Renommages ciblés à faible risque (les barrels internes ne sont importés que localement) :

| Avant | Après |
|---|---|
| `src/modules/commerce/ui/pos/` | `src/modules/commerce/ui/pos-modals/` |
| `src/modules/ops/providers/hooks/` | `src/modules/ops/providers/sovereign-hooks/` |

**Procédure :** `git mv` (pas de suppression/recréation, pour préserver l'historique — cf. mémoire `project_rapatriement_shared`), puis `tsc` pour attraper les imports cassés.

#### Étape C — Documenter et re-figer la baseline

Si le faux positif est confirmé et non éliminable :

1. Ajouter une section dans `.sentrux/README.md` :
   > **Faux positifs connus** — sentrux résout par suffixe (`suffix_idx`), pas via `tsconfig.paths`.
   > Avec 22 `hooks/index.ts` homonymes, il rapporte 2 cycles fantômes dans `ops/providers` ↔ `ops/service/pos`.
   > Vérification croisée : madge (tsconfig-aware) = 0 cycle · tsc = 0 erreur · build SSR = OK.
   > **La gate qui fait autorité pour les cycles est madge** (`preflight.sh` étape 4).

2. Régénérer la baseline : `./scripts/sentrux-baseline.sh`

3. **Ne pas relâcher `max_cycles = 0`** dans `rules.toml` — l'intégrité des gates est vérifiée par hash (`verify-gate-integrity.mjs`), et desserrer une gate est explicitement interdit par le protocole projet.

**Effort total chantier 2 :** 1-2 sessions.

---

## CHANTIER 3 — Modules vides `appointments` / `consultation` (P2)

### 3.1 État réel

```
src/modules/commerce/relation/appointments/   → 14 fichiers, dont 13 .gitkeep
src/modules/ops/service/consultation/         → 14 fichiers, dont 13 .gitkeep
```

Contenu intégral de chaque `index.ts` :
```typescript
// Variant: appointments
export {};
```

Ce sont des **scaffolds vides** générés par la forge (arborescence `presentation/` `application/` `infrastructure/`), jamais remplis.

### 3.2 Découverte décisive : la fonctionnalité existe déjà ailleurs

Les verticales qui ont besoin de rendez-vous et consultations **les implémentent déjà dans `src/verticals/`** — sans jamais toucher ces modules vides :

| Verticale | Implémentation existante |
|---|---|
| `salon` | `salon.blueprint.ts` : `businessLaws.appointments_enabled: true`, KPI `appointmentsToday`, `SalonMccAdapter.emitHealthPing({ appointmentsToday })` |
| `veterinary` | Événement durable `veterinary.pet_consultation_completed`, `VeterinaryVertical.ts` handler, `PetRecordsPage.tsx`, `CareLoadAnalyticsService.ts` |
| `clinic` | Persona + KPI `consultation_count`, `rebook_rate` (`KpiDeriver.ts:121-122`) |

Le socle forge connaît aussi le concept :
- `ProfileArchetype.ts:70` → `code: 'appointment_space'`
- `blind-spot/rules/catalog-capability.ts:55` → règle `bs.catalog.appointments_without_reservations`

### 3.3 Décision à prendre (c'est un choix produit, pas technique)

**Option A — Supprimer les scaffolds (recommandée par défaut)**

*Justification :* un dossier vide est un piège. Un agent IA ou un développeur qui cherche « où sont les rendez-vous » trouve `commerce/relation/appointments/`, le lit, le trouve vide, et repart. Le vrai code est ailleurs. C'est un coût cognitif récurrent pour zéro valeur.

```bash
git rm -r src/modules/commerce/relation/appointments
git rm -r src/modules/ops/service/consultation
```
Puis retirer les entrées correspondantes de `CLAUDE.md` si elles y figurent.

**Effort :** 30 minutes. **Risque :** nul (aucun import ne les cible — vérifié).

---

**Option B — Promouvoir la logique verticale en module partagé**

*À choisir uniquement si* ≥ 3 verticales dupliquent la même logique rendez-vous et que cette duplication devient coûteuse.

**Vérification préalable obligatoire :** mesurer la duplication réelle entre `salon`, `clinic`, `veterinary`.
Si le code est différent (un RDV coiffure ≠ une consultation vétérinaire), la mutualisation serait une **abstraction prématurée** — le pire des deux mondes.

**Effort :** 3-5 sessions. **Risque :** moyen (couplage inter-verticales).

---

**Option C — Ne rien faire, documenter**

Ajouter un `README.md` dans chaque scaffold :
> Scaffold réservé. L'implémentation rendez-vous vit actuellement dans `src/verticals/{salon,clinic,veterinary}/`.
> Ce module sera rempli si/quand la mutualisation devient justifiée.

**Effort :** 15 minutes. **Risque :** nul, mais la dette cognitive reste.

### 3.4 Recommandation

**Option A** (supprimer), sauf si une verticale santé/beauté est au programme des 3 prochains mois — auquel cas **Option C** en attendant.

---

## CHANTIER 4 — i18n (P2)

### 4.1 ⚠️ Correction d'un fait périmé dans `CLAUDE.md`

Le `CLAUDE.md` affirme actuellement :

> **i18n** : `src/i18n/` existe (domains/ 464 lignes) mais **0 composant UI ne l'utilise** — l'app est monolingue français en dur. Infrastructure conservée en squelette […] mais inactive.

**C'est faux et cela induit les agents en erreur.** Mesure réelle :

| Fait | Réalité mesurée |
|---|---|
| Infrastructure câblée ? | ✅ `NexusCoreProvider.tsx:4` importe `loadTranslations`, expose `t` + `setLanguage` |
| `useLanguage()` fonctionnel ? | ✅ `src/shared/hooks/useLanguage.ts` retourne le vrai contexte (fallback seulement si provider absent) |
| Composants utilisant `t()` ? | **33 fichiers `.tsx`** (pas 0), **120 appels** |
| Locales présentes | `fr.ts` (544 l / 482 clés), `en.ts` (565 l / 500 clés), `es.ts` (145 l), `pt.ts` (122 l), `ja.ts` (122 l) |

**Action immédiate (5 min, à faire en premier) :** corriger ce paragraphe dans `CLAUDE.md`.
Tant qu'il est faux, chaque agent qui lit le fichier évitera de câbler l'i18n « parce que c'est inactif » — la prophétie s'auto-réalise.

### 4.2 État réel de la couverture

```
Fichiers .tsx total          : 902
Fichiers utilisant t()       :  33   →  3,6 %
Appels t()                   : 120
Clés fr définies             : 482
Clés en définies             : 500
```

**Diagnostic :** l'infrastructure est **complète et fonctionnelle**. Ce qui manque, c'est le **câblage des 869 composants restants** et la **traduction des locales stub**.

`es.ts`, `pt.ts`, `ja.ts` (122-145 lignes contre 544 pour `fr`) sont des **squelettes partiels** — environ 25 % des clés.

### 4.3 Découpage en 4 lots

#### Lot 0 — Corriger `CLAUDE.md` (préalable, 5 min)

Remplacer le paragraphe i18n par l'état réel mesuré ci-dessus.

#### Lot 1 — Décision de portée (préalable bloquant)

**Question à trancher avant toute ligne de code :**

| Scénario | Décision i18n |
|---|---|
| Premiers clients = restaurants francophones uniquement | **Geler le chantier.** Ne pas investir. |
| Clients FR + expansion EN prévue < 12 mois | Faire les lots 2-3, ignorer es/pt/ja |
| Multi-pays dès le départ | Faire les 4 lots |

**Sans cette décision, ce chantier est du travail spéculatif.** L'app fonctionne parfaitement en français.

#### Lot 2 — Extraction des chaînes par pilier (si décision = go)

Ordre par valeur d'usage décroissante (les pages qu'un client voit le plus) :

| Ordre | Zone | Volume estimé |
|---|---|---|
| 1 | POS + KDS (`ops/service/pos`, `production/kds`) | ~80 composants |
| 2 | Navigation + layout (`shared/components/layout`) | ~15 composants |
| 3 | Réservations + CRM (`commerce/relation`) | ~60 composants |
| 4 | Finance + rapports | ~90 composants |
| 5 | Reste (admin, settings, compliance…) | ~620 composants |

**Méthode par composant :**
1. `const { t } = useLanguage();`
2. Remplacer les littéraux par `t('domaine.cle')`
3. Ajouter la clé dans `fr.ts` **et** `en.ts` (jamais l'une sans l'autre)

**Piège à éviter :** ne pas traduire les chaînes **métier réglementaires** (mentions NF525, libellés FEC, intitulés comptables du PCG). Elles doivent rester en français légal quelle que soit la langue d'interface.

#### Lot 3 — Compléter les locales stub

`es.ts`, `pt.ts`, `ja.ts` : passer de ~25 % à 100 % des clés.

**Garde-fou à ajouter dans `preflight.sh` :**
```bash
# Parité des clés i18n — toute clé fr doit exister dans en
FR_KEYS=$(grep -c ":" src/i18n/locales/fr.ts)
EN_KEYS=$(grep -c ":" src/i18n/locales/en.ts)
[ "$EN_KEYS" -lt "$FR_KEYS" ] && echo "❌ en.ts incomplet" && exit 1
```

#### Lot 4 — Sélecteur de langue par tenant

Câbler `setLanguage` dans les settings tenant + persister le choix dans `TenantConfigSchema`.

### 4.4 Effort et critère de sortie

**Effort :** Lot 0 = 5 min · Lot 1 = décision · Lot 2 = 8-15 sessions · Lot 3 = 2 sessions · Lot 4 = 1 session.
**Critère de sortie :** basculer la langue en runtime change 100 % de l'UI visible sur les parcours POS et réservation.

---

## CHANTIER 5 — Barrel violations (P3)

### 5.1 État réel : 48 signalés, ~9 vraies violations

L'analyse ligne par ligne des 48 imports profonds révèle **4 catégories très différentes**, dont trois ne sont **pas** des violations.

---

#### Catégorie A — Faux positifs : imports DÉLIBÉRÉS et OBLIGATOIRES (7)

```
src/store/pillars/ops.ts         →  @/modules/ops/service/pos/store/orderAtoms
src/store/pillars/human.ts       →  @/modules/human/effectifs/hr/store/staffAtoms
src/store/pillars/logistics.ts   →  @/modules/logistics/stock/inventory/store/inventoryAtoms
src/store/pillars/commerce.ts    →  (3 imports d'atomes)
src/store/pillars/compliance.ts  →  @/modules/compliance/qualite/haccp/store/complianceAtoms
```

**Ces imports sont EXIGÉS par la règle sentrux n° 4** (`.sentrux/README.md` §5) :

> **Règle** : `store/pillars/*` → `*/index*` est interdit.
> Les pillar files n'importent QUE les fichiers `*Atoms.ts` directement.

Le fichier `src/store/pillars/ops.ts` le documente lui-même en en-tête :
> ⚠️ Ré-exports depuis les fichiers SOURCES des atomes, jamais depuis le barrel `@modules/ops` :
> la couche état ne doit pas importer les barrels de modules (cycle store → module → hooks → store, TDZ au build SSR).

**Action : AUCUNE. Ne jamais « corriger » ces 7 imports** — cela réintroduirait les cycles TDZ que la règle prévient.

---

#### Catégorie B — Bloqués par la migration des schémas (~20)

```
src/shared/nexus/contracts/ops.types.ts       →  @/modules/ops/domain/schemas/{ops,orders}
src/shared/nexus/contracts/commerce.types.ts  →  @/modules/commerce/domain/schemas/commerce
src/shared/nexus/contracts/auth.types.ts      →  @/modules/human/domain/schemas/users
src/shared/nexus/contracts/index.ts           →  (4 imports)
src/shared/nexus/state/SovereignGenome.ts     →  @/modules/{system,human}/domain/schemas/*
src/shared/schemas/index.ts                   →  (3 imports)
…
```

**Cause racine :** les schémas Zod vivent encore sous `src/modules/*/domain/schemas/`, alors que la couche `shared/` en a besoin.

**Contrainte connue** (mémoire projet `project_schema_migration_strategy`) :
> `domain/schemas/` reste en place jusqu'à l'**étape 4** ; migration pilier par pilier (finance → ops → logistics → …), **pas pendant S10**.

**Action : AUCUNE pour l'instant.** Ces violations se résorberont mécaniquement quand les schémas remonteront dans `src/domain/`. Les corriger avant serait du travail jeté.

---

#### Catégorie C — Pattern registry assumé (5 + 3)

```
src/lib/sync/pillarSyncRegistry.ts  →  5 imports *.sync de 5 piliers différents
src/app/api/connectors/*/route.ts   →  3 imports @/modules/ops/connectors/*
```

Un **registre** doit par nature connaître ses membres. Les routes API importent des factories explicitement documentées comme server-only dans `src/modules/ops/index.ts` :
> `DeliveryProviderFactory` et `ReservationProviderFactory` sont server-only :
> les importer directement dans les routes API, **jamais via ce barrel**.

**Action :** ajouter un commentaire `// eslint-disable-next-line no-inter-module-imports — registry pattern, cf. ADR-015` pour rendre l'intention explicite. Pas de refactor.

---

#### Catégorie D — VRAIES violations ADR-015 (~9)

Ce sont les seules à corriger. Import direct d'un pilier vers les entrailles d'un autre pilier :

| Fichier source | Import interdit | Pilier → Pilier |
|---|---|---|
| `modules/ops/workflow/engine/tables.types.ts` | `@/modules/facility/spaces/types` | ops → facility |
| `modules/ops/workflow/engine/components/index.ts` | `@/modules/facility/maintenance/registre` | ops → facility |
| `modules/ops/workflow/engine/components/floor-plan/index.ts` | `@/modules/facility/spaces/floor-plan` | ops → facility |
| `modules/ops/domain/schemas/inventory.ts` | `@/modules/logistics/domain/schemas/inventory` | ops → logistics |
| `modules/finance/domain/schemas/cash.ts` | `@/modules/ops/domain/schemas/cash` | finance → ops |
| `modules/finance/domain/schemas/supplier-invoice.schemas.ts` | `@/modules/logistics/domain/schemas/supplier-invoice.schemas` | finance → logistics |
| `modules/human/domain/schemas/rbac.ts` | `@/modules/compliance/domain/schemas/rbac` | human → compliance |
| `modules/system/domain/schemas/license.ts` | `@/modules/compliance/domain/schemas/license` | system → compliance |
| `modules/system/domain/schemas/supportTicket.ts` | `@/modules/intelligence/domain/schemas/supportTicket` | system → intelligence |

**Observation :** 6 des 9 sont des imports de **schémas** — même cause racine que la catégorie B. Ils disparaîtront avec la migration des schémas vers `src/domain/`.

**Restent 3 vraies violations structurelles :** les trois `ops → facility`.

### 5.2 Plan d'action

#### Lot 1 — Résoudre les 3 violations `ops → facility` (1 session)

`ops/workflow/engine` importe directement le plan de salle et le registre de `facility`.

**Solution conforme à ADR-015 :** passer par le barrel racine.
```typescript
// Avant
import { ... } from '@/modules/facility/spaces/floor-plan';
// Après
import { ... } from '@/modules/facility';
```

**Préalable :** vérifier que `src/modules/facility/index.ts` exporte bien ces symboles ; les ajouter sinon.
**Vigilance :** un barrel racine `facility` trop gros peut créer un cycle `ops ↔ facility`. Vérifier avec madge après chaque changement. Si cycle → basculer sur le canal `NexusEventBus` ou un contrat neutre `@/kernel/contracts/`.

#### Lot 2 — Documenter les catégories A, B, C (1 session courte)

Créer `docs/BARREL-EXCEPTIONS.md` recensant les 39 imports profonds légitimes avec leur justification, pour qu'aucun agent ne « corrige » par erreur les imports de la catégorie A.

#### Lot 3 — Les 6 restants (différé)

Se résorbent avec la migration des schémas (chantier hors périmètre de ce plan, étape 4).

### 5.3 Effort et critère de sortie

**Effort :** 2 sessions.
**Critère de sortie :** `docs/BARREL-EXCEPTIONS.md` existe · 3 violations `ops → facility` corrigées · madge toujours 0 cycle.

---

## Séquencement recommandé

### Principe directeur

Deux chantiers sont **peu coûteux et débloquent de la clarté immédiate** (2 et 5).
Un chantier est **une décision produit avant d'être du code** (4).
Un chantier est **un choix binaire de 30 minutes** (3).
Un seul est **un gros investissement** (1).

### Ordre proposé

```
SPRINT 0 — Clarifications rapides (1-2 sessions)
├── Chantier 4 / Lot 0  : corriger le paragraphe i18n périmé dans CLAUDE.md      [5 min]
├── Chantier 3          : décider Option A/B/C sur appointments+consultation      [30 min]
├── Chantier 2 / Étape A: confirmer le faux positif sentrux (MCP + build SSR)     [1 session]
└── Chantier 5 / Lot 2  : créer docs/BARREL-EXCEPTIONS.md                         [1 session]

SPRINT 1 — Hygiène structurelle (2-3 sessions)
├── Chantier 2 / Étapes B+C : désambiguïser homonymes + re-figer baseline
├── Chantier 5 / Lot 1      : corriger les 3 violations ops → facility
└── Chantier 1 / Lot 1      : compléter les 5 jumeaux InMicrounits manquants
                              + poser le ratchet microunits dans preflight.sh

SPRINT 2..N — Migration microunits (9-11 sessions)
├── Lot 2 : shared/           (103)
├── Lot 3 : finance           (270)  ⚠️ contrainte NF525
├── Lot 4 : ops               (168)
├── Lot 5 : piliers secondaires (148)
└── Lot 6 : lib/ + app/ + suppression des miroirs dépréciés

DIFFÉRÉ — i18n (conditionnel)
└── Chantier 4 / Lots 1-4 : uniquement si un client non-francophone est engagé
```

### Justification de l'ordre

- **Sprint 0 avant tout** : corriger `CLAUDE.md` évite que les prochaines sessions raisonnent sur un fait faux. Confirmer le faux positif sentrux évite de dépenser des sessions à chasser un cycle inexistant.
- **Le ratchet microunits avant les lots 2-6** : sans lui, chaque session d'agent peut réintroduire des `InCents` plus vite qu'on ne les enlève.
- **i18n en dernier** : c'est le seul chantier dont la valeur dépend entièrement d'une décision commerciale non prise.

---

## Critères de sortie globaux

Le plan est terminé quand :

| Chantier | Critère vérifiable |
|---|---|
| 1 | `grep -rn "InCents" src/` ≤ 40 · export FEC identique avant/après |
| 2 | Verdict tranché et documenté dans `.sentrux/README.md` · madge toujours 0 |
| 3 | Décision appliquée (scaffolds supprimés ou README explicatif présent) |
| 4 | `CLAUDE.md` corrigé (obligatoire) · reste conditionnel à la décision commerciale |
| 5 | `docs/BARREL-EXCEPTIONS.md` existe · 3 violations `ops → facility` résolues |

**Gates permanentes à maintenir vertes tout du long :**
```bash
npx tsc --noEmit          # 0 erreur
npx vitest run            # tous verts
sentrux gate .            # aucune régression vs baseline
./scripts/preflight.sh    # 10/10
```

---

## Ce que ce plan ne couvre PAS

Pour éviter toute ambiguïté de périmètre :

- **Base de données / GitLab** — explicitement exclus à la demande.
- **Migration `domain/schemas` vers `src/domain/`** — chantier distinct (étape 4), dont dépendent ~26 des 48 barrel violations.
- **God files (18)** — signalés par sentrux, non traités ici.
- **Complexité cyclomatique (1521 fonctions > 12)** — majoritairement du bruit issu de scripts vendored (`.agent/`, `.claude/`, `.gemini/`, `.github/`). Nécessite un mécanisme d'exclusion de chemins absent de la version sentrux installée.
- **Préparation client (matériel, VAPID, preflight prod)** — chantier opérationnel séparé, sans lien avec la dette technique.

---

*Ground truth établi le 2026-08-25 sur `main@b9a3198b3`. Chaque chiffre est reproductible par les commandes citées.*
