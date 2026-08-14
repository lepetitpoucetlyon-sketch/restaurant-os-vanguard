# Audit UI — Base solide pour la refonte
> Mesuré sur `agent/antigravity-exec` — 2026-08-14

---

## Verdict global

| Axe | État |
|-----|------|
| Architecture RSC / Client boundary | 🔴 **CASSÉ** — toute l'app est forcée client |
| Error boundaries | 🔴 **ABSENT** — 0 `error.tsx` dans tout l'arbre |
| Streaming / Suspense | 🔴 **ABSENT** — 6 Suspense pour 332 routes |
| Re-renders Jotai | 🟠 **RISQUÉ** — `useAtom` partout, 0 `splitAtom` |
| React.memo | 🟠 **QUASI-ABSENT** — 1 memo dans modules/, 0 dans design/ |
| Images | 🟠 **MIXTE** — 19 `<img>` brutes sur 25 `<Image>` Next.js |
| Design tokens / hardcoded colors | 🟡 **DETTE** — 105 hex hardcodés dans modules/ |
| Bundle / dynamic imports | 🟡 **INSUFFISANT** — 25 dynamic imports, framer-motion non splitté |
| Scroll mobile | 🟡 **ABSENT** — 0 `overscroll-behavior` sur 65 scrollables |
| CSS globals | 🟡 **LOURD** — 1 125 lignes, à purger avant refonte |
| Dark mode tokens | 🟢 OK — CSS variables + `[data-theme]` en place |
| Fonts | 🟢 OK — `next/font/google` (pas de flash) |
| Gate TSC / cycles / barrel | 🟢 OK |

---

## P0 — Bloquants absolus (à corriger AVANT de toucher la moindre UI)

### P0-1 · `NexusProviderStack` force l'app entière en Client Component

**Fichier** : `src/design/layout/NexusProviderStack.tsx:2`

`NexusProviderStack` a `"use client"` et est rendu dans `src/app/layout.tsx` — le root layout. Résultat : React ne peut jamais exécuter de Server Component en dessous. Les 332 routes rechargent tout leur arbre côté client à chaque navigation. Le streaming RSC est inopérant.

**Chiffre** : 12 providers imbriqués à la racine.

**Fix** : extraire la logique interactive (AuthGate, RoleGate, BrandingProvider) dans un `<ClientShell>` qui reste `use client`, mais envelopper les providers purement serveur (NexusCoreProvider si possible, metadata, i18n) dans le layout sans directive. Objectif : remonter la Client Boundary au plus haut niveau **vraiment** interactif.

---

### P0-2 · 0 `error.tsx` dans tout l'arbre Next.js

**Chemin** : `src/app/**/error.tsx` → **0 fichier trouvé**

Toute exception non catchée dans un composant fait crasher la page entière jusqu'au root layout. En production : écran blanc ou "Application Error" non brandé. Next.js App Router résout automatiquement les `error.tsx` colocalisés — il suffit de les créer par segment critique.

**Segments prioritaires à couvrir** :
- `src/app/(client)/(ops)/pos/error.tsx` — le POS ne doit JAMAIS crasher
- `src/app/(client)/(ops)/kds/error.tsx`
- `src/app/(client)/(ops)/floor-plan/error.tsx`
- `src/app/(admin)/error.tsx`
- `src/app/error.tsx` (fallback global)

**Fix** : 5 fichiers `error.tsx` minimalistes (bouton "Recharger", message non technique).

---

### P0-3 · 6 `<Suspense>` pour 332 routes — zéro streaming

**Mesure** : `grep -rn "<Suspense"` → **6 occurrences**, toutes dans `src/app/layout.tsx`.

Chaque page attend que toutes les données soient résolues avant d'afficher quoi que ce soit. Sur connexion lente ou Firestore cold start, l'utilisateur voit un écran blanc. Le `<Suspense fallback>` au root ne compte pas — il ne joue que sur la navigation initiale.

