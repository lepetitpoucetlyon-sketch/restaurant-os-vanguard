import { z } from 'zod';
import { PermissionRole, PageKey } from '@/shared/nexus/contracts/permissions.types';

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

export const DEFAULT_PAGE_ACCESS: Record<PageKey | string, PermissionRole[]> = {
    pos: ['super_admin', 'directeur', 'manager', 'chef_rang', 'serveur', 'barman'],
    pos_mobile: ['super_admin', 'directeur', 'manager', 'chef_rang', 'serveur', 'barman'],
    kds: ['super_admin', 'directeur', 'manager', 'chef_rang', 'serveur', 'chef_cuisinier', 'cuisinier', 'barman'],
    kitchen: ['super_admin', 'directeur', 'manager', 'chef_cuisinier', 'cuisinier'],
    bar: ['super_admin', 'directeur', 'manager', 'chef_rang', 'barman'],
    floor_plan: ['super_admin', 'directeur', 'manager', 'chef_rang', 'serveur', 'hotesse'],
    reservations: ['super_admin', 'directeur', 'manager', 'chef_rang', 'serveur', 'hotesse'],
    staff: ['super_admin', 'directeur', 'manager', 'chef_rang'],
    planning: ['super_admin', 'directeur', 'manager', 'chef_rang', 'chef_cuisinier'],
    timeclock: ['super_admin', 'directeur', 'manager', 'comptable', 'chef_rang', 'serveur', 'chef_cuisinier', 'cuisinier', 'barman', 'hotesse', 'plongeur'],
    recruitment: ['super_admin', 'directeur', 'manager'],
    leaves: ['super_admin', 'directeur', 'manager', 'comptable', 'chef_rang', 'serveur', 'chef_cuisinier', 'cuisinier', 'barman', 'hotesse', 'plongeur'],
    finance: ['super_admin', 'directeur', 'manager', 'comptable'],
    haccp: ['super_admin', 'directeur', 'manager', 'chef_cuisinier', 'cuisinier'],
    inventory: ['super_admin', 'directeur', 'manager', 'comptable', 'chef_cuisinier', 'cuisinier', 'barman'],
    crm: ['super_admin', 'directeur', 'manager', 'comptable', 'chef_rang', 'hotesse'],
    marketing: ['super_admin', 'directeur', 'manager', 'chef_rang'],
    analytics: ['super_admin', 'directeur', 'manager', 'comptable'],
    intelligence: ['super_admin', 'directeur', 'manager'],
    menu_builder: ['super_admin', 'directeur', 'manager', 'chef_cuisinier'],
    registre: ['super_admin', 'directeur', 'manager', 'comptable', 'chef_cuisinier'],
    operations: ['super_admin', 'directeur', 'manager', 'chef_rang', 'chef_cuisinier'],
    settings: ['super_admin', 'directeur', 'manager'],
    mon_espace: ['super_admin', 'directeur', 'manager', 'comptable', 'chef_rang', 'serveur', 'chef_cuisinier', 'cuisinier', 'barman', 'hotesse', 'plongeur'],
    welcome_staff: ['super_admin', 'directeur', 'manager', 'comptable', 'chef_rang', 'serveur', 'chef_cuisinier', 'cuisinier', 'barman', 'hotesse', 'plongeur'],
    migration: ['super_admin', 'directeur'],
    vanguard: ['super_admin', 'directeur', 'manager'],
    mcc: ['super_admin', 'directeur'],
};

export const DEFAULT_TAB_ACCESS: Record<string, Record<string, number>> = {
    kitchen: { 'mise-en-place': 35, 'prep-journalier': 35, recipes: 35, ingredients: 45, margins: 70, waste: 35, suppliers: 70, allergens: 45 },
    bar: { kds: 35, wines: 35, sommelier: 50, cocktails: 35, stocks: 50 },
    staff: { team: 50, planning: 50, timesheet: 50, payroll: 70, skills: 50, leaves: 50, recruitment: 70 },
    finance: { accounting: 60, billing: 60, bank: 60, treasury: 70, audit: 90 },
    haccp: { haccp: 35, quality: 45, planning: 45, compliance: 70, lots: 45 },
    inventory: { stock: 35, storage: 45, rotating_count: 45 },
    crm: { pipeline: 30, customers: 30, history: 50, import: 70, promos: 50, emails: 70, automations: 70, rfm: 70, analytics: 60 },
    marketing: { campaigns: 70, social: 70, quotes: 50, ai: 70, seo: 70 },
    analytics: { profitability: 70, reputation: 70, compliance: 60, oracle: 90 },
    registre: { overview: 45, duerp: 90, incendie: 70, prestataires: 70, interventions: 70, pmr: 70, conformite: 45 },
    leaves: { my_requests: 10, team_calendar: 50, to_approve: 50 },
    mon_espace: { planning: 10, pointage: 10, conges: 10, pourboires: 10, bulletin: 10, formations: 10 },
    settings: {
        profile: 10, identity: 70, hours: 70, menu: 70, recipes: 45, inventory: 70, staff: 70,
        planning: 70, reservations: 70, customer: 70, pos: 70, accounting: 60, delivery: 70,
        reviews: 70, appearance: 70, notifications: 70, security: 90, goals: 70, integrations: 90,
        legal: 90, haccp: 70, migration: 90, tables: 70, printer: 70, tpe: 70, 'cash-drawer': 70,
        governance: 90, nexus: 90,
    },
};
