import { coreCronJobs } from './coreJobs';
import { fiscalCronJobs } from './fiscalJobs';
import { reservationCronJobs } from './reservationJobs';

export type { CronJobDefinition } from './types';

export const cronJobs = [...coreCronJobs, ...fiscalCronJobs, ...reservationCronJobs];
