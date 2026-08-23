/**
 * 👥 RbacDeriver — dérive une RolesTemplate concrète depuis les answers + variant + capabilities.
 *
 * Le problème résolu : Axe 1 Q1.3 (`simple/standard/granular`) est un curseur
 * de granularité. Cette fonction en dérive une STRUCTURE DE RÔLES effective :
 * qui existe, avec quelles permissions, quel niveau MFA, quel per-site,
 * quelles spécificités sectorielles (chef/second/commis vs praticien/assistant).
 *
 * Pure fonction : (answers, variant, capabilities, siteCount) → RolesTemplate.
 * Aucune I/O, testable, déterministe.
 */

import type { PlatformVariant } from '@/modules/system';
import type { CapabilitySet } from '../catalog/CapabilityCatalog';
import type { QualificationAnswers } from '@/modules/commerce';

// ── Types de sortie ─────────────────────────────────────────────────────────────

export type RoleTier = 'admin' | 'manager' | 'operator' | 'stagiaire';

/** Permission normalisée `pillar:action` (lecture/écriture large). */
export type Permission = string;

export interface DerivedRole {
    readonly key: string;
    readonly label: string;
    readonly tier: RoleTier;
    readonly permissions: readonly Permission[];
    readonly perSite?: boolean;
    /** Nombre minimal recommandé (rare : uniquement rôles critiques comme "responsable_hygiene"). */
    readonly quorum?: number;
    /** Source de la dérivation (utile pour debug + blindspot). */
    readonly derivedFrom: readonly string[];
}

export type PasswordPolicy = 'basic' | 'strong' | 'strict';

export interface RolesTemplate {
    readonly roles: readonly DerivedRole[];
    /** Estimation nombre d'utilisateurs (seats) attendus. */
    readonly expectedSeats: number;
    /** Rôles pour lesquels MFA est obligatoire. */
    readonly mfaRequiredFor: readonly string[];
    /** Politique password globale. */
    readonly passwordPolicy: PasswordPolicy;
    /** Rôle-clé qui doit être l'admin racine du tenant. */
    readonly rootAdminRole: string;
}

// ── Entrée ──────────────────────────────────────────────────────────────────────

export interface RbacDeriverInput {
    readonly answers: QualificationAnswers;
    readonly variant: PlatformVariant;
    readonly effectiveCapabilities: CapabilitySet;
    /** Nombre de sites (si multi-site) — défaut 1. */
    readonly siteCount?: number;
}

// ── Dérivation ──────────────────────────────────────────────────────────────────

/**
 * Produit la RolesTemplate depuis les answers + capabilities + variant.
 * Ordre des rôles : admin d'abord, puis descendant par tier ; ordre stable.
 */
