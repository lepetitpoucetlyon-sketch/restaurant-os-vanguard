/**
 * ⚙️ Template workflowService — génère un service métier depuis un WorkflowSpec (§C.5 P3).
 *
 * Entrée : `SectorStudy.workflows[]` + slug verticale.
 * Sortie : `domain/<Slug><WorkflowId>Service.ts` par workflow (un fichier par flux).
 *
 * Le service expose une méthode `execute()` orchestrant les capabilities impliquées
 * et émettant les events déclarés (via NexusEventBus).
 */

import type { GeneratedFile } from '../types';
import type { WorkflowSpec } from '../../blueprint/SectorStudy';

export interface WorkflowServiceTemplateInput {
    readonly slug: string;
    readonly className: string;
    readonly workflows: readonly WorkflowSpec[];
}

export function renderWorkflowServices(input: WorkflowServiceTemplateInput): GeneratedFile[] {
    if (!input.workflows.length) return [];
    const prefix = input.className.replace(/Vertical$/, '');
    return input.workflows.map(wf => ({
        path: `src/verticals/${input.slug}/domain/${prefix}${pascalCase(wf.id)}Service.ts`,
        skipIfExists: true,
        content: renderWorkflowServiceTs(prefix, wf),
    }));
}

function renderWorkflowServiceTs(prefix: string, wf: WorkflowSpec): string {
    const capList = wf.capabilities.map(c => `'${c}'`).join(', ') || '/* aucune */';
    const emitBlock = (wf.emits ?? []).map(e =>
        `    NexusEventBus.emit('${e}', { at: new Date().toISOString(), ...ctx });`
    ).join('\n') || '    // aucun event à émettre';

    return `/**
 * ${prefix}${pascalCase(wf.id)}Service — workflow "${wf.label}" (${wf.id}).
 * ${escapeMultiline(wf.description)}
 *
 * Capabilities impliquées : ${wf.capabilities.length ? wf.capabilities.join(', ') : '(aucune)'}.
 * Events émis : ${(wf.emits ?? []).join(', ') || '(aucun)'}
 *
 * ⚠️ Fichier généré (skipIfExists) — brancher la logique métier réelle.
 */

import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';

export interface ${prefix}${pascalCase(wf.id)}Context {
  readonly tenantId: string;
  readonly [key: string]: unknown;
}

export interface ${prefix}${pascalCase(wf.id)}Result {
  readonly ok: boolean;
  readonly workflowId: '${wf.id}';
  readonly capabilities: readonly string[];
}

export const ${prefix}${pascalCase(wf.id)}Service = {
  /** Capabilities requises pour exécuter ce workflow. */
  readonly requiredCapabilities: [${capList}] as const,

  async execute(ctx: ${prefix}${pascalCase(wf.id)}Context): Promise<${prefix}${pascalCase(wf.id)}Result> {
    logger.info('[${prefix}${pascalCase(wf.id)}Service] execute', { tenantId: ctx.tenantId });
    // TODO : orchestrer les capabilities [${capList}] selon la logique métier.
${emitBlock}
    return { ok: true, workflowId: '${wf.id}', capabilities: [${capList}] as const };
  },
} as const;
`;
}

function pascalCase(s: string): string {
    return s.split(/[-_\s]/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

function escapeMultiline(s: string): string {
    return s.replace(/\*\//g, '* /').split('\n').join('\n * ');
}
