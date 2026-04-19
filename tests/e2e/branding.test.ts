import { test, expect } from '@playwright/test';

/**
 * 🛡️ Test de Branding "Indestructible"
 * Vérifie que la Zestry Strata injecte correctement les couleurs de l'instance.
 */
test.describe('Zestry Strata - Sanity Check', () => {
  test('should verify CSS variable injection on the login screen', async ({ page }) => {
    // On cible la page de PIN (root ou admin)
    await page.goto('/');
    
    // Attendre que le body soit chargé
    await page.waitForSelector('body');

    // Vérification de la présence de la variable de branding primaire
    const brandPrimary = await page.evaluate(() => 
      getComputedStyle(document.body).getPropertyValue('--accent-primary').trim()
    );
    
    // On s'assure qu'une couleur est bien définie (C5A059 par défaut)
    expect(brandPrimary).toMatch(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/);
    console.log(`✅ [AUDIT] Brand Primary found: ${brandPrimary}`);
  });

  test('should have the correct title in the metadata', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toContain('Restaurant OS');
  });
});
