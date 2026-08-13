# 🔍 AUDIT — Couches horizontales vs spécification verticale

> **Objet** — Vérifier que les couches horizontales (`kernel/orchestration/design/lib/store/modules`) restent
> **génériques** avant la spécification par verticale (`verticals/<v>/`), sans teinture restaurant qui fuit dans
> le bas de la stack. Vérifier la parité des 8 variants, le threading `variant`, les tiers TEST/DEMO/REFERENCE,
> et l'isolation cross-tenant.
>
> **Périmètre** — Lecture seule + 1 livrable `.md`. Aucun code touché. Session `audit-horizontal-vertical`
> (2026-08-13) disjointe de `security-einvoice` (active en parallèle sur §7.3 + §10.1-S).
>
> **Gate mesuré** — `agent-gate.sh` @ `b884fe642` (post-Vague 2) : TSC=0 · cycles=2 baseline · barrel=0.

---

## 0. Verdict global

| Axe | État | Note |
|-----|------|------|
| A1. Pureté kernel | 🟢 **PROPRE** | 29 refs vertical, **100 % légitimes** (enum PlatformVariant, plug-in registries) |
| A1. Pureté orchestration | 🟢 **PROPRE** | 2 refs (VerticalEventBridge, defaults) — légitimes |
| A1. Pureté design | 🟠 **DOUBLON DÉTECTÉ** | `IVerticalLexicon`/`useLexicon` recouvre partiellement Vague 2 `MetricLabels` (0 usage réel) |
| A1. Pureté lib | 🟢 **PROPRE** | 65 refs, **toutes légitimes** (manifests connecteurs + defaults) |
| A1. Pureté store | 🟢 **PROPRE** | 1 ref (défaut fallback dans un derived atom) |
| A2. Modules — teinture résiduelle | 🟠 **87 occurrences** dans 44 fic. | En diminution, chantier Vagues 3-6 |
| A3. Parité 8 verticales | 🟢 **PARITÉ STRICTE** | 7 verticales × {roles, labels, ui, 9 adapters, Vertical.ts} + custom fallback |
| A4. Threading `variant` end-to-end | 🟢 **CORRECT** | tenant → NexusSync → pillarSyncRegistry → SyncStocks/SyncHACCP |
| A5. Tiers TEST/DEMO/REFERENCE | 🟢 **OPÉRATIONNEL** | 24 tenants système (8 × 3), SovereignGuard write-guard, Simulacra Mode câblé |
| A6. Capabilities matrix | 🟢 **PARITÉ STRICTE** | 7 verticales × 35 clés `mod_` identiques, mix différentié |
| A6. SovereignGuard | 🟢 **ACTIF** | isSystemTenant + isWritable + IMMUTABLE_COLLECTIONS fiscales |

**Note globale** — 🟢 **Le socle horizontal est propre.** Les 87 teintures résiduelles se concentrent dans une
poignée de modules déjà cartographiés par `AUDIT_MODULES_TEINTES.md`, sous couvert des Vagues 3-6. Un doublon
architectural mineur (`IVerticalLexicon` mort ⇄ `MetricLabels` Vague 2) demande décision d'unification.

---

## 1. A1 — Pureté des couches horizontales

Méthode : `grep -rniE "'restaurant'|'garage'|…"` dans chaque couche, en excluant `//`, `/*`, `@deprecated`,
`test`. Toute occurrence restante est classée **légitime** (config/enum/registre/fallback) ou **teinture** (le
code de la couche présuppose une verticale).

### `src/kernel/` — **29 refs, 0 teinture**

| Fichier | Refs | Nature |
|---------|------|--------|
| `plugins/VerticalRegistry.ts` | 7 | Registre plug-in — DOIT connaître les 8 verticales |
| `plugins/VerticalUIRegistry.ts` | 7 | Idem UI plug-ins |
| `nexus/contracts/tenant.ts` | 12 | **Enum canonique** `PlatformVariant` + labels emoji |
| `nexus/contracts/nexus-contract.ts` | 1 | Défaut `variant: 'restaurant'` dans schéma |
| `nexus/contracts/logistics.ts` | 1 | ⚠️ String `'bakery'` — mais c'est une **catégorie stock** (bakery/dry/spice) |
| `providers/hooks/useNexusTenantLogic.ts` | 1 | Défaut fallback dans `NexusTelemetryEngine.initSession` |

