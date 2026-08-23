/**
 * 🏭 generateVertical — le GÉNÉRATEUR (fonction pure) du Vertical Forge
 *
 * Transforme un VerticalBlueprint en arborescence de fichiers + patchs de câblage.
 * PUR (aucune I/O) → testable et déterministe : la CLI scripts/forge-vertical.ts
 * se contente d'écrire `files` sur le disque et d'appliquer/afficher `wiring`.
 *
 * Tiers de précision :
 *   L0 : plugin minimal + index + patchs de registry (fallback 'custom' actif).
 *   L1 : + adapters (via factories partagées) + tokens + DNA + pages-stubs + health ping.
 *   L2/L3 : choreography métier riche, StatCard custom, tests, hardware — hors périmètre
 *           du générateur de base (nourris par la substance / écrits à la main).
 *
 * Règle d'or : ne génère QUE la couche verticale fine + config. Ne touche JAMAIS
 * au noyau fiscal (NF525) ni à SovereignGuard.
 */

import {
    CAPABILITY_KEYS,
    requiredHardwareFor,
    type CapabilityKey,
} from '../catalog/CapabilityCatalog';
import { getProfile } from '../catalog/ProfileArchetype';
import {
    type VerticalBlueprint,
    type BlueprintEvent,
    deriveDependencies,
    precisionAtLeast,
    resolveBlueprintCapabilities,
} from '../blueprint/VerticalBlueprint';
import {
    renderKpiDashboard,
    renderWorkflowServices,
    renderRegulationGuards,
    renderHardwareProvisioning,
    renderVerticalTest,
} from './templates';

export interface GeneratedFile {
    /** Chemin relatif à la racine du repo. */
    path: string;
    content: string;
    /** Ne pas écraser si le fichier existe déjà (composants métier, seeds édités…). */
    skipIfExists?: boolean;
}

export interface WiringPatch {
    file: string;
    /** Ancre textuelle où insérer (ligne existante après laquelle insérer). */
    anchor: string;
    snippet: string;
    description: string;
}

export interface ForgeOutput {
    slug: string;
    files: GeneratedFile[];
    wiring: WiringPatch[];
    issues: string[];
}

export interface ForgeOptions {
    /** Émettre des pages-stubs pour les routes (défaut true). */
    emitStubs?: boolean;
}

/** Piliers dotés d'une factory universelle (ops en est exclu : events propres). */
const FACTORY_PILLARS: Record<string, string> = {
    finance: 'makeFinanceAdapter',
    facility: 'makeFacilityAdapter',
    intelligence: 'makeIntelligenceAdapter',
    human: 'makeHumanAdapter',
    commerce: 'makeCommerceAdapter',
    compliance: 'makeComplianceAdapter',
    logistics: 'makeLogisticsAdapter',
};

// ── Helpers de casing / rendu ───────────────────────────────────────────────────

