import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────
// Smoke Test Suite — Validates critical paths post-deployment
// 10 critical tests: Homepage, Verticals, Pricing, Signup, Legal, Health
// ─────────────────────────────────────────────────────────────────

test.describe('Production Smoke Tests', () => {
  test('1. Homepage loads with 200 and renders main hero', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('Votre commerce.');
  });

  test('2. Vertical landing page loads (boulangerie)', async ({ page }) => {
    const response = await page.goto('/verticales/boulangerie');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('3. Vertical landing page loads (restaurant)', async ({ page }) => {
    const response = await page.goto('/verticales/restaurant');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('4. Pricing page renders all 3 tiers', async ({ page }) => {
    const response = await page.goto('/pricing');
    expect(response?.status()).toBe(200);
    await expect(page.getByText('Starter')).toBeVisible();
    await expect(page.getByText('Pro')).toBeVisible();
    await expect(page.getByText('Enterprise')).toBeVisible();
  });

  test('5. Competitor comparison vs Zelty loads', async ({ page }) => {
    const response = await page.goto('/pricing/vs-zelty');
    expect(response?.status()).toBe(200);
    await expect(page.locator('table')).toBeVisible();
  });

  test('6. Signup form loads with fields', async ({ page }) => {
    const response = await page.goto('/signup');
    expect(response?.status()).toBe(200);
    await expect(page.locator('#signup-email')).toBeVisible();
    await expect(page.locator('#signup-password')).toBeVisible();
    await expect(page.locator('#signup-business')).toBeVisible();
  });

  test('7. Legal NF525 trust page loads', async ({ page }) => {
    const response = await page.goto('/legal/nf525');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('Certification NF525');
  });

  test('8. Legal DPA page loads', async ({ page }) => {
    const response = await page.goto('/legal/dpa');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('Accord de Traitement des Données');
  });

  test('9. Health check API returns 200 OK', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('ok');
  });

  test('10. Database status API returns response', async ({ request }) => {
    const res = await request.get('/api/status/db');
    expect([200, 503]).toContain(res.status());
    const json = await res.json();
    expect(json.database).toBe('firestore');
  });
});
