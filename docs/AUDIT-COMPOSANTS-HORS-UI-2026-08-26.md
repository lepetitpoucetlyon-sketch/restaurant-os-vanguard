# Audit — composants existants en code mais absents de l'interface client

> Mesuré le 2026-08-26 (Loi 7 Zero-Claim). Toutes les valeurs sont issues d'une
> analyse exécutée dans la session ; la méthode et ses limites sont décrites plus bas.

---

## Méthode

Analyse d'**atteignabilité réelle**, et non simple recherche de références.

1. Points d'entrée = les 55 fichiers de convention Next.js (`page.tsx`, `layout.tsx`,
   `error.tsx`…) sous `src/app/(client)`, plus `app/layout.tsx` et `ClientComponents.tsx`.
2. Fermeture transitive des imports, avec résolution des alias (`@/`, `@ui/`,
   `@components/`, `@nexus/`, `@shared/`, `@modules/`) et des imports dynamiques
   (`import('…')`).
3. Tout `.tsx` de `src/modules/` ou `src/shared/components/` hors de cette
   fermeture = **absent de l'interface client**.
4. Classement par surface : le même calcul est refait depuis `src/app/(admin)`,
   `(marketing)`, `(public)` et `src/app/api` pour isoler ce qui n'appartient à
   **aucune** surface.

### Limites assumées

- Un composant rendu via une **table de correspondance dynamique** (`registry[name]`)
  serait vu comme mort à tort. Aucun cas n'a été trouvé lors des vérifications
  manuelles, mais le risque n'est pas nul.
- Les barrels `export *` (960 dans le dépôt) ne suffisent pas à rendre un composant
  atteignable : un ré-export sans consommateur reste du code mort. C'est le cas
  vérifié de `CategoryList`, `NewReservationDialog`, `RecipeCompositionTab`.
- **6 composants ont été vérifiés à la main** pour valider la méthode ; 2 se sont
  révélés des faux positifs de la première passe (voir plus bas).

---

## Résultat

| | Nombre |
|---|---:|
| Composants `.tsx` analysés | **617** |
| Fichiers atteints depuis l'interface client | 1 907 |
| Non atteints depuis le client | 136 |
| — dont légitimes : console MCC / admin | 78 |
| — dont **rattachés à aucune surface** | **58** |
| Volume de code jamais rendu | **6 456 lignes de TSX** |

---

## Sous-systèmes entièrement morts

Ce ne sont pas des composants isolés : ce sont des fonctionnalités complètes.

