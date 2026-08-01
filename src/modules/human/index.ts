// Domaine : effectifs (HR, recruitment, planning, staff)
export * from './effectifs/hr';
export { useHumanResources } from './effectifs/hr/hooks/useHumanResources';
export { useRecruitment } from './effectifs/hr/hooks/useRecruitment';
export { useStaffAudit } from './effectifs/hr/hooks/useStaffAudit';
export { RecruitmentDashboard } from './effectifs/hr/components/RecruitmentDashboard';
export { TimeclockDashboard } from './effectifs/hr/components/TimeclockDashboard';
export { PlanningDashboard } from './effectifs/hr/components/PlanningDashboard';

// Domaine : remuneration (payroll, DSN, paie)
export * from './remuneration/payroll';
