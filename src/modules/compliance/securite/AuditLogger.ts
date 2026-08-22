/**
 * Re-export canonique pour rétro-compatibilité interne au module compliance.
 * L'implémentation est hébergée dans src/lib/mcc/audit/AuditLogger.ts (ADR-015).
 */
export { AuditLogger, type AuditAction, type AuditLog, type AuditLogOptions } from '@/lib/mcc/audit/AuditLogger';
