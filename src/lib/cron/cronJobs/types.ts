export interface CronJobDefinition {
  name: string;
  schedule: string;
  runForTenant: (tenantId: string) => Promise<void>;
}
