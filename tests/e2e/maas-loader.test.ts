import { test, expect } from '@playwright/test';

/**
 * 🛡️ PHASE 5.5 - MOTEUR MAAS
 * Audit des chunks réseau (Network Waterfall)
 */
test.describe('Moteur MaaS (Modules as a Service)', () => {
    
    test('Unpaid modules MUST NOT download chunks in Network Waterfall', async ({ page }) => {
        const requestedChunks: string[] = [];

        // Interception du trafic réseau pour écouter les chunks JS
        page.on('request', request => {
            const url = request.url();
            if (url.endsWith('.js') || url.includes('.js?')) {
                requestedChunks.push(url);
            }
        });

        // Setup d'une route mock pour injecter des claims de test 'free'
        await page.route('**/api/claims', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ plan: 'free', role: 'admin', orgId: 'test_org', tenantId: 'test_tenant' })
            });
        });

        // Navigation vers une page où un module premium (ex: analytics) tenterait de charger
        // Comme nous simulons l'environnement, on va sur le simulateur Vanguard ou une page dédiée
        await page.goto('https://restaurant-os-web.web.app/vanguard-simulator');
        
        // Laisser le temps à l'application de s'initialiser et de tenter (ou non) les imports dynamiques
        await page.waitForTimeout(5000); 

        // Vérification sticte: AUCUN chunk lié à 'analytics' ou module premium ne doit être dans le waterfall
        const analyticsChunkFetched = requestedChunks.some(url => url.toLowerCase().includes('analytics'));
        
        expect(analyticsChunkFetched).toBe(false);
    });

});
