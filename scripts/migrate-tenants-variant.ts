/**
 * 🔄 Script de Migration : Normalisation des Variants Tenants (V2-VERT-02)
 *
 * Parcourt les tenants enregistrés et garantit que chaque document possède
 * un champ `variant` valide parmi les 12 variantes canoniques.
 *
 * - Absence de variant -> 'restaurant'
 * - Variant inconnu -> 'custom' (avec log d'audit)
 * - Variant valide -> inchangé (idempotent)
 */

import { PLATFORM_VARIANTS, PlatformVariant } from '../src/modules/system/domain/schemas/tenant';
import { Nexus } from '../src/lib/nexus/NexusAdapter';
import { logger } from '../src/lib/logger';

interface TenantRecord {
  id: string;
  name?: string;
  variant?: string;
  [key: string]: unknown;
}

export async function migrateTenantsVariant(dryRun: boolean = false): Promise<{
  total: number;
  migrated: number;
  untouched: number;
  errors: number;
}> {
  logger.info('[Migration] Démarrage normalisation des variants tenants', { dryRun });

  let tenants: TenantRecord[] = [];
  try {
    tenants = await Nexus.adapter.query<TenantRecord>('tenants');
  } catch (err) {
    logger.error('[Migration] Erreur lors de la récupération des tenants', { err });
    return { total: 0, migrated: 0, untouched: 0, errors: 1 };
  }

  let migratedCount = 0;
  let untouchedCount = 0;
  let errorsCount = 0;

  for (const tenant of tenants) {
    const rawVariant = (tenant.variant || '').toLowerCase().trim();
    let targetVariant: PlatformVariant;

    if (!rawVariant) {
      targetVariant = 'restaurant';
    } else if ((PLATFORM_VARIANTS as readonly string[]).includes(rawVariant)) {
      targetVariant = rawVariant as PlatformVariant;
    } else {
      logger.warn(`[Migration] Tenant ${tenant.id} a un variant non canonique "${tenant.variant}", bascule vers "custom"`);
      targetVariant = 'custom';
    }

    if (tenant.variant === targetVariant) {
      untouchedCount++;
      continue;
    }

    logger.info(`[Migration] Mise à jour tenant ${tenant.id} : "${tenant.variant}" -> "${targetVariant}"`);

    if (!dryRun) {
      try {
        await Nexus.adapter.update(`tenants/${tenant.id}`, {
          variant: targetVariant,
          updatedAt: new Date().toISOString(),
        });
        migratedCount++;
      } catch (err) {
        logger.error(`[Migration] Échec mise à jour tenant ${tenant.id}`, { err });
        errorsCount++;
      }
    } else {
      migratedCount++;
    }
  }

  logger.info('[Migration] Terminé', {
    total: tenants.length,
    migrated: migratedCount,
    untouched: untouchedCount,
    errors: errorsCount,
  });

  return {
    total: tenants.length,
    migrated: migratedCount,
    untouched: untouchedCount,
    errors: errorsCount,
  };
}

if (process.argv[1] && process.argv[1].endsWith('migrate-tenants-variant.ts')) {
  const isDryRun = process.argv.includes('--dry-run');
  migrateTenantsVariant(isDryRun)
    .then(result => {
      console.log('Résultat migration:', result);
      process.exit(result.errors > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Fatal migration error:', err);
      process.exit(1);
    });
}
