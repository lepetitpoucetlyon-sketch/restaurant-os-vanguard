import { describe, it, expect, vi } from 'vitest';
import { GymVertical, GymCommerceAdapter } from '@/verticals/gym';
import { CoworkingVertical, CoworkingCommerceAdapter } from '@/verticals/coworking';
import { VeterinaryVertical, VeterinaryCommerceAdapter } from '@/verticals/veterinary';
import { FloristVertical, FloristLogisticsAdapter } from '@/verticals/florist';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

describe('V2-VERT-03: Minimal Adapters & Plugins for 4 New Verticals', () => {
  it('initializes GymVertical and dispatches event handlers', async () => {
    const plugin = new GymVertical();
    expect(plugin.id).toBe('gym');
    expect(plugin.name).toBe('Fitness OS');

    const handlers: Record<string, (...args: unknown[]) => unknown> = {};
    const mockContext = {
      registerRoute: vi.fn(),
      registerEventHandler: vi.fn((event: string, handler: (...args: unknown[]) => unknown) => {
        handlers[event] = handler;
      }),
      registerNavSection: vi.fn(),
      registerCommand: vi.fn(),
      registerWidget: vi.fn(),
    };

    await plugin.initialize(mockContext as any);
    expect(mockContext.registerEventHandler).toHaveBeenCalledWith('gym.turnstile_scanned', expect.any(Function));
    expect(mockContext.registerEventHandler).toHaveBeenCalledWith('gym.class_booked', expect.any(Function));

    const emitSpy = vi.spyOn(NexusEventBus, 'emitDurable').mockResolvedValue(undefined as any);
    GymCommerceAdapter.emitClassBooked({ tenantId: 'gym_01', classId: 'crossfit', memberId: 'm1', slot: '18:00' });
    expect(emitSpy).toHaveBeenCalledWith('gym.class_booked', { tenantId: 'gym_01', classId: 'crossfit', memberId: 'm1', slot: '18:00' });
    emitSpy.mockRestore();
  });

  it('initializes CoworkingVertical and dispatches event handlers', async () => {
    const plugin = new CoworkingVertical();
    expect(plugin.id).toBe('coworking');
    expect(plugin.name).toBe('Coworking OS');

    const mockContext = {
      registerRoute: vi.fn(),
      registerEventHandler: vi.fn(),
      registerNavSection: vi.fn(),
      registerCommand: vi.fn(),
      registerWidget: vi.fn(),
    };

    await plugin.initialize(mockContext as any);
    expect(mockContext.registerEventHandler).toHaveBeenCalledWith('coworking.desk_checked_in', expect.any(Function));
    expect(mockContext.registerEventHandler).toHaveBeenCalledWith('coworking.meeting_room_booked', expect.any(Function));

    const emitSpy = vi.spyOn(NexusEventBus, 'emitDurable').mockResolvedValue(undefined as any);
    CoworkingCommerceAdapter.emitMeetingRoomBooked({ tenantId: 'cowork_01', roomId: 'boardroom', companyId: 'acme', hours: 2 });
    expect(emitSpy).toHaveBeenCalledWith('coworking.meeting_room_booked', { tenantId: 'cowork_01', roomId: 'boardroom', companyId: 'acme', hours: 2 });
    emitSpy.mockRestore();
  });

  it('initializes VeterinaryVertical and dispatches event handlers', async () => {
    const plugin = new VeterinaryVertical();
    expect(plugin.id).toBe('veterinary');
    expect(plugin.name).toBe('Vet OS');

    const mockContext = {
      registerRoute: vi.fn(),
      registerEventHandler: vi.fn(),
      registerNavSection: vi.fn(),
      registerCommand: vi.fn(),
      registerWidget: vi.fn(),
    };

    await plugin.initialize(mockContext as any);
    expect(mockContext.registerEventHandler).toHaveBeenCalledWith('veterinary.pet_consultation_completed', expect.any(Function));
    expect(mockContext.registerEventHandler).toHaveBeenCalledWith('veterinary.vaccine_reminder_sent', expect.any(Function));

    const emitSpy = vi.spyOn(NexusEventBus, 'emitDurable').mockResolvedValue(undefined as any);
    VeterinaryCommerceAdapter.emitVaccineReminderSent({ tenantId: 'vet_01', animalId: 'dog_rex', ownerId: 'user_1', vaccineName: 'Rage' });
    expect(emitSpy).toHaveBeenCalledWith('veterinary.vaccine_reminder_sent', { tenantId: 'vet_01', animalId: 'dog_rex', ownerId: 'user_1', vaccineName: 'Rage' });
    emitSpy.mockRestore();
  });

  it('initializes FloristVertical and dispatches event handlers', async () => {
    const plugin = new FloristVertical();
    expect(plugin.id).toBe('florist');
    expect(plugin.name).toBe('Florist OS');

    const mockContext = {
      registerRoute: vi.fn(),
      registerEventHandler: vi.fn(),
      registerNavSection: vi.fn(),
      registerCommand: vi.fn(),
      registerWidget: vi.fn(),
    };

    await plugin.initialize(mockContext as any);
    expect(mockContext.registerEventHandler).toHaveBeenCalledWith('florist.arrangement_created', expect.any(Function));
    expect(mockContext.registerEventHandler).toHaveBeenCalledWith('florist.delivery_dispatched', expect.any(Function));

    const emitSpy = vi.spyOn(NexusEventBus, 'emitDurable').mockResolvedValue(undefined as any);
    FloristLogisticsAdapter.emitDeliveryDispatched({ tenantId: 'florist_01', deliveryId: 'del_123', recipientAddress: '10 Rue de Paris' });
    expect(emitSpy).toHaveBeenCalledWith('florist.delivery_dispatched', { tenantId: 'florist_01', deliveryId: 'del_123', recipientAddress: '10 Rue de Paris' });
    emitSpy.mockRestore();
  });
});
