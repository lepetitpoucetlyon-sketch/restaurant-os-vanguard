import type { FloorPlanProfile, SourceSystem } from '@/verticals/_shared/onboarding.types';

export const floorPlanProfile: FloorPlanProfile = {
  spaceName: 'Salle de consultation',
  zones: [
    { name: 'Salle d\'attente', defaultCount: 1 },
    { name: 'Consultation', defaultCount: 3 },
    { name: 'Soins', defaultCount: 2 },
    { name: 'Accueil', defaultCount: 1 },
  ],
};

export const sourceSystems: SourceSystem[] = [
  { id: 'pennylane', name: 'Pennylane', categories: ['fec', 'statements'] },
];
