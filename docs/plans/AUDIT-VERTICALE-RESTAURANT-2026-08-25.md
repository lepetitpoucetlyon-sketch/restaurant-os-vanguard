# Audit complet — Verticale Restaurant

> Réalisé le **2026-08-25** · ground truth mesuré sur `main@a31821a0d`
> Périmètre : verticale restaurant, gestion MCC (ref/test/demo), couches généralistes,
> design system, structure UI, promesse de customisation.
> Méthode : chaque affirmation provient d'une commande exécutée. Aucun chiffre recopié (Loi 7).

---

## 1. Verdict par axe

| Axe | Verdict | Résumé |
|---|---|---|
| **A — La verticale elle-même** | 🟢 **Solide** | 19 fichiers, 652 lignes, précision L3, 9 adapters, 4 routes, testée |
| **B — Gestion MCC (ref/test/demo)** | 🟢 **Très solide** | 36 tenants système, protection `_ref_` appliquée **dans le guard**, pas seulement déclarée |
| **C — Couches généralistes** | 🟠 **Mitigé** | Mécanismes présents, **adoption absente** — 4 verticales afficheront des libellés restaurant |
| **D — Design system & UI** | 🟢 **Bon** | 48 primitives, **0 duplication**, cascade 3 étages — 3 défauts de rangement mineurs |
| **E — Promesse « custom »** | 🔴 **Non tenue** | Infrastructure complète et testée, mais **5 briques sur 6 ont 0 consommateur** |

**Le fil rouge de cet audit : ce projet ne souffre pas d'un défaut de conception, mais d'un
défaut de branchement.** Les mécanismes sont bien pensés, souvent testés — et pas câblés.

---

## 2. Axe A — La verticale restaurant

### 2.1 Ce qui existe

```
src/verticals/restaurant/   19 fichiers · 652 lignes
├── RestaurantVertical.ts          234 l  — plugin principal
├── restaurant.blueprint.ts        111 l  — blueprint déclaratif (precision: 'L3')
├── presentation/
│   └── MenuEngineeringDashboard.tsx  87 l  — seule UI propre à la verticale
├── domain/types.ts                 77 l
├── adapters/                       9 adapters (1 par pilier + MCC)
├── ops/index.ts · finance/index.ts · finance/nf525/index.ts
└── ui.ts                           16 l  — IVerticalUIPlugin
```

### 2.2 Points forts vérifiés

**Enregistrement paresseux propre** — `VerticalRegistry.ts:43` :
```typescript
import('@/verticals/restaurant').then(m => VerticalRegistry.register('restaurant', () => new m.RestaurantVertical()))
```

**4 routes déclarées** avec RBAC par rôle, toutes en `componentLoader` dynamique :
`/menu-engineering` · `/floor-plan` · `/nf525` · `/suppliers`

**`ui.ts` exemplaire** — la verticale n'override aucun composant et se contente de tokens
scopés par route :
```typescript
scopedTokens: {
  '/pos': { '--radius-card': '1rem', '--radius-btn': '0.75rem' },  // coins nets, fluidité tactile
  '/kds': { '--radius-card': '0.5rem' },
}
```
C'est exactement l'usage prévu du mécanisme : personnaliser sans forker.

**10 capacités activées** dans le blueprint : `mod_floor_plan`, `mod_kds`,
`mod_kitchen_management`, `mod_haccp`, `mod_hygiene`, `mod_quality_control`,
`mod_inventory`, `mod_storage_map`, `mod_reservations`, `mod_marketing` (`mod_pms: false`).

**Couverture de tests réelle :**
`verticals/restaurantAdapters.test.ts` · `handlers/restaurant-vertical.test.ts` ·
`onboarding/RestaurantOnboardingMaster.test.ts` · plus 20 fichiers dans `__tests__/verticals/`.

### 2.3 Observation

La verticale est **volontairement mince** (652 lignes) : elle configure et branche, elle
n'implémente pas. Toute la logique métier vit dans les 8 piliers. C'est le bon design — et
c'est ce qui rend les 12 verticales soutenables (11 687 lignes au total, 3,6 % du codebase).

**Aucune action requise sur cet axe.**

---

## 3. Axe B — Gestion MCC : tenants `_ref_` / `_test_` / `_demo_`

### 3.1 Ce qui existe

`src/lib/mcc/SystemTenantRegistry.ts` déclare **12 variantes × 3 niveaux = 36 tenants système** :

