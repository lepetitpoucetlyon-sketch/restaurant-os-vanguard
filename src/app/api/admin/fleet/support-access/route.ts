/**
 * POST /api/admin/fleet/support-access
 * Flow consentement support : demande MCC → approbation tenant → accès temporisé.
 *
 * Actions (MCC, super_admin) :
 *   { action: 'request', tenantId, durationHours? }  → crée une demande PENDING
 *   { action: 'revoke',  tenantId }                  → révocation immédiate
 *   { action: 'status',  tenantId }                  → état courant
 *
 * Action (tenant admin, via route publique séparée) :
 *   L'approbation est gérée côté tenant via PATCH /api/tenant/support-access/approve
 *   qui est hors scope MCC et ne requiert pas super_admin.
 *
 * Protégé : super_admin / super_admin pour request/revoke/status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@restaurant-os.app';

async function notifyTenantAccess(tenantId: string, operatorId: string, action: string) {
  if (!resend) return;
  try {
    const config = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as {
      contactEmail?: string; name?: string;
    } | null;
    const to = config?.contactEmail;
    if (!to) return;
    const label = action === 'request' ? 'a demandé un accès technique' : 'a révoqué son accès';
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[Restaurant OS] Un technicien ${label} à votre instance`,
      html: `<p>Bonjour,</p>
<p>Un opérateur technique de Restaurant OS (ID : <code>${operatorId}</code>) ${label} à votre instance <strong>${config?.name ?? tenantId}</strong> le <strong>${new Date().toLocaleString('fr-FR')}</strong>.</p>
<p>Si vous n'avez pas fait cette demande ou souhaitez révoquer l'accès, contactez le support.</p>
<p style="color:#888;font-size:12px;">Restaurant OS — Transparence RGPD</p>`,
    });
  } catch (err) {
    logger.warn('[support-access] Notification email failed:', toError(err).message);
  }
}

import { z } from 'zod';
import { toError } from "@/lib/toError";

const DEFAULT_DURATION_HOURS = 4;

const SupportAccessBodySchema = z.object({
  action: z.enum(['request', 'revoke', 'status']),
  tenantId: z.string().min(1),
  durationHours: z.number().int().positive().optional()
});

type SupportAccessRequest = z.infer<typeof SupportAccessBodySchema>;

export async function POST(req: NextRequest): Promise<NextResponse> {
    // Support access : niveau support minimum (revoke aussi — il faut mcc_support au minimum)
    const caller = await requireMccLevel(req, 'mcc_support');
    if (isDenied(caller)) return caller as NextResponse;

    let body: SupportAccessRequest;
    try {
        body = SupportAccessBodySchema.parse(await req.json());
    } catch (err) {
        return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
    }

    const { action, tenantId, durationHours = DEFAULT_DURATION_HOURS } = body;

    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId est requis' }, { status: 400 });
    }

    const configPath = `tenants/${tenantId}/tenantConfig`;

    try {
        switch (action) {
            case 'request': {
                // Écrit une demande PENDING dans le namespace du tenant
                // Le tenant admin la voit dans ses settings et peut approuver
                const requestId = `supreq_${Date.now()}`;
                const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();

                await Nexus.adapter.set(`tenants/${tenantId}/supportRequests/${requestId}`, {
                    id: requestId,
                    status: 'PENDING',
                    requestedAt: new Date().toISOString(),
                    durationHours,
                    expiresAt,
                    reason: 'Support technique MCC',
                });

                empireAudit.log({
                    module: 'fleet',
                    action: 'SUPPORT_ACCESS_REQUESTED',
                    severity: 'medium',
                    details: { tenantId, requestId, durationHours },
                    timestamp: new Date(),
                });

                logger.info(`[MCC/support-access] Demande PENDING créée pour tenant ${tenantId} (${durationHours}h)`);
                void notifyTenantAccess(tenantId, caller.uid, 'request');
                return NextResponse.json({ success: true, requestId, expiresAt, status: 'PENDING' });
            }

            case 'revoke': {
                // Révocation immédiate — efface les flags d'accès dans tenantConfig
                await Nexus.adapter.set(configPath, {
                    'security.supportAccessGranted': false,
                    'security.supportAccessUntil': null,
                }, { merge: true });

                empireAudit.log({
                    module: 'fleet',
                    action: 'SUPPORT_ACCESS_REVOKED',
                    severity: 'high',
                    details: { tenantId },
                    timestamp: new Date(),
                });

                logger.info(`[MCC/support-access] Accès support révoqué pour tenant ${tenantId}`);
                void notifyTenantAccess(tenantId, caller.uid, 'revoke');
                return NextResponse.json({ success: true, message: 'Accès support révoqué immédiatement.' });
            }

            case 'status': {
                const config = await Nexus.adapter.get(configPath) as {
                    security?: { supportAccessGranted?: boolean; supportAccessUntil?: string };
                } | null;

                const security = config?.security ?? {};
                const granted = security.supportAccessGranted ?? false;
                const until = security.supportAccessUntil ?? null;
                const expired = until ? new Date(until) < new Date() : false;

                return NextResponse.json({
                    tenantId,
                    supportAccessGranted: granted && !expired,
                    supportAccessUntil: until,
                    expired,
                });
            }

            default:
                return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
        }
    } catch (err) {
        logger.error('[MCC/support-access] Erreur:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erreur interne' },
            { status: 500 },
        );
    }
}
