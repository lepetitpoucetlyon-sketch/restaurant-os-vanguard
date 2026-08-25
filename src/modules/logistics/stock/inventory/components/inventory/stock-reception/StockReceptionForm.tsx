'use client';

import { PremiumSelect } from "@ui/PremiumSelect";
import { MapPin, Calendar, AlertTriangle, Truck } from "lucide-react";
import { VisionScanner } from "@/shared/components/VisionScanner";
import type { ExtractedInvoice } from "../../../../../domain/schemas/inventory";
import type { IngredientCategory, IngredientUnit, StorageLocation } from "@nexus/contracts";
import { CATEGORY_LABELS, UNIT_OPTIONS, type SupplierRecord } from "./receptionConstants";

interface StockReceptionFormProps {
    ingredients: Array<{ id: string; name: string; category?: string; [k: string]: unknown }>;
    storageLocations: StorageLocation[];
    suppliers: SupplierRecord[];
    selectedIngredient: string;
    quantity: string;
    setQuantity: (v: string) => void;
    unit: IngredientUnit;
    setUnit: (v: IngredientUnit) => void;
    storageLocation: string;
    setStorageLocation: (v: string) => void;
    selectedSupplierId: string;
    setSelectedSupplierId: (v: string) => void;
    receptionDate: string;
    setReceptionDate: (v: string) => void;
    dlc: string;
    setDlc: (v: string) => void;
    handleIngredientChange: (id: string) => void;
    handleInvoiceScanned: (invoice: ExtractedInvoice) => void;
}

export function StockReceptionForm({
    ingredients,
    storageLocations,
    suppliers,
    selectedIngredient,
    quantity,
    setQuantity,
    unit,
    setUnit,
    storageLocation,
    setStorageLocation,
    selectedSupplierId,
    setSelectedSupplierId,
    receptionDate,
    setReceptionDate,
    dlc,
    setDlc,
    handleIngredientChange,
    handleInvoiceScanned,
}: StockReceptionFormProps) {
    return (
        <div className="space-y-6 sm:space-y-10">
            {/* Vision Scanner — scan invoice to auto-fill (log-4) */}
            <div className="space-y-4">
                <label className="flex items-center gap-3 text-nano font-black text-text-primary uppercase tracking-[0.4em] px-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-gold shadow-glow" />
                    SCAN AUTOMATIQUE (OPTIONNEL)
                </label>
                <VisionScanner
                    onAnalysisComplete={handleInvoiceScanned}
                    label="Scanner le bon de livraison"
                />
            </div>

            {/* Ingredient Selection */}
            <div className="space-y-4">
                <label className="flex items-center gap-3 text-nano font-black text-text-primary uppercase tracking-[0.4em] px-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-gold shadow-glow" />
                    IDENTITÉ DE LA RESSOURCE *
                </label>
                <PremiumSelect
                    value={selectedIngredient}
                    onChange={handleIngredientChange}
                    options={ingredients.map(ing => ({
                        value: String(ing.id),
                        label: String(ing.name || '').toUpperCase(),
                        description: String(CATEGORY_LABELS[ing.category as IngredientCategory] || ing.category || 'Autre').toUpperCase()
                    }))}
                />
            </div>

            {/* Quantity & Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                <div className="space-y-4">
                    <label className="flex items-center gap-3 text-nano font-black text-text-primary uppercase tracking-[0.4em] px-2">
                        MASSE / VOLUME *
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 sm:px-8 py-3.5 sm:py-5 bg-surface-card border border-border/40 rounded-2xl text-[18px] sm:text-[20px] font-serif italic font-black text-text-primary text-center focus:outline-none focus:border-accent-gold transition-all tracking-widest shadow-soft"
                    />
                </div>
                <div className="space-y-4">
                    <label className="flex items-center gap-3 text-nano font-black text-text-primary uppercase tracking-[0.4em] px-2">
                        MESURE PROTOCOLE
                    </label>
                    <PremiumSelect
                        value={unit}
                        onChange={(val) => setUnit(val as IngredientUnit)}
                        options={UNIT_OPTIONS.map(u => ({
                            value: u,
                            label: u?.toUpperCase() || ''
                        }))}
                    />
                </div>
            </div>

            {/* Supplier dropdown (log-1: dynamic from Nexus) */}
            <div className="space-y-4">
                <label className="flex items-center gap-3 text-nano font-black text-text-primary uppercase tracking-[0.4em] px-2">
                    <Truck className="w-3.5 h-3.5 text-accent-gold" />
                    FOURNISSEUR
                </label>
                <PremiumSelect
                    value={selectedSupplierId}
                    onChange={setSelectedSupplierId}
                    options={[
                        { value: '', label: suppliers.length === 0 ? '— Aucun fournisseur enregistré —' : '— Sélectionner un fournisseur —' },
                        ...suppliers.map(s => ({
                            value: s.id,
                            label: String(s.name || s.id).toUpperCase(),
                        })),
                    ]}
                />
            </div>

            {/* Storage Location */}
            <div className="space-y-4">
                <label className="flex items-center gap-3 text-nano font-black text-text-primary uppercase tracking-[0.4em] px-2">
                    <MapPin className="w-3.5 h-3.5 text-accent-gold" />
                    DESTINATION D&apos;ARCHIVAGE *
                </label>
                <PremiumSelect
                    value={storageLocation}
                    onChange={setStorageLocation}
                    options={storageLocations.filter(l => l.isActive).map(loc => ({
                        value: String(loc.id),
                        label: String(loc.name || '').toUpperCase(),
                        description: loc.temperature !== undefined ? `${loc.temperature}°C` : undefined
                    }))}
                />
            </div>

            {/* Dates Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 pt-2 sm:pt-4">
                <div className="space-y-4">
                    <label className="flex items-center gap-3 text-nano font-black text-text-muted uppercase tracking-[0.4em] px-2 outline-none">
                        <Calendar className="w-4 h-4 text-accent-gold" />
                        RÉCEPTION PROTOCOLÉE
                    </label>
                    <input
                        type="date"
                        value={receptionDate}
                        onChange={(e) => setReceptionDate(e.target.value)}
                        className="w-full px-4 sm:px-8 py-3.5 sm:py-5 bg-surface-card/60 border border-border/40 rounded-2xl text-[14px] font-black text-text-primary focus:outline-none focus:border-accent-gold transition-all shadow-soft"
                    />
                </div>
                <div className="space-y-4">
                    <label className="flex items-center gap-3 text-nano font-black text-error uppercase tracking-[0.4em] px-2 outline-none">
                        <AlertTriangle className="w-4 h-4" />
                        EXPIRATION (DLC) *
                    </label>
                    <input
                        type="date"
                        value={dlc}
                        onChange={(e) => setDlc(e.target.value)}
                        className="w-full px-4 sm:px-8 py-3.5 sm:py-5 bg-error/5 border border-error/20 rounded-2xl text-[14px] font-black text-error focus:outline-none focus:border-error transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)] focus:ring-4 focus:ring-error/5"
                    />
                </div>
            </div>
        </div>
    );
}
