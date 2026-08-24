// Hooks souverains (ADR-012 Phase 4)
export * from './hooks';

// Domaine : acquisition (marketing, SEO, landing, onboarding)
export * from './acquisition/marketing';
export { MarketingService } from './acquisition/marketing/services/MarketingService';
export { MenuJsonLd } from './acquisition/seo';
export { PromoCodeManager } from './acquisition/marketing/components/crm/PromoCodeManager';
export type { PromoCodeRecord } from './acquisition/marketing/components/crm/PromoCodeManager';
export * from './acquisition/onboarding';
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
export { AggregatorMappingService } from './relation/delivery/services/AggregatorMappingService';
export { ProcessGoogleBookingUseCase } from './relation/reservations/application/use-cases/ProcessGoogleBooking';
export { InMemoryReservationRepository } from './relation/reservations/infrastructure/repositories/InMemoryReservationRepository';
export * from './relation/reservations/domain/types/GoogleReserveTypes';
export { FranchiseService } from './relation/franchise/services/FranchiseService';

// Infrastructure pilier (connectors, ui)
export { ReviewProviderFactory } from './connectors/reviews';
export { DeliveryWebhookBridge, type DeliveryProvider, type ExternalDeliveryPayload } from './connectors/delivery/DeliveryWebhookBridge';

export { menuEngineeringService } from './catalog/menu-engineering';
export type { MenuItemCategory, IMenuEngineeringItem, IMenuEngineeringReport } from './catalog/menu-engineering';

export { LandingDashboard } from './acquisition/landing/components/LandingDashboard';
export { OnboardingWizard } from './acquisition/onboarding/wizard';
export { ReservationWidget } from './fidelite/widgets';
export { ProspectingDashboard } from './relation/crm/components/ProspectingDashboard';
export { DailyListView } from './relation/reservations/components/DailyListView';
export { WeeklyView } from './relation/reservations/components/WeeklyView';
export { GroupFormModal } from './relation/reservations/components/GroupFormModal';
export { EventQuoteModal } from './relation/reservations/components/EventQuoteModal';
export { ReservationCreateDialog } from './relation/reservations/components/ReservationCreateDialog';
export { ReservationSidebar } from './relation/reservations/components/ReservationSidebar';
export { ReservationsHeader } from './relation/reservations/components/ReservationsHeader';
export { TableGrid } from './relation/reservations/components/TableGrid';
export { CustomerCustomerView, CustomerDetailPanel, NewCustomerDialog } from './relation/customers/components';
export { useReservationsPage } from './relation/reservations/hooks';
export { ReservationCapacitySection } from './relation/reservations/components/settings/ReservationCapacitySection';
export { ReservationVerificationSection } from './relation/reservations/components/settings/ReservationVerificationSection';
export { ReservationCardImprintSection } from './relation/reservations/components/settings/ReservationCardImprintSection';
export { ReservationNotificationSection } from './relation/reservations/components/settings/ReservationNotificationSection';
export { NewCampaignModal } from './acquisition/marketing/components/marketing/NewCampaignModal';
export { ExpertHub } from './acquisition/marketing/components/agency/ExpertHub';
export { SEOManager } from './acquisition/marketing/services/SEOManager';
export { OverviewTab, PagesTab, AnalyticsTab, SettingsTab } from './acquisition/marketing/components/seo/tabs';
export { CRMSidebar, CRMList, CRMDetailView } from './acquisition/marketing/components/crm';
export { EmailCampaign } from './acquisition/marketing/components/crm/EmailCampaign';
export { BasketAnalysis } from './acquisition/marketing/components/crm/BasketAnalysis';
export { VisitHistory } from './acquisition/marketing/components/crm/VisitHistory';
export { RFMSegmentation } from './acquisition/marketing/components/crm/RFMSegmentation';
export { EmailAutomations } from './acquisition/marketing/components/crm/EmailAutomations';
export { PinModal } from './ui/pos/PinModal';
export { CustomerImportPanel } from './acquisition/onboarding/migration/CustomerImportPanel';
export { FECImportPanel } from './acquisition/onboarding/migration/FECImportPanel';
export { ReservationHistoryImportPanel } from './acquisition/onboarding/migration/ReservationHistoryImportPanel';

export { MarketingSyncService } from './acquisition/marketing/marketing.sync';
export { registerCRMVipHandler } from './acquisition/marketing/handlers/CRMVipHandler';

// 🏛️ Domaine Schemas & Types
export * from './domain/schemas/commerce';
export * from './domain/types/brands';
export * from './domain/schemas/giftcard';
export * from './domain/schemas/customerAccount';
export * from './domain/schemas/loyalty';

// P0 dé-stubbing (2026-08-22) : DigitalDnaCrawlerService supprimé (stub keyword-matching).
// Remplacé par CompanyScrapeAgent (scrape RÉEL, SSRF-guard, JSON-LD parser).
export {
    scrapeCompany,
    CompanyScrapeAgent,
} from './acquisition/onboarding/services/CompanyScrapeAgent';
export type {
    CompanyProfile,
    ExtractedProductItem,
    CompanyIdentity,
    CompanyBranding,
    SectorSignals,
} from './acquisition/onboarding/schemas/companyProfile';
export { emptyCompanyProfile } from './acquisition/onboarding/schemas/companyProfile';

