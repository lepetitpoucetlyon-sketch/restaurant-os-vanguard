import { Nexus } from '@/lib/nexus/NexusAdapter';
import { encryptBankToken, decryptBankToken } from './tokenCipher';

export interface StoredBankConnection {
    provider: string;
    encryptedUserToken: string;
    status: 'active' | 'error' | 'disconnected';
    connectedAt: string;
    lastSyncAt?: string;
}

const path = (tenantId: string) => `tenants/${tenantId}/banking/connection`;

export class BankConnectionStore {
    static async get(tenantId: string): Promise<StoredBankConnection | null> {
        return Nexus.adapter.get<StoredBankConnection>(path(tenantId));
    }

    static async saveUserToken(tenantId: string, provider: string, userToken: string): Promise<void> {
        const record: StoredBankConnection = {
            provider,
            encryptedUserToken: encryptBankToken(userToken),
            status: 'active',
            connectedAt: new Date().toISOString(),
        };
        await Nexus.adapter.set(path(tenantId), record, { merge: true });
    }

    static async markSynced(tenantId: string): Promise<void> {
        await Nexus.adapter.set(path(tenantId), { lastSyncAt: new Date().toISOString() }, { merge: true });
    }

    static decryptToken(connection: StoredBankConnection): string {
        return decryptBankToken(connection.encryptedUserToken);
    }
}
