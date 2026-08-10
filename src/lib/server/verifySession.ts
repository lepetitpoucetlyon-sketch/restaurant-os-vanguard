import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthProvider, DecodedAuthToken } from '@/lib/auth/ServerAuthProvider';
import { headers } from 'next/headers';

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

export function unauthorizedResponse() {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
    });
}
