import { describe, it, expect } from 'vitest';
import { HaccpLabelThermalPrintService, HaccpLabelInput } from './HaccpLabelThermalPrintService';

describe('HaccpLabelThermalPrintService', () => {
  it('calculates exact secondary DLC for cooked preparation (J+3 / 72h)', () => {
    const openedAt = Date.UTC(2026, 7, 16, 8, 0, 0); // 16 Août 08:00
    const input: HaccpLabelInput = {
      tenantId: 'tenant-lyon',
      productName: 'Sauce Demi-Glace Maison',
      productType: 'cooked_preparation',
      openedAtUtc: openedAt,
      openedByOperator: 'Chef Thomas',
      originalBatchNumber: 'LOT-VIANDE-994',
      storageLocation: 'Chambre Froide Positive 1',
      allergens: ['celery', 'sulphites'],
      storageTempMaxCelsius: 3.0,
    };

    const label = HaccpLabelThermalPrintService.generateLabel(input, openedAt);

    expect(label.shelfLifeHours).toBe(72);
    // 72h plus tard = 19 Août 08:00
    expect(label.secondaryDlcUtc).toBe(openedAt + 72 * 3600 * 1000);
    expect(label.isExpired).toBe(false);
    expect(label.qrCodeData.startsWith('resto-haccp://')).toBe(true);
    expect(label.tsplCommand).toContain('SAUCE DEMI-GLACE MAISON');
    expect(label.tsplCommand).toContain('QRCODE');
    expect(label.zplCommand).toContain('^XA');
  });

  it('calculates 24h secondary DLC for minced meat and detects expiration', () => {
    const openedAt = Date.UTC(2026, 7, 16, 8, 0, 0);
    const input: HaccpLabelInput = {
      tenantId: 'tenant-lyon',
      productName: 'Steak Haché Façon Bouchère',
      productType: 'minced_meat',
      openedAtUtc: openedAt,
      openedByOperator: 'Commis Alex',
      originalBatchNumber: 'LOT-BEEF-221',
      storageLocation: 'Chambre Froide Viande',
    };

    // 30h plus tard (dépassé)
    const nowSimulated = openedAt + 30 * 3600 * 1000;
    const label = HaccpLabelThermalPrintService.generateLabel(input, nowSimulated);

    expect(label.shelfLifeHours).toBe(24);
    expect(label.isExpired).toBe(true);
  });
});
