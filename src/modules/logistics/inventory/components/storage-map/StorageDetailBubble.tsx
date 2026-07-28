
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Thermometer,
    Package,
    ChefHat,
    X,
    Calendar,
    Clock,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";;
import { StorageLocation, StockItem, Preparation } from "@nexus/contracts";
import { STORAGE_TYPE_CONFIG } from "./StorageTypeConfig";

interface StorageDetailBubbleProps {
    location: StorageLocation;
    stockItems: StockItem[];
    preparations: Preparation[];
    onClose: () => void;
    onTransferStock: (stockItemId: string, toLocation: string) => void;
    onTransferPreparation: (prepId: string, toLocation: string) => void;
    allLocations: StorageLocation[];
}

export function StorageDetailBubble({ location, stockItems, preparations, onClose, onTransferStock, onTransferPreparation, allLocations }: StorageDetailBubbleProps) {
    const config = STORAGE_TYPE_CONFIG[location.type] || STORAGE_TYPE_CONFIG.other;
    const Icon = config.icon;
    const [activeTab, setActiveTab] = useState<'stock' | 'preparations'>('stock');
    const [movingItemId, setMovingItemId] = useState<string | null>(null);
    const [movingPrepId, setMovingPrepId] = useState<string | null>(null);

    const otherLocations = allLocations.filter(l => l.id !== location.id && l.isActive);

    const getDlcStatus = (dlc: string) => {
        const today = new Date();
        const dlcDate = new Date(dlc);
        const daysUntil = Math.ceil((dlcDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil < 0) return { label: 'Expiré', color: 'text-status-danger bg-surface-bg border-red-200', badge: 'bg-status-danger' };
        if (daysUntil === 0) return { label: "Aujourd'hui", color: 'text-status-warning bg-status-warning border-orange-200', badge: 'bg-status-warning' };
        if (daysUntil <= 2) return { label: `J+${daysUntil}`, color: 'text-status-warning bg-status-warning border-amber-200', badge: 'bg-status-warning' };
        return { label: `J+${daysUntil}`, color: 'text-status-success bg-surface-bg border-green-200', badge: 'bg-status-success' };
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-surface-sidebar/20 backdrop-blur-sm z-40"
            />

            {/* Bubble Popup */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-h-[85vh] bg-bg-secondary/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 z-50 flex flex-col overflow-hidden border border-border"
            >
                {/* Header with gradient background */}
                <div className={cn("relative p-6 overflow-hidden", config.bgColor)}>
                    {/* Decorative gradient orbs */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-50" style={{ background: `radial-gradient(circle, ${config.color}40 0%, transparent 70%)` }} />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-30" style={{ background: `radial-gradient(circle, ${config.color}30 0%, transparent 70%)` }} />

                    <div className="relative z-10">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-surface-card/80 dark:bg-surface-sidebar/20 backdrop-blur flex items-center justify-center shadow-lg border border-default">
                                    <Icon className="w-8 h-8" style={{ color: config.color }} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-serif font-light text-text-primary italic">{location.name}</h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest bg-surface-card/60 backdrop-blur" style={{ color: config.color }}>
                                            {config.label}
                                        </span>
                                        {location.zone && (
                                            <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest bg-surface-card/40 dark:bg-surface-sidebar/10 text-text-muted">
                                                {location.zone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-xl bg-surface-card/60 dark:bg-surface-sidebar/20 backdrop-blur hover:bg-surface-card dark:hover:bg-surface-card/10 flex items-center justify-center transition-all hover:scale-110 border border-default"
                            >
                                <X className="w-5 h-5 text-text-primary" />
                            </button>
                        </div>

                        {/* Temperature & Stats Row */}
                        <div className="flex items-center gap-3 mt-6">
                            {location.temperature !== undefined && (
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-card/70 dark:bg-surface-sidebar/20 backdrop-blur rounded-xl shadow-sm border border-default">
                                    <Thermometer className="w-4 h-4" style={{ color: config.color }} />
                                    <span className="text-2xl font-mono font-light text-text-primary">{location.temperature}°C</span>
                                    {location.temperatureMin !== undefined && location.temperatureMax !== undefined && (
                                        <span className="text-[10px] font-bold text-text-muted ml-1">
                                            ({location.temperatureMin} à {location.temperatureMax}°C)
                                        </span>
                                    )}
                                </div>
                            )}
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-card/70 dark:bg-surface-sidebar/20 backdrop-blur rounded-xl shadow-sm border border-default">
                                <Package className="w-4 h-4 text-text-muted" />
                                <span className="text-lg font-mono font-light text-text-primary">{stockItems.length}</span>
                                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">ARTICLES</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 px-6 py-4 bg-bg-tertiary/50 border-b border-border">
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={cn(
                            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'stock'
                                ? "bg-bg-primary shadow-sm text-text-primary ring-1 ring-black/5 dark:ring-white/5"
                                : "text-text-muted hover:text-text-primary hover:bg-bg-primary/50"
                        )}
                    >
                        Ingrédients ({stockItems.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('preparations')}
                        className={cn(
                            "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === 'preparations'
                                ? "bg-surface-card dark:bg-surface-card/10 shadow-md text-primary dark:text-text-primary"
                                : "text-secondary dark:text-muted hover:text-primary dark:hover:text-muted hover:bg-surface-card/50 dark:hover:bg-surface-card/5"
                        )}
                    >
                        Préparations ({preparations.length})
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'stock' ? (
                            <motion.div
                                key="stock"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-2"
                            >
                                {stockItems.length === 0 ? (
                                    <div className="text-center py-10">
                                        <div className="w-16 h-16 mx-auto rounded-xl bg-bg-tertiary flex items-center justify-center mb-4 border border-border">
                                            <Package className="w-8 h-8 text-text-muted" />
                                        </div>
                                        <p className="font-bold text-text-muted">Aucun ingrédient</p>
                                        <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest">Glissez des ingrédients ici</p>
                                    </div>
                                ) : (
                                    stockItems.map(item => {
                                        const dlcStatus = getDlcStatus(item.dlc);
                                        const isMoving = movingItemId === item.id;
                                        return (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                className="p-4 bg-bg-primary rounded-xl border border-border hover:border-accent/40 hover:shadow-lg transition-all group"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={cn("w-1.5 h-full min-h-[40px] rounded-full", dlcStatus.badge)} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-serif text-lg font-light text-text-primary italic truncate leading-tight">{item.ingredientName}</p>
                                                                <div className="flex items-center gap-3 mt-1.5">
                                                                    <span className="text-sm font-mono font-bold text-text-secondary">
                                                                        {item.quantity} {item.unit}
                                                                    </span>
                                                                    {item.batchNumber && (
                                                                        <span className="text-[9px] font-black text-text-muted uppercase px-2 py-0.5 bg-bg-tertiary rounded-sm border border-border">
                                                                            Lot: {item.batchNumber}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border shadow-sm", dlcStatus.color)}>
                                                                {dlcStatus.label}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4 mt-3 text-[10px] font-black text-text-muted uppercase tracking-wider">
                                                            <span className="flex items-center gap-1.5">
                                                                <Calendar className="w-3 h-3" />
                                                                {formatDate(item.receptionDate)}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <Clock className="w-3 h-3" />
                                                                DLC: {formatDate(item.dlc)}
                                                            </span>
                                                        </div>

                                                        {/* Transfer button */}
                                                        <div className="mt-4 pt-3 border-t border-border">
                                                            {isMoving ? (
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-[10px] font-black text-text-primary uppercase">Déplacer vers :</p>
                                                                        <button onClick={() => setMovingItemId(null)} className="text-[10px] font-bold text-text-muted hover:text-text-primary">
                                                                            Annuler
                                                                        </button>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                                                        {otherLocations.slice(0, 6).map(loc => {
                                                                            const locConfig = STORAGE_TYPE_CONFIG[loc.type] || STORAGE_TYPE_CONFIG.other;
                                                                            const LocIcon = locConfig.icon;
                                                                            return (
                                                                                <button
                                                                                    key={loc.id}
                                                                                    onClick={() => {
                                                                                        onTransferStock(item.id, loc.id);
                                                                                        setMovingItemId(null);
                                                                                    }}
                                                                                    className="flex items-center gap-2 p-2.5 bg-bg-tertiary border border-border rounded-xl hover:border-accent hover:bg-accent/5 transition-all text-left group/loc"
                                                                                >
                                                                                    <LocIcon className="w-3.5 h-3.5 text-text-muted group-hover/loc:text-accent transition-colors" />
                                                                                    <span className="text-[10px] font-bold text-text-primary truncate">{loc.name}</span>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setMovingItemId(item.id)}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-text-primary text-bg-primary rounded-xl hover:bg-accent hover:text-text-primary transition-all text-[10px] font-black uppercase tracking-widest shadow-lg"
                                                                >
                                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                                    Déplacer
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="preparations"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-2"
                            >
                                {preparations.length === 0 ? (
                                    <div className="text-center py-10">
                                        <div className="w-16 h-16 mx-auto rounded-xl bg-bg-tertiary flex items-center justify-center mb-4 border border-border">
                                            <ChefHat className="w-8 h-8 text-text-muted" />
                                        </div>
                                        <p className="font-bold text-text-muted">Aucune préparation</p>
                                    </div>
                                ) : (
                                    preparations.map(prep => {
                                        const dlcStatus = getDlcStatus(prep.dlc);
                                        const isMoving = movingPrepId === prep.id;
                                        return (
                                            <motion.div
                                                key={prep.id}
                                                layout
                                                className="p-4 bg-bg-primary rounded-xl border border-border hover:border-accent/40 hover:shadow-lg transition-all group"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={cn("w-1.5 h-full min-h-[40px] rounded-full", dlcStatus.badge)} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-serif text-lg font-light text-text-primary italic truncate leading-tight">{prep.name}</p>
                                                                <div className="flex items-center gap-3 mt-1.5">
                                                                    <span className="text-sm font-mono font-bold text-text-secondary">
                                                                        {prep.quantity} {prep.unit}
                                                                    </span>
                                                                    {prep.portions && (
                                                                        <span className="text-[9px] font-black text-accent uppercase px-2 py-0.5 bg-accent/5 rounded-sm border border-accent/20">
                                                                            {prep.portions} portions
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border shadow-sm",
                                                                prep.status === 'use_today' ? 'text-status-warning bg-status-warning border-orange-200' : dlcStatus.color
                                                            )}>
                                                                {prep.status === 'use_today' ? "À utiliser" : dlcStatus.label}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4 mt-3 text-[10px] font-black text-text-muted uppercase tracking-wider">
                                                            <span className="flex items-center gap-1.5">
                                                                <ChefHat className="w-3 h-3" />
                                                                {prep.preparedBy}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <Clock className="w-3 h-3" />
                                                                DLC: {formatDate(prep.dlc)}
                                                            </span>
                                                        </div>

                                                        {/* Transfer button */}
                                                        <div className="mt-4 pt-3 border-t border-border">
                                                            {isMoving ? (
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-[10px] font-black text-text-primary uppercase">Déplacer vers :</p>
                                                                        <button onClick={() => setMovingPrepId(null)} className="text-[10px] font-bold text-text-muted hover:text-text-primary">
                                                                            Annuler
                                                                        </button>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                                                        {otherLocations.slice(0, 6).map(loc => {
                                                                            const locConfig = STORAGE_TYPE_CONFIG[loc.type] || STORAGE_TYPE_CONFIG.other;
                                                                            const LocIcon = locConfig.icon;
                                                                            return (
                                                                                <button
                                                                                    key={loc.id}
                                                                                    onClick={() => {
                                                                                        onTransferPreparation(prep.id, loc.id);
                                                                                        setMovingPrepId(null);
                                                                                    }}
                                                                                    className="flex items-center gap-2 p-2.5 bg-bg-tertiary border border-border rounded-xl hover:border-accent hover:bg-accent/5 transition-all text-left group/loc"
                                                                                >
                                                                                    <LocIcon className="w-3.5 h-3.5 text-text-muted group-hover/loc:text-accent transition-colors" />
                                                                                    <span className="text-[10px] font-bold text-text-primary truncate">{loc.name}</span>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setMovingPrepId(prep.id)}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-text-primary text-bg-primary rounded-xl hover:bg-accent hover:text-text-primary transition-all text-[10px] font-black uppercase tracking-widest shadow-lg"
                                                                >
                                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                                    Déplacer
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </>
    );
}
