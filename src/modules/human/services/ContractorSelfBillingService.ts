import { User } from '../domain/schemas/users';
import { SovereignMath } from '@/shared/services/SovereignMath';
import { logger } from '@/lib/logger';

/**
 * 🧾 ContractorSelfBillingService — Restaurant OS
 * Moteur de Mandat d'Auto-Facturation (Self-Billing) & Facturation B2B pour Auto-Entrepreneurs et Freelances.
 * 
 * Cadre Juridique & Fiscal :
 * - Art. 242 nonies de l'annexe II au CGI (Mandat d'auto-facturation préalable conclu entre les parties)
 * - Art. 293 B du CGI (Franchise en base de TVA pour auto-entrepreneurs)
 * - Format Factur-X / CII conforme Chorus Pro et PDP (Décret facturation électronique 2026)
 * - Affectation comptable automatique : Compte 611000 (Sous-traitance) ou 622000 (Honoraires)
 */

export interface ContractorShift {
  id: string;
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "18:00"
  endTime: string;    // "23:30"
  description?: string;
}

export interface SelfBillingInvoiceDraft {
  invoiceNumber: string;
  issueDate: string;  // ISO
  dueDate: string;    // ISO
  periodMonth: string;// "YYYY-MM"
  
  // Vendeur (Auto-Entrepreneur)
  seller: {
    userId: string;
    name: string;
    companyName?: string;
    siret: string;
    address?: string;
    city?: string;
    postalCode?: string;
    vatRegime: 'franchise_art_293b' | 'vat_standard_20' | 'vat_exempt';
    vatNumber?: string;
    iban?: string;
    bic?: string;
  };

  // Acheteur (Restaurant / Tenant)
  buyer: {
    tenantId: string;
    restaurantName: string;
    siret: string;
    address: string;
    city: string;
    postalCode: string;
    vatNumber?: string;
  };

  // Lignes de vacation
  lines: Array<{
    date: string;
    description: string;
    hours: number;
    hourlyRateEur: number;
    totalHtInMicrounits: number;
    vatRatePercent: number;
    vatAmountInMicrounits: number;
    totalTtcInMicrounits: number;
  }>;

  totalHours: number;
  totalHtInMicrounits: number;
  totalVatInMicrounits: number;
  totalTtcInMicrounits: number;
  totalHtEur: number;
  totalVatEur: number;
  totalTtcEur: number;
  
  legalMentions: string[];
  xmlFacturX: string;
}

