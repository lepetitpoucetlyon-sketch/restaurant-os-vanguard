#!/usr/bin/env node
/**
 * generate-architecture-map.mjs — CARTE D'ARCHITECTURE GÉNÉRÉE
 * ────────────────────────────────────────────────────────────────────────────
 * Source de vérité STRUCTURELLE du repo, dérivée du code (jamais écrite à la main).
 * Régénère : `node scripts/generate-architecture-map.mjs`
 * Sorties  : docs/ARCHITECTURE-MAP.md (humain) + docs/architecture-map.json (IA/RAG)
 *
 * Principe : une carte n'aide que si elle est VRAIE. Écrite à la main → elle ment
 * en une semaine (cf. audit 2026-08-22 : domain-facts pointait des dossiers morts).
 * Générée → elle ne peut pas mentir. Brancher sur un hook pre-commit pour la figer.
 */
import { readdirSync, statSync, existsSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

const IGNORE_DIR = new Set(['node_modules', '.next', '.next-mcc', 'dist', 'coverage']);
function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (IGNORE_DIR.has(name) || name.startsWith('.')) continue;
    const p = join(dir, name);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(name)) acc.push(p);
  }
  return acc;
}
const loc = (f) => { try { return readFileSync(f, 'utf8').split('\n').length; } catch { return 0; } };
const countFiles = (dir) => walk(dir).length;
const listDirs = (dir) => existsSync(dir)
  ? readdirSync(dir).filter((n) => { try { return statSync(join(dir, n)).isDirectory() && !n.startsWith('.'); } catch { return false; } })
  : [];

// ── Collecte ────────────────────────────────────────────────────────────────
const allFiles = walk(SRC);
const totalLoc = allFiles.reduce((s, f) => s + loc(f), 0);

const LAYERS = ['kernel', 'lib', 'shared', 'modules', 'app', 'verticals', 'infrastructure', 'store', 'config', 'instances', 'i18n', 'domain'];
const layers = {};
for (const L of LAYERS) { const d = join(SRC, L); if (existsSync(d)) layers[L] = countFiles(d); }

const sharedSub = {};
for (const sd of listDirs(join(SRC, 'shared'))) sharedSub[sd] = countFiles(join(SRC, 'shared', sd));

// Détecteur de chevauchement des cœurs (kernel/lib/shared) — le smell structurel n°1
const CONCERNS = ['contracts', 'schemas', 'events', 'hooks', 'providers', 'nexus'];
const coreOverlap = {};
for (const c of CONCERNS) {
  const homes = ['kernel', 'lib', 'shared'].filter((L) => {
    const base = join(SRC, L);
    return existsSync(base) && walk(base).some((f) => f.includes(`/${c}/`) || f.endsWith(`/${c}.ts`));
  });
  if (homes.length > 1) coreOverlap[c] = homes;
}

// Piliers (modules/*) + présence de barrel
const piliers = {};
for (const p of listDirs(join(SRC, 'modules'))) {
  const pd = join(SRC, 'modules', p);
  piliers[p] = { files: countFiles(pd), barrel: existsSync(join(pd, 'index.ts')) };
}
const CANON_PILIERS = ['ops', 'commerce', 'finance', 'compliance', 'human', 'logistics', 'intelligence', 'facility'];
const pilierHorsCanon = Object.keys(piliers).filter((p) => !CANON_PILIERS.includes(p));

const verticals = listDirs(join(SRC, 'verticals'));
const godFiles = allFiles.map((f) => ({ file: relative(ROOT, f), loc: loc(f) })).sort((a, b) => b.loc - a.loc).slice(0, 15);
const pages = allFiles.filter((f) => /\/app\/.*\/page\.tsx$/.test(f)).length;
const apiRoutes = allFiles.filter((f) => /\/app\/.*\/route\.ts$/.test(f)).length;

const map = {
  _note: 'FICHIER GÉNÉRÉ — ne pas éditer à la main. Régénère: node scripts/generate-architecture-map.mjs',
  totals: { files: allFiles.length, loc: totalLoc, pages, apiRoutes },
  layers, sharedSubfolders: sharedSub, coreOverlap,
  piliers, pilierHorsCanon, verticals, godFiles,
};

