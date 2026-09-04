/**
 * A/B Testing Email — com-ab-1
 *
 * Flow :
 *   1. POST /api/crm/ab-test/create — crée un test A/B avec 2 variants
 *      Envoie variant A à 10% des clients, variant B à 10%, aucun aux 80% restants
 *   2. POST /api/crm/ab-test/resolve?testId — déclare un gagnant et envoie aux 80%
 *   3. GET  /api/crm/ab-test?testId         — état du test (stats open rates)
 *
 * Structure Nexus :
 *   tenants/{tenantId}/abTests/{testId}
 *   { variantA: CampaignVariant; variantB: CampaignVariant; status; winnerId; ... }
 *
 * Protégé : requireTenantAdmin.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { parsePaginationParams, paginateAfterId } from '@/lib/api/pagination';

interface CampaignVariant {
  variantId:   string;
  subject:     string;
  body:        string;
  recipientIds: string[];
  sentAt?:     string;
}

interface ABTest {
  testId:      string;
  name:        string;
  status:      'running' | 'resolved';
  variantA:    CampaignVariant;
  variantB:    CampaignVariant;
  holdoutIds:  string[];
  winnerId?:   string;
  createdAt:   string;
  resolvedAt?: string;
}

function splitCustomers(ids: string[]): { groupA: string[]; groupB: string[]; holdout: string[] } {
  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  const size10   = Math.max(1, Math.floor(ids.length * 0.1));
  return {
    groupA:  shuffled.slice(0, size10),
    groupB:  shuffled.slice(size10, size10 * 2),
    holdout: shuffled.slice(size10 * 2),
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  const action = req.nextUrl.searchParams.get('action');

  if (action === 'resolve') {
    const testId  = req.nextUrl.searchParams.get('testId');
    if (!testId) return NextResponse.json({ error: 'testId requis' }, { status: 400 });

    let body: { winnerId: 'A' | 'B' };
    try {
      body = await req.json() as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const test = await Nexus.adapter.get(`tenants/${tenantId}/abTests/${testId}`) as ABTest | null;
    if (!test) return NextResponse.json({ error: 'Test non trouvé' }, { status: 404 });
    if (test.status === 'resolved') return NextResponse.json({ error: 'Test déjà résolu' }, { status: 409 });

    const winner   = body.winnerId === 'A' ? test.variantA : test.variantB;
    const winnerVariantId = winner.variantId;

    await Nexus.adapter.set(`tenants/${tenantId}/abTests/${testId}`, {
      ...test,
      status:     'resolved',
      winnerId:   winnerVariantId,
      resolvedAt: new Date().toISOString(),
      holdoutCampaign: {
        subject:      winner.subject,
        body:         winner.body,
        recipientIds: test.holdoutIds,
        scheduledAt:  new Date().toISOString(),
      },
    });

    logger.info(`[A/B] Test ${testId} résolu — gagnant variant ${body.winnerId} → envoi 80% holdout`);
    return NextResponse.json({
      success:   true,
      testId,
      winnerId:  winnerVariantId,
      holdoutCount: test.holdoutIds.length,
      status:    'resolved',
    });
  }

  // Create new A/B test
  let body: { name: string; customerIds: string[]; variantA: { subject: string; body: string }; variantB: { subject: string; body: string } };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, customerIds, variantA, variantB } = body;
  if (!name || !customerIds?.length || !variantA || !variantB) {
    return NextResponse.json({ error: 'name, customerIds, variantA, variantB requis' }, { status: 400 });
  }

  const { groupA, groupB, holdout } = splitCustomers(customerIds);
  const testId = crypto.randomUUID();
  const now    = new Date().toISOString();

  const test: ABTest = {
    testId,
    name,
    status:     'running',
    variantA:   { variantId: `${testId}_A`, ...variantA, recipientIds: groupA, sentAt: now },
    variantB:   { variantId: `${testId}_B`, ...variantB, recipientIds: groupB, sentAt: now },
    holdoutIds: holdout,
    createdAt:  now,
  };

  await Nexus.adapter.set(`tenants/${tenantId}/abTests/${testId}`, test);

  logger.info(`[A/B] Test "${name}" créé — A:${groupA.length} B:${groupB.length} holdout:${holdout.length}`);
  return NextResponse.json({
    success:  true,
    testId,
    groupA:   groupA.length,
    groupB:   groupB.length,
    holdout:  holdout.length,
    status:   'running',
  });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireTenantAdmin(req);
  if (isDenied(caller)) return caller as NextResponse;
  const { tenantId } = caller as { tenantId: string };

  const testId = req.nextUrl.searchParams.get('testId');

  if (testId) {
    const test = await Nexus.adapter.get(`tenants/${tenantId}/abTests/${testId}`);
    if (!test) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
    return NextResponse.json(test);
  }

  const tests = await Nexus.adapter.query<ABTest>(`tenants/${tenantId}/abTests`);
  const page = paginateAfterId(tests, parsePaginationParams(req.url), test => test.testId);
  return NextResponse.json({ tests: page.items, total: page.total, nextCursor: page.nextCursor });
}
