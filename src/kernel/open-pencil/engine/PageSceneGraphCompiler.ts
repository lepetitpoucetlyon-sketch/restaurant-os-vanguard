/**
 * ⚡ PageSceneGraphCompiler — Compilateur bidirectionnel OpenPencil (.pen AST <-> Code React TSX / Tailwind)
 * Produit du code TSX propre, typé et optimisé pour Restaurant OS Core
 */

import { PenDocument, PageDocument, SceneNode, FrameNode, TextNode, RectangleNode, VectorNode, WidgetNode, Paint } from '../schema/PenDocument';
import { rgbaToCss } from '../schema/StyleTokens';

export class PageSceneGraphCompiler {
    /**
     * Sérialise un document OpenPencil en chaîne JSON formatée
     */
    public static serialize(doc: PenDocument): string {
        return JSON.stringify(doc, null, 2);
    }

    /**
     * Parse une chaîne JSON en PenDocument typé avec validation
     */
    public static parse(json: string): PenDocument {
        const parsed = JSON.parse(json);
        if (!parsed.pages || !Array.isArray(parsed.pages)) {
            throw new Error('[OpenPencilCompiler] Format de document invalide : propriété "pages" manquante.');
        }
        return parsed as PenDocument;
    }

    /**
     * Compile un PageDocument en code React TSX complet
     */
    public static compileToReactTSX(page: PageDocument): string {
        const componentName = this.pascalCase(page.name.replace(/[^a-zA-Z0-9]/g, '')) || 'CustomPage';
        const renderedJSX = this.renderNodeToJSX(page.rootNode, 2);

        return `// 🎨 Page générée via OpenPencil Studio pour Restaurant OS
// Route: ${page.route} | Device: ${page.device}
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
    LayoutDashboard, Sparkles, Store, ShoppingCart, Clock, Users, ChefHat, 
    CalendarDays, Settings, ShieldCheck, HelpCircle, Utensils 
} from 'lucide-react';

export default function ${componentName}() {
    return (
${renderedJSX}
    );
}
`;
    }

    /**
     * Génère récursivement le JSX pour un nœud SceneGraph
     */
    private static renderNodeToJSX(node: SceneNode, depth: number): string {
        const indent = ' '.repeat(depth * 4);
        const nextIndent = ' '.repeat((depth + 1) * 4);

        if (!node.visible && node.visible !== undefined) {
            return `${indent}{/* Nœud masqué: ${node.name} */}`;
        }

        switch (node.type) {
            case 'FRAME':
            case 'COMPONENT':
            case 'INSTANCE':
            case 'GROUP': {
                const frame = node as FrameNode;
                const classes = this.extractTailwindClasses(frame);
                const childrenJSX = (frame.children || [])
                    .map(child => this.renderNodeToJSX(child, depth + 1))
                    .join('\n');

                if (!childrenJSX.trim()) {
                    return `${indent}<div className="${classes}" data-node-id="${node.id}" />`;
                }

                return `${indent}<div className="${classes}" data-node-id="${node.id}">\n${childrenJSX}\n${indent}</div>`;
            }

            case 'TEXT': {
                const textNode = node as TextNode;
                const textClasses = this.extractTextClasses(textNode);
                const tag = textNode.style?.fontSize >= 28 ? 'h1' : textNode.style?.fontSize >= 20 ? 'h2' : 'p';
                return `${indent}<${tag} className="${textClasses}" data-node-id="${node.id}">
${nextIndent}${textNode.characters || ''}
${indent}</${tag}>`;
            }

            case 'RECTANGLE':
            case 'IMAGE': {
                const rectNode = node as RectangleNode;
                const classes = this.extractTailwindClasses(rectNode);
                if (rectNode.imageUrl) {
                    return `${indent}<img src="${rectNode.imageUrl}" alt="${rectNode.name}" className="${classes} object-cover" data-node-id="${node.id}" />`;
                }
                return `${indent}<div className="${classes}" data-node-id="${node.id}" />`;
            }

            case 'VECTOR': {
                const vecNode = node as VectorNode;
                const iconName = vecNode.iconName || 'Sparkles';
                return `${indent}<${iconName} className="w-5 h-5 text-action-primary" data-node-id="${node.id}" />`;
            }

            case 'WIDGET':
            case 'SLOT': {
                const widget = node as WidgetNode;
                return `${indent}<div className="p-4 rounded-xl border border-border/50 bg-bg-secondary/40 backdrop-blur-md" data-widget-type="${widget.widgetType}" data-node-id="${node.id}">
${nextIndent}<span className="text-xs font-mono uppercase tracking-wider text-action-primary">[Widget: ${widget.widgetType}]</span>
${indent}</div>`;
            }

            default:
                return `${indent}<div data-node-id="${(node as any)?.id || ''}" />`;
        }
    }

