import { describe, it, expect } from 'vitest';
import { EscPosBuilder } from '@/modules/ops/service/printers/hardware/EscPosBuilder';
import type { ReceiptTicket, BitmapImage } from '@/modules/ops/service/printers/hardware/types';

describe('🎨 EscPosBuilder — Styles de Tickets, Logo Bitmap & QR Code Thermique', () => {
  const baseTicket: ReceiptTicket = {
    businessName: 'L\'Atelier Gastronomique',
    ticketNumber: 'T-2026-0089',
    totalInMicrounits: 95_000_000, // 95.00 €
    tvaRatePercent: 10,
    items: [
      { name: 'Menu Dégustation 5 Temps', qty: 2, priceInMicrounits: 40_000_000 },
      { name: 'Accord Mets & Vins', qty: 1, priceInMicrounits: 15_000_000 },
    ],
    paymentMethod: 'Carte Bancaire (CB)',
    siret: '89012345600012',
    nf525Hash: 'c4ca4238a0b923820dcc509a6f75849b',
    certifiedAt: '2026-08-18T14:30:00.000Z',
  };

  it('génère un ticket au style Classic avec séparateurs standards et NF525', () => {
    const builder = new EscPosBuilder(80);
    const bytes = builder.buildReceipt({
      ...baseTicket,
      ticketStyle: 'classic',
    });

    const text = new TextDecoder('latin1').decode(bytes);

    expect(text).toContain('L\'ATELIER GASTRONOMIQUE');
    expect(text).toContain('TICKET N');
    expect(text).toContain('95.00');
    expect(text).toContain('TVA 10%');
    expect(text).toContain('SIRET: 89012345600012');
    expect(text).toContain('CERTIFICATION NF525');
    expect(text).toContain('c4ca4238a0b923820dcc509a6f75849b');
  });

  it('génère un ticket au style Minimalist avec séparateurs pointillés discrets', () => {
    const builder = new EscPosBuilder(80);
    const bytes = builder.buildReceipt({
      ...baseTicket,
      ticketStyle: 'minimalist',
      footerNote: 'Merci de votre visite éco-responsable',
    });

    const text = new TextDecoder('latin1').decode(bytes);

    expect(text).toContain('Reçu #T-2026-0089');
    expect(text).toContain('·');
    expect(text).toContain('Total Net');
    expect(text).toContain('Merci de votre visite éco-responsable');
    expect(text).toContain('SIRET: 89012345600012');
  });

  it('génère un ticket au style Gourmet avec ornements et cadre prestige', () => {
    const builder = new EscPosBuilder(80);
    const bytes = builder.buildReceipt({
      ...baseTicket,
      ticketStyle: 'gourmet',
    });

    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

    expect(text).toContain('L\'ATELIER GASTRONOMIQUE');
    expect(text).toContain('MAISON FONDEE SUR L\'EXCELLENCE');
    expect(text).toContain('NOTE D\'ADDITION');
    expect(text).toContain('Toute la brigade vous remercie');
  });

  it('injecte correctement les commandes ESC/POS natives de QR Code (GS ( k)', () => {
    const builder = new EscPosBuilder(80);
    const qrUrl = 'https://app.restaurantos.app/ticket/bistro-paris/T-2026-0089';
    const bytes = builder.buildReceipt({
      ...baseTicket,
      qrCodeUrl: qrUrl,
      qrCodeLabel: 'SCANNEZ VOTRE E-TICKET',
    });

    // Recherche de la séquence d'initialisation QR Code GS ( k 0x04 0x00 0x31 0x41 0x32 0x00
    const byteArray = Array.from(bytes);
    const qrInitIndex = byteArray.findIndex(
      (b, i) => b === 0x1d && byteArray[i + 1] === 0x28 && byteArray[i + 2] === 0x6b && byteArray[i + 3] === 0x04
    );

    expect(qrInitIndex).toBeGreaterThan(-1);

    const text = new TextDecoder('latin1').decode(bytes);
    expect(text).toContain('SCANNEZ VOTRE E-TICKET');
    expect(text).toContain(qrUrl);
  });

  it('injecte correctement l image bitmap monochrome en en-tête via GS v 0', () => {
    const builder = new EscPosBuilder(80);
    const mockLogo: BitmapImage = {
      width: 16, // 2 octets de large
      height: 8, // 8 lignes de haut
      data: new Uint8Array(16).fill(0xff), // 16 octets noirs
    };

    const bytes = builder.buildReceipt({
      ...baseTicket,
      logoBitmap: mockLogo,
    });

    const byteArray = Array.from(bytes);
    // Recherche de la commande GS v 0 (0x1D, 0x76, 0x30, 0x00, xL=0x02, xH=0x00, yL=0x08, yH=0x00)
    const rasterIndex = byteArray.findIndex(
      (b, i) =>
        b === 0x1d &&
        byteArray[i + 1] === 0x76 &&
        byteArray[i + 2] === 0x30 &&
        byteArray[i + 3] === 0x00 &&
        byteArray[i + 4] === 0x02 &&
        byteArray[i + 5] === 0x00 &&
        byteArray[i + 6] === 0x08 &&
        byteArray[i + 7] === 0x00
    );

    expect(rasterIndex).toBeGreaterThan(-1);
  });
});
