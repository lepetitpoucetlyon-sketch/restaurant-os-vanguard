import Dexie, { Table } from 'dexie';

/**
 * 🌀 SimulatorDB - Nexus Temporal Sandbox (Grade X)
 * Strictly isolated IndexedDB instance for simulation data.
 * Zero connection to production Firestore.
 */

export interface VirtualDocument {
    path: string;       // Unique document path (e.g., 'tenants/lepetitpoucet/inventory/item1')
    data: import('@/shared/nexus-contract').SovereignValue;      // Serialized document data

    isDeleted: boolean; // Flag to simulate document deletion
    forkId: string;     // ID of the simulation timeline
    updatedAt: string;
}

export class SimulatorDB extends Dexie {
    virtualStore!: Table<VirtualDocument>;

    constructor() {
        super('Nexus_Simulator_Sandbox');
        
        this.version(1).stores({
            virtualStore: 'path, forkId, updatedAt'
        });
    }

    async clearFork(forkId: string) {
        await this.virtualStore.where('forkId').equals(forkId).delete();
    }
}

export const simulatorDb = new SimulatorDB();
