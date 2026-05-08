import { NexusTelemetryService as DomainTelemetryService } from '@/domain/services/NexusTelemetryService';
import { AuditPulse } from './types';

export const NexusTelemetryService = {
    emit: async (pulse: AuditPulse) => {
        DomainTelemetryService.emitAuditPulse('NEXUS', pulse.pulse, pulse);
    }
};
