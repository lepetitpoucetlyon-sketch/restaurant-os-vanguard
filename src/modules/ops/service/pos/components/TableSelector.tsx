"use client";

import { useState, useEffect, useRef } from "react";
import { useTables } from '../../../providers/hooks/floorHooks';
import { motion } from "framer-motion";
import type { Table } from "@nexus/contracts";
import { TableButton } from "./table-selector/TableButton";
import { TableSelectorHeader } from "./table-selector/TableSelectorHeader";
import { TableLegendFooter } from "./table-selector/TableLegendFooter";

interface TableSelectorProps {
    onSelectTable: (tableId: string) => void;
}

export function TableSelector({ onSelectTable }: TableSelectorProps) {
    const { tables: rawTables, zones } = useTables();
    const tables = rawTables as unknown as Table[];
    const [viewMode, setViewMode] = useState<'grid' | 'zones'>('grid');

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (gridRef.current && scrollContainerRef.current) {
                const top = gridRef.current.offsetTop;
                scrollContainerRef.current.scrollTo({
                    top: top - 40,
                    behavior: 'smooth'
                });
            }
        }, 1200);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            ref={scrollContainerRef}
            className="flex-1 overflow-auto bg-bg-primary transition-colors duration-500 relative elegant-scrollbar scroll-smooth"
        >
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent-gold/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-gold/5 blur-[150px] pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 px-6 md:px-12 pt-10 pb-24"
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
                                staggerChildren: 0.08,
                                delayChildren: 0.1
                            }
                        }
                    }}
                >
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                            {tables.map((table) => (
                                <motion.div
                                    key={table.id}
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.85, y: 100 },
                                        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } }
                                    }}
                                >
                                    <TableButton
                                        table={table}
                                        index={tables.indexOf(table)}
                                        onSelectTable={onSelectTable}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-20">
                            {zones.map(zone => {
                                const zoneTables = (tables as Table[]).filter((t: Table) => t.zoneId === zone.id);
                                if (zoneTables.length === 0) return null;

                                return (
                                    <div key={zone.id}>
                                        <div className="flex items-center gap-8 mb-10">
                                            <h3 className="text-4xl font-serif font-bold text-text-primary italic">{(zone.name as string)}</h3>
                                            <div className="h-0.5 flex-1 bg-gradient-to-r from-accent-gold/30 to-transparent" />
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">{zoneTables.length} Unités</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
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
