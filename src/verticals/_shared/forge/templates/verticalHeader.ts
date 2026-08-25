/**
 * 🎨 Template `verticalHeader` — génère un header tsx éditorial pour une page
 *    opérationnelle d'une verticale, à partir d'un `BlueprintHeader` déclaré.
 *
 * Entrée : slug + `BlueprintHeader[]` (extension du VerticalBlueprint).
 * Sortie : `src/verticals/<slug>/ui/<Name>.tsx`, un composant Client React
 *   assemblé exclusivement à partir des primitives `PageShell.*` (ADR-017) et
 *   du `resolveKicker(variant, domain)` — aucun mot inventé, aucun rail
 *   dupliqué. Le fichier est marqué `skipIfExists: true` pour ne pas écraser
 *   des personnalisations manuelles.
 *
 * Le générateur ne câble aucun state — le composant expose une signature de
 * props (segments cliquables, CTAs) et laisse le page.tsx branché à ses
 * hooks métier ; c'est la même philosophie que `kpiDashboard.ts`.
 */

import type { GeneratedFile } from '../types';
import type { PlatformVariant } from '@/modules/system';
import type {
    BlueprintHeader,
    BlueprintHeaderCTA,
    BlueprintHeaderSegment,
} from '../../blueprint/VerticalBlueprint';

export interface VerticalHeaderTemplateInput {
    readonly slug: string;
    readonly variant: PlatformVariant;     // pour piocher le bon kicker map
    readonly headers: readonly BlueprintHeader[];
}

/** Rend `src/verticals/<slug>/ui/<Name>.tsx` pour chaque header déclaré. */
export function renderVerticalHeaders(input: VerticalHeaderTemplateInput): GeneratedFile[] {
    if (!input.headers.length) return [];
    return input.headers.map((h) => ({
        path: `src/verticals/${input.slug}/ui/${h.name}.tsx`,
        skipIfExists: true,
        content: renderHeaderTsx(input.variant, h),
    }));
}

function renderHeaderTsx(variant: PlatformVariant, h: BlueprintHeader): string {
    const iconImports = collectIconImports(h);
    const propsInterface = renderPropsInterface(h);
    const propsDestructure = renderPropsDestructure(h);
    const kickerCall = `resolveKicker('${variant}', '${h.domain}')`;
    const titleSize = h.titleSize ? `size="${h.titleSize}"` : '';
    const dense = h.dense ? ' dense' : '';
    const iconProp = h.icon ? ` icon={${h.icon}}` : '';

    const segmentsBlock = (h.segments ?? []).map(renderSegmentBlock).join('\n');
    const ctasBlock = (h.ctas ?? []).map(renderCtaBlock).join('\n');

    return `'use client';

/**
 * ${h.name} — header éditorial généré par le forge pour la verticale.
 * ⚠️ Fichier généré (skipIfExists) — libre de le personnaliser :
 *  - ajouter des rails custom entre les segments et les CTAs
 *  - brancher un status pulse via \`PageShell.EditorialTitle status={…}\`
 *  - remplacer les segments par un Picker si un choix ouvert est nécessaire
 */

import { PageShell } from '@ui/PageShell';
import { resolveKicker } from '@/shared/seeds/kickers';
${iconImports}

${propsInterface}

export function ${h.name}({${propsDestructure}}: ${h.name}Props) {
  return (
    <PageShell.OperationalHeader${dense}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-5 flex-wrap min-w-0">
          <PageShell.EditorialTitle
            kicker={${kickerCall}}
            title="${escapeAttr(h.title)}"
            ${titleSize}${iconProp}
          />
${segmentsBlock}
        </div>

        <div className="flex items-center gap-3">
${ctasBlock}
        </div>
      </div>
    </PageShell.OperationalHeader>
  );
}
`;
}

function collectIconImports(h: BlueprintHeader): string {
    const icons = new Set<string>();
    if (h.icon) icons.add(h.icon);
    for (const seg of h.segments ?? []) {
        for (const it of seg.items) if (it.icon) icons.add(it.icon);
    }
    for (const cta of h.ctas ?? []) if (cta.icon) icons.add(cta.icon);
    if (!icons.size) return '';
    return `import { ${Array.from(icons).sort().join(', ')} } from 'lucide-react';`;
}

function renderPropsInterface(h: BlueprintHeader): string {
    const lines: string[] = [`interface ${h.name}Props {`];
    for (const seg of h.segments ?? []) {
        const union = seg.items.map((it) => `'${it.value}'`).join(' | ');
        lines.push(`  ${seg.name}: ${union};`);
        lines.push(`  set${capitalize(seg.name)}: (v: ${union}) => void;`);
    }
    for (const cta of h.ctas ?? []) {
        lines.push(`  ${cta.name}: () => void;`);
    }
    lines.push('}');
    return lines.join('\n');
}

function renderPropsDestructure(h: BlueprintHeader): string {
    const parts: string[] = [];
    for (const seg of h.segments ?? []) {
        parts.push(seg.name);
        parts.push(`set${capitalize(seg.name)}`);
    }
    for (const cta of h.ctas ?? []) parts.push(cta.name);
    return parts.length ? ` ${parts.join(', ')} ` : '';
}

function renderSegmentBlock(seg: BlueprintHeaderSegment): string {
    const items = seg.items.map((it) => {
        const iconProp = it.icon ? ` icon={${it.icon}}` : '';
        return `            <PageShell.SegmentedItem
              active={${seg.name} === '${it.value}'}
              onClick={() => set${capitalize(seg.name)}('${it.value}')}${iconProp}
            >
              ${escapeAttr(it.label)}
            </PageShell.SegmentedItem>`;
    }).join('\n');
    return `          <PageShell.Segmented ariaLabel="${escapeAttr(seg.ariaLabel)}">
${items}
          </PageShell.Segmented>`;
}

function renderCtaBlock(cta: BlueprintHeaderCTA): string {
    const tone = cta.tone && cta.tone !== 'primary' ? ` tone="${cta.tone}"` : '';
    const iconTag = cta.icon ? `<${cta.icon} className="w-[15px] h-[15px]" /> ` : '';
    return `          <PageShell.CTA onClick={${cta.name}}${tone}>
            ${iconTag}<span>${escapeAttr(cta.label)}</span>
          </PageShell.CTA>`;
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeAttr(s: string): string {
    return s.replace(/"/g, '&quot;');
}
