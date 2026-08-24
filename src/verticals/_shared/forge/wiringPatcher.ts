/**
 * 🔌 wiringPatcher — Génération des patchs de câblage pour les ancres de la plateforme.
 */

import type { VerticalBlueprint } from '../blueprint/VerticalBlueprint';
import type { WiringPatch } from './types';

export function adapterPrefix(bp: VerticalBlueprint): string {
    return bp.className.replace(/Vertical$/, '');
}

function quoteKey(k: string): string {
    return /^[a-zA-Z_$][\w$]*$/.test(k) ? k : `'${k}'`;
}

function renderValue(v: unknown): string {
    if (typeof v === 'string') return `'${v.replace(/'/g, "\\'")}'`;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    return JSON.stringify(v);
}

export function renderObjectLiteral(obj: Record<string, unknown>, indent = '    '): string {
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    const lines = entries.map(([k, v]) => `${indent}  ${quoteKey(k)}: ${renderValue(v)},`);
    return `{\n${lines.join('\n')}\n${indent}}`;
}

export function renderWiring(bp: VerticalBlueprint): WiringPatch[] {
    const prefix = adapterPrefix(bp);
    const patches: WiringPatch[] = [
        {
            file: 'src/shared/plugins/VerticalRegistry.ts',
            anchor: "import('@/verticals/custom')",
            snippet: `import('@/verticals/${bp.slug}').then(m => VerticalRegistry.register('${bp.slug}', () => new m.${bp.className}())).catch(() => {});`,
            description: 'Auto-enregistrement du plugin de verticale (lazy import).',
        },
        {
            file: 'src/modules/system/domain/schemas/tenant.ts',
            anchor: "'custom',",
            snippet: `    '${bp.slug}',`,
            description: `Ajout de '${bp.slug}' à PLATFORM_VARIANTS (+ entrée VERTICAL_META : { emoji: '${bp.meta.emoji}', label: '${bp.meta.label}' }).`,
        },
        {
            file: 'src/lib/mcc/SystemTenantRegistry.ts',
            anchor: "custom:",
            snippet: `    ${bp.slug}: { DEMO: '_demo_${bp.slug}', TEST: '_test_${bp.slug}', REFERENCE: '_ref_${bp.slug}' },`,
            description: 'Triplet de tenants système (+ DEMO_SUBDOMAIN_MAP).',
        },
        {
            file: 'src/shared/seeds/index.ts',
            anchor: 'CLINIC_FULL_DNA',
            snippet: `import { ${bp.slug.toUpperCase()}_FULL_DNA } from './${bp.slug}-full-dna';\n// + ${bp.slug}: ${bp.slug.toUpperCase()}_FULL_DNA dans DNA_REGISTRY + ré-export`,
            description: 'Enregistrement du DNA dans DNA_REGISTRY (resolveDNA).',
        },
        {
            file: 'src/shared/nexus/tokens/verticals/index.ts',
            anchor: 'VERTICAL_DEFAULT_TOKENS',
            snippet: `${bp.slug}: ${bp.slug}DefaultTokens  (VERTICAL_DEFAULT_TOKENS) · ${bp.slug}DefaultAppearance (VERTICAL_APPEARANCE) · ${bp.slug}VerticalTokens (VERTICAL_EXTRA_TOKENS)`,
            description: 'Trois Records exhaustifs de tokens à compléter.',
        },
        {
            file: 'src/shared/eventBus/handlers/support/verticalSupportContexts.ts',
            anchor: 'VERTICAL_SUPPORT_CONTEXTS',
            snippet: `${bp.slug}: { /* contexte SAV IA du secteur ${bp.meta.label} */ }`,
            description: 'Contexte de support IA de la verticale.',
        },
        {
            file: 'src/shared/components/settings/FontPicker.tsx',
            anchor: 'BRAND_FONT_OPTIONS',
            snippet: `${bp.slug}: [ /* options de police proposées */ ]`,
            description: 'Options de police de marque.',
        },
        {
            file: 'src/shared/nexus/tokens/verticals/presets.ts',
            anchor: 'VERTICAL_STYLE_PRESETS',
            snippet: `${bp.slug}: [ /* presets de style */ ]`,
            description: 'Presets de style de la verticale.',
        },
    ];
    if (Object.keys(bp.healthMetrics).length) {
        patches.push({
            file: `src/verticals/${bp.slug}/${bp.className}.ts`,
            anchor: 'emitHealthPing',
            snippet: `${prefix}MccAdapter — métriques santé : ${Object.keys(bp.healthMetrics).join(', ')}`,
            description: 'Rappel : brancher les vraies métriques du health ping au runtime.',
        });
    }
    return patches;
}
