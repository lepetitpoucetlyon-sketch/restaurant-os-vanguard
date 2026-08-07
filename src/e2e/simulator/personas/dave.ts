import { Nexus } from '@/lib/nexus/NexusAdapter';
import { AssertionLayer, type SealSnapshot } from '../engine/AssertionLayer';
import { runAct, type PersonaFn, type PersonaResult } from '../engine/PersonaTypes';
import { JsonObject } from "@/shared/types/json";
import { toError } from "@/lib/toError";

export const davePersona: PersonaFn = async ({ tenantId }): Promise<PersonaResult> => {
  const start = Date.now();
  const acts = [];
  const violations: string[] = [];
  let seals: SealSnapshot[] = [];

  acts.push(await runAct('MCC: fleet heartbeat check', 'MCC', async () => {
    const heartbeat = await Nexus.adapter.get(`tenants/${tenantId}/telemetry/heartbeat`) as JsonObject | null;
    return { connected: heartbeat !== null, health: heartbeat?.health ?? 0 };
  }));

  acts.push(await runAct('FiscalChainExplorer: verify NF525 chain', 'FISCAL', async () => {
    const rawSeals = await Nexus.adapter.query<SealSnapshot>(`tenants/${tenantId}/fiscalSeals`);
    seals = rawSeals;
    try {
      AssertionLayer.assertNF525Chain(seals);
      return { sealCount: seals.length, chainIntact: true };
    } catch (e) {
      violations.push(toError(e).message);
      return { sealCount: seals.length, chainIntact: false, violation: toError(e).message };
    }
  }));

  acts.push(await runAct('MCCTreasury: billingStatus gate', 'MCC', async () => {
    const config = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as JsonObject | null;
    const billingStatus = (config?.billingStatus as string) ?? 'UNKNOWN';
    if (billingStatus !== 'ACTIVE') {
      violations.push(`BILLING: tenant=${tenantId} status=${billingStatus}, expected=ACTIVE`);
    }
    return { billingStatus, tenantId };
  }));

  const success = acts.every(a => a.success) && violations.length === 0;

  return {
    personaId: 'dave',
    tenantId,
    acts,
    durationMs: Date.now() - start,
    success,
    payload: { seals, violations },
  };
};
