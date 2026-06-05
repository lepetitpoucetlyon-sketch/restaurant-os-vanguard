import { MonkeyChaos } from './src/domain/agents/MonkeyChaos';

async function runAudit() {
    console.log('🏁 Starting Resilience Audit [MONKEY CHAOS vs LEDGER]');
    const report = await MonkeyChaos.attackLedger();
    console.log('--------------------------------------------------');
    console.log(`STATUS: ${report.success ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`MESSAGE: ${report.message}`);
    console.log('--------------------------------------------------');
}

runAudit();
