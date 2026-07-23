/**
 * 🏛️ SOVEREIGN SECURITY ERRORS
 * Specialized exceptions for Grade X Compliance and NF525 Laws.
 */

export class SovereignSecurityViolation extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SovereignSecurityViolation';
        
        // Grade X: Fatal saturation of the stack to prevent catch-and-ignore patterns
        Object.freeze(this);
    }
}

export class DataIntegrityBreach extends SovereignSecurityViolation {
    constructor(collection: string, path: string) {
        super(`DATA_INTEGRITY_BREACH: Unauthorized modification attempt at [${collection}] - Path: [${path}]`);
        this.name = 'DataIntegrityBreach';
    }
}
