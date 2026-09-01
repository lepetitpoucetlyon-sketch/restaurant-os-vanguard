/**
 * 🔗 CapabilityWiringRegistry — le CHAÎNON MANQUANT du socle Forge Stack.
 *
 * PROBLÈME RÉSOLU : `CapabilityCatalog` (45 clés) déclare `dependsOn` et
 * `requiredHardware`, mais RIEN n'indique ce qu'une capability MONTE concrètement
 * (module lazy, routes nav, guards compliance, events écoutés/émis). Résultat :
 * cocher une capability dans un DNA n'a AUCUN effet runtime observable.
 *
 * Ce registre est la SOURCE UNIQUE DE VÉRITÉ consommée par 4 clients :
 *  1. `generateVertical` (build-time) → émet imports/routes/guards à partir du wiring.
 *  2. `filterByCapabilities` (runtime nav) → montre/cache les sections nav.
 *  3. `TenantSeeder.seed` → appelle `seedData()` par capability activée.
 *  4. `QualificationEngine` (P2) → traduit une réponse wizard en capability + module réel.
 *
 * Sans lui, P2/P3/P4 boitent. C'est du câblage transverse, pas glamour mais critique.
 *
 * Module FEUILLE : n'importe que le catalogue et les types Blueprint. Aucun cycle.
 */

import type { CapabilityKey, HardwareKind } from './CapabilityCatalog';
import type { BlueprintRoute } from '../blueprint/VerticalBlueprint';
import { CAPABILITY_KEYS, getCapability, resolveCapabilityDependencies } from './CapabilityCatalog';

// ── Contrat public ──────────────────────────────────────────────────────────────

/**
 * Description du câblage runtime d'une capability : quel module monter,
 * quelles routes exposer, quels guards activer, quels events consommer/émettre.
 * Tous les champs sont OPTIONNELS — une capability transverse (`mod_dashboard`,
 * `mod_settings`) peut n'avoir aucun câblage propre.
 */
export interface CapabilityWiring {
    /**
     * Chemin d'import lazy du module principal de la capability.
     * Ex. `'@/modules/ops/service/restaurant/pos'`. Le générateur émettra un `React.lazy(...)`
     * sur ce chemin ; le tenant runtime peut le pré-charger en dependency-hint.
     */
    module?: string;
    /**
     * Routes à ajouter dans la nav quand la capability est ON. Le générateur les
     * insère dans le plugin verticale ; `filterByCapabilities` les affiche/masque.
     */
    routes?: readonly BlueprintRoute[];
    /**
     * Guards compliance/fiscal à activer (classes/services qui bloquent des
     * actions illégales). Ex. `['AllergenGateService', 'MealVoucherLimitGuard']`.
     * Résolus au boot du tenant par le pilier propriétaire.
     */
    guards?: readonly string[];
    /**
     * Events du NexusEventBus liés à la capability.
     * `emits` : events que le module émet quand la capability est utilisée.
     * `listens` : events que le module écoute (utile pour analyse d'impact).
     */
    events?: {
        readonly emits?: readonly string[];
        readonly listens?: readonly string[];
    };
    /**
     * Périphériques SUPPLÉMENTAIRES impliqués au-delà du `requiredHardware` du
     * catalogue (ex. un `mod_kiosk` implique en plus un scanner QR même si le
     * catalogue ne le porte pas). En pratique : rarement peuplé — le catalogue
     * reste la source primaire.
     */
    extraHardware?: readonly HardwareKind[];
    /**
     * Section de nav où insérer les routes (correspond aux clés de sections dans
     * `navConfig.ts` — ex. 'production', 'commerce', 'compliance'). Sert au
     * futur `filterByCapabilities`.
     */
    navSection?: string;
    /**
     * Fonction de graine minimale à écrire dans Nexus au provisioning tenant
     * (ex. mod_pos → catégorie POS vide, mod_reservations → planning vide).
     * Doit être IDEMPOTENTE et rapide. Appelée par `TenantSeeder` après la
     * création du tenant, une fois par capability activée.
     *
     * Signature volontairement lâche (`(ctx) => Promise<void>`) : chaque module
     * fournira son propre contrat via un TypeGuard côté consommateur.
     */
    seedData?: (ctx: CapabilitySeedContext) => Promise<void>;
}

