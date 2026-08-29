/**
 * 🎛️ PropertyInspector — Inspecteur de propriétés pour le nœud SceneGraph sélectionné
 */

"use client";

import React from 'react';
import { SceneNode, FrameNode, TextNode } from '@/kernel/open-pencil/schema/PenDocument';
import { rgbaToCss, hexToRgba, OPEN_PENCIL_DEFAULT_COLORS } from '@/kernel/open-pencil/schema/StyleTokens';
import { 
    Sliders, Type, Square, AlignLeft, AlignCenter, 
    AlignRight, Maximize, Lock, Eye, Sparkles 
} from 'lucide-react';

interface PropertyInspectorProps {
    node: SceneNode | null;
    onUpdateNode: (nodeId: string, updates: Partial<SceneNode>) => void;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
    node,
    onUpdateNode,
}) => {
    if (!node) {
        return (
            <div className="w-80 h-full bg-bg-secondary border-l border-white/10 p-6 flex flex-col items-center justify-center text-center text-text-muted select-none">
                <Sliders className="w-10 h-10 text-neutral-600 mb-3" />
                <span className="text-xs font-medium text-text-secondary">Aucun élément sélectionné</span>
                <span className="text-[11px] text-text-muted mt-1 max-w-[200px]">
                    Cliquez sur un élément du canvas ou de l arborescence pour inspecter ses propriétés.
                </span>
            </div>
        );
    }

    const isFrame = node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE';
    const isText = node.type === 'TEXT';

    const handleColorChange = (hex: string) => {
        const rgba = hexToRgba(hex);
        onUpdateNode(node.id, {
            fills: [{ type: 'SOLID', color: rgba, tokenReference: hex.startsWith('#') ? undefined : `$${hex}` }],
        });
    };

    return (
        <div className="w-80 h-full bg-bg-secondary border-l border-white/10 flex flex-col select-none overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-text-primary truncate max-w-[160px]">
                        {node.name}
                    </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-amber-400 font-mono uppercase">
                    {node.type}
                </span>
            </div>

            <div className="p-4 space-y-6">
                {/* 1. Dimensions & Position */}
                <div className="space-y-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Dimensions</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-bg-tertiary/40 border border-white/10 rounded-xl p-2 flex items-center justify-between">
                            <span className="text-text-muted font-mono">W</span>
                            <input
                                type="number"
                                value={Math.round(node.width)}
                                onChange={e => onUpdateNode(node.id, { width: Number(e.target.value) })}
                                className="w-16 bg-transparent text-right text-text-primary focus:outline-none font-mono"
                            />
                        </div>
                        <div className="bg-bg-tertiary/40 border border-white/10 rounded-xl p-2 flex items-center justify-between">
                            <span className="text-text-muted font-mono">H</span>
                            <input
                                type="number"
                                value={Math.round(node.height)}
                                onChange={e => onUpdateNode(node.id, { height: Number(e.target.value) })}
                                className="w-16 bg-transparent text-right text-text-primary focus:outline-none font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Text Content & Typography */}
                {isText && (
                    <div className="space-y-3 border-t border-white/5 pt-4">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Typographie</span>
                        
                        <div className="space-y-2">
                            <label className="text-[11px] text-text-secondary">Contenu du Texte</label>
                            <textarea
                                value={(node as TextNode).characters || ''}
                                onChange={e => onUpdateNode(node.id, { characters: e.target.value } as any)}
                                className="w-full h-20 p-2 rounded-xl bg-bg-tertiary/40 border border-white/10 text-xs text-text-primary placeholder-neutral-500 focus:outline-none focus:border-amber-400/50 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-bg-tertiary/40 border border-white/10 rounded-xl p-2 flex items-center justify-between">
                                <span className="text-text-muted font-mono">Taille</span>
                                <input
                                    type="number"
                                    value={(node as TextNode).style?.fontSize || 14}
                                    onChange={e => {
                                        const current = (node as TextNode).style || ({} as any);
                                        onUpdateNode(node.id, {
                                            style: { ...current, fontSize: Number(e.target.value) },
                                        } as any);
                                    }}
                                    className="w-12 bg-transparent text-right text-text-primary focus:outline-none font-mono"
                                />
                            </div>

                            <select
                                value={(node as TextNode).style?.fontFamily || 'Inter, sans-serif'}
                                onChange={e => {
                                    const current = (node as TextNode).style || ({} as any);
                                    onUpdateNode(node.id, {
                                        style: { ...current, fontFamily: e.target.value },
                                    } as any);
                                }}
                                className="bg-bg-tertiary/40 border border-white/10 rounded-xl px-2 py-1 text-xs text-text-primary focus:outline-none"
                            >
                                <option value="Cormorant Garamond, serif">Cormorant (Brand)</option>
                                <option value="Inter, sans-serif">Inter (Standard)</option>
                                <option value="JetBrains Mono, monospace">Mono (Chiffres)</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* 3. Auto-Layout (Frames) */}
                {isFrame && (
                    <div className="space-y-3 border-t border-white/5 pt-4">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Auto-Layout</span>

                        <div className="grid grid-cols-3 gap-1 bg-bg-tertiary/40 p-1 rounded-xl border border-white/5">
                            <button
                                onClick={() => onUpdateNode(node.id, { layoutMode: 'NONE' } as any)}
                                className={`py-1 rounded text-[11px] font-medium transition-all ${
                                    !(node as FrameNode).layoutMode || (node as FrameNode).layoutMode === 'NONE'
                                        ? 'bg-amber-500/20 text-amber-300'
                                        : 'text-text-muted'
                                }`}
                            >
                                Libre
                            </button>
                            <button
                                onClick={() => onUpdateNode(node.id, { layoutMode: 'HORIZONTAL' } as any)}
                                className={`py-1 rounded text-[11px] font-medium transition-all ${
                                    (node as FrameNode).layoutMode === 'HORIZONTAL'
                                        ? 'bg-amber-500/20 text-amber-300'
                                        : 'text-text-muted'
                                }`}
                            >
                                Ligne (Row)
                            </button>
                            <button
                                onClick={() => onUpdateNode(node.id, { layoutMode: 'VERTICAL' } as any)}
                                className={`py-1 rounded text-[11px] font-medium transition-all ${
                                    (node as FrameNode).layoutMode === 'VERTICAL'
                                        ? 'bg-amber-500/20 text-amber-300'
                                        : 'text-text-muted'
                                }`}
                            >
                                Colonne
                            </button>
                        </div>

                        {(node as FrameNode).layoutMode && (node as FrameNode).layoutMode !== 'NONE' && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-bg-tertiary/40 border border-white/10 rounded-xl p-2 flex items-center justify-between">
                                    <span className="text-text-muted font-mono">Espacement</span>
                                    <input
                                        type="number"
                                        value={(node as FrameNode).itemSpacing || 0}
                                        onChange={e => onUpdateNode(node.id, { itemSpacing: Number(e.target.value) } as any)}
                                        className="w-12 bg-transparent text-right text-text-primary focus:outline-none font-mono"
                                    />
                                </div>
                                <div className="bg-bg-tertiary/40 border border-white/10 rounded-xl p-2 flex items-center justify-between">
                                    <span className="text-text-muted font-mono">Padding</span>
                                    <input
                                        type="number"
                                        value={(node as FrameNode).paddingLeft || 0}
                                        onChange={e => {
                                            const p = Number(e.target.value);
                                            onUpdateNode(node.id, {
                                                paddingLeft: p,
                                                paddingRight: p,
                                                paddingTop: p,
                                                paddingBottom: p,
                                            } as any);
                                        }}
                                        className="w-12 bg-transparent text-right text-text-primary focus:outline-none font-mono"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 4. Appearance & Colors */}
                <div className="space-y-3 border-t border-white/5 pt-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Couleur & Remplissage</span>
                    
                    {/* Preset Palettes */}
                    <div className="grid grid-cols-6 gap-1.5">
                        {Object.entries(OPEN_PENCIL_DEFAULT_COLORS).slice(0, 12).map(([key, rgba]) => (
                            <button
                                key={key}
                                onClick={() => handleColorChange(rgbaToCss(rgba))}
                                className="w-7 h-7 rounded-lg border border-white/10 transition-transform hover:scale-110"
                                style={{ backgroundColor: rgbaToCss(rgba) }}
                                title={key}
                            />
                        ))}
                    </div>

                    {/* Corner Radius */}
                    <div className="bg-bg-tertiary/40 border border-white/10 rounded-xl p-2 flex items-center justify-between text-xs">
                        <span className="text-text-muted font-mono">Rayon (Radius)</span>
                        <input
                            type="number"
                            value={typeof node.cornerRadius === 'number' ? node.cornerRadius : 0}
                            onChange={e => onUpdateNode(node.id, { cornerRadius: Number(e.target.value) })}
                            className="w-12 bg-transparent text-right text-text-primary focus:outline-none font-mono"
                        />
                    </div>
                </div>

                {/* 5. RBAC & Metadata */}
                <div className="space-y-3 border-t border-white/5 pt-4">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Liaisons & Sécurité</span>
                    <div className="space-y-2">
                        <label className="text-[11px] text-text-secondary">Rôle RBAC Minimum</label>
                        <select
                            value={node.roleLevelMin || 0}
                            onChange={e => onUpdateNode(node.id, { roleLevelMin: Number(e.target.value) })}
                            className="w-full bg-bg-tertiary/40 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-text-primary focus:outline-none"
                        >
                            <option value={0}>Tous Rôles (Public / Équipe)</option>
                            <option value={40}>Serveur / Barman (Niveau 40)</option>
                            <option value={50}>Chef de Rang / Cuisine (Niveau 50)</option>
                            <option value={70}>Manager (Niveau 70)</option>
                            <option value={90}>Directeur (Niveau 90)</option>
                            <option value={100}>Administrateur (Niveau 100)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};
