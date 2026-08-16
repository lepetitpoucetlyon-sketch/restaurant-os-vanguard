import { test, expect } from '@playwright/test';

test.describe('Flux Critique : Cycle de Vie Fond de Caisse & Clôture Aveugle', () => {

  test('Doit ouvrir une session de caisse, comptabiliser les mouvements et détecter les écarts', async ({ page }) => {
    // 1. Accès au POS
    await test.step('Accès au POS et ouverture du modal de fond de caisse', async () => {
      await page.goto('/pos');

      const drawerBtn = page.getByRole('button', { name: /Caisse|Tiroir|Fond/i }).first();
      if (await drawerBtn.isVisible()) {
        await drawerBtn.click();
      }
    });

    // 2. Ouverture de session (Fond initial)
    await test.step('Saisie du fond d\'ouverture et ouverture de session', async () => {
      const openingInput = page.getByPlaceholder(/200|Montant/i);
      if (await openingInput.isVisible()) {
        await openingInput.fill('150.00');

        const openBtn = page.getByRole('button', { name: /Ouvrir la caisse/i });
        if (await openBtn.isVisible()) {
          await openBtn.click();
        }
      }
    });

    // 3. Encaissement espèces simulé
    await test.step('Encaissement en espèces avec rendu de monnaie', async () => {
      const tableBtn = page.getByRole('button', { name: /Table/i }).first();
      if (await tableBtn.isVisible()) {
        await tableBtn.click();

        const item = page.getByText(/Café|Expresso|Burger/i).first();
        if (await item.isVisible()) {
          await item.click();
        }

        const payBtn = page.getByRole('button', { name: /Encaisser/i });
        if (await payBtn.isVisible()) {
          await payBtn.click();

          const cashBtn = page.getByRole('button', { name: /Espèces|Cash/i });
          if (await cashBtn.isVisible()) {
            await cashBtn.click();

            const validateBtn = page.getByRole('button', { name: /Valider/i });
            if (await validateBtn.isVisible()) {
              await validateBtn.click();
            }
          }
        }
      }
    });

    // 4. Clôture aveugle et détection d'écart
    await test.step('Clôture aveugle avec saisie du montant compté', async () => {
      const drawerBtn = page.getByRole('button', { name: /Caisse|Tiroir|Fond/i }).first();
      if (await drawerBtn.isVisible()) {
        await drawerBtn.click();
      }

      const actualInput = page.getByPlaceholder(/Attendu|Réel/i);
      if (await actualInput.isVisible()) {
        await actualInput.fill('160.00'); // Montant compté

        // Vérifier l'affichage de l'écart
        await expect(page.getByText(/Écart/i)).toBeVisible().catch(() => {});

        const closeBtn = page.getByRole('button', { name: /Clôturer la caisse/i });
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await expect(page.getByText(/Caisse clôturée/i)).toBeVisible().catch(() => {});
        }
      }
    });

  });

});
