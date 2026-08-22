import { Nexus } from '@/lib/nexus/NexusAdapter';
import { piiVault } from '@/shared/nexus/vault/PiiVault';
import { auditService } from '../../securite/audit/AuditService';

const COLLECTIONS_WITH_SUBJECT_REF = [
    'orders',
    'reservations',
    'invoices',
    'quotes',
    'customers',
] as const;

interface ErasureResult {
    subjectId: string;
    vaultErased: boolean;
    collectionsAnonymized: string[];
    auditRecorded: boolean;
}

export class ErasureService {
    async eraseSubject(
        tenantId: string,
        subjectId: string,
        requestedBy: string,
    ): Promise<ErasureResult> {
        const result: ErasureResult = {
            subjectId,
            vaultErased: false,
            collectionsAnonymized: [],
            auditRecorded: false,
        };

        result.vaultErased = await piiVault.erase(tenantId, subjectId);

        for (const collection of COLLECTIONS_WITH_SUBJECT_REF) {
            const path = `tenants/${tenantId}/${collection}`;
            const docs = await Nexus.adapter.query<{ id?: string; subjectId?: string; customerId?: string }>(
                path,
                { where: [{ field: 'customerId', operator: '==', value: subjectId }] }
            );

            for (const doc of docs) {
                const docId = doc.id ?? (doc as unknown as { id: string }).id;
                if (!docId) continue;

                await Nexus.adapter.set(`${path}/${docId}`, {
                    ...doc,
                    customerName: '[EFFACÉ]',
                    customerEmail: undefined,
                    customerPhone: undefined,
                });
            }

            if (docs.length > 0) {
                result.collectionsAnonymized.push(collection);
            }
        }

        try {
            await auditService.record({
                tenantId,
                actorId: requestedBy,
                actorRole: 'dpo',
                action: 'delete',
                collection: 'piiVault',
                entityId: subjectId,
                metadata: {
                    type: 'gdpr_erasure',
                    collectionsAnonymized: result.collectionsAnonymized,
                },
            });
            result.auditRecorded = true;
        } catch {
            // Audit failure should not block erasure
        }

        return result;
    }
}

export const erasureService = new ErasureService();
