/**
 * 🎨 OpenPencilStudio — Espace de Travail de Design & Personnalisation des 84 Pages de Restaurant OS
 * Standardisé pour Restaurant OS Core & Édition Multi-Tenant Clients
 */

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { SceneGraphManager } from '@/kernel/open-pencil/engine/SceneGraphManager';
import { PageCatalogRegistry } from '@/kernel/open-pencil/catalog/PageCatalogRegistry';
import { TenantPageCustomizer, ClientBrandDna } from '@/kernel/open-pencil/overrides/TenantPageCustomizer';
import { SceneNode, PenDocument } from '@/kernel/open-pencil/schema/PenDocument';
import { findNodeById } from '@/kernel/open-pencil/schema/LayoutConstraints';

import { SceneGraphCanvas } from './Canvas/SceneGraphCanvas';
import { PageNavigator } from './Sidebar/PageNavigator';
import { LayersTree } from './Sidebar/LayersTree';
import { ComponentsLibrary } from './Sidebar/ComponentsLibrary';
import { PropertyInspector } from './Inspector/PropertyInspector';
import { ClientBrandingSelector } from './Inspector/ClientBrandingSelector';
import { DesignAgentBar } from './AgentPrompt/DesignAgentBar';
import { ExportImportModal } from './ExportModal/ExportImportModal';

import { 
    Undo, Redo, Download, Sparkles, Layers, 
    BookOpen, Plus, Save, CheckCircle2, Store 
} from 'lucide-react';

