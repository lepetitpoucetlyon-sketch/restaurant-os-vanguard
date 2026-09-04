import { NoShowDetectorJob } from '../NoShowDetectorJob';
import { ReservationReminderJob } from '../ReservationReminderJob';

import type { CronJobDefinition } from './types';

export const reservationCronJobs: CronJobDefinition[] = [
  {
    name: 'NoShowDetectorJob',
    schedule: '*/5 * * * *',
    runForTenant: () => NoShowDetectorJob.run(),
  },
  {
    name: 'ReservationReminderJob',
    schedule: '0 * * * *',
    runForTenant: () => ReservationReminderJob.run(),
  },
];
