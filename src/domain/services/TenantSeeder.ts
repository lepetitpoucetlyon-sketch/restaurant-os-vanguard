import { randomBytes } from 'crypto';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { validatePin } from '@/lib/auth/validatePin';
import { hashPin } from '@/lib/shared-kernel';
import { RESTAURANT_FULL_DNA } from '@/shared/seeds/restaurant-full-dna';
import { FiscalKeyService } from '@/modules/finance/services/FiscalKeyService';
import { PCG_ACCOUNTS } from '@/shared/seeds/pcg-accounts';
import type { FiscalSeal } from '@/shared/nexus/contracts/finance.types';
import type { Floor, Zone, Table } from '@/modules/ops/engine/tables.types';

export interface SeedInput {
  tenantId: string;
  name: string;
  adminEmail: string;
  /** 4-digit PIN for the admin user — omit to let TenantSeeder generate a secure one */
  adminPin?: string;
  siren?: string;
  primaryColor?: string;
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
    const { tenantId, name, adminEmail, siren, primaryColor } = input;
    const adminPin = resolveAdminPin(input.adminPin, input.adminEmail);
    const seededPaths: string[] = [];

    logger.info(`[TenantSeeder] Seeding tenant ${tenantId}...`);

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
        ...RESTAURANT_FULL_DNA,
        id: tenantId,
        name,
        fiscalSigningKey,
        metadata: {
          ...RESTAURANT_FULL_DNA.metadata,
          name,
          ownerId: adminEmail,
          createdAt: Date.now(),
          siren: siren ?? '',
        },
        theme: {
          ...RESTAURANT_FULL_DNA.theme,
          primaryColor: primaryColor ?? RESTAURANT_FULL_DNA.theme?.primaryColor ?? '#C5A059',
        },
        status: {
          ...RESTAURANT_FULL_DNA.status,
          updatedAt: Date.now(),
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
      const floor: Floor = {
        id: 'floor-rdc',
        name: 'Salle principale',
        level: 0,
        isActive: true,
      };
      await Nexus.adapter.set(`tenants/${tenantId}/floors/floor-rdc`, floor);
      seededPaths.push(`tenants/${tenantId}/floors/floor-rdc`);

      const zones: Zone[] = [
        { id: 'zone-interieur', name: 'Intérieur', color: '#4A90D9', floorId: 'floor-rdc' },
        { id: 'zone-terrasse', name: 'Terrasse', color: '#7ED321', floorId: 'floor-rdc' },
      ];
      await Promise.all(
        zones.map((z) => Nexus.adapter.set(`tenants/${tenantId}/zones/${z.id}`, z))
      );
      seededPaths.push(`tenants/${tenantId}/zones (2)`);

      const tables: Table[] = Array.from({ length: 10 }, (_, i) => ({
        id: `table-${i + 1}`,
        number: String(i + 1),
        seats: i < 8 ? 4 : 6,
        status: 'free' as const,
        shape: 'rect' as const,
        x: (i % 5) * 160 + 40,
        y: Math.floor(i / 5) * 140 + 40,
        zoneId: i < 8 ? 'zone-interieur' : 'zone-terrasse',
        floorId: 'floor-rdc',
      }));
      await Promise.all(
        tables.map((t) => Nexus.adapter.set(`tenants/${tenantId}/tables/${t.id}`, t))
      );
      seededPaths.push(`tenants/${tenantId}/tables (10)`);

      logger.info(`[TenantSeeder] Tenant ${tenantId} seeded — ${seededPaths.length} collections`);
      return { success: true, seededPaths };

    } catch (err) {
      logger.error(`[TenantSeeder] Seed failed for ${tenantId}`, err);
      // Best-effort rollback — ignore failures
      await Nexus.adapter.delete(`tenants/${tenantId}/tenantConfig`).catch(() => {});
      return { success: false, seededPaths, error: String(err) };
    }
  },
};
