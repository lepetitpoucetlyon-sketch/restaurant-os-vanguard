import { NextRequest, NextResponse } from 'next/server';
import { FECGenerator } from '@/modules/finance/fec/FECGenerator';
import { DocumentVault } from '@/domain/shared/DocumentVault';
import { FinanceErrorCode, CoreErrorCode } from '@/shared/nexus/contracts/errors.types';
import { JournalEntry } from '@/shared/nexus/contracts/finance.types';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';

/**
 * 🏛️ Route: Export FEC - Grade X+++
 * Endpoint d'export du Fichier des Écritures Comptables.
 * Auth : JWT vérifié (admin/manager du tenant, ou fleet_admin).
 * Le tenant vient du token — jamais d'un header client.
 */
export async function POST(request: NextRequest) {
    try {
        const caller = await requireTenantAdmin(request);
        if (isDenied(caller)) return caller;
        const tenantId = caller.tenantId;

        const body = await request.json();
        const { siren, yearMonth } = body as { siren: string, yearMonth: string };

        if (!siren || !yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
            return NextResponse.json({
                success: false,
                error: FinanceErrorCode.TRANSACTION_FAILED,
                metadata: { version: 'v2', timestamp: new Date().toISOString() }
            }, { status: 400 });
        }

        // 1. Lecture server-side du ledger scellé (jamais depuis le body client)
        const [year, month] = yearMonth.split('-');
        const monthPadded = month.padStart(2, '0');
        const startOfMonth = `${year}-${monthPadded}-01`;
        const endOfMonth = `${year}-${monthPadded}-31`;

        const entries = await Nexus.adapter.query<JournalEntry>(
            `tenants/${tenantId}/journalEntries`,
            {
                where: [
                    { field: 'date', operator: '>=', value: startOfMonth },
                    { field: 'date', operator: '<=', value: endOfMonth },
                ],
                orderBy: { field: 'date', direction: 'asc' },
            }
        );

        if (entries.length === 0) {
            return NextResponse.json({
                success: false,
                error: FinanceErrorCode.TRANSACTION_FAILED,
                metadata: { version: 'v2', timestamp: new Date().toISOString() }
            }, { status: 404 });
        }

        // 2. Génération et scellage NF525 (QuantumCrypto)
        const result = await FECGenerator.generate(entries, siren, yearMonth);

        // 3. Archivage immuable des preuves fiscales
        await DocumentVault.archive(result.filename, result.content, { 
            tenantId, 
            type: 'FEC_EXPORT',
            finalHash: result.finalHash 
        });

        // 4. Retour du Fichier (Headers stricts DGFiP)
        return new NextResponse(result.content, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `attachment; filename="${result.filename}"`
            }
        });

    } catch (_error) {
        return NextResponse.json({
            success: false,
            error: CoreErrorCode.INTERNAL_CRASH,
            metadata: { version: 'v2', timestamp: new Date().toISOString() }
        }, { status: 500 });
    }
}
