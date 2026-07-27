"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Copy, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useAuth } from "@/shared/hooks";
import { toast } from "sonner";
import type { UserRole } from "@nexus/contracts";

const ROLES: { value: UserRole; label: string }[] = [
    { value: "server", label: "Serveur(se)" },
    { value: "bartender", label: "Barman / Barmaid" },
    { value: "kitchen_chef", label: "Chef de cuisine" },
    { value: "kitchen_line", label: "Commis de cuisine" },
    { value: "host", label: "Hôte(sse) d'accueil" },
    { value: "cashier", label: "Caissier(ère)" },
    { value: "floor_manager", label: "Resp. de salle" },
    { value: "manager", label: "Directeur" },
    { value: "admin", label: "Administrateur" },
];

function generatePin(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
}

interface QuickAddStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = "form" | "reveal";

export function QuickAddStaffModal({ isOpen, onClose }: QuickAddStaffModalProps) {
    const { addUser, logAction } = useAuth();
    const [step, setStep] = useState<Step>("form");
    const [name, setName] = useState("");
    const [role, setRole] = useState<UserRole>("server");
    const [isSaving, setIsSaving] = useState(false);
    const [createdPin, setCreatedPin] = useState("");
    const [createdName, setCreatedName] = useState("");
    const [copied, setCopied] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) { toast.error("Le nom est requis"); return; }
        setIsSaving(true);
        const pin = generatePin();
        try {
            await addUser?.({
                name: name.trim(),
                role,
                pin,
                avatar: "",
                hourlyRate: 15,
                performanceScore: 5.0,
                accessLevel: 3,
            });
            await logAction?.("create_employee", { name: name.trim(), quickAdd: true });
            setCreatedPin(pin);
            setCreatedName(name.trim());
            setStep("reveal");
        } catch {
            toast.error("Impossible de créer le collaborateur");
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setStep("form");
        setName("");
        setRole("server");
        setCreatedPin("");
        setCreatedName("");
        setCopied(false);
        onClose();
    };

    const copyPin = async () => {
        await navigator.clipboard.writeText(createdPin).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="qa-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-8 sm:pb-0"
                onClick={(e) => { if (e.target === e.currentTarget && step !== "reveal") handleClose(); }}
            >
                <motion.div
                    key="qa-card"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                    className="bg-surface-card border border-border rounded-t-[2rem] sm:rounded-[2rem] p-6 w-full sm:w-[420px] shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-accent-gold/10 flex items-center justify-center">
                                <UserPlus className="w-4 h-4 text-accent-gold" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">
                                    {step === "form" ? "Ajout rapide" : "Collaborateur créé"}
                                </h3>
                                <p className="text-[10px] text-text-muted uppercase tracking-wider">
                                    {step === "form" ? "Nom + rôle en 10 secondes" : "Transmettez le PIN ci-dessous"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {step === "form" ? (
                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-2">
                                    Prénom & Nom
                                </label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                    placeholder="Ex : Marie Dupont"
                                    className="w-full h-12 rounded-2xl border border-border bg-bg-primary px-4 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-gold/50 transition-colors"
                                />
                            </div>

                            {/* Role */}
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-2">
                                    Rôle
                                </label>
                                <div className="relative">
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as UserRole)}
                                        className="w-full h-12 rounded-2xl border border-border bg-bg-primary px-4 text-sm text-text-primary appearance-none focus:outline-none focus:border-accent-gold/50 transition-colors"
                                    >
                                        {ROLES.map(r => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                                </div>
                            </div>

                            <p className="text-[9px] text-text-muted leading-relaxed">
                                Un PIN à 4 chiffres sera généré automatiquement. Vous pourrez le transmettre au collaborateur à l&apos;étape suivante.
                            </p>

                            <button
                                onClick={handleCreate}
                                disabled={isSaving || !name.trim()}
                                className="w-full h-12 rounded-2xl bg-accent-gold text-white text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-accent-gold/90 active:scale-98 transition-all disabled:opacity-40"
                            >
                                {isSaving ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4" />
                                        Créer le collaborateur
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        /* PIN reveal step */
                        <div className="space-y-5">
                            <div className="rounded-2xl bg-bg-tertiary/50 border border-border/50 p-5 text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">
                                    PIN de {createdName}
                                </p>
                                <div className="flex items-center justify-center gap-3 mb-4">
                                    {createdPin.split("").map((digit, i) => (
                                        <div
                                            key={i}
                                            className="w-14 h-16 rounded-2xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-3xl font-mono font-black text-accent-gold"
                                        >
                                            {digit}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={copyPin}
                                    className={cn(
                                        "flex items-center gap-2 mx-auto px-4 h-8 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                                        copied
                                            ? "bg-status-success/10 text-status-success border border-status-success/20"
                                            : "bg-bg-primary border border-border text-text-muted hover:text-text-primary"
                                    )}
                                >
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    {copied ? "Copié !" : "Copier le PIN"}
                                </button>
                            </div>

                            <div className="rounded-2xl bg-bg-primary border border-border/40 p-4 space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Lien de première connexion</p>
                                <p className="text-[10px] font-mono text-accent-gold/80 break-all">
                                    /welcome-staff?pin={createdPin}&amp;name={encodeURIComponent(createdName)}
                                </p>
                                <p className="text-[9px] text-text-muted mt-1">
                                    Transmettez ce lien + PIN par SMS ou en personne. Le collaborateur pourra changer son PIN à la première connexion.
                                </p>
                            </div>

                            <button
                                onClick={handleClose}
                                className="w-full h-12 rounded-2xl bg-text-primary text-bg-primary text-[12px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity dark:bg-accent-gold dark:text-white"
                            >
                                Terminé
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
