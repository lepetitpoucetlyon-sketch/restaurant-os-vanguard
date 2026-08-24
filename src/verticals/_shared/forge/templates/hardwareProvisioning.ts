/**
 * 🖨️ Template hardwareProvisioning — génère un fichier de provisioning matériel (§C.5 P3).
 *
 * Entrée : `SectorStudy.hardware[]` + `HardwareSizingDeriver` outputs.
 * Sortie : `hardware/<Slug>HardwareProvisioning.ts` — 1 seul fichier par verticale.
 *
 * Émis en L3 uniquement. Le fichier liste les kits matériel recommandés,
 * groupés par pack (pack POS, pack cuisine, pack IoT, pack accès), avec les
 * placeholders pour les références partenaires (à choisir manuellement).
 */

import type { GeneratedFile } from '../types';
import type { HardwareSpec } from '../../blueprint/SectorStudy';

export interface HardwareProvisioningTemplateInput {
    readonly slug: string;
    readonly className: string;
    readonly hardware: readonly HardwareSpec[];
}

export function renderHardwareProvisioning(input: HardwareProvisioningTemplateInput): GeneratedFile[] {
    if (!input.hardware.length) return [];
    const prefix = input.className.replace(/Vertical$/, '');
    return [{
        path: `src/verticals/${input.slug}/hardware/${prefix}HardwareProvisioning.ts`,
        skipIfExists: true,
        content: renderProvisioningTs(prefix, input.hardware),
    }];
}

function renderProvisioningTs(prefix: string, hardware: readonly HardwareSpec[]): string {
    const kits = hardware.map(h => `  {
    kind: '${h.kind}',
    label: '${escapeStr(h.label)}',
    rationale: '${escapeStr(h.rationale)}',
    optional: ${h.optional === true},
    // TODO : brancher références partenaire (modèle, prix, revendeur).
    references: [],
  }`).join(',\n');

    return `/**
 * ${prefix}HardwareProvisioning — kits matériel recommandés pour la verticale.
 * ⚠️ Fichier généré (skipIfExists) — remplir les références partenaires.
 */

import type { HardwareKind } from '@/verticals/_shared/catalog';

export interface HardwareKitItem {
  readonly kind: HardwareKind;
  readonly label: string;
  readonly rationale: string;
  readonly optional: boolean;
  readonly references: readonly { model: string; supplier: string; priceEur: number }[];
}

export const ${prefix}HardwareKits: readonly HardwareKitItem[] = [
${kits}
];

/** Retourne les kits obligatoires (non optionnels). */
export function ${prefix}RequiredKits(): readonly HardwareKitItem[] {
  return ${prefix}HardwareKits.filter(k => !k.optional);
}
`;
}

function escapeStr(s: string): string {
    return s.replace(/'/g, "\\'");
}
