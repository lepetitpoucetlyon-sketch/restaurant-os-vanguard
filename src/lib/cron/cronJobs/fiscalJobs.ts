import { GrandTotalScheduler } from '../GrandTotalScheduler';

import type { CronJobDefinition } from './types';

function previousPeriodLabel(now: Date, kind: 'monthly' | 'annual'): string {
  if (kind === 'annual') return String(now.getUTCFullYear() - 1);
  const previous = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, '0')}`;
}

export const fiscalCronJobs: CronJobDefinition[] = [
  {
    name: 'GrandTotalMonthlyJob',
    schedule: GrandTotalScheduler.scheduleMonthly,
    runForTenant: (tenantId) =>
      GrandTotalScheduler.runForTenant(tenantId, 'monthly', previousPeriodLabel(new Date(), 'monthly')),
  },
  {
    name: 'GrandTotalAnnualJob',
    schedule: GrandTotalScheduler.scheduleAnnual,
    runForTenant: (tenantId) =>
      GrandTotalScheduler.runForTenant(tenantId, 'annual', previousPeriodLabel(new Date(), 'annual')),
  },
];
