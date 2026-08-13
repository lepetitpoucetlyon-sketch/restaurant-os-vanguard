import type { FloorPlanProfile, SourceSystem } from '@/verticals/_shared/onboarding.types';

export const floorPlanProfile: FloorPlanProfile = {
  spaceName: 'Rayon',
  zones: [
    { name: 'Surface de vente', defaultCount: 8 },
    { name: 'Caisse', defaultCount: 2 },
    { name: 'Réserve', defaultCount: 1 },
    { name: 'Vitrine', defaultCount: 2 },
  ],
};

export const sourceSystems: SourceSystem[] = [
  { id: 'pennylane', name: 'Pennylane', categories: ['fec', 'statements'] },
];
