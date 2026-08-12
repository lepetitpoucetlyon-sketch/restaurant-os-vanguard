#!/usr/bin/env npx ts-node --transpile-only
/**
 * gen-vertical-playbook <variant>
 * §8.7 — Mesure les 12 points d'ancrage d'une verticale et génère VERTICAL_<V>.md.
 *
 * Usage : npx ts-node --transpile-only scripts/gen-vertical-playbook.ts garage
 *
 * Points d'ancrage mesurés :
 * 1. Adapter fichier      verticals/<v>/adapters/
 * 2. DNA seed             shared/seeds/<v>DNA.ts
 * 3. Tokens CSS           shared/nexus/tokens/verticals/<v>/
 * 4. roleLabels           verticals/<v>/roles.ts
 * 5. IVerticalPlugin      verticals/<v>/<V>Vertical.ts
 * 6. BridgeRules          VerticalEventBridge (sources pour ce variant)
 * 7. InvoicingAdapter     IVerticalInvoicingAdapter.resolveInvoicingAdapter(<v>)
 * 8. NavConfig            config/navConfig.ts (capabilities mentionnant <v>)
 * 9. EventTypes déclarés  orchestration/events/vertical.events.ts
 * 10. Modules teintés     modules dont la logique présuppose restaurant
 * 11. Connecteurs         shared/connector-manifest/ (variant === <v>)
 * 12. RGPD / PII          kernel/nexus/contracts/ServiceSubject (isPii warning)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const variant = process.argv[2];
if (!variant) {
    console.error('Usage : npx ts-node --transpile-only scripts/gen-vertical-playbook.ts <variant>');
    console.error('Variants : restaurant | hotel | bakery | garage | salon | clinic | retail | custom');
    process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

function exists(rel: string): boolean {
    return fs.existsSync(path.join(SRC, rel));
}

function countFiles(rel: string): number {
    const dir = path.join(SRC, rel);
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx')).length;
}

function grepCount(pattern: string, file: string): number {
    if (!fs.existsSync(path.join(SRC, file))) return 0;
    const content = fs.readFileSync(path.join(SRC, file), 'utf-8');
    return (content.match(new RegExp(pattern, 'g')) ?? []).length;
}

function grepSrc(pattern: string, ext = '*.ts'): string[] {
    try {
        const { execSync } = require('child_process');
        const result = execSync(
            `grep -rn "${pattern}" ${SRC} --include="${ext}" --include="*.tsx" -l 2>/dev/null`,
            { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
        );
        return result.trim().split('\n').filter(Boolean).map((f: string) => f.replace(SRC + '/', ''));
    } catch { return []; }
}

// ── Mesures ────────────────────────────────────────────────────────────────────

const variantId = variant === 'garage' ? 'auto' : variant === 'clinic' ? 'health' : variant;
const VerticalClass = variant.charAt(0).toUpperCase() + variant.slice(1);

const checks: { label: string; status: '✅' | '⚠️' | '❌'; detail: string }[] = [];

// 1. Adapter fichier
const adapterDir = `verticals/${variant}/adapters`;
const adapterCount = countFiles(adapterDir);
checks.push({ label: 'Adapters verticaux', status: adapterCount > 0 ? '✅' : '❌', detail: adapterCount > 0 ? `${adapterCount} fichiers dans ${adapterDir}/` : `Dossier ${adapterDir}/ manquant ou vide` });

// 2. DNA seed — accepte garageDNA.ts OU garage-full-dna.ts
const dnaFile = `shared/seeds/${variant}DNA.ts`;
const dnaFileHyphen = `shared/seeds/${variant}-full-dna.ts`;
const dnaAlt = `shared/seeds/${variant}`;
const dnaStatus = exists(dnaFile) || exists(dnaFileHyphen) ? '✅' : exists(dnaAlt) ? '⚠️' : '❌';
const dnaDetail = exists(dnaFile) ? dnaFile : exists(dnaFileHyphen) ? dnaFileHyphen : exists(dnaAlt) ? `${dnaAlt} (dossier, pas de fichier racine)` : 'Manquant';
checks.push({ label: 'DNA seed', status: dnaStatus, detail: dnaDetail });

// 3. Tokens CSS — accepte dossier ou fichier tokens/verticals/<v>.ts
const tokensDir = `kernel/nexus/tokens/verticals/${variant}`;
const tokensFile = `kernel/nexus/tokens/verticals/${variant}.ts`;
const tokensStatus = exists(tokensDir) || exists(tokensFile) ? '✅' : '❌';
const tokensDetail = exists(tokensDir) ? tokensDir : exists(tokensFile) ? tokensFile : 'Manquant';
checks.push({ label: 'Tokens CSS', status: tokensStatus, detail: tokensDetail });

// 4. roleLabels
const rolesFile = `verticals/${variant}/roles.ts`;
checks.push({ label: 'roleLabels', status: exists(rolesFile) ? '✅' : '❌', detail: exists(rolesFile) ? rolesFile : 'Manquant — créer verticals/<v>/roles.ts' });

// 5. IVerticalPlugin
const verticalTs = `verticals/${variant}/${VerticalClass}Vertical.ts`;
const altVerticalTs = `verticals/${variant}/AutoVertical.ts`; // garage alias
const pluginExists = exists(verticalTs) || exists(altVerticalTs);
checks.push({ label: 'IVerticalPlugin', status: pluginExists ? '✅' : '❌', detail: pluginExists ? (exists(verticalTs) ? verticalTs : altVerticalTs) : `Manquant : verticals/${variant}/${VerticalClass}Vertical.ts` });

// 6. EventBridge sources
const bridgeFile = 'orchestration/VerticalEventBridge.ts';
const bridgeSources = grepCount(`'${variantId}\\.`, bridgeFile);
checks.push({ label: 'VerticalEventBridge rules', status: bridgeSources >= 3 ? '✅' : bridgeSources > 0 ? '⚠️' : '❌', detail: `${bridgeSources} règle(s) pour préfixe '${variantId}.*'` });

// 7. InvoicingAdapter
const invoicingFile = 'modules/finance/comptabilite/billing/domain/IVerticalInvoicingAdapter.ts';
const adapterClass = `${VerticalClass}InvoicingAdapter`;
const invoicingExists = grepCount(adapterClass, invoicingFile) > 0;
checks.push({ label: 'IVerticalInvoicingAdapter', status: invoicingExists ? '✅' : '❌', detail: invoicingExists ? `${adapterClass} trouvé` : `${adapterClass} manquant dans IVerticalInvoicingAdapter.ts` });

// 8. NavConfig
const navFiles = grepSrc(variant, '*.ts');
const navMentions = navFiles.filter(f => f.includes('navConfig'));
checks.push({ label: 'NavConfig capabilities', status: navMentions.length > 0 ? '✅' : '⚠️', detail: navMentions.length > 0 ? navMentions.join(', ') : 'Variant non mentionné dans navConfig.ts' });

// 9. Events déclarés
const verticalEventsFile = 'orchestration/events/vertical.events.ts';
const eventsCount = grepCount(`'${variantId}\\.`, verticalEventsFile);
checks.push({ label: 'Événements déclarés', status: eventsCount >= 5 ? '✅' : eventsCount > 0 ? '⚠️' : '❌', detail: `${eventsCount} événement(s) préfixe '${variantId}.*' dans vertical.events.ts` });

// 10. Modules teintés (présupposés restaurant présents)
const restaurantCoupling = grepSrc('consumptionMode.*dine_in|consumptionMode.*takeaway|CourseType|covers.*number|tableId.*UUID', '*.ts');
const taintedCount = restaurantCoupling.filter(f => !f.includes('pos') && !f.includes('test')).length;
checks.push({ label: 'Modules teintés (couplage restaurant)', status: taintedCount === 0 ? '✅' : '⚠️', detail: taintedCount === 0 ? 'Aucun couplage restaurant hors pos/' : `${taintedCount} fichier(s) avec présupposés restaurant hors pos/` });

// 11. Connecteurs
const connectorFiles = grepSrc(variant, '*.ts');
const connectorMentions = connectorFiles.filter(f => f.includes('connector'));
checks.push({ label: 'Connecteurs', status: connectorMentions.length > 0 ? '✅' : '⚠️', detail: connectorMentions.length > 0 ? `${connectorMentions.length} connecteur(s)` : 'Aucun connecteur vertical enregistré' });

// 12. RGPD/PII warning pour clinic
const piiWarning = variant === 'clinic';
checks.push({ label: 'RGPD art.9 / PII', status: variant === 'clinic' ? '⚠️' : '✅', detail: piiWarning ? '⚠️ Clinic : toutes données patient doivent passer par PiiVault (isPii=true sur ServiceSubject). Verticale VERROUILLÉE tant que non traité.' : 'Non applicable pour cette verticale' });

// ── Génération du playbook ─────────────────────────────────────────────────────

const totalOk = checks.filter(c => c.status === '✅').length;
const totalWarn = checks.filter(c => c.status === '⚠️').length;
const totalErr = checks.filter(c => c.status === '❌').length;

const statusBadge = totalErr > 0 ? `❌ ${totalErr} bloquant(s)` : totalWarn > 0 ? `⚠️ ${totalWarn} avertissement(s)` : '✅ Prête à ouvrir';

const playbook = `# VERTICAL_${variant.toUpperCase()}.md — Playbook d'ouverture verticale

> Généré par \`scripts/gen-vertical-playbook.ts\` le ${new Date().toISOString().split('T')[0]}
> Variant : **${variant}** (préfixe événements : \`${variantId}.*\`)
> Statut : ${statusBadge}

## Score d'ancrage : ${totalOk}/12 points (${totalWarn} ⚠️, ${totalErr} ❌)

| # | Point d'ancrage | Statut | Détail |
|---|----------------|--------|--------|
${checks.map((c, i) => `| ${i + 1} | ${c.label} | ${c.status} | ${c.detail} |`).join('\n')}

## Prochaines actions

${totalErr > 0 ? `### ❌ Bloquants (${totalErr})\n\n${checks.filter(c => c.status === '❌').map(c => `- **${c.label}** : ${c.detail}`).join('\n')}\n` : ''}
${totalWarn > 0 ? `### ⚠️ Avertissements (${totalWarn})\n\n${checks.filter(c => c.status === '⚠️').map(c => `- **${c.label}** : ${c.detail}`).join('\n')}\n` : ''}
${totalErr === 0 && totalWarn === 0 ? '✅ Tous les points d\'ancrage sont satisfaits. La verticale peut être ouverte en production.\n' : ''}

## Checklist d'ouverture

- [ ] Tous les ❌ résolus
- [ ] Tests unitaires adapters (InvoicingAdapter + roleLabels)
- [ ] Test smoke ServiceTicket.open() → .close() pour cette verticale
- [ ] EventBridge : vérifier que les events source sont bien émis par \`${variant === 'garage' ? 'AutoVertical' : VerticalClass + 'Vertical'}.ts\`
- [ ] RBAC : vérifier que les pageOverrides utilisent les levels (pas les strings restaurant)
- [ ] NF525 : vérifier que ServiceTicket.close() génère bien un JournalEntry scellé
${variant === 'clinic' ? '- [ ] ⚠️ PII : toutes les données patient passent par PiiVault avant de toucher un ServiceTicket\n' : ''}
`;

const outputPath = path.join(ROOT, `VERTICAL_${variant.toUpperCase()}.md`);
fs.writeFileSync(outputPath, playbook, 'utf-8');
console.log(`\n✅ Playbook généré : ${outputPath}`);
console.log(`   Score : ${totalOk}/12 — ${statusBadge}`);
if (totalErr > 0) {
    console.log(`\n❌ ${totalErr} bloquant(s) à résoudre avant d'ouvrir :`);
    checks.filter(c => c.status === '❌').forEach(c => console.log(`   • ${c.label} : ${c.detail}`));
}
