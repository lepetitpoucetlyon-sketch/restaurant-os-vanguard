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

// Domaine : securite (audit)
export { AuditService, auditService } from './securite/audit/AuditService';
export { AuditLogger } from './securite/AuditLogger';
export { ImmunityAuditLogger } from './securite/ImmunityAuditLogger';
export { DocumentVault } from './securite/DocumentVault';
export { ElevationPrompt } from './securite/audit/ElevationPrompt';
export { OverrideLogView } from './securite/audit/OverrideLogView';
// Domaine : reglementaire (RGPD)
export { ErasureService } from './reglementaire/rgpd/ErasureService';
export { RgpdRegisterService } from './reglementaire/rgpd/RgpdRegisterService';

// Infrastructure pilier (connectors, services, types)
export type { PiiRecord } from './domain/schemas/pii';
export { IoTProviderFactory } from './connectors/iot';
export * from './services';

export { useHaccpPage } from './qualite/haccp/hooks';
export { HACCP_TOOLS } from './qualite/haccp/hooks';
export { CleaningPlan } from './qualite/haccp/components/CleaningPlan';
export { DLCTracker } from './qualite/haccp/components/DLCTracker';
export { NonConformityForm } from './qualite/haccp/components/NonConformityForm';
export { HACCPSyncService } from './qualite/haccp/haccp.sync';
export { HACCPTelemetryBridge } from './qualite/haccp/services/HACCPTelemetryBridge';
export { PlanMaitriseSanitaire } from './qualite/haccp/services/PlanMaitriseSanitaire';
export { qualityActiveControlAtom } from './qualite/haccp/store/qualityAtoms';
export { wasteLogsNodeAtom, wasteLogsAtom } from './qualite/haccp/store';
export { HACCPLogService } from './qualite/haccp/HACCPLogService';
export { policyEngine } from './services';
export { useRegistre, RegistreProvider } from './qualite/haccp/contexts/RegistreContext';

// 🏛️ Domaine Schemas
// haccp: ReceptionSchema, OilCheckSchema, SensorReadingSchema (Zod — version autoritaire)
// SensorReading collision : qualite/haccp/types/domain.ts a son propre SensorReading interface
// → on prend la version Zod de domain/schemas/haccp
export * from './domain/schemas/haccp';
export * from './domain/schemas/compliance.schemas';
export * from './domain/schemas/foodDonation';
export * from './domain/schemas/audit';
export * from './domain/schemas/pii';
export * from './domain/schemas/policy';
export * from './domain/schemas/quality';
// Disambiguation SensorReading : version Zod (domain/schemas/haccp) prend la précédence
export type { SensorReading, IoTSensor, SensorTransport } from './domain/schemas/haccp';
