export enum NexusErrorCode {
    ACCESS_DENIED = 'ACCESS_DENIED',
    NF525_VIOLATION = 'NF525_VIOLATION',
    INFRASTRUCTURE_ERROR = 'INFRASTRUCTURE_ERROR',
    HYDRATION_FAILURE = 'HYDRATION_FAILURE',
    BATCH_ACCESS_DENIED = 'BATCH_ACCESS_DENIED',
}

export class NexusError extends Error {
    public isNexusError = true;
    public code: NexusErrorCode;

    constructor(code: NexusErrorCode, message: string, public payload?: any) {
        super(`[${code}] ${message}`);
        this.code = code;
        this.name = 'NexusError';
        Object.setPrototypeOf(this, NexusError.prototype);
    }
}
