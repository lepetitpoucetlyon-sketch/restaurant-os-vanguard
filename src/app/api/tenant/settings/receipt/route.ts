import { NextRequest, NextResponse } from 'next/server';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { ReceiptLayoutConfigSchema, receiptConfigPath, RECEIPT_CONFIG_DEFAULTS } from '@/modules/ops/service/pos/ReceiptLayoutConfig';

/**
 * GET  /api/tenant/settings/receipt — Lire la config ticket du tenant
 * POST /api/tenant/settings/receipt — Sauvegarder la config ticket
 * Auth : manager minimum
 */

export async function GET(request: NextRequest) {
  try {
    const caller = await requireTenantRole(request, 'manager');
    if (isDenied(caller)) return caller as NextResponse;
    const { tenantId } = caller;

    const raw = await Nexus.adapter.get(receiptConfigPath(tenantId));
    const config = ReceiptLayoutConfigSchema.parse({ ...RECEIPT_CONFIG_DEFAULTS, ...(raw ?? {}) });
    return NextResponse.json(config);
  } catch (err) {
    logger.error('[receipt/settings] GET', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const caller = await requireTenantRole(request, 'manager');
    if (isDenied(caller)) return caller as NextResponse;
    const { tenantId } = caller;

    const body = await request.json();
    const parsed = ReceiptLayoutConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Payload invalide' },
        { status: 400 },
      );
    }

    await Nexus.adapter.set(receiptConfigPath(tenantId), parsed.data, { merge: true });
    logger.info(`[receipt/settings] Config ticket mise à jour pour ${tenantId}`);
    return NextResponse.json({ ok: true, config: parsed.data });
  } catch (err) {
    logger.error('[receipt/settings] POST', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