| Dossier | Fichiers morts | Ce que c'est |
|---|---|---|
| `reservations/components/new-reservation/` | **4 / 4** | Parcours de création de réservation (recherche client, détails, en-tête, panneau d'intelligence client) |
| `kitchen/components/recipe-editor/` | **4 / 4** | Éditeur de fiches recette (composition, protocole, analytique, bases) |
| `inventory/components/storage-map/` | **4 / 4** + `detail-bubble/` **3 / 3** | Plan de stockage en glisser-déposer |
| `shared/components/settings/brand-import/` | **3 / 3** | Assistant d'import de charte graphique |
| `marketing/components/marketing/` | **6 / 7** | Cartes de campagne, segments, comptes sociaux, publications programmées |

### Le cas le plus visible pour un client : le plan de stockage

La barre latérale propose **« Plan des Stockages » → `/inventory?tab=storage`**.
L'onglet existe, il est protégé par un `TabGuard`, il est navigable. Mais rien
n'importe les 7 fichiers de `storage-map/`.

Ce que l'onglet affiche à la place : une grille de cartes `nom + type`
(`inventory/page.tsx:192`). Le glisser-déposer d'ingrédients, les cartes de
rangement et les bulles de détail ne sont jamais montés.

Le client voit donc une version dégradée d'une fonctionnalité qui existe.

---

## Composants mal faits

### `CashCounterModal` — à corriger avant tout branchement

Comptage de tiroir-caisse par coupure, avec mode aveugle et calcul d'écart
(188 lignes). Fonctionnalité réelle et utile, mais **quatre défauts** :

1. **Centimes au lieu de microunits.** `expectedAmountInCents`, `¢` dans les logs.
   `CLAUDE.md` l'interdit explicitement : « jamais `*InCents` dans le nouveau code ».
   Le brancher tel quel introduirait un chemin en centimes dans le flux de caisse.
2. **`w-2/3` + `flex` sans variante responsive.** Deux colonnes figées dans un
   `max-w-4xl` (896 px) : inutilisable en dessous, donc sur toute tablette portrait.
3. **`parseInt` sans borne inférieure.** Une quantité négative de billets est
   acceptée et fausse le total compté.
4. **Erreur de validation avalée.** `catch` journalise puis ne montre rien à
   l'utilisateur : le manager ne sait pas que son comptage n'a pas été enregistré.

S'ajoute une question produit : *où* ce comptage s'insère-t-il ? (clôture de
journée, prélèvement, dépôt — le composant gère les trois via sa prop `type`.)
Il est complémentaire de `CashDrawerModal` (226 lignes, monté), qui gère la
*session* de caisse et ne compte aucune coupure.

### Doublons et versions abandonnées

| Composant mort | Remplacé par | Constat |
|---|---|---|
| `pos/components/CategoryList.tsx` | Sélecteur intégré à `PosHeader.tsx:297` | Version antérieure jamais supprimée. **Le changement de catégorie fonctionne** : c'est bien le header qui le porte. |
| `intelligence/ia/fleet/NexusFleetProvider.tsx` | `shared/providers/fleet/NexusFleetProvider.tsx` | Deux providers du même nom, un seul monté. |

### Chaîne de code mort

`StaffPortal.tsx` (mort) importe `PaySlipViewer.tsx` (mort). Du code mort qui en
maintient un autre en vie artificiellement dans les recherches de références.

### Emplacement configurable pour un composant qui ne s'affiche pas

`SupportHelpWidget` n'est référencé que par une **union de types**
(`IVerticalUIPlugin.ts:16`) et une **liste blanche de schéma**
(`tenantUiOverridesSchema.ts:46`). Le système de personnalisation UI l'offre donc
comme emplacement paramétrable par tenant, alors qu'il n'est rendu nulle part.

C'est le même motif que celui déjà relevé sur `FiscalReceiptSealZone` : une
infrastructure de personnalisation construite plus vite que ce qu'elle pilote.

---

## Corrigé dans cette session

| Correctif | Commit |
|---|---|
| Partage d'addition inatteignable + `INV-10` (invariant anti-handler inerte) | `105c24184` |
| Auto-audit NF525 rendu atteignable — onglet sur `/nf525` | `a4a66ef7e` |

`NF525SelfAudit` interroge les sceaux fiscaux, déroule ses contrôles et génère un
PDF d'audit. C'est le document présenté lors d'un contrôle fiscal : il n'était
monté nulle part **ni exporté par aucun barrel**.

---

## Faux positifs écartés

À signaler, parce qu'ils montrent où la méthode se trompe :

- **10 composants `PageShell*`** paraissaient orphelins : ils sont affectés en
  propriétés de namespace (`PageShell.Tab = PageShellTab`) dans le même fichier.
- **`CustomersDirectory`** signalé « avec mocks » par un premier grep : les
  4 occurrences sont des attributs `placeholder=` HTML.
- **Providers `Notifications` / `Settings` / `Theme` / `Tutorial` / `Intelligence` /
  `Floor`** : non montés, mais ce sont des **passe-plats volontaires** vers
  `NexusCore`. Tout fonctionne.
- **`usePlanning`** : le barrel résout vers `useHumanResources`, pas vers le contexte
  qui jetterait une erreur. `PlanningContext.tsx` n'est que 43 lignes de code mort.

---

## À arbitrer

Ces points ne sont pas techniques — ils demandent une décision produit.

- [ ] **Plan de stockage** : brancher les 7 fichiers `storage-map/`, ou assumer la
      grille simple et supprimer le code mort ? *(dossier suivi par une autre session)*
- [ ] **Éditeur de recettes** (4 fichiers) : à brancher ou à supprimer ?
- [ ] **Parcours de nouvelle réservation** (4 fichiers) : idem.
- [ ] **`CashCounterModal`** : corriger les 4 défauts puis brancher où, dans quel flux ?
- [ ] **`onClearCart`** (exception documentée dans `INV-10`) : bouton « Vider le
      panier » avec confirmation ? validation manager ? via `VoidModal` ?
- [ ] **6 456 lignes mortes** : conserver comme réserve, ou nettoyer ? Chaque
      fichier conservé continue d'être compilé, typé, et de peser sur la lecture.

## Reste non trié

- 6 props handler no-op (`leaves` `onView` ×2, `seo` `onEdit` ×2,
  `RecruitmentBoard` `onEdit`, plus une légitime dans `DesktopSidebar`).
- 7 blocs `catch {}` strictement vides et 22 ne contenant qu'un commentaire.
  Certains sont légitimes (quota de stockage dépassé), d'autres avalent peut-être
  de vraies erreurs. À lire un par un — aucun jugement porté ici.
