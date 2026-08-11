import { registerMccHealthPingHandler } from '../handlers/MccHealthPingHandler';
import { registerMccFiscalAuditHandler } from '../handlers/MccFiscalAuditHandler';
import { registerDLQQuarantineAlertHandler } from '../handlers/DLQQuarantineAlertHandler';
import { registerCryptoIntegrityHandler } from '../handlers/CryptoIntegrityHandler';

import { registerFeatureFlagSyncHandler } from '../handlers/FeatureFlagSyncHandler';

export function registerMccHandlers(): (() => void)[] {
  return [
    registerFeatureFlagSyncHandler(),
    registerMccHealthPingHandler(),
    registerMccFiscalAuditHandler(),
    registerDLQQuarantineAlertHandler(),
    // ── I7 : Rupture chaîne NF525 → preuves MCC par tenant ───────────────
    registerCryptoIntegrityHandler(),
  ];
}
