import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { ouvrirAvecDemo } from './session';

/**
 * M5 — SONDE RUNTIME DE MISE EN PAGE
 * ────────────────────────────────────────────────────────────────────────────
 * La seule mesure du dépôt qui trouve ce que la lecture du code NE PEUT PAS
 * trouver. Preuve : l'audit du 2026-08-26 n'a pas vu, par analyse statique, que
 * l'en-tête du KDS mesurait 1218 px de contenu pour 768 px d'écran — 450 px hors
 * cadre, dans un parent `overflow-x: hidden`, donc DÉFINITIVEMENT inatteignables.
 * Un cuisinier ne pouvait plus sélectionner les stations « Bar » ou « Pâtisserie ».
 * Aucun grep ne peut déduire ça : il faut mesurer le rendu.
 *
 * PIÈGES ENCODÉS (erreurs réellement commises, à ne pas refaire) :
 *
 *  1. Tester les DEUX bords. Ma première sonde ne regardait que le bord droit et
 *     a raté le rognage à gauche de l'horloge du KDS.
 *  2. Ignorer les halos décoratifs (`blur-[…]`, positionnés en pourcentage
 *     négatif) : ils débordent VOLONTAIREMENT et ne sont pas des défauts.
 *  3. Distinguer « défile » de « coupé ». Un conteneur dont le contenu dépasse
 *     mais qui est `overflow-x: auto` reste atteignable au doigt ; le même en
 *     `hidden` perd son contenu. Seul le second est un bug.
 *  4. Exclure le badge `DEV_MODE_ACTIVE` du comptage des petits textes : il
 *     n'est jamais livré.
 *
 * Sortie : `.measures/runtime.json`, consommé par le récapitulatif de mesure.
 */

const PALIERS = [
  { nom: 'mobile', largeur: 375, hauteur: 812 },
  { nom: 'tablette', largeur: 768, hauteur: 1024 },
  { nom: 'tablette-paysage', largeur: 1024, hauteur: 768 },
];

const ROUTES = ['/pos', '/kds', '/floor-plan', '/operations', '/inventory'];

type Constat = {
  route: string; palier: string; largeur: number;
  scrollHorizontal: number;
  horsCadreDroite: number; horsCadreGauche: number;
  pireDebordement: string | null;
  conteneursCoupes: string[];
  textesSous12px: number; plusPetitePx: number | null;
};

const constats: Constat[] = [];

test.describe('M5 — Sonde runtime de mise en page', () => {
  test.describe.configure({ mode: 'serial' });

  for (const route of ROUTES) {
    for (const p of PALIERS) {
      test(`${route} @ ${p.largeur}px (${p.nom})`, async ({ page }) => {
        await page.setViewportSize({ width: p.largeur, height: p.hauteur });
        await ouvrirAvecDemo(page, route);

        const mesure = await page.evaluate(() => {
          const de = document.documentElement;
          const vw = de.clientWidth;
          const estDecoratif = (cls: string) =>
            /blur-\[/.test(cls) || (/absolute/.test(cls) && /-\[?-\d+%\]?|\[-\d+%\]/.test(cls));

          let droite = 0, gauche = 0;
          let pire: { cls: string; px: number } | null = null;

          document.querySelectorAll('*').forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width <= 0) return;
            const cls = String((el as HTMLElement).className?.baseVal ?? el.className ?? '');
            if (estDecoratif(cls)) return;
            if (r.right > vw + 1) {
              droite++;
              const d = Math.round(r.right - vw);
              if (!pire || d > pire.px) pire = { cls: cls.slice(0, 70), px: d };
            }
            if (r.left < -1) {
              gauche++;
              const d = Math.round(-r.left);
              if (!pire || d > pire.px) pire = { cls: cls.slice(0, 70), px: d };
            }
          });

          // Conteneurs dont le contenu dépasse ET qui ne défilent pas : contenu perdu.
          const coupes: string[] = [];
          document.querySelectorAll('*').forEach((el) => {
            if (el.scrollWidth <= el.clientWidth + 4 || el.clientWidth < 80) return;
            const ox = getComputedStyle(el).overflowX;
            if (ox === 'auto' || ox === 'scroll') return;
            const cache = el.scrollWidth - el.clientWidth;
            if (cache > 24) {
              const cls = String((el as HTMLElement).className?.baseVal ?? el.className ?? '');
              coupes.push(`${cls.slice(0, 55)} — ${cache}px cachés`);
            }
          });

          let sous12 = 0, mini = 99;
          document.querySelectorAll('*').forEach((el) => {
            if (el.children.length || !el.textContent?.trim()) return;
            if (/DEV_MODE_ACTIVE/.test(el.textContent)) return;
            const fs = parseFloat(getComputedStyle(el).fontSize);
            if (fs && fs < 12) { sous12++; mini = Math.min(mini, fs); }
          });

          return {
            scrollHorizontal: de.scrollWidth - vw,
            horsCadreDroite: droite,
            horsCadreGauche: gauche,
            pireDebordement: pire ? `${(pire as { cls: string; px: number }).cls} (+${(pire as { cls: string; px: number }).px}px)` : null,
            conteneursCoupes: coupes.slice(0, 5),
            textesSous12px: sous12,
            plusPetitePx: mini === 99 ? null : mini,
          };
        });

        constats.push({ route, palier: p.nom, largeur: p.largeur, ...mesure });

        // La page elle-même ne doit JAMAIS défiler horizontalement.
        expect(mesure.scrollHorizontal,
          `${route} @${p.largeur}px défile horizontalement de ${mesure.scrollHorizontal}px`,
        ).toBeLessThanOrEqual(0);

        // Aucun contenu ne doit être coupé sans possibilité de défiler.
        expect(mesure.conteneursCoupes,
          `${route} @${p.largeur}px : contenu coupé et inatteignable`,
        ).toEqual([]);
      });
    }
  }

  test.afterAll(() => {
    mkdirSync('.measures', { recursive: true });
    writeFileSync('.measures/runtime.json', JSON.stringify({
      horodatage: new Date().toISOString(),
      paliers: PALIERS.map(p => p.largeur),
      routes: ROUTES,
      constats,
    }, null, 2) + '\n');
  });
});
