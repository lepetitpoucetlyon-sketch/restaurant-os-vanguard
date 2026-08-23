/**
 * ⚖️ Template regulationGuard — génère un guard compliance depuis un RegulationSpec (§C.5 P3).
 *
 * Entrée : `SectorStudy.regulations[]` + slug verticale.
 * Sortie : `compliance/<Slug><RegId>Guard.ts` par régulation.
 *
 * Le guard expose une méthode `assert(context)` qui jette une erreur explicite si
 * la contrainte réglementaire est violée. Utilisé par les modules métier pour
 * bloquer les actions illégales.
 */

import type { GeneratedFile } from '../generateVertical';
import type { RegulationSpec } from '../../blueprint/SectorStudy';

export interface RegulationGuardTemplateInput {
    readonly slug: string;
    readonly className: string;
    readonly regulations: readonly RegulationSpec[];
}

export function renderRegulationGuards(input: RegulationGuardTemplateInput): GeneratedFile[] {
    if (!input.regulations.length) return [];
    const prefix = input.className.replace(/Vertical$/, '');
    return input.regulations.map(reg => ({
        path: `src/verticals/${input.slug}/compliance/${prefix}${pascalCase(reg.id)}Guard.ts`,
        skipIfExists: true,
        content: renderGuardTs(prefix, reg),
    }));
}

function renderGuardTs(prefix: string, reg: RegulationSpec): string {
    const ref = reg.reference ? `\n * Référence : ${escapeMultiline(reg.reference)}` : '';
    const addendum = reg.legalAddendum ? `\n * Addendum légal associé : ${reg.legalAddendum}` : '';

    return `/**
 * ${prefix}${pascalCase(reg.id)}Guard — garde-fou "${reg.label}".
 * ${escapeMultiline(reg.description)}${ref}${addendum}
 *
 * ⚠️ Fichier généré (skipIfExists) — implémenter la logique de vérification réelle.
 */

import { logger } from '@/lib/logger';

export class ${prefix}${pascalCase(reg.id)}Violation extends Error {
  readonly regulationId = '${reg.id}';
  readonly regulationLabel = '${escapeStr(reg.label)}';
  constructor(reason: string) {
    super(\`[${prefix}${pascalCase(reg.id)}] Violation: \${reason}\`);
  }
}

export interface ${prefix}${pascalCase(reg.id)}Context {
  readonly tenantId: string;
  readonly [key: string]: unknown;
}

export const ${prefix}${pascalCase(reg.id)}Guard = {
  readonly id: '${reg.id}',
  readonly label: '${escapeStr(reg.label)}',
  readonly reference: ${reg.reference ? `'${escapeStr(reg.reference)}'` : 'undefined'} as string | undefined,

  /**
   * Vérifie la conformité à la régulation. Jette \`${prefix}${pascalCase(reg.id)}Violation\`
   * si la contrainte est violée. Non-op par défaut — à implémenter.
   */
  assert(ctx: ${prefix}${pascalCase(reg.id)}Context): void {
    logger.debug('[${prefix}${pascalCase(reg.id)}Guard] assert', { tenantId: ctx.tenantId });
    // TODO : implémenter la vérification réelle. Exemples de patterns :
    //   if (!ctx.hasWitnessDishes) throw new ${prefix}${pascalCase(reg.id)}Violation('plats témoins manquants');
    //   if (ctx.temperature > 4) throw new ${prefix}${pascalCase(reg.id)}Violation('chaîne du froid rompue');
  },
} as const;
`;
}

function pascalCase(s: string): string {
    return s.split(/[-_\s.]/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

function escapeStr(s: string): string {
    return s.replace(/'/g, "\\'");
}

function escapeMultiline(s: string): string {
    return s.replace(/\*\//g, '* /').split('\n').join('\n * ');
}
