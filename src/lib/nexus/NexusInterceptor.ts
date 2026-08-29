import { INexusAdapter, INexusBatch, INexusTransaction, NexusContext } from './types';
import { SovereignData } from '@/shared/nexus-contract';
import type { SovereignGuard } from '@/shared/nexus/guards/SovereignGuard';
import { NexusTelemetryService } from '@/shared/nexus/telemetry/NexusTelemetryService';
import { AuditPulseType } from '@/shared/nexus/telemetry/types';
import { NexusError, NexusErrorCode } from '@/shared/nexus/errors';
import { IQueryOptions } from '@/shared/nexus/contracts/infrastructure/storage.contracts';
 
import { auditService } from '@/shared/nexus/vault/audits/audit/AuditService';
import { isSuzerainTenant } from './utils/tenantPath';

/**
 * 🛰️ NexusInterceptor - Grade X Middleware
 * Encapsulates SovereignGuard, Tenant Scoping, and NF525 Fiscal Compliance.
 * Shields raw adapters from complex business logic.
 */
export class NexusInterceptor implements INexusAdapter {
    constructor(
        private readonly adapter: INexusAdapter,
        private readonly guard: typeof SovereignGuard,
        private readonly tenantProvider: () => string | null
    ) {
        auditService.setNexus(this.adapter as Parameters<typeof auditService.setNexus>[0]);
    }

    async get<T = unknown>(path: string, context?: NexusContext): Promise<T | null> {
        const ctx = this.ensureContext(context);
        return this.intercept('READ', path, ctx, () => this.adapter.get<T>(this.scopePath(path, ctx.vassalId)));
    }

    async query<T = unknown>(collectionPath: string, options?: IQueryOptions, context?: NexusContext): Promise<T[]> {
        const ctx = this.ensureContext(context);
        return this.intercept('READ', collectionPath, ctx, () =>
            this.adapter.query<T>(this.scopePath(collectionPath, ctx.vassalId), options)
        );
    }

    onSnapshot<T = unknown>(
        path: string, 
        callback: (data: T) => void, 
        options?: IQueryOptions & { onError?: (error: Error) => void },
        context?: NexusContext
    ): () => void {
        const ctx = this.ensureContext(context);

        // Guard-First Listener Pattern (Grade X+++ Security)
        // The adapter listener is NOT started until access validation completes.
        // This eliminates the race condition where data could transit before denial.
        let innerUnsubscribe: (() => void) | null = null;
        let isUnsubscribed = false;

        const initListener = async () => {
            // Step 1: Validate access BEFORE subscribing to any data (scoped path — même raison que intercept)
            const scopedForValidation = this.scopePath(path, ctx.vassalId);
            let access: { granted: boolean; reason?: string };
            try {
                access = await this.guard.validateAccessGradeX('READ', scopedForValidation, ctx);
            } catch (error) {
                // emitDenial est async : sans .catch() son rejet remonte en
                // unhandledRejection hors de toute pile appelante.
                void this.emitDenial('READ', path, ctx, error instanceof Error ? error.message : 'VALIDATION_EXCEPTION').catch(() => {});
                options?.onError?.(new NexusError(NexusErrorCode.ACCESS_DENIED, 'Access validation failed'));
                return; // No listener started, no data transmitted
            }

            // Step 2: If denied, emit denial and do NOT start the listener
            if (!access.granted) {
                void this.emitDenial('READ', path, ctx, access.reason || 'ACCESS_DENIED').catch(() => {});
                options?.onError?.(new NexusError(NexusErrorCode.ACCESS_DENIED, 'Access denied'));
                return; // No listener started, no data transmitted
            }

            // Step 3: If caller already unsubscribed while we were validating, bail out
            if (isUnsubscribed) return;

            // Step 4: Access granted — NOW start the real listener
            innerUnsubscribe = this.adapter.onSnapshot<T>(
                this.scopePath(path, ctx.vassalId),
                callback,
                options
            );
        };

        // Fire the init (no await — onSnapshot must return synchronously).
        // Le .catch() est OBLIGATOIRE : sans lui, toute exception levée par
        // l'adapter sous-jacent (chemin invalide, adapter non initialisé…) devient
        // un unhandledRejection que personne ne voit, et le `onError` fourni par
        // l'appelant n'est jamais honoré. C'est ainsi qu'un bug de polling dans
        // SimulacraAdapter a pu inonder la console ~500 fois/minute sans alerte.
        initListener().catch((error: unknown) => {
            options?.onError?.(error instanceof Error ? error : new Error(String(error)));
        });

        // Return a stable unsubscribe that works even during validation
        return () => {
            isUnsubscribed = true;
            if (innerUnsubscribe) innerUnsubscribe();
        };
    }

