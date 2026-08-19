import { registerHumanShiftHandlers } from './human-shifts';
import { registerHumanPayrollHandlers } from './human-payroll';

export function registerHumanHandlers(): Array<() => void> {
  return [
    ...registerHumanShiftHandlers(),
    ...registerHumanPayrollHandlers(),
  ];
}