    /**
     * Génère les classes Tailwind CSS pour un conteneur Frame
     */
private static extractLayoutModeClasses(node: FrameNode | RectangleNode, classes: string[]): void {
        if (!('layoutMode' in node)) return;
        const isHoriz = node.layoutMode === 'HORIZONTAL';
        classes.push(isHoriz ? 'flex flex-row' : 'flex flex-col');
        if (node.counterAxisAlign === 'CENTER') classes.push('items-center');
        if (node.primaryAxisAlign === 'SPACE_BETWEEN') classes.push('justify-between');
        if (isHoriz && node.primaryAxisAlign === 'CENTER') classes.push('justify-center');
    }

    private static extractFillClasses(node: FrameNode | RectangleNode, classes: string[]): void {
        if (!node.fills || node.fills.length === 0) {
            classes.push('bg-bg-primary text-text-primary');
            return;
        }
        const fill = node.fills[0];
        const ref = fill.tokenReference || '';
        if (ref.includes('bg.primary')) classes.push('bg-bg-primary');
        else if (ref.includes('bg.secondary')) classes.push('bg-bg-secondary/80 backdrop-blur-md');
        else if (ref.includes('brand.gold')) classes.push('bg-action-primary text-text-primary');
        else if (fill.color) classes.push('backdrop-blur-sm');
    }

    private static extractRadiusClasses(node: FrameNode | RectangleNode, classes: string[]): void {
        if (!node.cornerRadius) return;
        const rad = typeof node.cornerRadius === 'number' ? node.cornerRadius : node.cornerRadius[0];
        if (rad >= 24) classes.push('rounded-3xl');
        else if (rad >= 16) classes.push('rounded-2xl');
        else if (rad >= 8) classes.push('rounded-xl');
        else if (rad > 0) classes.push('rounded-lg');
    }

    /**
     * Génère les classes Tailwind CSS pour un conteneur Frame
     */
    private static extractTailwindClasses(node: FrameNode | RectangleNode): string {
        const classes: string[] = ['relative'];
        this.extractLayoutModeClasses(node, classes);

        if ('itemSpacing' in node && node.itemSpacing) classes.push(`gap-${Math.round(node.itemSpacing / 4)}`);
        if ('paddingTop' in node && node.paddingTop) classes.push(`p-${Math.round(node.paddingTop / 4)}`);

        this.extractFillClasses(node, classes);
        this.extractRadiusClasses(node, classes);

        if (node.strokes && node.strokes.length > 0) classes.push('border border-border/40');
        if (node.layoutSizingHorizontal === 'FILL') classes.push('w-full');
        if (node.layoutSizingVertical === 'FILL') classes.push('h-full flex-1');

        return classes.join(' ');
    }

private static extractFontSizeClass(fontSize?: number): string {
        if (!fontSize) return 'text-xs';
        if (fontSize >= 36) return 'text-4xl';
        if (fontSize >= 28) return 'text-3xl font-bold';
        if (fontSize >= 24) return 'text-2xl font-semibold';
        if (fontSize >= 20) return 'text-xl font-medium';
        if (fontSize >= 16) return 'text-base';
        if (fontSize >= 14) return 'text-sm';
        return 'text-xs';
    }

    private static extractTextColorClass(fills?: Paint[]): string {
        if (!fills || !fills[0]?.tokenReference) return 'text-text-primary';
        const ref = fills[0].tokenReference;
        if (ref.includes('gold')) return 'text-action-primary';
        if (ref.includes('secondary')) return 'text-text-secondary';
        if (ref.includes('muted')) return 'text-text-muted';
        return 'text-text-primary';
    }

    /**
     * Génère les classes Tailwind pour un nœud Text
     */
    private static extractTextClasses(node: TextNode): string {
        const classes: string[] = [];
        const style = node.style;

        if (!style) return 'text-text-primary text-sm';

        if (style.fontFamily?.includes('Cormorant')) classes.push('font-brand');
        else if (style.fontFamily?.includes('Mono')) classes.push('font-mono');
        else classes.push('font-sans');

        classes.push(this.extractFontSizeClass(style.fontSize));

        if (style.fontWeight >= 700) classes.push('font-bold');
        else if (style.fontWeight >= 600) classes.push('font-semibold');
        else if (style.fontWeight >= 500) classes.push('font-medium');

        classes.push(this.extractTextColorClass(node.fills));
        return classes.join(' ');
    }

    private static pascalCase(str: string): string {
        return str
            .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
            .replace(/^\w/, c => c.toUpperCase());
    }
}
