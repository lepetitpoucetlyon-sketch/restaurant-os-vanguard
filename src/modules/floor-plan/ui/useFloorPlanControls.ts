"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTables, useReservations } from "@/engines/ops/NexusOpsProvider";
import { Table } from "@nexus/contracts";

interface FloorPlanControlsOptions {
    scale: number;
    onScaleChange: (scale: number) => void;
    position: { x: number; y: number };
    onPositionChange: (pos: { x: number; y: number }) => void;
    mode: 'select' | 'add';
    currentFloorId: string;
}

export function useFloorPlanControls({
    scale,
    onScaleChange,
    position,
    onPositionChange,
    mode,
    currentFloorId,
}: FloorPlanControlsOptions) {
    const stageRef = useRef<any>(null);
    const [isManualPan, setIsManualPan] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [checkoutTotal, setCheckoutTotal] = useState(0);

    const {
        updateTablePosition, updateTable, deleteTable, addTable,
        isZonesLocked, getTablesForFloor, getZonesForFloor, updateZone
    } = useTables();
    const { getReservationsForTable } = useReservations();

    // Theme detection
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const checkTheme = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
        checkTheme();

        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Filter tables and zones by current floor
    const floorTables = getTablesForFloor(currentFloorId);
    const floorZones = getZonesForFloor(currentFloorId);
    const selectedTable = useMemo(() => floorTables.find((t: any) => t.id === selectedId), [floorTables, selectedId]);

    const centerPlan = useCallback((forceScale?: number) => {
        if (!floorTables || floorTables.length === 0 || dimensions.width === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        floorTables.forEach((t: any) => {
            const tableW = t.width || (t.radius ? t.radius * 2 : 80);
            const tableH = t.height || (t.radius ? t.radius * 2 : 80);
            const halfW = tableW / 2;
            const halfH = tableH / 2;
            const padding = 35;
            minX = Math.min(minX, t.x - halfW - padding);
            minY = Math.min(minY, t.y - halfH - padding);
            maxX = Math.max(maxX, t.x + halfW + padding);
            maxY = Math.max(maxY, t.y + halfH + padding);
        });

        const planWidth = maxX - minX;
        const planHeight = maxY - minY;
        const planCenter = {
            x: minX + planWidth / 2,
            y: minY + planHeight / 2
        };

        const viewportPadding = 100;
        const availableWidth = dimensions.width - viewportPadding * 2;
        const availableHeight = dimensions.height - viewportPadding * 2;

        const scaleX = availableWidth / planWidth;
        const scaleY = availableHeight / planHeight;

        const optimalScale = forceScale || Math.min(Math.max(Math.min(scaleX, scaleY), 0.4), 1.2);

        onScaleChange(optimalScale);

        const newPos = {
            x: (dimensions.width / 2) - planCenter.x * optimalScale,
            y: (dimensions.height / 2) - planCenter.y * optimalScale
        };

        onPositionChange(newPos);
        setIsManualPan(false);
    }, [floorTables, dimensions, onScaleChange, onPositionChange]);

    const zoomAtPoint = useCallback((point: { x: number, y: number }, delta: number) => {
        const oldScale = scale;
        const mousePointTo = {
            x: (point.x - position.x) / oldScale,
            y: (point.y - position.y) / oldScale,
        };

        const scaleBy = 1.2;
        const newScale = delta > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        const boundedScale = Math.min(Math.max(newScale, 0.4), 4);

        onScaleChange(boundedScale);

        const newPos = {
            x: point.x - mousePointTo.x * boundedScale,
            y: point.y - mousePointTo.y * boundedScale,
        };
        onPositionChange(newPos);
    }, [scale, position, onScaleChange, onPositionChange]);

    // Resize observer for canvas container
    useEffect(() => {
        const handleResize = () => {
            const container = document.getElementById("canvas-container");
            if (container) {
                setDimensions({
                    width: container.offsetWidth,
                    height: container.offsetHeight,
                });
            }
        };

        handleResize();
        const container = document.getElementById("canvas-container");
        if (container) {
            const observer = new ResizeObserver(handleResize);
            observer.observe(container);
            return () => observer.disconnect();
        }

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Effect to center on first load or when table count changes or floor changes
    useEffect(() => {
        if (dimensions.width > 0 && floorTables.length > 0 && !isManualPan) {
            const frameId = requestAnimationFrame(() => {
                centerPlan();
            });
            return () => cancelAnimationFrame(frameId);
        }
    }, [centerPlan, dimensions.width, floorTables.length, isManualPan]);

    const handleDragStart = useCallback((e: any) => {
        e.target.setAttrs({
            shadowBlur: 15,
            shadowOpacity: 0.15
        });
    }, []);

    const handleDragEnd = useCallback(async (e: any, id: string) => {
        e.target.setAttrs({
            shadowBlur: 8,
            shadowOpacity: 0.08
        });
        updateTablePosition(id, e.target.x(), e.target.y());
    }, [updateTablePosition]);

    const handleWheel = useCallback((e: any) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const scaleBy = 1.1;
        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
        const boundedScale = Math.min(Math.max(newScale, 0.5), 3);

        onScaleChange(boundedScale);

        const newPos = {
            x: pointer.x - mousePointTo.x * boundedScale,
            y: pointer.y - mousePointTo.y * boundedScale,
        };
        onPositionChange(newPos);
    }, [onScaleChange, onPositionChange]);

    const handleStageClick = useCallback(async (e: any) => {
        if (mode === 'add' && e.target === e.target.getStage()) {
            const stage = e.target.getStage();
            const pointer = stage.getPointerPosition();
            const x = (pointer.x - stage.x()) / stage.scaleX();
            const y = (pointer.y - stage.y()) / stage.scaleY();
            const newTableNumber = (Math.max(0, ...floorTables.map((t: any) => parseInt(t.number) || 0)) + 1).toString();

            await addTable({
                number: newTableNumber,
                x,
                y,
                seats: 4,
                status: 'free',
                shape: 'rect',
                width: 80,
                height: 80,
                zoneId: floorZones[0]?.id || 'main',
                floorId: currentFloorId
            });
        } else if (e.target === e.target.getStage()) {
            setSelectedId(null);
        }
    }, [mode, floorTables, floorZones, currentFloorId, addTable]);

    const handleCheckout = useCallback((total: number) => {
        setCheckoutTotal(total);
        setIsPaymentOpen(true);
    }, []);

    const handlePaymentComplete = useCallback(async () => {
        if (selectedId) {
            await updateTable(selectedId, { status: 'free' });
            setSelectedId(null);
            setIsPaymentOpen(false);
        }
    }, [selectedId, updateTable]);

    const handleStageDragEnd = useCallback((e: any) => {
        if (e.target === e.target.getStage()) {
            onPositionChange({ x: e.target.x(), y: e.target.y() });
            setIsManualPan(true);
        }
    }, [onPositionChange]);

    const handleStageDragStart = useCallback((e: any) => {
        if (e.target === e.target.getStage()) {
            setIsManualPan(true);
        }
    }, []);

    return {
        // Refs
        stageRef,
        // State
        dimensions,
        selectedId,
        setSelectedId,
        selectedTable,
        isDarkMode,
        isPaymentOpen,
        setIsPaymentOpen,
        checkoutTotal,
        // Tables data
        floorTables,
        floorZones,
        isZonesLocked,
        updateTablePosition,
        updateTable,
        deleteTable,
        updateZone,
        getReservationsForTable,
        // Handlers
        centerPlan,
        zoomAtPoint,
        handleDragStart,
        handleDragEnd,
        handleWheel,
        handleStageClick,
        handleCheckout,
        handlePaymentComplete,
        handleStageDragEnd,
        handleStageDragStart,
    };
}