| Niveau | Rôle | Règle d'écriture |
|---|---|---|
| `_demo_<v>` | Vitrine prospect | Simulacra Mode — lecture seule |
| `_test_<v>` | Bac à sable dev | Écriture libre, reset à la demande |
| `_ref_<v>` | Maître clonable | **Écriture bloquée**, promotion via MCC uniquement |

### 3.2 Le point fort décisif : la protection est appliquée, pas déclarée

`SovereignGuard.ts:250` :
```typescript
if (pathTenantId && isSystemTenant(pathTenantId) && !isWritable(pathTenantId)) { … }
```

**C'est la vraie barrière, au niveau du guard souverain** — pas une convention de nommage
qu'un développeur pourrait contourner. Un `_ref_restaurant` ne peut pas être écrit
accidentellement, quel que soit le chemin d'appel.

### 3.3 Surface de gestion

```
src/lib/mcc/
├── SystemTenantRegistry.ts     — les 36 tenants + helpers
├── provisioning/
│   ├── TenantProvisioningService.ts  16,8 Ko
│   └── steps/provisioningSteps.ts
├── ChangelogService.ts · PublicAccessConfig.ts
├── audit/ · fiscal/ · fleet/ · vault/ · devMode.ts
```

**Routes API opérationnelles :** `system-tenants/reset-test` · `system-tenants/reset-demo` ·
`system-tenants/promote` · `tenants/scrape-charter` · `fleet/devices` · `reseller/commissions`

### 3.4 Écart relevé

Le `TenantSeeder` amorce bien la chaîne fiscale (`fiscalSeals/GENESIS`), le plan comptable
PCG, l'admin avec PIN hashé et le plan de salle — mais **rien ne prouve que les 36 tenants
système sont effectivement provisionnés** aujourd'hui. Le registre les déclare ; le seeding
est une opération manuelle (`scripts/bootstrap-system-tenants.ts`).

**Action B-1 :** vérifier/provisionner au minimum `_ref_restaurant`, `_test_restaurant`,
`_demo_restaurant` avant toute démo commerciale, et exposer leur état dans `docs/HEALTH.md`.

---

## 4. Axe C — Couches généralistes : la dé-teinture

C'est l'axe le plus contrasté : **les mécanismes de généralisation existent tous, aucun n'est
consommé.**

### 4.1 Le lexique par verticale — construit, jamais appelé

`src/shared/plugins/IVerticalLexicon.ts` définit 6 termes métier universels :

```typescript
tableLabel     // Resto: "Table"        · Garage: "Pont Élévateur" · Salon: "Fauteuil"
recipeLabel    // Resto: "Recette"      · Garage: "Forfait Réparation"
staffLabel     // Resto: "Serveur"      · Garage: "Mécanicien"
ticketLabel    // Resto: "Ticket KDS"   · Garage: "Ordre de Réparation"
itemLabel      // Resto: "Ingrédient"   · Garage: "Pièce Auto"
customerLabel  // Resto: "Convive"      · Clinic: "Patient"
```

Le hook `src/shared/hooks/useLexicon.ts` le résout correctement par variante.

> 🔴 **`useLexicon()` est appelé par 0 fichier `.tsx`.**
> Toute cette couche est du code mort. Un garage voit « Table », « Recette », « Serveur ».

### 4.2 Les overrides de navigation — 7 verticales sur 11

`navConfig.ts` possède bien un système d'override de libellés par variante, et il est
soigné là où il existe :

```
clinic     → operations: 'Consultations & Caisse' · pos: 'Encaissement Actes CCAM'
salon      → operations: 'Salon & Prestations'    · floor_plan: 'Plan Fauteuils & Bacs'
gym        → operations: 'Club & Membres'         · pos: 'Caisse & Forfaits'
coworking  → operations: 'Espaces & Réservations' · floor_plan: 'Plan Bureaux & Salles'
garage · veterinary · florist → présents
```

> 🔴 **Manquants : `hotel`, `bakery`, `retail`, `custom`.**
> Ces 4 verticales afficheront les libellés restaurant par défaut :
> « Cuisine & Production », « Éditeur de Carte », « Gestion Cuisine ».

### 4.3 Teinture résiduelle dans les contrats partagés

