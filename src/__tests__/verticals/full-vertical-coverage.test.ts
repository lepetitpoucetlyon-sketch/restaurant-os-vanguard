import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ICoreContext } from '@/shared/plugins/IVerticalPlugin';
import { RetailVertical } from '@/verticals/retail/RetailVertical';
import { SalonVertical } from '@/verticals/salon/SalonVertical';
import { HotelVertical } from '@/verticals/hotel/HotelVertical';
import { VeterinaryVertical } from '@/verticals/veterinary/VeterinaryVertical';
import { BakeryVertical } from '@/verticals/bakery/BakeryVertical';
import { GymVertical } from '@/verticals/gym/GymVertical';
import { CoworkingVertical } from '@/verticals/coworking/CoworkingVertical';
import { FloristVertical } from '@/verticals/florist/FloristVertical';
import { AutoVertical } from '@/verticals/garage/AutoVertical';
import { HealthVertical } from '@/verticals/clinic/HealthVertical';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

// Blueprints
import { RETAIL_BLUEPRINT } from '@/verticals/retail/retail.blueprint';
import { SALON_BLUEPRINT } from '@/verticals/salon/salon.blueprint';
import { HOTEL_BLUEPRINT } from '@/verticals/hotel/hotel.blueprint';
import { VETERINARY_BLUEPRINT } from '@/verticals/veterinary/veterinary.blueprint';
import { BAKERY_BLUEPRINT } from '@/verticals/bakery/bakery.blueprint';
import { GYM_BLUEPRINT } from '@/verticals/gym/gym.blueprint';
import { COWORKING_BLUEPRINT } from '@/verticals/coworking/coworking.blueprint';
import { FLORIST_BLUEPRINT } from '@/verticals/florist/florist.blueprint';
import { GARAGE_BLUEPRINT } from '@/verticals/garage/garage.blueprint';
import { CLINIC_BLUEPRINT } from '@/verticals/clinic/clinic.blueprint';

