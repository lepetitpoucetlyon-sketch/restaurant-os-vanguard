import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock logger to prevent console noise
vi.mock('@/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock OpsAlertGateway
vi.mock('@/lib/adapters/OpsAlertGateway', () => ({
    OpsAlertGateway: {
        send: vi.fn().mockResolvedValue(true),
    },
}));

// Mock Nexus adapter
vi.mock('@/lib/nexus/NexusAdapter', () => ({
    Nexus: {
        adapter: {
            get: vi.fn().mockResolvedValue(null),
            set: vi.fn().mockResolvedValue(undefined),
        },
    },
}));

/**
 * Recursively collect all .ts files under a directory.
 */
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

describe('MCCAIRegistry — Isolation Tests', () => {
    const savedEnv = { ...process.env };

    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        process.env = { ...savedEnv };
    });

    // ── R1 : Import isolation ──────────────────────────────────

    it('R1 — MCCAIRegistry ne contient aucun import @/modules/ hors intelligence/ia/ai', () => {
        const content = fs.readFileSync(
            'src/kernel/ai/mcc/MCCAIRegistry.ts',
            'utf-8',
        );

        const lines = content.split('\n');
        const illegalImports = lines.filter(
            line =>
                line.includes("from '@/modules/") &&
                !line.includes("from '@/modules/intelligence"),
        );

        expect(illegalImports).toHaveLength(0);
    });

    it('R1 — MCCProviderChain ne contient aucun import module tenant', () => {
        const content = fs.readFileSync(
            'src/kernel/ai/mcc/MCCProviderChain.ts',
            'utf-8',
        );
        const lines = content.split('\n');
        const illegalImports = lines.filter(
            line =>
                line.includes("from '@/modules/") &&
                !line.includes("from '@/modules/intelligence"),
        );
        expect(illegalImports).toHaveLength(0);
    });

    // ── R2 : No vertical hardcode ──────────────────────────────

    it('R2 — Aucun fichier kernel/ai/ ne contient un nom de vertical hardcodé', () => {
        const PLATFORM_VARIANTS = [
            'restaurant', 'hotel', 'bakery', 'garage', 'salon',
            'clinic', 'retail', 'gym', 'coworking', 'veterinary', 'florist',
        ];

        const files = collectTsFiles('src/kernel/ai');

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf-8');
            for (const variant of PLATFORM_VARIANTS) {
                const regex = new RegExp(`['"\`]${variant}['"\`]`);
                expect(
                    regex.test(content),
                    `VIOLATION R2 : "${variant}" hardcodé dans ${file}`,
                ).toBe(false);
            }
        }
    });

    // ── R5 : No public env vars ──────────────────────────────

    it('R5 — Aucun fichier kernel/ai/ ne référence NEXT_PUBLIC_LLM_*', () => {
        const files = collectTsFiles('src/kernel/ai');
        for (const file of files) {
            const content = fs.readFileSync(file, 'utf-8');
            expect(
                /NEXT_PUBLIC_(LLM|GEMINI|OPENAI|ANTHROPIC|MISTRAL)/.test(content),
                `VIOLATION R5 : clé publique dans ${file}`,
            ).toBe(false);
        }
    });

    // ── R8 : Provider fail → alerte, jamais silencieux ──────

    it('R8 — MCCAIRegistry catch contient OpsAlertGateway', () => {
        const content = fs.readFileSync(
            'src/kernel/ai/mcc/MCCAIRegistry.ts',
            'utf-8',
        );

        expect(content).toContain('OpsAlertGateway');
        expect(content).toContain("severity: 'critical'");
    });

    // ── R9 : MCC env vars ≠ tenant env vars ──────────────────

    it('R9 — Les env vars MCC_LLM_* ne croisent pas TENANT_LLM_*', () => {
        const mccEnvPattern = /^MCC_LLM_/;
        const tenantEnvPattern = /^TENANT_LLM_/;

        const envKeys = Object.keys(process.env);
        const crossContamination = envKeys.filter(
            k => mccEnvPattern.test(k) && tenantEnvPattern.test(k),
        );
        expect(crossContamination).toHaveLength(0);
    });

    // ── Provider resolution ──────────────────────────────────

    it('MCCProviderChain parse correctement MCC_LLM_FALLBACK_CHAIN', async () => {
        process.env.MCC_LLM_FALLBACK_CHAIN = 'sovereign,anthropic,gemini';
        process.env.MCC_LLM_ANTHROPIC_API_KEY = 'sk-test';

        const { MCCProviderChain } = await import('@/kernel/ai/mcc/MCCProviderChain');
        const chain = new MCCProviderChain();

        expect(chain.providers).toEqual(['sovereign', 'anthropic', 'gemini']);
    });

    it('MCCProviderChain fallback par défaut si env vide', async () => {
        delete process.env.MCC_LLM_FALLBACK_CHAIN;

        const { MCCProviderChain } = await import('@/kernel/ai/mcc/MCCProviderChain');
        const chain = new MCCProviderChain();

        expect(chain.providers).toEqual(['sovereign', 'anthropic']);
    });

    it('MCCProviderChain.resolve() throw si aucun provider configuré', async () => {
        delete process.env.MCC_LLM_FALLBACK_CHAIN;
        delete process.env.SOVEREIGN_SLM_URL;
        delete process.env.VLLM_BASE_URL;
        delete process.env.ANTHROPIC_API_KEY;
        delete process.env.GEMINI_API_KEY;
        delete process.env.GOOGLE_GEMINI_API_KEY;
        delete process.env.OPENAI_API_KEY;
        delete process.env.MISTRAL_API_KEY;
        delete process.env.MCC_LLM_SOVEREIGN_URL;
        delete process.env.MCC_LLM_ANTHROPIC_API_KEY;
        delete process.env.MCC_LLM_GEMINI_API_KEY;
        delete process.env.MCC_LLM_OPENAI_API_KEY;
        delete process.env.MCC_LLM_MISTRAL_API_KEY;
        delete process.env.MCC_LLM_OLLAMA_URL;
        delete process.env.OLLAMA_BASE_URL;

        const { MCCProviderChain } = await import('@/kernel/ai/mcc/MCCProviderChain');
        const chain = new MCCProviderChain();

        expect(() => chain.resolve()).toThrow(/AUCUN provider MCC disponible/);
    });
});
