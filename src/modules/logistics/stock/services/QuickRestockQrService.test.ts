import { describe, it, expect } from 'vitest';
import { QuickRestockQrService, RestockQrPayload } from './QuickRestockQrService';

describe('QuickRestockQrService', () => {
  const samplePayload: RestockQrPayload = {
    version: 1,
    tenantId: 'tenant-lyon',
    ingredientId: 'ing-beurre',
    ingredientName: 'Beurre Doux 82% (Carton 10x1kg)',
    storageLocation: 'Chambre Froide Positive A1',
    defaultPackagesCount: 2,
    supplierId: 'supp-transgourmet',
    supplierName: 'Transgourmet',
    packagePriceHtCts: 8800, // 88.00 €
  };

  it('encodes and decodes QR restock code payload with multi-tenant guard', () => {
    const qrData = QuickRestockQrService.generateQrCodeData(samplePayload);
    expect(qrData.startsWith('resto-os://restock?d=')).toBe(true);

    const scanResult = QuickRestockQrService.parseRestockScan(qrData, 'tenant-lyon');
    expect(scanResult.isValid).toBe(true);
    expect(scanResult.cartItemToAdd).toBeDefined();
    expect(scanResult.cartItemToAdd?.ingredientId).toBe('ing-beurre');
    expect(scanResult.cartItemToAdd?.packagesCount).toBe(2);
    expect(scanResult.cartItemToAdd?.totalItemHtCts).toBe(17600); // 2 * 88.00 = 176.00 €
  });

  it('supports quantity override during physical scan', () => {
    const qrData = QuickRestockQrService.generateQrCodeData(samplePayload);
    const scanResult = QuickRestockQrService.parseRestockScan(qrData, 'tenant-lyon', 5); // 5 cartons

    expect(scanResult.isValid).toBe(true);
    expect(scanResult.cartItemToAdd?.packagesCount).toBe(5);
    expect(scanResult.cartItemToAdd?.totalItemHtCts).toBe(44000); // 5 * 88.00 = 440.00 €
  });

  it('rejects scan from a different tenant', () => {
    const qrData = QuickRestockQrService.generateQrCodeData(samplePayload);
    const scanResult = QuickRestockQrService.parseRestockScan(qrData, 'tenant-paris');

    expect(scanResult.isValid).toBe(false);
    expect(scanResult.error).toContain('autre établissement');
  });
});
