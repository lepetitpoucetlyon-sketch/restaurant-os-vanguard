# Plan d'ingénierie — Câblage des Variantes Restaurant

> **Statut** : proposé · **Date** : 2026-09-03 · **Session** : `claude-plan-cablage-variantes`
> **Portée** : `verticals/_shared/qualification`, `verticals/_shared/catalog`, `lib/TenantSeeder`, `lib/mcc/provisioning`, `app/(admin)/admin/mcc`, `app/api/tenant/onboarding`
> **ADR à produire** : ADR-021 « Quatre voies de configuration tenant »
> **ADR liés** : ADR-004 (verticales universelles), ADR-016 (profondeur build vs runtime), ADR-019 (RBAC kernel/verticale), ADR-020 (localisation handlers)

---

## 0. TL;DR

La question fondatrice : *comment servir petit / moyen / gros restaurant, et des concepts différents (bar, bar à tapas, buffet à volonté, gastronomique, brasserie), sans forker la verticale par tenant ni « tout re-cartographier » ?*

**Réponse en une phrase** : tu as **déjà construit** la bonne architecture (moteur de qualification, `subVariants`, 13 dériveurs, catalogue de 45 capabilities) — mais **le chemin réel de création de tenant l'ignore** et seede la DNA complète (34 modules tous à `true`). Il ne reste **pas** à concevoir : il reste à **souder deux jointures**.

