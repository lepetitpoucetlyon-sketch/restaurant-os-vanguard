/**
 * 📦 ComponentsLibrary — Palette des composants prêts à glisser-déposer dans la page
 */

"use client";

import React from 'react';
import { SceneNode, FrameNode, TextNode, WidgetNode } from '@/kernel/open-pencil/schema/PenDocument';
import { createSolidPaint, OPEN_PENCIL_DEFAULT_TYPOGRAPHY } from '@/kernel/open-pencil/schema/StyleTokens';
import { Button } from "@/shared/components/ui/Button";
import { 
    Plus, Square, CreditCard, ShoppingCart, TrendingUp, Utensils 
} from 'lucide-react';

interface ComponentsLibraryProps {
    onInsertComponent: (node: SceneNode) => void;
}

export const ComponentsLibrary: React.FC<ComponentsLibraryProps> = ({
    onInsertComponent,
}) => {
    const handleAddButton = (variant: 'primary' | 'secondary') => {
        const id = `btn-${Math.random().toString(36).substring(2, 8)}`;
        const newNode: FrameNode = {
            id,
            name: variant === 'primary' ? 'Bouton Doré' : 'Bouton Secondaire',
            type: 'FRAME',
            visible: true,
            locked: false,
            x: 50,
            y: 50,
            width: 160,
            height: 44,
            cornerRadius: 12,
            layoutMode: 'HORIZONTAL',
            primaryAxisAlign: 'CENTER',
            counterAxisAlign: 'CENTER',
            fills: [createSolidPaint(variant === 'primary' ? 'brand.gold.primary' : 'bg.tertiary')],
            children: [
                {
                    id: `txt-${id}`,
                    name: 'Label',
                    type: 'TEXT',
                    visible: true,
                    locked: false,
                    x: 0,
                    y: 0,
                    width: 120,
                    height: 20,
                    characters: variant === 'primary' ? 'Valider la Commande' : 'Annuler',
                    style: OPEN_PENCIL_DEFAULT_TYPOGRAPHY.badge,
                    fills: [createSolidPaint(variant === 'primary' ? 'bg.primary' : 'text.primary')],
                } as TextNode,
            ],
        };
        onInsertComponent(newNode);
    };

    const handleAddGlassCard = () => {
        const id = `card-${Math.random().toString(36).substring(2, 8)}`;
        const newNode: FrameNode = {
            id,
            name: 'Carte Glassmorphism',
            type: 'FRAME',
            visible: true,
            locked: false,
            x: 50,
            y: 50,
            width: 320,
            height: 180,
            cornerRadius: 20,
            layoutMode: 'VERTICAL',
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 20,
            paddingBottom: 20,
            itemSpacing: 12,
            fills: [createSolidPaint('bg.secondary', 0.7)],
            strokes: [{ color: { r: 1, g: 1, b: 1, a: 0.08 }, width: 1 }],
            children: [
                {
                    id: `title-${id}`,
                    name: 'Card Title',
                    type: 'TEXT',
                    visible: true,
                    locked: false,
                    x: 0,
                    y: 0,
                    width: 250,
                    height: 24,
                    characters: 'Titre de la Section',
                    style: OPEN_PENCIL_DEFAULT_TYPOGRAPHY.h3,
                    fills: [createSolidPaint('brand.gold.primary')],
                } as TextNode,
                {
                    id: `desc-${id}`,
                    name: 'Card Body',
                    type: 'TEXT',
                    visible: true,
                    locked: false,
                    x: 0,
                    y: 0,
                    width: 280,
                    height: 40,
                    characters: 'Contenu descriptif ou statistiques en direct.',
                    style: OPEN_PENCIL_DEFAULT_TYPOGRAPHY.bodyMedium,
                    fills: [createSolidPaint('text.secondary')],
                } as TextNode,
            ],
        };
        onInsertComponent(newNode);
    };

    const handleAddWidget = (widgetType: string, label: string) => {
        const id = `widget-${Math.random().toString(36).substring(2, 8)}`;
        const newNode: WidgetNode = {
            id,
            name: `Widget: ${label}`,
            type: 'WIDGET',
            visible: true,
            locked: false,
            x: 50,
            y: 50,
            width: 350,
            height: 160,
            widgetType,
            widgetProps: {},
        };
        onInsertComponent(newNode);
    };

    return (
        <div className="w-72 h-full flex flex-col bg-bg-secondary border-r border-white/10 select-none p-3 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Bibliothèque de Composants</span>
            </div>

            <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Primitives</span>
                
                <Button variant="ghost"
                    onClick={() => handleAddButton('primary')}
                    className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 text-left flex items-center gap-2.5 text-xs text-neutral-200 transition-all group"
                >
                    <Square className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span>Bouton Tactile Or</span>
                </Button>

                <Button variant="ghost"
                    onClick={() => handleAddButton('secondary')}
                    className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center gap-2.5 text-xs text-neutral-200 transition-all group"
                >
                    <Square className="w-4 h-4 text-neutral-400 group-hover:scale-110 transition-transform" />
                    <span>Bouton Neutre</span>
                </Button>

                <Button variant="ghost"
                    onClick={handleAddGlassCard}
                    className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 text-left flex items-center gap-2.5 text-xs text-neutral-200 transition-all group"
                >
                    <CreditCard className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span>Carte Glassmorphism</span>
                </Button>
            </div>

            <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Widgets Métiers</span>

                <Button variant="ghost"
                    onClick={() => handleAddWidget('POS_CART', 'Panier d Addition')}
                    className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 text-left flex items-center gap-2.5 text-xs text-neutral-200 transition-all group"
                >
                    <ShoppingCart className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Panier d Addition POS</span>
                </Button>

                <Button variant="ghost"
                    onClick={() => handleAddWidget('KDS_TICKETS_GRID', 'Ticket KDS')}
                    className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 text-left flex items-center gap-2.5 text-xs text-neutral-200 transition-all group"
                >
                    <Utensils className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span>Ticket KDS Cuisine</span>
                </Button>

                <Button variant="ghost"
                    onClick={() => handleAddWidget('KPI_METRICS_SUMMARY', 'Statistiques KPI')}
                    className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 text-left flex items-center gap-2.5 text-xs text-neutral-200 transition-all group"
                >
                    <TrendingUp className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                    <span>Carte Indicateur KPI</span>
                </Button>
            </div>
        </div>
    );
};