**Fix** : envelopper chaque composant qui fetch dans son propre `<Suspense fallback={<Skeleton />}>`. Minimum viables avant refonte : POS, KDS, Dashboard analytique, liste des commandes.

---

### P0-4 · `src/app/(admin)/layout.tsx` avec `"use client"`

L'admin layout force tout le sous-arbre `/admin/**` en mode client. Aucun segment de l'admin (y compris les pages statiques type `blueprint`, `settings`) ne peut bénéficier du rendering serveur.

**Fix** : retirer `"use client"` du layout admin. Identifier les 2-3 comportements qui le nécessitent et les extraire dans un composant fils `<AdminClientShell>`.

---

## P1 — Bugs silencieux (causes de lag et de pertes de données après la refonte)

### P1-1 · `useAtom` partout → re-renders en lecture ET en écriture

**Mesure** : `useAtom` (read+write) = **129 usages** dans modules/components.

`useAtom` souscrit le composant aux deux canaux : lecture ET écriture. Un composant qui n'a besoin que d'une valeur (ex : `CRMDetailView` lit `crmSelectedCRMAtom`) devrait utiliser `useAtomValue`. Un composant qui n'écrit jamais (ex : affichage KDS) utilise `useAtom` et re-render quand n'importe quel autre writer met à jour l'atom.

**Cas critiques** :
- `ProductGrid` (POS) : `useAtom(posSelectedProductAtom)` + `useAtom(posSearchQueryAtom)` → re-render à chaque keystroke du champ recherche
- `CRMSidebar` : 3× `useAtom` pour des états de filtre → re-render global à chaque changement de filtre
- `TimeclockDashboard` : `useAtom(activeTenantIdAtom)` alors qu'il ne l'écrit jamais

**Fix** : passer systématiquement à `useAtomValue` pour les lectures pures, `useSetAtom` pour les écritures pures. Réserver `useAtom` aux cas où le composant lit ET écrit le même atom.

---

### P1-2 · `ordersAtom` et `tablesAtom` = tableaux entiers sans granularité

**Fichier** : `src/store/pillars/ops.ts:17-23`

`createProxyDomain<Order>('orders')` retourne un atom contenant `Order[]`. Chaque composant abonné (`pendingOrdersAtom`, `availableTablesAtom`, etc.) re-render quand **une** commande change — même si ce composant affiche une table qui n'a rien à voir avec la commande modifiée.

Le KDS qui écoute `pendingOrdersAtom` (dérivé de `ordersAtom`) re-render à chaque mise à jour POS, même si la commande modifiée est déjà en cuisine.

**Fix** : `splitAtom` de Jotai (`import { splitAtom } from 'jotai/utils'`) pour que chaque item ait son propre atom. Chaque card KDS souscrit seulement à son `orderAtom[id]`.

---

### P1-3 · 1 seul `React.memo` dans modules/, 0 dans design/

Les composants feuilles sans memo re-render à chaque render parent, indépendamment du changement de leurs props. Dans un contexte haute fréquence (POS, KDS, Floor Plan), c'est catastrophique.

**Candidats prioritaires** :
- `ProductGrid` — re-render à chaque update du cart
- `StatCard` (design/ui/) — rendu dans des dashboards avec polling
- `TableChairs` / `ZoneRenderer` (floor-plan) — rendu pour chaque table à chaque événement
- `KDS cards` — re-render à chaque nouvelle commande même si la card n'a pas changé

**Fix** : `export default React.memo(ProductGrid)` + s'assurer que les props passées sont stables (pas de fonctions créées inline, pas d'objets littéraux `{}`).

---

### P1-4 · 19 balises `<img>` brutes dans modules/ et design/

**Mesure** : 14 dans modules/ + 5 dans design/ = **19 `<img>` brutes**, 6 `<Image>` Next.js seulement.

Les `<img>` brutes : pas de lazy loading natif Next.js, pas de conversion WebP automatique, pas de `sizes` responsive, pas de `blur placeholder`. Sur mobile 4G, chaque image non optimisée peut ajouter 200-500ms.

