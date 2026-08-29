import { describe, it, expect } from 'vitest';
import { PageSceneGraphCompiler } from '@/kernel/open-pencil/engine/PageSceneGraphCompiler';
import { PageCatalogRegistry } from '@/kernel/open-pencil/catalog/PageCatalogRegistry';
import { ReactToPenTransformer } from '@/kernel/open-pencil/engine/ReactToPenTransformer';

describe('⚡ OpenPencil — Code Generator & Serialization', () => {
    it('compile un PageDocument en code React Next.js TSX valide', () => {
        const page = ReactToPenTransformer.createPageSceneGraph({
            id: 'test-page',
            name: 'Page Test Caisse',
            route: '/pos',
            category: 'operations',
            description: 'Description du terminal',
            icon: 'ShoppingCart',
        });

        const tsx = PageSceneGraphCompiler.compileToReactTSX(page);

        expect(tsx).toContain('"use client";');
        expect(tsx).toContain('export default function');
        expect(tsx).toContain('Page Test Caisse');
        expect(tsx).toContain('/pos');
    });

    it('sérialise et désérialise un document .pen en JSON sans perte', () => {
        const fullDoc = PageCatalogRegistry.createFullPenDocument('_demo_restaurant');
        const json = PageSceneGraphCompiler.serialize(fullDoc);

        expect(json.length).toBeGreaterThan(1000);

        const parsed = PageSceneGraphCompiler.parse(json);
        expect(parsed.version).toBe('1.0.0');
        expect(parsed.pages.length).toBe(84);
        expect(parsed.pages[0].id).toBe(fullDoc.pages[0].id);
    });

    it('lève une erreur si le JSON .pen est invalide', () => {
        expect(() => {
            PageSceneGraphCompiler.parse('{"invalid": true}');
        }).toThrow();
    });
});
