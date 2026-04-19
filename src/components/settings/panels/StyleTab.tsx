"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Zap, Paintbrush } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { PageSettingConfig } from "@/types/permissions.types";
import { PremiumSelect } from "@/components/settings/ui/PremiumSelect";
import { PremiumNumberInput } from "@/components/settings/ui/PremiumNumberInput";

interface StyleTabProps {
    filteredSettings: PageSettingConfig[];
    localValues: Record<string, any>;
    updateValue: (key: string, value: any) => void;
}

export function StyleTab({ filteredSettings, localValues, updateValue }: StyleTabProps) {
    const theme = useTheme();
    const { t } = useLanguage();

    return (
        <div className="space-y-8">
            <div className="space-y-8 pb-6 border-b border-border/50">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-accent-gold rounded-full" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-text-primary">{t('settings.aura_title')}</h3>
                </div>

                {/* Theme Mode Selection */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-gold/70">{t('settings.mode_label')}</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'light', label: t('settings.modes.light.label'), desc: t('settings.modes.light.desc') },
                            { id: 'dark', label: t('settings.modes.dark.label'), desc: t('settings.modes.dark.desc') },
                            { id: 'auto', label: t('settings.modes.auto.label'), desc: t('settings.modes.auto.desc') },
                        ].map((m) => (
                            <button
                                key={m.id}
                                onClick={() => theme.setMode(m.id as any)}
                                className={cn(
                                    "flex flex-col items-center py-2 px-1 rounded-xl border-2 transition-all gap-1",
                                    theme.mode === m.id
                                        ? "bg-accent/10 border-accent text-accent"
                                        : "bg-bg-tertiary/20 border-border/50 text-text-muted hover:border-accent/30"
                                )}
                            >
                                <span className="text-[9px] font-black uppercase tracking-tighter">{m.label}</span>
                                <span className="text-[7px] font-bold uppercase opacity-50 tracking-widest">{m.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Accent Color Selection */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-gold/70">{t('settings.accent_label')}</label>
                    <div className="flex justify-between items-center p-2 rounded-2xl bg-bg-tertiary/20 border border-border/50">
                        {(['gold', 'emerald', 'sapphire', 'ruby', 'amethyst'] as const).map((color) => (
                            <button
                                key={color}
                                onClick={() => theme.setAccentColor(color)}
                                className={cn(
                                    "w-10 h-10 rounded-xl transition-all duration-300 flex items-center justify-center border-2",
                                    theme.accentColor === color ? "border-white scale-110 shadow-lg" : "border-transparent scale-90 opacity-50 hover:opacity-100"
                                )}
                                style={{
                                    backgroundColor:
                                        color === 'gold' ? '#C5A059' :
                                            color === 'emerald' ? '#10B981' :
                                                color === 'sapphire' ? '#3B82F6' :
                                                    color === 'ruby' ? '#EF4444' : '#8B5CF6'
                                }}
                            >
                                {theme.accentColor === color && <Check className="w-4 h-4 text-white" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* UI Density Selection */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-gold/70">{t('settings.density_label')}</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['compact', 'premium', 'cinematic'] as const).map((d) => (
                            <button
                                key={d}
                                onClick={() => theme.setDensity(d)}
                                className={cn(
                                    "py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all",
                                    theme.density === d
                                        ? "bg-accent/10 border-accent text-accent"
                                        : "bg-bg-tertiary/20 border-border/50 text-text-muted hover:border-accent/30"
                                )}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Border Radius Selection */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-gold/70">{t('settings.radius_label')}</label>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { id: 'none', label: t('settings.radius.none') },
                            { id: 'small', label: t('settings.radius.small') },
                            { id: 'medium', label: t('settings.radius.medium') },
                            { id: 'large', label: t('settings.radius.large') },
                        ].map((r) => (
                            <button
                                key={r.id}
                                onClick={() => theme.setBorderRadius(r.id as any)}
                                className={cn(
                                    "py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border-2 transition-all",
                                    theme.borderRadius === r.id
                                        ? "bg-accent/10 border-accent text-accent"
                                        : "bg-bg-tertiary/20 border-border/50 text-text-muted hover:border-accent/30"
                                )}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Glassmorphism Intensity */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-gold/70">{t('settings.glass_label')}</label>
                        <span className="text-[10px] font-serif italic text-accent-gold">{theme.glassmorphism}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={theme.glassmorphism}
                        onChange={(e) => theme.setGlassmorphism(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-gold"
                    />
                </div>

                {/* Animations Toggle */}
                <div className="flex items-center justify-between p-4 bg-bg-tertiary/20 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                            theme.animations ? "bg-accent/10 text-accent" : "bg-bg-tertiary text-text-muted"
                        )}>
                            <Zap className="w-4 h-4" />
                        </div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-primary">{t('settings.animations_label')}</label>
                    </div>
                    <button
                        onClick={() => theme.setAnimations(!theme.animations)}
                        className={cn(
                            "w-12 h-6 rounded-full relative transition-all duration-300",
                            theme.animations ? "bg-accent" : "bg-bg-secondary border border-border"
                        )}
                    >
                        <motion.div
                            animate={{ x: theme.animations ? 26 : 2 }}
                            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                    </button>
                </div>
            </div>

            {/* Page Specific Style Settings */}
            {filteredSettings.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-accent rounded-full" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-text-primary">{t('settings.page_options')}</h3>
                    </div>
                    {filteredSettings.map((setting) => (
                        <div
                            key={setting.key}
                            className="space-y-4 p-5 rounded-[24px] bg-bg-secondary/30 border border-border/50 hover:border-accent/30 transition-all group"
                        >
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-gold/70 group-hover:text-accent-gold transition-colors">
                                    {setting.label}
                                </label>
                                {setting.description && (
                                    <p className="text-[9px] text-text-muted italic leading-relaxed">
                                        {setting.description}
                                    </p>
                                )}
                            </div>

                            {setting.type === "toggle" && (
                                <button
                                    onClick={() => updateValue(setting.key, !localValues[setting.key])}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-500",
                                        localValues[setting.key]
                                            ? "bg-accent/5 border-accent text-accent shadow-[0_0_20px_rgba(197,160,89,0.1)]"
                                            : "bg-bg-tertiary/20 border-border/50 text-text-muted hover:border-accent/30"
                                    )}
                                >
                                    <span className="text-sm font-serif font-medium">
                                        {localValues[setting.key] ? t('common.enabled') || "Activé" : t('common.disabled') || "Désactivé"}
                                    </span>
                                    <div className={cn(
                                        "w-12 h-6 rounded-full transition-all duration-500 relative",
                                        localValues[setting.key] ? "bg-accent" : "bg-bg-secondary border border-border"
                                    )}>
                                        <motion.div
                                            animate={{ x: localValues[setting.key] ? 24 : 4 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
                                        />
                                    </div>
                                </button>
                            )}

                            {setting.type === "select" && (
                                <PremiumSelect
                                    value={localValues[setting.key] || ""}
                                    onChange={(val) => updateValue(setting.key, val)}
                                    options={setting.options || []}
                                />
                            )}

                            {setting.type === "number" && (
                                <PremiumNumberInput
                                    value={localValues[setting.key] || setting.min || 0}
                                    onChange={(val) => updateValue(setting.key, val)}
                                    min={setting.min}
                                    max={setting.max}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
