import { Nexus } from '@/lib/nexus/NexusAdapter';
import { CryptoService } from '@/lib/CryptoService';
import type { LegalInvoice } from '@nexus/contracts';
import type { SovereignData } from '@/shared/nexus-contract';

export const INVOICE_COLLECTION = 'invoices';

export function dualAmount(mu: number): { InMicrounits: number; InCents: number } {
  return { InMicrounits: mu, InCents: Math.round(mu / 10_000) };
}

export function buildDualTaxDetail(
  rate: number,
  baseMu: number,
  taxMu: number,
): LegalInvoice['taxDetails'][number] {
  return {
    rate,
    baseInMicrounits: baseMu,
    baseInCents: Math.round(baseMu / 10_000),
    amountInMicrounits: taxMu,
    amountInCents: Math.round(taxMu / 10_000),
  };
}

export async function getNextInvoiceNumber(tenantId: string, year: number): Promise<number> {
  const counterPath = `tenants/${tenantId}/counters/invoice_${year}`;
  const counter = await Nexus.adapter.get<{ value: number }>(counterPath);
  const next = (counter?.value ?? 0) + 1;
  await Nexus.adapter.set(counterPath, { value: next });
  return next;
}

export async function computeInvoiceSeal(
  invoiceId: string,
  invoiceNumber: string,
  totalMu: number,
  taxDetails: LegalInvoice['taxDetails'],
  issuedAt: string,
): Promise<string> {
  const data = {
    invoiceId,
    invoiceNumber,
    totalMu,
    taxDetails: taxDetails.map(d => ({ rate: d.rate, base: d.baseInMicrounits, tax: d.amountInMicrounits })),
    issuedAt,
  } as unknown as SovereignData;
  return CryptoService.generateHash(CryptoService.canonicalStringify(data));
}
