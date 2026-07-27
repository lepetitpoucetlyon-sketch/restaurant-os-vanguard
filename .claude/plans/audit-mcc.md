# Plan — Audit Structure MCC (Master Command Control)

> Analyse post-migration monolithe modulaire.
> Le MCC est la console d'administration suzerain — isolation APP_MODE obligatoire.

---

## Cartographie actuelle

Le MCC est **dispersé sur 6 zones** :

```
src/
├── app/(admin)/admin/mcc/
│   ├── page.tsx              ← God file JSX (~350 lignes après extraction)
│   ├── _components.tsx       ← StatCard, TabButton, StatusItem, SwitchboardItem, DeviceManagerPanel
│   └── _hooks/
│       └── useMccPage.ts     ← État et handlers du dashboard
│
├── shared/nexus/guards/admin/mcc/
│   ├── index.ts              ← Barrel INCOMPLET (8 panels manquants)
│   ├── AIWorkshop.tsx        ← Panel patches AI (utilisé)
│   ├── CertificationCenter.tsx
│   ├── DeploymentEngine.tsx
│   ├── DeviceManager.tsx
│   ├── FiscalChainExplorer.tsx
│   ├── FleetCommandTable.tsx
│   ├── FleetDeviceInventory.tsx
│   ├── FleetUpgradePanel.tsx    ← NON dans le barrel
│   ├── MCCAuditStream.tsx
│   ├── MCCInsights.tsx
│   ├── MCCTreasury.tsx
│   ├── MCCWidgetSkeleton.tsx    ← NON dans le barrel
│   ├── PerformanceMonitor.tsx
│   ├── ResellerPortal.tsx
│   ├── StrategyOracle.tsx
│   ├── SupportAIPanel.tsx
│   ├── TaxAuditPanel.tsx
│   ├── TenantBillingPanel.tsx   ← NON dans le barrel
│   ├── TenantChangelogPanel.tsx ← NON dans le barrel
│   ├── TenantOverridePanel.tsx  ← NON dans le barrel
│   ├── TenantUsersPanel.tsx     ← NON dans le barrel
│   ├── TrustedDevicePanel.tsx   ← NON dans le barrel
│   └── components/
│       ├── MFAGate.tsx          ← NON dans le barrel, importé en bypass
│       └── AIWorkshop.tsx       ← DOUBLON du root AIWorkshop, non utilisé
│
├── shared/nexus/engines/mcc/provisioning/
│   └── TenantProvisioningService.ts  ← Utilisé par 3 API routes + MasterBridge
│
├── lib/mcc/
│   └── ChangelogService.ts   ← ORPHELIN dans lib/ (devrait être dans engines/mcc/)
│
├── app/api/admin/mcc/        ← 5 routes (health, api-gateway, reseller, support-ai, trusted-devices)
└── app/api/admin/fleet/      ← 24 routes MCC (billing, changelog, command, dns, OTA, RGPD...)
```

**Total panels MCC** : 16 composants + MFAGate + AIWorkshop doublon = 4983 lignes

---

## Phase MCC-A — Compléter le barrel (CRITIQUE · XS)

Le barrel actuel n'exporte que 13 sur 16 panels. 8 panels et composants sont accessibles uniquement en bypass.

### Actions

- [ ] **[AJOUTER]** dans `shared/nexus/guards/admin/mcc/index.ts` :
  ```ts
  export * from './TrustedDevicePanel';
  export * from './TenantBillingPanel';
  export * from './TenantChangelogPanel';
  export * from './TenantOverridePanel';
  export * from './TenantUsersPanel';
  export * from './FleetUpgradePanel';
  export * from './AIWorkshop';
  export * from './MCCWidgetSkeleton';
  export * from './components/MFAGate';
  ```

**Gate** : `grep -r "@nexus/guards/admin/mcc/" src/ → 0 résultats` (tous passés par index)

---

