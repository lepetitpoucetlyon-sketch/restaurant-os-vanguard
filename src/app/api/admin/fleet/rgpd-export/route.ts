/**
 * RGPD Export tenant — droit à la portabilité (Art. 20)
 *
 * POST /api/admin/fleet/rgpd-export
 *   Body: { tenantId: string; requestedBy: string; reason?: string; scope?: 'personal' | 'full' }
 *   - Dump JSON des collections tenant (personnelles par défaut, ou complètes si scope=full)
 *   - Enregistre un certificat signé dans mcc/rgpd-export-certificates/{certificateId}
 *   - Répond { certificateId, exportedAt, collections, bytes, download } — le dump est joint dans la réponse
 *
 * GET  /api/admin/fleet/rgpd-export?tenantId&certificateId
 *   - Récupère un certificat d'export existant (traçabilité)
 *
 * IMPORTANT :
 *   - Provider-agnostique : passe UNIQUEMENT par Nexus.adapter (Firestore / Simulacra / futur SQLite).
 *   - Le résultat inclut les collections NF525 pour la portabilité, mais ne les modifie jamais.
 *   - Le certificat contient un SHA-256 du payload pour prouver l'intégrité de l'export.
 *
 * Protégé : mcc_super_admin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const RgpdExportSchema = z.object({
    tenantId: z.string().min(1),
    requestedBy: z.string().min(1),
    reason: z.string().optional(),
    scope: z.enum(['personal', 'full']).optional().default('personal'),
});

// Données personnelles au sens RGPD Art. 20 (portabilité)
const PERSONAL_COLLECTIONS = [
    'users',
    'reservations',
    'contacts',
    'marketingConsents',
    'loyaltyProfiles',
    'guestHistory',
    'orders',
    'invoices',
] as const;

// Périmètre complet : ajoute la configuration métier et l'historique fiscal (lecture seule)
const FULL_EXTRA_COLLECTIONS = [
    'products',
    'categories',
    'tables',
    'settings',
    'journalEntries',
    'fiscalSeals',
    'fiscalLedger',
    'wormArchives',
    'auditTrails',
    'haccpLogs',
] as const;

async function sha256(text: string): Promise<string> {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    const caller = await requireMccLevel(req, 'mcc_super_admin');
    if (isDenied(caller)) return caller as NextResponse;

    let body: z.infer<typeof RgpdExportSchema>;
    try {
        body = RgpdExportSchema.parse(await req.json());
    } catch (err) {
        return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
    }

    const { tenantId, requestedBy, reason, scope } = body;
    const exportedAt = new Date().toISOString();
    const certificateId = crypto.randomUUID();

    const collections =
        scope === 'full'
            ? [...PERSONAL_COLLECTIONS, ...FULL_EXTRA_COLLECTIONS]
            : [...PERSONAL_COLLECTIONS];

    // Dump collection par collection — Nexus (provider-agnostique)
    const dump: Record<string, unknown[]> = {};
    const counts: Record<string, number> = {};
    for (const collection of collections) {
        try {
            const docs = await Nexus.adapter.query(`tenants/${tenantId}/${collection}`);
            dump[collection] = docs;
            counts[collection] = docs.length;
        } catch (err) {
            logger.warn(
                `[RGPD-EXPORT] Collection ${collection} indisponible pour ${tenantId}`,
                (err as Error).message,
            );
            dump[collection] = [];
            counts[collection] = 0;
        }
    }

    // Snapshot tenantConfig (données publiques du tenant)
    try {
        const cfg = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`);
        if (cfg) dump['tenantConfig'] = [cfg];
    } catch {
        /* tenantConfig peut être absent ou immuable, on ignore silencieusement */
    }

    const payload = {
        standard: 'RGPD Art. 20 — Droit à la portabilité',
        certificateId,
        tenantId,
        exportedAt,
        requestedBy,
        reason: reason ?? null,
        scope,
        counts,
        data: dump,
    };
    const payloadJson = JSON.stringify(payload);
    const payloadHash = await sha256(payloadJson);
    const bytes = new TextEncoder().encode(payloadJson).length;

    // Persiste UNIQUEMENT le certificat (pas le dump complet — l'utilisateur récupère le JSON via la réponse)
    const certificate = {
        certificateId,
        tenantId,
        exportedAt,
        requestedBy,
        reason: reason ?? null,
        scope,
        collections,
        counts,
        bytes,
        payloadHash,
        standard: 'RGPD Art. 20',
        issuedAt: exportedAt,
    };
    await Nexus.adapter.set(
        `mcc/rgpd-export-certificates/${certificateId}`,
        certificate,
    );

    empireAudit.log({
        module: 'fleet',
        action: 'RGPD_EXPORT_ISSUED',
        severity: 'high',
        details: { tenantId, certificateId, scope, counts, bytes, payloadHash },
        timestamp: new Date(),
    });

    logger.info(
        `[RGPD-EXPORT] Export ${scope} ${tenantId} — cert ${certificateId} — ${bytes}B — hash ${payloadHash.slice(0, 12)}…`,
    );

    return NextResponse.json({
        success: true,
        certificateId,
        exportedAt,
        scope,
        collections,
        counts,
        bytes,
        payloadHash,
        download: payload, // dump JSON complet, à sauvegarder côté client
    });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
    const caller = await requireMccLevel(req, 'mcc_support');
    if (isDenied(caller)) return caller as NextResponse;

    const certificateId = req.nextUrl.searchParams.get('certificateId');
    const tenantId = req.nextUrl.searchParams.get('tenantId');

    if (certificateId) {
        const cert = await Nexus.adapter.get(`mcc/rgpd-export-certificates/${certificateId}`);
        if (!cert) return NextResponse.json({ found: false, certificate: null }, { status: 404 });
        return NextResponse.json({ found: true, certificate: cert });
    }

    if (tenantId) {
        const certs = await Nexus.adapter.query('mcc/rgpd-export-certificates', {
            where: [{ field: 'tenantId', operator: '==', value: tenantId }],
        });
        return NextResponse.json({ count: certs.length, certificates: certs });
    }

    return NextResponse.json(
        { error: 'certificateId ou tenantId requis' },
        { status: 400 },
    );
}
