"use client";

import { Group, Circle, Arc } from "react-konva";
import { Table } from "@nexus/contracts";

interface TableChairsProps {
    table: Table;
    isSelected: boolean;
    viewMode: '2d' | '3d';
    isDarkMode: boolean;
}

// Helper to render chairs around a table
const TableChairs = ({ table, isSelected, viewMode, isDarkMode }: TableChairsProps) => {
    const chairs = [];
    const seatCount = table.seats;
    const chairDistance = 5;

    for (let i = 0; i < seatCount; i++) {
        let x = 0;
        let y = 0;
        let rotation = 0;

        if (table.shape === 'circle') {
            const angle = (i * 360) / seatCount;
            const rad = (angle * Math.PI) / 180;
            const dist = table.radius! + chairDistance;
            x = Math.cos(rad) * dist;
            y = Math.sin(rad) * dist;
            rotation = angle;
        } else {
            const w = table.width!;
            const h = table.height!;
            const perimeter = 2 * (w + h);
            const step = perimeter / seatCount;
            let currentDist = i * step + (step / 2);
            const hw = w / 2;
            const hh = h / 2;

            if (currentDist < w) {
                x = -hw + currentDist;
                y = -hh - chairDistance;
                rotation = 270;
            } else if (currentDist < w + h) {
                currentDist -= w;
                x = hw + chairDistance;
                y = -hh + currentDist;
                rotation = 0;
            } else if (currentDist < 2 * w + h) {
                currentDist -= (w + h);
                x = hw - currentDist;
                y = hh + chairDistance;
                rotation = 90;
            } else {
                currentDist -= (2 * w + h);
                x = -hw - chairDistance;
                y = hh - currentDist;
                rotation = 180;
            }
        }

        chairs.push(
            <Group key={i} x={x} y={y} rotation={rotation}>
                {/* Chair Legs (Simple representation for 3D) */}
                {viewMode === '3d' && (
                    <>
                        <Circle x={-5} y={5} radius={2} fill="#000" opacity={0.2} />
                        <Circle x={5} y={5} radius={2} fill="#000" opacity={0.2} />
                    </>
                )}

                {/* Chair Seat */}
                <Arc
                    innerRadius={0} // Filled seat
                    outerRadius={14}
                    angle={360}
                    rotation={0}
                    fill={isSelected ? (isDarkMode ? "#C5A059" : "#333") : (isDarkMode ? "#1A1A1A" : "#F1F5F9")} // Lighter 3D shade
                    stroke={isSelected ? (isDarkMode ? "#FFFFFF" : "#C5A059") : (isDarkMode ? "#333" : "#CBD5E1")}
                    strokeWidth={1}
                    shadowColor="black"
                    shadowBlur={viewMode === '3d' ? 6 : 2}
                    shadowOpacity={viewMode === '3d' ? 0.3 : 0.1}
                    shadowOffsetY={viewMode === '3d' ? 4 : 1}
                />

                {/* Chair Backrest - Curved for realism */}
                <Arc
                    innerRadius={10}
                    outerRadius={16}
                    angle={100}
                    rotation={310} // Positioned at the "back" - facing the table (180° flipped)
                    fill={isSelected ? (isDarkMode ? "#C5A059" : "#333") : (isDarkMode ? "#2A2A2A" : "#E2E8F0")}
                    stroke={isSelected ? (isDarkMode ? "#FFFFFF" : "#C5A059") : (isDarkMode ? "#333" : "#CBD5E1")}
                    strokeWidth={1}
                    opacity={1}
                    cornerRadius={5}
                />

                {/* 3D Depth Highlight on Backrest */}
                {viewMode === '3d' && (
                    <Arc
                        innerRadius={15}
                        outerRadius={16}
                        angle={100}
                        rotation={310}
                        fill="white"
                        opacity={0.3}
                        listening={false}
                    />
                )}
            </Group>
        );
    }

    return <Group>{chairs}</Group>;
};

export default TableChairs;
