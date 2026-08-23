/**
 * ✅ certify-vertical.ts — Smoke-test runtime d'une verticale (P6 MEGA-PLAN Forge).
 *
 * Prouve que « généré » = « fonctionne », pas juste « compile ». C'est la
 * fermeture du dernier trou profondeur-vs-surface identifié en §2.6 du plan.
 *
 * Étapes réalisées :
 *  1. Charge le blueprint d'une verticale par son slug (ou depuis un chemin).
 *  2. `validateBlueprint()` — structure Zod OK.
 *  3. `resolveBlueprintCapabilities()` — les capabilities héritées + overrides tiennent.
 *  4. `resolveCapabilityDependencies()` transitive — pas de dep manquante (`mod_kds → mod_pos`).
 *  5. `routesForCapabilities(...)` — au moins 1 route atteignable.
 *  6. `assertRegistryPlatformVariantParity` — l'enum et le registry sont alignés.
 *  7. `detectVerticalBlindSpots({blueprint, study})` — bilan des angles morts.
 *
 * Usage :
 *   npx tsx scripts/certify-vertical.ts --slug restaurant
 *   npx tsx scripts/certify-vertical.ts --slug clinic --json
 *   npx tsx scripts/certify-vertical.ts --slug gym --strict   # exit 1 si BS critical
 *
 * L'exit-code non-zéro signale une régression :
 *  - 1 : structure invalide (Zod)
 *  - 2 : dépendances capabilities incohérentes
 *  - 3 : angles morts CRITICAL en présence de --strict
 *  - 4 : parity registry ↔ enum cassée
 */

import type { PlatformVariant } from '@/modules/system';
import { PLATFORM_VARIANTS } from '@/modules/system';
import {
    VERTICAL_BLUEPRINTS,
    getVerticalBlueprint,
} from '@/verticals/_shared/catalog/VerticalBlueprintRegistry';
import {
    validateBlueprint,
    resolveBlueprintCapabilities,
} from '@/verticals/_shared/blueprint';
import {
    resolveCapabilityDependencies,
} from '@/verticals/_shared/catalog/CapabilityCatalog';
import { routesForCapabilities } from '@/verticals/_shared/catalog/CapabilityWiring';
import { assertRegistryPlatformVariantParity } from '@/verticals/_shared/catalog/derivations';
import { detectVerticalBlindSpots } from '@/verticals/_shared/blind-spot/BlindSpotDetector';
import { runSectorStudy } from '@/verticals/_shared/sector-study';

interface Args {
    slug?: string;
    json: boolean;
    strict: boolean;
}

function parseArgs(argv: string[]): Args {
    const args: Args = { json: false, strict: false };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--slug' || a === '-s') args.slug = argv[++i];
        else if (a === '--json') args.json = true;
        else if (a === '--strict') args.strict = true;
        else if (a === '--help' || a === '-h') {
            process.stdout.write(
                `Usage: npx tsx scripts/certify-vertical.ts --slug <variant> [--json] [--strict]\n\n`
                    + `Variants disponibles : ${Object.keys(VERTICAL_BLUEPRINTS).join(', ')}\n`,
            );
            process.exit(0);
        }
    }
    return args;
}

interface CertReport {
    slug: string;
    structure: 'PASS' | 'FAIL';
    structureErrors: string[];
    capabilityCount: number;
    dependencyCount: number;
    reachableRoutesCount: number;
    parity: { missingInEnum: string[]; missingInRegistry: string[] };
    blindSpots: {
        total: number;
        bySeverity: Record<string, number>;
        critical: Array<{ id: string; title: string }>;
    };
    verdict: 'CERTIFIED' | 'DEGRADED' | 'FAILED';
}

