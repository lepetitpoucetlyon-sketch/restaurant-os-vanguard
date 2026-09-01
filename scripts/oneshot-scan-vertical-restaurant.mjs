#!/usr/bin/env node
/**
 * Scan "bout-en-bout" de la verticale RESTAURANT.
 * Pour chaque symbole exporté du périmètre : compte les références réelles
 * (hors tests, hors self, hors ré-export de barrel) et classe le fichier.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

const PERIMETRE = [
  'src/verticals/restaurant',
  'src/modules/ops/service/restaurant',
  'src/modules/ops/production/kds',
  'src/modules/ops/service/core/printing',
];

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (['node_modules', '.next', 'e2e'].includes(e)) continue;
      walk(p, acc);
    } else if (/\.(ts|tsx)$/.test(e)) acc.push(p);
  }
  return acc;
}
const ALL = walk(SRC);
const isTest = (p) => /\.(test|spec)\.tsx?$/.test(p) || /(__tests__|\/tests\/)/.test(p);
const APP = ALL.filter((p) => !isTest(p));
const content = new Map();
for (const p of ALL) content.set(p, readFileSync(p, 'utf8'));

const TARGET = APP.filter((p) => {
  const rel = relative(ROOT, p).replace(/\\/g, '/');
  return PERIMETRE.some((d) => rel === d || rel.startsWith(d + '/'));
});

function exportsOf(src) {
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:class|function|const|let|var)\s+([A-Za-z0-9_]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s+(?:interface|type|enum)\s+([A-Za-z0-9_]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (let part of m[1].split(',')) {
      part = part.trim().replace(/^type\s+/, '');
      const as = part.split(/\s+as\s+/);
      const n = (as[1] || as[0]).trim();
      if (n && /^[A-Za-z0-9_]+$/.test(n)) names.add(n);
    }
  }
  return { names: [...names] };
}

function refCount(name, selfPath) {
  const wordRx = new RegExp('\\b' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
  let app = 0, test = 0, barrel = 0;
  const appFiles = [], testFiles = [];
  for (const p of ALL) {
    if (p === selfPath) continue;
    const c = content.get(p);
    if (!wordRx.test(c)) continue;
    const onlyReexports = basename(p) === 'index.ts' && c.split('\n').every((l) => {
      const t = l.trim();
      return t === '' || t.startsWith('//') || t.startsWith('/*') || t.startsWith('*') || /^export .* from /.test(t) || /^import /.test(t);
    });
    if (onlyReexports) { barrel++; continue; }
    if (isTest(p)) { test++; testFiles.push(relative(ROOT, p).replace(/\\/g, '/')); }
    else { app++; appFiles.push(relative(ROOT, p).replace(/\\/g, '/')); }
  }
  return { app, test, barrel, appFiles, testFiles };
}

const registerFiles = APP.filter((p) => /registerHandlers|register.*Handler|eventBus\/register/i.test(p) || /RestaurantVertical\.ts$/.test(p) || /CoreInfraProviders|bootstrap/i.test(p));
const registerBlob = registerFiles.map((p) => content.get(p)).join('\n');

const verdicts = [];
for (const p of TARGET) {
  const rel = relative(ROOT, p).replace(/\\/g, '/');
  const src = content.get(p);
  const bn = basename(p);
  if (bn === 'index.ts' || /\.d\.ts$/.test(bn)) continue;
  const { names } = exportsOf(src);
  if (!names.length) continue;

  let best = { app: 0, test: 0, barrel: 0, appFiles: [], testFiles: [], name: names[0] };
  for (const n of names) {
    if (n.length < 3) continue;
    const r = refCount(n, p);
    if (r.app > best.app || (r.app === best.app && r.test > best.test)) best = { ...r, name: n };
  }

  const isComponent = /\.tsx$/.test(p) && /export\s+(default\s+)?function\s+[A-Z]/.test(src);
  const isHandler = /Handler|Notifier/.test(bn);
  const isRoute = /\/route\.ts$/.test(bn) || /page\.tsx$/.test(bn);

  let rendered = false;
  if (isComponent) {
    const comp = names.find((n) => /^[A-Z]/.test(n)) || best.name;
    const jsxRx = new RegExp('<' + comp + '[\\s/>]');
    rendered = APP.some((q) => q !== p && jsxRx.test(content.get(q)));
  }
  let registered = null;
  if (isHandler) {
    const hname = names.find((n) => /Handler|Notifier|register/i.test(n)) || best.name;
    registered = new RegExp('\\b' + hname + '\\b').test(registerBlob) || new RegExp(basename(p, '.ts')).test(registerBlob);
  }

  let verdict, why;
  if (isRoute) { verdict = 'ROUTE'; why = 'route/page — atteignabilité à vérifier'; }
  else if (isHandler && registered === false) { verdict = 'HANDLER-MORT'; why = 'handler jamais importé par un registre'; }
  else if (best.app === 0 && best.test === 0 && best.barrel === 0) { verdict = 'MORT-TOTAL'; why = '0 référence nulle part'; }
  else if (best.app === 0 && best.test === 0 && best.barrel > 0) { verdict = 'BARREL-SEUL'; why = 'exposé en index.ts, aucun consommateur'; }
  else if (best.app === 0 && best.test > 0) { verdict = 'TEST-SEUL'; why = `codé + testé (${best.test}) mais 0 appelant applicatif`; }
  else if (isComponent && !rendered) { verdict = 'COMPOSANT-NON-RENDU'; why = `importé (${best.app}) mais jamais <${best.name}> en JSX`; }
  else if (best.app === 1 && best.appFiles[0] && /\/services\/|\/handlers\//.test(best.appFiles[0]) && best.appFiles[0] !== rel) {
    verdict = 'ILOT'; why = `1 seul appelant, lui-même service/handler : ${best.appFiles[0]}`;
  }
  else { verdict = 'OK'; why = `${best.app} appelant(s) applicatif(s)`; }

  verdicts.push({ rel, verdict, why, symbol: best.name, appFiles: best.appFiles.slice(0, 3) });
}

const order = ['MORT-TOTAL', 'HANDLER-MORT', 'BARREL-SEUL', 'TEST-SEUL', 'COMPOSANT-NON-RENDU', 'ILOT', 'ROUTE', 'OK'];
verdicts.sort((a, b) => order.indexOf(a.verdict) - order.indexOf(b.verdict) || a.rel.localeCompare(b.rel));
const byV = {};
for (const v of verdicts) (byV[v.verdict] ??= []).push(v);
console.log(`\n# SCAN VERTICALE RESTAURANT — ${TARGET.length} fichiers\n`);
for (const k of order) {
  const list = byV[k] || [];
  if (k === 'OK') { console.log(`\n## OK : ${list.length} (sains)`); continue; }
  console.log(`\n## ${k} — ${list.length}`);
  for (const v of list) {
    console.log(`  ${v.rel}\n      → ${v.symbol} : ${v.why}`);
    if (v.appFiles.length) console.log(`        appelants: ${v.appFiles.join(', ')}`);
  }
}
console.log(`\n---\nRésumé : ` + order.slice(0, -1).map((k) => `${k}=${(byV[k] || []).length}`).join('  '));
