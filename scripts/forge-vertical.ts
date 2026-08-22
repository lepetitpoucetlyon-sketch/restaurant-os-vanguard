/**
 * 🏭 forge-vertical.ts — CLI du Vertical Forge
 *
 * Lit un VerticalBlueprint, génère l'arborescence de la verticale et affiche la
 * checklist de câblage (patchs des Records exhaustifs / registries).
 *
 * Usage :
 *   npx tsx scripts/forge-vertical.ts --blueprint src/verticals/salon/salon.blueprint.ts [--dry-run] [--force]
 *   npx tsx scripts/forge-vertical.ts --blueprint <path> [--llm]        # étude AUTO-activée
 *   npx tsx scripts/forge-vertical.ts --blueprint <path> --no-study     # créer sans étude
 *
 * L'AGENT D'ÉTUDE DE SECTEUR S'ACTIVE AUTOMATIQUEMENT à chaque création de verticale :
 * il produit un SectorStudy (substance) injecté dans le blueprint et sauvé en
 * src/verticals/<slug>/<slug>.sector-study.json. Désactivable via --no-study.
 *
 * Options :
 *   --dry-run   n'écrit rien, liste ce qui serait généré.
 *   --force     écrase même les fichiers marqués skipIfExists (composants, DNA, étude).
 *   --no-study  désactive l'agent d'étude de secteur (activé par défaut).
 *   --llm       enrichit l'étude via le provider LLM du projet (sinon baseline déterministe).
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

import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import type { ProfileId } from '@/verticals/_shared/catalog';
import type { PrecisionTier } from '@/verticals/_shared/blueprint';

interface Args { blueprint?: string; export?: string; dryRun: boolean; force: boolean; noStudy: boolean; llm: boolean; interactive: boolean; }

function parseArgs(argv: string[]): Args {
    const args: Args = { dryRun: false, force: false, noStudy: false, llm: false, interactive: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--dry-run') args.dryRun = true;
        else if (a === '--force') args.force = true;
        else if (a === '--no-study') args.noStudy = true;
        else if (a === '--study') { /* étude active par défaut — no-op de compatibilité */ }
        else if (a === '--llm') args.llm = true;
        else if (a === '--interactive' || a === '-i') args.interactive = true;
        else if (a === '--blueprint') args.blueprint = argv[++i];
        else if (a === '--export') args.export = argv[++i];
    }
    return args;
}

const PROFILE_PALETTES: Record<ProfileId, { primary: string; accent: string; fontBrand: string; emoji: string }> = {
    A: { primary: '#C5A059', accent: '#E67E22', fontBrand: 'Playfair Display', emoji: '🍽️' },
    B: { primary: '#D4A5C7', accent: '#9B59B6', fontBrand: 'Cormorant Garamond', emoji: '✂️' },
    C: { primary: '#FF6B35', accent: '#2B5C8F', fontBrand: 'Oswald', emoji: '🔧' },
    D: { primary: '#2ECC71', accent: '#27AE60', fontBrand: 'DM Sans', emoji: '🛍️' },
    E: { primary: '#1B365D', accent: '#C5A059', fontBrand: 'Cinzel', emoji: '🏨' },
    F: { primary: '#00A896', accent: '#028090', fontBrand: 'Inter', emoji: '🩺' },
    G: { primary: '#FF3366', accent: '#00F0FF', fontBrand: 'Teko', emoji: '🏋️' },
    H: { primary: '#8E44AD', accent: '#F39C12', fontBrand: 'Syne', emoji: '✨' },
};

