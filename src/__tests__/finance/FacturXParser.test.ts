import { describe, it, expect } from 'vitest';
import { parseEInvoiceXml } from '@/modules/finance/comptabilite/einvoicing/FacturXParser';

describe('FacturXParser — Parsing XML Factur-X / CII / UBL (§7.3)', () => {
  const sampleCiiXml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100">
  <rsm:ExchangedDocument>
    <ram:ID>FACT-2026-00123</ram:ID>
    <ram:IssueDateTime>
      <ram:DateTimeString format="102">20260901</ram:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>Fournisseur Bio Frais SAS</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID>12345678900012</ram:ID>
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          <ram:LineOne>12 Avenue des Maraîchers</ram:LineOne>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>Le Petit Poucet Restaurant</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID>98765432100099</ram:ID>
        </ram:SpecifiedLegalOrganization>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:SpecifiedTradeProduct>
        <ram:Name>Tomates Anciennes Bio (kg)</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:GrossPriceProductTradePrice>
          <ram:ChargeAmount>4.50</ram:ChargeAmount>
        </ram:GrossPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="KGM">10</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:RateApplicablePercent>5.5</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime>
          <ram:DateTimeString format="102">20260930</ram:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>45.00</ram:LineTotalAmount>
        <ram:TaxTotalAmount>2.48</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>47.48</ram:GrandTotalAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

  const sampleUblXml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>INV-UBL-9988</cbc:ID>
  <cbc:IssueDate>2026-09-01</cbc:IssueDate>
  <cbc:DueDate>2026-10-01</cbc:DueDate>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>Équipement Pro France</cbc:Name></cac:PartyName>
      <cac:PostalAddress><cbc:StreetName>5 Rue de l'Industrie</cbc:StreetName><cac:Country><cbc:IdentificationCode>FR</cbc:IdentificationCode></cac:Country></cac:PostalAddress>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>Restaurant L'Étoile</cbc:Name></cac:PartyName>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:InvoiceLine>
    <cbc:InvoicedQuantity>2</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount>100.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Bacs Gastronorme Inox</cbc:Name>
      <cac:ClassifiedTaxCategory><cbc:Percent>20</cbc:Percent></cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price><cbc:PriceAmount>50.00</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount>100.00</cbc:LineExtensionAmount>
    <cbc:TaxAmount>20.00</cbc:TaxAmount>
    <cbc:PayableAmount>120.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

  it('détecte et parse correctement une facture au format CII (CrossIndustryInvoice)', () => {
    const invoice = parseEInvoiceXml(sampleCiiXml, 'pdp_cii_001');

    expect(invoice.format).toBe('cii');
    expect(invoice.invoiceNumber).toBe('FACT-2026-00123');
    expect(invoice.issueDate).toBe('2026-09-01');
    expect(invoice.dueDate).toBe('2026-09-30');
    expect(invoice.currency).toBe('EUR');
    expect(invoice.providerInvoiceId).toBe('pdp_cii_001');

    // Parties
    expect(invoice.seller.name).toBe('Fournisseur Bio Frais SAS');
    expect(invoice.buyer.name).toBe('Le Petit Poucet Restaurant');

    // Montants en micro-unités
    expect(invoice.totalHTInMicrounits).toBe(45_000_000);   // 45,00 €
    expect(invoice.totalVATInMicrounits).toBe(2_480_000);   // 2,48 €
    expect(invoice.totalTTCInMicrounits).toBe(47_480_000);  // 47,48 €

    // Lignes
    expect(invoice.lines).toHaveLength(1);
    expect(invoice.lines[0].description).toBe('Tomates Anciennes Bio (kg)');
    expect(invoice.lines[0].quantity).toBe(10);
    expect(invoice.lines[0].unitPriceHTInMicrounits).toBe(4_500_000); // 4,50 €
    expect(invoice.lines[0].vatRate).toBe(0.055);
  });

  it('détecte et parse correctement une facture au format UBL', () => {
    const invoice = parseEInvoiceXml(sampleUblXml, 'pdp_ubl_002');

    expect(invoice.format).toBe('ubl');
    expect(invoice.invoiceNumber).toBe('INV-UBL-9988');
    expect(invoice.issueDate).toBe('2026-09-01');
    expect(invoice.dueDate).toBe('2026-10-01');
    expect(invoice.seller.name).toBe('Équipement Pro France');
    expect(invoice.buyer.name).toBe("Restaurant L'Étoile");

    // Montants en micro-unités
    expect(invoice.totalHTInMicrounits).toBe(100_000_000);  // 100,00 €
    expect(invoice.totalVATInMicrounits).toBe(20_000_000);   // 20,00 €
    expect(invoice.totalTTCInMicrounits).toBe(120_000_000);  // 120,00 €

    // Lignes
    expect(invoice.lines).toHaveLength(1);
    expect(invoice.lines[0].description).toBe('Bacs Gastronorme Inox');
    expect(invoice.lines[0].quantity).toBe(2);
    expect(invoice.lines[0].unitPriceHTInMicrounits).toBe(50_000_000);
    expect(invoice.lines[0].totalHTInMicrounits).toBe(100_000_000);
  });
});
