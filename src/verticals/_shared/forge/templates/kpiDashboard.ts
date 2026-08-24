/**
 * 📊 Template kpiDashboard — génère un dashboard tsx + service depuis un KpiSpec[] (§C.5 P3).
 *
 * Entrée : `SectorStudy.kpis[]` + slug verticale.
 * Sortie : {presentation/<Slug>Dashboard.tsx, domain/<Slug>DashboardService.ts}.
 *
 * Pattern identique aux KPI verticales livrés en item 3 (branche existante) —
 * mais GÉNÉRÉ, pas écrit à la main. Composant Client React qui appelle le service
 * (requêtes Nexus réelles à câbler manuellement dans le service généré).
 */

import type { GeneratedFile } from '../types';
import type { KpiSpec } from '../../blueprint/SectorStudy';

export interface KpiDashboardTemplateInput {
    readonly slug: string;
    readonly className: string;   // ex. 'RestaurantVertical' → 'Restaurant'
    readonly kpis: readonly KpiSpec[];
    /** Sous-variante pour namespacer si nécessaire. */
    readonly subVariant?: string;
}

export function renderKpiDashboard(input: KpiDashboardTemplateInput): GeneratedFile[] {
    const prefix = input.className.replace(/Vertical$/, '');
    if (!input.kpis.length) return [];

    const dashboardPath = `src/verticals/${input.slug}/presentation/${prefix}KpiDashboard.tsx`;
    const servicePath = `src/verticals/${input.slug}/domain/${prefix}KpiService.ts`;

    return [
        {
            path: dashboardPath,
            skipIfExists: true,
            content: renderDashboardTsx(prefix, input.kpis),
        },
        {
            path: servicePath,
            skipIfExists: true,
            content: renderServiceTs(prefix, input.slug, input.kpis),
        },
    ];
}

function renderDashboardTsx(prefix: string, kpis: readonly KpiSpec[]): string {
    const cards = kpis.map(k => `      <StatCard
        key="${k.id}"
        title="${escapeStr(k.label)}"
        value={fmt(metrics['${k.id}'], '${escapeStr(k.unit)}')}
        hint="${escapeStr(k.description)}"
      />`).join('\n');

    return `'use client';

/**
 * ${prefix}KpiDashboard — dashboard KPI généré depuis SectorStudy.kpis.
 * ⚠️ Fichier généré par le forge (skipIfExists) — à compléter manuellement :
 *  - remplacer la source de \`metrics\` par un vrai hook Nexus
 *  - adapter le formatage \`fmt\` selon les unités réelles
 */

import React from 'react';
import { ${prefix}KpiService } from '../domain/${prefix}KpiService';

interface StatCardProps { title: string; value: string; hint?: string }
function StatCard({ title, value, hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="text-sm text-text-muted">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs text-text-muted/70 mt-1">{hint}</div>}
    </div>
  );
}

function fmt(v: number | string | undefined, unit: string): string {
  if (v === undefined || v === null) return '—';
  const s = typeof v === 'number' ? v.toLocaleString('fr-FR') : String(v);
  return unit && unit !== '#' ? \`\${s} \${unit}\` : s;
}

export function ${prefix}KpiDashboard() {
  const metrics = ${prefix}KpiService.useMetrics();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
${cards}
    </div>
  );
}
`;
}

function renderServiceTs(prefix: string, slug: string, kpis: readonly KpiSpec[]): string {
    const type = kpis.map(k => `  '${k.id}': number;`).join('\n');
    const zero = kpis.map(k => `    '${k.id}': 0,`).join('\n');

    return `/**
 * ${prefix}KpiService — service de calcul des KPIs de la verticale ${slug}.
 * ⚠️ Fichier généré (skipIfExists) — brancher vraies requêtes Nexus/RAG.
 */

import { useMemo } from 'react';

export interface ${prefix}KpiMetrics {
${type}
}

function computeMetrics(): ${prefix}KpiMetrics {
  // TODO : remplacer par de vraies requêtes Nexus (Nexus.adapter.query…)
  return {
${zero}
  };
}

export const ${prefix}KpiService = {
  useMetrics(): ${prefix}KpiMetrics {
    return useMemo(() => computeMetrics(), []);
  },
  compute: computeMetrics,
} as const;
`;
}

function escapeStr(s: string): string {
    return s.replace(/'/g, "\\'").replace(/"/g, '\\"');
}
