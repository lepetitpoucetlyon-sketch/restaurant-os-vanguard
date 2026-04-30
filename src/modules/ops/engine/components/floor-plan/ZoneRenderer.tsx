"use client";

import { Group, Rect, Text } from "react-konva";
import { useRef } from "react";
import { Table, Zone } from "@nexus/contracts";

interface ZoneRendererProps {
    tables: Table[];
    zones: Zone[];
    isLocked: boolean;
    onUpdateTablePosition: (id: string, x: number, y: number) => Promise<void>;
    onUpdateZone: (id: string, updates: Partial<Zone>) => void;
    isDarkMode: boolean;
}

// Zone Renderer Component - Optimized for performance
const ZoneRenderer = ({ tables, zones, isLocked, onUpdateTablePosition, onUpdateZone, isDarkMode }: ZoneRendererProps) => {
    const dragNodesRef = useRef<Record<string, { x: number, y: number, node: import('konva/lib/Node').Node }>>({});
    // Local state ref for resize operations to avoid re-renders during drag
    const resizeStateRef = useRef<{ zoneId: string; updates: Partial<Zone> } | null>(null);

    return (
        <Group>
            {zones.map((zone) => {
                const zoneTables = tables.filter(t => t.zoneId === zone.id);
                // If no tables and no manual position, don't render
                if (zoneTables.length === 0 && zone.x === undefined) return null;

                // Dimensions Logic
                let x: number, y: number, width: number, height: number;

                if (zone.x !== undefined && zone.y !== undefined && zone.width !== undefined && zone.height !== undefined) {
                    x = zone.x;
                    y = zone.y;
                    width = zone.width;
                    height = zone.height;
                } else {
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    zoneTables.forEach(t => {
                        const tableW = t.width || (t.radius ? t.radius * 2 : 80);
                        const tableH = t.height || (t.radius ? t.radius * 2 : 80);
                        minX = Math.min(minX, t.x - tableW / 2);
                        minY = Math.min(minY, t.y - tableH / 2);
                        maxX = Math.max(maxX, t.x + tableW / 2);
                        maxY = Math.max(maxY, t.y + tableH / 2);
                    });

                    if (minX === Infinity) return null;

                    const PADDING = 60;
                    x = minX - PADDING;
                    y = minY - PADDING;
                    width = (maxX - minX) + (PADDING * 2);
                    height = (maxY - minY) + (PADDING * 2);
                }

                const handleSize = 14;

                // Helper to finalize resize on drag end
                const finalizeResize = () => {
                    if (resizeStateRef.current && resizeStateRef.current.zoneId === zone.id) {
                        onUpdateZone(zone.id, resizeStateRef.current.updates);
                        resizeStateRef.current = null;
                    }
                };

                return (
                    <Group key={zone.id}>
                        {/* Main Zone Container - Draggable */}
                        <Group
                            draggable={isLocked}
                            onDragStart={(e) => {
                                if (!isLocked) return;
                                const stage = e.target.getStage();
                                if (!stage) return;

                                const starts: Record<string, { x: number, y: number, node: import('konva/lib/Node').Node }> = {};
                                zoneTables.forEach(t => {
                                    const node = stage.findOne(`#${t.id}`);
                                    if (node) {
                                        starts[t.id] = { x: t.x, y: t.y, node };
                                    }
                                });
                                dragNodesRef.current = starts;
                                e.target.moveToTop();
                            }}
                            onDragMove={(e) => {
                                if (!isLocked) return;
                                const dx = e.target.x();
                                const dy = e.target.y();

                                Object.values(dragNodesRef.current).forEach(({ x: startX, y: startY, node }) => {
                                    node.x(startX + dx);
                                    node.y(startY + dy);
                                });
                            }}
                            onDragEnd={async (e) => {
                                if (!isLocked) return;
                                const dx = e.target.x();
                                const dy = e.target.y();

                                const updates = zoneTables.map(t => {
                                    const data = dragNodesRef.current[t.id];
                                    if (data) {
                                        return onUpdateTablePosition(t.id, data.x + dx, data.y + dy);
                                    }
                                    return Promise.resolve();
                                });

                                await Promise.all(updates);

                                // Reset Group position and save actual coordinates if manual
                                if (zone.x !== undefined && zone.y !== undefined) {
                                    onUpdateZone(zone.id, { x: zone.x + dx, y: zone.y + dy });
                                }

                                e.target.x(0);
                                e.target.y(0);
                                dragNodesRef.current = {};
                            }}
                        >
                            {/* Visual Box */}
                            <Rect
                                x={x}
                                y={y}
                                width={width}
                                height={height}
                                cornerRadius={40}
                                fill={zone.color}
                                opacity={0.35}
                                stroke={zone.color}
                                strokeWidth={4}
                                shadowColor={zone.color}
                                shadowBlur={20}
                                shadowOpacity={0.3}
                                perfectDrawEnabled={false}
                                shadowForStrokeEnabled={false}
                            />

                            {/* Glassmorphism Inner Layer */}
                            <Rect
                                x={x + 5}
                                y={y + 5}
                                width={width - 10}
                                height={height - 10}
                                cornerRadius={35}
                                fill={isDarkMode ? "black" : "white"}
                                opacity={isDarkMode ? 0.3 : 0.1}
                                listening={false}
                            />

                            {/* Zone Header - BIGGER & BLACK */}
                            <Group x={x + 30} y={y - 25}>
                                <Rect
                                    width={240}
                                    height={50}
                                    cornerRadius={25}
                                    fill={isDarkMode ? "#0A0A0A" : "white"}
                                    stroke={isDarkMode ? "#C5A059" : zone.color}
                                    strokeWidth={3}
                                    shadowColor="black"
                                    shadowBlur={10}
                                    shadowOpacity={0.15}
                                    perfectDrawEnabled={false}
                                />
                                <Text
                                    x={0}
                                    y={14}
                                    width={240}
                                    text={zone.name.toUpperCase()}
                                    fontSize={18}
                                    fontFamily="Outfit"
                                    fontStyle="900"
                                    fill={isDarkMode ? "#C5A059" : "#000000"}
                                    align="center"
                                    letterSpacing={4}
                                />
                            </Group>

                            {isLocked && (
                                <Text
                                    x={x}
                                    y={y + height + 15}
                                    width={width}
                                    text="DÉPLACER ZONE"
                                    fontSize={10}
                                    fontFamily="Outfit"
                                    fontStyle="900"
                                    fill={isDarkMode ? "#C5A059" : "#000000"}
                                    align="center"
                                    opacity={isDarkMode ? 0.4 : 0.6}
                                    letterSpacing={2}
                                />
                            )}
                        </Group>

                        {/* Resize Handles (Only in Edit Mode) */}
                        {isLocked && (
                            <Group>
                                {/* Corners - nwse/nesw feedback */}
                                <Rect
                                    x={x - handleSize / 2} y={y - handleSize / 2} width={handleSize * 1.5} height={handleSize * 1.5}
                                    fill="transparent" stroke="transparent" strokeWidth={0} cornerRadius={4}
                                    opacity={0}
                                    draggable
                                    onDragEnd={finalizeResize}
                                    onDragMove={(e) => {
                                        const nx = e.target.x() + handleSize / 2;
                                        const ny = e.target.y() + handleSize / 2;
                                        resizeStateRef.current = {
                                            zoneId: zone.id,
                                            updates: { x: nx, y: ny, width: width + (x - nx), height: height + (y - ny) }
                                        };
                                    }}
                                    onMouseEnter={(e) => (e.target.getStage()!.container().style.cursor = 'nwse-resize')}
                                    onMouseLeave={(e) => (e.target.getStage()!.container().style.cursor = 'default')}
                                />
                                <Rect
                                    x={x + width - handleSize / 2} y={y - handleSize / 2} width={handleSize * 1.5} height={handleSize * 1.5}
                                    fill="transparent" stroke="transparent" strokeWidth={0} cornerRadius={4}
                                    opacity={0}
                                    draggable
                                    onDragEnd={finalizeResize}
                                    onDragMove={(e) => {
                                        const nx_r = e.target.x() + handleSize / 2;
                                        const ny_t = e.target.y() + handleSize / 2;
                                        resizeStateRef.current = {
                                            zoneId: zone.id,
                                            updates: { y: ny_t, width: nx_r - x, height: height + (y - ny_t) }
                                        };
                                    }}
                                    onMouseEnter={(e) => (e.target.getStage()!.container().style.cursor = 'nesw-resize')}
                                    onMouseLeave={(e) => (e.target.getStage()!.container().style.cursor = 'default')}
                                />
                                <Rect
                                    x={x - handleSize / 2} y={y + height - handleSize / 2} width={handleSize * 1.5} height={handleSize * 1.5}
                                    fill="transparent" stroke="transparent" strokeWidth={0} cornerRadius={4}
                                    opacity={0}
                                    draggable
                                    onDragEnd={finalizeResize}
                                    onDragMove={(e) => {
                                        const nx_l = e.target.x() + handleSize / 2;
                                        const ny_b = e.target.y() + handleSize / 2;
                                        resizeStateRef.current = {
                                            zoneId: zone.id,
                                            updates: { x: nx_l, width: width + (x - nx_l), height: ny_b - y }
                                        };
                                    }}
                                    onMouseEnter={(e) => (e.target.getStage()!.container().style.cursor = 'nesw-resize')}
                                    onMouseLeave={(e) => (e.target.getStage()!.container().style.cursor = 'default')}
                                />
                                <Rect
                                    x={x + width - handleSize / 2} y={y + height - handleSize / 2} width={handleSize * 1.5} height={handleSize * 1.5}
                                    fill="transparent" stroke="transparent" strokeWidth={0} cornerRadius={4}
                                    opacity={0}
                                    draggable
                                    onDragEnd={finalizeResize}
                                    onDragMove={(e) => {
                                        const nx_r = e.target.x() + handleSize / 2;
                                        const ny_b = e.target.y() + handleSize / 2;
                                        resizeStateRef.current = {
                                            zoneId: zone.id,
                                            updates: { width: nx_r - x, height: ny_b - y }
                                        };
                                    }}
                                    onMouseEnter={(e) => (e.target.getStage()!.container().style.cursor = 'nwse-resize')}
                                    onMouseLeave={(e) => (e.target.getStage()!.container().style.cursor = 'default')}
                                />

                                {/* Edges - ns/ew feedback */}
                                <Rect
                                    x={x + width / 2 - 20} y={y - (handleSize / 2)} width={40} height={handleSize}
                                    fill="transparent" stroke="transparent" strokeWidth={0} cornerRadius={6}
                                    opacity={0}
                                    draggable
                                    onDragEnd={finalizeResize}
                                    onDragMove={(e) => {
                                        const ny_t = e.target.y() + handleSize / 2;
                                        resizeStateRef.current = {
                                            zoneId: zone.id,
                                            updates: { y: ny_t, height: height + (y - ny_t) }
                                        };
                                    }}
                                    onMouseEnter={(e) => (e.target.getStage()!.container().style.cursor = 'ns-resize')}
                                    onMouseLeave={(e) => (e.target.getStage()!.container().style.cursor = 'default')}
                                />
                                <Rect
                                    x={x + width / 2 - 20} y={y + height - (handleSize / 2)} width={40} height={handleSize}
                                    fill="transparent" stroke="transparent" strokeWidth={0} cornerRadius={6}
                                    opacity={0}
                                    draggable
                                    onDragEnd={finalizeResize}
                                    onDragMove={(e) => {
                                        const ny_b = e.target.y() + handleSize / 2;
                                        resizeStateRef.current = {
                                            zoneId: zone.id,
                                            updates: { height: ny_b - y }
                                        };
                                    }}
                                    onMouseEnter={(e) => (e.target.getStage()!.container().style.cursor = 'ns-resize')}
                                    onMouseLeave={(e) => (e.target.getStage()!.container().style.cursor = 'default')}
                                />
                                <Rect
                                    x={x - (handleSize / 2)} y={y + height / 2 - 20} width={handleSize} height={40}
                                    fill="transparent" stroke="transparent" strokeWidth={0} cornerRadius={6}
                                    opacity={0}
                                    draggable
                                    onDragEnd={finalizeResize}
                                    onDragMove={(e) => {
                                        const nx_l = e.target.x() + handleSize / 2;
                                        resizeStateRef.current = {
                                            zoneId: zone.id,
                                            updates: { x: nx_l, width: width + (x - nx_l) }
                                        };
                                    }}
                                    onMouseEnter={(e) => (e.target.getStage()!.container().style.cursor = 'ew-resize')}
                                    onMouseLeave={(e) => (e.target.getStage()!.container().style.cursor = 'default')}
                                />
                                <Rect
                                    x={x + width - (handleSize / 2)} y={y + height / 2 - 20} width={handleSize} height={40}
                                    fill="transparent" stroke="transparent" strokeWidth={0} cornerRadius={6}
                                    opacity={0}
                                    draggable
                                    onDragEnd={finalizeResize}
                                    onDragMove={(e) => {
                                        const nx_r = e.target.x() + handleSize / 2;
                                        resizeStateRef.current = {
                                            zoneId: zone.id,
                                            updates: { width: nx_r - x }
                                        };
                                    }}
                                    onMouseEnter={(e) => (e.target.getStage()!.container().style.cursor = 'ew-resize')}
                                    onMouseLeave={(e) => (e.target.getStage()!.container().style.cursor = 'default')}
                                />
                            </Group>
                        )}
                    </Group>
                );
            })}
        </Group>
    );
};

export default ZoneRenderer;
