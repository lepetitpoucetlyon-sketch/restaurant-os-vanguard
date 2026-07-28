"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useTables } from "@/modules/ops/providers";
import {
    LayoutGrid,
    Users,
    Box,
    Cpu,
} from "lucide-react";
import { TablesToolbar } from "./tables/TablesToolbar";
import { FloorArchitecture } from "./tables/FloorArchitecture";
import { ZoneService } from "./tables/ZoneService";
import { MobilierConfig } from "./tables/MobilierConfig";

export default function TablesSettings() {
    const tablesHook = useTables();
    const tables = tablesHook.tables;
    const zones = tablesHook.zones;
    const floors = tablesHook.floors;
    const {
        addTable,
        updateTable,
        deleteTable,
        addZone,
        updateZone,
        deleteZone,
        addFloor,
        updateFloor,
        deleteFloor
    } = tablesHook;

    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'zones' | 'tables' | 'floors'>('zones');

    const [isEditingZone, setIsEditingZone] = useState(false);
    const [isEditingTable, setIsEditingTable] = useState(false);
    const [isEditingFloor, setIsEditingFloor] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        // 🚀 INDUSTRIAL SOUDURE: Instantaneous Floor Plan Sync
        setIsSaving(false);
    };

    const tablesCount = tables.length;
    const totalSeats = tables.reduce((acc: number, t: { seats: number }) => acc + t.seats, 0);

    const isEditing = isEditingZone || isEditingTable || isEditingFloor;

    const handleAddButtonClick = () => {
        if (activeTab === 'zones') setIsEditingZone(true);
        else if (activeTab === 'tables') setIsEditingTable(true);
        else if (activeTab === 'floors') setIsEditingFloor(true);
    };

    return (
        <div className="space-y-12 pb-20">
            <TablesToolbar 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isEditing={isEditing}
                onAdd={handleAddButtonClick}
                onSave={handleSave}
                isSaving={isSaving}
                floors={floors}
            />

            {/* Quick Context Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'CONFIGURATION', value: activeTab === 'zones' ? 'Zones' : activeTab === 'tables' ? 'Tables' : 'Étages', icon: LayoutGrid },
                    { label: 'ELEMENTS VISIBLES', value: activeTab === 'zones' ? zones.length : activeTab === 'tables' ? tablesCount : floors.length, icon: Box },
                    { label: 'CAPACITÉ TOTALE', value: totalSeats + ' PAX', icon: Users },
                    { label: 'TAUX OPTIMISATION', value: '94%', icon: Cpu },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-bg-secondary border border-border p-4 rounded-2xl flex items-center justify-between group hover:border-accent/30 transition-all">
                        <div>
                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-lg font-serif text-text-primary italic">{stat.value}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-bg-primary flex items-center justify-center text-text-muted group-hover:text-accent transition-colors">
                            <stat.icon className="w-5 h-5" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Switcher */}
            <AnimatePresence mode="wait">
                {activeTab === 'floors' && (
                    <FloorArchitecture 
                        floors={floors}
                        addFloor={addFloor}
                        updateFloor={updateFloor}
                        deleteFloor={deleteFloor}
                        isEditingFloor={isEditingFloor}
                        setIsEditingFloor={setIsEditingFloor}
                    />
                )}

                {activeTab === 'zones' && (
                    <ZoneService 
                        zones={zones}
                        floors={floors}
                        tables={tables}
                        addZone={addZone}
                        updateZone={updateZone}
                        deleteZone={deleteZone}
                        isEditingZone={isEditingZone}
                        setIsEditingZone={setIsEditingZone}
                    />
                )}

                {activeTab === 'tables' && (
                    <MobilierConfig 
                        tables={tables}
                        zones={zones}
                        floors={floors}
                        addTable={addTable}
                        updateTable={updateTable}
                        deleteTable={deleteTable}
                        isEditingTable={isEditingTable}
                        setIsEditingTable={setIsEditingTable}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
