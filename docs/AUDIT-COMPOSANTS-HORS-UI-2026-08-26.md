# Audit — composants existants en code mais absents de l'interface client

> Mesuré le 2026-08-26 (Loi 7 Zero-Claim).
> **Révision 3** (2026-08-26, contrôle de fraîcheur) — chiffres re-mesurés : **88 composants /
> 10 280 lignes, inchangés**. Constats re-testés un par un ; une erreur de la rév. 2
> corrigée sur `PlaceholderView` (voir la section concernée).
>
> **Révision 2** — fusionne l'audit Claude Code (atteignabilité) et l'audit
> Antigravity (inspection qualitative), après vérification indépendante de chaque
> constat croisé. Corrige un défaut de méthode de la révision 1 (voir plus bas).

---

## Résultat

| | Rév. 1 | **Rév. 2** |
|---|---:|---:|
| Composants `.tsx` analysés | 617 | **617** |
| Jamais consommés hors barrel | 58 | **88** |
| Volume de code jamais rendu | 6 456 l | **10 280 l** |

### Correction de méthode (rév. 1 → rév. 2)

La révision 1 suivait la fermeture transitive des imports depuis les pages
clientes. **Ce critère traversait les barrels** : dès qu'une page importait
`@/modules/commerce`, le fichier barrel était marqué atteint, et son
`export * from './ModifierModal'` marquait le composant comme atteint lui aussi —
alors que **personne ne le consomme**.

L'audit Antigravity a mis ce trou en évidence en signalant `ModifierModal`,
`ROICalculator`, `EmbedSnippets` et `OnlineBookingToggle`, absents de ma liste.
Vérification faite : les quatre ont **0 rendu JSX** et **0 référence hors barrel**.

Critère corrigé : un composant est mort s'il n'est jamais rendu en `<Composant>`
ailleurs que dans son propre fichier **et** jamais référencé en dehors d'un
`index.ts`. Un ré-export sans consommateur n'est pas un usage.

**Le chiffre réel est donc 88, pas 58.** Sous-évaluation de 52 %.

---

## Méthode

1. Points d'entrée : les 55 fichiers de convention Next.js sous `src/app/(client)`,
   plus `app/layout.tsx` et `ClientComponents.tsx`.
2. Résolution des alias (`@/`, `@ui/`, `@components/`, `@nexus/`, `@shared/`,
   `@modules/`) et des imports dynamiques `import('…')`.
3. Classement par surface (`(admin)`, `(marketing)`, `(public)`, `api`) pour isoler
   ce qui n'appartient à **aucune** surface.
4. Critère final : jamais rendu en JSX + jamais référencé hors barrel.

### Limites assumées

- Un composant rendu via une **table de correspondance dynamique**
  (`registry[name]`) serait vu comme mort à tort. Aucun cas trouvé lors des
  vérifications manuelles, mais le risque subsiste.
- **12 composants ont été vérifiés à la main** au total sur les deux révisions ;
  4 se sont révélés faux positifs (voir la section dédiée).

---

## Sous-systèmes entièrement morts

Ce ne sont pas des composants isolés, ce sont des fonctionnalités complètes.

| Dossier | Fichiers morts | Ce que c'est |
|---|---|---|
| `reservations/components/new-reservation/` | **4 / 4** | Parcours de création de réservation |
| `kitchen/components/recipe-editor/` | **4 / 4** | Éditeur de fiches recette |
| `inventory/components/storage-map/` | **4 / 4** + `detail-bubble/` **3 / 3** | Plan de stockage en glisser-déposer |
| `shared/components/settings/brand-import/` | **3 / 3** | Assistant d'import de charte graphique |
| `marketing/components/marketing/` | **6 / 7** | Campagnes, segments, comptes sociaux |

### Le cas le plus visible pour un client : le plan de stockage

La barre latérale propose **« Plan des Stockages » → `/inventory?tab=storage`**.
L'onglet existe, il est protégé par un `TabGuard`, il est navigable. Mais rien
n'importe les 7 fichiers de `storage-map/`.

Ce que l'onglet affiche à la place : une grille de cartes `nom + type`
(`inventory/page.tsx:192`). Le glisser-déposer d'ingrédients, les cartes de
rangement et les bulles de détail ne sont jamais montés.

**Le client voit une version dégradée d'une fonctionnalité qui existe.**

---

## Défauts de qualité (au-delà du « non monté »)

