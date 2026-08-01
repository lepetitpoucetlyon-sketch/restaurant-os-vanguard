/**
 * FacturXGenerator — fin-9
 * Génère le XML Factur-X profil MINIMUM (EN16931) pour l'e-facturation B2B 2026.
 *
 * Factur-X = PDF classique + XML embarqué (ZUGFeRD/EN16931).
 * Ce module produit uniquement le XML (texte pur — pas de jspdf).
 * L'embedding PDF peut être réalisé via un outil serveur (ex. pdfcpu, ghostscript).
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FacturXLine {
    description: string;
    quantity: number;
    /** Prix unitaire en euros (pas en microunits — export XML externe) */
    unitPrice: number;
    /** Taux de TVA : 0.20, 0.10, 0.055 */
    vatRate: number;
}

export interface FacturXParty {
    name: string;
    siret: string;
    address: string;
    vatNumber?: string;
}

export interface FacturXBuyer {
    name: string;
    siret?: string;
    address: string;
    vatNumber?: string;
}

export interface FacturXInvoice {
    invoiceNumber: string;
    /** YYYY-MM-DD */
    issueDate: string;
    seller: FacturXParty;
    buyer: FacturXBuyer;
    lines: FacturXLine[];
    /** Devise ISO 4217, 'EUR' par défaut */
    currency?: string;
}

// ── Generator ─────────────────────────────────────────────────────────────────

export class FacturXGenerator {
    /**
     * Génère le XML Factur-X profil MINIMUM selon la norme EN16931 / Factur-X 1.0.
     * Retourne une chaîne XML valide UTF-8.
     */
    generateXML(invoice: FacturXInvoice): string {
        const currency = invoice.currency ?? 'EUR';

        const totalHT = invoice.lines.reduce(
            (s, l) => s + l.quantity * l.unitPrice,
            0
        );
        const totalVAT = invoice.lines.reduce(
            (s, l) => s + l.quantity * l.unitPrice * l.vatRate,
            0
        );
        const totalTTC = totalHT + totalVAT;

        // YYYYMMDD sans tirets pour le format DateTimeString 102
        const issueDateCompact = invoice.issueDate.replace(/-/g, '');

        const buyerSiret = invoice.buyer.siret
            ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${escapeXml(invoice.buyer.siret)}</ram:ID></ram:SpecifiedLegalOrganization>`
            : '';

        return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">

  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:minimum</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(invoice.invoiceNumber)}</ram:ID>
    <!-- 380 = Facture commerciale (code UNTDID 1001) -->
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${issueDateCompact}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>

  <rsm:SupplyChainTradeTransaction>

    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(invoice.seller.name)}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${escapeXml(invoice.seller.siret)}</ram:ID>
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXml(invoice.seller.address)}</ram:LineOne>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        ${invoice.seller.vatNumber
            ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${escapeXml(invoice.seller.vatNumber)}</ram:ID></ram:SpecifiedTaxRegistration>`
            : ''}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXml(invoice.buyer.name)}</ram:Name>
        ${buyerSiret}
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXml(invoice.buyer.address)}</ram:LineOne>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        ${invoice.buyer.vatNumber
            ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${escapeXml(invoice.buyer.vatNumber)}</ram:ID></ram:SpecifiedTaxRegistration>`
            : ''}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>

    <ram:ApplicableHeaderTradeDelivery />

    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${escapeXml(currency)}</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${totalHT.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxTotalAmount currencyID="${escapeXml(currency)}">${totalVAT.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${totalTTC.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${totalTTC.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>

  </rsm:SupplyChainTradeTransaction>

</rsm:CrossIndustryInvoice>`;
    }

    /**
     * Génère et déclenche le téléchargement du XML via l'API DOM.
     * (Client-side uniquement.)
     */
    downloadXML(invoice: FacturXInvoice, filename?: string): void {
        const xml = this.generateXML(invoice);
        const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename ?? `facturx_${invoice.invoiceNumber}.xml`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Échappe les caractères spéciaux XML dans les valeurs textuelles. */
function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
