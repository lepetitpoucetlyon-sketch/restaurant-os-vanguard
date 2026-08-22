import { describe, it, expect } from "vitest";
import { RESTAURANT_BLUEPRINT } from "@/verticals/restaurant/restaurant.blueprint";
import { GYM_BLUEPRINT } from "@/verticals/gym/gym.blueprint";
import { COWORKING_BLUEPRINT } from "@/verticals/coworking/coworking.blueprint";
import { FLORIST_BLUEPRINT } from "@/verticals/florist/florist.blueprint";
import { VETERINARY_BLUEPRINT } from "@/verticals/veterinary/veterinary.blueprint";

describe("🏗️ Multi-Vertical Sub-Variants & Blueprint Matrix Tests", () => {
    describe("1. Restaurant & Sous-Variantes (Bar / Brasserie / Gastro)", () => {
        it("devrait contenir la sous-variante bar_tapas avec les capacités spécifiques", () => {
            expect(RESTAURANT_BLUEPRINT.subVariants).toBeDefined();
            const barVariant = RESTAURANT_BLUEPRINT.subVariants?.find(v => v.slug === "bar_tapas");
            expect(barVariant).toBeDefined();
            expect(barVariant?.label).toBe("Bar & Tapas");
            expect(barVariant?.capabilities?.mod_bar).toBe(true);
            expect(barVariant?.capabilities?.mod_pos).toBe(true);
        });

        it("devrait contenir la sous-variante gastronomique avec mod_quotes", () => {
            const gastro = RESTAURANT_BLUEPRINT.subVariants?.find(v => v.slug === "gastronomique");
            expect(gastro).toBeDefined();
            expect(gastro?.capabilities?.mod_quotes).toBe(true);
        });
    });

    describe("2. Cohérence des Métadonnées Multi-Verticales", () => {
        it("devrait valider les blueprints de Gym, Coworking, Fleuriste et Vétérinaire", () => {
            const blueprints = [GYM_BLUEPRINT, COWORKING_BLUEPRINT, FLORIST_BLUEPRINT, VETERINARY_BLUEPRINT];
            for (const bp of blueprints) {
                expect(bp.slug).toBeDefined();
                expect(bp.meta.name).toBeDefined();
                expect(bp.profile).toBeDefined();
                expect(bp.routes.length).toBeGreaterThan(0);
                expect(bp.hardware.length).toBeGreaterThan(0);
            }
        });
    });
});
