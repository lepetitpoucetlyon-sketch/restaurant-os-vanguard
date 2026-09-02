"use client";

import { Plus, Users } from "lucide-react";
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
    ReservationsHeader,
} from '@/modules/commerce';
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

            <ReservationsHeader
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                view={view}
                setView={setView}
                setSelectedDate={setSelectedDate}
                setWeekOffset={setWeekOffset}
                displayDate={displayDate}
                weekLabel={weekLabel}
                terraceClosed={terraceClosed}
                handleTerraceToggle={handleTerraceToggle}
                onNewReservation={() => setIsNewResOpen(true)}
                onNewGroup={() => setIsGroupModalOpen(true)}
                onOpenEventQuote={() => setIsEventQuoteOpen(true)}
            />

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
                                    <div className="hidden xl:flex w-[26.25rem] border-l border-border overflow-auto p-6 bg-bg-primary shrink-0">
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
                                                <span className="text-chip-label-sm text-text-muted border border-border rounded-full px-2 py-0.5">{g.status ?? "en attente"}</span>
                                            </div>
                                            <h3 className="font-black text-text-primary text-sm truncate">{g.name}</h3>
                                            {Boolean((g as JsonObject)["minCovers"]) && (
                                                <p className="text-nano text-text-muted mt-1">{String((g as JsonObject)["minCovers"] ?? "")}–{String((g as JsonObject)["maxCovers"] ?? "")} couverts</p>
                                            )}
                                            {Boolean((g as JsonObject)["notes"]) && (
                                                <p className="text-nano text-text-muted mt-2 line-clamp-2 italic">{String((g as JsonObject)["notes"] ?? "")}</p>
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
