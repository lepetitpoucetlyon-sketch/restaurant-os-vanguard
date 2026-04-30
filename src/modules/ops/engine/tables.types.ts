/**
 * TABLES & FLOOR PLAN TYPES
 */

export type TableStatus = 'free' | 'seated' | 'ordered' | 'eating' | 'paying' | 'dirty' | 'reserved' | 'cleaning' | 'locked';
export type TableShape = 'rect' | 'circle';
export type ZoneId = string;

// Floor represents a level in the restaurant (RDC, Mezzanine, Terrasse extérieure, etc.)
export interface Floor {
    id: string;
    name: string;
    level: number; // 0 = RDC, 1 = 1er étage, -1 = sous-sol, etc.
    description?: string;
    isActive: boolean;
    icon?: string; // Optional icon name for visual identification
}

export interface Zone {
    id: ZoneId;
    name: string;
    color: string;
    description?: string;
    floorId?: string; // Which floor this zone belongs to
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}

export interface Table {
    id: string;
    number: string;
    seats: number;
    status: TableStatus;
    shape: TableShape;
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    zoneId: ZoneId;
    floorId?: string; // Which floor this table is on
    lastService?: string;
    revenueTodayInCents?: number;
}

/**
 * 🏛️ Lexical Suture (Grade IX)
 * Fallback alias for legacy components using 'Area'.
 */
export type Area = Table;
