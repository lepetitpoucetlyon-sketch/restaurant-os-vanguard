"use client";

import { useState, useRef } from "react";
import { useTables } from '../../../providers/hooks/floorHooks';
import { motion } from "framer-motion";
import type { Table } from "@nexus/contracts";
import { TableButton } from "./table-selector/TableButton";
import { TableSelectorHeader } from "./table-selector/TableSelectorHeader";
import { TableLegendFooter } from "./table-selector/TableLegendFooter";

interface TableSelectorProps {
    onSelectTable: (tableId: string) => void;
}

const DEFAULT_DEV_TABLES: Table[] = [
    { id: 'table-1', number: 1, seats: 2, status: 'free', zoneId: 'salle' } as unknown as Table,
    { id: 'table-2', number: 2, seats: 4, status: 'seated', zoneId: 'salle' } as unknown as Table,
    { id: 'table-3', number: 3, seats: 4, status: 'ordered', zoneId: 'salle' } as unknown as Table,
    { id: 'table-4', number: 4, seats: 6, status: 'eating', zoneId: 'salle' } as unknown as Table,
    { id: 'table-5', number: 5, seats: 2, status: 'paying', zoneId: 'salle' } as unknown as Table,
    { id: 'table-6', number: 6, seats: 8, status: 'free', zoneId: 'terrasse' } as unknown as Table,
    { id: 'table-7', number: 7, seats: 4, status: 'dirty', zoneId: 'terrasse' } as unknown as Table,
    { id: 'table-8', number: 8, seats: 2, status: 'reserved', zoneId: 'bar' } as unknown as Table,
];

export function TableSelector({ onSelectTable }: TableSelectorProps) {
    const { tables: rawTables, zones } = useTables();
    const rawList = rawTables as unknown as Table[];
    const tables = rawList.length > 0 ? rawList : DEFAULT_DEV_TABLES;
    const [viewMode, setViewMode] = useState<'grid' | 'zones'>('grid');

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    return (
        <div
            ref={scrollContainerRef}
            className="flex-1 overflow-auto bg-bg-primary transition-colors duration-200 relative elegant-scrollbar scroll-smooth"
        >
            <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto"
            >
                <TableSelectorHeader
                    tables={tables}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                />

                <motion.div
                    ref={gridRef}
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.04,
                                delayChildren: 0.05
                            }
                        }
                    }}
                >
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                            {tables.map((table, idx) => (
                                <motion.div
                                    key={table.id}
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.96, y: 10 },
                                        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25 } }
                                    }}
                                >
                                    <TableButton
                                        table={table}
                                        index={idx}
                                        onSelectTable={onSelectTable}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {(zones.length > 0 ? zones : [{ id: 'salle', name: 'Salle Principale' }, { id: 'terrasse', name: 'Terrasse' }, { id: 'bar', name: 'Bar' }]).map(zone => {
                                const zoneTables = (tables as Table[]).filter((t: Table) => t.zoneId === zone.id);
                                if (zoneTables.length === 0) return null;

                                return (
                                    <div key={zone.id}>
                                        <div className="flex items-center gap-4 mb-4">
                                            <h3 className="text-lg font-bold text-text-primary">{(zone.name as string)}</h3>
                                            <div className="h-px flex-1 bg-border" />
                                            <span className="text-xs text-text-muted font-medium">{zoneTables.length} tables</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                                            {zoneTables.map((table: Table, idx: number) => (
                                                <TableButton
                                                    key={table.id}
                                                    table={table}
                                                    index={idx}
                                                    onSelectTable={onSelectTable}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                <TableLegendFooter />
            </motion.div>
        </div>
    );
}
