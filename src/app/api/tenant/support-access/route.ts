/**
 * PATCH /api/tenant/support-access
 * Le responsable du tenant approuve ou refuse une demande d'accès support MCC.
 *
 * Body : { requestId: string, decision: 'APPROVE' | 'DENY' }
 *
 * Protégé : admin/manager du tenant uniquement (claims Firebase).
 * Le tenantId vient exclusivement du token — jamais du body.
 */
import 'server-only';

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withTenantRoute } from '@/lib/server/routeWrapper';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

const SupportAccessSchema = z.object({
    requestId: z.string().min(1).max(120),
    decision: z.enum(['APPROVE', 'DENY']),
});

export const PATCH = withTenantRoute(
  async (req, { tenantId, caller }) => {
    const parsed = SupportAccessSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Payload invalide', details: parsed.error.flatten() },
            { status: 400 },
        );
    }
    const { requestId, decision } = parsed.data;

    const reqPath = `tenants/${tenantId}/supportRequests/${requestId}`;
    const supportReq = await Nexus.adapter.get(reqPath) as {
        status?: string;
        durationHours?: number;
    } | null;

    if (!supportReq) {
        return NextResponse.json({ error: 'Demande introuvable ou expirée' }, { status: 404 });
    }
    if (supportReq.status !== 'PENDING') {
        return NextResponse.json({ error: `Demande déjà traitée (status: ${supportReq.status})` }, { status: 409 });
    }

    const durationHours = supportReq.durationHours ?? 4;
    const now = new Date();

    if (decision === 'APPROVE') {
        const supportAccessUntil = new Date(now.getTime() + durationHours * 3600 * 1000).toISOString();

        // Active l'accès dans tenantConfig.security
        await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, {
            security: {
                supportAccessGranted: true,
                supportAccessUntil,
            },
        }, { merge: true });

        // Met à jour la demande
        await Nexus.adapter.set(reqPath, {
            status: 'APPROVED',
            decidedAt: now.toISOString(),
            decidedBy: caller.uid,
            supportAccessUntil,
        }, { merge: true });

        empireAudit.log({
            module: 'fleet',
            action: 'SUPPORT_ACCESS_APPROVED',
            severity: 'medium',
            details: { tenantId, requestId, supportAccessUntil, approvedBy: caller.uid },
            timestamp: now,
        });

        logger.info(`[tenant/support-access] Accès approuvé par ${caller.uid} pour ${tenantId} jusqu'au ${supportAccessUntil}`);
        return NextResponse.json({ success: true, decision: 'APPROVED', supportAccessUntil });
    }

    // DENY
    await Nexus.adapter.set(reqPath, {
        status: 'DENIED',
        decidedAt: now.toISOString(),
        decidedBy: caller.uid,
    }, { merge: true });

    empireAudit.log({
        module: 'fleet',
        action: 'SUPPORT_ACCESS_DENIED',
        severity: 'low',
        details: { tenantId, requestId, deniedBy: caller.uid },
        timestamp: now,
    });

    logger.info(`[tenant/support-access] Accès refusé par ${caller.uid} pour ${tenantId}`);
    return NextResponse.json({ success: true, decision: 'DENIED' });
  },
  { requireAdmin: true },
);

