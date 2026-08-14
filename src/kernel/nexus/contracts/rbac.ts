import { z } from 'zod';
import { PermissionRole, PageKey } from '@nexus/contracts/permissions.types';

export const TenantRBACConfigSchema = z.object({
    version: z.number().default(1),
    pageOverrides: z.record(
        z.string(), // PageKey
        z.object({
            blocked: z.array(z.string()).optional(), // PermissionRole[]
            allowed: z.array(z.string()).optional(), // PermissionRole[]
        })
    ).default({}),
    tabOverrides: z.record(
        z.string(), // PageKey
        z.record(
            z.string(), // tabKey
            z.object({
                minLevel: z.number().optional(),
                blocked: z.array(z.string()).optional(), // PermissionRole[]
            })
        )
    ).default({}),
    actionOverrides: z.record(
        z.string(), // PageKey
        z.record(
            z.string(), // action
            z.object({
                minLevel: z.number().optional(),
                requiresPin: z.boolean().optional(),
            })
        )
    ).default({}),
});

export type TenantRBACConfig = z.infer<typeof TenantRBACConfigSchema>;

/**
 * Accès par défaut aux pages tenant.
 *
 * ⚠️  La page 'mcc' N'EST PAS listée ici — le MCC a ses propres routes
 *     /app/(admin)/ et son propre système d'auth (isMCCMode + FLEET_OPERATOR).
 *
 * Échelle des niveaux :
 *   10 plongeur · 20 commis · 30 serveur/barman/hotesse/cuisinier
 *   40 chef_rang · 50 sommelier · 60 sous_chef/comptable
 *   70 manager/chef_cuisinier · 80 directeur · 100 proprietaire
 */