export function deriveRbac(input: RbacDeriverInput): RolesTemplate {
    const { answers, variant, effectiveCapabilities: caps, siteCount = 1 } = input;
    const roles: DerivedRole[] = [];
    const isMultiSite = siteCount > 1 || answers.axis1_topology !== 'mono';
    const isFranchise = answers.axis1_topology === 'franchise';
    const staff = answers.axis1_estimatedStaff ?? estimateStaffFromScale(answers.axis1_scale);

    // ── 1. Socle universel (tous tenants) ─────────────────────────────────────

    roles.push({
        key: 'admin',
        label: 'Administrateur',
        tier: 'admin',
        permissions: ['*'],
        derivedFrom: ['axis1_scale=* → rôle admin toujours présent'],
    });

    // ── 2. Structure hiérarchique selon échelle ───────────────────────────────

    if (answers.axis1_scale !== 'solo') {
        roles.push({
            key: 'operator',
            label: 'Employé opérationnel',
            tier: 'operator',
            permissions: derivePermissionsForOperator(caps),
            derivedFrom: [`axis1_scale=${answers.axis1_scale} → rôle opérationnel de base`],
        });
    }

    if (answers.axis1_scale === 'pme' || answers.axis1_scale === 'eti') {
        roles.push({
            key: 'manager',
            label: 'Manager',
            tier: 'manager',
            permissions: derivePermissionsForManager(caps),
            derivedFrom: [`axis1_scale=${answers.axis1_scale} → besoin d'un tier intermédiaire manager`],
        });
    }

    if (answers.axis1_scale === 'eti') {
        roles.push({
            key: 'direction',
            label: 'Direction',
            tier: 'admin',
            permissions: derivePermissionsForDirection(caps),
            derivedFrom: [`axis1_scale=eti → séparation direction / admin technique`],
        });
    }

    // ── 3. Multi-site : site_manager par site + regional si ≥ 3 sites ──────────

    if (isMultiSite) {
        roles.push({
            key: 'site_manager',
            label: 'Manager de site',
            tier: 'manager',
            permissions: derivePermissionsForSiteManager(caps),
            perSite: true,
            derivedFrom: [`axis1_topology=${answers.axis1_topology}, siteCount=${siteCount}`],
        });
    }

    if (siteCount >= 3 || isFranchise) {
        roles.push({
            key: 'regional_manager',
            label: 'Manager régional',
            tier: 'manager',
            permissions: derivePermissionsForRegionalManager(caps),
            derivedFrom: [`siteCount=${siteCount} ≥ 3 ou franchise`],
        });
    }

    if (isFranchise) {
        roles.push({
            key: 'franchise_admin',
            label: 'Administrateur franchise',
            tier: 'admin',
            permissions: derivePermissionsForFranchiseAdmin(),
            derivedFrom: ['axis1_topology=franchise → admin réseau distinct'],
        });
    }

    // ── 4. Rôles sectoriels (variant-specific) ────────────────────────────────

    roles.push(...deriveSectorRoles(variant, answers));

    // ── 5. Rôles imposés par capabilities activées ────────────────────────────

    if (caps['mod_haccp'] === true) {
        roles.push({
            key: 'responsable_hygiene',
            label: 'Responsable hygiène',
            tier: 'manager',
            permissions: ['compliance:read', 'compliance:write', 'haccp:*'],
            quorum: 1,
            derivedFrom: ['capability mod_haccp = true → responsable hygiène obligatoire (PMS)'],
        });
    }

    if (caps['mod_accounting_management'] === true && answers.axis1_scale !== 'solo') {
        roles.push({
            key: 'comptable',
            label: 'Comptable',
            tier: 'manager',
            permissions: ['finance:*', 'accounting:*'],
            derivedFrom: ['capability mod_accounting_management = true → rôle comptable distinct de admin'],
        });
    }

    if (caps['mod_hr'] === true && answers.axis1_scale !== 'solo') {
        roles.push({
            key: 'rh_manager',
            label: 'Responsable RH',
            tier: 'manager',
            permissions: ['human:*'],
            derivedFrom: ['capability mod_hr = true → responsable RH'],
        });
    }

    // ── 6. Stagiaire uniquement si structure suffisante ───────────────────────

    if (answers.axis1_scale === 'pme' || answers.axis1_scale === 'eti') {
        roles.push({
            key: 'stagiaire',
            label: 'Stagiaire',
            tier: 'stagiaire',
            permissions: derivePermissionsForOperator(caps).filter(p => p.endsWith(':read')),
            derivedFrom: [`axis1_scale=${answers.axis1_scale} → structure suffisante pour accueillir des stagiaires`],
        });
    }

    // ── 7. Politique sécurité globale ────────────────────────────────────────

    const passwordPolicy: PasswordPolicy = policyFromScaleAndRbac(answers.axis1_scale, answers.axis1_rbac);
    const mfaRequiredFor = mfaRolesFromContext(answers, roles);

    return {
        roles: dedupeRolesByKey(roles),
        expectedSeats: staff,
        mfaRequiredFor,
        passwordPolicy,
        rootAdminRole: isFranchise ? 'franchise_admin' : 'admin',
    };
}

