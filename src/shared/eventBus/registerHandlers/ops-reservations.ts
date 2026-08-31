import { registerReservationNotifierHandler } from '../handlers/ReservationNotifierHandler';
import { registerNoShowPenaltyHandler } from '../handlers/NoShowPenaltyHandler';
import { registerResaKitchenTaskHandler } from '../handlers/ResaKitchenTaskHandler';
import { registerBigGroupAlertHandler } from '../handlers/BigGroupAlertHandler';
import { registerResaAllergenCheckHandler } from '../handlers/ResaAllergenCheckHandler';
import { registerNoShowHandler } from '../handlers/NoShowHandler';

export function registerOpsReservationHandlers(): Array<() => void> {
  return [
    registerReservationNotifierHandler(),
    registerNoShowPenaltyHandler(),
    registerResaKitchenTaskHandler(),
    registerBigGroupAlertHandler(),
    registerResaAllergenCheckHandler(),
    registerNoShowHandler(),
  ];
}
