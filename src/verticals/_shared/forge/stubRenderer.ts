/**
 * 🧱 stubRenderer — Rendu des adapters, plugins, index, tokens, DNA et page-stubs d'une verticale.
 */

import {
    CAPABILITY_KEYS,
    type CapabilityKey,
} from '../catalog/CapabilityCatalog';
import { getProfile } from '../catalog/ProfileArchetype';
import {
    type VerticalBlueprint,
    type BlueprintEvent,
    deriveDependencies,
    resolveBlueprintCapabilities,
} from '../blueprint/VerticalBlueprint';
import type { GeneratedFile } from './types';
import { adapterPrefix, renderObjectLiteral } from './wiringPatcher';

export const FACTORY_PILLARS: Record<string, string> = {
    finance: 'makeFinanceAdapter',
    facility: 'makeFacilityAdapter',
    intelligence: 'makeIntelligenceAdapter',
    human: 'makeHumanAdapter',
    commerce: 'makeCommerceAdapter',
    compliance: 'makeComplianceAdapter',
    logistics: 'makeLogisticsAdapter',
};

export function pascalCase(s: string): string {
    return s.split(/[_-]/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

function eventMethodName(eventName: string): string {
    const last = eventName.split('.').pop() ?? eventName;
    return 'emit' + pascalCase(last);
}

function zeroValue(type: 'number' | 'boolean' | 'string'): string {
    return type === 'number' ? '0' : type === 'boolean' ? 'false' : "''";
}

/** Génère un fichier adapter par pilier (factory universelle + deltas d'events). */
export function renderAdapters(bp: VerticalBlueprint): GeneratedFile[] {
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

export function renderPlugin(bp: VerticalBlueprint): GeneratedFile {
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

export function renderIndex(bp: VerticalBlueprint, withAdapters: boolean): GeneratedFile {
    const lines = [`export { ${bp.className} } from './${bp.className}';`];
    if (withAdapters) lines.push(`export * from './adapters';`);
    return { path: `src/verticals/${bp.slug}/index.ts`, content: lines.join('\n') + '\n' };
}

export function renderTokens(bp: VerticalBlueprint): GeneratedFile {
    const content = `import type { BrandConfig } from '../brand';

export const ${bp.slug}DefaultTokens: Partial<BrandConfig> = ${renderObjectLiteral(bp.tokens.defaultTokens as Record<string, unknown>, '')};

export const ${bp.slug}DefaultAppearance = '${bp.tokens.appearance}' as const;

export const ${bp.slug}VerticalTokens: Record<string, string> = ${renderObjectLiteral(bp.tokens.verticalTokens, '')};
`;
    return { path: `src/shared/nexus/tokens/verticals/${bp.slug}.ts`, content };
}

export function renderDna(bp: VerticalBlueprint): GeneratedFile {
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

export function renderStubs(bp: VerticalBlueprint): GeneratedFile[] {
    return bp.routes.map(r => {
        const exp = r.componentExport ?? (r.componentPath.split('/').pop() ?? 'Page');
        const rel = r.componentPath.replace(/^\.\//, '');
        return {
            path: `src/verticals/${bp.slug}/${rel}.tsx`,
            skipIfExists: true,
            content: `'use client';

import { VerticalPageStub } from '@/verticals/_shared/VerticalPageStub';

export function ${exp}() {
  return <VerticalPageStub title="${r.label}" />;
}
`,
        };
    });
}