**Verdict** : 100 % légitimes. Les enums vivent dans le kernel — c'est le bon emplacement.

### `src/orchestration/` — **2 refs**

- `VerticalEventBridge.ts` L178 — mapping `variant === 'garage' → 'auto'` prefix (légitime, c'est le
  bridge d'événements verticaux vers événements génériques)
- `sync/pillarSyncRegistry.ts` — défaut `variant: 'restaurant'` sur le paramètre

### `src/design/` — **7 refs — 🟠 DOUBLON**

Toutes concentrées dans `hooks/useLexicon.ts` + `plugins/IVerticalLexicon.ts` :

| Élément | Localisation |
|---------|--------------|
| `IVerticalLexicon` (interface) | `src/kernel/plugins/IVerticalLexicon.ts` |
| `useLexicon()` hook | `src/design/hooks/useLexicon.ts` |
| 5 constantes `<V>_LEXICON` | `kernel/plugins/IVerticalLexicon.ts` |
| **Consommateurs** | **0** (`grep useLexicon\( --include="*.tsx"` → 0 hit) |

🔴 **Recouvrement avec Vague 2 `MetricLabels`** (session `s86-vague2`, commit `b884fe642`) :

| `IVerticalLexicon` | `MetricLabels` | Statut |
|---|---|---|
| `tableLabel` | `spatialContext` | ~= (chambre/baie/table…) |
| `staffLabel` | `server` | ~= (serveur/mécanicien/…) |
| `ticketLabel` | `prepTicket` | ~= (bon cuisine/OR/…) |
| `recipeLabel` | — | manque côté Vague 2 |
| `itemLabel` | — | manque côté Vague 2 |
| `customerLabel` | — | manque côté Vague 2 |
| — | `unit` / `unitPlural` | manque côté IVerticalLexicon |
| — | `merchantKind` | manque côté IVerticalLexicon |

**Action recommandée — Vague 2.1** : unifier en un seul contrat étendu dans `verticals/_shared/labels.ts`
(canonique — motif §8.3), migrer les 5 constantes `<V>_LEXICON` vers `verticals/<v>/labels.ts`, supprimer
`kernel/plugins/IVerticalLexicon.ts` (0 consommateur) et `design/hooks/useLexicon.ts` (0 consommateur). Effort
XS (2 fichiers à supprimer, contrat à étendre de 3 clés). **Priorité** : avant Vague 3 pour éviter d'ajouter
un troisième consommateur d'un pattern déjà dédoublé.

### `src/lib/` — **65 refs, 0 teinture**

Répartition : 44 refs concentrées dans `lib/connectors/manifest/pillars/connectors.*.ts` — ce sont les
**manifestes de connecteurs** qui déclarent `verticals: ['restaurant', 'hotel']` par entrée. C'est de la
config métier attendue.

Le reste (21) : `TenantSeeder`, `ProvisioningEngine`, `NexusSyncService`, `sentry.ts`, DNAs — tous des
**defaults `'restaurant'`** ou des enums.

### `src/store/` — **1 ref**

- `store/pillars/sovereign.ts` L45 — `get(_tenantConfigAtom)?.variant ?? 'restaurant'` — défaut atomique
  (comportement historique préservé).

---

## 2. A2 — Modules piliers : teinture résiduelle

Compté : `grep restaurantName|Couverts|couverts` dans `src/modules/` → **87 occurrences dans 44 fichiers**.

Distribution :

| Rang | Fichier | Occ. | Traité par |
|------|---------|-----|------------|
| 1 | `intelligence/analytique/reports/DailyFlashReport.ts` | 9 | Vague 3 (reports) |
| 2 | `intelligence/ia/fleet/FleetBenchmark.ts` | 5 | Vague 4 (fleet) |
| 3 | `commerce/fidelite/widgets/widget/ReservationStepsDEFG.tsx` | 5 | Vague 3 (widgets) |
| 4 | `commerce/acquisition/onboarding/wizard/SimpleFloorPlanEditor.tsx` | 5 | Vague 5 (onboarding) |
| 5 | `commerce/fidelite/widgets/ReservationWidget.tsx` | 4 | Vague 3 (widgets) |
| 6 | `commerce/acquisition/marketing/CampaignAttributionService.ts` | 4 | Vague 3 (marketing) |
| 7 | `ops/service/printers/hardware/EscPosBuilder.ts` | 3 | Vague 3 (printers) |
| 8 | `intelligence/analytique/reports/weeklyReport.ts` | 3 | Vague 3 (reports) |
| 9 | `commerce/acquisition/onboarding/migration/parsers/fileDetector.ts` | 3 | Vague 5 (onboarding) |

**Verdict** — Tous les fichiers en tête de liste sont déjà cartographiés dans `AUDIT_MODULES_TEINTES.md`
Buckets E-H. Aucun nouveau vecteur inattendu. Les 34 autres fichiers ne dépassent pas 2 occurrences.

**Conclusion A2** — La teinture ne descend pas dans les 8 piliers structurellement, elle reste concentrée sur
la **surface UX** (widgets/reports/printers) et **l'onboarding source-spécifique** (guides d'import Zelty
etc.). Chantier tracé.

