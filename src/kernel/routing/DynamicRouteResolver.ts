import type { PermissionRole } from '@/shared/nexus/contracts/permissions.types';

export interface RouteCapabilityConfig {
  path: string;
  label: string;
  kicker: string;
  requiredModule?: string;
  minTier?: 'STARTER' | 'PRO' | 'ENTERPRISE';
  allowedRoles?: PermissionRole[];
  fallbackPath?: string;
}

export const OPS_ROUTE_REGISTRY: Record<string, RouteCapabilityConfig> = {
  '/pos': {
    path: '/pos',
    label: 'Caisse POS',
    kicker: 'Service en salle',
    requiredModule: 'pos',
    allowedRoles: ['admin', 'directeur', 'manager', 'chef_rang', 'serveur'],
  },
  '/pos-mobile': {
    path: '/pos-mobile',
    label: 'Pad Mobile',
    kicker: 'Prise de commande nomade',
    requiredModule: 'pos',
    allowedRoles: ['admin', 'directeur', 'manager', 'chef_rang', 'serveur'],
  },
  '/kds': {
    path: '/kds',
    label: 'KDS Cuisine',
    kicker: 'Production & Cadençage',
    requiredModule: 'kds',
    allowedRoles: ['admin', 'directeur', 'manager', 'chef_cuisinier', 'cuisinier'],
  },
  '/floor-plan': {
    path: '/floor-plan',
    label: 'Plan de Salle',
    kicker: 'Topologie & Couverts',
    requiredModule: 'pos',
    allowedRoles: ['admin', 'directeur', 'manager', 'chef_rang', 'hotesse'],
  },
  '/reservations': {
    path: '/reservations',
    label: 'Réservations & Bookings',
    kicker: 'Accueil & Planning',
    requiredModule: 'reservations',
    allowedRoles: ['admin', 'directeur', 'manager', 'chef_rang', 'hotesse', 'receptionnaire'],
  },
  '/menu-builder': {
    path: '/menu-builder',
    label: 'Carte & Menus',
    kicker: 'Gestion de l\'offre',
    requiredModule: 'pos',
    allowedRoles: ['admin', 'directeur', 'manager', 'chef_cuisinier'],
  },
  '/inventory': {
    path: '/inventory',
    label: 'Stocks & Inventaires',
    kicker: 'Logistique & Économat',
    requiredModule: 'inventory',
    allowedRoles: ['admin', 'directeur', 'manager', 'chef_cuisinier', 'comptable'],
  },
  '/suppliers': {
    path: '/suppliers',
    label: 'Fournisseurs & Mercuriales',
    kicker: 'Approvisionnement',
    requiredModule: 'inventory',
    allowedRoles: ['admin', 'directeur', 'manager', 'comptable'],
  },
  '/haccp': {
    path: '/haccp',
    label: 'Hygiène & HACCP',
    kicker: 'Sécurité Sanitaire',
    requiredModule: 'haccp',
    allowedRoles: ['admin', 'directeur', 'manager', 'chef_cuisinier', 'cuisinier'],
  },
  '/finance': {
    path: '/finance',
    label: 'Finance & Trésorerie',
    kicker: 'Comptabilité & NF525',
    requiredModule: 'finance',
    allowedRoles: ['admin', 'directeur', 'comptable'],
  },
  '/accounting-portal': {
    path: '/accounting-portal',
    label: 'Portail Expert-Comptable',
    kicker: 'Exports FEC & Clôtures',
    requiredModule: 'finance',
    allowedRoles: ['admin', 'directeur', 'comptable'],
  },
  '/analytics': {
    path: '/analytics',
    label: 'Analytics & BI',
    kicker: 'Indicateurs de Performance',
    requiredModule: 'analytics',
    allowedRoles: ['admin', 'directeur', 'manager', 'comptable'],
  },
  '/staff': {
    path: '/staff',
    label: 'Équipe & RH',
    kicker: 'Ressources Humaines',
    requiredModule: 'staff',
    allowedRoles: ['admin', 'directeur', 'manager'],
  },
  '/planning': {
    path: '/planning',
    label: 'Planning des Équipes',
    kicker: 'Ordonnancement Brigade',
    requiredModule: 'planning',
    allowedRoles: ['admin', 'directeur', 'manager', 'chef_rang', 'chef_cuisinier'],
  },
  '/timeclock': {
    path: '/timeclock',
    label: 'Pointage & Badgeuse',
    kicker: 'Temps de travail légal',
    allowedRoles: ['admin', 'directeur', 'manager', 'chef_rang', 'serveur', 'cuisinier', 'barman', 'plongeur'],
  },
  '/mon-espace': {
    path: '/mon-espace',
    label: 'Mon Espace & Coffre RH',
    kicker: 'Espace Salarié',
    allowedRoles: ['admin', 'directeur', 'manager', 'chef_rang', 'serveur', 'cuisinier', 'barman', 'plongeur', 'receptionnaire', 'hotesse', 'collaborateur'],
  },
  '/bar': {
    path: '/bar',
    label: 'Bar & SmartSpout',
    kicker: 'Tireuses connectées & Cocktails',
    requiredModule: 'bar',
    allowedRoles: ['admin', 'directeur', 'manager', 'barman'],
  },
  '/facility': {
    path: '/facility',
    label: 'Facility & Équipements',
    kicker: 'GMAO & Maintenance',
    requiredModule: 'facility',
    allowedRoles: ['admin', 'directeur', 'manager'],
  },
  '/marketing': {
    path: '/marketing',
    label: 'Marketing & Fidélité',
    kicker: 'Campagnes & Avis clients',
    requiredModule: 'marketing',
    allowedRoles: ['admin', 'directeur', 'manager'],
  },
  '/crm': {
    path: '/crm',
    label: 'CRM & Clients',
    kicker: 'Fichier & Habitudes',
    requiredModule: 'crm',
    allowedRoles: ['admin', 'directeur', 'manager'],
  },
};

export class DynamicRouteResolver {
  /**
   * Vérifie si une route opérationnelle est activée selon les modules du tenant et le rôle de l'utilisateur.
   */
  static isRouteAccessible(
    routePath: string,
    context: {
      activeModules?: string[];
      tier?: 'STARTER' | 'PRO' | 'ENTERPRISE';
      userRole?: PermissionRole;
    }
  ): { allowed: boolean; reason?: string; fallbackPath?: string } {
    const config = OPS_ROUTE_REGISTRY[routePath];
    if (!config) {
      return { allowed: true };
    }

    // 1. Contrôle du rôle RBAC
    if (config.allowedRoles && context.userRole) {
      if (!config.allowedRoles.includes(context.userRole)) {
        return {
          allowed: false,
          reason: `Rôle ${context.userRole} non autorisé pour accéder à ${config.label}.`,
          fallbackPath: '/operations',
        };
      }
    }

    // 2. Contrôle du module activé sur l'instance
    if (config.requiredModule && context.activeModules) {
      if (!context.activeModules.includes(config.requiredModule)) {
        return {
          allowed: false,
          reason: `Le module ${config.requiredModule} n'est pas activé sur cet établissement.`,
          fallbackPath: '/operations',
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Retourne la liste des routes activées et accessibles pour un contexte donné.
   */
  static getAccessibleRoutes(context: {
    activeModules?: string[];
    tier?: 'STARTER' | 'PRO' | 'ENTERPRISE';
    userRole?: PermissionRole;
  }): RouteCapabilityConfig[] {
    return Object.values(OPS_ROUTE_REGISTRY).filter((route) =>
      this.isRouteAccessible(route.path, context).allowed
    );
  }
}
