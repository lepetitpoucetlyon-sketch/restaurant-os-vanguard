// Domaine : qualite (HACCP, IoT, recall, donation, calendar)
export * from '@/modules/compliance/qualite/haccp/types';
export * from './types/quality';
export * from '@/modules/compliance/qualite/haccp/store/complianceAtoms';
export * from '@/modules/compliance/qualite/haccp/store/qualityAtoms';
export { useGuard, useHygieneLabels, useHygieneLogs, useReceptionLogs, useOilLogs, useMaintenance } from '@/modules/compliance/qualite/haccp/hooks/useGuard';
export { useQuality } from '@/modules/compliance/qualite/haccp/hooks/useQuality';
export { useHACCP } from '@/modules/compliance/qualite/haccp/hooks/useHACCP';
export { useComplianceMapper } from '@/modules/compliance/qualite/haccp/hooks/useComplianceMapper';
export { RecallService } from '@/modules/compliance/qualite/recall/RecallService';
export { FoodDonationService } from '@/modules/compliance/qualite/donation/FoodDonationService';
export { ComplianceCalendar } from '@/modules/compliance/qualite/calendar/ComplianceCalendar';
export { IoTSensorService } from '@/modules/compliance/qualite/haccp/iot';

// Domaine : securite (audit)
// Deleted AuditService

// Domaine : reglementaire (RGPD)
// Deleted ErasureService

// Infrastructure pilier (connectors, services, types)
export type { PiiRecord } from '@/domain/schemas/pii';
export { IoTProviderFactory } from './connectors/iot';
export * from './services';

export { useHaccpPage } from '@/modules/compliance/qualite/haccp/hooks';
export { HACCP_TOOLS } from '@/modules/compliance/qualite/haccp/hooks';
export { CleaningPlan } from '@/modules/compliance/qualite/haccp/components/CleaningPlan';
export { DLCTracker } from '@/modules/compliance/qualite/haccp/components/DLCTracker';
export { NonConformityForm } from '@/modules/compliance/qualite/haccp/components/NonConformityForm';
export { HACCPSyncService } from '@/modules/compliance/qualite/haccp/haccp.sync';
export { PlanMaitriseSanitaire } from '@/modules/compliance/qualite/haccp/services/PlanMaitriseSanitaire';
export { qualityActiveControlAtom } from '@/modules/compliance/qualite/haccp/store/qualityAtoms';
export { wasteLogsNodeAtom } from '@/modules/compliance/qualite/haccp/store';
export { HACCPLogService } from '@/modules/compliance/qualite/haccp/HACCPLogService';
export { registerWasteToFoodCostHandler } from '@/modules/compliance/qualite/haccp/handlers/WasteToFoodCostHandler';
export { useRegistre, RegistreProvider } from '@/modules/compliance/qualite/haccp/contexts/RegistreContext';