---

## 3. A3 — Parité des 8 verticales

### Shape par verticale

| Verticale | Fic. | roles.ts | labels.ts | ui.ts | adapters/ | Vertical.ts |
|-----------|-----|----------|-----------|-------|-----------|-------------|
| restaurant | 17 | ✅ | ✅ | ✅ | ✅ (9) | RestaurantVertical |
| hotel | 26 | ✅ | ✅ | ✅ | ✅ (9) | HotelVertical |
| bakery | 19 | ✅ | ✅ | ✅ | ✅ (9) | BakeryVertical |
| garage | 27 | ✅ | ✅ | ✅ | ✅ (9) | AutoVertical |
| salon | 20 | ✅ | ✅ | ✅ | ✅ (9) | SalonVertical |
| clinic | 24 | ✅ | ✅ | ✅ | ✅ (9) | HealthVertical |
| retail | 20 | ✅ | ✅ | ✅ | ✅ (9) | RetailVertical |
| custom | 6 | — | — | ✅ | ✅ | CustomVertical (fallback restaurant) |

**Parité stricte** sur les 7 verticales réelles. `custom` est intentionnellement minimal (fallback restaurant
partout dans les registres `_shared`).

### Adapters — 9 catégories × 7 verticales = 63 fichiers

Chaque verticale expose la même surface : `<V>{Commerce, Compliance, Facility, Finance, Human, Intelligence,
Logistics, Mcc, Ops}Adapter.ts`. Zéro trou détecté.

### Nommage des classes principales

Léger flou de nommage à noter :
- `RestaurantVertical`, `HotelVertical`, `BakeryVertical`, `SalonVertical`, `RetailVertical` — cohérents
- `AutoVertical` (garage), `HealthVertical` (clinic) — nommés par **domaine** au lieu de la **verticale**

**Impact** — négligeable en interne (résolu par `VerticalRegistry.register('garage', ...)`), mais peut
confondre à la lecture (`AutoVertical` ≠ `GarageVertical`). **Pas de refonte proposée** (renommage à chaud
casserait tests + imports). À documenter.

---

## 4. A4 — Threading `variant` end-to-end

Chemin vérifié :

