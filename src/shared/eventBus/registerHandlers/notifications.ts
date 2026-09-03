import { registerNotificationUrgentDispatchHandler } from '../handlers/NotificationUrgentDispatchHandler';
import { registerNotificationCreatedHandler } from '../handlers/NotificationCreatedHandler';
import { registerFlexibilityNotificationHandler } from '../handlers/FlexibilityNotificationHandler';

export function registerNotificationHandlers(): (() => void)[] {
  return [
    registerNotificationUrgentDispatchHandler(),
    registerNotificationCreatedHandler(),
    ...registerFlexibilityNotificationHandler(),
  ];
}
