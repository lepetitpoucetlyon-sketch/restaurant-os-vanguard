import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';

interface RolloutPayload {
    type: 'menu' | 'config' | 'template';
    sourceData: Record<string, unknown>;
}

interface RolloutResult {
    tenantId: string;
    success: boolean;
    error?: string;
}

export const FleetRollout = {
    async deployToSites(
        sourceTenantId: string,
        targetTenantIds: string[],
        payload: RolloutPayload,
        operatorId: string
    ): Promise<RolloutResult[]> {
        const results: RolloutResult[] = [];

        for (const targetId of targetTenantIds) {
            try {
                const collection = payload.type === 'menu' ? 'products'
                    : payload.type === 'config' ? 'tenantConfig'
                    : 'roleTemplates';

                for (const [key, value] of Object.entries(payload.sourceData)) {
                    const docId = Nexus.adapter.generateId(`tenants/${targetId}/${collection}`);
                    await Nexus.adapter.set(
                        `tenants/${targetId}/${collection}/${docId}`,
                        { ...(value as Record<string, unknown>), id: docId, sourceRef: `${sourceTenantId}/${key}` } as unknown as import('@/shared/nexus-contract').SovereignData
                    );
                }

                results.push({ tenantId: targetId, success: true });
            } catch (err) {
                results.push({ tenantId: targetId, success: false, error: String(err) });
            }
        }

        empireAudit.log({
            module: 'admin',
            action: 'fleet_rollout',
            userId: operatorId,
            timestamp: new Date(),
            details: {
                type: payload.type,
                source: sourceTenantId,
                targets: targetTenantIds,
                successCount: results.filter(r => r.success).length,
                failCount: results.filter(r => !r.success).length,
            } as unknown as import('@/shared/nexus-contract').SovereignData,
        });

        return results;
    },
};
