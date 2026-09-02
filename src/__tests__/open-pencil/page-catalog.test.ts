import { describe, it, expect } from 'vitest';
import { PageCatalogRegistry } from '@/kernel/open-pencil/catalog/PageCatalogRegistry';

describe('📚 OpenPencil — 87 Pages Catalog Registry', () => {
    it('indexe exactement 87 pages pour Restaurant OS Core', () => {
        const allPages = PageCatalogRegistry.getAllPages();
        expect(allPages.length).toBe(87);
    });

    it('garantit l unicité de tous les IDs et routes', () => {
        const allPages = PageCatalogRegistry.getAllPages();
        const ids = new Set<string>();
        const routes = new Set<string>();

        for (const page of allPages) {
            expect(ids.has(page.id)).toBe(false);
            expect(routes.has(page.route)).toBe(false);
            ids.add(page.id);
            routes.add(page.route);
        }
    });

    it('génère un document .pen complet contenant les 87 pages modélisées', () => {
        const fullDoc = PageCatalogRegistry.createFullPenDocument('_demo_restaurant');
        expect(fullDoc.pages.length).toBe(87);

        for (const page of fullDoc.pages) {
            expect(page.id).toBeDefined();
            expect(page.route).toBeDefined();
            expect(page.rootNode).toBeDefined();
            expect(page.rootNode.children.length).toBeGreaterThan(0);
        }
    });

    it('permet la recherche par catégorie', () => {
        const opsPages = PageCatalogRegistry.getPagesByCategory('operations');
        expect(opsPages.length).toBeGreaterThanOrEqual(10);
        expect(opsPages.some(p => p.route === '/pos')).toBe(true);
        expect(opsPages.some(p => p.route === '/kds')).toBe(true);
    });
});
