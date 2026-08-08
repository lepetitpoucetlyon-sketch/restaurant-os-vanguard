import { registerNotificationUrgentDispatchHandler } from '../handlers/NotificationUrgentDispatchHandler';
import { registerNotificationCreatedHandler } from '../handlers/NotificationCreatedHandler';
import { registerOrderNotificationHandler } from '../handlers/OrderNotificationHandler';

export function registerNotificationHandlers(): (() => void)[] {
  return [
    registerNotificationUrgentDispatchHandler(),
    registerNotificationCreatedHandler(),
    registerOrderNotificationHandler(),
  ];
}
