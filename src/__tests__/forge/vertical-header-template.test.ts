import { describe, it, expect } from 'vitest';
import { renderVerticalHeaders } from '@/verticals/_shared/forge/templates/verticalHeader';
import { KICKERS_BY_VARIANT, resolveKicker } from '@/shared/seeds/kickers';
import { PLATFORM_VARIANTS } from '@/modules/system';
import type { BlueprintHeader } from '@/verticals/_shared/blueprint/VerticalBlueprint';

/**
 * Contrat de scalabilité — ADR-017.
 *
 * Ces tests verrouillent le fait que le template + la kicker map + les
 * primitives PageShell tiennent quelle que soit la verticale ajoutée plus
 * tard. Si l'un d'eux casse en rouge, c'est qu'un invariant de composition
 * multi-verticale vient d'être piétiné — la remédiation est prioritaire.
 */

describe('Vertical Forge — headers éditoriaux (ADR-017)', () => {
    describe('KICKERS_BY_VARIANT — invariants de scalabilité', () => {
        it('couvre toutes les PlatformVariants déclarées (le type Record<PlatformVariant, …> le force à la compilation, ce test le lock au runtime)', () => {
            for (const variant of PLATFORM_VARIANTS) {
                expect(KICKERS_BY_VARIANT[variant], `variant ${variant}`).toBeDefined();
                // Chaque variant expose au moins les 3 piliers universels critiques.
                expect(KICKERS_BY_VARIANT[variant].finance, `${variant}.finance`).toBeTruthy();
                expect(KICKERS_BY_VARIANT[variant].commerce, `${variant}.commerce`).toBeTruthy();
                expect(KICKERS_BY_VARIANT[variant].ops, `${variant}.ops`).toBeTruthy();
            }
        });

        it('resolveKicker retombe sur `custom` puis `restaurant` puis capitalisation brute — jamais undefined, jamais crash', () => {
            // Domaine emblématique non déclaré pour gym → fallback gym→custom→restaurant.kitchen = 'Cuisine'.
            expect(resolveKicker('gym', 'kitchen')).toBe('Cuisine');
            // Variant inexistant (cast pour simuler un slug nouveau non déclaré) → fallback via custom.
            const unknown = 'pharmacy' as never;
            expect(resolveKicker(unknown, 'finance')).toBe('Finance');   // custom.finance
            expect(resolveKicker(unknown, 'commerce')).toBe('Clients');  // custom.commerce
            // Domaine inexistant nulle part → fallback capitalisation du domain brut.
            const weirdDomain = 'quantum' as never;
            expect(resolveKicker('restaurant', weirdDomain)).toBe('Quantum');
        });
    });

    describe('renderVerticalHeaders — template pur idempotent', () => {
        const MINIMAL_HEADER: BlueprintHeader = {
            name: 'MembersCheckoutHeader',
            domain: 'commerce',
            title: 'Adhésion',
            titleSize: 'sm',
            dense: true,
            segments: [
                {
                    name: 'view',
                    ariaLabel: 'Vue',
                    items: [
                        { value: 'today', label: "Aujourd'hui", icon: 'Calendar' },
                        { value: 'month', label: 'Ce mois', icon: 'CalendarDays' },
                    ],
                },
            ],
            ctas: [
                { name: 'onCheckout', label: 'Encaisser', icon: 'CreditCard' },
            ],
        };

        it('produit un fichier tsx par header déclaré au bon chemin, marqué skipIfExists', () => {
            const files = renderVerticalHeaders({
                slug: 'gym',
                variant: 'gym',
                headers: [MINIMAL_HEADER],
            });

            expect(files).toHaveLength(1);
            expect(files[0].path).toBe('src/verticals/gym/ui/MembersCheckoutHeader.tsx');
            expect(files[0].skipIfExists).toBe(true);
        });

        it('assemble exclusivement des primitives PageShell + injecte resolveKicker (pas de mot dur)', () => {
            const [file] = renderVerticalHeaders({
                slug: 'gym',
                variant: 'gym',
                headers: [MINIMAL_HEADER],
            });

            expect(file.content).toContain("import { PageShell } from '@ui/PageShell';");
            expect(file.content).toContain("import { resolveKicker } from '@/shared/seeds/kickers';");
            expect(file.content).toContain('PageShell.OperationalHeader');
            expect(file.content).toContain('PageShell.EditorialTitle');
            expect(file.content).toContain('PageShell.Segmented');
            expect(file.content).toContain('PageShell.SegmentedItem');
            expect(file.content).toContain('PageShell.CTA');
            expect(file.content).toContain("resolveKicker('gym', 'commerce')");
            // La title reste dure côté blueprint (choix du designer), mais PAS le kicker.
            expect(file.content).not.toContain('kicker="Adhérents"');
        });

        it("dédoublonne les imports d'icônes lucide et les trie", () => {
            const [file] = renderVerticalHeaders({
                slug: 'gym',
                variant: 'gym',
                headers: [{
                    ...MINIMAL_HEADER,
                    icon: 'UserCheck',
                    segments: [{
                        name: 'view',
                        ariaLabel: 'Vue',
                        items: [
                            { value: 'day', label: 'Jour', icon: 'Calendar' },
                            { value: 'week', label: 'Semaine', icon: 'Calendar' },   // doublon volontaire
                        ],
                    }],
                    ctas: [{ name: 'onSave', label: 'Enregistrer', icon: 'UserCheck' }], // doublon
                }],
            });

            const importMatch = file.content.match(/import \{ ([^}]+) \} from 'lucide-react';/);
            expect(importMatch).toBeTruthy();
            const imports = importMatch![1].split(',').map((s) => s.trim());
            expect(imports).toEqual(['Calendar', 'UserCheck']); // trié + dédupliqué
        });

        it('génère une props interface typée avec unions littérales sur les segments', () => {
            const [file] = renderVerticalHeaders({
                slug: 'gym',
                variant: 'gym',
                headers: [MINIMAL_HEADER],
            });

            expect(file.content).toContain(`view: 'today' | 'month';`);
            expect(file.content).toContain(`setView: (v: 'today' | 'month') => void;`);
            expect(file.content).toContain('onCheckout: () => void;');
        });

        it('accepte un blueprint sans segments ni ctas (headers minimalistes)', () => {
            const [file] = renderVerticalHeaders({
                slug: 'coworking',
                variant: 'coworking',
                headers: [{
                    name: 'DeskViewHeader',
                    domain: 'facility',
                    title: 'Bureaux',
                }],
            });

            expect(file.content).toContain("resolveKicker('coworking', 'facility')");
            expect(file.content).toContain('DeskViewHeader');
            expect(file.content).toContain('interface DeskViewHeaderProps {');
            expect(file.content).toContain('}'); // interface fermée même vide
        });

        it('retourne un tableau vide si aucun header déclaré (verticale sans écran opérationnel custom)', () => {
            const files = renderVerticalHeaders({
                slug: 'custom',
                variant: 'custom',
                headers: [],
            });
            expect(files).toEqual([]);
        });
    });
});
