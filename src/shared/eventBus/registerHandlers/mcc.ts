import { registerMccHealthPingHandler } from '../handlers/MccHealthPingHandler';
import { registerMccFiscalAuditHandler } from '../handlers/MccFiscalAuditHandler';

export function registerMccHandlers(): (() => void)[] {
  return [
    registerMccHealthPingHandler(),
    registerMccFiscalAuditHandler(),
  ];
}