    batch(): INexusBatch {
        const ctx = this.ensureContext();
        const rawBatch = this.adapter.batch();
        const ops: { type: string, path: string }[] = [];
        // ⚠️ validateAccess est ASYNC : l'appeler sans await dans ces closures
        // synchrones laissait passer TOUTE écriture batch (cross-tenant + NF525)
        // avec un rejet flottant. On accumule les gardes et on les attend au
        // commit, AVANT le rawBatch.commit — rien n'est écrit si une garde jette.
        const pendingGuards: Promise<unknown>[] = [];
        const pendingWrites: Array<() => Promise<void>> = [];

        return {
            set: (path, data) => {
                const scopedPath = this.scopePath(path, ctx.vassalId);
                pendingGuards.push(this.guard.validateAccess(scopedPath, ctx.vassalId));
                pendingWrites.push(async () => {
                    const protectedData = await this.guard.protectWrite(scopedPath, data as SovereignData, ctx.vassalId);
                    rawBatch.set(scopedPath, protectedData);
                });
                ops.push({ type: 'SET', path: scopedPath });
            },
            update: (path, data) => {
                const scopedPath = this.scopePath(path, ctx.vassalId);
                if (!this.guard.canUpdate(path)) {
                    throw new NexusError(NexusErrorCode.NF525_VIOLATION, 'Cannot update a fiscally sealed document in batch');
                }
                pendingGuards.push(this.guard.validateAccess(scopedPath, ctx.vassalId));
                pendingWrites.push(async () => {
                    const protectedData = await this.guard.protectWrite(scopedPath, data as SovereignData, ctx.vassalId);
                    rawBatch.update(scopedPath, protectedData as Partial<unknown>);
                });
                ops.push({ type: 'UPDATE', path: scopedPath });
            },
            increment: (path, field, amount) => {
                const scopedPath = this.scopePath(path, ctx.vassalId);
                pendingGuards.push(this.guard.validateAccess(scopedPath, ctx.vassalId));
                rawBatch.increment(scopedPath, field, amount);
                ops.push({ type: 'INCREMENT', path: scopedPath });
            },
            delete: (path) => {
                const scopedPath = this.scopePath(path, ctx.vassalId);
                if (!this.guard.canDelete(path)) {
                    throw new NexusError(NexusErrorCode.NF525_VIOLATION, 'Cannot delete a fiscally sealed document in batch');
                }
                pendingGuards.push(this.guard.validateAccess(scopedPath, ctx.vassalId));
                rawBatch.delete(scopedPath);
                ops.push({ type: 'DELETE', path: scopedPath });
            },
            commit: async () => {
                // Barrière de sécurité : toutes les gardes doivent passer avant l'écriture.
                await Promise.all(pendingGuards);
                await Promise.all(pendingWrites.map(fn => fn()));
                await rawBatch.commit();
                if (ops.length > 0) {
                    await NexusTelemetryService.emit({
                        pulse: AuditPulseType.STORAGE_WRITE, // Batch counts as a write pulse
                        vassalId: ctx.vassalId,
                        actorId: ctx.actorId,
                        payload: {
                            batchSize: ops.length,
                            operations: ops.map(o => ({ type: o.type, path: this.sanitizePath(o.path) }))
                        },
                        severity: 'INFO',
                        timestamp: new Date().toISOString(),
                    });
                }
            }
        };
    }

    async set<T = unknown>(path: string, data: T, options?: { merge?: boolean }, context?: NexusContext): Promise<void> {
        const ctx = this.ensureContext(context);
        return this.intercept('WRITE', path, ctx, async () => {
            const protectedData = await this.guard.protectWrite(this.scopePath(path, ctx.vassalId), data as unknown as SovereignData, ctx.vassalId);
            return this.adapter.set(this.scopePath(path, ctx.vassalId), protectedData, options);
        });
    }