```
tenants/{id}/config.variant
  ↓ (lecture)
NexusSyncService.start()  [src/lib/NexusSyncService.ts:101-118]
  variant = tenantConfig?.variant ?? 'restaurant'
  ↓
initPillarSyncs(imp, tenantId, store, variant)  [orchestration/sync/pillarSyncRegistry.ts:28]
  ↓
  ├─ SyncOrders.init(tenantId, store)           ← pas de variant (générique)
  ├─ SyncStocks.init(tenantId, store, variant)  ← ✅ gate culinaire
  ├─ SyncFinance.init(tenantId, store)          ← pas de variant (générique)
  ├─ SyncHACCP.init(tenantId, store, variant)   ← ✅ gate culinaire (Vague 1)
  ├─ SyncMarketing.init(tenantId, store)        ← pas de variant (générique)
  └─ SyncStaff.init(tenantId, store)            ← pas de variant (générique)
```

**Verdict** — `variant` est correctement threadé partout où c'est utile (culinaire). Les 4 autres syncs sont
génériques par nature (POS, finance, marketing, RH — ne dépendent pas du variant à ce niveau).

**Nombre de signatures acceptant `variant`** : 34 dans `src/` (grep `variant\??: PlatformVariant`). Répartis
entre kernel (contrats), verticals/_shared (résolveurs), orchestration (bridge), lib (seeds/provisioning).

---

## 5. A5 — Tiers TEST/DEMO/REFERENCE

### SystemTenantRegistry — 24 tenants système

`src/lib/mcc/SystemTenantRegistry.ts` — table `PlatformVariant × SystemTier`. 8 × 3 = 24 IDs :

```
_demo_{V}      → vitrine prospect (Simulacra Mode, écritures interceptées)
_test_{V}      → bac à sable dev (écriture libre, reset MCC)
_ref_{V}       → maître cloneable (write bloqué sauf promotion MCC)
```

### SovereignGuard write-guard

`src/kernel/nexus/guards/SovereignGuard.ts:219` :

```ts
if (pathTenantId && isSystemTenant(pathTenantId) && !isWritable(pathTenantId)) {
    throw new Error(...`Pour _ref_* : utiliser la procédure de promotion MCC.`);
}
```

Seul `_test_*` est writable. `_ref_*` bloqué (protège la référence). `_demo_*` intercepté en amont par
`Simulacra Mode`.

### Simulacra Mode

`src/kernel/adapter/NexusAdapter.ts:72` — swap dynamique du real adapter par `SimulacraAdapter` (IndexedDB
fork). Activation via `Nexus.activateSimulacraMode(forkId)`. Appelants :
- `design/providers/SplashGate.tsx:74` — active pour tenant `_demo_*` au boot
- `modules/intelligence/ia/simulator/SimulationService.ts:138` — active pour timelines futures
- `TemporalSimulator.ts:45` — active pour scénarios what-if

### Clone from reference

`src/lib/mcc/provisioning/TenantProvisioningService.ts:143` — `cloneFromReference(refId, tenantId)` fait
un deep-copy `_ref_V → tenant_{siret}`. Cette opération contourne légitimement le SovereignGuard client
(côté serveur, MCC-only).

**Verdict** — Système en place, cohérent, protection stricte. Pipeline `REFERENCE → CLIENT` opérationnel.
Pas de fuite détectée.

---

## 6. A6 — Capabilities matrix + SovereignGuard

### DNAs — parité stricte

Chaque `src/lib/seeds/<v>-full-dna.ts` déclare **35 clés `mod_*` identiques** (parité), et fixe son mix true/false :

| Verticale | mod_* clés | true |
|-----------|-----------|------|
| restaurant | 35 | 36 (avec un doublon dans le fichier) |
| hotel | 35 | 31 |
| bakery | 35 | 22 |
| garage | 35 | 20 |
| salon | 35 | 19 |
| clinic | 35 | 21 |
| retail | 35 | 22 |

`diff <(grep -oE "'mod_[a-z_]+'" restaurant-full-dna.ts | sort -u) <(garage-full-dna.ts | sort -u)` → **identiques**.

