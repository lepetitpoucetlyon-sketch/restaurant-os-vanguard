// Domaine : qualite (HACCP, IoT, recall, donation, calendar)
export * from './qualite/haccp/types';
export * from './types/quality';
export * from './qualite/haccp/store/complianceAtoms';
export * from './qualite/haccp/store/qualityAtoms';
export { useGuard, useHygieneLabels, useHygieneLogs, useReceptionLogs, useOilLogs, useMaintenance } from './qualite/haccp/hooks/useGuard';
export { useQuality } from './qualite/haccp/hooks/useQuality';
export { useHACCP } from './qualite/haccp/hooks/useHACCP';
export { useComplianceMapper } from './qualite/haccp/hooks/useComplianceMapper';
export { RecallService } from './qualite/recall/RecallService';
export { FoodDonationService } from './qualite/donation/FoodDonationService';
export { ComplianceCalendar } from './qualite/calendar/ComplianceCalendar';
export { IoTSensorService } from './qualite/haccp/iot';
export { HACCPTelemetryBridge } from './qualite/haccp/services/HACCPTelemetryBridge';

// Domaine : securite (audit, vault, immunity)
export { AuditService, auditService } from './securite/audit/AuditService';
export { ElevationPrompt } from './securite/audit/ElevationPrompt';
export { OverrideLogView } from './securite/audit/OverrideLogView';
export { DocumentVault } from './securite/DocumentVault';
export { AuditLogger } from './securite/AuditLogger';
export { ImmunityAuditLogger } from './securite/ImmunityAuditLogger';

// Domaine : reglementaire (RGPD, Contrats Légaux & Signatures)
export { ErasureService } from './reglementaire/rgpd/ErasureService';
export * from './legal';

// Infrastructure pilier (connectors, services, types)
export type { PiiRecord, PiiFields } from './domain/schemas/pii';
export { IoTProviderFactory } from './connectors/iot';
export * from './services';

export * from './qualite/haccp/components';
export * from './qualite/haccp/components/haccp';
export * from './qualite/haccp/components/quality';
export { useHaccpPage } from './qualite/haccp/hooks';
export { HACCP_TOOLS } from './qualite/haccp/hooks';
export { CleaningPlan } from './qualite/haccp/components/CleaningPlan';
export { DLCTracker } from './qualite/haccp/components/DLCTracker';
export { NonConformityForm } from './qualite/haccp/components/NonConformityForm';
export { HACCPSyncService } from './qualite/haccp/haccp.sync';
export { PlanMaitriseSanitaire } from './qualite/haccp/services/PlanMaitriseSanitaire';
export { qualityActiveControlAtom } from './qualite/haccp/store/qualityAtoms';
export { wasteLogsNodeAtom } from './qualite/haccp/store';
export { HACCPLogService } from './qualite/haccp/HACCPLogService';
export { registerWasteToFoodCostHandler } from './qualite/haccp/handlers/WasteToFoodCostHandler';
export { policyEngine } from './services';
export { useRegistre, RegistreProvider } from './qualite/haccp/contexts/RegistreContext';

// 🏛️ Domaine Schemas
export * from './domain/schemas/haccp';
export * from './domain/schemas/compliance.schemas';
export * from './domain/schemas/foodDonation';
export * from './domain/schemas/audit';
export * from './domain/schemas/pii';
export * from './domain/schemas/policy';
export * from './domain/schemas/quality';
export * from './domain/schemas/rbac';
export * from './domain/schemas/license';
export type { SensorReading } from './qualite/haccp/types';
export type { IoTSensor, SensorTransport, IoTSensorReading } from './domain/schemas/haccp';
