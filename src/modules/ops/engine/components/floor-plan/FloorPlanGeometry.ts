import type { Table } from "@nexus/contracts";

export class FloorPlanGeometry {
    static calculateCentering(
        tables: Table[],
        dimensions: { width: number, height: number },
        forceScale?: number
    ): { scale: number, position: { x: number, y: number } } | null {
        if (!tables || tables.length === 0 || dimensions.width === 0) return null;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        tables.forEach((t: Table) => {
            const tableW = Number(t.width) || (t.radius ? Number(t.radius) * 2 : 80);
            const tableH = Number(t.height) || (t.radius ? Number(t.radius) * 2 : 80);
            const halfW = tableW / 2;
            const halfH = tableH / 2;
            const padding = 35;
            minX = Math.min(minX, (Number(t.x) || 0) - halfW - padding);
            minY = Math.min(minY, (Number(t.y) || 0) - halfH - padding);
            maxX = Math.max(maxX, (Number(t.x) || 0) + halfW + padding);
            maxY = Math.max(maxY, (Number(t.y) || 0) + halfH + padding);
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

        const newPos = {
            x: (dimensions.width / 2) - planCenter.x * optimalScale,
            y: (dimensions.height / 2) - planCenter.y * optimalScale
        };

        return { scale: optimalScale, position: newPos };
    }

    static calculateZoom(
        point: { x: number, y: number },
        currentScale: number,
        currentPosition: { x: number, y: number },
        delta: number,
        scaleBy: number = 1.2
    ): { scale: number, position: { x: number, y: number } } {
        const mousePointTo = {
            x: (point.x - currentPosition.x) / currentScale,
            y: (point.y - currentPosition.y) / currentScale,
        };

        const newScale = delta > 0 ? currentScale * scaleBy : currentScale / scaleBy;
        const boundedScale = Math.min(Math.max(newScale, 0.4), 4);

        const newPos = {
            x: point.x - mousePointTo.x * boundedScale,
            y: point.y - mousePointTo.y * boundedScale,
        };

        return { scale: boundedScale, position: newPos };
    }
}
