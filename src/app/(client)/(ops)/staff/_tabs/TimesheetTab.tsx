"use client";

import type { User } from "@nexus/contracts";
import type { ShiftLog } from "@/modules/human/effectifs/hr/types";
import { BadgeControl } from "@/modules/human/effectifs/hr/components/staff/BadgeControl";

interface TimesheetTabProps {
    visibleShiftLogs: ShiftLog[];
    isManager: boolean;
    staffMembers: User[];
}

export function TimesheetTab({ visibleShiftLogs, isManager, staffMembers }: TimesheetTabProps) {
    return (
        <section className="space-y-6">
            <BadgeControl />

            <div className="rounded-2xl border border-border overflow-hidden bg-surface-card">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-text-primary">Historique des pointages</h2>
                        <p className="text-xs text-text-muted mt-0.5">
                            {isManager ? "Vue équipe complète" : "Vos derniers pointages"} — 30 dernières entrées
                        </p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                        {visibleShiftLogs.length} entrée{visibleShiftLogs.length !== 1 ? "s" : ""}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-surface-sidebar text-text-muted text-left">
                            <tr>
                                <th className="px-4 py-2.5 font-medium">Horodatage</th>
                                <th className="px-4 py-2.5 font-medium">Action</th>
                                {isManager && <th className="px-4 py-2.5 font-medium">Employé</th>}
                                <th className="px-4 py-2.5 font-medium">Shift ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleShiftLogs.map(log => {
                                const employee = staffMembers.find(u => u.id === log.performedBy);
                                return (
                                    <tr key={log.id} className="border-t border-border hover:bg-surface-hover">
                                        <td className="px-4 py-2.5 tabular-nums text-text-muted">
                                            {new Date(log.timestamp).toLocaleString("fr-FR")}
                                        </td>
                                        <td className="px-4 py-2.5 font-medium">
                                            <span className={
                                                log.action === "clock_in"
                                                    ? "text-status-success"
                                                    : log.action === "clock_out"
                                                    ? "text-orange-500"
                                                    : "text-text-primary"
                                            }>
                                                {log.action === "clock_in" ? "Prise de service"
                                                    : log.action === "clock_out" ? "Fin de service"
                                                    : log.action}
                                            </span>
                                        </td>
                                        {isManager && (
                                            <td className="px-4 py-2.5 text-text-muted">
                                                {employee?.displayName ?? employee?.email ?? log.performedBy}
                                            </td>
                                        )}
                                        <td className="px-4 py-2.5 font-mono text-[10px] text-text-muted truncate max-w-[160px]">
                                            {log.shiftId}
                                        </td>
                                    </tr>
                                );
                            })}
                            {visibleShiftLogs.length === 0 && (
                                <tr>
                                    <td colSpan={isManager ? 4 : 3} className="px-4 py-8 text-center text-text-muted italic">
                                        Aucun pointage enregistré.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
