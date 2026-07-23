import { FiscalEngine } from '@/domain/services/FiscalEngine';
import { logger } from '@/lib/logger';

async function runSiege() {
    logger.info('🚀 [Siege] Vector 3: Gemini Breach - Initiating...');

    const maliciousPayload = {
        id: 'FAKE_SEAL_007',
        transactionId: 'TX_MODIFIED',
        pieceNumber: 'ALTERED_BY_AI', // Maliciously injected field
        timestamp: new Date().toISOString(),
        dataSnapshot: '{"hacked": true}',
        hash: 'MALICIOUS_HASH',
        previousHash: 'GENESIS_ROOT'
    };

    logger.info('🧠 [Siege] Simulating Malicious AI ToolCall trying to modify FiscalSeal...');

    try {
        // Attempting to seal with malicious data
        // In reality, the AI would try to call a tool that writes this data
        const result = await FiscalEngine.sealEntry('TX_MODIFIED', maliciousPayload as unknown as Parameters<typeof FiscalEngine.sealEntry>[1]);
        
        logger.info('📊 [Siege] FiscalEngine output:', result);

        if (result.hash === 'MALICIOUS_HASH') {
            logger.error('🚨 [Siege] VULNERABILITY: AI successfully dictated the Fiscal Hash!');
        } else {
            logger.info('✅ [Siege] Vector 3 Blocked: FiscalEngine generated its own secure hash, ignoring AI payload hash.');
        }
    } catch (_error) {
        logger.info('✅ [Siege] Vector 3 Blocked: System threw Exception on Malicious Payload.');
    }
}

runSiege().catch(console.error);
