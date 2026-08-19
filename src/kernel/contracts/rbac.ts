/**
 * kernel/contracts/rbac.ts — Source unique RBAC pour le projet.
 *
 * Toutes les autres sources sont dérivées de cette table déclarative :
 * - `PermissionRole` (type union)
 * - `PERMISSION_ROLE_LEVELS` (Record<Role, number>)
 * - `PERMISSION_ROLE_LABELS` (Record<Role, string>)
 * - `TENANT_ADMIN_ROLES` (roles admin/manager tenant)
 * - `FLEET_ROLES` (roles MCC opérateurs plateforme)
 *
 * Règle : ajouter un rôle = éditer UNIQUEMENT ce fichier.
 *
 * @see ADR-008 : RBAC single source of truth
 */

export type RbacScope = 'fleet' | 'tenant';

export interface RbacRoleDefinition {
  /** Scope opérationnel : MCC fleet (éditeur) vs tenant (gérant restaurant). */
  scope: RbacScope;
  /** Niveau hiérarchique 0-1000 ; utilisé pour les comparaisons `>=`. */
  level: number;
  /** Libellé humain FR pour UI. */
  label: string;
  /** Description courte du rôle. */
  description: string;
}

/**
 * Table déclarative unique — SEULE source de vérité RBAC du projet.
 * Les scopes fleet et tenant sont DISJOINTS.
 */
export const RBAC_ROLES = {
  // ─── Fleet (MCC) ───────────────────────────────────────────────────
  mcc_super_admin: {
    scope: 'fleet',
    level: 1000,
    label: 'Super Admin MCC',
    description: 'Accès complet flotte : provisioning, RBAC, révocation. MFA obligatoire.',
  },
  mcc_support: {
    scope: 'fleet',
    level: 900,
    label: 'MCC Support',
    description: 'Lecture + actions support (reset PIN, réindexation RAG).',
  },
  mcc_junior_dev: {
    scope: 'fleet',
    level: 800,
    label: 'MCC Junior Dev',
    description: 'Lecture seule (telemetry, status).',
  },

  // ─── Tenant — Direction ─────────────────────────────────────────────
  admin: {
    scope: 'tenant',
    level: 100,
    label: 'Administrateur',
    description: 'Plus haut niveau tenant : RBAC, config fiscale, provision utilisateurs.',
  },
  directeur: {
    scope: 'tenant',
    level: 90,
    label: 'Directeur',
    description: 'Direction opérationnelle : rapports financiers, planning global, RH.',
  },
  manager: {
    scope: 'tenant',
    level: 70,
    label: 'Manager',
    description: 'Encadrement quotidien : équipe, stock, clôture Z.',
  },
  comptable: {
    scope: 'tenant',
    level: 60,
    label: 'Comptable',
    description: 'Lecture finance + export FEC/DGFiP + rapprochement bancaire.',
  },

  // ─── Tenant — Encadrement métier ────────────────────────────────────
  chef_rang: { scope: 'tenant', level: 50, label: 'Chef de Rang', description: 'Encadrement service salle.' },
  chef_atelier: { scope: 'tenant', level: 50, label: "Chef d'Atelier", description: 'Encadrement atelier (garage).' },
  praticien: { scope: 'tenant', level: 50, label: 'Praticien / Médecin', description: 'Praticien vétérinaire ou médical.' },
  expert: { scope: 'tenant', level: 50, label: 'Expert Authentificateur', description: 'Expert authentification (verticale luxe).' },
  curator: { scope: 'tenant', level: 50, label: 'Curator / Gestionnaire Coffre', description: 'Gestion coffre-fort verticale luxe.' },
  chef_cuisinier: { scope: 'tenant', level: 45, label: 'Chef Cuisinier', description: 'Cuisine : recettes, KDS, stock cuisine, HACCP.' },

  // ─── Tenant — Opérationnel niveau 40 ────────────────────────────────
  serveur: { scope: 'tenant', level: 40, label: 'Serveur(se)', description: 'Service : prise commande, encaissement.' },
  mecanicien: { scope: 'tenant', level: 40, label: 'Mécanicien', description: 'Atelier mécanique (garage).' },
  coiffeur: { scope: 'tenant', level: 40, label: 'Coiffeur / Styliste', description: 'Coiffure / styling (salon).' },
  estheticienne: { scope: 'tenant', level: 40, label: 'Esthéticienne', description: 'Esthétique / soins (salon).' },
  vendeur: { scope: 'tenant', level: 40, label: 'Conseiller de Vente', description: 'Vente boutique (retail, luxe).' },
  receptionnaire: { scope: 'tenant', level: 40, label: 'Réceptionnaire', description: 'Réception client (garage, hôtel).' },
  collaborateur: { scope: 'tenant', level: 40, label: 'Collaborateur', description: 'Collaborateur généraliste (coworking).' },
  operateur: { scope: 'tenant', level: 40, label: 'Opérateur', description: 'Opérateur technique.' },

  // ─── Tenant — Niveau bas ────────────────────────────────────────────
  cuisinier: { scope: 'tenant', level: 35, label: 'Cuisinier', description: 'Poste cuisine.' },
  barman: { scope: 'tenant', level: 35, label: 'Barman', description: 'Bar : POS bar, stock boissons.' },
  hotesse: { scope: 'tenant', level: 30, label: 'Hôtesse', description: 'Accueil / hôtesse.' },
  plongeur: { scope: 'tenant', level: 10, label: 'Plongeur', description: 'Plonge / entretien.' },
} as const satisfies Record<string, RbacRoleDefinition>;

