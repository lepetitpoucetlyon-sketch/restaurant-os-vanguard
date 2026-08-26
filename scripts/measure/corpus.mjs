/**
 * corpus.mjs — chargement UNIQUE de l'arbre source, partagé par toutes les mesures.
 *
 * Pourquoi : chaque mesure a besoin du même corpus. Le relire n fois coûte n×.
 * On le charge une fois, on le passe à toutes les mesures. C'est ce qui permet à
 * `npm run measure` de rester sous la seconde là où l'exploration manuelle
 * demandait des dizaines d'appels d'outils.
 *
 * Ce module est PUR : il lit, il n'écrit jamais.
 */
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, basename, relative } from 'node:path';

export const ROOT = process.cwd();
export const lire = (p) => (existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), 'utf8') : '');

/** Fichiers de convention Next.js : leur "consommateur" est le framework. */
export const CONVENTION_NEXT = new Set([
  'page.tsx', 'layout.tsx', 'template.tsx', 'error.tsx',
  'loading.tsx', 'not-found.tsx', 'global-error.tsx', 'route.ts',
]);

export function chargerCorpus(racine = 'src') {
  const fichiers = [];
  (function walk(dir) {
    if (!existsSync(dir)) return;
    for (const f of readdirSync(dir)) {
      if (f === 'node_modules' || f === '.next' || f === '.git') continue;
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.tsx?$/.test(p) && !p.includes('.test.') && !p.includes('.spec.')) fichiers.push(p);
    }
  })(join(ROOT, racine));

  const contenu = new Map();
  for (const f of fichiers) contenu.set(f, readFileSync(f, 'utf8'));

  return {
    contenu,
    fichiers,
    rel: (f) => relative(ROOT, f).replace(/\\/g, '/'),
    estConvention: (f) => CONVENTION_NEXT.has(basename(f)),
    estBarrel: (f) => basename(f) === 'index.ts',
    /** Composant "de produit" : dans modules/ ou shared/components/, hors convention Next. */
    estComposantProduit: (f) =>
      f.endsWith('.tsx') && !CONVENTION_NEXT.has(basename(f)) && /\/(modules|shared\/components)\//.test(f),
  };
}
