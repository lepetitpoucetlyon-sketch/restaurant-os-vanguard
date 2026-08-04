// Domaine : effectifs (HR, recruitment, planning, staff)
export * from '@/verticals/restaurant/human/staffing/hr';
export { useHumanResources } from '@/verticals/restaurant/human/staffing/hr/hooks/useHumanResources';
export { useRecruitment } from '@/verticals/restaurant/human/staffing/hr/hooks/useRecruitment';
export { useStaffAudit } from '@/verticals/restaurant/human/staffing/hr/hooks/useStaffAudit';
export { RecruitmentDashboard } from '@/verticals/restaurant/human/staffing/hr/components/RecruitmentDashboard';
export { TimeclockDashboard } from '@/verticals/restaurant/human/staffing/hr/components/TimeclockDashboard';
export { PlanningDashboard } from '@/verticals/restaurant/human/staffing/hr/components/PlanningDashboard';

// Domaine : remuneration (payroll, DSN, paie)
// Deleted payroll references as they were obliterated
export { PayrollConnectorFactory } from './connectors/payroll/PayrollConnectorFactory';
export type { ClockEventType, ClockEntry, ITimeclockProvider } from './connectors/timeclock/types';
export { NexusStaffingOracle } from './services/NexusStaffingOracle';
export { TipDistributionService } from '@/verticals/restaurant/human/staffing/hr/services/tipDistribution';
export { LaborCostAnalyzer } from '@/verticals/restaurant/human/staffing/hr/services/LaborCostAnalyzer';
export { LaborCostService } from '@/verticals/restaurant/human/staffing/hr/services/laborCost';


export { useStaffPage } from '@/verticals/restaurant/human/staffing/hr/hooks';
export { RecruitmentBoard } from '@/verticals/restaurant/human/staffing/hr/components/RecruitmentBoard';
export { QuickAddStaffModal } from '@/verticals/restaurant/human/staffing/hr/components/QuickAddStaffModal';
export { HRSyncService } from '@/verticals/restaurant/human/staffing/hr/hr.sync';
export { PROVIDER_CATALOG } from './connectors/payroll/catalog';
export type { ProviderCatalogEntry } from './connectors/payroll/catalog';
export { registerRainStaffingHandler } from '@/verticals/restaurant/human/staffing/hr/handlers/RainStaffingHandler';

