import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import type { IEInvoicingProvider } from './IEInvoicingProvider';
import type { EInvoiceProviderConfig, PlatformEInvoiceConfig } from './EInvoiceProviderConfig';
import {
  EInvoiceProviderConfigSchema,
  PLATFORM_EINVOICE_CONFIG_PATH,
  tenantEInvoiceConfigPath,
} from './EInvoiceProviderConfig';
import { SuperPdpProvider } from './SuperPdpProvider';
import { DirectApiEInvoicingProvider } from './DirectApiEInvoicingProvider';
import { MockEInvoicingProvider } from './MockEInvoicingProvider';

function buildProvider(config: EInvoiceProviderConfig): IEInvoicingProvider {
  switch (config.providerId) {
    case 'super-pdp':
      return new SuperPdpProvider(config.apiKey, config.sandboxMode);
    case 'direct-api':
      return new DirectApiEInvoicingProvider(
        config.apiKey,
        config.customEndpointUrl,
        config.sandboxMode,
      );
    case 'b2brouter':
      // Skeleton — implémenter B2BrouterProvider quand le contrat est signé
      logger.warn('[EInvoiceFactory] b2brouter non implémenté — fallback mock');
      return new MockEInvoicingProvider();
    case 'mock':
      return new MockEInvoicingProvider();
  }
}

/**
 * Résolution du provider e-invoicing pour un tenant.
 *
 * Priorité :
 *   1. Override tenant (tenants/{id}/config/einvoice_provider) — rare, pour tenants avec PA propre
 *   2. Config plateforme (platform/settings/einvoice_config) — mode SaaS standard
 *   3. Mock — fallback dev/test
 */
export const EInvoiceProviderFactory = {
  async forTenant(tenantId: string): Promise<IEInvoicingProvider> {
    // 1. Override tenant
    const tenantConfig = await Nexus.adapter.get<EInvoiceProviderConfig>(
      tenantEInvoiceConfigPath(tenantId),
    );
    if (tenantConfig) {
      const parsed = EInvoiceProviderConfigSchema.safeParse(tenantConfig);
      if (parsed.success) {
        logger.info(`[EInvoiceFactory] Provider tenant "${parsed.data.providerId}" pour ${tenantId}`);
        return buildProvider(parsed.data);
      }
      logger.warn('[EInvoiceFactory] Config tenant invalide — fallback plateforme', tenantId);
    }

    // 2. Config plateforme
    const platformConfig = await Nexus.adapter.get<PlatformEInvoiceConfig>(
      PLATFORM_EINVOICE_CONFIG_PATH,
    );
    if (platformConfig) {
      const parsed = EInvoiceProviderConfigSchema.safeParse(platformConfig);
      if (parsed.success) {
        logger.info(`[EInvoiceFactory] Provider plateforme "${parsed.data.providerId}" pour ${tenantId}`);
        return buildProvider(parsed.data);
      }
      logger.warn('[EInvoiceFactory] Config plateforme invalide — fallback mock');
    }

    // 3. Mock (dev / avant configuration PA)
    return new MockEInvoicingProvider();
  },

  /** Provider plateforme uniquement — pour la facturation SaaS (abonnements tenants). */
  async forPlatform(): Promise<IEInvoicingProvider> {
    const config = await Nexus.adapter.get<PlatformEInvoiceConfig>(PLATFORM_EINVOICE_CONFIG_PATH);
    if (!config) {
      logger.warn('[EInvoiceFactory] Pas de config plateforme — mock actif');
      return new MockEInvoicingProvider();
    }
    const parsed = EInvoiceProviderConfigSchema.safeParse(config);
    if (!parsed.success) {
      logger.error('[EInvoiceFactory] Config plateforme invalide', parsed.error.flatten());
      return new MockEInvoicingProvider();
    }
    return buildProvider(parsed.data);
  },
};
