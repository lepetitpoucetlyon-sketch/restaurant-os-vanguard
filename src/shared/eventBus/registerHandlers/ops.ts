/* eslint-disable no-restricted-imports -- infrastructure/aggregator: deep path required */
import { registerCashDrawerAnomalyHandler } from '@/modules/ops/service/pos/handlers/CashDrawerAnomalyHandler';
import { registerReservationNotifierHandler } from '../handlers/ReservationNotifierHandler';
import { registerFloorPlanCapacityHandler } from '../handlers/FloorPlanCapacityHandler';
import { registerNoShowPenaltyHandler } from '../handlers/NoShowPenaltyHandler';
import { registerTableTurnoverAnalyzerHandler } from '../handlers/TableTurnoverAnalyzerHandler';
import { registerResaReminderHandler } from '../handlers/ResaReminderHandler';
import { registerResaKitchenTaskHandler } from '../handlers/ResaKitchenTaskHandler';
import { registerNoShowTableReleaseHandler } from '../handlers/NoShowTableReleaseHandler';
import { registerTableAutoReleaseHandler } from '../handlers/TableAutoReleaseHandler';
import { registerBigGroupAlertHandler } from '../handlers/BigGroupAlertHandler';
import { registerRushModeIntegrationHandler } from '../handlers/RushModeIntegrationHandler';
import { registerEndOfServiceActionHandler } from '../handlers/EndOfServiceActionHandler';
import { registerDeliveryDriverUnlockHandler } from '../handlers/DeliveryDriverUnlockHandler';
import { registerFacilityHandlers } from '../handlers/FacilityHandlers';
import { registerHRClockInGuardHandler } from '../handlers/HRClockInGuardHandler';
import { registerResaAllergenCheckHandler } from '../handlers/ResaAllergenCheckHandler';
import { registerTableLockHandler } from '../handlers/TableLockHandler';
import { registerTableTransferHandler } from '../handlers/TableTransferHandler';
import { registerPrinterMappingHandler } from '../handlers/PrinterMappingHandler';
import { registerKDSTicketDoneNotifier } from '../handlers/KDSTicketDoneNotifier';
import { registerKDSRushAlertNotifier } from '../handlers/KDSRushAlertNotifier';
import { registerNoShowHandler } from '../handlers/NoShowHandler';
import { registerOpsKdsHandlers } from './ops-kds';
import { registerOpsDeliveryHandlers } from './ops-delivery';

export function registerOpsHandlers(): Array<() => void> {
  return [
    registerNoShowHandler(),
    registerKDSTicketDoneNotifier(),
    registerKDSRushAlertNotifier(),
    registerCashDrawerAnomalyHandler(),
    registerReservationNotifierHandler(),
    registerFloorPlanCapacityHandler(),
    registerNoShowPenaltyHandler(),
    registerTableTurnoverAnalyzerHandler(),
    registerResaReminderHandler(),
    registerResaKitchenTaskHandler(),
    registerNoShowTableReleaseHandler(),
    registerTableAutoReleaseHandler(),
    registerBigGroupAlertHandler(),
    registerRushModeIntegrationHandler(),
    registerEndOfServiceActionHandler(),
    registerDeliveryDriverUnlockHandler(),
    registerFacilityHandlers(),
    // ── I2 : POS → RH ─────────────────────────────────────────────────────
    registerHRClockInGuardHandler(),
    // ── I3 : Résa → KDS ───────────────────────────────────────────────────
    registerResaAllergenCheckHandler(),
    // ── Ops table management ───────────────────────────────────────────────
    registerTableLockHandler(),
    registerTableTransferHandler(),
    // ── Hardware ──────────────────────────────────────────────────────────
    registerPrinterMappingHandler(),
    ...registerOpsKdsHandlers(),
    ...registerOpsDeliveryHandlers(),
  ];
}
