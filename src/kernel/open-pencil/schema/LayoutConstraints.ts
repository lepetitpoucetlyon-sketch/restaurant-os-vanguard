/**
 * 📐 Layout Constraints & Auto-Layout Helpers
 * Implémentation du moteur d'auto-layout selon le standard Yoga / OpenPencil SceneGraph
 */

import { FrameNode, SceneNode } from './PenDocument';

export interface ComputedLayoutBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Calcule les positions relatives des enfants d'un FrameNode selon son auto-layout
 */
export function computeAutoLayout(frame: FrameNode): Map<string, ComputedLayoutBox> {
    const layoutMap = new Map<string, ComputedLayoutBox>();
    const children = frame.children.filter(c => c.visible !== false);

    if (frame.layoutMode === 'NONE' || !frame.layoutMode) {
        for (const child of children) {
            layoutMap.set(child.id, {
                x: child.x,
                y: child.y,
                width: child.width,
                height: child.height,
            });
        }
        return layoutMap;
    }

    const padLeft = frame.paddingLeft ?? 0;
    const padTop = frame.paddingTop ?? 0;
    const padRight = frame.paddingRight ?? 0;
    const padBottom = frame.paddingBottom ?? 0;
    const spacing = frame.itemSpacing ?? 0;

    let currentOffset = 0;
    const isHorizontal = frame.layoutMode === 'HORIZONTAL';

    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        let childWidth = child.width;
        let childHeight = child.height;

        if (isHorizontal) {
            // Horizontal layout (Row)
            if (child.layoutSizingHorizontal === 'FILL') {
                const totalFixed = children.reduce((acc, c) => acc + (c.layoutSizingHorizontal === 'FILL' ? 0 : c.width), 0);
                const totalSpacing = spacing * (children.length - 1);
                const available = Math.max(0, frame.width - padLeft - padRight - totalFixed - totalSpacing);
                const fillCount = children.filter(c => c.layoutSizingHorizontal === 'FILL').length || 1;
                childWidth = available / fillCount;
            }

            if (child.layoutSizingVertical === 'FILL') {
                childHeight = Math.max(0, frame.height - padTop - padBottom);
            }

            let childY = padTop;
            if (frame.counterAxisAlign === 'CENTER') {
                childY = padTop + (frame.height - padTop - padBottom - childHeight) / 2;
            } else if (frame.counterAxisAlign === 'MAX') {
                childY = frame.height - padBottom - childHeight;
            }

            layoutMap.set(child.id, {
                x: padLeft + currentOffset,
                y: childY,
                width: childWidth,
                height: childHeight,
            });

            currentOffset += childWidth + spacing;
        } else {
            // Vertical layout (Column)
            if (child.layoutSizingVertical === 'FILL') {
                const totalFixed = children.reduce((acc, c) => acc + (c.layoutSizingVertical === 'FILL' ? 0 : c.height), 0);
                const totalSpacing = spacing * (children.length - 1);
                const available = Math.max(0, frame.height - padTop - padBottom - totalFixed - totalSpacing);
                const fillCount = children.filter(c => c.layoutSizingVertical === 'FILL').length || 1;
                childHeight = available / fillCount;
            }

            if (child.layoutSizingHorizontal === 'FILL') {
                childWidth = Math.max(0, frame.width - padLeft - padRight);
            }

            let childX = padLeft;
            if (frame.counterAxisAlign === 'CENTER') {
                childX = padLeft + (frame.width - padLeft - padRight - childWidth) / 2;
            } else if (frame.counterAxisAlign === 'MAX') {
                childX = frame.width - padRight - childWidth;
            }

            layoutMap.set(child.id, {
                x: childX,
                y: padTop + currentOffset,
                width: childWidth,
                height: childHeight,
            });

            currentOffset += childHeight + spacing;
        }
    }

    return layoutMap;
}

/**
 * Trouve récursivement un nœud par son ID
 */
export function findNodeById(root: SceneNode, id: string): SceneNode | null {
    if (root.id === id) return root;
    if ('children' in root && Array.isArray(root.children)) {
        for (const child of root.children) {
            const found = findNodeById(child, id);
            if (found) return found;
        }
    }
    return null;
}
