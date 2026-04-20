"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS } from "@/domain/services/AccessPolicyManager";
import { useUI } from "@/context/UIContext";
import { Delete, LogIn, Fingerprint, ShieldCheck, ChevronLeft, RefreshCw } from "lucide-react";
import { cn } from "@/lib/ui.foundations";;

export function PinLogin() {
    const { login, users, isAuthLoading } = useAuth();
    const { toggleTheme } = useUI();
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const handleDigit = (digit: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + digit);
            setError(false);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    const handleSubmit = async () => {
        if (pin.length === 4 && selectedUserId) {
            const success = await login(pin, selectedUserId);
            if (!success) {
                setError(true);
                setPin("");
            }
        }
    };

    const handleQuickLogin = (userId: string) => {
        setSelectedUserId(userId);
        // Show PIN entry for this user
        setPin("");
        setError(false);
    };

    const handleBackToSelection = () => {
        setSelectedUserId(null);
        setPin("");
        setError(false);
    };

    const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "delete", "0", "submit"];
    const selectedUser = users.find(u => u.id === selectedUserId);

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary relative overflow-hidden transition-colors duration-500">
            {/* Background Aesthetic */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent rounded-full blur-[150px] opacity-10" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent rounded-full blur-[150px] opacity-10" />
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] bg-[radial-gradient(#000000_1px,transparent_1px)] dark:bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:40px_40px]" />
            </div>

            <div className="w-full max-w-2xl z-10 px-6">
                {/* Branding */}
                <div className="text-center mb-12">
                    <button
                        onClick={toggleTheme}
                        className="w-16 h-16 bg-bg-tertiary rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border shadow-2xl backdrop-blur-md cursor-pointer hover:bg-bg-tertiary/80 transition-all group"
                    >
                        <div className="w-4 h-4 rounded-full bg-accent animate-pulse shadow-[0_0_20px_#C5A059_80]" />
                    </button>
                    <h1 className="text-4xl font-black text-text-primary tracking-tighter mb-2 font-serif italic">Accès Exécutif</h1>
                </div>

                {/* Glass Card */}
                <div className="bg-bg-secondary/80 backdrop-blur-xl border border-border rounded-[3rem] p-10 shadow-premium transition-all duration-500 min-h-[400px] flex flex-col justify-center">
                    {isAuthLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 animate-pulse">
                            <RefreshCw className="w-10 h-10 text-accent animate-spin mb-6" />
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Initialisation de la liaison sécurisée...</p>
                        </div>
                    ) : !selectedUserId ? (
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {users.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => handleQuickLogin(user.id)}
                                    className={cn(
                                        "flex flex-col items-center gap-3 p-4 rounded-[2rem] transition-all duration-500 border border-border",
                                        "bg-bg-tertiary hover:bg-bg-tertiary/80 hover:border-accent/30 hover:scale-105 hover:shadow-lg group"
                                    )}
                                >
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black bg-bg-primary text-text-primary group-hover:text-accent group-hover:bg-bg-primary transition-colors shadow-inner border border-border">
                                        {(user.name || '').charAt(0)}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-center leading-tight text-text-muted group-hover:text-text-primary transition-colors">
                                        {(user.name || '').split(' ')[0]}
                                        <br />
                                        {(user.name || '').split(' ')[1] || ''}
                                    </span>
                                    <span className="text-[8px] font-bold text-accent/50 group-hover:text-accent uppercase tracking-wider transition-colors">
                                        {ROLE_LABELS[user.role]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (

                        <>
                            {/* Back Button & Selected User */}
                            <div className="flex items-center justify-between mb-8">
                                <button
                                    onClick={handleBackToSelection}
                                    className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors group"
                                >
                                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Retour</span>
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-primary font-bold border border-border">
                                        {(selectedUser?.name || '').charAt(0)}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-text-primary font-bold text-sm leading-none">{selectedUser?.name}</p>
                                        <p className="text-[9px] text-accent font-bold uppercase mt-1">
                                            {selectedUser ? ROLE_LABELS[selectedUser.role] : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Masked PIN Input */}
                            <div className="flex justify-center gap-4 mb-10">
                                {[0, 1, 2, 3].map(i => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-14 h-16 rounded-2xl border flex items-center justify-center text-2xl transition-all duration-300",
                                            error
                                                ? "border-error/50 bg-error/10 animate-shake"
                                                : pin.length > i
                                                    ? "border-accent bg-accent/20 shadow-glow-accent"
                                                    : "border-border bg-bg-tertiary"
                                        )}
                                    >
                                        {pin.length > i && (
                                            <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_10px_#C5A059]" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Aesthetic Keypad */}
                            <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto w-full px-4">
                                {digits.map((digit, i) => (
                                    digit === "delete" ? (
                                        <button
                                            key={i}
                                            onClick={handleDelete}
                                            className="h-20 w-full rounded-[2rem] bg-transparent border border-border text-text-muted flex items-center justify-center hover:bg-bg-tertiary hover:text-text-primary hover:border-border active:scale-95 transition-all group"
                                        >
                                            <Delete className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                        </button>
                                    ) : digit === "submit" ? (
                                        <button
                                            key={i}
                                            onClick={handleSubmit}
                                            disabled={pin.length !== 4}
                                            className={cn(
                                                "h-20 w-full rounded-[2rem] flex items-center justify-center transition-all duration-300 border",
                                                pin.length === 4
                                                    ? "bg-accent border-accent text-white hover:bg-[#B8934C] shadow-glow-accent cursor-pointer hover:scale-105"
                                                    : "bg-transparent border-border text-text-muted/20 cursor-not-allowed"
                                            )}
                                        >
                                            <LogIn className="w-6 h-6" />
                                        </button>
                                    ) : (
                                        <button
                                            key={i}
                                            onClick={() => handleDigit(digit)}
                                            className="h-20 w-full rounded-[2rem] bg-bg-tertiary border border-border text-text-primary text-3xl font-bold hover:bg-bg-secondary hover:border-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-sm"
                                        >
                                            {digit}
                                        </button>
                                    )
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Security Footer */}
                <div className="mt-8 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 bg-bg-tertiary px-5 py-2.5 rounded-full border border-border backdrop-blur-md">
                        <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">Sécurité Chiffrée</span>
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-text-muted hover:text-text-primary transition-colors group">
                        <Fingerprint className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Accès Biométrique</span>
                    </button>

                    <p className="text-[9px] font-black text-text-muted/40 text-center mt-4">
                        Chaque compte exige désormais son propre code PIN chiffré.
                    </p>
                </div>
            </div>
        </div>
    );
}
