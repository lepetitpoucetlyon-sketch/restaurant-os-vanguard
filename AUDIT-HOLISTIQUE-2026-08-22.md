# Rapport d'audit holistique — RESTAURANT-OS-CORE (v2, entièreté du projet)

- **Date** : 2026-08-22 (v2 — met à jour la v1 du même jour, HEAD `5dfa324cf`)
- **Branche** : `main` · **HEAD** : `a815a633c` (post Track 3.1 coworking)
- **Périmètre** : audit **lecture seule**, élargi à l'entièreté du projet (gates ground-truth + inventaire structurel des 8 piliers, 12 verticales, MCC, lib/shared/kernel, docs/gouvernance).
- **Méthode** : exécution réelle des gates (tsc, eslint, vitest, next build, cycles-inspector, sentrux), sorties brutes via `rtk proxy` pour contourner le proxy RTK (piège déjà documenté). 5 agents d'exploration en parallèle pour l'inventaire structurel.

---

## 1. Verdict global

**Deux nouvelles régler et une casse** depuis la v1 du matin même :

- ✅ **P0-1 (TypeScript) résolu** : 0 erreur `tsc --noEmit`.
- ✅ **P0-2 (Barrel Contract / inter-module) massivement résolu** : ESLint passe de 800 problèmes (519 erreurs) à **107 problèmes (13 erreurs)**. Violations `no-restricted-imports` (Barrel Contract) : **141 → 0**. Violations `vanguard/no-inter-module-imports` : **~182 → 3**.
- 🔴 **NOUVELLE RÉGRESSION P0 : le build de production est CASSÉ.** `next build` (Turbopack) échoue avec 4 erreurs — probablement un effet de bord du chantier de rapatriement d'imports qui a fixé P0-2.
- 🎯 **1 vrai échec vitest confirmé** (sur run isolé propre, 152s) : `NexusYieldEngine.test.ts` timeout à 30000ms sur *"devrait appliquer le yieldFactor de +15% en cas de rush ET de stock critique"*. Un premier run contaminé par un process concurrent (reconnexion de session) avait fait remonter 16 échecs sur 950s — 15 étaient de la contention CPU (dont un test de perf `<3000ms`), confirmés faux positifs par le rerun isolé.

### Tableau des gates (ground-truth, vérifié au HEAD `a815a633c`)

| # | Gate | Statut | Détail |
|---|------|--------|--------|
| 1 | TypeScript (`tsc --noEmit`) | ✅ **0 erreur** | Résolu depuis la v1 (4 → 0) |
| 2 | ESLint (`eslint src`, brut) | ✅ **107 problèmes (13 err / 94 warn)** | Chute massive depuis 800 (519/281). Barrel Contract = 0/0. |
| 3 | Cycles d'import (`cycles-inspector.mjs`) | ✅ **0 cycle** | Inchangé, seuil ratchet respecté |
| 4 | `sentrux check` (frontières bloquantes) | ✅ **0 violation de frontière** | Exit brut =1 mais seulement `max_cc`/`max_cycles`/`no_god_files` = catégories **non-bloquantes** par design (`preflight.sh:152-153`) |
| 5 | `sentrux check` (dette non-bloquante) | 🟡 dette en légère hausse | cc>12 : 54→59 fonctions · god-files : 13→15 · 2 cycles-barrels ops/pos (connus, invisibles à madge) |
| 6 | **Build de production (`next build`)** | 🔴 **ÉCHEC — 4 erreurs Turbopack** | Régression nouvelle (voir §2, P0-NEW) |
| 7 | Vitest | 🎯 **1 échec / 1939** | Run isolé propre (152s) : `NexusYieldEngine.test.ts` timeout 30000ms. Premier run contaminé par contention CPU avait montré 16 échecs — 15 faux positifs infirmés par le rerun. |

---

## 2. Findings priorisés

### P0-NEW — 🎯 Build de production cassé (bloquant, nouveau depuis ce matin)

`next build` échoue avec 4 erreurs Turbopack, toutes de la même famille :

```
./src/modules/intelligence/hooks/useStrategicOracle.ts:1:32
You're importing a module that depends on `useEffect` into a React Server Component module.
```

