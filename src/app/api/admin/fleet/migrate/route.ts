import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { migrationRunner } from '@/lib/migrations/MigrationRunner';
import { logger } from '@/lib/logger';

// ─────────────────────────────────────────────────────────────────
// POST /api/admin/fleet/migrate
// Query: ?target=all|{tenantId}
// Admin-only: applies pending migrations
// ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const caller = await requireMccLevel(request, 'mcc_super_admin');
  if (isDenied(caller)) return caller;

  const target = request.nextUrl.searchParams.get('target') ?? 'all';

  try {
    if (target === 'all') {
      const results = await migrationRunner.runForAllTenants();
      const summary = Object.fromEntries(results);
      logger.info(`[migrate] Fleet migration complete: ${results.size} tenant(s) affected`);
      return NextResponse.json({ status: 'ok', tenantsAffected: results.size, results: summary });
    } else {
      const results = await migrationRunner.runForTenant(target);
      logger.info(`[migrate] Tenant ${target} migration complete: ${results.length} migration(s)`);
      return NextResponse.json({ status: 'ok', tenantId: target, results });
    }
  } catch (err) {
    logger.error('[migrate] Migration failed', err);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const caller = await requireMccLevel(request, 'mcc_super_admin');
  if (isDenied(caller)) return caller;

  const target = request.nextUrl.searchParams.get('tenant');
  if (!target) {
    return NextResponse.json({ error: 'Missing ?tenant= parameter' }, { status: 400 });
  }

  try {
    const pending = await migrationRunner.getPendingMigrations(target);
    const applied = await migrationRunner.getAppliedMigrations(target);
    return NextResponse.json({
      tenantId: target,
      appliedCount: applied.size,
      pendingCount: pending.length,
      pendingMigrations: pending.map((m) => ({ id: m.id, description: m.description })),
    });
  } catch (err) {
    logger.error('[migrate] Status check failed', err);
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}
