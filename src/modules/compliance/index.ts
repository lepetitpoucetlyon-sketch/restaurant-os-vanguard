// Domaine : qualite (HACCP, IoT, recall, donation, calendar)
export * from './qualite/haccp/types';
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
export { AuditService } from './securite/audit/AuditService';

// Domaine : reglementaire (RGPD)
export { ErasureService } from './reglementaire/rgpd/ErasureService';

// Infrastructure pilier (connectors, services, types)
export type { PiiRecord } from '@/domain/schemas/pii';
export { IoTProviderFactory } from './connectors/iot';