## Phase MCC-B — Corriger les bypasses (CRITIQUE · S)

`page.tsx` et `_components.tsx` importent directement via l'alias `@nexus/` au lieu du barrel, et `useMccPage.ts` bypasse le barrel `@/modules/intelligence`.

### Bypasses dans `page.tsx`

```ts
// AVANT (bypass barrel)
import { MCCWidgetSkeleton } from '@nexus/guards/admin/mcc/MCCWidgetSkeleton';
import { TenantUsersPanel } from '@nexus/guards/admin/mcc/TenantUsersPanel';
import { MFAGate } from '@/shared/nexus/guards/admin/mcc/components/MFAGate';

// APRÈS (via barrel une fois MCC-A fait)
import { MCCWidgetSkeleton, TenantUsersPanel, MFAGate } from '@nexus/guards/admin/mcc';
```

Les imports `dynamic()` de `page.tsx` (lignes 19–37) restent en deep import car `next/dynamic` ne passe pas par le barrel — c'est normal et légitime.

### Bypass dans `_components.tsx`

```ts
// AVANT
import { MCCWidgetSkeleton } from '@nexus/guards/admin/mcc/MCCWidgetSkeleton';

// APRÈS
import { MCCWidgetSkeleton } from '@nexus/guards/admin/mcc';
```

### Bypass dans `useMccPage.ts`

```ts
// AVANT (bypass barrel intelligence)
import { useNexusFleet } from '@/modules/intelligence/fleet/NexusFleetProvider';

// APRÈS
import { useNexusFleet } from '@/modules/intelligence';
// (requiert que useNexusFleet soit dans modules/intelligence/index.ts)
```

**Gate** : `npx tsc --noEmit → 0` · `npx eslint src/ → 0 no-restricted-imports`

---

## Phase MCC-C — Rapatrier ChangelogService (ÉLEVÉ · XS)

`lib/mcc/ChangelogService.ts` est un service MCC vivant dans `lib/` au lieu de `shared/nexus/engines/mcc/`.

### Actions

- [ ] **[DÉPLACER]** `lib/mcc/ChangelogService.ts` → `shared/nexus/engines/mcc/ChangelogService.ts`
- [ ] **[SUPPRIMER]** `lib/mcc/` (dossier vide)
- [ ] **[METTRE À JOUR]** les 3 fichiers importeurs :
  - `app/api/admin/fleet/changelog/route.ts`
  - `app/api/admin/fleet/tenant-override/route.ts`
  - `app/api/admin/fleet/upgrade/route.ts`
  ```ts
  // Avant :
  import { ... } from '@/lib/mcc/ChangelogService';
  // Après :
  import { ... } from '@/shared/nexus/engines/mcc/ChangelogService';
  ```

**Gate** : `grep -r "lib/mcc" src/ → 0` · `npx tsc --noEmit → 0`

---

## Phase MCC-D — Résoudre le doublon AIWorkshop (ÉLEVÉ · XS)

Deux composants `AIWorkshop` coexistent avec des responsabilités différentes.

| Fichier | Lignes | Rôle | Utilisé |
|---------|--------|------|---------|
| `mcc/AIWorkshop.tsx` | 129 | Gestion des patches AI depuis Nexus | Oui (page.tsx via dynamic) |
| `mcc/components/AIWorkshop.tsx` | 91 | Analyse de tickets via `/api/admin/nam/analyze` | Non (aucun import trouvé) |

### Actions

- [ ] **[VÉRIFIER]** `grep -r "components/AIWorkshop" src/` → confirmer 0 import
- [ ] **[SUPPRIMER]** `mcc/components/AIWorkshop.tsx` si confirmé non utilisé
- [ ] Si des imports sont trouvés : **[RENOMMER]** en `NAMTicketAnalyzer.tsx` pour lever l'ambiguïté

---

## Phase MCC-E — Clarifier la séparation API mcc/ vs fleet/ (MOYEN · S)

