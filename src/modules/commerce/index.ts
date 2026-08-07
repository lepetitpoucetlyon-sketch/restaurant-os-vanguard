/* eslint-disable no-restricted-imports */
/* eslint-disable vanguard/no-inter-module-imports */
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
 
export { useReservations, useCRM } from '@/modules/ops/providers/hooks/commerceHooks';

// Domaine : fidélité (loyalty, quotes, widgets)
export { ReservationWidget } from './fidelite/widgets';

// Infrastructure pilier (connectors, ui)
export { ReviewProviderFactory } from './connectors/reviews';
// eslint-disable-next-line no-restricted-imports
export { CustomerImportPanel } from '@/modules/commerce/acquisition/onboarding/migration';

export { menuEngineeringService } from './catalog/menu-engineering';
export type { MenuItemCategory, IMenuEngineeringItem, IMenuEngineeringReport } from './catalog/menu-engineering';

export { EmailCampaign } from './acquisition/marketing/components/crm/EmailCampaign';
export { BasketAnalysis } from './acquisition/marketing/components/crm/BasketAnalysis';
export { VisitHistory } from './acquisition/marketing/components/crm/VisitHistory';
export { RFMSegmentation } from './acquisition/marketing/components/crm/RFMSegmentation';
export { EmailAutomations } from './acquisition/marketing/components/crm/EmailAutomations';
export { useReservationsPage } from './relation/reservations/hooks';
export { DailyListView } from './relation/reservations/components/DailyListView';
export { WeeklyView } from './relation/reservations/components/WeeklyView';
export { MarketingSyncService } from './acquisition/marketing/marketing.sync';
export { LoyaltyCard } from './acquisition/marketing/components/crm/LoyaltyCard';
export { ExpertHub } from './acquisition/marketing/components/agency/ExpertHub';
export { ReservationCapacitySection } from './relation/reservations/components/settings/ReservationCapacitySection';
export { ReservationVerificationSection } from './relation/reservations/components/settings/ReservationVerificationSection';
export { ReservationCardImprintSection } from './relation/reservations/components/settings/ReservationCardImprintSection';
export { ReservationNotificationSection } from './relation/reservations/components/settings/ReservationNotificationSection';
export { default as EmbedSnippets } from './fidelite/widgets/EmbedSnippets';
export { default as ROICalculator } from './fidelite/widgets/ROICalculator';
export { default as OnlineBookingToggle } from './fidelite/widgets/OnlineBookingToggle';
export { registerCRMVipHandler } from './acquisition/marketing/handlers/CRMVipHandler';
