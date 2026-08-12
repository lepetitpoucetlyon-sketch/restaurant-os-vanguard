/* eslint-disable no-restricted-imports -- infrastructure/aggregator: deep path required */
"use client";

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Filter,
    LayoutList,
    Calendar,
    CheckCircle2,
    AlertCircle,
    FileText
} from 'lucide-react';
import { cn } from "@/lib/ui.foundations";
import {
    LeaveRequest,
    LeaveRequestStatus,
    RejectionReason
} from '@nexus/contracts';


// Modular Components
import { LeaveBalanceCard, LeaveRequestCard, NewRequestModal, TeamCalendar, useHumanResources } from '@/modules/human';
import { Button } from '@design/ui/button';
import { useLanguage } from '@/shared/hooks';

import { useAuth } from '@/shared/hooks';
import { withPageGuard } from "@design/rbac/PageGuard";

function LeavesPage() {
    const { currentUser } = useAuth() || {};
    const {
        leaveRequests: requests,
        leaveBalances: balances,
        isProcessing: isLoading,
        approveLeaveRequest,
        rejectLeaveRequest,
        createLeaveRequest
    } = useHumanResources();

    const [activeTab, setActiveTab] = useState<'my_requests' | 'team_calendar' | 'to_approve'>('my_requests');
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<LeaveRequestStatus | 'all'>('all');

    const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin' || (currentUser?.role as string) === 'owner';

    const myRequests = requests.filter(r => r.employeeId === currentUser?.id);
    const pendingApprovals = requests.filter(r => 
        r.status === 'pending_approval' && 
        r.employeeId !== currentUser?.id
    );

    const myBalances = balances.filter(b => b.userId === currentUser?.id);

    const filteredRequests = myRequests.filter(r =>
        statusFilter === 'all' || r.status === statusFilter
    );

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"
                />
            </div>
        );
    }

    const handleApprove = async (id: string) => {
        try {
            await approveLeaveRequest(id);
        } catch (error) {
            console.error("Failed to approve leave request", error);
        }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt("Motif du refus (facultatif) :");
        if (reason === null) return; // Cancelled
        try {
            await rejectLeaveRequest(id, reason as RejectionReason);
        } catch (error) {
            console.error("Failed to reject leave request", error);
        }
    };

    const handleSubmitRequest = async (data: Partial<LeaveRequest>) => {
        try {
            await createLeaveRequest({
                ...data,
                employeeId: currentUser?.id,
                employeeName: currentUser?.name || currentUser?.email,
                submittedAt: new Date().toISOString(),
                status: 'pending_approval'
            });
            setIsNewRequestOpen(false);
        } catch (error) {
            console.error("Failed to create leave request", error);
        }
    };


    return (
        <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 bg-bg-primary overflow-hidden flex flex-col transition-colors duration-500">
            <div className="flex-1 overflow-auto p-4 md:p-8 w-full">
                <div className="max-w-7xl mx-auto space-y-10">
                    
                    {/* Balance Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {myBalances.map((balance) => (
                            <LeaveBalanceCard key={`${balance.userId}_${balance.type}`} balance={balance} />
                        ))}
                    </div>


                    {/* Navigation */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-border">
                        <div className="flex items-center gap-4">
                            <div className="flex bg-bg-secondary p-1.5 rounded-2xl border border-border shadow-sm w-fit">
                                {[
                                    { id: 'my_requests', label: 'Mes demandes', icon: LayoutList },
                                    { id: 'team_calendar', label: 'Calendrier équipe', icon: Calendar },
                                    { id: 'to_approve', label: 'À valider', icon: CheckCircle2, count: pendingApprovals.length }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as 'my_requests' | 'team_calendar' | 'to_approve')}
                                        className={cn(
                                            "px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2.5",
                                            activeTab === tab.id
                                                ? "bg-text-primary text-bg-primary shadow-md"
                                                : "text-text-muted hover:text-text-primary hover:bg-bg-primary"
                                        )}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span className="w-5 h-5 rounded-full bg-action-primary text-text-primary flex items-center justify-center text-[9px] shadow-sm">
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setIsNewRequestOpen(true)}
                                className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-accent text-text-primary hover:bg-black hover:text-text-primary transition-all flex items-center justify-center shadow-lg shadow-accent/20 group ml-auto md:ml-0"
                                title="Nouvelle Demande"
                            >
                                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>

                        {activeTab === 'my_requests' && (
                            <div className="relative group">
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value as LeaveRequestStatus | 'all')}
                                    className="appearance-none pl-5 pr-12 py-3 rounded-xl bg-bg-secondary border border-border text-xs font-bold uppercase tracking-widest text-text-primary focus:border-accent outline-none cursor-pointer shadow-sm min-w-[200px]"
                                >
                                    <option value="all">Tous les statuts</option>
                                    <option value="pending_approval">En attente</option>
                                    <option value="approved">Approuvées</option>
                                    <option value="rejected">Refusées</option>
                                </select>
                                <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none group-hover:text-accent transition-colors" />
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'my_requests' && (
                            <motion.div
                                key="my_requests"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                {filteredRequests.length === 0 ? (
                                    <div className="text-center py-20 bg-bg-secondary/50 rounded-[3rem] border border-border mt-8">
                                        <div className="w-20 h-20 bg-bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-border">
                                            <FileText className="w-8 h-8 text-text-muted/50" />
                                        </div>
                                        <h3 className="font-serif italic text-2xl text-text-primary mb-2">Aucune demande</h3>
                                        <p className="text-text-muted text-sm uppercase tracking-widest">Vous n'avez pas de demande correspondant aux critères</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {filteredRequests.map((request, i) => (
                                            <motion.div
                                                key={request.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                            >
                                                <LeaveRequestCard
                                                    request={request}
                                                    onView={() => { }}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'team_calendar' && (
                            <motion.div
                                key="team_calendar"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <TeamCalendar />
                            </motion.div>
                        )}

                        {activeTab === 'to_approve' && isManager && (
                            <motion.div
                                key="to_approve"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {pendingApprovals.length > 0 && (
                                    <div className="mb-8 p-6 rounded-[2rem] bg-amber-50 border border-amber-200/60 flex items-center gap-4 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-64 bg-amber-200/20 blur-3xl -mr-10 -mt-10" />
                                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 relative z-10 shrink-0">
                                            <AlertCircle className="w-6 h-6" />
                                        </div>
                                        <div className="relative z-10">
                                            <h4 className="font-serif italic text-lg text-amber-900 mb-0.5">Action Requise</h4>
                                            <p className="text-amber-800/80 text-xs font-bold uppercase tracking-wide">
                                                {pendingApprovals.length} demande{pendingApprovals.length > 1 ? 's' : ''} en attente de validation
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {pendingApprovals.length === 0 ? (
                                    <div className="text-center py-20 bg-bg-secondary/50 rounded-[3rem] border border-border mt-8">
                                        <div className="w-20 h-20 bg-bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-border">
                                            <CheckCircle2 className="w-8 h-8 text-status-success/50" />
                                        </div>
                                        <h3 className="font-serif italic text-2xl text-text-primary mb-2">Tout est à jour</h3>
                                        <p className="text-text-muted text-sm uppercase tracking-widest">Aucune demande en attente de validation</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {pendingApprovals.map((request, i) => (
                                            <motion.div
                                                key={request.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                            >
                                                <LeaveRequestCard
                                                    request={request}
                                                    isManager={true}
                                                    onView={() => { }}
                                                    onApprove={() => handleApprove(request.id)}
                                                    onReject={() => handleReject(request.id)}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* New Request Modal */}
            <NewRequestModal
                isOpen={isNewRequestOpen}
                onClose={() => setIsNewRequestOpen(false)}
                balances={myBalances}
                onSubmit={handleSubmitRequest}
            />

        </div>
    );
}

export default withPageGuard(LeavesPage, "leaves");
