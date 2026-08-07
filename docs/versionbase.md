# VERSIONBASE — Organisation DEMO / TEST / REFERENCE

> Plan d'implémentation complet du système de tenants base pour toutes les verticales.
> Applicable aujourd'hui (8 verticales) et automatiquement à toute verticale future.

---

## 1. Principe

Avant tout vrai client, chaque verticale dispose de **3 tenants système** permanents
gérés par le MCC. Ces tenants ne sont jamais facturés, jamais exposés dans la fleet
cliente, et obéissent à des règles strictes de mutabilité.

```
Pour chaque verticale V :

  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────────┐
  │   _demo_V        │   │   _test_V        │   │   _ref_V             │
  │   DEMO           │   │   TEST           │   │   REFERENCE          │
  │                  │   │                  │   │                      │
  │  Vitrine client  │   │  Bac à sable dev │   │  Maître cloneable    │
  │  Données figées  │   │  Données réelles │   │  Données parfaites   │
  │  NE SE MODIFIE   │   │  RESET libre     │   │  NE SE MODIFIE QUE  │
  │  JAMAIS          │   │                  │   │  par promotion MCC   │
  └──────────────────┘   └──────────────────┘   └──────────────────────┘
          │                                               │
          │                                        vrai client signé
          │                                               │
          │                                               ▼
          │                                    tenant_{siret}  (CLIENT)
          │                                    deep-copy de _ref_V
          │                                    + overrides SIRET/email/branding
          │
          └── Accessible au prospect pour évaluation
              sans engagement, sans Stripe
```

Les tenantIds commencent par `_` pour les distinguer visuellement des clients réels
(`tenant_{siret}`). Le SovereignGuard filtre automatiquement les tenants `_*` de la
fleet MCC normale.

---

## 2. Les 24 tenants système (8 verticales × 3 tiers)

```
_demo_restaurant   _test_restaurant   _ref_restaurant
_demo_hotel        _test_hotel        _ref_hotel
_demo_bakery       _test_bakery       _ref_bakery
_demo_garage       _test_garage       _ref_garage
_demo_salon        _test_salon        _ref_salon
_demo_clinic       _test_clinic       _ref_clinic
_demo_retail       _test_retail       _ref_retail
_demo_custom       _test_custom       _ref_custom
```

À chaque nouvelle verticale ajoutée au registre, 3 tenants système sont créés
automatiquement par le script de bootstrap — aucune action manuelle.

---

## 3. Détail de chaque tier

### 3.1 DEMO (`_demo_V`)

**Rôle** : présenter l'OS au prospect lors d'une démo commerciale ou d'un accès libre.

**UI** :
- Route `/landing` → landing page marketing complète (composants :
  `LandingNavbar`, `HeroSection`, `FeaturesSection`, `PricingSection`,
  `TestimonialsSection`, `CTASection`, `LandingFooter`)
