import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthProvider, DecodedAuthToken } from '@/lib/auth/ServerAuthProvider';
import { headers } from 'next/headers';
import { NexusError, NexusErrorCode } from '@/shared/nexus/errors';
export async function verifySession(requestOrTenant?: NextRequest | Request | string): Promise<DecodedAuthToken | null> {
    let authHeader: string | null = null;
    
    if (typeof requestOrTenant === 'object' && requestOrTenant !== null && 'headers' in requestOrTenant) {
        authHeader = (requestOrTenant as Request).headers.get('authorization');
    } else {
        try {
            const h = await headers();
            authHeader = h.get('authorization');
        } catch {
            // Ignore headers() error
        }
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    if (!token) return null;

    try {
        const provider = getServerAuthProvider();
        return await provider.verifyIdToken(token);
    } catch (error) {
        console.error('[verifySession] Invalid token:', error);
        return null;
    }
}

/**
 * Variante fail-closed : lève si la session est invalide.
 * À utiliser dans toute Server Action. `verifySession` (nullable) reste
 * disponible pour les routes API qui gèrent elles-mêmes la réponse 401.
 */
export async function requireSession(tenantId: string, request?: NextRequest | Request): Promise<DecodedAuthToken> {
    const decoded = await verifySession(request);
    if (!decoded) {
        throw new NexusError(NexusErrorCode.ACCESS_DENIED, 'Session invalide ou expirée');
    }
    if (decoded.tenantId && decoded.tenantId !== tenantId) {
        throw new NexusError(NexusErrorCode.ACCESS_DENIED, 'Jeton émis pour un autre tenant');
    }
    return decoded;
}

export function unauthorizedResponse() {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
    });
}
