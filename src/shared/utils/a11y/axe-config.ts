import type { AxeResults, RunOptions, RuleObject } from 'axe-core';

export const AXE_CORE_CONFIG = {
    rules: {
        'color-contrast': { enabled: true },
        'label': { enabled: true },
        'button-name': { enabled: true },
        'image-alt': { enabled: true },
        'link-name': { enabled: true },
        'aria-roles': { enabled: true },
        'aria-required-attr': { enabled: true },
    } as RuleObject,
    criticalPaths: [
        '/pos',
        '/kds',
        '/reservations',
    ],
};

export async function runAxeAudit(container?: HTMLElement): Promise<AxeResults | null> {
    if (typeof window === 'undefined') return null;
    const axeModule = await import('axe-core');
    const axe = (axeModule.default || axeModule) as typeof import('axe-core');
    const target = container ?? document.body;
    const options: RunOptions = {
        rules: AXE_CORE_CONFIG.rules,
    };
    return axe.run(target, options);
}

