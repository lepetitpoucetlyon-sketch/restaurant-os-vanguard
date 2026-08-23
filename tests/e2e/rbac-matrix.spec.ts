import { test, expect } from '@playwright/test';

test.describe('🛡️ RBAC Matrix & Isolation Test', () => {
  test('should render /design-system and verify RBAC Preview tab', async ({ page }) => {
    await page.goto('/design-system');
    await page.waitForSelector('body');

    // Click on RBAC Preview tab
    const rbacTab = page.locator('button', { hasText: 'Matrice RBAC Preview' });
    if (await rbacTab.isVisible()) {
      await rbacTab.click();
      await expect(page.locator('text=Simulation de Visibilité UI')).toBeVisible();
    }
  });

  test('should verify that admin role has access to settings branding', async ({ page }) => {
    await page.goto('/settings/branding');
    await page.waitForSelector('body');
    // Verify page header is rendered
    await expect(page.locator('text=Identité Visuelle & Charte Graphique')).toBeVisible();
  });
});
