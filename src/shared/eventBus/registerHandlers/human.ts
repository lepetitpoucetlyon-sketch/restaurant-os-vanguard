import { registerHumanPayrollHandlers } from "./human-payroll";
import { registerHumanShiftHandlers } from "./human-shifts";
import { registerHumanLegalHandlers } from "./human-legal";

export function registerHumanHandlers(): Array<() => void> {
  return [
    ...registerHumanPayrollHandlers(),
    ...registerHumanShiftHandlers(),
    ...registerHumanLegalHandlers(),
  ];
}