describe('🏛️ Multi-Verticales — Couverture 100% Architecturale & Blueprints', () => {
  let mockContext: ICoreContext;
  let routesRegistered: Record<string, any>;
  let handlersRegistered: Record<string, Function>;

  beforeEach(() => {
    routesRegistered = {};
    handlersRegistered = {};
    mockContext = {
      registerRoute: vi.fn((path, comp) => { routesRegistered[path] = comp; }),
      registerEventHandler: vi.fn((event, handler) => { handlersRegistered[event] = handler; }),
      registerStoreAtom: vi.fn(),
      registerRbacConfig: vi.fn(),
      getRegisteredRoutes: vi.fn(() => Object.keys(routesRegistered)),
      getRegisteredAtoms: vi.fn(() => []),
    };
    vi.spyOn(NexusEventBus, 'emit').mockReturnValue(true as never);
  });

  describe('1. Blueprints Métier Déclaratifs', () => {
    it('doit valider la conformité structurelle de tous les 10 blueprints', () => {
      const allBlueprints = [
        RETAIL_BLUEPRINT,
        SALON_BLUEPRINT,
        HOTEL_BLUEPRINT,
        VETERINARY_BLUEPRINT,
        BAKERY_BLUEPRINT,
        GYM_BLUEPRINT,
        COWORKING_BLUEPRINT,
        FLORIST_BLUEPRINT,
        GARAGE_BLUEPRINT,
        CLINIC_BLUEPRINT,
      ];

      for (const bp of allBlueprints) {
        expect(bp.slug).toBeDefined();
        expect(bp.className).toBeDefined();
        expect(bp.meta.name).toBeDefined();
        expect(bp.tokens).toBeDefined();
        expect(bp.capabilities).toBeDefined();
      }

      expect(RETAIL_BLUEPRINT.slug).toBe('retail');
      expect(SALON_BLUEPRINT.slug).toBe('salon');
      expect(HOTEL_BLUEPRINT.slug).toBe('hotel');
      expect(VETERINARY_BLUEPRINT.slug).toBe('veterinary');
      expect(BAKERY_BLUEPRINT.slug).toBe('bakery');
    });
  });

  describe('2. RetailVertical Lifecycle & Adapters', () => {
    it('doit initialiser les routes et traiter les événements de cycle de vie retail', async () => {
      const plugin = new RetailVertical();
      expect(plugin.id).toBe('retail');
      expect(plugin.dependencies).toContain('finance');

      await plugin.initialize(mockContext);

      expect(mockContext.registerRoute).toHaveBeenCalledWith('/retail-pos', expect.anything());
      expect(mockContext.registerRoute).toHaveBeenCalledWith('/catalog', expect.anything());
      expect(mockContext.registerRoute).toHaveBeenCalledWith('/returns', expect.anything());
      expect(mockContext.registerRoute).toHaveBeenCalledWith('/promotions', expect.anything());
      expect(mockContext.registerRoute).toHaveBeenCalledWith('/retail-stock', expect.anything());

      // Trigger session opened
      expect(handlersRegistered['retail.pos_session_opened']).toBeDefined();
      handlersRegistered['retail.pos_session_opened']({
        tenantId: 'tenant-retail-1',
        sessionId: 'sess-1',
        operatorId: 'op-1',
        openedAt: new Date().toISOString(),
        openingFloat: 150_000_000,
      });

      // Trigger sale completed with customer
      expect(handlersRegistered['retail.sale_completed']).toBeDefined();
      handlersRegistered['retail.sale_completed']({
        tenantId: 'tenant-retail-1',
        saleId: 'sale-1',
        customerId: 'cust-1',
        lines: [{ productId: 'item-1', quantity: 2, unitPriceInMicrounits: 10_000_000 }],
        totalInMicrounits: 20_000_000,
        paymentMethod: 'cb',
      });

      // Trigger return
      expect(handlersRegistered['retail.return_processed']).toBeDefined();
      handlersRegistered['retail.return_processed']({
        tenantId: 'tenant-retail-1',
        returnId: 'ret-1',
        originalSaleId: 'sale-1',
        lines: [{ productId: 'item-1', quantity: 1 }],
        refundInMicrounits: 10_000_000,
      });

      // Trigger stock alert
      expect(handlersRegistered['retail.stock_alert']).toBeDefined();
      handlersRegistered['retail.stock_alert']({
        tenantId: 'tenant-retail-1',
        productId: 'item-1',
        sku: 'SKU-001',
        currentStock: 2,
        threshold: 5,
      });
    });
  });

  describe('3. SalonVertical Lifecycle & Adapters', () => {
    it('doit initialiser les routes salon et traiter les rendez-vous et clôtures', async () => {
      const plugin = new SalonVertical();
      expect(plugin.id).toBe('salon');

      await plugin.initialize(mockContext);

      expect(mockContext.registerRoute).toHaveBeenCalledWith('/agenda', expect.anything());
      expect(mockContext.registerRoute).toHaveBeenCalledWith('/stylists', expect.anything());
      expect(mockContext.registerRoute).toHaveBeenCalledWith('/cabin-stock', expect.anything());

      // Appointment booked
      expect(handlersRegistered['salon.appointment_booked']).toBeDefined();
      handlersRegistered['salon.appointment_booked']({
        tenantId: 'tenant-salon-1',
        appointmentId: 'apt-1',
        customerId: 'cust-1',
        stylistId: 'stylist-1',
        serviceId: 'cut-and-style',
        scheduledAt: new Date().toISOString(),
      });

      // Appointment completed
      expect(handlersRegistered['salon.appointment_completed']).toBeDefined();
      handlersRegistered['salon.appointment_completed']({
        tenantId: 'tenant-salon-1',
        appointmentId: 'apt-1',
        customerId: 'cust-1',
        stylistId: 'stylist-1',
        serviceId: 'cut-and-style',
        totalInMicrounits: 45_000_000,
        consumablesUsed: [{ consumableId: 'shampoo-1', quantity: 1 }],
      });
    });
  });

  describe('4. HotelVertical Lifecycle & PMS', () => {
    it('doit initialiser les routes hôtellerie et traiter check-in/check-out', async () => {
      const plugin = new HotelVertical();
      expect(plugin.id).toBe('hotel');

      await plugin.initialize(mockContext);

      expect(mockContext.registerRoute).toHaveBeenCalledWith('/pms', expect.anything());
      expect(mockContext.registerRoute).toHaveBeenCalledWith('/housekeeping', expect.anything());
      expect(mockContext.registerRoute).toHaveBeenCalledWith('/yield', expect.anything());
      expect(mockContext.registerRoute).toHaveBeenCalledWith('/city-ledger', expect.anything());
    });
  });

  describe('5. VeterinaryVertical Lifecycle & Adapters', () => {
    it('doit initialiser les consultations vétérinaires et les rappels', async () => {
      const plugin = new VeterinaryVertical();
      expect(plugin.id).toBe('veterinary');

      await plugin.initialize(mockContext);

      expect(handlersRegistered['veterinary.pet_consultation_completed']).toBeDefined();
      handlersRegistered['veterinary.pet_consultation_completed']({
        tenantId: 'tenant-vet-1',
        consultationId: 'cons-1',
        animalId: 'dog-1',
        vetId: 'dr-smith',
      });

      expect(handlersRegistered['veterinary.vaccine_reminder_sent']).toBeDefined();
      handlersRegistered['veterinary.vaccine_reminder_sent']({
        tenantId: 'tenant-vet-1',
        animalId: 'dog-1',
        ownerId: 'owner-1',
        vaccineName: 'Rage',
      });
    });
  });

  describe('6. Bakery, Gym, Coworking, Florist, Auto & Health Vertical Lifecycles', () => {
    it('doit initialiser et enregistrer toutes les autres verticales de la flotte', async () => {
      const otherPlugins = [
        new BakeryVertical(),
        new GymVertical(),
        new CoworkingVertical(),
        new FloristVertical(),
        new AutoVertical(),
        new HealthVertical(),
      ];

      for (const p of otherPlugins) {
        expect(p.id).toBeDefined();
        expect(p.name).toBeDefined();
        await p.initialize(mockContext);
      }
    });
  });
});
