import { requireFleetAdmin, requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type { FiscalSeal } from '@nexus/contracts/finance.types';
import { toError } from "@/lib/toError";

interface JournalEntry {
    id: string;
    date: string;
    label: string;
    amountInMicrounits: number;
    type: string;
    pcgAccount: string;
    pcgLabel: string;
    source: string;
    createdAt: string;
    [key: string]: unknown;
}

interface TenantConfig {
    name?: string;
    fiscalSigningKey?: string;
    dataRegion?: string;
    openBankingProvider?: string;
    [key: string]: unknown;
}

/**
 * GET /api/admin/compliance/fiscal-tenant-audit
 * Retourne les journalEntries + fiscalSeals d'un tenant pour un contrôle fiscal.
 *
 * Query: tenantId (requis), from (YYYY-MM-DD, optionnel), to (YYYY-MM-DD, optionnel)
 * Auth: mcc_support minimum
 *
 * Les données sont filtrées par date si from/to fournis.
 * La clé de signature n'est JAMAIS retournée — seul son statut (configurée: oui/non).
 */
export async function GET(request: NextRequest) {
    const _caller = await requireFleetAdmin(request);
    if (isDenied(_caller)) return _caller;
    const caller = await requireMccLevel(request, 'mcc_support');
    if (isDenied(caller)) return caller;

    const { searchParams } = request.nextUrl;
    const tenantId = searchParams.get('tenantId');
    const from     = searchParams.get('from');
    const to       = searchParams.get('to');

    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId requis.' }, { status: 400 });
    }

    try {
        // Config tenant (nom, statut clé fiscale — jamais la clé elle-même)
        const tenantConfig = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as TenantConfig | null;
        const fiscalKeyConfigured = !!(tenantConfig?.fiscalSigningKey);

        // JournalEntries
        let journalEntries = await Nexus.adapter.query<JournalEntry>(`tenants/${tenantId}/journalEntries`);

        // FiscalSeals
        let fiscalSeals = await Nexus.adapter.query<FiscalSeal>(`tenants/${tenantId}/fiscalSeals`);

        // Filtrage par date si demandé
        if (from || to) {
            const fromMs = from ? new Date(from).getTime() : 0;
            const toMs   = to   ? new Date(to + 'T23:59:59Z').getTime() : Infinity;

            journalEntries = journalEntries.filter(je => {
                const ts = new Date(je.createdAt ?? je.date).getTime();
                return ts >= fromMs && ts <= toMs;
            });
            fiscalSeals = fiscalSeals.filter(s => {
                const ts = new Date(s.timestamp ?? 0).getTime();
                return ts >= fromMs && ts <= toMs;
            });
        }

        // Tri chronologique ascendant (ordre fiscal)
        journalEntries.sort((a, b) => new Date(a.createdAt ?? a.date).getTime() - new Date(b.createdAt ?? b.date).getTime());
        fiscalSeals.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

        // Vérification de la chaîne d'intégrité
        let chainStatus: 'ok' | 'breach' | 'empty' = 'empty';
        if (fiscalSeals.length > 0) {
            chainStatus = 'ok';
            for (let i = 1; i < fiscalSeals.length; i++) {
                if (fiscalSeals[i].previousHash !== fiscalSeals[i - 1].hash) {
                    chainStatus = 'breach';
                    break;
                }
            }
        }

        // Statistiques financières agrégées
        const totalCredit = journalEntries
            .filter(je => je.type === 'credit')
            .reduce((sum, je) => sum + (je.amountInMicrounits ?? 0), 0);
        const totalDebit = journalEntries
            .filter(je => je.type === 'debit')
            .reduce((sum, je) => sum + (je.amountInMicrounits ?? 0), 0);

        empireAudit.log({
            action: 'fiscal_tenant_audit_accessed',
            module: 'fleet',
            userId: caller.uid,
            details: { tenantId, from: from ?? '', to: to ?? '', journalCount: journalEntries.length, sealCount: fiscalSeals.length },
            timestamp: new Date(),
        });

        return NextResponse.json({
            tenant: {
                id: tenantId,
                name: tenantConfig?.name ?? tenantId,
                fiscalKeyConfigured,
                dataRegion: tenantConfig?.dataRegion ?? 'eu-west',
            },
            period: { from: from ?? null, to: to ?? null },
            journalEntries,
            fiscalSeals,
            stats: {
                totalEntries:   journalEntries.length,
                totalSeals:     fiscalSeals.length,
                totalCreditMu:  totalCredit,
                totalDebitMu:   totalDebit,
            },
            chainStatus,
        });
    } catch (err) {
        logger.error('[fiscal-tenant-audit] Erreur', toError(err).message);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erreur interne.' },
            { status: 500 }
        );
    }
}