export class ContractorSelfBillingService {
  /**
   * Vérifie la validité d'un numéro SIRET (14 chiffres) via l'algorithme de Luhn.
   */
  static validateSiretLuhn(siret: string): boolean {
    const cleaned = siret.replace(/\s+/g, '');
    if (!/^\d{14}$/.test(cleaned)) return false;

    let sum = 0;
    for (let i = 0; i < 14; i++) {
      let digit = parseInt(cleaned[i], 10);
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    return sum % 10 === 0;
  }

  /**
   * Calcule et génère la facture Factur-X complète au nom de l'auto-entrepreneur.
   */
  static generateSelfBillingInvoice(input: {
    contractor: User;
    tenant: {
      id: string;
      name: string;
      siret: string;
      address: string;
      city: string;
      postalCode: string;
      vatNumber?: string;
    };
    shifts: ContractorShift[];
    periodMonth: string;
    invoiceSequenceNumber?: number;
  }): SelfBillingInvoiceDraft {
    const profile = input.contractor.contractorProfile;
    const siret = profile?.siret || '00000000000000';
    const vatRegime = profile?.vatRegime || 'franchise_art_293b';
    const vatRate = vatRegime === 'vat_standard_20' ? 20 : 0;
    const hourlyRateInMu = profile?.rateInMicrounits ?? (input.contractor.hourlyRateInMicrounits || (20 * 1_000_000));
    const hourlyRateEur = hourlyRateInMu / 1_000_000;

    const seq = input.invoiceSequenceNumber || Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `FAC-AUTO-${input.periodMonth.replace('-', '')}-${seq}`;
    const issueDate = new Date().toISOString();
    
    // Échéance à 15 jours par défaut pour les prestataires
    const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

    let totalDurationHours = 0;
    const lines = input.shifts.map(shift => {
      const start = new Date(`${shift.date}T${shift.startTime}`);
      const end = new Date(`${shift.date}T${shift.endTime}`);
      const durationMs = Math.max(0, end.getTime() - start.getTime());
      const hours = Number((durationMs / (1000 * 60 * 60)).toFixed(2));
      totalDurationHours += hours;

      const lineHtMu = Math.round(hours * hourlyRateInMu);
      const lineVatMu = Math.round(lineHtMu * (vatRate / 100));
      const lineTtcMu = lineHtMu + lineVatMu;

      return {
        date: shift.date,
        description: shift.description || `Vacation de service (${shift.startTime} - ${shift.endTime})`,
        hours,
        hourlyRateEur,
        totalHtInMicrounits: lineHtMu,
        vatRatePercent: vatRate,
        vatAmountInMicrounits: lineVatMu,
        totalTtcInMicrounits: lineTtcMu,
      };
    });

    const totalHtInMicrounits = lines.reduce((acc, l) => acc + l.totalHtInMicrounits, 0);
    const totalVatInMicrounits = lines.reduce((acc, l) => acc + l.vatAmountInMicrounits, 0);
    const totalTtcInMicrounits = totalHtInMicrounits + totalVatInMicrounits;

    const totalHtEur = Number((totalHtInMicrounits / 1_000_000).toFixed(2));
    const totalVatEur = Number((totalVatInMicrounits / 1_000_000).toFixed(2));
    const totalTtcEur = Number((totalTtcInMicrounits / 1_000_000).toFixed(2));

    const legalMentions: string[] = [
      "Facture émise au nom et pour le compte du prestataire (Mandat d'auto-facturation)",
      "Dispensé d'immatriculation au registre du commerce et des sociétés (RCS) et au répertoire des métiers (RM)"
    ];

    if (vatRegime === 'franchise_art_293b') {
      legalMentions.push("TVA non applicable, art. 293 B du CGI");
    }

    // Factur-X XML CII (CrossIndustryInvoice) minimal conforme
    const xmlFacturX = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100">
  <rsm:ExchangedDocument>
    <ram:ID>${invoiceNumber}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>${issueDate.split('T')[0]}</ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${profile?.companyName || input.contractor.name}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${siret}</ram:ID>
        </ram:SpecifiedLegalOrganization>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${input.tenant.name}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${input.tenant.siret}</ram:ID>
        </ram:SpecifiedLegalOrganization>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${totalHtEur.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxTotalAmount>${totalVatEur.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${totalTtcEur.toFixed(2)}</ram:GrandTotalAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

    logger.info(`[ContractorSelfBilling] Invoice ${invoiceNumber} generated for ${input.contractor.name} (${totalTtcEur} €)`);

    return {
      invoiceNumber,
      issueDate,
      dueDate,
      periodMonth: input.periodMonth,
      seller: {
        userId: input.contractor.id,
        name: input.contractor.name,
        companyName: profile?.companyName,
        siret,
        address: profile?.address,
        city: profile?.city,
        postalCode: profile?.postalCode,
        vatRegime,
        vatNumber: profile?.vatNumber,
        iban: profile?.iban,
        bic: profile?.bic,
      },
      buyer: {
        tenantId: input.tenant.id,
        restaurantName: input.tenant.name,
        siret: input.tenant.siret,
        address: input.tenant.address,
        city: input.tenant.city,
        postalCode: input.tenant.postalCode,
        vatNumber: input.tenant.vatNumber,
      },
      lines,
      totalHours: Number(totalDurationHours.toFixed(2)),
      totalHtInMicrounits,
      totalVatInMicrounits,
      totalTtcInMicrounits,
      totalHtEur,
      totalVatEur,
      totalTtcEur,
      legalMentions,
      xmlFacturX,
    };
  }

  /**
   * Génère l'écriture comptable d'achat de sous-traitance (compte 611 / 401).
   */
  static generateAccountingEntry(invoice: SelfBillingInvoiceDraft) {
    return {
      pieceNumber: invoice.invoiceNumber,
      date: invoice.issueDate,
      description: `Sous-traitance - ${invoice.seller.companyName || invoice.seller.name} (${invoice.periodMonth})`,
      status: 'posted',
      referenceId: invoice.invoiceNumber,
      referenceType: 'contractor_invoice',
      lines: [
        {
          accountCode: '611000',
          accountName: 'Sous-traitance générale',
          description: `Prestation freelance (${invoice.totalHours}h)`,
          side: 'debit',
          amountInCents: Math.round(invoice.totalHtEur * 100),
          amountInMicrounits: invoice.totalHtInMicrounits,
        },
        ...(invoice.totalVatInMicrounits > 0 ? [{
          accountCode: '445660',
          accountName: 'TVA déductible sur autres biens et services',
          description: `TVA 20% sur prestation ${invoice.invoiceNumber}`,
          side: 'debit',
          amountInCents: Math.round(invoice.totalVatEur * 100),
          amountInMicrounits: invoice.totalVatInMicrounits,
        }] : []),
        {
          accountCode: '401000',
          accountName: 'Fournisseurs - Prestataires divers',
          description: `Règlement dû à ${invoice.seller.companyName || invoice.seller.name}`,
          side: 'credit',
          amountInCents: Math.round(invoice.totalTtcEur * 100),
          amountInMicrounits: invoice.totalTtcInMicrounits,
        }
      ]
    };
  }
}
