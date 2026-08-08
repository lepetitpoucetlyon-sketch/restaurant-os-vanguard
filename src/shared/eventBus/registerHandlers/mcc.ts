import { registerMccHealthPingHandler } from '../handlers/MccHealthPingHandler';
import { registerMccFiscalAuditHandler } from '../handlers/MccFiscalAuditHandler';
import { registerDLQQuarantineAlertHandler } from '../handlers/DLQQuarantineAlertHandler';
import { registerCryptoIntegrityHandler } from '../handlers/CryptoIntegrityHandler';

export function registerMccHandlers(): (() => void)[] {
  return [
    registerMccHealthPingHandler(),
    registerMccFiscalAuditHandler(),
    registerDLQQuarantineAlertHandler(),
    // ── I7 : Rupture chaîne NF525 → preuves MCC par tenant ───────────────
    registerCryptoIntegrityHandler(),
  ];
}