// ── Rendu ───────────────────────────────────────────────────────────────────
const nf = (n) => String(n).padStart(5, ' ');
const pilierRows = Object.entries(piliers)
  .sort((a, b) => b[1].files - a[1].files)
  .map(([p, v]) => `| \`${p}\`${CANON_PILIERS.includes(p) ? '' : ' ⚠️'} | ${v.files} | ${v.barrel ? '✅' : '❌ MANQUANT'} |`).join('\n');
const layerRows = Object.entries(layers).sort((a, b) => b[1] - a[1]).map(([l, n]) => `| \`src/${l}/\` | ${n} |`).join('\n');
const sharedRows = Object.entries(sharedSub).sort((a, b) => b[1] - a[1]).map(([s, n]) => `| \`shared/${s}/\` | ${n} |`).join('\n');
const overlapRows = Object.keys(coreOverlap).length
  ? Object.entries(coreOverlap).map(([c, homes]) => `| \`${c}\` | ${homes.map((h) => `\`${h}\``).join(' + ')} |`).join('\n')
  : '| _(aucun)_ | — |';
const godRows = godFiles.map((g) => `| \`${g.file}\` | ${g.loc} |`).join('\n');

const md = `# 🗺️ Carte d'architecture — RESTAURANT-OS-CORE

> **FICHIER GÉNÉRÉ** par \`scripts/generate-architecture-map.mjs\` — ne pas éditer à la main.
> Régénère : \`node scripts/generate-architecture-map.mjs\`. Version machine : \`docs/architecture-map.json\`.
> Une carte n'aide que si elle est **vraie** → elle est dérivée du code, pas écrite à la main.

## Totaux
- Fichiers \`.ts/.tsx\` : **${map.totals.files}** · LOC : **${map.totals.loc.toLocaleString('fr-FR')}**
- Pages : **${map.totals.pages}** · Routes API : **${map.totals.apiRoutes}**

## Couches
| Couche | Fichiers |
|---|---:|
${layerRows}

## ⚠️ Chevauchement des cœurs (kernel / lib / shared)
> Un même concept hébergé dans **plusieurs** couches = « où va X ? » indécidable = fuites d'imports garanties.
| Concept | Présent dans |
|---|---|
${overlapRows}

## \`src/shared/\` — détail (couche à trancher)
| Sous-dossier | Fichiers |
|---|---:|
${sharedRows}

## Piliers métier (\`src/modules/\`)
| Pilier | Fichiers | Barrel \`index.ts\` |
|---|---:|:---:|
${pilierRows}
${pilierHorsCanon.length ? `\n> ⚠️ **Hors taxonomie des 8 piliers** : ${pilierHorsCanon.map((p) => `\`${p}\``).join(', ')} — à formaliser ou rapatrier.\n` : ''}
## Verticales (\`src/verticals/\`)
${verticals.map((v) => `\`${v}\``).join(' · ')}

## Top 15 gros fichiers (candidats god-file)
| Fichier | LOC |
|---|---:|
${godRows}
`;

mkdirSync(join(ROOT, 'docs'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'architecture-map.json'), JSON.stringify(map, null, 2));
writeFileSync(join(ROOT, 'docs', 'ARCHITECTURE-MAP.md'), md);

// ── Résumé stdout ───────────────────────────────────────────────────────────
console.log('✅ Carte générée → docs/ARCHITECTURE-MAP.md + docs/architecture-map.json');
console.log(`   ${map.totals.files} fichiers · ${map.totals.loc.toLocaleString('fr-FR')} LOC · ${Object.keys(piliers).length} piliers · ${verticals.length} verticales`);
const noBarrel = Object.entries(piliers).filter(([, v]) => !v.barrel).map(([p]) => p);
if (Object.keys(coreOverlap).length) console.log(`   ⚠️ chevauchement cœurs : ${Object.keys(coreOverlap).join(', ')}`);
if (noBarrel.length) console.log(`   ⚠️ piliers sans barrel : ${noBarrel.join(', ')}`);
if (pilierHorsCanon.length) console.log(`   ⚠️ piliers hors canon : ${pilierHorsCanon.join(', ')}`);
