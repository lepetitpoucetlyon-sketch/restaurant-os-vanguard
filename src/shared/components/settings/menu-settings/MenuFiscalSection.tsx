"use client";

import { motion } from "framer-motion";
import { Euro } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import type { MenuAestheticSettings } from "./MenuAestheticSection";

interface MenuFiscalSectionProps {
    menuSettings: MenuAestheticSettings;
    setMenuSettings: React.Dispatch<React.SetStateAction<MenuAestheticSettings>>;
}

export function MenuFiscalSection({ menuSettings, setMenuSettings }: MenuFiscalSectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-bg-secondary border border-border rounded-[2.5rem] shadow-premium p-6 md:p-10"
        >
            <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                    <Euro className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-2xl font-serif text-text-primary uppercase tracking-tight italic">
                        Fiscal Logic
                    </h3>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Pricing Matrix & VAT Calibration</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1">Valuation Mode</label>
                    <div className="flex gap-4 bg-bg-tertiary p-2 rounded-[1.5rem] border border-border">
                        <button
                            onClick={() => setMenuSettings(s => ({ ...s, pricingMode: 'ttc' }))}
                            className={cn(
                                "flex-1 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all",
                                menuSettings.pricingMode === 'ttc'
                                    ? "bg-bg-primary shadow-sm text-text-primary border border-border"
                                    : "text-text-muted hover:text-text-primary"
                            )}
                            data-tutorial="settings-3-0"
                        >
                            Gross (TTC)
                        </button>
                        <button
                            onClick={() => setMenuSettings(s => ({ ...s, pricingMode: 'ht' }))}
                            className={cn(
                                "flex-1 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all",
                                menuSettings.pricingMode === 'ht'
                                    ? "bg-bg-primary shadow-sm text-text-primary border border-border"
                                    : "text-text-muted hover:text-text-primary"
                            )}
                            data-tutorial="settings-3-1"
                        >
                            Net (HT)
                        </button>
                    </div>
                </div>
                <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1">Default VAT Unit</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={menuSettings.defaultVAT}
                            onChange={(e) => setMenuSettings(s => ({ ...s, defaultVAT: Number(e.target.value) }))}
                            className="w-full px-8 py-5 bg-bg-primary border border-border rounded-[2rem] text-3xl font-serif text-text-primary focus:border-accent transition-all outline-none"
                        />
                        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xl font-serif text-text-muted italic">%</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