| Fichier | Teinture | Impact |
|---|---|---|
| `shared/nexus/contracts/settings.defaults.ts` | Templates SMS en dur : *« votre **table** pour {couverts} pers. chez {restaurant} »* (×2 blocs, 10 occurrences) | 🔴 Un salon envoie « votre table pour 2 pers. » à sa cliente |
| `shared/nexus/contracts/common.types.ts:94` | `restaurant: { cuisineTypes: string[]; priceRange: string }` | 🟠 Champ métier restaurant dans les types universels |
| `shared/nexus/contracts/permissions.types.ts:65` | `'change_table' \| 'merge_tables' \| 'split_bill'` | 🟠 Permissions POS restaurant dans les contrats partagés |
| `config/navConfig.ts:131` | Section MCC intitulée `'Flotte Restaurants'` | 🟢 Visible super_admin uniquement — cosmétique |

**Vérification faite :** ces templates SMS ne sont variabilisés **nulle part** —
0 occurrence de `confirmationMessage` dans `src/verticals/` ou `src/shared/seeds/`.

### 4.4 Ce qui a été bien fait

`shared/nexus/contracts/ops.types.ts` expose déjà des **alias universels** au-dessus des
termes restaurant :
```typescript
export type Space       = …Table;
export type SpaceStatus = …TableStatus;
export type SpaceShape  = …TableShape;
```
La généralisation est **amorcée au niveau des types**. Elle n'est simplement pas descendue
jusqu'à l'affichage.

---

## 5. Axe D — Design system & structure UI

### 5.1 Le point fort majeur : zéro duplication

Recherche exhaustive de primitives redéfinies hors du design system
(`Button`, `Card`, `Modal`, `Badge`, `Input`, `Select`, `StatCard`, `EmptyState`)
dans `src/modules/` et `src/app/` :

> **0 résultat.** Aucune primitive n'est réimplémentée localement.

Sur un codebase de 326 000 lignes largement produit par des agents, c'est remarquable —
c'est en général le premier endroit où la discipline cède.

### 5.2 Inventaire

| Couche | Contenu |
|---|---|
| `shared/components/ui/` | **48 fichiers** — primitives du design system |
| `shared/nexus/tokens/` | `colors` · `semantic` · `brand` · `uxProfile` · `themeAtoms` · `assets` |
| `shared/nexus/tokens/verticals/` | **12 fichiers** (un par variante) + `presets.ts` (6,3 Ko) |
| `shared/components/` | 12 sous-dossiers thématiques : `ai` `atomic` `biometrics` `blueprint` `dev` `dynamic` `fleet` `layout` `rbac` `settings` `support` `ui` |

**Répartition des composants :** `modules/*/components` 343 · `shared/components` 177 ·
`app/` 113. Cette répartition est **saine** : les composants métier vivent dans leur pilier,
les primitives dans le design system.

### 5.3 Cascade de résolution UI — 3 étages, testée

`shared/plugins/resolveUI.ts` :
```
1. Override TENANT     (TenantUiOverrides.components[slot])
2. Override VERTICALE  (IVerticalUIPlugin.components[slot])
3. Défaut partagé      (le composant bundled)
```
Fonction pure, registry injecté en argument, couverte par `p4-custom-ui-cascade.test.ts`.
**C'est du bon travail d'architecture.**

### 5.4 Trois défauts de rangement (mineurs mais réels)

**D-1 — Deux conventions de nommage cohabitent dans `ui/`**
```
PascalCase (37) : ActionBar.tsx  Modal.tsx  PageShell.tsx  StatCard.tsx …
lowercase  (11) : avatar.tsx  badge.tsx  button.tsx  card.tsx  chip.tsx
                  input.tsx  scroll-area.tsx  select.tsx  spinner.tsx …
```
Les 11 en minuscules sont les primitives d'origine shadcn ; les 37 en PascalCase sont
maison. Cohabitation historique compréhensible, mais coûteuse : on ne sait pas quelle
casse utiliser sans lister le dossier.

**D-2 — `shared/components/atomic/` contient 2 orphelins**
`GlassInput.tsx` et `GoldSwitch.tsx` — ce sont des primitives de design system qui
devraient être dans `ui/`. Un dossier à 2 fichiers qui duplique l'intention de `ui/`.

**D-3 — 9 fichiers `.tsx` en vrac à la racine de `shared/components/`**
dont `DocumentationPortal.tsx` (**19,4 Ko**) — le plus gros composant du projet, sans
dossier. À côté de `AlertSync`, `ErrorBoundary`, `InstallPrompt`, `SplashScreen`…

---

## 6. Axe E — La promesse « custom » : infrastructure sans adoption

C'est le constat le plus important de cet audit.

### 6.1 Ce qui a été construit