**Fix** : remplacer par `import Image from 'next/image'` avec `fill` ou `width/height` explicites. Ajouter `placeholder="blur"` sur les images produit.

---

## P2 — Dettes qui ralentiront (ou casseront) la refonte

### P2-1 · 513 `"use client"` au total (125 app/ + 251 modules/ + 137 design/)

La Client Boundary est poussée trop haut. Dans les bonnes pratiques Next.js App Router, `"use client"` doit être sur les composants qui utilisent `useState`, `useEffect`, event handlers — pas sur les pages ou les layouts qui ne font qu'assembler.

**Cible raisonnable après refonte** : ~80 dans design/ui/ (composants interactifs purs), ~60 dans modules/ (hooks/stores/formulaires), ~20 dans app/ (pages vraiment interactives).

---

### P2-2 · 105 couleurs hex hardcodées dans modules/components

**Top fichiers** :
- `FloorPlanEditor.tsx`, `ZoneRenderer.tsx`, `TableChairs.tsx` — plan de salle
- `SimulationDashboard.tsx`, `SimulatorMetricsGrid.tsx` — intelligence
- `BasketAnalysis.tsx`, `CRMSidebar.tsx` — commerce
- `DigitalSignature.tsx` — compliance

Ces couleurs ne répondent pas aux changements de branding tenant, au dark mode, ni aux variables CSS du design system. Sur une refonte, chacune doit être tracée et remplacée manuellement.

**Fix avant refonte** : rechercher `/#[0-9A-Fa-f]{6}/` dans modules/ et remplacer par les tokens CSS (`var(--surface-card)`, `var(--text-secondary)`, `var(--action-primary)`, etc.).

---

### P2-3 · 0 `loading.tsx` par route (seulement root)

Seul `src/app/loading.tsx` existe. Aucune route n'a son propre état de chargement. Sur navigation directe vers `/pos` ou `/kds`, le root loading s'affiche pendant que TOUT le bundle de la route charge — l'utilisateur voit un spinner générique au lieu d'un skeleton ciblé.

**Minimum viables** :
```
src/app/(client)/(ops)/pos/loading.tsx
src/app/(client)/(ops)/kds/loading.tsx
src/app/(client)/(ops)/floor-plan/loading.tsx
src/app/(client)/(ops)/inventory/loading.tsx
```

---

### P2-4 · Framer Motion dans 10+ composants design/ui/ sans dynamic import

**Fichiers concernés** : `BottomSheet`, `GlassCard`, `ToolbarTabs`, `PageHeader`, `FilterBar`, `PremiumCard`, `StatCard`, `NotificationPanel`, `QuantitySelector`, `TimePicker`

Framer Motion pèse ~30KB gzippé. Sans `dynamic(() => import('framer-motion'), { ssr: false })`, il s'ajoute au bundle initial de chaque page qui importe l'un de ces composants.

**Fix** : soit wrapper les animations dans `dynamic()`, soit migrer les animations simples (fade, slide) vers des classes CSS Tailwind (`transition-opacity`, `animate-in`, `slide-in-from-bottom`) et réserver Framer Motion aux animations complexes.

---

### P2-5 · 0 `overscroll-behavior` sur 65 conteneurs scrollables

**Mesure** : 65 occurrences `overflow-y-auto / overflow-auto / overflow-scroll` dans modules/.

Sans `overscroll-behavior: contain`, faire défiler une liste (menu POS, liste commandes KDS, grille inventaire) fait rebondir la page entière sur iOS et défiler les couches parentes sur Android. Invisible en desktop, catastrophique sur tablette/mobile.

**Fix global** : ajouter dans `globals.css` :
```css
[data-scroll-contain] { overscroll-behavior: contain; }
```
Et appliquer `data-scroll-contain` sur tous les scrollables. Ou cibler les classes directement :
```css
.overflow-y-auto, .overflow-auto { overscroll-behavior: contain; }
```

---

