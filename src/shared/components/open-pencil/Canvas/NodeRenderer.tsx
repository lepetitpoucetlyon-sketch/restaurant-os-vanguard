/**
 * 🎨 NodeRenderer — Rendu vectoriel et interactif haute fidélité des nœuds SceneGraph
 */

"use client";

import React from 'react';
import { SceneNode, FrameNode, TextNode, RectangleNode, VectorNode, WidgetNode } from '@/kernel/open-pencil/schema/PenDocument';
import { rgbaToCss } from '@/kernel/open-pencil/schema/StyleTokens';
import { computeAutoLayout } from '@/kernel/open-pencil/schema/LayoutConstraints';
import { 
    LayoutDashboard, Sparkles, ShoppingCart, Smartphone, ChefHat, Utensils, 
    Wine, MonitorSmartphone, Map, Package, Receipt, Truck, Clock, Wrench, 
    Microscope, ShieldCheck, CalendarDays, Users, BookOpen, TrendingUp, 
    Building2, Shield, ScrollText, Palmtree, UserPlus, UserCog, Gauge, 
    Activity, Bot, Network, CreditCard, Banknote, Star, PartyPopper, Store, 
    Heart, Globe, Lock, Plug, HelpCircle, LucideIcon 
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
    LayoutDashboard, Sparkles, ShoppingCart, Smartphone, ChefHat, Utensils,
    Wine, MonitorSmartphone, Map, Package, Receipt, Truck, Clock, Wrench,
    Microscope, ShieldCheck, CalendarDays, Users, BookOpen, TrendingUp,
    Building2, Shield, ScrollText, Palmtree, UserPlus, UserCog, Gauge,
    Activity, Bot, Network, CreditCard, Banknote, Star, PartyPopper, Store,
    Heart, Globe, Lock, Plug, HelpCircle
};

interface NodeRendererProps {
    node: SceneNode;
    selectedNodeIds: string[];
    onSelectNode: (nodeId: string, multi?: boolean) => void;
}

