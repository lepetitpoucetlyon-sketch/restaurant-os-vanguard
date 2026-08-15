/**
 * 🏭 forge-vertical.ts — CLI du Vertical Forge
 *
 * Lit un VerticalBlueprint, génère l'arborescence de la verticale et affiche la
 * checklist de câblage (patchs des Records exhaustifs / registries).
 *
 * Usage :
 *   npx tsx scripts/forge-vertical.ts --blueprint src/verticals/salon/salon.blueprint.ts [--dry-run] [--force]
 *   npx tsx scripts/forge-vertical.ts --blueprint <path> --study [--llm]
 *   npx tsx scripts/forge-vertical.ts --blueprint <path> --export MY_BLUEPRINT
 *
 * Options :
 *   --dry-run   n'écrit rien, liste ce qui serait généré.
 *   --force     écrase même les fichiers marqués skipIfExists (composants, DNA).
 *   --study     AUTO-LANCE l'agent d'étude de secteur et injecte la substance dans le blueprint.
 *   --llm       (avec --study) enrichit l'étude via le provider LLM du projet.
 *   --export N  nom de l'export blueprint (défaut : *_BLUEPRINT ou default).
 *
 * Le câblage (PLATFORM_VARIANTS, Records de tokens, SystemTenantRegistry…) est
 * affiché comme checklist et N'EST PAS appliqué automatiquement (sécurité Phase A).
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { generateVertical, type ForgeOutput } from '@/verticals/_shared/forge';
import { validateBlueprint, type VerticalBlueprint } from '@/verticals/_shared/blueprint';
import { runSectorStudy, type StudyLLM } from '@/verticals/_shared/sector-study';

interface Args { blueprint?: string; export?: string; dryRun: boolean; force: boolean; study: boolean; llm: boolean; }

function parseArgs(argv: string[]): Args {
    const args: Args = { dryRun: false, force: false, study: false, llm: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--dry-run') args.dryRun = true;
        else if (a === '--force') args.force = true;
        else if (a === '--study') args.study = true;
        else if (a === '--llm') args.llm = true;
        else if (a === '--blueprint') args.blueprint = argv[++i];
        else if (a === '--export') args.export = argv[++i];
    }
    return args;
}

/** Charge le pont LLM du projet, ou undefined (→ baseline déterministe). */
async function resolveLLM(enabled: boolean): Promise<StudyLLM | undefined> {
    if (!enabled) return undefined;
    try {
        const { llmFromManager } = await import('@/verticals/_shared/sector-study/llmFromManager');
        return llmFromManager('reasoning');
    } catch {
        console.warn('⚠️  Pont LLM indisponible — étude en baseline déterministe.');
        return undefined;
    }
}

function pickBlueprint(mod: Record<string, unknown>, exportName?: string): VerticalBlueprint {
    if (exportName) return mod[exportName] as VerticalBlueprint;
    if (mod.default) return mod.default as VerticalBlueprint;
    const key = Object.keys(mod).find(k => k.endsWith('_BLUEPRINT'));
    if (key) return mod[key] as VerticalBlueprint;
    throw new Error('Aucun blueprint trouvé (attendu : export *_BLUEPRINT ou default, ou --export).');
}

async function fileExists(p: string): Promise<boolean> {
    try { await fs.access(p); return true; } catch { return false; }
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

    // Auto-lancement de l'agent d'étude de secteur → substance injectée dans le blueprint.
    if (args.study) {
        const llm = await resolveLLM(args.llm);
        console.log(`\n🔬 Auto-lancement de l'agent d'étude${llm ? ' (LLM)' : ' (baseline déterministe)'}…`);
        bp.substance = await runSectorStudy({ slug: bp.slug, profileId: bp.profile }, llm);
        const s = bp.substance;
        console.log(`   substance : ${s.workflows.length} process · ${s.regulations.length} réglementation(s) · ${s.hardware.length} matériel(s) · ${s.businessRules.length} règle(s) · confiance ${s.confidence}`);
    }

    const problems = validateBlueprint(bp);
    if (problems.length && !args.force) {
        console.error(`❌ Blueprint invalide :\n  - ${problems.join('\n  - ')}\n(utilisez --force pour passer outre)`);
        process.exit(1);
    }

    const out: ForgeOutput = generateVertical(bp);
    console.log(`\n🏭 Forge de la verticale « ${bp.slug} » (profil ${bp.profile}, précision ${bp.precision})\n`);

    let written = 0, skipped = 0;
    for (const f of out.files) {
        const target = path.resolve(process.cwd(), f.path);
        const exists = await fileExists(target);
        if (f.skipIfExists && exists && !args.force) {
            console.log(`  ⏭️  skip (existe)   ${f.path}`);
            skipped++;
            continue;
        }
        if (args.dryRun) {
            console.log(`  📝 would write     ${f.path}`);
            continue;
        }
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, f.content, 'utf8');
        console.log(`  ✅ ${exists ? 'overwrite' : 'create'}     ${f.path}`);
        written++;
    }

    if (out.issues.length) {
        console.log(`\n⚠️  Cohérence :\n  - ${out.issues.join('\n  - ')}`);
    }

    console.log(`\n🔌 Câblage à appliquer (checklist — non automatique) :`);
    for (const w of out.wiring) {
        console.log(`  • [${w.file}] ${w.description}`);
        console.log(`      ↳ après « ${w.anchor} » : ${w.snippet}`);
    }

    console.log(`\n${args.dryRun ? '(dry-run) ' : ''}Terminé — ${written} écrit(s), ${skipped} ignoré(s), ${out.wiring.length} point(s) de câblage.\n`);
}

main().catch(err => {
    console.error('❌ forge-vertical a échoué :', err);
    process.exit(1);
});