// ── Rôles sectoriels ────────────────────────────────────────────────────────────

function deriveSectorRoles(variant: PlatformVariant, answers: QualificationAnswers): DerivedRole[] {
    // Un solo n'a pas de sous-rôles sectoriels (il fait tout lui-même).
    if (answers.axis1_scale === 'solo') return [];

    const commonDerivedFrom = `variant=${variant} + axis1_scale=${answers.axis1_scale}`;

    switch (variant) {
        case 'restaurant':
            return [
                role('chef_cuisine', 'Chef de cuisine', 'manager', ['ops:*', 'kitchen:*', 'inventory:read'], commonDerivedFrom),
                role('second_cuisine', 'Second de cuisine', 'operator', ['ops:read', 'kitchen:*'], commonDerivedFrom),
                role('commis', 'Commis', 'operator', ['kitchen:read', 'kitchen:write'], commonDerivedFrom),
                role('serveur', 'Serveur', 'operator', ['pos:*', 'orders:*'], commonDerivedFrom),
                role('sommelier', 'Sommelier', 'operator', ['pos:*', 'bar:*'], commonDerivedFrom),
            ];
        case 'bakery':
            return [
                role('boulanger', 'Boulanger', 'manager', ['ops:*', 'kitchen:*'], commonDerivedFrom),
                role('vendeur_boutique', 'Vendeur boutique', 'operator', ['pos:*'], commonDerivedFrom),
            ];
        case 'hotel':
            return [
                role('reception', 'Réceptionniste', 'operator', ['reservations:*', 'pos:*'], commonDerivedFrom),
                role('housekeeping', 'Gouvernant(e)', 'operator', ['facility:read', 'facility:write'], commonDerivedFrom),
                role('concierge', 'Concierge', 'operator', ['reservations:*'], commonDerivedFrom),
            ];
        case 'clinic':
        case 'veterinary':
            return [
                role('praticien', 'Praticien', 'manager', ['pos:*', 'reservations:*', 'patients:*'], commonDerivedFrom),
                role('assistant_medical', 'Assistant médical', 'operator', ['reservations:*', 'patients:read'], commonDerivedFrom),
                role('accueil', 'Accueil', 'operator', ['reservations:*', 'pos:read'], commonDerivedFrom),
            ];
        case 'garage':
            return [
                role('chef_atelier', 'Chef d\'atelier', 'manager', ['ops:*', 'inventory:*'], commonDerivedFrom),
                role('mecanicien', 'Mécanicien', 'operator', ['orders:*', 'inventory:read'], commonDerivedFrom),
                role('carrossier', 'Carrossier', 'operator', ['orders:*', 'inventory:read'], commonDerivedFrom),
                role('conseiller_service', 'Conseiller service', 'operator', ['pos:*', 'reservations:*'], commonDerivedFrom),
            ];
        case 'salon':
            return [
                role('coiffeur', 'Coiffeur / Esthéticien', 'operator', ['pos:*', 'reservations:*'], commonDerivedFrom),
                role('apprenti', 'Apprenti', 'stagiaire', ['reservations:read'], commonDerivedFrom),
            ];
        case 'gym':
            return [
                role('coach', 'Coach sportif', 'operator', ['reservations:*', 'customers:read'], commonDerivedFrom),
                role('accueil_gym', 'Accueil', 'operator', ['pos:*', 'reservations:*'], commonDerivedFrom),
            ];
        case 'coworking':
            return [
                role('community_manager', 'Community manager', 'manager', ['reservations:*', 'customers:*'], commonDerivedFrom),
                role('accueil_coworking', 'Accueil', 'operator', ['reservations:*'], commonDerivedFrom),
            ];
        case 'florist':
            return [
                role('fleuriste', 'Fleuriste', 'operator', ['pos:*', 'inventory:*'], commonDerivedFrom),
                role('livreur', 'Livreur', 'operator', ['orders:read'], commonDerivedFrom),
            ];
        case 'retail':
            return [
                role('vendeur_retail', 'Vendeur boutique', 'operator', ['pos:*', 'inventory:read'], commonDerivedFrom),
                role('responsable_boutique', 'Responsable boutique', 'manager', ['pos:*', 'inventory:*', 'orders:*'], commonDerivedFrom),
            ];
        case 'custom':
            return []; // Le variant custom compose ses rôles ad-hoc.
        default:
            return [];
    }
}

