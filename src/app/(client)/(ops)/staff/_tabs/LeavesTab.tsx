"use client";

import { Plus } from "lucide-react";
import type { LeaveRequest } from "@nexus/contracts";
import type { LeaveBalance } from "@/verticals/restaurant/human/staffing/hr/types";
import {
    LeaveBalanceCard,
    LeaveRequestCard,
} from "@/verticals/restaurant/human/staffing/hr/components";

interface LeavesTabProps {
    leaveBalances: LeaveBalance[];
    visibleLeaveRequests: LeaveRequest[];
    isManager: boolean;
    onRequestLeave: () => void;
    onViewStaff: () => void;
    onApprove: (request: LeaveRequest) => void;
    onReject: (request: LeaveRequest) => void;
}

export function LeavesTab({
    leaveBalances,
    visibleLeaveRequests,
    isManager,
    onRequestLeave,
    onViewStaff,
    onApprove,
    onReject,
}: LeavesTabProps) {
    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-serif font-semibold text-text-primary">
                    Congés &amp; Absences
                </h2>
                <button
                    onClick={onRequestLeave}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-action-primary text-text-primary text-sm font-bold hover:opacity-90 transition-opacity shadow"
                >
                    <Plus className="w-4 h-4" />
                    Demander un congé
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leaveBalances.map((balance, i) => (
                    <LeaveBalanceCard key={`${balance.type}-${i}`} balance={balance} />
                ))}
            </div>

            <div className="space-y-3">
                {visibleLeaveRequests.map((request) => (
                    <LeaveRequestCard
                        key={request.id}
                        request={request}
                        isManager={isManager}
                        onView={() => onViewStaff()}
                        onApprove={isManager ? () => { void onApprove(request); } : undefined}
                        onReject={isManager ? () => { void onReject(request); } : undefined}
                    />
                ))}
                {visibleLeaveRequests.length === 0 && (
                    <p className="text-sm text-text-muted italic py-8 text-center">
                        Aucune demande de congé.
                    </p>
                )}
            </div>
        </section>
    );
}
