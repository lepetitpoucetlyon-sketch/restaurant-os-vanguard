import type { FloorPlanProfile, SourceSystem } from '@/verticals/_shared/onboarding.types';

export const floorPlanProfile: FloorPlanProfile = {
  spaceName: 'Chambre',
  zones: [
    { name: 'Réception', defaultCount: 2 },
    { name: 'Chambres standard', defaultCount: 15 },
    { name: 'Suites', defaultCount: 3 },
    { name: 'Salle de conférence', defaultCount: 2 },
  ],
};

export const sourceSystems: SourceSystem[] = [
  { id: 'pennylane', name: 'Pennylane', categories: ['fec', 'statements'] },
];
