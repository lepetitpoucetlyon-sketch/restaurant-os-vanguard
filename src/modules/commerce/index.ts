export * from './marketing';
export * from './reservations';
export { useMarketing } from './marketing/hooks/useMarketing';
export { useQuotes } from './marketing/hooks/useQuotes';
// Ré-export depuis la source (commerceHooks) et non le barrel NexusOpsProvider :
// passer par le Provider crée un cycle SSR commerce → Provider → NexusSyncService → commerce
// (TDZ « Cannot access 'p' before initialization » au prerender).
export { useReservations } from '@/engines/ops/hooks/commerceHooks';


