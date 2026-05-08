export enum AuditPulseType {
    ACCESS_DENIED = 'ACCESS_DENIED',
    ILLEGAL_DELETE_ATTEMPT = 'ILLEGAL_DELETE_ATTEMPT',
    STORAGE_WRITE = 'STORAGE_WRITE',
    STORAGE_DELETE = 'STORAGE_DELETE',
    // 🧠 Intelligence Layer — Sanitized Pulse Protocol
    PULSE_EMITTED = 'PULSE_EMITTED',
    PULSE_BLOCKED = 'PULSE_BLOCKED',
    PII_DETECTED = 'PII_DETECTED',
    LEGACY_INGESTION = 'LEGACY_INGESTION',
    KNOWLEDGE_QUERY = 'KNOWLEDGE_QUERY',
}

export interface AuditPulse {
    pulse: AuditPulseType;
    vassalId: string;
    actorId: string;
    payload: Record<string, any>;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    timestamp: string;
}
