import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WormArchiveStorageService } from '@/modules/finance/fiscalite/WormArchiveStorageService';
import type { FiscalSeal } from '@nexus/contracts';

describe('Bloquant P0 #2 : Stockage Froid Immuable WORM NF525 (6 ans)', () => {
  let tenantId: string;

  // Les FiscalSeal de test portent des champs étendus (totalInMicrounits, timestamp ms)
  // non présents dans l'interface contrat ; le cast est intentionnel pour le test.
  let mockSeals: FiscalSeal[];

  beforeEach(async () => {
    vi.clearAllMocks();
    tenantId = `bistro-louvre-${Math.random().toString(36).substring(7)}`;
    mockSeals = [
      {
        id: 'seal-001',
        tenantId,
        sequenceNumber: 1,
        receiptNumber: '2026-000001',
        totalInMicrounits: 45000000, // 45€
        taxInMicrounits: 4500000,
        timestamp: new Date(1786800000000).toISOString(),
        previousHash: 'GENESIS',
        hash: 'hash-abc-001',
        updatedAt: new Date(1786800000000).toISOString(),
        signature: 'sig-001',
        transactionId: 'tx-001',
      },
      {
        id: 'seal-002',
        tenantId,
        sequenceNumber: 2,
        receiptNumber: '2026-000002',
        totalInMicrounits: 80000000, // 80€
        taxInMicrounits: 8000000,
        timestamp: new Date(1786803600000).toISOString(),
        previousHash: 'hash-abc-001',
        hash: 'hash-abc-002',
        updatedAt: new Date(1786803600000).toISOString(),
        signature: 'sig-002',
        transactionId: 'tx-002',
      },
    ] as unknown as FiscalSeal[];
  });

  it('devrait sceller une archive annuelle avec rétention WORM de 6 ans', async () => {
    const archive = await WormArchiveStorageService.sealPeriodArchive(
      tenantId,
      2026,
      'expert-comptable-dupont',
      mockSeals
    );

    expect(archive.id).toBe(`worm_${tenantId}_2026_ANNUAL`);
    expect(archive.year).toBe(2026);
    expect(archive.periodType).toBe('ANNUAL');
    expect(archive.totalTransactions).toBe(2);
    expect(archive.totalAmountInMicrounits).toBe(125000000);
    expect(archive.retentionYears).toBe(6);
    expect(archive.wormStatus).toBe('ACTIVE_LOCKED');
    expect(archive.masterSha256Hash).toBeDefined();
  });

  it('devrait certifier l intégrité et détecter toute falsification sur les scellés', async () => {
    const archive = await WormArchiveStorageService.sealPeriodArchive(
      tenantId,
      2026,
      'expert-comptable-dupont',
      mockSeals
    );

    // 1. Vérification sur données intactes
    const verification = await WormArchiveStorageService.verifyArchiveIntegrity(
      tenantId,
      archive.id,
      mockSeals
    );
    expect(verification.isValid).toBe(true);
    expect(verification.tamperDetected).toBe(false);

    // 2. Vérification sur données altérées (simulation de fraude fiscale)
    const tamperedSeals: FiscalSeal[] = [
      ...mockSeals,
      {
        ...mockSeals[0],
        id: 'seal-tampered',
        totalInMicrounits: 1000000, // Altéré à 1€
      },
    ];

    const fraudCheck = await WormArchiveStorageService.verifyArchiveIntegrity(
      tenantId,
      archive.id,
      tamperedSeals
    );
    expect(fraudCheck.isValid).toBe(false);
    expect(fraudCheck.tamperDetected).toBe(true);
  });

  it('devrait rejeter toute tentative de modification d une archive WORM verrouillée', async () => {
    const archive = await WormArchiveStorageService.sealPeriodArchive(
      tenantId,
      2026,
      'expert-comptable-dupont',
      mockSeals
    );

    await expect(
      WormArchiveStorageService.assertImmutabilityGuard(tenantId, archive.id)
    ).rejects.toThrow(/WORM VIOLATION/);
  });
});
