import type { FloorPlanProfile, SourceSystem } from '@/verticals/_shared/onboarding.types';

export const floorPlanProfile: FloorPlanProfile = {
  spaceName: 'Table',
  zones: [
    { name: 'Salle', defaultCount: 10 },
    { name: 'Terrasse', defaultCount: 6 },
    { name: 'Bar', defaultCount: 4 },
    { name: 'Salon privé', defaultCount: 4 },
  ],
};

export const sourceSystems: SourceSystem[] = [
  { id: 'zelty',      name: 'Zelty',                categories: ['menu', 'crm'] },
  { id: 'laddition',  name: "L'Addition",           categories: ['menu', 'crm'] },
  { id: 'lightspeed', name: 'Lightspeed Restaurant', categories: ['menu', 'inventory'] },
  { id: 'tiller',     name: 'Tiller (SumUp POS)',    categories: ['menu', 'staff'] },
  { id: 'zenchef',    name: 'Zenchef',               categories: ['reservations', 'crm'] },
  { id: 'thefork',    name: 'TheFork',               categories: ['reservations'] },
  { id: 'pennylane',  name: 'Pennylane',             categories: ['fec', 'statements'] },
];
