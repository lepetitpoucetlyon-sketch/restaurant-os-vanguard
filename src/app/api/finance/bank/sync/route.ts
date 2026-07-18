import { NextResponse } from 'next/server';

/**
 * POST /api/finance/bank/sync
 * Triggers a bank synchronisation via the configured Powens integration.
 * In demo mode, returns a success stub; in production the Powens webhook
 * pushes transactions to the Nexus bankTransactions/ collection directly.
 */
export async function POST() {
    try {
        const clientId = process.env.NEXT_PUBLIC_POWENS_CLIENT_ID;
        const isDemoMode = !clientId || clientId.includes('placeholder') || clientId === 'restaurant-os-master';

        if (isDemoMode) {
            return NextResponse.json({
                success: true,
                isDemoMode: true,
                syncedAt: new Date().toISOString(),
                message: 'Mode démonstration : synchronisation simulée.',
            });
        }

        // Production: call Powens API to trigger a refresh
        const secret = process.env.POWENS_CLIENT_SECRET;
        if (!secret) {
            return NextResponse.json({ error: 'POWENS_CLIENT_SECRET manquant.' }, { status: 503 });
        }

        // Trigger account refresh via Powens management endpoint
        const res = await fetch(`https://sandbox.biapi.pro/2.0/connections`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${secret}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Erreur Powens lors de la synchronisation.' }, { status: 502 });
        }

        return NextResponse.json({ success: true, syncedAt: new Date().toISOString() });
    } catch (_err) {
        return NextResponse.json({ error: 'Erreur interne lors de la synchronisation.' }, { status: 500 });
    }
}
