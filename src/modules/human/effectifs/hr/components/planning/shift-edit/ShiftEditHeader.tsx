"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { X } from "lucide-react";
import type { User } from "@nexus/contracts";

interface ShiftEditHeaderProps {
    user: User;
    date: Date;
    isNew: boolean;
    onClose: () => void;
}

export function ShiftEditHeader({ user, date, isNew, onClose }: ShiftEditHeaderProps) {
    return (
        <div className="bg-surface-sidebar p-10 text-text-primary relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-[--color-surface-primary]/10 flex items-center justify-center relative overflow-hidden shadow-2xl">
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                className="w-full h-full object-cover"
                                alt={user.name}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-serif text-3xl italic text-text-primary/50">
                                {(user.name || '').charAt(0)}
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif italic tracking-tight">
                            {isNew ? "Nouveau Protocole" : "Rectification Shift"}
                        </h2>
                        <p className="text-[10px] font-black text-text-primary/30 uppercase tracking-[0.3em] mt-2">
                            {user.name} • {format(date, "EEEE d MMMM", { locale: fr })}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-12 h-12 rounded-full bg-[--color-surface-primary]/5 hover:bg-[--color-surface-primary]/10 flex items-center justify-center transition-all"
                >
                    <X className="w-5 h-5 text-text-primary/50" />
                </button>
            </div>
        </div>
    );
}
