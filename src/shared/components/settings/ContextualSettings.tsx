"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Settings,
    X,
    RotateCcw,
    Check,
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useLanguage } from "@/shared/hooks";
import { PAGE_SETTINGS } from "./config-registry";
import { LogicTab } from "./panels/LogicTab";
import { StyleTab } from "./panels/StyleTab";
import type { PageSettingConfig, PageKey } from "@nexus/contracts/permissions.types";
import { logger } from "@/lib/axiom";
import { SovereignData, SovereignValue } from "@shared/nexus-contract";
import { SovereignStorage } from "@/shared/services/SovereignStorage";
import { PageSettingsSchema } from "@/shared/schemas/ui";


// ============ CONTEXT & PROVIDER ============

interface ContextualSettingsContextType {
    isOpen: boolean;
    openSettings: (page: PageKey) => void;
    closeSettings: () => void;
    currentPage: PageKey | null;
    getPageSettings: (page: PageKey) => { title: string; settings: PageSettingConfig[] } | undefined;
    canAccessSetting: (setting: PageSettingConfig) => boolean;
    allSettings: Record<string, SovereignData>;
    updatePageSettings: (page: PageKey, settings: SovereignData) => void;

}

const ContextualSettingsContext = createContext<ContextualSettingsContextType | undefined>(undefined);

export function ContextualSettingsProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState<PageKey | null>(null);
    const [allSettings, setAllSettings] = useState<Record<string, SovereignData>>(() => {

        if (typeof window === 'undefined') return {};
        return SovereignStorage.get("restaurant_os_page_settings", PageSettingsSchema, {}).data as Record<string, SovereignData>;
    });

    const openSettings = (page: PageKey) => {
        setCurrentPage(page);
        setIsOpen(true);
    };

    const closeSettings = () => {
        setIsOpen(false);
    };

    const updatePageSettings = (page: PageKey, newSettings: SovereignData) => {

        const updated = { ...allSettings, [page]: newSettings };
        setAllSettings(updated);
        SovereignStorage.set("restaurant_os_page_settings", updated, PageSettingsSchema);
        
        // 🏛️ Empire Audit Logging
        logger.info(`Configuration updated for domain: ${page}`, {
            domain: page,
            type: 'CONFIG_CHANGE',
            newSettings: newSettings
        });
    };

    const getPageSettings = (page: PageKey) => {
        return PAGE_SETTINGS[page];
    };

    const canAccessSetting = (_setting: PageSettingConfig) => {
        // Simplified for now - in a real app, check user permissions
        return true;
    };

    return (
        <ContextualSettingsContext.Provider value={{
            isOpen,
            openSettings,
            closeSettings,
            currentPage,
            getPageSettings,
            canAccessSetting,
            allSettings,
            updatePageSettings
        }}>
            {children}
            <ContextualSettingsPanel />
        </ContextualSettingsContext.Provider>
    );
}

export function useContextualSettings() {
    const context = useContext(ContextualSettingsContext);
    if (!context) {
        throw new Error("useContextualSettings must be used within a ContextualSettingsProvider");
    }
    return context;
}

export function usePageSetting<T = SovereignValue>(page: PageKey, key: string, defaultValue: T): T {

    const context = useContext(ContextualSettingsContext);
    if (!context) return defaultValue;
    return (context.allSettings[page]?.[key] ?? defaultValue) as T;
}

// ============ REFACTORED PANEL CONTENT ============

interface ContextualSettingsPanelContentProps {
    currentPage: PageKey;
    pageSettings: { title: string; settings: PageSettingConfig[] } | null;
    closeSettings: () => void;
    canAccessSetting: (setting: PageSettingConfig) => boolean;
    allSettings: Record<string, SovereignData>;
    updatePageSettings: (page: PageKey, settings: SovereignData) => void;
}


