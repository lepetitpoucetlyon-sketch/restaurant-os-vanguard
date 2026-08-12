import { OperationalIdentity } from '@nexus/contracts/nexus-contract';

export interface DomainMetadata {
    path: string;
    requiredPermission: string;
}

export const domainMapping: Record<OperationalIdentity, DomainMetadata> = {
    [OperationalIdentity.CORE]: { path: 'nexus_core', requiredPermission: 'core.view' },
    [OperationalIdentity.FINANCE]: { path: 'ledgers', requiredPermission: 'finance.view' },
    [OperationalIdentity.OPS]: { path: 'operations', requiredPermission: 'ops.view' },
    [OperationalIdentity.HR]: { path: 'staff', requiredPermission: 'hr.view' },
    [OperationalIdentity.CRM]: { path: 'customers', requiredPermission: 'crm.view' },
    [OperationalIdentity.LOGISTICS]: { path: 'inventory', requiredPermission: 'logistics.view' },
    [OperationalIdentity.COMPLIANCE]: { path: 'compliance_logs', requiredPermission: 'compliance.view' },
    [OperationalIdentity.INTELLIGENCE]: { path: 'ai_insights', requiredPermission: 'intelligence.view' },
    // Sub-domains Ops
    [OperationalIdentity.NODES]: { path: 'ops_nodes', requiredPermission: 'ops.nodes' },
    [OperationalIdentity.ZONES]: { path: 'ops_zones', requiredPermission: 'ops.zones' },
    [OperationalIdentity.RESOURCES]: { path: 'ops_resources', requiredPermission: 'ops.resources' },
    [OperationalIdentity.FLOWS]: { path: 'ops_flows', requiredPermission: 'ops.flows' },
    [OperationalIdentity.RELATIONS]: { path: 'ops_relations', requiredPermission: 'ops.relations' },
    // Sub-domains Sovereign
    [OperationalIdentity.ALLOCATIONS]: { path: 'ops_allocations', requiredPermission: 'sovereign.allocations' },
    [OperationalIdentity.PROTOCOLS]: { path: 'ops_protocols', requiredPermission: 'sovereign.protocols' },
    [OperationalIdentity.STRUCTURES]: { path: 'ops_structures', requiredPermission: 'sovereign.structures' },
    [OperationalIdentity.STAFF]: { path: 'staff_records', requiredPermission: 'hr.records' },
    [OperationalIdentity.LEDGER]: { path: 'fiscal_ledger', requiredPermission: 'finance.ledger' },
};

/**
 * 🏛️ DomainRegistry - Mapping Injection Guard
 */
export class DomainRegistry {
    private static mapping: Record<string, string> = {};

    static initialize(mapping: Record<string, string>) {
        DomainRegistry.mapping = mapping;
    }

    static resolve(identity: OperationalIdentity | string): string {
        const metadata = DomainRegistry.mapping[identity] || domainMapping[identity as OperationalIdentity];
        if (!metadata) {
            console.warn(`[Nexus] Unregistered identity: ${identity} - Using fallback metadata`);
            return typeof identity === 'string' ? identity : 'unknown';
        }
        return typeof metadata === 'string' ? metadata : metadata.path;
    }

    static getMetadata(identity: OperationalIdentity | string): DomainMetadata {
        const metadata = DomainRegistry.mapping[identity] || domainMapping[identity as OperationalIdentity];
        if (!metadata) {
            console.warn(`[Nexus] Unregistered identity: ${identity} - Using fallback metadata`);
            return { path: typeof identity === 'string' ? identity : 'unknown', requiredPermission: 'core.view' };
        }
        return typeof metadata === 'string' ? { path: metadata, requiredPermission: 'core.view' } : metadata;
    }
}
