import { BirthdayScanJob } from '../BirthdayScanJob';
import { ContractExpiryJob } from '../ContractExpiryJob';
import { DailyDigestJob } from '../DailyDigestJob';
import { DraftPOEscalationJob } from '../DraftPOEscalationJob';
import { InvoiceOverdueScannerJob } from '../InvoiceOverdueScannerJob';
import { MiseEnPlaceJob } from '../MiseEnPlaceJob';
import { PromotionExpiryJob } from '../PromotionExpiryJob';
import { SaaSBillingJob } from '../SaaSBillingJob';
import { ServerDLQRetryJob } from '../ServerDLQRetryJob';
import { StaffingPlannerJob } from '../StaffingPlannerJob';
import { UrssafVigilanceJob } from '../UrssafVigilanceJob';
import { ZReportAutoJob } from '../ZReportAutoJob';

import type { CronJobDefinition } from './types';

export const coreCronJobs: CronJobDefinition[] = [
  ZReportAutoJob,
  BirthdayScanJob,
  ContractExpiryJob,
  DailyDigestJob,
  PromotionExpiryJob,
  MiseEnPlaceJob,
  DraftPOEscalationJob,
  StaffingPlannerJob,
  SaaSBillingJob,
  UrssafVigilanceJob,
  ServerDLQRetryJob,
  InvoiceOverdueScannerJob,
];
