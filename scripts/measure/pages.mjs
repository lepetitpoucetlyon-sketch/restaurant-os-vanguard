#!/usr/bin/env node
/**
 * pages.mjs — INVENTAIRE DES PAGES ET DE LEUR ÉTAT RÉEL
 * ────────────────────────────────────────────────────────────────────────────
 * Produit, pour chacune des pages de `src/app`, un état MESURÉ — jamais estimé.
 *
 * Ce qui est mesurable depuis le code, et qui l'est ici :
 *   · la route publique et son groupe (ops / admin / marketing / public…)
 *   · si c'est une COQUILLE (une page qui ne fait que monter un composant) —
 *     et, dans ce cas, l'ÉCRAN RÉEL derrière : la mesure suit l'import.
 *     Sans cela `/finance` vaut « 11 lignes, rien à signaler », ce qui est vrai
 *     de la page et faux de l'écran. 41 des 84 pages sont dans ce cas.
 *   · le volume réel de l'écran, les composants qu'il monte
 *   · la présence d'un garde RBAC (`withPageGuard`)
 *   · les onglets `PageShell.Tab` déclarés
 *   · les composants montés qui figurent parmi les composants MORTS du dépôt
 *   · les risques responsive (grilles figées, h-screen strict, table sans scroll)
 *   · la présence d'une frontière d'erreur (`error.tsx`) sur son groupe
 *
 * Ce qui N'EST PAS mesurable ici, et n'est donc pas affirmé :
 *   · « la page fonctionne » — cela demande de l'exécuter (cf. sonde runtime M5)
 *   · la qualité visuelle
 *
 * Sortie : JSON sur stdout, ou `--out <fichier>`.
 */
import { readdirSync, statSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

// ── Corpus complet (sert à la résolution d'imports ET au repérage des morts)
const corpus = new Map();
(function walk(dir) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) {
    if (f === 'node_modules' || f === '.next') continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(p) && !p.includes('.test.')) corpus.set(p, readFileSync(p, 'utf8'));
  }
})(SRC);

// ── Toutes les pages
const pages = [];
(function walk(dir) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f === 'page.tsx') pages.push(p);
  }
})(join(SRC, 'app'));

// ── Critères d'inertie et d'accessibilité — repris À L'IDENTIQUE de
//    scripts/measure/measures.mjs (M5, M12) pour qu'une page et le dépôt ne
//    puissent jamais raconter deux histoires différentes.
//
//    Note : « composant mort monté » a été retiré, c'était tautologique —
//    une page qui monte un composant le rend, par définition, consommé.
function baliseComplete(src, i) {
  let prof = 0;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (c === '{') prof++;
    else if (c === '}') prof--;
    else if (c === '>' && prof === 0) return src.slice(i, j + 1);
  }
  return src.slice(i, i + 3000);
}

