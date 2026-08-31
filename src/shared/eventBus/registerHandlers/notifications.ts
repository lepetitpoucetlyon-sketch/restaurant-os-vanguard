import { registerNotificationUrgentDispatchHandler } from '../handlers/NotificationUrgentDispatchHandler';
import { registerNotificationCreatedHandler } from '../handlers/NotificationCreatedHandler';

export function registerNotificationHandlers(): (() => void)[] {
  return [
    registerNotificationUrgentDispatchHandler(),
    registerNotificationCreatedHandler(),
  ];
}