| Brique | Emplacement | État |
|---|---|---|
| Cascade UI 3 étages | `shared/plugins/resolveUI.ts` | ✅ testée |
| Schéma d'overrides tenant | `shared/plugins/tenantUiOverridesSchema.ts` | ✅ existe |
| Registry UI par verticale | `shared/plugins/VerticalUIRegistry.ts` | ✅ existe |
| Champs personnalisés (EAV) | `shared/custom-fields/` (types 8,9 Ko + renderer 9,2 Ko) | ✅ existe |
| Grille de widgets | `shared/widgets/DashboardWidgetGrid.tsx` | ✅ existe |
| Layout builder dynamique | `shared/layout-builder/DynamicLayoutRenderer.tsx` | ✅ existe |
| 32 presets de thème | `shared/components/settings/PresetSelector.tsx` | ✅ existe |
| Tokens par verticale | `shared/nexus/tokens/verticals/` ×12 | ✅ **utilisés** |

### 6.2 Ce qui est réellement câblé

Mesure du nombre de fichiers `.tsx` qui **importent et rendent** chaque brique
(hors définition et hors ré-export de barrel) :

| Brique | Consommateurs |
|---|---|
| `PresetSelector` | **1** |
| `DashboardWidgetGrid` | **0** |
| `CustomFieldRenderer` | **0** |
| `DynamicLayoutRenderer` (layout-builder) | **0** |
| `CelebrationParticles` | **0** |
| `FiscalReceiptSealZone` | **0** |

Vérification approfondie : ces composants apparaissent uniquement dans les `index.ts` de
barrel (`shared/components/ui/index.ts:58-59`, `shared/widgets/index.ts:6`,
`shared/custom-fields/index.ts:23`). **Exportés, jamais rendus.**

### 6.3 Le cas `FiscalReceiptSealZone`

Celui-ci mérite d'être isolé : c'est un composant **fiscal**, décrit dans
`shared/layout-builder/types.ts:8` comme un slot `locked: true` — c'est-à-dire un élément
que le layout builder ne doit jamais permettre de retirer.

Il a **0 consommateur**. Le slot verrouillé protège un composant qui n'est affiché nulle part.

### 6.4 Le pattern systémique

Cet audit retrouve exactement la signature déjà identifiée sur l'i18n :

| Brique | Infrastructure | Adoption |
|---|---|---|
| i18n (`t()`) | ✅ complète, 5 locales, 482 clés | **33 / 902 fichiers** (3,6 %) |
| Lexique verticale | ✅ complet, 6 termes × N variantes | **0 composant** |
| Champs personnalisés | ✅ moteur EAV + renderer | **0 composant** |
| Widgets / layout builder | ✅ grille + renderer dynamique | **0 composant** |

> **Le projet construit des mécanismes de personnalisation plus vite qu'il ne les branche.**
> Ce n'est pas un problème de qualité de code — chaque brique est propre et souvent testée.
> C'est un problème de **dernier kilomètre** : la valeur ne se matérialise qu'au branchement.

---

## 7. Plan d'action

### Principe de priorisation

Aucun de ces chantiers ne bloque un **premier client restaurant francophone** — la verticale
restaurant est le chemin par défaut, non teinté, et fonctionne. Ils conditionnent la
**deuxième verticale vendue** et la crédibilité de la promesse multi-métier.

---

### 🔴 Lot 1 — Réparer la promesse multi-verticale *(bloquant pour vendre un non-restaurant)*

**1.1 — Compléter les 4 overrides nav manquants** · *1 session*
Ajouter `hotel`, `bakery`, `retail`, `custom` dans `navConfig.ts` sur le modèle des 7 existants.
*Critère :* un test qui échoue si une variante de `PLATFORM_VARIANTS` (hors `restaurant`)
n'a pas d'entrée d'override.

**1.2 — Variabiliser les templates SMS** · *1 session*
Sortir `confirmationMessage` / `reminderMessage` / `cancellationMessage` de
`settings.defaults.ts` vers le blueprint de chaque verticale (ou un défaut résolu par
`resolveDNA(variant)`).
*Critère :* 0 occurrence de « table » / « couverts » dans `shared/nexus/contracts/`.

**1.3 — Brancher `useLexicon()`** · *2-3 sessions*
Commencer par les 6 écrans les plus exposés (POS, KDS, plan de salle, réservations,
CRM, inventaire) et remplacer les libellés en dur par `lexicon.tableLabel` etc.
*Critère :* passer de 0 à ≥ 20 composants consommateurs, mesuré dans `HEALTH.md`.

---

