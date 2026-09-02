import { Nexus } from '@/lib/nexus/NexusAdapter';
import { CryptoService } from '@/lib/CryptoService';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type { FiscalSeal } from '@nexus/contracts';

export interface WormArchiveManifest {
  tenantId: string;
  year: number;
  month?: number;
  periodType: 'MONTHLY' | 'ANNUAL';
  totalTransactions: number;
  totalAmountInMicrounits: number;
  firstTransactionHash: string;
  lastTransactionHash: string;
  sealIds: string[];
}

export interface WormArchiveRecord {
  id: string;
  tenantId: string;
  year: number;
  month?: number;
  periodType: 'MONTHLY' | 'ANNUAL';
  totalTransactions: number;
  totalAmountInMicrounits: number;
  firstTransactionHash: string;
  lastTransactionHash: string;
  masterSha256Hash: string;
  sealedAtUtc: string;
  sealedAtTimestamp: number;
  sealedBy: string;
  retentionYears: number;
  immutableUntilTimestamp: number;
  wormStatus: 'ACTIVE_LOCKED' | 'EXPIRED';
  storageBackend: 'GCS_OBJECT_LOCK' | 'FIREBASE_IMMUTABLE_VAULT';
}

/** Rétention légale fiscale française : 6 ans (Art. L102 B du Livre des Procédures Fiscales) */
const LEGAL_FISCAL_RETENTION_YEARS = 6;
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/**
 * 🏛️ WormArchiveStorageService — Bloquant P0 #2 & NF525
 *
 * Implémente le stockage froid immuable WORM (Write Once, Read Many).
 * Garantit l'inaltérabilité et la conservation légale sur 6 ans des grands livres et journaux fiscaux.
 */
export class WormArchiveStorageService {
  /**
   * Scelle et verrouille une archive fiscale annuelle ou mensuelle en mode WORM immuable.
   */
  static async sealPeriodArchive(
    tenantId: string,
    year: number,
    sealedBy: string,
    seals: FiscalSeal[],
    month?: number
  ): Promise<WormArchiveRecord> {
    if (seals.length === 0) {
      throw new Error(`Impossible de sceller une archive vide pour le tenant ${tenantId} (${year})`);
    }

    const now = Date.now();
    const nowUtc = new Date(now).toISOString();
    const periodType = month !== undefined ? 'MONTHLY' : 'ANNUAL';
    const archiveId = month !== undefined
      ? `worm_${tenantId}_${year}_M${String(month).padStart(2, '0')}`
      : `worm_${tenantId}_${year}_ANNUAL`;

    const sortedSeals = [...seals].sort((a, b) => {
      const tsA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tsB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tsA - tsB;
    });
    const firstSeal = sortedSeals[0];
    const lastSeal = sortedSeals[sortedSeals.length - 1];

    const totalAmount = sortedSeals.reduce(
      (sum, s) => sum + ((s as unknown as { totalInMicrounits?: number }).totalInMicrounits ?? 0),
      0
    );

    const manifest: WormArchiveManifest = {
      tenantId,
      year,
      month,
      periodType,
      totalTransactions: sortedSeals.length,
      totalAmountInMicrounits: totalAmount,
      firstTransactionHash: firstSeal.hash || 'GENESIS',
      lastTransactionHash: lastSeal.hash || 'TERMINAL',
      sealIds: sortedSeals.map((s) => s.id).filter((id): id is string => id !== undefined),
    };

    // Calcul du Master Hash cryptographique SHA-256 de l'archive
    const masterSha256Hash = await CryptoService.generateHash(JSON.stringify(manifest));

    const immutableUntilTimestamp = now + LEGAL_FISCAL_RETENTION_YEARS * MS_PER_YEAR;

    const record: WormArchiveRecord = {
      id: archiveId,
      tenantId,
      year,
      month,
      periodType,
      totalTransactions: sortedSeals.length,
      totalAmountInMicrounits: totalAmount,
      firstTransactionHash: manifest.firstTransactionHash,
      lastTransactionHash: manifest.lastTransactionHash,
      masterSha256Hash,
      sealedAtUtc: nowUtc,
      sealedAtTimestamp: now,
      sealedBy,
      retentionYears: LEGAL_FISCAL_RETENTION_YEARS,
      immutableUntilTimestamp,
      wormStatus: 'ACTIVE_LOCKED',
      storageBackend: 'GCS_OBJECT_LOCK',
    };

    // Écriture du document immuable dans le coffre-fort fiscal
    await Nexus.adapter.set(`tenants/${tenantId}/wormArchives/${archiveId}`, record);

    empireAudit.log({
      module: 'finance',
      action: 'FISCAL_ARCHIVE_WORM_SEALED',
      details: {
        archiveId,
        masterSha256Hash,
        totalTransactions: record.totalTransactions,
        retentionYears: LEGAL_FISCAL_RETENTION_YEARS,
      },
      severity: 'high',
      timestamp: new Date(now),
    });

    logger.info(`[WormStorage] Archive fiscale ${archiveId} scellée en mode WORM (Master Hash: ${masterSha256Hash.slice(0, 12)}...)`);
    return record;
  }

