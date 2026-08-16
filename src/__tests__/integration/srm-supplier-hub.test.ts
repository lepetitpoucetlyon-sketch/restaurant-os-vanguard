import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MultiSupplierPriceComparatorService } from '@/modules/logistics/approvisionnement/mercuriales/MultiSupplierPriceComparatorService';
import { MultiChannelOrderDispatcherService } from '@/modules/logistics/approvisionnement/orders/MultiChannelOrderDispatcherService';
import { DeliveryDisputeService } from '@/modules/logistics/approvisionnement/reception/DeliveryDisputeService';
import { RfaContractService } from '@/modules/logistics/approvisionnement/contracts/RfaContractService';
import { PriceDriftDetectorService } from '@/modules/logistics/approvisionnement/services/PriceDriftDetectorService';
import type { MercurialeItem } from '@/modules/logistics/approvisionnement/mercuriales/MercurialeTypes';
import type { PurchaseOrderEntity } from '@/modules/logistics/approvisionnement/orders/SupplierOrderTypes';
import type { SupplierEntity } from '@/modules/logistics/approvisionnement/core/domain/supplier.types';
import type { RfaContractEntity } from '@/modules/logistics/approvisionnement/contracts/RfaContractTypes';

describe('🚚 SRM Souverain — Integration Multi-Fournisseurs 360° Pipeline', () => {
    const TENANT_ID = 'tenant_srm_empire_001';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Scénario 1 : Comparaison de mercuriales & sélection de la meilleure offre', () => {
        const ingredientNamesMap = new Map([
            ['ing_entrecote', { name: 'Entrecôte Black Angus', baseUnit: 'kg' as const }],
        ]);

        const suppliersMap = new Map([
            ['supp_metro', 'Metro Cash & Carry'],
            ['supp_transgourmet', 'Transgourmet'],
            ['supp_pomona', 'Pomona TerreAzur'],
        ]);

        const mercurialeItems: MercurialeItem[] = [
            {
                id: 'm1',
                supplierId: 'supp_metro',
                ingredientId: 'ing_entrecote',
                name: 'Entrecôte Black Angus',
                supplierRefCode: 'MET-EA-01',
                packagingLabel: 'Barquette 1kg',
                packagingQuantity: 1,
                packagingUnit: 'kg',
                conversionFactorToBaseUnit: 1,
                packagePriceHtCts: 1450,
                unitPriceHtCts: 1450, // 14.50 €
                vatRatePct: 5.5,
                validFromUtc: Date.now(),
                isAvailable: true,
            },
            {
                id: 'm2',
                supplierId: 'supp_transgourmet',
                ingredientId: 'ing_entrecote',
                name: 'Entrecôte Black Angus',
                supplierRefCode: 'TG-EA-99',
                packagingLabel: 'Barquette 1kg',
                packagingQuantity: 1,
                packagingUnit: 'kg',
                conversionFactorToBaseUnit: 1,
                packagePriceHtCts: 1380,
                unitPriceHtCts: 1380, // 13.80 € (Le moins cher)
                vatRatePct: 5.5,
                validFromUtc: Date.now(),
                isAvailable: true,
            },
            {
                id: 'm3',
                supplierId: 'supp_pomona',
                ingredientId: 'ing_entrecote',
                name: 'Entrecôte Black Angus',
                supplierRefCode: 'POM-EA-77',
                packagingLabel: 'Barquette 1kg',
                packagingQuantity: 1,
                packagingUnit: 'kg',
                conversionFactorToBaseUnit: 1,
                packagePriceHtCts: 1600,
                unitPriceHtCts: 1600, // 16.00 €
                vatRatePct: 5.5,
                validFromUtc: Date.now(),
                isAvailable: true,
            },
        ];

        const comparison = MultiSupplierPriceComparatorService.compareIngredientPrices(
            ingredientNamesMap,
            mercurialeItems,
            suppliersMap
        );

        expect(comparison.length).toBe(1);
        expect(comparison[0].cheapestSupplierId).toBe('supp_transgourmet');
        expect(comparison[0].bestUnitPriceHtCts).toBe(1380);
        expect(comparison[0].worstUnitPriceHtCts).toBe(1600);
        expect(comparison[0].spreadPct).toBeGreaterThan(15);
    });

    it('Scénario 2 : Dispatch multi-canal d’une commande fournisseur (WhatsApp + Validation des contraintes)', () => {
        const order: PurchaseOrderEntity = {
            id: 'po_999',
            tenantId: TENANT_ID,
            orderNumber: 'CMD-2026-0042',
            supplierId: 'supp_metro',
            supplierName: 'Metro Cash & Carry',
            createdById: 'emp_chef_1',
            status: 'DRAFT',
            dispatchChannel: 'WHATSAPP',
            francoReached: true,
            shippingCostCts: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            expectedDeliveryDate: '2026-08-18',
            totalHtCts: 22000, // 220 € HT
            totalVatCts: 1210,
            totalTtcCts: 23210,
            items: [
                {
                    mercurialeItemId: 'm1',
                    ingredientId: 'ing_entrecote',
                    name: 'Entrecôte Black Angus',
                    packagesCount: 10,
                    packagingLabel: '10x Barquette 1kg',
                    packagePriceHtCts: 2200,
                    totalHtCts: 22000,
                    totalQuantityBaseUnit: 10,
                }
            ]
        };

        const supplier: SupplierEntity = {
            id: 'supp_metro',
            tenantId: TENANT_ID,
            name: 'Metro Cash & Carry',
            category: 'meats',
            preferredOrderChannel: 'WHATSAPP',
            contacts: [
                {
                    id: 'c1',
                    name: 'Marc Commercial',
                    role: 'commercial',
                    phone: '+33612345678',
                    email: 'commandes@metro.fr',
                    isPrimary: true,
                }
            ],
            francoCts: 15000, // 150 € HT Franco
            shippingCostCts: 2500,
            paymentTerms: '30_DAYS',
            paymentMethod: 'SEPA_DEBIT',
            deliverySchedule: {
                allowedDays: [1, 2, 3, 4, 5, 6], // Lun - Sam
                cutOffTime: '23:00',
                cutOffDaysBefore: 1,
                deliveryWindow: '06:00-10:00',
            },
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        // 1. Validation des contraintes de livraison
        const validation = MultiChannelOrderDispatcherService.validateOrderConstraints(
            order,
            supplier,
            '2026-08-18'
        );
        expect(validation.isValid).toBe(true);
        expect(validation.errors.length).toBe(0);

        // 2. Génération du message WhatsApp
        const waPayload = MultiChannelOrderDispatcherService.generateWhatsAppPayload(
            order,
            'Le Petit Poucet',
            '+33612345678'
        );

        expect(waPayload.channel).toBe('WHATSAPP');
        expect(waPayload.formattedBody).toContain('COMMANDE FOURNISSEUR — LE PETIT POUCET');
        expect(waPayload.formattedBody).toContain('CMD-2026-0042');
        expect(waPayload.formattedBody).toContain('220.00 € HT');
    });

    it('Scénario 3 : Réception, détection de litige & calcul d’avoir financier automatique', () => {
        const dispute = DeliveryDisputeService.createDispute({
            tenantId: TENANT_ID,
            disputeNumber: 'LIT-2026-001',
            purchaseOrderId: 'po_999',
            deliveryNoteNumber: 'BL-POMONA-8874',
            supplierId: 'supp_pomona',
            supplierName: 'Pomona TerreAzur',
            reportedById: 'emp_chef_1',
            lines: [
                {
                    id: 'dl_1',
                    ingredientId: 'ing_avocat',
                    ingredientName: 'Avocat Hass Calibre 18',
                    expectedPackagesCount: 20,
                    receivedPackagesCount: 15, // 5 manquants
                    missingPackagesCount: 5,
                    packagePriceHtCts: 1000, // 10.00 €/colis
                    reason: 'MISSING_ITEM',
                    comments: '5 colis manquants sur la palette',
                },
                {
                    id: 'dl_2',
                    ingredientId: 'ing_tomate',
                    ingredientName: 'Tomate Cœur de Bœuf',
                    expectedPackagesCount: 10,
                    receivedPackagesCount: 10,
                    missingPackagesCount: 2, // 2 écrasés
                    packagePriceHtCts: 1500, // 15.00 €/caisse
                    reason: 'DAMAGED_PACKAGE',
                    comments: '2 caisses écrasées',
                }
            ],
            vatRatePct: 5.5,
        });

        // 5 * 10€ + 2 * 15€ = 50€ + 30€ = 80€ HT (8000 cts)
        expect(dispute.totalClaimedHtCts).toBe(8000);
        expect(dispute.totalClaimedTtcCts).toBe(8440); // 80€ + 5.5% TVA = 84.40€
        expect(dispute.status).toBe('OPEN');

        const formalNotice = DeliveryDisputeService.generateClaimEmailBody(
            dispute,
            'Le Petit Poucet'
        );
        expect(formalNotice).toContain('non-conformité lors de la réception');
        expect(formalNotice).toContain('BL-POMONA-8874');
        expect(formalNotice).toContain('80.00 € HT');

        // Rapprochement avec un avoir reçu
        const reconciliation = DeliveryDisputeService.reconcileCreditNote(
            dispute,
            'AVOIR-POMONA-2026-99',
            8440
        );
        expect(reconciliation.isExactMatch).toBe(true);
        expect(reconciliation.updatedDispute.status).toBe('CREDIT_NOTE_RECEIVED');
    });

    it('Scénario 4 : Calcul souverain des RFA (Remises de Fin d’Année)', () => {
        const contract: RfaContractEntity = {
            id: 'rfa_transgourmet_2026',
            tenantId: TENANT_ID,
            contractNumber: 'CTR-RFA-2026-01',
            supplierId: 'supp_transgourmet',
            supplierName: 'Transgourmet',
            year: 2026,
            startDateUtc: Date.UTC(2026, 0, 1),
            endDateUtc: Date.UTC(2026, 11, 31),
            cumulativePurchasesHtCts: 12000000, // 120 000 € HT réalisés
            tiers: [
                { thresholdVolumeCts: 5000000, rebateRatePct: 2.0 },  // 50k€ -> 2%
                { thresholdVolumeCts: 10000000, rebateRatePct: 3.5 }, // 100k€ -> 3.5%
                { thresholdVolumeCts: 20000000, rebateRatePct: 5.0 }, // 200k€ -> 5%
            ],
            isSettled: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const projection = RfaContractService.calculateRfaProjection(contract);

        expect(projection.currentEarnedRebateCts).toBe(420000); // 120 000 € * 3.5% = 4 200 €
        expect(projection.nextTier).toBeDefined();
        expect(projection.nextTier?.rebateRatePct).toBe(5.0);
        expect(projection.nextTier?.remainingVolumeToReachCts).toBe(8000000); // 200k - 120k = 80k€
    });

    it('Scénario 5 : Surveillance en temps réel de la dérive des prix d’achat (Price Drift)', () => {
        const invoiceItems = [
            {
                ingredientId: 'ing_beurre',
                name: 'Beurre Gastronomique 82% MG',
                unit: 'kg',
                newUnitPriceCts: 1150, // 11.50 € (+15% de hausse brutale !)
                quantity: 20,
                supplierId: 'supp_metro',
            }
        ];

        const historyMap = new Map([
            ['ing_beurre', {
                ingredientId: 'ing_beurre',
                lastUnitPriceCts: 1000, // Ancien prix : 10.00 €
                lastInvoiceDateUtc: Date.now() - 86400000 * 30,
                supplierId: 'supp_metro',
            }]
        ]);

        const recipesMap = new Map([
            ['ing_beurre', [{
                recipeId: 'rec_croissant',
                recipeName: 'Croissant Beurre AOP',
                sellingPriceTtcCts: 180,
                currentCostCts: 45,
                ingredientQuantityUsed: 0.05, // 50g de beurre par pièce
            }]]
        ]);

        const batchAnalysis = PriceDriftDetectorService.analyzeInvoiceItems(
            invoiceItems,
            historyMap,
            recipesMap,
            5.0 // Seuil d'alerte : 5%
        );

        expect(batchAnalysis.hasCriticalDrifts).toBe(true);
        expect(batchAnalysis.flaggedItemsCount).toBe(1);
        expect(batchAnalysis.drifts[0].driftPercentage).toBeCloseTo(15.0);
        expect(batchAnalysis.drifts[0].impactedRecipes.length).toBe(1);
        expect(batchAnalysis.drifts[0].impactedRecipes[0].recipeName).toBe('Croissant Beurre AOP');
    });
});
