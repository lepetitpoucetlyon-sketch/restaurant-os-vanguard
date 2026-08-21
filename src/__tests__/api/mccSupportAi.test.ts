import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';

// Mock logger
vi.mock('@/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock OpsAlertGateway
vi.mock('@/lib/adapters/OpsAlertGateway', () => ({
    OpsAlertGateway: { send: vi.fn().mockResolvedValue(true) },
}));

// Mock Nexus
vi.mock('@/lib/nexus/NexusAdapter', () => ({
    Nexus: {
        adapter: {
            get: vi.fn().mockResolvedValue(null),
            set: vi.fn().mockResolvedValue(undefined),
        },
    },
}));

describe('MCC Support AI — Integration Checks', () => {
    // ── Code-level migration checks ────────────────────────────

    it('diagnose/route.ts utilise MCCAIRegistry (pas LLMManager)', () => {
        const content = fs.readFileSync(
            'src/app/api/admin/fleet/support-ai/diagnose/route.ts',
            'utf-8',
        );
        expect(content).toContain('MCCAIRegistry');
        expect(content).not.toContain('LLMManager');
        expect(content).not.toContain('AIProviderRouter');
    });

    it('diagnose/route.ts contient OpsAlertGateway pour R8', () => {
        const content = fs.readFileSync(
            'src/app/api/admin/fleet/support-ai/diagnose/route.ts',
            'utf-8',
        );
        expect(content).toContain('OpsAlertGateway.send');
        expect(content).toContain("severity: 'critical'");
    });

    it('SupportTicketAnalysisHandler utilise MCCAIRegistry (pas LLMManager)', () => {
        const content = fs.readFileSync(
            'src/shared/eventBus/handlers/SupportTicketAnalysisHandler.ts',
            'utf-8',
        );
        expect(content).toContain('MCCAIRegistry');
        expect(content).not.toContain('LLMManager');
        expect(content).not.toContain('AIProviderRouter');
    });

    it('SupportTicketAnalysisHandler contient OpsAlertGateway pour R8', () => {
        const content = fs.readFileSync(
            'src/shared/eventBus/handlers/SupportTicketAnalysisHandler.ts',
            'utf-8',
        );
        expect(content).toContain('OpsAlertGateway.send');
        expect(content).toContain("severity: 'critical'");
    });

    it('SupportTicketAnalysisHandler utilise le provider name dynamique dans changelog', () => {
        const content = fs.readFileSync(
            'src/shared/eventBus/handlers/SupportTicketAnalysisHandler.ts',
            'utf-8',
        );
        // Plus de 'ai-agent:gemini' hardcodé
        expect(content).not.toContain("'ai-agent:gemini'");
        expect(content).toContain('MCCAIRegistry.activeProviderName');
    });

    it('SupportAIPanel ne contient plus "Gemini Flash" hardcodé', () => {
        const content = fs.readFileSync(
            'src/app/(admin)/admin/mcc/components/SupportAIPanel.tsx',
            'utf-8',
        );
        expect(content).not.toContain('Gemini Flash');
        expect(content).toContain('providerLabel');
        expect(content).toContain('provider-info');
    });

    it('provider-info/route.ts existe et utilise MCCAIRegistry', () => {
        const content = fs.readFileSync(
            'src/app/api/admin/fleet/support-ai/provider-info/route.ts',
            'utf-8',
        );
        expect(content).toContain('MCCAIRegistry');
        expect(content).toContain('activeProviderName');
        expect(content).toContain('activeModel');
    });

    // ── Aucun caller MCC ne garde LLMManager ──────────────────

    it('ZERO fichier dans fleet/ utilise encore LLMManager', () => {
        const fleetDir = 'src/app/api/admin/fleet';
        const checkDir = (dir: string): void => {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = `${dir}/${entry.name}`;
                if (entry.isDirectory()) {
                    checkDir(full);
                } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
                    const content = fs.readFileSync(full, 'utf-8');
                    expect(content).not.toMatch(
                        /import.*LLMManager|import.*AIProviderRouter/,
                    );
                }
            }
        };
        checkDir(fleetDir);
    });
});
