# ADR-017 — Headers éditoriaux des verticales : primitives universelles + scaffolding forge

**Status** : Accepted — 2026-08-24
**Contexte** : Bloquant « avant vertical #2 » — items 1→5 de la handoff de rentrée
**Décideurs** : équipe socle RESTAURANT-OS-CORE
**Consultés** : session `vertical-ready-primitives`, session `restaurant-ui-refonte`, sessions `forge-stack-*`

---

## 1. Contexte

Le socle expose déjà un composant `PageShell` (v2) qui donne à toute page
opérationnelle un header éditorial homogène (kicker Playfair italic +
big-title Playfair black + rail d'actions `bg-surface-glass` avec dividers).
La règle du plan v3.1 P2.1 était : « les 4 pages ops custom (POS, KDS,
plan-de-salle, réservations) ont un layout `h-screen` propre à leur usage et
ne peuvent pas utiliser `PageShell` directement — on extrait leurs headers en
composants dédiés (`PosHeader`, `KDSHeader`, `FloorPlanHeader`,
`ReservationsHeader`) pour ne pas figer le style dans les pages ».

Cette extraction a permis d'harmoniser le vocabulaire visuel des 4 headers,
mais chacun ré-écrivait à la main les mêmes 4 sous-patterns :

| Sous-pattern | Copié dans (n= 4) | Coût de la duplication |
|---|---|---|
| Shell sticky `bg-surface-card/xx backdrop-blur-xl border-b border-border/40` | 4/4 | Toute évolution du fond (rush, alert ribbon) doit être poussée 4 fois. |
| Kicker Playfair italic `text-[11px] uppercase tracking-[0.32em]` + big title Playfair black `text-2xl…text-[38px]` | 4/4 | Toute évolution typographique (weight, tracking, palette) doit être poussée 4 fois. |
| Dropdown éditorial (tables POS, étages plan-de-salle, colonnes KDS) | 3/4 | Chaque header réimplémente son `useOutsideClick` + animation `AnimatePresence`. |
| Segmented control (`h-10 bg-surface-glass border border-border/40 rounded-xl` avec dividers `border-l`) | 4/4 | 3 headers écrivent le même conteneur ; le 4e (POS) a un rail différent (rôle-groupé). |

**Le problème arrive à l'onboarding d'une nouvelle verticale.** Une salle de
sport n'a pas de « Salle · Réservations » mais un « Adhérents · Encaissement »
avec les mêmes primitives (kicker + big-title + segmented mode + CTA). Si
chaque verticale doit ré-écrire ses headers à la main, on multiplie la
duplication par le nombre de verticales — et on garantit que l'un d'eux
divergera visuellement à la première évolution du design system.

Les 4 headers restaurant sont donc l'**opportunité de factorisation** : ce
qu'on distille d'eux devient le kit dont chaque nouvelle verticale hérite.

## 2. Décision

**Nous adoptons quatre primitives universelles**, attachées au namespace
`PageShell` déjà en place, qui composent tout header éditorial d'une surface
opérationnelle — dans le socle comme dans les verticales.

| Primitive | Rôle | Source |
|---|---|---|
| `PageShell.OperationalHeader` | Shell sticky : glass background, blur, border basse, ribbon d'alerte optionnel, mode `rush`, padding `dense` (76px) ou standard. | `src/shared/components/ui/PageShell.tsx` |
| `PageShell.EditorialTitle` | Le couple kicker + big-title Playfair, avec variantes de taille (`sm/md/lg`), tonalité (`primary/accent`), icône subtile, chevron picker, status pulse et badge trailing. Peut être rendu comme `<button>` ou `<span>`. | `src/shared/components/ui/PageShell.tsx` |
| `PageShell.PickerPanel` + `PageShell.PickerOption` | Panneau dropdown éditorial animé (motion enter/exit, outside-click optionnel) + option row-style icône/label/dot. Le trigger reste custom (varie trop). | `src/shared/components/ui/PageShell.tsx` |
| `PageShell.Segmented` + `PageShell.SegmentedItem` | Rail de choix mutuellement exclusifs (view switcher, consumption mode…), avec dividers verticaux automatiques et active state cohérent. | `src/shared/components/ui/PageShell.tsx` |

Et **une kicker map par variant** dans `src/shared/seeds/kickers.ts` :

```ts
export const KICKERS_BY_VARIANT: Record<PlatformVariant, KickerMap> = {
  restaurant: { finance: 'Trésorerie', commerce: 'Salle', kitchen: 'Cuisine', … },
  hotel:      { finance: 'Comptabilité', commerce: 'Réception', spaces: 'Chambre', … },
  gym:        { finance: 'Cotisations', commerce: 'Adhérents', facility: 'Plateau', … },
  veterinary: { commerce: 'Patients', ops: 'Consultations', … },
  // …
};

export function resolveKicker(variant, domain) { … }
```

Et **un template forge `verticalHeader.ts`** dans
`src/verticals/_shared/forge/templates/`, qui scaffolde un `tsx` composé
exclusivement de ces primitives à partir d'un `BlueprintHeader` déclaré dans
le `VerticalBlueprint`.

## 3. Quand extraire un header ?

**Règle par défaut : `<PageShell>` complet.** Si la page est éditoriale
(dashboard, formulaire, réglages), on utilise `<PageShell title=… kicker=…>`
tel quel. Aucune extraction requise.

**Exception : layout opérationnel `h-screen`.** Si la page fait tourner un
canvas plein écran (POS, KDS, plan de salle, réservations kanban), elle a
besoin d'un shell éditorial mais ne peut pas laisser `PageShell` imposer sa
mise en page complète (padding, max-width, `main` flex-1). Dans ce cas :

1. Utiliser `PageShell.OperationalHeader` comme wrapper du header.
2. Composer les rails avec `PageShell.EditorialTitle`, `PageShell.Segmented`,
   `PageShell.PickerPanel`, `PageShell.CTA`, `PageShell.Group`.
3. Extraire le résultat dans un composant nommé `<Domain>Header.tsx` du
   module (ex. `PosHeader` dans `src/modules/ops/service/pos/components/`)
   ou de la verticale (ex. `MembersCheckoutHeader` dans
   `src/verticals/gym/ui/`).
4. Garder l'API minimale : props explicites (état + setters + callbacks), pas
   de context IoC caché.

**Quand NE PAS extraire.** Si le header n'a que kicker + titre + 1 CTA, ne
pas créer de composant dédié — l'inline dans la page suffit et reste lisible.

## 4. Exemple d'application — `ReservationsHeader`

Avant la session `vertical-ready-primitives` :

```tsx
// 175 lignes, tout écrit à la main :
<header className="flex flex-wrap items-center justify-between gap-4 bg-surface-card/60 backdrop-blur-xl border-b border-border/40 px-6 lg:px-10 py-4 z-40 shrink-0 sticky top-0">
  <div className="flex items-center gap-5 flex-wrap min-w-0">
    <div className="flex items-baseline gap-3">
      <span className="font-serif font-black italic text-[11px] uppercase tracking-[0.32em] text-text-muted/70">Salle</span>
      <span className="font-serif font-black text-2xl leading-none tracking-[-0.02em] text-text-primary">Réservations</span>
    </div>

    <nav aria-label="Section" className="flex items-center h-10 bg-surface-glass border border-border/40 rounded-xl overflow-hidden">
      {(["reservations","customers","groups"] as const).map((s, i) => (
        <button key={s} onClick={() => setActiveSection(s)}
          className={cn(
            "h-full flex items-center gap-2 px-4 text-xs font-medium tracking-tight transition-colors",
            i > 0 && "border-l border-border/40",
            activeSection === s ? "bg-surface-glass-hover text-text-primary" : "text-text-muted hover:text-text-primary"
          )}>
          {/* icône + label */}
        </button>
      ))}
    </nav>
    {/* … day nav / week nav / terrace toggle / segmented view / 3 CTAs … */}
  </div>
</header>
```

Après :

```tsx
// Header réduit à sa substance métier :
<PageShell.OperationalHeader dense className="py-1">
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div className="flex items-center gap-5 flex-wrap min-w-0">
      <PageShell.EditorialTitle kicker="Salle" title="Réservations" size="sm" />

      <PageShell.Segmented ariaLabel="Section">
        <PageShell.SegmentedItem active={activeSection==='reservations'} onClick={()=>setActiveSection('reservations')} icon={LayoutGrid}>Plan</PageShell.SegmentedItem>
        <PageShell.SegmentedItem active={activeSection==='customers'} onClick={()=>setActiveSection('customers')} icon={Users}>Clients</PageShell.SegmentedItem>
        <PageShell.SegmentedItem active={activeSection==='groups'} onClick={()=>setActiveSection('groups')} icon={Calendar}>Groupes</PageShell.SegmentedItem>
      </PageShell.Segmented>

      {/* day / week nav (custom, chevron ← titre → chevron) */}
    </div>

    <div className="flex items-center gap-3">
      {/* terrace toggle (custom, status semantic) */}
      <PageShell.Segmented ariaLabel="Vue">
        <PageShell.SegmentedItem active={view==='day'} onClick={()=>setView('day')} icon={Calendar}>Jour</PageShell.SegmentedItem>
        <PageShell.SegmentedItem active={view==='week'} onClick={()=>setView('week')} icon={CalendarDays}>Semaine</PageShell.SegmentedItem>
      </PageShell.Segmented>
      <PageShell.CTA onClick={onNewReservation}><Plus className="w-[15px] h-[15px]" /> <span>Réserver</span></PageShell.CTA>
    </div>
  </div>
</PageShell.OperationalHeader>
```

Le fichier passe de 175 à ~150 lignes (−15 %) mais gagne surtout : (1) toute
évolution typographique du kicker ne se fait plus qu'à un seul endroit, et
(2) le vocabulaire est le même que celui que la Gym / Vétérinaire / Coworking
utiliseront demain.

## 5. Extension du blueprint — headers déclarés

Le `VerticalBlueprint` accepte désormais un champ facultatif `headers` :

```ts
// src/verticals/gym/blueprint.ts
export const GYM_BLUEPRINT: VerticalBlueprint = {
  slug: 'gym',
  // …
  headers: [
    {
      name: 'MembersCheckoutHeader',
      domain: 'commerce',
      title: 'Adhésion',
      icon: 'UserCheck',
      titleSize: 'sm',
      dense: true,
      segments: [
        {
          name: 'view',
          ariaLabel: 'Vue',
          items: [
            { value: 'today', label: "Aujourd'hui", icon: 'Calendar' },
            { value: 'month', label: 'Ce mois', icon: 'CalendarDays' },
          ],
        },
      ],
      ctas: [
        { name: 'onCheckout', label: 'Encaisser', icon: 'CreditCard' },
      ],
    },
  ],
};
```

Au passage du forge, ce bloc génère
`src/verticals/gym/ui/MembersCheckoutHeader.tsx` (via
`renderVerticalHeaders`), composé exclusivement des primitives
`PageShell.OperationalHeader / EditorialTitle / Segmented / SegmentedItem /
CTA`, avec le kicker résolu par `resolveKicker('gym', 'commerce')` →
`'Adhérents'`. Le fichier est `skipIfExists: true` — l'équipe peut ensuite
enrichir manuellement (badges custom, status pulse, rails supplémentaires)
sans risque d'écrasement à la prochaine génération.

## 6. Kicker map par variant

Le kicker (le mot 3–12 lettres qui précède le big-title) est la seule pièce
du header qui **change vraiment de vocabulaire par verticale** : « Table »
pour restaurant, « Chambre » pour hôtel, « Box » pour vétérinaire, « Plateau »
pour gym. Le reste est purement typographique.

`KICKERS_BY_VARIANT` centralise cette table (12 variants × ~8 domaines
universels). Les consommateurs sont :

1. **Le forge** — le template `verticalHeader.ts` appelle `resolveKicker(variant, domain)` à la place d'un mot dur.
2. **L'IA de composition** — quand elle propose un nouvel écran opérationnel, elle regarde ici pour ne pas inventer un mot hors registre.

`resolveKicker(variant, domain)` retombe proprement sur `custom` puis sur
`restaurant` (défaut historique) si un couple est inconnu, ce qui évite tout
crash au scaffold d'une verticale jeune dont le vocabulaire complet n'a pas
encore été déclaré.

## 7. Conséquences

### 7.1 Positives

- **Une seule source de vérité stylistique.** Toute évolution du header
  éditorial (weight, tracking, palette, animation) se fait dans
  `PageShell.tsx` — les 4 headers restaurant + les futurs headers verticaux
  suivent automatiquement.
- **Onboarding d'une nouvelle verticale accéléré.** Une verticale qui
  déclare 3 headers dans son blueprint récupère un scaffold tsx cohérent
  avec le socle dès le premier `npm run forge:generate`, sans jamais avoir
  écrit une classe Tailwind.
- **Cohérence lexicale garantie.** L'IA et le forge partagent la même
  kicker map — plus de « Prospects » qui apparaît un jour, « Leads » le
  lendemain et « Contacts » la semaine d'après pour la même verticale.
- **Zero-cycle.** Les types `BlueprintHeader*` vivent dans
  `blueprint/VerticalBlueprint.ts` ; les templates `forge/` les consomment
  — la dépendance est correctement orientée `forge → blueprint`, jamais
  l'inverse.

### 7.2 Négatives / limitées

- **Les 3 autres headers restaurant (`PosHeader`, `KDSHeader`,
  `FloorPlanHeader`) ne sont pas encore refactorés** dans cette session —
  seul `ReservationsHeader` a servi de proof-of-work. Le refactor de POS
  (ActionGuard + SOS + rush mode + category rail avec icon map), KDS
  (framer-motion `layoutId` + collapsible search + bell counter) et
  FloorPlan (occupancy KPI + mobile toggle) est un follow-up légitime — la
  primitive est prête, l'appel appartient à une session dédiée avec test
  runtime approfondi (design + regression).
- **Le template `verticalHeader.ts` ne couvre pas les cas riches** — pas
  encore de PickerPanel scaffoldé, pas de status pulse conditionnel, pas
  d'ActionGuard wrap RBAC. Ces cas sont couverts par la personnalisation
  manuelle après scaffold (le fichier est `skipIfExists`).
- **La kicker map n'est pas i18n.** Les 12 variants × 8 domaines sont en
  français en dur. Quand la vertical allemande / anglaise arrivera
  (`schedule` item 7), il faudra pluguer `useTranslation()` dans
  `PageShell.EditorialTitle` et convertir `KICKERS_BY_VARIANT` en clés
  `t('kickers.<variant>.<domain>')`. Non-bloquant tant qu'on reste
  francophone.

### 7.3 Neutres

- La règle de coordination inter-sessions reste : les 3 headers restaurant
  non refactorés sont à disposition de sessions futures — pas à toucher
  sans inscription au `sessions.md`.
- Le design-guard s'applique aux nouveaux headers verticaux dès qu'ils
  sont générés (aucun exclu dans `impeccable` ne couvre `src/verticals/`).

## 8. Alternatives rejetées

**A. Ne rien factoriser, chaque verticale copie-colle** — rejeté parce que
c'est ce qu'on faisait avant et que ça produit systématiquement de la
divergence à la première évolution du design system.

**B. Faire de `PageShell` complet la seule primitive et forcer les 4 pages
ops à s'y adapter** — rejeté parce que le layout `h-screen` de POS/KDS ne
tolère pas le `main` `flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto` que
`PageShell` impose. On aurait dû rendre `PageShell` polymorphe → complexité
supérieure au gain.

**C. Rendre `PageShell` polymorphe avec un mode `operational`** — rejeté
parce que ça enfouit deux composants dans un seul (un shell éditorial page
+ un shell opérationnel header), avec une API `mode="…"` qui grossit à
chaque cas d'usage. Les primitives séparées + le namespace commun (`PageShell.*`)
sont plus faciles à découvrir dans l'auto-complétion IDE et plus faciles à
faire évoluer indépendamment.

**D. Générer un `<VerticalHeader>` unique polymorphe par blueprint** —
rejeté parce que ça ferait un composant à 20 props conditionnelles au
scaffold, illisible et impossible à personnaliser après coup. Un tsx dédié
par header (comme `PosHeader` / `KDSHeader` / …) reste la meilleure surface
d'édition manuelle.

## 9. Références

- `src/shared/components/ui/PageShell.tsx` — définition des primitives.
- `src/shared/seeds/kickers.ts` — kicker map par variant + `resolveKicker`.
- `src/verticals/_shared/forge/templates/verticalHeader.ts` — template forge.
- `src/verticals/_shared/blueprint/VerticalBlueprint.ts` — `BlueprintHeader*` + champ `headers?` sur `VerticalBlueprint`.
- `src/verticals/_shared/forge/generateVertical.ts` — appel `renderVerticalHeaders` en L0+.
- `src/modules/commerce/relation/reservations/components/ReservationsHeader.tsx` — proof-of-work.
- `src/modules/ops/service/pos/components/PosHeader.tsx`, `src/modules/ops/production/kds/components/KDSHeader.tsx`, `src/modules/facility/spaces/components/FloorPlanHeader.tsx` — headers restaurant restant à refactorer (follow-up session dédiée).
- ADR-004 — Universal verticals architecture (contexte fondateur).
- ADR-016 — Vertical depth build-time vs runtime (le scaffold header respecte cette séparation : `precision: L0` suffit à obtenir le header, aucun besoin de L2).
