
import type { CA3Declaration } from './types';
import { SovereignMath } from '@/shared/services/SovereignMath';
import { NexusTelemetryService } from '@/lib/NexusTelemetryService';

/**
 * 🏛️ EDIMapper - Grade X+++
 * Transforme une déclaration CA3 interne en format XML TDFC / EDI normé DGFiP (Cerfa 3310-CA3).
 */
export class EDIMapper {
    /**
     * Génère l'export XML TDFC conforme au cahier des charges DGFiP EDI-TVA (Partenaires EDI / JeDéclare)
     */
    static toTDFC(declaration: CA3Declaration): string {
        const toEuro = (cents: number) => SovereignMath.fromMicrounits(SovereignMath.fromCents(cents)).toFixed(2);
        
        const base55 = declaration.breakdown.taxBaseByRate['5.5'] || 0;
        const tax55 = declaration.breakdown.taxCollectedByRate['5.5'] || 0;

        const base10 = declaration.breakdown.taxBaseByRate['10.0'] || declaration.breakdown.taxBaseByRate['10'] || 0;
        const tax10 = declaration.breakdown.taxCollectedByRate['10.0'] || declaration.breakdown.taxCollectedByRate['10'] || 0;

        const base20 = declaration.breakdown.taxBaseByRate['20.0'] || declaration.breakdown.taxBaseByRate['20'] || 0;
        const tax20 = declaration.breakdown.taxCollectedByRate['20.0'] || declaration.breakdown.taxCollectedByRate['20'] || 0;

        let xml = `<?xml version="1.0" encoding="ISO-8859-1"?>\n`;
        xml += `<TDFC xmlns="http://www.minefi.gouv.fr/cp/tdfc" version="2026.01">\n`;
        xml += `  <Entete>\n`;
        xml += `    <EmetteurSIREN>${declaration.siren}</EmetteurSIREN>\n`;
        xml += `    <Periode>${declaration.period}</Periode>\n`;
        xml += `    <RegimeFiscal>REEL_NORMAL</RegimeFiscal>\n`;
        xml += `    <FormulaireCerfa>3310-CA3</FormulaireCerfa>\n`;
        xml += `  </Entete>\n`;
        xml += `  <CA3_2026>\n`;
        xml += `    <!-- Cadre A : Montant des opérations réalisées -->\n`;
        xml += `    <Ligne01_VentesPrestations>${toEuro(declaration.breakdown.totalRevenueInCents)}</Ligne01_VentesPrestations>\n`;
        xml += `    <!-- Cadre B : Décompte de la TVA brute -->\n`;
        xml += `    <Ligne08_Taux20_0 Base="${toEuro(base20)}" TaxeDue="${toEuro(tax20)}" />\n`;
        xml += `    <Ligne09b_Taux10_0 Base="${toEuro(base10)}" TaxeDue="${toEuro(tax10)}" />\n`;
        xml += `    <Ligne09c_Taux5_5 Base="${toEuro(base55)}" TaxeDue="${toEuro(tax55)}" />\n`;
        xml += `    <Ligne20_TotalTvaBrute>${toEuro(declaration.breakdown.totalTaxCollectedInCents)}</Ligne20_TotalTvaBrute>\n`;
        xml += `    <!-- Cadre C : Décompte de la TVA déductible -->\n`;
        xml += `    <Ligne23_TvaDeductibleBiensServices>${toEuro(declaration.breakdown.deductibleTaxInCents)}</Ligne23_TvaDeductibleBiensServices>\n`;
        xml += `    <!-- Cadre D : TVA nette due ou Crédit -->\n`;
        xml += `    <Ligne28_TvaNetteADecaisser>${toEuro(declaration.breakdown.netTaxToPayInCents)}</Ligne28_TvaNetteADecaisser>\n`;
        xml += `  </CA3_2026>\n`;
        xml += `</TDFC>`;
        
        NexusTelemetryService.emitAuditPulse('FINANCE', 'EDI_TDFC_MAPPED', { siren: declaration.siren, period: declaration.period });
        return xml;
    }
}
