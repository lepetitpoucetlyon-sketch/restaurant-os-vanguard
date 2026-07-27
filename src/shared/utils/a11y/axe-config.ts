export const AXE_CORE_CONFIG = {
    rules: {
        'color-contrast': { enabled: true },
        'label': { enabled: true },
        'button-name': { enabled: true },
        'image-alt': { enabled: true },
        'link-name': { enabled: true },
        'aria-roles': { enabled: true },
        'aria-required-attr': { enabled: true },
    } as Record<string, { enabled: boolean }>,
    criticalPaths: [
        '/pos',
        '/kds',
        '/reservations',
    ],
};

export async function runAxeAudit(container?: HTMLElement): Promise<unknown> {
    if (typeof window === 'undefined') return null;
    try {
        const axe = await import('axe-core');
        const results = await axe.default.run(container ?? document.body, {
            rules: AXE_CORE_CONFIG.rules,
        });
        return results;
    } catch {
        return null;
    }
}
