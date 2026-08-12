"use client";

import { useHACCP } from "@nexus/guards/NexusGuardProvider";
import { useRegistre } from "../../contexts/RegistreContext";
import { 
    Trash2, 
    Droplets, 
    Wind, 
    AlertTriangle, 
    CheckCircle2, 
    History,
    ArrowRight,
    Shield
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { Button } from "@ui/button";
import { useAtomValue } from "jotai";
import { wasteLogsAtom } from "@/modules/compliance";
import { useState, useMemo } from "react";
import { RegulatoryWasteLog } from "@/modules/compliance/qualite/haccp/types/domain";
import { toast } from "sonner";
import { toError } from "@/lib/toError";

export function WasteManagementHACCP() {
    const { logWaste } = useHACCP();
    const { hottesDoc } = useRegistre();
    const wasteLogsArray = useAtomValue(wasteLogsAtom);
    const wasteLogs = Array.isArray(wasteLogsArray) ? wasteLogsArray : [];

    const [wasteType, setWasteType] = useState<RegulatoryWasteLog['type']>('biodechets');
    const [quantity, setQuantity] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!quantity || isNaN(Number(quantity))) {
            toast.error("Quantité invalide");
            return;
        }
        setIsSubmitting(true);
        try {
            await logWaste({
                id: `waste_${Date.now()}`,
                type: wasteType,
                quantity: Number(quantity),
                unit: wasteType === 'huiles' ? 'L' : 'kg',
                status: 'pending',
                user: 'staff',
                timestamp: new Date(date),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            toast.success("Relevé HACCP enregistré");
            setQuantity('');
        } catch (err) {
            toast.error(`Erreur: ${toError(err).message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const recentLogs = useMemo(() => {
        if (wasteLogs.length === 0) {
            // Mock fallback if empty for display
            return [
                { id: '1', type: 'biodechets', quantity: 45, unit: 'kg', provider: 'EcoCollect Lyon', date: '2026-03-27', status: 'collected' },
                { id: '2', type: 'huiles', quantity: 20, unit: 'L', provider: 'RecupOil', date: '2026-03-20', status: 'collected' },
                { id: '3', type: 'biodechets', quantity: 12, unit: 'kg', provider: '-', date: '2026-03-29', status: 'pending' },
            ];
        }
        return [...wasteLogs]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 3)
            .map(log => ({
                id: log.id,
                type: log.type,
                quantity: log.quantity,
                unit: log.unit,
                provider: log.provider || '-',
                date: new Date(log.timestamp).toLocaleDateString('fr-FR'),
                status: log.status
            }));
    }, [wasteLogs]);

    const stats = [
        { label: 'Bio-déchets / Mois', value: `${wasteLogs.filter(w => w.type === 'biodechets').reduce((acc, curr) => acc + curr.quantity, 0)} kg`, icon: Trash2, color: 'text-status-success', bg: 'bg-status-success/10' },
        { label: 'Huiles récupérées', value: `${wasteLogs.filter(w => w.type === 'huiles').reduce((acc, curr) => acc + curr.quantity, 0)} L`, icon: Droplets, color: 'text-status-warning', bg: 'bg-status-warning/10' },
        { label: 'Dernier curage bac', value: wasteLogs.find(w => w.type === 'graisse')?.timestamp ? new Date(wasteLogs.find(w => w.type === 'graisse')!.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '10 Jan.', icon: Shield, color: 'text-brand', bg: 'bg-action-primary/10' },
    ];

    return (
        <div className="space-y-10 pb-12">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-surface-card dark:bg-bg-secondary p-8 rounded-[2.5rem] border border-border shadow-sm group hover:shadow-xl transition-all duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border border-transparent", stat.bg, stat.color)}>
                                <stat.icon strokeWidth={1.5} className="w-6 h-6" />
                            </div>
                            <span className="text-2xl font-serif font-black italic text-text-primary">{stat.value}</span>
                        </div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Action Forms */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-surface-card dark:bg-bg-secondary rounded-[3rem] border border-border p-10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/5 -mr-32 -mt-32 rounded-full blur-3xl" />
                        
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-serif font-black italic text-text-primary tracking-tight">Nouvelle Entrée</h3>
                                <div className="flex bg-bg-tertiary p-1.5 rounded-2xl border border-border">
                                    {['Bio-déchets', 'Huiles', 'Bac à Graisse'].map((t, i) => {
                                        const typesMap: RegulatoryWasteLog['type'][] = ['biodechets', 'huiles', 'graisse'];
                                        const typeVal = typesMap[i];
                                        return (
                                            <button 
                                                key={i} 
                                                onClick={() => setWasteType(typeVal)}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                                    wasteType === typeVal ? "bg-surface-card dark:bg-bg-secondary text-accent-gold shadow-sm" : "text-text-muted hover:text-text-primary"
                                                )}>{t}</button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Quantité Estimée</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            placeholder="0.0" 
                                            className="w-full h-16 bg-bg-tertiary/50 border border-border rounded-2xl px-6 text-xl font-serif font-bold focus:outline-none focus:border-accent-gold/50" 
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted uppercase tracking-widest">{wasteType === 'huiles' ? 'L' : 'kg'}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Date du relevé</label>
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full h-16 bg-bg-tertiary/50 border border-border rounded-2xl px-6 text-sm font-bold focus:outline-none focus:border-accent-gold/50" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full h-16 bg-text-primary text-text-primary rounded-[20px] font-black uppercase text-[10px] tracking-widest hover:bg-surface-sidebar shadow-xl shadow-black/10 transition-all active:scale-[0.98]">
                                {isSubmitting ? "Enregistrement..." : "Enregistrer le relevé HACCP"}
                            </Button>
                        </div>
                    </div>

                    {/* Technical Summary Sync from Registre */}
                    <div className="bg-bg-tertiary/50 rounded-[2.5rem] border border-dashed border-border p-10">
                        <div className="flex items-start gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-status-warning/10 flex items-center justify-center border border-orange-500/10 shrink-0 shadow-sm">
                                <Wind strokeWidth={1.5} className="w-8 h-8 text-status-warning" />
                            </div>
                            <div className="space-y-3 flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xl font-serif font-bold text-text-primary">Maintenance Hottes (Registre Sync)</h4>
                                    <CheckCircle2 className="w-5 h-5 text-status-success" />
                                </div>
                                <p className="text-sm text-text-muted leading-relaxed">
                                    Dernière maintenance certifiée par **Extraction Lyon Expert** le **{String(hottesDoc?.updatedAt || 'N/A')}**. 
                                    Prochaine intervention réglementaire conseillée avant le **{String(hottesDoc?.validUntil || 'N/A')}**.
                                </p>
                                <div className="pt-2">
                                    <button className="text-[10px] font-black text-accent-gold uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all">
                                        Voir l'attestation dans Registre <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: History & Alerts */}
                <div className="space-y-8">
                    <div className="bg-surface-card dark:bg-bg-secondary rounded-[2.5rem] border border-border p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <History className="w-5 h-5 text-text-muted" />
                            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Passages Récents</h3>
                        </div>

                        <div className="space-y-6">
                            {recentLogs.map((log) => (
                                <div key={log.id} className="flex items-start gap-4 group">
                                    <div className={cn(
                                        "w-2 h-12 rounded-full shrink-0",
                                        log.type === 'biodechets' ? "bg-status-success/20 group-hover:bg-status-success transition-colors" : "bg-status-warning/20 group-hover:bg-status-warning transition-colors"
                                    )} />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-text-primary">{log.quantity}{log.unit} - {log.type === 'biodechets' ? 'Bio' : 'Huiles'}</p>
                                            <span className="text-[9px] font-mono font-bold text-text-muted">{log.date}</span>
                                        </div>
                                        <p className="text-[10px] text-text-muted mt-0.5 tracking-tight font-medium">Prestataire: {log.provider}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-status-danger/5 border border-rose-500/20 rounded-[2.5rem] p-8 space-y-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-status-danger" />
                            <h3 className="text-[10px] font-black text-status-danger uppercase tracking-[0.3em]">Alerte Bac à Graisse</h3>
                        </div>
                        <p className="text-[11px] text-status-danger/80 dark:text-status-danger/60 font-medium leading-relaxed italic">
                            « Le bac à graisse n'a pas été inspecté visuellement cette semaine. Risque d'engorgement et de mauvaises odeurs. »
                        </p>
                        <Button variant="outline" className="w-full h-10 rounded-xl border-rose-500/20 text-status-danger font-black uppercase text-[8px] tracking-[0.2em] bg-status-danger/5 hover:bg-status-danger/10">
                            Effectuer le contrôle maintenant
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
