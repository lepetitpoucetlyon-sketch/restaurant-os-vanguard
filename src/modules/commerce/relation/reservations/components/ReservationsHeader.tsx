"use client";

import {
    ChevronLeft,
    ChevronRight,
    Plus,
    LayoutGrid,
    Users,
    Calendar,
    CalendarDays,
    Umbrella,
    UmbrellaOff,
    FileText,
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";

/**
 * ReservationsHeader — toolbar éditoriale de la page /reservations.
 *
 * Extrait de app/(client)/(ops)/reservations/page.tsx dans le cadre du plan v3.1
 * P2.1 : les 4 pages custom (POS, KDS, floor-plan, réservations) ont des layouts
 * opérationnels qui empêchent l'usage direct de PageShell v2, mais leurs headers
 * partagent le même vocabulaire (kicker Playfair italic + big title +
 * `bg-surface-glass border rounded-xl` rails + `bg-accent-gold` CTA). Extraire
 * ces headers permet de faire évoluer le style d'un seul endroit.
 */
export type ReservationSection = "reservations" | "customers" | "groups";
export type ReservationView = "day" | "week";

interface ReservationsHeaderProps {
    activeSection: ReservationSection;
    setActiveSection: (section: ReservationSection) => void;
    view: ReservationView;
    setView: (view: ReservationView) => void;
    setSelectedDate: (updater: (d: Date) => Date) => void;
    setWeekOffset: (updater: (o: number) => number) => void;
    displayDate: string;
    weekLabel: string;
    terraceClosed: boolean;
    handleTerraceToggle: () => void;
    onNewReservation: () => void;
    onNewGroup: () => void;
    onOpenEventQuote: () => void;
}

export function ReservationsHeader({
    activeSection,
    setActiveSection,
    view,
    setView,
    setSelectedDate,
    setWeekOffset,
    displayDate,
    weekLabel,
    terraceClosed,
    handleTerraceToggle,
    onNewReservation,
    onNewGroup,
    onOpenEventQuote,
}: ReservationsHeaderProps) {
    return (
        <header className="flex flex-wrap items-center justify-between gap-4 bg-surface-card/60 backdrop-blur-xl border-b border-border/40 px-6 lg:px-10 py-4 z-40 shrink-0 sticky top-0">
            <div className="flex items-center gap-5 flex-wrap min-w-0">
                <div className="flex items-baseline gap-3">
                    <span className="font-serif font-black italic text-[11px] uppercase tracking-[0.32em] text-text-muted/70">Salle</span>
                    <span className="font-serif font-black text-2xl leading-none tracking-[-0.02em] text-text-primary">Réservations</span>
                </div>

                <nav aria-label="Section" className="flex items-center h-10 bg-surface-glass border border-border/40 rounded-xl overflow-hidden">
                    {(["reservations", "customers", "groups"] as const).map((s, i) => (
                        <button
                            key={s}
                            onClick={() => setActiveSection(s)}
                            aria-current={activeSection === s ? "page" : undefined}
                            className={cn(
                                "h-full flex items-center gap-2 px-4 text-xs font-medium tracking-tight transition-colors",
                                i > 0 && "border-l border-border/40",
                                activeSection === s ? "bg-surface-glass-hover text-text-primary" : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            {s === "reservations" ? <><LayoutGrid className="w-[14px] h-[14px]" /> <span>Plan</span></>
                                : s === "customers" ? <><Users className="w-[14px] h-[14px]" /> <span>Clients</span></>
                                : <><Calendar className="w-[14px] h-[14px]" /> <span>Groupes</span></>}
                        </button>
                    ))}
                </nav>

                {view === "day" && activeSection === "reservations" && (
                    <div className="flex items-center gap-2 h-10 px-2 bg-surface-glass border border-border/40 rounded-xl">
                        <button onClick={() => setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; })}
                            aria-label="Jour précédent"
                            className="w-8 h-8 flex items-center justify-center hover:bg-surface-glass-hover rounded-lg text-text-muted hover:text-text-primary transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-serif italic text-text-primary capitalize min-w-[150px] text-center tracking-tight">{displayDate}</span>
                        <button onClick={() => setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; })}
                            aria-label="Jour suivant"
                            className="w-8 h-8 flex items-center justify-center hover:bg-surface-glass-hover rounded-lg text-text-muted hover:text-text-primary transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {view === "week" && activeSection === "reservations" && (
                    <div className="flex items-center gap-2 h-10 px-2 bg-surface-glass border border-border/40 rounded-xl">
                        <button onClick={() => setWeekOffset((o) => o - 1)}
                            aria-label="Semaine précédente"
                            className="w-8 h-8 flex items-center justify-center hover:bg-surface-glass-hover rounded-lg text-text-muted hover:text-text-primary transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-serif italic text-text-primary min-w-[190px] text-center tracking-tight">{weekLabel}</span>
                        <button onClick={() => setWeekOffset((o) => o + 1)}
                            aria-label="Semaine suivante"
                            className="w-8 h-8 flex items-center justify-center hover:bg-surface-glass-hover rounded-lg text-text-muted hover:text-text-primary transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={handleTerraceToggle}
                    title={terraceClosed ? "Terrasse fermée — cliquer pour ouvrir" : "Terrasse ouverte — cliquer pour fermer"}
                    aria-pressed={!terraceClosed}
                    className={cn(
                        "flex items-center gap-2 h-10 px-3.5 rounded-xl border text-xs font-medium tracking-tight transition-colors",
                        terraceClosed
                            ? "bg-status-error/10 border-status-error/30 text-status-error hover:bg-status-error/15"
                            : "bg-status-success/10 border-status-success/30 text-status-success hover:bg-status-success/15"
                    )}
                >
                    {terraceClosed ? <><UmbrellaOff className="w-[14px] h-[14px]" /> <span>Terrasse fermée</span></> : <><Umbrella className="w-[14px] h-[14px]" /> <span>Terrasse ouverte</span></>}
                </button>

                {activeSection === "reservations" && (
                    <div className="flex items-center h-10 bg-surface-glass border border-border/40 rounded-xl overflow-hidden">
                        {(["day", "week"] as const).map((v, i) => (
                            <button key={v} onClick={() => setView(v)}
                                aria-current={view === v ? "page" : undefined}
                                className={cn(
                                    "h-full flex items-center gap-1.5 px-3.5 text-xs font-medium tracking-tight transition-colors",
                                    i > 0 && "border-l border-border/40",
                                    view === v ? "bg-surface-glass-hover text-text-primary" : "text-text-muted hover:text-text-primary"
                                )}>
                                {v === "day" ? <><Calendar className="w-[14px] h-[14px]" /> <span>Jour</span></> : <><CalendarDays className="w-[14px] h-[14px]" /> <span>Semaine</span></>}
                            </button>
                        ))}
                    </div>
                )}

                {activeSection === "reservations" && (
                    <>
                        <button
                            onClick={onOpenEventQuote}
                            className="h-10 px-3.5 rounded-xl bg-surface-glass border border-border/40 hover:border-accent-gold/50 text-text-muted hover:text-accent-gold text-xs font-medium tracking-tight transition-colors flex items-center gap-2">
                            <FileText className="w-[14px] h-[14px]" /> <span>Devis</span>
                        </button>
                        <button
                            onClick={onNewReservation}
                            className="h-10 px-5 rounded-xl bg-accent-gold hover:bg-accent-gold/90 text-[#0B0B0C] text-sm font-medium tracking-tight transition-colors flex items-center gap-2 shadow-[0_4px_20px_-6px_rgba(197,160,89,0.4)]">
                            <Plus className="w-[15px] h-[15px]" /> <span>Réserver</span>
                        </button>
                    </>
                )}
                {activeSection === "groups" && (
                    <button onClick={onNewGroup}
                        className="h-10 px-5 rounded-xl bg-accent-gold hover:bg-accent-gold/90 text-[#0B0B0C] text-sm font-medium tracking-tight transition-colors flex items-center gap-2 shadow-[0_4px_20px_-6px_rgba(197,160,89,0.4)]">
                        <Plus className="w-[15px] h-[15px]" /> <span>Nouveau groupe</span>
                    </button>
                )}
            </div>
        </header>
    );
}
