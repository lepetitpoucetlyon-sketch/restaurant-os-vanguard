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
import { PageShell } from "@ui/PageShell";

import { useLanguage } from "@/shared/hooks";
/**
 * ReservationsHeader — toolbar éditoriale de la page /reservations.
 *
 * Refactor 2026-08-24 : header assemblé à partir des primitives universelles
 * `PageShell.OperationalHeader / EditorialTitle / Segmented` (ADR-017). Le
 * comportement, l'API et le rendu visuel restent identiques ; seul le vocabulaire
 * change et devient partageable avec les futurs headers Gym / Vétérinaire /
 * Coworking / Fleuriste (aucune duplication de rail éditorial).
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
    const { t } = useLanguage();
    return (
        <PageShell.OperationalHeader dense className="py-1">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-5 flex-wrap min-w-0">
                    <PageShell.EditorialTitle kicker="Salle" title="Réservations" size="sm" />

                    <PageShell.Segmented ariaLabel="Section">
                        <PageShell.SegmentedItem
                            active={activeSection === "reservations"}
                            onClick={() => setActiveSection("reservations")}
                            icon={LayoutGrid}
                        >
                            Plan
                        </PageShell.SegmentedItem>
                        <PageShell.SegmentedItem
                            active={activeSection === "customers"}
                            onClick={() => setActiveSection("customers")}
                            icon={Users}
                        >
                            Clients
                        </PageShell.SegmentedItem>
                        <PageShell.SegmentedItem
                            active={activeSection === "groups"}
                            onClick={() => setActiveSection("groups")}
                            icon={Calendar}
                        >
                            Groupes
                        </PageShell.SegmentedItem>
                    </PageShell.Segmented>

                    {view === "day" && activeSection === "reservations" && (
                        <div className="flex items-center gap-2 h-10 px-2 bg-surface-glass border border-border/40 rounded-xl">
                            <button
                                onClick={() => setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; })}
                                aria-label="Jour précédent"
                                className="w-8 h-8 flex items-center justify-center hover:bg-surface-glass-hover rounded-lg text-text-muted hover:text-text-primary transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-serif italic text-text-primary capitalize min-w-[9.375rem] text-center tracking-tight">{displayDate}</span>
                            <button
                                onClick={() => setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; })}
                                aria-label="Jour suivant"
                                className="w-8 h-8 flex items-center justify-center hover:bg-surface-glass-hover rounded-lg text-text-muted hover:text-text-primary transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {view === "week" && activeSection === "reservations" && (
                        <div className="flex items-center gap-2 h-10 px-2 bg-surface-glass border border-border/40 rounded-xl">
                            <button
                                onClick={() => setWeekOffset((o) => o - 1)}
                                aria-label="Semaine précédente"
                                className="w-8 h-8 flex items-center justify-center hover:bg-surface-glass-hover rounded-lg text-text-muted hover:text-text-primary transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-serif italic text-text-primary min-w-[11.875rem] text-center tracking-tight">{weekLabel}</span>
                            <button
                                onClick={() => setWeekOffset((o) => o + 1)}
                                aria-label="Semaine suivante"
                                className="w-8 h-8 flex items-center justify-center hover:bg-surface-glass-hover rounded-lg text-text-muted hover:text-text-primary transition-colors"
                            >
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
                        {terraceClosed
                            ? <><UmbrellaOff className="w-[14px] h-[14px]" /> <span>{t('commerce.reservations.terraceClosed')}</span></>
                            : <><Umbrella className="w-[14px] h-[14px]" /> <span>Terrasse ouverte</span></>}
                    </button>

                    {activeSection === "reservations" && (
                        <PageShell.Segmented ariaLabel="Vue">
                            <PageShell.SegmentedItem
                                active={view === "day"}
                                onClick={() => setView("day")}
                                icon={Calendar}
                                className="px-3.5"
                            >
                                Jour
                            </PageShell.SegmentedItem>
                            <PageShell.SegmentedItem
                                active={view === "week"}
                                onClick={() => setView("week")}
                                icon={CalendarDays}
                                className="px-3.5"
                            >
                                Semaine
                            </PageShell.SegmentedItem>
                        </PageShell.Segmented>
                    )}

                    {activeSection === "reservations" && (
                        <>
                            <PageShell.CTA tone="ghost" onClick={onOpenEventQuote} className="h-10 px-3.5 text-xs">
                                <FileText className="w-[14px] h-[14px]" /> <span>Devis</span>
                            </PageShell.CTA>
                            <PageShell.CTA onClick={onNewReservation}>
                                <Plus className="w-[15px] h-[15px]" /> <span>{t('commerce.reservations.book')}</span>
                            </PageShell.CTA>
                        </>
                    )}
                    {activeSection === "groups" && (
                        <PageShell.CTA onClick={onNewGroup}>
                            <Plus className="w-[15px] h-[15px]" /> <span>Nouveau groupe</span>
                        </PageShell.CTA>
                    )}
                </div>
            </div>
        </PageShell.OperationalHeader>
    );
}
