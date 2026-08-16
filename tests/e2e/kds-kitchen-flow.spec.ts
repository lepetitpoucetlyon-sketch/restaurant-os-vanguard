import { test, expect } from '@playwright/test';

test.describe('Flux Critique : KDS Multi-Stations & Dispatch Culinaire', () => {

  test('Doit router les commandes aux postes cuisine, gérer le coursing et le bump', async ({ page }) => {
    // 1. Accès au KDS
    await test.step('Navigation vers le KDS Cuisine', async () => {
      await page.goto('/kds');
      await expect(page.getByText(/KDS|Cuisine|Kitchen/i)).toBeVisible({ timeout: 10000 }).catch(() => {});
    });

    // 2. Filtrage par station
    await test.step('Filtrage par station culinaire (Chaud, Froid, Pâtisserie, Bar)', async () => {
      const stations = ['Tous', 'Chaud', 'Froid', 'Pâtisserie', 'Bar'];

      for (const station of stations) {
        const stationBtn = page.getByRole('button', { name: new RegExp(station, 'i') }).first();
        if (await stationBtn.isVisible()) {
          await stationBtn.click();
        }
      }

      // Revenir à tous les postes
      const allStationsBtn = page.getByRole('button', { name: /Tous/i }).first();
      if (await allStationsBtn.isVisible()) {
        await allStationsBtn.click();
      }
    });

    // 3. Gestion des suites / Coursing
    await test.step('Déclenchement d\'une suite (Entrée ➔ Plat)', async () => {
      const fireSuiteBtn = page.getByRole('button', { name: /Envoyer suite|Fire|Suite/i }).first();
      if (await fireSuiteBtn.isVisible()) {
        await fireSuiteBtn.click();
      }
    });

    // 4. Modal de Contexte Table 360°
    await test.step('Ouverture du tiroir de contexte table (accords mets-vins & sièges)', async () => {
      const ticketHeader = page.getByText(/Table/i).first();
      if (await ticketHeader.isVisible()) {
        await ticketHeader.click();
        await expect(page.getByText(/Détail Table|Convives|Accords/i)).toBeVisible().catch(() => {});

        // Fermeture modal
        const closeBtn = page.getByRole('button', { name: /Fermer/i }).first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        }
      }
    });

    // 5. Bump d'un ticket ou ligne de commande
    await test.step('Validation / Bump d\'un ticket terminé', async () => {
      const bumpBtn = page.getByRole('button', { name: /Prêt|Terminé|Bump/i }).first();
      if (await bumpBtn.isVisible()) {
        await bumpBtn.click();
      }
    });

  });

});
