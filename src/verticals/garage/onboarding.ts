import type { FloorPlanProfile, SourceSystem } from '@/verticals/_shared/onboarding.types';

export const floorPlanProfile: FloorPlanProfile = {
  spaceName: 'Baie',
  zones: [
    { name: 'Atelier', defaultCount: 4 },
    { name: 'Fosse de contrôle', defaultCount: 1 },
    { name: 'Zone carrosserie', defaultCount: 2 },
    { name: 'Accueil', defaultCount: 1 },
  ],
};

export const sourceSystems: SourceSystem[] = [
  { id: 'pennylane', name: 'Pennylane', categories: ['fec', 'statements'] },
];