/** Contexte fourni à `seedData()` lors du provisioning tenant. */
export interface CapabilitySeedContext {
    /** ID du tenant fraîchement créé. */
    readonly tenantId: string;
    /** Variant du tenant (aide à graine spécifique — ex. menu type pour restaurant). */
    readonly variant: string;
    /** Capabilities effectivement activées (permet d'éviter double seed en cascade). */
    readonly activeCapabilities: readonly CapabilityKey[];
}

// ── Registre (peuplé progressivement — voir P2/P3 pour le peuplement complet) ──

/**
 * Wiring initial : les capabilities OPS/COMMERCE/COMPLIANCE clés qui ont un
 * effet nav visible dès aujourd'hui. Les autres sont peuplées `{}` (câblage à
 * enrichir dans les phases suivantes — cf. tâche P2 QualificationEngine).
 *
 * Convention : `navSection` reflète la structure des piliers ; `module` pointe
 * vers le barrel du module métier ; `routes` reste vide tant que le composant
 * n'existe pas (skip-if-exists dans le générateur).
 */
export const CAPABILITY_WIRING: Record<CapabilityKey, CapabilityWiring> = {
    // ── CORE ────────────────────────────────────────────────────────────────
    mod_dashboard:            { navSection: 'core', routes: [{ path: '/dashboard', label: 'Tableau de bord', componentPath: './dashboard/DashboardPage', componentExport: 'DashboardPage' }] },
    mod_settings:             { navSection: 'core', routes: [{ path: '/settings', label: 'Paramètres', componentPath: './settings/SettingsPage', componentExport: 'SettingsPage' }] },
    mod_access_management:    { navSection: 'core', module: '@/modules/system' },
    mod_brand_basic:          { navSection: 'core' },
    mod_brand_plus:           { navSection: 'core' },
    mod_kiosk:                { navSection: 'production', module: '@/modules/ops', routes: [{ path: '/kiosk', label: 'Kiosque', componentPath: './kiosk/KioskPage', componentExport: 'KioskPage' }] },

    // ── OPS ─────────────────────────────────────────────────────────────────
    mod_pos:                  {
        navSection: 'production',
        module: '@/modules/ops',
        routes: [{ path: '/pos', label: 'Caisse', componentPath: './pos/PosPage', componentExport: 'PosPage' }],
        events: { emits: ['finance.order_sealed', 'ops.order_created'] },
        guards: ['FiscalSealGuard'],
    },
    mod_bar:                  { navSection: 'production', module: '@/modules/ops', routes: [{ path: '/bar', label: 'Bar', componentPath: './bar/BarPage', componentExport: 'BarPage' }] },
    mod_kds:                  {
        navSection: 'production',
        module: '@/modules/ops',
        routes: [{ path: '/kds', label: 'Écran cuisine', componentPath: './kds/KdsPage', componentExport: 'KdsPage' }],
        events: { listens: ['ops.order_created'], emits: ['ops.order_ready'] },
    },
    mod_kitchen_management:   { navSection: 'production', module: '@/modules/ops' },
    mod_floor_plan:           { navSection: 'facility', module: '@/modules/facility', routes: [{ path: '/floor-plan', label: 'Plan de salle', componentPath: './floor/FloorPlanPage', componentExport: 'FloorPlanPage' }] },
    mod_pms:                  { navSection: 'production', module: '@/modules/ops', routes: [{ path: '/pms', label: 'Chambres', componentPath: './pms/PmsPage', componentExport: 'PmsPage' }] },

    // ── COMMERCE ────────────────────────────────────────────────────────────
    mod_reservations:         { navSection: 'commerce', module: '@/modules/commerce', routes: [{ path: '/reservations', label: 'Réservations', componentPath: './reservations/ReservationsPage', componentExport: 'ReservationsPage' }] },
    mod_groups:               { navSection: 'commerce', module: '@/modules/commerce' },
    mod_omnichannel:          { navSection: 'commerce', module: '@/modules/commerce' },
    mod_customer:             { navSection: 'commerce', module: '@/modules/commerce', routes: [{ path: '/customers', label: 'Clients', componentPath: './customers/CustomersPage', componentExport: 'CustomersPage' }] },
    mod_crm:                  { navSection: 'commerce', module: '@/modules/commerce' },
    mod_quotes:               { navSection: 'commerce', module: '@/modules/commerce', routes: [{ path: '/quotes', label: 'Devis', componentPath: './quotes/QuotesPage', componentExport: 'QuotesPage' }] },
    mod_marketing:            { navSection: 'commerce', module: '@/modules/commerce' },
    mod_social_marketing:     { navSection: 'commerce', module: '@/modules/commerce' },
    mod_seo:                  { navSection: 'commerce', module: '@/modules/commerce' },
    mod_ai_referencing:       { navSection: 'commerce', module: '@/modules/commerce' },
    mod_google_analytics:     { navSection: 'commerce' },
    mod_onboarding:           { navSection: 'core', module: '@/modules/commerce', routes: [{ path: '/onboarding', label: 'Onboarding', componentPath: './onboarding/OnboardingPage', componentExport: 'OnboardingPage' }] },

    // ── FINANCE ─────────────────────────────────────────────────────────────
    mod_treasury:             { navSection: 'finance', module: '@/modules/finance', routes: [{ path: '/finance/treasury', label: 'Trésorerie', componentPath: './finance/TreasuryPage', componentExport: 'TreasuryPage' }] },
    mod_accounting_management:{ navSection: 'finance', module: '@/modules/finance', routes: [{ path: '/finance/accounting', label: 'Comptabilité', componentPath: './finance/AccountingPage', componentExport: 'AccountingPage' }], guards: ['NF525SealGuard'] },

    // ── COMPLIANCE ──────────────────────────────────────────────────────────
    mod_haccp:                { navSection: 'compliance', module: '@/modules/compliance', routes: [{ path: '/haccp', label: 'HACCP', componentPath: './haccp/HaccpPage', componentExport: 'HaccpPage' }], guards: ['AllergenGateService', 'WitnessDishService'] },
    mod_hygiene:              { navSection: 'compliance', module: '@/modules/compliance' },
    mod_quality_control:      { navSection: 'compliance', module: '@/modules/compliance' },
    mod_rgpd:                 { navSection: 'compliance', module: '@/modules/compliance', guards: ['SovereignDataEncryption'] },

    // ── HUMAN ───────────────────────────────────────────────────────────────
    mod_hr:                   { navSection: 'human', module: '@/modules/human', routes: [{ path: '/hr', label: 'RH', componentPath: './hr/HrPage', componentExport: 'HrPage' }] },
    mod_planning:             { navSection: 'human', module: '@/modules/human', routes: [{ path: '/planning', label: 'Planning', componentPath: './planning/PlanningPage', componentExport: 'PlanningPage' }] },
    mod_leaves:               { navSection: 'human', module: '@/modules/human' },
    mod_timeclock:            { navSection: 'human', module: '@/modules/human', guards: ['RestPeriodGuard', 'BadgeClockoutAtZService'] },
    mod_recruitment:          { navSection: 'human', module: '@/modules/human' },

    // ── LOGISTICS ───────────────────────────────────────────────────────────
    mod_inventory:            { navSection: 'logistics', module: '@/modules/logistics', routes: [{ path: '/inventory', label: 'Stocks', componentPath: './inventory/InventoryPage', componentExport: 'InventoryPage' }] },
    mod_storage_map:          { navSection: 'logistics', module: '@/modules/logistics' },

    // ── INTELLIGENCE ────────────────────────────────────────────────────────
    mod_analytics:            { navSection: 'intelligence', module: '@/modules/intelligence', routes: [{ path: '/analytics', label: 'Analytics', componentPath: './analytics/AnalyticsPage', componentExport: 'AnalyticsPage' }] },
    mod_executive_intelligence:{ navSection: 'intelligence', module: '@/modules/intelligence' },
    mod_ai:                   { navSection: 'intelligence', module: '@/modules/intelligence' },
    mod_oracle:               { navSection: 'intelligence', module: '@/modules/intelligence' },
    mod_agent_dashboard:      { navSection: 'intelligence', module: '@/modules/intelligence' },
    mod_system_map:           { navSection: 'intelligence', module: '@/modules/intelligence' },
    mod_fleet_management:     { navSection: 'mcc', module: '@/modules/intelligence' },

    // ── FACILITY ────────────────────────────────────────────────────────────
    mod_registre:             { navSection: 'facility', module: '@/modules/facility' },
};

