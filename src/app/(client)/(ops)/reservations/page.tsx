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
import { motion, AnimatePresence } from "framer-motion";

import {
    useReservationsPage,
    DailyListView,
    WeeklyView,
    GroupFormModal,
    EventQuoteModal,
    ReservationCreateDialog,
    ReservationSidebar,
    TableGrid,
    CustomerCustomerView,
    CustomerDetailPanel,
    PinModal,
} from '@/modules/commerce';
import { cn } from "@/lib/ui.foundations";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import type { JsonObject } from "@/shared/types/json";

function ReservationsPage() {
    const {
        activeSection, setActiveSection,
        view, setView,
        selectedDate, setSelectedDate,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
        weekOffset, setWeekOffset,
        isNewResOpen, setIsNewResOpen,
        isGroupModalOpen, setIsGroupModalOpen,
        isEventQuoteOpen, setIsEventQuoteOpen,
        selectedCustomer, setSelectedCustomer,
        noShowConfirmId, setNoShowConfirmId,
        terraceClosed,
        pinModal, setPinModal,
        pinError, setPinError,
        reservations, customers, groups, opsTables,
        isLoading, markArrived,
        weekDays, todayReservations, tablesByZone, weekLabel, displayDate,
        handleTerraceToggle,
        handleMarkNoShow,
        handleCancelReservation,
        handleSaveReservation,
        handleCreateGroup,
        handlePinConfirm,
    } = useReservationsPage();

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 bg-bg-primary overflow-hidden">

            {/* Editorial toolbar — section switcher · date navigator · actions */}
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
                                className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg text-text-muted hover:text-text-primary transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-serif italic text-text-primary capitalize min-w-[150px] text-center tracking-tight">{displayDate}</span>
                            <button onClick={() => setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; })}
                                aria-label="Jour suivant"
                                className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg text-text-muted hover:text-text-primary transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {view === "week" && activeSection === "reservations" && (
                        <div className="flex items-center gap-2 h-10 px-2 bg-surface-glass border border-border/40 rounded-xl">
                            <button onClick={() => setWeekOffset((o) => o - 1)}
                                aria-label="Semaine précédente"
                                className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg text-text-muted hover:text-text-primary transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-serif italic text-text-primary min-w-[190px] text-center tracking-tight">{weekLabel}</span>
                            <button onClick={() => setWeekOffset((o) => o + 1)}
                                aria-label="Semaine suivante"
                                className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg text-text-muted hover:text-text-primary transition-colors">
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
                                onClick={() => setIsEventQuoteOpen(true)}
                                className="h-10 px-3.5 rounded-xl bg-surface-glass border border-border/40 hover:border-accent-gold/50 text-text-muted hover:text-accent-gold text-xs font-medium tracking-tight transition-colors flex items-center gap-2">
                                <FileText className="w-[14px] h-[14px]" /> <span>Devis</span>
                            </button>
                            <button
                                onClick={() => setIsNewResOpen(true)}
                                className="h-10 px-5 rounded-xl bg-accent-gold hover:bg-accent-gold/90 text-[#0B0B0C] text-sm font-medium tracking-tight transition-colors flex items-center gap-2 shadow-[0_4px_20px_-6px_rgba(197,160,89,0.4)]">
                                <Plus className="w-[15px] h-[15px]" /> <span>Réserver</span>
                            </button>
                        </>
                    )}
                    {activeSection === "groups" && (
                        <button onClick={() => setIsGroupModalOpen(true)}
                            className="h-10 px-5 rounded-xl bg-accent-gold hover:bg-accent-gold/90 text-[#0B0B0C] text-sm font-medium tracking-tight transition-colors flex items-center gap-2 shadow-[0_4px_20px_-6px_rgba(197,160,89,0.4)]">
                            <Plus className="w-[15px] h-[15px]" /> <span>Nouveau groupe</span>
                        </button>
                    )}
                </div>
            </header>

            {/* ── Main content ──────────────────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden">
                <AnimatePresence mode="wait">
                    {activeSection === "reservations" && (
                        <motion.div key={`res-${view}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex-1 flex overflow-hidden">
                            {view === "day" ? (
                                <>
                                    <ReservationSidebar isVisible={true} reservations={reservations} onMarkArrived={markArrived} />
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        <DailyListView reservations={todayReservations} isLoading={isLoading} onMarkArrived={markArrived} onMarkNoShow={handleMarkNoShow} onCancel={handleCancelReservation} noShowConfirmId={noShowConfirmId} setNoShowConfirmId={setNoShowConfirmId} />
                                    </div>
                                    <div className="hidden xl:flex w-[420px] border-l border-border overflow-auto p-6 bg-bg-primary shrink-0">
                                        <TableGrid tables={tablesByZone} onTableClick={() => setIsNewResOpen(true)} />
                                    </div>
                                </>
                            ) : (
                                <WeeklyView reservations={reservations} weekDays={weekDays} selectedDate={selectedDate} onDateClick={(d) => { setSelectedDate(d); setView("day"); }} />
                            )}
                        </motion.div>
                    )}

                    {activeSection === "customers" && (
                        <motion.div key="crm-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex-1 overflow-hidden">
                            <CustomerCustomerView customers={customers} isLoading={isLoading} onCustomerClick={(c) => setSelectedCustomer(c)} />
                        </motion.div>
                    )}

                    {activeSection === "groups" && (
                        <motion.div key="groups-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex-1 overflow-y-auto p-6">
                            {groups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-24 text-center max-w-md mx-auto">
                                    <div className="w-14 h-14 rounded-2xl bg-surface-glass border border-border/40 flex items-center justify-center mb-6">
                                        <Users strokeWidth={1.4} className="w-6 h-6 text-text-muted/50" />
                                    </div>
                                    <h3 className="font-serif font-black italic text-2xl tracking-tight text-text-primary mb-2">Aucun groupe enregistré</h3>
                                    <p className="text-sm text-text-muted leading-relaxed mb-6">Regroupez vos clients pour organiser mariages, séminaires ou événements privés.</p>
                                    <button onClick={() => setIsGroupModalOpen(true)}
                                        className="h-10 px-5 rounded-xl bg-accent-gold hover:bg-accent-gold/90 text-[#0B0B0C] text-sm font-medium tracking-tight transition-colors flex items-center gap-2 shadow-[0_4px_20px_-6px_rgba(197,160,89,0.4)]">
                                        <Plus className="w-[15px] h-[15px]" /> Créer un groupe
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groups.map((g) => (
                                        <div key={g.id} className="bg-bg-secondary border border-border rounded-2xl p-5 hover:border-accent/30 transition-all">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                                                    <Users className="w-5 h-5 text-accent" />
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted border border-border rounded-full px-2 py-0.5">{g.status ?? "en attente"}</span>
                                            </div>
                                            <h3 className="font-black text-text-primary text-sm truncate">{g.name}</h3>
                                            {Boolean((g as JsonObject)["minCovers"]) && (
                                                <p className="text-[10px] text-text-muted mt-1">{String((g as JsonObject)["minCovers"] ?? "")}–{String((g as JsonObject)["maxCovers"] ?? "")} couverts</p>
                                            )}
                                            {Boolean((g as JsonObject)["notes"]) && (
                                                <p className="text-[10px] text-text-muted mt-2 line-clamp-2 italic">{String((g as JsonObject)["notes"] ?? "")}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {selectedCustomer && (
                <CustomerDetailPanel customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} onNewReservation={() => { setSelectedCustomer(null); setActiveSection("reservations"); setIsNewResOpen(true); }} />
            )}

            <ReservationCreateDialog isOpen={isNewResOpen} onClose={() => setIsNewResOpen(false)} onSave={handleSaveReservation} customers={customers} tables={opsTables} terraceClosed={terraceClosed} />
            <GroupFormModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} onSave={handleCreateGroup} />
            <EventQuoteModal isOpen={isEventQuoteOpen} onClose={() => setIsEventQuoteOpen(false)} tenantId={""} />
            <PinModal
                isOpen={pinModal.open}
                title={pinModal.action === "override_capacity" ? "Dépassement capacité" : "Annulation réservation"}
                error={pinError}
                onConfirm={handlePinConfirm}
                onClose={() => { setPinModal({ open: false, action: null }); setPinError(undefined); }}
            />
        </div>
    );
}

export default withPageGuard(ReservationsPage, "reservations");
