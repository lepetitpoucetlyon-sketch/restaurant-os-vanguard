/**
 * Support Drafts — review MCC des brouillons générés par l'agent IA.
 *
 * GET /api/admin/fleet/support-ai/drafts
 *   Query: ?status=draft_ready&tenantId=xxx (les deux optionnels)
 *   Défaut (sans ?status) : file d'attente 'new'|'analyzing'|'draft_ready'|'analysis_failed'.
 *   Protégé : mcc_junior_dev (lecture seule).
 *
 * POST /api/admin/fleet/support-ai/drafts
 *   Body: { ticketId, action: 'approve'|'reject'|'correct', applyPatch?, note?, correctedDraft? }
 *   - reject  : status='rejected'.
 *   - correct : remplace `draft` par `correctedDraft` (revalidé), status reste 'draft_ready'.
 *   - approve : status='approved'. Si draft.kind==='config_patch' && draft.autoApplicable
 *               && applyPatch===true, applique aussi l'override (même mécanique que
 *               tenant-override/route.ts) et passe status='applied'.
 *   L'IA ne fait jamais que proposer — seul un opérateur mcc_support décide.
 *   Protégé : mcc_support.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { ChangelogService } from '@/shared/nexus/engines/mcc/ChangelogService';
import { SupportDraftSchema } from '@/domain/schemas/supportTicket';
import type { SupportTicket, SupportTicketStatus } from '@/domain/schemas/supportTicket';
import { logger } from '@/lib/logger';

const QUEUE_STATUSES: SupportTicketStatus[] = ['new', 'analyzing', 'draft_ready', 'analysis_failed'];

function canAutoApplyPatch(draft: NonNullable<SupportTicket['draft']>, applyPatch?: boolean): boolean {
  return draft.kind === 'config_patch' && draft.autoApplicable === true && applyPatch === true;
}

async function applyPatchToConfig(
  tenantId: string,
  draft: NonNullable<SupportTicket['draft']>,
  ticketPath: string,
  callerId: string,
): Promise<void> {
  const current = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as { overrides?: unknown } | null;
  const before  = current?.overrides ?? {};
  await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, { overrides: draft.proposedPatch }, { merge: true });
  const patchKey = Object.keys(draft.proposedPatch ?? {})[0];
  await ChangelogService.record({
    tenantId,
    action: 'OVERRIDE_APPLIED',
    key: patchKey ? `overrides.${patchKey}` : 'overrides',
    before,
    after: draft.proposedPatch,
    description: `Appliqué via brouillon SAV IA — ${draft.title}`,
    appliedBy: callerId,
    scope: 'tenant',
  });
  await Nexus.adapter.set(ticketPath, { status: 'applied' }, { merge: true });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_junior_dev');
  if (isDenied(caller)) return caller as NextResponse;

  const statusParam = req.nextUrl.searchParams.get('status') as SupportTicketStatus | null;
  const tenantId = req.nextUrl.searchParams.get('tenantId');

  const where = [
    ...(statusParam ? [{ field: 'status', operator: '==' as const, value: statusParam }] : []),
    ...(tenantId ? [{ field: 'tenantId', operator: '==' as const, value: tenantId }] : []),
  ];

  const all = await Nexus.adapter.query<SupportTicket>('mcc/supportTickets', where.length ? { where } : undefined);
  const tickets = statusParam ? all : all.filter(t => QUEUE_STATUSES.includes(t.status));

  return NextResponse.json({ tickets });
}

interface DraftActionBody {
  ticketId:       string;
  action:         'approve' | 'reject' | 'correct';
  applyPatch?:    boolean;
  note?:          string;
  correctedDraft?: unknown;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  let body: DraftActionBody;
  try {
    body = await req.json() as DraftActionBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { ticketId, action } = body;
  if (!ticketId || !action) {
    return NextResponse.json({ error: 'ticketId et action requis' }, { status: 400 });
  }

  const ticketPath = `mcc/supportTickets/${ticketId}`;
  const ticket = await Nexus.adapter.get<SupportTicket>(ticketPath);
  if (!ticket) return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 });
  if (ticket.status !== 'draft_ready') {
    return NextResponse.json({ error: `Ticket au statut '${ticket.status}', attendu 'draft_ready'` }, { status: 409 });
  }
  if (!ticket.draft) {
    return NextResponse.json({ error: 'Ticket sans brouillon' }, { status: 409 });
  }

  if (action === 'reject') {
    await Nexus.adapter.set(ticketPath, {
      status: 'rejected',
      resolvedBy: caller.uid,
      resolvedAt: Date.now(),
      resolutionNote: body.note,
    }, { merge: true });

    await ChangelogService.record({
      tenantId: ticket.tenantId,
      action: 'SUPPORT_DRAFT_REJECTED',
      key: `supportTickets.${ticketId}`,
      before: ticket.draft,
      after: null,
      description: body.note || 'Brouillon refusé',
      appliedBy: caller.uid,
      scope: 'tenant',
      category: 'CUSTOM',
    });

    logger.info(`[SupportDrafts] Ticket ${ticketId} refusé par ${caller.uid}`);
    return NextResponse.json({ success: true, ticketId, status: 'rejected' });
  }

  if (action === 'correct') {
    const validated = SupportDraftSchema.safeParse(body.correctedDraft);
    if (!validated.success) {
      return NextResponse.json({ error: 'correctedDraft invalide', issues: validated.error.issues }, { status: 400 });
    }
    const correctedDraft = validated.data;

    await Nexus.adapter.set(ticketPath, { draft: correctedDraft }, { merge: true });

    await ChangelogService.record({
      tenantId: ticket.tenantId,
      action: 'SUPPORT_DRAFT_CORRECTED',
      key: `supportTickets.${ticketId}`,
      before: ticket.draft,
      after: correctedDraft,
      description: body.note || `Brouillon corrigé par ${caller.uid}`,
      appliedBy: caller.uid,
      scope: 'tenant',
      category: 'CUSTOM',
    });

    logger.info(`[SupportDrafts] Ticket ${ticketId} corrigé par ${caller.uid}`);
    return NextResponse.json({ success: true, ticketId, status: 'draft_ready', draft: correctedDraft });
  }

  // action === 'approve'
  const draft = ticket.draft;
  await Nexus.adapter.set(ticketPath, {
    status: 'approved',
    resolvedBy: caller.uid,
    resolvedAt: Date.now(),
    resolutionNote: body.note,
  }, { merge: true });

  await ChangelogService.record({
    tenantId: ticket.tenantId,
    action: 'SUPPORT_DRAFT_APPROVED',
    key: `supportTickets.${ticketId}`,
    before: null,
    after: draft,
    description: draft.title,
    appliedBy: caller.uid,
    scope: 'tenant',
    category: 'CUSTOM',
  });

  if (canAutoApplyPatch(draft, body.applyPatch) && draft.proposedPatch) {
    await applyPatchToConfig(ticket.tenantId, draft, ticketPath, caller.uid);
    logger.info(`[SupportDrafts] Ticket ${ticketId} approuvé et appliqué par ${caller.uid}`);
    return NextResponse.json({ success: true, ticketId, status: 'applied' });
  }

  logger.info(`[SupportDrafts] Ticket ${ticketId} approuvé (sans application) par ${caller.uid}`);
  return NextResponse.json({ success: true, ticketId, status: 'approved' });
}
