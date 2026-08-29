/**
 * 🪄 ReactToPenTransformer — Générateur de SceneGraph AST pour les pages de Restaurant OS
 * Construit un arbre de nœuds riche, interactif et typé pour n'importe quelle route
 */

import { PageDocument, FrameNode, TextNode, WidgetNode, VectorNode } from '../schema/PenDocument';
import { createSolidPaint, OPEN_PENCIL_DEFAULT_TYPOGRAPHY } from '../schema/StyleTokens';

export interface PageBlueprintSpec {
    id: string;
    name: string;
    route: string;
    category: string;
    description: string;
    icon: string;
    device?: 'desktop' | 'tablet' | 'mobile' | 'kds';
    widgets?: string[];
}

export class ReactToPenTransformer {
    /**
     * Génère un PageDocument complet avec arborescence SceneGraph pour une spécification de page donnée
     */
    public static createPageSceneGraph(spec: PageBlueprintSpec): PageDocument {
        const device = spec.device || (spec.route.includes('/pos') ? 'tablet' : spec.route.includes('/kds') ? 'kds' : 'desktop');
        const dimensions = {
            desktop: { width: 1920, height: 1080 },
            tablet: { width: 1024, height: 768 },
            kds: { width: 1280, height: 800 },
            mobile: { width: 390, height: 844 },
        }[device];

        const rootNodeId = `root-${spec.id}`;

        // 1. Header Frame
        const headerNode: FrameNode = {
            id: `header-${spec.id}`,
            name: 'Page Header',
            type: 'FRAME',
            visible: true,
            locked: false,
            x: 0,
            y: 0,
            width: dimensions.width,
            height: 80,
            layoutMode: 'HORIZONTAL',
            primaryAxisAlign: 'SPACE_BETWEEN',
            counterAxisAlign: 'CENTER',
            paddingLeft: 32,
            paddingRight: 32,
            paddingTop: 16,
            paddingBottom: 16,
            layoutSizingHorizontal: 'FILL',
            layoutSizingVertical: 'FIXED',
            fills: [createSolidPaint('bg.secondary', 0.9)],
            strokes: [{ color: { r: 1, g: 1, b: 1, a: 0.08 }, width: 1 }],
            children: [
                // Title Group
                {
                    id: `title-group-${spec.id}`,
                    name: 'Title & Breadcrumb',
                    type: 'FRAME',
                    visible: true,
                    locked: false,
                    x: 0,
                    y: 0,
                    width: 400,
                    height: 50,
                    layoutMode: 'HORIZONTAL',
                    counterAxisAlign: 'CENTER',
                    itemSpacing: 16,
                    children: [
                        {
                            id: `icon-${spec.id}`,
                            name: 'Category Icon',
                            type: 'VECTOR',
                            visible: true,
                            locked: false,
                            x: 0,
                            y: 0,
                            width: 24,
                            height: 24,
                            iconName: spec.icon || 'Sparkles',
                        } as VectorNode,
                        {
                            id: `title-${spec.id}`,
                            name: 'Page Title',
                            type: 'TEXT',
                            visible: true,
                            locked: false,
                            x: 0,
                            y: 0,
                            width: 300,
                            height: 32,
                            characters: spec.name,
                            style: OPEN_PENCIL_DEFAULT_TYPOGRAPHY.h2,
                            fills: [createSolidPaint('text.primary')],
                        } as TextNode,
                    ],
                } as FrameNode,
                // Actions Group
                {
                    id: `actions-group-${spec.id}`,
                    name: 'Quick Actions',
                    type: 'FRAME',
                    visible: true,
                    locked: false,
                    x: 0,
                    y: 0,
                    width: 320,
                    height: 44,
                    layoutMode: 'HORIZONTAL',
                    counterAxisAlign: 'CENTER',
                    itemSpacing: 12,
                    children: [
                        {
                            id: `btn-action-primary-${spec.id}`,
                            name: 'Bouton Principal',
                            type: 'FRAME',
                            visible: true,
                            locked: false,
                            x: 0,
                            y: 0,
                            width: 140,
                            height: 40,
                            cornerRadius: 12,
                            layoutMode: 'HORIZONTAL',
                            primaryAxisAlign: 'CENTER',
                            counterAxisAlign: 'CENTER',
                            fills: [createSolidPaint('brand.gold.primary')],
                            children: [
                                {
                                    id: `btn-text-primary-${spec.id}`,
                                    name: 'Action Label',
                                    type: 'TEXT',
                                    visible: true,
                                    locked: false,
                                    x: 0,
                                    y: 0,
                                    width: 100,
                                    height: 20,
                                    characters: 'Action Directe',
                                    style: OPEN_PENCIL_DEFAULT_TYPOGRAPHY.badge,
                                    fills: [createSolidPaint('bg.primary')],
                                } as TextNode,
                            ],
                        } as FrameNode,
                    ],
                } as FrameNode,
            ],
        };

        // 2. Main Content Body
        const mainContentNode: FrameNode = {
            id: `main-content-${spec.id}`,
            name: 'Main Content Area',
            type: 'FRAME',
            visible: true,
            locked: false,
            x: 0,
            y: 80,
            width: dimensions.width,
            height: dimensions.height - 80,
            layoutMode: 'HORIZONTAL',
            paddingLeft: 32,
            paddingRight: 32,
            paddingTop: 32,
            paddingBottom: 32,
            itemSpacing: 24,
            layoutSizingHorizontal: 'FILL',
            layoutSizingVertical: 'FILL',
            children: [
                // Primary Work Area
                {
                    id: `work-area-${spec.id}`,
                    name: 'Zone Principale',
                    type: 'FRAME',
                    visible: true,
                    locked: false,
                    x: 0,
                    y: 0,
                    width: dimensions.width > 1200 ? dimensions.width - 450 : dimensions.width - 64,
                    height: dimensions.height - 144,
                    layoutMode: 'VERTICAL',
                    itemSpacing: 20,
                    layoutSizingHorizontal: 'FILL',
                    layoutSizingVertical: 'FILL',
                    fills: [createSolidPaint('bg.secondary', 0.5)],
                    cornerRadius: 20,
                    paddingTop: 24,
                    paddingBottom: 24,
                    paddingLeft: 24,
                    paddingRight: 24,
                    strokes: [{ color: { r: 1, g: 1, b: 1, a: 0.06 }, width: 1 }],
                    children: [
                        {
                            id: `description-${spec.id}`,
                            name: 'Description Text',
                            type: 'TEXT',
                            visible: true,
                            locked: false,
                            x: 0,
                            y: 0,
                            width: 600,
                            height: 24,
                            characters: spec.description || `Module opérationnel pour ${spec.name}`,
                            style: OPEN_PENCIL_DEFAULT_TYPOGRAPHY.bodyMedium,
                            fills: [createSolidPaint('text.secondary')],
                        } as TextNode,
                        // Primary Widget Slot
                        {
                            id: `primary-slot-${spec.id}`,
                            name: `Slot: ${spec.widgets?.[0] || 'DATA_GRID'}`,
                            type: 'WIDGET',
                            visible: true,
                            locked: false,
                            x: 0,
                            y: 0,
                            width: 800,
                            height: 400,
                            layoutSizingHorizontal: 'FILL',
                            layoutSizingVertical: 'FILL',
                            widgetType: spec.widgets?.[0] || 'DATA_VIEW_UNIVERSAL',
                            widgetProps: {
                                route: spec.route,
                                category: spec.category,
                            },
                        } as WidgetNode,
                    ],
                } as FrameNode,
                // Optional Side Panel (for Desktop/Tablet)
                ...(dimensions.width > 1200
                    ? [
                          {
                              id: `side-panel-${spec.id}`,
                              name: 'Panneau Latéral & Outils',
                              type: 'FRAME',
                              visible: true,
                              locked: false,
                              x: 0,
                              y: 0,
                              width: 350,
                              height: dimensions.height - 144,
                              layoutMode: 'VERTICAL',
                              itemSpacing: 16,
                              paddingTop: 20,
                              paddingBottom: 20,
                              paddingLeft: 20,
                              paddingRight: 20,
                              cornerRadius: 20,
                              fills: [createSolidPaint('bg.secondary', 0.6)],
                              strokes: [{ color: { r: 1, g: 1, b: 1, a: 0.06 }, width: 1 }],
                              children: [
                                  {
                                      id: `side-panel-title-${spec.id}`,
                                      name: 'Side Panel Header',
                                      type: 'TEXT',
                                      visible: true,
                                      locked: false,
                                      x: 0,
                                      y: 0,
                                      width: 250,
                                      height: 24,
                                      characters: 'Métriques & Actions Rapides',
                                      style: OPEN_PENCIL_DEFAULT_TYPOGRAPHY.h3,
                                      fills: [createSolidPaint('brand.gold.primary')],
                                  } as TextNode,
                                  {
                                      id: `side-kpi-widget-${spec.id}`,
                                      name: 'Slot KPI',
                                      type: 'WIDGET',
                                      visible: true,
                                      locked: false,
                                      x: 0,
                                      y: 0,
                                      width: 310,
                                      height: 200,
                                      widgetType: 'KPI_METRICS_SUMMARY',
                                      widgetProps: { category: spec.category },
                                  } as WidgetNode,
                              ],
                          } as FrameNode,
                      ]
                    : []),
            ],
        };

        const rootNode: FrameNode = {
            id: rootNodeId,
            name: `${spec.name} [${spec.route}]`,
            type: 'FRAME',
            visible: true,
            locked: false,
            x: 0,
            y: 0,
            width: dimensions.width,
            height: dimensions.height,
            layoutMode: 'VERTICAL',
            fills: [createSolidPaint('bg.primary')],
            children: [headerNode, mainContentNode],
        };

        return {
            id: spec.id,
            name: spec.name,
            route: spec.route,
            category: spec.category,
            device,
            rootNode,
            backgroundColor: { r: 0.051, g: 0.051, b: 0.067, a: 1 },
        };
    }
}
