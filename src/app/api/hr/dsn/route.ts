/**
 * POST /api/hr/dsn    — générer + soumettre + archiver la DSN mensuelle
 * GET  /api/hr/dsn    — lister les DSN archivées
 *
 * Body POST : { period: "2026-07" }
 *
 * Flux :
 *   1. DSNBuilder.generate() → XML DSN phase 3
 *   2. DSNBuilder.submit()   → POST net-entreprises.fr (si URSSAF_API_KEY)
 *   3. DSNBuilder.archive()  → Nexus tenants/{tenantId}/dsn/{period}
 *
 * Protégé : requireTenantAdmin.
 * ENV : URSSAF_API_KEY (optionnel — sans clé, mode simulation)
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { DSNBuilder } from '@/modules/human';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { parsePaginationParams, paginateAfterId } from '@/lib/api/pagination';

const DsnPostSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'period requis au format YYYY-MM'),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  const parsed = DsnPostSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Payload invalide', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const period = parsed.data.period;

  // Vérifier qu'une DSN n'a pas déjà été soumise pour cette période
  const existing = await Nexus.adapter.get(`tenants/${tenantId}/dsn/${period}`) as { submittedAt?: number } | null;
  if (existing?.submittedAt) {
    return NextResponse.json({ error: `DSN déjà soumise pour ${period}` }, { status: 409 });
  }

  const decl = await DSNBuilder.generate(tenantId, period);
  const { submitted, reference } = await DSNBuilder.submit(decl);
  await DSNBuilder.archive({ ...decl, submittedAt: submitted ? Date.now() : null }, reference);

  return NextResponse.json({
    period,
    employeeCount: decl.employeeCount,
    grossWageTotal: decl.grossWageTotal,
    socialContribTotal: decl.socialContribTotal,
    submitted,
    reference: reference ?? null,
    mode: submitted ? 'live' : 'simulation',
  }, { status: 201 });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  // Pagination cursor-based (audit S7) : garde le tri par période décroissante côté DB,
  // découpe côté serveur via l'id du document (idéalement = période).
  const pagination = parsePaginationParams(req.url);
  const docs = await Nexus.adapter.query<{ id?: string; period?: string }>(
    `tenants/${tenantId}/dsn`,
    { orderBy: { field: 'period', direction: 'desc' }, limit: 500 },
  );
  const paged = paginateAfterId(docs, pagination, (d) => d.id ?? d.period);
  return NextResponse.json({ declarations: paged.items, total: paged.total, nextCursor: paged.nextCursor });
}
