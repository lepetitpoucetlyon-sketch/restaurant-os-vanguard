// Domaine : acquisition (marketing, SEO, landing)
export * from './acquisition/marketing';
export { LandingDashboard } from './acquisition/landing/components/LandingDashboard';
export { MenuJsonLd } from './acquisition/seo';
export { PromoCodeManager } from './acquisition/marketing/components/crm/PromoCodeManager';
export type { PromoCodeRecord } from './acquisition/marketing/components/crm/PromoCodeManager';

// Domaine : relation (reservations, CRM, customers, delivery)
export * from './relation/reservations';
export * from './relation/customers/components';
export { ProspectingDashboard } from './relation/crm/components/ProspectingDashboard';
export { AggregatorMappingService } from './relation/delivery/services/AggregatorMappingService';
export { GroupFormModal } from './relation/reservations/components/GroupFormModal';
export type { GroupFormData } from './relation/reservations/components/GroupFormModal';
// Ré-export depuis la source (commerceHooks) et non le barrel NexusOpsProvider :
// passer par le Provider crée un cycle SSR commerce → Provider → NexusSyncService → commerce
// eslint-disable-next-line no-restricted-imports
export { useReservations, useCRM } from '@/modules/ops';

// Domaine : fidélité (loyalty, quotes, widgets)
export { ReservationWidget } from './fidelite/widgets';

// Infrastructure pilier (connectors, ui)
export { ReviewProviderFactory } from './connectors/reviews';
export { CustomerImportPanel } from '@/modules/onboarding/migration';
