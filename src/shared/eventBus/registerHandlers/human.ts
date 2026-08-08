import { registerPayrollTimeclockHandler } from '../handlers/PayrollTimeclockHandler';
import { registerRainStaffingHandler } from '@/modules/human';
import { registerLaborCostAnalyzerHandler } from '../handlers/LaborCostAnalyzerHandler';
import { registerScheduleNotifierHandler } from '../handlers/ScheduleNotifierHandler';
import { registerOvertimeAlertHandler } from '../handlers/OvertimeAlertHandler';
import { registerOvertimeJournalHandler } from '../handlers/OvertimeJournalHandler';
import { registerPayrollComplianceHandler } from '../handlers/PayrollComplianceHandler';
import { PayrollAutoCalcHandler } from '../handlers/PayrollAutoCalcHandler';
import { AbsenceUnderstaffingHandler } from '../handlers/AbsenceUnderstaffingHandler';
import { PayrollExportHandler } from '../handlers/PayrollExportHandler';
import { ContractRenewalAlertHandler } from '../handlers/ContractRenewalAlertHandler';
import { MedicalVisitAlertHandler } from '../handlers/MedicalVisitAlertHandler';
import { RecruitmentRouterHandler } from '../handlers/RecruitmentRouterHandler';
import { SilaeExportHandler } from '../handlers/SilaeExportHandler';
import { registerTipDistributedHandler } from '../handlers/TipDistributedHandler';
import { registerShiftAutoAuditHandler } from '../handlers/ShiftAutoAuditHandler';
import { registerHRBreakCheckHandler } from '../handlers/HRBreakCheckHandler';
import { registerShiftStartedHandler } from '../handlers/ShiftStartedHandler';

export function registerHumanHandlers(): Array<() => void> {
  return [
    registerShiftStartedHandler(),
    registerTipDistributedHandler(),
    registerPayrollTimeclockHandler(),
    registerRainStaffingHandler(),
    registerLaborCostAnalyzerHandler(),
    registerScheduleNotifierHandler(),
    registerOvertimeAlertHandler(),
    registerOvertimeJournalHandler(),
    registerPayrollComplianceHandler(),
    PayrollAutoCalcHandler.register(),
    AbsenceUnderstaffingHandler.register(),
    PayrollExportHandler.register(),
    ContractRenewalAlertHandler.register(),
    MedicalVisitAlertHandler.register(),
    RecruitmentRouterHandler.register(),
    SilaeExportHandler.register(),
    // ── I5 : Clôture Z → audit pointages oubliés ─────────────────────────
    registerShiftAutoAuditHandler(),
    // ── HR 6.3 : pause légale HCR ────────────────────────────────────────
    registerHRBreakCheckHandler(),
  ];
}
