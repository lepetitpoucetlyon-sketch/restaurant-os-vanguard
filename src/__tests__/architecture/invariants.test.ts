/**
 * 🏛️ INVARIANTS ARCHITECTURAUX & ZERO-CLAIM POLICY
 *
 * Ce fichier de tests verrouille les invariants système majeurs du projet.
 * Toute régression structurelle ou affirmation documentaire fausse fera échouer cette suite.
 *
 * Invariants couverts :
 * - INV-1 : Agnosticisme LLM (aucun SDK direct dans src/)
 * - INV-2 : Agnosticisme DB (Firestore confiné à la couche adapters)
 * - INV-3 : Ratchet de couplage Auth (maximum 17 fichiers couplés Firebase Auth)
 * - INV-8 : Conformité Documentation ↔ Structure réelle (8 piliers, 17 ADRs, 12 variantes)
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PLATFORM_VARIANTS } from '@/modules/system/domain/schemas/tenant';

const ROOT = path.resolve(__dirname, '../../..');

function walk(dir: string, filter: (filePath: string) => boolean): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        results = results.concat(walk(filePath, filter));
      }
    } else if (filter(filePath)) {
      results.push(filePath);
    }
  }
  return results;
}

function getSrcFiles(exts = ['.ts', '.tsx']): string[] {
  return walk(path.join(ROOT, 'src'), (fp) => exts.some(e => fp.endsWith(e)));
}

describe('🏛️ Invariants Architecturaux (Zero-Claim Policy)', () => {

  describe('INV-1 — Agnosticisme LLM', () => {
    it('aucun SDK LLM tiers n’est importé directement dans src/ (tout passe par AIProviderRouter)', () => {
      const srcFiles = getSrcFiles().filter(f => !f.includes('__tests__') && !f.endsWith('.test.ts') && !f.endsWith('.spec.ts'));
      const bannedSdkRegex = /from\s+['"](@anthropic-ai\/sdk|openai|@google\/generative-ai|mistralai)['"]|import\s+['"](@anthropic-ai\/sdk|openai|@google\/generative-ai|mistralai)['"]/;

      const violations: string[] = [];
      for (const file of srcFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        if (bannedSdkRegex.test(content)) {
          violations.push(path.relative(ROOT, file));
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('INV-2 — Agnosticisme Base de Données', () => {
    it('Firestore reste confiné strictement aux fichiers d’adapters et d’initialisation', () => {
      const srcFiles = getSrcFiles().filter(f => !f.includes('__tests__') && !f.endsWith('.test.ts') && !f.endsWith('.spec.ts'));
      const allowedFiles = [
        'src/lib/firebase.ts',
        'src/lib/adapters/FirestoreAdapter.ts',
        'src/lib/adapters/FirestoreBatch.ts',
        'src/lib/adapters/FirestoreDocumentStore.ts',
        'src/e2e/vanguard/mocks.ts',
      ];

      const violations: string[] = [];
      for (const file of srcFiles) {
        const rel = path.relative(ROOT, file).replace(/\\/g, '/');
        if (allowedFiles.includes(rel)) continue;
        const content = fs.readFileSync(file, 'utf-8');
        if (/from\s+['"]firebase\/firestore['"]/.test(content)) {
          violations.push(rel);
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('INV-3 — Ratchet de Couplage Auth', () => {
    it('le nombre de fichiers sources couplés à Firebase Auth ne dépasse pas le seuil de 17', () => {
      const srcFiles = getSrcFiles().filter(f => !f.includes('__tests__') && !f.endsWith('.test.ts') && !f.endsWith('.spec.ts'));
      const authFiles: string[] = [];

      for (const file of srcFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        if (/from\s+['"]firebase(-admin)?\/(auth|app)['"]|getAuth|initFirebaseAdmin/.test(content)) {
          authFiles.push(path.relative(ROOT, file).replace(/\\/g, '/'));
        }
      }

      // Ratchet bloquant : max 17 fichiers
      expect(authFiles.length).toBeLessThanOrEqual(17);
    });
  });

  describe('INV-8 — Synchronisation Structure ↔ Documentation', () => {
    it('les 8 piliers métier existent sous src/modules/', () => {
      const EXPECTED_PILLARS = [
        'commerce',
        'compliance',
        'facility',
        'finance',
        'human',
        'intelligence',
        'logistics',
        'ops',
      ];

      const modulesDir = path.join(ROOT, 'src/modules');
      const existingDirs = fs.readdirSync(modulesDir).filter(f => fs.statSync(path.join(modulesDir, f)).isDirectory());

      for (const pillar of EXPECTED_PILLARS) {
        expect(existingDirs).toContain(pillar);
      }
    });

    it('les 17 ADRs documentés existent sous docs/adrs/', () => {
      const adrsDir = path.join(ROOT, 'docs/adrs');
      const existingAdrs = fs.readdirSync(adrsDir).filter(f => f.startsWith('ADR-') && f.endsWith('.md'));

      expect(existingAdrs.length).toBe(17);
      for (let i = 1; i <= 17; i++) {
        const prefix = `ADR-${String(i).padStart(3, '0')}`;
        const match = existingAdrs.find(a => a.startsWith(prefix));
        expect(match, `ADR ${prefix} manquant`).toBeDefined();
      }
    });

    it('les 12 variantes du schéma PLATFORM_VARIANTS correspondent exactement aux dossiers dans src/verticals/', () => {
      const verticalsDir = path.join(ROOT, 'src/verticals');
      const existingVerticals = fs.readdirSync(verticalsDir)
        .filter(f => f !== '_shared' && fs.statSync(path.join(verticalsDir, f)).isDirectory());

      expect(existingVerticals.sort()).toEqual([...PLATFORM_VARIANTS].sort());
      expect(PLATFORM_VARIANTS.length).toBe(12);
    });

    it('les fichiers clés documentés dans CLAUDE.md existent sur disque', () => {
      const KEY_FILES = [
        'src/modules/finance/comptabilite/FinancialNexusBridge.ts',
        'src/modules/finance/fiscalite/FiscalAdapter.ts',
        'src/modules/ops/domain/schemas/pos.ts',
        'src/modules/finance/domain/schemas/finance.ts',
        'src/lib/nexus/NexusAdapter.ts',
        'src/modules/finance/providers/NexusFiscalProvider.tsx',
        'src/modules/intelligence/knowledge/rag/HermesKnowledgeManager.ts',
        'src/modules/intelligence/knowledge/rag/LightRAGClient.ts',
      ];

      for (const file of KEY_FILES) {
        expect(fs.existsSync(path.join(ROOT, file)), `Fichier clé manquant : ${file}`).toBe(true);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INV-9 — Instance Jotai unique dans le bundle CLIENT
  //
  // Contexte : `next build` émet « Detected multiple Jotai instances ». Mesuré le
  // 2026-08-25, l'avertissement provient du graphe SERVEUR (12 fichiers sous
  // .next/server/ tirent jotai, car les fichiers d'atomes — *.atom.ts, *Atoms.ts,
  // guards, services — n'ont pas de directive 'use client' et sont donc inclus dans
  // les deux graphes lors du prerendering SSG).
  //
  // Le bundle CLIENT, lui, n'en contient qu'une copie — c'est le seul qui compte :
  // l'app n'utilise aucun <Provider> ni createStore(), elle repose sur le store par
  // défaut implicite. Deux instances côté navigateur signifieraient deux stores, donc
  // un panier POS qui se dédouble silencieusement.
  //
  // Ce test verrouille la mesure : si un jour le client se retrouve avec deux copies,
  // il échoue au lieu de laisser passer un bug d'état invisible.
  // ──────────────────────────────────────────────────────────────────────────
  describe('INV-9 — Store Jotai unique côté client', () => {
    const CHUNKS_DIR = path.join(ROOT, '.next/static/chunks');
    const JOTAI_GUARD = 'Detected multiple Jotai instances';

    const countChunksWithJotai = (dir: string): number => {
      let count = 0;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          count += countChunksWithJotai(full);
        } else if (entry.name.endsWith('.js')) {
          if (fs.readFileSync(full, 'utf8').includes(JOTAI_GUARD)) count++;
        }
      }
      return count;
    };

    it('le bundle client ne contient qu\'une seule copie de Jotai', () => {
      if (!fs.existsSync(CHUNKS_DIR)) {
        // Pas de build disponible (tests lancés sans `npm run build`).
        // On ne fabrique pas un faux succès : on signale que l'invariant n'a pas pu être vérifié.
        console.warn('[INV-9] .next/static/chunks absent — invariant non vérifié (lancer `npm run build`)');
        return;
      }

      const copies = countChunksWithJotai(CHUNKS_DIR);
      expect(
        copies,
        `${copies} chunks client embarquent Jotai. Attendu : 1. ` +
        'Plusieurs copies = plusieurs stores par défaut = état POS dédoublé.',
      ).toBeLessThanOrEqual(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // INV-10 — Handlers déclarés mais inertes
  //
  // Classe de bug indétectable par tsc, vitest et next build : du code
  // parfaitement valide qui ne fait rien. Constatée trois fois sur ce dépôt :
  //   - `setIsMap3DOpen={() => {}}` dans DesktopSidebar → « Cartographie 3D »
  //     sans effet, et Map3DOverlay jamais monté ;
  //   - `onSplitBill: _onSplitBill` dans Cart → partage d'addition
  //     inatteignable, alors que SplitBillDialog et un réglage « Addition
  //     divisée » existaient ;
  //   - `_splitBillEnabled` : réglage lu puis ignoré.
  //
  // Le préfixe `_` signale un paramètre volontairement inutilisé. L'appliquer à
  // une prop de type handler revient à débrancher silencieusement une
  // fonctionnalité tout en gardant l'API intacte.
  // ────────────────────────────────────────────────────────────────────────
  describe('INV-10 — Aucun handler déclaré puis rendu inerte', () => {

    /**
     * Exceptions connues et ASSUMÉES — chacune doit porter une raison et une issue.
     * Ce n'est pas une échappatoire : une entrée ici est une dette visible, testée,
     * qui échouera dès que quelqu'un la retire du code sans la retirer d'ici.
     */
    const EXCEPTIONS_ASSUMEES: Record<string, string> = {
      'src/modules/ops/service/pos/components/Cart.tsx:onClearCart':
        'Vider un panier détruit une commande en cours : le geste attendu ' +
        '(confirmation ? validation manager ? passage par VoidModal ?) est un ' +
        'arbitrage produit non tranché. Le libellé "clear_cart" et le handler ' +
        'handleClearCart existent déjà ; seul le bouton reste à décider. ' +
        'handleClearCart est par ailleurs bien appelé en interne après encaissement ' +
        '(usePos.ts), donc le panier se vide en fin de vente.',
    };

    it('aucune prop `on<Action>` n’est déstructurée en `_on<Action>` (handler débranché)', () => {
      const coupables: string[] = [];
      for (const fp of getSrcFiles(['.tsx'])) {
        if (fp.includes('.test.')) continue;
        const src = fs.readFileSync(fp, 'utf-8');
        for (const m of src.matchAll(/\bon([A-Z]\w*)\s*:\s*_on\1\b/g)) {
          const cle = `${path.relative(ROOT, fp)}:on${m[1]}`;
          if (cle in EXCEPTIONS_ASSUMEES) continue;
          coupables.push(`${path.relative(ROOT, fp)} → on${m[1]} déstructuré en _on${m[1]}`);
        }
      }
      expect(
        coupables,
        'Prop handler déclarée dans l’interface puis marquée inutilisée : le parent ' +
        'croit brancher une action, l’enfant ne l’appelle jamais. Soit on câble le ' +
        'handler, soit on retire la prop de l’interface — mais pas d’entre-deux ' +
        'silencieux.\n' + coupables.join('\n'),
      ).toEqual([]);
    });

    it('le partage d’addition reste câblé de bout en bout (POS bureau et mobile)', () => {
      const cart = fs.readFileSync(
        path.join(ROOT, 'src/modules/ops/service/pos/components/Cart.tsx'), 'utf-8');
      expect(cart, 'Cart doit invoquer onSplitBill, sinon SplitBillDialog est inatteignable')
        .toMatch(/onClick=\{onSplitBill\}/);
      expect(cart, 'le réglage split_bill_enabled doit piloter l’affichage du bouton')
        .toMatch(/splitBillEnabled\s*&&/);

      for (const page of ['src/app/(client)/(ops)/pos/page.tsx',
                          'src/app/(client)/(ops)/pos-mobile/page.tsx']) {
        const src = fs.readFileSync(path.join(ROOT, page), 'utf-8');
        expect(src, `${page} doit passer un vrai handler à onSplitBill`)
          .toMatch(/onSplitBill=\{\(\)\s*=>\s*\{[^}]*setIsSplitOpen\(true\)/);
        expect(src, `${page} doit monter SplitBillDialog`)
          .toMatch(/<SplitBillDialog/);
      }
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // INV-11 / 12 / 13 — Le dernier kilomètre (AGENTS.md Loi 8)
  //
  // Les gates historiques valident la FORME du code. Ces trois-là valident sa
  // DESTINATION : un scellement reproductible, une gate qu'on ne peut pas
  // retirer, et des tableaux de bord qui ne racontent pas d'histoires.
  // ────────────────────────────────────────────────────────────────────────
  describe('INV-11 — Scellement déterministe', () => {
    it('aucun JSON.stringify ne précède un sign() ou un hash()', () => {
      // JSON.stringify conserve l'ordre d'insertion des clés : deux objets
      // logiquement identiques peuvent produire deux hashes différents, et une
      // signature archivée en WORM ne se revérifie plus.
      // CryptoService.canonicalStringify est la convention (18 sites).
      const MAX = 1; // ProcurementBridge.ts — corrigé au lot 1 du plan, puis 0.
      const coupables: string[] = [];
      for (const fp of getSrcFiles(['.ts', '.tsx'])) {
        if (fp.includes('.test.')) continue;
        const lignes = fs.readFileSync(fp, 'utf-8').split('\n');
        lignes.forEach((l, i) => {
          if (!/JSON\.stringify/.test(l)) return;
          if (/\.(sign|hash)\s*\(/.test(lignes.slice(i, i + 4).join('\n'))) {
            coupables.push(`${path.relative(ROOT, fp)}:${i + 1}`);
          }
        });
      }
      expect(
        coupables.length,
        `Scellement non déterministe — utiliser CryptoService.canonicalStringify :\n${coupables.join('\n')}`,
      ).toBeLessThanOrEqual(MAX);
    });
  });

  describe('INV-12 — La Gate 6 ne peut pas disparaître', () => {
    it('le contrôle du dernier kilomètre est branché dans le hook et dans preflight', () => {
      expect(fs.existsSync(path.join(ROOT, 'scripts/check-last-mile.mjs')),
        'scripts/check-last-mile.mjs a été supprimé').toBe(true);
      const hook = fs.readFileSync(path.join(ROOT, '.githooks/pre-commit'), 'utf-8');
      expect(hook, 'Gate 6 retirée du hook pre-commit').toContain('check-last-mile.mjs');
      const pf = fs.readFileSync(path.join(ROOT, 'scripts/preflight.sh'), 'utf-8');
      expect(pf, 'Gate 6 retirée de preflight.sh').toContain('check-last-mile.mjs');
      for (const seuil of ['ORPHAN_COMPONENTS_MAX', 'UNREAD_SETTINGS_MAX',
                           'MISSING_I18N_KEYS_MAX', 'INERT_HANDLER_PROPS_MAX',
                           'NON_CANONICAL_SEAL_MAX']) {
        expect(pf, `Ratchet ${seuil} supprimé de preflight.sh`).toContain(seuil);
      }
    });
  });

  describe('INV-13 — Pas de métrique fabriquée à l’écran', () => {
    it('aucune valeur chiffrée avec unité n’est codée en dur dans un composant', () => {
      // Ce que ça attrape : value="14.5" (solde de congés), value="€ 142.50"
      // (pourboires), value="+1.4%" (marge). L'utilisateur ne peut pas
      // distinguer une donnée calculée d'une donnée inventée.
      // Exclus : <option> (valeurs de formulaire, ex. taux de TVA) et la vitrine
      // du design system (données de démonstration assumées).
      const MAX = 10; // mesuré le 2026-08-26 — ne doit que descendre
      const coupables: string[] = [];
      for (const fp of getSrcFiles(['.tsx'])) {
        if (fp.includes('.test.') || fp.includes('design-system')) continue;
        const lignes = fs.readFileSync(fp, 'utf-8').split('\n');
        lignes.forEach((l, i) => {
          if (/<[Oo]ption/.test(l)) return;
          for (const m of l.matchAll(/value="([^"{]*\d[^"{]*)"/g)) {
            const v = m[1];
            if (/[%€$]|\bh\b|salari|couvert/.test(v) || /^\d+[.,]\d+$/.test(v)) {
              coupables.push(`${path.relative(ROOT, fp)}:${i + 1} → "${v}"`);
            }
          }
        });
      }
      expect(
        coupables.length,
        `Métriques codées en dur (brancher sur les vraies données) :\n${coupables.join('\n')}`,
      ).toBeLessThanOrEqual(MAX);
    });
  });

  describe('INV-14 — Ratchet de surfaces sombres en dur (Thème Unifié)', () => {
    it('le nombre de surfaces sombres en dur ne dépasse pas le ratchet mesuré du jour', () => {
      const RATCHET_MAX = 125; // Mesuré à 121 le 2026-08-26 après migration Lots 0-3 complète (Loi 7 Zero-Claim)
      const pattern = /(bg-black|bg-\[#0[0-9a-fA-F]{5}\]|bg-(gray|neutral|zinc|slate)-9(00|50)|bg-surface-sidebar)/g;
      let count = 0;
      for (const fp of getSrcFiles(['.tsx'])) {
        if (fp.includes('.test.') || fp.includes('__tests__')) continue;
        const content = fs.readFileSync(fp, 'utf-8');
        const matches = content.match(pattern);
        if (matches) count += matches.length;
      }
      expect(
        count,
        `Dette de surfaces sombres en dur augmentée : ${count} > ${RATCHET_MAX}`
      ).toBeLessThanOrEqual(RATCHET_MAX);
    });
  });

  describe('INV-15 — Souveraineté de globals.css sur les surfaces (Option B)', () => {
    it('BrandingProvider n’injecte aucun token de surface neutre dans le style inline', () => {
      const src = fs.readFileSync(path.join(ROOT, 'src/lib/BrandingProvider.tsx'), 'utf-8');
      expect(src, 'BrandingProvider doit utiliser generateBrandCSSVariables').toContain('generateBrandCSSVariables');
      expect(src, 'BrandingProvider ne doit pas appeler generateCSSVariables').not.toMatch(/generateCSSVariables\(/);
      expect(src, 'BrandingProvider doit purger les variables neutres').toContain('NEUTRAL_CSS_VARS_TO_PURGE');
    });

    it('generateBrandCSSVariables n’émet aucun token de surface neutre ni de texte primaire', async () => {
      const { generateBrandCSSVariables } = await import('@/shared/nexus/tokens/semantic');
      const vars = generateBrandCSSVariables();
      expect(vars['--surface-bg']).toBeUndefined();
      expect(vars['--surface-card']).toBeUndefined();
      expect(vars['--surface-modal']).toBeUndefined();
      expect(vars['--surface-sidebar']).toBeUndefined();
      expect(vars['--text-primary']).toBeUndefined();
      expect(vars['--border-default']).toBeUndefined();
      expect(vars['--action-primary']).toBeDefined();
    });
  });

  describe('INV-16 — Cliquet zones tactiles (WCAG 2.5.5 / Apple HIG 44px min)', () => {
    it('le nombre de cibles tactiles sous le seuil (32px) ne dépasse pas le ratchet mesuré', () => {
      const RATCHET_MAX = 204; // Mesuré le 2026-08-26 (Loi 7 Zero-Claim)
      const pattern = /\bw-8 h-8\b|\bh-8 w-8\b/g;
      let count = 0;
      for (const fp of getSrcFiles(['.tsx'])) {
        if (fp.includes('.test.') || fp.includes('__tests__')) continue;
        const content = fs.readFileSync(fp, 'utf-8');
        const matches = content.match(pattern);
        if (matches) count += matches.length;
      }
      expect(
        count,
        `Dette de zones tactiles sous 44px augmentée : ${count} > ${RATCHET_MAX}`
      ).toBeLessThanOrEqual(RATCHET_MAX);
    });
  });

  describe('INV-17 — Méta-garde PWA (Installation & Service Worker)', () => {
    it('InstallPrompt est monté dans la coque applicative LayoutResolver', () => {
      const src = fs.readFileSync(path.join(ROOT, 'src/shared/components/layout/LayoutResolver.tsx'), 'utf-8');
      expect(src, 'InstallPrompt doit être importé et monté dans LayoutResolver').toContain('<InstallPrompt');
    });

    it('ServiceWorkerRegistration est monté dans le layout racine', () => {
      const src = fs.readFileSync(path.join(ROOT, 'src/app/layout.tsx'), 'utf-8');
      expect(src, 'ServiceWorkerRegistration doit être monté dans RootLayout').toContain('<ServiceWorkerRegistration');
    });
  });

  describe('INV-18 — Safe-Area & Viewport Accessibilité (WCAG 1.4.4)', () => {
    it('globals.css définit les utilitaires pb-safe, pt-safe et touch-target', () => {
      const css = fs.readFileSync(path.join(ROOT, 'src/app/globals.css'), 'utf-8');
      expect(css).toContain('pb-safe');
      expect(css).toContain('pt-safe');
      expect(css).toContain('touch-target');
      expect(css).toContain('safe-area-inset-bottom');
    });

    it('les composants ancrés en bas supportent la safe-area iOS', () => {
      const bottomSheet = fs.readFileSync(path.join(ROOT, 'src/shared/components/ui/BottomSheet.tsx'), 'utf-8');
      const actionBar = fs.readFileSync(path.join(ROOT, 'src/shared/components/ui/ActionBar.tsx'), 'utf-8');
      const modal = fs.readFileSync(path.join(ROOT, 'src/shared/components/ui/Modal.tsx'), 'utf-8');

      expect(bottomSheet, 'BottomSheet doit supporter pb-safe').toContain('pb-safe');
      expect(actionBar, 'ActionBar doit supporter safe-area-inset-bottom').toContain('safe-area-inset-bottom');
      expect(modal, 'Modal doit supporter pb-safe').toContain('pb-safe');
    });

    it('RootLayout préserve viewportFit: "cover" et ne bloque jamais le zoom utilisateur', () => {
      const layoutSrc = fs.readFileSync(path.join(ROOT, 'src/app/layout.tsx'), 'utf-8');
      expect(layoutSrc).toContain('viewportFit: "cover"');
      const strippedSrc = layoutSrc.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      expect(strippedSrc, 'Interdiction de bloquer le zoom (WCAG 1.4.4)').not.toMatch(/maximumScale/);
      expect(strippedSrc, 'Interdiction de userScalable: false (WCAG 1.4.4)').not.toMatch(/userScalable/);
    });
  });

  describe('INV-19 — Méta-Garde DataView & EmptyState (Angles Morts)', () => {
    it('DataView et EmptyState sont exportés dans le barrel UI', () => {
      const uiIndex = fs.readFileSync(path.join(ROOT, 'src/shared/components/ui/index.ts'), 'utf-8');
      expect(uiIndex).toContain('./DataView');
      expect(uiIndex).toContain('./EmptyState');
    });

    it('ProductGrid POS et KdsTab intègrent la gestion des listes vides', () => {
      const productGrid = fs.readFileSync(path.join(ROOT, 'src/modules/ops/service/pos/components/ProductGrid.tsx'), 'utf-8');
      const kdsTab = fs.readFileSync(path.join(ROOT, 'src/modules/ops/service/pos/components/bar/KdsTab.tsx'), 'utf-8');

      expect(productGrid).toContain('EmptyState');
      expect(kdsTab).toContain('EmptyState');
    });
  });

  describe('INV-20 — Méta-Garde Temporal & Fiscal Timezone', () => {
    it('fiscalDate.ts existe et expose les fonctions canoniques de journée fiscale', () => {
      const fiscalSrc = fs.readFileSync(path.join(ROOT, 'src/lib/temporal/fiscalDate.ts'), 'utf-8');
      expect(fiscalSrc).toContain('export function fiscalNow');
      expect(fiscalSrc).toContain('export function fiscalDayOf');
      expect(fiscalSrc).toContain('export function isNightService');
      expect(fiscalSrc).toContain('export function formatFiscalTimestamp');
    });
  });

  describe('INV-21 — Garde Anti-Perte de Saisie', () => {
    it('useUnsavedChanges est exporté dans le barrel shared/hooks', () => {
      const hooksIndex = fs.readFileSync(path.join(ROOT, 'src/shared/hooks/index.ts'), 'utf-8');
      expect(hooksIndex).toContain('useUnsavedChanges');
    });
  });

  describe('INV-22 — Accessibilité & ActionGuard Explicite', () => {
    it('ActionGuard supporte le mode disabledMode="disable" avec tooltip pour la transparence du staff', () => {
      const guardSrc = fs.readFileSync(path.join(ROOT, 'src/shared/components/rbac/ActionGuard.tsx'), 'utf-8');
      expect(guardSrc).toContain('disabledMode');
      expect(guardSrc).toContain('aria-disabled');
      expect(guardSrc).toContain('disabledReason');
    });

    it('GoldSwitch et AmbientAudio sont sémantiques (button / input accessible)', () => {
      const switchSrc = fs.readFileSync(path.join(ROOT, 'src/shared/components/ui/GoldSwitch.tsx'), 'utf-8');
      const audioSrc = fs.readFileSync(path.join(ROOT, 'src/shared/components/layout/AmbientAudio.tsx'), 'utf-8');
      expect(switchSrc).toContain('<button');
      expect(switchSrc).toContain('role="switch"');
      expect(audioSrc).toContain('<button');
    });
  });

  describe('INV-23 — Couverture des Frontières d\'Erreur (Route Groups)', () => {
    it('chaque grand groupe de routes dispose de son error.tsx dédié', () => {
      const requiredErrorBoundaries = [
        'src/app/error.tsx',
        'src/app/(admin)/error.tsx',
        'src/app/(client)/(ops)/error.tsx',
        'src/app/(client)/(ordering)/error.tsx',
        'src/app/(client)/(public)/error.tsx',
        'src/app/(marketing)/error.tsx',
      ];

      for (const relPath of requiredErrorBoundaries) {
        const fullPath = path.join(ROOT, relPath);
        expect(fs.existsSync(fullPath), `Frontière d'erreur manquante: ${relPath}`).toBe(true);
      }
    });
  });

  describe('INV-24 — Méta-Garde Suite UI Auto-Adaptative', () => {
    it('AdaptiveActionHub et AutoSafeLayout sont exportés dans le barrel UI', () => {
      const uiIndex = fs.readFileSync(path.join(ROOT, 'src/shared/components/ui/index.ts'), 'utf-8');
      expect(uiIndex).toContain('AdaptiveActionHub');
      expect(uiIndex).toContain('AutoSafeLayout');
    });
  });

});