export const DEFAULT_PAGE_ACCESS: Record<PageKey | string, PermissionRole[]> = {
    // ── Opérations service ──────────────────────────────────────────────
    pos: [
        'proprietaire', 'directeur', 'manager', 'chef_cuisinier',
        'sous_chef', 'chef_rang', 'serveur', 'barman', 'commis',
    ],
    pos_mobile: [
        'proprietaire', 'directeur', 'manager', 'chef_cuisinier',
        'sous_chef', 'chef_rang', 'serveur', 'barman', 'commis',
    ],
    kds: [
        'proprietaire', 'directeur', 'manager', 'chef_cuisinier',
        'sous_chef', 'chef_rang', 'serveur', 'cuisinier', 'barman', 'commis',
    ],
    kitchen: [
        'proprietaire', 'directeur', 'manager', 'chef_cuisinier',
        'sous_chef', 'cuisinier',
    ],
    bar: [
        'proprietaire', 'directeur', 'manager', 'chef_cuisinier',
        'sous_chef', 'chef_rang', 'barman', 'sommelier',
    ],
    floor_plan: [
        'proprietaire', 'directeur', 'manager', 'chef_cuisinier',
        'sous_chef', 'chef_rang', 'serveur', 'hotesse',
    ],
    reservations: [
        'proprietaire', 'directeur', 'manager', 'sous_chef',
        'chef_rang', 'serveur', 'hotesse',
    ],
    operations: [
        'proprietaire', 'directeur', 'manager', 'chef_cuisinier',
        'sous_chef', 'chef_rang',
    ],

    // ── RH & planning ──────────────────────────────────────────────────
    staff: [
        'proprietaire', 'directeur', 'manager', 'chef_cuisinier',
        'sous_chef', 'chef_rang',
    ],
    planning: [
        'proprietaire', 'directeur', 'manager', 'chef_cuisinier',
        'sous_chef', 'chef_rang',
    ],
    timeclock: [
        'proprietaire', 'directeur', 'manager', 'chef_cuisinier', 'sous_chef',
        'comptable', 'chef_rang', 'serveur', 'cuisinier', 'barman',
        'hotesse', 'sommelier', 'commis', 'plongeur',
    ],
    recruitment: [
        'proprietaire', 'directeur', 'manager', 'sous_chef',
    ],
    leaves: [
        'proprietaire', 'directeur', 'manager', 'chef_cuisinier', 'sous_chef',
        'comptable', 'chef_rang', 'serveur', 'cuisinier', 'barman',
        'hotesse', 'sommelier', 'commis', 'plongeur',
    ],
    mon_espace: [
        'proprietaire', 'directeur', 'manager', 'chef_cuisinier', 'sous_chef',
        'comptable', 'chef_rang', 'serveur', 'cuisinier', 'barman',
        'hotesse', 'sommelier', 'commis', 'plongeur',
    ],
    welcome_staff: [
        'proprietaire', 'directeur', 'manager', 'chef_cuisinier', 'sous_chef',
        'comptable', 'chef_rang', 'serveur', 'cuisinier', 'barman',
        'hotesse', 'sommelier', 'commis', 'plongeur',
    ],

    // ── Finance ─────────────────────────────────────────────────────────
    finance: [
        'proprietaire', 'directeur', 'manager', 'sous_chef', 'comptable',
    ],

    // ── HACCP & conformité ──────────────────────────────────────────────
    haccp: [
        'proprietaire', 'directeur', 'manager', 'chef_cuisinier',
        'sous_chef', 'cuisinier',
    ],

    // ── Stock & appro ───────────────────────────────────────────────────
    inventory: [
        'proprietaire', 'directeur', 'manager', 'sous_chef', 'comptable',
        'chef_cuisinier', 'cuisinier', 'barman',
    ],

    // ── CRM & marketing ─────────────────────────────────────────────────
    crm: [
        'proprietaire', 'directeur', 'manager', 'sous_chef',
        'comptable', 'chef_rang', 'hotesse',
    ],
    customer: [
        'proprietaire', 'directeur', 'manager', 'sous_chef',
        'comptable', 'chef_rang', 'hotesse',
    ],
    marketing: [
        'proprietaire', 'directeur', 'manager', 'sous_chef', 'chef_rang',
    ],

    // ── Analytics & intelligence ─────────────────────────────────────────
    analytics: [
        'proprietaire', 'directeur', 'manager', 'sous_chef', 'comptable',
    ],
    intelligence: [
        'proprietaire', 'directeur', 'manager', 'sous_chef',
    ],
    dashboard: [
        'proprietaire', 'directeur', 'manager', 'sous_chef', 'comptable',
    ],

    // ── Catalogue ───────────────────────────────────────────────────────
    menu_builder: [
        'proprietaire', 'directeur', 'manager', 'chef_cuisinier', 'sous_chef',
    ],

    // ── Registres & conformité ──────────────────────────────────────────
    registre: [
        'proprietaire', 'directeur', 'manager', 'sous_chef',
        'comptable', 'chef_cuisinier',
    ],

    // ── Paramétrage ─────────────────────────────────────────────────────
    settings: [
        'proprietaire', 'directeur', 'manager',
    ],

    // ── Divers ──────────────────────────────────────────────────────────
    seo: ['proprietaire', 'directeur', 'manager'],
    groups: [
        'proprietaire', 'directeur', 'manager', 'sous_chef', 'chef_rang', 'hotesse',
    ],
    migration: ['proprietaire', 'directeur'],
    vanguard: ['proprietaire', 'directeur', 'manager'],
    storage_map: [
        'proprietaire', 'directeur', 'manager', 'sous_chef',
        'comptable', 'chef_cuisinier', 'cuisinier',
    ],
};

/**
 * Niveaux minimaux par onglet.
 * Mis à jour pour correspondre aux niveaux PERMISSION_ROLE_LEVELS révisés.
 *
 * Correspondances clés après révision :
 *   anciens 35 (cuisinier)      → 30
 *   anciens 45 (chef_cuisinier) → 40 ou 60 selon sensibilité
 *   anciens 50 (chef_rang)      → 40
 *   anciens 90 (directeur)      → 80
 */
