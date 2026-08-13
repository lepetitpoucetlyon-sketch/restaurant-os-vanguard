# base.md — Plan de durcissement du socle universel

> **Objet** : formaliser jusqu'où le socle générique de RESTAURANT-OS-CORE doit être poussé pour absorber N verticales (resto, hôtel, bakery, garage, salon, clinic, retail, shortstay, custom…) sans réécriture.
>
> **Doctrine** : *règle de trois* — une brique remonte dans le socle **quand la 3ème verticale la redemande**. Avant, elle reste dans la verticale. Évite l'over-abstraction précoce.
>
> **Statut** : plan directeur — chaque section est actionnable, chaque livrable est un commit atomique.
> **Date** : 2026-08-12
> **Version** : v1.0

---

## Sommaire

- [§0 — TL;DR](#0--tldr)
- [§1 — État des lieux réel](#1--état-des-lieux-réel-inspection-2026-08-12)
- [§2 — Doctrine des 3 étages](#2--doctrine-des-3-étages)
- [§3 — Étage 1 · Socle universel](#3--étage-1--socle-universel-intouchable)
- [§4 — Étage 2 · Ports partagés](#4--étage-2--ports-partagés-mutualisés)
- [§5 — Étage 3 · Verticale-spécifique](#5--étage-3--verticale-spécifique)
- [§6 — Chantiers prioritaires (5 lots)](#6--chantiers-prioritaires-5-lots)
- [§7 — Roadmap séquencée](#7--roadmap-séquencée)
- [§8 — Gates & anti-régression](#8--gates--anti-régression)
- [§9 — Anti-patterns à bannir](#9--anti-patterns-à-bannir)
- [§10 — Décisions ouvertes](#10--décisions-ouvertes)

---

## §0 — TL;DR

Le socle est **à 70 %** pour scaler à 10 verticales. Les 30 % qui manquent tiennent en **5 lots** :

1. **`kernel/ports/`** — 5 interfaces hexagonales (Channel, PaymentSplit, Lock, Messaging, Pricing).
2. **`FiscalPresetRegistry`** — table `{country, vertical}` → taux + schéma déclaratif.
3. **`CapabilityRegistry`** — listing typé unique, remplace le dispersement actuel.
4. **Nettoyage coquilles vides** — surtout `hotel/commerce/channel-manager/index.ts` (11 B).
5. **Contrat `IVerticalPlugin` v2** — impose `capabilities[]`, `fiscalPreset`, `roleLabels`.

Après ces 5 lots, ajouter une verticale = **3 fichiers de config + N adapters**, pas plus.

Ce que le socle **ne doit pas** absorber : POS, KDS, HACCP, PMS, housekeeping, recettes, diagnostic auto, rendez-vous récurrents. Ces briques sont verticale-spécifiques et doivent le rester.

---

## §1 — État des lieux réel (inspection 2026-08-12)

Scan direct du repo, pas de mémoire :

| Brique | Localisation | Note | Verdict |
|---|---|---|---|
| **SovereignGuard** | `src/kernel/nexus/guards/SovereignGuard.ts` (302 l., 12,5 K) — 15 collections *signed-write*, 4 *immutable* | **9/10** | Joyau, ne pas toucher |
| **RBAC numérique** | `kernel/nexus/guards/rbac/{actionPermissionMap,checkPermission}.ts` + `useActionPermission` + `actionWrapper` | **9/10** | Complet, testé |
| **Guards périphériques** | AuthGate · ComplianceGate · RoleGate · CycleGuard · InstanceGuard · SaaSBillingGate · PinLogin · 2FA · SovereignLockout · ProvisioningWizard · TenantOrchestrator | **9/10** | Mûr |
| **FiscalEngine NF525** | `modules/finance/fiscalite/FiscalAdapter.ts` — sceau SHA-256, `FiscalKeyService`, `FiscalTransmitter`, `EdiDgfipAdapter`, `GenerateCA3Declaration` | **8/10** | Solide, très FR |
| **EventBus + garde-fous** | `orchestration/NexusEventBus.ts` — outbox, DLQ, `isExpectedUnconsumed`, guardrail zéro-handler (§9) | **9/10** | Récent et robuste |
| **Contrat `IVerticalPlugin`** | `kernel/plugins/IVerticalPlugin.ts` — `id/version/initialize(ctx)/dependencies/routes/verticalTokens` + `ICoreContext.register{Route,EventHandler,RbacConfig}` | **7/10** | Contrat propre mais mou |
| **Implémentations verticales** | 8 classes : `RestaurantVertical`, `HotelVertical`, `BakeryVertical`, `SalonVertical`, `GarageVertical`, `RetailVertical`, `ClinicVertical`, `CustomVertical` | **4/10** | **Profondeurs très inégales** |
| **Ports hexagonaux** | `find src -type d -name ports` → **0 résultat**. `adapters/` présent partout (30+) mais interfaces implicites | **3/10** | Pattern manquant |
| **Presets fiscaux par pays** | Aucun. `TaxCalculator` lit `item.taxRate`. Pas de `FiscalPresetRegistry` | **4/10** | Trou net |
| **Capabilities / nav-gating** | Éparpillé : `nexus-contract.ts`, `tenant.ts`, `navConfig.ts`, `StripeBridge`, `ChangelogService` | **5/10** | Dispersion, pas de source de vérité |

### Signaux préoccupants (à traiter)

- `src/verticals/hotel/commerce/channel-manager/index.ts` = **11 octets**. Coquille vide malgré la classe `HotelVertical` qui la déclare. Mensonge d'architecture.
- Aucun `src/**/ports/`. La discipline hexagonale n'est pas outillée — chaque module réinvente son contrat.
- Zéro `FiscalPresetRegistry`. Chaque item porte son `taxRate`. Marche en resto FR, casse dès BE/ES/CH ou para-hôtellerie.

---

## §2 — Doctrine des 3 étages

Chaque nouvelle brique est classée avant écriture. La règle :

```
Étage 1 (SOCLE)     — 0 connaissance métier · touchée par ≥ 5 verticales
Étage 2 (PORT)      — interface partagée · ≥ 2 implémentations concrètes attestées
Étage 3 (VERTICALE) — spécifique · 1 implémentation, 1 domaine métier
```

**Règle de trois** : une brique remonte de l'étage 3 → 2 dès qu'une **2ème** verticale l'implémente. Elle remonte de 2 → 1 dès qu'une **3ème** verticale en dépend structurellement.

**Corollaire** : ne jamais créer un port pour une brique à une seule implémentation. Ex : `HACCPPort` = piège, seul resto en a besoin — reste dans `modules/compliance/qualite/`.

---

## §3 — Étage 1 · Socle universel (intouchable)

Ces briques ne connaissent aucune verticale. Aucune ne doit fuir vers un domaine métier.

| Brique | Chemin | Statut | Action |
|---|---|---|---|
| Nexus adapter + interceptor | `kernel/adapter/NexusAdapter.ts` | ✅ | — |
| SovereignGuard | `kernel/nexus/guards/SovereignGuard.ts` | ✅ | Étendre `SIGNED_WRITE_COLLECTIONS` au besoin |
| RBAC (levels + ACTION_MAP) | `kernel/nexus/guards/rbac/` | ✅ | — |
| FiscalEngine (sceau, chaîne, clés) | `modules/finance/fiscalite/FiscalAdapter.ts` | ✅ | — |
| EventBus + outbox + DLQ + garde-fou | `orchestration/NexusEventBus.ts` | ✅ | — |
| Multi-tenant path resolver | `kernel/adapter/` | ✅ | — |
| **`FiscalPresetRegistry`** | `modules/finance/fiscalite/presets/` | 🔴 | **Lot 2** ci-dessous |
| **`PortRegistry`** | `kernel/ports/` | 🔴 | **Lot 1** |
| **`CapabilityRegistry`** | `kernel/capabilities/` | 🔴 | **Lot 3** |
| **`IVerticalPlugin` v2** | `kernel/plugins/` | 🟠 | **Lot 5** |

**Règle absolue** : aucune de ces briques n'importe depuis `src/modules/**` ni `src/verticals/**`. Un cycle détecté par sentrux est un bug bloquant.

---

## §4 — Étage 2 · Ports partagés (mutualisés)

Interfaces pures dans `kernel/ports/`, zéro implémentation. Les adapters concrets vivent dans `modules/<pilier>/*/adapters/`. Le choix de l'adapter est dicté par les **capabilities du tenant** au bootstrap.

| Port | Verticales cibles | Adapters attendus | Priorité |
|---|---|---|---|
| **`ChannelPort`** — OTAs, marketplaces | hotel, shortstay, retail (Amazon/CDiscount), garage (Allocab) | Airbnb, BookingCom, Vrbo, iCal, Amazon SP-API, ShopifyPOS | **P0** |
| **`BookingPort`** — créneaux/dispos | hotel, shortstay, salon, clinic, garage | InternalBooking, GoogleCalendar, Doctolib, Planity | **P0** |
| **`PaymentSplitPort`** — marketplace payout | shortstay (owners), retail (dropshipping), salon (indép.) | StripeConnectExpress, Lemonway, Mangopay | **P1** |
| **`PricingPort`** — yield/dynamic | hotel, shortstay | PriceLabs, Beyond, InternalRules | **P1** |
| **`LockPort` / `AccessPort`** — IoT accès | hotel, shortstay, facility (coworking) | Nuki, TTLock, Igloohome, Salto KS | **P2** |
| **`MessagingPort`** — comm unifiée | shortstay, salon, clinic, retail | WhatsAppBusiness, TwilioSMS, ResendMail, AirbnbInbox, BookingMsg | **P2** |
| **`DocumentPort`** — KYC/pièces | shortstay (fiche police), clinic (ordonnance), garage (CG) | Onfido, Sumsub, InternalUpload | **P3** |
| **`InventoryPort`** — stock physique | resto, bakery, retail, salon | ✅ déjà existant (`stockProfile.ts`) | **fait** |

### Anatomie d'un port (patron unique à respecter)

```
src/kernel/ports/channel/
├── ChannelPort.ts             ← interface pure + types
├── ChannelPort.errors.ts      ← erreurs typées communes
├── ChannelPort.contract.test.ts ← tests de contrat (tout adapter doit passer)
└── index.ts                   ← barrel

src/modules/commerce/acquisition/channel-manager/
├── adapters/
│   ├── airbnb.adapter.ts      implements ChannelPort
│   ├── bookingcom.adapter.ts  implements ChannelPort
│   └── ical.adapter.ts        implements ChannelPort
├── ChannelAdapterRegistry.ts  ← résolution capability → adapter
└── index.ts                   ← barrel exposant seulement le registry
```

**Test de contrat** : chaque adapter doit passer `ChannelPort.contract.test.ts` — c'est ce qui garantit qu'un swap Airbnb → BookingCom n'introduit pas de régression silencieuse.

---

## §5 — Étage 3 · Verticale-spécifique

Ne remonte **jamais** dans le socle, même sous prétexte de "ça peut servir un jour".

| Verticale | Briques exclusives (à laisser dans `modules/`) |
|---|---|
| **resto** | POS, KDS, HACCP, plan de salle, recettes, cost food |
| **hotel** | PMS, housekeeping, city ledger, folios, yield hotelier |
| **bakery** | Pétrin, batch planner, DLC/DLUO, tournées matinales |
| **shortstay** | Turnover engine, taxe séjour, DAC7, owner statement, night-cap 120j |
| **garage** | Diagnostic OBD, devis pièces, ordre de réparation, contrôle technique |
| **salon** | Rendez-vous récurrents, fiches client couleur/technique, commission coiffeur |
| **clinic** | Ordonnances, dossier patient, feuille de soins, télétransmission Sesam-Vitale |
| **retail** | Fiche produit variants, réappro auto, click&collect |

**Test** : si tu écris une brique et te demandes *"une autre verticale en aurait besoin ?"*, réponds honnêtement en listant lesquelles. **< 3** = reste étage 3. Pas de "peut-être un jour".

---

## §6 — Chantiers prioritaires (5 lots)

### Lot 1 · `kernel/ports/` — les 5 ports fondateurs

**Livrable** : ~200 lignes d'interfaces pures + tests de contrat.

```
src/kernel/ports/
├── channel/           ChannelPort · list/upsert/cancel reservation, pushRates, subscribeWebhook
├── booking/           BookingPort · listSlots, book, reschedule, cancel
├── payment-split/     PaymentSplitPort · computeSplit, transfer, refund, statement
├── pricing/           PricingPort · recomputeRate, pushRates, listRules
├── lock/              LockPort · provisionCode, revokeCode, subscribeEvents
├── messaging/         MessagingPort · send, listThreads, subscribeInbound
└── index.ts           barrel unique @/kernel/ports
```

**Critères d'acceptation** :
- Chaque port a un fichier `contract.test.ts` qui décrit ce qu'un adapter conforme doit faire.
- Aucune implémentation concrète dans `kernel/ports/`.
- 0 import depuis `modules/**` ou `verticals/**`.

**Estimation** : 3 jours.

---

### Lot 2 · `FiscalPresetRegistry` — sortir de FR-only

**Livrable** : registry central + migration progressive.

```
src/modules/finance/fiscalite/presets/
├── FiscalPresetRegistry.ts    Map<{country, vertical}, FiscalPreset>
├── types.ts                   FiscalPreset { rates[], scheme, filingFormat, tourism? }
├── presets/
│   ├── fr-restaurant.ts       {rates: [5.5, 10, 20], scheme: 'NF525', filing: 'FEC'}
│   ├── fr-hotel.ts            {rates: [10, 20], scheme: 'NF525', filing: 'FEC', tourism: TAX_SEJOUR_INSEE}
│   ├── fr-shortstay.ts        {rates: [10, 20], filing: 'FEC + DAC7'}
│   ├── fr-clinic.ts           {rates: [0, 5.5, 20], filing: 'FEC'}
│   ├── be-restaurant.ts       {rates: [6, 12, 21], filing: 'INTERVAT'}
│   ├── es-restaurant.ts       {rates: [4, 10, 21], filing: 'SII'}
│   └── ...
├── FiscalPresetResolver.ts    resolve(tenant) → preset + fallback
└── index.ts
```

**Migration** : `TaxCalculator` continue de lire `item.taxRate` (backwards-compat) mais celui-ci vient désormais du preset au moment de la création de l'item, pas hardcodé.

**Critères d'acceptation** :
- Un tenant BE crée un ticket → taux 6/12/21 % auto-appliqués sans code métier.
- Le `FinancialNexusBridge` route vers le bon `filingFormat` (FEC vs INTERVAT).
- Test de non-régression : tous les tests fiscaux resto FR passent inchangés.

**Estimation** : 5 jours (dont 2 pour l'audit taxRate hardcodés).

---

### Lot 3 · `CapabilityRegistry` — source de vérité unique

**Livrable** : registry typé, tous les usages dispersés y sont câblés.

```
src/kernel/capabilities/
├── CapabilityRegistry.ts       enum + Map<Capability, CapabilityDescriptor>
├── types.ts                    Capability = 'shortstay.core' | 'resto.pos' | 'hac.ccp' | ...
├── descriptors/                un fichier par capability, décrivant :
│                                 - navSections débloquées
│                                 - événements bus activés
│                                 - collections Firestore utilisées
│                                 - modules/ports requis
├── useCapability.ts            hook client → boolean
├── requireCapability.ts        server guard → throw si absent
└── index.ts
```

**Migration** :
- `navConfig.filterByCapabilities()` importe depuis le registry.
- `tenant.ts` type `capabilities: Capability[]` (typé, plus de string libre).
- `StripeBridge` / `ChangelogService` récupèrent leurs listes depuis le registry.
- Nouveau : `NexusEventBus.isExpectedUnconsumed()` interroge le registry pour les préfixes verticaux.

**Critères d'acceptation** :
- Un `grep` sur les 5 endroits actuels ne trouve plus de string libre `'shortstay.core'`.
- Ajouter une capability = **1 fichier descriptor**, pas 5 endroits à toucher.

**Estimation** : 3 jours.

---

### Lot 4 · Nettoyage coquilles vides

**Livrable** : aucun `index.ts` de moins de 30 octets qui n'ait pas de raison documentée.

**Cibles identifiées** :
- `src/verticals/hotel/commerce/channel-manager/index.ts` (11 B) → soit portage vers `kernel/ports/channel` + adapter hotel, soit suppression franche.
- Audit à faire :
  ```bash
  find src/verticals -name "index.ts" -size -30c
  find src/modules -name "index.ts" -size -30c
  ```

**Règle post-nettoyage** : un `index.ts` vide ne peut plus être committé (hook pre-commit).

**Critères d'acceptation** :
- 0 coquille vide sous `verticals/` et `modules/`.
- Chaque verticale qui *déclare* une feature dans son `initialize()` a une implémentation réelle (au moins un `throw NotImplementedError` explicite, pas un fichier vide).

**Estimation** : 1 jour + audit.

---

### Lot 5 · `IVerticalPlugin` v2 — contrat qui contraint

**Livrable** : nouvelle version du contrat qui impose ce qui manque aujourd'hui.

```ts
// AVANT (v1)
export interface IVerticalPlugin {
  id: string;
  name: string;
  version: string;
  initialize(context: ICoreContext): Promise<void>;
  routes?: VerticalRoute[];
  dependencies?: string[];
  defaultTheme?: Partial<BrandConfig>;
  verticalTokens?: Record<string, string>;
}

// APRÈS (v2)
export interface IVerticalPlugin {
  id: VerticalId;                          // enum, plus de string libre
  name: string;
  version: string;

  // NOUVEAU — obligatoire
  capabilities: readonly Capability[];      // ce que la verticale débloque
  fiscalPreset: FiscalPresetKey;            // {country, vertical}
  roleLabels: Record<PermissionLevel, string>;
  dnaSeed: () => Promise<TenantDNA>;        // seed d'un tenant démo

  // Existant
  initialize(context: ICoreContext): Promise<void>;
  destroy?(): Promise<void>;
  routes?: VerticalRoute[];
  dependencies?: readonly VerticalId[];
  defaultTheme?: Partial<BrandConfig>;
  verticalTokens?: Record<string, string>;
}
```

**Migration** : les 8 verticales existantes doivent déclarer explicitement `capabilities`, `fiscalPreset`, `roleLabels`, `dnaSeed`. Aujourd'hui c'est éparpillé ou implicite.

**Critères d'acceptation** :
- Impossible d'enregistrer une verticale sans ces 4 champs (TSC bloque).
- `TenantSeeder` prend un `verticalId` et appelle `plugin.dnaSeed()` — plus de switch sur variant.

**Estimation** : 4 jours (dont migration des 8 verticales).

---

## §7 — Roadmap séquencée

Séquencement sous contrainte : lot 2 dépend de lot 3 (presets utilisent capabilities), lot 5 dépend de lots 2+3.

| Semaine | Lot | Livrable démo-able |
|---|---|---|
| **S1** | Lot 1 (Ports) | 5 interfaces + tests de contrat + PR mergée |
| **S2** | Lot 3 (CapabilityRegistry) | Registry en place, `navConfig` migré, `tenant.ts` typé |
| **S3–S4** | Lot 2 (FiscalPresetRegistry) | Presets FR × 5 verticales + 1 preset BE + audit taxRate hardcodés |
| **S5** | Lot 4 (Coquilles vides) | Audit + suppression/portage + hook pre-commit |
| **S6–S7** | Lot 5 (IVerticalPlugin v2) | Contrat v2 + migration des 8 verticales existantes |
| **S8** | Verticale pilote | Réécrire `shortstay` sur le socle durci (validation grandeur nature) |

**Total** : ~8 semaines à 1 dev. Compressible à ~5 semaines à 2 devs si lots 1+3 en parallèle.

---

## §8 — Gates & anti-régression

À chaque lot :

| Gate | Commande | Seuil |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | **0 erreur** |
| Lint | `npx eslint src` | **0 erreur** |
| Tests | `npx vitest run` | **100 % pass** + nouveaux tests du lot |
| Cycles | `sentrux check .` | **≤ baseline** (pas de nouveau cycle) |
| God files | `sentrux check .` | **≤ baseline** |
| Preflight | `./scripts/preflight.sh` | vert avant merge |

**Anti-régression fiscale spécifique** : la suite `src/e2e/vanguard/fiscal-*` doit rester verte à chaque étape (7 tests couvrant sceau, chaîne, signature, isolation clés, breach alert). Toute rupture = **rollback immédiat**.

**Anti-régression bus** : les tests `NexusEventBus.guardrail.test.ts` (8/8), `nf525-chain-e2e.test.ts` (19/19) et `bus-smoke.test.ts` (24/24) restent verts.

---

## §9 — Anti-patterns à bannir

Ces patterns ont été observés ou pressentis. Chacun a un contre-exemple.

| Anti-pattern | Contre-exemple correct |
|---|---|
| Port créé pour une seule verticale (`HACCPPort` alors que seul resto l'utilise) | Reste dans `modules/compliance/qualite/` jusqu'à la 2ème verticale demandeuse |
| Coquille vide (`index.ts` de 11 B) qui simule une feature | Soit implémentation réelle, soit suppression franche, jamais entre les deux |
| String libre pour capability (`'shortstay.core'`) | Enum typé dans `CapabilityRegistry`, `Capability` importé partout |
| `taxRate` hardcodé dans un composant POS | Résolu au moment de la création via `FiscalPresetResolver.getRate(tenantId, sku)` |
| Cycle `kernel/ → modules/` (le socle importe une verticale) | Bloquant sentrux. Toujours dépendance dans le sens `modules/ → kernel/` |
| Verticale qui écrit dans une collection *signed-write* sans passer par le bridge | Doit passer par `FinancialNexusBridge` ou équivalent scellé |
| Nouvelle collection Firestore ajoutée sans classification | Doit être classée : *free* / *signed-write* / *immutable* et rajoutée aux Sets du SovereignGuard |

---

## §10 — Décisions ouvertes

Questions à trancher avant démarrage du chantier :

1. **Nommage `PermissionLevel`** : garder les nombres (100/80/60/50/40/30/20/10) ou introduire un type nominal (`type PermissionLevel = 10 | 20 | ... | 100`) ? Recommandation : type nominal, ça bloque les typos.
2. **Registry local vs SaaS** : `FiscalPresetRegistry` compilé dans le bundle ou fetché depuis MCC au bootstrap tenant ? Recommandation : compilé (démarrage rapide, offline-first), mis à jour via release.
3. **Test de contrat des ports** : suite unique tournée en CI par adapter, ou test par adapter dans son dossier ? Recommandation : test unique dans `kernel/ports/*/contract.test.ts`, paramétré, importe la liste des adapters à tester depuis le registry.
4. **Verticales inactives (bakery, salon, clinic, retail, garage)** : on migre leurs coquilles vers v2 quand même, ou on gèle en v1 tant qu'aucun tenant réel ? Recommandation : migrer, sinon la dette double à chaque itération du socle.
5. **`shortstay` — jour zéro** : on la démarre sur socle v1 (existant) puis on migre, ou on attend socle v2 ? Recommandation : **attendre socle v2**, sinon rework garanti. C'est aussi la validation grandeur nature du socle (S8 de la roadmap).

---

## Annexe A — Fichiers à créer (checklist)

```
src/kernel/ports/
  channel/{ChannelPort,ChannelPort.errors,ChannelPort.contract.test,index}.ts
  booking/{BookingPort,BookingPort.errors,BookingPort.contract.test,index}.ts
  payment-split/{PaymentSplitPort,...}
  pricing/{PricingPort,...}
  lock/{LockPort,...}
  messaging/{MessagingPort,...}
  index.ts

src/kernel/capabilities/
  CapabilityRegistry.ts
  types.ts
  descriptors/*.ts       (un par capability)
  useCapability.ts
  requireCapability.ts
  index.ts

src/kernel/plugins/
  IVerticalPlugin.v2.ts  (avant remplacement)
  types.ts               (VerticalId enum, FiscalPresetKey, TenantDNA)

src/modules/finance/fiscalite/presets/
  FiscalPresetRegistry.ts
  FiscalPresetResolver.ts
  types.ts
  presets/{fr,be,es,ch}-{restaurant,hotel,shortstay,clinic,...}.ts
  index.ts
```

## Annexe B — Fichiers à modifier

- `src/config/navConfig.ts` — importer `Capability` depuis registry
- `src/kernel/nexus/contracts/tenant.ts` — typer `capabilities: readonly Capability[]`
- `src/kernel/adapter/StripeBridge.ts` — lire capabilities depuis registry
- `src/lib/mcc/ChangelogService.ts` — idem
- `src/orchestration/NexusEventBus.ts` — `isExpectedUnconsumed` interroge le registry
- `src/lib/seeds/index.ts` — `resolveDNA(verticalId)` appelle `plugin.dnaSeed()`
- Les 8 fichiers `src/verticals/*/[Name]Vertical.ts` — migration v1 → v2
- `src/modules/finance/fiscalite/TaxCalculator.ts` — accepter `preset` en paramètre optionnel

## Annexe C — Métriques de succès

À valider avant de considérer le chantier terminé :

- ⏱ **Ajout d'une verticale** : ≤ 3 jours pour un dev qui ne connaît pas le repo (aujourd'hui : ≥ 3 semaines).
- 📦 **Taille verticale** : ≤ 5 fichiers (config, DNA, adapters spécifiques). Le reste vient du socle.
- 🌍 **Support pays** : ajouter la Belgique = 1 fichier `be-*.ts` par verticale concernée, 0 code métier touché.
- 🔒 **Zéro régression fiscale** : la suite `vanguard/fiscal-*` verte à chaque étape.
- 🧪 **Contrat de port** : chaque adapter passe le test de contrat, sinon PR bloquée.
- 🏷 **0 string libre** pour les capabilities dans le code (audit par grep).

---

*Fin de plan. Toute modification passe par PR + relecture. La doctrine des 3 étages est la boussole — un doute, on relit §2.*