La répartition des API routes entre `api/admin/mcc/` (5 routes) et `api/admin/fleet/` (24 routes) n'a pas de logique claire.

**Principe proposé** :
- `api/admin/mcc/` = actions globales sur l'installation MCC elle-même (santé, auth)
- `api/admin/fleet/` = actions sur les tenants gérés par le MCC

### Mouvements

- [ ] `api/admin/mcc/trusted-devices/` → `api/admin/fleet/trusted-devices/` (concerne un tenant)
- [ ] `api/admin/mcc/support-ai/` → `api/admin/fleet/support-ai/` (diagnostique un tenant)
- [ ] Laisser dans `mcc/` : `health/`, `api-gateway/`, `reseller/`
- [ ] Mettre à jour les fetch() dans `useMccPage.ts` et les panels concernés

**Note** : ce refactor est optionnel — la fonctionnalité n'est pas impactée, c'est de la lisibilité.

---

## Phase MCC-F — Décloisonner _components.tsx (MINEUR · S)

Les 5 composants présentationnels dans `app/(admin)/admin/mcc/_components.tsx` sont des composants MCC qui n'ont pas leur place dans la route app/.

| Composant | Localisation idéale |
|-----------|---------------------|
| `StatCard` | `shared/nexus/guards/admin/mcc/components/StatCard.tsx` |
| `TabButton` | `shared/nexus/guards/admin/mcc/components/TabButton.tsx` |
| `StatusItem` | `shared/nexus/guards/admin/mcc/components/StatusItem.tsx` |
| `SwitchboardItem` | `shared/nexus/guards/admin/mcc/components/SwitchboardItem.tsx` |
| `DeviceManagerPanel` | `shared/nexus/guards/admin/mcc/components/DeviceManagerPanel.tsx` |

### Actions

- [ ] **[DÉPLACER]** les 5 composants vers `shared/nexus/guards/admin/mcc/components/`
- [ ] **[EXPORTER]** depuis `mcc/index.ts`
- [ ] **[METTRE À JOUR]** l'import dans `page.tsx`

---

## Ordre d'exécution recommandé

```
MCC-A (barrel complet · XS)
    ↓
MCC-B (corriger bypasses · S)
    ↓
MCC-C (ChangelogService · XS)
    ↓
MCC-D (doublon AIWorkshop · XS)
    ↓
MCC-E (split API · S)        ← optionnel
    ↓
MCC-F (_components.tsx · S)  ← optionnel
```

**Phases A+B+C+D** = critiques, faisables en une session (~1h).
**Phases E+F** = cosmétiques, faire "au passage".

---

## Gate final

```bash
npx tsc --noEmit                                   # 0 erreur TypeScript
grep -r "@nexus/guards/admin/mcc/" src/            # 0 import (tous passés par barrel)
grep -r "lib/mcc" src/                             # 0 résultat
grep -r "components/AIWorkshop" src/ --include="*.tsx" --include="*.ts"  # 0
npx eslint src/ --max-warnings 0                   # 0 no-restricted-imports
```

---

## Récapitulatif

| Phase | Problème | Priorité | Effort | Risque |
|-------|----------|----------|--------|--------|
| MCC-A | Barrel `index.ts` incomplet (8 exports manquants) | Critique | XS | Faible |
| MCC-B | Bypasses `@nexus/guards/admin/mcc/XXX` dans page.tsx + _components + useMccPage | Critique | S | Faible |
| MCC-C | `ChangelogService` orphelin dans `lib/mcc/` | Élevé | XS | Faible |
| MCC-D | `AIWorkshop` doublon (components/ non utilisé) | Élevé | XS | Faible |
| MCC-E | Split `api/admin/mcc/` vs `fleet/` incohérent | Moyen | S | Faible |
| MCC-F | `_components.tsx` dans la route app/ | Mineur | S | Faible |
