import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireMccLevel, isDenied } from '@/lib/server/adminAuthGuard';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { ChangelogService } from '@/lib/mcc/ChangelogService';
import { logger } from '@/lib/logger';

/**
 * Calcule le prorata en microunits pour un plugin activé/désactivé en cours de cycle.
 * @param pricePerMonthInMicrounits  Prix mensuel du plugin (0 = gratuit)
 * @param action                     'activate' | 'deactivate'
 * @returns montant proratable (positif si activation, négatif si désactivation)
 */
function computePluginProrata(
  pricePerMonthInMicrounits: number,
  action: 'activate' | 'deactivate',
): number {
  if (pricePerMonthInMicrounits <= 0) return 0;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = daysInMonth - now.getDate() + 1; // inclut aujourd'hui
  const dailyRate = pricePerMonthInMicrounits / daysInMonth;
  const amount = Math.round(dailyRate * remainingDays);
  return action === 'activate' ? amount : -amount;
}

const PluginPostSchema = z.object({
  tenantId: z.string().min(1),
  pluginId: z.string().min(1),
  config: z.record(z.string(), z.unknown()).optional()
});

const PluginDeleteSchema = z.object({
  tenantId: z.string().min(1),
  pluginId: z.string().min(1)
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_support');
  if (isDenied(caller)) return caller as NextResponse;

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  
  // Fetch dynamic catalog
  const catalogDoc = await Nexus.adapter.get('mcc/empire/plugin-catalog') as { items?: Record<string, unknown> } | null;
  const dynamicCatalog = catalogDoc?.items || {};

  if (!tenantId) return NextResponse.json({ catalog: dynamicCatalog });

  const config = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as { plugins?: Record<string, unknown> } | null;
  return NextResponse.json({ tenantId, activePlugins: config?.plugins || {}, catalog: dynamicCatalog });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_super_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: z.infer<typeof PluginPostSchema>;
  try {
    body = PluginPostSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
  }

  const { tenantId, pluginId, config = {} } = body;
  
  // Verify plugin exists in dynamic catalog
  const catalogDoc = await Nexus.adapter.get('mcc/empire/plugin-catalog') as { items?: Record<string, unknown> } | null;
  const pluginInfo = catalogDoc?.items?.[pluginId];

  if (!pluginInfo) {
    return NextResponse.json({ error: 'Plugin not found in catalog' }, { status: 404 });
  }

  // Retrieve current config to log the 'before' state
  const currentConfig = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as { plugins?: Record<string, unknown> } | null;
  const beforePlugins = currentConfig?.plugins || {};

  const pluginPayload = {
    active: true,
    activatedAt: new Date().toISOString(),
    config
  };

  // Merge deeply into tenantConfig
  await Nexus.adapter.set(
    `tenants/${tenantId}/tenantConfig`,
    { plugins: { [pluginId]: pluginPayload } },
    { merge: true }
  );

  // Recalcul billing : prorata pour la fin du mois en cours
  const pluginPrice = (pluginInfo as { pricePerMonthInMicrounits?: number }).pricePerMonthInMicrounits ?? 0;
  const prorataInMicrounits = computePluginProrata(pluginPrice, 'activate');
  if (prorataInMicrounits > 0) {
    await Nexus.adapter.set(
      `mcc/billingAdjustments/${tenantId}/${pluginId}_${Date.now()}`,
      {
        tenantId,
        pluginId,
        reason: 'plugin_activation_proration',
        amountInMicrounits: prorataInMicrounits,
        appliedAt: new Date().toISOString(),
        appliedBy: caller.uid,
        cycleMonth: new Date().toISOString().slice(0, 7),
      },
    );
    logger.info(`[PluginBilling] Prorata activation ${pluginId} sur ${tenantId} : ${prorataInMicrounits}µ`);
  }

  await ChangelogService.record({
    tenantId,
    action: 'PLUGIN_ACTIVATED',
    key: `plugins.${pluginId}`,
    before: beforePlugins[pluginId] || null,
    after: pluginPayload,
    description: `Activation du module ${(pluginInfo as { name?: string }).name || pluginId} par ${caller.uid}`,
    appliedBy: caller.uid,
    scope: 'tenant',
  });

  logger.info(`[PluginEngine] Plugin ${pluginId} activé sur ${tenantId} par ${caller.uid}`);
  return NextResponse.json({ success: true, tenantId, pluginId, payload: pluginPayload });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const caller = await requireMccLevel(req, 'mcc_super_admin');
  if (isDenied(caller)) return caller as NextResponse;

  let body: z.infer<typeof PluginDeleteSchema>;
  try {
    body = PluginDeleteSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
  }

  const { tenantId, pluginId } = body;

  const currentConfig = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`) as { plugins?: Record<string, unknown> } | null;
  const beforePlugins = currentConfig?.plugins || {};

  // We set active: false rather than deleting the key to preserve history and config
  const pluginPayload = {
    ...(beforePlugins[pluginId] || {}),
    active: false,
    deactivatedAt: new Date().toISOString()
  };

  await Nexus.adapter.set(
    `tenants/${tenantId}/tenantConfig`,
    { plugins: { [pluginId]: pluginPayload } },
    { merge: true }
  );

  // Recalcul billing : crédit prorata pour les jours non consommés
  const catalogOnDel = await Nexus.adapter.get('mcc/empire/plugin-catalog') as { items?: Record<string, unknown> } | null;
  const pluginInfoOnDel = catalogOnDel?.items?.[pluginId];
  const priceOnDel = (pluginInfoOnDel as { pricePerMonthInMicrounits?: number } | undefined)?.pricePerMonthInMicrounits ?? 0;
  const prorataCredit = computePluginProrata(priceOnDel, 'deactivate');
  if (prorataCredit < 0) {
    await Nexus.adapter.set(
      `mcc/billingAdjustments/${tenantId}/${pluginId}_${Date.now()}`,
      {
        tenantId,
        pluginId,
        reason: 'plugin_deactivation_credit',
        amountInMicrounits: prorataCredit,
        appliedAt: new Date().toISOString(),
        appliedBy: caller.uid,
        cycleMonth: new Date().toISOString().slice(0, 7),
      },
    );
    logger.info(`[PluginBilling] Crédit désactivation ${pluginId} sur ${tenantId} : ${prorataCredit}µ`);
  }

  await ChangelogService.record({
    tenantId,
    action: 'PLUGIN_DEACTIVATED',
    key: `plugins.${pluginId}`,
    before: beforePlugins[pluginId] || null,
    after: pluginPayload,
    description: `Désactivation du module ${pluginId} par ${caller.uid}`,
    appliedBy: caller.uid,
    scope: 'tenant',
  });

  logger.info(`[PluginEngine] Plugin ${pluginId} désactivé sur ${tenantId} par ${caller.uid}`);
  return NextResponse.json({ success: true, tenantId, pluginId });
}
