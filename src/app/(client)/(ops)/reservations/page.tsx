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

import { useReservationsPage } from "@/modules/commerce/reservations/hooks";
import { PinModal } from "@modules/commerce/ui/pos/PinModal";
import { DailyListView } from "@/modules/commerce/reservations/components/DailyListView";
import { WeeklyView } from "@/modules/commerce/reservations/components/WeeklyView";
import { GroupFormModal } from "@/modules/commerce/reservations/components/GroupFormModal";
import dynamic from "next/dynamic";
const EventQuoteModal = dynamic(
  () => import("@/modules/commerce/reservations/components/EventQuoteModal").then(m => m.EventQuoteModal),
  { ssr: false, loading: () => null }
);
const ReservationCreateDialog = dynamic(
  () => import("@/modules/commerce/reservations/components/ReservationCreateDialog").then(m => m.ReservationCreateDialog),
  { ssr: false, loading: () => null }
);
import { ReservationSidebar } from "@modules/commerce";
import { TableGrid } from "@modules/commerce";
import { CustomerCustomerView } from "@modules/commerce";
import { CustomerDetailPanel } from "@modules/commerce";
import { cn } from "@/lib/ui.foundations";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function ReservationsPage() {
    const {
        activeSection, setActiveSection,
        view, setView,
        selectedDate, setSelectedDate,
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

            {/* ── Toolbar ─────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-wrap items-center justify-between gap-4 bg-bg-secondary/50 backdrop-blur-md border-b border-border px-6 py-3 z-40 shrink-0 sticky top-0"
            >
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center bg-bg-tertiary p-1 rounded-full border border-border">
                        {(["reservations", "customers", "groups"] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setActiveSection(s)}
                                className={cn(
                                    "h-9 px-5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                    activeSection === s
                                        ? "bg-bg-primary text-text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                                        : "text-text-muted hover:text-text-primary"
                                )}
                            >
                                {s === "reservations" ? <><LayoutGrid className="w-3 h-3" /> Plan</>
                                    : s === "customers" ? <><Users className="w-3 h-3" /> Clients</>
                                    : <><Calendar className="w-3 h-3" /> Groupes</>}
                            </button>
                        ))}
                    </div>

                    {view === "day" && activeSection === "reservations" && (
                        <div className="flex items-center gap-3 bg-bg-tertiary/50 px-4 py-2 rounded-full border border-border/50">
                            <button onClick={() => setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; })} className="p-1.5 hover:bg-bg-primary rounded-full text-text-muted hover:text-accent transition-all">
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[11px] font-serif font-medium italic text-text-primary capitalize min-w-[140px] text-center">{displayDate}</span>
                            <button onClick={() => setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; })} className="p-1.5 hover:bg-bg-primary rounded-full text-text-muted hover:text-accent transition-all">
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {view === "week" && activeSection === "reservations" && (
                        <div className="flex items-center gap-3 bg-bg-tertiary/50 px-4 py-2 rounded-full border border-border/50">
                            <button onClick={() => setWeekOffset((o) => o - 1)} className="p-1.5 hover:bg-bg-primary rounded-full text-text-muted hover:text-accent transition-all">
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[11px] font-serif italic text-text-primary min-w-[180px] text-center">{weekLabel}</span>
                            <button onClick={() => setWeekOffset((o) => o + 1)} className="p-1.5 hover:bg-bg-primary rounded-full text-text-muted hover:text-accent transition-all">
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleTerraceToggle}
                        title={terraceClosed ? "Terrasse fermée — cliquer pour ouvrir" : "Terrasse ouverte — cliquer pour fermer"}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all",
                            terraceClosed
                                ? "bg-status-error/10 border-status-error/30 text-status-error hover:bg-status-error/20"
                                : "bg-status-success/10 border-status-success/30 text-status-success hover:bg-status-success/20"
                        )}
                    >
                        {terraceClosed ? <><UmbrellaOff className="w-3.5 h-3.5" /> Terrasse fermée</> : <><Umbrella className="w-3.5 h-3.5" /> Terrasse ouverte</>}
                    </button>

                    {activeSection === "reservations" && (
                        <div className="flex items-center bg-bg-tertiary p-1 rounded-full border border-border">
                            {(["day", "week"] as const).map((v) => (
                                <button key={v} onClick={() => setView(v)} className={cn("h-8 px-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5", view === v ? "bg-bg-primary text-text-primary shadow-sm" : "text-text-muted hover:text-text-primary")}>
                                    {v === "day" ? <><Calendar className="w-3 h-3" /> Jour</> : <><CalendarDays className="w-3 h-3" /> Semaine</>}
                                </button>
                            ))}
                        </div>
                    )}

                    {activeSection === "reservations" && (
                        <>
                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setIsEventQuoteOpen(true)} className="h-10 px-5 bg-bg-secondary text-text-primary rounded-full font-black text-[9px] uppercase tracking-widest shadow-sm flex items-center gap-2 border border-border hover:border-accent/40 hover:text-accent transition-all">
                                <FileText className="w-3.5 h-3.5" /> Devis événement
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setIsNewResOpen(true)} className="h-10 px-6 bg-accent text-bg-primary rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 flex items-center gap-2 border border-amber-300/20 transition-all">
                                <Plus className="w-3.5 h-3.5" /> Réserver
                            </motion.button>
                        </>
                    )}
                    {activeSection === "groups" && (
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setIsGroupModalOpen(true)} className="h-10 px-6 bg-accent text-bg-primary rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg shadow-amber-500/10 flex items-center gap-2 border border-amber-300/20 transition-all">
                            <Plus className="w-3.5 h-3.5" /> Nouveau groupe
                        </motion.button>
                    )}
                </div>
            </motion.div>

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
                                <div className="flex flex-col items-center justify-center h-full py-24 text-center">
                                    <div className="w-16 h-16 rounded-[2rem] bg-bg-tertiary flex items-center justify-center mb-6 border border-border">
                                        <Users strokeWidth={1} className="w-8 h-8 text-text-muted/40" />
                                    </div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-4">Aucun groupe enregistré</p>
                                    <button onClick={() => setIsGroupModalOpen(true)} className="h-10 px-6 bg-accent text-bg-primary rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg shadow-amber-500/10 flex items-center gap-2">
                                        <Plus className="w-3.5 h-3.5" /> Créer un groupe
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
                                            {Boolean((g as Record<string, unknown>)["minCovers"]) && (
                                                <p className="text-[10px] text-text-muted mt-1">{String((g as Record<string, unknown>)["minCovers"] ?? "")}–{String((g as Record<string, unknown>)["maxCovers"] ?? "")} couverts</p>
                                            )}
                                            {Boolean((g as Record<string, unknown>)["notes"]) && (
                                                <p className="text-[10px] text-text-muted mt-2 line-clamp-2 italic">{String((g as Record<string, unknown>)["notes"] ?? "")}</p>
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
