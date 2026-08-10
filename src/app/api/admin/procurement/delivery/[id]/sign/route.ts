import { NextRequest, NextResponse } from 'next/server';
import { ProcurementBridge } from '@/modules/logistics';
import { DeliveryNote } from '@/modules/logistics';
import { LogisticsErrorCode, CoreErrorCode } from '@/shared/nexus/contracts/errors.types';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';

/**
 * 🏛️ Route: Sign Delivery Note - Grade X+++
 * Suture Financière Automatique après validation logistique.
 * Auth : JWT vérifié — le tenant vient du token.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const caller = await requireTenantAdmin(request);
        if (isDenied(caller)) return caller;
        const tenantId = caller.tenantId;

        const body = await request.json();
        const deliveryNote = body as DeliveryNote;

        const { id } = await context.params;
        if (!deliveryNote || deliveryNote.id !== id) {
            return NextResponse.json({
                success: false,
                error: LogisticsErrorCode.INVENTORY_DRIFT,
                metadata: { version: 'v2', timestamp: new Date().toISOString() }
            }, { status: 400 });
        }

        // Exécution de la Suture via ProcurementBridge
        const signatureHash = await ProcurementBridge.signDeliveryNote(deliveryNote, tenantId);

        return NextResponse.json({
            success: true,
            data: { signatureHash },
            metadata: { version: 'v2', timestamp: new Date().toISOString() }
        });

    } catch (_error) {
        return NextResponse.json({
            success: false,
            error: CoreErrorCode.INTERNAL_CRASH,
            metadata: { version: 'v2', timestamp: new Date().toISOString() }
        }, { status: 500 });
    }
}
