import { test, expect } from '@playwright/test';

/**
 * 🛡️ Audit Automatique de la Flotte - Restaurant OS
 * Ce test vérifie que le moteur de "Digital Twin" applique correctement 
 * les identités visuelles de chaque instance.
 */
test.describe('Fleet Orchestration - Visual Audit', () => {
  
  const targetInstances = [
    { key: 'restaurant-os', expectedColor: '#C5A059' }, // Gold
    { key: 'bistro-de-lyon', expectedColor: '#10B981' }, // Emerald
    { key: 'urban-burger', expectedColor: '#F59E0B' }    // Amber
  ];

  for (const instance of targetInstances) {
    test(`should audit branding for instance: ${instance.key}`, async ({ page }) => {
      // Chargement de l'instance via le Digital Twin Switcher
      await page.goto(`/?previewInstance=${instance.key}`);
      
      // On attend que le body soit présent
      await page.waitForSelector('body');

      // Extraction de la variable de marque injectée
      const brandPrimary = await page.evaluate(() => 
        getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim().toUpperCase()
      );

      console.log(`🔍 [AUDIT] Instance: ${instance.key} | Found: ${brandPrimary} | Expected: ${instance.expectedColor}`);

      // Vérification rigoureuse
      expect(brandPrimary).toBe(instance.expectedColor.toUpperCase());
      
      // Snapshot de contrôle (metadata title)
      const title = await page.title();
      expect(title).toContain('Restaurant OS');
    });
  }
});
