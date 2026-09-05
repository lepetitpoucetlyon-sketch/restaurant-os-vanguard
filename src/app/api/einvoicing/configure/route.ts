import { type NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withMccRoute } from '@/lib/server/routeWrapper';
import {
  EInvoicingService,
  EInvoiceProviderConfigSchema,
  PlatformEInvoiceConfigSchema,
} from '@/modules/finance';
import { z } from 'zod';

/**
 * POST /api/einvoicing/configure
 *
 * Configure la Plateforme Agréée pour un tenant (override) ou pour la
 * plateforme entière (mode SaaS multi-entreprise). Accès MCC ≥ 100.
 *
 * Body :
 *   { scope: 'tenant', tenantId: string, companyName: string, config: EInvoiceProviderConfig }
 *   { scope: 'platform', config: PlatformEInvoiceConfig }
 */

const TenantConfigBodySchema = z.object({
  scope: z.literal('tenant'),
  tenantId: z.string().min(1),
  companyName: z.string().min(1),
  config: EInvoiceProviderConfigSchema,
});

const PlatformConfigBodySchema = z.object({
  scope: z.literal('platform'),
  config: PlatformEInvoiceConfigSchema,
});

const BodySchema = z.discriminatedUnion('scope', [
  TenantConfigBodySchema,
  PlatformConfigBodySchema,
]);

export const POST = withMccRoute(
  async (req: NextRequest, ctx): Promise<NextResponse> => {
    try {
      const body = await req.json();
      const parsed = BodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? 'Payload invalide' },
          { status: 400 },
        );
      }

      if (parsed.data.scope === 'tenant') {
        await EInvoicingService.configureForTenant(
          parsed.data.tenantId,
          parsed.data.config,
          parsed.data.companyName,
        );
        return NextResponse.json({
          ok: true,
          scope: 'tenant',
          tenantId: parsed.data.tenantId,
          providerId: parsed.data.config.providerId,
        });
      }

      await EInvoicingService.configurePlatform(parsed.data.config);
      return NextResponse.json({
        ok: true,
        scope: 'platform',
        providerId: parsed.data.config.providerId,
      });
    } catch (err) {
      logger.error('[EInvoicing/configure] POST', { error: err, correlationId: ctx.correlationId });
      const message = err instanceof Error ? err.message : 'Erreur serveur';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  },
  { minLevel: 'mcc_super_admin' },
);

export const GET = withMccRoute(
  async (req: NextRequest, ctx): Promise<NextResponse> => {
    try {
      const url = new URL(req.url);
      const tenantId = url.searchParams.get('tenantId');

      if (tenantId) {
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        const { tenantEInvoiceConfigPath } = await import('@/modules/finance');
        const config = await Nexus.adapter.get(tenantEInvoiceConfigPath(tenantId));
        if (!config) return NextResponse.json({ configured: false });
        const safe = { ...(config as Record<string, unknown>), apiKey: '***', webhookSecret: '***' };
        return NextResponse.json({ configured: true, config: safe });
      }

      const { Nexus } = await import('@/lib/nexus/NexusAdapter');
      const { PLATFORM_EINVOICE_CONFIG_PATH } = await import('@/modules/finance');
      const config = await Nexus.adapter.get(PLATFORM_EINVOICE_CONFIG_PATH);
      if (!config) return NextResponse.json({ configured: false });
      const safe = { ...(config as Record<string, unknown>), apiKey: '***', webhookSecret: '***' };
      return NextResponse.json({ configured: true, scope: 'platform', config: safe });
    } catch (err) {
      logger.error('[EInvoicing/configure] GET', { error: err, correlationId: ctx.correlationId });
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
  },
  { minLevel: 'mcc_super_admin' },
);

