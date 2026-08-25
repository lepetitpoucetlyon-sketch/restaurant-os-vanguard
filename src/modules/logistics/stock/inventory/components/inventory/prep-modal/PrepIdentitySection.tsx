'use client';

import { PremiumSelect } from "@ui/PremiumSelect";
import type { PreparationType } from "@nexus/contracts";
import { PREPARATION_TYPES } from "./prepConstants";

interface PrepIdentitySectionProps {
    name: string;
    setName: (name: string) => void;
    type: PreparationType;
    setType: (type: PreparationType) => void;
}

export function PrepIdentitySection({ name, setName, type, setType }: PrepIdentitySectionProps) {
    return (
        <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
                <label className="flex items-center gap-3 text-nano font-black text-text-primary uppercase tracking-[0.4em] px-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-gold shadow-glow" />
                    NOM DE L&apos;ŒUVRE *
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="EX: SAUCE BÉARNAISE"
                    className="w-full px-8 py-5 bg-surface-card/60 border border-border/40 rounded-2xl text-[14px] font-black text-text-primary placeholder:text-text-muted/30 focus:outline-none focus:border-accent-gold focus:ring-4 focus:ring-accent-gold/5 transition-all tracking-widest shadow-soft"
                />
            </div>
            <div className="space-y-4">
                <label className="flex items-center gap-3 text-nano font-black text-text-primary uppercase tracking-[0.4em] px-2 text-nowrap">
                    CATÉGORIE PROTOCOLE
                </label>
                <PremiumSelect
                    value={type}
                    onChange={(val) => setType(val as PreparationType)}
                    options={PREPARATION_TYPES.map(t => ({
                        value: String(t.value),
                        label: t.label?.toUpperCase() || ''
                    }))}
                />
            </div>
        </div>
    );
}