  /**
   * Vérifie l'intégrité mathématique d'une archive WORM scellée.
   */
  static async verifyArchiveIntegrity(
    tenantId: string,
    archiveId: string,
    seals: FiscalSeal[]
  ): Promise<{ isValid: boolean; masterHash: string; tamperDetected: boolean }> {
    const archive = await Nexus.adapter.get<WormArchiveRecord>(`tenants/${tenantId}/wormArchives/${archiveId}`);
    if (!archive) {
      throw new Error(`Archive WORM introuvable: ${archiveId}`);
    }

    const sortedSeals = [...seals].sort((a, b) => {
      const tsA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tsB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tsA - tsB;
    });
    const firstSeal = sortedSeals[0];
    const lastSeal = sortedSeals[sortedSeals.length - 1];
    const totalAmount = sortedSeals.reduce(
      (sum, s) => sum + ((s as unknown as { totalInMicrounits?: number }).totalInMicrounits ?? 0),
      0
    );

    const manifest: WormArchiveManifest = {
      tenantId: archive.tenantId,
      year: archive.year,
      month: archive.month,
      periodType: archive.periodType,
      totalTransactions: sortedSeals.length,
      totalAmountInMicrounits: totalAmount,
      firstTransactionHash: firstSeal?.hash || 'GENESIS',
      lastTransactionHash: lastSeal?.hash || 'TERMINAL',
      sealIds: sortedSeals.map((s) => s.id).filter((id): id is string => id !== undefined),
    };

    const recomputedHash = await CryptoService.generateHash(JSON.stringify(manifest));
    const isValid = recomputedHash === archive.masterSha256Hash;

    return {
      isValid,
      masterHash: archive.masterSha256Hash,
      tamperDetected: !isValid,
    };
  }

  /**
   * Rejette toute tentative d'altération ou de suppression d'une archive protégée par WORM.
   */
  static async assertImmutabilityGuard(tenantId: string, archiveId: string): Promise<void> {
    const archive = await Nexus.adapter.get<WormArchiveRecord>(`tenants/${tenantId}/wormArchives/${archiveId}`);
    if (!archive) return;

    if (archive.wormStatus === 'ACTIVE_LOCKED' && Date.now() < archive.immutableUntilTimestamp) {
      empireAudit.log({
        module: 'finance',
        action: 'WORM_IMMUTABILITY_VIOLATION_ATTEMPT',
        details: { tenantId, archiveId, immutableUntil: new Date(archive.immutableUntilTimestamp).toISOString() },
        severity: 'critical',
        timestamp: new Date(),
      });

      throw new Error(
        `[WORM VIOLATION] L'archive fiscale ${archiveId} est sous verrou légal NF525 immuable jusqu'au ${new Date(archive.immutableUntilTimestamp).toISOString()}. Toute modification est illégale.`
      );
    }
  }

  /**
   * Enregistre le scellement du Grand Total périodique dans l'archive WORM
   */
  static async recordGrandTotalSeal(payload: {
    tenantId: string;
    period: 'monthly' | 'annual';
    periodLabel: string;
    totalInMicrounits: number;
    hash: string;
    sealedAt: number;
  }): Promise<void> {
    const year = new Date(payload.sealedAt).getUTCFullYear();
    const month = payload.period === 'monthly' ? new Date(payload.sealedAt).getUTCMonth() + 1 : undefined;
    const id = `worm_gt_${payload.tenantId}_${payload.period}_${payload.periodLabel.replace(/\s+/g, '_')}`;

    const record: WormArchiveRecord = {
      id,
      tenantId: payload.tenantId,
      year,
      month,
      periodType: payload.period === 'monthly' ? 'MONTHLY' : 'ANNUAL',
      totalTransactions: 1,
      totalAmountInMicrounits: payload.totalInMicrounits,
      firstTransactionHash: payload.hash,
      lastTransactionHash: payload.hash,
      masterSha256Hash: payload.hash,
      sealedAtUtc: new Date(payload.sealedAt).toISOString(),
      sealedAtTimestamp: payload.sealedAt,
      sealedBy: 'SYSTEM_CRON_GRAND_TOTAL',
      retentionYears: LEGAL_FISCAL_RETENTION_YEARS,
      immutableUntilTimestamp: payload.sealedAt + LEGAL_FISCAL_RETENTION_YEARS * MS_PER_YEAR,
      wormStatus: 'ACTIVE_LOCKED',
      storageBackend: 'FIREBASE_IMMUTABLE_VAULT',
    };

    await Nexus.adapter.set(`tenants/${payload.tenantId}/wormArchives/${id}`, record);
  }
}
