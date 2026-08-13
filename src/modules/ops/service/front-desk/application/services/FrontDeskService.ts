import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/orchestration/NexusEventBus';
import { logger } from '@/lib/logger';
import type { GuestRecord, CheckInInput } from '../../domain/types/front-desk';

const COLLECTION = 'guestRecords';

function path(tenantId: string, suffix = '') {
  return `tenants/${tenantId}/${COLLECTION}${suffix ? `/${suffix}` : ''}`;
}

export const FrontDeskService = {
  async checkIn(tenantId: string, input: CheckInInput): Promise<GuestRecord> {
    const id = `gst-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const record: GuestRecord = {
      ...input,
      id,
      tenantId,
      status: 'checked_in',
      checkInAt: input.checkInAt || now,
      createdAt: now,
      updatedAt: now,
    };

    await Nexus.adapter.set(path(tenantId, id), record);
    NexusEventBus.emit('ops.guest_checked_in', {
      tenantId,
      guestId: id,
      guestName: record.guestName,
      unitName: record.unitName,
    });
    logger.info(`[FrontDesk] Check-in ${id} for ${tenantId}`);
    return record;
  },

  async get(tenantId: string, id: string): Promise<GuestRecord | null> {
    return Nexus.adapter.get<GuestRecord>(path(tenantId, id));
  },

  async checkOut(tenantId: string, id: string): Promise<void> {
    const now = new Date().toISOString();
    await Nexus.adapter.update(path(tenantId, id), {
      status: 'checked_out',
      checkOutAt: now,
      updatedAt: now,
    });
    NexusEventBus.emit('ops.guest_checked_out', { tenantId, guestId: id });
  },

  async listActive(tenantId: string): Promise<GuestRecord[]> {
    const all = await Nexus.adapter.query<GuestRecord>(path(tenantId));
    return (all ?? []).filter(g => g.status === 'checked_in');
  },

  async listExpected(tenantId: string, date: string): Promise<GuestRecord[]> {
    const all = await Nexus.adapter.query<GuestRecord>(path(tenantId));
    return (all ?? []).filter(g => g.status === 'expected' && g.checkInAt.startsWith(date));
  },

  async listByStatus(tenantId: string, status: GuestRecord['status']): Promise<GuestRecord[]> {
    const all = await Nexus.adapter.query<GuestRecord>(path(tenantId));
    return (all ?? []).filter(g => g.status === status);
  },
};
