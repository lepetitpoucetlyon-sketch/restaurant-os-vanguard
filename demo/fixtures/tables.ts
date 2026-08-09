export interface DemoTable {
  id: string;
  number: string;
  seats: number;
  zoneId: string;
  status: 'free' | 'seated' | 'reserved';
}

export const DEMO_TABLES: DemoTable[] = [
  { id: 'tbl_101', number: 'T101', seats: 2, zoneId: 'SALLE', status: 'free' },
  { id: 'tbl_102', number: 'T102', seats: 4, zoneId: 'SALLE', status: 'free' },
  { id: 'tbl_103', number: 'T103', seats: 4, zoneId: 'SALLE', status: 'free' },
  { id: 'tbl_104', number: 'T104', seats: 6, zoneId: 'SALLE', status: 'free' },
  { id: 'tbl_201', number: 'T201', seats: 4, zoneId: 'TERRASSE', status: 'free' },
];
