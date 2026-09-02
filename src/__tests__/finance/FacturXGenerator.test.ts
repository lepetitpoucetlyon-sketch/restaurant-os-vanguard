import { describe, it, expect } from 'vitest';
import { FacturXGenerator, type FacturXInvoice } from '@/modules/finance/comptabilite/documents/FacturXGenerator';
import { parseEInvoiceXml } from '@/modules/finance/comptabilite/einvoicing/FacturXParser';

describe('🧾 [Finance] FacturXGenerator — EN16931 & Round-trip Validation', () => {
    const sampleInvoice: FacturXInvoice = {
        invoiceNumber: 'FACT-2026-0042',
        issueDate: '2026-09-02',
        currency: 'EUR',
        seller: {
            name: 'Le Petit Poucet SAS',
            siret: '81234567800019',
            address: '14 Rue des Rôtisseurs, 69002 Lyon',
            vatNumber: 'FR81234567800',
        },
        buyer: {
            name: 'Fournisseur Bio & Terroir SARL',
            siret: '91234567800027',
            address: '5 Avenue de la Gastronomie, 69006 Lyon',
            vatNumber: 'FR91234567800',
        },
        lines: [
            {
                description: 'Poulet Fermier Label Rouge Rôti',
                quantity: 10,
                unitPrice: 15.00,
                vatRate: 0.10, // 10% TVA restauration / alimentaire immédiat
            },
            {
                description: 'Bouteille Côte-Rôtie 2020',
                quantity: 4,
                unitPrice: 45.00,
                vatRate: 0.20, // 20% TVA alcools
            },
        ],
    };

    it('doit générer un XML Factur-X valide contenant les balises CII obligatoires', () => {
        const generator = new FacturXGenerator();
        const xml = generator.generateXML(sampleInvoice);

        expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(xml).toContain('<rsm:CrossIndustryInvoice');
        expect(xml).toContain('<ram:ID>FACT-2026-0042</ram:ID>');
        expect(xml).toContain('<ram:Name>Le Petit Poucet SAS</ram:Name>');
        expect(xml).toContain('<ram:Name>Fournisseur Bio &amp; Terroir SARL</ram:Name>');
        
        // Totaux vérifiés :
        // Ligne 1 : 10 * 15.00 = 150.00 HT, TVA 10% = 15.00
        // Ligne 2 : 4 * 45.00 = 180.00 HT, TVA 20% = 36.00
        // Total HT = 330.00, Total TVA = 51.00, Total TTC = 381.00
        expect(xml).toContain('<ram:LineTotalAmount>330.00</ram:LineTotalAmount>');
        expect(xml).toContain('<ram:TaxTotalAmount currencyID="EUR">51.00</ram:TaxTotalAmount>');
        expect(xml).toContain('<ram:GrandTotalAmount>381.00</ram:GrandTotalAmount>');
        expect(xml).toContain('<ram:DuePayableAmount>381.00</ram:DuePayableAmount>');
    });

    it('doit être analysable sans perte par le FacturXParser (Round-Trip)', async () => {
        const generator = new FacturXGenerator();
        const xml = generator.generateXML(sampleInvoice);

        const parsed = await parseEInvoiceXml(xml);

        expect(parsed.format).toBe('cii');
        expect(parsed.invoiceNumber).toBe('FACT-2026-0042');
        expect(parsed.issueDate).toBe('2026-09-02');
        expect(parsed.currency).toBe('EUR');
        // FacturXParser utilise les microunits (1 EUR = 1_000_000 microunits)
        expect(parsed.totalHTInMicrounits).toBe(330_000_000);
        expect(parsed.totalTTCInMicrounits).toBe(381_000_000);
        expect(parsed.totalVATInMicrounits).toBe(51_000_000);
        expect(parsed.seller.name).toBe('Le Petit Poucet SAS');
        expect(parsed.buyer.name).toBe('Fournisseur Bio &amp; Terroir SARL');
    });
});
