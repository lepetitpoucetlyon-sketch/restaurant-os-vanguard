"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Activity } from "lucide-react";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { useNotifications } from '@/shared/contexts/NotificationsContext';
import type { PositionSettings, StaffConfig } from "@nexus/contracts";
import { TipsDistributionSettingsSection } from "./TipsDistributionSettingsSection";
import { StaffLaborLegislationSection } from "./staff-settings/StaffLaborLegislationSection";
import { StaffCompensationSection } from "./staff-settings/StaffCompensationSection";
import { StaffPositionsSection } from "./staff-settings/StaffPositionsSection";

export default function StaffSettings() {
    const { settings, updateConfig, updateList } = useSettings();
    const [positions, setPositions] = useState<PositionSettings[]>(settings?.positions || []);
    const [isSaving, setIsSaving] = useState(false);
    const { addNotification } = useNotifications();
    const [localConfig, setLocalConfig] = useState<StaffConfig>(settings?.staffConfig || {
        maxHoursPerWeek: 35,
        maxOvertimePerWeek: 8,
        minRestBetweenShiftsHours: 11,
        nightShiftStart: '22:00',
        nightShiftBonusPercent: 10,
        sundayBonusPercent: 25,
        holidayBonusPercent: 100,
        paidBreaks: true,
        autoScheduling: true,
        contractTypes: ['CDI', 'CDD', 'Extra', 'Interim', 'Training']
    });

    if (!settings) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateConfig('staffConfig', localConfig);
            await updateList('positions', positions);
        } catch (error) {
            console.error(error);
            addNotification({ type: 'critical', title: 'Erreur', message: 'Impossible d\'enregistrer la configuration du personnel.' });
        } finally {
            setIsSaving(false);
        }
    };

    const updatePosition = (id: string, updates: Partial<PositionSettings>) => {
        setPositions(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Labor Logic & Legislation */}
            <StaffLaborLegislationSection
                localConfig={localConfig}
                setLocalConfig={setLocalConfig}
            />

            {/* Compensation Multipliers (Bonuses) */}
            <StaffCompensationSection
                localConfig={localConfig}
                setLocalConfig={setLocalConfig}
            />

            {/* Neural Position Grid */}
            <StaffPositionsSection
                positions={positions}
                updatePosition={updatePosition}
            />

            {/* Répartition Automatique des Pourboires CB (Gérable Admin & Manager) */}
            <TipsDistributionSettingsSection />

            {/* Global Dispatch */}
            <div className="flex justify-end pt-4">
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-4 px-12 py-6 bg-text-primary text-bg-primary rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all disabled:opacity-50 group border border-border"
                >
                    {isSaving ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <div className="relative">
                            <Activity className="w-6 h-6 transition-transform group-hover:scale-110" />
                            <div className="absolute inset-0 bg-surface-card/40 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                    Sauvegarder Configuration
                </motion.button>
            </div>
        </div>
    );
}
