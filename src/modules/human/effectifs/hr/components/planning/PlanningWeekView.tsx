"use client";

import React, { useMemo, useState } from 'react';
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, XCircle, ChevronLeft, ChevronRight, Send, Clock } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import type { Shift, User } from '@nexus/contracts';

// ── Legal warning helpers ──────────────────────────────────────────────────

interface LegalWarning {
    level: 'amber' | 'red';
    label: string;
}

function shiftDurationHours(shift: Shift): number {
    const [sh, sm] = shift.startTime.split(':').map(Number);
    const [eh, em] = shift.endTime.split(':').map(Number);
    let diffMin = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMin < 0) diffMin += 24 * 60; // overnight shift
    return diffMin / 60;
}

function shiftStartMs(shift: Shift): number {
    const [h, m] = shift.startTime.split(':').map(Number);
    const d = new Date(shift.date);
    d.setHours(h, m, 0, 0);
    return d.getTime();
}

function shiftEndMs(shift: Shift): number {
    const [h, m] = shift.endTime.split(':').map(Number);
    const d = new Date(shift.date);
    d.setHours(h, m, 0, 0);
    // If end <= start, the shift is overnight — add one day to end
    if (d.getTime() <= shiftStartMs(shift)) {
        d.setDate(d.getDate() + 1);
    }
    return d.getTime();
}

/**
 * Compute legal scheduling warnings for a single shift.
 * allShifts must be the full list (same user, any week) so rest-time is accurate.
 */
function computeShiftWarnings(shift: Shift, allShifts: Shift[]): LegalWarning[] {
    const warnings: LegalWarning[] = [];
    const duration = shiftDurationHours(shift);

    // 1. Duration > 10h → amber "Durée > 10h"
    if (duration > 10) {
        warnings.push({ level: 'amber', label: `Durée > 10h (${duration.toFixed(1)}h)` });
    }

    // 2. Rest before this shift < 11h → amber "Repos < 11h"
    const thisStartMs = shiftStartMs(shift);
    const prevEndTimes = allShifts
        .filter(s => s.userId === shift.userId && s.id !== shift.id)
        .map(s => shiftEndMs(s))
        .filter(t => t < thisStartMs)
        .sort((a, b) => b - a);

    if (prevEndTimes.length > 0) {
        const restH = (thisStartMs - prevEndTimes[0]) / (1000 * 3600);
        if (restH < 11) {
            warnings.push({ level: 'amber', label: `Repos < 11h (${restH.toFixed(1)}h)` });
        }
    }

    // 3. Weekly total > 48h → red "> 48h/semaine"
    const shiftDate = parseISO(shift.date);
    const weekStart = startOfWeek(shiftDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);
    const weeklyH = allShifts
        .filter(s => {
            if (s.userId !== shift.userId) return false;
            const sd = parseISO(s.date);
            return sd >= weekStart && sd < weekEnd;
        })
        .reduce((sum, s) => sum + shiftDurationHours(s), 0);

    if (weeklyH > 48) {
        warnings.push({ level: 'red', label: `> 48h/semaine (${weeklyH.toFixed(0)}h)` });
    }

    return warnings;
}

// ── ShiftCard ────────────────────────────────────────────────────────────────

function ShiftCard({ shift, warnings }: { shift: Shift; warnings: LegalWarning[] }) {
    const duration = shiftDurationHours(shift);
    const dateLabel = format(parseISO(shift.date), 'EEE d MMM', { locale: fr });
    const hasRed = warnings.some(w => w.level === 'red');
    const hasAmber = warnings.some(w => w.level === 'amber');

    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border transition-colors',
                hasRed
                    ? 'border-status-danger/30 bg-status-danger/5'
                    : hasAmber
                    ? 'border-action-primary/30 bg-action-primary/5'
                    : 'border-border bg-bg-secondary'
            )}
        >
            {/* Date + time */}
            <div className="flex items-center gap-2 min-w-[220px]">
                <Clock className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                <span className="text-xs font-medium text-text-primary capitalize">{dateLabel}</span>
                <span className="text-xs text-text-muted">
                    {shift.startTime}–{shift.endTime}
                </span>
                <span className="text-nano text-text-muted/70">({duration.toFixed(1)}h)</span>
            </div>

            {/* Status badge */}
            <span
                className={cn(
                    'text-nano font-bold uppercase tracking-widest px-2 py-0.5 rounded',
                    shift.status === 'published'
                        ? 'bg-status-success/15 text-status-success'
                        : 'bg-text-muted/10 text-text-muted'
                )}
            >
                {shift.status === 'published' ? 'Publié' : 'Brouillon'}
            </span>

            {/* Legal warning badges — visual only, non-blocking */}
            {warnings.map((w, i) => (
                <span
                    key={i}
                    className={cn(
                        'flex items-center gap-1 text-nano font-bold uppercase tracking-widest px-2 py-0.5 rounded',
                        w.level === 'red'
                            ? 'bg-status-danger/15 text-status-danger'
                            : 'bg-action-primary/10 text-amber-600 dark:text-action-primary'
                    )}
                >
                    {w.level === 'red' ? (
                        <XCircle className="w-3 h-3" />
                    ) : (
                        <AlertTriangle className="w-3 h-3" />
                    )}
                    {w.label}
                </span>
            ))}
        </div>
    );
}

