/**
 * onboardingSteps — mig-19
 *
 * Séquence d'onboarding migration :
 * plan de salle → menu → équipe → fournisseurs → stocks → CRM
 */

export interface OnboardingStep {
  id: string;
  order: number;
  title: string;
  description: string;
  /** Collection Nexus utilisée pour vérifier si l'étape est complète (count > 0). */
  nexusCollection: string;
  route?: string;
  estimatedMinutes: number;
}

export const ONBOARDING_SEQUENCE: OnboardingStep[] = [
  {
    id: 'floor-plan',
    order: 1,
    title: 'Plan de salle',
    description: 'Configurez vos tables et zones',
    nexusCollection: 'tables',
    route: '/settings?tab=migration',
    estimatedMinutes: 10,
  },
  {
    id: 'menu',
    order: 2,
    title: 'Menu & Produits',
    description: 'Importez ou créez votre menu',
    nexusCollection: 'products',
    route: '/inventory',
    estimatedMinutes: 20,
  },
  {
    id: 'team',
    order: 3,
    title: 'Équipe',
    description: 'Ajoutez vos employés et leurs PINs',
    nexusCollection: 'users',
    route: '/staff',
    estimatedMinutes: 15,
  },
  {
    id: 'suppliers',
    order: 4,
    title: 'Fournisseurs',
    description: 'Renseignez vos fournisseurs principaux',
    nexusCollection: 'suppliers',
    route: '/inventory?tab=suppliers',
    estimatedMinutes: 10,
  },
  {
    id: 'stocks',
    order: 5,
    title: 'Stocks initiaux',
    description: 'Saisissez les stocks de départ',
    nexusCollection: 'stocks',
    route: '/inventory?tab=stocks',
    estimatedMinutes: 20,
  },
  {
    id: 'crm',
    order: 6,
    title: 'Clients CRM',
    description: "Importez l'historique clients",
    nexusCollection: 'crms',
    route: '/crm',
    estimatedMinutes: 15,
  },
];
