# CLAUDE-VIBE.md — Checklist Vibe Coding

> Lecture obligatoire pour toute session Claude/Cursor/Copilot qui **écrit** dans ce repo. Format court — la version longue est `CLAUDE.md`. Le hook `.claude/hooks/design-guard.sh` refuse les écritures qui violent ces règles.

## 1. Nouvelle page (route `src/app/(client)/(ops)/<X>/page.tsx`)

```tsx
"use client";
import { PageShell } from "@/shared/components/ui/PageShell";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { <TonIcon> } from "lucide-react";

function TaPage() {
  return (
    <PageShell
      kicker="Catégorie"            /* Ex: Effectifs, Salle, Finance, Cuisine */
      title="Titre éditorial court"
      subtitle="Une phrase utile."
      icon={TonIcon}
      breadcrumbs={[{ label: "Opérations" }, { label: "Nom court" }]}
      actions={<PageShell.CTA onClick={...}>Action principale</PageShell.CTA>}
      tabs={<><PageShell.Tab active={...} onClick={...}>Onglet</PageShell.Tab></>}
    >
      {/* corps */}
    </PageShell>
  );
}
export default withPageGuard(TaPage, "capability_key");
```

**Interdit** : header custom qui doublonne PageShell. Header custom UNIQUEMENT sur pages opérationnelles plein-écran (POS/KDS/floor-plan/reservations), et dans ce cas extraire le header en composant module réutilisable comme `PosHeader`/`KDSHeader`/`FloorPlanHeader`/`ReservationsHeader`.

## 2. Couleurs — TOUJOURS des tokens

| Besoin | Token à utiliser |
|--------|------------------|
| Texte primaire / titres | `text-text-primary` |
| Texte secondaire | `text-text-secondary` |
| Texte muet / captions | `text-text-muted` |
| Fond page principale | `bg-surface-bg` |
| Carte / modal | `bg-surface-card` |
| Fond sidebar / dark surface | `bg-surface-sidebar` |
| Surface semi-transparente (chip rails, glass) | `bg-surface-glass` / `bg-surface-glass-hover` / `bg-surface-glass-active` |
| Bordure | `border-border` ou `border-border/40` |
| Marque / accent principal | `text-accent-gold` / `bg-accent-gold` |
| Action primaire (CTA) | `bg-action-primary` / `text-action-primary` |
| Succès | `text-status-success` / `bg-status-success/10` |
| Erreur / suppression / SOS | `text-status-danger` / `bg-status-danger` |
| Avertissement | `text-status-warning` |
| Info | `text-status-info` |

**Bannis** (le hook `design-guard.sh` refuse l'écriture) : les palettes Tailwind `slate-*`, `zinc-*`, `neutral-300..700`, les glass hardcodés `bg-white/[0.0X]`, les rouges/ambres hardcodés (`bg-red-500`, `text-red-500`, `text-amber-400` → utiliser `bg-status-danger`, `text-accent-gold`).

**Zones exemptées** (dark-brand fixe volontaire) : `src/app/(marketing)/`, `src/app/(ordering)/`, `src/app/(admin)/admin/mcc/`, `src/app/(admin)/simulator/`.

## 3. Micro-labels / chips

Utiliser les utilities du design system :
- `className="text-chip-label"` (10px, weight 700, tracking 0.14em — chip standard)
- `className="text-chip-label-sm"` (9px — chip secondaire : compte, ID)

**Interdit** : l'anti-pattern `text-[9px] font-black uppercase tracking-widest` (nettoyé sur 302 usages, le hook refuse sa réintroduction).

## 4. Prix et monnaie — MICROUNITS obligatoire

```ts
import { toMicrounits } from "@/domain/schemas/primitives";
const price = toMicrounits(12.50); // JAMAIS `12.50 as Microunits`
```

Champs : `*InMicrounits` (jamais `*InCents` en nouveau code). TS refuse le mélange.

## 5. Imports — barrel racine uniquement

```ts
// OK
import { PageShell } from "@/shared/components/ui/PageShell";
import { useReservationsPage, ReservationsHeader } from "@/modules/commerce";

// REFUSE par sentrux au commit
import { X } from "@/modules/commerce/relation/reservations/components/X";
```

Sauf tests qui mockent des chemins spécifiques.

## 6. Breakpoints

Utiliser les classes Tailwind (`sm:` `md:` `lg:` `xl:` `2xl:`) ou `useBreakpoint()` — **jamais** de px arbitraires dans un `@media` ou `window.innerWidth <`. Les tokens `--breakpoint-*` dans `globals.css` sont la source unique de vérité.

## 7. Nouvelle feature — 3 réflexes

1. **Vérifier `.claude/sessions.md`** — s'inscrire, éviter la collision.
2. **Placer dans son pilier** : `src/modules/<pilier>/<domaine>/<module>/`. Exporter par le barrel racine `src/modules/<pilier>/index.ts`.
3. **Ne jamais introduire** un nouveau schéma en `Cents` : microunits partout, brand `Microunits`.

## 8. Nouvelle catégorie / rubrique de nav

1. Route dans `src/config/navConfig.ts` (capability + variant).
2. Contexte ICM dans `src/lib/icm/TaskContext.ts` (`TASK_MAPS`).
3. Optionnel : DNA template dans `src/shared/seeds/`.

## 9. Nouvelle verticale métier (Gym, Salon, Vétérinaire…)

Utiliser le **skill `vertical-forge`** — jamais scaffolder à la main. Le forge produit du code aligné tokens.

## 10. Escape hatch

Si tu **dois vraiment** utiliser un pattern banni (mockup temporaire, cas très spécifique), ajoute `vibe-allow` sur la ligne :

```tsx
<div className="bg-neutral-400"> {/* vibe-allow: mockup temporaire, sera retire au sprint N+1 */}
```

Mais chaque `vibe-allow` mérite une PR-review — c'est de la dette qui doit avoir une raison écrite.

---

**Ordre de priorité en cas de conflit** : `CLAUDE.md` (conventions projet) > `CLAUDE-VIBE.md` (ce fichier, checklist) > `AGENTS.md` (protocole inter-agents) > défauts.