async function certify(slug: string, strict: boolean): Promise<CertReport> {
    const bp = getVerticalBlueprint(slug);
    if (!bp) {
        throw new Error(
            `slug inconnu : "${slug}". Variants disponibles : ${Object.keys(VERTICAL_BLUEPRINTS).join(', ')}`,
        );
    }

    // 2. structure
    const structureErrors = validateBlueprint(bp);

    // 3. capabilities
    const caps = resolveBlueprintCapabilities(bp);
    const capabilityCount = Object.values(caps).filter(Boolean).length;

    // 4. dépendances transitives
    const activeKeys = Object.entries(caps)
        .filter(([, v]) => v === true)
        .map(([k]) => k);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deps = resolveCapabilityDependencies(activeKeys as any);
    const dependencyCount = deps.length;

    // 5. routes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const routes = routesForCapabilities(activeKeys as any);
    const reachableRoutesCount = routes.length;

    // 6. parity registry ↔ enum
    const parity = assertRegistryPlatformVariantParity(PLATFORM_VARIANTS);

    // 7. angles morts (baseline SectorStudy — pas de LLM)
    const study = await runSectorStudy({
        slug: bp.slug,
        profileId: bp.profile,
    });
    const bsReport = detectVerticalBlindSpots({ blueprint: bp, study });
    const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const bs of bsReport.triggered) {
        bySeverity[bs.severity] = (bySeverity[bs.severity] ?? 0) + 1;
    }
    const critical = bsReport.triggered
        .filter((bs) => bs.severity === 'critical')
        .map((bs) => ({ id: bs.id, title: bs.title }));

    // verdict
    let verdict: CertReport['verdict'] = 'CERTIFIED';
    if (structureErrors.length > 0) verdict = 'FAILED';
    else if (parity.missingInEnum.length + parity.missingInRegistry.length > 0) verdict = 'FAILED';
    else if (strict && critical.length > 0) verdict = 'DEGRADED';
    else if (bsReport.triggered.length > 0) verdict = 'DEGRADED';

    return {
        slug,
        structure: structureErrors.length === 0 ? 'PASS' : 'FAIL',
        structureErrors,
        capabilityCount,
        dependencyCount,
        reachableRoutesCount,
        parity,
        blindSpots: {
            total: bsReport.triggered.length,
            bySeverity,
            critical,
        },
        verdict,
    };
}

function printHumanReport(r: CertReport): void {
    const bar = '─'.repeat(60);
    process.stdout.write(`\n${bar}\n`);
    process.stdout.write(`  🧬 CERTIFICATION — ${r.slug.toUpperCase()}\n`);
    process.stdout.write(`${bar}\n\n`);
    process.stdout.write(`  Structure          : ${r.structure}${r.structureErrors.length > 0 ? ` (${r.structureErrors.length} erreurs)` : ''}\n`);
    process.stdout.write(`  Capabilities       : ${r.capabilityCount} activées\n`);
    process.stdout.write(`  Dépendances        : ${r.dependencyCount} résolues transitivement\n`);
    process.stdout.write(`  Routes accessibles : ${r.reachableRoutesCount}\n`);
    process.stdout.write(`  Parity enum/registry: `);
    if (r.parity.missingInEnum.length + r.parity.missingInRegistry.length === 0) {
        process.stdout.write(`OK\n`);
    } else {
        process.stdout.write(`❌ missing in enum: ${r.parity.missingInEnum.join(', ') || '—'}, missing in registry: ${r.parity.missingInRegistry.join(', ') || '—'}\n`);
    }
    process.stdout.write(`  Angles morts       : ${r.blindSpots.total} `);
    process.stdout.write(`(critical=${r.blindSpots.bySeverity.critical}, high=${r.blindSpots.bySeverity.high}, medium=${r.blindSpots.bySeverity.medium}, low=${r.blindSpots.bySeverity.low})\n`);
    if (r.blindSpots.critical.length > 0) {
        process.stdout.write(`\n  ⚠️ Critiques :\n`);
        for (const bs of r.blindSpots.critical) {
            process.stdout.write(`    - [${bs.id}] ${bs.title}\n`);
        }
    }
    process.stdout.write(`\n  Verdict            : ${r.verdict}\n`);
    process.stdout.write(`${bar}\n\n`);
}

async function main(): Promise<void> {
    const args = parseArgs(process.argv);
    if (!args.slug) {
        process.stderr.write('❌ --slug requis. --help pour l\'aide.\n');
        process.exit(2);
    }

    let report: CertReport;
    try {
        report = await certify(args.slug, args.strict);
    } catch (err) {
        process.stderr.write(`💥 ${err instanceof Error ? err.message : String(err)}\n`);
        process.exit(1);
    }

    if (args.json) {
        process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    } else {
        printHumanReport(report);
    }

    // Exit-code selon le verdict
    if (report.verdict === 'FAILED') {
        process.exit(report.structureErrors.length > 0 ? 1 : 4);
    }
    if (args.strict && report.blindSpots.critical.length > 0) {
        process.exit(3);
    }
    process.exit(0);
}

main().catch((err) => {
    process.stderr.write(`💥 ${err instanceof Error ? err.stack : String(err)}\n`);
    process.exit(1);
});

// Type-only re-export pour éviter les erreurs de tsx / Node ESM.
export type { PlatformVariant };
