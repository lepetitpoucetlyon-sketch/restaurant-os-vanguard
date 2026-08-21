/**
 * no-vertical-hardcode.test.ts — Tests bloquants CI (R2).
 *
 * Vérifie qu'AUCUN fichier du kernel AI ne contient un nom de vertical
 * hardcodé. La personnalisation verticale passe UNIQUEMENT par les blueprints.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PLATFORM_VARIANTS = [
    'restaurant', 'hotel', 'bakery', 'garage', 'salon',
    'clinic', 'retail', 'gym', 'coworking', 'veterinary', 'florist',
];

function collectTsFiles(dir: string): string[] {
    const result: string[] = [];
    if (!fs.existsSync(dir)) return result;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            result.push(...collectTsFiles(full));
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            result.push(full);
        }
    }
    return result;
}

describe('R2 — No vertical hardcode in kernel', () => {
    const kernelFiles = collectTsFiles('src/kernel/ai');
    const coreFiles = ['src/infrastructure/bootstrapProviders.ts'];
    const allFiles = [...kernelFiles, ...coreFiles].filter(f => fs.existsSync(f));

    it('Liste les fichiers testés (pour audit)', () => {
        expect(allFiles.length).toBeGreaterThan(5); // Au moins les fichiers kernel
    });

    for (const variant of PLATFORM_VARIANTS) {
        it(`Aucun fichier kernel/ai/ ne contient "${variant}" hardcodé`, () => {
            for (const file of kernelFiles) {
                const content = fs.readFileSync(file, 'utf-8');
                const regex = new RegExp(`['"\`]${variant}['"\`]`);
                expect(
                    regex.test(content),
                    `VIOLATION R2 : "${variant}" hardcodé dans ${file}`,
                ).toBe(false);
            }
        });
    }

    it('R2 — PromptComposer ne contient aucun switch/case sur vertical', () => {
        const content = fs.readFileSync('src/kernel/ai/core/PromptComposer.ts', 'utf-8');
        expect(content).not.toMatch(/switch\s*\(\s*(vertical|variant|sector)/);
        expect(content).not.toMatch(/case\s*['"]restaurant['"]/);
    });

    it('R2 — MCC_SYSTEM_PROMPTS ne contient aucun vertical specifique', () => {
        const content = fs.readFileSync('src/kernel/ai/mcc/MCC_SYSTEM_PROMPTS.ts', 'utf-8');
        for (const variant of PLATFORM_VARIANTS) {
            const regex = new RegExp(`['"\`]${variant}['"\`]`);
            expect(regex.test(content), `"${variant}" hardcodé dans MCC_SYSTEM_PROMPTS`).toBe(false);
        }
    });

    it('R2 — TENANT_SYSTEM_PROMPTS ne contient aucun vertical specifique', () => {
        const content = fs.readFileSync('src/kernel/ai/tenant/TENANT_SYSTEM_PROMPTS.ts', 'utf-8');
        for (const variant of PLATFORM_VARIANTS) {
            const regex = new RegExp(`['"\`]${variant}['"\`]`);
            expect(regex.test(content), `"${variant}" hardcodé dans TENANT_SYSTEM_PROMPTS`).toBe(false);
        }
    });

    it('R2 — MCCAIRegistry ne contient aucun vertical spécifique', () => {
        const content = fs.readFileSync('src/kernel/ai/mcc/MCCAIRegistry.ts', 'utf-8');
        for (const variant of PLATFORM_VARIANTS) {
            const regex = new RegExp(`['"\`]${variant}['"\`]`);
            expect(regex.test(content), `"${variant}" hardcodé dans MCCAIRegistry`).toBe(false);
        }
    });

    it('R2 — TenantAIRegistry ne contient aucun vertical spécifique (hors import dynamique)', () => {
        const content = fs.readFileSync('src/kernel/ai/tenant/TenantAIRegistry.ts', 'utf-8');
        // Seul l'import dynamique `@/verticals/${tenantConfig.variant}/` est autorisé
        for (const variant of PLATFORM_VARIANTS) {
            const regex = new RegExp(`['"\`]${variant}['"\`]`);
            expect(regex.test(content), `"${variant}" hardcodé en dur dans TenantAIRegistry`).toBe(false);
        }
    });

    it('R2 — AIScopeGuard ne contient aucun vertical spécifique', () => {
        const content = fs.readFileSync('src/kernel/ai/core/AIScopeGuard.ts', 'utf-8');
        for (const variant of PLATFORM_VARIANTS) {
            const regex = new RegExp(`['"\`]${variant}['"\`]`);
            expect(regex.test(content), `"${variant}" hardcodé dans AIScopeGuard`).toBe(false);
        }
    });
});
