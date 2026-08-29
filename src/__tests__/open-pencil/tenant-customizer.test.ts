import { describe, it, expect, beforeEach } from 'vitest';
import { TenantPageCustomizer, ClientBrandDna } from '@/kernel/open-pencil/overrides/TenantPageCustomizer';
import { findNodeById } from '@/kernel/open-pencil/schema/LayoutConstraints';

describe('🏢 OpenPencil — Multi-Tenant Page Customizer', () => {
    const brandDna: ClientBrandDna = {
        tenantId: 'bistrot-parisien',
        restaurantName: 'Bistrot Parisien 1892',
        primaryColor: '#B91C1C',
        fontFamilyBrand: 'Cormorant Garamond, serif',
    };

    beforeEach(() => {
        TenantPageCustomizer.resetPageForTenant('bistrot-parisien', 'page-pos');
    });

    it('charge une page avec injection d ADN de marque', () => {
        const page = TenantPageCustomizer.getPageForTenant('bistrot-parisien', 'page-pos', brandDna);
        expect(page).toBeDefined();
        expect(page.id).toBe('page-pos');

        // Vérifier le titre avec injection du nom du restaurant
        const titleNode = findNodeById(page.rootNode, 'title-page-pos') as any;
        expect(titleNode).toBeDefined();
        expect(titleNode.characters).toContain('Bistrot Parisien 1892');
    });

    it('sauvegarde et recharge la personnalisation d un tenant', () => {
        const page = TenantPageCustomizer.getPageForTenant('bistrot-parisien', 'page-pos');
        const titleNode = findNodeById(page.rootNode, 'title-page-pos') as any;
        titleNode.characters = 'Caisse Express Bistro';

        TenantPageCustomizer.savePageForTenant('bistrot-parisien', page);

        const reloadedPage = TenantPageCustomizer.getPageForTenant('bistrot-parisien', 'page-pos');
        const reloadedTitle = findNodeById(reloadedPage.rootNode, 'title-page-pos') as any;
        expect(reloadedTitle.characters).toBe('Caisse Express Bistro');

        // Isolation : le tenant par défaut ne doit pas être affecté
        const defaultPage = TenantPageCustomizer.getPageForTenant('_demo_restaurant', 'page-pos');
        const defaultTitle = findNodeById(defaultPage.rootNode, 'title-page-pos') as any;
        expect(defaultTitle.characters).not.toBe('Caisse Express Bistro');
    });

    it('réinitialise une page personnalisée au modèle usine', () => {
        const page = TenantPageCustomizer.getPageForTenant('bistrot-parisien', 'page-pos');
        const titleNode = findNodeById(page.rootNode, 'title-page-pos') as any;
        titleNode.characters = 'Modifié';
        TenantPageCustomizer.savePageForTenant('bistrot-parisien', page);

        TenantPageCustomizer.resetPageForTenant('bistrot-parisien', 'page-pos');

        const cleanPage = TenantPageCustomizer.getPageForTenant('bistrot-parisien', 'page-pos');
        const cleanTitle = findNodeById(cleanPage.rootNode, 'title-page-pos') as any;
        expect(cleanTitle.characters).not.toBe('Modifié');
    });
});
