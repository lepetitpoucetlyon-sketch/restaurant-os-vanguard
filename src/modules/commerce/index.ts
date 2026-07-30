export * from './marketing';
export * from './reservations';
// Composants "customer" canoniques (fiche client, dialog, vue CRM) — source unique
// partagée par les sous-modules customers et reservations du pilier commerce.
export * from './customers/components';
export { useMarketing } from './marketing/hooks/useMarketing';
export { useQuotes } from './marketing/hooks/useQuotes';
// Ré-export depuis la source (commerceHooks) et non le barrel NexusOpsProvider :
// passer par le Provider crée un cycle SSR commerce → Provider → NexusSyncService → commerce
// (TDZ « Cannot access 'p' before initialization » au prerender).
export { useReservations, useCRM } from '@/modules/ops/providers/hooks/commerceHooks';
export { CustomerImportPanel } from '@/modules/onboarding/migration';


export { LandingDashboard } from './landing/components/LandingDashboard';
export { ProspectingDashboard } from './crm/components/ProspectingDashboard';
export { MenuJsonLd } from './seo';
export { ReservationWidget } from './widgets';
export { ReviewProviderFactory } from './connectors/reviews';
