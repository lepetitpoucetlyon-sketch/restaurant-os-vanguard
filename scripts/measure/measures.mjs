import { HEX_OR_RGB_REGEX } from '../../eslint-plugins/no-hardcoded-hex.mjs';
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
/** Retire les lignes `import ... from ...` (et le corps des blocs `import {}`
 *  sur plusieurs lignes) avant l'analyse d'usage : un import inutilisé n'est
 *  PAS un consommateur du symbole. C'est le piège inverse du ré-export barrel
 *  (voir m1). Sans ce filtre, `npx eslint --fix` sur unused-imports fait chuter
 *  artificiellement le compteur (mesuré le 2026-08-30 : -14 sur dsAdoption). */
function stripImports(src) {
  return src.replace(/^\s*import\s+(?:type\s+)?[\s\S]*?\bfrom\s+['"][^'"]+['"];?\s*$/gm, '');
}
export const m1_reachability = {
  id: 'orphans',
  titre: 'Composants sans consommateur',
  run(c) {
    // PIÈGE : un ré-export de barrel (`export * from './X'`) N'EST PAS un usage.
    // La 1re version de cet audit traversait les barrels et annonçait 58 orphelins
    // au lieu de 88 — une sous-évaluation de 52 %.
    // PIÈGE 2 : un import inutilisé (`import { Button } from '@ui'` sans usage)
    // n'est PAS un consommateur non plus. `stripImports` retire les import lines
    // avant scan. Sinon la mesure devient fausse à chaque `npx eslint --fix`.
    const usagesParNom = new Map();
    for (const [f, src] of c.contenu) {
      if (c.estBarrel(f)) continue;
      const body = stripImports(src);
      for (const m of body.matchAll(/\b([A-Z]\w+)\b/g)) {
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
// PIÈGE : la 1re version ne reconnaissait que `@ui/*` et `@/shared/components/ui`,
// alors que la moitié du design system vit dans `@/shared/components/*` (PageShell,
// GlassCard, Modal, layout/*, dynamic/*, blueprint/*, etc.). Une page qui utilise
// PageShell + tokens `bg-surface-card` a une vraie adoption DS même sans importer
// depuis `ui/`. Reste flagué : une page qui fabrique du raw `<button>` sans importer
// aucune primitive shared/ (le vrai signe qu'elle rompt avec le design system).
const IMPORT_DS_LINE = /^\s*import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"](?:@ui\/[^'"]*|@ui|@\/shared\/components(?:\/[^'"]*)?|@components(?:\/[^'"]*)?)['"];?\s*$/gm;

/** Un import de DS ne prouve l'adoption QUE si au moins un symbole importé
 *  est effectivement référencé dans le corps du fichier. Un `import { Button }`
 *  jamais utilisé = mensonge d'adoption. Retire les lignes d'import avant
 *  test, puis cherche les symboles. Sinon `npx eslint --fix` masque la dette
 *  en supprimant les imports morts qui gonflaient artificiellement l'adoption. */
function adopteVraimentDs(src) {
  // Voie 1 : import + usage effectif d'une primitive shared/components/*
  const importedSymbols = new Set();
  for (const m of src.matchAll(IMPORT_DS_LINE)) {
    for (const raw of m[1].split(',')) {
      const name = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/i).pop().trim();
      if (name) importedSymbols.add(name);
    }
  }
  if (importedSymbols.size > 0) {
    const body = src.replace(IMPORT_DS_LINE, '');
    for (const sym of importedSymbols) {
      if (new RegExp(`\\b${sym}\\b`).test(body)) return true;
    }
  }
  // Voie 2 : usage de tokens sémantiques (bg-surface-*, text-brand-*,
  // border-border-*, text-status-*, etc.) — c'est de la conformité DS par tokens
  // sans importer de primitive. Seuil : ≥ 3 occurrences → adoption prouvée
  // (abaissé de 5→3 le 2026-08-30 : les petits composants qui varient 3 tokens
  // différents sans répéter comptent comme adoption légitime).
  const tokenPattern = /\b(?:bg-(?:surface|action|status|bg)-[\w-]+|text-brand[\w-]*|text-accent[\w-]*|text-text-[\w-]+|text-status-[\w-]+|text-on-[\w-]+|border-border-[\w-]+|border-accent[\w-]*|ring-focus[\w-]*|ring-accent[\w-]*|ring-amber-[\w-]+|bg-accent[\w-]*|text-accent-gold|border-amber-[\w-]+|bg-amber-[\w-]+|text-amber-[\w-]+)\b/g;
  const tokenHits = (src.match(tokenPattern) || []).length;
  if (tokenHits >= 3) return true;
  return false;
}

function analyzeDsFile(f, src, c, state) {
  if (!f.endsWith('.tsx') || f.includes('/shared/components/ui/') || c.estBarrel(f)) return;
  // Marketing pages : design de conversion volontairement distinct (glassmorphisme
  // dark, gradients aurés). Cible = prospects, pas gérants. Exclu du DS opérationnel
  // par décision produit — a son propre langage visuel documenté dans
  // src/app/(marketing)/design-tokens.ts (à créer si absent).
  if (/\/app\/\(marketing\)\//.test(f)) return;

  state.boutonsBruts     += (src.match(/<button\b/g) || []).length;
  state.boutonsPrimitive += (src.match(/<Button\b/g) || []).length;
  state.champsBruts      += (src.match(/<input\b/g) || []).length;
  state.champsPrimitive  += (src.match(/<(?:Glass|Search|Premium)?(?:Input|Select|TimePicker)\b/g) || []).length;
  state.cartesMain       += (src.match(/className="[^"]*\brounded-(?:xl|2xl|lg)\b[^"]*\bbg-(?:white|surface)/g) || []).length;

  const fabrique = /<button\b|<input\b|rounded-(?:xl|2xl)/.test(src);
  if (fabrique && !adopteVraimentDs(src)) state.detail.push(c.rel(f));
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
    // PIÈGE 1 : `{isXxx ? 'texte' : 'autre'}` → texte visible mais l'ancienne
    // regex `\{[^{}]*\}` supprimait tout le bloc → faux positif. On extrait
    // les string-literals avant de stripper les braces.
    // PIÈGE 2 : `<span>{action}</span>` où `action` est une variable de .map()
    // ou une prop porte du texte à runtime. Détecté par `{IDENTIFIER}` seul.
    let texte = inner.replace(/<[^>]+>/g, '');
    // Extraire toutes les string-literals ('...' ou "..." ou `...`) hors bindings
    const literals = [];
    for (const lit of texte.matchAll(/(['"`])((?:(?!\1)[^\\]|\\.)*?)\1/g)) {
      const val = lit[2].trim();
      if (val && !/^(px|em|rem|%|#[0-9a-f]+|https?:|\/[a-z])/i.test(val)) literals.push(val);
    }
    // Détecter les bindings simples `{identifier}` ou `{obj.prop}` ou `{fn()}`
    // qui portent du contenu textuel dynamique. Exclut les className/style patterns.
    const bindings = [...texte.matchAll(/\{\s*([a-zA-Z_$][\w.$]*)\s*(\([^)]*\))?\s*\}/g)]
      .map((mm) => mm[1])
      .filter((id) => !/^(className|style|key|ref|onClick|onKeyDown|type|disabled|_)/i.test(id));
    // Strip braces (récursif — {a {b} c} → strip inner puis outer)
    let prev;
    do { prev = texte; texte = texte.replace(/\{[^{}]*\}/g, ''); } while (texte !== prev);
    texte = texte.trim();
    if (!texte && literals.length === 0 && bindings.length === 0) {
      muets.push(`${rel(f)} — bouton sans nom accessible`);
    }
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

export const m13_verticalStubs = {
  id: 'verticalStubs',
  titre: 'Écrans de verticale rendus par VerticalPageStub',
  // Détecte les composants sous src/verticals/ (hors _shared) dont le rendu
  // n'est qu'un appel à VerticalPageStub. Une route déclarée dans un blueprint
  // qui résout vers un stub = promesse affichée sans mécanisme (Loi 8).
  run(c) {
    const stubs = [];
    for (const [f, src] of c.contenu) {
      const rel = c.rel(f);
      if (!rel.startsWith('src/verticals/')) continue;
      if (rel.includes('/_shared/')) continue;
      if (!rel.endsWith('.tsx') && !rel.endsWith('.ts')) continue;
      // Match : le fichier importe VerticalPageStub ET son export principal l'invoque
      if (!/from ['"][^'"]*VerticalPageStub['"]/.test(src)) continue;
      if (!/VerticalPageStub\s*\(/.test(src)) continue;
      stubs.push(rel);
    }
    return { valeur: stubs.length, detail: stubs.sort() };
  },
};

export const m15_verticalScreensUnwired = {
  id: 'verticalScreensUnwired',
  titre: 'Écrans de verticale non câblés (UI sans accès données)',
  // Angle mort de m13 : remplacer un VerticalPageStub par une maquette à données
  // locales (`const INITIAL_ROOMS = [...]` + useState) fait passer m13 à 0 SANS
  // rien livrer. L'écran s'affiche, il est joli, et il oublie tout au rafraîchissement.
  //
  // Un écran est CÂBLÉ s'il lit ou écrit par un canal légitime (ADR-015) :
  //   - Nexus.adapter          accès données direct
  //   - useSovereign*          hooks de collection souveraine
  //   - NexusEventBus / emit   effets de bord
  //   - un adapter de sa verticale (<Vertical><Pilier>Adapter)
  //   - un service de domaine de sa verticale (`../domain/XxxService`), qui porte
  //     lui-même l'accès Nexus — délégation légitime, pas un contournement
  //
  // `useTenant()` NE COMPTE PAS : c'est un contexte, pas une source de données.
  //
  // ⚠️ La 1re version de cette mesure ignorait la délégation à un service de domaine
  // et rendait 8 faux positifs (coworking, florist, gym, veterinary — tous corrects).
  // Une mesure qui accuse du code sain est aussi nuisible qu'une mesure aveugle.
  run(c) {
    const nonCables = [];
    for (const [f, src] of c.contenu) {
      const rel = c.rel(f);
      if (!rel.startsWith('src/verticals/')) continue;
      if (rel.includes('/_shared/')) continue;
      if (!rel.endsWith('.tsx')) continue;
      // Un écran = un composant qui rend du JSX et porte de l'état ou une interaction.
      if (!/useState\s*[<(]|onClick=|onSubmit=/.test(src)) continue;
      const cable =
        /Nexus\.adapter|useSovereign[A-Z]|NexusEventBus|emitDurable\s*\(/.test(src)
        || /[A-Z][a-zA-Z]*(?:Ops|Finance|Commerce|Logistics|Human|Compliance|Facility|Intelligence|Mcc)Adapter\b/.test(src)
        || /from ['"]\.\.?\/[^'"]*domain\/[A-Z][a-zA-Z]*Service['"]/.test(src)
        // Un service de pilier consommé par le barrel (`menuEngineeringService` depuis
        // @/modules/commerce) porte lui aussi l'accès Nexus : c'est le canal ADR-015.
        || /\b[a-z][a-zA-Z]*Service\s*\n?\s*\.\s*\w|\b[A-Z][a-zA-Z]*Service\.\w/.test(src);
      if (!cable) nonCables.push(rel);
    }
    return { valeur: nonCables.length, detail: nonCables.sort() };
  },
};

export const m14_frHardcoded = {
  id: 'frHardcoded',
  titre: 'Chaînes françaises en dur dans le JSX (hors legal & verticals)',
  // Compte les nœuds texte JSX contenant un accent français dans les fichiers .tsx
  // client, hors src/verticals (couvert par m13), hors legal/rgpd/cgv/cgu/dpa
  // (obligation réglementaire de rester en FR), hors design-system (galerie interne).
  // Chaque occurrence est un candidat à t() → maintenir descendant en priorité
  // sur l'onboarding et les écrans opérationnels.
  run(c) {
    const skip = /(?:src\/verticals\/|\/legal\/|\/rgpd\/|\/cgv\/|\/cgu\/|\/mentions\/|\/dpa\/|\/design-system\/|WidgetSamples|VerticalPageStub)/;
    const re = />[^<>{}\n]*[éèêàçùôûîïâœÉÈÊÀÇ][^<>{}\n]*</g;
    const hits = [];
    for (const [f, src] of c.contenu) {
      const rel = c.rel(f);
      if (!rel.endsWith('.tsx')) continue;
      if (skip.test(rel)) continue;
      const n = (src.match(re) || []).length;
      if (n > 0) hits.push(rel + ' (' + n + ')');
    }
    return { valeur: hits.reduce((s, h) => s + Number(h.match(/\((\d+)\)$/)?.[1] || 0), 0), detail: hits.sort() };
  },
};

export const m16_hardcodedHex = {
  id: 'hardcodedHex',
  titre: 'Couleurs #hex et rgba() en dur (hors tokens & marketing)',
  // Protège la personnalisation tenant MCC (DESIGNUP §1 & §4.2)
  // Bloque les couleurs littérales dans les classes CSS, styles et props JSX.
  run(c) {
    const whitelist = /(?:globals\.css$|\/tokens\/|\/blueprints\/|\/verticals\/[^/]+\/ui\.ts$|\/app\/\(marketing\)\/|\/app\/\(client\)\/\(public\)\/|\.test\.[tj]sx?$|\/__tests__\/|\/tests\/|\/e2e\/)/;
    // Le motif vient du LINT (source unique) : la mesure et la gate doivent dire
    // la même chose. Avant, m16 ne comptait que `#hex` — les `rgba()` passaient au
    // travers, et purger l'or n'y changeait rien.
    const re = new RegExp(HEX_OR_RGB_REGEX.source, 'g');
    const hits = [];
    for (const [f, src] of c.contenu) {
      const rel = c.rel(f);
      if (!/\.(tsx|ts|jsx|js)$/.test(rel)) continue;
      if (whitelist.test(rel)) continue;
      const lines = src.split('\n');
      let countInFile = 0;
      lines.forEach((l) => {
        const trimmed = l.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
        const matches = l.match(re);
        if (matches) countInFile += matches.length;
      });
      if (countInFile > 0) hits.push(rel + ' (' + countInFile + ')');
    }
    return { valeur: hits.reduce((s, h) => s + Number(h.match(/\((\d+)\)$/)?.[1] || 0), 0), detail: hits.sort() };
  },
};

export const MESURES = [
  m1_reachability, m2_settings, m3_i18n, m3b_i18nParite, m4_responsive,
  m5_inertProps, m6_duplicates, m7_swallowed, m8_seal, m9_fakeMetrics, m10_footprint,
  m11_dsAdoption, m12a_a11yMuets, m12b_a11yModales, m12c_a11yKeyboard,
  m13_verticalStubs, m14_frHardcoded, m15_verticalScreensUnwired, m16_hardcodedHex,
];

