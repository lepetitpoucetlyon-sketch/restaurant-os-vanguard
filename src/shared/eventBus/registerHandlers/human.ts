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

export function registerHumanHandlers(): Array<() => void> {
  return [
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
  ];
}
