/**
 * POST /api/admin/hr/payroll/silae/connect
 * Sauvegarde les credentials Silae du tenant et vérifie la connexion.
 * Body : { apiKey, dossierId, baseUrl? }
 * Protégé : manager / directeur minimum.
 */
import 'server-only';
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { SilaeClient } from '@/modules/human';
import type { PayrollProviderConfig } from '@/modules/human';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest): Promise<NextResponse> {
    const caller = await requireTenantAdmin(req);
    if (isDenied(caller)) return caller as NextResponse;

    const { apiKey, dossierId, baseUrl } = await req.json() as {
        apiKey?: string;
        dossierId?: string;
        baseUrl?: string;
    };

    if (!apiKey || !dossierId) {
        return NextResponse.json({ error: 'apiKey et dossierId requis' }, { status: 400 });
    }

    const config: PayrollProviderConfig = {
        provider: 'silae',
        silaeApiKey: apiKey,
        silaeDossierId: dossierId,
        silaeBaseUrl: baseUrl,
    };

    // Vérifier la connexion avant de sauvegarder
    const client = new SilaeClient(config);
    const ping = await client.ping();
    if (!ping.ok) {
        return NextResponse.json({
            error: 'Connexion Silae échouée — vérifiez votre clé API et numéro de dossier',
        }, { status: 422 });
    }

    // Sauvegarder dans Nexus (les credentials ne sont PAS loggués)
    const path = Nexus.getTenantPath(`settings/payroll`);
    await Nexus.adapter.set(path, {
        ...config,
        connectedAt: new Date().toISOString(),
        dossierNom: ping.dossierNom,
    }, { merge: true });

    logger.info('[HR/Silae] Connexion établie', {
        tenantId: caller.tenantId,
        dossierId,
        dossierNom: ping.dossierNom,
    });

    return NextResponse.json({
        success: true,
        dossierNom: ping.dossierNom,
        message: `Silae connecté — dossier "${ping.dossierNom ?? dossierId}"`,
    });
}
