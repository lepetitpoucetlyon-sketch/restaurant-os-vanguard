"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Eye, EyeOff, Lock, ArrowRight, UtensilsCrossed, ChefHat, GlassWater, Coffee } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useAuth } from "@/shared/hooks";
import { toast } from "sonner";
import type { UserRole } from "@nexus/contracts";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

// ── Role configuration ────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; icon: typeof UtensilsCrossed; color: string; homeRoute: string; description: string }> = {
    server: {
        label: "Serveur(se)",
        icon: UtensilsCrossed,
        color: "text-blue-400",
        homeRoute: "/pos",
        description: "Prise de commandes, service en salle, encaissement.",
    },
    bartender: {
        label: "Barman / Barmaid",
        icon: GlassWater,
        color: "text-cyan-400",
        homeRoute: "/pos",
        description: "Préparation des boissons, service au bar.",
    },
    kitchen_chef: {
        label: "Chef de cuisine",
        icon: ChefHat,
        color: "text-orange-400",
        homeRoute: "/kds",
        description: "Supervision de la cuisine, validation des commandes.",
    },
    kitchen_line: {
        label: "Commis de cuisine",
        icon: ChefHat,
        color: "text-action-primary",
        homeRoute: "/kds",
        description: "Préparation des plats sur le KDS.",
    },
    host: {
        label: "Hôte(sse) d'accueil",
        icon: UtensilsCrossed,
        color: "text-purple-400",
        homeRoute: "/reservations",
        description: "Accueil des clients, gestion des réservations.",
    },
    cashier: {
        label: "Caissier(ère)",
        icon: Coffee,
        color: "text-green-400",
        homeRoute: "/pos",
        description: "Encaissements, gestion de la caisse.",
    },
    floor_manager: {
        label: "Responsable de salle",
        icon: UtensilsCrossed,
        color: "text-indigo-400",
        homeRoute: "/operations",
        description: "Coordination de l'équipe de salle.",
    },
    manager: {
        label: "Directeur",
        icon: UtensilsCrossed,
        color: "text-accent-gold",
        homeRoute: "/operations",
        description: "Pilotage opérationnel de l'établissement.",
    },
    admin: {
        label: "Administrateur",
        icon: UtensilsCrossed,
        color: "text-accent-gold",
        homeRoute: "/admin",
        description: "Accès complet à toutes les fonctionnalités.",
    },
};

// ── Inner component (uses useSearchParams) ────────────────────────────────────

function WelcomeStaffInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { currentUser, updateUser } = useAuth();

    const urlPin = searchParams.get("pin") ?? "";
    const urlName = searchParams.get("name") ? decodeURIComponent(searchParams.get("name")!) : "";

    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [done, setDone] = useState(false);

    const role = (currentUser?.role ?? "server") as UserRole;
    const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.server;
    const Icon = config.icon;
    const displayName = currentUser?.name ?? urlName;

    const isValid = newPin.length === 4 && /^\d{4}$/.test(newPin) && newPin === confirmPin;

    const handleSave = async () => {
        if (!isValid || !currentUser) return;
        if (newPin === urlPin) {
            toast.error("Choisissez un PIN différent de celui fourni par défaut");
            return;
        }
        setIsSaving(true);
        try {
            await updateUser?.(currentUser.id, { pin: newPin });
            toast.success("PIN mis à jour avec succès");
            setDone(true);
        } catch {
            toast.error("Impossible de mettre à jour le PIN");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGoHome = () => {
        router.push(config.homeRoute);
    };

    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="bg-surface-card border border-border rounded-[2rem] p-8 space-y-8"
                >
                    {!done ? (
                        <>
                            {/* Welcome header */}
                            <div className="text-center space-y-3">
                                <div className={cn("w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto", config.color)}>
                                    <Icon className="w-8 h-8" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p className="text-chip-label text-text-muted">
                                        Bienvenue
                                    </p>
                                    <h1 className="text-2xl font-serif font-black text-text-primary mt-1">
                                        {displayName || "Nouveau collaborateur"}
                                    </h1>
                                    <p className={cn("text-sm font-bold mt-0.5", config.color)}>
                                        {config.label}
                                    </p>
                                </div>
                                <p className="text-[11px] text-text-muted leading-relaxed">
                                    {config.description}
                                </p>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-border/50" />

                            {/* PIN change */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-black uppercase tracking-wider text-text-primary mb-1 flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-accent-gold" />
                                        Choisissez votre PIN
                                    </p>
                                    <p className="text-[10px] text-text-muted">
                                        Votre PIN par défaut vous a été communiqué par votre responsable. Vous devez le remplacer maintenant.
                                    </p>
                                </div>

                                {/* New PIN */}
                                <div>
                                    <label className="text-chip-label-sm text-text-muted block mb-1.5">
                                        Nouveau PIN (4 chiffres)
                                    </label>
                                    <div className="flex items-center border border-border rounded-2xl px-4 h-12 bg-bg-primary focus-within:border-accent-gold/50 transition-colors gap-3">
                                        <input
                                            type={showNew ? "text" : "password"}
                                            inputMode="numeric"
                                            maxLength={4}
                                            value={newPin}
                                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                            placeholder="••••"
                                            className="flex-1 bg-transparent font-mono text-lg text-text-primary placeholder:text-text-muted/50 focus:outline-none tracking-widest"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew(v => !v)}
                                            className="text-text-muted hover:text-text-primary transition-colors"
                                        >
                                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm PIN */}
                                <div>
                                    <label className="text-chip-label-sm text-text-muted block mb-1.5">
                                        Confirmer le PIN
                                    </label>
                                    <div className="flex items-center border border-border rounded-2xl px-4 h-12 bg-bg-primary focus-within:border-accent-gold/50 transition-colors gap-3">
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            inputMode="numeric"
                                            maxLength={4}
                                            value={confirmPin}
                                            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                            onKeyDown={(e) => e.key === "Enter" && handleSave()}
                                            placeholder="••••"
                                            className="flex-1 bg-transparent font-mono text-lg text-text-primary placeholder:text-text-muted/50 focus:outline-none tracking-widest"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(v => !v)}
                                            className="text-text-muted hover:text-text-primary transition-colors"
                                        >
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {confirmPin.length === 4 && confirmPin !== newPin && (
                                        <p className="text-[10px] text-status-error mt-1">Les PINs ne correspondent pas</p>
                                    )}
                                </div>

                                <button
                                    onClick={handleSave}
                                    disabled={!isValid || isSaving}
                                    className="w-full h-12 rounded-2xl bg-accent-gold text-text-primary text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-accent-gold/90 transition-all disabled:opacity-40"
                                >
                                    {isSaving ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4" />
                                            Enregistrer mon PIN
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        /* Done state */
                        <div className="flex flex-col items-center gap-6 py-4 text-center">
                            <div className="w-20 h-20 rounded-full bg-status-success/10 border border-status-success/20 flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-status-success" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-serif font-black text-text-primary">Tout est prêt !</h2>
                                <p className="text-[11px] text-text-muted mt-2">
                                    Votre PIN a été mis à jour. Vous pouvez maintenant accéder à votre espace de travail.
                                </p>
                            </div>
                            <button
                                onClick={handleGoHome}
                                className="w-full h-12 rounded-2xl bg-text-primary text-bg-primary text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-opacity dark:bg-accent-gold dark:text-text-primary"
                            >
                                Accéder à mon espace
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

// ── Page wrapper (Suspense required for useSearchParams) ─────────────────────

function WelcomeStaffPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
            </div>
        }>
            <WelcomeStaffInner />
        </Suspense>
    );
}

export default withPageGuard(WelcomeStaffPage, "welcome_staff");
