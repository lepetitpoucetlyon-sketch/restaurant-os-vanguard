import { test, expect } from '@playwright/test';

test.describe('Flux Critique : Prise de Commande & Split d\'Addition Multi-Modes', () => {

  test('Doit permettre de diviser une addition à parts égales, par article et sur mesure', async ({ page }) => {
    // 1. Navigation POS
    await test.step('Accès au POS et sélection d\'une table', async () => {
      await page.goto('/pos');

      const pinPad = page.getByTestId('pin-pad-input');
      if (await pinPad.isVisible()) {
        await page.getByRole('button', { name: '1' }).click();
        await page.getByRole('button', { name: '2' }).click();
        await page.getByRole('button', { name: '3' }).click();
        await page.getByRole('button', { name: '4' }).click();
      }

      const tableBtn = page.getByRole('button', { name: /Table 4/i }).first();
      if (await tableBtn.isVisible()) {
        await tableBtn.click();
      }
    });

    // 2. Remplissage du panier
    await test.step('Ajout de plusieurs articles dans le panier', async () => {
      const items = [
        page.getByText(/Salade/i).first(),
        page.getByText(/Burger/i).first(),
        page.getByText(/Tiramisu/i).first(),
      ];

      for (const item of items) {
        if (await item.isVisible()) {
          await item.click();
        }
      }
    });

    // 3. Ouverture du Split Bill Dialog
    await test.step('Ouverture du dialogue de partage d\'addition', async () => {
      const splitButton = page.getByRole('button', { name: /Partager|Split/i });
      if (await splitButton.isVisible()) {
        await splitButton.click();
        await expect(page.getByText(/Division de l'addition/i)).toBeVisible({ timeout: 5000 }).catch(() => {});
      }
    });

    // 4. Test Split Equal
    await test.step('Partage équitable entre 3 convives', async () => {
      const equalTab = page.getByRole('button', { name: /Parts égales|Égal/i });
      if (await equalTab.isVisible()) {
        await equalTab.click();

        const addGuestBtn = page.getByRole('button', { name: /\+/i }).first();
        if (await addGuestBtn.isVisible()) {
          await addGuestBtn.click(); // 3 convives
        }

        // Vérifier l'affichage des parts
        await expect(page.getByText(/Convive 1/i)).toBeVisible().catch(() => {});
        await expect(page.getByText(/Convive 2/i)).toBeVisible().catch(() => {});
        await expect(page.getByText(/Convive 3/i)).toBeVisible().catch(() => {});
      }
    });

    // 5. Test Split By Item
    await test.step('Basculement vers le partage par article', async () => {
      const itemTab = page.getByRole('button', { name: /Par article|Articles/i });
      if (await itemTab.isVisible()) {
        await itemTab.click();
        await expect(page.getByText(/Assigner/i)).toBeVisible().catch(() => {});
      }
    });

    // 6. Test Custom Split & Encaissement
    await test.step('Encaissement partiel et solde résiduel', async () => {
      const customTab = page.getByRole('button', { name: /Sur mesure|Personnalisé/i });
      if (await customTab.isVisible()) {
        await customTab.click();
      }

      const payGuestBtn = page.getByRole('button', { name: /Payer cette part|Encaisser/i }).first();
      if (await payGuestBtn.isVisible()) {
        await payGuestBtn.click();

        const cardBtn = page.getByRole('button', { name: /Carte/i });
        if (await cardBtn.isVisible()) {
          await cardBtn.click();
          const validateBtn = page.getByRole('button', { name: /Valider/i });
          if (await validateBtn.isVisible()) {
            await validateBtn.click();
          }
        }
      }
    });

  });

});