### 🟠 Lot 2 — Décider du sort des briques non câblées *(dette de surface)*

**2.1 — Trancher, brique par brique** · *1 session de décision*

| Brique | Question | Recommandation |
|---|---|---|
| `FiscalReceiptSealZone` | Devait-il être sur le ticket ? | **Brancher** — c'est un composant fiscal |
| `CustomFieldRenderer` | Un client a-t-il demandé des champs libres ? | Brancher **ou** supprimer |
| `DashboardWidgetGrid` + `DynamicLayoutRenderer` | Le layout builder est-il au roadmap ? | Geler + `README` explicite |
| `CelebrationParticles` | Cosmétique | Brancher **ou** supprimer |

**Règle à poser :** une brique exportée par un barrel sans consommateur depuis > 1 mois
est soit branchée, soit supprimée, soit documentée comme gelée. Sinon elle donne
l'illusion d'une capacité qui n'existe pas.

**2.2 — Garde automatique** · *1 session*
Ajouter à `health-snapshot.sh` un inventaire des exports de barrel à 0 consommateur.
Le rendre visible empêche l'accumulation silencieuse.

---

### 🟢 Lot 3 — Rangement du design system *(cosmétique, sans risque)*

**3.1** — Unifier la casse dans `ui/` : renommer les 11 fichiers minuscules en PascalCase
via `git mv` (préserve l'historique), ou documenter explicitement la règle
« minuscule = primitive shadcn, PascalCase = maison ». *0,5 session*

**3.2** — Déplacer `atomic/GlassInput.tsx` et `atomic/GoldSwitch.tsx` vers `ui/`,
supprimer `atomic/`. *0,5 session*

**3.3** — Ranger les 9 `.tsx` de la racine `shared/components/` dans des sous-dossiers ;
`DocumentationPortal.tsx` (19,4 Ko) mérite le sien. *0,5 session*

---

### 🔵 Lot 4 — MCC : vérifier le provisioning système *(avant démo commerciale)*

**4.1** — Confirmer que `_ref_restaurant`, `_test_restaurant`, `_demo_restaurant` sont
effectivement provisionnés (`scripts/bootstrap-system-tenants.ts`). *0,5 session*

**4.2** — Exposer l'état des tenants système dans `docs/HEALTH.md` (présents / absents).
*0,5 session*

---

## 8. Séquencement recommandé

```
AVANT UN CLIENT RESTAURANT          → rien de cet audit n'est bloquant
                                       (voir plutôt : FISCAL_SIGNING_SECRET + test matériel)

AVANT UNE DÉMO COMMERCIALE          → Lot 4 (provisioning _demo_/_ref_)

AVANT DE VENDRE UNE 2ᵉ VERTICALE    → Lot 1 complet (1.1 → 1.2 → 1.3)

QUAND LA SURFACE DÉRANGE            → Lot 2 puis Lot 3
```

**Effort total : 8-10 sessions**, dont 4-5 pour le seul Lot 1.

---

## 9. Critères de sortie

| Lot | Critère vérifiable |
|---|---|
| 1 | Les 12 variantes ont un override nav · 0 « table/couverts » dans `contracts/` · ≥ 20 consommateurs `useLexicon` |
| 2 | 0 brique exportée sans consommateur ni statut documenté · inventaire dans `HEALTH.md` |
| 3 | Casse unique dans `ui/` · `atomic/` supprimé · racine `shared/components/` vide de `.tsx` |
| 4 | 3 tenants système restaurant provisionnés et visibles dans `HEALTH.md` |

---

## Annexe — Ce que l'audit n'a PAS trouvé

Points vérifiés sans anomalie, listés pour éviter qu'on les ré-audite :

- ✅ **Aucune primitive de design system dupliquée** dans `modules/` ou `app/`
- ✅ **Protection `_ref_` réellement appliquée** dans `SovereignGuard`, pas seulement déclarée
- ✅ **Aucun stub ni TODO** dans les adapters matériels (6 TPE + 6 imprimantes)
- ✅ **`RestaurantVertical` correctement enregistré** et chargé paresseusement
- ✅ **Tokens verticaux présents pour les 12 variantes** — pas d'oubli
- ✅ **Cascade `resolveUI` testée** (`p4-custom-ui-cascade.test.ts`)
- ✅ **Répartition des composants saine** — métier dans les piliers, primitives dans `ui/`

---

*Ground truth établi le 2026-08-25 sur `main@a31821a0d`. Toutes les mesures sont reproductibles.*
