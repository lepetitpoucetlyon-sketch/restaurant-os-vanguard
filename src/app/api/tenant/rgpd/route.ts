/**
 * Registre RGPD tenant — Art. 30
 *
 * GET  /api/tenant/rgpd                — liste les demandes RGPD du tenant
 * GET  /api/tenant/rgpd?summary=true   — résumé (compteurs, délai moyen)
 * POST /api/tenant/rgpd                — créer une demande (erasure, access, rectification, portability, objection)
 *
 * Protégé : admin/manager du tenant (claims Firebase).
 * Le tenantId vient du token — jamais du body.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { RgpdRegisterService } from '@/modules/compliance';
import { z } from 'zod';

const CreateRequestSchema = z.object({
  subjectId: z.string().min(1),
  subjectEmail: z.string().email().optional(),
  type: z.enum(['erasure', 'access', 'rectification', 'portability', 'objection']),
  reason: z.string().optional(),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = (caller as { tenantId: string }).tenantId;
  const wantSummary = req.nextUrl.searchParams.get('summary') === 'true';

  if (wantSummary) {
    const summary = await RgpdRegisterService.getSummary(tenantId);
    return NextResponse.json(summary);
  }

  const status = req.nextUrl.searchParams.get('status') as 'pending' | 'processing' | 'completed' | 'rejected' | null;
  const requests = await RgpdRegisterService.listRequests(tenantId, {
    status: status ?? undefined,
  });

  return NextResponse.json({ requests, total: requests.length });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = (caller as { tenantId: string }).tenantId;

  let body: z.infer<typeof CreateRequestSchema>;
  try {
    body = CreateRequestSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
  }

  const request = await RgpdRegisterService.createRequest(tenantId, body);

  return NextResponse.json(request, { status: 201 });
}