// ── Permissions par tier ────────────────────────────────────────────────────────

function derivePermissionsForOperator(caps: CapabilitySet): Permission[] {
    const p: Permission[] = ['dashboard:read'];
    if (caps['mod_pos']) p.push('pos:*', 'orders:*');
    if (caps['mod_reservations']) p.push('reservations:*');
    if (caps['mod_customer']) p.push('customers:read', 'customers:write');
    if (caps['mod_inventory']) p.push('inventory:read');
    return p;
}

function derivePermissionsForManager(caps: CapabilitySet): Permission[] {
    const p: Permission[] = ['dashboard:read', 'analytics:read'];
    if (caps['mod_pos']) p.push('pos:*', 'orders:*');
    if (caps['mod_hr']) p.push('human:*');
    if (caps['mod_inventory']) p.push('inventory:*');
    if (caps['mod_reservations']) p.push('reservations:*');
    if (caps['mod_customer']) p.push('customers:*');
    if (caps['mod_marketing']) p.push('marketing:*');
    return p;
}

function derivePermissionsForDirection(caps: CapabilitySet): Permission[] {
    const p: Permission[] = derivePermissionsForManager(caps);
    p.push('finance:*', 'audit:*');
    if (caps['mod_fleet_management']) p.push('mcc:read');
    return p;
}

function derivePermissionsForSiteManager(caps: CapabilitySet): Permission[] {
    return [...derivePermissionsForManager(caps), 'site:manage'];
}

function derivePermissionsForRegionalManager(caps: CapabilitySet): Permission[] {
    return [...derivePermissionsForManager(caps), 'site:manage', 'sites:consolidate'];
}

function derivePermissionsForFranchiseAdmin(): Permission[] {
    return ['*', 'franchise:*'];
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

function role(key: string, label: string, tier: RoleTier, permissions: Permission[], derivedReason: string, perSite = false): DerivedRole {
    return { key, label, tier, permissions, perSite: perSite || undefined, derivedFrom: [derivedReason] };
}

function policyFromScaleAndRbac(scale: QualificationAnswers['axis1_scale'], rbac: QualificationAnswers['axis1_rbac']): PasswordPolicy {
    if (scale === 'eti' || rbac === 'granular') return 'strict';
    if (scale === 'pme' || rbac === 'standard') return 'strong';
    return 'basic';
}

function mfaRolesFromContext(answers: QualificationAnswers, roles: readonly DerivedRole[]): string[] {
    if (answers.axis1_scale === 'eti' || answers.axis1_rbac === 'granular') {
        return roles.map(r => r.key); // MFA partout
    }
    if (answers.axis1_scale === 'pme' || answers.axis1_rbac === 'standard') {
        return roles.filter(r => r.tier === 'admin' || r.tier === 'manager').map(r => r.key);
    }
    // Solo/TPE : MFA sur admin uniquement
    return roles.filter(r => r.tier === 'admin').map(r => r.key);
}

function estimateStaffFromScale(scale: QualificationAnswers['axis1_scale']): number {
    return scale === 'solo' ? 1 : scale === 'tpe' ? 5 : scale === 'pme' ? 25 : 100;
}

function dedupeRolesByKey(roles: readonly DerivedRole[]): DerivedRole[] {
    const seen = new Map<string, DerivedRole>();
    for (const r of roles) if (!seen.has(r.key)) seen.set(r.key, r);
    return [...seen.values()];
}
