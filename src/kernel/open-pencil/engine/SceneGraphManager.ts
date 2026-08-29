/**
 * 🛠️ SceneGraphManager — Gestionnaire d'état immuable et mutations d'arbre SceneGraph
 * Support complet pour Undo/Redo, sélection, ajout, suppression, modification de nœuds
 */

import { PenDocument, PageDocument, SceneNode, FrameNode, BaseNode } from '../schema/PenDocument';
import { findNodeById } from '../schema/LayoutConstraints';

export type ChangeListener = (document: PenDocument) => void;

export class SceneGraphManager {
    private document: PenDocument;
    private selectedPageId: string;
    private selectedNodeIds: Set<string> = new Set();
    private historyStack: PenDocument[] = [];
    private redoStack: PenDocument[] = [];
    private listeners: Set<ChangeListener> = new Set();
    private readonly maxHistoryLength = 50;

    constructor(initialDocument: PenDocument) {
        this.document = JSON.parse(JSON.stringify(initialDocument));
        this.selectedPageId = this.document.pages[0]?.id || '';
    }

    public getDocument(): PenDocument {
        return this.document;
    }

    public getActivePage(): PageDocument | undefined {
        return this.document.pages.find(p => p.id === this.selectedPageId) || this.document.pages[0];
    }

    public setActivePage(pageId: string): void {
        const exists = this.document.pages.some(p => p.id === pageId);
        if (exists) {
            this.selectedPageId = pageId;
            this.selectedNodeIds.clear();
            this.notify();
        }
    }

    public getSelectedNodeIds(): string[] {
        return Array.from(this.selectedNodeIds);
    }

    public setSelectedNode(nodeId: string | null, multi = false): void {
        if (!nodeId) {
            this.selectedNodeIds.clear();
        } else if (multi) {
            if (this.selectedNodeIds.has(nodeId)) {
                this.selectedNodeIds.delete(nodeId);
            } else {
                this.selectedNodeIds.add(nodeId);
            }
        } else {
            this.selectedNodeIds.clear();
            this.selectedNodeIds.add(nodeId);
        }
        this.notify();
    }

    public subscribe(listener: ChangeListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify(): void {
        for (const listener of this.listeners) {
            listener(this.document);
        }
    }

    private pushHistory(): void {
        this.historyStack.push(JSON.parse(JSON.stringify(this.document)));
        if (this.historyStack.length > this.maxHistoryLength) {
            this.historyStack.shift();
        }
        this.redoStack = []; // Reset redo on new action
    }

    public canUndo(): boolean {
        return this.historyStack.length > 0;
    }

    public canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    public undo(): void {
        if (!this.canUndo()) return;
        this.redoStack.push(JSON.parse(JSON.stringify(this.document)));
        this.document = this.historyStack.pop()!;
        this.notify();
    }

    public redo(): void {
        if (!this.canRedo()) return;
        this.historyStack.push(JSON.parse(JSON.stringify(this.document)));
        this.document = this.redoStack.pop()!;
        this.notify();
    }

    /**
     * Met à jour les propriétés d'un nœud donné
     */
    public updateNode(nodeId: string, updates: Partial<BaseNode> & Record<string, unknown>): boolean {
        const page = this.getActivePage();
        if (!page) return false;

        const targetNode = findNodeById(page.rootNode, nodeId);
        if (!targetNode) return false;

        this.pushHistory();
        Object.assign(targetNode, updates);
        this.document.updatedAt = new Date().toISOString();
        this.notify();
        return true;
    }

    /**
     * Insère un nouveau nœud enfant dans un conteneur Frame
     */
    public insertNode(parentNodeId: string, newNode: SceneNode, index?: number): boolean {
        const page = this.getActivePage();
        if (!page) return false;

        const parent = findNodeById(page.rootNode, parentNodeId);
        if (!parent || !('children' in parent) || !Array.isArray(parent.children)) {
            return false;
        }

        this.pushHistory();
        if (typeof index === 'number' && index >= 0 && index <= parent.children.length) {
            parent.children.splice(index, 0, newNode);
        } else {
            parent.children.push(newNode);
        }

        this.document.updatedAt = new Date().toISOString();
        this.selectedNodeIds.clear();
        this.selectedNodeIds.add(newNode.id);
        this.notify();
        return true;
    }

    /**
     * Supprime un ou plusieurs nœuds du graphe
     */
    public deleteNodes(nodeIds: string[]): boolean {
        const page = this.getActivePage();
        if (!page || nodeIds.length === 0) return false;

        this.pushHistory();
        let changed = false;

        const removeRecursive = (parent: FrameNode): void => {
            const initialLength = parent.children.length;
            parent.children = parent.children.filter(c => !nodeIds.includes(c.id));
            if (parent.children.length !== initialLength) {
                changed = true;
            }
            for (const child of parent.children) {
                if ('children' in child && Array.isArray(child.children)) {
                    removeRecursive(child as FrameNode);
                }
            }
        };

        removeRecursive(page.rootNode);

        if (changed) {
            for (const id of nodeIds) {
                this.selectedNodeIds.delete(id);
            }
            this.document.updatedAt = new Date().toISOString();
            this.notify();
        }
        return changed;
    }

    /**
     * Duplique le nœud sélectionné
     */
    public duplicateNode(nodeId: string): SceneNode | null {
        const page = this.getActivePage();
        if (!page) return null;

        const findParentAndNode = (
            parent: FrameNode,
            targetId: string
        ): { parent: FrameNode; node: SceneNode; index: number } | null => {
            for (let i = 0; i < parent.children.length; i++) {
                const child = parent.children[i];
                if (child.id === targetId) {
                    return { parent, node: child, index: i };
                }
                if ('children' in child && Array.isArray(child.children)) {
                    const res = findParentAndNode(child as FrameNode, targetId);
                    if (res) return res;
                }
            }
            return null;
        };

        const result = findParentAndNode(page.rootNode, nodeId);
        if (!result) return null;

        this.pushHistory();

        const clonedNode: SceneNode = JSON.parse(JSON.stringify(result.node));
        const remapIds = (n: SceneNode) => {
            n.id = `node-${Math.random().toString(36).substring(2, 9)}`;
            n.name = `${n.name} (Copie)`;
            n.x += 16;
            n.y += 16;
            if ('children' in n && Array.isArray(n.children)) {
                for (const c of n.children) remapIds(c);
            }
        };
        remapIds(clonedNode);

        result.parent.children.splice(result.index + 1, 0, clonedNode);
        this.document.updatedAt = new Date().toISOString();
        this.selectedNodeIds.clear();
        this.selectedNodeIds.add(clonedNode.id);
        this.notify();
        return clonedNode;
    }

    /**
     * Change le preset d'appareil pour la page active (Desktop, iPad POS, KDS, Mobile)
     */
    public setPageDevice(pageId: string, device: 'desktop' | 'tablet' | 'mobile' | 'kds'): void {
        const page = this.document.pages.find(p => p.id === pageId);
        if (!page) return;

        this.pushHistory();
        page.device = device;
        const dimensions = {
            desktop: { width: 1920, height: 1080 },
            tablet: { width: 1024, height: 768 },
            kds: { width: 1280, height: 800 },
            mobile: { width: 390, height: 844 },
        }[device];

        page.rootNode.width = dimensions.width;
        page.rootNode.height = dimensions.height;
        this.document.updatedAt = new Date().toISOString();
        this.notify();
    }
}
