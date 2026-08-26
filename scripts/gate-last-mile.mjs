#!/usr/bin/env node
/**
 * gate-last-mile.mjs — GATE 6 « DERNIER KILOMÈTRE » (AGENTS.md Loi 8)
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
 * Cette gate NE MESURE RIEN elle-même : elle consomme `scripts/measure/`, qui
 * est l'unique source de vérité. Un seul endroit à corriger si une mesure évolue.
 *
 * MÉCANIQUE : cliquet, l'idiome déjà en place (MADGE_CYCLES_MAX, BARREL_DEBT_MAX).
 * Les seuils vivent dans preflight.sh et sont surveillés par
 * verify-gate-integrity.mjs : personne ne peut les relever pour se débloquer.
 * On ne bloque donc PAS sur la dette existante — on l'empêche de croître.
 *
 * Usage :
 *   node scripts/gate-last-mile.mjs             → vérifie (exit 1 si dépassement)
 *   node scripts/gate-last-mile.mjs --report    → détail complet, n'échoue jamais
 */
import { chargerCorpus, lire } from './measure/corpus.mjs';
import { MESURES } from './measure/measures.mjs';

const REPORT = process.argv.includes('--report');

// Seuils lus depuis preflight.sh — même convention que les ratchets existants.
const pf = lire('scripts/preflight.sh');
const seuil = (nom, defaut) => {
  const m = pf.match(new RegExp(`${nom}\\s*=\\s*(\\d+)`));
  return m ? Number(m[1]) : defaut;
};

/** Mesures sous cliquet. Les autres sont informatives : suivies, jamais bloquantes. */
const CLIQUETS = {
  orphans:          seuil('ORPHAN_COMPONENTS_MAX', 88),
  unreadSettings:   seuil('UNREAD_SETTINGS_MAX', 177),
  missingI18n:      seuil('MISSING_I18N_KEYS_MAX', 0),
  inertProps:       seuil('INERT_HANDLER_PROPS_MAX', 1),
  nonCanonicalSeal: seuil('NON_CANONICAL_SEAL_MAX', 1),
  fakeMetrics:      seuil('FAKE_METRICS_MAX', 10),
};

const corpus = chargerCorpus('src');
let echec = false;

console.log('🔗 Gate 6 — dernier kilomètre (ce qui est écrit est-il atteint ?)');
for (const m of MESURES) {
  if (!(m.id in CLIQUETS)) continue;
  const { valeur, detail = [] } = m.run(corpus);
  const max = CLIQUETS[m.id];
  const ok = valeur <= max;
  if (!ok) echec = true;
  console.log(`   ${ok ? '✅' : '❌'} ${m.titre.padEnd(42)} ${String(valeur).padStart(4)} / ${max}`);
  if ((REPORT || !ok) && detail.length) {
    const n = REPORT ? 40 : 15;
    for (const d of detail.slice(0, n)) console.log(`        · ${d}`);
    if (detail.length > n) console.log(`        … et ${detail.length - n} autres`);
  }
}

if (REPORT) process.exit(0);
if (echec) {
  console.error('\n❌ Un compteur du dernier kilomètre a AUGMENTÉ.');
  console.error("   Ce n'est pas un problème de style : quelque chose a été écrit sans être branché.");
  console.error('   → Branche-le, ou marque-le `@wip` avec propriétaire et échéance (AGENTS.md Loi 8).');
  console.error('   → Ne relève JAMAIS le seuil dans preflight.sh (Loi 2 ; verify-gate-integrity.mjs le refuserait).');
  console.error('   → Pour voir le tableau complet : npm run measure -- --detail');
  process.exit(1);
}
console.log('✅ Dernier kilomètre : aucun compteur en hausse.');
