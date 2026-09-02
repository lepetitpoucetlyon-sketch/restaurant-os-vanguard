'use client';

import { CheckSquare, Square } from 'lucide-react';
import { ZONES, DAYS, taskKey, type CleaningRecord } from './cleaningPlanConstants';

interface CleaningGridTableProps {
    weekDates: string[];
    records: CleaningRecord[];
    isChecked: (zone: string, dayIdx: number, task: string) => boolean;
    handleCellClick: (zone: string, dayIdx: number, task: string) => void;
}

export function CleaningGridTable({
    weekDates,
    records,
    isChecked,
    handleCellClick,
}: CleaningGridTableProps) {
    return (
        <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs border-collapse min-w-[45rem]">
                <thead>
                    <tr className="bg-surface-glass">
                        <th className="px-3 py-2 text-left text-text-muted font-medium border-b border-border w-40">Zone / Tâche</th>
                        {DAYS.map((day, i) => (
                            <th key={day} className="px-2 py-2 text-center text-text-muted font-medium border-b border-border">
                                <div>{day}</div>
                                <div className="text-nano text-text-disabled mt-0.5">
                                    {new Date(weekDates[i]).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {ZONES.map((zone) => {
                        const ZoneIcon = zone.icon;
                        return (
                            <tbody key={`zone-tbody-${zone.id}`}>
                                <tr key={`zone-${zone.id}`} className="bg-surface-base">
                                    <td colSpan={8} className="px-3 py-1.5 border-b border-border">
                                        <div className="flex items-center gap-2 font-semibold text-text-primary">
                                            <ZoneIcon className="w-3.5 h-3.5 text-action-primary" />
                                            {zone.label}
                                        </div>
                                    </td>
                                </tr>
                                {zone.tasks.map((task) => (
                                    <tr key={`${zone.id}-${task}`} className="hover:bg-surface-glass transition-colors border-b border-border/50">
                                        <td className="px-3 py-2 text-text-muted pl-7">{task}</td>
                                        {DAYS.map((_, dayIdx) => {
                                            const checked = isChecked(zone.id, dayIdx, task);
                                            const rec = records.find(
                                                r => r.zone === zone.id && r.date === weekDates[dayIdx] && r.taskKey === taskKey(zone.id, dayIdx, task)
                                            );
                                            return (
                                                <td key={dayIdx} className="px-2 py-2 text-center">
                                                    {checked ? (
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            <CheckSquare className="w-4 h-4 text-status-success mx-auto" />
                                                            {rec && (
                                                                <span className="text-nano text-text-muted leading-tight">{rec.signedByName.split(' ')[0]}</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleCellClick(zone.id, dayIdx, task)}
                                                            className="hover:text-action-primary transition-colors"
                                                            title="Cocher et signer"
                                                        >
                                                            <Square className="w-4 h-4 text-text-disabled mx-auto" />
                                                        </button>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
