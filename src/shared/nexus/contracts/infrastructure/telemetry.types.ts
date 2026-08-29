import type { NexusTimestamp } from './storage.contracts';

export interface TelemetryPulse {
  version: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'CRITICAL';
  lastPulse: NexusTimestamp | string | Date | number;
  health: {
    uptime: number;
    battery: {
      level: number;
      charging: boolean;
      supported: boolean;
    };
    network: {
      online: boolean;
      effectiveType: string;
    };
  };
  security: {
    nf525Sealed: boolean;
    integrityGrade: string;
    lastSealHash?: string;
  };
}
