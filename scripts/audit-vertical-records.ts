/**
 * 🔍 audit-vertical-records.ts — Rapport de divergence blueprint ↔ Records hardcodés.
 *
 * P5 phase 2 (migration effective) — outil de diagnostic pour lister chaque écart
 * entre les blueprints (source future) et les 3 Records hardcodés dans
 * `src/shared/nexus/tokens/verticals/index.ts` (source actuelle).
 *
 * Usage :
 *   npx tsx scripts/audit-vertical-records.ts           # rapport lisible
 *   npx tsx scripts/audit-vertical-records.ts --json    # sortie JSON
 *
 * Exit code : 0 (audit terminé), 1 (erreur inattendue). Ne bloque JAMAIS.
 *
 * Une fois les divergences résolues (décision opérateur : blueprint autoritaire OU
 * hardcoded autoritaire), la migration effective des Records devient triviale
 * (renommer `VERTICAL_DEFAULT_TOKENS` en `_HARDCODED` puis
 * `export const VERTICAL_DEFAULT_TOKENS = deriveDefaultTokens()`).
 */

import { PLATFORM_VARIANTS } from '@/modules/system';
import {
    VERTICAL_DEFAULT_TOKENS,
    VERTICAL_APPEARANCE,
    VERTICAL_EXTRA_TOKENS,
} from '@/shared/nexus/tokens/verticals';
import { VERTICAL_BLUEPRINTS } from '@/verticals/_shared/catalog/VerticalBlueprintRegistry';
import {
    deriveDefaultTokens,
    deriveAppearance,
    deriveExtraTokens,
} from '@/verticals/_shared/catalog/derivations';

interface Divergence {
    record: 'DEFAULT_TOKENS' | 'APPEARANCE' | 'EXTRA_TOKENS';
    variant: string;
    key?: string;
    blueprint: unknown;
    hardcoded: unknown;
}

const args = process.argv.slice(2);
const asJson = args.includes('--json');

function auditDefaultTokens(): Divergence[] {
    const out: Divergence[] = [];
    const derived = deriveDefaultTokens();
    for (const variant of PLATFORM_VARIANTS) {
        const bp = derived[variant] as Record<string, unknown>;
        const hc = VERTICAL_DEFAULT_TOKENS[variant] as Record<string, unknown>;
        const keys = new Set([...Object.keys(bp), ...Object.keys(hc)]);
        for (const key of keys) {
            if (bp[key] !== hc[key]) {
                out.push({
                    record: 'DEFAULT_TOKENS',
                    variant,
                    key,
                    blueprint: bp[key],
                    hardcoded: hc[key],
                });
            }
        }
    }
    return out;
}

function auditAppearance(): Divergence[] {
    const out: Divergence[] = [];
    const derived = deriveAppearance();
    for (const variant of PLATFORM_VARIANTS) {
        if (derived[variant] !== VERTICAL_APPEARANCE[variant]) {
            out.push({
                record: 'APPEARANCE',
                variant,
                blueprint: derived[variant],
                hardcoded: VERTICAL_APPEARANCE[variant],
            });
        }
    }
    return out;
}

function auditExtraTokens(): Divergence[] {
    const out: Divergence[] = [];
    const derived = deriveExtraTokens();
    for (const variant of PLATFORM_VARIANTS) {
        const bp = derived[variant] ?? {};
        const hc = VERTICAL_EXTRA_TOKENS[variant] ?? {};
        const keys = new Set([...Object.keys(bp), ...Object.keys(hc)]);
        for (const key of keys) {
            if (bp[key] !== hc[key]) {
                out.push({
                    record: 'EXTRA_TOKENS',
                    variant,
                    key,
                    blueprint: bp[key],
                    hardcoded: hc[key],
                });
            }
        }
    }
    return out;
}

function main(): void {
    const divergences = [
        ...auditDefaultTokens(),
        ...auditAppearance(),
        ...auditExtraTokens(),
    ];

    if (asJson) {
        process.stdout.write(JSON.stringify({ total: divergences.length, divergences }, null, 2) + '\n');
        return;
    }

    const bar = '─'.repeat(70);
    process.stdout.write(`\n${bar}\n  🔍 AUDIT — DIVERGENCE BLUEPRINT ↔ RECORDS HARDCODÉS\n${bar}\n\n`);

    if (divergences.length === 0) {
        process.stdout.write('  ✅ Aucune divergence — les Records peuvent être migrés vers derivations.\n\n');
        return;
    }

    process.stdout.write(`  Total : ${divergences.length} divergence(s)\n\n`);

    const byRecord: Record<string, Divergence[]> = {};
    for (const d of divergences) {
        (byRecord[d.record] ??= []).push(d);
    }

    for (const record of Object.keys(byRecord).sort()) {
        const items = byRecord[record];
        process.stdout.write(`  ─── ${record} (${items.length}) ${'─'.repeat(50 - record.length)}\n`);
        for (const d of items) {
            const path = d.key ? `${d.variant}.${d.key}` : d.variant;
            process.stdout.write(`     ${path.padEnd(45)}  bp=${JSON.stringify(d.blueprint)}  hc=${JSON.stringify(d.hardcoded)}\n`);
        }
        process.stdout.write('\n');
    }

    process.stdout.write(`${bar}\n`);
    process.stdout.write('  Rappel : le blueprint est déclaré autoritaire (P5).\n');
    process.stdout.write('  Résolution :\n');
    process.stdout.write('    - soit corriger le Record hardcodé pour aligner sur le blueprint (recommandé)\n');
    process.stdout.write('    - soit corriger le blueprint si le hardcoded est intentionnellement l\'autorité\n');
    process.stdout.write(`${bar}\n\n`);

    // Silence : blueprint garde une info que le registry global ignore -> légitime aussi.
    // Ce script ne juge pas ; il aide l\'opérateur à décider.
}

try {
    main();
    process.exit(0);
} catch (err) {
    process.stderr.write(`💥 ${err instanceof Error ? err.stack : String(err)}\n`);
    process.exit(1);
}

export { auditDefaultTokens, auditAppearance, auditExtraTokens };
export type { Divergence };

// Marqueur d'utilisation des Blueprints (évite un ESLint no-unused-vars faux positif
// si le TS-tree-shaker déplace ces imports) — usage indirect via les dérivations.
export const _bpMarker = Object.keys(VERTICAL_BLUEPRINTS).length;
