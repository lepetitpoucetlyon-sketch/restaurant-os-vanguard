/**
 * 🔎 scrape-company.ts — CLI du CompanyScrapeAgent (Axe B — P0).
 *
 * Lance un scrape réel d'un site d'entreprise et affiche le `CompanyProfile`
 * (identité, catalogue, branding, signaux secteur, échelle) en JSON.
 *
 * Usage :
 *   npx tsx scripts/scrape-company.ts --url https://example.com
 *   npx tsx scripts/scrape-company.ts --url https://example.com --pretty
 *   npx tsx scripts/scrape-company.ts --url https://example.com --json > profile.json
 *
 * Frontière de sécurité (rappel) :
 *  - `scrapeCompany()` refuse les URLs privées / localhost / redirections hors
 *    domaine (cf. `assertUrlIsPublic` — SSRF hardening).
 *  - Le contenu de page va uniquement dans la zone DONNÉE d'un prompt à schéma
 *    strict côté LLM (défense anti-injection).
 *  - Aucune donnée n'est PERSISTÉE — cette CLI est purement observationnelle.
 *
 * Sortie :
 *  - `--pretty` (défaut) : JSON indenté 2 espaces + résumé humain en tête.
 *  - `--json`            : JSON brut, une seule ligne — pipeable dans jq.
 */

import { scrapeCompany } from '@/modules/commerce/acquisition/onboarding/services/CompanyScrapeAgent';

interface Args {
    url?: string;
    pretty: boolean;
    json: boolean;
}

function parseArgs(argv: string[]): Args {
    const args: Args = { pretty: true, json: false };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--url' || a === '-u') args.url = argv[++i];
        else if (a === '--pretty') args.pretty = true;
        else if (a === '--json') {
            args.json = true;
            args.pretty = false;
        } else if (a === '--help' || a === '-h') {
            printHelp();
            process.exit(0);
        }
    }
    return args;
}

function printHelp(): void {
    process.stdout.write(
        `Usage: npx tsx scripts/scrape-company.ts --url <url> [--pretty|--json]\n`,
    );
}

async function main(): Promise<void> {
    const args = parseArgs(process.argv);
    if (!args.url) {
        process.stderr.write('❌ --url requis. Utilise --help pour l\'aide.\n');
        process.exit(2);
    }

    process.stderr.write(`🔎 Scrape en cours : ${args.url}\n`);
    let profile;
    try {
        profile = await scrapeCompany({ websiteUrl: args.url });
    } catch (err) {
        process.stderr.write(
            `❌ Scrape refusé : ${err instanceof Error ? err.message : String(err)}\n`,
        );
        process.exit(1);
    }

    if (args.json) {
        process.stdout.write(JSON.stringify(profile) + '\n');
        return;
    }

    // Résumé lisible + JSON pretty.
    const summary = [
        `\n📋 ${profile.identity.name}`,
        `   Secteur détecté : ${profile.sectorSignals.detectedVariant} `
            + `(confidence ${(profile.sectorSignals.confidence * 100).toFixed(0)}%)`,
        `   Catalogue      : ${profile.catalog.length} items`,
        `   Branding       : ${profile.branding.source} — ${profile.branding.primaryColor}`
            + (profile.branding.logoUrl ? ` + logo` : ''),
        `   Échelle        : ${profile.scale.multiSite ? 'multi-site' : 'mono-site'}`,
        `   Pages crawlées : ${profile.raw.pagesCrawled.length}`,
        `   Warnings       : ${profile.raw.warnings.length}`,
        '',
    ].join('\n');
    process.stderr.write(summary);
    process.stdout.write(JSON.stringify(profile, null, 2) + '\n');
}

main().catch((err) => {
    process.stderr.write(`💥 ${err instanceof Error ? err.stack : String(err)}\n`);
    process.exit(1);
});
