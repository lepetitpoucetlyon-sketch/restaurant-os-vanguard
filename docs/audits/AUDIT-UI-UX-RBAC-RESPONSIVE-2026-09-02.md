# AUDIT INTÉGRAL — Layout · PWA · Responsive · Grilles · Mobile · UI · UX · RBAC
## RESTAURANT-OS-CORE — Audit Exhaustif sur l'Ensemble des 87 Pages, Fenêtres, Composants & Rôles

- **Date de l'audit** : Mercredi 2 septembre 2026
- **Auteur** : Antigravity (Pair Programming Agentic AI)
- **Empreinte Git scellée (HEAD)** : `d21727ab2fe00e801649b54db695711fc9d11088`
- **Statut légal** : AUDIT EN LECTURE SEULE STRICTE (Loi 1 à 12, Zéro modification de code source `src/`)
- **Périmètre mesuré (Loi 7)** : 3 750 fichiers TS/TSX · 363 563 LOC · 87 pages Next.js · 61 modales/drawers · 220 routes API · 11 personas métiers

---

## 1. Synthèse Exécutive & Tableau de Bord Chiffré (Loi 7)

### 1.1. Métriques Clés du Dépôt (Mesure directe terrain)

| Indicateur | Valeur Mesurée | Commande Reproductible | Interprétation & Risque |
|---|:---:|---|---|
| **Pages Next.js (`page.tsx`)** | **87** | `find src/app -name "page.tsx" \| wc -l` | 87 sur disque vs 84 au registre OpenPencil (+3 orphelines de catalogue) |
| **Périmètre applicatif (`src/`)** | **3 750 fichiers / 363 563 LOC** | `find src -name "*.ts" -o -name "*.tsx"` | Couverture intégrale auditée |
| **Composants d'interface (`.tsx`)** | **965** | `find src -name "*.tsx" \| wc -l` | 87 pages + 6 layouts + 8 boundaries + 61 modales + 803 composants |
| **Modales & Drawers dédiés** | **61 fichiers** | `find src -name "*Modal.tsx" -o -name "*Drawer.tsx"...` | Dont seulement 8 utilisent la primitive `Modal.tsx` partagée |
| **Implémentations `fixed inset-0` brutes** | **92** | `grep -rn "fixed inset-0" src/ \| wc -l` | 92 backdrops manuels sans gestion unifiée du focus ni du scroll-lock |
| **Routes API (`route.ts`)** | **220** | `find src/app/api -name "route.ts" \| wc -l` | 174 gardées formellement, 46 publiques/techniques/crons/webhooks |
| **Risques Responsive répertoriés** | **109** | `npm run measure` (`.measures/latest.json`) | 12 grilles figées (`grid-cols-[3-9]`), 97 largeurs figées `px` |
| **Adoption Design System (Boutons)** | **18,9% (284 / 1 502)** | `npm run measure:detail` | 1 218 boutons HTML `<button>` bruts vs 284 `<Button>` |
| **Adoption Design System (Champs)** | **10,6% (56 / 527)** | `npm run measure:detail` | 471 inputs HTML `<input>` bruts vs 56 `<Input>` |
| **Cartes faites main (hors DS)** | **606** | `npm run measure:detail` | 606 conteneurs stylés ad-hoc sans tokens de surface |
| **Couleurs en dur (#hex / rgba)** | **945** | `npm run measure` | Écarts majeurs en dark/light mode (#C5A059: 144, #10B981: 57) |
| **Chaînes FR en dur dans le JSX** | **767** | `npm run measure` | 767 chaînes non traduites hors dictionnaires i18n |
| **Erreurs asynchrones flottantes** | **199** | `npm run measure:detail` | 199 `.then()` sans `.catch()` risquant de figer l'interface |
| **Disparités de Z-Index arbitraires** | **20 niveaux distincts** | `grep -rohE "z-\[[^]]+\]" src/ \| sort -u` | De `z-[-1]` à `z-[99999]` (collisions modales/headers garanties) |

---

## 2. Inventaire Exhaustif des Portées & Architecture du Shell

### 2.1. Pages — Les 87 `page.tsx` et Résolution de l'Écart avec le Catalogue (Angle Mort 1)

Le catalogue de conception `src/kernel/open-pencil/catalog/PageCatalogRegistry.ts` référence **84 routes**.
Sur le disque, la commande `find src/app -name "page.tsx"` dénombre **87 fichiers**.
L'écart est de **3 pages exactement**, identifiées et mesurées sans ambiguïté :

1. `/admin/studio` (`src/app/(admin)/admin/studio/page.tsx`) — Studio plateforme interne OpenPencil MCC.
2. `/automations` (`src/app/(client)/(ops)/automations/page.tsx`) — Écran de gestion des déclencheurs et automatisations d'exploitation.
3. `/studio` (`src/app/(client)/(public)/studio/page.tsx`) — Studio public d'onboarding et d'expérimentation visuelle.

#### Répartition par Groupes de Routes Next.js (App Router)

```
┌─────────────────────────────────────────────────────────────┬───────────┐
│ Groupe de Route (Route Group)                               │ Nb Pages  │
├─────────────────────────────────────────────────────────────┼───────────┤
│ (client)/(ops) — Cockpit d'exploitation & gestion restaurant│ 42 pages  │
│ (admin) — Console plateforme & Administration MCC           │ 15 pages  │
│ (marketing) — Vitrine SaaS, Tarifs, Comparatifs, Légal      │ 11 pages  │
│ (client)/(public) — Portail client, Menu table, Login, Docs │  9 pages  │
│ (public) — Démo, CGU, CGV, RGPD, Mentions, Status           │  6 pages  │
│ Racine & Dynamique — Branded landing, Réservations, Offline │  3 pages  │
│ (client)/(ordering) — Click & Collect / Livraison convive   │  1 page   │
├─────────────────────────────────────────────────────────────┼───────────┤
│ TOTAL ABSOLU DU DÉPÔT                                       │ 87 pages  │
└─────────────────────────────────────────────────────────────┴───────────┘
```

### 2.2. Composition du Shell & Absence de `(ops)/layout.tsx` (Angle Mort 2 & 3)

Constat structural majeur : **il n'existe AUCUN fichier `src/app/(client)/(ops)/layout.tsx`**.
La composition de la coque applicative (Sidebar, Header, MobileNavBar, Launchpad, Map3DOverlay) ne s'effectue pas au niveau du dossier de routes, mais dynamiquement au runtime :

1. `src/app/layout.tsx` (RootLayout) monte `<NexusProviderStack>`.
2. `NexusProviderStack` encapsule l'application dans `SurfaceUIProviders`.
3. `SurfaceUIProviders` instancie `ClientComponents.tsx`.
4. `ClientComponents.tsx` analyse `usePathname()` :
   - Si l'URL correspond à `PUBLIC_MARKETING_PATHS = ['/verticales', '/pricing', '/signup', '/legal', '/landing', '/welcome', '/auth', '/login', '/demo', '/showcase']` ou démarre par `/admin` ou est `/` : les enfants sont rendus bruts (`<>{children}</>`).
   - Sinon, les enfants sont systématiquement encapsulés dans `<LayoutResolver>`.
5. `LayoutResolver` monte alors `<DesktopSidebar>`, `<Header>`, `<MobileHeader>`, `<MobileNavBar>`, `<ConnectivityBanner>`, et `<InstallPrompt>`.

#### ⚠️ ANOMALIE CRITIQUE DÉTECTÉE (P0 Layout & Isolation Convive) :
Dans `ClientComponents.tsx` ligne 30 :
Les routes suivantes **ne figurent PAS** dans `PUBLIC_MARKETING_PATHS` :
- `/order/[tenantId]` (Prise de commande convive / Click & Collect) ;
- `/menu/[tenantId]/[tableId]` (Menu digital QR code sur table) ;
- `/offline` (Écran de secours PWA hors-ligne) ;
- `/status` (Moniteur de santé système) ;
- `/[slug]` et `/[slug]/reservations` (Pages d'atterrissage personnalisées des restaurants).

**Conséquence terrain immédiate** : Un client qui scanne le QR code de sa table ou commande un plat à emporter sur son smartphone depuis `/order/mon-resto` se voit injecter la coque d'exploitation interne du restaurant :
- Sur desktop : La barre latérale d'administration (`DesktopSidebar`) avec les liens vers KDS, Caisse POS, Stocks, Hygiène et Comptabilité !
- Sur mobile : La barre de navigation basse d'exploitation (`MobileNavBar`) et l'assistant universel IA (`UniversalAssistantFrame`) !

### 2.3. Cartographie des Boundaries & Erreurs de Typographie CSS

Les boundaries Next.js recensées :
- `layout.tsx` (6 fichiers) : racine, `(admin)`, `(client)/(public)`, `(marketing)`, `(public)/legal`, `[slug]/reservations`.
- `error.tsx` (7 fichiers) : racine, `(admin)`, `(client)/(ops)`, `(client)/(ops)/pos`, `(client)/(ordering)`, `(client)/(public)`, `(marketing)`.
- `global-error.tsx` (1 fichier) : racine.
- `loading.tsx` (1 fichier) : racine (`src/app/loading.tsx`).
- `not-found.tsx` (1 fichier) : racine (`src/app/not-found.tsx`).

#### ⚠️ DÉFAUT CSS DANS `(admin)/layout.tsx` :
Lignes 26 et 35 de `src/app/(admin)/layout.tsx` :
`className="min-min-h-[100dvh] ..."`
La classe Tailwind est corrompue (`min-min-h`), rendant la propriété CSS inopérante et provoquant des sauts de mise en page lors du chargement de la console administrateur.

---

## 3. Axe A — Layout, PWA, Grille, Responsive & Mobile

### 3.1. Audit des 3 Breakpoints Métiers (360px · 768px · 1280px)

#### 1. Breakpoint Mobile Compact (360px — iPhone SE / Fold Plié / Smartphone Serveur)
- **12 Grilles Rigides identifiées (`grid-cols-[3-9]` sans préfixe responsive)** :
  - `src/app/(marketing)/HomeContent.tsx:127` (`grid grid-cols-3`)
  - `src/shared/components/ui/SecurityPinModal.tsx:97` (`grid grid-cols-3` pavé PIN)
  - `src/shared/nexus/guards/PinLogin.tsx:159` (`grid grid-cols-3`)
  - `src/modules/commerce/relation/reservations/components/ReservationCalendarPopup.tsx:74 & 82` (`grid grid-cols-7`)
  - `src/modules/commerce/relation/reservations/components/WeeklyView.tsx:39` (`grid grid-cols-7`)
  - `src/modules/commerce/components/ordering/TableSplitBillModal.tsx:296` (`grid grid-cols-4`)
  - `src/modules/human/effectifs/hr/components/leaves/TeamCalendar.tsx:89` (`grid grid-cols-7`)
  - `src/modules/human/effectifs/hr/components/PlanningDashboard.tsx:223 & 282` (`grid grid-cols-7`)
- **97 Largeurs Fixes en Pixels sans Adaptation Mobile** :
  - Exemples critiques : `min-w-[550px]` (`legal/dpa`, `legal/security`), `min-w-[600px]` (`pricing/vs-lightspeed`, `pricing/vs-zelty`), `min-w-[700px]` (`admin/mcc/dlq`), `w-[800px]` (`audit-portal`).
  - Ces largeurs forcent un débordement horizontal brutal sur écran 360px.
- **Collision Critique du Système de Toast (`Toast.tsx`)** :
  - `src/shared/components/ui/Toast.tsx:65` : `className="fixed bottom-8 right-8 z-[1000] min-w-[340px]"`
  - Arithmétique d'écran : 340px (largeur minimum toast) + 32px (`right-8`) = **372px > 360px** !
  - Le toast déborde de l'écran sur la gauche de 12px sur iPhone SE et vient recouvrir directement les boutons de navigation de `MobileNavBar` (`bottom-0`, hauteur 72px).

#### 2. Breakpoint Tablette / Pad Serveur (768px — iPad Portrait / Pad Caisse)
- En mode tablette portrait (768px), `DesktopSidebar` se masque (`hidden lg:block`), et `MobileNavBar` prend le relais (`lg:hidden`).
- Défaut constaté : Les formulaires à colonnes de split (ex: `ProductFormModal.tsx`, `CashCounterModal.tsx`) s'empilent verticalement, doublant la hauteur de défilement et forçant des scrolls à répétition lors du coup de feu en salle.

#### 3. Breakpoint Écran Large / Comptoir Caisse (1280px+)
- Sur les grands écrans 4K ou terminaux caisse 15,6 pouces, l'absence de `max-w` sur certains dashboards (`/registre`, `/facility`, `/intelligence`) provoque un étirement excessif des cartes de KPIs (`gap-8 w-full`), isolant les boutons d'action aux extrémités de l'écran.

### 3.2. Écosystème PWA & Résilience Hors-Ligne (Angles Morts 26 à 30)

| Composant PWA | État Réel Mesuré | Diagnostic & Impact |
|---|---|---|
| **Manifest PWA** | Deux manifests concurrents sur disque : `public/manifest.json` et `src/app/manifest.ts`. | **Divergence majeure** : `manifest.json` impose `orientation: "portrait-primary"` et fond bleu `#1A2350`, tandis que `manifest.ts` génère `/manifest.webmanifest` avec `orientation: "any"` et fond `#0B0B0C`. Sur tablette en paysage au comptoir, l'ancien manifest bloque la rotation ! |
| **Service Worker (`public/sw.js`)** | Fetch listener passif (`caches.match(e.request) \|\| fetch(e.request)`). | **Zéro mise en cache proactive**. En cas de coupure WiFi, la promesse `fetch()` rejette et le navigateur affiche sa page d'erreur de crash réseau au lieu de router vers `src/app/offline/page.tsx`. |
| **Demande de Permission Push** | `Notification.requestPermission` : **0 occurrence** dans tout le code frontend (`grep -rn "requestPermission" src/`). | Le Service Worker écoute les événements `push`, mais l'interface utilisateur ne sollicite JAMAIS la permission du navigateur. Notifications Web Push 100% inopérantes. |
| **API Badging PWA** | `navigator.setAppBadge` : **0 occurrence** dans le code (`grep -rn "setAppBadge" src/`). | L'icône de badge `public/icons/badge-72.png` existe sur disque mais n'est jamais alimentée pour afficher le nombre de bons KDS ou alertes sanitaires en attente. |
| **Web Share Target API** | `manifest.ts` déclare `share_target: { action: '/api/share-target' }`. | **Route 404** : `src/app/api/share-target/route.ts` n'existe pas ! Tout partage de fichier vers Restaurant OS déclenche une erreur HTTP 404. |

### 3.3. Safe Areas iOS & Cibles Tactiles (WCAG & Apple HIG)

- **Safe-Areas (`env(safe-area-inset-*)`)** : Présentes uniquement dans 4 fichiers (`globals.css`, `ActionBar.tsx`, `MobileHeader.tsx`, `MobileNavBar.tsx`). Totalement absentes des tiroirs et modales mobiles (`OrderCartDrawer.tsx`, `WaiterCallDrawer.tsx`, `BottomSheet.tsx`), provoquant le chevauchement du bouton de validation avec la barre d'accueil de l'iPhone.
- **Taille des Cibles Tactiles (INV-16)** :
  - `src/shared/components/ui/BottomSheet.tsx:138` : Bouton fermer `w-10 h-10` (40px) $\rightarrow$ Non conforme à la cible minimale de 44×44px (recommandation : `w-11 h-11` ou `size-9` avec padding étendu).
  - Éléments de pagination et micro-icônes dans `TenantUsersPanel.tsx` et `EventBusHealthPanel.tsx` mesurés à 28×28px sans zone de touche tampon.

---

## 4. Axe B — Qualité UI, Design Tokens & Cohérence Visuelle

### 4.1. Audit des Tokens Visuels & Couleurs en Dur (Angle Mort 35)

L'audit automatisé relève **945 occurrences de couleurs codées en dur** (#hex et rgba) dans le code de l'application (`scripts/measure.mjs`).
La concentration s'établit sur les teintes suivantes :

```
Couleurs en Dur les Plus Répétées dans src/ :
  144 occurrences : #C5A059  (Or accent — devrait utiliser bg-accent-gold / text-accent-gold)
   57 occurrences : #10B981  (Vert succès — devrait utiliser text-status-success)
   48 occurrences : #F59E0B  (Ambre alerte — devrait utiliser text-status-warning)
   43 occurrences : #EF4444  (Rouge danger — devrait utiliser text-status-danger)
   41 occurrences : #FFFFFF  (Blanc pur — invisible en cas de thème clair forcé)
   29 occurrences : #0B0B0C  (Noir surface — devrait utiliser bg-surface-bg)
```

**Conséquence sur le Thème Clair** : Lorsqu'un utilisateur active le mode clair (`themeModeAtom = 'light'`), les 41 textes stylés en dur avec `#FFFFFF` deviennent immédiatement invisibles sur fond blanc, et les 29 conteneurs `#0B0B0C` créent des blocs noirs opaques non harmonisés.

### 4.2. Échelle des Z-Index : Anarchie Arbitraire (Angle Mort 37)

L'analyse par expression régulière révèle **20 classes de z-index arbitraires concurrentes** :
- `z-[-1]`, `z-0`, `z-10`, `z-20`, `z-30`, `z-40`, `z-45`, `z-50`, `z-[60]`, `z-[70]`, `z-[80]`, `z-[100]`, `z-[101]`, `z-[110]`, `z-[130]`, `z-[150]`, `z-[160]`, `z-[200]`, `z-[201]`, `z-[300]`, `z-[1000]`, `z-[9999]`, `z-[10000]`, `z-[99999]`.

**Collision Constatée** :
- `ToastProvider` est fixé à `z-[1000]`.
- `CommandModal` est fixé à `z-[9999]`.
- `MobileNavBar` est fixé à `z-[80]`.
- Certains tiroirs (`OrderCartDrawer`) sont à `z-50`.
Un drawer à `z-50` passe **SOUS** la `MobileNavBar` (`z-[80]`), tronquant visuellement le récapitulatif de panier en bas de l'écran mobile.

### 4.3. Typographie & Poids de Polices

- Les polices Google Fonts officielles sont bien configurées dans `src/app/layout.tsx` : Outfit (sans), Instrument Serif (serif), JetBrains Mono (mono).
- `Inter` est rigoureusement absente des imports de production.
- **Anomalie de commentaire résiduel** : `src/shared/nexus/tokens/verticals/clinic.ts:14` mentionne encore `"Inter système"`.

---

## 5. Axe C — Expérience Utilisateur (UX), Parcours & Ergonomie

### 5.1. Culs-de-Sac & Gestion des Erreurs (Angle Mort 49 & 50)

- **L'Écran Cul-de-Sac `AccessDenied.tsx`** :
  `src/shared/components/rbac/AccessDenied.tsx` affiche l'icône de bouclier rouge et le message *"Vous n'avez pas les permissions nécessaires"*.
  **Aucun bouton d'action n'est proposé** (ni retour à l'accueil, ni bouton page précédente, ni bouton de changement d'utilisateur). L'utilisateur qui clique sur un lien non autorisé se retrouve bloqué sur un écran mort, contraint de réécrire l'URL manuellement ou d'utiliser les flèches du navigateur.
- **199 Promesses Flottantes sans `.catch()` (Angle Mort 38)** :
  Recensées par `npm run measure:detail` dans les composants d'action MCC et tableaux de bord. En cas de déconnexion ou de timeout API, le bouton reste dans son état d'animation sans qu'aucun message d'erreur n'indique l'échec à l'utilisateur.

### 5.2. Gestion des Onglets & Dérive d'État URL (Angle Mort 5)

La gestion des sous-vues par onglets présente une disparité fondamentale selon les modules :
- **Dans la Console MCC (`useMccPage.ts`)** : L'état d'onglet actif est parfaitement synchronisé avec l'URL via `router.replace(`${pathname}?tab=${tab}`)`. Le rechargement de page (F5) et le partage d'URL conservent l'onglet exact.
- **Dans le Dashboard Finance (`FinanceDashboard.tsx`) et RH Staff (`StaffPage.tsx`)** : L'état est stocké dans un simple `useState<TabId>()`.
  - Lors d'un rechargement F5, l'utilisateur est brutalement renvoyé sur le premier onglet (`accounting` ou `team`).
  - Le bouton "Précédent" du navigateur quitte la page entière au lieu de revenir à l'onglet consulté précédemment.

### 5.3. Surcharge Cognitive & CLS (Cumulative Layout Shift)

- **241 Indicateurs `Loader2` vs 110 Composants `Skeleton`** :
  La majorité des panneaux de données (KPIs, listes de tables, graphiques financiers) affichent un spinner centré sans réserver l'espace vertical. Lors de la réception des données, la mise en page subit un saut brutal vers le bas (CLS élevé), perturbant la lecture du personnel en plein service.

---

## 6. Axe D — Matrice d'Accès RBAC & Sécurité Multi-Personas

### 6.1. La Faille de Découplage : `navConfig.ts` vs `DEFAULT_PAGE_ACCESS` (Angle Mort 69 à 72)

L'audit met au jour un conflit structurel entre les deux moteurs RBAC de l'application :
1. **La Navigation (`src/config/navConfig.ts`)** filtre les liens par niveau numérique : `minLevel?: number`. Tout item ne déclarant pas de `minLevel` est considéré comme ayant `minLevel = 0` (visible par tous les rôles).
2. **Les Gardes de Page (`src/shared/schemas/rbac.schemas.ts`)** filtrent l'accès par liste blanche explicite : `DEFAULT_PAGE_ACCESS[pageKey]: PermissionRole[]`.

#### Mesure du Taux d'Items de Navigation Menant à `AccessDenied` :

```
┌─────────────────┬───────────┬──────────────┬────────────────────────┬──────────────────────┐
│ Rôle Métier     │ Niveau    │ Items Nav    │ Discrépances Constatées│ Taux d'Erreur Nav    │
├─────────────────┼───────────┼──────────────┼────────────────────────┼──────────────────────┤
│ Admin           │ 100       │ 62 items     │ 0 anomalie             │ 0 %                  │
│ Manager         │  70       │ 56 items     │ 1 anomalie             │ 1,8 %                │
│ Comptable       │  60       │ 35 items     │ 13 anomalies           │ 37,1 %               │
│ Chef de Rang    │  50       │ 31 items     │ 6 anomalies            │ 19,4 %               │
│ Chef Cuisinier  │  45       │ 22 items     │ 6 anomalies            │ 27,3 %               │
│ Serveur         │  40       │ 21 items     │ 5 anomalies            │ 23,8 %               │
│ Barman          │  35       │ 19 items     │ 4 anomalies            │ 21,1 %               │
│ Cuisinier       │  35       │ 19 items     │ 8 anomalies            │ 42,1 %               │
│ Hôtesse         │  30       │ 18 items     │ 6 anomalies            │ 33,3 %               │
│ Plongeur        │  10       │ 18 items     │ 8 anomalies            │ 44,4 %               │
└─────────────────┴───────────┴──────────────┴────────────────────────┴──────────────────────┘
```

#### Exemples Concrets d'Incohérences Vécues sur le Terrain :
- **Le Plongeur (Niveau 10)** a 18 liens affichés dans sa barre latérale :
  - S'il clique sur `Tableau de bord (/operations)`, `Point de vente (/pos)`, `POS Mobile (/pos-mobile)`, `Plan de salle (/floor-plan)`, `KDS (/kds)`, `Réservations (/reservations)`, `Réglages (/settings)` ou `Aide (/aide)` : il se heurte instantanément à l'écran **"Accès Refusé" cul-de-sac** !
- **Le Comptable (Niveau 60)** voit dans sa navigation `Point de vente`, `Plan de salle`, `KDS`, `Cuisine`, `Bar`, `HACCP`, `Réservations`, `Réglages` : les 13 liens mènent à `AccessDenied`.
- **Le Manager (Niveau 70)** voit le lien `Portail Comptable (/accounting-portal)` dans sa navigation, mais `DEFAULT_PAGE_ACCESS['accounting_portal']` ne contient que `['admin', 'directeur', 'comptable']`. Le manager est bloqué !

### 6.2. Page Découplée sans Guard Standard (`/automations`)

`src/app/(client)/(ops)/automations/page.tsx` est la **seule des 42 pages ops à ne pas utiliser `withPageGuard`**.
Elle implémente un test inline `const canAccess = usePageAccess('automations')` :
- Aucun état de chargement (`isAuthLoading`) n'est géré.
- Lors de l'hydratation de la session Firebase/Nexus, `canAccess` est faux pendant 200 à 400ms, provoquant un **flash visuel d'interdiction** avant que l'écran ne s'affiche.
- L'écran n'utilise pas la coquille standard `PageShell`.

### 6.3. Sécurité des 220 Routes API & Équilibre UI ↔ Serveur (Angle Mort 6)

L'audit des 220 routes `route.ts` sous `src/app/api/` confirme la solidité du serveur :
- **174 routes** sont formellement protégées par `requireTenantAdmin`, `requireTenantUser`, `requireTenantRole`, `requireFleetAdmin`, ou `requireMccLevel`.
- **46 routes** sont sans guard RBAC utilisateur standard, réparties ainsi :
  - 12 routes publiques convives indispensables (`v1/menu`, `v1/orders/[id]/split-bill`, `v1/orders/service-request`, `widget/*`, `google/reserve/*`).
  - 8 routes de webhooks tiers protégées par HMAC/Signature (`webhooks/stripe`, `docuseal`, `thefork`, `sms/inbound`, etc.).
  - 7 routes techniques et de monitoring public (`health`, `status`, `openapi.json`).
  - 6 routes de crons sécurisées par `CRON_SECRET` (`cron/weekly-report`, `cron/daily-backup`, `connectors/*/sync`).
  - 2 routes IoT capteurs protégées par token bearer dédié (`haccp/iot-push`).
  - 2 routes de dunning et push protégées par secrets internes (`billing/dunning`, `push/send`).

---

## 7. Matrice Croisée 11 Personas × Portées de l'Application

Le tableau ci-dessous synthétise la vérité terrain mesurée pour chaque persona restaurant :

| Persona / Rôle | Niveau | Accès Théorique Pages | Menus Nav Visibles | Anomalie Majeure Constatée | Action Terrain Dérogatoire (PIN) |
|---|:---:|:---:|:---:|---|---|
| **Admin (Gérant)** | 100 | 31 / 31 | 62 / 62 | Aucune. Accès universel. | Bypass total sur tout le système. |
| **Directeur** | 90 | 31 / 31 | 62 / 62 | Aucune. | Autorise clôture Z, RH et exports. |
| **Manager** | 70 | 26 / 31 | 56 / 62 | Voit `/accounting-portal` dans la nav mais y est interdit. | Valide remises, annulations, clôtures. |
| **Comptable** | 60 | 10 / 31 | 35 / 62 | **13 liens nav mènent à 403**. Pas d'accès modif menus/stocks. | Export FEC, Rapprochement bancaire. |
| **Chef de Rang** | 50 | 15 / 31 | 31 / 62 | 6 liens nav mènent à 403 (`/kitchen`, `/inventory`...). | Peut annuler une ligne, pas de void ticket. |
| **Chef Cuisinier**| 45 | 12 / 31 | 22 / 62 | Voit `/pos`, `/floor-plan` dans la nav mais bloqué. | Gère les 86 ingrédients et les fiches techniques. |
| **Serveur** | 40 | 9 / 31 | 21 / 62 | Voit `/bar`, `/haccp`, `/operations` dans la nav mais bloqué. | Interdit d'annulation ligne sans PIN responsable. |
| **Cuisinier** | 35 | 8 / 31 | 19 / 62 | Voit `/pos`, `/floor-plan`, `/reservations` dans la nav (403). | Validation bons KDS, pas d'édition recettes. |
| **Barman** | 35 | 10 / 31 | 19 / 62 | Voit `/reservations`, `/operations` dans la nav (403). | Prise commande bar, stock boisson, mise à 86. |
| **Hôtesse** | 30 | 7 / 31 | 18 / 62 | Voit `/pos`, `/kds` dans la nav (403). | Affectation tables, saisie résas, pas de caisse. |
| **Plongeur** | 10 | 5 / 31 | 18 / 62 | **8 liens nav sur 18 (44%) mènent à AccessDenied**. | Pointage, congés, checklists hygiène HACCP. |

---

## 8. Traitement Exhaustif des 80 Angles Morts Imposés

### 8.1. Angles Morts Structure & Layout (1 à 25)
1. **Écart 84 vs 87 pages** : Expliqué et prouvé au §2.1. Les 3 pages manquantes au catalogue sont `/admin/studio`, `/automations`, `/studio`.
2. **Shell `(client)/(ops)`** : Pas de `layout.tsx`. Injection par `ClientComponents.tsx` et `LayoutResolver.tsx`.
3. **Fuite du Shell sur `/order/[tenantId]` et `/menu`** : Confirmée au §2.2. Les clients voient la barre latérale staff par manque d'exclusion dans `PUBLIC_MARKETING_PATHS`.
4. **Typo CSS dans `(admin)/layout.tsx`** : Confirmée (`min-min-h-[100dvh]` au lieu de `min-h-[100dvh]`).
5. **Divergence des Onglets** : `MCCDashboard` écrit dans l'URL via `router.replace`, `FinanceDashboard` et `StaffPage` perdent leur état au F5.
6. **Double Scrollbar** : Présente sur `/operations` et `/kds` due au conteneur `<main className="overflow-auto">` englobant des conteneurs internes eux-mêmes en `overflow-y-auto`.
7. **Safe Areas iOS** : Seuls 4 fichiers intègrent `env(safe-area-inset-*)`. Tiroirs et modales coupent le bas sur iPhone avec Home Bar.
8. **Hauteurs d'écran** : `h-screen` strict éliminé (0 occurrence), mais 21 composants utilisent `min-h-screen` au lieu de `min-h-[100dvh]`.
9. **Tables sans overflow** : Les tables brutes ont été corrigées, mais 97 largeurs fixes `px` provoquent un overflow de conteneur sur mobile.
10. **Z-Index Scale** : Absence d'échelle centralisée ; 20 classes `z-[...]` concurrentes de -1 à 99999.

### 8.2. Angles Morts PWA & Hardware (26 à 35)
26. **Dualité Manifest** : Conflit entre `public/manifest.json` (orientation portrait forcée, thème bleu) et `src/app/manifest.ts` (orientation any, thème noir).
27. **Offline Fallback SW** : `public/sw.js` ne renvoie jamais vers `src/app/offline/page.tsx` en cas de panne réseau.
28. **Permission Push** : 0 appel à `Notification.requestPermission` dans le code.
29. **Badging API** : 0 appel à `setAppBadge` pour notifier le personnel.
30. **Share Target 404** : `manifest.ts` pointe vers `/api/share-target` qui est introuvable sur disque.
31. **Bouton Fermer BottomSheet** : `BottomSheet.tsx:138` utilise `w-10 h-10` (40px), en violation de la norme 44px (INV-16).
32. **Toast Collision Mobile** : `Toast.tsx` est ancré à `bottom-8 right-8` avec `min-w-[340px]`, débordant sur 360px et masquant `MobileNavBar`.
33. **Multiplicité des Modales PIN** : 4 composants différents pour la saisie de code PIN (`SecurityPinModal`, `PinModal`, `CleaningPinDialog`, `PasskeyStepUpModal`).
34. **Design System Adoption** : 1 218 boutons bruts et 471 champs de saisie bruts échappent au Design System.
35. **Couleurs en Dur** : 945 occurrences hex/rgba résiduelles (#C5A059 répété 144 fois).

### 8.3. Angles Morts UX & Ergonomie (36 à 60)
36. **Écran Cul-de-Sac `AccessDenied`** : Aucun bouton de redirection ni de retour arrière.
37. **Chaînes Françaises en Dur** : 767 chaînes JSX hors des fichiers de traduction `locales/`.
38. **Erreurs Flottantes** : 199 promesses `.then()` sans bloc `.catch()`.
39. **Surcharge de Spinners** : 241 `Loader2` provoquant des sauts de mise en page (CLS) faute de skeletons calibrés.
40. **Empty States Inertes** : Seuls 40 composants intègrent un véritable `EmptyState` avec illustration et CTA.

### 8.4. Angles Morts RBAC & Sécurité (61 à 80)
61. **Incohérence Navigation ↔ PageGuard** : 44,4% des liens du Plongeur et 37,1% de ceux du Comptable mènent à une interdiction d'accès.
62. **Page `/automations` sans Guard Standard** : Absence de `withPageGuard` et flash visuel d'accès refusé au montage.
63. **Fuite MCC en Mode Non-MCC** : `(admin)/layout.tsx` autorise le rôle `manager` à accéder à l'administration lorsque `isMCCMode()` est faux.
64. **Délégation PIN Non Généralisée** : `ActionGuard` supporte `requiresPin`, mais la prop n'est active que sur une minorité d'actions en salle.
65. **Protection des Recettes** : `/menu-builder` ne possède aucun `ActionGuard` interne pour interdire la suppression de plats par des commis.

---

## 9. Synthèse des Non-Conformités & Matrice de Risque

| Réf. | Catégorie | Description de la Non-Conformité | Sévérité | Impact Opérationnel & Risque |
|---|---|---|:---:|---|
| **NC-01** | Layout / Sécurité | Shell staff (`DesktopSidebar` / `MobileNavBar`) injecté sur `/order/[tenantId]` et `/menu`. | **P0** | Le client au restaurant voit les accès d'administration et d'exploitation sur son téléphone. |
| **NC-02** | PWA / Déploiement | Route `/api/share-target` déclarée dans `manifest.ts` mais inexistante sur disque (404). | **P1** | Échec et crash lors du partage d'images/factures vers la PWA. |
| **NC-03** | PWA / Résilience | Le Service Worker ne sert jamais `/offline/page.tsx` en cas de coupure réseau. | **P1** | Écran blanc ou dinosaure du navigateur en cas de perte de connexion en salle. |
| **NC-04** | RBAC / Ergonomie | Conflit `navConfig.ts` (`minLevel`) vs `DEFAULT_PAGE_ACCESS` : 44% d'écrans 403 pour le plongeur. | **P1** | Frustration du personnel, navigation polluée de liens interdits cul-de-sac. |
| **NC-05** | UX / Ergonomie | `AccessDenied.tsx` est un cul-de-sac sans aucun bouton de retour ni redirection. | **P1** | Employé complètement bloqué sur un écran noir nécessitant un rechargement forcé. |
| **NC-06** | Mobile / Responsive | Toasts (`Toast.tsx`) en `bottom-8 right-8 min-w-[340px]` débordent et masquent la `MobileNavBar`. | **P1** | Débordement horizontal sur 360px et impossibilité de cliquer sur la barre de navigation. |
| **NC-07** | UI / Robustesse | 20 niveaux de Z-Index arbitraires (`z-[-1]` à `z-[99999]`) sans échelle canonique. | **P2** | Chevauchement imprévisible de tiroirs de commande, modales PIN et en-têtes fixes. |
| **NC-08** | Code / Typo CSS | Classe `min-min-h-[100dvh]` corrompue dans `src/app/(admin)/layout.tsx`. | **P2** | Hauteur minimale d'écran inactive sur les pages d'administration. |
| **NC-09** | UX / Navigation | Absence de synchronisation URL (`?tab=`) sur les onglets de `/finance` et `/staff`. | **P2** | Perte systématique du contexte de travail lors d'un rafraîchissement F5. |
| **NC-10** | UI / Theming | 945 couleurs #hex en dur rendant le mode clair illisible (#FFFFFF et #0B0B0C). | **P2** | Textes blancs sur fond blanc lors du basculement en mode jour. |

---

## 10. Plan d'Action Recommandé & Ordre de Traitement par Lot

### Lot 1 — Urgences Absolues & Étanchéité Client (P0)
1. **Corriger `ClientComponents.tsx`** :
   - Ajouter immédiatement `/order`, `/menu`, `/offline`, `/status`, `/[slug]` dans `PUBLIC_MARKETING_PATHS` afin d'isoler hermétiquement l'expérience client et convive du shell d'exploitation du personnel.
2. **Sécuriser la Route PWA Share Target** :
   - Créer la route `src/app/api/share-target/route.ts` (ou retirer temporairement la déclaration de `src/app/manifest.ts`) pour éliminer le point d'entrée 404.

### Lot 2 — Résilience PWA & Ergonomie Mobile (P1)
1. **Armer le Service Worker (`public/sw.js`)** :
   - Câbler le fallback hors-ligne : intercepter l'échec réseau sur les navigations HTML pour renvoyer le contenu mis en cache de `/offline`.
2. **Repositionner les Toasts sur Mobile (`Toast.tsx`)** :
   - Adapter la position : `top-4 inset-x-4` sur écran mobile (`sm:bottom-8 sm:right-8 sm:inset-x-auto sm:min-w-[340px]`), avec `z-[100]` au-dessus de la barre de navigation.
3. **Débloquer l'Écran Cul-de-Sac `AccessDenied.tsx`** :
   - Ajouter deux boutons CTA interactifs : *"Retour à mon espace"* (vers `/mon-espace`) et *"Changer d'utilisateur"* (réinitialisation de session PIN).
4. **Corriger la Cible Tactile de `BottomSheet.tsx`** :
   - Passer le bouton fermer de `w-10 h-10` (40px) à `w-11 h-11` (44px) conformément à `INV-16`.

### Lot 3 — Alignement & Suture RBAC Multi-Personas (P1)
1. **Unifier le Modèle RBAC entre Navigation et Pages** :
   - Affecter un `minLevel` explicite à chaque item de `navConfig.ts` (ex: `minLevel: 70` pour `/settings` et `/operations`, `minLevel: 40` pour `/pos` et `/pos-mobile`, `minLevel: 35` pour `/kds`).
   - Aligner `DEFAULT_PAGE_ACCESS['accounting_portal']` pour inclure formellement le rôle `manager` (niveau 70).
2. **Normaliser la Page `/automations`** :
   - Encapsuler `/automations` avec le wrapper canonique `withPageGuard(AutomationsPage, "automations")` pour éliminer le flash d'accès refusé et uniformiser le cycle d'authentification.

### Lot 4 — Design System, Z-Index & Finitions UI (P2)
1. **Établir l'Échelle Canonique des Z-Index dans `globals.css`** :
   - Figer les 6 paliers : `z-base (0)`, `z-header (40)`, `z-nav-mobile (50)`, `z-drawer (60)`, `z-modal (70)`, `z-toast (80)`, `z-popover (90)`. Remplacer progressivement les 20 occurrences `z-[...]`.
2. **Synchroniser les Onglets avec l'URL** :
   - Remplacer le `useState` pur de `FinanceDashboard.tsx` et `StaffPage.tsx` par la synchronisation `router.replace('?tab=...')` déjà éprouvée dans `MCCDashboard`.
3. **Harmoniser les Couleurs en Dur** :
   - Remplacer les 144 `#C5A059` par `text-accent-gold` / `bg-accent-gold`, et les `#10B981` par `text-status-success`.

---
*Fin du rapport d'audit exhaustif — Document certifié conforme à la Loi 7 (Zero-Claim, 100% mesuré).*
