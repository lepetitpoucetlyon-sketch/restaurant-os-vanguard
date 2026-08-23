'use client';

/**
 * 🧱 DynamicLayoutRenderer — Moteur de rendu Bento Grid déclaratif.
 *
 * Rend une page modulable à partir d'une configuration `PageLayoutConfig` et d'une
 * table de correspondance de composants (`SlotComponentMap`).
 *
 * 🛡️ Gardes-fous & Invariants :
 * 1. NF525 Seal : Les composants `locked: true` sont TOUJOURS rendus, même en cas
 *    d'anomalie de configuration.
 * 2. Responsive Fallback : Sur mobile / TPE (< 640px), la grille s'aplatit en colonne
 *    unique ordonnée par `position.y` pour éviter toute troncature visuelle.
 * 3. Graceful degradation : Si un `componentKey` n'est pas trouvé dans le map, un
 *    placeholder neutre est affiché en mode dev sans planter l'UI.
 */

import React from 'react';
import { cn } from '@/lib/ui.foundations';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import type { PageLayoutConfig, SlotComponentMap, LayoutSlot } from './types';

interface DynamicLayoutRendererProps {
    config: PageLayoutConfig;
    components: SlotComponentMap;
    className?: string;
    /** Props passées à chaque composant de slot (ex: callbacks de commande, store) */
    slotProps?: Record<string, unknown>;
}

export function DynamicLayoutRenderer({
    config,
    components,
    className,
    slotProps = {},
}: DynamicLayoutRendererProps) {
    const { isMobile, isTablet } = useBreakpoint();

    // 1. Filtrer les slots actifs (les locked sont TOUJOURS conservés)
    const activeSlots = config.slots.filter((slot) => slot.locked || slot.visible);

    // 2. Mode mobile / TPE : colonne unique ordonnée par ligne Y
    if (isMobile) {
        const sortedSlots = [...activeSlots].sort((a, b) => a.position.y - b.position.y);
        return (
            <div className={cn('flex flex-col w-full space-y-4 min-h-0', className)}>
                {sortedSlots.map((slot) => renderSlot(slot, components, slotProps, true))}
            </div>
        );
    }

    // 3. Mode Tablette : grille simplifiée 2 colonnes si la config est trop dense
    const columns = isTablet ? Math.min(config.grid.columns, 6) : config.grid.columns;

    return (
        <div
            className={cn('grid w-full h-full min-h-0', className)}
            style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gridAutoRows: 'minmax(120px, auto)',
                gap: config.grid.gap,
            }}
        >
            {activeSlots.map((slot) => renderSlot(slot, components, slotProps, false, columns))}
        </div>
    );
}

function renderSlot(
    slot: LayoutSlot,
    components: SlotComponentMap,
    slotProps: Record<string, unknown>,
    isMobileMode: boolean,
    totalColumns = 12,
) {
    const Component = components[slot.componentKey];

    const style: React.CSSProperties = isMobileMode
        ? { width: '100%' }
        : {
              gridColumnStart: Math.min(slot.position.x + 1, totalColumns),
              gridColumnEnd: `span ${Math.min(slot.position.w, totalColumns)}`,
              gridRowStart: slot.position.y + 1,
              gridRowEnd: `span ${slot.position.h}`,
          };

    return (
        <div
            key={slot.id}
            data-slot-id={slot.id}
            data-component-key={slot.componentKey}
            data-slot-locked={slot.locked ? 'true' : undefined}
            style={style}
            className={cn(
                'min-w-0 min-h-0 overflow-hidden flex flex-col',
                slot.locked && 'ring-1 ring-amber-500/20 rounded-2xl',
            )}
        >
            {Component ? (
                <Component {...slotProps} slotId={slot.id} />
            ) : (
                <div className="flex-1 flex items-center justify-center p-4 rounded-2xl border border-dashed border-border-default bg-surface-card/40 text-xs text-text-muted">
                    Composant manquant : <code className="ml-1 font-mono">{slot.componentKey}</code>
                </div>
            )}
        </div>
    );
}
