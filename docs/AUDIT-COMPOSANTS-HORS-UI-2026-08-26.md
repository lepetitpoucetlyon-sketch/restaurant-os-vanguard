# Audit — composants existants en code mais absents de l'interface client

> Mesuré le 2026-08-26 (Loi 7 Zero-Claim).
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

Aucun `onClick`. Le bouton principal de l'écran est inerte, et le second
(`variant="outline"`, juste en dessous) l'est également.

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
