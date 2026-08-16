import { describe, it, expect } from 'vitest';
import { MultiChannelOrderDispatcherService } from './MultiChannelOrderDispatcherService';
import type { PurchaseOrderEntity } from './SupplierOrderTypes';
import type { SupplierEntity } from '../core/domain/supplier.types';

describe('MultiChannelOrderDispatcherService', () => {
  const sampleSupplier: SupplierEntity = {
    id: 'supp-transgourmet',
    tenantId: 'tenant-lyon',
    name: 'Transgourmet Rhône-Alpes',
    category: 'dry_goods',
    contacts: [
      { id: 'c1', name: 'Jérôme Commercial', role: 'commercial', phone: '+33612345678', email: 'jerome@tg.fr', isPrimary: true },
    ],
    deliverySchedule: {
      allowedDays: [2, 4, 5], // Mardi, Jeudi, Vendredi
      deliveryWindow: '06:00-09:00',
      cutOffTime: '22:00',
      cutOffDaysBefore: 1,
    },
    francoCts: 25000, // 250.00 €
    shippingCostCts: 2500, // 25.00 €
    paymentTerms: '30_DAYS_END_OF_MONTH',
    paymentMethod: 'LCR_BOR',
    preferredOrderChannel: 'WHATSAPP',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const sampleOrder: PurchaseOrderEntity = {
    id: 'po-101',
    tenantId: 'tenant-lyon',
    orderNumber: 'BC-202608-0088',
    supplierId: 'supp-transgourmet',
    supplierName: 'Transgourmet Rhône-Alpes',
    createdById: 'user-chef',
    status: 'CONFIRMED',
    items: [
      {
        mercurialeItemId: 'm1',
        ingredientId: 'ing-beurre',
        name: 'Beurre Doux 82%',
        packagingLabel: 'Carton 10x1kg',
        packagesCount: 2,
        packagePriceHtCts: 8800,
        totalHtCts: 17600,
        totalQuantityBaseUnit: 20,
      },
      {
        mercurialeItemId: 'm2',
        ingredientId: 'ing-creme',
        name: 'Crème Fleurette 35%',
        packagingLabel: 'Colis 6x1L',
        packagesCount: 2,
        packagePriceHtCts: 4500,
        totalHtCts: 9000,
        totalQuantityBaseUnit: 12,
      },
    ],
    totalHtCts: 26600, // 266.00 € (> 250.00 € franco)
    totalVatCts: 1463,
    totalTtcCts: 28063,
    francoReached: true,
    shippingCostCts: 0,
    expectedDeliveryDate: '2026-08-18', // Mardi (day 2)
    dispatchChannel: 'WHATSAPP',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  it('validates allowed delivery day and franco threshold', () => {
    const check = MultiChannelOrderDispatcherService.validateOrderConstraints(
      sampleOrder,
      sampleSupplier,
      '2026-08-18' // Mardi
    );

    expect(check.isValid).toBe(true);
    expect(check.errors).toHaveLength(0);
    expect(check.warnings).toHaveLength(0);
  });

  it('generates rich WhatsApp message with item details', () => {
    const payload = MultiChannelOrderDispatcherService.generateWhatsAppPayload(
      sampleOrder,
      'Le Petit Poucet',
      '+33612345678'
    );

    expect(payload.channel).toBe('WHATSAPP');
    expect(payload.formattedBody).toContain('LE PETIT POUCET');
    expect(payload.formattedBody).toContain('BC-202608-0088');
    expect(payload.formattedBody).toContain('2x* Beurre Doux 82%');
    expect(payload.formattedBody).toContain('266.00 € HT');
  });

  it('generates email payload with PDF attachment reference', () => {
    const payload = MultiChannelOrderDispatcherService.generateEmailPayload(
      sampleOrder,
      'Le Petit Poucet',
      'commandes@transgourmet.fr'
    );

    expect(payload.channel).toBe('EMAIL_PDF');
    expect(payload.pdfAttachmentName).toBe('BON_DE_COMMANDE_BC-202608-0088.pdf');
    expect(payload.formattedBody).toContain('table');
  });
});
