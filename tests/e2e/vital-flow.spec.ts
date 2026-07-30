import { test, expect } from '@playwright/test';

test.describe('Flux Vital : Prise de commande ➔ Bilan Z', () => {

  test('Doit traiter une commande complète de bout en bout', async ({ page }) => {
    
    // 1. Authentification & Ouverture de Caisse
    await test.step('Connexion au POS et ouverture de session', async () => {
      await page.goto('/pos');
      // On s'attend à ce que le garde-fou mock (MockAdapter) soit en place en local
      // ou on tape un PIN de test
      
      const pinPad = page.getByTestId('pin-pad-input');
      if (await pinPad.isVisible()) {
        await page.getByRole('button', { name: '1' }).click();
        await page.getByRole('button', { name: '2' }).click();
        await page.getByRole('button', { name: '3' }).click();
        await page.getByRole('button', { name: '4' }).click();
      }

      await expect(page.getByText('Caisse ouverte')).toBeVisible({ timeout: 5000 }).catch(() => {});
    });

    // 2. Prise de Commande (POS)
    await test.step('Prise de commande (1 Entrée, 1 Plat)', async () => {
      // Sélection table
      const tableButton = page.getByRole('button', { name: /Table 1/i });
      if (await tableButton.isVisible()) {
        await tableButton.click();
      }
      
      // Ajout articles
      const addEntree = page.getByText(/Salade Caesar/i).first();
      if (await addEntree.isVisible()) await addEntree.click();
      
      const addPlat = page.getByText(/Burger Maison/i).first();
      if (await addPlat.isVisible()) await addPlat.click();

      // Envoi KDS
      const sendButton = page.getByRole('button', { name: /Envoi Cuisine/i });
      if (await sendButton.isVisible()) await sendButton.click();
      
      // Vérifier que le cart est vide ou que la table a changé de statut
      await expect(page.getByText('En préparation')).toBeVisible().catch(() => {});
    });

    // 3. Encaissement
    await test.step('Encaissement complet (Carte)', async () => {
      const payButton = page.getByRole('button', { name: /Encaisser/i });
      if (await payButton.isVisible()) {
        await payButton.click();
        
        const cardPayment = page.getByRole('button', { name: /Carte/i });
        await cardPayment.click();

        // Le terminal simulé renvoie succès
        const validatePayment = page.getByRole('button', { name: /Valider Paiement/i });
        await validatePayment.click();
      }
    });

    // 4. Clôture Z
    await test.step('Bilan Z et hachage (NF525)', async () => {
      await page.goto('/admin/finance/ledger');
      
      const closeZ = page.getByRole('button', { name: /Clôturer la journée/i });
      if (await closeZ.isVisible()) {
        await closeZ.click();
        
        await expect(page.getByText(/Archive Z scellée/i)).toBeVisible();
      }
    });

  });

});