// ── Helpers de consommation ─────────────────────────────────────────────────────

/** Wiring d'une capability. Retourne `{}` si la capability n'a pas de câblage déclaré (transverse). */
export function getCapabilityWiring(key: CapabilityKey): CapabilityWiring {
    return CAPABILITY_WIRING[key] ?? {};
}

/**
 * Filtre une liste de routes en ne gardant que celles dont la capability portante
 * est ON dans le set fourni. Utilisé par la nav runtime (`filterByCapabilities`)
 * et par le générateur (émission conditionnelle).
 */
export function routesForCapabilities(activeKeys: readonly CapabilityKey[]): BlueprintRoute[] {
    const withDeps = resolveCapabilityDependencies(activeKeys);
    const routes: BlueprintRoute[] = [];
    for (const k of withDeps) {
        const w = CAPABILITY_WIRING[k];
        if (w?.routes) routes.push(...w.routes);
    }
    return routes;
}

/**
 * Agrège tous les guards à activer pour un set de capabilities données.
 * Utilisé par le bootstrap tenant : chaque guard listé doit être instancié
 * pour rendre la capability opérante (bloque les actions illégales).
 */
export function guardsForCapabilities(activeKeys: readonly CapabilityKey[]): string[] {
    const withDeps = resolveCapabilityDependencies(activeKeys);
    const seen = new Set<string>();
    for (const k of withDeps) {
        for (const g of CAPABILITY_WIRING[k]?.guards ?? []) seen.add(g);
    }
    return [...seen];
}

