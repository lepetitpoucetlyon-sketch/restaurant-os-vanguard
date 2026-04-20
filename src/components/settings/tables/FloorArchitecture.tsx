// @ts-nocheck
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Layers, 
    Check, 
    Building2, 
    Edit3, 
    Trash2 
} from "lucide-react";

interface FloorArchitectureProps {
    floors: any[];
    addFloor: (floor: any) => void;
    updateFloor: (id: string, floor: any) => void;
    deleteFloor: (id: string) => void;
    isEditingFloor: boolean;
    setIsEditingFloor: (is: boolean) => void;
}

export function FloorArchitecture({
    floors,
    addFloor,
    updateFloor,
    deleteFloor,
    isEditingFloor,
    setIsEditingFloor
}: FloorArchitectureProps) {
    const [editingFloor, setEditingFloor] = useState<{ id?: string; name: string; level: number; description: string } | null>(null);

    const handleAddFloor = () => {
        setEditingFloor({ name: '', level: floors.length, description: '' });
        setIsEditingFloor(true);
    };

    const handleEditFloor = (floor: any) => {
        setEditingFloor({ id: floor.id, name: floor.name, level: floor.level, description: floor.description || '' });
        setIsEditingFloor(true);
    };

    const handleSaveFloor = () => {
        if (!editingFloor?.name.trim()) return;
        if (editingFloor.id) {
            updateFloor(editingFloor.id, { name: editingFloor.name, level: editingFloor.level, description: editingFloor.description });
        } else {
            addFloor({ name: editingFloor.name, level: editingFloor.level, description: editingFloor.description, isActive: true });
        }
        setIsEditingFloor(false);
        setEditingFloor(null);
    };

    return (
        <motion.div
            key="floors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-bg-secondary border border-border rounded-2xl md:rounded-[2.5rem] shadow-premium p-4 md:p-10"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center text-accent border border-border">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">Architecture Spatiale</h3>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Niveaux & Hiérarchie</p>
                    </div>
                </div>
                <button 
                  onClick={handleAddFloor}
                  className="px-4 py-2 bg-text-primary text-bg-primary rounded-xl text-[10px] font-bold tracking-widest uppercase hover:bg-text-secondary transition-all"
                >
                  Ajouter un Étage
                </button>
            </div>

            <AnimatePresence>
                {isEditingFloor && editingFloor && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 overflow-hidden"
                    >
                        <div className="p-6 bg-bg-primary rounded-2xl border border-border">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Nom</label>
                                    <input
                                        type="text"
                                        value={editingFloor.name}
                                        onChange={(e) => setEditingFloor({ ...editingFloor!, name: e.target.value })}
                                        placeholder="Ex: Rez-de-chaussée"
                                        className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary font-serif outline-none focus:border-accent/40 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Niveau</label>
                                    <input
                                        type="number"
                                        value={editingFloor.level}
                                        onChange={(e) => setEditingFloor({ ...editingFloor!, level: Number(e.target.value) })}
                                        className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary font-serif outline-none focus:border-accent/40 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Description</label>
                                    <input
                                        type="text"
                                        value={editingFloor.description}
                                        onChange={(e) => setEditingFloor({ ...editingFloor!, description: e.target.value })}
                                        placeholder="Description optionnelle"
                                        className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary font-serif outline-none focus:border-accent/40 transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => { setIsEditingFloor(false); setEditingFloor(null); }} className="px-4 py-2 text-text-muted font-bold text-xs uppercase uppercase">Annuler</button>
                                <button onClick={handleSaveFloor} className="flex items-center gap-2 px-5 py-2 bg-text-primary text-bg-primary rounded-lg font-bold text-xs uppercase hover:bg-text-secondary transition-colors">
                                    <Check className="w-4 h-4" />
                                    {editingFloor.id ? 'Sauvegarder' : 'Créer'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-3">
                {floors.map((floor, idx) => (
                    <motion.div
                        key={floor.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-4 p-5 bg-bg-primary rounded-2xl border border-border group hover:border-accent/30 transition-all"
                    >
                        <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1">
                            <p className="font-serif text-text-primary italic text-lg">{floor.name}</p>
                            <p className="text-xs text-text-muted font-bold tracking-wide uppercase">Niveau {floor.level} • {floor.description}</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditFloor(floor)} className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
                                <Edit3 className="w-4 h-4 text-text-muted" />
                            </button>
                            <button onClick={() => deleteFloor(floor.id)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
