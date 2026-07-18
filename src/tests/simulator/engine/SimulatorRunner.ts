import { alicePersona } from '../personas/alice';
import { bobPersona } from '../personas/bob';
import { carlPersona } from '../personas/carl';
import { davePersona } from '../personas/dave';
import type { PersonaResult } from './PersonaTypes';

export interface SimulationReport {
  alice: PersonaResult;
  bob: PersonaResult;
  carl: PersonaResult;
  dave: PersonaResult;
  violations: string[];
  totalDurationMs: number;
}

export class SimulatorRunner {
  // Sequential: alice provisions → bob pays → carl cooks → dave audits
  async runAll(tenantId: string): Promise<SimulationReport> {
    const start = Date.now();
    const violations: string[] = [];

    const alice = await alicePersona({ tenantId, operatorId: 'alice-admin' });
    const bob   = await bobPersona(  { tenantId, operatorId: 'bob-waiter' });
    const carl  = await carlPersona( { tenantId, operatorId: 'carl-chef'  });
    const dave  = await davePersona( { tenantId, operatorId: 'dave-mcc'   });

    for (const [id, result] of Object.entries({ alice, bob, carl, dave })) {
      const r = result as PersonaResult;
      r.acts.filter(a => !a.success).forEach(a => {
        violations.push(`${id}/${a.label}: ${a.error ?? 'unknown error'}`);
      });
    }

    return { alice, bob, carl, dave, violations, totalDurationMs: Date.now() - start };
  }
}
