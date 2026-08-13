import type { FloorPlanProfile, SourceSystem } from '@/verticals/_shared/onboarding.types';

export const floorPlanProfile: FloorPlanProfile = {
  spaceName: 'Espace',
  zones: [
    { name: 'Boutique', defaultCount: 6 },
    { name: 'Espace dégustation', defaultCount: 3 },
    { name: 'Laboratoire', defaultCount: 1 },
  ],
};

export const sourceSystems: SourceSystem[] = [
  { id: 'pennylane', name: 'Pennylane', categories: ['fec', 'statements'] },
];
