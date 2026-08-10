import { MapPin, Star, RefreshCw } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useAtomValue } from "jotai";

import { seoProfileAtom, seoLoadingAtom } from "@/bootstrap/store/pillars/commerce";

export function GoogleProfileCard() {
    const profile = useAtomValue(seoProfileAtom);
    const isLoading = useAtomValue(seoLoadingAtom);

    if (isLoading) {
        return (
            <div className="p-6 rounded-[2rem] bg-bg-secondary border border-border flex items-center justify-center h-[200px]">
                <RefreshCw className="w-6 h-6 text-accent-gold animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-6 rounded-[2rem] bg-bg-secondary border border-border">
                <div className="flex flex-col items-center gap-4 text-center py-8">
                    <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-text-muted" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary">Profil non connecté</h3>
                        <p className="text-xs text-text-muted mt-1">Liez votre compte Google Business pour activer le suivi SEO.</p>
                    </div>
                    <button className="h-10 px-6 rounded-xl bg-bg-tertiary text-text-primary text-[10px] font-black uppercase tracking-widest border border-border hover:bg-bg-primary transition-all">
                        Connecter
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-[2rem] bg-bg-secondary border border-border">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-status-info/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-500" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Google Business Profile</h3>
                </div>
                <span className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                    profile.isVerified 
                        ? "bg-teal/10 text-teal border-teal/20"
                        : "bg-warning/10 text-warning border-warning/20"
                )}>
                    {profile.isVerified ? 'Vérifié' : 'En attente'}
                </span>
            </div>


            <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Établissement</span>
                    <span className="text-sm font-bold text-text-primary">{profile.name}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Note moyenne</span>
                    <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-action-primary fill-amber-500" />
                        <span className="text-sm font-bold text-text-primary">{profile.rating}</span>
                        <span className="text-[10px] text-text-muted">({profile.reviewCount})</span>
                    </div>
                </div>
                <div className="flex items-center justify-between py-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Dernière sync</span>
                    <span className="text-sm text-text-muted">
                        {profile.lastSync ? new Date(profile.lastSync).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                </div>
            </div>

            <button className="w-full mt-6 h-12 rounded-xl bg-teal text-text-primary hover:bg-teal transition-colors text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_8px_24px_rgba(0,217,166,0.25)]">
                <RefreshCw className="w-4 h-4" />
                Synchroniser maintenant
            </button>
        </div>
    );
}
