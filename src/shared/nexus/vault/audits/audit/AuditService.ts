import { CryptoService } from '@/lib/CryptoService';
import { AuditEventSchema, AUDITED_COLLECTIONS, type AuditAction, type AuditEvent } from '@/shared/schemas';
import { operationalFlags } from '@/config/features';
import { logger } from '@/lib/logger';
import { JsonObject } from "@/shared/types/json";

const GENESIS_HASH = 'AUDIT_GENESIS_0000000000000000';

interface AuditPayload {
    tenantId: string;
    actorId: string;
    actorRole: string;
    action: AuditAction;
    collection: string;
    entityId?: string;
    subjectId?: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

type NexusWriter = {
    set<T>(path: string, data: T): Promise<void>;
    query<T>(collectionPath: string, options?: { orderBy?: string; orderDirection?: 'asc' | 'desc'; limit?: number }): Promise<T[]>;
    generateId(collectionPath: string): string;
};

export class AuditService {
    private previousHash: string = GENESIS_HASH;
    private initialized = false;
    private nexus: NexusWriter | null = null;

    setNexus(nexus: NexusWriter) {
        this.nexus = nexus;
    }

    async init(tenantId: string) {
        if (!this.nexus) return;
        if (this.initialized) return;

        const path = `tenants/${tenantId}/auditLog`;
        const lastEvents = await this.nexus.query<AuditEvent>(path, {
            orderBy: 'ts',
            orderDirection: 'desc',
            limit: 1,
        });

        if (lastEvents.length > 0 && lastEvents[0]!.hash) {
            this.previousHash = lastEvents[0]!.hash;
        }

        this.initialized = true;
    }

    isAuditedCollection(collection: string): boolean {
        return (AUDITED_COLLECTIONS as readonly string[]).includes(collection);
    }

    stripPii(data: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
        if (!data) return undefined;
        const PII_KEYS = ['email', 'phone', 'firstName', 'lastName', 'address', 'iban', 'bankAccount', 'ssn'];
        const stripped: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
            if (PII_KEYS.includes(key)) {
                stripped[key] = '[REDACTED]';
            } else {
                stripped[key] = value;
            }
        }
        return stripped;
    }

    async record(payload: AuditPayload): Promise<AuditEvent | null> {
        const mode = operationalFlags.auditIntercept;
        if (mode === 'off') return null;

        if (!this.nexus) {
            logger.warn('[AuditService] No Nexus writer — skipping audit event');
            return null;
        }

        const { tenantId, before, after, ...rest } = payload;

        if (!this.initialized && tenantId) {
            await this.init(tenantId);
        }
        const sanitizedBefore = this.stripPii(before);
        const sanitizedAfter = this.stripPii(after);

        const collectionPath = `tenants/${tenantId}/auditLog`;
        const id = this.nexus.generateId(collectionPath);
        const ts = Date.now();

        const dataForHash = CryptoService.canonicalStringify({
            ...rest,
            tenantId,
            entityId: rest.entityId ?? '',
            ts,
        });

        const hash = await CryptoService.generateHash(dataForHash, this.previousHash);

        const event: AuditEvent = {
            id,
            tenantId,
            ...rest,
            before: sanitizedBefore,
            after: sanitizedAfter,
            ts,
            hash,
            previousHash: this.previousHash,
        };

        const parsed = AuditEventSchema.parse(event);

        if (mode === 'warn') {
            logger.info(`[AuditService] WARN mode — would record: ${parsed.action} on ${parsed.collection}/${parsed.entityId ?? '?'}`);
        }

        await this.nexus.set(`${collectionPath}/${id}`, parsed);
        this.previousHash = hash;

        return parsed;
    }

    /**
     * Exports tenant-scoped audit logs in CSV format.
     */
    async exportAuditLogs(tenantId: string): Promise<string> {
        if (!this.nexus) throw new Error('[AuditService] Nexus adapter not initialized');
        const collectionPath = `tenants/${tenantId}/auditLog`;
        const events = await this.nexus.query<AuditEvent>(collectionPath, {
            orderBy: { field: 'ts', direction: 'asc' } as never
        });

        const header = 'id,ts,action,collection,entityId,userId,hash,previousHash\n';
        const rows = (events || []).map(e => 
            `"${e.id}","${new Date(e.ts).toISOString()}","${e.action}","${e.collection}","${e.entityId || ''}","${(e as JsonObject).actorId || (e as JsonObject).userId || ''}","${e.hash}","${e.previousHash}"`
        ).join('\n');

        return header + rows;
    }
}

export const auditService = new AuditService();
