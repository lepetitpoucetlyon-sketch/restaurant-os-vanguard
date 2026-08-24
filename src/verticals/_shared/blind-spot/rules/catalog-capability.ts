/**
 * 🛒 Règles d'angles morts — famille "catalog_capability".
 *
 * Le catalogue scrapé révèle un besoin métier concret, mais la capability
 * correspondante n'est pas activée dans la qualification.
 */

import type { BlindSpotRule, RuleOutput, TenantContext } from '../types';

function catalogMatches(ctx: TenantContext, pat: RegExp): TenantContext['companyProfile']['catalog'][number] | null {
    return ctx.companyProfile.catalog.find(it => pat.test(`${it.name} ${it.description ?? ''} ${it.category ?? ''}`)) ?? null;
}

// ── R.1 Alcool détecté sans mod_bar ─────────────────────────────────────────────

export const ALCOHOL_WITHOUT_BAR: BlindSpotRule = {
    id: 'bs.catalog.alcohol_without_bar',
    family: 'catalog_capability',
    scope: 'tenant',
    defaultTitle: 'Alcool détecté dans le catalogue sans mod_bar',
    detectTenant(ctx) {
        const item = catalogMatches(ctx, /vin|bière|biere|cocktail|spiritueux|whisky|rhum|apéritif|champagne/i);
        if (!item) return null;
        if (ctx.qualification.capabilities['mod_bar'] === true) return null;
        return fix('high',
            [`catalogue contient alcool : "${item.name}" (${item.category})`,
             `qualification.capabilities.mod_bar = ${ctx.qualification.capabilities['mod_bar']}`],
            'enable_capability', 'mod_bar',
            'Alcool vendu → mod_bar (service comptoir) + licence + gate âge/horaires.');
    },
};

// ── R.2 Recettes détectées sans mod_kitchen_management ──────────────────────────

export const RECIPES_WITHOUT_KITCHEN: BlindSpotRule = {
    id: 'bs.catalog.recipes_without_kitchen',
    family: 'catalog_capability',
    scope: 'tenant',
    defaultTitle: 'Plats préparés sans mod_kitchen_management',
    detectTenant(ctx) {
        const item = catalogMatches(ctx, /plat|entrée|entree|dessert|menu du jour|formule|salade|burger|pizza|pâtes|pates/i);
        if (!item) return null;
        if (ctx.qualification.capabilities['mod_kitchen_management'] === true) return null;
        return fix('medium',
            [`catalogue contient plats préparés : "${item.name}"`,
             `qualification.capabilities.mod_kitchen_management = ${ctx.qualification.capabilities['mod_kitchen_management']}`],
            'enable_capability', 'mod_kitchen_management',
            'Plats préparés → gestion cuisine (fiches techniques, préparation, envois) recommandée.');
    },
};

// ── R.3 Rendez-vous / consultations sans mod_reservations ──────────────────────

export const APPOINTMENTS_WITHOUT_RESERVATIONS: BlindSpotRule = {
    id: 'bs.catalog.appointments_without_reservations',
    family: 'catalog_capability',
    scope: 'tenant',
    defaultTitle: 'Prestations sur rendez-vous sans mod_reservations',
    detectTenant(ctx) {
        const item = catalogMatches(ctx, /consultation|rendez-vous|séance|seance|prestation|forfait|coupe|soin|massage|examen/i);
        if (!item) return null;
        if (ctx.qualification.capabilities['mod_reservations'] === true) return null;
        return fix('high',
            [`catalogue contient prestation RDV : "${item.name}"`,
             `qualification.capabilities.mod_reservations = ${ctx.qualification.capabilities['mod_reservations']}`],
            'enable_capability', 'mod_reservations',
            'Prestations sur rendez-vous → module réservations obligatoire pour éviter le no-show manuel.');
    },
};

// ── R.4 Catalogue > 30 items sans mod_inventory ─────────────────────────────────

export const CATALOG_SIZE_WITHOUT_INVENTORY: BlindSpotRule = {
    id: 'bs.catalog.catalog_size_without_inventory',
    family: 'catalog_capability',
    scope: 'tenant',
    defaultTitle: 'Catalogue > 30 items sans mod_inventory',
    detectTenant(ctx) {
        if (ctx.companyProfile.catalog.length < 30) return null;
        if (ctx.qualification.capabilities['mod_inventory'] === true) return null;
        return fix('medium',
            [`companyProfile.catalog.length = ${ctx.companyProfile.catalog.length}`,
             `qualification.capabilities.mod_inventory = ${ctx.qualification.capabilities['mod_inventory']}`],
            'enable_capability', 'mod_inventory',
            'Catalogue conséquent → gestion des stocks obligatoire pour éviter ruptures/gaspillage.');
    },
};

// ── R.5 Abonnements / forfaits sans mod_customer ────────────────────────────────

export const SUBSCRIPTIONS_WITHOUT_CUSTOMER: BlindSpotRule = {
    id: 'bs.catalog.subscriptions_without_customer',
    family: 'catalog_capability',
    scope: 'tenant',
    defaultTitle: 'Abonnements/forfaits détectés sans mod_customer',
    detectTenant(ctx) {
        const item = catalogMatches(ctx, /abonnement|forfait mensuel|pass|carnet|adhésion|adhesion/i);
        if (!item) return null;
        if (ctx.qualification.capabilities['mod_customer'] === true) return null;
        return fix('high',
            [`catalogue contient abonnement/forfait : "${item.name}"`,
             `qualification.capabilities.mod_customer = ${ctx.qualification.capabilities['mod_customer']}`],
            'enable_capability', 'mod_customer',
            'Abonnements → fiche client obligatoire pour suivi renouvellement + facturation récurrente.');
    },
};

// ── Helper ──────────────────────────────────────────────────────────────────────

function fix(
    severity: 'critical' | 'high' | 'medium' | 'low',
    evidence: string[],
    kind: 'enable_capability' | 'raise_tier' | 'add_hardware' | 'add_guard' | 'add_route' | 'manual',
    target: string,
    rationale: string,
): RuleOutput {
    return { severity, evidence, suggestedFix: { kind, target, rationale } };
}

export const CATALOG_CAPABILITY_RULES: readonly BlindSpotRule[] = [
    ALCOHOL_WITHOUT_BAR,
    RECIPES_WITHOUT_KITCHEN,
    APPOINTMENTS_WITHOUT_RESERVATIONS,
    CATALOG_SIZE_WITHOUT_INVENTORY,
    SUBSCRIPTIONS_WITHOUT_CUSTOMER,
];