async function runInteractiveWizard(): Promise<string> {
    const rl = readline.createInterface({ input, output });
    console.log('\n🧭 ════════════════════════════════════════════════════════════════');
    console.log('   VERTICAL FORGE — Assistant de Qualification & Diagnostic Métier');
    console.log('   (Basé sur docs/plans/QUALIFICATION_MATRIX.md)');
    console.log('════════════════════════════════════════════════════════════════\n');

    try {
        const slugRaw = await rl.question('1. Slug de la verticale (ex: garage, plombier, osteo, floral) : ');
        const slug = slugRaw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'custom_vertical';

        const label = (await rl.question(`2. Nom affiché (ex: Garage Pro, Clinique Veto) [défaut: ${slug.toUpperCase()}] : `)).trim() || slug.toUpperCase();

        console.log('\n3. Profil Archétypal :');
        console.log('   [A] Food & Périssable (Restaurant, Boulangerie)');
        console.log('   [B] Rendez-vous & Espace (Salon, Spa, Coiffure)');
        console.log('   [C] Atelier & Technique (Garage, BTP, Réparation)');
        console.log('   [D] Retail & Variantes (Boutique, Fleuriste)');
        console.log('   [E] Hébergement PMS (Hôtel, Camping)');
        console.log('   [F] Santé & Soins (Vétérinaire, Dentiste)');
        console.log('   [G] Accès & Abonnements (Gym, Coworking)');
        console.log('   [H] Concept Store Hybride');
        const profileRaw = (await rl.question('   Choix profil [A-H, défaut: C] : ')).trim().toUpperCase();
        const profile: ProfileId = (['A','B','C','D','E','F','G','H'].includes(profileRaw) ? profileRaw : 'C') as ProfileId;

        const defaultPalette = PROFILE_PALETTES[profile];
        const emoji = (await rl.question(`4. Emoji représentatif [défaut: ${defaultPalette.emoji}] : `)).trim() || defaultPalette.emoji;

        console.log('\n5. Niveau de Précision / Échelle cible :');
        console.log('   [L0] Squelette Express (Artisan solo, micro-boutique)');
        console.log('   [L1] Opérationnel Roulant (TPE 2-9 salariés)');
        console.log('   [L2] Expert Métier (PME 10-49 salariés, alertes temps réel)');
        console.log('   [L3] Enterprise & Réseau (ETI 50+ salariés, multi-sites)');
        const precisionRaw = (await rl.question('   Choix précision [L0-L3, défaut: L1] : ')).trim().toUpperCase();
        const precision: PrecisionTier = (['L0','L1','L2','L3'].includes(precisionRaw) ? precisionRaw : 'L1') as PrecisionTier;

        const primaryColor = (await rl.question(`6. Couleur primaire (hex) [défaut: ${defaultPalette.primary}] : `)).trim() || defaultPalette.primary;

        const splashRaw = (await rl.question('7. Activer le Splash Screen cinématique au démarrage ? [O/n, défaut: O] : ')).trim().toLowerCase();
        const splashEnabled = splashRaw !== 'n';

        const blueprintPath = `src/verticals/${slug}/${slug}.blueprint.ts`;
        const blueprintContent = `import type { VerticalBlueprint } from '@/verticals/_shared/blueprint';

export const ${slug.toUpperCase()}_BLUEPRINT: VerticalBlueprint = {
    slug: '${slug}',
    className: '${slug.charAt(0).toUpperCase() + slug.slice(1)}Vertical',
    profile: '${profile}',
    meta: {
        emoji: '${emoji}',
        label: '${label}',
        name: '${label} OS',
        description: 'Solution métier optimisée pour ${label}.',
    },
    capabilities: {},
    tokens: {
        appearance: 'dark',
        defaultTokens: {
            primaryColor: '${primaryColor}',
            accentColor: '${defaultPalette.accent}',
            fontBrand: '${defaultPalette.fontBrand}',
            splashEnabled: ${splashEnabled},
            brandingMode: 'custom',
        },
        verticalTokens: {
            '--${slug}-primary': '${primaryColor}',
            '--${slug}-accent': '${defaultPalette.accent}',
        },
    },
    healthMetrics: {
        activeCount: 'number',
    },
    routes: [
        {
            path: '/${slug}/dashboard',
            label: 'Tableau de bord ${label}',
            componentPath: './components/${slug.charAt(0).toUpperCase() + slug.slice(1)}Dashboard',
            componentExport: '${slug.charAt(0).toUpperCase() + slug.slice(1)}Dashboard',
        },
    ],
    events: [
        {
            name: '${slug}.activity_logged',
            pillar: 'ops',
            durable: true,
        },
    ],
    hardware: [],
    legalType: 'STANDARD',
    precision: '${precision}',
    subVariants: [],
};

export default ${slug.toUpperCase()}_BLUEPRINT;
`;

        await fs.mkdir(path.dirname(path.resolve(process.cwd(), blueprintPath)), { recursive: true });
        await fs.writeFile(path.resolve(process.cwd(), blueprintPath), blueprintContent, 'utf8');
        console.log(`\n✨ Blueprint généré avec succès : ${blueprintPath}\n`);

        return blueprintPath;
    } finally {
        rl.close();
    }
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

async function writeStudyFile(bp: VerticalBlueprint, args: Args): Promise<void> {
    const rel = `src/verticals/${bp.slug}/${bp.slug}.sector-study.json`;
    const p = path.resolve(process.cwd(), rel);
    if (args.dryRun) { console.log(`   📝 would write     ${rel}`); return; }
    if (await fileExists(p) && !args.force) { console.log(`   ⏭️  skip (existe)   ${rel}`); return; }
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, JSON.stringify(bp.substance, null, 2), 'utf8');
    console.log(`   ✅ étude sauvée    ${rel}`);
}

