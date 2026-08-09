export interface DemoReservation {
  id: string;
  customerName: string;
  partySize: number;
  date: string; // "YYYY-MM-DD"
  time: string; // "12:30" or "20:00"
  hasDeposit: boolean;
  status: 'confirmed' | 'seated' | 'cancelled' | 'noshow';
}

export const DEMO_RESERVATIONS: DemoReservation[] = [
  { id: 'res_demo_1', customerName: 'Alice Martin', partySize: 2, date: '2026-08-10', time: '12:30', hasDeposit: false, status: 'confirmed' },
  { id: 'res_demo_2', customerName: 'Groupe Dupont', partySize: 6, date: '2026-08-10', time: '20:00', hasDeposit: true, status: 'confirmed' },
  { id: 'res_demo_3', customerName: 'Thomas Bernard', partySize: 4, date: '2026-08-11', time: '13:00', hasDeposit: false, status: 'confirmed' },
];
