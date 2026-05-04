"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, AlertCircle, CheckCircle2, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { SharedKernel } from '@/lib/shared-kernel';
import { GoldSwitch } from '@/components/shared/atomic/GoldSwitch';
import { GlassInput } from '@/components/shared/atomic/GlassInput';
import { fadeInUp, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SovereignData, SovereignValue, SovereignField } from '@/shared/nexus-contract';
import { GlobalSettings } from '@/shared/nexus/contracts/settings';


export interface SettingsOption {
    label: string;
    value: SovereignValue;
}

export interface SettingsField {
    id: string;
    key?: string; // Legacy support
    label: string;
    description?: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'percentage' | 'list' | 'textarea' | 'text';
    unit?: 'cents' | 'grams' | 'percent';
    options?: SettingsOption[];
    subFields?: SettingsField[];
    validation?: import('zod').ZodTypeAny; // Zod or simple rules

}

export interface SettingsSchema<K extends keyof GlobalSettings = keyof GlobalSettings> {
    id: K;
    title?: string;
    fields: SettingsField[];
}

interface StandardSettingsEngineProps<K extends keyof GlobalSettings> {
    schema: SettingsSchema<K>; 
}

export const StandardSettingsEngine = <K extends keyof GlobalSettings>({ schema }: StandardSettingsEngineProps<K>) => {
    const { settings, updateConfig } = useSettings();
    const schemaKey = schema.id;
    
    // État local pour le "Dirty Tracking"
    const [localData, setLocalData] = useState<SovereignData>({});

    const [isSaving, setIsSaving] = useState(false);

    // Initialisation
    useEffect(() => {
        if (settings && settings[schemaKey as keyof typeof settings]) {
            setLocalData(settings[schemaKey as keyof typeof settings] as SovereignData);
        }
    }, [settings, schemaKey]);

    // Détection des changements
    const isDirty = useMemo(() => {
        const original = JSON.stringify(settings?.[schemaKey as keyof typeof settings] || {});
        const current = JSON.stringify(localData);
        return original !== current;
    }, [localData, settings, schemaKey]);

    const handleChange = (id: string, value: any) => {
        setLocalData(prev => ({
            ...prev,
            [id]: SharedKernel.Sovereign.wrap(value)
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 1. Validation Zod (si le schéma le supporte via .validation ou via un schéma global)
            // Pour l'instant on se concentre sur le sync
            
            // 2. Synchronisation via le Kernel (Assainissement + Persistence)
            const sanitizedData = SharedKernel.sync(schemaKey, localData, schema.fields as unknown as import('@/shared/nexus-contract').SovereignSchemaField[]);
            
            // 3. Mise à jour via le Context (Global State + Firestore)
            await updateConfig(schemaKey, sanitizedData as GlobalSettings[K]);
            
            toast.success("Synchronisation Nexus-Sync réussie");
        } catch (error) {
            console.error(error);
            toast.error("Échec de la synchronisation");
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setLocalData((settings?.[schemaKey as keyof typeof settings] as SovereignData) || {});
    };

    const renderField = (field: SettingsField, value: SovereignValue, onChange: (val: SovereignValue) => void) => {

        // Adaptation pour supporter 'key' ou 'id'
        const fieldId = field.id || field.key;

        switch (field.type) {
            case 'boolean':
                return (
                    <GoldSwitch
                        checked={!!value}
                        onChange={onChange}
                        label={field.label}
                        description={field.description}
                    />
                );
            case 'string':
            case 'text':
                return (
                    <GlassInput
                        label={field.label}
                        value={SharedKernel.castString(value)}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={`Saisir ${field.label.toLowerCase()}...`}
                    />
                );
            case 'textarea':
                return (
                    <div className="flex flex-col space-y-2 w-full text-left">
                        <span className="text-sm font-medium text-slate-300">{field.label}</span>
                        <textarea
                            className="w-full bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 outline-none transition-all focus:border-amber-500/50 min-h-[100px]"
                            value={SharedKernel.castString(value)}
                            onChange={(e) => onChange(e.target.value)}
                        />
                    </div>
                );
            case 'number':
            case 'percentage':
                let displayValue = value;
                if (field.unit === 'cents' && typeof value === 'number') displayValue = SharedKernel.centsToEuros(value);
                if (field.unit === 'grams' && typeof value === 'number') displayValue = SharedKernel.gramsToKilograms(value);

                return (
                    <GlassInput
                        type="number"
                        label={field.label}
                        value={SharedKernel.castNumber(value)}
                        onChange={(e) => onChange(parseFloat(e.target.value))}
                        icon={field.type === 'percentage' ? <span className="text-xs text-amber-500 font-bold">%</span> : null}
                    />
                );
            case 'select':
                return (
                    <div className="flex flex-col space-y-2 w-full text-left">
                        <span className="text-sm font-medium text-slate-300">{field.label}</span>
                        <select
                            className="w-full bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-amber-500/50"
                            value={SharedKernel.castString(value)}
                            onChange={(e) => onChange(e.target.value)}
                        >
                            <option value="" className="bg-slate-900">Sélectionner...</option>
                            {field.options?.map((opt: SettingsOption) => (
                                <option key={SharedKernel.castString(opt.value)} value={SharedKernel.castString(opt.value)} className="bg-slate-900">{opt.label}</option>
                            ))}
                        </select>
                    </div>
                );
            case 'color':
                return (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                        <span className="text-sm font-medium text-slate-300">{field.label}</span>
                        <input 
                            type="color" 
                            value={SharedKernel.castString(value)} 
                            onChange={(e) => onChange(e.target.value)}
                            className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                        />
                    </div>
                );
            case 'list':
                const listValue = Array.isArray(value) ? value : [];
                return (
                    <div className="space-y-4 p-4 rounded-2xl bg-slate-900/30 border border-slate-800/50 text-left">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-amber-500/80 uppercase tracking-wider">{field.label}</span>
                            <button 
                                onClick={() => onChange([...listValue, {}] as SovereignValue)}
                                className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg transition-colors border border-amber-500/30"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <AnimatePresence mode='popLayout'>
                            {listValue.map((item, index) => (
                                <motion.div 
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="relative grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-900/40 rounded-xl border border-slate-700/30 group/item"
                                >
                                    <button 
                                        onClick={() => onChange(listValue.filter((_, i) => i !== index) as SovereignValue)}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg z-10 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                    {field.subFields?.map((sub: SettingsField) => (
                                        <div key={sub.id || sub.key}>
                                            {renderField(sub, (item as Record<string, SovereignValue>)[sub.id || sub.key!], (val: SovereignValue) => {

                                                const newList = [...listValue];
                                                newList[index] = { ...(newList[index] as object), [sub.id || sub.key!]: val };
                                                onChange(newList as SovereignValue);
                                            })}
                                        </div>
                                    ))}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            {/* Header Control */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2rem] bg-slate-900/60 backdrop-blur-xl border border-white/5 shadow-2xl gap-4">
                <div className="text-left">
                    <h2 className="text-2xl font-bold text-white tracking-tight">{schema.title || schema.id.toUpperCase()}</h2>
                    <p className="text-sm text-slate-400">Configuration gérée par le Nexus-Sync Engine.</p>
                </div>
                
                <div className="flex items-center space-x-3">
                    <AnimatePresence>
                        {isDirty && (
                            <motion.button
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                onClick={handleReset}
                                className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                <RotateCcw size={16} />
                                <span>Annuler</span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                    
                    <button
                        disabled={!isDirty || isSaving}
                        onClick={handleSave}
                        className={cn(
                            "flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-xl",
                            isDirty 
                                ? "bg-amber-500 text-slate-950 hover:bg-amber-400 hover:scale-[1.02] active:scale-95 shadow-amber-500/20" 
                                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                        )}
                    >
                        {isSaving ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                                <RotateCcw size={18} />
                            </motion.div>
                        ) : (
                            <Save size={18} />
                        )}
                        <span>{isSaving ? "SYNC EN COURS..." : "SAUVEGARDER"}</span>
                    </button>
                </div>
            </div>

            {/* Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode='popLayout'>
                    {schema.fields.map((field: SettingsField) => (
                        <motion.div
                            key={field.id || field.key}
                            variants={fadeInUp}
                            className={cn(
                                "p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-all group",
                                field.type === 'list' && "md:col-span-2"
                            )}
                        >
                            {renderField(field, (localData as Record<string, SovereignField>)[field.id], (val: any) => handleChange(field.id, val))}

                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Sync Status Overlay */}
            {!isDirty && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center space-x-2 text-green-500/80 bg-green-500/5 py-3 rounded-full border border-green-500/10"
                >
                    <CheckCircle2 size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Données Nexus-Sync Synchronisées</span>
                </motion.div>
            )}
        </motion.div>
    );
};
