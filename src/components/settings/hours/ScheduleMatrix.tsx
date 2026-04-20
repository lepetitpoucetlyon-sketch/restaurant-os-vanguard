"use client";

import { motion, Variants } from "framer-motion";
import { Clock } from "lucide-react";
import { DaySchedule, DayOfWeek } from "@/types/settings";
import { DAYS_CONFIG } from "@/constants/scheduling";
import { DayRow } from "./DayRow";

interface ScheduleMatrixProps {
    schedule: DaySchedule[];
    onDayChange: (dayId: DayOfWeek, updates: Partial<DaySchedule>) => void;
}

const cinematicItem: Variants = {
    hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
};

export function ScheduleMatrix({ schedule, onDayChange }: ScheduleMatrixProps) {
    return (
        <motion.div
            variants={cinematicItem}
            className="space-y-6"
        >
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        className="w-14 h-14 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center border border-black/5 dark:border-white/10 text-accent shadow-premium"
                    >
                        <Clock className="w-7 h-7" />
                    </motion.div>
                    <div>
                        <h3 className="text-3xl font-serif text-text-primary uppercase tracking-tighter italic">
                            Matrice des Opérations Hebdomadaires
                        </h3>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] ml-1">Configuration de l'Infrastructure Temporelle</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {DAYS_CONFIG.map((config, index) => {
                    const day = schedule.find(d => d.day === config.id) || {
                        day: config.id,
                        isOpen: false,
                    };
                    return (
                        <DayRow
                            key={config.id}
                            index={index}
                            day={day}
                            config={config}
                            onChange={(updates) => onDayChange(config.id, updates)}
                        />
                    );
                })}
            </div>
        </motion.div>
    );
}