    async update<T = unknown>(path: string, data: Partial<T>, context?: NexusContext): Promise<void> {
        const ctx = this.ensureContext(context);
        return this.intercept('UPDATE', path, ctx, () =>
            this.adapter.runTransaction(async (tx) => {
                const scopedPath = this.scopePath(path, ctx.vassalId);
                const existing = await tx.get<T>(scopedPath);
                const merged = { ...existing, ...data } as unknown as SovereignData;
                const protectedData = await this.guard.protectWrite(scopedPath, merged, ctx.vassalId);
                tx.update(scopedPath, protectedData);
            })
        );
    }

    async runTransaction<T>(callback: (tx: INexusTransaction) => Promise<T>, context?: NexusContext): Promise<T> {
        const ctx = this.ensureContext(context);
        return this.adapter.runTransaction(async (rawTx) => {
            const guardedTx: INexusTransaction = {
                get: (path) => rawTx.get(this.scopePath(path, ctx.vassalId)),
                set: (path, data) => {
                    const scoped = this.scopePath(path, ctx.vassalId);
                    return rawTx.set(scoped, data);
                },
                update: (path, data) => {
                    const scoped = this.scopePath(path, ctx.vassalId);
                    if (!this.guard.canUpdate(scoped)) {
                        throw new NexusError(NexusErrorCode.NF525_VIOLATION, `Cannot update immutable/sealed document in transaction: ${scoped}`);
                    }
                    return rawTx.update(scoped, data);
                },
                delete: (path) => {
                    const scoped = this.scopePath(path, ctx.vassalId);
                    if (!this.guard.canDelete(scoped)) {
                        throw new NexusError(NexusErrorCode.NF525_VIOLATION, `Cannot delete immutable/sealed document in transaction: ${scoped}`);
                    }
                    return rawTx.delete(scoped);
                },
            };
            return callback(guardedTx);
        });
    }

    async increment(path: string, field: string, amount: number, context?: NexusContext): Promise<void> {
        const ctx = this.ensureContext(context);
        return this.intercept('WRITE', path, ctx, () => this.adapter.increment(this.scopePath(path, ctx.vassalId), field, amount));
    }

    async create<T = unknown>(path: string, data: T, context?: NexusContext): Promise<void> {
        const ctx = this.ensureContext(context);
        return this.intercept('WRITE', path, ctx, async () => {
            const protectedData = await this.guard.protectWrite(this.scopePath(path, ctx.vassalId), data as unknown as SovereignData, ctx.vassalId);
            return this.adapter.create(this.scopePath(path, ctx.vassalId), protectedData);
        });
    }

    async delete(path: string, context?: NexusContext): Promise<void> {
        const ctx = this.ensureContext(context);
        return this.intercept('DELETE', path, ctx, () => this.adapter.delete(this.scopePath(path, ctx.vassalId)));
    }

    generateId(collectionPath: string): string {
        return this.adapter.generateId(collectionPath);
    }

    serverTimestamp(): import('@/shared/nexus/contracts/infrastructure/storage.contracts').NexusTimestamp {
        return this.adapter.serverTimestamp();
    }

    // --- Private Infrastructure ---

