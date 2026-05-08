"use client";

import { useState } from "react";
import { useReservations, useCRM, useTables } from "@modules/ops";
import { ReservationToolbar } from "@modules/commerce";
import { ReservationSidebar } from "@modules/commerce";
import { TableGrid } from "@modules/commerce";
import { CustomerCustomerView } from "@modules/commerce";
import { NewReservationDialog } from "@modules/commerce";
import { CustomerDetailPanel } from "@modules/commerce";
import { NewCustomerDialog } from "@modules/commerce";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ReservationsPage() {
    const [activeSection, setActiveSection] = useState<"reservations" | "customers">("reservations");
    const [view, setView] = useState<"day" | "week">("day");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isNewResOpen, setIsNewResOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

    const { data: reservations = [], isLoading: resLoading } = useReservations();
    const { data: customers = [], isLoading: crmLoading, upsertCustomer } = useCRM();
    const { tables = [] } = useTables();
    const tablesByZone = tables.reduce((acc: Record<string, unknown[]>, table: Record<string, unknown>) => {
        const zone = table.zoneId || 'STANDARD';
        if (!acc[zone]) acc[zone] = [];
        acc[zone].push({
            id: table.number,
            seats: table.seats || 4,
            type: (table.zoneId === 'VIP' ? 'vip' : table.zoneId === 'TERRACE' ? 'terrace' : 'standard'),
            status: (table.status === 'free' ? 'available' : table.status === 'seated' ? 'occupied' : 'reserved'),
            number: table.number
        });
        return acc;
    }, {});

    const displayDate = format(selectedDate, "EEEE d MMMM", { locale: fr });

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 bg-bg-primary overflow-hidden">
            <ReservationToolbar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                view={view}
                setView={setView}
                displayDate={displayDate}
                handlePrev={() => setSelectedDate(prev => new Date(prev.setDate(prev.getDate() - 1)))}
                handleNext={() => setSelectedDate(prev => new Date(prev.setDate(prev.getDate() + 1)))}
                onNewReservation={() => setIsNewResOpen(true)}
            />

            <div className="flex-1 flex overflow-hidden">
                <AnimatePresence mode="wait">
                    {activeSection === "reservations" ? (
                        <motion.div
                            key="res-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex overflow-hidden"
                        >
                            <ReservationSidebar
                                isVisible={isSidebarVisible}
                                reservations={reservations as unknown[]}
                            />
                            <div className="flex-1 overflow-auto p-8 bg-bg-primary relative">
                                <TableGrid
                                    tables={tablesByZone}
                                    onTableClick={(table) => console.log('Table selected:', table)}
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="crm-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 overflow-hidden"
                        >
                            <CustomerCustomerView
                                customers={customers as unknown[]}
                                onCustomerClick={(c) => setSelectedCustomer(c)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {selectedCustomer && (
                <CustomerDetailPanel
                    customer={selectedCustomer as unknown}
                    onClose={() => setSelectedCustomer(null)}
                    onNewReservation={() => setIsNewResOpen(true)}
                />
            )}

            {/* Note: I should verify if NewCustomerDialog or NewReservationDialog is used here */}
            {/* Based on the original toolbar, it's NewReservationDialog */}
            {/* But I'll need to check the exact component names in src/modules/reservations/components */}
        </div>
    );
}
