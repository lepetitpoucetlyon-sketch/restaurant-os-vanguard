import type { Page } from '@playwright/test';

/**
 * Helper d'ouverture de session pour les sondes de mesure runtime.
 *
 * Pourquoi passer par l'interface plutôt que par sessionStorage :
 * une session « connectée » repose sur DEUX clés (`executive_user_session` et
 * `executive_dev_bypass_active`) PLUS un identifiant que `AuthStaff` ne garde
 * qu'en mémoire — il n'est écrit nulle part. Poser les clés à la main est donc
 * fragile et se casserait au moindre refactor d'auth. Cliquer le pavé suit le
 * patron déjà utilisé par `tests/e2e/vital-flow.spec.ts`.
 *
 * Le PIN `9999` n'est pas un secret : c'est une constante de développement
 * écrite en dur dans `useNexusAuthLogic.ts:49`, versionnée, et rangée parmi les
 * PIN interdits pour un vrai compte (`validatePin.ts`). Elle ne fonctionne que
 * si `NODE_ENV === 'development'`.
 */
export const PIN_DEV = '9999';

/**
 * Ouvre une route avec le jeu de données de démo provisionné.
 *
 * `?simulacra=true` bascule sur `SimulacraAdapter` (magasin virtuel IndexedDB)
 * et déclenche `DemoSeeder.provision()` : 4 catégories, produits, 5 tables,
 * identités et commandes. Vérifié en session — le journal affiche
 * « [DemoSeeder] Provisioning Complete ».
 *
 * Ce paramètre est sans effet hors développement (gardé par `NODE_ENV`).
 */
export async function ouvrirAvecDemo(page: Page, route: string, tenant = 'lepetitpoucet') {
  const sep = route.includes('?') ? '&' : '?';
  const url = `${route}${sep}tenant=${tenant}&simulacra=true`;

  // `waitUntil: 'commit'` et non 'domcontentloaded' : l'application redirige
  // parfois côté client pendant le chargement (garde souverain, splash), ce qui
  // détache la frame et produit net::ERR_ABORTED. On accepte le commit, puis on
  // attend l'application elle-même.
  for (let essai = 0; essai < 3; essai++) {
    try {
      await page.goto(url, { waitUntil: 'commit', timeout: 45_000 });
      break;
    } catch (e) {
      if (essai === 2) throw e;
      await page.waitForTimeout(1500);
    }
  }
  await page.waitForLoadState('domcontentloaded').catch(() => { /* redirection en cours */ });
  await connecterSiNecessaire(page);
  // Laisse la synchro des piliers s'établir (ICM : ~180 ms visés, on est large).
  await page.waitForTimeout(2500);
}

/** Passe l'écran « Accès Exécutif » s'il est présent. Idempotent. */
export async function connecterSiNecessaire(page: Page) {
  const carteProfil = page.locator('button', { hasText: /ADMINISTRATEUR|SOUVERAIN/i }).first();
  try {
    await carteProfil.waitFor({ state: 'visible', timeout: 8000 });
  } catch {
    return; // déjà connecté, ou écran non affiché sur cette route
  }

  await carteProfil.click();
  for (const chiffre of PIN_DEV.split('')) {
    await page.getByRole('button', { name: chiffre, exact: true }).first().click();
  }
  // Le bouton de validation s'active une fois les 4 chiffres saisis.
  const valider = page.locator('button:not([disabled])').last();
  await valider.click().catch(() => { /* certains écrans valident automatiquement */ });
  await page.waitForTimeout(1500);
}
