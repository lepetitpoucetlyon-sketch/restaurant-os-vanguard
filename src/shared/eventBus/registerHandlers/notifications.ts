import { registerNotificationUrgentDispatchHandler } from '../handlers/NotificationUrgentDispatchHandler';
import { registerNotificationCreatedHandler } from '../handlers/NotificationCreatedHandler';
import { registerFlexibilityNotificationHandler } from '../handlers/FlexibilityNotificationHandler';
import { registerStockFlexibilityNotificationHandler } from '../handlers/StockFlexibilityNotificationHandler';

export function registerNotificationHandlers(): (() => void)[] {
  return [
    registerNotificationUrgentDispatchHandler(),
    registerNotificationCreatedHandler(),
    ...registerFlexibilityNotificationHandler(),
    ...registerStockFlexibilityNotificationHandler(),
  ];
}
