import { randomBytes } from 'crypto';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { validatePin } from '@/lib/auth/validatePin';
import { hashPin } from '@/lib/shared-kernel';
import { resolveDNA } from '@/shared/seeds';
import { FiscalKeyService } from '@/kernel/services/crypto/FiscalKeyService';
import { PCG_ACCOUNTS } from '@/shared/seeds/pcg-accounts';
import type { FiscalSeal } from '@nexus/contracts/finance.types';
import { FloorSchema, ZoneSchema, TableSchema, type Floor, type Zone, type Table } from '@nexus/contracts';
import { CONNECTOR_CATALOG } from '@/shared/connector-manifest';
import type { ConnectorState } from '@/shared/connector-manifest';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { getSystemTenantTier } from '@/lib/mcc/SystemTenantRegistry';
import type { SystemTier } from '@/lib/mcc/SystemTenantRegistry';
import { toError } from "@/lib/toError";

export interface SeedInput {
  tenantId: string;
  name: string;
  adminEmail: string;
  variant?: import('@nexus/contracts').PlatformVariant;
  /** 4-digit PIN for the admin user — omit to let TenantSeeder generate a secure one */
  adminPin?: string;
  siren?: string;
  primaryColor?: string;
  /** Nombre de jours d'essai. Si défini et > 0, licenceStatus = 'TRIAL' au lieu de 'ACTIVE'. */
  trialDays?: number;
}

/**
 * Generates a cryptographically secure 4-digit PIN (1000–9999).
 * Retries until the PIN passes validatePin (not in blacklist).
 */
function generateSecurePin(): string {
  let pin: string;
  do {
    pin = String(1000 + (parseInt(randomBytes(2).toString('hex'), 16) % 9000));
  } while (!validatePin(pin).valid);
  return pin;
}

/**
 * Returns a safe PIN — generates one if the provided PIN is weak, blacklisted,
 * or absent. Logs a warning (with the generated PIN) when a replacement occurs.
 */
function resolveAdminPin(adminPin: string | undefined, adminEmail: string): string {
  const validation = adminPin ? validatePin(adminPin) : { valid: false };
  if (validation.valid) return adminPin as string;

  const generated = generateSecurePin();
  logger.warn(
    `[TenantSeeder] Weak or missing adminPin detected for ${adminEmail}. ` +
    `A secure PIN has been generated: ${generated}. ` +
    `Please communicate this PIN to the admin securely.`
  );
  return generated;
}

interface SeedResult {
  success: boolean;
  seededPaths: string[];
  error?: string;
}

/**
 * Seeds a brand-new tenant with all required Firestore documents.
 * Idempotent: bails if tenantConfig already exists.
 */
