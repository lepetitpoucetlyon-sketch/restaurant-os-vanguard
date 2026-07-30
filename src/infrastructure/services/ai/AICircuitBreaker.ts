import { logger } from '@/lib/logger';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerOptions {
    failureThreshold: number; // Nombre d'échecs avant ouverture
    resetTimeoutMs: number; // Temps avant de tester le Half-Open
}

/**
 * 🛡️ C5.6: AI Circuit Breaker
 * Dégradation gracieuse pour les LLMs. Protège l'OS si Gemini / OpenAI tombe.
 */
export class AICircuitBreaker {
    private state: CircuitState = 'CLOSED';
    private failures = 0;
    private nextAttempt = Date.now();
    
    private readonly threshold: number;
    private readonly timeoutMs: number;

    constructor(options: CircuitBreakerOptions = { failureThreshold: 3, resetTimeoutMs: 60000 }) {
        this.threshold = options.failureThreshold;
        this.timeoutMs = options.resetTimeoutMs;
    }

    /**
     * Exécute une requête IA de manière protégée.
     * Si le circuit est ouvert, exécute le fallback déterministe.
     */
    async execute<T>(
        request: () => Promise<T>, 
        fallback: () => T | Promise<T>,
        context: string
    ): Promise<T> {
        
        if (this.state === 'OPEN') {
            if (Date.now() > this.nextAttempt) {
                logger.info(`[CircuitBreaker] ${context}: Tentative de réouverture (HALF_OPEN).`);
                this.state = 'HALF_OPEN';
            } else {
                logger.warn(`[CircuitBreaker] ${context}: Circuit OPEN. Exécution du Fallback.`);
                return fallback();
            }
        }

        try {
            const result = await request();
            
            // Si on était en half-open et que ça a marché, on ferme le circuit.
            if (this.state === 'HALF_OPEN') {
                logger.info(`[CircuitBreaker] ${context}: Succès. Circuit CLOSED.`);
                this.reset();
            }
            
            return result;

        } catch (e) {
            this.failures++;
            logger.error(`[CircuitBreaker] ${context}: Échec (${this.failures}/${this.threshold})`, e);

            if (this.failures >= this.threshold) {
                logger.error(`[CircuitBreaker] ${context}: Threshold atteint. Circuit OPEN.`);
                this.state = 'OPEN';
                this.nextAttempt = Date.now() + this.timeoutMs;
            }

            return fallback();
        }
    }

    private reset() {
        this.failures = 0;
        this.state = 'CLOSED';
    }

    public getState(): CircuitState {
        return this.state;
    }
}

// Instance globale pour les LLMs
export const GlobalAICircuitBreaker = new AICircuitBreaker();
