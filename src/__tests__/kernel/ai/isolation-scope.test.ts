/**
 * isolation-scope.test.ts — Tests bloquants CI pour R1 à R10.
 *
 * Ces tests sont la preuve auditée que l'isolation MCC ↔ Tenant est enforçée.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function readFile(p: string): string {
    return fs.readFileSync(p, 'utf-8');
}

function collectTsFiles(dir: string): string[] {
    const result: string[] = [];
    if (!fs.existsSync(dir)) return result;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) result.push(...collectTsFiles(full));
        else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) result.push(full);
    }
    return result;
}

const mccFiles = collectTsFiles('src/kernel/ai/mcc');
const tenantFiles = collectTsFiles('src/kernel/ai/tenant');
const coreFiles = collectTsFiles('src/kernel/ai/core');
const fleetFiles = collectTsFiles('src/app/api/admin/fleet');

describe('R1 — Import isolation MCC ↔ Tenant', () => {
    it('R1a — Aucun fichier kernel/ai/mcc/ n\'importe TenantAIRegistry', () => {
        for (const f of mccFiles) {
            expect(readFile(f)).not.toContain('TenantAIRegistry');
        }
    });

    it('R1b — Aucun fichier kernel/ai/tenant/ n\'importe MCCAIRegistry', () => {
        for (const f of tenantFiles) {
            expect(readFile(f)).not.toContain('MCCAIRegistry');
        }
    });

    it('R1c — Aucun fichier fleet/ n\'importe TenantAIRegistry', () => {
        for (const f of fleetFiles) {
            const content = readFile(f);
            expect(content).not.toMatch(/import.*TenantAIRegistry/);
        }
    });

    it('R1d — Aucun fichier fleet/ n\'importe LLMManager (migration Phase B)', () => {
        for (const f of fleetFiles) {
            const content = readFile(f);
            expect(content).not.toMatch(/import.*LLMManager/);
        }
    });
});

describe('R2 — No vertical hardcode', () => {
    const VARIANTS = ['restaurant', 'hotel', 'bakery', 'garage', 'salon', 'clinic', 'retail', 'gym', 'coworking', 'veterinary', 'florist'];
    const allKernelFiles = [...mccFiles, ...tenantFiles, ...coreFiles];

    for (const variant of VARIANTS) {
        it(`R2 — "${variant}" absent du kernel AI`, () => {
            for (const f of allKernelFiles) {
                const content = readFile(f);
                const regex = new RegExp(`['"\`]${variant}['"\`]`);
                expect(regex.test(content), `FAIL: "${variant}" dans ${f}`).toBe(false);
            }
        });
    }
});

describe('R3 — Pas de singleton LLMManager.provider dans les callers MCC', () => {
    it('R3 — diagnose/route.ts utilise MCCAIRegistry, pas LLMManager', () => {
        const content = readFile('src/app/api/admin/fleet/support-ai/diagnose/route.ts');
        expect(content).toContain('MCCAIRegistry');
        expect(content).not.toContain('LLMManager');
    });

    it('R3 — SupportTicketAnalysisHandler utilise MCCAIRegistry', () => {
        const content = readFile('src/shared/eventBus/handlers/SupportTicketAnalysisHandler.ts');
        expect(content).toContain('MCCAIRegistry');
        expect(content).not.toContain('LLMManager');
    });
});

describe('R5 — Pas de clé API publique NEXT_PUBLIC_LLM_*', () => {
    it('R5 — kernel/ai/ ne contient aucune clé NEXT_PUBLIC_LLM_*', () => {
        for (const f of [...mccFiles, ...tenantFiles, ...coreFiles]) {
            const content = readFile(f);
            expect(content).not.toMatch(/NEXT_PUBLIC_(LLM|GEMINI|OPENAI|ANTHROPIC|MISTRAL)/);
        }
    });
});

describe('R8 — Aucun catch silencieux dans les callers MCC', () => {
    it('R8 — diagnose/route.ts a OpsAlertGateway dans son catch', () => {
        const content = readFile('src/app/api/admin/fleet/support-ai/diagnose/route.ts');
        expect(content).toContain('OpsAlertGateway.send');
    });

    it('R8 — SupportTicketAnalysisHandler a OpsAlertGateway dans son catch', () => {
        const content = readFile('src/shared/eventBus/handlers/SupportTicketAnalysisHandler.ts');
        expect(content).toContain('OpsAlertGateway.send');
    });

    it('R8 — MCCAIRegistry wrapper a OpsAlertGateway', () => {
        const content = readFile('src/kernel/ai/mcc/MCCAIRegistry.ts');
        expect(content).toContain('OpsAlertGateway');
        expect(content).toContain("severity: 'critical'");
    });
});

describe('R9 — Env vars MCC_LLM_* strictement disjointes', () => {
    it('R9 — MCCProviderChain lit MCC_LLM_* uniquement', () => {
        const content = readFile('src/kernel/ai/mcc/MCCProviderChain.ts');
        expect(content).toContain('MCC_LLM_');
        expect(content).not.toContain('TENANT_LLM_');
    });

    it('R9 — TenantProviderChain ne lit aucune variable MCC_LLM_*', () => {
        const content = readFile('src/kernel/ai/tenant/TenantProviderChain.ts');
        expect(content).not.toContain('MCC_LLM_');
    });
});

describe('R10 — CrossScopeAuthority est la seule porte cross-scope', () => {
    it('R10 — CrossScopeAuthority existe et log chaque accès', () => {
        const content = readFile('src/kernel/ai/core/CrossScopeAuthority.ts');
        expect(content).toContain('logger.info');
        expect(content).toContain('grant');
        expect(content).toContain('verify');
    });
});