export const TenantSeeder = {
  async seed(input: SeedInput): Promise<SeedResult> {
    const { tenantId, name, adminEmail, siren, primaryColor, variant = 'restaurant', trialDays } = input;
    const adminPin = resolveAdminPin(input.adminPin, input.adminEmail);
    const seededPaths: string[] = [];
    const baseDNA = resolveDNA(variant);

    logger.info(`[TenantSeeder] Seeding tenant ${tenantId} (variant=${variant})...`);

    try {
      // Idempotency guard — if tenantConfig exists, skip
      const existing = await Nexus.adapter.get(`tenants/${tenantId}/tenantConfig`);
      if (existing) {
        logger.info(`[TenantSeeder] Tenant ${tenantId} already seeded — skipping`);
        return { success: true, seededPaths: [] };
      }

      // 1. tenantConfig
      // Clé de scellement NF525 : générée par tenant, jamais une constante.
      // Lisible uniquement par le staff du tenant (firestore.rules) ; chargée
      // en mémoire via FiscalKeyService.provision() au sync de la config.
      const fiscalSigningKey = FiscalKeyService.generateKey();
      const config = {
        ...baseDNA,
        id: tenantId,
        variant,
        name,
        fiscalSigningKey,
        metadata: {
          ...baseDNA.metadata,
          name,
          ownerId: adminEmail,
          createdAt: Date.now(),
          siren: siren ?? '',
        },
        theme: {
          ...baseDNA.theme,
          primaryColor: primaryColor ?? baseDNA.theme?.primaryColor ?? '#C5A059',
        },
        status: {
          ...baseDNA.status,
          updatedAt: Date.now(),
          ...(trialDays && trialDays > 0 ? {
            licenceStatus: 'TRIAL' as const,
            trialEndsAt: new Date(Date.now() + trialDays * 86_400_000).toISOString(),
            trialDays,
          } : {}),
        },
      };
      await Nexus.adapter.set(`tenants/${tenantId}/tenantConfig`, config);
      seededPaths.push(`tenants/${tenantId}/tenantConfig`);

      // 2. PCG accounts
      await Promise.all(
        PCG_ACCOUNTS.map((account) =>
          Nexus.adapter.set(`tenants/${tenantId}/accounts/${account.number}`, {
            ...account,
            id: account.number,
            balanceInCents: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        )
      );
      seededPaths.push(`tenants/${tenantId}/accounts (${PCG_ACCOUNTS.length} comptes PCG)`);

      // 3. Admin user — PIN stocké en hash SHA-256, jamais en clair
      const adminId = `admin_${tenantId}`;
      const adminPinHash = await hashPin(adminPin, adminId);
      await Nexus.adapter.set(`tenants/${tenantId}/users/${adminId}`, {
        id: adminId,
        email: adminEmail,
        pinHash: adminPinHash,
        role: 'admin',
        displayName: `Admin ${name}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      seededPaths.push(`tenants/${tenantId}/users/${adminId}`);

      // 4. Genesis fiscal seal (NF525 — NEVER delete/update)
      const genesisSeal: FiscalSeal = {
        id: 'GENESIS',
        hash: 'GENESIS_ROOT_0000000000000000',
        previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
        sequence: 0,
        algorithm: 'SHA-256',
        timestamp: new Date().toISOString(),
        dataSnapshot: JSON.stringify({ genesis: true, tenantId }),
        updatedAt: new Date().toISOString(),
      };
      await Nexus.adapter.set(`tenants/${tenantId}/fiscalSeals/GENESIS`, genesisSeal);
      seededPaths.push(`tenants/${tenantId}/fiscalSeals/GENESIS`);

      // 5. Default floor + zones + tables
      const floor: Floor = FloorSchema.parse({
        id: 'floor-rdc',
        name: 'Salle principale',
        level: 0,
        isActive: true,
      });
      await Nexus.adapter.set(`tenants/${tenantId}/floors/floor-rdc`, floor);
      seededPaths.push(`tenants/${tenantId}/floors/floor-rdc`);

      const zones: Zone[] = [
        { id: 'zone-interieur', name: 'Intérieur', color: '#4A90D9', floorId: 'floor-rdc' },
        { id: 'zone-terrasse', name: 'Terrasse', color: '#7ED321', floorId: 'floor-rdc' },
      ].map((z) => ZoneSchema.parse(z));
      await Promise.all(
        zones.map((z) => Nexus.adapter.set(`tenants/${tenantId}/zones/${z.id}`, z))
      );
      seededPaths.push(`tenants/${tenantId}/zones (2)`);

      const tables: Table[] = Array.from({ length: 10 }, (_, i) => TableSchema.parse({
        id: `table-${i + 1}`,
        number: String(i + 1),
        seats: i < 8 ? 4 : 6,
        status: 'free',
        shape: 'rect',
        x: (i % 5) * 160 + 40,
        y: Math.floor(i / 5) * 140 + 40,
        zoneId: i < 8 ? 'zone-interieur' : 'zone-terrasse',
        floorId: 'floor-rdc',
      }));
      await Promise.all(
        tables.map((t) => Nexus.adapter.set(`tenants/${tenantId}/tables/${t.id}`, t))
      );
      seededPaths.push(`tenants/${tenantId}/tables (10)`);

      // 5b. Menu démo — catégories + produits de base pour les verticals food
      if (['restaurant', 'bakery', 'hotel'].includes(variant)) {
        const demoCategories = [
          { id: 'cat-entrees',  name: 'Entrées',   displayOrder: 1, color: '#F5A623' },
          { id: 'cat-plats',    name: 'Plats',     displayOrder: 2, color: '#D0021B' },
          { id: 'cat-desserts', name: 'Desserts',  displayOrder: 3, color: '#9B59B6' },
          { id: 'cat-boissons', name: 'Boissons',  displayOrder: 4, color: '#2980B9' },
        ];
        const demoProducts = [
          { id: 'prod-oeuf-mayo',    name: 'Œuf Mayonnaise',    categoryId: 'cat-entrees',  priceInMicrounits: 5_000_000,  foodCostInMicrounits: 1_250_000, costPriceInCents: 125, taxRate: '0.10', available: true },
          { id: 'prod-soupe',        name: 'Soupe du jour',      categoryId: 'cat-entrees',  priceInMicrounits: 6_500_000,  foodCostInMicrounits: 1_500_000, costPriceInCents: 150, taxRate: '0.10', available: true },
          { id: 'prod-entrecote',    name: 'Entrecôte Frites',   categoryId: 'cat-plats',    priceInMicrounits: 24_000_000, foodCostInMicrounits: 7_200_000, costPriceInCents: 720, taxRate: '0.10', available: true },
          { id: 'prod-poulet',       name: 'Poulet Rôti',        categoryId: 'cat-plats',    priceInMicrounits: 18_000_000, foodCostInMicrounits: 5_000_000, costPriceInCents: 500, taxRate: '0.10', available: true },
          { id: 'prod-mousse-choco', name: 'Mousse au Chocolat', categoryId: 'cat-desserts', priceInMicrounits: 7_000_000,  foodCostInMicrounits: 1_800_000, costPriceInCents: 180, taxRate: '0.10', available: true },
          { id: 'prod-cafe',         name: 'Café Expresso',      categoryId: 'cat-boissons', priceInMicrounits: 2_500_000,  foodCostInMicrounits: 400_000,   costPriceInCents: 40,  taxRate: '0.10', available: true },
          { id: 'prod-eau',          name: 'Eau Minérale 50cl',  categoryId: 'cat-boissons', priceInMicrounits: 3_000_000,  foodCostInMicrounits: 600_000,   costPriceInCents: 60,  taxRate: '0.10', available: true },
        ];
        await Promise.all([
          ...demoCategories.map(c => Nexus.adapter.set(`tenants/${tenantId}/categories/${c.id}`, c)),
          ...demoProducts.map(p => Nexus.adapter.set(`tenants/${tenantId}/products/${p.id}`, p)),
        ]);
        seededPaths.push(`tenants/${tenantId}/categories+products (${demoCategories.length} cats, ${demoProducts.length} produits)`);
      }

      // 6. Auto-activation des connecteurs selon le vertical
      const { ConnectorHub } = await import('@/modules/intelligence');
      const autoIds = ConnectorHub.getAutoActivated(variant);
      const activatedConnectors: { id: string; status: 'active' | 'pending_config' }[] = [];

      await Promise.all(
        autoIds.map(async (id) => {
          const manifest = CONNECTOR_CATALOG[id];
          if (!manifest) return;

          // Connecteurs sans config (authType 'none') → actifs immédiatement
          const status: ConnectorState['status'] =
            manifest.authType === 'none' ? 'active' : 'pending_config';

          const state: ConnectorState = {
            status,
            activatedAt: Date.now(),
            activatedBy: 'system',
          };

          await Nexus.adapter.set(`tenants/${tenantId}/connectors/${id}`, state);
          activatedConnectors.push({ id, status });
        })
      );

      if (activatedConnectors.length > 0) {
        seededPaths.push(`tenants/${tenantId}/connectors (${activatedConnectors.length} auto-activés)`);
        await NexusEventBus.emit('connectors.auto_activated', {
          tenantId,
          variant,
          connectors: activatedConnectors,
        });
      }

      // ── BrandTokens (tier-aware) ──────────────────────────────────────────
      const tier = getSystemTenantTier(tenantId);
      const brandTokens = buildBrandTokens(tenantId, tier, input);
      await Nexus.adapter.set(`tenants/${tenantId}/brandingTokens`, brandTokens);
      seededPaths.push(`tenants/${tenantId}/brandingTokens`);

      logger.info(`[TenantSeeder] Tenant ${tenantId} seeded — ${seededPaths.length} collections`);
      return { success: true, seededPaths };

    } catch (err) {
      logger.error(`[TenantSeeder] Seed failed for ${tenantId}`, err);
      // Best-effort rollback — ignore failures
      await Nexus.adapter.delete(`tenants/${tenantId}/tenantConfig`).catch(() => {});
      return { success: false, seededPaths, error: toError(err).message };
    }
  },
};

/**
 * Construit les BrandTokens selon le tier du tenant.
 * Tier DEMO  → splash gold, brandingMode custom, splashEnabled true
 * Tier TEST  → bleu dev, brandingMode default, pas de splash
 * Tier REF   → gold neutre, brandingMode default, pas de splash
 * CLIENT     → reprend la couleur configurée, brandingMode default
 */
export function buildBrandTokens(
  tenantId: string,
  tier: SystemTier | null,
  input: SeedInput
): Record<string, unknown> {
  if (tier === 'DEMO') {
    const variant = input.variant ?? 'restaurant';
    return {
      tenantId,
      brandName:    `Restaurant OS · Démo ${variant}`,
      tagline:      'Découvrez la puissance de votre futur OS',
      primaryColor: '#C5A358',
      brandingMode: 'custom',
      splashEnabled: true,
      logoUrl:      null,
    };
  }
  if (tier === 'TEST') {
    return {
      tenantId,
      brandName:    `${input.name} · TEST`,
      tagline:      'Environnement de développement',
      primaryColor: '#3B82F6',
      brandingMode: 'default',
      splashEnabled: false,
      logoUrl:      null,
    };
  }
  // REFERENCE ou CLIENT
  return {
    tenantId,
    brandName:    input.name,
    tagline:      null,
    primaryColor: input.primaryColor ?? '#C5A358',
    brandingMode: 'default',
    splashEnabled: false,
    logoUrl:      null,
  };
}
