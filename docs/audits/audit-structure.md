# Audit Structure — RESTAURANT-OS-CORE

> Réalisé le 2026-08-07. Croiser avec `versionbase.md` pour les impacts sur DEMO/TEST/REFERENCE.

---

## Vue d'ensemble chiffrée

```
src/
├── modules/        1034 fichiers  ← piliers métier (cœur)
├── shared/          497 fichiers  ← composants, bus, Nexus business
├── app/             307 fichiers  ← routes Next.js
├── lib/             157 fichiers  ← services transversaux
├── verticals/       136 fichiers  ← plugins par industrie
├── infrastructure/   54 fichiers  ← adapters, hardware, auth
├── __tests__/        52 fichiers
├── domain/           50 fichiers  ← schemas Zod, types (en migration)
├── e2e/              32 fichiers
├── store/            23 fichiers  ← atoms Jotai
└── agents/            4 fichiers
```

---

## 🔴 Priorité haute (cohérence système)

### 1. Naming mismatch vertical ↔ PLATFORM_VARIANTS

```
verticals/auto/    ↔  PLATFORM_VARIANTS: 'garage'
verticals/health/  ↔  PLATFORM_VARIANTS: 'clinic'
```

`resolveDNA('garage')` → `GARAGE_FULL_DNA` ✓ mais le plugin s'appelle `AutoVertical`,
le dossier `auto/`, avec un sous-dossier `garage/` dedans.
Idem `health/` vs `clinic`.

Risque : `SystemTenantRegistry` va créer `_demo_garage` mais le vertical chargé
s'appelle `auto` → confusion lors du provisioning et du bootstrap.

**À trancher** : renommer les dossiers `auto→garage` / `health→clinic`,
ou mettre à jour `PLATFORM_VARIANTS` en `'auto'` / `'health'`.

---

### 2. `src/instances/` : dead code supplanté par Nexus

```
src/instances/
├── lepetitpoucet.ts   ← config tenant hardcodée
├── bistrolyon.ts      ← config tenant hardcodée
├── urbanburger.ts     ← config tenant hardcodée
└── index.ts           ← registre statique + fallback Nexus
```

Supersédé par Nexus + DNA seeds + `SystemTenantRegistry`.
Le fallback Nexus dans `getTenantConfigAsync()` est correct et suffit.
**À supprimer après Sprint 1 de versionbase.md.**

---

### 3. `app/(public)/demo/page.tsx` : ancien système de démo en conflit

```typescript
// Crée un tenant éphémère à chaque visite :
const ephemeralTenantId = `demo-pouce-${Date.now()}`;
const magicLink = `/?tenant=${ephemeralTenantId}&simulacra=true`;
```

Troisième système de démo (avec `lib/DemoSeeder.ts` et l'ancien `seed-fleet-demo.js`).
Entre en conflit direct avec `_demo_*` de versionbase.md.

**À rediriger vers `/landing` après le bootstrap des tenants système,
puis supprimer.**

---

## 🟠 Priorité moyenne (dette structurelle)

### 4. `modules/` contient 5 dossiers hors des 8 piliers

| Dossier | Fichiers | Destination |
|---------|----------|-------------|
| `admin/` | 4 | `app/(admin)/` ou `lib/mcc/` |
| `dashboard/` | 3 | `modules/intelligence/analytique/` |
| `inventory/` | 1 | `modules/logistics/stock/` |
| `onboarding/` | 61 | `modules/commerce/acquisition/` |
| `settings/` | 2 | `modules/facility/spaces/settings/` |

`onboarding` est le plus gros (61 fichiers) — à rapatrier en priorité.

---

### 5. `store/pillars/marketing.ts` : pilier fantôme

`marketing` n'existe pas dans les 8 piliers — c'est un domaine de `commerce/acquisition/`.
**À fusionner dans `store/pillars/commerce.ts`.**

---

### 6. `store/` racine : 11 atoms orphelins

| Fichier | Destination |
|---------|-------------|
| `dashboardAtoms.ts` | `modules/intelligence/analytique/` |
| `ingestionAtoms.ts` | `modules/intelligence/` |
| `instanceGuardAtoms.ts` | `lib/` |
| `pulseAtoms.ts` | `shared/nexus/telemetry/` |
| `settingsAtoms.ts` | `modules/facility/spaces/settings/` |
| `tenantAtoms.ts` | `store/pillars/sovereign.ts` |
| `themeAtoms.ts` | `shared/nexus/tokens/` |
| `nexusSutures.ts` | `lib/nexus/` |

---

### 7. `lib/` : dossier fourre-tout 60+ fichiers à la racine

Services métier, utilitaires, clients, adapters tous mélangés.
`lib/DemoSeeder.ts` → lié à l'ancien système démo (à supprimer avec le point 3).

Structure cible :
```
lib/
├── nexus/       ← déjà là
├── mcc/         ← déjà là
├── services/    ← BrandingService, CryptoService, IdentityManager...
├── utils/       ← dates.ts, formatters.ts, helpers.ts...
└── adapters/    ← firebase.ts, firebase-admin-init.ts...
```

---

## 🟡 Priorité basse (documentation)

### 8. Deux groupes de routes publiques non documentés

```
app/(public)/          ← pages plateforme (legal, status)
app/(client)/(public)/ ← pages tenant (landing, showcase, login)
```

Pas un doublon fonctionnel mais nomenclature piégeuse.
À documenter dans CLAUDE.md ou renommer `(platform)/` vs `(public)/`.

---

### 9. `lib/nexus/` vs `shared/nexus/` : split non documenté

```
lib/nexus/     → core machine : NexusAdapter, NexusInterceptor, types, adapters
shared/nexus/  → logique métier : guards, contracts, engines, state, vault, tokens
```

À documenter dans CLAUDE.md pour éviter les mauvais endroits lors des recherches.

---

### 10. `agents/` et `workers/` : 5 fichiers sans rattachement

```
agents/cronos/jobs/  → 4 jobs cron → modules/intelligence/ia/ ou lib/cron/
workers/CoreWorker.ts → lib/workers/ ou infrastructure/
```

---

## Ordre d'exécution recommandé

```
Avant Sprint 1 versionbase.md
  → Trancher naming auto/garage + health/clinic (bloque SystemTenantRegistry)

Après Sprint 1 versionbase.md
  → Supprimer src/instances/
  → Rediriger + supprimer app/(public)/demo/page.tsx
  → Supprimer lib/DemoSeeder.ts

Sprint dédié dette structurelle (après versionbase complet)
  → Rapatrier modules/onboarding/ → commerce/acquisition/
  → Fusionner store/pillars/marketing.ts → commerce.ts
  → Rapatrier store/ root atoms
  → Structurer lib/ en sous-dossiers
```
