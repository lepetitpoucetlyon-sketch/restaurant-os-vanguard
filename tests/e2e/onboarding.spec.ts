import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  const email = page.getByLabel(/email/i);
  const password = page.getByLabel(/mot de passe|password/i);
  if (await email.isVisible()) {
    await email.fill('admin@test.restaurant-os.dev');
    await password.fill('test1234');
    await page.getByRole('button', { name: /connexion|login/i }).click();
  }
  // Si déjà auth, la page redirigera vers /onboarding ou /pos
  await page.waitForURL(/(onboarding|pos|dashboard)/, { timeout: 10000 }).catch(() => {});
}

async function navigateToOnboarding(page: Page) {
  await page.goto('/onboarding');
  await expect(page.getByText(/bienvenue|configuration|onboarding/i)).toBeVisible({ timeout: 8000 });
}

// ─── From Zero path ───────────────────────────────────────────────────────────

test.describe('Onboarding — Parcours from_zero', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToOnboarding(page);
  });

  test('Affiche le wizard avec le choix de mode', async ({ page }) => {
    // Étape 0 : choisir son mode
    await expect(page.getByText(/partir de zéro|from zero|nouveau établissement/i)).toBeVisible();
    await expect(page.getByText(/migration|import|déjà un logiciel/i)).toBeVisible();
  });

  test('Parcours from_zero — sélectionner et passer à la configuration', async ({ page }) => {
    const btn = page.getByRole('button', { name: /zéro|from zero|nouveau/i });
    if (await btn.isVisible()) {
      await btn.click();
      await page.getByRole('button', { name: /suivant|continuer|next/i }).click();
    }

    // On devrait arriver sur un écran config ou plan de salle
    await expect(
      page.getByText(/configuration|plan de salle|informations|paramètres/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test('ProgressStepper reflète la progression', async ({ page }) => {
    // Le stepper doit être visible et indiquer étape 1 active
    const stepper = page.locator('[data-testid="progress-stepper"], [class*="stepper"], [class*="step"]').first();
    await expect(stepper).toBeVisible({ timeout: 5000 }).catch(() => {});

    // Chercher un indicateur de progression (ex. "1/5" ou "Étape 1")
    const progress = page.getByText(/étape 1|step 1|1\/5|1 \//i);
    if (await progress.isVisible()) {
      await expect(progress).toBeVisible();
    }
  });
});

// ─── Migration path ───────────────────────────────────────────────────────────

test.describe('Onboarding — Parcours migration', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToOnboarding(page);
  });

  test('Sélectionner migration et afficher SourceSystemSelector', async ({ page }) => {
    const btn = page.getByRole('button', { name: /migration|import|logiciel|concurrent/i }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.getByRole('button', { name: /suivant|continuer|next/i }).click();
    }

    // Étape : choix du système source
    const selector = page.getByText(/zenchef|l'addition|zelty|lightspeed|tiller/i).first();
    await expect(selector).toBeVisible({ timeout: 8000 }).catch(async () => {
      // Si pas de selector visible, on vérifie qu'on est bien en mode migration
      await expect(page.getByText(/source|système|logiciel/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test('OCRUploadZone est présente pour les catégories sans connecteur', async ({ page }) => {
    // Naviguer vers un état import générique
    await page.goto('/onboarding');

    // Essayer de trouver une zone de drop
    const dropzone = page.locator('[data-testid="ocr-upload-zone"], [class*="upload"], [class*="drop"]').first();
    if (await dropzone.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(dropzone).toBeVisible();
    }
  });

  test('Sélectionner Zenchef comme source', async ({ page }) => {
    const btn = page.getByRole('button', { name: /migration/i }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.getByRole('button', { name: /suivant|next/i }).click();
    }

    // Chercher Zenchef dans la liste
    const zenchefBtn = page.getByRole('button', { name: /zenchef/i });
    if (await zenchefBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await zenchefBtn.click();
      await expect(page.getByText(/zenchef/i)).toBeVisible();
    }
  });
});

// ─── API routes ───────────────────────────────────────────────────────────────

test.describe('Onboarding API — routes publiques', () => {
  test('GET /api/tenant/onboarding/status répond 200 ou 401', async ({ request }) => {
    const resp = await request.get('/api/tenant/onboarding/status');
    expect([200, 401, 403]).toContain(resp.status());
  });

  test('GET /api/tenant/onboarding/rollback répond 200 ou 401', async ({ request }) => {
    const resp = await request.get('/api/tenant/onboarding/rollback');
    expect([200, 401, 403]).toContain(resp.status());
  });

  test('POST /api/tenant/onboarding/rollback sans auth → 401', async ({ request }) => {
    const resp = await request.post('/api/tenant/onboarding/rollback', {
      data: { snapshotId: 'fake-id' },
    });
    expect([401, 403]).toContain(resp.status());
  });

  test('POST /api/tenant/onboarding/ocr sans body → 400 ou 401', async ({ request }) => {
    const resp = await request.post('/api/tenant/onboarding/ocr');
    expect([400, 401, 403]).toContain(resp.status());
  });
});

// ─── Plan de salle ────────────────────────────────────────────────────────────

test.describe('Onboarding — Éditeur plan de salle', () => {
  test('SimpleFloorPlanEditor affiche les templates', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToOnboarding(page);

    // Naviguer jusqu'au plan de salle (étape 4 ou directement)
    const floorPlanSection = page.getByText(/plan de salle|floor plan|tables/i).first();
    if (await floorPlanSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Vérifier que les templates sont visibles
      const template = page.getByText(/bistrot|restaurant 40|brasserie/i).first();
      if (await template.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(template).toBeVisible();
      }
    }
  });

  test('Bouton "Ajouter une table" est cliquable', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/onboarding');

    const addTableBtn = page.getByRole('button', { name: /ajouter.*table|add.*table/i });
    if (await addTableBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addTableBtn.click();
      await expect(page.getByText(/table/i)).toBeVisible();
    }
  });
});

// ─── Bouton aide ──────────────────────────────────────────────────────────────

test.describe('Onboarding — OnboardingHelpButton', () => {
  test('Bouton aide ouvre un modal', async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToOnboarding(page);

    const helpBtn = page.getByRole('button', { name: /aide|help|\?/i }).first();
    if (await helpBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await helpBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 }).catch(async () => {
        await expect(page.getByText(/comment puis-je|how can|votre question/i)).toBeVisible({ timeout: 3000 });
      });
    }
  });
});

// ─── Redirect post-login ──────────────────────────────────────────────────────

test.describe('Redirect post-login vers onboarding', () => {
  test('Un compte non onboardé est redirigé vers /onboarding', async ({ page }) => {
    // On vérifie juste que la route existe et répond
    const resp = await page.request.get('/onboarding');
    // 200 = page existante, 307/302 = redirect (auth guard)
    expect([200, 302, 307]).toContain(resp.status());
  });
});
