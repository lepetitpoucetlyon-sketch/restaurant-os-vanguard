"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";
import { DaySchedule, DayOfWeek, ServiceSettings, ClosedPeriod } from "@nexus/contracts";
import { Loader2, Save } from "lucide-react";

// Modular Sub-components
import { ScheduleMatrix } from "./hours/ScheduleMatrix";
import { OperationalDynamics } from "./hours/OperationalDynamics";
import { ExceptionProtocols } from "./hours/ExceptionProtocols";

const cinematicContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

const cinematicItem: Variants = {
    hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
};

export default function HoursSettings() {
    const { 
        settings, 
        updateSchedule, 
        updateService, 
        addClosedPeriod, 
        deleteClosedPeriod, 
        isSaving 
    } = useSettings();

    const initialSchedule = settings?.schedule ?? [];
    const initialService = settings?.service ?? ({} as ServiceSettings);
    
    const [scheduleDraft, setScheduleDraft] = useState<DaySchedule[] | null>(null);
    const [serviceDraft, setServiceDraft] = useState<ServiceSettings | null>(null);

    const schedule = scheduleDraft ?? initialSchedule;
    const service = serviceDraft ?? initialService;

    if (!settings) return null;

    const handleDayChange = (dayId: DayOfWeek, updates: Partial<DaySchedule>) => {
        setScheduleDraft(prev => (prev ?? initialSchedule).map(d => d.day === dayId ? { ...d, ...updates } : d));
    };

    const handleServiceChange = (updates: Partial<ServiceSettings>) => {
        setServiceDraft(prev => ({ ...(prev ?? initialService), ...updates }));
    };

    const handleSave = async () => {
        if (scheduleDraft) await updateSchedule(schedule);
        if (serviceDraft) await updateService(service);
        setScheduleDraft(null);
        setServiceDraft(null);
    };

    const handleAddClosedPeriod = async (period: Omit<ClosedPeriod, 'id'>) => {
        await addClosedPeriod({ 
            ...period, 
            id: `CP-${Date.now()}`,
            isAnnual: (period as { isAnnual?: boolean }).isAnnual ?? false 
        } as ClosedPeriod);
    };

    return (
        <motion.div
            variants={cinematicContainer}
            initial="hidden"
            animate="visible"
            className="space-y-12 pb-20"
        >
            {/* Weekly Schedule Matrix */}
            <ScheduleMatrix 
                schedule={schedule} 
                onDayChange={handleDayChange} 
            />

            {/* Operational Velocities */}
            <OperationalDynamics 
                service={service} 
                onChange={handleServiceChange} 
            />

            {/* Temporal Exceptions */}
            <ExceptionProtocols 
                closedPeriods={settings.closedPeriods} 
                onAdd={handleAddClosedPeriod}
                onDelete={deleteClosedPeriod}
            />

            {/* Global Dispatch */}
            <motion.div
                variants={cinematicItem}
                className="flex justify-end pt-4"
            >
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={isSaving || (!scheduleDraft && !serviceDraft)}
                    className="flex items-center gap-3 px-10 py-5 bg-text-primary text-bg-primary rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all disabled:opacity-50 group border border-border"
                >
                    {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <div className="relative">
                            <Save className="w-5 h-5 transition-transform group-hover:scale-110" />
                            <div className="absolute inset-0 bg-surface-card/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                    Synchroniser les Protocoles
                </motion.button>
            </motion.div>
        </motion.div>
    );
}
