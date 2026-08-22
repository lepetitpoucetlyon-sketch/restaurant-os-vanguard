import { describe, it, expect, beforeEach, vi } from "vitest";
import "@/e2e/vanguard/mocks";
import { DigitalDnaCrawlerService } from "@/modules/commerce/acquisition/onboarding/services/DigitalDnaCrawlerService";
import { Nexus } from "@/lib/nexus/NexusAdapter";

describe("🧬 DigitalDnaCrawlerService — Instant Morphogenesis Unit Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("1. Heuristiques & Signaux de détection", () => {
        it("devrait détecter la variante gym pour un club de sport ou crossfit", () => {
            const variant = DigitalDnaCrawlerService._detectVariantFromSignals("https://crossfit-bastille.com", "@crossfitparis", "CrossFit Bastille");
            expect(variant).toBe("gym");
        });

        it("devrait détecter la variante coworking pour un espace de travail", () => {
            const variant = DigitalDnaCrawlerService._detectVariantFromSignals("https://hub-coworking-marais.fr", "@hub_cowork", "Hub Coworking");
            expect(variant).toBe("coworking");
        });

        it("devrait détecter la variante florist pour un fleuriste", () => {
            const variant = DigitalDnaCrawlerService._detectVariantFromSignals("https://atelier-fleuriste.paris", "@les_fleurs_de_lucie", "Atelier Fleuriste");
            expect(variant).toBe("florist");
        });

        it("devrait détecter la variante veterinary pour une clinique vétérinaire", () => {
            const variant = DigitalDnaCrawlerService._detectVariantFromSignals("https://clinique-vet-republique.com", "@vet_republique", "Clinique Vétérinaire");
            expect(variant).toBe("veterinary");
        });

        it("devrait fallback sur restaurant pour une brasserie ou bistrot", () => {
            const variant = DigitalDnaCrawlerService._detectVariantFromSignals("https://lebistrot-parisien.com", "@lebistrot", "Le Bistrot Parisien");
            expect(variant).toBe("restaurant");
        });
    });

    describe("2. Extraction & Nettoyage d identité", () => {
        it("devrait extraire un nom propre depuis un handle Instagram", () => {
            const name = DigitalDnaCrawlerService._extractNameFromUrl(undefined, "@bistrot_des_arts");
            expect(name).toBe("Bistrot des arts");
        });

        it("devrait extraire un nom propre depuis une URL de site web", () => {
            const name = DigitalDnaCrawlerService._extractNameFromUrl("https://www.lecomptoir.fr", undefined);
            expect(name).toBe("Lecomptoir");
        });
    });

    describe("3. Extraction du Catalogue & Taux de TVA Légal", () => {
        it("devrait générer des prix stricts en microunités entières et TVA conforme", () => {
            const products = DigitalDnaCrawlerService._extractCatalog("restaurant", "Le Bistrot");
            expect(products.length).toBeGreaterThan(0);

            for (const prod of products) {
                expect(Number.isInteger(prod.priceInMicrounits)).toBe(true);
                expect(prod.priceInMicrounits).toBeGreaterThan(0);
                expect([0.055, 0.10, 0.20]).toContain(prod.taxRate);
            }
        });
    });

    describe("4. Ingestion & Morphogenèse End-to-End", () => {
        it("devrait exécuter la morphogenèse complète et injecter le catalogue", async () => {
            const result = await DigitalDnaCrawlerService.ingestAndMorph({
                tenantId: "tenant_morph_test_01",
                adminEmail: "owner@bistrot.test",
                websiteUrl: "https://bistrot-test.fr",
                instagramHandle: "@bistrot_test",
                businessName: "Bistrot Test",
                adminPin: "1234",
            });

            expect(result.success).toBe(true);
            expect(result.tenantId).toBe("tenant_morph_test_01");
            expect(result.detectedVariant).toBe("restaurant");
            expect(result.products.length).toBeGreaterThanOrEqual(4);
            expect(result.stats.estimatedHoursSaved).toBeGreaterThan(0);
        });
    });
});
