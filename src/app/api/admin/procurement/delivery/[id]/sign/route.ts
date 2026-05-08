import { NextRequest, NextResponse } from 'next/server';
import { ProcurementBridge } from '@/domain/procurement/ProcurementBridge';
import { DeliveryNote } from '@/domain/procurement/types';
import { LogisticsErrorCode, CoreErrorCode } from '@/shared/nexus/contracts/errors.types';

/**
 * 🏛️ Route: Sign Delivery Note - Grade X+++
 * Suture Financière Automatique après validation logistique.
 */
export async function POST(
    request: NextRequest,
    context: { params: { id: string } }
) {
    try {
        // 🛡️ HIDDEN DOOR PATTERN
        const tenantId = request.headers.get('x-nexus-tenant-id');
        if (tenantId !== 'restaurant-os') {
            return NextResponse.json({
                success: false,
                error: CoreErrorCode.NEXUS_SYNC_ERROR,
                metadata: { version: 'v2', timestamp: new Date().toISOString() }
            }, { status: 404 });
        }

        const body = await request.json();
        const deliveryNote = body as DeliveryNote;

        if (!deliveryNote || deliveryNote.id !== context.params.id) {
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

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: CoreErrorCode.INTERNAL_CRASH,
            metadata: { version: 'v2', timestamp: new Date().toISOString() }
        }, { status: 500 });
    }
}
