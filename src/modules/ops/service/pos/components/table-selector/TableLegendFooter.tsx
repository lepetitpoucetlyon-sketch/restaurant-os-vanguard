"use client";

export function TableLegendFooter() {
    return (
        <div className="mt-32 pt-16 border-t border-border/30 flex flex-wrap gap-x-16 gap-y-8 items-center justify-center bg-gradient-to-b from-transparent to-bg-tertiary/20 -mx-12 px-12 pb-12">
            <div className="flex flex-col gap-4">
                <span className="text-[9px] font-black text-accent-gold uppercase tracking-[0.4em] text-center mb-4">Légende des Protocoles</span>
                <div className="flex flex-wrap gap-12 items-center justify-center">
                    <div className="flex items-center gap-4 group">
                        <div className="w-3 h-3 rounded-full border border-accent-gold/40 shadow-glow transition-all group-hover:scale-125" />
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Disponible</span>
                    </div>
                    <div className="flex items-center gap-4 group">
                        <div className="w-3 h-3 rounded-full bg-accent-gold shadow-glow shadow-accent-gold/40 transition-all group-hover:scale-125" />
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Installés</span>
                    </div>
                    <div className="flex items-center gap-4 group">
                        <div className="w-3 h-3 rounded-full bg-action-primary shadow-glow shadow-blue-500/40 transition-all group-hover:scale-125" />
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Commandé</span>
                    </div>
                    <div className="flex items-center gap-4 group">
                        <div className="w-3 h-3 rounded-full bg-status-warning shadow-glow shadow-orange-500/40 transition-all group-hover:scale-125" />
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">En Cours</span>
                    </div>
                    <div className="flex items-center gap-4 group">
                        <div className="w-3 h-3 rounded-full bg-status-success shadow-glow shadow-emerald-500/40 transition-all group-hover:scale-125 animate-pulse" />
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Encaissement</span>
                    </div>
                    <div className="flex items-center gap-4 group">
                        <div className="w-3 h-3 rounded-full bg-action-primary shadow-glow shadow-purple-500/40 transition-all group-hover:scale-125" />
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">VIP</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
