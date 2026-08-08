import { registerMccHealthPingHandler } from '../handlers/MccHealthPingHandler';
import { registerMccFiscalAuditHandler } from '../handlers/MccFiscalAuditHandler';
import { registerDLQQuarantineAlertHandler } from '../handlers/DLQQuarantineAlertHandler';

export function registerMccHandlers(): (() => void)[] {
  return [
    registerMccHealthPingHandler(),
    registerMccFiscalAuditHandler(),
    registerDLQQuarantineAlertHandler(),
  ];
}
