import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { BankConnectionStore } from '@/modules/finance';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { logger } from '@/lib/logger';

/**
 * GET /api/finance/bank/connection
 * Retourne l'état de la connexion bancaire du tenant (sans le token chiffré).
 */
export async function GET(request: NextRequest) {
    try {
        const caller = await requireTenantAdmin(request);
        if (isDenied(caller)) return caller;
        const { tenantId } = caller;

        const connection = await BankConnectionStore.get(tenantId);
        if (!connection) return NextResponse.json({ connected: false });

        return NextResponse.json({
            connected: connection.status === 'active',
            provider: connection.provider,
            status: connection.status,
            connectedAt: connection.connectedAt,
            lastSyncAt: connection.lastSyncAt ?? null,
        });
    } catch (err) {
        logger.error('[BankConnection] GET', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

/**
 * DELETE /api/finance/bank/connection
 * Révoque la connexion bancaire du tenant (marque disconnected, efface le token).
 * Auth : admin/manager du tenant. Le tenant vient toujours du token.
 */
export async function DELETE(request: NextRequest) {
    try {
        const caller = await requireTenantAdmin(request);
        if (isDenied(caller)) return caller;
        const { tenantId } = caller;

        const connection = await BankConnectionStore.get(tenantId);
        if (!connection || connection.status === 'disconnected') {
            return NextResponse.json({ ok: true, alreadyDisconnected: true });
        }

        await BankConnectionStore.disconnect(tenantId);

        await NexusEventBus.emitDurable('finance.bank_disconnected', {
            v: 1,
            tenantId,
            provider: connection.provider,
            disconnectedAt: Date.now(),
        });

        logger.info(`[BankConnection] Tenant ${tenantId} a révoqué sa connexion ${connection.provider}`);
        return NextResponse.json({ ok: true, provider: connection.provider });
    } catch (err) {
        logger.error('[BankConnection] DELETE', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
