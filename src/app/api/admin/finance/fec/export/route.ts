import { NextRequest, NextResponse } from 'next/server';
import { FECGenerator } from '@/domain/finance/fec/FECGenerator';
import { DocumentVault } from '@/domain/shared/DocumentVault';
import { FinanceErrorCode, CoreErrorCode } from '@/shared/nexus/contracts/errors.types';
import { JournalEntry } from '@/shared/nexus/contracts/finance.types';

/**
 * 🏛️ Route: Export FEC - Grade X+++
 * Endpoint d'export du Fichier des Écritures Comptables.
 */
export async function POST(request: NextRequest) {
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
        const { entries, siren, yearMonth } = body as { entries: JournalEntry[], siren: string, yearMonth: string };

        if (!entries || !siren || !yearMonth) {
            return NextResponse.json({
                success: false,
                error: FinanceErrorCode.TRANSACTION_FAILED,
                metadata: { version: 'v2', timestamp: new Date().toISOString() }
            }, { status: 400 });
        }

        // 1. Génération et scellage NF525 (QuantumCrypto)
        const result = await FECGenerator.generate(entries, siren, yearMonth);

        // 2. Archivage immuable des preuves fiscales
        await DocumentVault.archive(result.filename, result.content, { 
            tenantId, 
            type: 'FEC_EXPORT',
            finalHash: result.finalHash 
        });

        // 3. Retour du Fichier (Headers stricts DGFiP)
        return new NextResponse(result.content, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `attachment; filename="${result.filename}"`
            }
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: CoreErrorCode.INTERNAL_CRASH,
            metadata: { version: 'v2', timestamp: new Date().toISOString() }
        }, { status: 500 });
    }
}
