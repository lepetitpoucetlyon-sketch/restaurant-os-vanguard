import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Chiffrement au repos des jetons bancaires (AES-256-GCM).
 * Clé dérivée de BANKING_TOKEN_ENCRYPTION_KEY (jamais stockée en clair en base).
 */
function getKey(): Buffer {
    const secret = process.env.BANKING_TOKEN_ENCRYPTION_KEY;
    if (!secret) {
        throw new Error('❌ SÉCURITÉ : BANKING_TOKEN_ENCRYPTION_KEY manquant. Impossible de chiffrer un jeton bancaire.');
    }
    // SHA-256 du secret → clé 32 octets valide pour AES-256, quelle que soit la longueur fournie.
    return createHash('sha256').update(secret).digest();
}

export function encryptBankToken(plainText: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join('.');
}

export function decryptBankToken(payload: string): string {
    const [ivB64, authTagB64, ciphertextB64] = payload.split('.');
    if (!ivB64 || !authTagB64 || !ciphertextB64) {
        throw new Error('Jeton bancaire chiffré malformé.');
    }
    const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
    const plain = Buffer.concat([decipher.update(Buffer.from(ciphertextB64, 'base64')), decipher.final()]);
    return plain.toString('utf8');
}

/**
 * `state` OAuth signé — porte le tenantId à travers la redirection externe
 * (webview de l'agrégateur) sans exiger un Bearer token sur le callback,
 * qui arrive comme une navigation top-level classique, pas un fetch authentifié.
 */
export function signBankConnectState(tenantId: string, ttlMs = 10 * 60 * 1000): string {
    const expiresAt = Date.now() + ttlMs;
    const payload = `${tenantId}:${expiresAt}`;
    const mac = createHmac('sha256', getKey()).update(payload).digest('base64url');
    return `${Buffer.from(payload).toString('base64url')}.${mac}`;
}

export function verifyBankConnectState(state: string): string {
    const [payloadB64, mac] = state.split('.');
    if (!payloadB64 || !mac) throw new Error('État de connexion bancaire invalide.');
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const expectedMac = createHmac('sha256', getKey()).update(payload).digest('base64url');
    if (mac.length !== expectedMac.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(expectedMac))) {
        throw new Error('État de connexion bancaire falsifié.');
    }
    const [tenantId, expiresAtStr] = payload.split(':');
    if (!tenantId || Date.now() > Number(expiresAtStr)) {
        throw new Error('État de connexion bancaire expiré.');
    }
    return tenantId;
}