## P3 — Hygiène pour repartir propre

### P3-1 · `globals.css` à 1 125 lignes

Avant la refonte UI, auditer et purger `globals.css`. Une CSS file de 1 125 lignes sur un projet utilisant Tailwind v4 contient presque certainement : des utilitaires qui dupliquent Tailwind, des sélecteurs orphelins, des variables redondantes avec celles de `globals.css @theme`, des règles dark mode conflictuelles.

**Action** : passer PurgeCSS ou identifier manuellement les classes non utilisées. Objectif : < 300 lignes de CSS custom, le reste géré par Tailwind.

---

### P3-2 · Seuls 2 hints GPU compositing pour les animations

**Mesure** : `will-change` / `transform-gpu` — **2 occurrences** dans tout le projet.

Les 10+ composants Framer Motion animent sur le main thread JavaScript. Sans `will-change: transform` ou `transform: translateZ(0)` sur le conteneur animé, le browser ne peut pas créer de couche composite — l'animation déclenche layout + paint à chaque frame.

**Fix** : sur les composants Framer Motion (BottomSheet, PageHeader, GlassCard), ajouter `style={{ willChange: 'transform' }}` sur le `motion.div` principal.

---

### P3-3 · `DocumentationPortal.tsx` à 19.4KB — god file UI

Un composant UI unique à 19.4KB. À refactoriser avant la refonte (extraire sous-sections, lazy-loader les sections non visibles).

---

### P3-4 · `useAtomValue` → 0 usage de `atomFamily` ni `splitAtom`

Aucune utilisation de `atomFamily` ou `splitAtom` (Jotai utils) dans le projet. Ces patterns permettent une granularité par-item sans restructurer les stores. À introduire sur `ordersAtom` et `tablesAtom` avant le refonte pour éviter de ré-écrire les composants KDS/POS deux fois.

---

## Ordre de correction recommandé

```
Semaine 1 — Fondations RSC
  ✦ P0-1 : extraire NexusProviderStack → ClientShell (4-6h)
  ✦ P0-4 : retirer use client du layout admin (1-2h)
  ✦ P0-3 : ajouter Suspense sur POS, KDS, Dashboard (2h)
  ✦ P0-2 : créer 5 error.tsx critiques (1h)

Semaine 2 — Re-renders & State
  ✦ P1-1 : useAtom → useAtomValue/useSetAtom (4h, scriptable)
  ✦ P1-3 : React.memo sur ProductGrid, StatCard, TableChairs (2h)
  ✦ P1-2 : splitAtom sur ordersAtom / tablesAtom (4h)

Semaine 3 — Bundle & Assets
  ✦ P2-3 : 4 loading.tsx (1h)
  ✦ P2-4 : dynamic import framer-motion (2h)
  ✦ P1-4 : img → Image (2h)
  ✦ P2-5 : overscroll-behavior global (30min)

Avant lancement refonte
  ✦ P2-2 : purge hex hardcodés modules/ (4h)
  ✦ P3-1 : audit globals.css (2h)
  ✦ P2-1 : réduire use client 513 → ~160 (chantier continu)
```

---

## Ce qui est déjà bon (à ne pas casser pendant la refonte)

- **Design tokens CSS** : variables bien nommées, Tailwind v4 @theme correctement câblé, dark mode via `[data-theme]` + `prefers-color-scheme` — **préserver cette structure**
- **Fonts** : `next/font/google` avec variable CSS → pas de FOUT, pas de layout shift — **ne pas passer à `@import` Google Fonts**
- **Barrel design/ui/** : `src/design/ui/index.ts` propre, tous les composants exportés depuis un point unique — **continuer ce pattern pour les nouveaux composants**
- **Atoms dérivés** : `orderStatsAtom`, `availableTablesAtom` en tant qu'atoms Jotai dérivés (pas de calcul en rendu) — **bon pattern, continuer**
- **MCC tabs** : déjà tous en `dynamic()` — **modèle à répliquer pour les tabs client**
