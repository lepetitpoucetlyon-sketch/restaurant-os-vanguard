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

**Accès prospect** : sous-domaine court mappé dans le middleware (voir §11 Blindspot 5).
Exemple : `demo.restaurant-os.app` → `_demo_restaurant`

**Données** :
- Données fictives mais réalistes et belles (menus complets, réservations,
  commandes POS, analytics bidon, staff factice)
- Scellements NF525 fictifs (Genesis seal + quelques entrées de démonstration)
- Aucune donnée personnelle réelle, aucun SIRET réel

**Règles** :
- Écriture via **Simulacra Mode** (`Nexus.activateSimulacraMode()`) — toutes les
  interactions prospect (POS, tables, KDS...) écrivent dans IndexedDB local.
  Le store Nexus réel du tenant DEMO reste intact. Reset au rechargement de page.
- Suppression INTERDITE côté serveur
- Pas de Stripe, pas d'envoi email réel
- Reset via MCC uniquement (restaure le snapshot initial)
- RAG workspace fixe avec questions-réponses scriptées

**Wiring Simulacra dans `SplashGate.tsx`** :
```typescript
// Avant de laisser entrer le prospect dans l'app DEMO :
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { getSystemTenantTier } from '@/lib/mcc/SystemTenantRegistry';

const tier = getSystemTenantTier(tenantId);
if (tier === 'DEMO') {
  await Nexus.activateSimulacraMode(`demo_${Date.now()}`);
}
```

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
                    DEMO              TEST          REFERENCE     CLIENT
───────────────────────────────────────────────────────────────────────────
tenantId prefix     _demo_            _test_        _ref_         tenant_
tier (champ Nexus)  DEMO              TEST          REFERENCE     CLIENT
Visible fleet MCC   panneau sys.      panneau sys.  panneau sys.  fleet normale
Visible prospect    oui               non           non           n/a
Écriture data       Simulacra Mode    libre         isWritable()  libre
                    (IndexedDB local,               bloque tout
                    store intact)                   sauf promotion
Reset               snapshot MCC      libre         interdit      procédure MCC
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
Il utilise `TenantSeeder.seed()` via le **server adapter** (cross-tenant autorisé).

**⚠️ Prérequis env** :
```bash
SYSTEM_ADMIN_PIN=xxxx          # PIN 4 chiffres, non faible, à ajouter dans .env.example
FIREBASE_SERVICE_ACCOUNT_JSON  # (ou équivalent selon le provider)
```

**⚠️ Itérer sur `PLATFORM_VARIANTS`** (source de vérité), pas `getAvailableVariants()`
(qui ne couvre que les variants avec un DNA file).

```typescript
import { PLATFORM_VARIANTS } from '@/domain/schemas/tenant';
import { ensureServerNexus } from '@/lib/nexus/server';  // initialise le server adapter

// Obligatoire en contexte CLI — sans ça, Nexus.adapter lève une erreur critique
await ensureServerNexus();

for (const variant of PLATFORM_VARIANTS) {
  // REFERENCE — utilise le DNA existant comme base
  await TenantSeeder.seed({
    tenantId: `_ref_${variant}`,
    name: `${variant} Reference`,
    adminEmail: 'system@restaurantos.internal',
    variant,
    adminPin: process.env.SYSTEM_ADMIN_PIN,  // depuis env, jamais en dur
  });
  const refConfig = await Nexus.adapter.get(`tenants/_ref_${variant}/tenantConfig`);
  await Nexus.adapter.set(`tenants/_ref_${variant}/tenantConfig`, {
    ...refConfig, tier: 'REFERENCE',
  });
  await Nexus.adapter.set(`tenants/_ref_${variant}/brandingTokens`, REF_BRAND_TOKENS[variant]);

  // TEST — même DNA, brandingMode default, couleur bleue dev
  await TenantSeeder.seed({ tenantId: `_test_${variant}`, variant,
    adminEmail: 'system@restaurantos.internal',
    adminPin: process.env.SYSTEM_ADMIN_PIN });
  const testConfig = await Nexus.adapter.get(`tenants/_test_${variant}/tenantConfig`);
  await Nexus.adapter.set(`tenants/_test_${variant}/tenantConfig`, {
    ...testConfig, tier: 'TEST',
  });
  await Nexus.adapter.set(`tenants/_test_${variant}/brandingTokens`, TEST_BRAND_TOKENS[variant]);

  // DEMO — même DNA + données scriptées riches + brandingMode custom + splash
  await TenantSeeder.seed({ tenantId: `_demo_${variant}`, variant,
    adminEmail: 'system@restaurantos.internal',
    adminPin: process.env.SYSTEM_ADMIN_PIN });
  await seedDemoData(variant);  // données fictives belles (commandes, résa, staff...)
  const demoConfig = await Nexus.adapter.get(`tenants/_demo_${variant}/tenantConfig`);
  await Nexus.adapter.set(`tenants/_demo_${variant}/tenantConfig`, {
    ...demoConfig, tier: 'DEMO',
  });
  await Nexus.adapter.set(`tenants/_demo_${variant}/brandingTokens`, DEMO_BRAND_TOKENS[variant]);
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

**⚠️ Server-only** : cette méthode fait des lectures cross-tenant (`_ref_*` → `tenant_*`)
que le SovereignGuard client refuserait. Elle doit tourner avec le server adapter
(via `ensureServerNexus()` ou depuis une Server Action / route API admin).

```typescript
// Collections copiées depuis _ref_ vers le nouveau tenant
// fiscalSeals et journalEntries : NE PAS cloner (NF525 immuable par tenant)
const CLONABLE_COLLECTIONS = [
  'categories',
  'products',
  'floors',
  'zones',
  'tables',
  'accounts',       // PCG
  'connectors',
  'brandingTokens',
  // tenantConfig : cloné séparément avec overrides (voir étape 2)
];

