'use client';

import { PremiumSelect } from "@ui/PremiumSelect";
import { IngredientUnit } from "@nexus/contracts";
import { UNIT_OPTIONS } from "./prepConstants";

interface PrepMeasurementGridProps {
    quantity: string;
    setQuantity: (q: string) => void;
    unit: IngredientUnit;
    setUnit: (u: IngredientUnit) => void;
    portions: string;
    setPortions: (p: string) => void;
}

export function PrepMeasurementGrid({
    quantity,
    setQuantity,
    unit,
    setUnit,
    portions,
    setPortions,
}: PrepMeasurementGridProps) {
    return (
        <div className="grid grid-cols-3 gap-8">
            <div className="space-y-4">
                <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em] px-2">RENDEMENT *</label>
                <input
                    type="number"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-6 py-5 bg-surface-card border border-border/40 rounded-2xl text-[20px] font-serif italic font-black text-text-primary text-center focus:outline-none focus:border-accent-gold transition-all tracking-widest shadow-soft"
                />
            </div>
            <div className="space-y-4">
                <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em] px-2 text-center block">UNITÉ PROTOCOLE</label>
                <PremiumSelect
                    value={unit}
                    onChange={(val) => setUnit(val as IngredientUnit)}
                    options={UNIT_OPTIONS.map(u => ({
                        value: String(u),
                        label: u?.toUpperCase() || ''
                    }))}
                />
            </div>
            <div className="space-y-4">
                <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em] px-2 text-right block">PORTIONS</label>
                <input
                    type="number"
                    value={portions}
                    onChange={(e) => setPortions(e.target.value)}
                    placeholder="OPT"
                    className="w-full px-6 py-5 bg-surface-card border border-border/40 rounded-2xl text-[20px] font-serif italic font-black text-text-primary text-center focus:outline-none focus:border-accent-gold transition-all tracking-widest shadow-soft"
                />
            </div>
        </div>
    );
}
