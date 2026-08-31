import { z } from 'zod';
import type { PermissionRole, PageKey } from '@/shared/nexus/contracts/permissions.types';

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
    pos: ['admin', 'directeur', 'manager', 'chef_rang', 'serveur', 'barman'],
    pos_mobile: ['admin', 'directeur', 'manager', 'chef_rang', 'serveur', 'barman'],
    kds: ['admin', 'directeur', 'manager', 'chef_rang', 'serveur', 'chef_cuisinier', 'cuisinier', 'barman'],
    kitchen: ['admin', 'directeur', 'manager', 'chef_cuisinier', 'cuisinier'],
    bar: ['admin', 'directeur', 'manager', 'chef_rang', 'barman'],
    floor_plan: ['admin', 'directeur', 'manager', 'chef_rang', 'serveur', 'hotesse'],
    reservations: ['admin', 'directeur', 'manager', 'chef_rang', 'serveur', 'hotesse'],
    staff: ['admin', 'directeur', 'manager', 'chef_rang'],
    planning: ['admin', 'directeur', 'manager', 'chef_rang', 'chef_cuisinier'],
    timeclock: ['admin', 'directeur', 'manager', 'comptable', 'chef_rang', 'serveur', 'chef_cuisinier', 'cuisinier', 'barman', 'hotesse', 'plongeur'],
    recruitment: ['admin', 'directeur', 'manager'],
    leaves: ['admin', 'directeur', 'manager', 'comptable', 'chef_rang', 'serveur', 'chef_cuisinier', 'cuisinier', 'barman', 'hotesse', 'plongeur'],
    finance: ['admin', 'directeur', 'manager', 'comptable'],
    haccp: ['admin', 'directeur', 'manager', 'chef_cuisinier', 'cuisinier'],
    inventory: ['admin', 'directeur', 'manager', 'comptable', 'chef_cuisinier', 'cuisinier', 'barman'],
    crm: ['admin', 'directeur', 'manager', 'comptable', 'chef_rang', 'hotesse'],
    marketing: ['admin', 'directeur', 'manager', 'chef_rang'],
    analytics: ['admin', 'directeur', 'manager', 'comptable'],
    intelligence: ['admin', 'directeur', 'manager'],
    menu_builder: ['admin', 'directeur', 'manager', 'chef_cuisinier'],
    registre: ['admin', 'directeur', 'manager', 'comptable', 'chef_cuisinier'],
    operations: ['admin', 'directeur', 'manager', 'chef_rang', 'chef_cuisinier'],
    settings: ['admin', 'directeur', 'manager'],
    facility: ['admin', 'directeur', 'manager'],
    franchise: ['admin', 'directeur'],
};

export const DEFAULT_TAB_ACCESS: Record<string, Record<string, PermissionRole[]>> = {
    pos: {
        tables: ['admin', 'directeur', 'manager', 'chef_rang', 'serveur', 'barman'],
        takeaway: ['admin', 'directeur', 'manager', 'chef_rang', 'serveur'],
        delivery: ['admin', 'directeur', 'manager', 'chef_rang', 'serveur'],
        history: ['admin', 'directeur', 'manager'],
    },
    finance: {
        overview: ['admin', 'directeur', 'manager', 'comptable'],
        journal: ['admin', 'directeur', 'comptable'],
        ledger: ['admin', 'directeur', 'comptable'],
        vat: ['admin', 'directeur', 'comptable'],
        fec: ['admin', 'directeur', 'comptable'],
        audit: ['admin', 'directeur', 'comptable'],
    },
    staff: {
        roster: ['admin', 'directeur', 'manager', 'chef_rang'],
        planning: ['admin', 'directeur', 'manager', 'chef_rang', 'chef_cuisinier'],
        timeclock: ['admin', 'directeur', 'manager', 'comptable'],
        payroll: ['admin', 'directeur', 'comptable'],
        leaves: ['admin', 'directeur', 'manager', 'comptable'],
    },
};

export const DEFAULT_ACTION_ACCESS: Record<string, Record<string, PermissionRole[]>> = {
    reservations: {
        cancel_reservation: ['admin', 'directeur', 'manager', 'chef_rang', 'hotesse'],
        mark_no_show: ['admin', 'directeur', 'manager', 'chef_rang', 'hotesse'],
        create_group: ['admin', 'directeur', 'manager'],
    },
    pos: {
        void_line: ['admin', 'directeur', 'manager'],
        apply_discount: ['admin', 'directeur', 'manager', 'chef_rang'],
        cash_count: ['admin', 'directeur', 'manager', 'comptable'],
        split_payment: ['admin', 'directeur', 'manager', 'chef_rang', 'serveur'],
    },
    kds: {
        bump_order: ['admin', 'directeur', 'manager', 'chef_cuisinier', 'cuisinier'],
        recall_ticket: ['admin', 'directeur', 'manager', 'chef_cuisinier'],
    },
    finance: {
        export_fec: ['admin', 'comptable'],
        seal_zday: ['admin', 'directeur'],
        reconcile_bank: ['admin', 'directeur', 'comptable'],
        create_expense_claim: ['admin', 'directeur', 'manager', 'comptable'],
    },
    staff: {
        edit_shifts: ['admin', 'directeur', 'manager', 'chef_rang', 'chef_cuisinier'],
        approve_leaves: ['admin', 'directeur', 'manager'],
    },
    inventory: {
        adjust_stock: ['admin', 'directeur', 'manager', 'chef_cuisinier', 'comptable'],
    },
    haccp: {
        archive_logs: ['admin', 'directeur'],
    },
};

