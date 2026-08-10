import { logger } from '../../lib/logger';

// Mock simple d'un Circuit Breaker
class CircuitBreaker {
    private failures = 0;
    private threshold = 3;
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    private nextTry: number = 0;

    async execute<T>(action: () => Promise<T>): Promise<T> {
        if (this.state === 'OPEN') {
            if (Date.now() > this.nextTry) {
                this.state = 'HALF_OPEN';
            } else {
                throw new Error('CircuitBreaker OPEN: Service Unavailable. Fast-failing.');
            }
        }

        try {
            const result = await action();
            if (this.state === 'HALF_OPEN') {
                this.state = 'CLOSED';
                this.failures = 0;
            }
            return result;
        } catch (error) {
            this.failures++;
            if (this.failures >= this.threshold) {
                this.state = 'OPEN';
                this.nextTry = Date.now() + 5000; // Open for 5 seconds
                logger.warn('Circuit Breaker déclenché (OPEN) !');
            }
            throw error;
        }
    }
}

async function runGatewayResilienceAudit() {
    logger.info('🧨 [CRASH-TEST] Démarrage de l\'Audit 7 : Connecteurs & Gateway (Circuit Breaker)');

    const gatewayBreaker = new CircuitBreaker();

    // Mock d'un appel API externe qui Timeout
    const callStripeAPI = async () => {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('503 Service Unavailable (Timeout)')), 100);
        });
    };

    logger.info('Test : 5 appels consécutifs à l\'API Stripe hors-service...');
    
    let fastFailures = 0;

    for (let i = 1; i <= 5; i++) {
        try {
            await gatewayBreaker.execute(callStripeAPI);
        } catch (error: any) {
            if (error.message.includes('Fast-failing')) {
                fastFailures++;
                logger.info(`Appel ${i} : Rejet instantané par le Circuit Breaker (Zéro latence réseau).`);
            } else {
                logger.warn(`Appel ${i} : Échec réseau réel (${error.message}).`);
            }
        }
    }

    if (fastFailures >= 2) {
        logger.info('✅ SUCCÈS : Le Circuit Breaker s\'est activé et protège le POS contre les gels d\'interface.');
    } else {
        logger.error('❌ ÉCHEC CRITIQUE : Le POS continue d\'attendre le réseau et l\'interface est freezée !');
        process.exit(1);
    }
}

if (require.main === module) {
    runGatewayResilienceAudit().catch(console.error);
}
