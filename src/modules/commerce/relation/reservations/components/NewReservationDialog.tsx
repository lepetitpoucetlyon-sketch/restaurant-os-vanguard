"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Modal } from "@ui/Modal";
import type { Customer, Reservation } from "@nexus/contracts";

import { ReservationHeader } from "./new-reservation/ReservationHeader";
import { CustomerSearchStep } from "./new-reservation/CustomerSearchStep";
import { ReservationDetailsStep } from "./new-reservation/ReservationDetailsStep";
import { CustomerIntelligenceSidebar } from "./new-reservation/CustomerIntelligenceSidebar";

interface NewReservationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (reservation: Reservation) => void;
    customers: Customer[];
}

export function NewReservationDialog({ isOpen, onClose, onSave, customers }: NewReservationDialogProps) {
    const [step, setStep] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState({
        time: "20:00",
        covers: 2,
        tableId: "t1",
        date: format(new Date(), 'yyyy-MM-dd'),
        tags: [] as string[],
    });

    const filteredCustomers = customers.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );

    const handleSubmit = () => {
        if (!selectedCustomer) return;
        onSave({
            ...formData,
            id: `res_${Math.random().toString(36).substr(2, 9)}`,
            customerId: selectedCustomer.id,
            customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
            status: 'confirmed',
            duration: 120,
        } as unknown as Reservation);
        onClose();
    };

    const reset = () => {
        setStep(1);
        setSearchQuery("");
        setSelectedCustomer(null);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { onClose(); setTimeout(reset, 300); }}
            size="xl"
            className="p-0 border-none bg-transparent"
            showClose={false}
            noPadding
        >
            <div className="flex flex-col h-[85vh] bg-bg-primary rounded-[3rem] overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.15)] border border-border">
                <ReservationHeader
                    step={step}
                    onClose={onClose}
                />

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex bg-bg-primary">
                    {/* Left: Planning/Form */}
                    <div className="flex-1 p-12 overflow-y-auto elegant-scrollbar border-r border-border">
                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <CustomerSearchStep
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    filteredCustomers={filteredCustomers}
                                    selectedCustomer={selectedCustomer}
                                    setSelectedCustomer={setSelectedCustomer}
                                    setStep={setStep}
                                />
                            ) : (
                                <ReservationDetailsStep
                                    formData={formData}
                                    setFormData={setFormData}
                                    selectedCustomer={selectedCustomer}
                                    setStep={setStep}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right: Intelligence Panel */}
                    <CustomerIntelligenceSidebar
                        selectedCustomer={selectedCustomer}
                        handleSubmit={handleSubmit}
                    />
                </div>
            </div>
        </Modal>
    );
}
