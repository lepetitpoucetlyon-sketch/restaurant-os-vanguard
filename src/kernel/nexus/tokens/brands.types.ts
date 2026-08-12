export type Brand<K, T> = K & { __brand: T };

export type TenantID = Brand<string, "TenantID">;

export interface NodeHealth {
  memoryUsageMB: number;
  lowResActive: boolean;
  timestamp: number;
}

import { SiteTelemetry } from '@nexus/contracts';
export type { SiteTelemetry };
