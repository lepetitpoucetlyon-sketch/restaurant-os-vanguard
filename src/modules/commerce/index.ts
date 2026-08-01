// Domaine : acquisition (marketing, SEO, landing)
export * from './acquisition/marketing';
export { useMarketing } from './acquisition/marketing/hooks/useMarketing';
export { useQuotes } from './acquisition/marketing/hooks/useQuotes';
export { LandingDashboard } from './acquisition/landing/components/LandingDashboard';
export { MenuJsonLd } from './acquisition/seo';

// Domaine : relation (reservations, CRM, customers, delivery)
export * from './relation/reservations';
export * from './relation/customers/components';
export { ProspectingDashboard } from './relation/crm/components/ProspectingDashboard';
// Ré-export depuis la source (commerceHooks) et non le barrel NexusOpsProvider :
// passer par le Provider crée un cycle SSR commerce → Provider → NexusSyncService → commerce
// eslint-disable-next-line no-restricted-imports
export { useReservations, useCRM } from '@/modules/ops/providers/hooks/commerceHooks';

// Domaine : fidélité (loyalty, quotes, widgets)
export { ReservationWidget } from './fidelite/widgets';

// Infrastructure pilier (connectors, ui)
export { ReviewProviderFactory } from './connectors/reviews';
export { CustomerImportPanel } from '@/modules/onboarding/migration';
