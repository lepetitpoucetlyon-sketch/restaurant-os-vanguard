import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HardwareProvisioningService } from '@/modules/facility/services/HardwareProvisioningService';
import { MockEscPosPrinter, MockStripeTerminalReader, MockIotTempSensor } from '@/e2e/fixtures/HardwareMocks';

describe('E2E Scénario 3 : Banc d Essai Hardware & Onboarding Terrain J-0', () => {
  const tenantId = 'bistro-champs-elysees';
  const siteName = 'Brasserie des Champs-Élysées';

  beforeEach(() => {
    vi.clearAllMocks();
    MockEscPosPrinter.clearHistory();
  });

  it('devrait exécuter l autodiagnostic 12 points, valider les mocks physiques et sceller le PV de recette', async () => {
    // 1. Exécution de l'autodiagnostic complet J-0
    const report = await HardwareProvisioningService.runFullHardwareDiagnostic(
      tenantId,
      siteName,
      'Éric Martin (Technicien)',
      'Julien Bernard (Directeur)'
    );

    expect(report.totalCount).toBe(12);
    expect(report.passedCount).toBe(12);
    expect(report.allPassed).toBe(true);
    expect(report.masterSealSha256).toBeDefined();

    // 2. Test physique simulé d'impression ticket ESC/POS avec impulsion tiroir-caisse
    const printedReceipt = MockEscPosPrinter.printReceipt(
      'CUSTOMER_RECEIPT',
      [
        '*** BRASSERIE DES CHAMPS-ÉLYSÉES ***',
        '1 Entrecôte Grillée 300g ..... 32.00 €',
        '1 Verre Saint-Émilion ........  8.50 €',
        '---------------------------------------',
        'TOTAL TTC .................... 40.50 €',
        'Scellement NF525 : 88A9F022B1',
      ],
      true // Kick drawer
    );

    expect(printedReceipt.drawerKicked).toBe(true);
    expect(printedReceipt.cutTriggered).toBe(true);
    expect(MockEscPosPrinter.getHistory().length).toBe(1);

    // 3. Test de transaction bancaire TPE Stripe Terminal
    const payment = await MockStripeTerminalReader.processCardPayment(4050, {
      cardBrand: 'CB',
    });

    expect(payment.status).toBe('SUCCESS');
    expect(payment.authCode).toContain('AUTH-');
    expect(payment.last4).toBe('4242');

    // 4. Test relevé sonde de température chambre froide
    const coldPos = MockIotTempSensor.getReading('cold_pos');
    expect(coldPos.temperatureCelsius).toBe(2.8);
    expect(coldPos.isCompliant).toBe(true);
  });
});
