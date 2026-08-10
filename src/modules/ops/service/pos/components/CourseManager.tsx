"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Clock, CheckCircle2, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
// FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
 
import { CartItem, CourseType } from "@modules/ops/workflow/engine/types";
import { formatCurrency } from "@/lib/formatters";
import { SovereignMath } from "@/shared/services/SovereignMath";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseManagerProps {
    items: CartItem[];
    onSetCourse: (cartId: string, course: CourseType | undefined) => void;
    onSendCourse: (course: CourseType) => Promise<void>;
    isLoading?: boolean;
}

// ─── Course meta ──────────────────────────────────────────────────────────────

const COURSE_ORDER: CourseType[] = ["entree", "plat", "dessert"];

const COURSE_META: Record<CourseType, { label: string; icon: React.ElementType; color: string }> = {
    entree:  { label: "Entrées",  icon: UtensilsCrossed, color: "text-status-success bg-emerald-400/10 border-emerald-400/30" },
    plat:    { label: "Plats",    icon: ChefHat,         color: "text-accent-gold bg-accent-gold/10 border-accent-gold/30" },
    dessert: { label: "Desserts", icon: UtensilsCrossed, color: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
};

// ─── CourseChip ───────────────────────────────────────────────────────────────

function CourseChip({
    active,
    course,
    onClick,
}: {
    active: boolean;
    course: CourseType;
    onClick: () => void;
}) {
    const meta = COURSE_META[course];
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                active
                    ? meta.color
                    : "border-border text-text-muted bg-bg-tertiary hover:border-border/80"
            )}
        >
            {meta.label}
        </button>
    );
}

// ─── CourseSection ────────────────────────────────────────────────────────────

function CourseSection({
    course,
    items,
    onSendCourse,
    isSending,
}: {
    course: CourseType;
    items: CartItem[];
    onSendCourse: () => void;
    isSending: boolean;
}) {
    const meta = COURSE_META[course];
    const Icon = meta.icon;

    const sentItems    = items.filter((i) => i.sentAt);
    const pendingItems = items.filter((i) => !i.sentAt);
    const allSent      = items.length > 0 && pendingItems.length === 0;

    if (items.length === 0) return null;

    return (
        <div className="rounded-2xl border border-border/60 overflow-hidden">
            {/* Section header */}
            <div className={cn("flex items-center justify-between px-4 py-3 border-b border-border/40 bg-bg-tertiary/50")}>
                <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", meta.color.split(" ")[0])} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-primary">
                        {meta.label}
                    </span>
                    <span className="text-[9px] text-text-muted">
                        ({items.length} article{items.length > 1 ? "s" : ""})
                    </span>
                </div>

                {allSent ? (
                    <div className="flex items-center gap-1.5 text-status-success">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-wider">Envoyé</span>
                    </div>
                ) : pendingItems.length > 0 ? (
                    <button
                        onClick={onSendCourse}
                        disabled={isSending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-gold text-text-primary text-[9px] font-black uppercase tracking-widest hover:bg-accent-gold/90 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <ChefHat className="w-3 h-3" />
                        Envoyer
                    </button>
                ) : null}
            </div>

            {/* Items */}
            <div className="divide-y divide-border/30">
                {items.map((item) => (
                    <div key={item.cartId} className="flex items-center gap-3 px-4 py-2.5">
                        {/* Sent indicator */}
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            item.sentAt ? "bg-status-success" : "bg-border"
                        )} />

                        <span className={cn(
                            "flex-1 text-[12px] font-medium",
                            item.sentAt ? "text-text-muted line-through" : "text-text-primary"
                        )}>
                            {item.name}
                        </span>

                        <span className="text-[10px] text-text-muted tabular-nums">
                            x{item.quantity}
                        </span>

                        <span className="text-[11px] font-mono text-text-muted tabular-nums">
                            {formatCurrency(SovereignMath.toCents(BigInt(item.unitPriceInMicrounits * item.quantity)))}
                        </span>

                        {item.sentAt && (
                            <div className="flex items-center gap-1 text-text-muted">
                                <Clock className="w-3 h-3" />
                                <span className="text-[9px]">
                                    {new Date(item.sentAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {sentItems.length > 0 && pendingItems.length > 0 && (
                <div className="px-4 py-1.5 bg-status-success/5 border-t border-status-success/10">
                    <span className="text-[9px] text-status-success font-bold">
                        {sentItems.length} envoyé{sentItems.length > 1 ? "s" : ""} · {pendingItems.length} en attente
                    </span>
                </div>
            )}
        </div>
    );
}

// ─── CourseManager ────────────────────────────────────────────────────────────

export function CourseManager({ items, onSetCourse, onSendCourse, isLoading }: CourseManagerProps) {
    const [sending, setSending] = useState<CourseType | null>(null);

    const unassigned = items.filter((i) => !i.course);

    async function fireCourse(course: CourseType) {
        setSending(course);
        try {
            await onSendCourse(course);
        } finally {
            setSending(null);
        }
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-3">
                <UtensilsCrossed className="w-8 h-8 opacity-30" />
                <p className="text-[11px] uppercase tracking-widest font-bold">Panier vide</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            {/* ── Unassigned items ──── */}
            <AnimatePresence>
                {unassigned.length > 0 && (
                    <motion.div
                        key="unassigned"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-2xl border border-dashed border-border/60 overflow-hidden"
                    >
                        <div className="px-4 py-2.5 bg-bg-tertiary/30 border-b border-border/30">
                            <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                                Sans cours ({unassigned.length})
                            </span>
                        </div>
                        <div className="divide-y divide-border/30">
                            {unassigned.map((item) => (
                                <div key={item.cartId} className="px-4 py-2.5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[12px] font-medium text-text-primary flex-1">{item.name}</span>
                                        <span className="text-[10px] text-text-muted">x{item.quantity}</span>
                                    </div>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {COURSE_ORDER.map((course) => (
                                            <CourseChip
                                                key={course}
                                                course={course}
                                                active={false}
                                                onClick={() => onSetCourse(item.cartId, course)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Course sections ──── */}
            {COURSE_ORDER.map((course) => {
                const courseItems = items.filter((i) => i.course === course);
                return (
                    <AnimatePresence key={course}>
                        {courseItems.length > 0 && (
                            <motion.div
                                key={`course-${course}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                <CourseSection
                                    course={course}
                                    items={courseItems}
                                    onSendCourse={() => fireCourse(course)}
                                    isSending={sending === course || !!isLoading}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                );
            })}
        </div>
    );
}

