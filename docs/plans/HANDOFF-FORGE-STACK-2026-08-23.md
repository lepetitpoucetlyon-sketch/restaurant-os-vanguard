# 🤝 HANDOFF — Forge Stack (P4, P5, P6 restants)

> **Session sortante** : `forge-stack-p2-p6` (Claude Code, 2026-08-23)
> **Session entrante** : à définir — inscrire dans `.claude/sessions.md` avec périmètre chemins explicites AVANT toute action (Loi 6 AGENTS.md).
> **Plan source** : `docs/plans/MEGA-PLAN-FORGE-STACK-2026-08-22.md` (roadmap PARTIE 3 mise à jour).

---

## 1️⃣ Ce qui est FAIT (livré + committé)

**8 commits successifs, ~230 tests ajoutés, 0 régression sur les 2000+ existants.**

| Phase | Commit | Résumé | Tests |
|---|---|---|:-:|
| P0 | `f0da37781` | Scrape réel `CompanyScrapeAgent` + suppression stub `DigitalDnaCrawlerService` + route preview-only | 42 |
| P1 | `f0da37781` | `CapabilityWiringRegistry` (45 caps) + `SectorStudyStore` (persistance MCC) + CLI `--persist` | 23 |
| doc | `d878e2f3c` | §C.9 BlindSpotDetector + §C.10 Couche Dérivation + roadmap élargie | — |
| P2bis | `6f046e3cf` | `BlindSpotDetector` — moteur + 20 règles (regulatory/scale/catalog/cascade) | 16 |
| P2a | `51facb86e` | `QualificationEngine` + `RbacDeriver` + `BusinessLawsDeriver` — les 7 axes exécutables + RBAC auto par variant/échelle + businessLaws dérivés | 37 |
| P2b | `7270bcb64` | `RgpdDeriver` + `SecurityDeriver` + `LegalDeriver` — conformité : registre traitements, PIA/DPO, MFA/password matrix, CGV/insurance/CC | 25 |
| P2c | `f99f00d00` | `LocalizationDeriver` + `IntegrationsDeriver` + `CommsDeriver` + `HardwareSizingDeriver` — FR/BE/CH/GB/US ; Doctolib/Booking/UberEats ; dimensionnement TPE/sondes | 29 |
| P2d | `fcb3db636` | `KpiDeriver` + `FormationDeriver` + `PricingDeriver` + `BackupDeriver` — KPIs sectoriels 10 variants ; DR/HDS/PCI ; certifications | 30 |
| P3 | (à venir dans le commit background) | 5 templates génération L2/L3 + `StudyToBlueprintCompiler` + extension `generateVertical` | 16 |
| P4bis | (à venir dans un commit dédié) | `displayDepth` runtime — atom Jotai + `<DisplayDepthGate>` + META | 12 |

**Fichiers créés (arborescence à retenir)** :
- `src/modules/commerce/acquisition/onboarding/schemas/companyProfile.ts`
- `src/modules/commerce/acquisition/onboarding/services/CompanyScrapeAgent.ts`
- `src/modules/commerce/acquisition/onboarding/qualification/QualificationAnswers.ts`
- `src/modules/commerce/acquisition/onboarding/qualification/QualificationEngine.ts`
- `src/verticals/_shared/catalog/CapabilityWiring.ts`
- `src/verticals/_shared/sector-study/SectorStudyStore.ts`
- `src/verticals/_shared/blind-spot/BlindSpotDetector.ts` + `rules/{regulatory,scale-tier,catalog-capability,cascade}.ts`
- `src/verticals/_shared/derivation/{Rbac,BusinessLaws,Rgpd,Security,Legal,Localization,Integrations,Comms,HardwareSizing,Kpi,Formation,Pricing,Backup}Deriver.ts` (13 fichiers)
- `src/verticals/_shared/forge/templates/{kpiDashboard,workflowService,regulationGuard,hardwareProvisioning,verticalTest}.ts`
- `src/verticals/_shared/forge/StudyToBlueprintCompiler.ts`
- `src/kernel/settings/displayDepth.ts`

---

## 2️⃣ Ce qui RESTE (dans l'ordre à faire)

L'ordre ci-dessous est OPTIMAL — chaque phase dépend logiquement de la précédente ou reste indépendante.

### 🥇 P4 — Custom UI 3 niveaux (PROCHAINE PRIORITÉ)

**Objectif** : cascade de résolution UI `tenant > verticale > défaut`, avec le variant `custom` en canevas vierge et le branding tenant alimenté par `CompanyProfile.branding` scrapé réellement.

**Blast radius** : `src/shared/plugins/IVerticalUIPlugin.ts` (à étendre — vérifier son état actuel), nouveau `src/shared/plugins/resolveUI.ts`, nouveau store Nexus `tenants/{id}/uiOverrides`, `src/verticals/custom/custom.blueprint.ts` (à assouplir).