async function writeGeneratedFiles(out: ForgeOutput, args: Args): Promise<{ written: number; skipped: number }> {
    let written = 0, skipped = 0;
    for (const f of out.files) {
        const target = path.resolve(process.cwd(), f.path);
        const exists = await fileExists(target);
        if (f.skipIfExists && exists && !args.force) { console.log(`  ⏭️  skip (existe)   ${f.path}`); skipped++; continue; }
        if (args.dryRun) { console.log(`  📝 would write     ${f.path}`); continue; }
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, f.content, 'utf8');
        console.log(`  ✅ ${exists ? 'overwrite' : 'create'}     ${f.path}`);
        written++;
    }
    return { written, skipped };
}

async function main(): Promise<void> {
    const args = parseArgs(process.argv.slice(2));

    if (args.interactive || (!args.blueprint && process.stdin.isTTY)) {
        args.blueprint = await runInteractiveWizard();
    }

    if (!args.blueprint) {
        console.error('❌ --blueprint <path> ou --interactive (-i) requis.');
        process.exit(1);
    }

    const abs = path.resolve(process.cwd(), args.blueprint);
    const mod = (await import(pathToFileURL(abs).href)) as Record<string, unknown>;
    const bp = pickBlueprint(mod, args.export);

    if (!args.noStudy) {
        const llm = await resolveLLM(args.llm);
        console.log(`\n🔬 Agent d'étude AUTO-activé${llm ? ' (LLM)' : ' (baseline déterministe)'}…`);
        bp.substance = await runSectorStudy({ slug: bp.slug, profileId: bp.profile }, llm);
        const s = bp.substance;
        console.log(`   substance : ${s.workflows.length} process · ${s.regulations.length} réglementation(s) · ${s.hardware.length} matériel(s) · ${s.businessRules.length} règle(s) · confiance ${s.confidence}`);
        await writeStudyFile(bp, args);
    }

    const problems = validateBlueprint(bp);
    if (problems.length && !args.force) {
        console.error(`❌ Blueprint invalide :\n  - ${problems.join('\n  - ')}\n(utilisez --force pour passer outre)`);
        process.exit(1);
    }

    const out: ForgeOutput = generateVertical(bp);
    console.log(`\n🏭 Forge de la verticale « ${bp.slug} » (profil ${bp.profile}, précision ${bp.precision})\n`);

    const { written, skipped } = await writeGeneratedFiles(out, args);

    if (out.issues.length) console.log(`\n⚠️  Cohérence :\n  - ${out.issues.join('\n  - ')}`);
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