⚠️ **Anomalie mineure restaurant** — 36 `': true'` pour 35 clés uniques : suggère une clé déclarée deux fois
dans `restaurant-full-dna.ts`. À vérifier (impact = surcharge silencieuse d'une capability, pas critique).

### SovereignGuard — invariants actifs

```ts
IMMUTABLE_COLLECTIONS: journalEntries, fiscalSeals, fiscalLedger, receiptCertifications, integrityChain
isFiscalCollection(path): IMMUTABLE ∨ path.includes('fiscal/')
isSystemTenant + isWritable  → protège _ref_/_demo_
```

**Barrière cross-tenant** : `assertHandlerTenant()` dans 7 handlers critiques (Stock×3, Payroll, HACCP,
CashCount, PhysicalInventory, TicketZ — §9.2 IMPLÉMENTÉ 12/08).

### NF525 immuabilité — vérifiée bout en bout

- `finance.z_report_requested → ZReportCloseHandler → closeTicketZForDay` (§9.3 12/08)
- Test E2E `nf525-chain-e2e.test.ts` 19/19 assertions sur 8 maillons

---

## 7. Findings à traiter

### 🟠 P1 — Doublon `IVerticalLexicon` ⇄ `MetricLabels`

**Localisation** — `kernel/plugins/IVerticalLexicon.ts` + `design/hooks/useLexicon.ts` (0 consommateur) vs
`verticals/_shared/labels.ts` (Vague 2, prêt à être consommé Vagues 3-6).

**Risque** — un nouveau développeur ajoute un usage de `useLexicon()` en parallèle de `resolveMetricLabels()`.

**Action** — Vague 2.1 (XS, avant Vague 3) :
1. Étendre `MetricLabels` de 3 clés (`recipeLabel` / `itemLabel` / `customerLabel`) — noms à harmoniser
2. Enrichir les 7 `verticals/<v>/labels.ts`
3. Supprimer `kernel/plugins/IVerticalLexicon.ts` + `design/hooks/useLexicon.ts` (0 consommateur)
4. Retirer `useLexicon` de `design/hooks/index.ts`

### 🟠 P2 — Restaurant DNA : 1 clé déclarée deux fois

**Localisation** — `src/lib/seeds/restaurant-full-dna.ts` — 36 `': true'` pour 35 clés uniques.

**Action** — grep du doublon + suppression (impact potentiel : override silencieux false→true ou l'inverse).

### 🟡 P3 — Nommage classes Vertical inconsistant

**Localisation** — `AutoVertical` (garage), `HealthVertical` (clinic) vs `RestaurantVertical`, `HotelVertical`,
etc.

**Action** — à documenter dans `ARCHITECTURE.md` §Verticales, pas de refonte (coût > bénéfice).

### 🟢 Rien de bloquant

Aucune fuite structurelle des concepts restaurant dans le kernel/orchestration/lib/store. La teinture
résiduelle des modules (Vagues 3-6) est cadrée par `AUDIT_MODULES_TEINTES.md`.

---

## 8. Ce qui n'est PAS dans le périmètre de cet audit

- ⛔ **Réconciliation `IVerticalLexicon`/`MetricLabels`** (Vague 2.1 recommandée) — nécessite écriture code
- ⛔ **Nettoyage du doublon `mod_*`** dans `restaurant-full-dna.ts` — nécessite écriture code
- ⛔ **§7.3 Réception e-facture** — session `security-einvoice` active, périmètre disjoint
- ⛔ **§6 Refonte UI** — chantier design system, orthogonal

---

## 9. Preuve gate baseline

```
commit   : b884fe642   (branche agent/antigravity-exec, post-Vague 2)
TSC error TS            : 0
cycles (madge)          : 2  (baseline finance/billing)
kernel -> modules       : 0
shared -> modules       : 0
lib    -> modules       : 0
store  -> modules       : 0
barrel (viol/pilier)    : 0/8 piliers
```

Aucun fichier code touché par cet audit. Seul livrable : ce document + entrée `.claude/sessions.md`.

---

*Rédigé 2026-08-13 · session `audit-horizontal-vertical` · lecture seule.*
*Sources : `agent-gate.sh`, `PLAN_COMPLET.md` v4.5, `AUDIT_MODULES_TEINTES.md`,*
*46 grep systématiques sur les 6 couches horizontales + 8 verticales.*
