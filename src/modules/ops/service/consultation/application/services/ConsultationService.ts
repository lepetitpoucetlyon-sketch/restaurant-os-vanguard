import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/orchestration/NexusEventBus';
import { logger } from '@/lib/logger';
import type { Consultation, ConsultationCreateInput } from '../../domain/types/consultation';

const COLLECTION = 'consultations';

function path(tenantId: string, suffix = '') {
  return `tenants/${tenantId}/${COLLECTION}${suffix ? `/${suffix}` : ''}`;
}

export const ConsultationService = {
  async create(tenantId: string, input: ConsultationCreateInput): Promise<Consultation> {
    const id = `csl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const consultation: Consultation = {
      id,
      tenantId,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
      ...input,
    };

    await Nexus.adapter.set(path(tenantId, id), consultation);
    NexusEventBus.emit('ops.consultation_scheduled', {
      tenantId,
      consultationId: id,
      clientEmail: consultation.clientEmail,
      startAt: consultation.startAt,
    });
    logger.info(`[Consultation] Created ${id} for ${tenantId}`);
    return consultation;
  },

  async get(tenantId: string, id: string): Promise<Consultation | null> {
    return Nexus.adapter.get<Consultation>(path(tenantId, id));
  },

  async start(tenantId: string, id: string): Promise<void> {
    await Nexus.adapter.update(path(tenantId, id), {
      status: 'in_progress',
      updatedAt: new Date().toISOString(),
    });
  },

  async complete(tenantId: string, id: string, notes?: string): Promise<void> {
    await Nexus.adapter.update(path(tenantId, id), {
      status: 'completed',
      notes,
      updatedAt: new Date().toISOString(),
    });
    NexusEventBus.emit('ops.consultation_completed', { tenantId, consultationId: id });
  },

  async cancel(tenantId: string, id: string): Promise<void> {
    await Nexus.adapter.update(path(tenantId, id), {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });
  },

  async listByDate(tenantId: string, date: string): Promise<Consultation[]> {
    const all = await Nexus.adapter.query<Consultation>(path(tenantId));
    return (all ?? []).filter(c => c.startAt.startsWith(date));
  },

  async listByPractitioner(tenantId: string, practitionerId: string): Promise<Consultation[]> {
    const all = await Nexus.adapter.query<Consultation>(path(tenantId));
    return (all ?? []).filter(c => c.practitionerId === practitionerId);
  },
};