Deux axes **orthogonaux**, jamais fusionnés en une liste plate de « variantes » (ce serait l'explosion combinatoire) :

| Axe | Nature | Réponses possibles | Où ça vit |
|---|---|---|---|
| **Taille** | quantitatif | petit / moyen / gros | `axis1_scale` (`solo\|tpe\|pme\|eti`) + `DisplayDepth` runtime (ADR-016) |
| **Concept** | qualitatif | bar / tapas / buffet / gastro / brasserie | `subVariants` du blueprint (delta de capabilities) |

Et **quatre voies** de configuration, chacune avec un propriétaire distinct — dont la **voie sur-mesure Claude Code** (§4), pour ce que le MCC ne peut pas composer.

Le nœud unique à ouvrir : **Lot 1** (le subVariant doit être appliqué dans `resolve()`) + **Lot 2** (le seed doit écrire les capabilities *calibrées* au lieu de la DNA complète). Ces deux points rendent vivante **toute** la machinerie déjà écrite.

---

## 1. Le constat (vérifié dans le code, 2026-09-03)

### 1.1 La chaîne réelle court-circuite la qualification

Chemin de création B2B (déclenché par le webhook Stripe `checkout.session.completed`) :

```
provisionNewClient(request)                    src/lib/mcc/provisioning/TenantProvisioningService.ts:38
  variant = request.variant ?? 'restaurant'                                              (:43)
  → TenantSeeder.seed({ tenantId, name, adminEmail, variant, primaryColor, siren })      (:61)
      baseDNA = resolveDNA(variant)            src/lib/TenantSeeder.ts:98
      tenantConfig = { ...baseDNA, ... }       src/lib/TenantSeeder.ts:124-159
```

`resolveDNA('restaurant')` renvoie `RESTAURANT_FULL_DNA` (`src/shared/seeds/restaurant-full-dna.ts`), dont le bloc `capabilities` active **34 modules, tous à `true`**. Aucun axe, aucun subVariant, aucune calibration. `provisionNewClient()` **n'importe même pas** `QualificationEngine`.

Conséquence : tout tenant restaurant est provisionné **identique**. `filterByCapabilities` (`src/config/navConfig.ts:364`, consommé par `LayoutResolver.tsx:52` et `DesktopSidebar.tsx:39`) gate bien la nav — mais comme toutes les caps sont `true`, il ne masque rien.

### 1.2 `resolve()` ignore le blueprint et le subVariant

`QualificationEngine.resolve()` (`src/verticals/_shared/qualification/QualificationEngine.ts:241`) construit ses capabilities via `resolveCapabilitiesFromAnswers(answers)` (`:207`) — **uniquement** à partir des 7 axes. Il **ne lit ni** `RESTAURANT_BLUEPRINT.capabilities` (socle du concept) **ni** `RESTAURANT_BLUEPRINT.subVariants[].capabilities` (delta du concept). Donc même si on l'appelait, sélectionner « bar à tapas » n'activerait pas `mod_bar`.

### 1.3 `subVariants` n'est appliqué nulle part

`RESTAURANT_BLUEPRINT.subVariants` (`src/verticals/restaurant/restaurant.blueprint.ts:109`) déclare `bar_tapas` → `{mod_bar, mod_pos}`, `brasserie` → `{mod_kiosk}`, `gastronomique` → `{mod_quotes}`. Les **seuls** lecteurs de ce champ sont des tests (`src/__tests__/verticals/sub-variants-matrix.test.ts`, `src/__tests__/forge/vertical-forge.test.ts`). Aucun consommateur runtime.

### 1.4 L'UI MCC est un mockup décoratif

`QualificationTab.tsx` (`src/app/(admin)/admin/mcc/_tabs/QualificationTab.tsx`) : `useState` locaux (`tier`, `displayDepth`, `aiLevel`) qui ne pilotent rien. Les rôles affichés sont la **chaîne codée en dur** `"DIRECTOR · CHEF · WAITER · CASHIER"` (`:116`), les business-laws et le hardware sont **codés en dur** eux aussi (`:125`, `:136-144`). Aucun appel à `QualificationEngine`, aucun sélecteur de `variant`/`subVariant`, aucune saisie des 7 axes.

### 1.5 L'endpoint de confirmation n'existe pas

La route `auto-morphogenesis` (`src/app/api/tenant/onboarding/auto-morphogenesis/route.ts`) est **preview-only** : elle scrape le site public → `CompanyProfile` et **ne provisionne pas**. Son propre commentaire (`:12-15`) annonce *« un endpoint séparé de confirmation (à créer en P2 avec le QualificationEngine) déclenche `TenantSeeder.seed(...)` »* — **cet endpoint n'existe pas encore**. De plus, le terme « morphogenesis » est sur la liste noire Loi 11 (vocabulaire sci-fi banni).

### 1.6 Synthèse : construit mais orphelin

| Pièce | État | Fichier |
|---|---|---|
| `QualificationEngine.resolve()` | écrit + testé, **appelé nulle part hors tests** | `verticals/_shared/qualification/QualificationEngine.ts` |
| `inferAnswers()` (auto-inférence 7 axes) | écrit, **branché sur rien** | idem `:121` |
| `subVariants` (concepts) | déclarés + testés, **appliqués nulle part** | `verticals/restaurant/restaurant.blueprint.ts:109` |
| 13 dériveurs | écrits ; seuls Rbac + BusinessLaws consommés (par `resolve`) | `verticals/_shared/derivation/` |
| `CapabilityCatalog` (45 caps) | **la cartographie, déjà faite** | `verticals/_shared/catalog/CapabilityCatalog.ts` |
| `filterByCapabilities` | **vivant** (mais sans effet car tout à true) | `config/navConfig.ts:364` |
| `QualificationTab.tsx` | **mockup** | `app/(admin)/admin/mcc/_tabs/QualificationTab.tsx` |
| Endpoint de confirmation | **à créer** | `app/api/tenant/onboarding/` |
| Chemin réel `provisionNewClient` | **ignore tout ce qui précède** | `lib/mcc/provisioning/TenantProvisioningService.ts` |

---

## 2. Le modèle conceptuel : deux axes, quatre voies

### 2.1 Deux axes orthogonaux (ne jamais les multiplier)

- **Taille** = `axis1_scale` (`solo/tpe/pme/eti`) + `axis1_topology` (`mono/multi_independent/franchise`). Pilote `PrecisionTier` (build) via `calibrateDepth()` et `DisplayDepth` (runtime) via `defaultDisplayDepth()`. **Quantitatif** : combien de volume, quelle densité d'affichage.
- **Concept** = `subVariant` (delta de capabilities sur le socle du blueprint). **Qualitatif** : comment on opère.

Fusionner les deux (« petit-bar », « gros-buffet »…) = 4 tailles × N concepts × options = milliers de combinaisons à maintenir = **la peur du « tout re-cartographier »**. Les garder séparés = 4 + ~6 briques composables.

### 2.2 Les 4 voies de configuration tenant (à figer en ADR-021)

1. **Forge / Catalogue** — *build-time, rare, Claude Code pour une capability NEUVE.* On code une capability **une seule fois**, réutilisable par toute la flotte. `CapabilityCatalog.ts` est le magasin d'options ; `PrecisionTier L0–L3` vit ici. La cartographie **est déjà faite**.
2. **MCC / Création** — *par tenant, zéro code.* `variant` + `subVariant` + qualification 7 axes (auto-inférée, l'opérateur confirme) → 13 dériveurs → `CalibratedTenantConfig`. Le cas à 95 %.
3. **Runtime / Gérant** — *réversible, zéro code.* `DisplayDepth` + toggles de capability. `filterByCapabilities` gate la nav en direct.
4. **Sur-mesure / Claude Code** — *exception gouvernée* (détaillée §4). Quand le MCC ne peut pas composer : Claude Code **produit une capability** (catalogue ou extension tenant-scoped) ; le MCC **l'assigne** (flag). **Jamais** de `if (tenantId === 'x')` dans le code partagé.

> **La résolution de ta question** : « si tel tenant veut tel truc particulier, le MCC ne peut pas le faire » → exact, et c'est **normal**. Claude Code fabrique la capability (voie 4, une fois), le MCC se contente ensuite de l'**activer** sur ce tenant (voie 2, un flag). Même une capability à un seul tenant vit dans le catalogue, **pas** en fork.

---

## 3. La chaîne cible

```
Wizard MCC (QualificationTab réel)
  → answers (7 axes, pré-inférés via inferAnswers) + variant + subVariantSlug
  → POST /api/tenant/onboarding/confirm            (NOUVEL endpoint, human-in-the-loop)
     → QualificationEngine.resolve({ variant, subVariantSlug, answers, companyProfile })
        capabilities = mergeCaps(
            RESTAURANT_BLUEPRINT.capabilities,          // socle du concept
            subVariant(subVariantSlug).capabilities,    // delta du concept
            resolveCapabilitiesFromAnswers(answers)     // dérivé des 7 axes
        ) puis resolveCapabilityDependencies(...)
        + recommendedTier + roles + businessLaws + displayDepthDefault + hardware
     → provisionNewClient({ ...request, qualificationProfile })
        → TenantSeeder.seed({ ..., qualificationProfile })   // écrit les caps CALIBRÉES
  → filterByCapabilities gate la nav sur le sous-ensemble réel
```

---

## 4. La voie sur-mesure Claude Code (gouvernée) — détail

C'est le point que tu as insisté à garder. Il est légitime **et** encadré pour ne pas redevenir le fork combinatoire.

### 4.1 Anti-pattern absolu (interdit)

```ts
// ❌ INTERDIT — dans du code de verticale partagé
if (tenantId === 'tenant_12345678900012') {
  price = coversCount * FLAT_RATE;   // logique d'un seul client dans le tronc commun
}
```

Pourquoi : ça couple le code partagé à un tenant, contamine tous les autres, casse le test bout-en-bout, et n'est ni mesurable ni promouvable.

### 4.2 Pattern A — capability catalogue (préféré, même pour 1 seul tenant)

Quand la particularité est une **fonctionnalité** (un mode de tarification, un écran, un flux) :

1. Ajouter une clé au `CapabilityCatalog` (§ Lot 4 pour le gabarit exact).
2. Câbler la nav (`CapabilityWiring.ts`) + le module qui porte la logique.
3. Le MCC active la clé sur le(s) tenant(s) concerné(s) via `capabilities` du `tenantConfig`.
4. `filterByCapabilities` fait le reste : dormant partout où la clé est `false`.

La capability peut n'être `true` que sur **un** tenant — elle vit quand même dans le catalogue. Si un jour ≥2 tenants la veulent, **rien à réécrire** : on l'ajoute à un `subVariant` ou à un profil (promotion, §4.5).

### 4.3 Pattern B — extension tenant-scoped via registry (logique vraiment spécifique)

Quand la logique est trop spécifique pour le catalogue générique mais doit rester **isolée** :

1. Définir un **contrat neutre** dans `@/kernel/contracts/` (comme `IStockOracle` / `StockOracleRegistry`, cf. ADR-015).
2. Enregistrer une **implémentation** clé-par-tenant dans le registry (DI). Elle n'est résolue que pour ce tenant.
3. Le **handler** vit **à côté** du module qui possède la réaction (ADR-020), et n'est actif que si la capability tenant correspondante est `ON`.
4. Le tronc commun appelle **le contrat**, jamais l'implémentation ni le `tenantId` en dur.

```ts
// ✅ le tronc commun ne connaît que le contrat
const pricing = PricingStrategyRegistry.resolveFor(tenantId); // renvoie la stratégie standard par défaut
const total = pricing.computeTotal(order);                    // surchargée seulement là où enregistrée
```

### 4.4 Gouvernance (Loi 8)

- Toute capability/extension sur-mesure démarre `@wip owner:<équipe> échéance:<date>` — la **Gate 6** (`scripts/gate-last-mile.mjs`) l'exige tant qu'elle n'est pas livrée bout-en-bout (rendu + réglage lu + libellés `fr.ts` + handlers invoqués).
- Elle porte ses libellés `t()` dans `fr.ts` (+ parité 5 locales) dès le départ, sinon la clé s'affiche brute.

### 4.5 Chemin de promotion

Critère simple : **dès qu'un 2ᵉ tenant demande la même chose**, la capability sur-mesure est **graduée** en standard — ajoutée à un `subVariant` existant, à un nouveau `subVariant`, ou au socle du blueprint. Aucune réécriture : c'est déjà une capability du catalogue, on change seulement **qui l'active**.

### 4.6 Rôle exact de Claude Code vs MCC

| | Claude Code (voie 4) | MCC (voie 2) |
|---|---|---|
| Produit | **la capability** (code, une fois) | **l'assignation** (flag, par tenant) |
| Fréquence | rare (nouveau besoin réel) | à chaque création/ajustement |
| Touche le code partagé | oui, mais additif (catalogue/registry) | non |
| Résultat | brique réutilisable | tenant configuré |

---

## 5. Décisions d'architecture à acter (ADR-021)

1. **Source de vérité des capabilities à la création = qualification calibrée**, pas la DNA complète. `TenantSeeder.seed()` par défaut ne doit **plus** activer les 34 modules. La DNA complète reste réservée : (a) fallback quand aucun profil n'est fourni, (b) tenants `_ref_`/`_demo_` (référence & démo), (c) `cloneFromReference` (déjà un chemin distinct).
2. **`resolve()` fusionne trois sources** dans cet ordre : socle blueprint → delta subVariant → dérivé des 7 axes → résolution des dépendances. (Les axes peuvent **ajouter** au concept, jamais retirer une dépendance structurelle.)
3. **Règle des 4 voies** + interdiction du `if (tenantId)` en dur (§4.1).
4. **Rétro-compatibilité** : le param `qualificationProfile` de `seed()` est **optionnel** ; sans lui, comportement actuel (DNA complète) — aucune régression sur clone/ref/démo.

---

## 6. Les Lots

> Ordre conseillé : **Lot 1 → Lot 2** débloquent tout. Lots 3-4-5-6 ensuite, parallélisables.

### Lot 0 — Cadrage & invariants

| # | Tâche | Fichier | Fait quand |
|---|---|---|---|
| 0.1 | Écrire ADR-021 « 4 voies de configuration tenant » (dont §4 sur-mesure) | `docs/adrs/ADR-021-quatre-voies-configuration-tenant.md` | Règle anti-fork référençable en review |
| 0.2 | Acter les 4 décisions du §5 | dans ADR-021 | `seed()` par défaut ≠ toutes caps à true (décision écrite) |
| 0.3 | S'inscrire dans la coordination | `.claude/sessions.md` + `.claude/.active-session` | Périmètre déclaré, pas de collision |

---

### Lot 1 — `subVariant` → capabilities (le déblocage)

**Objectif** : sélectionner un concept applique réellement son delta.

#### 1.1 — Typer/exporter `SubVariant`
- **Fichier** : `src/verticals/_shared/blueprint/VerticalBlueprint.ts`
- **Action** : vérifier que le champ `subVariants?: SubVariant[]` est typé et exporter `SubVariant { slug: string; label: string; description: string; capabilities: Partial<CapabilitySet> }`.
- **Fait quand** : `import { SubVariant } from '@/verticals/_shared/blueprint'` compile.

#### 1.2 — Helper `resolveSubVariantCapabilities`
- **Fichier** : `src/verticals/_shared/catalog/` (nouveau helper, ou étendre `derivations.ts`)
- **Action** :
```ts
export function resolveSubVariantCapabilities(
  blueprint: VerticalBlueprint,
  subVariantSlug?: string,
): CapabilitySet {
  const base = { ...blueprint.capabilities };
  const sub = subVariantSlug
    ? blueprint.subVariants?.find(v => v.slug === subVariantSlug)?.capabilities ?? {}
    : {};
  const merged = { ...base, ...sub };
  const active = (Object.keys(merged) as CapabilityKey[]).filter(k => merged[k] === true);
  for (const dep of resolveCapabilityDependencies(active)) merged[dep] = true;
  return merged;
}
```
- **Piège** : un `subVariant` ne doit fusionner que des `true` (un `false` explicite ne doit pas *désactiver* une cap du socle sans intention — trancher en 0.2). Ici on ne prend que les clés `=== true`.
- **Fait quand** : `resolveSubVariantCapabilities(RESTAURANT_BLUEPRINT, 'bar_tapas')` contient `mod_bar` **et** `mod_pos` (+ dépendances).

#### 1.3 — `resolve()` fusionne blueprint + subVariant + axes
- **Fichier** : `src/verticals/_shared/qualification/QualificationEngine.ts`
- **Action** : ajouter `subVariantSlug?: string` et `blueprint?: VerticalBlueprint` à l'input de `resolve()`, puis fusionner :
```ts
const fromAnswers = resolveCapabilitiesFromAnswers(answers).capabilities;
const fromConcept = blueprint
  ? resolveSubVariantCapabilities(blueprint, subVariantSlug)
  : {};
const capabilities = mergeAndResolveDeps({ ...fromConcept, ...fromAnswers });
```
- **Piège** : garder la rétro-compat — si `blueprint` absent, comportement actuel (axes seuls). Ne pas importer `@/verticals/restaurant/...` depuis `_shared` (cycle) : passer le blueprint en **argument**, résolu par l'appelant via le registry (`VerticalBlueprintRegistry`).
- **Fait quand** : `resolve({ variant:'restaurant', subVariantSlug:'bar_tapas', answers, blueprint })` inclut le socle restaurant + `mod_bar`.

#### 1.4 — Test d'intégration sur `resolve()`
- **Fichier** : `src/__tests__/verticals/sub-variants-matrix.test.ts` (faire évoluer)
- **Action** : passer d'assertions sur la **donnée statique** du blueprint à des assertions sur la **sortie de `resolve()`**.
- **Fait quand** : le test échoue si `resolve()` n'applique pas le delta subVariant.

---

### Lot 2 — Qualification → provisioning (fermer la boucle)

**Objectif** : la création écrit les capabilities calibrées, plus la DNA complète.

#### 2.1 — `seed()` accepte un profil calibré
- **Fichier** : `src/lib/TenantSeeder.ts`
- **État actuel** : `SeedInput` (`:31`) ; `seed()` fait `baseDNA = resolveDNA(variant)` (`:98`) puis `tenantConfig = { ...baseDNA, ... }` (`:124`).
- **Action** : ajouter `qualificationProfile?: QualificationProfile` à `SeedInput`. Si fourni, remplacer le bloc capabilities :
```ts
const baseDNA = resolveDNA(variant);
const capabilities = input.qualificationProfile?.capabilities ?? baseDNA.capabilities;
// ...
tenantConfig = {
  ...baseDNA,
  capabilities,
  status: {
    ...baseDNA.status,
    displayDepth: input.qualificationProfile?.displayDepthDefault ?? baseDNA.status?.displayDepth,
    businessLaws: { ...baseDNA.status.businessLaws, ...input.qualificationProfile?.businessLaws },
  },
};
```
- **Piège NF525/microunits** : ne rien changer au genesis fiscal (`:201`), au PCG (`:173`), aux zones/tables. On ne touche **que** `capabilities` + `displayDepth` + `businessLaws`.
- **Fait quand** : un seed avec `qualificationProfile` produit un `tenantConfig.capabilities` ≠ « tout à true ».

#### 2.2 — `provisionNewClient()` appelle `resolve()`
- **Fichier** : `src/lib/mcc/provisioning/TenantProvisioningService.ts` (`:38`) + `./types` (`ProvisioningRequest`)
- **Action** :
  1. Ajouter `answers?: QualificationAnswers` et `subVariantSlug?: string` à `ProvisioningRequest`.
  2. Avant `TenantSeeder.seed` (`:61`), si `request.answers` présent :
```ts
const blueprint = VerticalBlueprintRegistry.resolve(variant);
const qualificationProfile = QualificationEngine.resolve({
  variant, subVariantSlug: request.subVariantSlug,
  answers: request.answers, blueprint,
  companyProfile: /* si scrape dispo */ undefined,
});
```
  3. Passer `qualificationProfile` à `seed()`.
  4. Persister aussi le `DisplayDepth` par défaut là où l'atom runtime le lit (`src/kernel/settings/displayDepth.ts`).
- **Piège** : `provisionNewClient` est appelé par le **webhook Stripe** (sans opérateur). Deux modes : (a) via wizard MCC → `answers` fournis ; (b) via Stripe self-serve → pas d'`answers` → fallback DNA (ou `defaultAnswers()`). Décider en 0.2 ; par défaut, self-serve = `defaultAnswers()` calibré, pas DNA complète.
- **Fait quand** : le `tenantConfig` provisionné reflète les 7 axes + le concept.

#### 2.3 — Créer l'endpoint de confirmation
- **Fichier** : `src/app/api/tenant/onboarding/confirm/route.ts` (**nouveau**)
- **Action** : `POST` — body = `{ answers, variant, subVariantSlug, companyProfile? }`. Valider `QualificationAnswersSchema` (Zod). Garde RBAC MCC (`requireMccLevel`, cf. CLAUDE.md Loi 12). → `resolve()` → `provisionNewClient()` / `TenantSeeder.seed()`. Human-in-the-loop (c'est l'endpoint annoncé dans `auto-morphogenesis:12-15`).
- **Piège sécurité** : ne jamais provisionner sur données inférées sans confirmation opérateur (frontière onboarding).
- **Fait quand** : `POST` valide → tenant seedé calibré ; body invalide → 400 Zod.

#### 2.4 — Brancher `inferAnswers()` au preview
- **Fichier** : `src/app/api/tenant/onboarding/auto-morphogenesis/route.ts` (`:44`)
- **Action** : après `scrapeCompany`, appeler `inferAnswers(profile, study)` et renvoyer `{ profile, inferredAnswers }` pour pré-remplir le wizard.
- **Fait quand** : la réponse du preview contient `inferredAnswers`.

---

### Lot 3 — UI MCC réelle (dé-mockup)

**Objectif** : transformer `QualificationTab.tsx` en vrai poste de qualification.

#### 3.1 — Formulaire 7 axes + sélecteurs variant/subVariant
- **Fichier** : `src/app/(admin)/admin/mcc/_tabs/QualificationTab.tsx`
- **Action** : remplacer les 3 `useState` décoratifs par un état `QualificationAnswers` complet + `<select>` variant + `<select>` subVariant (options = `blueprint.subVariants`). Pré-remplir via `inferredAnswers` (2.4).
- **Fait quand** : les 7 axes de `QualificationAnswersSchema` sont saisissables.

#### 3.2 — Afficher le profil RÉEL dérivé
- **Action** : appeler `QualificationEngine.resolve()` (côté client si pur, sinon via un endpoint `preview-resolve`) et afficher `roles`, `businessLaws`, `hardware`, `capabilities` **calculés**. Supprimer `"DIRECTOR · CHEF · WAITER · CASHIER"` (`:116`) et le hardware en dur (`:136-144`).
- **Fait quand** : changer un axe change le profil affiché.

#### 3.3 — Bouton « Provisionner »
- **Action** : `POST /api/tenant/onboarding/confirm` (2.3) avec les answers validés.
- **Fait quand** : un tenant réel apparaît en flotte après confirmation.

#### 3.4 — Nettoyage charte (Loi 11)
- **Action** : remplacer `cyan-500`/`cyan-400` (couleur « AI ») par les tokens de marque or ; retirer tout vocabulaire hors-charte.
- **Fait quand** : plus de `cyan-*` ; palette = tokens marque.

---

### Lot 4 — Buffet à volonté (l'exemple Forge / voie 1)

**Objectif** : ajouter le concept que tu as cité et qui exige une **capability neuve** (tarif au couvert forfaitaire, pas à l'article).

#### 4.1 — Nouvelle capability au catalogue
- **Fichier** : `src/verticals/_shared/catalog/CapabilityCatalog.ts` (bloc `RAW_CATALOG`, `:55`)
- **Action** : ajouter
```ts
mod_cover_pricing: { key: 'mod_cover_pricing', label: 'Tarif au couvert', pillar: 'ops',
  description: 'Facturation au couvert forfaitaire (buffet à volonté), pas à l\'article.',
  dependsOn: ['mod_pos'] },
```
- **Piège** : ne pas introduire de chiffre en dur ; le montant du forfait est une `businessLaw` du tenant, pas une constante catalogue. Prix en **microunits** (`toMicrounits`), jamais en cents (CLAUDE.md).
- **Fait quand** : `CapabilityKey` inclut `mod_cover_pricing`, dépend de `mod_pos`.

#### 4.2 — Câblage nav + module de pricing
- **Fichiers** : `src/verticals/_shared/catalog/CapabilityWiring.ts` + le module ops de tarification.
- **Action** : rattacher la capability à une section nav ; brancher la stratégie « prix = nb couverts × forfait » dans le calcul de ticket (via le contrat pricing du §4.3 si on veut la rendre surchargeable).
- **Fait quand** : capability ON → section visible + total calculé au couvert.

#### 4.3 — Nouveau subVariant `buffet_volonte`
- **Fichier** : `src/verticals/restaurant/restaurant.blueprint.ts` (`subVariants`, `:109`)
- **Action** :
```ts
{ slug: 'buffet_volonte', label: 'Buffet à volonté',
  description: 'Tarif au couvert forfaitaire, débit continu, réassort suivi.',
  capabilities: { mod_cover_pricing: true } },
```
- **Fait quand** : sélectionner `buffet_volonte` (via Lot 1) merge `mod_cover_pricing`.

#### 4.4 — Libellés + bout-en-bout (Loi 8)
- **Fichiers** : `src/i18n/locales/*.ts` (5 locales — ⚠️ parité, piège `measure` i18n)
- **Action** : ajouter les clés `t()` du module ; test bout-en-bout (rendu + réglage lu + libellés + handlers).
- **Coordination** : `claude-m14-i18n` est **active** sur `src/i18n/` — se synchroniser avant d'y écrire (ne pas écraser sa livraison).
- **Fait quand** : `npm run measure` = 0 clé i18n manquante ; Gate 6 verte.

---

### Lot 5 — Voie sur-mesure Claude Code (gouvernée)

**Objectif** : matérialiser §4 en règles + gabarit.

| # | Tâche | Fichier | Fait quand |
|---|---|---|---|
| 5.1 | Écrire la règle (Pattern A/B, anti-`if(tenantId)`) | ADR-021 §voie 4 | Règle + anti-pattern documentés |
| 5.2 | Gabarit extension tenant-scoped (contrat + registry + handler co-localisé ADR-020) | `src/kernel/contracts/` + handler | Un handler ne s'exécute que si sa capability tenant est `true` |
| 5.3 | Convention `@wip` owner+échéance sur toute cap sur-mesure | Gate 6 | Le composant porte `@wip` owner+date |
| 5.4 | Critère de promotion (≥2 tenants → preset) | process MCC | Une cap sur-mesure devient standard sans réécriture |

---

### Lot 6 — Garde-fous & mesure

| # | Tâche | Fichier | Fait quand |
|---|---|---|---|
| 6.1 | Renommer `auto-morphogenesis` → `auto-qualification` (Loi 11) | `app/api/tenant/onboarding/auto-morphogenesis/` + appelants | 0 occurrence du terme banni |
| 6.2 | Invariant : un tenant seedé calibré **n'a pas** toutes les caps à true | `src/__tests__/verticals/` (nouveau) | Le test échoue si la calibration est contournée |
| 6.3 | `npm run measure` avant/après | `.measures/history.jsonl` | Engine plus « orphelin », Tab plus « handler inerte », 0 chiffre en dur ajouté |
| 6.4 | `npm run preflight` complet | `scripts/preflight.sh` | tsc 0 · vitest · sentrux · next build OK |

---

## 7. Ordre d'exécution & dépendances

```
Lot 0 (cadrage)
   └─> Lot 1 (subVariant→resolve)  ← débloque tout
          └─> Lot 2 (resolve→seed calibré)
                 ├─> Lot 3 (UI MCC réelle)
                 └─> Lot 4 (buffet : capability + subVariant)   [coord. i18n avec claude-m14-i18n]
   Lot 5 (sur-mesure) ─ parallèle, dépend seulement de l'ADR-021
   Lot 6 (garde-fous) ─ en continu ; 6.2 après Lot 2, 6.1 indépendant
```

**Chemin critique** : 0 → 1 → 2. Une fois `seed()` calibré, la machinerie déjà écrite (13 dériveurs, `filterByCapabilities`, DisplayDepth) devient effective sans travail supplémentaire.

---

## 8. Annexe — inventaire des pièces existantes

| Pièce | Fichier | Rôle |
|---|---|---|
| Blueprint restaurant (+ subVariants) | `src/verticals/restaurant/restaurant.blueprint.ts` | Socle + concepts + tokens + rôles |
| DNA complète (fallback/démo) | `src/shared/seeds/restaurant-full-dna.ts` | 34 modules tous à true |
| Catalogue capabilities (45) | `src/verticals/_shared/catalog/CapabilityCatalog.ts` | Cartographie + deps + hardware |
| Profils archétypaux (A–H) | `src/verticals/_shared/catalog/ProfileArchetype.ts` | Socle par profil (A = food) |
| Câblage capability→nav | `src/verticals/_shared/catalog/CapabilityWiring.ts` | Montre/cache sections |
| Answers 7 axes (Zod) | `src/verticals/_shared/qualification/QualificationAnswers.ts` | Contrat de saisie + `defaultAnswers()` |
| Moteur de qualification | `src/verticals/_shared/qualification/QualificationEngine.ts` | `inferAnswers` · `calibrateDepth` · `resolve` |
| 13 dériveurs | `src/verticals/_shared/derivation/` | Rbac, BusinessLaws, Pricing, Hardware, Legal, Rgpd… |
| Seeder | `src/lib/TenantSeeder.ts` | Écrit `tenantConfig` + PCG + genesis fiscal |
| Provisioning MCC | `src/lib/mcc/provisioning/TenantProvisioningService.ts` | Orchestration création B2B + clone _ref_ |
| UI qualification (mockup) | `src/app/(admin)/admin/mcc/_tabs/QualificationTab.tsx` | À dé-mocker (Lot 3) |
| Preview scrape | `src/app/api/tenant/onboarding/auto-morphogenesis/route.ts` | `CompanyProfile` (à renommer, Lot 6.1) |
| Gate nav runtime | `src/config/navConfig.ts:364` | `filterByCapabilities` (vivant) |
| DisplayDepth runtime | `src/kernel/settings/displayDepth.ts` | Atom `displayDepthAtom` + `<DisplayDepthGate>` |

---

*Diagnostic vérifié dans le code le 2026-09-03. Re-mesurer (`npm run measure`) avant d'agir. Aucun chiffre d'état figé ici (Zero-Claim Policy).*
