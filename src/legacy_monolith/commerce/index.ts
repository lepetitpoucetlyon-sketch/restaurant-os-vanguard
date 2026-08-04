/* eslint-disable no-restricted-imports */
 
// Domaine : acquisition (marketing, SEO, landing)
export * from '@/verticals/restaurant/commerce/acquisition/marketing';
export { LandingDashboard } from '@/verticals/restaurant/commerce/acquisition/landing/components/LandingDashboard';
export { MenuJsonLd } from '@/verticals/restaurant/commerce/acquisition/seo';
export { PromoCodeManager } from '@/verticals/restaurant/commerce/acquisition/marketing/components/crm/PromoCodeManager';
export type { PromoCodeRecord } from '@/verticals/restaurant/commerce/acquisition/marketing/components/crm/PromoCodeManager';

// Domaine : relation (reservations, CRM, customers, delivery)
export * from '@/shared/nexus/engines/CRM/reservations';
export * from '@/shared/nexus/engines/CRM/customers/components';
export { ProspectingDashboard } from '@/shared/nexus/engines/CRM/crm/components/ProspectingDashboard';
export { AggregatorMappingService } from '@/shared/nexus/engines/CRM/delivery/services/AggregatorMappingService';
export { GroupFormModal } from '@/shared/nexus/engines/CRM/reservations/components/GroupFormModal';
export type { GroupFormData } from '@/shared/nexus/engines/CRM/reservations/components/GroupFormModal';
// Ré-export depuis la source (commerceHooks) et non le barrel NexusOpsProvider :
// passer par le Provider crée un cycle SSR commerce → Provider → NexusSyncService → commerce
 
export { useReservations, useCRM } from '@/modules/ops';

// Domaine : fidélité (loyalty, quotes, widgets)
export { ReservationWidget } from '@/verticals/restaurant/relation/loyalty/widgets';

// Infrastructure pilier (connectors, ui)
export { ReviewProviderFactory } from './connectors/reviews';
 
export { CustomerImportPanel } from '@/modules/onboarding/migration';

export { EmailCampaign } from '@/verticals/restaurant/commerce/acquisition/marketing/components/crm/EmailCampaign';
export { BasketAnalysis } from '@/verticals/restaurant/commerce/acquisition/marketing/components/crm/BasketAnalysis';
export { VisitHistory } from '@/verticals/restaurant/commerce/acquisition/marketing/components/crm/VisitHistory';
export { RFMSegmentation } from '@/verticals/restaurant/commerce/acquisition/marketing/components/crm/RFMSegmentation';
export { EmailAutomations } from '@/verticals/restaurant/commerce/acquisition/marketing/components/crm/EmailAutomations';
export { useReservationsPage } from '@/shared/nexus/engines/CRM/reservations/hooks';
export { DailyListView } from '@/shared/nexus/engines/CRM/reservations/components/DailyListView';
export { WeeklyView } from '@/shared/nexus/engines/CRM/reservations/components/WeeklyView';
export { MarketingSyncService } from '@/verticals/restaurant/commerce/acquisition/marketing/marketing.sync';
export { LoyaltyCard } from '@/verticals/restaurant/commerce/acquisition/marketing/components/crm/LoyaltyCard';
export { ExpertHub } from '@/verticals/restaurant/commerce/acquisition/marketing/components/agency/ExpertHub';
export { ReservationCapacitySection } from '@/shared/nexus/engines/CRM/reservations/components/settings/ReservationCapacitySection';
export { ReservationVerificationSection } from '@/shared/nexus/engines/CRM/reservations/components/settings/ReservationVerificationSection';
export { ReservationCardImprintSection } from '@/shared/nexus/engines/CRM/reservations/components/settings/ReservationCardImprintSection';
export { ReservationNotificationSection } from '@/shared/nexus/engines/CRM/reservations/components/settings/ReservationNotificationSection';
export { default as EmbedSnippets } from '@/verticals/restaurant/relation/loyalty/widgets/EmbedSnippets';
export { default as ROICalculator } from '@/verticals/restaurant/relation/loyalty/widgets/ROICalculator';
export { default as OnlineBookingToggle } from '@/verticals/restaurant/relation/loyalty/widgets/OnlineBookingToggle';
export { registerCRMVipHandler } from '@/verticals/restaurant/commerce/acquisition/marketing/handlers/CRMVipHandler';
