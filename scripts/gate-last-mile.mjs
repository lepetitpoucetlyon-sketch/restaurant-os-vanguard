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
  orphans:          seuil('ORPHAN_COMPONENTS_MAX', 77),
  unreadSettings:   seuil('UNREAD_SETTINGS_MAX', 177),
  missingI18n:      seuil('MISSING_I18N_KEYS_MAX', 0),
  inertProps:       seuil('INERT_HANDLER_PROPS_MAX', 1),
  nonCanonicalSeal: seuil('NON_CANONICAL_SEAL_MAX', 0),
  fakeMetrics:      seuil('FAKE_METRICS_MAX', 7),
  dsAdoption:       seuil('DS_OUTSIDE_MAX', 478),
  a11yMuets:        seuil('A11Y_MUETS_MAX', 150),
  a11yModales:      seuil('A11Y_MODALES_MAX', 0),
  a11yKeyboard:     seuil('A11Y_KEYBOARD_MAX', 67),
  verticalStubs:    seuil('VERTICAL_STUBS_MAX', 21),
  verticalScreensUnwired: seuil('VERTICAL_SCREENS_UNWIRED_MAX', 0),
  frHardcoded:      seuil('FR_HARDCODED_MAX', 893),
  hardcodedHex:     seuil('HARDCODED_HEX_MAX', 958),
  verticalServicesUnwired: seuil('VERTICAL_SERVICES_UNWIRED_MAX', 28),
};

const corpus = chargerCorpus('src');
let echec = false;

console.log('🔗 Gate 6 — dernier kilomètre (ce qui est écrit est-il atteint ?)');
const lachesDetectes = [];
for (const m of MESURES) {
  if (!(m.id in CLIQUETS)) continue;
  const { valeur, detail = [] } = m.run(corpus);
  const max = CLIQUETS[m.id];
  const ok = valeur <= max;
  const lache = ok && valeur < max;
  if (!ok) echec = true;
  if (lache) lachesDetectes.push({ id: m.id, valeur, max });
  const marker = ok ? (lache ? '🟢' : '✅') : '❌';
  console.log(`   ${marker} ${m.titre.padEnd(42)} ${String(valeur).padStart(4)} / ${max}${lache ? '  ← baisse le seuil (Loi 2)' : ''}`);
  if ((REPORT || !ok) && detail.length) {
    const n = REPORT ? 40 : 15;
    for (const d of detail.slice(0, n)) console.log(`        · ${d}`);
    if (detail.length > n) console.log(`        … et ${detail.length - n} autres`);
  }
}

if (lachesDetectes.length && !REPORT) {
  console.log(`\n🟢 ${lachesDetectes.length} cliquet(s) lâche(s) — resserre à la source dans preflight.sh :`);
  for (const l of lachesDetectes) {
    console.log(`   ${l.id.padEnd(20)} ${l.valeur} → propose ${l.max} → recalibrer à ${l.valeur}`);
  }
  console.log("   (Non bloquant, mais chaque cliquet lâche est une régression silencieuse en puissance.)");
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