export const DEFAULT_TAB_ACCESS: Record<string, Record<string, number>> = {
    kitchen: {
        'mise-en-place': 30,   // cuisinier+
        'prep-journalier': 30, // cuisinier+
        recipes: 30,           // cuisinier+ (lecture fiches recettes)
        ingredients: 40,       // chef_rang+ (gestion ingrédients)
        margins: 70,           // manager+ (données économiques)
        waste: 30,             // cuisinier+ (déclaration pertes)
        suppliers: 70,         // manager+ (gestion fournisseurs)
        allergens: 30,         // cuisinier+ (sécurité alimentaire — visible à tous les opérationnels)
    },
    bar: {
        kds: 30,               // barman+
        wines: 30,             // barman+
        sommelier: 50,         // sommelier+ (expertise)
        cocktails: 30,         // barman+
        stocks: 50,            // sommelier+ (gestion cave)
    },
    staff: {
        team: 40,              // chef_rang+ (vue équipe)
        planning: 40,          // chef_rang+
        timesheet: 40,         // chef_rang+
        payroll: 70,           // manager+ (données salariales)
        skills: 40,            // chef_rang+
        leaves: 40,            // chef_rang+
        recruitment: 70,       // manager+
    },
    finance: {
        accounting: 60,        // comptable+ (sous_chef)
        billing: 60,           // comptable+
        bank: 60,              // comptable+
        treasury: 70,          // manager+
        audit: 80,             // directeur+ (audit fiscal)
    },
    haccp: {
        haccp: 30,             // cuisinier+
        quality: 40,           // chef_rang+
        planning: 40,          // chef_rang+
        compliance: 70,        // manager+
        lots: 40,              // chef_rang+ (traçabilité lots)
    },
    inventory: {
        stock: 30,             // cuisinier+
        storage: 40,           // chef_rang+
        rotating_count: 40,    // chef_rang+
    },
    crm: {
        pipeline: 30,          // chef_rang / hotesse
        customers: 30,         // chef_rang / hotesse
        history: 40,           // chef_rang+
        import: 70,            // manager+
        promos: 40,            // chef_rang+
        emails: 70,            // manager+
        automations: 70,       // manager+
        rfm: 70,               // manager+
        analytics: 60,         // comptable+
    },
    marketing: {
        campaigns: 70,         // manager+
        social: 70,            // manager+
        quotes: 40,            // chef_rang+
        ai: 70,                // manager+
        seo: 70,               // manager+
    },
    analytics: {
        profitability: 70,     // manager+
        reputation: 70,        // manager+
        compliance: 60,        // comptable+
        oracle: 80,            // directeur+ (données stratégiques)
    },
    registre: {
        overview: 40,          // chef_rang+
        duerp: 80,             // directeur+ (document unique risques)
        incendie: 70,          // manager+
        prestataires: 70,      // manager+
        interventions: 70,     // manager+
        pmr: 70,               // manager+
        conformite: 40,        // chef_rang+
    },
    leaves: {
        my_requests: 10,       // tous
        team_calendar: 40,     // chef_rang+
        to_approve: 40,        // chef_rang+
    },
    mon_espace: {
        planning: 10,          // tous
        pointage: 10,          // tous
        conges: 10,            // tous
        pourboires: 10,        // tous
        bulletin: 10,          // tous
        formations: 10,        // tous
    },
    settings: {
        profile: 10,           // tous
        identity: 70,          // manager+
        hours: 70,             // manager+
        menu: 70,              // manager+
        recipes: 60,           // sous_chef+ (config recettes)
        inventory: 70,         // manager+
        staff: 70,             // manager+
        planning: 70,          // manager+
        reservations: 70,      // manager+
        customer: 70,          // manager+
        pos: 70,               // manager+
        accounting: 60,        // comptable+
        delivery: 70,          // manager+
        reviews: 70,           // manager+
        appearance: 70,        // manager+
        notifications: 70,     // manager+
        security: 80,          // directeur+ (paramètres sécurité)
        goals: 70,             // manager+
        integrations: 80,      // directeur+ (connecteurs tiers)
        legal: 80,             // directeur+ (mentions légales, CGV)
        haccp: 70,             // manager+
        migration: 80,         // directeur+ (migration données)
        tables: 70,            // manager+
        printer: 70,           // manager+
        tpe: 70,               // manager+
        'cash-drawer': 70,     // manager+
        governance: 100,       // proprietaire uniquement (gouvernance RBAC)
        nexus: 100,            // proprietaire uniquement (config core Nexus)
    },
};