function ContextualSettingsPanelContent({
    currentPage,
    pageSettings,
    closeSettings,
    canAccessSetting,
    allSettings,
    updatePageSettings,
}: ContextualSettingsPanelContentProps) {
    const { t } = useLanguage();
    const [draftValues, setDraftValues] = useState<SovereignData | null>(null);

    const [activeTab, setActiveTab] = useState<'logic' | 'style'>('logic');
    const localValues = draftValues ?? (allSettings[currentPage] || {});

    const handleSave = () => {
        updatePageSettings(currentPage, localValues);
        setDraftValues(null);
        setActiveTab('logic');
        closeSettings();
    };

    const handleReset = () => {
        updatePageSettings(currentPage, {});
        setDraftValues({});
    };

    const updateValue = (key: string, value: SovereignValue) => {

        setDraftValues(prev => ({ ...(prev ?? localValues), [key]: value }));
    };

    const accessibleSettings = (pageSettings?.settings || []).filter(canAccessSetting);
    const filteredSettings = accessibleSettings.filter(s => s.group === activeTab);

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeSettings}
                className="fixed inset-0 bg-surface-sidebar/30 backdrop-blur-sm z-[100]"
            />

            {/* Panel */}
            <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-bg-primary dark:bg-bg-secondary border-border shadow-2xl z-[101] flex flex-col"
            >
                {/* Header */}
                <div className="flex flex-col border-b border-border bg-bg-secondary/50">
                    <div className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                <Settings className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                                <h2 className="text-lg font-serif font-semibold text-text-primary">
                                    {pageSettings?.title || "Paramètres"}
                                </h2>
                                <p className="text-[10px] text-accent-gold uppercase tracking-[0.2em] font-black">
                                    Moteur d'Expérience
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={closeSettings}
                            className="w-10 h-10 rounded-xl bg-bg-tertiary hover:bg-status-danger/10 hover:text-status-danger flex items-center justify-center transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex px-6 pb-2 gap-2">
                        <button
                            onClick={() => setActiveTab('logic')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-t-xl transition-all relative overflow-hidden group",
                                activeTab === 'logic'
                                    ? "bg-bg-primary border-t-2 border-x-2 border-border text-accent"
                                    : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">{t('settings.tab_logic')}</span>
                            {activeTab === 'logic' && (
                                <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('style')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-t-xl transition-all relative overflow-hidden group",
                                activeTab === 'style'
                                    ? "bg-bg-primary border-t-2 border-x-2 border-border text-accent-gold"
                                    : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest text-accent-gold">{t('settings.tab_style')}</span>
                            {activeTab === 'style' && (
                                <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-gold" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-accent/20 scrollbar-track-transparent">
                    {activeTab === 'logic' ? (
                        <LogicTab
                            filteredSettings={filteredSettings}
                            localValues={localValues}
                            updateValue={updateValue}
                        />
                    ) : (
                        <StyleTab
                            filteredSettings={filteredSettings}
                            localValues={localValues}
                            updateValue={updateValue}
                        />
                    )}
                </div>

                {/* Footer */}
                {accessibleSettings.length > 0 && (
                    <div className="p-6 border-t border-border bg-bg-secondary/50 flex gap-3">
                        <button
                            onClick={handleReset}
                            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border border-border text-text-muted hover:bg-bg-tertiary transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
                        >
                            <RotateCcw className="w-4 h-4" />
                            {t('settings.reset')}
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-2 flex items-center justify-center gap-2 py-4 px-8 rounded-2xl bg-accent text-primary font-black uppercase tracking-[0.2em] text-[10px] hover:bg-accent/90 transition-all shadow-lg hover:shadow-accent/20"
                        >
                            <Check className="w-4 h-4" />
                            {t('settings.apply')}
                        </button>
                    </div>
                )}
            </motion.div>
        </>
    );
}

function ContextualSettingsPanel() {
    const { isOpen, closeSettings, currentPage, getPageSettings, canAccessSetting, allSettings, updatePageSettings } = useContextualSettings();
    const pageSettings = currentPage ? getPageSettings(currentPage) : null;

    return (
        <AnimatePresence>
            {isOpen && currentPage && pageSettings && (
                <ContextualSettingsPanelContent
                    key={currentPage}
                    currentPage={currentPage}
                    pageSettings={pageSettings}
                    closeSettings={closeSettings}
                    canAccessSetting={canAccessSetting}
                    allSettings={allSettings}
                    updatePageSettings={updatePageSettings}
                />
            )}
        </AnimatePresence>
    );
}

// ============ GEAR BUTTON COMPONENT ============

interface SettingsGearButtonProps {
    pageKey: PageKey;
    className?: string;
}

export function SettingsGearButton({ pageKey, className }: SettingsGearButtonProps) {
    const { openSettings, getPageSettings, canAccessSetting } = useContextualSettings();
    const { t } = useLanguage();
    const pageSettings = getPageSettings(pageKey);

    const hasAccessToAny = (pageSettings?.settings || []).some(canAccessSetting);

    return (
        <motion.button
            whileHover={hasAccessToAny ? { scale: 1.05, rotate: 90 } : { scale: 1.02 }}
            whileTap={hasAccessToAny ? { scale: 0.95 } : { scale: 0.98 }}
            onClick={() => hasAccessToAny && openSettings(pageKey)}
            className={cn(
                "w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all group shadow-sm",
                hasAccessToAny
                    ? "bg-bg-secondary hover:bg-accent/10 border-border hover:border-accent text-text-muted hover:text-accent cursor-pointer"
                    : "bg-bg-tertiary/50 border-border/50 text-text-muted/40 cursor-not-allowed",
                className
            )}
            title={hasAccessToAny ? t('settings.title') : "Accès non autorisé"}
        >
            <Settings className={cn(
                "w-5 h-5 transition-transform",
                hasAccessToAny && "group-hover:rotate-90"
            )} strokeWidth={1.5} />
        </motion.button>
    );
}
