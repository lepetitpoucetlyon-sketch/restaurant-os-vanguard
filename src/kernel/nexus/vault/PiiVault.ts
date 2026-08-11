import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { PiiFields, PiiRecord } from '@/shared/schemas';
import { JsonObject } from "@/shared/types/json";

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

async function deriveKey(subjectId: string, tenantId: string): Promise<CryptoKey> {
    const material = await crypto.subtle.importKey(
        'raw',
        ENCODER.encode(`${tenantId}:${subjectId}`),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: ENCODER.encode(tenantId), iterations: 100_000, hash: 'SHA-256' },
        material,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

async function encrypt(data: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        ENCODER.encode(data)
    );
    const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return btoa(String.fromCharCode(...combined));
}

async function decrypt(encoded: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    );
    return DECODER.decode(plaintext);
}

function fingerprint(subjectId: string): string {
    let hash = 0;
    for (const ch of subjectId) {
        hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

export class PiiVault {
    async store(tenantId: string, subjectId: string, fields: PiiFields): Promise<void> {
        const key = await deriveKey(subjectId, tenantId);
        const payload = await encrypt(JSON.stringify(fields), key);
        const now = new Date().toISOString();

        const record: PiiRecord = {
            subjectId,
            tenantId,
            encryptedPayload: payload,
            keyFingerprint: fingerprint(subjectId),
            createdAt: now,
            updatedAt: now,
        };

        await Nexus.adapter.set(
            `tenants/${tenantId}/piiVault/${subjectId}`,
            record
        );
    }

    async retrieve(tenantId: string, subjectId: string): Promise<PiiFields | null> {
        const record = await Nexus.adapter.get<PiiRecord>(
            `tenants/${tenantId}/piiVault/${subjectId}`
        );
        if (!record) return null;

        const key = await deriveKey(subjectId, tenantId);
        const json = await decrypt(record.encryptedPayload, key);
        return JSON.parse(json) as PiiFields;
    }

    async erase(tenantId: string, subjectId: string): Promise<boolean> {
        const record = await Nexus.adapter.get<PiiRecord>(
            `tenants/${tenantId}/piiVault/${subjectId}`
        );
        if (!record) return false;

        await Nexus.adapter.set(
            `tenants/${tenantId}/piiVault/${subjectId}`,
            {
                ...record,
                encryptedPayload: '',
                keyFingerprint: 'ERASED',
                updatedAt: new Date().toISOString(),
            }
        );
        return true;
    }

    /**
     * RGPD Data Export - Strips sensitive credentials (passwordHash, pin) before export.
     */
    async exportSubjectData(tenantId: string, subjectId: string): Promise<Record<string, unknown> | null> {
        const fields = await this.retrieve(tenantId, subjectId);
        if (!fields) return null;

        const sanitized = { ...(fields as JsonObject) };
        delete sanitized.passwordHash;
        delete sanitized.password;
        delete sanitized.pin;
        delete sanitized.secretKey;

        return {
            subjectId,
            tenantId,
            exportedAt: new Date().toISOString(),
            piiData: sanitized
        };
    }
}

export const piiVault = new PiiVault();
