import { registerReservationNotifierHandler } from '../handlers/ReservationNotifierHandler';
import { registerNoShowPenaltyHandler } from '../handlers/NoShowPenaltyHandler';
import { registerResaReminderHandler } from '../handlers/ResaReminderHandler';
import { registerResaKitchenTaskHandler } from '../handlers/ResaKitchenTaskHandler';
import { registerBigGroupAlertHandler } from '../handlers/BigGroupAlertHandler';
import { registerResaAllergenCheckHandler } from '../handlers/ResaAllergenCheckHandler';
import { registerNoShowHandler } from '../handlers/NoShowHandler';

export function registerOpsReservationHandlers(): Array<() => void> {
  return [
    registerReservationNotifierHandler(),
    registerNoShowPenaltyHandler(),
    registerResaReminderHandler(),
    registerResaKitchenTaskHandler(),
    registerBigGroupAlertHandler(),
    registerResaAllergenCheckHandler(),
    registerNoShowHandler(),
  ];
}
