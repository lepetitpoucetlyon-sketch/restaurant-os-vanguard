import { Nexus } from '@/lib/nexus/NexusAdapter';
import { runAct, type PersonaFn, type PersonaResult } from '../engine/PersonaTypes';
import { JsonObject } from "@/lib/types/json";

export const alicePersona: PersonaFn = async ({ tenantId, operatorId }): Promise<PersonaResult> => {
  const start = Date.now();
  const acts = [];

  acts.push(await runAct('ProvisioningEngine.provision()', 'NEXUS', async () => {
    await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
      id: tenantId,
      name: 'Chez Alice',
      siret: '12345678901234',
      billingStatus: 'PENDING',
      features: { pos: true, kds: true, fiscalCompliance: true },
      operatorId,
      createdAt: new Date().toISOString(),
    });
    return { tenantId };
  }));

  acts.push(await runAct('BillingService: checkout.completed → ACTIVE', 'STRIPE', async () => {
    await Nexus.adapter.update(`tenants/${tenantId}/tenantConfig`, {
      billingStatus: 'ACTIVE',
      billing: {
        plan: 'STANDARD',
        activatedAt: new Date().toISOString(),
        stripeCustomerId: 'cus_sim_chez_alice',
      },
    });
    return { billingStatus: 'ACTIVE' };
  }));

  acts.push(await runAct('NexusBridge.init() → heartbeat', 'MCC', async () => {
    await Nexus.adapter.set(`tenants/${tenantId}/telemetry/heartbeat`, {
      health: 100,
      billingStatus: 'ACTIVE',
      lastSeen: new Date().toISOString(),
      instanceVersion: '2.0.0',
    });
    return { connected: true };
  }));

  const success = acts.every(a => a.success);
  const config = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`);

  return {
    personaId: 'alice',
    tenantId,
    acts,
    durationMs: Date.now() - start,
    success,
    payload: { tenantConfig: config as JsonObject },
  };
};
