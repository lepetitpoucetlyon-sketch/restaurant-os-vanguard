// Domaine : acquisition (marketing, SEO, landing, onboarding)
export * from './acquisition/marketing';
export { LandingDashboard } from './acquisition/landing/components/LandingDashboard';
export { MenuJsonLd } from './acquisition/seo';
export { PromoCodeManager } from './acquisition/marketing/components/crm/PromoCodeManager';
export type { PromoCodeRecord } from './acquisition/marketing/components/crm/PromoCodeManager';
export * from './acquisition/onboarding';
export { OnboardingWizard } from './acquisition/onboarding/wizard';
export { RestaurantOnboardingMasterService } from './acquisition/onboarding/services/RestaurantOnboardingMasterService';
export type { OnboardingAuditSummary, OnboardingPillarStep } from './acquisition/onboarding/services/RestaurantOnboardingMasterService';
export { ImportSnapshotService } from './acquisition/onboarding/migration/ImportSnapshotService';
export { ConnectorRegistry } from './acquisition/onboarding/migration/connectors';
export { runImporter } from './acquisition/onboarding/migration/importers';
export { parseImageWithOCR } from './acquisition/onboarding/migration/parsers/imageParser';
export { parsePDFWithOCR } from './acquisition/onboarding/migration/parsers/pdfParser';
export type { ConnectorId, ConnectorCredentials } from './acquisition/onboarding/migration/connectors/types';
export type { ImportCategory } from './acquisition/onboarding/migration/types';

// Domaine : relation (reservations, CRM, customers, delivery)
export * from './relation/reservations';
export * from './relation/customers/components';
export { ProspectingDashboard } from './relation/crm/components/ProspectingDashboard';
export { AggregatorMappingService } from './relation/delivery/services/AggregatorMappingService';
export { GroupFormModal } from './relation/reservations/components/GroupFormModal';
export type { GroupFormData } from './relation/reservations/components/GroupFormModal';
export { ProcessGoogleBookingUseCase } from './relation/reservations/application/use-cases/ProcessGoogleBooking';
export { InMemoryReservationRepository } from './relation/reservations/infrastructure/repositories/InMemoryReservationRepository';
export * from './relation/reservations/domain/types/GoogleReserveTypes';
export { FranchiseDashboard } from './relation/franchise/components/FranchiseDashboard';
export { FranchiseService } from './relation/franchise/services/FranchiseService';

export { useReservations, useCRM } from '@/modules/ops';

// Domaine : fidélité (loyalty, quotes, widgets)
export { ReservationWidget } from './fidelite/widgets';

// Infrastructure pilier (connectors, ui)
export { ReviewProviderFactory } from './connectors/reviews';
export { DeliveryWebhookBridge, type DeliveryProvider, type ExternalDeliveryPayload } from './connectors/delivery/DeliveryWebhookBridge';
export { CustomerImportPanel } from './acquisition/onboarding/migration';

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

// 🏛️ Domaine Schemas & Types
export * from './domain/schemas/commerce';
export * from './domain/types/brands';
export * from './domain/schemas/giftcard';
export * from './domain/schemas/customerAccount';
export * from './domain/schemas/loyalty';