public static async cloneFromReference(
  variant: PlatformVariant,
  request: ProvisioningRequest
): Promise<ProvisioningResult> {
  const refId    = getSystemTenantId(variant, 'REFERENCE');
  const tenantId = `tenant_${request.siret}`;

  // 1. Copie agnostique via Nexus (query, pas list)
  for (const collection of CLONABLE_COLLECTIONS) {
    const items = await Nexus.adapter.query(`tenants/${refId}/${collection}`);
    await Promise.all(
      items.map((item: { id: string }) =>
        Nexus.adapter.set(`tenants/${tenantId}/${collection}/${item.id}`, item)
      )
    );
  }

  // 2. tenantConfig cloné avec overrides client + nouvelle clé fiscale
  const refConfig = await Nexus.adapter.get(`tenants/${refId}/tenantConfig`);
  const fiscalSigningKey = FiscalKeyService.generateKey();
  FiscalKeyService.provision(tenantId, fiscalSigningKey);

  await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
    ...refConfig,
    id: tenantId,
    tier: 'CLIENT',
    fiscalSigningKey,           // clé propre au nouveau tenant, jamais partagée
    metadata: {
      ...(refConfig as Record<string, unknown>)?.metadata,
      name: request.companyName,
      ownerId: request.ownerEmail,
      siren: request.siret,
      createdAt: Date.now(),
    },
    theme: { primaryColor: request.branding.primaryColor },
  });

  // 3. Genesis fiscal seal propre au nouveau tenant (chaîne NF525 vierge)
  // (déjà fait par TenantSeeder.seed() si utilisé en amont, sinon à appeler ici)

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

