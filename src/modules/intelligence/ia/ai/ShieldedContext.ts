import { logger } from '@/lib/logger';

export class SovereignSecurityViolation extends Error {
    constructor(message: string) {
        super(`🏛️ [SOVEREIGN SECURITY VIOLATION] ${message}`);
        this.name = 'SovereignSecurityViolation';
    }
}

export class ShieldedContext {
    private static contextStack: string[] = [];

    /**
     * Executes synchronous or asynchronous function fn inside a secure tenant sandbox.
     */
    static async run<T>(tenantId: string, fn: () => Promise<T> | T): Promise<T> {
        this.contextStack.push(tenantId);
        logger.info(`[ShieldedContext] Sandbox ENTER: tenantId=${tenantId}`);
        try {
            const result = await fn();
            return result;
        } finally {
            this.contextStack.pop();
            logger.info(`[ShieldedContext] Sandbox EXIT: tenantId=${tenantId}`);
        }
    }

    /**
     * Assert that the active sandbox matches the target tenant access request.
     */
    static assertTenantAccess(targetTenantId: string): void {
        const activeTenant = this.getActiveTenant();
        if (activeTenant && activeTenant !== targetTenantId) {
            throw new SovereignSecurityViolation(
                `Unauthorized data access attempt! Active Context: "${activeTenant}", Requested: "${targetTenantId}"`
            );
        }
    }

    /**
     * Retrieves the current active tenant in the execution thread context.
     */
    static getActiveTenant(): string | null {
        if (this.contextStack.length === 0) return null;
        return this.contextStack[this.contextStack.length - 1];
    }
}
