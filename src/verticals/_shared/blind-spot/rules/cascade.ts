/**
 * @wip vertical-forge — Échéance: 2026-11-01
 * 🔗 Règles d'angles morts — famille "dependency_cascade".
 *
 * Violation d'une dépendance déclarée dans CapabilityCatalog (`dependsOn`) ou
 * absence d'une capability prérequise implicite.
 */

import type { BlindSpotRule, RuleOutput, VerticalContext, TenantContext } from '../types';
import type { CapabilityKey, CapabilitySet } from '../../catalog/CapabilityCatalog';
import { getCapability } from '../../catalog/CapabilityCatalog';

/** Vrai si une capability est effectivement activée dans le set. */
function on(caps: CapabilitySet, k: CapabilityKey): boolean {
    return caps[k] === true;
}

/**
 * Factory : construit une règle de cascade générique pour un couple
 * (feature, prérequis). Génère 5 règles avec une seule ligne chacune.
 */
function cascadeRule(id: string, feature: CapabilityKey, prerequisite: CapabilityKey, severity: 'critical' | 'high' | 'medium' = 'high'): BlindSpotRule {
    const featMeta = getCapability(feature);
    const prereqMeta = getCapability(prerequisite);
    return {
        id: `bs.cascade.${id}`,
        family: 'dependency_cascade',
        scope: 'both',
        defaultTitle: `${featMeta.label} activé sans ${prereqMeta.label}`,
        detectVertical(ctx: VerticalContext) {
            if (!on(ctx.effectiveCapabilities, feature)) return null;
            if (on(ctx.effectiveCapabilities, prerequisite)) return null;
            return output(severity,
                [`effectiveCapabilities.${feature} = true`,
                 `effectiveCapabilities.${prerequisite} = ${ctx.effectiveCapabilities[prerequisite]}`,
                 `catalog.dependsOn: ${featMeta.dependsOn?.join(', ') || '(implicite)'}`],
                'enable_capability', prerequisite,
                `${featMeta.label} ne peut pas fonctionner sans ${prereqMeta.label} (dépendance métier).`);
        },
        detectTenant(ctx: TenantContext) {
            if (!on(ctx.qualification.capabilities, feature)) return null;
            if (on(ctx.qualification.capabilities, prerequisite)) return null;
            return output(severity,
                [`qualification.capabilities.${feature} = true`,
                 `qualification.capabilities.${prerequisite} = ${ctx.qualification.capabilities[prerequisite]}`],
                'enable_capability', prerequisite,
                `${featMeta.label} ne peut pas fonctionner sans ${prereqMeta.label} (dépendance métier).`);
        },
    };
}

function output(
    severity: 'critical' | 'high' | 'medium' | 'low',
    evidence: string[],
    kind: 'enable_capability' | 'raise_tier' | 'add_hardware' | 'add_guard' | 'add_route' | 'manual',
    target: string,
    rationale: string,
): RuleOutput {
    return { severity, evidence, suggestedFix: { kind, target, rationale } };
}

// ── Les 5 cascades les plus fréquentes ──────────────────────────────────────────

export const KDS_WITHOUT_POS = cascadeRule('kds_without_pos', 'mod_kds', 'mod_pos', 'critical');
export const PLANNING_WITHOUT_HR = cascadeRule('planning_without_hr', 'mod_planning', 'mod_hr');
export const LEAVES_WITHOUT_HR = cascadeRule('leaves_without_hr', 'mod_leaves', 'mod_hr');
export const CRM_WITHOUT_CUSTOMER = cascadeRule('crm_without_customer', 'mod_crm', 'mod_customer');
export const KIOSK_WITHOUT_POS = cascadeRule('kiosk_without_pos', 'mod_kiosk', 'mod_pos', 'critical');

export const CASCADE_RULES: readonly BlindSpotRule[] = [
    KDS_WITHOUT_POS,
    PLANNING_WITHOUT_HR,
    LEAVES_WITHOUT_HR,
    CRM_WITHOUT_CUSTOMER,
    KIOSK_WITHOUT_POS,
];