    private async intercept<R>(
        operation: 'READ' | 'WRITE' | 'DELETE' | 'UPDATE',
        path: string,
        context: NexusContext,
        action: () => Promise<R>
    ): Promise<R> {
        // 1. Validation d'accès — utiliser le path scopé pour éviter le faux positif :
        // 'categories' → pathTenantId='main' vs currentTenant='lepetitpoucet' déclenchait fail-safe.
        // Le batch fait déjà ça correctement (scopedPath avant validateAccess).
        const scopedForValidation = this.scopePath(path, context.vassalId);
        const accessResult = await this.guard.validateAccessGradeX(operation, scopedForValidation, context);
        if (!accessResult.granted) {
            // Access denied — emit telemetry and throw
            const reason = accessResult.reason || 'ACCESS_DENIED';
            const code = reason.includes('NF525') ? NexusErrorCode.NF525_VIOLATION : NexusErrorCode.ACCESS_DENIED;
            await this.emitDenial(operation, path, context, reason);
            const error = new NexusError(code, `Operation ${operation} refused on ${this.sanitizePath(path)}: ${reason}`);
            error.code = code; // Explicitly set it again
            throw error;
        }

        // 2. Compliance NF525
        if (operation === 'DELETE') {
            const isSealed = await this.guard.isFiscallySealed(path, context);
            if (isSealed) {
                await NexusTelemetryService.emit({
                    pulse: AuditPulseType.ILLEGAL_DELETE_ATTEMPT,
                    vassalId: context.vassalId,
                    actorId: context.actorId,
                    payload: { path: this.sanitizePath(path) },
                    severity: 'CRITICAL',
                    timestamp: new Date().toISOString(),
                });
                throw new NexusError(NexusErrorCode.NF525_VIOLATION, 'Cannot delete a fiscally sealed document');
            }
        }

        if (operation === 'UPDATE') {
            const isSealed = await this.guard.isFiscallySealed(path, context);
            if (isSealed || !this.guard.canUpdate(path)) {
                await NexusTelemetryService.emit({
                    pulse: AuditPulseType.ILLEGAL_WRITE_ATTEMPT,
                    vassalId: context.vassalId,
                    actorId: context.actorId,
                    payload: { path: this.sanitizePath(path) },
                    severity: 'CRITICAL',
                    timestamp: new Date().toISOString(),
                });
                throw new NexusError(NexusErrorCode.NF525_VIOLATION, 'Cannot update a fiscally sealed document');
            }
        }

        // 3. Execution
        const result = await action();

        // 4. Telemetry on Success
        if (operation === 'WRITE' || operation === 'DELETE') {
            await NexusTelemetryService.emit({
                pulse: operation === 'WRITE' ? AuditPulseType.STORAGE_WRITE : AuditPulseType.STORAGE_DELETE,
                vassalId: context.vassalId,
                actorId: context.actorId,
                payload: {
                    path: this.sanitizePath(path),
                    operation,
                },
                severity: 'INFO',
                timestamp: new Date().toISOString(),
            });

            // 4b. Audit log for sensitive collections (T07)
            const collection = this.extractCollection(path);
            if (collection && auditService.isAuditedCollection(collection)) {
                const entityId = this.extractEntityId(path);
                auditService.record({
                    tenantId: context.vassalId,
                    actorId: context.actorId,
                    actorRole: 'system',
                    action: operation === 'DELETE' ? 'delete' : 'update',
                    collection,
                    entityId,
                }).catch(() => {});
            }
        }

        return result;
    }

    private async emitDenial(operation: string, path: string, context: NexusContext, reason: string) {
        await NexusTelemetryService.emit({
            pulse: AuditPulseType.ACCESS_DENIED,
            vassalId: context.vassalId,
            actorId: context.actorId,
            payload: {
                operation,
                path: this.sanitizePath(path),
                reason,
            },
            severity: 'WARNING',
            timestamp: new Date().toISOString(),
        });
    }

    private sanitizePath(path: string): string {
        return path.replace(/tenants\/[^/]+\//g, 'vassals/[REDACTED]/');
    }

    private scopePath(path: string, vassalId: string): string {
        if (!vassalId || isSuzerainTenant(vassalId)) return path;
        
        // If path is already scoped to a tenant
        if (path.startsWith('tenants/')) {
            const parts = path.split('/');
            const pathTenantId = parts[1];
            // If it's the same tenant, return as is
            if (pathTenantId === vassalId) return path;
            // If it's another tenant, we keep it as is and let SovereignGuard block it
            return path;
        }
        
        return `tenants/${vassalId}/${path}`;
    }

    private extractCollection(path: string): string | null {
        // tenants/{tenantId}/{collection}/{id} → collection
        // or {collection}/{id} → collection
        const parts = path.split('/').filter(Boolean);
        if (parts[0] === 'tenants' && parts.length >= 3) return parts[2] ?? null;
        return parts[0] ?? null;
    }

    private extractEntityId(path: string): string | undefined {
        const parts = path.split('/').filter(Boolean);
        if (parts[0] === 'tenants' && parts.length >= 4) return parts[3];
        if (parts.length >= 2) return parts[1];
        return undefined;
    }

    private ensureContext(context?: NexusContext): NexusContext {
        if (context) return context;
        // Fallback to active tenant from Nexus manager
        return {
            vassalId: this.tenantProvider() || 'main',
            actorId: 'system'
        };
    }
}