- Route `/showcase` → page vitrine technique premium (dark, hero doré, grilles features)
- `brandingMode: 'custom'` + `splashEnabled: true` → `SplashGate` déclenche
  `SplashScreen` à chaque ouverture (logo OS + fond couleur charte + fade vers l'app)
- Bouton "Démo Technique" dans `CTASection` → `/showcase` → login DEMO automatique

**Données** :
- Données fictives mais réalistes et belles (menus complets, réservations,
  commandes POS, analytics bidon, staff factice)
- Scellements NF525 fictifs (Genesis seal + quelques entrées de démonstration)
- Aucune donnée personnelle réelle, aucun SIRET réel

**Règles** :
- Écriture BLOQUÉE (aucun endpoint ne peut modifier les données DEMO)
- Suppression INTERDITE
- Pas de Stripe, pas d'envoi email réel
- Reset via MCC uniquement (restaure le snapshot initial)
- RAG workspace fixe avec questions-réponses scriptées

**BrandTokens** :
```typescript
{
  tenantId:     '_demo_restaurant',
  brandName:    'Restaurant OS · Démo',
  tagline:      'Découvrez la puissance de votre futur OS',
  primaryColor: '#C5A358',   // Vanguard Gold
  brandingMode: 'custom',
  splashEnabled: true,
  logoUrl:      null,        // logo OS par défaut
}
```

---

### 3.2 TEST (`_test_V`)

**Rôle** : environnement de développement officiel pour tester les nouvelles
features avant de les promouvoir en REFERENCE.

**UI** :
- `brandingMode: 'default'` → pas de splash, landing standard
- Bandeau visible en haut de l'app : `⚠️ ENVIRONNEMENT TEST — données factices`
- Toutes les routes accessibles, y compris les routes admin et MCC

**Données** :
- Données de développement libres — peuvent être n'importe quoi
- Fiscalité NF525 en mode fictif (scellements valides techniquement mais marqués TEST)
- Reset à la demande : le script `reset-test-tenant.ts` repart du DNA initial

**Règles** :
- Écriture LIBRE — les devs peuvent tout casser
- Reset LIBRE via commande MCC ou CLI
- Promotion vers REFERENCE via action MCC dédiée (décrite en §5)
- Pas de Stripe, pas d'envoi email réel
- RAG workspace de dev (peut être réinitialisé)

**BrandTokens** :
```typescript
{
  tenantId:     '_test_restaurant',
  brandName:    'Restaurant OS · TEST',
  tagline:      'Environnement de développement',
  primaryColor: '#3B82F6',   // Bleu dev — différent du gold prod
  brandingMode: 'default',
  splashEnabled: false,
}
```

---

### 3.3 REFERENCE (`_ref_V`)

**Rôle** : maître absolu. Chaque nouveau client est un clone de ce tenant.
C'est la version aboutie, validée, et testée de chaque verticale.

**UI** :
- `brandingMode: 'default'` → landing standard, pas de splash
- Affiche un bandeau MCC-only : `🔒 RÉFÉRENCE — lecture seule`
- Le prospect ne voit jamais ce tenant directement (c'est le DEMO pour ça)

**Données** :
- Données parfaites : menus propres, plan de salle cohérent, comptabilité PCG
  équilibrée, scellements NF525 valides, connecteurs en état `pending_config`
- C'est ce qui sera livré à chaque nouveau client

**Règles** :
- Écriture BLOQUÉE sauf via la procédure de promotion depuis TEST (§5)
- Suppression INTERDITE
- Pas de Stripe, pas d'email
- Jamais exposée dans la fleet cliente
- Versionné : chaque promotion crée un snapshot horodaté

**BrandTokens** :
```typescript
{
  tenantId:     '_ref_restaurant',
  brandName:    'Restaurant OS',
  tagline:      null,
  primaryColor: '#C5A358',
  brandingMode: 'default',
  splashEnabled: false,
}
```

---

## 4. Tableau récapitulatif

```
                    DEMO          TEST          REFERENCE     CLIENT
────────────────────────────────────────────────────────────────────────
tenantId prefix     _demo_        _test_        _ref_         tenant_
tier (champ Nexus)  DEMO          TEST          REFERENCE     CLIENT
Visible fleet MCC   panneau sys.  panneau sys.  panneau sys.  fleet normale
Visible prospect    oui           non           non           n/a
Écriture data       BLOQUÉE       libre         BLOQUÉE       libre
Reset               snapshot MCC  libre         interdit      procédure MCC
Suppression         JAMAIS        reset ok      JAMAIS        procédure MCC
Stripe              non           non           non           oui
Emails réels        non           non           non           oui
NF525/fiscal        fictif démonstratif  fictif dev   parfait validé  réel
RAG workspace       scriptée fixe dev reset ok   validé        clone ref
brandingMode        custom        default       default       hérité ref
splashEnabled       true          false         false         configurable
Landing /landing    oui (vitrine) non           non           oui (branded)
Showcase /showcase  oui           non           non           non
SplashScreen        oui           non           non           si mode=custom
```

---

## 5. Flux de vie d'une feature

```
  ① Dev implémente sur _test_V
         │
         │  feature stable, tests passent (npx vitest run)
         │  npx tsc --noEmit → 0 erreurs
         ▼
  ② MCC : action "Promouvoir TEST → REFERENCE"
         │
         │  Crée snapshot horodaté de l'ancienne REFERENCE
         │  Copie les documents Nexus modifiés de _test_ vers _ref_
         │  (uniquement les collections listées dans PromotionManifest)
         ▼
  ③ _ref_V mis à jour
         │
         │  (optionnel) MCC : "Synchroniser DEMO depuis REFERENCE"
         │  recharge le snapshot DEMO depuis la nouvelle REFERENCE
         ▼
  ④ Vente signée → MCC : "Nouveau client"
         │
         │  cloneFromReference(variant, { siret, email, branding, plan })
         ▼
  ⑤ tenant_{siret} créé
         deep-copy de _ref_V via Nexus.adapter
         + overrides : SIRET, email owner, branding client, planId
         + TenantProvisioningService : Stripe customer, RAG workspace,
           DNS sous-domaine, Firebase Auth owner, envoi email PIN
```

---

## 6. Implémentation — Ce qui change dans le code

### P0 — `tier` dans le schema tenant *(5 min)*

Fichier : `src/domain/schemas/tenant.ts`

Le champ `tier` existe déjà en `z.string().optional()`. Le typer strictement :

```typescript
// Remplacer :
tier: z.string().optional(),

// Par :
tier: z.enum(['CLIENT', 'DEMO', 'TEST', 'REFERENCE']).default('CLIENT'),
```

---

### P0 — `SystemTenantRegistry` *(nouveau fichier)*

Fichier : `src/lib/mcc/SystemTenantRegistry.ts`

```typescript
import type { PlatformVariant } from '@/domain/schemas/tenant';

export type SystemTier = 'DEMO' | 'TEST' | 'REFERENCE';

type SystemTenantMap = Record<SystemTier, string>;

const SYSTEM_TENANTS: Record<PlatformVariant, SystemTenantMap> = {
  restaurant: { DEMO: '_demo_restaurant', TEST: '_test_restaurant', REFERENCE: '_ref_restaurant' },
  hotel:      { DEMO: '_demo_hotel',      TEST: '_test_hotel',      REFERENCE: '_ref_hotel'      },
  bakery:     { DEMO: '_demo_bakery',     TEST: '_test_bakery',     REFERENCE: '_ref_bakery'     },
  garage:     { DEMO: '_demo_garage',     TEST: '_test_garage',     REFERENCE: '_ref_garage'     },
  salon:      { DEMO: '_demo_salon',      TEST: '_test_salon',      REFERENCE: '_ref_salon'      },
  clinic:     { DEMO: '_demo_clinic',     TEST: '_test_clinic',     REFERENCE: '_ref_clinic'     },
  retail:     { DEMO: '_demo_retail',     TEST: '_test_retail',     REFERENCE: '_ref_retail'     },
  custom:     { DEMO: '_demo_custom',     TEST: '_test_custom',     REFERENCE: '_ref_custom'     },
};

export function getSystemTenantId(variant: PlatformVariant, tier: SystemTier): string {
  return SYSTEM_TENANTS[variant][tier];
}

export function isSystemTenant(tenantId: string): boolean {
  return tenantId.startsWith('_demo_') ||
         tenantId.startsWith('_test_') ||
         tenantId.startsWith('_ref_');
}

export function getSystemTenantTier(tenantId: string): SystemTier | null {
  if (tenantId.startsWith('_demo_'))      return 'DEMO';
  if (tenantId.startsWith('_test_'))      return 'TEST';
  if (tenantId.startsWith('_ref_'))       return 'REFERENCE';
  return null;
}

export function isWritable(tenantId: string): boolean {
  const tier = getSystemTenantTier(tenantId);
  if (!tier) return true;          // CLIENT → toujours writable
  return tier === 'TEST';          // seul TEST est libre
}

export function getAllSystemTenantIds(): string[] {
  return Object.values(SYSTEM_TENANTS).flatMap(map => Object.values(map));
}
```

---

### P0 — Guard d'écriture dans `SovereignGuard`

Fichier : `src/shared/nexus/guards/SovereignGuard.ts`

Ajouter à la méthode de validation des writes :

```typescript
import { isWritable, isSystemTenant } from '@/lib/mcc/SystemTenantRegistry';

// Dans assertWriteAllowed() ou équivalent :
if (isSystemTenant(tenantId) && !isWritable(tenantId)) {
  throw new Error(
    `[SovereignGuard] Écriture refusée sur tenant système ${tenantId}. ` +
    `Seul _test_* accepte les écritures directes.`
  );
}
```

---

### P0 — Filtrage fleet dans `SovereignGuard`

```typescript
// Exclure les tenants système de la fleet normale
export function isFleetVisible(tenantId: string): boolean {
  return !isSystemTenant(tenantId);
}
```

---

### P1 — Script bootstrap des 24 tenants système

Fichier : `scripts/bootstrap-system-tenants.ts`

Ce script crée les 24 tenants s'ils n'existent pas encore.
Il utilise `TenantSeeder.seed()` (déjà agnostique via `Nexus.adapter`).

```typescript
// Logique générale :
for (const variant of PLATFORM_VARIANTS) {
  // REFERENCE — utilise le DNA existant comme base
  await TenantSeeder.seed({
    tenantId: `_ref_${variant}`,
    name: `${variant} Reference`,
    adminEmail: 'system@restaurantos.internal',
    variant,
    adminPin: process.env.SYSTEM_ADMIN_PIN,  // depuis env, jamais en dur
  });
  await Nexus.adapter.set(`tenants/_ref_${variant}/tenantConfig`, {
    ...existing, tier: 'REFERENCE',
    brandingTokens: REF_BRAND_TOKENS[variant],
  });

  // TEST — même DNA, brandingMode default, couleur bleue dev
  await TenantSeeder.seed({ tenantId: `_test_${variant}`, ... });
  await Nexus.adapter.set(`tenants/_test_${variant}/tenantConfig`, {
    ...existing, tier: 'TEST',
    brandingTokens: TEST_BRAND_TOKENS[variant],
  });

  // DEMO — même DNA + données scriptées riches + brandingMode custom + splash
  await TenantSeeder.seed({ tenantId: `_demo_${variant}`, ... });
  await seedDemoData(variant);  // données fictives belles (commandes, résa, staff...)
  await Nexus.adapter.set(`tenants/_demo_${variant}/tenantConfig`, {
    ...existing, tier: 'DEMO',
    brandingTokens: DEMO_BRAND_TOKENS[variant],
  });
}
```

Commande d'exécution :
```bash
npx tsx scripts/bootstrap-system-tenants.ts
```

---

### P1 — `cloneFromReference()` dans `TenantProvisioningService`

Fichier : `src/lib/mcc/provisioning/TenantProvisioningService.ts`

Nouvelle méthode qui remplace le recours direct au DNA JSON pour les nouveaux clients.

```typescript
// Collections copiées depuis _ref_ vers le nouveau tenant
const CLONABLE_COLLECTIONS = [
  'tenantConfig',
  'categories',
  'products',
  'floors',
  'zones',
  'tables',
  'accounts',       // PCG
  'connectors',
  'brandingTokens',
  // fiscalSeals et journalEntries : NE PAS cloner (NF525 immuable par tenant)
  // Le Genesis seal sera recréé proprement pour le nouveau tenant
];

public static async cloneFromReference(
  variant: PlatformVariant,
  request: ProvisioningRequest
): Promise<ProvisioningResult> {
  const refId    = getSystemTenantId(variant, 'REFERENCE');
  const tenantId = `tenant_${request.siret}`;

  // 1. Copie agnostique via Nexus
  for (const collection of CLONABLE_COLLECTIONS) {
    const items = await Nexus.adapter.list(`tenants/${refId}/${collection}`);
    await Promise.all(
      items.map(item =>
        Nexus.adapter.set(`tenants/${tenantId}/${collection}/${item.id}`, item)
      )
    );
  }

  // 2. Overrides spécifiques au client
  await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
    ...clonedConfig,
    id: tenantId,
    tier: 'CLIENT',
    metadata: {
      name: request.companyName,
      ownerId: request.ownerEmail,
      siren: request.siret,
      createdAt: Date.now(),
    },
    theme: { primaryColor: request.branding.primaryColor },
  });

  // 3. Genesis fiscal seal propre au nouveau tenant
  await FiscalKeyService.provisionForTenant(tenantId);

  // 4. Suite normale : Stripe, RAG, DNS, Firebase Auth...
  return TenantProvisioningService.provisionPostClone(tenantId, request);
}
```

---

### P1 — `BrandTokens` dans le seeding

Fichier : `src/lib/TenantSeeder.ts`

Ajouter l'écriture des `brandingTokens` dans `seed()` selon le tier détecté :

```typescript
// Après l'écriture de tenantConfig :
const tier = getSystemTenantTier(tenantId);
const brandTokens = buildBrandTokens(tenantId, tier, input);
await Nexus.adapter.set(`tenants/${tenantId}/brandingTokens`, brandTokens);
seededPaths.push(`tenants/${tenantId}/brandingTokens`);
```

```typescript
function buildBrandTokens(
  tenantId: string,
  tier: SystemTier | null,
  input: SeedInput
): BrandConfig {
  if (tier === 'DEMO') return {
    tenantId,
    brandName:    `${input.name} · Démo`,
    tagline:      'Découvrez la puissance de votre futur OS',
    primaryColor: '#C5A358',
    brandingMode: 'custom',
    splashEnabled: true,
  };
  if (tier === 'TEST') return {
    tenantId,
    brandName:    `${input.name} · TEST`,
    primaryColor: '#3B82F6',
    brandingMode: 'default',
    splashEnabled: false,
  };
  // REFERENCE ou CLIENT
  return {
    tenantId,
    brandName:    input.name,
    primaryColor: input.primaryColor ?? '#C5A358',
    brandingMode: 'default',
    splashEnabled: false,
  };
}
```

---

### P1 — Données DEMO enrichies

Fichier : `scripts/seed-demo-data.ts` (nouveau)

Le tenant DEMO a besoin de données fictives riches pour impressionner un prospect.
À créer pour chaque verticale :

```
restaurant  → 30 commandes POS (mix valid/en cours), 10 réservations,
              plan de salle avec tables colorées, analytics bidon (CA €),
              staff de 8 personnes, HACCP 3 contrôles
hotel       → 20 réservations chambres, 5 chambres, room service 10 commandes
bakery      → 50 ventes journalières, 3 fournisseurs, 20 produits
garage      → 15 devis, 8 véhicules, planning interventions
salon       → 25 rendez-vous, 5 praticiens, fiche clients
clinic      → 20 dossiers patients fictifs, 10 RDV
retail      → 200 produits, 50 ventes, 3 fournisseurs
custom      → minimal — juste le plan de salle et le menu de base
```

Ces données sont écrites via `Nexus.adapter.set()` — agnostique.
La commande `reset-demo.ts` recharge ce snapshot en cas de reset.

---

### P2 — Panneau MCC "Tenants Système"

Fichier : `src/app/(admin)/admin/mcc/_tabs/SystemTenantsTab.tsx` (nouveau)

Interface MCC pour gérer les 24 tenants système :

```
┌─────────────────────────────────────────────────────┐
│  TENANTS SYSTÈME           [Bootstrapper les 24 ↓]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Restaurant 🍽️                                      │
│  ├── DEMO        [Voir]  [Reset snapshot]           │
│  ├── TEST        [Voir]  [Reset]  [► Promouvoir]    │
│  └── REFERENCE   [Voir]  [Snapshots ▾]              │
│                                                     │
│  Hôtel 🏨                                           │
│  ├── DEMO        [Voir]  [Reset snapshot]           │
│  ├── TEST        [Voir]  [Reset]  [► Promouvoir]    │
│  └── REFERENCE   [Voir]  [Snapshots ▾]              │
│                                                     │
│  ... (8 verticales)                                 │
└─────────────────────────────────────────────────────┘
```

Actions :
- **Voir** : ouvre l'app dans un onglet avec ce tenantId
- **Reset snapshot** (DEMO) : restaure les données initiales scriptées
- **Reset** (TEST) : repart du DNA de la REFERENCE
- **► Promouvoir** (TEST→REF) : ouvre la modale de promotion (§5 détaillé)
- **Snapshots** (REFERENCE) : liste des promotions horodatées avec rollback

---

### P2 — Modale de promotion TEST → REFERENCE

Flux de la promotion :

```
Dev clique [► Promouvoir] sur _test_restaurant
        │
        ▼
Modale :
  "Promouvoir _test_restaurant → _ref_restaurant ?"
  
  Collections à copier :
  ☑ categories (12 items)
  ☑ products (47 items)
  ☑ floors / zones / tables
  ☑ connectors
  ☐ brandingTokens (conserver la REFERENCE)
  ☐ fiscalSeals (JAMAIS)
  
  [Annuler]              [Créer snapshot + Promouvoir]
        │
        ▼
  1. Nexus.adapter.set snapshot horodaté
     tenants/_ref_restaurant/_snapshots/{timestamp}
  2. Copie sélective _test_ → _ref_
  3. NexusEventBus.emit('system.reference_promoted', { variant, timestamp })
  4. Toast : "REFERENCE restaurant mise à jour ✓"
```

---

### P3 — Intégration landing/showcase dans le DEMO

Route `/landing` (déjà dans `src/app/(client)/(public)/landing/`) :
- Accessible publiquement sur le tenant DEMO sans auth
- `CTASection` : bouton "Démo Technique" → `/showcase`

Route `/showcase` (déjà dans `src/app/(client)/(public)/showcase/`) :
- Bouton "Accéder à la démo" → login DEMO automatique avec credentials de démo
  (email + PIN visible, pré-remplis, en mode démo)

`SplashGate` (déjà implémenté) :
- Détecte `brandingMode: 'custom'` + `splashEnabled: true` → déclenche `SplashScreen`
- Après le splash → redirige vers la dernière route visitée (déjà implémenté)

---

## 7. Règle universelle — nouvelles verticales

Toute verticale ajoutée dans `PLATFORM_VARIANTS` (`src/domain/schemas/tenant.ts`)
déclenche automatiquement la création des 3 tenants système lors du prochain
appel à `bootstrap-system-tenants.ts`.

Aucun autre fichier n'est à modifier :
- `SystemTenantRegistry` lit `PLATFORM_VARIANTS` → coverage automatique
- `resolveDNA()` route vers le bon DNA file existant
- Le script de bootstrap itère sur `getAvailableVariants()`

---

## 8. Ordre d'exécution recommandé

```
Sprint 1 (fondations — 1 journée)
  P0-1  Typer tier: enum dans tenant.ts
  P0-2  Créer SystemTenantRegistry.ts
  P0-3  Ajouter isWritable() dans SovereignGuard

Sprint 2 (bootstrap — 1 journée)
  P1-1  Script bootstrap-system-tenants.ts
  P1-2  buildBrandTokens() dans TenantSeeder
  P1-3  Exécuter le bootstrap → 24 tenants créés

Sprint 3 (clonage — 1 journée)
  P1-4  cloneFromReference() dans TenantProvisioningService
  P1-5  Remplacer provisionNewClient() → cloneFromReference()

Sprint 4 (données DEMO — 2 jours)
  P1-6  seed-demo-data.ts (restaurant complet en priorité)
  P1-7  reset-demo.ts (snapshot + restauration)

Sprint 5 (UI MCC — 1 journée)
  P2-1  SystemTenantsTab.tsx dans MCC
  P2-2  Modale de promotion TEST→REFERENCE

Sprint 6 (intégration landing — 0.5 journée)
  P3-1  Bouton "Démo Technique" dans CTASection → /showcase
  P3-2  Login pré-rempli DEMO dans showcase page
```

---

## 9. Ce qui NE change PAS

- L'architecture Nexus et le provider agnostique → intacts
- `TenantSeeder.seed()` → utilisé tel quel par le script bootstrap
- Les DNA files (`*-full-dna.ts`) → conservés comme bootstrap initial des REFERENCE
- `SplashScreen` / `SplashGate` → déjà implémentés, branchés via `brandingTokens`
- La route `/landing` et `/showcase` → déjà construites, réutilisées
- `SovereignGuard` cross-tenant → inchangé (on ajoute juste le guard d'écriture)
- `TenantProvisioningService.provisionNewClient()` → garde son comportement actuel
  jusqu'à ce que `cloneFromReference()` soit validé en TEST

---

## 10. Invariants à ne jamais enfreindre

1. **Un tenant `_ref_*` ne peut être modifié que par la procédure de promotion MCC.**
   Jamais par un appel direct à `Nexus.adapter.set()` depuis du code applicatif.

2. **Les `fiscalSeals` et `journalEntries` ne sont JAMAIS clonés.**
   Chaque tenant (y compris les REFERENCE) a sa propre chaîne NF525 initiée à zéro.

3. **Les tenants `_demo_*` et `_ref_*` ne reçoivent aucun appel Stripe, Resend,
   ni webhook externe.** Le SovereignGuard lève une erreur si `isSystemTenant()`
   est vrai sur ces paths.

4. **Le champ `tier` est posé au seeding et ne change jamais.**
   Un CLIENT ne peut pas devenir REFERENCE, un DEMO ne peut pas devenir CLIENT.

5. **Toute verticale future hérite automatiquement du même schéma.**
   Le pattern est auto-appliqué sans code supplémentaire.