export const NodeRenderer: React.FC<NodeRendererProps> = ({
    node,
    selectedNodeIds,
    onSelectNode,
}) => {
    if (node.visible === false) return null;

    const isSelected = selectedNodeIds.includes(node.id);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectNode(node.id, e.shiftKey || e.metaKey);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onSelectNode(node.id, e.shiftKey || e.metaKey);
        }
    };

    const outlineStyle = isSelected
        ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-black/50 z-20'
        : 'hover:ring-1 hover:ring-amber-400/40';

    switch (node.type) {
        case 'FRAME':
        case 'GROUP':
        case 'COMPONENT':
        case 'INSTANCE': {
            const frame = node as FrameNode;
            const layoutBoxes = computeAutoLayout(frame);

            const bgCss = frame.fills && frame.fills.length > 0
                ? rgbaToCss(frame.fills[0].color)
                : 'transparent';

            const borderCss = frame.strokes && frame.strokes.length > 0
                ? `${frame.strokes[0].width}px solid ${rgbaToCss(frame.strokes[0].color)}`
                : 'none';

            const radius = typeof frame.cornerRadius === 'number'
                ? `${frame.cornerRadius}px`
                : Array.isArray(frame.cornerRadius)
                ? `${frame.cornerRadius.join('px ')}px`
                : '0px';

            const isAutoLayout = frame.layoutMode && frame.layoutMode !== 'NONE';

            return (
                <div
                    role="button"
                    tabIndex={0}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                    id={frame.id}
                    className={`transition-shadow duration-150 ${outlineStyle}`}
                    style={{
                        position: 'relative',
                        width: isAutoLayout && frame.layoutSizingHorizontal === 'FILL' ? '100%' : `${frame.width}px`,
                        height: isAutoLayout && frame.layoutSizingVertical === 'FILL' ? '100%' : `${frame.height}px`,
                        backgroundColor: bgCss,
                        border: borderCss,
                        borderRadius: radius,
                        display: isAutoLayout ? 'flex' : 'block',
                        flexDirection: frame.layoutMode === 'VERTICAL' ? 'column' : 'row',
                        justifyContent: frame.primaryAxisAlign === 'SPACE_BETWEEN'
                            ? 'space-between'
                            : frame.primaryAxisAlign === 'CENTER'
                            ? 'center'
                            : 'flex-start',
                        alignItems: frame.counterAxisAlign === 'CENTER'
                            ? 'center'
                            : frame.counterAxisAlign === 'STRETCH'
                            ? 'stretch'
                            : 'flex-start',
                        gap: frame.itemSpacing ? `${frame.itemSpacing}px` : undefined,
                        paddingTop: frame.paddingTop ? `${frame.paddingTop}px` : undefined,
                        paddingRight: frame.paddingRight ? `${frame.paddingRight}px` : undefined,
                        paddingBottom: frame.paddingBottom ? `${frame.paddingBottom}px` : undefined,
                        paddingLeft: frame.paddingLeft ? `${frame.paddingLeft}px` : undefined,
                        overflow: frame.clipContent ? 'hidden' : 'visible',
                        cursor: 'pointer',
                    }}
                >
                    {frame.children && frame.children.map(child => {
                        const box = layoutBoxes.get(child.id);
                        if (!isAutoLayout && box) {
                            return (
                                <div
                                    key={child.id}
                                    style={{
                                        position: 'absolute',
                                        left: `${box.x}px`,
                                        top: `${box.y}px`,
                                        width: `${box.width}px`,
                                        height: `${box.height}px`,
                                    }}
                                >
                                    <NodeRenderer
                                        node={child}
                                        selectedNodeIds={selectedNodeIds}
                                        onSelectNode={onSelectNode}
                                    />
                                </div>
                            );
                        }

                        return (
                            <NodeRenderer
                                key={child.id}
                                node={child}
                                selectedNodeIds={selectedNodeIds}
                                onSelectNode={onSelectNode}
                            />
                        );
                    })}
                </div>
            );
        }

        case 'TEXT': {
            const textNode = node as TextNode;
            const style = textNode.style || {};
            const textFill = textNode.fills && textNode.fills.length > 0
                ? rgbaToCss(textNode.fills[0].color)
                : '#F5F5F7';

            return (
                <div
                    role="button"
                    tabIndex={0}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                    className={`select-none whitespace-pre-wrap ${outlineStyle}`}
                    style={{
                        color: textFill,
                        fontFamily: style.fontFamily || 'Inter, sans-serif',
                        fontWeight: style.fontWeight || 400,
                        fontSize: style.fontSize ? `${style.fontSize}px` : '14px',
                        lineHeight: style.lineHeight ? `${style.lineHeight}` : '1.4',
                        letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : undefined,
                        textAlign: style.textAlign || 'left',
                        textTransform: style.textTransform || 'none',
                        cursor: 'pointer',
                    }}
                >
                    {textNode.characters}
                </div>
            );
        }

        case 'VECTOR': {
            const vecNode = node as VectorNode;
            const Icon = (vecNode.iconName && ICON_MAP[vecNode.iconName]) || Sparkles;
            const iconFill = vecNode.fills && vecNode.fills.length > 0
                ? rgbaToCss(vecNode.fills[0].color)
                : '#C5A059';

            return (
                <div 
                    role="button"
                    tabIndex={0}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                    className={`inline-flex items-center justify-center ${outlineStyle}`}
                >
                    <Icon
                        className="w-full h-full"
                        style={{
                            width: `${vecNode.width || 24}px`,
                            height: `${vecNode.height || 24}px`,
                            color: iconFill,
                        }}
                    />
                </div>
            );
        }

        case 'RECTANGLE':
        case 'IMAGE': {
            const rect = node as RectangleNode;
            const bgCss = rect.fills && rect.fills.length > 0
                ? rgbaToCss(rect.fills[0].color)
                : '#18181F';

            return (
                <div
                    role="button"
                    tabIndex={0}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                    className={`overflow-hidden ${outlineStyle}`}
                    style={{
                        width: `${rect.width}px`,
                        height: `${rect.height}px`,
                        backgroundColor: bgCss,
                        borderRadius: rect.cornerRadius ? `${rect.cornerRadius}px` : '0px',
                        cursor: 'pointer',
                    }}
                >
                    {rect.imageUrl && (
                        <img
                            src={rect.imageUrl}
                            alt={rect.name}
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
            );
        }

        case 'WIDGET':
        case 'SLOT': {
            const widget = node as WidgetNode;
            return (
                <div
                    role="button"
                    tabIndex={0}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                    className={`p-4 rounded-2xl border border-amber-500/30 bg-bg-tertiary/40 backdrop-blur-md flex flex-col items-center justify-center text-center gap-2 ${outlineStyle}`}
                    style={{
                        width: '100%',
                        minHeight: '120px',
                        cursor: 'pointer',
                    }}
                >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase">
                        {widget.widgetType}
                    </span>
                    <span className="text-xs text-text-muted">Composant Métier Restaurant OS</span>
                </div>
            );
        }

        default:
            return null;
    }
};
