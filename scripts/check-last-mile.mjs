#!/usr/bin/env node
/**
 * check-last-mile.mjs — GATE 6 « DERNIER KILOMÈTRE »
 * ────────────────────────────────────────────────────────────────────────────
 * Les gates 1 à 5 vérifient des propriétés du CODE ÉCRIT : types, contrat de
 * barrel, cycles, patterns bannis. Aucune ne vérifie que ce qui est écrit est
 * ATTEINT. C'est l'angle mort qui a produit, dans ce dépôt :
 *
 *   - `Map3DOverlay` jamais monté et `setIsMap3DOpen={() => {}}` (clic sans effet)
 *   - `onSplitBill: _onSplitBill` → partage d'addition inatteignable
 *   - 31 clés de navigation affichées en clair (« nav.crm », « nav.timeclock »)
 *   - 177 réglages sur 184 déclarés dans l'écran Paramètres et lus par personne
 *   - 88 composants (10 280 lignes) jamais rendus dans l'interface
 *
 * Ces défauts passent tsc, vitest et next build : ils sont syntaxiquement
 * parfaits. Seul un compteur les rattrape.
 *
 * MÉCANIQUE : cliquet (ratchet), l'idiome déjà en place dans ce dépôt
 * (MADGE_CYCLES_MAX, BARREL_DEBT_MAX…). Les seuils vivent dans preflight.sh et
 * sont surveillés par verify-gate-integrity.mjs : personne ne peut les relever.
 * On ne bloque donc PAS sur la dette existante — on l'empêche de croître.
 *
 * Usage :
 *   node scripts/check-last-mile.mjs             → vérifie (exit 1 si dépassement)
 *   node scripts/check-last-mile.mjs --report    → affiche le détail, n'échoue pas
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = process.cwd();
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const REPORT = process.argv.includes('--report');

// ── Seuils lus depuis preflight.sh (même convention que les ratchets existants)
const pf = read('scripts/preflight.sh');
const seuil = (nom, defaut) => {
  const m = pf.match(new RegExp(`${nom}\\s*=\\s*(\\d+)`));
  return m ? Number(m[1]) : defaut;
};
const MAX = {
  orphans:      seuil('ORPHAN_COMPONENTS_MAX', 88),
  settings:     seuil('UNREAD_SETTINGS_MAX', 177),
  i18n:         seuil('MISSING_I18N_KEYS_MAX', 0),
  inertProps:   seuil('INERT_HANDLER_PROPS_MAX', 1),
  nonCanonical: seuil('NON_CANONICAL_SEAL_MAX', 1),
};

// ── Collecte des fichiers (une seule traversée)
const fichiers = [];
(function walk(dir) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) {
    if (f === 'node_modules' || f === '.next' || f === '.git') continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(p) && !p.includes('.test.')) fichiers.push(p);
  }
})(join(ROOT, 'src'));

const contenu = new Map();
for (const f of fichiers) contenu.set(f, read(f));

const CONV = new Set(['page.tsx', 'layout.tsx', 'template.tsx', 'error.tsx',
  'loading.tsx', 'not-found.tsx', 'global-error.tsx', 'route.ts']);

// ─────────────────────────────────────────────────────────────────────────────
// 1. Composants exportés sans aucun consommateur
//    Un ré-export de barrel (`export * from './X'`) n'est PAS un usage : c'est
//    précisément ce trou qui avait fait sous-évaluer l'audit de 58 à 88.
// ─────────────────────────────────────────────────────────────────────────────
const jetonsUtilises = new Set();
for (const [f, src] of contenu) {
  if (basename(f) === 'index.ts') continue;           // barrel : ne compte pas
  for (const m of src.matchAll(/\b([A-Z]\w+)\b/g)) jetonsUtilises.add(`${f}::${m[1]}`);
}
const parNom = new Map();
for (const cle of jetonsUtilises) {
  const [f, nom] = cle.split('::');
  if (!parNom.has(nom)) parNom.set(nom, new Set());
  parNom.get(nom).add(f);
}

const orphelins = [];
for (const [f, src] of contenu) {
  if (!f.endsWith('.tsx') || CONV.has(basename(f))) continue;
  if (!/\/(modules|shared\/components)\//.test(f)) continue;
  const noms = new Set([
    ...[...src.matchAll(/export\s+(?:default\s+)?(?:async\s+)?function\s+([A-Z]\w+)/g)].map(m => m[1]),
    ...[...src.matchAll(/export\s+const\s+([A-Z]\w+)\s*[:=]/g)].map(m => m[1]),
  ]);
  if (!noms.size) continue;
  // @wip : composant assumé en cours, avec propriétaire. Exclu du compteur.
  if (/@wip\b/.test(src)) continue;
  const utilise = [...noms].some(n => {
    const dansQuoi = parNom.get(n);
    return dansQuoi && [...dansQuoi].some(autre => autre !== f);
  });
  if (!utilise) orphelins.push(f.replace(ROOT + '/', ''));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Réglages déclarés dans l'écran Paramètres mais lus par personne
//    Un interrupteur que le gérant peut basculer et qui ne pilote rien est un
//    mensonge fait au client.
// ─────────────────────────────────────────────────────────────────────────────
const registre = read('src/shared/components/settings/config-registry.ts');
const declares = new Set([...registre.matchAll(/key:\s*"([a-z0-9_]+)"/g)].map(m => m[1]));
const lus = new Set();
for (const src of contenu.values()) {
  for (const m of src.matchAll(/usePageSetting\(\s*['"][^'"]+['"]\s*,\s*['"]([a-z0-9_]+)['"]/g)) lus.add(m[1]);
  for (const m of src.matchAll(/getSetting\(\s*['"]([a-z0-9_]+)['"]/g)) lus.add(m[1]);
}
const reglagesMorts = [...declares].filter(k => !lus.has(k)).sort();

// ─────────────────────────────────────────────────────────────────────────────
// 3. Clés i18n appelées mais absentes du dictionnaire français
//    `t()` retombe sur la CLÉ BRUTE : la clé s'affiche telle quelle à l'écran.
// ─────────────────────────────────────────────────────────────────────────────
const fr = read('src/i18n/locales/fr.ts');
const definies = new Set();
{
  const pile = [];
  for (const ligne of fr.split('\n')) {
    let m = ligne.match(/^\s*"([\w.]+)"\s*:\s*\{/);
    if (m) { pile.push(m[1]); continue; }
    m = ligne.match(/^\s*"([\w.]+)"\s*:\s*["'`]/);
    if (m) definies.add([...pile, m[1]].join('.'));
    if (/^\s*\},?\s*$/.test(ligne) && pile.length) pile.pop();
  }
}
const clesManquantes = new Set();
for (const src of contenu.values()) {
  for (const m of src.matchAll(/\bt\(\s*['"]([a-zA-Z][\w.]*)['"]/g)) {
    if (!definies.has(m[1])) clesManquantes.add(m[1]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Props handler rendues inertes (`onX: _onX`) — cf. INV-10
// ─────────────────────────────────────────────────────────────────────────────
const propsInertes = [];
for (const [f, src] of contenu) {
  for (const m of src.matchAll(/\bon([A-Z]\w*)\s*:\s*_on\1\b/g)) {
    propsInertes.push(`${f.replace(ROOT + '/', '')} → on${m[1]}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Scellement non déterministe : JSON.stringify avant un sign()/hash()
//    L'ordre des clés n'est pas garanti → deux hashes pour une même donnée.
// ─────────────────────────────────────────────────────────────────────────────
const scellementsFragiles = [];
for (const [f, src] of contenu) {
  const lignes = src.split('\n');
  lignes.forEach((l, i) => {
    if (!/JSON\.stringify/.test(l)) return;
    const suite = lignes.slice(i, i + 4).join('\n');
    if (/\.(sign|hash)\s*\(/.test(suite)) {
      scellementsFragiles.push(`${f.replace(ROOT + '/', '')}:${i + 1}`);
    }
  });
}

// ── Verdict
const mesures = [
  ['composants sans consommateur', orphelins.length,           MAX.orphans,      orphelins],
  ['réglages déclarés non lus',    reglagesMorts.length,        MAX.settings,     reglagesMorts],
  ['clés i18n manquantes (fr)',    clesManquantes.size,         MAX.i18n,         [...clesManquantes]],
  ['props handler inertes',        propsInertes.length,         MAX.inertProps,   propsInertes],
  ['scellements non canoniques',   scellementsFragiles.length,  MAX.nonCanonical, scellementsFragiles],
];

let echec = false;
console.log('🔗 Gate 6 — dernier kilomètre (ce qui est écrit est-il atteint ?)');
for (const [nom, valeur, max, detail] of mesures) {
  const ok = valeur <= max;
  if (!ok) echec = true;
  console.log(`   ${ok ? '✅' : '❌'} ${nom.padEnd(32)} ${String(valeur).padStart(4)} / ${max}`);
  if (REPORT && detail.length) {
    for (const d of detail.slice(0, 40)) console.log(`        · ${d}`);
    if (detail.length > 40) console.log(`        … et ${detail.length - 40} autres`);
  }
  if (!ok && !REPORT) {
    for (const d of detail.slice(0, 15)) console.log(`        · ${d}`);
    if (detail.length > 15) console.log(`        … et ${detail.length - 15} autres`);
  }
}

if (REPORT) process.exit(0);
if (echec) {
  console.error('\n❌ Un compteur du dernier kilomètre a AUGMENTÉ.');
  console.error('   Ce n\'est pas un problème de style : quelque chose a été écrit sans être branché.');
  console.error('   → Branche-le, ou marque-le `@wip` avec propriétaire et échéance (AGENTS.md Loi 8).');
  console.error('   → Ne relève JAMAIS le seuil dans preflight.sh (Loi 2 ; verify-gate-integrity.mjs le refuserait).');
  process.exit(1);
}
console.log('✅ Dernier kilomètre : aucun compteur en hausse.');
