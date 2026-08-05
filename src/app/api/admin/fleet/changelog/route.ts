/**
 * Fleet Changelog — historique complet et catégorisé par tenant ou flotte.
 *
 * GET /api/admin/fleet/changelog
 *   ?tenantId=xxx             → historique du tenant (50 entrées max)
 *   ?tenantId=xxx&limit=100   → avec limite custom
 *   ?category=UPGRADE         → filtré par catégorie (combinable avec tenantId)
 *   ?scope=fleet              → entrées fleet uniquement (__FLEET__)
 *
 * Protégé : mcc_support.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { ChangelogService, type ChangeCategory } from '@/lib/mcc/ChangelogService';

const VALID_CATEGORIES = new Set<ChangeCategory>([
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
