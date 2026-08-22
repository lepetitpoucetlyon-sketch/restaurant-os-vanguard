import { registerMccHealthPingHandler } from '../handlers/MccHealthPingHandler';
import { registerMccFiscalAuditHandler } from '../handlers/MccFiscalAuditHandler';
import { registerDLQQuarantineAlertHandler } from '../handlers/DLQQuarantineAlertHandler';
import { registerCryptoIntegrityHandler } from '../handlers/CryptoIntegrityHandler';
import { registerSaaSInvoicePersistHandler } from '../handlers/SaaSInvoicePersistHandler';
import { registerSlaBreachHandler } from '../handlers/SlaBreachHandler';
import { registerFleetTelemetryPersistHandler } from '../handlers/FleetTelemetryPersistHandler';

import { registerFeatureFlagSyncHandler } from '../handlers/FeatureFlagSyncHandler';

export function registerMccHandlers(): (() => void)[] {
  return [
    registerFeatureFlagSyncHandler(),
    registerMccHealthPingHandler(),
    registerMccFiscalAuditHandler(),
    registerDLQQuarantineAlertHandler(),
    // ── I7 : Rupture chaîne NF525 → preuves MCC par tenant ───────────────
    registerCryptoIntegrityHandler(),
    // ── Track 2.1 : clôture des 8 events fleet.* orphelins (coverage-theater) ──
    registerSaaSInvoicePersistHandler(),
    registerSlaBreachHandler(),
    registerFleetTelemetryPersistHandler(),
  ];
}
