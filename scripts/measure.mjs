#!/usr/bin/env node
/**
 * measure.mjs — POINT D'ENTRÉE UNIQUE DE MESURE
 * ────────────────────────────────────────────────────────────────────────────
 * `npm run measure` exécute toutes les mesures permanentes du dépôt et écrit
 * UN seul artefact, consommé par trois clients :
 *
 *   .measures/latest.json   → gitignoré, l'état courant
 *   .measures/history.jsonl → VERSIONNÉ, une ligne par exécution
 *
 *   1. `gate-last-mile.mjs`  compare aux cliquets de preflight.sh
 *   2. `docs/HEALTH.md`      est généré depuis ce JSON, jamais rédigé à la main
 *   3. les documents d'audit citent la mesure ET sa date
 *
 * Une seule source de vérité : on ne peut plus avoir deux chiffres
 * contradictoires pour la même chose dans deux documents.
 *
 * L'HISTORIQUE est le vrai gain : « 88 orphelins » ne dit rien ;
 * « 88 le 26 août, 71 le 15 septembre » dit que la dette descend.
 *
 * Ce script est PUR côté source : il ne modifie jamais `src/`.
 *
 * Usage :
 *   npm run measure                → résumé lisible + écriture des artefacts
 *   npm run measure -- --json      → JSON seul (consommation machine)
 *   npm run measure -- --detail    → déroule le détail de chaque mesure
 *   npm run measure -- orphans i18nParity   → sous-ensemble par id
 */
import { mkdirSync, writeFileSync, appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chargerCorpus, ROOT } from './measure/corpus.mjs';
import { MESURES } from './measure/measures.mjs';

const args = process.argv.slice(2);
const JSON_SEUL = args.includes('--json');
const DETAIL = args.includes('--detail');
const ids = args.filter(a => !a.startsWith('--'));

const t0 = Date.now();
const corpus = chargerCorpus('src');
const choisies = ids.length ? MESURES.filter(m => ids.includes(m.id)) : MESURES;

const resultats = {};
for (const m of choisies) {
  const r = m.run(corpus);
  resultats[m.id] = {
    titre: m.titre,
    valeur: r.valeur,
    informatif: !!m.informatif,
    ...(r.extra ? { extra: r.extra } : {}),
    detail: r.detail ?? [],
  };
}

const dureeMs = Date.now() - t0;
const horodatage = new Date().toISOString();
const rapport = {
  horodatage,
  dureeMs,
  fichiersAnalyses: corpus.fichiers.length,
  mesures: Object.fromEntries(
    Object.entries(resultats).map(([k, v]) => [k, { valeur: v.valeur, informatif: v.informatif, ...(v.extra ? { extra: v.extra } : {}) }]),
  ),
};

// ── Artefacts
const dir = join(ROOT, '.measures');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'latest.json'), JSON.stringify({ ...rapport, detail: resultats }, null, 2) + '\n');
appendFileSync(join(dir, 'history.jsonl'), JSON.stringify(rapport) + '\n');

if (JSON_SEUL) {
  console.log(JSON.stringify(rapport, null, 2));
  process.exit(0);
}

// ── Résumé lisible, avec la variation depuis la mesure précédente
let precedent = null;
const hist = join(dir, 'history.jsonl');
if (existsSync(hist)) {
  const lignes = readFileSync(hist, 'utf8').trim().split('\n');
  if (lignes.length > 1) { try { precedent = JSON.parse(lignes[lignes.length - 2]); } catch { /* ligne corrompue */ } }
}

console.log(`\n📐 Mesures du dépôt — ${corpus.fichiers.length} fichiers analysés en ${dureeMs} ms\n`);
for (const m of choisies) {
  const r = resultats[m.id];
  const av = precedent?.mesures?.[m.id]?.valeur;
  let variation = '';
  if (av != null && av !== r.valeur) {
    const d = r.valeur - av;
    variation = d < 0 ? `  ↓ ${d} (était ${av})` : `  ↑ +${d} (était ${av})`;
  }
  const marque = r.informatif ? '·' : '▸';
  console.log(`  ${marque} ${m.titre.padEnd(42)} ${String(r.valeur).padStart(6)}${variation}`);
  if (DETAIL && r.detail.length) {
    for (const d of r.detail.slice(0, 40)) console.log(`        ${d}`);
    if (r.detail.length > 40) console.log(`        … et ${r.detail.length - 40} autres`);
  }
}
console.log(`\n  ▸ = sous cliquet (preflight.sh)   · = informatif, suivi dans le temps`);
console.log(`  Artefacts : .measures/latest.json · .measures/history.jsonl\n`);
