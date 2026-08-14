"use client";

import { Stage, Layer, Rect, Circle, Text, Group } from "react-konva";
import { forwardRef, useImperativeHandle } from "react";
import { Table, Zone } from "@nexus/contracts";
import { cn } from "@/lib/ui.foundations";
import { AnimatePresence } from "framer-motion";

// Decomposed modules
import { STATUS_COLORS } from "./constants";
import { TableChairs } from "./TableChairs";
import { ZoneRenderer } from "./ZoneRenderer";
import { EditPanel } from "./EditPanel";
import { TableInsightPanel } from "./TableInsightPanel";
// FIXME (facility-rapatriement): PaymentDialog est un composant ops — découpler via slot/prop injection
// eslint-disable-next-line vanguard/no-inter-module-imports
import { PaymentDialog } from "@modules/ops/service/pos/components/PaymentDialog";
import { useFloorPlanControls } from "./useFloorPlanControls";

interface FloorPlanEditorProps {
    scale: number;
    onScaleChange: (scale: number) => void;
    position: { x: number; y: number };
    onPositionChange: (pos: { x: number; y: number }) => void;
    mode: 'select' | 'add';
    viewMode?: '2d' | '3d';
    currentFloorId?: string;
    onTableSelect?: (id: string) => void;
}

export interface FloorPlanEditorRef {
    center: (forceScale?: number) => void;
    exportImage: () => string | undefined;
    zoomIn: () => void;
    zoomOut: () => void;
}