// ── PlanningWeekView ─────────────────────────────────────────────────────────

interface PlanningWeekViewProps {
    /** All shifts (any week) — needed for cross-week rest-time check. */
    shifts: Shift[];
    staffMembers: User[];
    onPublish: (ids: string[]) => Promise<void>;
    isPublishing: boolean;
}

export function PlanningWeekView({
    shifts,
    onPublish,
    isPublishing,
}: PlanningWeekViewProps) {
    const [weekOffset, setWeekOffset] = useState(0);

    const weekStart = useMemo(() => {
        const base = startOfWeek(new Date(), { weekStartsOn: 1 });
        return addDays(base, weekOffset * 7);
    }, [weekOffset]);

    const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

    // Shifts in the selected week
    const weekShifts = useMemo(
        () =>
            shifts.filter(s => {
                const d = parseISO(s.date);
                return d >= weekStart && d < weekEnd;
            }),
        [shifts, weekStart, weekEnd]
    );

    // Draft (not-yet-published) IDs
    const draftIds = useMemo(
        () => weekShifts.filter(s => s.status === 'scheduled').map(s => s.id),
        [weekShifts]
    );

    // Group by userId, compute warnings against ALL shifts
    const userRows = useMemo(() => {
        const map = new Map<
            string,
            { userName: string; entries: { shift: Shift; warnings: LegalWarning[] }[] }
        >();

        for (const shift of weekShifts) {
            if (!map.has(shift.userId)) {
                map.set(shift.userId, { userName: shift.userName, entries: [] });
            }
            map.get(shift.userId)!.entries.push({
                shift,
                warnings: computeShiftWarnings(shift, shifts),
            });
        }

        for (const row of map.values()) {
            row.entries.sort(
                (a, b) =>
                    a.shift.date.localeCompare(b.shift.date) ||
                    a.shift.startTime.localeCompare(b.shift.startTime)
            );
        }

        return [...map.values()].sort((a, b) => a.userName.localeCompare(b.userName));
    }, [weekShifts, shifts]);

    const weekLabel = `${format(weekStart, 'd MMM', { locale: fr })} – ${format(
        addDays(weekStart, 6),
        'd MMM yyyy',
        { locale: fr }
    )}`;

    return (
        <div className="bg-bg-secondary border border-border rounded-[2rem] p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    {/* Week navigator */}
                    <div className="flex items-center gap-1 bg-bg-primary border border-border rounded-xl p-1 shadow-sm">
                        <button
                            onClick={() => setWeekOffset(o => o - 1)}
                            className="p-2 rounded-lg hover:bg-bg-secondary text-text-muted hover:text-text-primary transition-colors"
                            aria-label="Semaine précédente"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 text-sm font-serif font-medium text-text-primary min-w-[170px] text-center">
                            {weekLabel}
                        </span>
                        <button
                            onClick={() => setWeekOffset(o => o + 1)}
                            className="p-2 rounded-lg hover:bg-bg-secondary text-text-muted hover:text-text-primary transition-colors"
                            aria-label="Semaine suivante"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    {weekOffset !== 0 && (
                        <button
                            onClick={() => setWeekOffset(0)}
                            className="text-xs text-action-primary hover:underline"
                        >
                            Aujourd'hui
                        </button>
                    )}
                </div>

                {draftIds.length > 0 && (
                    <button
                        onClick={() => void onPublish(draftIds)}
                        disabled={isPublishing}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-action-primary text-text-primary text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow"
                    >
                        <Send className="w-4 h-4" />
                        {isPublishing
                            ? 'Publication…'
                            : `Publier ${draftIds.length} brouillon${draftIds.length > 1 ? 's' : ''}`}
                    </button>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-nano font-bold text-text-muted uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-action-primary" />
                    Avertissement (non bloquant)
                </span>
                <span className="flex items-center gap-1.5">
                    <XCircle className="w-3 h-3 text-status-danger" />
                    Dépassement légal
                </span>
            </div>

            {/* Shift list */}
            {userRows.length === 0 ? (
                <p className="text-sm text-text-muted italic text-center py-10">
                    Aucun shift planifié pour cette semaine.
                </p>
            ) : (
                <div className="space-y-4">
                    {userRows.map(row => (
                        <div key={row.userName} className="border border-border rounded-2xl overflow-hidden">
                            <div className="px-4 py-2.5 bg-bg-primary border-b border-border">
                                <span className="font-serif font-semibold text-sm text-text-primary">
                                    {row.userName}
                                </span>
                            </div>
                            <div className="p-3 space-y-2">
                                {row.entries.map(({ shift, warnings }) => (
                                    <ShiftCard key={shift.id} shift={shift} warnings={warnings} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
