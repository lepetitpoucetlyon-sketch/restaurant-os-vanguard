import type { InboundEInvoice, EInvoiceFormat, EInvoiceLine, EInvoiceParty } from './IEInvoicingProvider';
import { logger } from '@/lib/logger';

function extractTag(xml: string, tag: string): string {
  const patterns = [
    new RegExp(`<(?:[a-z]+:)?${tag}[^>]*>([^<]+)<`, 'i'),
    new RegExp(`<${tag}[^>]*>([^<]+)<`, 'i'),
  ];
  for (const re of patterns) {
    const m = xml.match(re);
    if (m) return m[1].trim();
  }
  return '';
}

function extractSection(xml: string, tag: string): string {
  const re = new RegExp(`<(?:[a-z]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[a-z]+:)?${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1] : '';
}

function euroToMicrounits(val: string): number {
  const n = parseFloat(val);
  if (isNaN(n)) return 0;
  return Math.round(n * 1_000_000);
}

function detectFormat(xml: string): EInvoiceFormat {
  if (xml.includes('CrossIndustryInvoice')) return 'cii';
  if (xml.includes('urn:factur-x')) return 'factur-x';
  if (xml.includes('urn:oasis:names:specification:ubl')) return 'ubl';
  return 'factur-x';
}

function parseParty(section: string): EInvoiceParty {
  return {
    name: extractTag(section, 'Name'),
    siret: extractTag(section, 'ID'),
    vatNumber: (() => {
      const taxReg = extractSection(section, 'SpecifiedTaxRegistration');
      return taxReg ? extractTag(taxReg, 'ID') : undefined;
    })(),
    address: extractTag(section, 'LineOne') || extractTag(section, 'StreetName'),
    country: extractTag(section, 'CountryID') || extractTag(section, 'IdentificationCode') || 'FR',
  };
}

function parseCIILines(xml: string): EInvoiceLine[] {
  const lineRegex = /<(?:[a-z]+:)?IncludedSupplyChainTradeLineItem>([\s\S]*?)<\/(?:[a-z]+:)?IncludedSupplyChainTradeLineItem>/gi;
  const lines: EInvoiceLine[] = [];
  let match;

  while ((match = lineRegex.exec(xml)) !== null) {
    const block = match[1];
    const description = extractTag(block, 'Name') || extractTag(block, 'Description') || 'Ligne';
    const quantity = parseFloat(extractTag(block, 'BilledQuantity') || '1');
    const unitPrice = euroToMicrounits(extractTag(block, 'ChargeAmount') || '0');
    const vatRate = parseFloat(extractTag(block, 'RateApplicablePercent') || '0') / 100;
    const totalHT = Math.round(quantity * unitPrice);
    const totalTTC = Math.round(totalHT * (1 + vatRate));

    lines.push({
      description,
      quantity,
      unitPriceHTInMicrounits: unitPrice,
      vatRate,
      totalHTInMicrounits: totalHT,
      totalTTCInMicrounits: totalTTC,
    });
  }

  return lines;
}

function parseUBLLines(xml: string): EInvoiceLine[] {
  const lineRegex = /<(?:cac:)?InvoiceLine>([\s\S]*?)<\/(?:cac:)?InvoiceLine>/gi;
  const lines: EInvoiceLine[] = [];
  let match;

  while ((match = lineRegex.exec(xml)) !== null) {
    const block = match[1];
    const description = extractTag(block, 'Name') || extractTag(block, 'Description') || 'Ligne';
    const quantity = parseFloat(extractTag(block, 'InvoicedQuantity') || '1');
    const unitPrice = euroToMicrounits(extractTag(block, 'PriceAmount') || '0');
    const vatRate = parseFloat(extractTag(block, 'Percent') || '0') / 100;
    const lineAmount = euroToMicrounits(extractTag(block, 'LineExtensionAmount') || '0');
    const totalHT = lineAmount || Math.round(quantity * unitPrice);
    const totalTTC = Math.round(totalHT * (1 + vatRate));

    lines.push({
      description,
      quantity,
      unitPriceHTInMicrounits: unitPrice,
      vatRate,
      totalHTInMicrounits: totalHT,
      totalTTCInMicrounits: totalTTC,
    });
  }

  return lines;
}

export function parseEInvoiceXml(xml: string, providerInvoiceId?: string): InboundEInvoice {
  const format = detectFormat(xml);
  logger.info(`[FacturXParser] Format détecté : ${format}`);

  const invoiceNumber = extractTag(xml, 'ID') || extractTag(xml, 'ID');
  const issueDateRaw = extractTag(xml, 'DateTimeString') || extractTag(xml, 'IssueDate');
  const issueDate = issueDateRaw.length === 8
    ? `${issueDateRaw.slice(0, 4)}-${issueDateRaw.slice(4, 6)}-${issueDateRaw.slice(6, 8)}`
    : issueDateRaw;

  const sellerSection = extractSection(xml, 'SellerTradeParty')
    || extractSection(xml, 'AccountingSupplierParty');
  const buyerSection = extractSection(xml, 'BuyerTradeParty')
    || extractSection(xml, 'AccountingCustomerParty');

  const seller = parseParty(sellerSection);
  const buyer = parseParty(buyerSection);

  const lines = format === 'ubl' ? parseUBLLines(xml) : parseCIILines(xml);

  const summarySection = extractSection(xml, 'SpecifiedTradeSettlementHeaderMonetarySummation')
    || extractSection(xml, 'LegalMonetaryTotal');

  const totalHT = euroToMicrounits(
    extractTag(summarySection, 'LineTotalAmount')
    || extractTag(summarySection, 'LineExtensionAmount')
    || '0'
  );
  const totalVAT = euroToMicrounits(
    extractTag(summarySection, 'TaxTotalAmount')
    || extractTag(summarySection, 'TaxAmount')
    || '0'
  );
  const totalTTC = euroToMicrounits(
    extractTag(summarySection, 'GrandTotalAmount')
    || extractTag(summarySection, 'PayableAmount')
    || '0'
  );

  const currency = extractTag(xml, 'InvoiceCurrencyCode')
    || extractTag(xml, 'DocumentCurrencyCode')
    || 'EUR';

  const dueDateRaw = extractTag(xml, 'DueDateDateTime') || extractTag(xml, 'DueDate');
  const dueDate = dueDateRaw.length === 8
    ? `${dueDateRaw.slice(0, 4)}-${dueDateRaw.slice(4, 6)}-${dueDateRaw.slice(6, 8)}`
    : dueDateRaw || undefined;

  return {
    providerInvoiceId: providerInvoiceId ?? `parsed_${invoiceNumber}`,
    invoiceNumber,
    issueDate,
    dueDate,
    format,
    seller,
    buyer,
    lines: lines.length > 0 ? lines : [{
      description: 'Total facture',
      quantity: 1,
      unitPriceHTInMicrounits: totalHT,
      vatRate: totalHT > 0 ? totalVAT / totalHT : 0,
      totalHTInMicrounits: totalHT,
      totalTTCInMicrounits: totalTTC,
    }],
    totalHTInMicrounits: totalHT || lines.reduce((s, l) => s + l.totalHTInMicrounits, 0),
    totalVATInMicrounits: totalVAT,
    totalTTCInMicrounits: totalTTC || lines.reduce((s, l) => s + l.totalTTCInMicrounits, 0),
    currency,
    rawXml: xml,
  };
}