### 🔴 Scellement non canonique — enjeu NF525

`ProcurementBridge.ts:52` signe un bon de livraison ainsi :

```ts
const payload = JSON.stringify(deliveryNote);
const signatureHash = await QuantumCrypto.sign(payload);
```

`CryptoService.canonicalStringify` est utilisé dans **18 autres endroits** du
dépôt — sceaux fiscaux, `AuditService`, `SovereignGuard`, `MasterBridge`,
écritures de journal, avoirs, clôture de période. C'est la convention établie.
**`ProcurementBridge` est le seul site à signer un `JSON.stringify` brut.**

Conséquence : `JSON.stringify` conserve l'ordre d'insertion des clés. Un même bon
de livraison construit depuis un formulaire ou réhydraté depuis la base produit
**deux hashes différents**. La signature archivée en WORM ne se revérifiera pas.

> Constat remonté par Antigravity, vérifié indépendamment : confirmé.

### 🟠 Bouton sans action — `PlaceholderView.tsx:69`

```tsx
<Button size="lg" className="…">
    <Plus className="w-5 h-5 mr-3" />
    Configurer le Module
</Button>
```

Aucun `onClick` : le bouton **principal** de l'écran est inerte.

> Correction de la rév. 2, qui affirmait que le second bouton l'était aussi :
> c'est **faux**. Le second (`variant="outline"`, l. 75) possède bien un
> `onClick` en ligne 79. Seul le premier est mort.

> ⚠️ Ne pas confondre avec `PlaceholderViews.tsx` (au pluriel), autre fichier,
> qui exporte 14 vues comptables toutes mortes.

### 🟠 Données inventées en dur

| Fichier | Ce qui est figé |
|---|---|
| `StaffPortal.tsx:41-50` | `value="14.5"` (solde de congés), `value="112h"`, pourboires, prochain shift |
| `DirectorFlashReport.tsx:57` | `trend={{ value: 12, direction: 'up' }}` sur le chiffre d'affaires |

**Nuance importante** : ces deux composants ne sont montés nulle part. Leurs
fausses données ne sont donc visibles de personne aujourd'hui. C'est un **piège
latent, pas un bug actif** — mais le jour où on les branche, on livre à un salarié
un solde de congés inventé et à un gérant une progression de CA fabriquée.

À la ligne 70, `DirectorFlashReport` utilise en revanche une vraie donnée
(`report.incidentsCount`) : le composant mélange réel et factice, ce qui rend le
faux d'autant moins repérable.

### 🟡 Réconciliation de facture jamais atteinte

