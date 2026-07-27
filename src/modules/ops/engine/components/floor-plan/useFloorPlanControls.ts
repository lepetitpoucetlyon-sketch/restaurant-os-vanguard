"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTables, useReservations } from "@/modules/ops/providers/NexusOpsProvider";
import { Table } from "@nexus/contracts";
import Konva from 'konva';
import { FloorPlanGeometry } from './FloorPlanGeometry';

/** Attributs de l'ombre Konva appliqués lors du drag. */
interface KonvaShadowAttrs {
    shadowBlur: number;
    shadowOpacity: number;
}

interface FloorPlanControlsOptions {
    scale: number;
    onScaleChange: (scale: number) => void;
    position: { x: number; y: number };
    onPositionChange: (pos: { x: number; y: number }) => void;
    mode: 'select' | 'add';
    currentFloorId: string;
    onTableSelect?: (id: string) => void;
}

export function useFloorPlanControls({
    scale,
    onScaleChange,
    position,
    onPositionChange,
    mode,
    currentFloorId,
    onTableSelect,
}: FloorPlanControlsOptions) {
    const stageRef = useRef<Konva.Stage | null>(null);
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

    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const checkTheme = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const floorTables = getTablesForFloor(currentFloorId);
    const floorZones = getZonesForFloor(currentFloorId);
    const selectedTable = useMemo(() => floorTables.find((t: Table) => t.id === selectedId), [floorTables, selectedId]);

    const centerPlan = useCallback((forceScale?: number) => {
        const result = FloorPlanGeometry.calculateCentering(floorTables, dimensions, forceScale);
        if (result) {
            onScaleChange(result.scale);
            onPositionChange(result.position);
            setIsManualPan(false);
        }
    }, [floorTables, dimensions, onScaleChange, onPositionChange]);

    const zoomAtPoint = useCallback((point: { x: number, y: number }, delta: number) => {
        const result = FloorPlanGeometry.calculateZoom(point, scale, position, delta);
        onScaleChange(result.scale);
        onPositionChange(result.position);
    }, [scale, position, onScaleChange, onPositionChange]);

    useEffect(() => {
        const handleResize = () => {
            const container = document.getElementById("canvas-container");
            if (container) {
                setDimensions({ width: container.offsetWidth, height: container.offsetHeight });
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

    useEffect(() => {
        if (dimensions.width > 0 && floorTables.length > 0 && !isManualPan) {
            const frameId = requestAnimationFrame(() => centerPlan());
            return () => cancelAnimationFrame(frameId);
        }
    }, [centerPlan, dimensions.width, floorTables.length, isManualPan]);

    const handleDragStart = useCallback((e: { target: { setAttrs: (attrs: KonvaShadowAttrs) => void } }) => {
        e.target.setAttrs({ shadowBlur: 15, shadowOpacity: 0.15 });
    }, []);

    const handleDragEnd = useCallback(async (e: { target: { setAttrs: (attrs: KonvaShadowAttrs) => void; x: () => number; y: () => number } }, id: string) => {
        e.target.setAttrs({ shadowBlur: 8, shadowOpacity: 0.08 });
        updateTablePosition(id, e.target.x(), e.target.y());
    }, [updateTablePosition]);

    const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        if (!stage) return;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        
        const result = FloorPlanGeometry.calculateZoom(
            pointer, 
            stage.scaleX(), 
            {x: stage.x(), y: stage.y()}, 
            e.evt.deltaY < 0 ? 1 : -1,
            1.1
        );
        onScaleChange(result.scale);
        onPositionChange(result.position);
    }, [onScaleChange, onPositionChange]);

    const handleStageClick = useCallback(async (e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (e.target !== stage) return;

        if (mode !== 'add') {
            setSelectedId(null);
            return;
        }

        const pointer = stage?.getPointerPosition();
        if (!stage || !pointer) return;

        const { x, y } = FloorPlanGeometry.toWorldPoint(
            pointer,
            { x: stage.x(), y: stage.y() },
            { x: stage.scaleX(), y: stage.scaleY() }
        );

        await addTable({
            number: FloorPlanGeometry.nextTableNumber(floorTables),
            x, y, seats: 4, status: 'free', shape: 'rect',
            width: 80, height: 80, zoneId: floorZones[0]?.id || 'main', floorId: currentFloorId
        });
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

    const handleStageDragEnd = useCallback((e: { target: { getStage: () => unknown; x: () => number; y: () => number } }) => {
        if (e.target === e.target.getStage()) {
            onPositionChange({ x: e.target.x(), y: e.target.y() });
            setIsManualPan(true);
        }
    }, [onPositionChange]);

    const handleStageDragStart = useCallback((e: { target: { getStage: () => unknown } }) => {
        if (e.target === e.target.getStage()) {
            setIsManualPan(true);
        }
    }, []);

    const setSelectedIdWithCallback = useCallback((id: string | null) => {
        setSelectedId(id);
        if (id && onTableSelect) {
            onTableSelect(id);
        }
    }, [onTableSelect]);

    return {
        stageRef, dimensions, selectedId, setSelectedId: setSelectedIdWithCallback, selectedTable,
        isDarkMode, isPaymentOpen, setIsPaymentOpen, checkoutTotal,
        floorTables, floorZones, isZonesLocked, updateTablePosition, updateTable, deleteTable, updateZone, getReservationsForTable,
        centerPlan, zoomAtPoint, handleDragStart, handleDragEnd, handleWheel, handleStageClick, handleCheckout, handlePaymentComplete, handleStageDragEnd, handleStageDragStart,
    };
}