**Livrables** :
1. Étendre `IVerticalUIPlugin.ComponentOverrides` (aujourd'hui verticale-only) au niveau tenant. Slots à définir : `StatCard`, `PageHeader`, `EmptyState`, `FilterBar`, `ActionToolbar`, `Sidebar`, `Topbar`.
2. Fonction `resolveUI(tenantId, variant, componentKey)` qui consulte dans l'ordre :
   - `Nexus.adapter.get('tenants/{id}/uiOverrides')` → override tenant
   - `VerticalUIRegistry.get(variant).ComponentOverrides` → override verticale
   - défaut système
3. Variant `custom` : blueprint minimal (aucune capability par défaut) + le compiler composable à la carte.
4. Branding : brancher `CompanyProfile.branding.primaryColor/logoUrl/fontFamily` sur `TenantSeeder` → écrit dans `TenantConfig.theme` au provisioning.
5. Tests : override tenant remplace un composant ; variant `custom` compose 3 capabilities librement ; couleurs = ce qui a été scrapé.

**Piège possible** : `IVerticalUIPlugin.ComponentOverrides` peut ne pas exister sous ce nom aujourd'hui — vérifier avec `rg "ComponentOverrides|IVerticalUIPlugin"` avant de commencer. Si absent, le créer proprement.

### 🥈 P5 — Câblage unique (8 maps dérivées)

**Objectif** : ajouter une verticale = déposer 1 blueprint (fini de toucher 8 fichiers à la main).

**Blast radius** : risqué — 8 `Record<PlatformVariant, …>` sont partout. Migrer une map à la fois avec tests.

**Livrables** :
1. `src/verticals/_shared/catalog/derivations.ts` : dérive `VERTICAL_DEFAULT_TOKENS`, `VERTICAL_APPEARANCE`, `VERTICAL_META`, `VERTICAL_SUPPORT_CONTEXTS`, `VERTICAL_LEGAL_TYPES`, `SYSTEM_TENANTS_MAP`, `DNA_REGISTRY`, `BRAND_FONT_OPTIONS` du `VerticalBlueprintRegistry` unique.
2. Refactor progressif : une map par commit, tsc vert à chaque étape.
3. Les 8 fichiers existants remplacés par des ré-exports depuis `derivations.ts`.

**Piège possible** : certaines maps ont des overrides manuels (fonts custom pour un tenant particulier) — les préserver via des overrides séparés, pas en dupliquant la source.

### 🥉 P6 — Certification runtime + CLIs + ADR-016

**Objectif** : rendre la forge entièrement démontrable et documentée.

**Livrables** :
1. `scripts/certify-vertical.ts` : monte le plugin d'une verticale + rend chaque route + rejoue une vente NF525 → prouve « ça marche vraiment », pas juste « ça compile ».
2. `scripts/scrape-company.ts` : CLI qui appelle `scrapeCompany(url)` et affiche le `CompanyProfile` en JSON pretty-print.
3. `docs/adrs/ADR-016.md` : ADR « Profondeur produite (L0-L3 build-time) vs Profondeur affichée (essential/manager/enterprise runtime) — distinction stricte ».
4. MAJ `skill:vertical-forge` (dans `.claude/skills/` ou équivalent) pour refléter l'état réel du code (§C.9 BlindSpot, §C.10 Dérivation, templates P3, etc.).

---

## 3️⃣ Conventions à respecter (rappel)

- **Loi 6 AGENTS.md** : lire `.claude/sessions.md`, s'inscrire avec chemins explicites, écrire `.claude/.active-session` = son nom.
- **RTK proxy** pour vérifier preflight brut (piège connu : RTK cache tsc/build/eslint).
- **Barrel Contract** strict : imports depuis `@/modules/<pilier>` uniquement, jamais sous-chemin (sauf tests).
- **Zéro stub déguisé** : toute feature = logique métier complète bout en bout.
- **NF525 / SovereignGuard / microunits** : jamais touchés par le générateur, jamais bypass.
- **Commits** : locaux uniquement (pas de push, migration GitLab en cours), sans `Co-Authored-By`.
- **CompanyScrapeAgent.ts modifié par un autre agent** : le fichier a été refactoré (imports dynamiques `node:dns` au lieu de statiques). Cette modification est UNSTAGED sur cette session — la traiter comme un état existant, ne pas la reverter.

---

## 4️⃣ État preflight sortant

- `tsc --noEmit` : **0 erreur**
- `vitest run` : **~2230 tests verts** (+230 sur les 2000 pré-existants, 1 skipped historique)
- `sentrux check .` : **3 violations baseline pré-existantes** (cycles POS/CashDrawer, complexity useFocusTrap/LightRAGTransport, god test-helpers) — aucune sur les fichiers Forge Stack.
- `eslint` : **0 erreur** sur le périmètre Forge Stack (Barrel Contract respecté).

---

## 5️⃣ Point d'entrée du prochain agent

**Première commande à taper** :
```bash
git log --oneline -12                        # voir la chaîne des commits Forge Stack
cat docs/plans/MEGA-PLAN-FORGE-STACK-2026-08-22.md | grep -A 20 "PARTIE 3"  # roadmap à jour
cat docs/plans/HANDOFF-FORGE-STACK-2026-08-23.md  # ce fichier
```

Puis attaquer **P4** en s'inscrivant dans `.claude/sessions.md` avec un périmètre explicite du type :
```
| forge-stack-p4-p6 | src/shared/plugins/{IVerticalUIPlugin,resolveUI}.ts, src/verticals/custom/, src/verticals/_shared/catalog/derivations.ts, scripts/{certify-vertical,scrape-company}.ts, docs/adrs/ADR-016.md | 2026-08-XX | active |
```

Bonne route.
