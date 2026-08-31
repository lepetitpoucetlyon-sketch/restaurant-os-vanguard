/**
 * Validation Gate human-in-the-loop — mcc-support-ai-2
 *
 * Toute action IA à fort impact (kick tenant, purge, décommission) passe par ce gate.
 * L'IA propose une action ; un opérateur MCC doit valider avant exécution.
 *
 * POST /api/admin/fleet/support-gate          — crée une demande en attente
 *   Body: { action: string; targetTenantId: string; payload: unknown; requestedBy: string; reason: string }
 *   Retourne: { gateId: string; status: 'pending_human_approval' }
 *
 * PATCH /api/admin/fleet/support-gate         — approve ou reject
 *   Body: { gateId: string; decision: 'approved' | 'rejected'; reviewedBy: string; comment?: string }
 *
 * GET /api/admin/fleet/support-gate?status=pending — liste les gates en attente
 *
 * Protégé : super_admin.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const SupportGatePostSchema = z.object({
  action: z.string().min(1),
  targetTenantId: z.string().min(1),
  payload: z.unknown().optional(),
  requestedBy: z.string().min(1),
  reason: z.string().min(1)
});

const SupportGatePatchSchema = z.object({
  gateId: z.string().min(1),
  decision: z.enum(['approved', 'rejected']),
  reviewedBy: z.string().min(1),
  comment: z.string().optional()
});

type GateStatus = 'pending_human_approval' | 'approved' | 'rejected' | 'executed';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_super_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: z.infer<typeof SupportGatePostSchema>;
  try {
    body = SupportGatePostSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
  }

  const { action, targetTenantId, payload, requestedBy, reason } = body;

  const gateId = crypto.randomUUID();
  const gate = {
    gateId,
    action,
    targetTenantId,
    payload,
    requestedBy,
    reason,
    status: 'pending_human_approval' as GateStatus,
    createdAt: new Date().toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    comment:    null,
  };

  await Nexus.adapter.set(`mcc/supportGates/${gateId}`, gate);

  empireAudit.log({
    module: 'fleet',
    action: 'SUPPORT_GATE_CREATED',
    severity: 'high',
    details: { gateId, action, targetTenantId, requestedBy },
    timestamp: new Date(),
  });

  logger.info(`[SupportGate] Gate ${gateId} créé — action: ${action} → ${targetTenantId}`);
  return NextResponse.json({ success: true, gateId, status: 'pending_human_approval' });
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_super_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: z.infer<typeof SupportGatePatchSchema>;
  try {
    body = SupportGatePatchSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
  }

  const { gateId, decision, reviewedBy, comment } = body;

  const gate = await Nexus.adapter.get(`mcc/supportGates/${gateId}`) as { status: GateStatus; action: string; targetTenantId: string } | null;
  if (!gate) return NextResponse.json({ error: 'Gate non trouvé' }, { status: 404 });
  if (gate.status !== 'pending_human_approval') {
    return NextResponse.json({ error: `Gate déjà traité (${gate.status})` }, { status: 409 });
  }

  const newStatus: GateStatus = decision === 'approved' ? 'approved' : 'rejected';
  await Nexus.adapter.set(`mcc/supportGates/${gateId}`, {
    ...gate, status: newStatus, reviewedBy, reviewedAt: new Date().toISOString(), comment: comment ?? null,
  });

  empireAudit.log({
    module: 'fleet',
    action: decision === 'approved' ? 'SUPPORT_GATE_APPROVED' : 'SUPPORT_GATE_REJECTED',
    severity: 'high',
    details: { gateId, action: gate.action, reviewedBy },
    timestamp: new Date(),
  });

  logger.info(`[SupportGate] Gate ${gateId} → ${newStatus} par ${reviewedBy}`);
  return NextResponse.json({ success: true, gateId, status: newStatus });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const status = req.nextUrl.searchParams.get('status') ?? 'pending_human_approval';
  const all    = await Nexus.adapter.query('mcc/supportGates') as Array<{ status?: string }>;
  const filtered = all.filter(g => !status || g.status === status);

  return NextResponse.json({ gates: filtered, total: filtered.length });
}
