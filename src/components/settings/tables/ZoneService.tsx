// @ts-nocheck
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    MapPin, 
    Check, 
    Edit3, 
    Trash2 
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";

const ZONE_COLORS = ['#F5F5F0', '#E8E8E0', '#D0D0C8', '#FFF8E1', '#F0EFEA', '#EAE0D5', '#D6CFC7', '#C0B8B0'];

interface ZoneServiceProps {
    zones: any[];
    floors: any[];
    tables: any[];
    addZone: (zone: any) => void;
    updateZone: (id: string, zone: any) => void;
    deleteZone: (id: string) => void;
    isEditingZone: boolean;
    setIsEditingZone: (is: boolean) => void;
}

export function ZoneService({
    zones,
    floors,
    tables,
    addZone,
    updateZone,
    deleteZone,
    isEditingZone,
    setIsEditingZone
}: ZoneServiceProps) {
    const [editingZone, setEditingZone] = useState<{ id?: string; name: string; color: string; description: string; floorId: string } | null>(null);

    const handleAddZone = () => {
        setEditingZone({ name: '', color: ZONE_COLORS[0], description: '', floorId: floors[0]?.id || 'rdc' });
        setIsEditingZone(true);
    };

    const handleEditZone = (zone: any) => {
        setEditingZone({ id: zone.id, name: zone.name, color: zone.color, description: zone.description || '', floorId: zone.floorId || 'rdc' });
        setIsEditingZone(true);
    };

    const handleSaveZone = () => {
        if (!editingZone?.name.trim()) return;
        if (editingZone.id) {
            updateZone(editingZone.id, { name: editingZone.name, color: editingZone.color, description: editingZone.description, floorId: editingZone.floorId });
        } else {
            addZone({ name: editingZone.name, color: editingZone.color, description: editingZone.description, floorId: editingZone.floorId });
        }
        setIsEditingZone(false);
        setEditingZone(null);
    };

    return (
        <motion.div
            key="zones"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-bg-secondary border border-border rounded-2xl md:rounded-[2.5rem] shadow-premium p-4 md:p-10"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center text-accent border border-border">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">Espaces & Zones</h3>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Secteurs de Service</p>
                    </div>
                </div>
                <button 
                  onClick={handleAddZone}
                  className="px-4 py-2 bg-text-primary text-bg-primary rounded-xl text-[10px] font-bold tracking-widest uppercase hover:bg-text-secondary transition-all"
                >
                  Nouvelle Zone
                </button>
            </div>

            <AnimatePresence>
                {isEditingZone && editingZone && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 overflow-hidden"
                    >
                        <div className="p-6 bg-bg-primary rounded-2xl border border-border">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Nom de la zone</label>
                                    <input
                                        type="text"
                                        value={editingZone.name}
                                        onChange={(e) => setEditingZone({ ...editingZone!, name: e.target.value })}
                                        placeholder="Ex: Terrasse, Salle VIP..."
                                        className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary font-serif outline-none focus:border-accent/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Étage</label>
                                    <select
                                        value={editingZone.floorId}
                                        onChange={(e) => setEditingZone({ ...editingZone!, floorId: e.target.value })}
                                        className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary font-serif outline-none focus:border-accent/40 cursor-pointer"
                                    >
                                        {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Couleur</label>
                                <div className="flex gap-2 flex-wrap">
                                    {ZONE_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setEditingZone({ ...editingZone!, color })}
                                            className={cn(
                                                "w-10 h-10 rounded-xl transition-all hover:scale-110 border border-border",
                                                editingZone.color === color && "ring-2 ring-offset-2 ring-offset-bg-primary ring-text-primary scale-110"
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => { setIsEditingZone(false); setEditingZone(null); }} className="px-4 py-2 text-text-muted font-bold text-xs uppercase uppercase">Annuler</button>
                                <button onClick={handleSaveZone} className="flex items-center gap-2 px-5 py-2 bg-text-primary text-bg-primary rounded-lg font-bold text-xs uppercase hover:bg-text-secondary transition-colors">
                                    <Check className="w-4 h-4" />
                                    {editingZone.id ? 'Sauvegarder' : 'Créer'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {zones.map((zone, idx) => (
                    <motion.div
                        key={zone.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-5 rounded-2xl border border-border group hover:shadow-lg transition-all relative overflow-hidden"
                        style={{ backgroundColor: zone.color }}
                    >
                        <div className="relative z-10 text-neutral-900">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: zone.color }} />
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditZone(zone)} className="p-1.5 hover:bg-black/5 rounded-lg"><Edit3 className="w-3.5 h-3.5 text-neutral-600" /></button>
                                    <button onClick={() => deleteZone(zone.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                                </div>
                            </div>
                            <p className="font-serif text-lg italic">{zone.name}</p>
                            <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">{zone.description || 'Zone Active'}</p>
                            <div className="mt-3 flex items-center gap-2">
                                <span className="px-2 py-1 bg-white/40 rounded-lg text-[10px] font-bold">
                                    {tables.filter(t => t.zoneId === zone.id).length} tables
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
