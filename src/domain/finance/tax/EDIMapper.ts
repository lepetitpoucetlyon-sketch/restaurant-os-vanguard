
import { CA3Declaration } from './types';
import { SovereignMath } from '@/shared/services/SovereignMath';

/**
 * 🏛️ EDIMapper - Grade X+++
 * Transforme une déclaration CA3 interne en format XML TDFC pour la DGFiP.
 */
export class EDIMapper {
    static toTDFC(declaration: CA3Declaration): string {
        const toEuro = (cents: number) => SovereignMath.fromMicrounits(SovereignMath.fromCents(cents)).toFixed(2);
        
        // Structure XML TDFC simplifiée pour la simulation
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<TDFC>\n`;
        xml += `  <Header>\n`;
        xml += `    <SIREN>${declaration.siren}</SIREN>\n`;
        xml += `    <Period>${declaration.period}</Period>\n`;
        xml += `  </Header>\n`;
        xml += `  <CA3>\n`;
        xml += `    <TotalRevenue>${toEuro(declaration.breakdown.totalRevenueInCents)}</TotalRevenue>\n`;
        
        for (const [rate, amount] of Object.entries(declaration.breakdown.taxBaseByRate)) {
            const taxCollected = declaration.breakdown.taxCollectedByRate[rate] || 0;
            xml += `    <TaxLine rate="${rate}">\n`;
            xml += `      <Base>${toEuro(amount)}</Base>\n`;
            xml += `      <Collected>${toEuro(taxCollected)}</Collected>\n`;
            xml += `    </TaxLine>\n`;
        }

        xml += `    <DeductibleTax>${toEuro(declaration.breakdown.deductibleTaxInCents)}</DeductibleTax>\n`;
        xml += `    <NetTax>${toEuro(declaration.breakdown.netTaxToPayInCents)}</NetTax>\n`;
        xml += `  </CA3>\n`;
        xml += `</TDFC>`;
        
        return xml;
    }
}
