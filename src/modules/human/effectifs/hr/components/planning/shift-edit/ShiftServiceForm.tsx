"use client";

import { Clock, MapPin, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { PremiumSelect } from "@ui/PremiumSelect";
import type { ShiftType } from "./shiftTypes";
import { ZONES, type LegalWarning } from "./legalSchedulingHelpers";

interface ShiftFormData {
    startTime: string;
    endTime: string;
    type: ShiftType;
    zoneId: string;
}

interface ShiftServiceFormProps {
    formData: ShiftFormData;
    setFormData: React.Dispatch<React.SetStateAction<ShiftFormData>>;
    legalWarnings: LegalWarning[];
    handleTypeChange: (type: ShiftType) => void;
}

export function ShiftServiceForm({
    formData,
    setFormData,
    legalWarnings,
    handleTypeChange,
}: ShiftServiceFormProps) {
    return (
        <div className="p-10 space-y-10 bg-surface-sidebar">
            {/* Legal Scheduling Warnings */}
            {legalWarnings.length > 0 && (
                <div className="space-y-2">
                    {legalWarnings.map((w, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-action-primary/10 border border-action-primary/30 text-action-primary"
                        >
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-widest">
                                {w.label}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Service Type Selector */}
            <div>
                <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-4 block italic">
                    Assignation du Service
                </label>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { id: "lunch", label: "Midi", emoji: "☀️" },
                        { id: "evening", label: "Soir", emoji: "🌙" },
                        { id: "double", label: "Coupure", emoji: "🔄" },
                    ].map((type) => (
                        <button
                            key={type.id}
                            onClick={() => handleTypeChange(type.id as ShiftType)}
                            className={cn(
                                "p-6 rounded-[2rem] border transition-all group flex flex-col items-center",
                                formData.type === type.id
                                    ? "border-accent bg-accent text-bg-primary shadow-2xl"
                                    : "border-white/5 bg-[--color-surface-primary]/5 text-text-primary hover:border-accent/30"
                            )}
                        >
                            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                                {type.emoji}
                            </span>
                            <p className="text-[10px] font-black uppercase tracking-widest">
                                {type.label}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div>
                    <label className="text-[10px] font-black text-text-primary/40 uppercase tracking-[0.3em] mb-4 block italic">
                        Déclenchement
                    </label>
                    <div className="relative group">
                        <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-primary/20 group-hover:text-accent transition-colors" />
                        <input
                            type="time"
                            value={formData.startTime}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    startTime: e.target.value,
                                }))
                            }
                            className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] bg-[--color-surface-primary]/5 border border-subtle text-sm font-black text-text-primary focus:outline-none focus:border-accent/40 transition-all shadow-sm"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-black text-text-primary/40 uppercase tracking-[0.3em] mb-4 block italic">
                        Clôture
                    </label>
                    <div className="relative group">
                        <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-primary/20 group-hover:text-accent transition-colors" />
                        <input
                            type="time"
                            value={formData.endTime}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    endTime: e.target.value,
                                }))
                            }
                            className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] bg-[--color-surface-primary]/5 border border-subtle text-sm font-black text-text-primary focus:outline-none focus:border-accent/40 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-surface-sidebar p-6 rounded-[2rem] border border-white/5">
                <PremiumSelect
                    label="Juridiction de Service"
                    value={formData.zoneId || ''}
                    onChange={(val) => setFormData(prev => ({ ...prev, zoneId: val }))}
                    options={ZONES.map(zone => ({ value: zone.id, label: zone.name.toUpperCase() }))}
                    icon={<MapPin className="w-4 h-4" />}
                    className="dark"
                />
            </div>
        </div>
    );
}
