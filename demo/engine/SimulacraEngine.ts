import { Nexus } from '@/lib/nexus/NexusAdapter';
import { registerServerNexusHandlers } from '@/shared/eventBus/registerHandlers';
import { TimeController } from './TimeController';
import { DEMO_MENU } from '../fixtures/menu';
import { DEMO_STAFF } from '../fixtures/staff';
import { DEMO_TABLES } from '../fixtures/tables';
import { DEMO_SUPPLIERS } from '../fixtures/suppliers';
import { DEMO_RESERVATIONS } from '../fixtures/reservations';
import { logger } from '@/lib/logger';

export interface SimulationConfig {
  tenantId: string;
  weeks: number;
  tablesCount: number;
  staffCount: number;
  services: 'midi' | 'soir' | 'midi+soir';
  coversMidi: number;
  coversSoir: number;
  enableIncidents: boolean;
  incidentRate: number;
  forcedScenario?: string | null;
  verbose: boolean;
}

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  tenantId: 'tenant_demo_001',
  weeks: 2,
  tablesCount: 5,
  staffCount: 4,
  services: 'midi+soir',
  coversMidi: 35,
  coversSoir: 55,
  enableIncidents: false,
  incidentRate: 0.2,
  forcedScenario: null,
  verbose: false,
};

export class SimulacraEngine {
  public readonly config: SimulationConfig;
  public readonly clock: TimeController;
  public isInitialized = false;

  constructor(configPartial: Partial<SimulationConfig> = {}) {
    this.config = { ...DEFAULT_SIMULATION_CONFIG, ...configPartial };
    this.clock = new TimeController(new Date('2026-08-10T08:00:00.000Z'));
  }

  async bootstrap(): Promise<void> {
    const { tenantId } = this.config;
    logger.info(`[SimulacraEngine] Amorce de la simulation pour tenant ${tenantId}...`);

    // 1. Enregistrement des Handlers EventBus Serveur
    registerServerNexusHandlers();

    // 2. Population des Fixtures dans Nexus Adapter
    for (const prod of DEMO_MENU) {
      await Nexus.adapter.set(`tenants/${tenantId}/products/${prod.id}`, {
        ...prod,
        available: true,
        updatedAt: this.clock.getISOString(),
      });
    }

    for (const staff of DEMO_STAFF) {
      await Nexus.adapter.set(`tenants/${tenantId}/staff/${staff.id}`, {
        ...staff,
        updatedAt: this.clock.getISOString(),
      });
    }

    for (const table of DEMO_TABLES) {
      await Nexus.adapter.set(`tenants/${tenantId}/tables/${table.id}`, {
        ...table,
        updatedAt: this.clock.getISOString(),
      });
    }

    for (const sup of DEMO_SUPPLIERS) {
      await Nexus.adapter.set(`tenants/${tenantId}/suppliers/${sup.id}`, {
        ...sup,
        updatedAt: this.clock.getISOString(),
      });
    }

    for (const res of DEMO_RESERVATIONS) {
      await Nexus.adapter.set(`tenants/${tenantId}/reservations/${res.id}`, {
        ...res,
        updatedAt: this.clock.getISOString(),
      });
    }

    this.isInitialized = true;
    logger.info(`[SimulacraEngine] Bootstrap du tenant ${tenantId} terminé avec succès.`);
  }
}
