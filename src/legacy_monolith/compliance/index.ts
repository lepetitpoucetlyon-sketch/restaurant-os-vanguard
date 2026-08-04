// Domaine : qualite (HACCP, IoT, recall, donation, calendar)
export * from '@/verticals/restaurant/compliance/haccp/types';
export * from './types/quality';
export * from '@/verticals/restaurant/compliance/haccp/store/complianceAtoms';
export * from '@/verticals/restaurant/compliance/haccp/store/qualityAtoms';
export { useGuard, useHygieneLabels, useHygieneLogs, useReceptionLogs, useOilLogs, useMaintenance } from '@/verticals/restaurant/compliance/haccp/hooks/useGuard';
export { useQuality } from '@/verticals/restaurant/compliance/haccp/hooks/useQuality';
export { useHACCP } from '@/verticals/restaurant/compliance/haccp/hooks/useHACCP';
export { useComplianceMapper } from '@/verticals/restaurant/compliance/haccp/hooks/useComplianceMapper';
export { RecallService } from '@/verticals/restaurant/compliance/haccp/recall/RecallService';
export { FoodDonationService } from '@/verticals/restaurant/compliance/haccp/donation/FoodDonationService';
export { ComplianceCalendar } from '@/verticals/restaurant/compliance/haccp/calendar/ComplianceCalendar';
export { IoTSensorService } from '@/verticals/restaurant/compliance/haccp/iot';

// Domaine : securite (audit)
// Deleted AuditService

// Domaine : reglementaire (RGPD)
// Deleted ErasureService

// Infrastructure pilier (connectors, services, types)
export type { PiiRecord } from '@/domain/schemas/pii';
export { IoTProviderFactory } from './connectors/iot';
export * from './services';

export { useHaccpPage } from '@/verticals/restaurant/compliance/haccp/hooks';
export { HACCP_TOOLS } from '@/verticals/restaurant/compliance/haccp/hooks';
export { CleaningPlan } from '@/verticals/restaurant/compliance/haccp/components/CleaningPlan';
export { DLCTracker } from '@/verticals/restaurant/compliance/haccp/components/DLCTracker';
export { NonConformityForm } from '@/verticals/restaurant/compliance/haccp/components/NonConformityForm';
export { HACCPSyncService } from '@/verticals/restaurant/compliance/haccp/haccp.sync';
export { PlanMaitriseSanitaire } from '@/verticals/restaurant/compliance/haccp/services/PlanMaitriseSanitaire';
export { qualityActiveControlAtom } from '@/verticals/restaurant/compliance/haccp/store/qualityAtoms';
export { wasteLogsNodeAtom } from '@/verticals/restaurant/compliance/haccp/store';
export { HACCPLogService } from '@/verticals/restaurant/compliance/haccp/HACCPLogService';
export { registerWasteToFoodCostHandler } from '@/verticals/restaurant/compliance/haccp/handlers/WasteToFoodCostHandler';
export { useRegistre, RegistreProvider } from '@/verticals/restaurant/compliance/haccp/contexts/RegistreContext';