`InvoiceReviewModal.tsx` — réconciliation multi-articles au scan d'une facture
fournisseur (détection d'ingrédients, taux de correspondance, insertion par lots).
Jamais ouverte : à la réception de stock, seul `items[0]` est pré-rempli dans un
formulaire unitaire. Contient par ailleurs un `<table>` **sans conteneur
`overflow-x`**, l'un des 14 recensés.

> *Dossier suivi par la session Antigravity — non modifié ici.*

### 🟡 Doublons et versions abandonnées

| Composant mort | Remplacé par | Constat |
|---|---|---|
| `pos/components/CategoryList.tsx` | Sélecteur intégré à `PosHeader.tsx:297` | Version antérieure jamais supprimée. **Le changement de catégorie fonctionne.** |
| `intelligence/ia/fleet/NexusFleetProvider.tsx` | `shared/providers/fleet/NexusFleetProvider.tsx` | Deux providers homonymes, un seul monté. |

### 🟡 Chaîne de code mort

`StaffPortal.tsx` (mort) importe `PaySlipViewer.tsx` (mort). Du code mort qui en
maintient un autre en vie dans les recherches de références naïves.

### 🟡 Composant égaré

`RolesPermissionsPanel.tsx` (éditeur de permissions RBAC) vit dans
`facility/spaces/settings/` au lieu de `shared/components/settings/`. Jamais monté.

### 🟡 Emplacement configurable pour un composant qui ne s'affiche pas

`SupportHelpWidget` n'est référencé que par une **union de types**
(`IVerticalUIPlugin.ts:16`) et une **liste blanche de schéma**
(`tenantUiOverridesSchema.ts:46`). Le système de personnalisation par tenant
l'offre comme emplacement paramétrable, alors qu'il n'est rendu nulle part.

Même motif que celui relevé sur `FiscalReceiptSealZone` : une infrastructure de
personnalisation construite plus vite que ce qu'elle pilote.

### 🟡 `CashCounterModal` — à corriger avant tout branchement

Comptage de tiroir par coupure, mode aveugle, calcul d'écart (188 lignes).
Fonctionnalité réelle, **quatre défauts** :

1. **Centimes au lieu de microunits** (`expectedAmountInCents`). `CLAUDE.md`
   l'interdit : « jamais `*InCents` dans le nouveau code ».
2. **`w-2/3` + `flex` sans variante responsive** dans un `max-w-4xl` (896 px) :
   inutilisable en tablette portrait.
3. **`parseInt` sans borne** : une quantité négative de billets fausse le total.
4. **Erreur de validation avalée** : journalisée, jamais montrée au manager.

Complémentaire de `CashDrawerModal` (monté), qui gère la *session* de caisse et ne
compte aucune coupure — ce ne sont pas des doublons.

---

## Fonctionnalités développées et invisibles

Au-delà des sous-systèmes, composants isolés portant une vraie valeur métier :

- **`ModifierModal`** — modifications de cuisson et préférences cuisine
  (« sans oignons », « bien cuit », « sauce à part », « vegan », « sans gluten »).
- **`OrdersLiveBoard`** — tableau live du KDS.
- **`EmpireCockpit`** — cockpit 5 piliers (CA, HACCP, ruptures, tables actives).
- **`DirectorFlashReport`** — « le café du matin », synthèse exécutive de la veille.
- **`OnboardingChecklist`** — parcours d'accueil en 5 étapes.
- **`StaffPortal` + `PaySlipViewer`** — espace salarié (congés, heures, tronc,
  bulletins de paie).
- **`ROICalculator`, `EmbedSnippets`, `OnlineBookingToggle`** — simulateur
  d'économies vs TheFork, générateur d'iframe de réservation, activation de la
  réservation en ligne.
- **`InstallPrompt`** — invitation à installer la PWA (sur tablette, ça compte).
- **`StockLowLevelBoard`**, **`ExpenseClaimsList`**, **`BreakdownsBoard`**,
  **`CustomersDirectory`**, **`NF525SelfAudit`** *(celui-ci désormais branché)*.

---

## Corrigé dans cette session

| Correctif | Commit |
|---|---|
| Partage d'addition inatteignable + `INV-10` (invariant anti-handler inerte) | `105c24184` |
| Auto-audit NF525 rendu atteignable — onglet sur `/nf525` | `a4a66ef7e` |

---

## Faux positifs écartés

À signaler, parce qu'ils montrent où chaque méthode se trompe :

- **10 composants `PageShell*`** paraissaient orphelins : ils sont affectés en
  propriétés de namespace (`PageShell.Tab = PageShellTab`) dans le même fichier.
- **`CustomersDirectory`** signalé « avec mocks » par un premier grep : les
  4 occurrences sont des attributs `placeholder=` HTML.
- **Providers `Notifications` / `Settings` / `Theme` / `Tutorial` / `Intelligence` /
  `Floor`** : non montés, mais **passe-plats volontaires** vers `NexusCore`.
  Tout fonctionne.
- **`usePlanning`** : le barrel résout vers `useHumanResources`, pas vers le
  contexte qui jetterait. `PlanningContext.tsx` = 43 lignes de code mort, sans plus.

---

## À arbitrer

Décisions produit, pas techniques.

- [ ] **`ProcurementBridge`** — remplacer `JSON.stringify` par
      `CryptoService.canonicalStringify`. ⚠️ Décider du sort des bons de livraison
      **déjà signés** : leur hash changera. Migration ou double vérification ?
- [ ] **Plan de stockage** : brancher les 7 fichiers, ou assumer la grille simple
      et supprimer ? *(dossier Antigravity)*
- [ ] **Éditeur de recettes** (4 fichiers), **parcours nouvelle réservation**
      (4 fichiers) : brancher ou supprimer ?
- [ ] **`StaffPortal`** : le brancher **exige** de remplacer d'abord les valeurs en
      dur par les vraies collections (`leaveBalances`, `timeLogs`, `shifts`).
      Le brancher tel quel livrerait de fausses données de paie à des salariés.
- [ ] **`CashCounterModal`** : corriger les 4 défauts, puis l'insérer dans quel flux ?
- [ ] **`PlaceholderView`** : câbler les deux boutons, ou retirer l'écran ?
- [ ] **`onClearCart`** (exception documentée dans `INV-10`) : bouton « Vider le
      panier » avec confirmation ? validation manager ? via `VoidModal` ?
- [ ] **10 280 lignes mortes** : réserve ou nettoyage ? Chaque fichier conservé
      continue d'être compilé, typé, et de peser sur la lecture du dépôt.

## Reste non trié

- 6 props handler no-op (`leaves` `onView` ×2, `seo` `onEdit` ×2,
  `RecruitmentBoard` `onEdit`, plus une légitime dans `DesktopSidebar`).
- 7 blocs `catch {}` strictement vides et 22 ne contenant qu'un commentaire.
  Certains sont légitimes (quota de stockage dépassé), d'autres avalent peut-être
  de vraies erreurs. Aucun jugement porté ici.

---
---

# PLAN DE REMÉDIATION

> Établi le 2026-08-26 à partir des constats ci-dessus. Chaque décision est adossée
> à une vérification faite en session ; les points d'ancrage ont été localisés dans
> le code avant d'être proposés.
>
> **Aucune ligne de `src/` n'a été modifiée pour écrire ce plan.**

## Principes directeurs

1. **Ne jamais brancher un composant qui ment.** Un composant à données en dur
   branché est pire que le même composant mort : il devient une source de
   décisions fausses. Les fausses données se corrigent *avant* le câblage.
2. **Doublon ⇒ supprimer, pas brancher.** Quand deux implémentations coexistent,
   la question n'est pas « laquelle brancher » mais « laquelle supprimer ».
3. **Un invariant par bug corrigé.** La classe « code valide mais inerte » échappe
   à `tsc`, `vitest` et `next build`. Seul un invariant la rattrape.
4. **L'ordre compte.** Les pièges latents passent avant les branchements ; les
   branchements francs avant les arbitrages de fond.

## Tableau de décisions

| # | Sujet | Décision | Pourquoi |
|---|---|---|---|
| 1 | `ProcurementBridge` scellement | **Corriger** | Intégrité fiscale, seul écart sur 19 sites |
| 2 | `useCashDrawer` + `CashCounterModal` | **Corriger puis brancher** | Hook et modale conçus ensemble, jamais reliés |
| 3 | `StaffPortal` + `PaySlipViewer` | **Supprimer** | `/mon-espace` fait déjà mieux, avec de vraies données |
| 4 | `DirectorFlashReport` | **Corriger puis brancher** | Vraie valeur, une seule donnée factice |
| 5 | `PlaceholderView` bouton mort | **Câbler ou retirer l'écran** | 1 ligne, ou l'écran n'a pas lieu d'être |
| 6 | `new-reservation/` | **Terminer la bascule** | Version enrichie jamais substituée |
| 7 | `recipe-editor/` | **Chantier** | Onglets sans conteneur : inachevé, pas non monté |
| 8 | `storage-map/` | **Brancher** | L'onglet existe et montre une version dégradée |
| 9 | `ModifierModal` | **Améliorer l'existant** | Alternative tactile à un champ libre déjà en place |
| 10 | Widgets réservation | **Brancher dans les réglages** | Aucun point d'entrée aujourd'hui |
| 11 | Doublons `CategoryList`, `NexusFleetProvider` | **Supprimer** | Versions antérieures abandonnées |
| 12 | `onClearCart` | **Arbitrage produit** | Geste destructif, pas de décision technique |

---

## Phase 0 — Préalables (avant toute écriture)

- [ ] **Coordination.** Antigravity travaille sur `floor-plan/`, `inventory/` et
      `EquipmentHubView`. Les lots 8 (`storage-map`) et la réconciliation de
      facture tombent dans son périmètre : à répartir explicitement dans
      `.claude/sessions.md` avant de commencer, sous peine d'écrasement croisé.
- [ ] **Point de reprise.** Créer une branche par lot. Le hook `pre-commit`
      exécute les gates à chaque commit : ne jamais utiliser `--no-verify`.
- [ ] **Rappel RTK.** Les codes de sortie sont masqués par RTK. Toute vérification
      doit s'appuyer sur de la **sortie réelle**, jamais sur un `$?`.

---

## Phase 1 — Intégrité fiscale (priorité absolue)

### Lot 1 — `ProcurementBridge` : scellement canonique

**Constat vérifié.** `ProcurementBridge.ts:52` est le seul site sur 19 à signer un
`JSON.stringify` brut ; les 18 autres passent par `CryptoService.canonicalStringify`.

**Ce qui change tout** : `QuantumCrypto.verifySeal()` existe, mais le
`signatureHash` des bons de livraison n'y est **jamais repassé**. Il est seulement
stocké (route API, archive WORM, schéma `inventory.ts:64`). **Aucune vérification
n'existe aujourd'hui.**

Conséquence : le bug est **latent, pas actif**. Rien ne casse aujourd'hui, et la
correction ne casse rien non plus — il n'y a aucun vérificateur à rendre
incompatible.

**Câblage**

1. Remplacer par `CryptoService.canonicalStringify(deliveryNote)`.
2. **Estampiller la version d'algorithme** dans les métadonnées de l'archive WORM
   (`sealAlgo: 'canonical-v1'`). Les archives existantes n'en portent pas : leur
   absence signalera à un futur vérificateur qu'elles relèvent de l'ancien mode.
3. Ne **pas** tenter de re-signer l'existant : une archive WORM est immuable par
   définition. La rejouer contredirait l'ADR-003.

**Conséquences à assumer**

- Les BL déjà archivés gardent un hash calculé à l'ancienne. Un futur outil de
  vérification devra brancher sur `sealAlgo`. C'est le prix de l'immuabilité, et
  c'est le comportement correct.
- **À vérifier avant de commencer** : combien de BL sont déjà signés en base ? Si
  le volume est nul ou négligeable (instances de test), la question de la
  compatibilité disparaît entièrement.

**Point connexe relevé au passage** : `QuantumCrypto.sign(data, previousHash)`
accepte un chaînage, mais `ProcurementBridge` l'appelle sans `previousHash`. Les
bons de livraison ne sont donc **pas chaînés entre eux**, contrairement aux sceaux
fiscaux. À confirmer comme intentionnel ou non — hors périmètre de ce lot.

**Vérification** : un test unitaire qui signe deux objets logiquement identiques
mais construits dans un ordre de clés différent, et exige un hash identique.

**Invariant à ajouter (INV-11)** : aucun `JSON.stringify` ne doit précéder un
appel à `.sign(` ou `.hash(` dans `src/` — seul `canonicalStringify` est admis.

---

## Phase 2 — Pièges latents (avant tout branchement)

> Ces composants ne nuisent à personne tant qu'ils sont morts. Les brancher sans
> les corriger d'abord, c'est **créer** le bug.

### Lot 2 — `useCashDrawer` + `CashCounterModal`

**Constat vérifié.** Le hook `useCashDrawer` expose `isCounterOpen`, `counterType`
typé `'EOD_CLOSE' | 'SKIM' | 'DROP'` — exactement l'union de la prop `type` de
`CashCounterModal`. **Les deux ont été conçus ensemble et jamais reliés** :
`useCashDrawer` n'est consommé par personne.

**Point d'ancrage identifié** : `EndOfDayWizard` est monté dans
`OperationsDashboard`, lui-même rendu par `/operations`. Le flux de clôture existe
et tourne — il lui manque l'étape de comptage physique.

**À corriger AVANT branchement**

| Défaut | Correction |
|---|---|
| Centimes (`expectedAmountInCents`) | Migrer en microunits (`CLAUDE.md` l'exige) |
| `expectedAmountInCents = 15000` en dur | Lire le fond de caisse réel de la session |
| `w-2/3` + `flex` non responsive | `flex-col lg:flex-row`, colonnes empilées sous `lg` |
| `parseInt` sans borne | `Math.max(0, …)` : une quantité négative de billets n'existe pas |
| Erreur avalée | Remonter un toast ; ne pas fermer la modale sur échec |

**Conséquences à assumer**

- La migration centimes → microunits touche la chaîne `useCashDrawer` →
  `CashCounterModal` → journal d'écart. Faire les deux **dans le même lot** :
  une conversion à moitié faite est pire que pas de conversion.
- L'écart de caisse (`discrepancy`) alimente potentiellement un événement d'audit
  (`details: { discrepancyInCents }` ligne 74). Vérifier si un consommateur existe
  avant de renommer le champ.
- Un comptage aveugle mal branché fausserait un contrôle anti-fraude : le mode
  `isBlindMode` doit rester piloté par un réglage, jamais par un défaut en dur.

### Lot 3 — `DirectorFlashReport`

Corriger `trend={{ value: 12, direction: 'up' }}` (l. 57) : calculer la variation
réelle contre J-7. Le composant utilise déjà une vraie donnée en l. 70
(`report.incidentsCount`) — c'est ce mélange qui rend le factice difficile à
repérer.

Une fois corrigé : brancher sur `/operations`, aux côtés de `EmpireCockpit`.

### Lot 4 — `StaffPortal` + `PaySlipViewer` : **supprimer**

**Décision contraire à la recommandation initiale d'Antigravity**, sur la base
d'une vérification :

`/mon-espace` existe déjà, avec **6 onglets** — planning, pointage, congés,
pourboires, coffre-fort (bulletins via `DigitalEmployeeVault`), formations —
alimentés par de vraies données Nexus.

`StaffPortal` (79 lignes) couvre un **sous-ensemble strict**, avec quatre valeurs
inventées. Le brancher reviendrait à afficher à un salarié un solde de congés
faux, à côté d'une page qui affiche le vrai.

**Décision : supprimer `StaffPortal.tsx` et `PaySlipViewer.tsx`.** Avant
suppression, vérifier que `PaySlipViewer` n'apporte rien que
`DigitalEmployeeVault` ne couvre pas déjà — si oui, absorber la différence dans
l'onglet « coffre-fort ».

---

## Phase 3 — Branchements francs

> Composants sains, à valeur immédiate, sans arbitrage lourd.

### Lot 5 — `PlaceholderView` (l. 68)

Le bouton principal « Configurer le Module » n'a pas de `onClick` ; le second en a
un (l. 79). Deux options : lui donner sa destination, ou retirer l'écran s'il n'a
plus de raison d'être. **Question préalable** : `PlaceholderViews.tsx` (au
pluriel) exporte 14 vues comptables toutes mortes — cet écran de remplacement
a-t-il encore un sens, ou est-ce le vestige d'un module abandonné ?

### Lot 6 — `EmpireCockpit` + `OnboardingChecklist`

Cockpit 5 piliers et parcours d'accueil en 5 étapes. Ancrage naturel :
`/operations` pour le premier, tableau de bord d'accueil pour le second.

**Conséquence** : `OnboardingChecklist` ne doit s'afficher que tant que
l'installation n'est pas terminée. Vérifier qu'un état de complétion est persisté
côté tenant, sinon la checklist réapparaîtra indéfiniment.

### Lot 7 — Widgets réservation

`ROICalculator`, `EmbedSnippets`, `OnlineBookingToggle` : aucun point d'entrée
aujourd'hui. Ancrage proposé : un onglet « Réservation en ligne » dans les
réglages, sur le patron `tabs={PageShell.Tab}` déjà utilisé par `/haccp`, `/crm`,
`/mon-espace` et `/nf525`.

**Conséquence** : `EmbedSnippets` génère du code à coller sur le site du
restaurant. Il expose donc un identifiant de tenant dans une iframe publique —
vérifier que rien de sensible ne transite, et que `SovereignGuard` couvre bien
l'origine externe.

### Lot 8 — `storage-map/` *(coordonner avec Antigravity)*

7 fichiers de glisser-déposer, jamais montés ; l'onglet « Plan de stockage »
affiche une grille de cartes à la place (`inventory/page.tsx:192`).

`@dnd-kit/core`, `@dnd-kit/sortable` et `@dnd-kit/utilities` sont déjà en
dépendances — aucun ajout nécessaire.

**Conséquence** : le glisser-déposer est un geste **tactile** ; sur tablette il
entre en concurrence avec le défilement de la page. Prévoir un délai
d'activation (`activationConstraint`) sous peine de rendre l'onglet inutilisable
là où il sert le plus.

---

## Phase 4 — Arbitrages de fond

> Ces lots demandent une décision produit avant toute ligne de code.

### Lot 9 — `new-reservation/` : terminer ou supprimer

`ReservationCreateDialog` (202 l., monolithique) est en service.
`new-reservation/` (4 fichiers, 401 l.) est une version **découpée et enrichie**,
avec un `CustomerIntelligenceSidebar` que l'existant n'a pas.

**Décision requise** : terminer la bascule (et supprimer l'ancien), ou supprimer
les 401 lignes. Ne pas laisser les deux.

**Conséquence d'une bascule** : le parcours de création de réservation est un
chemin critique en salle. Toute substitution exige un test de bout en bout
(recherche client → détails → enregistrement), sinon on remplace du fonctionnel
par du non éprouvé.

### Lot 10 — `recipe-editor/` : chantier, pas branchement

Les 4 onglets existent avec leur barrel, mais **aucun conteneur `RecipeEditor`**
ne les assemble. Ce n'est pas un composant non monté : c'est une fonctionnalité
inachevée. Chiffrer comme un développement, pas comme un câblage.

### Lot 11 — `ModifierModal` : améliorer l'existant

`CartItemContextMenu` (monté, fonctionnel) propose déjà un **champ libre**
« Sans oignons, bien cuit… ». `ModifierModal` offre les mêmes modifications en
**boutons tactiles**.

Sur tablette en plein service, taper au clavier est lent et source d'erreur : des
boutons sont objectivement meilleurs. Mais c'est un **remplacement d'UX**, pas un
trou à combler — d'où l'arbitrage.

**Conséquence** : si les modifications deviennent une liste fermée, il faut
décider du sort du texte libre (le conserver en complément ? le supprimer ?) et
de la reprise des modifications déjà saisies en base sous forme de chaînes.

### Lot 12 — `onClearCart`

Exception documentée dans `INV-10`. Vider un panier détruit une commande en cours.
Trois options : confirmation simple, validation manager, ou passage par
`VoidModal` (qui existe déjà et est monté). **Recommandation** : `VoidModal`,
puisque le geste d'annulation y est déjà traité.

---

## Phase 5 — Nettoyage

- [ ] Supprimer les doublons tranchés : `CategoryList.tsx`,
      `intelligence/ia/fleet/NexusFleetProvider.tsx`, `PlanningContext.tsx`
      (43 l. mortes), `StaffPortal.tsx`, `PaySlipViewer.tsx`.
- [ ] Déplacer `RolesPermissionsPanel.tsx` de `facility/spaces/settings/` vers
      `shared/components/settings/`, puis décider de son branchement.
- [ ] Trancher les **14 vues** de `PlaceholderViews.tsx`.
- [ ] Trancher `SupportHelpWidget` : il est offert comme emplacement configurable
      par tenant (`IVerticalUIPlugin.ts:16`, `tenantUiOverridesSchema.ts:46`) sans
      être rendu. Soit on le rend, soit on le retire des deux déclarations —
      laisser un emplacement qui ne mène à rien est un piège pour la suite.
- [ ] Trier les 7 `catch {}` vides et les 22 à commentaire seul.
- [ ] Traiter les 6 props handler no-op restantes (`leaves` `onView` ×2,
      `seo` `onEdit` ×2, `RecruitmentBoard` `onEdit`).

**Conséquence du nettoyage** : chaque fichier conservé continue d'être compilé,
typé, parcouru par les recherches et lu par le prochain intervenant. 10 280 lignes
mortes, c'est autant de code qui ressemble à de la fonctionnalité sans en être.

---

## Protocole de vérification (à appliquer à chaque lot)

1. `npx tsc --noEmit` — 0 erreur.
2. `npx vitest run` — aucun échec, et le compteur de tests **augmente** si le lot
   ajoute un invariant.
3. **Vérification à l'écran** pour tout lot touchant l'UI. L'analyse statique n'a
   pas vu les 450 px d'en-tête KDS hors cadre ; seul le runtime les a révélés.
4. Mesurer, pas estimer : débordement horizontal **et** vertical, bords gauche
   **et** droit (ma première sonde ne testait que le droit).
5. `pre-commit` vert, sans `--no-verify`.

## Invariants à ajouter

| Invariant | Ce qu'il empêche |
|---|---|
| `INV-11` | Un `JSON.stringify` avant un `.sign()` / `.hash()` — scellement non déterministe |
| `INV-12` | Un composant exporté par un barrel sans aucun consommateur (le trou de méthode de la rév. 1) |
| `INV-13` | Une valeur numérique en dur dans un composant de tableau de bord (les `value="14.5"`) |

`INV-10` (props handler inertes) existe déjà depuis le commit `105c24184`.

## Risque transverse

Le fil rouge de tout cet audit : **l'infrastructure est systématiquement construite
plus vite que son branchement**. Réglage « Addition divisée » sans bouton,
emplacement `SupportHelpWidget` sans rendu, `useCashDrawer` sans consommateur,
onglets de recettes sans conteneur, `Map3DOverlay` sans montage.

Corriger les 12 lots sans traiter cette habitude reproduira le même état dans six
mois. Les invariants ci-dessus sont le seul garde-fou qui survive aux sessions.
