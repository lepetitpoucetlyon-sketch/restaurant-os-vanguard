import { registerShiftStartedHandler } from '../handlers/ShiftStartedHandler';
import { registerPayrollTimeclockHandler } from '../handlers/PayrollTimeclockHandler';
import { registerRainStaffingHandler } from '@/modules/human';
import { registerScheduleNotifierHandler } from '../handlers/ScheduleNotifierHandler';
import { registerLaborCostAnalyzerHandler } from '../handlers/LaborCostAnalyzerHandler';
import { registerShiftAutoAuditHandler } from '../handlers/ShiftAutoAuditHandler';
import { registerHRBreakCheckHandler } from '../handlers/HRBreakCheckHandler';
import { AbsenceUnderstaffingHandler } from '../handlers/AbsenceUnderstaffingHandler';

export function registerHumanShiftHandlers(): Array<() => void> {
  return [
    registerShiftStartedHandler(),
    registerPayrollTimeclockHandler(),
    registerRainStaffingHandler(),
    registerLaborCostAnalyzerHandler(),
    registerScheduleNotifierHandler(),
    AbsenceUnderstaffingHandler.register(),
    registerShiftAutoAuditHandler(),
    registerHRBreakCheckHandler(),
  ];
}
