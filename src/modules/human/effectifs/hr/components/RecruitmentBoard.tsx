"use client";

import { useState, useCallback } from "react";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    useDraggable,
    useDroppable,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Plus, GripVertical, Calendar, Briefcase, UserPlus, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRecruitment } from "../hooks/useRecruitment";
import { CandidateModal } from '.';
import type { Candidate, CandidateStatus } from "@nexus/contracts";
import { cn } from "@/lib/ui.foundations";

// ─── Column config ───────────────────────────────────────────────────────────

const COLUMNS: {
    id: CandidateStatus;
    label: string;
    accent: string;
    border: string;
}[] = [
    { id: "new",       label: "Candidatures",  accent: "text-blue-400",    border: "border-blue-800/40" },
    { id: "interview", label: "Entretien",      accent: "text-purple-400",  border: "border-purple-800/40" },
    { id: "trial",     label: "Test pratique",  accent: "text-action-primary",   border: "border-amber-800/40" },
    { id: "offer",     label: "Offre",          accent: "text-sky-400",     border: "border-sky-800/40" },
    { id: "hired",     label: "Embauché",       accent: "text-status-success", border: "border-emerald-800/40" },
    { id: "refused",   label: "Refusé",         accent: "text-rose-400",    border: "border-rose-800/40" },
];

// ─── Draggable card ──────────────────────────────────────────────────────────

interface CandidateCardProps {
    candidate: Candidate;
    onEdit: (c: Candidate) => void;
    onHire?: (c: Candidate) => void;
    overlay?: boolean;
}