- **Cause racine** : `useStrategicOracle.ts` (hook client, `useState/useEffect/useCallback`, pas de `"use client"`) est ré-exporté tel quel par le barrel racine `src/modules/intelligence/index.ts:49`. Or ce barrel est aussi importé par du code **serveur** (routes API) — `src/app/api/cron/weekly-report/route.ts`, `src/app/api/admin/fleet/drain-outbox/route.ts`, `src/app/api/tenant/onboarding/rollback/route.ts`, `src/app/[slug]/reservations/page.tsx` — via des chaînes d'import transitives passant par `useGeminiAgent.ts` (également sans `"use client"`).
- **Pourquoi c'est nouveau** : la v1 du matin (HEAD `5dfa324cf`) avait un build de production **réussi** (119s). Le chantier de rapatriement d'imports vers les barrels canoniques (commits `e51ef86da`…`7320b8a6c`, qui ont justement corrigé P0-2 ESLint) a fait remonter des imports qui, avant, contournaient le barrel et évitaient ce mélange client/serveur — en les forçant à passer par `@/modules/intelligence`, il a exposé un hook client non marqué dans un chemin serveur.
- **Impact** : **déploiement bloqué**. Le socle n'est plus "fonctionnel et déployable" contrairement à ce que disait la v1.
- **Correctif (~10 min)** : ajouter `"use client"` en tête de `src/shared/hooks/useGeminiAgent.ts` et `src/modules/intelligence/hooks/useStrategicOracle.ts` (ou isoler ces hooks hors du barrel serveur-safe). Vérifier ensuite si d'autres hooks du même barrel `intelligence/index.ts` ont le même souci (le barrel mélange délibérément server-safe et client-only, ce qui est le risque structurel de fond).

### P1 — Dette de "façade" métier sur les verticales récentes (gym/coworking/florist)

Les commits `5c5d41b01` (gym) et `a815a633c` (coworking), titrés *"profondeur métier … routes câblées"*, ne modifient **que `docs/ARCHITECTURE-MAP.md`/`architecture-map.json`** en plus du code métier — **aucune route sous `src/app/` n'est câblée**. Aucune des 12 verticales n'a de route applicative qui monte réellement `domain/ops/commerce/facility` — seuls les tests (`full-vertical-coverage.test.ts`) et l'auto-référence interne de `<Nom>Vertical.ts` importent ce code.

- Les services `domain/*AnalyticsService.ts` de gym/coworking/florist sont 3 copies quasi identiques d'un même template (2-3 méthodes `Nexus.adapter.query` + un `.reduce()`), sans persistance API ni test — à reclasser **"partielle"**, pas "profonde".
- **florist est un cas à part et plus grave** : le travail (`domain/`, `ops/`, `logistics/`, `ui.ts`, contenu réel non vide) **n'est pas commité** (`git status` = `??`). Contrairement à gym/coworking, aucun commit dédié ne l'a figé — risque de perte de travail.
- veterinary reste un stub pur (4 fichiers, aucun domain/ops/commerce).
- **Reco** : committer florist immédiatement (même en WIP explicite) ; corriger les libellés de commit ("routes câblées" est trompeur) ; ouvrir un chantier réel de câblage `src/app/` si ces verticales doivent devenir démontrables.

### P1 — Claims MCC inexacts par rapport au code

