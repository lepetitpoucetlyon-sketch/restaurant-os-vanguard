/**
 * measures.mjs — les mesures permanentes du dépôt.
 *
 * Chaque mesure est PURE : elle lit le corpus, renvoie un nombre et un détail.
 * Elle ne décide RIEN — c'est `gate-last-mile.mjs` et `preflight.sh` qui
 * comparent aux cliquets. Une même mesure sert donc l'exploration ET la gate.
 *
 * Contrat : { id, titre, run(corpus) → { valeur, detail: string[], extra? } }
 *
 * ⚠️ Les commentaires « piège » ci-dessous encodent des erreurs réellement
 * commises pendant l'audit du 2026-08-26. Ne pas les retirer : c'est ce qui
 * évite de les refaire.
 */
import { basename } from 'node:path';
import { lire, ROOT } from './corpus.mjs';
import { statSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// ─────────────────────────────────────────────────────────────────────────────
// M1 — Composants exportés sans aucun consommateur
// ─────────────────────────────────────────────────────────────────────────────
export const m1_reachability = {
  id: 'orphans',
  titre: 'Composants sans consommateur',
  run(c) {
    // PIÈGE : un ré-export de barrel (`export * from './X'`) N'EST PAS un usage.
    // La 1re version de cet audit traversait les barrels et annonçait 58 orphelins
    // au lieu de 88 — une sous-évaluation de 52 %.
    const usagesParNom = new Map();
    for (const [f, src] of c.contenu) {
      if (c.estBarrel(f)) continue;
      for (const m of src.matchAll(/\b([A-Z]\w+)\b/g)) {
        if (!usagesParNom.has(m[1])) usagesParNom.set(m[1], new Set());
        usagesParNom.get(m[1]).add(f);
      }
    }
    const detail = [];
    for (const [f, src] of c.contenu) {
      if (!c.estComposantProduit(f)) continue;
      if (/@wip\b/.test(src)) continue;            // travail en cours assumé (Loi 8)
      const noms = new Set([
        ...[...src.matchAll(/export\s+(?:default\s+)?(?:async\s+)?function\s+([A-Z]\w+)/g)].map(m => m[1]),
        ...[...src.matchAll(/export\s+const\s+([A-Z]\w+)\s*[:=]/g)].map(m => m[1]),
      ]);
      if (!noms.size) continue;
      const utilise = [...noms].some(n => {
        const ou = usagesParNom.get(n);
        return ou && [...ou].some(autre => autre !== f);
      });
      if (!utilise) detail.push(c.rel(f));
    }
    return { valeur: detail.length, detail: detail.sort() };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// M2 — Réglages déclarés dans l'écran Paramètres mais lus par personne
// ─────────────────────────────────────────────────────────────────────────────
export const m2_settings = {
  id: 'unreadSettings',
  titre: 'Réglages déclarés non lus',
  run(c) {
    // Un interrupteur que le gérant peut basculer et qui ne pilote rien est un
    // mensonge fait au client. Mesuré le 2026-08-26 : 184 déclarés, 7 lus.
    const registre = lire('src/shared/components/settings/config-registry.ts');
    const declares = new Set([...registre.matchAll(/key:\s*"([a-z0-9_]+)"/g)].map(m => m[1]));
    const lus = new Set();
    for (const src of c.contenu.values()) {
      for (const m of src.matchAll(/usePageSetting\(\s*['"][^'"]+['"]\s*,\s*['"]([a-z0-9_]+)['"]/g)) lus.add(m[1]);
      for (const m of src.matchAll(/(?:SettingsReader\.)?getSetting(?:<[^>]+>)?\(\s*['"][^'"]+['"]\s*,\s*['"]([a-z0-9_]+)['"]/g)) lus.add(m[1]);
    }
    const detail = [...declares].filter(k => !lus.has(k)).sort();
    return { valeur: detail.length, detail, extra: { declares: declares.size, lus: [...lus].filter(k => declares.has(k)).length } };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// M3 — Parité des traductions
// ─────────────────────────────────────────────────────────────────────────────
function clesLocale(txt) {
  const out = new Set(); const pile = [];
  for (const l of txt.split('\n')) {
    let m = l.match(/^\s*"([\w.]+)"\s*:\s*\{/);
    if (m) { pile.push(m[1]); continue; }
    m = l.match(/^\s*"([\w.]+)"\s*:\s*["'`]/);
    if (m) out.add([...pile, m[1]].join('.'));
    if (/^\s*\},?\s*$/.test(l) && pile.length) pile.pop();
  }
  return out;
}

export const m3_i18n = {
  id: 'missingI18n',
  titre: 'Clés i18n appelées mais absentes (fr)',
  run(c) {
    // `t()` retombe sur la CLÉ BRUTE quand la traduction manque : la clé
    // s'affiche telle quelle à l'écran. C'est ce qui montrait « nav.crm ».
    const definies = clesLocale(lire('src/i18n/locales/fr.ts'));
    const manquantes = new Set();
    for (const src of c.contenu.values()) {
      for (const m of src.matchAll(/\bt\(\s*['"]([a-zA-Z][\w.]*)['"]/g)) {
        if (!definies.has(m[1])) manquantes.add(m[1]);
      }
    }
    return { valeur: manquantes.size, detail: [...manquantes].sort() };
  },
};

export const m3b_i18nParite = {
  id: 'i18nParity',
  titre: 'Clés manquantes par locale (vs fr)',
  informatif: true,           // suivi, pas de cliquet : traduire prend du temps
  run() {
    const fr = clesLocale(lire('src/i18n/locales/fr.ts'));
    const detail = []; let total = 0;
    for (const loc of ['en', 'es', 'pt', 'ja']) {
      const src = lire(`src/i18n/locales/${loc}.ts`);
      if (!src) { detail.push(`${loc} : fichier absent`); continue; }
      const k = clesLocale(src);
      const manque = [...fr].filter(x => !k.has(x)).length;
      total += manque;
      const pct = fr.size ? Math.round((1 - manque / fr.size) * 100) : 0;
      detail.push(`${loc} : ${k.size} clés · ${manque} manquantes · ${pct}% de couverture`);
    }
    return { valeur: total, detail, extra: { reference: fr.size } };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// M4 — Risques responsive
// ─────────────────────────────────────────────────────────────────────────────
export const m4_responsive = {
  id: 'responsive',
  titre: 'Risques responsive',
  informatif: true,
  run(c) {
    let gridsFiges = 0, largeursFigees = 0, microTypo = 0, hScreenStrict = 0, minHScreen = 0;
    const tablesSansOverflow = [];
    const VARIANTE = /(?:sm|md|lg|xl|2xl):/;
    for (const [f, src] of c.contenu) {
      if (!f.endsWith('.tsx')) continue;
      for (const l of src.split('\n')) {
        if (/\bgrid-cols-[3-9]\b/.test(l) && !/(?:sm|md|lg|xl|2xl):grid-cols/.test(l)) gridsFiges++;
        if (/\b(?:w|min-w)-\[\d{3,4}px\]/.test(l) && !VARIANTE.test(l)) largeursFigees++;
        microTypo += (l.match(/text-\[(?:[4-9](?:\.\d)?|10|11)px\]/g) || []).length;
      }
      // PIÈGE : `h-screen` (hauteur IMPOSÉE) ≠ `min-h-screen` (plancher, bénin).
      // Les confondre avait fait passer le problème de 9 à 69 — surestimation ×7.
      hScreenStrict += (src.match(/(?:^|[^-])\bh-screen\b/g) || []).length;
      minHScreen += (src.match(/\bmin-h-screen\b/g) || []).length;
      if (/<table/.test(src) && !/overflow-x/.test(src)) tablesSansOverflow.push(c.rel(f));
    }
    return {
      valeur: gridsFiges + largeursFigees + tablesSansOverflow.length,
      detail: [
        `grilles à colonnes figées (sans variante) : ${gridsFiges}`,
        `largeurs px figées (sans variante)        : ${largeursFigees}`,
        `texte ≤ 11px en valeur arbitraire         : ${microTypo}`,
        `h-screen STRICT (hauteur imposée)         : ${hScreenStrict}`,
        `min-h-screen (plancher — bénin)           : ${minHScreen}`,
        `<table> sans conteneur overflow-x         : ${tablesSansOverflow.length}`,
        ...tablesSansOverflow.map(t => `   · ${t}`),
      ],
      extra: { gridsFiges, largeursFigees, microTypo, hScreenStrict, minHScreen, tablesSansOverflow: tablesSansOverflow.length },
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// M5 — Props handler rendues inertes (cf. INV-10)
// ─────────────────────────────────────────────────────────────────────────────
export const m5_inertProps = {
  id: 'inertProps',
  titre: 'Props handler inertes (onX: _onX)',
  run(c) {
    const detail = [];
    for (const [f, src] of c.contenu) {
      for (const m of src.matchAll(/\bon([A-Z]\w*)\s*:\s*_on\1\b/g)) detail.push(`${c.rel(f)} → on${m[1]}`);
    }
    return { valeur: detail.length, detail };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// M6 — Doublons et chaînes de code mort
// ─────────────────────────────────────────────────────────────────────────────
export const m6_duplicates = {
  id: 'duplicates',
  titre: 'Composants exportés sous un nom déjà pris',
  informatif: true,
  run(c) {
    // Un doublon est plus dangereux qu'un orphelin : on corrige le mauvais
    // fichier sans s'en apercevoir (cas vécu : 2× NexusFleetProvider).
    const parNom = new Map();
    for (const [f, src] of c.contenu) {
      if (!c.estComposantProduit(f)) continue;
      for (const m of src.matchAll(/export\s+(?:default\s+)?(?:async\s+)?function\s+([A-Z]\w+)|export\s+const\s+([A-Z]\w+)\s*[:=]/g)) {
        const n = m[1] || m[2];
        if (!parNom.has(n)) parNom.set(n, []);
        parNom.get(n).push(c.rel(f));
      }
    }
    const detail = [];
    for (const [n, fs] of parNom) if (fs.length > 1) detail.push(`${n} → ${fs.join('  |  ')}`);
    return { valeur: detail.length, detail: detail.sort() };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// M7 — Erreurs avalées et promesses flottantes
// ─────────────────────────────────────────────────────────────────────────────
export const m7_swallowed = {
  id: 'swallowedErrors',
  titre: 'Erreurs potentiellement avalées',
  informatif: true,
  run(c) {
    // La cause racine du gel machine était une promesse flottante : un appel
    // async sans .catch(), dont l'erreur ne remontait à personne.
    // NUANCE : certains catch vides sont légitimes (quota de stockage dépassé).
    // Cette mesure COMPTE, elle ne juge pas — le tri reste humain.
    let catchVides = 0, catchCommentes = 0;
    const flottantes = [];
    for (const [f, src] of c.contenu) {
      catchVides += (src.match(/catch\s*(?:\([^)]*\))?\s*\{\s*\}/g) || []).length;
      catchCommentes += (src.match(/catch\s*(?:\([^)]*\))?\s*\{\s*\/\*[^*]*\*\/\s*\}/g) || []).length;
      const lignes = src.split('\n');
      lignes.forEach((l, i) => {
        if (!/\.then\(/.test(l)) return;
        if (!/\.catch\(/.test(lignes.slice(i, i + 6).join('\n'))) flottantes.push(`${c.rel(f)}:${i + 1}`);
      });
    }
    return {
      valeur: catchVides + flottantes.length,
      detail: [
        `catch {} strictement vides            : ${catchVides}`,
        `catch à commentaire seul              : ${catchCommentes}`,
        `.then() sans .catch() (flottantes)    : ${flottantes.length}`,
        ...flottantes.slice(0, 20).map(x => `   · ${x}`),
      ],
      extra: { catchVides, catchCommentes, flottantes: flottantes.length },
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// M8 — Scellement non déterministe
// ─────────────────────────────────────────────────────────────────────────────
export const m8_seal = {
  id: 'nonCanonicalSeal',
  titre: 'Scellements non canoniques',
  run(c) {
    // JSON.stringify conserve l'ordre d'insertion : deux objets logiquement
    // identiques produisent deux hashes. CryptoService.canonicalStringify est
    // la convention (18 sites au 2026-08-26).
    const detail = [];
    for (const [f, src] of c.contenu) {
      const lignes = src.split('\n');
      lignes.forEach((l, i) => {
        if (!/JSON\.stringify/.test(l)) return;
        if (/\.(sign|hash)\s*\(/.test(lignes.slice(i, i + 4).join('\n'))) detail.push(`${c.rel(f)}:${i + 1}`);
      });
    }
    return { valeur: detail.length, detail };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// M9 — Métriques codées en dur à l'écran (cf. INV-13)
// ─────────────────────────────────────────────────────────────────────────────
export const m9_fakeMetrics = {
  id: 'fakeMetrics',
  titre: 'Métriques chiffrées codées en dur',
  run(c) {
    // L'utilisateur ne peut pas distinguer une donnée calculée d'une inventée.
    // EXCLUSIONS mesurées : <option> (taux de TVA : 0.10, 0.055, 0.20) et la
    // vitrine design-system (données de démonstration assumées). 0 faux positif.
    const detail = [];
    for (const [f, src] of c.contenu) {
      if (!f.endsWith('.tsx') || f.includes('design-system')) continue;
      src.split('\n').forEach((l, i) => {
        if (/<[Oo]ption/.test(l)) return;
        for (const m of l.matchAll(/value="([^"{]*\d[^"{]*)"/g)) {
          const v = m[1];
          if (/[%€$]|\bh\b|salari|couvert/.test(v) || /^\d+[.,]\d+$/.test(v)) {
            detail.push(`${c.rel(f)}:${i + 1} → "${v}"`);
          }
        }
      });
    }
    return { valeur: detail.length, detail };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// M10 — Empreinte disque et bundle
// ─────────────────────────────────────────────────────────────────────────────
function tailleDossier(p) {
  if (!existsSync(p)) return 0;
  let total = 0;
  (function walk(d) {
    for (const f of readdirSync(d)) {
      const q = join(d, f);
      try { const s = statSync(q); total += s.isDirectory() ? (walk(q), 0) : s.size; } catch { /* lien cassé */ }
    }
  })(p);
  return total;
}

export const m10_footprint = {
  id: 'footprint',
  titre: 'Empreinte disque',
  informatif: true,
  run() {
    // Le gel de la machine venait de là : 7,1 Go de cache Turbopack sur un
    // disque à 94 %. Sans RAM ni place pour le swap, macOS se fige.
    const mo = (o) => Math.round(o / 1048576);
    const cacheDev = tailleDossier(join(ROOT, '.next/dev/cache'));
    const chunks = tailleDossier(join(ROOT, '.next/static/chunks'));
    return {
      valeur: mo(cacheDev),
      detail: [
        `.next/dev/cache (cache Turbopack) : ${mo(cacheDev)} Mo`,
        `.next/static/chunks (bundle client) : ${mo(chunks)} Mo`,
        cacheDev > 3 * 1024 ** 3 ? '⚠️  cache > 3 Go — envisager `rm -rf .next`' : '',
      ].filter(Boolean),
      extra: { cacheDevMo: mo(cacheDev), bundleMo: mo(chunks) },
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// M11 — Adoption du design system
// ─────────────────────────────────────────────────────────────────────────────
const IMPORT_DS = /from\s+['"](@ui\/|@ui['"]|@\/shared\/components\/ui|@components\/ui)/;

function analyzeDsFile(f, src, c, state) {
  if (!f.endsWith('.tsx') || f.includes('/shared/components/ui/') || c.estBarrel(f)) return;

  state.boutonsBruts     += (src.match(/<button\b/g) || []).length;
  state.boutonsPrimitive += (src.match(/<Button\b/g) || []).length;
  state.champsBruts      += (src.match(/<input\b/g) || []).length;
  state.champsPrimitive  += (src.match(/<(?:Glass|Search|Premium)?(?:Input|Select|TimePicker)\b/g) || []).length;
  state.cartesMain       += (src.match(/className="[^"]*\brounded-(?:xl|2xl|lg)\b[^"]*\bbg-(?:white|surface)/g) || []).length;

  const fabrique = /<button\b|<input\b|rounded-(?:xl|2xl)/.test(src);
  if (fabrique && !IMPORT_DS.test(src)) state.detail.push(c.rel(f));
}

export const m11_dsAdoption = {
  id: 'dsAdoption',
  titre: 'Écrans hors du design system',
  run(c) {
    const state = { detail: [], boutonsBruts: 0, boutonsPrimitive: 0, champsBruts: 0, champsPrimitive: 0, cartesMain: 0 };
    for (const [f, src] of c.contenu) {
      analyzeDsFile(f, src, c, state);
    }
    return {
      valeur: state.detail.length,
      detail: state.detail.sort(),
      extra: state,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// M12 — Contrôles inaccessibles (3 familles étanches)
// ─────────────────────────────────────────────────────────────────────────────
function analyzeButtonAccessibleName(f, src, rel, muets) {
  for (const m of src.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const [, attrs, inner] = m;
    if (/aria-label|aria-labelledby|title=/.test(attrs)) continue;
    if (/\{t\(|\{\s*label|children/.test(inner)) continue;
    const texte = inner.replace(/<[^>]+>/g, '').replace(/\{[^{}]*\}/g, '').trim();
    if (!texte) muets.push(`${rel(f)} — bouton sans nom accessible`);
  }
}

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

function analyzeKeyboardAccessibility(f, src, rel, clavier) {
  for (const m of src.matchAll(/<(motion\.div|div)\b/g)) {
    const bal = baliseComplete(src, m.index);
    if (!/\bonClick(?:Capture)?=/.test(bal)) continue;
    if (/\bonKey(?:Down|Up|Press)=/.test(bal)) continue;
    if (/aria-hidden="true"/.test(bal)) continue;
    if (/role="(?:button|dialog|alertdialog|switch|tab|menuitem|link|option)"/.test(bal)) continue;
    clavier.push(`${rel(f)} — conteneur cliquable non focalisable`);
  }
}

function analyzeModalsSemantic(f, src, rel, modales) {
  if (/fixed inset-0/.test(src) && /Modal|Dialog|Drawer|Sheet/.test(basename(f))) {
    if (!/role="dialog"|role="alertdialog"/.test(src)) {
      modales.push(`${rel(f)} — overlay sans role dialog`);
    }
  }
}

export const m12a_a11yMuets = {
  id: 'a11yMuets',
  titre: 'Boutons sans nom accessible',
  run(c) {
    const muets = [];
    for (const [f, src] of c.contenu) {
      if (!f.endsWith('.tsx')) continue;
      analyzeButtonAccessibleName(f, src, c.rel, muets);
    }
    return { valeur: muets.length, detail: muets.sort() };
  },
};

export const m12b_a11yModales = {
  id: 'a11yModales',
  titre: 'Modales sans rôle sémantique',
  run(c) {
    const modales = [];
    for (const [f, src] of c.contenu) {
      if (!f.endsWith('.tsx')) continue;
      analyzeModalsSemantic(f, src, c.rel, modales);
    }
    return { valeur: modales.length, detail: modales.sort() };
  },
};

export const m12c_a11yKeyboard = {
  id: 'a11yKeyboard',
  titre: 'Conteneurs cliquables sans clavier',
  run(c) {
    const clavier = [];
    for (const [f, src] of c.contenu) {
      if (!f.endsWith('.tsx')) continue;
      analyzeKeyboardAccessibility(f, src, c.rel, clavier);
    }
    return { valeur: clavier.length, detail: clavier.sort() };
  },
};

export const MESURES = [
  m1_reachability, m2_settings, m3_i18n, m3b_i18nParite, m4_responsive,
  m5_inertProps, m6_duplicates, m7_swallowed, m8_seal, m9_fakeMetrics, m10_footprint,
  m11_dsAdoption, m12a_a11yMuets, m12b_a11yModales, m12c_a11yKeyboard,
];

