import { test, expect } from '@playwright/test';

/**
 * 🛡️ Shadow Run : Audit de la Sécurité "Neural Shield" (Argon2id)
 * Version 2.0 - Sélecteurs robustes pour PinLogin Premium.
 */
test.describe('Auth - Neural Shield Audit', () => {
    
    test.beforeEach(async ({ page }) => {
        // Redirection vers l'URL locale ou baseURL
        await page.goto('/login');
    });

    test('Verification de la connexion Administrateur (PIN 0404)', async ({ page }) => {
        // 1. Attente de la pile de profils
        // On cherche le texte "Admin" ou "Administrateur" dans un bouton
        const adminProfile = page.locator('button', { hasText: /Admin/i }).first();
        await adminProfile.waitFor({ state: 'visible', timeout: 20000 });
        
        // 2. Sélection du profil Admin
        await adminProfile.click();
        
        // 3. Saisie du PIN (0404)
        // Les boutons du clavier contiennent le chiffre directement
        for (const digit of '0404') {
            await page.locator(`button`, { hasText: new RegExp(`^${digit}$`) }).click();
        }
        
        // 4. Clic sur le bouton de soumission (Icône LogIn)
        // Le bouton "submit" est le dernier du clavier
        await page.locator('button', { has: page.locator('svg') }).filter({ has: page.locator('lucide-log-in, .lucide-log-in') }).click();
        
        // 5. Validation et Redirection (Dashboard ou POS)
        // On laisse un peu de temps pour la redirection vers / dashboard ou /pos
        await expect(page).toHaveURL(/.*(dashboard|pos|account)/, { timeout: 15000 });
        
        // 6. Capture de réussite
        await page.screenshot({ path: 'shadow_runs/auth_success.png' });
    });

    test('Rejet d\'un PIN incorrect (9999)', async ({ page }) => {
        const adminProfile = page.locator('button', { hasText: /Admin/i }).first();
        await adminProfile.waitFor({ state: 'visible' });
        await adminProfile.click();
        
        for (const digit of '9999') {
            await page.locator(`button`, { hasText: new RegExp(`^${digit}$`) }).click();
        }
        
        await page.locator('button', { has: page.locator('svg') }).filter({ has: page.locator('lucide-log-in, .lucide-log-in') }).click();
        
        // L'URL ne doit pas changer vers le dashboard
        await expect(page).not.toHaveURL(/.*(dashboard|pos|account)/);
        
        // Capture d'échec
        await page.screenshot({ path: 'shadow_runs/auth_failure.png' });
    });
});
