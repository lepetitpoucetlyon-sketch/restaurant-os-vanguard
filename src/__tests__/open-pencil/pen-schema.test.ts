import { describe, it, expect } from 'vitest';
import { SceneGraphManager } from '@/kernel/open-pencil/engine/SceneGraphManager';
import { PageCatalogRegistry } from '@/kernel/open-pencil/catalog/PageCatalogRegistry';
import { computeAutoLayout, findNodeById } from '@/kernel/open-pencil/schema/LayoutConstraints';
import { rgbaToCss, hexToRgba } from '@/kernel/open-pencil/schema/StyleTokens';
import { FrameNode } from '@/kernel/open-pencil/schema/PenDocument';

describe('🎨 OpenPencil — Schema & SceneGraph Engine', () => {
    it('convertit correctement les couleurs hex et rgba', () => {
        const goldRgba = hexToRgba('#C5A059');
        expect(goldRgba.r).toBeCloseTo(0.773, 2);
        expect(goldRgba.g).toBeCloseTo(0.627, 2);
        expect(goldRgba.b).toBeCloseTo(0.349, 2);

        const css = rgbaToCss(goldRgba);
        expect(css.toLowerCase()).toBe('#c5a059');
    });

    it('calcule correctement l auto-layout horizontal et vertical', () => {
        const frame: FrameNode = {
            id: 'frame-test',
            name: 'Test Frame',
            type: 'FRAME',
            visible: true,
            locked: false,
            x: 0,
            y: 0,
            width: 500,
            height: 100,
            layoutMode: 'HORIZONTAL',
            paddingLeft: 20,
            paddingTop: 10,
            itemSpacing: 10,
            children: [
                { id: 'c1', name: 'Child 1', type: 'FRAME', visible: true, locked: false, x: 0, y: 0, width: 100, height: 80, children: [] },
                { id: 'c2', name: 'Child 2', type: 'FRAME', visible: true, locked: false, x: 0, y: 0, width: 150, height: 80, children: [] },
            ],
        };

        const boxes = computeAutoLayout(frame);
        expect(boxes.get('c1')).toEqual({ x: 20, y: 10, width: 100, height: 80 });
        expect(boxes.get('c2')).toEqual({ x: 130, y: 10, width: 150, height: 80 }); // 20 + 100 + 10
    });

    it('gère l historique Undo/Redo avec SceneGraphManager', () => {
        const doc = PageCatalogRegistry.createFullPenDocument('_demo_restaurant');
        const manager = new SceneGraphManager(doc);

        const initialTitle = (findNodeById(manager.getActivePage()!.rootNode, 'title-page-pos') as any)?.characters;
        expect(initialTitle).toBeDefined();

        // 1. Mutation
        manager.updateNode('title-page-pos', { characters: 'Caisse VIP Grand Hôtel' });
        const modifiedTitle = (findNodeById(manager.getActivePage()!.rootNode, 'title-page-pos') as any)?.characters;
        expect(modifiedTitle).toBe('Caisse VIP Grand Hôtel');
        expect(manager.canUndo()).toBe(true);

        // 2. Undo
        manager.undo();
        const undoneTitle = (findNodeById(manager.getActivePage()!.rootNode, 'title-page-pos') as any)?.characters;
        expect(undoneTitle).toBe(initialTitle);
        expect(manager.canRedo()).toBe(true);

        // 3. Redo
        manager.redo();
        const redoneTitle = (findNodeById(manager.getActivePage()!.rootNode, 'title-page-pos') as any)?.characters;
        expect(redoneTitle).toBe('Caisse VIP Grand Hôtel');
    });

    it('permet la duplication et suppression de nœuds', () => {
        const doc = PageCatalogRegistry.createFullPenDocument('_demo_restaurant');
        const manager = new SceneGraphManager(doc);

        const activePage = manager.getActivePage()!;
        const initialChildrenCount = activePage.rootNode.children.length;

        // Duplication
        const cloned = manager.duplicateNode(activePage.rootNode.children[0].id);
        expect(cloned).not.toBeNull();
        expect(activePage.rootNode.children.length).toBe(initialChildrenCount + 1);

        // Suppression
        manager.deleteNodes([cloned!.id]);
        expect(activePage.rootNode.children.length).toBe(initialChildrenCount);
    });
});
