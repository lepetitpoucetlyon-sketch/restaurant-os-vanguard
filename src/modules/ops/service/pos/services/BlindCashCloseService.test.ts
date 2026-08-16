import { describe, it, expect } from 'vitest';
import { BlindCashCloseService, type BlindCashCloseInput } from './BlindCashCloseService';

describe('BlindCashCloseService', () => {
  it('computes exact match with denominations', () => {
    const input: BlindCashCloseInput = {
      sessionId: 'sess-101',
      tenantId: 'tenant-lyon',
      operatorId: 'user-lucas',
      openingFloatCts: 15000, // 150.00 €
      theoreticalCashCts: 35000, // 350.00 € sales
      cashWithdrawalsCts: 0,
      denominations: [
        { denominationCts: 5000, quantity: 6 }, // 300.00 €
        { denominationCts: 2000, quantity: 8 }, // 160.00 €
        { denominationCts: 200, quantity: 20 }, // 40.00 €  -> Total 500.00 €
      ],
    };

    const report = BlindCashCloseService.processBlindClose(input);

    expect(report.countedCashCts).toBe(50000);
    expect(report.netCashExpectedCts).toBe(50000);
    expect(report.discrepancyCts).toBe(0);
    expect(report.status).toBe('EXACT');
    expect(report.requiresSupervisorApproval).toBe(false);
  });

  it('detects cash deficit exceeding supervisor threshold', () => {
    const input: BlindCashCloseInput = {
      sessionId: 'sess-102',
      tenantId: 'tenant-lyon',
      operatorId: 'user-claire',
      openingFloatCts: 10000, // 100.00 €
      theoreticalCashCts: 20000, // 200.00 € -> Expected 300.00 € (30000 cts)
      totalCountedCts: 28500, // 285.00 € (15.00 € missing = 1500 cts)
      reasonForDiscrepancy: 'Erreur rendu monnaie table 14',
    };

    const report = BlindCashCloseService.processBlindClose(input);

    expect(report.countedCashCts).toBe(28500);
    expect(report.netCashExpectedCts).toBe(30000);
    expect(report.discrepancyCts).toBe(-1500);
    expect(report.status).toBe('DEFICIT');
    expect(report.requiresSupervisorApproval).toBe(true);
    expect(report.reasonForDiscrepancy).toBe('Erreur rendu monnaie table 14');
  });

  it('allows minor discrepancy below supervisor threshold without blocking', () => {
    const input: BlindCashCloseInput = {
      sessionId: 'sess-103',
      tenantId: 'tenant-lyon',
      operatorId: 'user-sam',
      openingFloatCts: 10000,
      theoreticalCashCts: 10000, // Expected 200.00 €
      totalCountedCts: 20200, // 202.00 € (+2.00 € surplus)
    };

    const report = BlindCashCloseService.processBlindClose(input);

    expect(report.discrepancyCts).toBe(200);
    expect(report.status).toBe('SURPLUS');
    expect(report.requiresSupervisorApproval).toBe(false); // <= 5.00 €
  });
});
