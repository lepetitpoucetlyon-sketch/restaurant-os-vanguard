import { requireFleetAdmin, requireMccLevel, isDenied, type MccRole } from '@/lib/server/adminAuthGuard';
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

export interface TrustedDevice {
    deviceId:      string;
    fingerprint:   string;
    name:          string;
    ownerUid:      string;
    ownerEmail:    string;
    role:          MccRole;
    /** Routes MCC autorisées (vide = toutes, selon le rôle). */
    allowedRoutes: string[];
    status:        'active' | 'revoked';
    addedAt:       string;
    lastSeenAt:    string;
    lastSeenIp:    string;
}

const COLLECTION = 'mcc/trustedDevices';

/**
 * GET /api/admin/fleet/trusted-devices
 * Liste tous les appareils de confiance de la flotte MCC.
 * Auth: mcc_support (lecture) — les détails fingerprint sont masqués pour mcc_support.
 */
export async function GET(request: NextRequest) {
    const _caller = await requireFleetAdmin(request);
    if (isDenied(_caller)) return _caller;
    const caller = await requireMccLevel(request, 'mcc_support');
    if (isDenied(caller)) return caller;

    try {
        const devices = await Nexus.adapter.query<TrustedDevice>(COLLECTION);
        const isFleetAdmin = caller.role === 'fleet_admin' || caller.role === 'SUPER_ADMIN';

        // mcc_support ne voit pas le fingerprint complet
        const sanitized = devices.map(d => ({
            ...d,
            fingerprint: isFleetAdmin ? d.fingerprint : d.fingerprint.slice(0, 8) + '…',
        }));

        return NextResponse.json({ devices: sanitized });
    } catch (err) {
        logger.error('[trusted-devices] GET error', toError(err).message);
        return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
    }
}

/**
 * POST /api/admin/fleet/trusted-devices
 * Enregistre un nouvel appareil de confiance.
 * Auth: fleet_admin uniquement.
 *
 * Body: { fingerprint, name, role, allowedRoutes?, ownerUid?, ownerEmail? }
 */
export async function POST(request: NextRequest) {
    const _caller = await requireFleetAdmin(request);
    if (isDenied(_caller)) return _caller;
    const caller = await requireMccLevel(request, 'fleet_admin');
    if (isDenied(caller)) return caller;

    let body: Partial<TrustedDevice> & { ownerEmail?: string };
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 }); }

    if (!body.fingerprint || !body.name || !body.role) {
        return NextResponse.json({ error: 'fingerprint, name et role sont requis.' }, { status: 400 });
    }

    const VALID_ROLES: MccRole[] = ['mcc_junior_dev', 'mcc_support', 'fleet_admin'];
    if (!VALID_ROLES.includes(body.role as MccRole)) {
        return NextResponse.json({ error: `Rôle invalide : ${body.role}` }, { status: 400 });
    }

    // Vérifier qu'un appareil avec ce fingerprint n'existe pas déjà
    const existing = await Nexus.adapter.query<TrustedDevice>(COLLECTION);
    if (existing.some(d => d.fingerprint === body.fingerprint && d.status === 'active')) {
        return NextResponse.json({ error: 'Cet appareil est déjà enregistré.' }, { status: 409 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const deviceId = Nexus.adapter.generateId(COLLECTION);
    const now = new Date().toISOString();

    const device: TrustedDevice = {
        deviceId,
        fingerprint:   body.fingerprint,
        name:          body.name,
        ownerUid:      body.ownerUid ?? caller.uid,
        ownerEmail:    body.ownerEmail ?? '',
        role:          body.role as MccRole,
        allowedRoutes: body.allowedRoutes ?? [],
        status:        'active',
        addedAt:       now,
        lastSeenAt:    now,
        lastSeenIp:    ip,
    };

    await Nexus.adapter.set(`${COLLECTION}/${deviceId}`, device);

    empireAudit.log({
        action: 'trusted_device_registered',
        module: 'fleet',
        userId: caller.uid,
        details: { deviceId, name: device.name, role: device.role, ownerUid: device.ownerUid },
        timestamp: new Date(),
    });

    logger.info(`[trusted-devices] Appareil enregistré`, { deviceId, name: device.name, role: device.role });
    return NextResponse.json({ device }, { status: 201 });
}

/**
 * PATCH /api/admin/fleet/trusted-devices
 * Met à jour le rôle ou les routes autorisées d'un appareil.
 * Auth: fleet_admin uniquement.
 *
 * Body: { deviceId, role?, allowedRoutes?, name? }
 */
export async function PATCH(request: NextRequest) {
    const _caller = await requireFleetAdmin(request);
    if (isDenied(_caller)) return _caller;
    const caller = await requireMccLevel(request, 'fleet_admin');
    if (isDenied(caller)) return caller;

    let body: { deviceId: string; role?: MccRole; allowedRoutes?: string[]; name?: string };
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 }); }

    if (!body.deviceId) return NextResponse.json({ error: 'deviceId requis.' }, { status: 400 });

    const device = await Nexus.adapter.get(`${COLLECTION}/${body.deviceId}`) as TrustedDevice | null;
    if (!device || device.status === 'revoked') {
        return NextResponse.json({ error: 'Appareil introuvable ou révoqué.' }, { status: 404 });
    }

    const updates: Partial<TrustedDevice> = {};
    if (body.role)          updates.role          = body.role;
    if (body.allowedRoutes) updates.allowedRoutes = body.allowedRoutes;
    if (body.name)          updates.name          = body.name;

    await Nexus.adapter.set(`${COLLECTION}/${body.deviceId}`, { ...device, ...updates }, { merge: true });

    empireAudit.log({
        action: 'trusted_device_updated',
        module: 'fleet',
        userId: caller.uid,
        details: { deviceId: body.deviceId, role: updates.role ?? '', name: updates.name ?? '' },
        timestamp: new Date(),
    });

    return NextResponse.json({ deviceId: body.deviceId, updates });
}

/**
 * DELETE /api/admin/fleet/trusted-devices?deviceId=xxx
 * Révoque un appareil (status: 'revoked').
 * Auth: fleet_admin uniquement.
 */
export async function DELETE(request: NextRequest) {
    const _caller = await requireFleetAdmin(request);
    if (isDenied(_caller)) return _caller;
    const caller = await requireMccLevel(request, 'fleet_admin');
    if (isDenied(caller)) return caller;

    const deviceId = request.nextUrl.searchParams.get('deviceId');
    if (!deviceId) return NextResponse.json({ error: 'deviceId requis.' }, { status: 400 });

    const device = await Nexus.adapter.get(`${COLLECTION}/${deviceId}`) as TrustedDevice | null;
    if (!device) return NextResponse.json({ error: 'Appareil introuvable.' }, { status: 404 });

    await Nexus.adapter.set(`${COLLECTION}/${deviceId}`, { ...device, status: 'revoked' }, { merge: true });

    empireAudit.log({
        action: 'trusted_device_revoked',
        module: 'fleet',
        userId: caller.uid,
        details: { deviceId, name: device.name, role: device.role, ownerUid: device.ownerUid },
        timestamp: new Date(),
    });

    logger.info(`[trusted-devices] Appareil révoqué`, { deviceId, name: device.name });
    return NextResponse.json({ revoked: true, deviceId });
}
