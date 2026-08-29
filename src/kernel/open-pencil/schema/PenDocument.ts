/**
 * 🎨 OpenPencil SceneGraph & .pen Document AST Schema
 * Standardisé pour Restaurant OS Core & Personnalisation Multi-Tenant (84 pages)
 * Compatible avec la spécification @open-pencil/scene-graph & @open-pencil/pen
 */

export type NodeType =
    | 'DOCUMENT'
    | 'PAGE'
    | 'FRAME'
    | 'GROUP'
    | 'COMPONENT'
    | 'INSTANCE'
    | 'TEXT'
    | 'RECTANGLE'
    | 'VECTOR'
    | 'IMAGE'
    | 'SLOT'
    | 'WIDGET';

export type LayoutMode = 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'GRID';
export type PrimaryAxisAlign = 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN' | 'SPACE_AROUND';
export type CounterAxisAlign = 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'BASELINE';
export type SizingMode = 'FIXED' | 'HUG' | 'FILL';

export interface LayoutConstraints {
    horizontal: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
    vertical: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
}

export interface ColorRGBA {
    r: number; // 0..1
    g: number; // 0..1
    b: number; // 0..1
    a: number; // 0..1
}

export type PaintType = 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE';

export interface GradientStop {
    position: number; // 0..1
    color: ColorRGBA;
}

export interface Paint {
    type: PaintType;
    visible?: boolean;
    opacity?: number;
    color?: ColorRGBA;
    gradientStops?: GradientStop[];
    tokenReference?: string; // ex: "$brand.gold.ink", "$brand.bg.primary"
}

export interface Stroke {
    color: ColorRGBA;
    width: number;
    style?: 'solid' | 'dashed' | 'dotted';
    tokenReference?: string;
}

export interface Effect {
    type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
    visible: boolean;
    color?: ColorRGBA;
    offset?: { x: number; y: number };
    radius: number;
    spread?: number;
}

export interface TypographyStyle {
    fontFamily: string; // 'Cormorant Garamond', 'Inter', 'JetBrains Mono'
    fontWeight: 300 | 400 | 500 | 600 | 700 | 800 | 900;
    fontSize: number; // in pixels
    lineHeight?: number | string;
    letterSpacing?: number;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    italic?: boolean;
}

export interface BaseNode {
    id: string;
    name: string;
    type: NodeType;
    visible: boolean;
    locked: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    opacity?: number;
    fills?: Paint[];
    strokes?: Stroke[];
    strokeWeight?: number;
    cornerRadius?: number | [number, number, number, number];
    effects?: Effect[];
    layoutConstraints?: LayoutConstraints;
    // Auto-layout
    layoutMode?: LayoutMode;
    primaryAxisAlign?: PrimaryAxisAlign;
    counterAxisAlign?: CounterAxisAlign;
    itemSpacing?: number;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    layoutSizingHorizontal?: SizingMode;
    layoutSizingVertical?: SizingMode;
    // Restaurant OS Metadata
    roleLevelMin?: number; // RBAC min level
    requiredCapability?: string; // feature flag
    i18nKey?: string; // Translation key
    actionBinding?: string; // EventBus or onClick handler identifier
    customProps?: Record<string, unknown>;
}

export interface TextNode extends BaseNode {
    type: 'TEXT';
    characters: string;
    style: TypographyStyle;
}

export interface FrameNode extends BaseNode {
    type: 'FRAME' | 'GROUP' | 'COMPONENT' | 'INSTANCE';
    children: SceneNode[];
    componentId?: string; // If instance, references parent Component
    variantProperties?: Record<string, string>;
    clipContent?: boolean;
}

export interface RectangleNode extends BaseNode {
    type: 'RECTANGLE' | 'IMAGE';
    imageUrl?: string;
}

export interface VectorNode extends BaseNode {
    type: 'VECTOR';
    svgPath?: string;
    iconName?: string; // Lucide icon name
}

export interface WidgetNode extends BaseNode {
    type: 'WIDGET' | 'SLOT';
    widgetType: string; // 'POS_CART' | 'KDS_ORDER_CARD' | 'FLOOR_TABLE' | 'KPI_METRIC' | 'DYNAMIC_ISLAND'
    widgetProps: Record<string, unknown>;
}

export type SceneNode = FrameNode | TextNode | RectangleNode | VectorNode | WidgetNode;

export interface PageDocument {
    id: string;
    name: string;
    route: string;
    category: string;
    device: 'desktop' | 'tablet' | 'mobile' | 'kds';
    rootNode: FrameNode;
    backgroundColor?: ColorRGBA;
}

export interface PenDocument {
    version: '1.0.0';
    name: string;
    targetTenantId?: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    pages: PageDocument[];
    variables?: Record<string, string | number | ColorRGBA>;
    metadata?: {
        restaurantVariant?: string;
        themeTokens?: Record<string, string>;
        customNotes?: string;
    };
}
