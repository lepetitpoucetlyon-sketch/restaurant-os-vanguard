import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { PermissionRole, PERMISSION_ROLE_LEVELS } from '@/shared/nexus/contracts/permissions.types';

export interface OnboardingPillarStep {
  id: string;
  pillar: string;
  pillarNumber: number;
  title: string;
  description: string;
  category: 'LEGAL_IDENTITY' | 'SPACES' | 'COMMERCE' | 'HR' | 'FINANCE' | 'FACILITY' | 'HARDWARE' | 'COMPLIANCE' | 'LOGISTICS' | 'CRM';
  minRole: PermissionRole;
  route: string;
  nexusCollection: string;
  estimatedMinutes: number;
  isMandatory: boolean;
  status: 'DONE' | 'IN_PROGRESS' | 'PENDING';
  currentCount?: number;
  requiredMinimumCount?: number;
  actionLabel: string;
}

export interface OnboardingAuditSummary {
  tenantId: string;
  overallProgressPercent: number;
  completedStepsCount: number;
  totalStepsCount: number;
  mandatoryCompletedCount: number;
  mandatoryTotalCount: number;
  isLaunchReady: boolean;
  steps: OnboardingPillarStep[];
  auditedAt: string;
}

export const RESTAURANT_ONBOARDING_PILLARS_DEFINITION: Omit<OnboardingPillarStep, 'status' | 'currentCount'>[] = [
  // 1. Identité & Fiscalité (Pilier 7 / 2)
  {
    id: 'step_identity',
    pillar: 'Identité & Établissement',
    pillarNumber: 1,
    title: 'Identité Fiscale & Coordonnées',
    description: 'Renseignez le SIRET, code NAF, numéro de TVA intracommunautaire et adresse de facturation.',
    category: 'LEGAL_IDENTITY',
    minRole: 'directeur',
    route: '/settings?tab=identity',
    nexusCollection: 'settings/identity',
    estimatedMinutes: 5,
    isMandatory: true,
    requiredMinimumCount: 1,
    actionLabel: 'Configurer l identité',
  },
  // 2. Plan de Salle & Tables (Pilier 8 Spaces)
  {
    id: 'step_floor_plan',
    pillar: 'Espaces & Salle',
    pillarNumber: 2,
    title: 'Plan de Salle & Disposition des Tables',
    description: 'Créez vos zones (Salle, Terrasse, Bar) et numérotez vos tables avec leurs capacités.',
    category: 'SPACES',
    minRole: 'manager',
    route: '/floor-plan',
    nexusCollection: 'tables',
    estimatedMinutes: 10,
    isMandatory: true,
    requiredMinimumCount: 1,
    actionLabel: 'Éditer le plan de salle',
  },
  // 3. Menu, Carte & Allergènes (Pilier 1 Commerce)
  {
    id: 'step_menu',
    pillar: 'Commerce & Menu',
    pillarNumber: 3,
    title: 'Menu, Carte & Déclaration des Allergènes',
    description: 'Importez ou créez vos plats, boissons, formules, taux de TVA et allergènes obligatoires.',
    category: 'COMMERCE',
    minRole: 'manager',
    route: '/menu-builder',
    nexusCollection: 'products',
    estimatedMinutes: 20,
    isMandatory: true,
    requiredMinimumCount: 1,
    actionLabel: 'Configurer la carte',
  },
  // 4. Équipe & PINs Caissiers (Pilier 4 Human)
  {
    id: 'step_team',
    pillar: 'Équipe & RH',
    pillarNumber: 4,
    title: 'Équipe, Rôles & Codes PINs Caissiers',
    description: 'Ajoutez les membres de votre brigade avec leurs rôles (manager, serveur, cuisinier) et PINs sécurisés.',
    category: 'HR',
    minRole: 'manager',
    route: '/staff',
    nexusCollection: 'users',
    estimatedMinutes: 15,
    isMandatory: true,
    requiredMinimumCount: 1,
    actionLabel: 'Gérer l équipe',
  },
  // 5. Connexion Bancaire DSP2 (Pilier 2 Finance)
  {
    id: 'step_banking',
    pillar: 'Finance & Trésorerie',
    pillarNumber: 5,
    title: 'Connexion Bancaire DSP2 & Grand Livre',
    description: 'Associez votre compte bancaire professionnel pour la réconciliation automatique des encaissements.',
    category: 'FINANCE',
    minRole: 'directeur',
    route: '/finance',
    nexusCollection: 'bank_connections',
    estimatedMinutes: 5,
    isMandatory: true,
    requiredMinimumCount: 1,
    actionLabel: 'Connecter la banque',
  },
  // 6. Parc Matériel, Factures & Tutos (Pilier 8 Facility)
  {
    id: 'step_equipment',
    pillar: 'Facility & Matériel',
    pillarNumber: 6,
    title: 'Inventaire des Équipements & Factures',
    description: 'Enregistrez vos fours, chambres froides, machines à café avec leurs factures d achat et tutos de nettoyage.',
    category: 'FACILITY',
    minRole: 'manager',
    route: '/facility',
    nexusCollection: 'equipmentAssets',
    estimatedMinutes: 15,
    isMandatory: false,
    requiredMinimumCount: 1,
    actionLabel: 'Gérer le matériel',
  },
  // 7. Recette Hardware J-0 (Pilier 8 / 3 Hardware)
  {
    id: 'step_hardware_recette',
    pillar: 'Hardware & Périphériques',
    pillarNumber: 7,
    title: 'Recette & Appairage Hardware J-0',
    description: 'Testez la communication avec le TPE de paiement, les imprimantes tickets caisse ESC/POS et le tiroir.',
    category: 'HARDWARE',
    minRole: 'manager',
    route: '/settings?tab=tpe',
    nexusCollection: 'hardware_commissions',
    estimatedMinutes: 10,
    isMandatory: true,
    requiredMinimumCount: 1,
    actionLabel: 'Lancer le diagnostic hardware',
  },
  // 8. Registres Légaux ERP & Sécurité (Pilier 6 Compliance)
  {
    id: 'step_legal_erp',
    pillar: 'Conformité & Sécurité',
    pillarNumber: 8,
    title: 'Registres Obligatoires ERP & Sécurité Incendie',
    description: 'Contrôlez les dates de visite des extincteurs, alarme incendie, DUERP et affichages obligatoires.',
    category: 'COMPLIANCE',
    minRole: 'directeur',
    route: '/registre',
    nexusCollection: 'erp_safety_items',
    estimatedMinutes: 10,
    isMandatory: true,
    requiredMinimumCount: 1,
    actionLabel: 'Consulter les registres',
  },
  // 9. Fournisseurs & Stocks Initiaux (Pilier 3 Logistics)
  {
    id: 'step_inventory_suppliers',
    pillar: 'Logistique & Stocks',
    pillarNumber: 9,
    title: 'Fournisseurs & Inventaire de Départ',
    description: 'Renseignez vos fournisseurs alimentaires et réalisez le premier comptage d inventaire.',
    category: 'LOGISTICS',
    minRole: 'manager',
    route: '/inventory',
    nexusCollection: 'suppliers',
    estimatedMinutes: 20,
    isMandatory: false,
    requiredMinimumCount: 1,
    actionLabel: 'Saisir les stocks',
  },
  // 10. CRM & Programme Fidélité (Pilier 5 Relations)
  {
    id: 'step_crm',
    pillar: 'Clients & Fidélité',
    pillarNumber: 10,
    title: 'Base Clients & Programme de Fidélité',
    description: 'Configurez votre programme de fidélité et importez votre fichier de clients réguliers.',
    category: 'CRM',
    minRole: 'manager',
    route: '/crm',
    nexusCollection: 'crms',
    estimatedMinutes: 10,
    isMandatory: false,
    requiredMinimumCount: 1,
    actionLabel: 'Configurer le CRM',
  },
];

