/**
 * 🔬 study-sector.ts — CLI de l'Agent d'Étude de Secteur (Pilier 5)
 *
 * Lance une étude sectorielle pour une verticale (ou une sous-variante) et affiche
 * le SectorStudy : processus, réglementations, matériel, KPIs, règles métier.
 *
 * Usage :
 *   npx tsx scripts/study-sector.ts --blueprint src/verticals/salon/salon.blueprint.ts
 *   npx tsx scripts/study-sector.ts --blueprint <path> --sub gastronomique
 *   npx tsx scripts/study-sector.ts --blueprint <path> --llm            # enrichit via LLM projet
 *   npx tsx scripts/study-sector.ts --blueprint <path> --json           # sortie JSON brute
 *
 * Sans --llm (ou si aucun provider LLM n'est enregistré au runtime CLI), l'agent
 * retombe sur la baseline DÉTERMINISTE dérivée du profil : toujours de la substance.
 */

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
    runSectorStudy,
    persistSectorStudy,
    type SectorStudyInput,
    type StudyLLM,
} from '@/verticals/_shared/sector-study';
import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';
import type { SectorStudy } from '@/verticals/_shared/blueprint';

interface Args { blueprint?: string; export?: string; sub?: string; llm: boolean; json: boolean; persist: boolean; author?: string; }

function parseArgs(argv: string[]): Args {
    const args: Args = { llm: false, json: false, persist: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--llm') args.llm = true;
        else if (a === '--json') args.json = true;
        else if (a === '--persist') args.persist = true;
        else if (a === '--blueprint') args.blueprint = argv[++i];
        else if (a === '--export') args.export = argv[++i];
        else if (a === '--sub') args.sub = argv[++i];
        else if (a === '--author') args.author = argv[++i];
    }
    return args;
}

function pickBlueprint(mod: Record<string, unknown>, exportName?: string): VerticalBlueprint {
    if (exportName) return mod[exportName] as VerticalBlueprint;
    if (mod.default) return mod.default as VerticalBlueprint;
    const key = Object.keys(mod).find(k => k.endsWith('_BLUEPRINT'));
    if (key) return mod[key] as VerticalBlueprint;
    throw new Error('Aucun blueprint trouvé (export *_BLUEPRINT ou default, ou --export).');
}

/** Charge le pont LLM du projet, ou undefined si indisponible (→ baseline). */
async function resolveLLM(enabled: boolean): Promise<StudyLLM | undefined> {
    if (!enabled) return undefined;
    try {
        const { llmFromManager } = await import('@/verticals/_shared/sector-study/llmFromManager');
        return llmFromManager('reasoning');
    } catch {
        console.warn('⚠️  Pont LLM indisponible — repli sur la baseline déterministe.');
        return undefined;
    }
}

function printStudy(study: SectorStudy): void {
    const sub = study.subVariant ? ` › ${study.subVariant}` : '';
    console.log(`\n🔬 Étude de secteur — ${study.vertical}${sub}  (confiance ${study.confidence ?? '—'})`);
    console.log(`\n${study.summary}\n`);
    const section = (title: string, items: readonly string[]) => {
        if (!items.length) return;
        console.log(`▸ ${title}`);
        for (const it of items) console.log(`   • ${it}`);
        console.log('');
    };
    section('Processus métier', study.workflows.map(w => `${w.label} — ${w.description}`));
    section('Réglementations', study.regulations.map(r => `${r.label}${r.reference ? ` (${r.reference})` : ''} — ${r.description}`));
    section('Matériel', study.hardware.map(h => `${h.label}${h.optional ? ' (option)' : ''} — ${h.rationale}`));
    section('KPIs', study.kpis.map(k => `${k.label} [${k.unit}] — ${k.description}`));
    section('Règles métier & subtilités', study.businessRules);
    section('Intégrations', study.integrations);
    if (study.variantDifferentiators?.length) section('Différenciateurs de sous-variante', study.variantDifferentiators);
}

async function main(): Promise<void> {
    const args = parseArgs(process.argv.slice(2));
    if (!args.blueprint) {
        console.error('❌ --blueprint <path> requis.');
        process.exit(1);
    }

    const abs = path.resolve(process.cwd(), args.blueprint);
    const mod = (await import(pathToFileURL(abs).href)) as Record<string, unknown>;
    const bp = pickBlueprint(mod, args.export);

    const input: SectorStudyInput = { slug: bp.slug, profileId: bp.profile };
    if (args.sub) {
        const sv = bp.subVariants?.find(s => s.slug === args.sub);
        if (!sv) {
            console.error(`❌ sous-variante "${args.sub}" absente du blueprint "${bp.slug}".`);
            process.exit(1);
        }
        input.subVariant = { slug: sv.slug, label: sv.label, description: sv.description };
    }

    const llm = await resolveLLM(args.llm);
    console.log(`\n▶️  Lancement de l'agent d'étude${llm ? ' (LLM)' : ' (baseline déterministe)'}…`);
    const study = await runSectorStudy(input, llm);

    if (args.json) console.log(JSON.stringify(study, null, 2));
    else printStudy(study);

    if (args.persist) {
        try {
            const persisted = await persistSectorStudy(study, {
                source: llm ? 'llm-enriched' : 'baseline',
                authorId: args.author,
            });
            console.log(`\n💾 Étude persistée : mcc/studies/${persisted.slug}/${persisted.versionId} (source=${persisted.source})`);
        } catch (err) {
            console.error(`\n❌ Persistance échouée : ${err instanceof Error ? err.message : String(err)}`);
            process.exitCode = 2;
        }
    }
}

main().catch(err => {
    console.error('❌ study-sector a échoué :', err);
    process.exit(1);
});