function CandidateCard({ candidate, onEdit, onHire, overlay }: CandidateCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: candidate.id,
        data: { candidate },
    });

    const style = overlay
        ? {}
        : { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.35 : 1 };

    return (
        <div
            ref={overlay ? undefined : setNodeRef}
            style={style}
            className={cn(
                "bg-bg-secondary border border-border rounded-2xl p-4 space-y-3 select-none shadow-sm transition-all",
                !overlay && "hover:shadow-md hover:border-accent/30"
            )}
        >
            <div className="flex items-start gap-2">
                {/* drag handle */}
                {!overlay && (
                    <button
                        {...listeners}
                        {...attributes}
                        className="mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing text-text-muted/30 hover:text-text-muted transition-colors"
                        aria-label="Déplacer"
                    >
                        <GripVertical className="w-4 h-4" />
                    </button>
                )}
                <div className="flex-1 min-w-0">
                    <button
                        onClick={() => onEdit(candidate)}
                        className="font-serif font-bold text-text-primary text-sm hover:text-accent transition-colors text-left w-full truncate block"
                    >
                        {candidate.firstName} {candidate.lastName}
                    </button>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-text-muted">
                        <Briefcase className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate uppercase font-bold tracking-wider">
                            {candidate.appliedRole}
                        </span>
                    </div>
                </div>
            </div>

            {candidate.notes && (
                <p className="text-[11px] text-text-muted/70 leading-relaxed line-clamp-2 pl-6">
                    {candidate.notes}
                </p>
            )}

            <div className="flex items-center justify-between pl-6 pt-1 border-t border-border/40">
                <div className="flex items-center gap-1 text-[10px] text-text-muted/50">
                    <Calendar className="w-3 h-3" />
                    <span>
                        {format(new Date(candidate.createdAt || Date.now()), "dd MMM", { locale: fr })}
                    </span>
                </div>
                {onHire && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onHire(candidate); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/50 hover:bg-emerald-700/60 text-emerald-300 text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                        <UserPlus className="w-3 h-3" />
                        Créer fiche
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Droppable column ────────────────────────────────────────────────────────

interface KanbanColumnProps {
    id: CandidateStatus;
    label: string;
    accent: string;
    border: string;
    candidates: Candidate[];
    onEdit: (c: Candidate) => void;
    onHireCandidate?: (c: Candidate) => void;
    onAddNew?: () => void;
}

function KanbanColumn({
    id,
    label,
    accent,
    border,
    candidates,
    onEdit,
    onHireCandidate,
    onAddNew,
}: KanbanColumnProps) {
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col w-[240px] flex-shrink-0">
            {/* Header */}
            <div className={cn("flex items-center justify-between mb-3 pb-3 border-b", border)}>
                <div className="flex items-center gap-2">
                    <span className={cn("text-chip-label", accent)}>
                        {label}
                    </span>
                    <span className={cn(
                        "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-bg-tertiary",
                        accent
                    )}>
                        {candidates.length}
                    </span>
                </div>
                {onAddNew && (
                    <button
                        onClick={onAddNew}
                        className="w-6 h-6 rounded-lg bg-bg-tertiary hover:bg-accent/20 flex items-center justify-center text-text-muted hover:text-accent transition-all"
                        aria-label="Ajouter candidat"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Drop zone */}
            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 space-y-3 rounded-2xl p-2 min-h-[120px] transition-colors duration-200",
                    isOver ? "bg-accent/5 ring-1 ring-accent/20" : "bg-transparent"
                )}
            >
                {candidates.map((c) => (
                    <CandidateCard
                        key={c.id}
                        candidate={c}
                        onEdit={onEdit}
                        onHire={id === "hired" ? onHireCandidate : undefined}
                    />
                ))}
                {candidates.length === 0 && (
                    <div className="flex flex-col items-center justify-center min-h-[80px] text-text-muted/20 gap-2">
                        <FileText className="w-6 h-6" strokeWidth={1} />
                        <span className="text-[9px] uppercase tracking-widest font-bold">Vide</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main board ──────────────────────────────────────────────────────────────

export interface RecruitmentBoardProps {
    /** Called when the user clicks "Créer fiche" on a hired candidate */
    onHireCandidate?: (candidate: Candidate) => void;
}

export function RecruitmentBoard({ onHireCandidate }: RecruitmentBoardProps) {
    const { candidates, updateCandidateStatus } = useRecruitment();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const getCandidateById = useCallback(
        (id: string) => candidates.find((c) => c.id === id) ?? null,
        [candidates]
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    }, []);

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            setActiveId(null);
            const { active, over } = event;
            if (!over) return;

            const newStatus = over.id as CandidateStatus;
            const validStatuses = COLUMNS.map((c) => c.id) as string[];
            if (!validStatuses.includes(newStatus)) return;

            const candidate = getCandidateById(String(active.id));
            if (!candidate || candidate.status === newStatus) return;

            try {
                await updateCandidateStatus(candidate.id, newStatus);
                const colLabel = COLUMNS.find((c) => c.id === newStatus)?.label ?? newStatus;
                toast.success(`${candidate.firstName} déplacé(e) vers "${colLabel}"`);
            } catch {
                toast.error("Erreur lors du déplacement");
            }
        },
        [getCandidateById, updateCandidateStatus]
    );

    const openModal = useCallback((candidate?: Candidate) => {
        setEditingCandidate(candidate ?? null);
        setIsCandidateModalOpen(true);
    }, []);

    const activeCandidate = activeId ? getCandidateById(activeId) : null;

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-serif font-semibold text-text-primary">
                    Pipeline Recrutement
                </h3>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-action-primary text-text-primary text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity shadow"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Nouveau candidat
                </button>
            </div>

            {/* Kanban */}
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {COLUMNS.map((col) => {
                        const colCandidates = candidates.filter((c) => c.status === col.id);
                        return (
                            <KanbanColumn
                                key={col.id}
                                id={col.id}
                                label={col.label}
                                accent={col.accent}
                                border={col.border}
                                candidates={colCandidates}
                                onEdit={openModal}
                                onHireCandidate={onHireCandidate}
                                onAddNew={col.id === "new" ? () => openModal() : undefined}
                            />
                        );
                    })}
                </div>

                <DragOverlay>
                    {activeCandidate ? (
                        <CandidateCard
                            candidate={activeCandidate}
                            onEdit={() => {}}
                            overlay
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Candidate modal */}
            <CandidateModal
                isOpen={isCandidateModalOpen}
                onClose={() => setIsCandidateModalOpen(false)}
                candidate={editingCandidate}
            />
        </div>
    );
}
