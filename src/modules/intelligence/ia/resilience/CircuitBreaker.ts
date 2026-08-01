import { logger } from '@/lib/logger';

type CircuitState = 'closed' | 'open' | 'half_open';

interface CircuitBreakerOptions {
    name: string;
    failureThreshold: number;
    resetTimeoutMs: number;
    halfOpenMaxAttempts: number;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
    name: 'default',
    failureThreshold: 5,
    resetTimeoutMs: 60_000,
    halfOpenMaxAttempts: 2,
};

export class CircuitBreaker {
    private state: CircuitState = 'closed';
    private failureCount = 0;
    private lastFailureAt = 0;
    private halfOpenAttempts = 0;
    private readonly options: CircuitBreakerOptions;

    constructor(options: Partial<CircuitBreakerOptions> & { name: string }) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    get currentState(): CircuitState {
        if (this.state === 'open') {
            const elapsed = Date.now() - this.lastFailureAt;
            if (elapsed >= this.options.resetTimeoutMs) {
                this.state = 'half_open';
                this.halfOpenAttempts = 0;
                logger.info(`[CircuitBreaker:${this.options.name}] transitioning to half_open`);
            }
        }
        return this.state;
    }

    get isAvailable(): boolean {
        const s = this.currentState;
        return s === 'closed' || s === 'half_open';
    }

    async execute<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
        const state = this.currentState;

        if (state === 'open') {
            if (fallback) {
                logger.warn(`[CircuitBreaker:${this.options.name}] open — using fallback`);
                return fallback();
            }
            throw new Error(`[CircuitBreaker:${this.options.name}] circuit is open`);
        }

        if (state === 'half_open' && this.halfOpenAttempts >= this.options.halfOpenMaxAttempts) {
            this.trip();
            if (fallback) return fallback();
            throw new Error(`[CircuitBreaker:${this.options.name}] half_open attempts exhausted`);
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (err) {
            this.onFailure();
            if (fallback && !this.isAvailable) return fallback();
            throw err;
        }
    }

    private onSuccess(): void {
        if (this.state === 'half_open') {
            logger.info(`[CircuitBreaker:${this.options.name}] recovered — closing circuit`);
        }
        this.failureCount = 0;
        this.state = 'closed';
        this.halfOpenAttempts = 0;
    }

    private onFailure(): void {
        this.failureCount++;
        this.lastFailureAt = Date.now();

        if (this.state === 'half_open') {
            this.halfOpenAttempts++;
        }

        if (this.failureCount >= this.options.failureThreshold) {
            this.trip();
        }
    }

    private trip(): void {
        this.state = 'open';
        this.lastFailureAt = Date.now();
        logger.error(
            `[CircuitBreaker:${this.options.name}] tripped — circuit OPEN for ${this.options.resetTimeoutMs}ms`
        );
    }

    reset(): void {
        this.state = 'closed';
        this.failureCount = 0;
        this.halfOpenAttempts = 0;
    }
}

export const lightragBreaker = new CircuitBreaker({ name: 'lightrag', failureThreshold: 3, resetTimeoutMs: 120_000 });
export const geminiBreaker = new CircuitBreaker({ name: 'gemini', failureThreshold: 5, resetTimeoutMs: 60_000 });