function inerties(src) {
  const r = { handlers: [], muets: 0, clavier: 0, modales: 0 };
  for (const m of src.matchAll(/\bon([A-Z]\w*)\s*:\s*_on\1\b/g)) r.handlers.push(`on${m[1]}`);
  for (const m of src.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const [, attrs, inner] = m;
    if (/aria-label|aria-labelledby|title=/.test(attrs)) continue;
    if (/\{t\(|\{\s*label|children/.test(inner)) continue;
    const texte = inner.replace(/<[^>]+>/g, '').replace(/\{[^{}]*\}/g, '').trim();
    if (!texte) r.muets++;
  }
  for (const m of src.matchAll(/<(motion\.div|div)\b/g)) {
    const bal = baliseComplete(src, m.index);
    if (!/\bonClick(?:Capture)?=/.test(bal)) continue;
    if (/\bonKey(?:Down|Up|Press)=/.test(bal)) continue;
    if (/aria-hidden="true"/.test(bal)) continue;
    if (/role="(?:button|dialog|alertdialog|switch|tab|menuitem|link|option)"/.test(bal)) continue;
    r.clavier++;
  }
  if (/fixed inset-0/.test(src) && !/role="dialog"|role="alertdialog"/.test(src)) r.modales++;
  return r;
}

// ── Résolution d'un spécificateur d'import vers un fichier du corpus
function resoudreFichier(base) {
  for (const suf of ['.tsx', '.ts', '/index.tsx', '/index.ts']) {
    const p = base + suf;
    if (corpus.has(p)) return p;
  }
  return null;
}
function resoudreImport(spec, depuis) {
  let base;
  if (spec.startsWith('@/')) base = join(SRC, spec.slice(2));
  else if (spec.startsWith('.')) base = resolve(dirname(depuis), spec);
  else return null;
  return resoudreFichier(base);
}

// Suit un barrel : dans quel fichier `nom` est-il réellement défini ?
function traverserBarrel(fichier, nom, vus = new Set()) {
  if (!fichier || vus.has(fichier)) return fichier;
  vus.add(fichier);
  const src = corpus.get(fichier);
  if (!src) return fichier;
  const definiIci = new RegExp(
    `(?:export\\s+(?:default\\s+)?(?:async\\s+)?function|export\\s+const|^\\s*(?:async\\s+)?function|^\\s*const)\\s+${nom}\\b`,
    'm',
  ).test(src);
  if (definiIci) return fichier;
  // ré-export nommé
  for (const m of src.matchAll(/export\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    const noms = m[1].split(',').map((s) => s.trim().split(/\s+as\s+/).pop().trim());
    if (noms.includes(nom)) {
      const cible = resoudreImport(m[2], fichier);
      if (cible) return traverserBarrel(cible, nom, vus);
    }
  }
  // export * — on essaie chaque cible
  for (const m of src.matchAll(/export\s*\*\s*from\s*['"]([^'"]+)['"]/g)) {
    const cible = resoudreImport(m[1], fichier);
    if (!cible || vus.has(cible)) continue;
    const r = traverserBarrel(cible, nom, vus);
    if (r && r !== cible) return r;
    const s = corpus.get(cible);
    if (s && new RegExp(`\\b${nom}\\b`).test(s)) return r || cible;
  }
  return fichier;
}

// Où est défini le composant `nom` importé par `fichier` ?
function ouEstDefini(fichier, nom) {
  const src = corpus.get(fichier);
  if (!src) return null;
  // `const X = dynamic(() => import('…'))` — Next découpe le bundle ainsi ;
  // ne pas le suivre laissait /franchise sans écran mesuré.
  const dyn = new RegExp(`const\\s+${nom}\\s*=\\s*dynamic\\([\\s\\S]{0,200}?import\\(\\s*['"]([^'"]+)['"]`).exec(src);
  if (dyn) {
    const cible = resoudreImport(dyn[1], fichier);
    if (cible) return traverserBarrel(cible, nom);
  }
  for (const m of src.matchAll(/import\s+([^;]+?)\s+from\s*['"]([^'"]+)['"]/g)) {
    const clause = m[1];
    const nomme = new RegExp(`\\{[^}]*\\b${nom}\\b[^}]*\\}`).test(clause);
    const defaut = new RegExp(`^\\s*${nom}\\s*(?:,|$)`).test(clause);
    if (!nomme && !defaut) continue;
    const cible = resoudreImport(m[2], fichier);
    if (cible) return traverserBarrel(cible, nom);
  }
  return null;
}

const PRIMITIVES = new Set([
  'Suspense', 'Fragment', 'Image', 'Link', 'Script', 'Head', 'Provider',
  'Metadata', 'Props', 'React', 'Component',
]);

function analyser(src) {
  // Piège : `useState<Order[]>` n'est pas un composant monté. En JSX le `<`
  // suit un blanc ou un délimiteur ; dans un générique il suit un mot.
  // Sans ce filtre /pos annonçait 17 composants dont 3 étaient des types.
  const montes = [...new Set(
    [...src.matchAll(/(?:^|[\s(){}[\],=&|?:>])<([A-Z]\w+)/gm)].map((m) => m[1]),
  )].filter((n) => !PRIMITIVES.has(n));
  let gridsFiges = 0;
  for (const l of src.split('\n')) {
    if (/\bgrid-cols-[3-9]\b/.test(l) && !/(?:sm|md|lg|xl|2xl):grid-cols/.test(l)) gridsFiges++;
  }
  return {
    ...inerties(src),
    lignes: src.split('\n').length,
    montes,
    onglets: (src.match(/PageShell\.Tab/g) || []).length,
    gridsFiges,
    // Piège encodé : `min-h-screen` est un plancher bénin, `h-screen` une
    // hauteur imposée. Les confondre avait surestimé le problème de 9 à 69.
    hScreenStrict: (src.match(/(?:^|[^-])\bh-screen\b/g) || []).length,
    tableSansScroll: /<table/.test(src) && !/overflow-x/.test(src) ? 1 : 0,
  };
}

// ── Un cran plus bas : les composants que l'écran monte réellement.
//    Sans cela /pos vaut « rien à signaler » alors que ses défauts vivent dans
//    Cart et ProductGrid. On s'arrête là, sans récursion : au-delà, la mesure
//    dirait « l'état du dépôt », plus « l'état de cette page ».
const cacheAnalyse = new Map();
function analyserFichier(f) {
  if (!cacheAnalyse.has(f)) cacheAnalyse.set(f, analyser(corpus.get(f) || ''));
  return cacheAnalyse.get(f);
}

function sonderEnfants(fichier, noms) {
  const agg = { fichiers: 0, handlers: [], muets: 0, clavier: 0, modales: 0, gridsFiges: 0, hScreenStrict: 0, tableSansScroll: 0 };
  const vus = new Set();
  for (const n of noms) {
    const cible = ouEstDefini(fichier, n);
    if (!cible || vus.has(cible) || cible === fichier) continue;
    vus.add(cible);
    // Les icônes lucide et les primitives externes ne sont pas notre UI.
    if (!/\/(modules|shared|components)\//.test(cible)) continue;
    agg.fichiers++;
    const a = analyserFichier(cible);
    agg.handlers.push(...a.handlers);
    agg.muets += a.muets;
    agg.clavier += a.clavier;
    agg.modales += a.modales;
    agg.gridsFiges += a.gridsFiges;
    agg.hScreenStrict += a.hScreenStrict;
    agg.tableSansScroll += a.tableSansScroll;
  }
  return agg;
}

// ── Frontières d'erreur par groupe de routes
const groupesAvecErreur = new Set();
(function walk(dir) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f === 'error.tsx') groupesAvecErreur.add(relative(join(SRC, 'app'), dirname(p)));
  }
})(join(SRC, 'app'));

const inventaire = pages.map((fp) => {
  const src = readFileSync(fp, 'utf8');
  const rel = relative(ROOT, fp).replace(/\\/g, '/');
  const brut = rel.replace(/^src\/app\//, '').replace(/\/page\.tsx$/, '');
  const route = '/' + brut.split('/').filter((s) => !/^\(.*\)$/.test(s)).join('/');
  const mGroupe = brut.match(/^(\([a-z]+\))(?:\/(\([a-z]+\)))?/);
  const groupe = mGroupe ? (mGroupe[2] ? `${mGroupe[1]}${mGroupe[2]}` : mGroupe[1]) : 'racine';

  const aPage = analyser(src);
  const coquille = aPage.lignes < 32 && aPage.montes.length > 0;

  // La page est une coquille : on suit l'import jusqu'à l'écran réel.
  let ecran = null;
  let a = aPage;
  let hops = 0;
  let courant = fp;
  let courantA = aPage;
  while (courantA.lignes < 32 && courantA.montes.length > 0 && hops < 3) {
    const cible = courantA.montes
      .map((n) => ouEstDefini(courant, n))
      .find((c) => c && c !== courant);
    if (!cible) break;
    courant = cible;
    courantA = analyser(corpus.get(cible));
    ecran = relative(ROOT, cible).replace(/\\/g, '/');
    a = courantA;
    hops++;
  }

  // Le garde RBAC peut être posé sur la page ou sur l'écran.
  const srcEcran = ecran ? corpus.get(join(ROOT, ecran)) || '' : '';
  const garde = /withPageGuard|PageGuard|ActionGuard/.test(src + srcEcran);

  const enfants = sonderEnfants(ecran ? join(ROOT, ecran) : fp, a.montes);

  let dossier = dirname(relative(join(SRC, 'app'), fp));
  let frontiere = groupesAvecErreur.has('.');
  while (!frontiere && dossier && dossier !== '.') {
    if (groupesAvecErreur.has(dossier)) frontiere = true;
    dossier = dirname(dossier);
  }

  const alertes = [];
  if (a.handlers.length) {
    alertes.push(`${a.handlers.length} prop${a.handlers.length > 1 ? 's' : ''} handler neutralisée${a.handlers.length > 1 ? 's' : ''} (${a.handlers.join(', ')}) — le geste ne déclenche rien`);
  }
  if (a.muets) alertes.push(`${a.muets} bouton${a.muets > 1 ? 's' : ''} sans nom accessible — muet${a.muets > 1 ? 's' : ''} au lecteur d'écran`);
  if (a.clavier) alertes.push(`${a.clavier} zone${a.clavier > 1 ? 's' : ''} cliquable${a.clavier > 1 ? 's' : ''} inatteignable${a.clavier > 1 ? 's' : ''} au clavier`);
  if (a.modales) alertes.push('overlay plein écran sans rôle de dialogue');
  if (a.gridsFiges) {
    alertes.push(`${a.gridsFiges} grille${a.gridsFiges > 1 ? 's' : ''} à colonnes figées — se resserre mal sous 1024 px`);
  }
  if (a.tableSansScroll) alertes.push('table sans défilement horizontal — colonnes rognées sur tablette');
  if (a.hScreenStrict) {
    alertes.push(`${a.hScreenStrict} hauteur${a.hScreenStrict > 1 ? 's' : ''} d'écran imposée${a.hScreenStrict > 1 ? 's' : ''} (h-screen strict)`);
  }
  const sousAlertes = [];
  if (enfants.handlers.length) sousAlertes.push(`${enfants.handlers.length} prop handler neutralisée (${[...new Set(enfants.handlers)].join(', ')})`);
  if (enfants.muets) sousAlertes.push(`${enfants.muets} bouton${enfants.muets > 1 ? 's' : ''} sans nom accessible`);
  if (enfants.clavier) sousAlertes.push(`${enfants.clavier} zone${enfants.clavier > 1 ? 's' : ''} cliquable${enfants.clavier > 1 ? 's' : ''} inatteignable${enfants.clavier > 1 ? 's' : ''} au clavier`);
  if (enfants.gridsFiges) sousAlertes.push(`${enfants.gridsFiges} grille${enfants.gridsFiges > 1 ? 's' : ''} à colonnes figées`);
  if (enfants.tableSansScroll) sousAlertes.push(`${enfants.tableSansScroll} table sans défilement horizontal`);
  if (enfants.hScreenStrict) sousAlertes.push(`${enfants.hScreenStrict} hauteur d'écran imposée`);

  if (!garde && groupe.includes('ops')) alertes.push('aucun garde RBAC sur une route métier');
  if (!frontiere) alertes.push("aucune frontière d'erreur : une exception démonte l'arbre entier");

  return {
    route, groupe, fichier: rel, ecran,
    lignes: a.lignes, coquille, garde, onglets: a.onglets,
    montes: a.montes.slice(0, 24), nbMontes: a.montes.length,
    handlers: a.handlers, muets: a.muets, clavier: a.clavier, modales: a.modales,
    nbEnfants: enfants.fichiers, sousAlertes,
    gridsFiges: a.gridsFiges, hScreenStrict: a.hScreenStrict, tableSansScroll: a.tableSansScroll,
    frontiere, alertes,
    verdict: alertes.length === 0 && sousAlertes.length === 0
      ? 'ok'
      : (a.handlers.length || enfants.handlers.length || a.tableSansScroll || a.hScreenStrict
          ? 'attention' : 'remarques'),
  };
}).sort((x, y) => x.groupe.localeCompare(y.groupe) || x.route.localeCompare(y.route));

const rapport = {
  horodatage: new Date().toISOString(),
  total: inventaire.length,
  parGroupe: inventaire.reduce((acc, p) => { acc[p.groupe] = (acc[p.groupe] || 0) + 1; return acc; }, {}),
  parVerdict: inventaire.reduce((acc, p) => { acc[p.verdict] = (acc[p.verdict] || 0) + 1; return acc; }, {}),
  pages: inventaire,
};

const iOut = process.argv.indexOf('--out');
if (iOut > -1 && process.argv[iOut + 1]) {
  writeFileSync(process.argv[iOut + 1], JSON.stringify(rapport, null, 2) + '\n');
  console.log(`inventaire écrit : ${process.argv[iOut + 1]} — ${rapport.total} pages`);
  console.log('  par verdict :', JSON.stringify(rapport.parVerdict));
  console.log('  coquilles suivies jusqu\'à leur écran :', inventaire.filter((p) => p.ecran).length);
} else {
  console.log(JSON.stringify(rapport, null, 2));
}
