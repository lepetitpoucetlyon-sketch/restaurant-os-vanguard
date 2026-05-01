"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    LayoutGrid, 
    Check, 
    Edit3, 
    Trash2, 
    Users, 
    Square, 
    Circle 
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { Table, Zone, Floor, TableShape } from "@nexus/contracts";

const TABLE_SHAPES = [
    { id: 'rect', label: 'Rectangle', icon: Square },
    { id: 'circle', label: 'Rond', icon: Circle },
];

interface MobilierConfigProps {
    tables: Table[];
    zones: Zone[];
    floors: Floor[];
    addTable: (table: Omit<Table, 'id'>) => void;
    updateTable: (id: string, table: Partial<Table>) => void;
    deleteTable: (id: string) => void;
    isEditingTable: boolean;
    setIsEditingTable: (is: boolean) => void;
}

export function MobilierConfig({
    tables,
    zones,
    floors,
    addTable,
    updateTable,
    deleteTable,
    isEditingTable,
    setIsEditingTable
}: MobilierConfigProps) {
    const [editingTable, setEditingTable] = useState<{ id?: string; number: string; seats: number; shape: TableShape; zoneId: string; floorId: string } | null>(null);

    const handleAddTable = () => {
        setEditingTable({ number: '', seats: 4, shape: 'rect', zoneId: zones[0]?.id || 'main', floorId: floors[0]?.id || 'rdc' });
        setIsEditingTable(true);
    };

    const handleEditTable = (table: Table) => {
        setEditingTable({ 
            id: table.id, 
            number: table.number, 
            seats: table.seats, 
            shape: table.shape as TableShape, 
            zoneId: table.zoneId || 'main', 
            floorId: table.floorId || 'rdc' 
        });
        setIsEditingTable(true);
    };

    const handleSaveTable = async () => {
        if (!editingTable?.number.trim()) return;
        if (editingTable.id) {
            await updateTable(editingTable.id, { number: editingTable.number, seats: editingTable.seats, shape: editingTable.shape, zoneId: editingTable.zoneId, floorId: editingTable.floorId });
        } else {
            await addTable({
                number: editingTable.number,
                seats: editingTable.seats,
                shape: editingTable.shape,
                status: 'free',
                x: 100 + Math.random() * 200,
                y: 100 + Math.random() * 200,
                width: 80,
                height: 80,
                zoneId: editingTable.zoneId,
                floorId: editingTable.floorId
            });
        }
        setIsEditingTable(false);
        setEditingTable(null);
    };

    return (
        <motion.div
            key="tables"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-bg-secondary border border-border rounded-2xl md:rounded-[2.5rem] shadow-premium p-4 md:p-10"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center text-accent border border-border">
                        <LayoutGrid className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">Inventaire Mobilier</h3>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Configuration des Unités</p>
                    </div>
                </div>
                <button 
                  onClick={handleAddTable}
                  className="px-4 py-2 bg-text-primary text-bg-primary rounded-xl text-[10px] font-bold tracking-widest uppercase hover:bg-text-secondary transition-all"
                >
                  Ajouter une Table
                </button>
            </div>

            <AnimatePresence>
                {isEditingTable && editingTable && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 overflow-hidden"
                    >
                        <div className="p-6 bg-bg-primary rounded-2xl border border-border">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Numéro</label>
                                    <input
                                        type="text"
                                        value={editingTable.number}
                                        onChange={(e) => setEditingTable({ ...editingTable!, number: e.target.value })}
                                        placeholder="Ex: 1, A1..."
                                        className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary font-serif outline-none focus:border-accent/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Couverts</label>
                                    <input
                                        type="number"
                                        value={editingTable.seats}
                                        onChange={(e) => setEditingTable({ ...editingTable!, seats: Number(e.target.value) })}
                                        min={1}
                                        max={20}
                                        className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary font-serif outline-none focus:border-accent/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Zone</label>
                                    <select
                                        value={editingTable.zoneId}
                                        onChange={(e) => setEditingTable({ ...editingTable!, zoneId: e.target.value })}
                                        className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary font-serif outline-none focus:border-accent/40 cursor-pointer"
                                    >
                                        {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Forme</label>
                                    <div className="flex gap-2">
                                        {TABLE_SHAPES.map((shape) => (
                                            <button
                                                key={shape.id}
                                                onClick={() => setEditingTable({ ...editingTable!, shape: shape.id as TableShape })}
                                                className={cn(
                                                    "flex-1 py-3 rounded-xl flex items-center justify-center transition-all border border-border",
                                                    editingTable.shape === shape.id
                                                        ? "bg-text-primary text-bg-primary"
                                                        : "bg-bg-tertiary text-text-muted hover:bg-bg-secondary"
                                                )}
                                            >
                                                <shape.icon className="w-5 h-5" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => { setIsEditingTable(false); setEditingTable(null); }} className="px-4 py-2 text-text-muted font-bold text-xs uppercase uppercase">Annuler</button>
                                <button onClick={handleSaveTable} className="flex items-center gap-2 px-5 py-2 bg-text-primary text-bg-primary rounded-lg font-bold text-xs uppercase hover:bg-text-secondary transition-colors">
                                    <Check className="w-4 h-4" />
                                    {editingTable.id ? 'Sauvegarder' : 'Créer'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tables.map((table, idx) => {
                    const zone = zones.find(z => z.id === table.zoneId);
                    return (
                        <motion.div
                            key={table.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            className="p-4 bg-bg-primary rounded-2xl border border-border group hover:shadow-lg hover:scale-105 transition-all cursor-pointer hover:border-accent/40"
                        >
                            <div className="flex items-center justify-between mb-3 text-neutral-900">
                                <div className={cn(
                                    "w-12 h-12 flex items-center justify-center font-serif text-lg font-medium",
                                    table.shape === 'circle' ? 'rounded-full' : 'rounded-xl'
                                )} style={{ backgroundColor: zone?.color || '#f3f4f6' }}>
                                    {table.number}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditTable(table)} className="p-1.5 hover:bg-bg-tertiary rounded-lg">
                                        <Edit3 className="w-3.5 h-3.5 text-text-muted" />
                                    </button>
                                    <button onClick={() => deleteTable(table.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg">
                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 text-text-muted font-bold">
                                    <Users className="w-3.5 h-3.5" />
                                    {table.seats} PAX
                                </span>
                                <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold text-neutral-600 truncate max-w-[80px]" style={{ backgroundColor: zone?.color }}>
                                    {zone?.name || 'N/A'}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