/**
 * 🚀 RestaurantOnboardingMasterService — Moteur d'audit et de suivi de mise en service
 */
export class RestaurantOnboardingMasterService {
  /**
   * Vérifie l'état de complétion de toutes les étapes de l'onboarding pour un tenant.
   */
  static async auditOnboarding(tenantId: string): Promise<OnboardingAuditSummary> {
    const steps: OnboardingPillarStep[] = [];

    for (const def of RESTAURANT_ONBOARDING_PILLARS_DEFINITION) {
      let count = 0;
      let status: 'DONE' | 'IN_PROGRESS' | 'PENDING' = 'PENDING';

      try {
        if (def.nexusCollection.startsWith('settings/')) {
          const setting = await Nexus.adapter.get<Record<string, unknown>>(`tenants/${tenantId}/${def.nexusCollection}`);
          count = setting && Object.keys(setting).length > 0 ? 1 : 0;
        } else {
          const records = await Nexus.adapter.query<{ id: string }>(`tenants/${tenantId}/${def.nexusCollection}`);
          count = records ? records.length : 0;
        }

        if (count >= (def.requiredMinimumCount || 1)) {
          status = 'DONE';
        } else if (count > 0) {
          status = 'IN_PROGRESS';
        } else {
          status = 'PENDING';
        }
      } catch (err) {
        status = 'PENDING';
      }

      steps.push({
        ...def,
        status,
        currentCount: count,
      });
    }

    const totalStepsCount = steps.length;
    const completedStepsCount = steps.filter((s) => s.status === 'DONE').length;
    const mandatorySteps = steps.filter((s) => s.isMandatory);
    const mandatoryCompletedCount = mandatorySteps.filter((s) => s.status === 'DONE').length;
    const mandatoryTotalCount = mandatorySteps.length;

    const overallProgressPercent = Math.round((completedStepsCount / totalStepsCount) * 100);
    const isLaunchReady = mandatoryCompletedCount === mandatoryTotalCount;

    return {
      tenantId,
      overallProgressPercent,
      completedStepsCount,
      totalStepsCount,
      mandatoryCompletedCount,
      mandatoryTotalCount,
      isLaunchReady,
      steps,
      auditedAt: new Date().toISOString(),
    };
  }

  /**
   * Vérifie si l'utilisateur a le rôle requis pour exécuter / voir une étape.
   */
  static isAuthorizedForStep(userRole: string, stepMinRole: PermissionRole): boolean {
    const normalizedRole = ['admin', 'fleet_admin', 'SUPER_ADMIN'].includes(userRole) ? 'super_admin' : userRole;
    const userLevel = PERMISSION_ROLE_LEVELS[normalizedRole as PermissionRole] ?? 0;
    const requiredLevel = PERMISSION_ROLE_LEVELS[stepMinRole] ?? 0;
    return userLevel >= requiredLevel;
  }
}
