import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/webhooks/sms/inbound/route';
import { NextRequest } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

describe('Webhook Inbound SMS (Twilio Bidirectionnel)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait confirmer la réservation lorsque le client répond 1 ou OUI', async () => {
    const mockReservation = {
      id: 'resa-abc-123',
      tenantId: 'ombellule',
      customerPhone: '+33612345678',
      status: 'confirmed',
      date: '2026-08-20',
      time: '20:00',
      covers: 2,
    };

    vi.spyOn(Nexus.adapter, 'query').mockImplementation(async (path: string) => {
      if (path === 'tenants') return [{ id: 'ombellule' }] as any;
      if (path === 'tenants/ombellule/reservations') return [mockReservation] as any;
      return [];
    });

    const updateSpy = vi.spyOn(Nexus.adapter, 'update').mockResolvedValue({} as any);
    const emitSpy = vi.spyOn(NexusEventBus, 'emit').mockResolvedValue({} as any);

    const request = new NextRequest('http://localhost:3000/api/webhooks/sms/inbound', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ From: '+33612345678', Body: '1' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('confirmée');

    expect(updateSpy).toHaveBeenCalledWith(
      'tenants/ombellule/reservations/resa-abc-123',
      expect.objectContaining({
        reconfirmationChannel: 'sms',
      })
    );
    expect(emitSpy).toHaveBeenCalledWith(
      'commerce.reservation_reconfirmed',
      expect.objectContaining({
        reservationId: 'resa-abc-123',
      })
    );
  });

  it('devrait annuler la réservation lorsque le client répond 2 ou NON', async () => {
    const mockReservation = {
      id: 'resa-abc-456',
      tenantId: 'ombellule',
      customerPhone: '+33698765432',
      status: 'confirmed',
      date: '2026-08-20',
      time: '20:00',
      covers: 4,
    };

    vi.spyOn(Nexus.adapter, 'query').mockImplementation(async (path: string) => {
      if (path === 'tenants') return [{ id: 'ombellule' }] as any;
      if (path === 'tenants/ombellule/reservations') return [mockReservation] as any;
      return [];
    });

    const updateSpy = vi.spyOn(Nexus.adapter, 'update').mockResolvedValue({} as any);
    const emitSpy = vi.spyOn(NexusEventBus, 'emit').mockResolvedValue({} as any);

    const request = new NextRequest('http://localhost:3000/api/webhooks/sms/inbound', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ From: '+33698765432', Body: '2' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('annulée');

    expect(updateSpy).toHaveBeenCalledWith(
      'tenants/ombellule/reservations/resa-abc-456',
      expect.objectContaining({
        status: 'cancelled',
        cancellationReason: 'sms_interactive_reply',
      })
    );
    expect(emitSpy).toHaveBeenCalledWith(
      'commerce.reservation_cancelled',
      expect.objectContaining({
        reservationId: 'resa-abc-456',
      })
    );
  });
});