**⚠️ À enregistrer aussi** dans le composant parent des tabs MCC en suivant le pattern
des 10 tabs existants (`FleetTab`, `TreasuryTab`, `ComplianceTab`, etc.).

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
  P0-2  Créer SystemTenantRegistry.ts (isSystemTenant, isWritable, getSystemTenantId)
  P0-3  Ajouter isWritable() dans SovereignGuard (guard d'écriture _ref_ et _demo_)
  P0-4  Décider routing DEMO : subdomain mapping vs URL param (§11 Blindspot 5)
        → si subdomain : ajouter DEMO_SUBDOMAIN_MAP dans middleware

Sprint 2 (bootstrap — 1 journée)
  P1-1  Ajouter SYSTEM_ADMIN_PIN dans .env.example
  P1-2  Script bootstrap-system-tenants.ts (avec ensureServerNexus + PLATFORM_VARIANTS)
  P1-3  buildBrandTokens() dans TenantSeeder
  P1-4  Exécuter le bootstrap → 24 tenants créés
  P1-5  Déprécier scripts/seed-fleet-demo.js (remplacé par le bootstrap)

Sprint 3 (Simulacra DEMO — 0.5 journée)
  P1-6  Wiring Nexus.activateSimulacraMode() dans SplashGate pour tier DEMO

Sprint 4 (clonage — 1 journée)
  P1-7  cloneFromReference() dans TenantProvisioningService (server-only,
         adapter.query pas adapter.list, FiscalKeyService.generateKey+provision)
  P1-8  Remplacer provisionNewClient() → cloneFromReference()

Sprint 5 (données DEMO — 2 jours)
  P1-9  seed-demo-data.ts (restaurant complet en priorité)
  P1-10 reset-demo.ts (snapshot + restauration)

Sprint 6 (UI MCC — 1 journée)
  P2-1  SystemTenantsTab.tsx dans MCC + enregistrement dans page.tsx tabs
  P2-2  Modale de promotion TEST→REFERENCE

Sprint 7 (intégration landing — 0.5 journée)
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

## 10. Baseline UI — état au 2026-08-07

Cette section documente l'état exact de l'UI au moment de la mise en place du
système DEMO/TEST/REFERENCE. Toute promotion vers REFERENCE part de cette base.

### Ce qui a été consolidé aujourd'hui (session `ui-refactor-phases1-6`)

**Phase 1A — TablesSettings unifié**
`shared/components/settings/tables/` contenait 4 copies de composants déjà
présents dans `modules/facility/spaces/settings/`. Les 4 copies supprimées,
`TablesSettings.tsx` importe désormais depuis le canonique :
```typescript
import { TablesToolbar, FloorArchitecture, ZoneService, MobilierConfig }
  from "@/modules/facility/spaces/settings";
```

**Phase 1B — `ops/registre/` mort supprimé**
7 fichiers dans `ops/workflow/engine/components/registre/` étaient du code mort
(l'index re-exportait déjà depuis `modules/facility/maintenance/registre`).
Supprimés.

**Phase 1C — Re-exports orphelins**
- `shared/components/settings/ui/PremiumSelect.tsx` — simple re-export, supprimé,
  `LogicTab` et `StyleTab` pointent directement vers `@/shared/components/ui`
- `shared/components/layout/NexusSphere.tsx` — re-export sans consommateur, supprimé

**Phase 1D — StatCard canonical étendu**
3 versions incompatibles fusionnées en une seule (`shared/components/ui/StatCard`) :
```typescript
icon?:  ReactNode                                          // avant : LucideIcon
trend?: string | { value: number; direction: 'up'|'down'|'neutral' }  // avant : {value, direction} ou string
isWarning?: boolean                                        // absorbé depuis MCC version
```
2 StatCard locaux supprimés (MCC + seo). `simulator/page.tsx` migré.

**Phase 1D — MindMap proxies**
2 fichiers proxy supprimés, barrels mis à jour pour pointer directement.

**Phase 1D — ElevationPrompt / OverrideLogView**
Copies bit-à-bit dans `shared/nexus/vault/audits/audit/` supprimées.
`vault/index.ts` re-exporte depuis `modules/compliance/securite/audit/`.

**Phase 2 — 5 orphelins supprimés**
`MDMPanel.tsx` (311L), `ReserveWithGoogle.tsx` (210L),
`NexusServiceInitializer.tsx` (63L), `BrandWrapper.tsx` (43L),
`OptimizationDialog.tsx` (72L)

**Phase 3 — Barrel `ui/index.ts` complété**
6 composants ajoutés au barrel (avant importés par chemin direct partout) :
`BottomSheet`, `CameraCapture`, `GlassCard`, `PageHeaderWithDocs`,
`TimePicker`, `TutorialOverlay`

**Bilan** : −2 610 lignes, 0 erreur TSC, 668 tests verts.

---

### Refonte UI verticale restaurant — règle de gestion

La verticale restaurant **fera l'objet d'une refonte UI complète** dans un sprint
futur. Cette refonte suit obligatoirement le flux DEMO/TEST/REFERENCE :

```
  Refonte développée sur _test_restaurant
          │
          │  Tests visuels + fonctionnels validés
          │  npx tsc --noEmit → 0
          │  npx vitest run → tous verts
          ▼
  MCC : "Promouvoir TEST → REFERENCE"
          │
          │  Snapshot de l'ancienne REFERENCE conservé
          │  (rollback possible si problème post-client)
          ▼
  _ref_restaurant mis à jour avec la nouvelle UI
          │
          │  MCC : "Synchroniser DEMO depuis REFERENCE"
          ▼
  _demo_restaurant rechargé
  SplashScreen + landing + showcase reflètent la nouvelle UI
```

**Ce qui ne change pas dans le DEMO pendant la refonte** :
- Le DEMO garde l'UI actuelle (baseline 2026-08-07) pendant tout le développement
- Aucun prospect ne voit un travail en cours
- La bascule est atomique : snapshot → promotion → sync DEMO en une opération MCC

**Composants UI actuels à conserver tels quels (non concernés par la refonte)** :
- `StatCard` canonical (`shared/components/ui/StatCard`) — déjà unifié
- `SplashScreen` / `SplashGate` — opérationnels, ne pas retoucher
- Landing `/landing` + Showcase `/showcase` — livrés, branchés dans le DEMO
- Barrel `ui/index.ts` — complet, servir de point d'entrée systématique

---

## 11. Vérification complète — Blindspots et dépendances cachées

> Audit effectué le 2026-08-07 en croisant le plan avec le code réel.
> Chaque item est classé **BLOQUANT** (stoppe l'implémentation), **IMPORTANT** (à corriger
> avant la mise en prod), ou **MINEUR** (à noter, non bloquant).

---

### 🔴 BLOQUANT 1 — `Nexus.adapter.list()` n'existe pas

Le plan utilise `Nexus.adapter.list(collectionPath)` dans `cloneFromReference()`.
**L'interface `INexusAdapter` n'expose pas de méthode `list()`.**

Méthode réelle : `query(collectionPath, options?, context?)` → `Promise<T[]>`

**Correction dans `cloneFromReference()` :**
```typescript
// ❌ Plan (n'existe pas)
const items = await Nexus.adapter.list(`tenants/${refId}/${collection}`);

// ✅ Correct
const items = await Nexus.adapter.query(`tenants/${refId}/${collection}`);
```

---

### 🔴 BLOQUANT 2 — DEMO en lecture seule = app inutilisable

Le plan dit "écriture BLOQUÉE" sur `_demo_*`. Mais l'app écrit en permanence :
- POS → `orders`, `tables` (status, occupied)
- KDS → `orders` (status: done)
- Réservations → `reservations`
- Jotai atoms → writes en cascade à chaque interaction

Si toutes les écritures échouent avec une `NexusError`, le DEMO est **non fonctionnel
pour le prospect**.

**Solution : `Nexus.activateSimulacraMode()`**

Cette fonctionnalité **existe déjà** dans `NexusAdapter.ts`. Elle redirige toutes les
écritures vers IndexedDB (in-browser) sans toucher au vrai store. Les données DEMO
restent intactes côté serveur, le prospect peut interagir librement.

À implémenter dans `SplashGate.tsx` (déjà le bon endroit pour la logique de démarrage) :
```typescript
// Dans SplashGate, avant de laisser entrer l'utilisateur en DEMO :
if (tier === 'DEMO') {
  await Nexus.activateSimulacraMode(`demo_session_${Date.now()}`);
}
```
Et à désactiver proprement à la déconnexion DEMO.

**Mise à jour de la règle tier DEMO dans le tableau §4 :**
```
Écriture data  →  Simulacra mode (IndexedDB local, store Nexus intact)
```

---

### 🔴 BLOQUANT 3 — `cloneFromReference()` déclenche le fail-safe cross-tenant

`SovereignGuard.validateAccess()` vérifie que `pathTenantId === currentTenant`.
`cloneFromReference()` lit depuis `tenants/_ref_restaurant/...` ET écrit vers
`tenants/tenant_newsiret/...` — deux tenants différents, déclenche le fail-safe
côté client.

**Cette opération ne peut fonctionner que côté serveur**, avec le server adapter
(qui bypass le `NexusInterceptor`) :
```typescript
// cloneFromReference() doit être une Server Action ou une route API
// et utiliser le server adapter (déjà implémenté dans instrumentation.ts)
import { ensureServerNexus } from '@/lib/nexus/server';
await ensureServerNexus();
// Ensuite Nexus.adapter est le server adapter, cross-tenant autorisé
```

Fichier de référence : `src/shared/nexus/guards/SovereignGuard.ts` ligne 240 :
> "Master Tenant (restaurant-os) can view anything"

Le server adapter contourne le guard client. À documenter explicitement dans
`TenantProvisioningService` : `cloneFromReference()` est une méthode server-only.

---

### 🔴 BLOQUANT 4 — `FiscalKeyService.provisionForTenant()` n'existe pas

Le plan référence :
```typescript
await FiscalKeyService.provisionForTenant(tenantId);
```

**Cette méthode n'existe pas.** `FiscalKeyService` expose :
- `generateKey()` → génère une clé aléatoire 32 octets
- `provision(tenantId, signingKey)` → charge une clé en mémoire (in-process)
- `requireKey(tenantId)` → récupère la clé ou lève une erreur

**Correction dans `cloneFromReference()` :**
```typescript
// ❌ Plan
await FiscalKeyService.provisionForTenant(tenantId);

// ✅ Correct — génère et provisionne la clé fiscal du nouveau tenant
const fiscalSigningKey = FiscalKeyService.generateKey();
// La clé est stockée dans tenantConfig lors de l'écriture (déjà fait par TenantSeeder)
// Et chargée en mémoire pour la session serveur courante :
FiscalKeyService.provision(tenantId, fiscalSigningKey);
```

Note : TenantSeeder fait déjà ça correctement. `cloneFromReference()` doit reproduire
le même pattern, pas appeler une méthode inexistante.

---

### 🟠 IMPORTANT 5 — Routing DEMO : sous-domaine impossible avec `_` prefix

`tenantFromHost.ts` extrait le tenant du sous-domaine :
`demo-restaurant.restaurant-os.app → 'demo-restaurant'`

Mais les tenantIds système commencent par `_` (`_demo_restaurant`).
Un sous-domaine `_demo_restaurant.restaurant-os.app` est **invalide** (RFC 1035).

**Deux options, à choisir :**

Option A — Sous-domaine court + mapping middleware (recommandé) :
```
demo.restaurant-os.app → middleware mappe → _demo_restaurant
demo-hotel.restaurant-os.app → _demo_hotel
```
Ajouter dans le middleware :
```typescript
const DEMO_SUBDOMAIN_MAP: Record<string, string> = {
  'demo': '_demo_restaurant',
  'demo-hotel': '_demo_hotel',
  // ...
};
```

Option B — Paramètre URL :
```
restaurant-os.app?tenant=_demo_restaurant
```
Déjà supporté par `NexusAdapter.getTenantPath()` (lit `?tenant=` depuis `window.location.search`).
Plus simple mais moins élégant pour le prospect.

**À trancher avant le sprint 1**, car ça impacte le bootstrap des BrandTokens
(le `tenantId` stocké en `brandingTokens` doit correspondre à l'URL réelle).

---

### 🟠 IMPORTANT 6 — Bootstrap script : initialisation de Nexus en contexte CLI

Le script `scripts/bootstrap-system-tenants.ts` est une CLI (`npx tsx scripts/...`).
En dehors de Next.js, `Nexus.adapter` n'est pas initialisé automatiquement.

Le script doit initialiser le server adapter AVANT tout appel à `Nexus.adapter.*` :
```typescript
// En tête de bootstrap-system-tenants.ts
import { ensureServerNexus } from '@/lib/nexus/server';
// OU utiliser le FirestoreServerAdapter directement comme dans instrumentation.ts

await ensureServerNexus(); // initialise Nexus avec le server adapter
// À partir d'ici, Nexus.adapter.set() / .query() fonctionnent
```

Sans ça, `Nexus.adapter` lève `[Nexus] CRITICAL: No adapter registered.` au premier appel.

---

### 🟠 IMPORTANT 7 — `SYSTEM_ADMIN_PIN` absent de `.env.example`

Le bootstrap script utilise `process.env.SYSTEM_ADMIN_PIN` pour le PIN des tenants système.
Cette variable n'est pas dans `.env.example`.

À ajouter :
```bash
# .env.example
# PIN admin pour les tenants système (DEMO/TEST/REFERENCE) — ne jamais utiliser en prod client
SYSTEM_ADMIN_PIN=         # à renseigner (format: 4 chiffres, pas 0000/1234/9999)
```

Et à documenter dans `scripts/bootstrap-system-tenants.ts` avec une validation explicite
(refuser si vide ou PIN faible).

---

### 🟠 IMPORTANT 8 — MCC `SystemTenantsTab` non enregistré dans `page.tsx`

Le plan crée `SystemTenantsTab.tsx` dans `_tabs/` mais ne mentionne pas son ajout
dans la liste des onglets du MCC.

Fichier à mettre à jour : `src/app/(admin)/admin/mcc/page.tsx` (ou le composant tabs parent).
Le pattern existe pour les 10 tabs actuels (`FleetTab`, `TreasuryTab`, etc.) — suivre le même.

---

### 🟠 IMPORTANT 9 — `seed-fleet-demo.js` existant couplé au provider actuel

`scripts/seed-fleet-demo.js` importe `firebase/firestore` directement.
Si le provider change, ce script casse silencieusement.

Ce script sera supplanté par `bootstrap-system-tenants.ts`. Documenter dans le plan
qu'il doit être **déprécié après le Sprint 2** et que tout seeding passe par Nexus.

---

### 🟡 MINEUR 10 — `getAvailableVariants()` ≠ `PLATFORM_VARIANTS`

Le plan dit "le script itère sur `getAvailableVariants()`".
Cette fonction retourne les variants **présents dans `DNA_REGISTRY`** (seeds index).

Si un variant est dans `PLATFORM_VARIANTS` mais sans DNA file (ex: `custom` selon les versions),
il sera absent de `getAvailableVariants()` et aucun tenant système ne sera créé pour lui.

**Le bootstrap doit itérer sur `PLATFORM_VARIANTS`** (source de vérité du schema) :
```typescript
import { PLATFORM_VARIANTS } from '@/domain/schemas/tenant';
for (const variant of PLATFORM_VARIANTS) { ... }
```
Et logger un warning si le DNA file est absent (repli sur le DNA `restaurant` par défaut).

---

### 🟡 MINEUR 11 — `tenantConfig` dans `IMMUTABLE_COLLECTIONS` — clarification

`tenantConfig` est dans `IMMUTABLE_COLLECTIONS` de `SovereignGuard`.
Cela **bloque uniquement les DELETEs** (via `canDelete()` et `isFiscallySealed()`).
Les **writes/updates ne sont pas bloqués** par ce mécanisme.

Conséquence pour la promotion TEST→REFERENCE :
- `Nexus.adapter.set(tenants/_ref_*/tenantConfig, ...)` est autorisé par le guard actuel
- La protection REFERENCE vient uniquement de `isWritable()` dans `SystemTenantRegistry`
- **Donc le guard `isWritable()` est le seul rempart** — il doit absolument être implémenté
  avant toute promotion (Sprint 1, P0-3)

---

### 🟡 MINEUR 12 — Snapshots `_snapshots/` accessibles depuis le MCC

Le MCC opère en tant que `restaurant-os` (suzerain).
`validateAccess` a l'exception : `currentTenant === 'restaurant-os' → accès total`.
Les lectures/écritures sur `tenants/_ref_restaurant/_snapshots/...` sont donc autorisées.
Aucun problème, mais à documenter pour éviter toute confusion future.

---

### Résumé des corrections à apporter au plan

| # | Sévérité | Action |
|---|----------|--------|
| 1 | 🔴 | Remplacer `adapter.list()` par `adapter.query()` partout |
| 2 | 🔴 | DEMO = Simulacra mode, pas write-blocked (ajouter dans SplashGate) |
| 3 | 🔴 | `cloneFromReference()` = server-only (server adapter, `ensureServerNexus`) |
| 4 | 🔴 | Remplacer `provisionForTenant()` par `generateKey()` + `provision()` |
| 5 | 🟠 | Décider subdomain mapping vs URL param avant Sprint 1 |
| 6 | 🟠 | Bootstrap script : `ensureServerNexus()` en tête |
| 7 | 🟠 | Ajouter `SYSTEM_ADMIN_PIN` à `.env.example` |
| 8 | 🟠 | Enregistrer `SystemTenantsTab` dans MCC `page.tsx` |
| 9 | 🟠 | Déprécier `seed-fleet-demo.js` après Sprint 2 |
| 10 | 🟡 | Itérer sur `PLATFORM_VARIANTS` pas `getAvailableVariants()` |
| 11 | 🟡 | Documenter : seul `isWritable()` protège les REFERENCE (pas IMMUTABLE) |
| 12 | 🟡 | Snapshots OK depuis MCC (suzerain exception) |

---

## 12. Invariants à ne jamais enfreindre

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
