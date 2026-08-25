"use client";

import React from "react";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useLanguage } from "@/shared/hooks";
import { PageSettingConfig } from "@nexus/contracts/permissions.types";
import { PremiumSelect } from "@/shared/components/ui";
import { PremiumNumberInput } from "@/shared/components/settings/ui/PremiumNumberInput";
import { SovereignData, SovereignField } from "@shared/nexus-contract";
import { SharedKernel } from "@/lib/shared-kernel";

interface LogicTabProps {
    filteredSettings: PageSettingConfig[];
    localValues: SovereignData;
    updateValue: (key: string, value: unknown) => void;
}


export function LogicTab({ filteredSettings, localValues, updateValue }: LogicTabProps) {
    const { t } = useLanguage();

    if (filteredSettings.length === 0) {
        return (
            <div className="text-center py-20 text-text-muted space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-bg-tertiary mx-auto flex items-center justify-center opacity-50">
                    <Settings className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-serif italic">Aucun paramètre spécifique</p>
                    <p className="text-nano uppercase tracking-widest opacity-50">Pour la section Configuration</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {filteredSettings.map((setting) => (
                <motion.div
                    key={setting.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 p-5 rounded-[24px] bg-bg-secondary/30 border border-border/50 hover:border-accent/30 transition-all group"
                >
                    <div className="flex flex-col gap-1">
                        <label className="text-nano font-black uppercase tracking-[0.2em] text-accent-gold/70 group-hover:text-accent-gold transition-colors">
                            {setting.label}
                        </label>
                        {setting.description && (
                            <p className="text-nano text-text-muted italic leading-relaxed">
                                {setting.description}
                            </p>
                        )}
                    </div>

                    {setting.type === "toggle" && (
                        <button
                            onClick={() => updateValue(setting.key, !SharedKernel.Sovereign.unwrap(localValues[setting.key] as SovereignField))}
                            className={cn(
                                "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-500",
                                localValues[setting.key] && SharedKernel.Sovereign.unwrap(localValues[setting.key] as SovereignField)
                                    ? "bg-accent/5 border-accent text-accent shadow-[0_0_20px_rgba(197,160,89,0.1)]"
                                    : "bg-bg-tertiary/20 border-border/50 text-text-muted hover:border-accent/30"
                            )}
                        >
                            <span className="text-sm font-serif font-medium">
                                {SharedKernel.Sovereign.unwrap(localValues[setting.key] as SovereignField) ? t('common.enabled') || "Activé" : t('common.disabled') || "Désactivé"}
                            </span>
                            <div className={cn(
                                "w-12 h-6 rounded-full transition-all duration-500 relative",
                                localValues[setting.key] ? "bg-accent" : "bg-bg-secondary border border-border"
                            )}>
                                <motion.div
                                    animate={{ x: SharedKernel.Sovereign.unwrap(localValues[setting.key] as SovereignField) ? 24 : 4 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className="absolute top-1 w-4 h-4 rounded-full bg-surface-card shadow-lg"
                                />
                            </div>
                        </button>
                    )}

                    {setting.type === "select" && (
                        <PremiumSelect
                            value={SharedKernel.castString(localValues[setting.key] as SovereignField)}
                            onChange={(val) => updateValue(setting.key, val)}
                            options={setting.options || []}
                        />
                    )}

                    {setting.type === "number" && (
                        <PremiumNumberInput
                            value={SharedKernel.castNumber(localValues[setting.key] as SovereignField) || setting.min || 0}
                            onChange={(val) => updateValue(setting.key, val)}
                            min={setting.min}
                            max={setting.max}
                        />
                    )}

                    {setting.type === "text" && (
                        <input
                            type="text"
                            value={SharedKernel.castString(localValues[setting.key] as SovereignField)}
                            onChange={(e) => updateValue(setting.key, e.target.value)}
                            className="w-full p-4 rounded-2xl bg-bg-tertiary/20 border-2 border-border/50 text-text-primary font-serif focus:border-accent focus:outline-none focus:shadow-[0_0_20px_rgba(197,160,89,0.15)] transition-all duration-300"
                        />
                    )}
                </motion.div>
            ))}
        </div>
    );
}
