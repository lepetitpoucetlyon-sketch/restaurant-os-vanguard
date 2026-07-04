import { Project, SyntaxKind, StringLiteral } from 'ts-morph';
import path from 'path';
import fs from 'fs';

/**
 * 🎨 MIGRATE BRAND COLORS — white-label
 *
 * Convertit les couleurs de MARQUE codées en dur (bleu/indigo/violet/…) vers
 * les tokens sémantiques de marque, pour que la charte du tenant (injectée par
 * BrandingProvider en variables CSS) s'applique réellement partout.
 *
 * Règles de sûreté :
 *  - SEULES les couleurs "brand-like" (blue/indigo/sky/cyan/violet/purple/
 *    fuchsia) sont touchées. Les couleurs de STATUT (green=succès, red=erreur,
 *    amber=alerte) NE bougent PAS : elles sont fonctionnelles, pas de marque.
 *  - SEULES les teintes pleines 300–700 sont migrées. Les teintes claires
 *    (50/100/200) sont des fonds subtils : les mapper vers un aplat saturé
 *    casserait le design → laissées telles quelles (traitement manuel ou
 *    opacity ultérieur).
 *  - bg/from/to/via → action-primary ; text → text-brand ; border/ring → focus.
 *
 * Usage : npx tsx scripts/migrate-brand-colors.ts <path> [--dry]
 */

const TARGET = process.argv[2];
const DRY = process.argv.includes('--dry');
if (!TARGET) {
  console.error('Usage: migrate-brand-colors.ts <path> [--dry]');
  process.exit(1);
}

const BRAND_COLORS = 'blue|indigo|sky|cyan|violet|purple|fuchsia';
const PREFIXES = 'bg|text|border|ring|from|to|via';
const FULL_SHADES = '300|400|500|600|700'; // couleurs franches uniquement

// bg-purple-500 → bg-action-primary ; text-indigo-600 → text-brand ; etc.
// Conserve un éventuel modificateur d'opacité (…-500/20).
const REGEX = new RegExp(`\\b(${PREFIXES})-(?:${BRAND_COLORS})-(?:${FULL_SHADES})(\\/[0-9]{1,3})?\\b`, 'g');

function replacement(prefix: string, opacity: string): string {
  const op = opacity ?? '';
  if (['bg', 'from', 'to', 'via'].includes(prefix)) return `${prefix}-action-primary${op}`;
  if (prefix === 'text') return `text-brand${op}`;
  return `${prefix}-focus${op}`; // border / ring
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, out); }
    else if (e.name.endsWith('.tsx') || e.name.endsWith('.ts')) out.push(p);
  }
  return out;
}

const root = path.isAbsolute(TARGET) ? TARGET : path.join(process.cwd(), TARGET);
const files = fs.statSync(root).isDirectory() ? walk(root) : [root];

const project = new Project();
files.forEach(f => project.addSourceFileAtPath(f));

let total = 0;
const log: Array<{ file: string; from: string; to: string }> = [];

for (const sf of project.getSourceFiles()) {
  let touched = false;
  const nodes = [
    ...sf.getDescendantsOfKind(SyntaxKind.StringLiteral),
    ...sf.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral),
  ];
  for (const node of nodes) {
    if (node.wasForgotten()) continue;
    const text = node.getLiteralText();
    const next = text.replace(REGEX, (match, prefix, opacity) => {
      const rep = replacement(prefix, opacity);
      log.push({ file: sf.getBaseName(), from: match, to: rep });
      total++;
      return rep;
    });
    if (next !== text) {
      (node as StringLiteral).setLiteralValue(next);
      touched = true;
    }
  }
  if (touched && !DRY) sf.saveSync();
}

console.log(`${DRY ? '[DRY] ' : ''}Brand-color migration: ${total} remplacements sur ${files.length} fichiers scannés.`);
const byMap = log.reduce<Record<string, number>>((a, l) => { a[`${l.from} → ${l.to}`] = (a[`${l.from} → ${l.to}`] ?? 0) + 1; return a; }, {});
Object.entries(byMap).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  ${n}×  ${k}`));
