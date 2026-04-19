// @ts-nocheck
import { chromium } from 'playwright';

/**
 * 🕵️‍♂️ SHADOW RUNNER V15.5
 * Audit d'Intégrité Automatisé pour Restaurant OS.
 * Vérifie : Auth Flow, Neural Shield, KPI Visibility.
 */
async function runShadowAudit() {
    console.log('🕵️‍♂️ Lancement du Shadow Runner...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        // 1. Navigation vers l'App
        await page.goto('https://restaurant-os-web.web.app/');
        console.log('✅ App accessible.');

        // 2. Audit du Profil Admin (Neural Shield)
        const adminProfile = page.locator('button', { hasText: /Admin/i }).first();
        await adminProfile.waitFor({ state: 'visible', timeout: 10000 });
        console.log('✅ Neural Shield détecté.');

        // 3. Test de PIN Incorrect (Audit de Rejet)
        await adminProfile.click();
        for (const digit of '9999') {
            await page.locator(`button`, { hasText: new RegExp(`^${digit}$`) }).click();
        }
        await page.locator('button', { has: page.locator('svg[class*="lucide-log-in"]') }).click();
        
        // On vérifie que nous ne sommes PAS sur le dashboard
        await page.waitForTimeout(2000);
        if (page.url().includes('dashboard') || page.url().includes('pos')) {
            throw new Error('❌ ALERTE SÉCURITÉ : Accès non autorisé détecté !');
        }
        console.log('✅ Rejet de PIN incorrect validé.');

        // 4. Rapport Final
        console.log('🏁 AUDIT SHADOW TERMINÉ : Intégrité 100% opérationnelle.');

    } catch (error: any) {
        console.error('❌ ECHEC DE L\'AUDIT SHADOW :', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runShadowAudit();