/**
 * Agrège tous les events (emits + listens) pour un set de capabilities. Utile
 * pour l'introspection MCC (« ce tenant émet/écoute quoi ? ») et pour le
 * générateur qui les injecte dans les adapters de pilier.
 */
export function eventsForCapabilities(activeKeys: readonly CapabilityKey[]): { emits: string[]; listens: string[] } {
    const withDeps = resolveCapabilityDependencies(activeKeys);
    const emits = new Set<string>();
    const listens = new Set<string>();
    for (const k of withDeps) {
        for (const e of CAPABILITY_WIRING[k]?.events?.emits ?? []) emits.add(e);
        for (const l of CAPABILITY_WIRING[k]?.events?.listens ?? []) listens.add(l);
    }
    return { emits: [...emits], listens: [...listens] };
}

/**
 * Applique le seed data de chaque capability activée. Idempotent — chaque
 * `seedData()` doit être ré-exécutable sans effet de bord destructeur.
 * Utilisé par `TenantSeeder` en fin de provisioning.
 */
export async function seedCapabilities(
    activeKeys: readonly CapabilityKey[],
    ctx: CapabilitySeedContext,
): Promise<{ seeded: CapabilityKey[]; skipped: CapabilityKey[]; errors: Array<{ key: CapabilityKey; error: string }> }> {
    const withDeps = resolveCapabilityDependencies(activeKeys) as CapabilityKey[];
    const seeded: CapabilityKey[] = [];
    const skipped: CapabilityKey[] = [];
    const errors: Array<{ key: CapabilityKey; error: string }> = [];
    for (const k of withDeps) {
        const seed = CAPABILITY_WIRING[k]?.seedData;
        if (!seed) { skipped.push(k); continue; }
        try {
            await seed(ctx);
            seeded.push(k);
        } catch (err) {
            errors.push({ key: k, error: err instanceof Error ? err.message : String(err) });
        }
    }
    return { seeded, skipped, errors };
}

// ── Validation d'intégrité (exécutée au build via tests) ────────────────────────

/**
 * Vérifie que chaque capability du catalogue a une entrée dans le wiring (peut
 * être `{}` mais doit exister). Sert de garde-fou : si une capability est
 * ajoutée au catalogue sans wiring, ce test casse.
 */
export function assertWiringExhaustiveness(): string[] {
    const missing: string[] = [];
    for (const k of CAPABILITY_KEYS) {
        if (!(k in CAPABILITY_WIRING)) missing.push(k);
    }
    return missing;
}

/**
 * Vérifie que le hardware `extraHardware` d'un wiring est cohérent (pas de
 * doublon avec `requiredHardware` du catalogue — anti-drift).
 */
export function assertWiringHardwareConsistency(): Array<{ key: CapabilityKey; conflict: HardwareKind }> {
    const issues: Array<{ key: CapabilityKey; conflict: HardwareKind }> = [];
    for (const k of CAPABILITY_KEYS) {
        const w = CAPABILITY_WIRING[k];
        const cat = getCapability(k);
        const catHw = new Set(cat.requiredHardware ?? []);
        for (const h of w?.extraHardware ?? []) {
            if (catHw.has(h)) issues.push({ key: k, conflict: h });
        }
    }
    return issues;
}
