import type {
  IEInvoicingProvider,
  InboundEInvoice,
  EInvoiceWebhookPayload,
} from './IEInvoicingProvider';
import { logger } from '@/lib/logger';

const MOCK_INVOICES: InboundEInvoice[] = [
  {
    providerInvoiceId: 'mock_inv_001',
    invoiceNumber: 'FOUR-2026-0001',
    issueDate: '2026-08-01',
    dueDate: '2026-09-01',
    format: 'factur-x',
    seller: {
      name: 'Metro Cash & Carry SAS',
      siret: '39919996500014',
      vatNumber: 'FR76399199965',
      address: '1 Rue des Grossistes, 93000 Bobigny',
      country: 'FR',
    },
    buyer: {
      name: 'Restaurant Demo',
      siret: '00000000000000',
      address: '1 Rue de la Démo, 75001 Paris',
      country: 'FR',
    },
    lines: [
      {
        description: 'Filet de bœuf 2kg',
        quantity: 10,
        unitPriceHTInMicrounits: 25_000_000,
        vatRate: 0.055,
        totalHTInMicrounits: 250_000_000,
        totalTTCInMicrounits: 263_750_000,
      },
      {
        description: 'Huile d\'olive extra-vierge 5L',
        quantity: 4,
        unitPriceHTInMicrounits: 18_500_000,
        vatRate: 0.055,
        totalHTInMicrounits: 74_000_000,
        totalTTCInMicrounits: 78_070_000,
      },
    ],
    totalHTInMicrounits: 324_000_000,
    totalVATInMicrounits: 17_820_000,
    totalTTCInMicrounits: 341_820_000,
    currency: 'EUR',
  },
];

export class MockEInvoicingProvider implements IEInvoicingProvider {
  readonly name = 'mock';

  verifyWebhookSignature(payload: EInvoiceWebhookPayload, secret: string): boolean {
    return payload.signature === `mock_${secret}`;
  }

  async fetchInvoice(providerInvoiceId: string): Promise<InboundEInvoice> {
    const invoice = MOCK_INVOICES.find(i => i.providerInvoiceId === providerInvoiceId);
    if (!invoice) {
      throw new Error(`[MockEInvoicing] Facture ${providerInvoiceId} introuvable`);
    }
    logger.info(`[MockEInvoicing] fetchInvoice ${providerInvoiceId}`);
    return { ...invoice };
  }

  async acknowledgeReceipt(providerInvoiceId: string): Promise<void> {
    logger.info(`[MockEInvoicing] acknowledgeReceipt ${providerInvoiceId}`);
  }

  async rejectInvoice(providerInvoiceId: string, _tenantId: string, reason: string): Promise<void> {
    logger.info(`[MockEInvoicing] rejectInvoice ${providerInvoiceId} — ${reason}`);
  }

  async listPendingInvoices(): Promise<InboundEInvoice[]> {
    logger.info(`[MockEInvoicing] listPendingInvoices — ${MOCK_INVOICES.length} facture(s)`);
    return MOCK_INVOICES.map(i => ({ ...i }));
  }
}
