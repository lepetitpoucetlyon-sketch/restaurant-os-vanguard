import { motion } from "framer-motion";
import { Shield, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cinematicContainer } from "@/shared/utils/motion";
import { Button } from "@ui/button";
import { cn } from "@/lib/ui.foundations";

export interface StaffAuditEntry {
    id: string;
    timestamp: string | Date;
    userName?: string;
    action: string;
    metadata?: string;
    status: 'success' | 'error' | 'warning';
}

interface StaffAuditLogProps {
    logs: StaffAuditEntry[];
}

export const StaffAuditLog = ({ logs }: StaffAuditLogProps) => {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={cinematicContainer}
            className="bg-[--color-surface-primary] dark:bg-bg-secondary rounded-xl border border-border shadow-sm overflow-hidden"
        >
            <div className="p-8 border-b border-border/50 flex items-center justify-between">
                <h3 className="text-xl font-serif font-semibold text-text-primary tracking-tight flex items-center gap-3">
                    <Shield strokeWidth={1.5} className="w-6 h-6 text-accent" />
                    Journal d&apos;Audit & Sécurité
                </h3>
                <Button variant="ghost" className="text-[11px] font-bold text-text-muted uppercase tracking-widest hover:bg-bg-tertiary">Exporter CSV</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-bg-tertiary/20 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] border-b border-border/50">
                            <th className="px-8 py-5">Date & Heure</th>
                            <th className="px-8 py-5">Utilisateur</th>
                            <th className="px-8 py-5">Action</th>
                            <th className="px-8 py-5">Détails</th>
                            <th className="px-8 py-5">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {logs?.map((log) => (
                            <tr key={log.id} className="group hover:bg-bg-tertiary/20 transition-all duration-300">
                                <td className="px-8 py-5">
                                    <p className="font-mono text-[13px] text-text-primary">{format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm', { locale: fr })}</p>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-xs font-bold text-text-muted">
                                            <UserIcon className="w-4 h-4" />
                                        </div>
                                        <span className="font-serif font-semibold text-text-primary text-[14px]">{log.userName || 'Système'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <p className="font-medium text-text-primary text-[13px]">{log.action}</p>
                                </td>
                                <td className="px-8 py-5">
                                    <p className="text-[12px] text-text-muted font-mono">{log.metadata || '-'}</p>
                                </td>
                                <td className="px-8 py-5">
                                    <span className={cn(
                                        "px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-current/10",
                                        log.status === 'success' ? "bg-success/10 text-success" : "bg-error/10 text-error"
                                    )}>
                                        {log.status === 'success' ? "Succès" : "Échec"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {logs?.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-8 py-10 text-center text-text-muted">
                                    Aucun événement d&apos;audit récent.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};
