/**
 * 🌲 LayersTree — Arborescence et explorateur des calques SceneGraph
 */

"use client";

import React from 'react';
import { SceneNode, FrameNode } from '@/kernel/open-pencil/schema/PenDocument';
import { 
    Layers, Type, Square, Sparkles, Eye, EyeOff, Trash2, ChevronDown, ChevronRight 
} from 'lucide-react';

interface LayersTreeProps {
    rootNode: FrameNode;
    selectedNodeIds: string[];
    onSelectNode: (nodeId: string, multi?: boolean) => void;
    onUpdateNode: (nodeId: string, updates: Partial<SceneNode>) => void;
    onDeleteNode: (nodeId: string) => void;
}

export const LayersTree: React.FC<LayersTreeProps> = ({
    rootNode,
    selectedNodeIds,
    onSelectNode,
    onUpdateNode,
    onDeleteNode,
}) => {
    return (
        <div className="w-72 h-full flex flex-col bg-bg-secondary border-r border-white/10 select-none">
            {/* Header */}
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Calques & Éléments</span>
                </div>
            </div>

            {/* Tree */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-xs">
                <LayerItem
                    node={rootNode}
                    depth={0}
                    selectedNodeIds={selectedNodeIds}
                    onSelectNode={onSelectNode}
                    onUpdateNode={onUpdateNode}
                    onDeleteNode={onDeleteNode}
                />
            </div>
        </div>
    );
};

interface LayerItemProps {
    node: SceneNode;
    depth: number;
    selectedNodeIds: string[];
    onSelectNode: (nodeId: string, multi?: boolean) => void;
    onUpdateNode: (nodeId: string, updates: Partial<SceneNode>) => void;
    onDeleteNode: (nodeId: string) => void;
}

const LayerItem: React.FC<LayerItemProps> = ({
    node,
    depth,
    selectedNodeIds,
    onSelectNode,
    onUpdateNode,
    onDeleteNode,
}) => {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const hasChildren = 'children' in node && Array.isArray(node.children) && node.children.length > 0;
    const isSelected = selectedNodeIds.includes(node.id);

    const getIcon = () => {
        switch (node.type) {
            case 'FRAME':
            case 'COMPONENT':
            case 'INSTANCE':
                return <Square className="w-3.5 h-3.5 text-amber-400" />;
            case 'TEXT':
                return <Type className="w-3.5 h-3.5 text-sky-400" />;
            case 'VECTOR':
                return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
            case 'WIDGET':
                return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
            default:
                return <Square className="w-3.5 h-3.5 text-neutral-400" />;
        }
    };

    return (
        <div>
            <div
                role="button"
                tabIndex={0}
                onClick={e => {
                    e.stopPropagation();
                    onSelectNode(node.id, e.shiftKey || e.metaKey);
                }}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectNode(node.id, e.shiftKey || e.metaKey);
                    }
                }}
                className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                        ? 'bg-amber-500/20 text-white font-medium border border-amber-500/30'
                        : 'hover:bg-white/5 text-neutral-300'
                }`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {hasChildren ? (
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                            aria-label={isExpanded ? 'Replier le groupe' : 'Déplier le groupe'}
                            className="p-0.5 hover:text-white text-neutral-400"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                            ) : (
                                <ChevronRight className="w-3 h-3" />
                            )}
                        </button>
                    ) : (
                        <div className="w-4" />
                    )}
                    {getIcon()}
                    <span className="truncate text-[11px] font-sans ml-1">{node.name}</span>
                </div>

                {/* Actions on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            onUpdateNode(node.id, { visible: node.visible === false ? true : false });
                        }}
                        aria-label={node.visible === false ? 'Afficher le calque' : 'Masquer le calque'}
                        className="p-1 text-neutral-400 hover:text-white"
                        title={node.visible === false ? 'Afficher' : 'Masquer'}
                    >
                        {node.visible === false ? (
                            <EyeOff className="w-3 h-3 text-red-400" />
                        ) : (
                            <Eye className="w-3 h-3" />
                        )}
                    </button>
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            onDeleteNode(node.id);
                        }}
                        aria-label="Supprimer le calque"
                        className="p-1 text-neutral-400 hover:text-red-400"
                        title="Supprimer"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div>
                    {(node as FrameNode).children.map(child => (
                        <LayerItem
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            selectedNodeIds={selectedNodeIds}
                            onSelectNode={onSelectNode}
                            onUpdateNode={onUpdateNode}
                            onDeleteNode={onDeleteNode}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
