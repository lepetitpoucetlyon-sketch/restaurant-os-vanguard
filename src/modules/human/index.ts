// Domaine : effectifs (HR, recruitment, planning, staff)
export * from './effectifs/hr';
export { useHumanResources } from './effectifs/hr/hooks/useHumanResources';
export { useRecruitment } from './effectifs/hr/hooks/useRecruitment';
export { useStaffAudit } from './effectifs/hr/hooks/useStaffAudit';
export { RecruitmentDashboard } from './effectifs/hr/components/RecruitmentDashboard';
export { TimeclockDashboard } from './effectifs/hr/components/TimeclockDashboard';
export { PlanningDashboard } from './effectifs/hr/components/PlanningDashboard';
export { LeaveBalanceCard, LeaveRequestCard, NewRequestModal, TeamCalendar } from './effectifs/hr/components/leaves';

// Domaine : remuneration (payroll, DSN, paie)
export * from './remuneration/payroll';
export { PayrollConnectorFactory } from './connectors/payroll/PayrollConnectorFactory';
export type { ClockEventType, ClockEntry, ITimeclockProvider } from './connectors/timeclock/types';
export { NexusStaffingOracle } from './services/NexusStaffingOracle';
export { TipDistributionService } from './effectifs/hr/services/tipDistribution';
export { TipsDistributionEngine, DEFAULT_TIPS_SETTINGS, type TipsDistributionSettings, type TipDistributionMethod } from './remuneration/services/TipsDistributionEngine';
export { LaborCostAnalyzer } from './effectifs/hr/services/LaborCostAnalyzer';
export { LaborCostService } from './effectifs/hr/services/laborCost';
export { PrepaieBuilder } from './remuneration/payroll/PrepaieBuilder';
export { DigitalEmployeeVault, type VaultArchiveManifest } from './services/DigitalEmployeeVault';

export { useStaffPage } from './effectifs/hr/hooks';
export { RecruitmentBoard } from './effectifs/hr/components/RecruitmentBoard';
export { QuickAddStaffModal } from './effectifs/hr/components/QuickAddStaffModal';
export { HRSyncService } from './effectifs/hr/hr.sync';
export type { PayrollPeriodSummary } from './remuneration/payroll/types';
export { MergePayrollClient } from './remuneration/payroll';
export { SilaeClient } from './remuneration/payroll';
export type { PayrollProviderConfig } from './remuneration/payroll/types';
export { PROVIDER_CATALOG } from './connectors/payroll/catalog';
export type { ProviderCatalogEntry } from './connectors/payroll/catalog';
export { DSNBuilder } from './remuneration/payroll/DSNBuilder';

// 🏛️ Handlers (enregistrement bus événementiel)
export { registerRainStaffingHandler } from './effectifs/hr/handlers/RainStaffingHandler';

// 🏛️ Staff Atoms & Store
export * from './effectifs/hr/store/staffAtoms';

// 🏛️ Staff & Planning UI Components
export * from './effectifs/hr/components/staff';
export * from './effectifs/hr/components/planning';

// 🏛️ Domaine Schemas & Types
export * from './domain/schemas/hr';
export * from './domain/schemas/users';
export * from './domain/schemas/rbac';
export * from './domain/schemas/employeeDocument';
export type { LeaveBalance, ShiftLog, LeaveRequest, Shift, ShiftStats, PayrollCalculation } from './effectifs/hr/types';
export type { ShiftEntry } from './domain/schemas/hr';
