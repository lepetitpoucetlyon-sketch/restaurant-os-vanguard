/**
 * 🎨 SceneGraphCanvas — Canvas interactif multi-résolution avec pan, zoom et cadre d'appareils
 */

"use client";

import React, { useState, useRef } from 'react';
import { PageDocument } from '@/kernel/open-pencil/schema/PenDocument';
import { NodeRenderer } from './NodeRenderer';
import { 
    ZoomIn, ZoomOut, Maximize2, Tablet, Monitor, Smartphone, 
    Layers, Grid 
} from 'lucide-react';

interface SceneGraphCanvasProps {
    page: PageDocument;
    selectedNodeIds: string[];
    onSelectNode: (nodeId: string, multi?: boolean) => void;
    onDeviceChange: (device: 'desktop' | 'tablet' | 'mobile' | 'kds') => void;
}

export const SceneGraphCanvas: React.FC<SceneGraphCanvasProps> = ({
    page,
    selectedNodeIds,
    onSelectNode,
    onDeviceChange,
}) => {
    const [zoom, setZoom] = useState<number>(0.65);
    const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
    const [isPanning, setIsPanning] = useState<boolean>(false);
    const [showGrid, setShowGrid] = useState<boolean>(true);
    const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            setZoom(prev => Math.min(2.5, Math.max(0.2, prev + delta)));
        } else {
            setPan(prev => ({
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY,
            }));
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Pan if middle click or click on canvas background
        if (e.button === 1 || (e.target as HTMLElement).id === 'canvas-viewport') {
            setIsPanning(true);
            startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setPan({
                x: e.clientX - startPanRef.current.x,
                y: e.clientY - startPanRef.current.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    const resetZoom = () => {
        setZoom(page.device === 'desktop' ? 0.5 : 0.75);
        setPan({ x: 40, y: 40 });
    };

    return (
        <div className="relative w-full h-full flex flex-col bg-bg-primary overflow-hidden select-none">
            {/* Top Toolbar */}
            <div className="h-12 border-b border-white/10 bg-bg-secondary/90 backdrop-blur-md px-4 flex items-center justify-between z-30">
                {/* Device Frame Presets */}
                <div className="flex items-center gap-1 bg-bg-tertiary/40 p-1 rounded-xl border border-white/5">
                    <button
                        onClick={() => onDeviceChange('desktop')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            page.device === 'desktop'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                                : 'text-text-secondary hover:text-white'
                        }`}
                        title="Desktop 1920x1080"
                    >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Desktop</span>
                    </button>
                    <button
                        onClick={() => onDeviceChange('tablet')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            page.device === 'tablet'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                                : 'text-text-secondary hover:text-white'
                        }`}
                        title="iPad POS 1024x768"
                    >
                        <Tablet className="w-3.5 h-3.5" />
                        <span>iPad POS</span>
                    </button>
                    <button
                        onClick={() => onDeviceChange('kds')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            page.device === 'kds'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                                : 'text-text-secondary hover:text-white'
                        }`}
                        title="Écran Tactile KDS 1280x800"
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span>KDS Kitchen</span>
                    </button>
                    <button
                        onClick={() => onDeviceChange('mobile')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            page.device === 'mobile'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                                : 'text-text-secondary hover:text-white'
                        }`}
                        title="Mobile 390x844"
                    >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Mobile</span>
                    </button>
                </div>

                {/* Page Info */}
                <div className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary font-mono">
                        {page.rootNode.width} × {page.rootNode.height} px
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                        {page.route}
                    </span>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                            showGrid ? 'bg-white/10 text-amber-400' : 'text-text-secondary hover:text-white'
                        }`}
                        title="Activer/Désactiver la grille"
                    >
                        <Grid className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1 bg-bg-tertiary/40 px-2 py-1 rounded-xl border border-white/5 text-xs text-text-secondary font-mono">
                        <button
                            onClick={() => setZoom(prev => Math.max(0.2, prev - 0.1))}
                            aria-label="Dézoomer"
                            className="p-1 hover:text-white"
                        >
                            <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-12 text-center">{Math.round(zoom * 100)}%</span>
                        <button
                            onClick={() => setZoom(prev => Math.min(2.5, prev + 0.1))}
                            aria-label="Zoomer"
                            className="p-1 hover:text-white"
                        >
                            <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <button
                        onClick={resetZoom}
                        aria-label="Recentrer le canvas"
                        className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                        title="Recentrer le canvas"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Canvas Viewport */}
            <div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as HTMLElement).click(); } }}
                id="canvas-viewport"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={() => onSelectNode('')}
                className="relative flex-1 overflow-hidden cursor-crosshair"
                style={{
                    backgroundImage: showGrid
                        ? 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)'
                        : 'none',
                    backgroundSize: '24px 24px',
                }}
            >
                {/* Scaled & Panned SceneGraph Container */}
                <div
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: '0 0',
                        transition: isPanning ? 'none' : 'transform 0.05s ease-out',
                        boxShadow: '0 25px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)',
                        width: `${page.rootNode.width}px`,
                        height: `${page.rootNode.height}px`,
                    }}
                    className="relative rounded-3xl overflow-hidden bg-bg-primary"
                >
                    <NodeRenderer
                        node={page.rootNode}
                        selectedNodeIds={selectedNodeIds}
                        onSelectNode={onSelectNode}
                    />
                </div>
            </div>
        </div>
    );
};
