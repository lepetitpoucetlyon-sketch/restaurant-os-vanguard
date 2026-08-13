import { NextRequest, NextResponse } from 'next/server';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import {
  CRMAutomationConfigSchema,
  CRM_CONFIG_DEFAULTS,
  crmConfigPath,
} from '@/modules/commerce/relation/crm/CRMAutomationConfig';

/**
 * §10 — Automatisations CRM : seuils configurables par le tenant
 *
 * GET  /api/tenant/settings/crm  → config actuelle (avec defaults)
 * POST /api/tenant/settings/crm  → mettre à jour
 * Auth : manager minimum
 */

export async function GET(request: NextRequest) {
  try {
    const caller = await requireTenantRole(request, 'manager');
    if (isDenied(caller)) return caller as NextResponse;
    const { tenantId } = caller;

    const raw = await Nexus.adapter.get(crmConfigPath(tenantId));
    const config = CRMAutomationConfigSchema.parse({ ...CRM_CONFIG_DEFAULTS, ...(raw ?? {}) });
    return NextResponse.json(config);
  } catch (err) {
    logger.error('[crm/settings] GET', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const caller = await requireTenantRole(request, 'manager');
    if (isDenied(caller)) return caller as NextResponse;
    const { tenantId } = caller;

    const body = await request.json();
    const parsed = CRMAutomationConfigSchema.safeParse({ ...CRM_CONFIG_DEFAULTS, ...body });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Payload invalide' },
        { status: 400 },
      );
    }

    await Nexus.adapter.set(crmConfigPath(tenantId), parsed.data, { merge: true });
    logger.info(`[crm/settings] Config CRM mise à jour pour ${tenantId}`);
    return NextResponse.json({ ok: true, config: parsed.data });
  } catch (err) {
    logger.error('[crm/settings] POST', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
