/**
 * Support Tickets — soumission self-service depuis la plateforme du tenant.
 *
 * POST /api/tenant/support/tickets
 *   Body: { description: string, screenshotUrl?: string }
 *   Crée un ticket (source:'tenant_submission'), déclenche l'analyse IA
 *   (SupportTicketAnalysisHandler via NexusEventBus) et répond une fois le
 *   brouillon prêt (ou l'échec d'analyse constaté).
 *
 * GET /api/tenant/support/tickets
 *   Liste les tickets du tenant appelant (suivi de statut côté client).
 *
 * tenantId TOUJOURS depuis le token vérifié (requireTenantUser) — jamais du body.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantUser, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { registerSupportTicketAnalysisHandler } from '@/shared/eventBus/handlers/SupportTicketAnalysisHandler';
import { sanitized } from '@/domain/schemas/primitives';
import type { SupportTicket } from '@/domain/schemas/supportTicket';
import { logger } from '@/lib/logger';

registerSupportTicketAnalysisHandler();

const DescriptionSchema = sanitized(10, 2000);

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  let body: { description: string; screenshotUrl?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsedDescription = DescriptionSchema.safeParse(body.description);
  if (!parsedDescription.success) {
    return NextResponse.json({ error: 'description requise (10-2000 caractères)' }, { status: 400 });
  }
  const screenshotUrl = body.screenshotUrl?.trim() || undefined;

  const ticketId = crypto.randomUUID();
  const ticket: SupportTicket = {
    id: ticketId,
    tenantId,
    source: 'tenant_submission',
    description: parsedDescription.data,
    ...(screenshotUrl ? { screenshotUrl } : {}),
    status: 'new',
    createdAt: Date.now(),
    createdBy: caller.uid,
    escalated: false,
  };

  await Nexus.adapter.set(`mcc/supportTickets/${ticketId}`, ticket);
  logger.info(`[SupportTickets] Ticket ${ticketId} soumis par tenant ${tenantId}`);

  await NexusEventBus.emit('support.ticket_submitted', {
    v: 1,
    ticketId,
    tenantId,
    description: parsedDescription.data,
    screenshotUrl,
    submittedBy: caller.uid,
  });

  const analyzed = await Nexus.adapter.get<SupportTicket>(`mcc/supportTickets/${ticketId}`);

  return NextResponse.json({
    ticketId,
    status: analyzed?.status ?? 'new',
    draft: analyzed?.draft ?? null,
    analysisError: analyzed?.analysisError ?? null,
  }, { status: 201 });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantUser(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  const all = await Nexus.adapter.query<SupportTicket>('mcc/supportTickets', {
    where: [{ field: 'tenantId', operator: '==', value: tenantId }],
    orderBy: { field: 'createdAt', direction: 'desc' },
  });

  return NextResponse.json({ tickets: all });
}