export const FloorPlanEditor = forwardRef<FloorPlanEditorRef, FloorPlanEditorProps>(({
    scale,
    onScaleChange,
    position,
    onPositionChange,
    mode,
    viewMode = '2d',
    currentFloorId = 'rdc',
    onTableSelect
}, ref) => {
    const {
        centerPlan,
        zoomAtPoint,
        dimensions,
        stageRef,
        floorTables,
        floorZones,
        isZonesLocked,
        updateTablePosition,
        updateZone,
        isDarkMode,
        getReservationsForTable,
        selectedId,
        setSelectedId,
        selectedTable,
        handleCheckout,
        isPaymentOpen,
        checkoutTotal,
        setIsPaymentOpen,
        handlePaymentComplete,
        updateTable,
        deleteTable,
        handleDragStart,
        handleDragEnd,
        handleWheel,
        handleStageClick,
        handleStageDragEnd,
        handleStageDragStart,
    } = useFloorPlanControls({
        scale,
        onScaleChange,
        position,
        onPositionChange,
        mode,
        currentFloorId,
        onTableSelect
    });

    useImperativeHandle(ref, () => ({
        center: centerPlan,
        zoomIn: () => {
            zoomAtPoint({ x: dimensions.width / 2, y: dimensions.height / 2 }, 1);
        },
        zoomOut: () => {
            zoomAtPoint({ x: dimensions.width / 2, y: dimensions.height / 2 }, -1);
        },
        exportImage: () => {
            if (stageRef.current) {
                const uri = stageRef.current.toDataURL();
                const link = document.createElement('a');
                link.download = `plan-de-salle-${new Date().toISOString().split('T')[0]}.png`;
                link.href = uri;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return uri;
            }
        }
    }));

    return (
        <div className="relative w-full h-full bg-bg-primary dark:bg-surface-sidebar border-4 border-transparent dark:border-white rounded-3xl overflow-hidden transition-colors duration-500">
            <div id="canvas-container" className="absolute inset-0 w-full h-full z-0">
                {dimensions.width > 0 && (
                    <Stage
                        ref={stageRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        scaleX={scale}
                        scaleY={scale}
                        x={position.x}
                        y={position.y}
                        draggable={mode === 'select'}
                        onWheel={handleWheel}
                        onMouseDown={handleStageClick}
                        onDragEnd={handleStageDragEnd}
                        onDragStart={handleStageDragStart}
                        className={cn(mode === 'select' ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair")}
                    >
                        <Layer>
                            <ZoneRenderer
                                tables={floorTables as Table[]}
                                zones={floorZones as Zone[]}
                                isLocked={isZonesLocked as boolean}
                                onUpdateTablePosition={updateTablePosition}
                                onUpdateZone={updateZone}
                                isDarkMode={isDarkMode}
                            />

                            {floorTables.map((table: Table) => {
                                const reservations = getReservationsForTable(table.id);
                                const hasReservation = reservations && reservations.length > 0;
                                const isSelected = selectedId === table.id;
                                const statusColor = (STATUS_COLORS as Record<string, string>)[table.status] || STATUS_COLORS['free'];

                                const tableBaseColor = isDarkMode ? "#FFFFFF" : "#FFFFFF";
                                const tableTextColor = isDarkMode ? "#000000" : "#1A1A1A";

                                const bgColor = isSelected ? (isDarkMode ? "#000000" : "#F8F9FA") : tableBaseColor;
                                const strokeColor = "var(--color-brand)";
                                const textColor = isSelected ? "var(--color-brand)" : tableTextColor;

                                return (
                                    <Group
                                        key={table.id}
                                        id={table.id}
                                        name={table.id}
                                        x={Number(table.x) || 0}
                                        y={Number(table.y) || 0}
                                        draggable
                                        onDragStart={handleDragStart}
                                        onDragEnd={(e) => handleDragEnd(e, table.id)}
                                        onClick={() => setSelectedId(table.id)}
                                        onTap={() => setSelectedId(table.id)}
                                    >
                                        <TableChairs table={table} isSelected={isSelected} viewMode={viewMode} isDarkMode={isDarkMode} />

                                        {/* 3D Depth Layer */}
                                        {viewMode === '3d' && (
                                            table.shape === "circle" ? (
                                                <Circle
                                                    radius={Number(table.radius) || 0}
                                                    fill='var(--color-text-muted)'
                                                    offsetY={-8}
                                                />
                                            ) : (
                                                <Rect
                                                    width={Number(table.width) || 0}
                                                    height={Number(table.height) || 0}
                                                    offsetX={(Number(table.width) || 0) / 2}
                                                    offsetY={(Number(table.height) || 0) / 2 - 8}
                                                    cornerRadius={16}
                                                    fill='var(--color-text-muted)'
                                                />
                                            )
                                        )}

                                        {/* Dynamic Status Glow */}
                                        <Circle
                                            radius={Math.max(Number(table.width) || 0, Number(table.height) || 0, Number(table.radius) || 0) + (isSelected ? 25 : 15)}
                                            fill={statusColor}
                                            opacity={isSelected ? 0.2 : 0}
                                            listening={false}
                                        />

                                        {/* Main Table Shape */}
                                        {table.shape === "circle" ? (
                                            <Circle
                                                radius={Number(table.radius) || 0}
                                                fill={table.status === 'free' ? bgColor : statusColor}
                                                stroke={strokeColor}
                                                strokeWidth={isSelected ? 3 : 2}
                                                shadowColor={statusColor}
                                                shadowBlur={isSelected ? 15 : 8}
                                                shadowOpacity={isSelected ? 0.3 : 0.1}
                                                shadowOffset={{ x: 0, y: 4 }}
                                                perfectDrawEnabled={false}
                                            />
                                        ) : (
                                            <Rect
                                                width={Number(table.width) || 0}
                                                height={Number(table.height) || 0}
                                                offsetX={(Number(table.width) || 0) / 2}
                                                offsetY={(Number(table.height) || 0) / 2}
                                                cornerRadius={16}
                                                fill={table.status === 'free' ? bgColor : statusColor}
                                                stroke={strokeColor}
                                                strokeWidth={isSelected ? 3 : 2}
                                                shadowColor={statusColor}
                                                shadowBlur={isSelected ? 15 : 8}
                                                shadowOpacity={isSelected ? 0.3 : 0.1}
                                                shadowOffset={{ x: 0, y: 4 }}
                                                perfectDrawEnabled={false}
                                            />
                                        )}

                                        <Text
                                            text={String(table.number || '')}
                                            fontSize={16}
                                            fontFamily="Outfit"
                                            fontStyle="900"
                                            fill={table.status === 'free' ? textColor : '#FFFFFF'}
                                            align="center"
                                            verticalAlign="middle"
                                            offsetX={40}
                                            offsetY={10}
                                            width={80}
                                            listening={false}
                                        />

                                        {/* Reservation Badge */}
                                        {hasReservation && !isSelected && (
                                            <Circle
                                                x={table.width ? (Number(table.width) / 2 - 8) : (Number(table.radius) - 8)}
                                                y={table.height ? (-Number(table.height) / 2 + 8) : (-Number(table.radius) + 8)}
                                                radius={6}
                                                fill="#F97316"
                                                stroke="#FFFFFF"
                                                strokeWidth={2}
                                            />
                                        )}
                                    </Group>
                                );
                            })}
                        </Layer>
                    </Stage>
                )}
            </div>

            {/* Insight Panel (Right) */}
            <AnimatePresence>
                {selectedTable && (
                    <TableInsightPanel
                        selectedTable={selectedTable as Table}
                        onClose={() => setSelectedId(null)}
                        onCheckout={handleCheckout}
                    />
                )}
            </AnimatePresence>

            <PaymentDialog
                isOpen={isPaymentOpen}
                total={checkoutTotal}
                onClose={() => setIsPaymentOpen(false)}
                onPaymentComplete={handlePaymentComplete}
            />

            {/* Editing UI Overlay */}
            <AnimatePresence>
                {selectedTable && (
                    <EditPanel
                        selectedTable={selectedTable as Table}
                        updateTable={updateTable}
                        deleteTable={deleteTable}
                        onClose={() => setSelectedId(null)}
                        isDarkMode={isDarkMode}
                    />
                )}
            </AnimatePresence>
        </div>
    );
});

FloorPlanEditor.displayName = "FloorPlanEditor";

// End of FloorPlanEditor component
