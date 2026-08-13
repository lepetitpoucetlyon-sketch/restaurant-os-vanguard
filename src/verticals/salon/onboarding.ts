import type { FloorPlanProfile, SourceSystem } from '@/verticals/_shared/onboarding.types';

export const floorPlanProfile: FloorPlanProfile = {
  spaceName: 'Poste',
  zones: [
    { name: 'Coiffure', defaultCount: 6 },
    { name: 'Shampoing', defaultCount: 2 },
    { name: 'Cabine esthétique', defaultCount: 1 },
    { name: 'Accueil', defaultCount: 1 },
  ],
};

export const sourceSystems: SourceSystem[] = [
  { id: 'pennylane', name: 'Pennylane', categories: ['fec', 'statements'] },
];
