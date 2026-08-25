"use client";

import { Phone, Mail, Star } from "lucide-react";
import type { Customer } from "@nexus/contracts";

export function CustomerProfileTab({ customer }: { customer: Customer }) {
    return (
        <div className="flex flex-col">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 border-b border-white/5 bg-bg-primary">
                <div className="p-10 text-center border-r border-white/5">
                    <p className="text-3xl font-mono font-light text-accent italic">
                        {customer.visitCount}
                    </p>
                    <p className="text-nano font-black text-text-primary/40 uppercase tracking-widest mt-3">
                        Passages
                    </p>
                </div>
                <div className="p-10 text-center border-r border-white/5">
                    <p className="text-3xl font-mono font-light text-text-primary italic">
                        {((customer.totalSpentInMicrounits ?? (customer.totalSpentInCents ? customer.totalSpentInCents * 10_000 : 0)) / 1_000_000).toFixed(0)}€
                    </p>
                    <p className="text-nano font-black text-text-primary/40 uppercase tracking-widest mt-3">
                        CA Réalisé
                    </p>
                </div>
                <div className="p-10 text-center">
                    <p className="text-3xl font-mono font-light text-text-primary italic">
                        {((customer.averageSpendInMicrounits ?? (customer.averageSpendInCents ? customer.averageSpendInCents * 10_000 : 0)) / 1_000_000).toFixed(0)}€
                    </p>
                    <p className="text-nano font-black text-text-primary/40 uppercase tracking-widest mt-3">
                        Engagement
                    </p>
                </div>
            </div>

            {/* Contact Info */}
            <div className="p-10 space-y-12">
                <div className="grid grid-cols-2 gap-8">
                    <div className="p-8 rounded-3xl bg-surface-card/5 border border-subtle shadow-sm group hover:border-accent/40 transition-all">
                        <p className="text-nano font-black text-text-primary/40 uppercase tracking-widest mb-4">
                            Ligne Directe
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-surface-card/5 flex items-center justify-center">
                                <Phone strokeWidth={1.5} className="w-5 h-5 text-accent" />
                            </div>
                            <span className="text-base font-mono font-bold text-text-primary tracking-tight">
                                {customer.phone}
                            </span>
                        </div>
                    </div>
                    <div className="p-8 rounded-3xl bg-surface-card/5 border border-subtle shadow-sm group hover:border-accent/40 transition-all">
                        <p className="text-nano font-black text-text-primary/40 uppercase tracking-widest mb-4">
                            Canal Privilégié
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-surface-card/5 flex items-center justify-center">
                                <Mail strokeWidth={1.5} className="w-5 h-5 text-accent" />
                            </div>
                            <span className="text-base font-bold text-text-primary truncate italic">
                                {customer.email || "Non renseigné"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Preferences */}
                <div>
                    <h3 className="text-micro font-black text-text-primary/40 uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
                        <Star strokeWidth={2} className="w-4 h-4 text-accent" />
                        ANALYSE DES HABITUDES &amp; PRÉFÉRENCES
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {customer.preferences.map((pref, i) => (
                            <span
                                key={i}
                                className="px-6 py-3 bg-surface-card/5 rounded-2xl text-[12px] font-bold text-text-primary border border-subtle shadow-sm italic"
                            >
                                {pref}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
