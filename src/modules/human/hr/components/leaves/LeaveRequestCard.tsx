"use client";

import { motion } from "framer-motion";
import {
    CalendarDays,
    Users,
    CheckCircle2,
    Eye,
    XCircle,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import {
    LeaveRequest,
    LEAVE_TYPE_ICONS,
    LEAVE_TYPE_LABELS,
    LEAVE_STATUS_CONFIG
} from "@nexus/contracts";

interface LeaveRequestCardProps {
    request: LeaveRequest;
    onView: () => void;
    onApprove?: () => void;
    onReject?: () => void;
    isManager?: boolean;
}

export function LeaveRequestCard({
    request,
    onView,
    onApprove,
    onReject,
    isManager = false
}: LeaveRequestCardProps) {
    const statusConfig = LEAVE_STATUS_CONFIG[request.status];
    const icon = LEAVE_TYPE_ICONS[request.type];
    const typeLabel = LEAVE_TYPE_LABELS[request.type];

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    const getRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Aujourd'hui";
        if (diffDays === 1) return 'Hier';
        if (diffDays < 7) return `Il y a ${diffDays} jours`;
        return formatDate(dateStr);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-bg-primary border border-border rounded-[2rem] p-6 hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-bg-tertiary to-transparent opacity-50 rounded-bl-[3rem] pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
                <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-bg-secondary flex items-center justify-center text-2xl border border-border shadow-sm group-hover:scale-110 transition-transform duration-500">
                        {icon}
                    </div>
                    <div>
                        {isManager && (
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">
                                    {(request.employeeName || '').charAt(0)}
                                </div>
                                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{request.employeeName}</span>
                            </div>
                        )}
                        <h3 className="font-serif italic text-xl text-text-primary mb-1">{typeLabel}</h3>
                        <div className="flex items-center gap-3 text-sm text-text-muted">
                            <div className="flex items-center gap-1.5 bg-bg-secondary px-2 py-1 rounded-lg border border-border/50">
                                <CalendarDays className="w-3.5 h-3.5" />
                                <span className="font-medium text-text-primary">
                                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                                </span>
                            </div>
                            <span className="text-text-muted/40">•</span>
                            <span className="font-bold text-accent uppercase tracking-wider text-xs">{request.workingDays} jour{request.workingDays > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                    <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                        request.status === 'approved' && "bg-emerald-100 text-emerald-700 border border-emerald-200",
                        request.status === 'pending_approval' && "bg-amber-100 text-amber-700 border border-amber-200",
                        request.status === 'rejected' && "bg-rose-100 text-rose-700 border border-rose-200",
                        request.status === 'in_progress' && "bg-blue-100 text-blue-700 border border-blue-200",
                    )}>
                        {statusConfig.label}
                    </span>
                    {request.submittedAt && (
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-60">
                            {getRelativeTime(request.submittedAt)}
                        </span>
                    )}
                </div>
            </div>

            {/* Team coverage indicator for managers */}
            {isManager && request.teamCoverage && (
                <div className="mt-4 flex items-center gap-3 bg-bg-secondary/50 p-3 rounded-xl border border-border/50 w-fit">
                    <Users className="w-4 h-4 text-text-muted" />
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                        Couverture équipe : {request.teamCoverage.percent}%
                    </span>
                    {request.teamCoverage.compliant ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/50">
                <button
                    onClick={onView}
                    className="text-xs font-bold uppercase tracking-widest text-text-muted hover:text-accent transition-colors flex items-center gap-2 group/btn"
                >
                    <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    Voir le dossier
                </button>

                {isManager && request.status === 'pending_approval' && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onReject}
                            className="px-4 py-2 rounded-xl bg-bg-secondary border border-border text-rose-600 text-xs font-bold uppercase tracking-wider hover:bg-rose-50 transition-colors flex items-center gap-2"
                        >
                            <XCircle className="w-4 h-4" />
                            Refuser
                        </button>
                        <button
                            onClick={onApprove}
                            className="px-4 py-2 rounded-xl bg-text-primary text-bg-primary text-xs font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-md flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Approuver
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