// ═══════════════════════════════════════════════════════════════════════
// DÉRIVÉS AUTOMATIQUES — ne rien éditer ici, tout vient de RBAC_ROLES
// ═══════════════════════════════════════════════════════════════════════

export type RbacRole = keyof typeof RBAC_ROLES;
export type FleetRole = { [K in RbacRole]: (typeof RBAC_ROLES)[K]['scope'] extends 'fleet' ? K : never }[RbacRole];
export type TenantRole = { [K in RbacRole]: (typeof RBAC_ROLES)[K]['scope'] extends 'tenant' ? K : never }[RbacRole];

/** Alias legacy — tokens Firebase existants. À supprimer post-migration claims. */
export const LEGACY_ROLE_ALIASES: Record<string, RbacRole> = {
  super_admin: 'mcc_super_admin',
  fleet_admin: 'mcc_super_admin',
  SUPER_ADMIN: 'mcc_super_admin',
};

/** Normalise un rôle brut (avec alias legacy) vers un RbacRole canonique. */
export function normalizeRbacRole(rawRole: string): RbacRole | null {
  if (rawRole in RBAC_ROLES) return rawRole as RbacRole;
  if (rawRole in LEGACY_ROLE_ALIASES) return LEGACY_ROLE_ALIASES[rawRole];
  return null;
}

/** Dérivé : type union de tous les rôles tenant (compatibilité avec ancien `PermissionRole`). */
const _tenantRoleEntries = Object.entries(RBAC_ROLES).filter(
  ([, def]) => def.scope === 'tenant'
) as Array<[TenantRole, RbacRoleDefinition]>;

const _fleetRoleEntries = Object.entries(RBAC_ROLES).filter(
  ([, def]) => def.scope === 'fleet'
) as Array<[FleetRole, RbacRoleDefinition]>;

/** Rôles tenant admin (niveau ≥ 70 : admin, directeur, manager). Utilisé par requireTenantAdmin. */
export const TENANT_ADMIN_ROLES = _tenantRoleEntries
  .filter(([, def]) => def.level >= 70)
  .map(([role]) => role) as readonly TenantRole[];

/** Rôles fleet (tous les MCC). Utilisé par requireFleetAdmin. */
export const FLEET_ROLES = _fleetRoleEntries.map(([role]) => role) as readonly FleetRole[];

/** Levels dérivés — compat avec ancien `PERMISSION_ROLE_LEVELS`. */
export const PERMISSION_ROLE_LEVELS = Object.fromEntries(
  _tenantRoleEntries.map(([role, def]) => [role, def.level])
) as Record<TenantRole, number>;

/** Labels dérivés — compat avec ancien `PERMISSION_ROLE_LABELS`. */
export const PERMISSION_ROLE_LABELS = Object.fromEntries(
  _tenantRoleEntries.map(([role, def]) => [role, def.label])
) as Record<TenantRole, string>;

/** Compat : type union alias vers TenantRole (l'ancien `PermissionRole` était tenant-only). */
export type PermissionRole = TenantRole;
