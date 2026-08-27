"use client";

import { Modal } from "@ui/Modal";
import { CalendarDays, Clock, Users, ShieldCheck, XCircle, CheckCircle2, FileText } from "lucide-react";
import {
    LEAVE_STATUS_CONFIG,
    LEAVE_TYPE_LABELS,
    type LeaveRequest,
    type RejectionReason,
} from "@nexus/contracts";

/**
 * Détail d'une demande de congé.
 *
 * L'écran des congés proposait déjà une consultation (`onView`) mais la
 * branchait sur une fonction vide : le motif, la couverture d'équipe et
 * l'historique de décision — pourtant portés par le contrat `LeaveRequest` —
 * restaient invisibles, y compris au manager qui doit trancher.
 */

const REJECTION_LABELS: Record<RejectionReason, string> = {
    team_coverage: "Couverture d'équipe insuffisante",
    blackout_period: 'Période bloquée',
    insufficient_notice: 'Délai de prévenance trop court',
    balance_insufficient: 'Solde de congés insuffisant',
    documentation: 'Justificatif manquant',
    business_needs: "Contraintes d'activité",
    other: 'Autre motif',
};

const PERIOD_LABELS: Record<string, string> = {
    full_day: 'journée complète',
    morning: 'matin',
    afternoon: 'après-midi',
};

const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';

const formatDateTime = (iso?: string) =>
    iso ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

interface LeaveRequestDetailModalProps {
    request: LeaveRequest | null;
    onClose: () => void;
    isManager?: boolean;
    onApprove?: () => void;
    onReject?: () => void;
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-border last:border-b-0">
            <div className="w-9 h-9 rounded-xl bg-bg-tertiary border border-border flex items-center justify-center shrink-0 text-text-muted">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-nano font-bold text-text-muted uppercase tracking-widest">{label}</p>
                <div className="text-sm text-text-primary mt-0.5">{children}</div>
            </div>
        </div>
    );
}

export function LeaveRequestDetailModal({
    request,
    onClose,
    isManager = false,
    onApprove,
    onReject,
}: LeaveRequestDetailModalProps) {
    if (!request) return null;

    const status = LEAVE_STATUS_CONFIG[request.status];
    const isPending = request.status === 'pending' || request.status === 'pending_approval' || request.status === 'submitted';
    const coverage = request.teamCoverage;

    return (
        <Modal isOpen={!!request} onClose={onClose} title="Demande de congé" size="md">
            <div className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-xl font-serif italic text-text-primary">
                            {request.userName || request.employeeName || 'Salarié'}
                        </h3>
                        <p className="text-nano font-bold text-text-muted uppercase tracking-widest mt-1">
                            {LEAVE_TYPE_LABELS[request.type] ?? request.type}
                        </p>
                    </div>
                    <span className="text-nano font-bold px-3 py-1 rounded-full bg-bg-tertiary border border-border text-text-primary uppercase tracking-wider shrink-0">
                        {status?.label ?? request.status}
                    </span>
                </div>

                <div className="rounded-2xl border border-border bg-bg-secondary px-4">
                    <DetailRow icon={<CalendarDays className="w-4 h-4" />} label="Période">
                        Du {formatDate(request.startDate)}
                        {request.startPeriod && request.startPeriod !== 'full_day' && (
                            <span className="text-text-muted"> ({PERIOD_LABELS[request.startPeriod]})</span>
                        )}
                        <br />
                        au {formatDate(request.endDate)}
                        {request.endPeriod && request.endPeriod !== 'full_day' && (
                            <span className="text-text-muted"> ({PERIOD_LABELS[request.endPeriod]})</span>
                        )}
                    </DetailRow>

                    <DetailRow icon={<Clock className="w-4 h-4" />} label="Jours ouvrés décomptés">
                        <span className="font-mono font-bold tabular-nums">
                            {request.workingDays} jour{request.workingDays > 1 ? 's' : ''}
                        </span>
                    </DetailRow>

                    {request.reason && (
                        <DetailRow icon={<FileText className="w-4 h-4" />} label="Motif du salarié">
                            {request.reason}
                        </DetailRow>
                    )}

                    {coverage && (
                        <DetailRow icon={<Users className="w-4 h-4" />} label="Couverture de l'équipe">
                            <span className={coverage.compliant ? 'text-status-success' : 'text-status-danger'}>
                                {coverage.percent} % — {coverage.compliant ? 'effectif suffisant' : 'effectif sous le seuil'}
                            </span>
                        </DetailRow>
                    )}

                    <DetailRow icon={<Clock className="w-4 h-4" />} label="Demande déposée le">
                        {formatDateTime(request.submittedAt)}
                    </DetailRow>

                    {request.approvedBy && (
                        <DetailRow
                            icon={<ShieldCheck className="w-4 h-4" />}
                            label={request.status === 'rejected' ? 'Refusée par' : 'Approuvée par'}
                        >
                            {request.approvedBy}
                            <span className="text-text-muted"> · {formatDateTime(request.approvedAt)}</span>
                        </DetailRow>
                    )}

                    {request.rejectionReason && (
                        <DetailRow icon={<XCircle className="w-4 h-4" />} label="Motif du refus">
                            <span className="text-status-danger">
                                {REJECTION_LABELS[request.rejectionReason] ?? request.rejectionReason}
                            </span>
                        </DetailRow>
                    )}
                </div>

                {isManager && isPending && (onApprove || onReject) && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        {onApprove && (
                            <button
                                type="button"
                                onClick={() => { onApprove(); onClose(); }}
                                className="flex-1 min-h-[44px] px-4 py-3 rounded-2xl bg-status-success text-text-on-primary font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Approuver
                            </button>
                        )}
                        {onReject && (
                            <button
                                type="button"
                                onClick={() => { onReject(); onClose(); }}
                                className="flex-1 min-h-[44px] px-4 py-3 rounded-2xl border border-status-danger/30 text-status-danger font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-status-danger/10 transition-colors"
                            >
                                <XCircle className="w-4 h-4" />
                                Refuser
                            </button>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
