/**
 * Fleet Changelog — historique complet et catégorisé par tenant ou flotte.
 *
 * GET /api/admin/fleet/changelog
 *   ?tenantId=xxx             → historique du tenant (50 entrées max)
 *   ?tenantId=xxx&limit=100   → avec limite custom
 *   ?category=UPGRADE         → filtré par catégorie (combinable avec tenantId)
 *   ?scope=fleet              → entrées fleet uniquement (__FLEET__)
 *
 * POST /api/admin/fleet/changelog
 *   body: { tenantId, title, description, category?, action?, authorName?, authorType?, key?, before?, after?, tags? }
 *
 * Protégé : mcc_support.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { ChangelogService, type ChangeCategory, type AuthorType } from '@/lib/mcc/ChangelogService';

const VALID_CATEGORIES = new Set<ChangeCategory>([
  'GENESIS', 'DEV_HOTFIX', 'CORE_UPDATE', 'EVOLUTION',
  'UI_OVERRIDE', 'FEATURE_FLAG', 'BILLING', 'UPGRADE',
  'DEBUG', 'CONFIG', 'MAINTENANCE', 'ROLLOUT', 'CUSTOM',
]);

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const params   = req.nextUrl.searchParams;
  const tenantId = params.get('tenantId') ?? undefined;
  const scope    = params.get('scope');
  const rawCat   = params.get('category');
  const limit    = Math.min(parseInt(params.get('limit') ?? '50', 10), 200);

  const category = rawCat && VALID_CATEGORIES.has(rawCat as ChangeCategory)
    ? (rawCat as ChangeCategory)
    : undefined;

  if (scope === 'fleet') {
    const entries = await ChangelogService.getForTenant('__FLEET__', limit);
    return NextResponse.json({ changelog: entries, total: entries.length });
  }

  if (category) {
    const entries = await ChangelogService.getByCategory(category, tenantId, limit);
    return NextResponse.json({ changelog: entries, total: entries.length });
  }

  if (tenantId) {
    const entries = await ChangelogService.getForTenant(tenantId, limit);
    return NextResponse.json({ changelog: entries, total: entries.length });
  }

  // Default: full fleet changelog (all tenants, sorted by date)
  const entries = await ChangelogService.getFleet(limit);
  return NextResponse.json({ changelog: entries, total: entries.length });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const body = await req.json().catch(() => null) as {
    tenantId?: string;
    title?: string;
    description?: string;
    category?: ChangeCategory;
    action?: string;
    key?: string;
    before?: unknown;
    after?: unknown;
    authorName?: string;
    authorType?: AuthorType;
    tags?: string[];
    scope?: 'tenant' | 'fleet' | 'pilot';
  } | null;

  if (!body?.tenantId?.trim() || !body?.description?.trim()) {
    return NextResponse.json({ error: 'tenantId et description sont requis' }, { status: 400 });
  }

  const tenantId = body.tenantId.trim();
  const isFleet = tenantId === '__FLEET__';
  const category = (body.category && VALID_CATEGORIES.has(body.category)) ? body.category : 'DEV_HOTFIX';
  const action = body.action?.trim() || (category === 'DEV_HOTFIX' ? 'DEV_MANUAL_HOTFIX' : 'MANUAL_CHANGE');

  const callerEmail = 'email' in caller && typeof caller.email === 'string' ? caller.email : undefined;
  const callerUid = 'uid' in caller && typeof caller.uid === 'string' ? caller.uid : 'mcc-operator';
  const appliedBy = callerEmail || callerUid;

  const entry = await ChangelogService.record({
    tenantId,
    title: body.title?.trim() || body.description.trim().slice(0, 80),
    description: body.description.trim(),
    category,
    action,
    key: body.key,
    before: body.before,
    after: body.after,
    appliedBy,
    authorName: body.authorName?.trim() || (callerEmail ? callerEmail.split('@')[0] : 'Développeur MCC'),
    authorType: body.authorType || 'developer',
    tags: body.tags || [category.toLowerCase(), 'manual-entry'],
    scope: body.scope || (isFleet ? 'fleet' : 'tenant'),
  });

  return NextResponse.json({ success: true, entry }, { status: 201 });
}
