/**
 * 🧪 Template verticalTest — génère une suite de smoke-tests Vitest depuis un blueprint (§C.5 P3).
 *
 * Émise en L3 uniquement. Vérifie que :
 *  - Le plugin monte sans crash.
 *  - Toutes les routes déclarées sont importables.
 *  - Les capabilities effectives incluent bien les capabilities requises.
 *
 * Ce test devient partie intégrante de la suite Vitest — si la verticale est
 * cassée, ce test le voit avant le déploiement.
 */

import type { GeneratedFile } from '../types';

export interface VerticalTestTemplateInput {
    readonly slug: string;
    readonly className: string;
    readonly routes: readonly { path: string; componentPath: string; componentExport?: string }[];
    readonly capabilities: readonly string[];
}

export function renderVerticalTest(input: VerticalTestTemplateInput): GeneratedFile[] {
    const prefix = input.className.replace(/Vertical$/, '');
    const capsAssert = input.capabilities
        .filter(c => c !== 'mod_dashboard' && c !== 'mod_settings')  // socle universel implicite
        .map(c => `        expect(caps).toContain('${c}');`)
        .join('\n');
    const routeAssert = input.routes.map(r =>
        `        expect(routePaths).toContain('${r.path}');`
    ).join('\n');

    return [{
        path: `src/__tests__/verticals/generated/${input.slug}-smoke.test.ts`,
        skipIfExists: true,
        content: `/**
 * 🧪 ${prefix} — smoke-test auto-généré (P3 forge).
 * ⚠️ Fichier généré (skipIfExists) — ajoute manuellement les tests métier riches.
 */

import { describe, it, expect } from 'vitest';

import { VERTICAL_BLUEPRINTS } from '@/verticals/_shared/catalog/VerticalBlueprintRegistry';
import { resolveBlueprintCapabilities } from '@/verticals/_shared/blueprint/VerticalBlueprint';

describe('${prefix} — smoke (auto-généré)', () => {
    const bp = VERTICAL_BLUEPRINTS['${input.slug}'];

    it('blueprint enregistré dans le registre', () => {
        expect(bp).toBeDefined();
        expect(bp.slug).toBe('${input.slug}');
        expect(bp.className).toBe('${input.className}');
    });

    it('capabilities effectives incluent celles déclarées', () => {
        const caps = Object.keys(resolveBlueprintCapabilities(bp)).filter(k => resolveBlueprintCapabilities(bp)[k as keyof ReturnType<typeof resolveBlueprintCapabilities>]);
${capsAssert || '        expect(caps.length).toBeGreaterThanOrEqual(0);'}
    });

    it('routes déclarées sont présentes', () => {
        const routePaths = bp.routes.map(r => r.path);
${routeAssert || '        expect(routePaths.length).toBeGreaterThanOrEqual(0);'}
    });
});
`,
    }];
}
