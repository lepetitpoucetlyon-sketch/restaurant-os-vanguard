#!/usr/bin/env node
/**
 * verify-gate-integrity.mjs — MÉTA-GATE ANTI-TRICHE
 * ────────────────────────────────────────────────────────────────────────────
 * Empêche de faire passer une gate en la DESSERRANT (au lieu de corriger le code).
 * Détecte : +d'exemptions barrel dans eslint.config.mjs, ratchets relevés.
 *
 * Usage :
 *   node scripts/verify-gate-integrity.mjs            → vérifie vs .gate-baseline.json (exit 1 si desserré)
 *   node scripts/verify-gate-integrity.mjs --freeze   → fige la baseline actuelle (ne re-freeze QU'EN DIMINUANT)
 *
 * Appelé par le hook .githooks/pre-commit et (à terme) par la CI.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ROOT = process.cwd();
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

function fingerprint() {
  const cfg = read('eslint.config.mjs');
  // Tous les globs src/… ou @/… listés dans la config (surtout les exemptions barrel).
  const globs = [...cfg.matchAll(/["'](src\/[^"']+|@\/[^"']+)["']/g)].map((m) => m[1]).sort();
  // Nombre de fois où le Barrel Contract est désactivé.
  const off = (cfg.match(/["']no-restricted-imports["']\s*:\s*["']off["']/g) || []).length;

  const pf = read('scripts/preflight.sh');
  const num = (re) => { const m = pf.match(re); return m ? Number(m[1]) : null; };
  const ratchets = {
    cycles: num(/MADGE_CYCLES_MAX\s*=\s*(\d+)/),
    barrel: num(/BARREL_DEBT_MAX\s*=\s*(\d+)/),
    interModule: num(/INTER_MODULE_MAX\s*=\s*(\d+)/),
    bundle: num(/BUNDLE_MAX_KB:-?(\d+)/),
  };

  const hash = createHash('sha256').update(JSON.stringify({ globs, off, ratchets })).digest('hex').slice(0, 16);
  return { globCount: globs.length, off, ratchets, hash, globs };
}

const fp = fingerprint();
const BASE_PATH = 'src/../.gate-baseline.json'.replace('src/../', ''); // = .gate-baseline.json

if (process.argv.includes('--freeze')) {
  writeFileSync(BASE_PATH, JSON.stringify({
    _note: "Baseline anti-desserrement (ADR-015 / AGENTS.md). N'AUGMENTE jamais globCount/off ni les ratchets. Re-freeze uniquement en DIMINUANT après avoir corrigé le code.",
    hash: fp.hash, globCount: fp.globCount, off: fp.off, ratchets: fp.ratchets,
  }, null, 2) + '\n');
  console.log(`🧊 Baseline figée : hash=${fp.hash} globs=${fp.globCount} off=${fp.off} cycles≤${fp.ratchets.cycles} barrel≤${fp.ratchets.barrel}`);
  process.exit(0);
}

if (!existsSync(BASE_PATH)) {
  // Auto-freeze à la première exécution — zéro étape manuelle (tout automatique).
  writeFileSync(BASE_PATH, JSON.stringify({
    _note: "Baseline AUTO-figée. N'augmente jamais globCount/off ni les ratchets. Re-freeze uniquement en DIMINUANT (--freeze) après avoir corrigé le code.",
    hash: fp.hash, globCount: fp.globCount, off: fp.off, ratchets: fp.ratchets,
  }, null, 2) + '\n');
  console.log(`🧊 Baseline auto-figée (1re exécution) : globs=${fp.globCount} off=${fp.off} cycles≤${fp.ratchets.cycles} barrel≤${fp.ratchets.barrel}`);
  process.exit(0);
}

const base = JSON.parse(read(BASE_PATH));
const errs = [];
if (fp.globCount > base.globCount) errs.push(`Exemptions eslint élargies : ${fp.globCount} globs > baseline ${base.globCount}. Une gate barrel a été desserrée.`);
if (fp.off > base.off) errs.push(`Barrel Contract désactivé sur plus de zones : ${fp.off} > ${base.off}.`);
for (const k of ['cycles', 'barrel', 'interModule', 'bundle']) {
  const cur = fp.ratchets[k], b = base.ratchets?.[k];
  if (cur != null && b != null && cur > b) errs.push(`Ratchet '${k}' relevé : ${cur} > baseline ${b}.`);
}


if (errs.length) {
  console.error('❌ INTÉGRITÉ DES GATES — une gate a été desserrée au lieu de corriger le code :');
  for (const e of errs) console.error('   • ' + e);
  console.error('\n→ Corrige le CODE. Si la baisse est LÉGITIME (moins d\'exemptions) : node scripts/verify-gate-integrity.mjs --freeze');
  console.error('  (Voir AGENTS.md Loi 2 + ADR-015.)');
  process.exit(1);
}
console.log(`✅ Intégrité des gates OK (hash=${fp.hash}).`);