export const OpenPencilStudio: React.FC = () => {
    // 1. Initial State: Load all 84 pages into PenDocument
    const initialPenDoc = useMemo(() => PageCatalogRegistry.createFullPenDocument('_demo_restaurant'), []);
    const [manager] = useState(() => new SceneGraphManager(initialPenDoc));
    const [document, setDocument] = useState<PenDocument>(() => manager.getDocument());
    const [activePageId, setActivePageId] = useState<string>('page-pos');
    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
    const [sidebarTab, setSidebarTab] = useState<'pages' | 'layers' | 'components'>('pages');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [currentTenantId, setCurrentTenantId] = useState<string>('_demo_restaurant');
    const [saveToast, setSaveToast] = useState<string | null>(null);

    // Subscribe to Manager changes
    useEffect(() => {
        const unsubscribe = manager.subscribe(updatedDoc => {
            setDocument(JSON.parse(JSON.stringify(updatedDoc)));
        });
        return unsubscribe;
    }, [manager]);

    const activePage = useMemo(() => {
        return document.pages.find(p => p.id === activePageId) || document.pages[0];
    }, [document, activePageId]);

    const selectedNode = useMemo(() => {
        if (!selectedNodeIds.length || !activePage) return null;
        return findNodeById(activePage.rootNode, selectedNodeIds[0]);
    }, [activePage, selectedNodeIds]);

    // Handle selecting a different page from the 84 catalog
    const handleSelectPage = (pageId: string) => {
        setActivePageId(pageId);
        manager.setActivePage(pageId);
        setSelectedNodeIds([]);
    };

    const handleSelectNode = (nodeId: string, multi = false) => {
        manager.setSelectedNode(nodeId || null, multi);
        setSelectedNodeIds(manager.getSelectedNodeIds());
    };

    const handleUpdateNode = (nodeId: string, updates: Partial<SceneNode>) => {
        manager.updateNode(nodeId, updates);
    };

    const handleDeleteNode = (nodeId: string) => {
        manager.deleteNodes([nodeId]);
    };

    const handleInsertComponent = (newNode: SceneNode) => {
        const targetParentId = selectedNode?.type === 'FRAME' ? selectedNode.id : activePage.rootNode.id;
        manager.insertNode(targetParentId, newNode);
    };

    const handleDeviceChange = (device: 'desktop' | 'tablet' | 'mobile' | 'kds') => {
        manager.setPageDevice(activePage.id, device);
    };

    const handleApplyClientBrand = (brandDna: ClientBrandDna) => {
        setCurrentTenantId(brandDna.tenantId);
        const brandedPage = TenantPageCustomizer.applyBrandDna(activePage, brandDna);
        manager.updateNode(activePage.rootNode.id, {
            children: brandedPage.rootNode.children,
            fills: brandedPage.rootNode.fills,
        });
        setSaveToast(`ADN de ${brandDna.restaurantName} appliqué !`);
        setTimeout(() => setSaveToast(null), 3000);
    };

    const handleResetToDefault = () => {
        TenantPageCustomizer.resetPageForTenant(currentTenantId, activePage.id);
        const fresh = TenantPageCustomizer.getPageForTenant('_demo_restaurant', activePage.id);
        manager.updateNode(activePage.rootNode.id, {
            children: fresh.rootNode.children,
            fills: fresh.rootNode.fills,
        });
        setSaveToast('Page réinitialisée au modèle usine');
        setTimeout(() => setSaveToast(null), 3000);
    };

    const handleSaveToTenant = () => {
        TenantPageCustomizer.savePageForTenant(currentTenantId, activePage);
        setSaveToast(`Page "${activePage.name}" enregistrée pour le client ${currentTenantId} !`);
        setTimeout(() => setSaveToast(null), 3000);
    };

    const handleAgentTransform = async (instruction: string) => {
        // AI prompt handler: transform layout/tokens on active page
        const isGoldPrompt = instruction.toLowerCase().includes('or') || instruction.toLowerCase().includes('gastronomique');
        const isTactilePrompt = instruction.toLowerCase().includes('tactile') || instruction.toLowerCase().includes('48px');

        if (isGoldPrompt) {
            handleApplyClientBrand({
                tenantId: currentTenantId,
                restaurantName: 'Gastronomique Impérial',
                primaryColor: '#C5A059',
                fontFamilyBrand: 'Cormorant Garamond, serif',
            });
        } else if (isTactilePrompt) {
            // Apply tactile sizing to all buttons
            const updateButtons = (node: SceneNode) => {
                if (node.type === 'FRAME' && (node.id.includes('btn') || node.name.toLowerCase().includes('bouton'))) {
                    manager.updateNode(node.id, { width: 180, height: 48, cornerRadius: 16 });
                }
                if ('children' in node && Array.isArray(node.children)) {
                    for (const c of node.children) updateButtons(c);
                }
            };
            updateButtons(activePage.rootNode);
        } else {
            // Default AI transformation
            handleUpdateNode(activePage.rootNode.id, {
                cornerRadius: 24,
            });
        }
    };

    const handleImportPen = (importedDoc: PenDocument) => {
        if (importedDoc.pages && importedDoc.pages.length > 0) {
            const firstPage = importedDoc.pages[0];
            manager.updateNode(activePage.rootNode.id, {
                children: firstPage.rootNode.children,
                fills: firstPage.rootNode.fills,
                width: firstPage.rootNode.width,
                height: firstPage.rootNode.height,
            });
            setSaveToast('Document .pen importé avec succès');
            setTimeout(() => setSaveToast(null), 3000);
        }
    };

    return (
        <div className="w-full h-[100dvh] flex flex-col bg-bg-primary text-text-primary select-none overflow-hidden">
            {/* Top Navigation Bar */}
            <header className="h-14 border-b border-white/10 bg-bg-secondary px-6 flex items-center justify-between z-40">
                {/* Logo & Title */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-950/40">
                        <Sparkles className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-sm font-bold tracking-wide font-brand text-text-primary">
                                OpenPencil Studio &bull; Restaurant OS
                            </h1>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-medium">
                                Design-as-Code
                            </span>
                        </div>
                        <p className="text-[11px] text-text-secondary">
                            Éditeur Visuel & Personnalisation Multi-Tenant des 84 Pages
                        </p>
                    </div>
                </div>

                {/* Center Page Title & Route */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-bg-tertiary/40 border border-white/5">
                    <Store className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-semibold text-text-primary">{activePage.name}</span>
                    <span className="text-[11px] text-text-muted font-mono">({activePage.route})</span>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2">
                    {saveToast && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium animate-fade-in">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{saveToast}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1 bg-bg-tertiary/40 p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => manager.undo()}
                            disabled={!manager.canUndo()}
                            aria-label="Annuler la dernière action"
                            className="p-1.5 rounded-lg text-text-secondary hover:text-white disabled:opacity-30 transition-colors"
                            title="Annuler (⌘Z)"
                        >
                            <Undo className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => manager.redo()}
                            disabled={!manager.canRedo()}
                            aria-label="Rétablir la dernière action"
                            className="p-1.5 rounded-lg text-text-secondary hover:text-white disabled:opacity-30 transition-colors"
                            title="Rétablir (⌘⇧Z)"
                        >
                            <Redo className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={handleSaveToTenant}
                        className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-text-primary font-medium flex items-center gap-1.5 border border-white/10 transition-colors"
                    >
                        <Save className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Enregistrer</span>
                    </button>

                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-amber-950/40"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Exporter / Code</span>
                    </button>
                </div>
            </header>

            {/* Main Workspace Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Navigation Tabs (Pages / Layers / Components) */}
                <div className="w-12 border-r border-white/10 bg-bg-tertiary flex flex-col items-center py-3 gap-3 z-20">
                    <button
                        onClick={() => setSidebarTab('pages')}
                        className={`p-2.5 rounded-xl transition-all ${
                            sidebarTab === 'pages'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'text-text-muted hover:text-white'
                        }`}
                        title="Catalogue des 84 Pages"
                    >
                        <BookOpen className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => setSidebarTab('layers')}
                        className={`p-2.5 rounded-xl transition-all ${
                            sidebarTab === 'layers'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'text-text-muted hover:text-white'
                        }`}
                        title="Arborescence des Calques"
                    >
                        <Layers className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => setSidebarTab('components')}
                        className={`p-2.5 rounded-xl transition-all ${
                            sidebarTab === 'components'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'text-text-muted hover:text-white'
                        }`}
                        title="Bibliothèque de Composants"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Left Sidebar Content */}
                <div className="shrink-0 flex">
                    {sidebarTab === 'pages' && (
                        <PageNavigator
                            activePageId={activePage.id}
                            onSelectPage={handleSelectPage}
                        />
                    )}
                    {sidebarTab === 'layers' && (
                        <LayersTree
                            rootNode={activePage.rootNode}
                            selectedNodeIds={selectedNodeIds}
                            onSelectNode={handleSelectNode}
                            onUpdateNode={handleUpdateNode}
                            onDeleteNode={handleDeleteNode}
                        />
                    )}
                    {sidebarTab === 'components' && (
                        <ComponentsLibrary
                            onInsertComponent={handleInsertComponent}
                        />
                    )}
                </div>

                {/* Center Canvas Viewport */}
                <div className="flex-1 flex flex-col min-w-0 bg-bg-primary">
                    <div className="flex-1 overflow-hidden">
                        <SceneGraphCanvas
                            page={activePage}
                            selectedNodeIds={selectedNodeIds}
                            onSelectNode={handleSelectNode}
                            onDeviceChange={handleDeviceChange}
                        />
                    </div>

                    {/* Bottom AI Prompt Bar */}
                    <DesignAgentBar
                        page={activePage}
                        onApplyAgentTransform={handleAgentTransform}
                    />
                </div>

                {/* Right Inspector & Client Branding Sidebar */}
                <div className="shrink-0 w-80 flex flex-col bg-bg-secondary border-l border-white/10 overflow-hidden">
                    <ClientBrandingSelector
                        currentTenantId={currentTenantId}
                        onApplyClientBrand={handleApplyClientBrand}
                        onResetToDefault={handleResetToDefault}
                    />

                    <div className="flex-1 overflow-y-auto">
                        <PropertyInspector
                            node={selectedNode}
                            onUpdateNode={handleUpdateNode}
                        />
                    </div>
                </div>
            </div>

            {/* Export & Import Modal */}
            <ExportImportModal
                page={activePage}
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onImportPen={handleImportPen}
                onSaveToTenant={handleSaveToTenant}
            />
        </div>
    );
};
