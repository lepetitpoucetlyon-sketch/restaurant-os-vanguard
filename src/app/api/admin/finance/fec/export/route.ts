import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { FECGenerator } from '@/modules/finance';
import { DocumentVault } from '@/lib/vault';
import { FinanceErrorCode, CoreErrorCode } from '@/shared/nexus/contracts/errors.types';
import { JournalEntry } from '@/shared/nexus/contracts/finance.types';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

/**
 * 🏛️ Route: Export FEC - Grade X+++
 * Endpoint d'export du Fichier des Écritures Comptables.
 * Auth : JWT vérifié (admin/manager du tenant, ou super_admin).
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
        //
        // Bornes de période EXCLUSIVES en fin de mois : les dates sont stockées en
        // ISO complet (ex. "2026-07-31T09:12:00Z"). Un `<= "2026-07-31"` exclurait
        // toutes les écritures du 31 (comparaison lexicale : "...T09" > "...-31").
        // On borne donc par `< 1er du mois suivant`, ce qui inclut toute la
        // journée du dernier jour, quelle que soit l'heure — et évite le faux
        // "-31" pour les mois de 28/30 jours.
        const [year, month] = yearMonth.split('-');
        const y = parseInt(year, 10);
        const m = parseInt(month, 10);
        const monthPadded = month.padStart(2, '0');
        const startOfMonth = `${year}-${monthPadded}-01`;
        const startOfNextMonth = m === 12
            ? `${y + 1}-01-01`
            : `${y}-${String(m + 1).padStart(2, '0')}-01`;

        const entries = await Nexus.adapter.query<JournalEntry>(
            `tenants/${tenantId}/journalEntries`,
            {
                where: [
                    { field: 'date', operator: '>=', value: startOfMonth },
                    { field: 'date', operator: '<', value: startOfNextMonth },
                ],
                orderBy: { field: 'date', direction: 'asc' },
            }
        );

        logger.info(`[FEC] Export demandé — tenant ${tenantId}, période ${yearMonth}`);

        if (entries.length === 0) {
            logger.warn(`[FEC] Aucune écriture pour ${tenantId} sur ${yearMonth}`);
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

        logger.info(`[FEC] Export généré — tenant ${tenantId}, ${entries.length} écritures, fichier ${result.filename}`);

        // 4. Retour du Fichier (Headers stricts DGFiP)
        return new NextResponse(result.content, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `attachment; filename="${result.filename}"`
            }
        });

    } catch (err) {
        logger.error('[FEC] Erreur lors de la génération', err);
        return NextResponse.json({
            success: false,
            error: CoreErrorCode.INTERNAL_CRASH,
            metadata: { version: 'v2', timestamp: new Date().toISOString() }
        }, { status: 500 });
    }
}