- **"8 events fleet.* persistés" (commit `99d4a3031`) est inexact — 7 réellement persistés.** `system.events.ts` déclare 11 types `fleet.*` ; 4 restent orphelins (aucun émetteur/handler : `device_provisioned`, `device_wipe_requested`, `weekly_report_due`, `merchant_provisioned` — ce dernier est un déchet laissé par la suppression de `MerchantProvisioningService.ts` dans le même commit).
- **"démos publiques gym/coworking/florist/veterinary" (commit `ea68ebfc8`) : pas de démo publique exposée.** Le commit ajoute un `Record<PlatformVariant, ...>` exhaustif et type-safe dans `SystemTenantRegistry.ts` (bon pour éviter les oublis de verticale au provisioning), mais `getSystemTenantId`/`DEMO_SUBDOMAIN_BY_VARIANT` ne sont consommés que par les routes admin MCC — le middleware public (`resolveTenantFromHost.ts`) ne les résout jamais. Aucune démo n'est donc réellement servie côté public pour ces 4 verticales.
- **`app/(public)/demo/` (CLAUDE.md le dit "à supprimer post-versionbase Sprint 1")** : toujours présent mais déjà neutralisé (`redirect('/landing')`, commit `5d424b703` antérieur) — CLAUDE.md est légèrement obsolète (devrait dire "neutralisé", pas "à supprimer, encore actif").
- Conformité MCC↔tenant events : **respectée** dans le code fonctionnel (le seul hit `reservation.*` trouvé est un libellé d'affichage statique dans un diagramme pédagogique `LifecycleTreePanel.tsx`, jamais un abonnement réel).

### P2 — Doublons de modules avec logique réelle des deux côtés

Le rapatriement vers `src/modules/<pilier>/` a laissé des doublons de nommage **non vides des deux côtés** (pas de simple rename oublié) :

| Doublon | Emplacement A | Emplacement B |
|---|---|---|
| CRM | `commerce/crm` (14f, `DynamicPricingSurgeEngineService`…) | `commerce/relation/crm` (5f, "Prospecting") |
| Delivery | `commerce/delivery` (10f réels) | `commerce/relation/delivery` (8f, Deliveroo/UberEats) |
| Payroll | `human/effectifs/payroll` (2f) | `human/remuneration/payroll` (8f, DSN/Silae/Merge) |
| Front-desk | `ops/service/front-desk` (squelette `.gitkeep`) | `ops/service/frontdesk` (1f réel, `WaitlistManager.ts`) |
| Loyalty | `commerce/fidelite/loyalty` (réel) | `commerce/relation/loyalty` (squelette pur `.gitkeep`) |

Plus **4 piliers fantômes non documentés** au même niveau que les 8 officiels, tous avec du code réel : `src/modules/fleet/`, `src/modules/production/kds/`, `src/modules/stock/`, `src/modules/system/` — dupliquent conceptuellement `logistics/fleet`, `ops/production/kds`, `logistics/stock`.

Et deux barrels de ré-export **vides** (1 ligne) qui pointent vers `domain/` au lieu de contenir la logique : `intelligence/ia/agency`, `intelligence/ia/tools`.

- **Reco** : chantier de déduplication dédié (choisir un camp par doublon, supprimer l'autre, pas juste documenter) avant que d'autres features viennent s'accrocher au mauvais côté.

### P2 — Couverture de tests très inégale par pilier

`intelligence` (261 fichiers) et `facility` (148 fichiers) ont **0 fichier de test**. `ops`/`logistics` sont les mieux couverts en absolu mais restent faibles en proportion (12-14 tests pour 400+ fichiers).

### P3 — Croissance de `src/shared/` contradictoire avec la trajectoire annoncée

`src/shared/` est passé de ~415 à **659 fichiers en une seule journée** (+244, dont +12 eventBus, +163 `components/` nouvellement comptés). Aucune trace d'un "vidage" en cours — CLAUDE.md ne prétend d'ailleurs pas ce vidage (c'est `~/.nexuscoder/domain-facts.yml`, externe et déjà signalé périmé en v1, qui l'affirme). À signaler côté pilotage : la trajectoire réelle est une **croissance**, pas une réduction.

### P3 — Gouvernance documentaire : ADR et ARCHITECTURE.md désynchronisés

- **10 ADR sur 15 (ADR-006 à ADR-015) sont absents de la table CLAUDE.md**, qui ne liste que ADR-001 à 005. Toute session qui se fie à CLAUDE.md pour l'historique des décisions rate deux tiers des ADR réels (isolation IA MCC, migrations sovereign par pilier, angles morts, "loi des couches kernel/lib/shared/modules").
- **Deux fichiers `ARCHITECTURE.md` distincts et divergents coexistent** : celui à la racine (308 lignes, juillet 2026, riche — référencé par CLAUDE.md) et `docs/ARCHITECTURE.md` (41 lignes, avril 2026, généré par Antigravity, référencé par README.md). Un lecteur qui suit le README tombe sur la version obsolète et squelettique.
- Le fichier racine lui-même date de 7 semaines (2026-07-02) alors que le repo a une activité quotidienne (ADR-009 à 015 tous postérieurs).
- `BACKLOG.md` (18/08) est 4 jours plus vieux que les artefacts produits le même jour que cet audit (`PLAN-RECOLLAGE-2026-08-22.md`, `task.md`) — désynchronisation probable entre backlog central et plans ponctuels.
- Coordination multi-session : **saine** — une seule session `active` (`profondeur-track1-track4`, démarrée aujourd'hui), pas de dette de coordination.

---

## 3. Ce qui est solide (constats factuels)

- ✅ **0 erreur TypeScript**, **0 cycle d'import**, **0 violation de frontière bloquante**, **0 violation Barrel Contract** (ESLint) — les 4 gates d'intégrité architecturale les plus dures sont vertes.
- ✅ **Progrès réel et massif sur la dette ESLint** en une journée : 800 → 107 problèmes, 519 → 13 erreurs.
- ✅ **Structure MCC riche et cohérente** : provisioning, fleet (7 events réellement persistés avec fenêtre glissante d'uptime réelle, pas de valeur figée), changelog, compliance/fiscal, event bus/audit/IA, tous présents et non-stubs. Isolation IA MCC↔tenant confirmée par le code (0 event métier tenant consommé).
- ✅ **6 verticales réellement profondes** (restaurant, garage, salon, hotel, clinic, bakery) avec adapters complets sur les 8 domaines MCC et sous-modules métier dédiés.
- ✅ **Structure `lib/` conforme** à la doc CLAUDE.md (barrels en place, 61 fichiers legacy à la racine comme annoncé).
- ✅ **Singleton Nexus non-ambigu** : un seul `NexusAdapter.ts` dans tout le repo, à l'emplacement documenté par CLAUDE.md.

---

## 4. Feuille de route recommandée (ordre d'exécution)

1. **Immédiat (bloquant déploiement)** — corriger le build cassé : `"use client"` sur `useGeminiAgent.ts` et `useStrategicOracle.ts`, auditer le reste du barrel `intelligence/index.ts` pour le même risque. ~10-30 min.
2. **Immédiat (risque de perte)** — committer le travail florist (`domain/`, `ops/`, `logistics/`, `ui.ts`) avant qu'il ne soit perdu.
3. **Court terme** — investiguer le timeout confirmé sur `NexusYieldEngine.test.ts` (30000ms, "yieldFactor +15% rush + stock critique") : hang réel ou test simplement trop lent sous charge normale.
4. **Court terme** — corriger les libellés de commit trompeurs et/ou câbler réellement des routes `src/app/` pour gym/coworking/florist/veterinary si ces verticales doivent être démontrables publiquement ; combler les 4 events `fleet.*` orphelins ou les retirer de `system.events.ts`.
5. **Moyen terme** — chantier de déduplication des modules à contenu réel dupliqué (crm, delivery, payroll, front-desk/frontdesk, loyalty) + décision sur les 4 piliers fantômes (`fleet`, `production`, `stock`, `system` top-level).
6. **Moyen terme** — rafraîchir la gouvernance doc : compléter la table ADR de CLAUDE.md (006-015), trancher entre les deux `ARCHITECTURE.md`, mettre à jour la ligne `app/(public)/demo/` (neutralisé, pas "à supprimer").
7. **Continu** — combler la couverture de tests 0% sur les piliers `intelligence` et `facility`.

---

## Annexe — Méthodologie

Outils exécutés en ground-truth (bypass RTK via `rtk proxy`) : `tsc --noEmit`, `eslint src`, `vitest run`, `next build`, `node scripts/cycles-inspector.mjs`, `sentrux check .`. Inventaire structurel via 5 agents d'exploration en lecture seule (src/modules, src/verticals, MCC, lib/shared/kernel, docs/gouvernance).

> ⚠️ **Incident méthodologique (résolu)** : une reconnexion de session en cours d'audit a laissé un processus `vitest run` orphelin tourner en parallèle d'un second run légitime, contaminant la première mesure vitest (16 échecs en 950s). Un second run en isolation stricte (152s) a confirmé que 15 de ces échecs étaient des faux positifs de contention CPU — seul `NexusYieldEngine.test.ts` échoue de façon reproductible.
