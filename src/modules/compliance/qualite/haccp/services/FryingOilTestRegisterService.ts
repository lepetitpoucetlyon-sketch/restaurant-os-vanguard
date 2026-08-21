/**
 * L59 — Registre test huile de friture (composés polaires).
 *
 * Arrêté du 26 juin 1986 (modifié) + Circ. DGCCRF 2007 :
 * L'huile de friture doit être changée lorsque sa teneur en composés
 * polaires dépasse 25%. Au-delà = interdit d'utilisation, risque d'amende
 * et de fermeture administrative (DDPP).
 *
 * Ce service enregistre chaque test (kit réactif colorimétrique ou électronique),
 * alerte si > 25% et bloque une nouvelle friture.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L59.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';

const MAX_POLAR_COMPOUNDS_PCT = 25;

export interface FryingOilTestRecord {
  id: string;
  tenantId: string;
  stationId: string;
  testedBy: string;
  polarCompoundsPct: number;
  passed: boolean;
  oilChangedImmediately: boolean;
  testedAt: number;
  legalRef: 'Arr. 26/06/1986 + Circ. DGCCRF 2007';
}

export class FryingOilTestRegisterService {
  private static path(tenantId: string, id: string): string {
    return `tenants/${tenantId}/frying_oil_tests/${id}`;
  }

  static isPassed(polarCompoundsPct: number): boolean {
    return polarCompoundsPct < MAX_POLAR_COMPOUNDS_PCT;
  }

  static async recordTest(input: {
    tenantId: string;
    stationId: string;
    testedBy: string;
    polarCompoundsPct: number;
    oilChangedImmediately?: boolean;
    now?: number;
  }): Promise<FryingOilTestRecord> {
    const now = input.now ?? Date.now();
    const passed = this.isPassed(input.polarCompoundsPct);
    const id = `oil_test_${input.stationId}_${now}`;

    const record: FryingOilTestRecord = {
      id,
      tenantId: input.tenantId,
      stationId: input.stationId,
      testedBy: input.testedBy,
      polarCompoundsPct: input.polarCompoundsPct,
      passed,
      oilChangedImmediately: input.oilChangedImmediately ?? false,
      testedAt: now,
      legalRef: 'Arr. 26/06/1986 + Circ. DGCCRF 2007',
    };

    await Nexus.adapter.set(this.path(input.tenantId, id), record);
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/frying_oil_tests`,
      targetId: id,
      priority: OutboxPriority.SANITAIRE,
      payload: record as unknown as Record<string, unknown>,
    }).catch(() => 0);

    if (!passed) {
      await NexusEventBus.emit('compliance.frying_oil_threshold_exceeded', {
        v: 1,
        tenantId: input.tenantId,
        stationId: input.stationId,
        polarCompoundsPct: input.polarCompoundsPct,
        maxAllowed: MAX_POLAR_COMPOUNDS_PCT,
        testedAt: now,
      }).catch(() => null);

      await Nexus.adapter.set(
        `tenants/${input.tenantId}/frying_stations/${input.stationId}`,
        { blocked: !input.oilChangedImmediately, reason: 'polar_compounds_exceeded', updatedAt: now },
      );
    } else {
      await Nexus.adapter.set(
        `tenants/${input.tenantId}/frying_stations/${input.stationId}`,
        { blocked: false, updatedAt: now },
      );
    }

    return record;
  }

  static async isStationBlocked(tenantId: string, stationId: string): Promise<boolean> {
    const state = await Nexus.adapter.get<{ blocked: boolean }>(
      `tenants/${tenantId}/frying_stations/${stationId}`,
    );
    return state?.blocked === true;
  }
}
