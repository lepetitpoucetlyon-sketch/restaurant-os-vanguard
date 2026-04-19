"use client";

import { useState } from "react";
import {
    ShieldCheck,
    Truck,
    Thermometer,
    Scale,
    Eye,
    Camera,
    XOctagon,
    CheckCircle2,
    PackageCheck,
    AlertTriangle,
    ChevronDown,
    Search,
    Calendar,
    FileSpreadsheet,
    Stamp,
    PenTool
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui.foundations";;

const getDeliverySlipNumber = (deliveryId: string) =>
    deliveryId.replace(/\D+/g, "").slice(-4).padStart(4, "0");
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/context/NotificationsContext";
import { useInventory } from "@/engines/ops/NexusOpsProvider"; // To fetch supplier orders
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

import { useQuality } from "@/engines/ops/NexusOpsProvider";
import { QualityEngine } from "@/domain/services/QualityEngine";

// Removed MOCK_DELIVERIES

export default function QualityControlPage() {
    const { deliveries, isLoading } = useQuality();
    const [activeTab, setActiveTab] = useState<'reception' | 'history'>('reception');
    const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
    const { addNotification } = useNotifications();
    const { showToast } = useToast();

    // Find current selected delivery object
    const selectedDelivery = deliveries.find(d => d.id === selectedDeliveryId);

    // Control Steps State
    const [step, setStep] = useState(1);
    const [controlData, setControlData] = useState({
        truckTemp: "",
        hygiene: "clean",
        itemsChecked: [] as any[],
        rejectedItems: [] as any[]
    });

    const handleValidControl = async () => {
        if (!selectedDelivery) return;

        try {
            await QualityEngine.validateReception({
                deliveryId: selectedDelivery.id,
                supplierName: selectedDelivery.supplierId,
                truckTemp: parseFloat(controlData.truckTemp) || 0,
                hygieneStatus: controlData.hygiene,
                itemsChecked: controlData.itemsChecked.map(item => ({
                    id: item.id,
                    name: item.name,
                    status: item.status || 'ok',
                    temp: item.temp,
                    quantity: item.quantity
                })),
                validatedBy: "Chef de Cuisine" // In production, this would be the logged-in user
            });

            showToast("Réception validée et stockée", "success");
            setSelectedDeliveryId(null);
            setStep(1);
            addNotification({
                title: "Réception Validée",
                message: `La commande ${selectedDelivery.supplierId} a été intégrée au stock.`,
                type: "success"
            });
        } catch (error) {
            showToast("Erreur lors de la validation", "error");
            console.error(error);
        }
    };

    return (
        <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 flex-col bg-bg-primary overflow-hidden pb-20 md:pb-0">
            {/* Header */}
            <div className="bg-bg-secondary px-10 pt-10 pb-6 flex justify-between items-end border-b border-border shadow-sm">
                <div>
                    <h1 className="text-4xl font-serif font-black italic text-text-primary tracking-tighter">Contrôle Réception<span className="text-accent-gold not-italic">.</span></h1>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] mt-2 italic">Qualité Fournisseur • Traçabilité • Agréage</p>
                </div>

                <div className="flex gap-4">
                    <div className="text-right px-6 py-2 bg-bg-tertiary rounded-xl border border-border">
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Taux de Rejet (Mois)</p>
                        <p className="text-xl font-mono font-bold text-error">1.8%</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Tabs */}
            <div className="bg-white dark:bg-bg-secondary border-b border-border px-10 shadow-soft relative z-10 flex justify-between items-center">
                <div className="flex gap-12">
                    {[
                        { id: 'reception', label: 'Quai de Réception', icon: Truck },
                        { id: 'history', label: 'Historique Contrôles', icon: FileSpreadsheet },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-2.5 py-6 relative font-black text-[10px] uppercase tracking-[0.25em] transition-all",
                                    active ? "text-accent-gold" : "text-text-muted hover:text-text-primary"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", active ? "text-accent-gold" : "text-text-muted")} strokeWidth={active ? 2 : 1.5} />
                                {tab.label}
                                {active && (
                                    <motion.div
                                        layoutId="activeTabQuality"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-gold shadow-glow"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8 lg:p-12">
                <AnimatePresence mode="wait">
                    {activeTab === 'reception' && (
                        <motion.div
                            key="reception"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full"
                        >
                            {/* Left: Pending Deliveries */}
                            <div className="lg:col-span-1 space-y-6">
                                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] px-2 flex items-center gap-3">
                                    <ClockIcon className="w-3 h-3" />
                                    Attendu Aujourd'hui
                                </h3>

                                <div className="space-y-4">
                                    {deliveries.map(del => (
                                        <div
                                            key={del.id}
                                            onClick={() => setSelectedDeliveryId(del.id)}
                                            className={cn(
                                                "p-6 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden",
                                                selectedDeliveryId === del.id
                                                    ? "bg-accent-gold text-white border-transparent shadow-xl shadow-accent-gold/20"
                                                    : "bg-white dark:bg-bg-secondary border-border hover:border-accent-gold/40 hover:translate-x-1"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm font-serif font-black",
                                                        selectedDeliveryId === del.id ? "bg-white/20 text-white" : "bg-bg-tertiary text-text-primary"
                                                    )}>
                                                        {(del.supplierId || '?').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm tracking-tight">{del.supplierId || 'Fournisseur'}</h4>
                                                        <p className={cn("text-[9px] font-mono", selectedDeliveryId === del.id ? "text-white/70" : "text-text-muted")}>BL-{getDeliverySlipNumber(del.id)}</p>
                                                    </div>
                                                </div>
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                    del.status === 'delivered' ? "bg-success text-white" : selectedDeliveryId === del.id ? "bg-white/20 text-white" : "bg-bg-tertiary text-text-muted"
                                                )}>
                                                    {del.deliveryDate ? new Date(del.deliveryDate).toLocaleTimeString([], {hour: '2h', minute:'2h'}) : 'Attendue'}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between mt-4 pl-1">
                                                <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider">
                                                    <PackageCheck className="w-3.5 h-3.5" />
                                                    {del.items.length} articles
                                                </div>
                                                {del.status === 'delivered' && (
                                                    <div className="flex items-center gap-1.5 text-success">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Control Protocol */}
                            <div className="lg:col-span-2 relative">
                                {!selectedDelivery ? (
                                    <div className="h-[60vh] flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-border rounded-[3rem]">
                                        <Truck className="w-24 h-24 mb-6 text-text-muted" strokeWidth={1} />
                                        <h3 className="text-xl font-serif font-bold text-text-primary">Sélectionnez une livraison</h3>
                                        <p className="text-sm text-text-muted mt-2">Commencez le protocole de réception HACCP</p>
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-bg-secondary border border-border rounded-[3rem] p-10 h-full shadow-2xl relative overflow-hidden flex flex-col">
                                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent-gold via-accent-gold/50 to-bg-tertiary" />

                                        <div className="flex justify-between items-center mb-10 pb-6 border-b border-border">
                                            <div>
                                                <h2 className="text-3xl font-serif font-black italic">Protocole d&apos;Agréage</h2>
                                                <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em] mt-2">Delivery ID: {selectedDeliveryId}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {[1, 2, 3].map(s => (
                                                    <div key={s} className={cn("w-3 h-3 rounded-full transition-all", step >= s ? "bg-accent-gold" : "bg-bg-tertiary")} />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto pr-4">
                                            {step === 1 && (
                                                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                                    <div className="grid grid-cols-2 gap-8">
                                                        <div className="p-6 rounded-[2rem] bg-bg-tertiary/30 border border-border hover:border-accent-gold transition-colors group">
                                                            <div className="flex items-center gap-4 mb-4">
                                                                <div className="w-10 h-10 rounded-full bg-accent-gold/10 text-accent-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                    <Thermometer className="w-5 h-5" />
                                                                </div>
                                                                <h4 className="font-bold uppercase text-[11px] tracking-widest">Température Camion</h4>
                                                            </div>
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    placeholder="0.0"
                                                                    className="w-full bg-transparent text-4xl font-serif italic font-black border-b-2 border-border focus:border-accent-gold outline-none py-2 transition-colors placeholder:text-text-muted/20"
                                                                />
                                                                <span className="absolute right-0 bottom-4 text-xs font-black text-text-muted">°C</span>
                                                            </div>
                                                        </div>

                                                        <div className="p-6 rounded-[2rem] bg-bg-tertiary/30 border border-border hover:border-accent-gold transition-colors group">
                                                            <div className="flex items-center gap-4 mb-4">
                                                                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                    <Eye className="w-5 h-5" />
                                                                </div>
                                                                <h4 className="font-bold uppercase text-[11px] tracking-widest">Hygiène Véhicule</h4>
                                                            </div>
                                                            <div className="flex gap-2 mt-4">
                                                                {['Propre', 'Acceptable', 'Sale'].map(status => (
                                                                    <button
                                                                        key={status}
                                                                        className="flex-1 py-3 rounded-xl border border-border text-[10px] font-black uppercase tracking-wider hover:bg-white dark:hover:bg-white/5 transition-all focus:bg-accent-gold focus:text-white focus:border-transparent"
                                                                    >
                                                                        {status}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-8 rounded-[2rem] bg-neutral-50 dark:bg-white/5 border border-dashed border-border flex flex-col items-center justify-center text-center gap-4 group cursor-pointer hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                                                        <Camera className="w-8 h-8 text-text-muted group-hover:text-accent-gold transition-colors" />
                                                        <div>
                                                            <p className="font-bold text-sm">Photo du BL / Camion</p>
                                                            <p className="text-xs text-text-muted mt-1">Cliquez pour capturer</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {step === 2 && (
                                                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                                                    <h3 className="text-lg font-bold font-serif italic">Contrôle Quantitatif & Qualitatif</h3>
                                                    <div className="space-y-3">
                                                        {[
                                                            { name: 'Filet de Bœuf', qty: '5.2 kg', temp: '3.1°C', status: 'ok' },
                                                            { name: 'Saumon Label Rouge', qty: '3.0 kg', temp: '2.4°C', status: 'ok' },
                                                            { name: 'Crème 35%', qty: '6 L', temp: '4.0°C', status: 'warning' },
                                                        ].map((item, i) => (
                                                            <div key={i} className="flex items-center justify-between p-4 bg-bg-tertiary/20 rounded-2xl border border-border">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={cn("w-2 h-2 rounded-full", item.status === 'ok' ? "bg-success" : "bg-warning")} />
                                                                    <span className="font-bold text-sm">{item.name}</span>
                                                                </div>
                                                                <div className="flex gap-6 text-sm font-mono text-text-muted">
                                                                    <span>{item.qty}</span>
                                                                    <span>{item.temp}</span>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-success/10 text-success hover:bg-success hover:text-white"><CheckCircle2 className="w-4 h-4" /></Button>
                                                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-error/10 text-error hover:bg-error hover:text-white"><XOctagon className="w-4 h-4" /></Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-border flex justify-end gap-4">
                                            {step > 1 && (
                                                <Button variant="ghost" onClick={() => setStep(s => s - 1)}>Retour</Button>
                                            )}
                                            <Button
                                                onClick={() => step < 2 ? setStep(s => s + 1) : handleValidControl()}
                                                className="bg-accent-gold text-white hover:bg-accent-gold/90 px-8 rounded-xl font-black uppercase tracking-widest text-[10px]"
                                            >
                                                {step < 2 ? "Continuer" : "Valider la Réception"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