function pascalCase(s: string): string {
    return s.split(/[_-]/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

/** Nom de méthode emit à partir d'un event : 'salon.appointment_completed' → 'emitAppointmentCompleted'. */
function eventMethodName(eventName: string): string {
    const last = eventName.split('.').pop() ?? eventName;
    return 'emit' + pascalCase(last);
}

function zeroValue(type: 'number' | 'boolean' | 'string'): string {
    return type === 'number' ? '0' : type === 'boolean' ? 'false' : "''";
}

function quoteKey(k: string): string {
    return /^[a-zA-Z_$][\w$]*$/.test(k) ? k : `'${k}'`;
}

function renderValue(v: unknown): string {
    if (typeof v === 'string') return `'${v.replace(/'/g, "\\'")}'`;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    return JSON.stringify(v);
}

function renderObjectLiteral(obj: Record<string, unknown>, indent: string): string {
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    const lines = entries.map(([k, v]) => `${indent}  ${quoteKey(k)}: ${renderValue(v)},`);
    return `{\n${lines.join('\n')}\n${indent}}`;
}

// ── Templates par fichier ───────────────────────────────────────────────────────

function adapterPrefix(bp: VerticalBlueprint): string {
    return bp.className.replace(/Vertical$/, '');
}

/** Génère un fichier adapter par pilier (factory universelle + deltas d'events). */
function renderAdapters(bp: VerticalBlueprint): GeneratedFile[] {
    const prefix = adapterPrefix(bp);
    const eventsByPillar = new Map<string, BlueprintEvent[]>();
    for (const ev of bp.events) {
        const list = eventsByPillar.get(ev.pillar) ?? [];
        list.push(ev);
        eventsByPillar.set(ev.pillar, list);
    }

    const pillars = new Set<string>(['mcc', ...Object.keys(FACTORY_PILLARS)]);
    for (const p of eventsByPillar.keys()) pillars.add(p);

    const files: GeneratedFile[] = [];
    const exportNames: string[] = [];

    for (const pillar of pillars) {
        const suffix = pascalCase(pillar);
        const exportName = `${prefix}${suffix}Adapter`;
        exportNames.push(exportName);
        const deltas = eventsByPillar.get(pillar) ?? [];
        const needsBus = deltas.length > 0;
        const factory = FACTORY_PILLARS[pillar];

        const imports: string[] = [];
        if (needsBus) imports.push(`import { NexusEventBus, type NexusEventPayload } from '@/shared/eventBus/NexusEventBus';`);
        if (pillar === 'mcc') imports.push(`import { makeMccAdapter } from '@/verticals/_shared/adapters';`);
        else if (factory) imports.push(`import { ${factory} } from '@/verticals/_shared/adapters';`);

        const deltaMethods = deltas.map(ev => {
            const emit = ev.durable ? 'emitDurable' : 'emit';
            return `  ${eventMethodName(ev.name)}(p: NexusEventPayload<'${ev.name}'>) {\n    NexusEventBus.${emit}('${ev.name}', p);\n  },`;
        });

        let body: string;
        if (pillar === 'mcc') {
            const metrics = Object.entries(bp.healthMetrics).map(([k, t]) => `${k}: ${t}`).join('; ');
            const generic = metrics ? `<{ ${metrics} }>` : '';
            body = deltas.length
                ? `export const ${exportName} = {\n  ...makeMccAdapter${generic}(),\n${deltaMethods.join('\n')}\n};`
                : `export const ${exportName} = makeMccAdapter${generic}();`;
        } else if (factory) {
            body = deltas.length
                ? `export const ${exportName} = {\n  ...${factory}(),\n${deltaMethods.join('\n')}\n};`
                : `export const ${exportName} = ${factory}();`;
        } else {
            // Pilier sans factory (ops) : uniquement les deltas.
            body = `export const ${exportName} = {\n${deltaMethods.join('\n')}\n};`;
        }

        files.push({
            path: `src/verticals/${bp.slug}/adapters/${exportName}.ts`,
            content: `${imports.join('\n')}\n\n${body}\n`,
        });
    }

    files.push({
        path: `src/verticals/${bp.slug}/adapters/index.ts`,
        content: exportNames.map(n => `export * from './${n}';`).join('\n') + '\n',
    });

    return files;
}

function renderPlugin(bp: VerticalBlueprint): GeneratedFile {
    const prefix = adapterPrefix(bp);
    const deps = deriveDependencies(bp).map(d => `'${d}'`).join(', ');
    const hasRoutes = bp.routes.length > 0;

    const routeLines = bp.routes.map(r => {
        const exp = r.componentExport ?? (r.componentPath.split('/').pop() ?? 'default');
        return `    context.registerRoute('${r.path}', React.lazy(() =>\n      import('${r.componentPath}').then(m => ({ default: m.${exp} }))));`;
    });

    const metricInit = Object.entries(bp.healthMetrics)
        .map(([k, t]) => `${k}: ${zeroValue(t)}`)
        .join(', ');
    const healthPayload = `{ tenantId, status: 'healthy'${metricInit ? ', ' + metricInit : ''} }`;

    const imports = [
        `import { IVerticalPlugin, ICoreContext } from '@/shared/plugins/IVerticalPlugin';`,
        `import { ${bp.slug}DefaultTokens, ${bp.slug}VerticalTokens } from '@/shared/nexus/tokens/verticals/${bp.slug}';`,
        hasRoutes ? `import React from 'react';` : '',
        `import { logger } from '@/lib/logger';`,
        `import { ${prefix}MccAdapter } from './adapters';`,
    ].filter(Boolean);

    const content = `${imports.join('\n')}

export class ${bp.className} implements IVerticalPlugin {
  public readonly id = '${bp.slug}';
  public readonly name = '${bp.meta.name}';
  public readonly version = '1.0.0';
  public readonly description = '${bp.meta.description.replace(/'/g, "\\'")}';
  public readonly dependencies = [${deps}];
  public readonly defaultTheme = ${bp.slug}DefaultTokens;
  public readonly verticalTokens = ${bp.slug}VerticalTokens;

  public async initialize(context: ICoreContext): Promise<void> {
    logger.info(\`[\${this.id}] Initialisation verticale ${bp.slug}…\`);
${routeLines.length ? routeLines.join('\n') + '\n' : ''}
    // MCC — health ping au démarrage tenant (métriques à zéro, alimentées au runtime).
    context.registerEventHandler<{ tenantId: string }>(
      'tenant.ready',
      ({ tenantId }) => {
        ${prefix}MccAdapter.emitHealthPing(${healthPayload});
      },
    );

    logger.info(\`[\${this.id}] Verticale ${bp.slug} active — \${context.getRegisteredRoutes().length} routes\`);
  }

  public async destroy(): Promise<void> {
    logger.info(\`[\${this.id}] Arrêt de la verticale ${bp.slug}.\`);
  }
}
`;
    return { path: `src/verticals/${bp.slug}/${bp.className}.ts`, content };
}

function renderIndex(bp: VerticalBlueprint, withAdapters: boolean): GeneratedFile {
    const lines = [`export { ${bp.className} } from './${bp.className}';`];
    if (withAdapters) lines.push(`export * from './adapters';`);
    return { path: `src/verticals/${bp.slug}/index.ts`, content: lines.join('\n') + '\n' };
}

function renderTokens(bp: VerticalBlueprint): GeneratedFile {
    const content = `import type { BrandConfig } from '../brand';

export const ${bp.slug}DefaultTokens: Partial<BrandConfig> = ${renderObjectLiteral(bp.tokens.defaultTokens as Record<string, unknown>, '')};

export const ${bp.slug}DefaultAppearance = '${bp.tokens.appearance}' as const;

export const ${bp.slug}VerticalTokens: Record<string, string> = ${renderObjectLiteral(bp.tokens.verticalTokens, '')};
`;
    return { path: `src/shared/nexus/tokens/verticals/${bp.slug}.ts`, content };
}

function renderDna(bp: VerticalBlueprint): GeneratedFile {
    const caps = resolveBlueprintCapabilities(bp);
    const profile = getProfile(bp.profile);
    const capLines = CAPABILITY_KEYS.map(k => `    '${k}': ${caps[k] === true},`).join('\n');
    const on = (k: CapabilityKey) => caps[k] === true;

    const businessLaws: Record<string, unknown> = {
        node_capacity: bp.dnaOverrides?.businessLaws?.node_capacity ?? 50,
        fiscal_coefficient: 1.0,
        currency: 'EUR',
        pmsEnabled: on('mod_pms'),
        usesCulinaryStock: profile.usesCulinaryStock,
        tax_rate: 20.0,
        ...(bp.dnaOverrides?.businessLaws ?? {}),
    };

    const constName = `${bp.slug.toUpperCase()}_FULL_DNA`;
    const content = `import { TenantConfig } from "@shared/nexus-contract";

export const ${constName}: TenantConfig = {
  id: '${bp.slug}_golden_seed_complete',
  tier: 'CLIENT' as const,
  variant: '${bp.slug}',
  capabilities: {
${capLines}
  },
  features: {
    pos: ${on('mod_pos')},
    kds: ${on('mod_kds')},
    inventory: ${on('mod_inventory')},
    hr: ${on('mod_hr')},
    reservations: ${on('mod_reservations')},
    finance: ${on('mod_treasury') || on('mod_accounting_management')},
    marketing: ${on('mod_marketing')},
  },
  theme: {
    primaryColor: '${bp.tokens.defaultTokens.primaryColor ?? '#3B82F6'}',
    secondaryColor: '${bp.tokens.defaultTokens.accentColor ?? '#1D4ED8'}',
    logoUrl: '/default-${bp.slug}-logo.svg',
    borderRadius: '16px',
    appearance: '${bp.tokens.appearance}',
  },
  status: {
    maintenanceMode: false,
    killSwitch: false,
    licenceStatus: 'ACTIVE',
    lastSignalId: '${bp.slug.toUpperCase()}_SEED_V1_INIT',
    updatedAt: Date.now(),
    layoutType: '${bp.dnaOverrides?.layoutType ?? 'sidebar'}',
    businessLaws: ${renderObjectLiteral(businessLaws, '    ')},
    economy: {
      basePrice: ${bp.dnaOverrides?.basePrice ?? 0},
      discountMultiplier: 1.0,
      billingStatus: 'ACTIVE',
      currency: 'EUR',
    },
  },
  metadata: {
    name: '${bp.dnaOverrides?.metadataName ?? bp.meta.name}',
    version: '1.0.0-${bp.slug}',
    ownerId: 'suzerain_root',
    createdAt: Date.now(),
  },
};
`;
    return { path: `src/shared/seeds/${bp.slug}-full-dna.ts`, content };
}

function renderStubs(bp: VerticalBlueprint): GeneratedFile[] {
    return bp.routes.map(r => {
        const exp = r.componentExport ?? (r.componentPath.split('/').pop() ?? 'Page');
        const rel = r.componentPath.replace(/^\.\//, '');
        return {
            path: `src/verticals/${bp.slug}/${rel}.tsx`,
            skipIfExists: true, // ne jamais écraser un composant métier réel
            content: `'use client';

import { VerticalPageStub } from '@/verticals/_shared/VerticalPageStub';

export function ${exp}() {
  return <VerticalPageStub title="${r.label}" />;
}
`,
        };
    });
}

// ── Câblage (patchs des ancres existantes) ──────────────────────────────────────

function renderWiring(bp: VerticalBlueprint): WiringPatch[] {
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

// ── Orchestrateur ────────────────────────────────────────────────────────────────

/**
 * Génère l'arborescence d'une verticale à partir de son Blueprint.
 * @returns fichiers à écrire + patchs de câblage + problèmes de validation.
 */
export function generateVertical(bp: VerticalBlueprint, opts: ForgeOptions = {}): ForgeOutput {
    const emitStubs = opts.emitStubs ?? true;
    const files: GeneratedFile[] = [];
    const issues: string[] = [];

    // Cohérence hardware : le blueprint déclare-t-il tout le matériel impliqué ?
    const active = (Object.keys(resolveBlueprintCapabilities(bp)) as CapabilityKey[])
        .filter(k => resolveBlueprintCapabilities(bp)[k]);
    const impliedHw = requiredHardwareFor(active);
    for (const hw of impliedHw) {
        if (!bp.hardware.includes(hw)) {
            issues.push(`hardware impliqué par les capabilities mais absent du blueprint : ${hw}`);
        }
    }

    const withAdapters = precisionAtLeast(bp.precision, 'L1');
    const withSubstance = precisionAtLeast(bp.precision, 'L2');
    const withHardwareAndTests = precisionAtLeast(bp.precision, 'L3');

    // Toujours : plugin + index (L0).
    if (withAdapters) files.push(...renderAdapters(bp));
    files.push(renderPlugin(bp));
    files.push(renderIndex(bp, withAdapters));

    // L1 : tokens + DNA + stubs de route.
    if (withAdapters) {
        files.push(renderTokens(bp));
        files.push({ ...renderDna(bp), skipIfExists: true });
        if (emitStubs) files.push(...renderStubs(bp));
    }

    // L2+ : émettre la richesse depuis SectorStudy.substance (templates §C.5 P3).
    if (withSubstance && bp.substance) {
        files.push(...renderKpiDashboard({ slug: bp.slug, className: bp.className, kpis: bp.substance.kpis, subVariant: bp.substance.subVariant }));
        files.push(...renderWorkflowServices({ slug: bp.slug, className: bp.className, workflows: bp.substance.workflows }));
        files.push(...renderRegulationGuards({ slug: bp.slug, className: bp.className, regulations: bp.substance.regulations }));
    }

    // L3 : hardware provisioning + tests smoke auto-générés.
    if (withHardwareAndTests && bp.substance) {
        files.push(...renderHardwareProvisioning({ slug: bp.slug, className: bp.className, hardware: bp.substance.hardware }));
        files.push(...renderVerticalTest({
            slug: bp.slug,
            className: bp.className,
            routes: bp.routes.map(r => ({ path: r.path, componentPath: r.componentPath, componentExport: r.componentExport })),
            capabilities: (Object.keys(resolveBlueprintCapabilities(bp)) as CapabilityKey[]).filter(k => resolveBlueprintCapabilities(bp)[k] === true),
        }));
    }

    return { slug: bp.slug, files, wiring: renderWiring(bp), issues };
}
