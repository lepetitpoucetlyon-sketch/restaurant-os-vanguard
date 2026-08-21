/**
 * L64 — Registre sécurité incendie ERP connecté.
 *
 * Art. R. 123-51 Code de la Construction et de l'Habitation (CCH) : tout ERP
 * (Établissement Recevant du Public) doit tenir un registre de sécurité incendie
 * avec :
 *  - Test mensuel des BAES (Blocs Autonomes d'Éclairage de Sécurité)
 *  - Passage annuel de la Commission de Sécurité
 *  - Rapports signés (NFC scan ou signature électronique)
 *
 * Défaut = fermeture administrative immédiate par la Préfecture.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L64 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

export type FireSafetyTestType = 'baes_monthly' | 'annual_commission';

export interface FireSafetyTestRecord {
  id: string;
  tenantId: string;
  testType: FireSafetyTestType;
  conductedAt: number;
  conductedBy: string;
  result: 'pass' | 'fail' | 'partial';
  notes?: string;
  nfcScanId?: string;
}

export class FireSafetyRegisterService {
  private static path(tenantId: string, id: string): string {
    return `tenants/${tenantId}/fire_safety_register/${id}`;
  }

  static async recordTest(input: {
    tenantId: string;
    testType: FireSafetyTestType;
    conductedBy: string;
    result: 'pass' | 'fail' | 'partial';
    notes?: string;
    nfcScanId?: string;
    now?: number;
  }): Promise<FireSafetyTestRecord> {
    const now = input.now ?? Date.now();
    const record: FireSafetyTestRecord = {
      id: `fire_${input.testType}_${now}`,
      tenantId: input.tenantId,
      testType: input.testType,
      conductedAt: now,
      conductedBy: input.conductedBy,
      result: input.result,
      notes: input.notes,
      nfcScanId: input.nfcScanId,
    };

    await Nexus.adapter.set(this.path(input.tenantId, record.id), record);
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/fire_safety_register`,
      targetId: record.id,
      priority: OutboxPriority.LEGAL,
      payload: record as unknown as Record<string, unknown>,
    }).catch(() => 0);

    await AuditLogger.logAction(
      input.conductedBy,
      'FIRE_SAFETY_TEST_RECORDED',
      record.id,
      { testType: input.testType, result: input.result },
    ).catch(() => null);

    if (input.result === 'fail') {
      await NexusEventBus.emit('compliance.fire_safety_test_due', {
        v: 1,
        tenantId: input.tenantId,
        testType: input.testType,
        lastTestAt: now,
        dueAt: now,
      });
    }

    return record;
  }

  /** Vérifie si le test mensuel BAES a été fait dans les 35 derniers jours */
  static async checkOverdue(tenantId: string, testType: FireSafetyTestType, now?: number): Promise<boolean> {
    const ts = now ?? Date.now();
    const allTests = await Nexus.adapter.query<FireSafetyTestRecord>(
      `tenants/${tenantId}/fire_safety_register`,
    ) ?? [];

    const relevant = allTests
      .filter(t => t.testType === testType && t.result === 'pass')
      .sort((a, b) => b.conductedAt - a.conductedAt);

    if (!relevant.length) return true;

    const maxGapMs = testType === 'baes_monthly' ? 35 * 86400_000 : 370 * 86400_000;
    return ts - relevant[0].conductedAt > maxGapMs;
  }
}
