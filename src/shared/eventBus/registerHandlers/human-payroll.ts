import { registerTipDistributedHandler } from '../handlers/TipDistributedHandler';
import { registerOvertimeAlertHandler } from '../handlers/OvertimeAlertHandler';
import { registerOvertimeJournalHandler } from '../handlers/OvertimeJournalHandler';
import { registerPayrollComplianceHandler } from '../handlers/PayrollComplianceHandler';
import { PayrollAutoCalcHandler } from '../handlers/PayrollAutoCalcHandler';
import { PayrollExportHandler } from '../handlers/PayrollExportHandler';
import { ContractRenewalAlertHandler } from '../handlers/ContractRenewalAlertHandler';
import { MedicalVisitAlertHandler } from '../handlers/MedicalVisitAlertHandler';
import { RecruitmentRouterHandler } from '../handlers/RecruitmentRouterHandler';
import { SilaeExportHandler } from '../handlers/SilaeExportHandler';

export function registerHumanPayrollHandlers(): Array<() => void> {
  return [
    registerTipDistributedHandler(),
    registerOvertimeAlertHandler(),
    registerOvertimeJournalHandler(),
    registerPayrollComplianceHandler(),
    PayrollAutoCalcHandler.register(),
    PayrollExportHandler.register(),
    ContractRenewalAlertHandler.register(),
    MedicalVisitAlertHandler.register(),
    RecruitmentRouterHandler.register(),
    SilaeExportHandler.register(),
  ];
}
