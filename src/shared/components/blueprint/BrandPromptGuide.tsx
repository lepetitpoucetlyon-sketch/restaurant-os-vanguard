"use client";

import { 
    Palette, Type, Cpu, MessageSquare
} from "lucide-react";
import { GlassCard } from "@ui/GlassCard";

const COLORS = [
    { name: "Or d'Accent", hex: "#EAB308", label: "Identité de Marque", class: "bg-accent-gold" },
    { name: "Noir Onyx", hex: "#000000", label: "Arrière-plan", class: "bg-bg-primary" },
    { name: "Ardoise Sombre", hex: "#1F2937", label: "Secondaire", class: "bg-bg-secondary" },
    { name: "Émeraude", hex: "#10B981", label: "Succès & Inventaire", class: "bg-status-success" }
];

export function BrandPromptGuide() {
    return (
        <GlassCard className="p-10 space-y-12">
            {/* 1. Brand Tokens */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-accent-gold" />
                    <h4 className="text-xl font-serif text-text-primary">Charte Graphique</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {COLORS.map(color => (
                        <div key={color.name} className="space-y-2 group">
                            <div className={`aspect-square rounded-2xl ${color.class} border border-white/10 group-hover:scale-105 transition-transform shadow-lg`} />
                            <div>
                                <h5 className="text-chip-label text-text-primary">{color.name}</h5>
                                <p className="text-nano text-text-muted font-mono">{color.hex}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. Typography */}
            <div className="space-y-6 pt-6 border-t border-border/50">
                <div className="flex items-center gap-3">
                    <Type className="w-5 h-5 text-brand" />
                    <h4 className="text-xl font-serif text-text-primary">Système Typographique</h4>
                </div>
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-bg-tertiary/20">
                        <span className="text-nano text-text-muted uppercase tracking-widest mb-2 block font-bold italic">Titres (Serif Luxe)</span>
                        <h1 className="text-3xl font-serif">Le Geste & La Saveur</h1>
                    </div>
                    <div className="p-4 rounded-xl bg-bg-tertiary/20">
                        <span className="text-nano text-text-muted uppercase tracking-widest mb-2 block font-bold italic">Interface (Inter Sans)</span>
                        <p className="text-sm font-sans tracking-tight">Interface utilisateur moderne pour le management hôtelier.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-bg-tertiary/20">
                        <span className="text-nano text-text-muted uppercase tracking-widest mb-2 block font-bold italic">Technique (Mono Spaced)</span>
                        <p className="text-xs font-mono text-accent-gold uppercase tracking-[0.1em] mb-1 leading-none">RESTAURANT OS v12.0</p>
                    </div>
                </div>
            </div>

            {/* 3. Oracle Master Prompt */}
            <div className="space-y-6 pt-6 border-t border-border/50">
                <div className="flex items-center gap-3">
                    <Cpu className="w-5 h-5 text-brand" />
                    <h4 className="text-xl font-serif text-text-primary italic">Prompt Maître Oracle</h4>
                </div>
                <div className="p-8 rounded-3xl bg-surface-card border border-border-focus/20 font-mono text-sm group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                        <MessageSquare className="w-20 h-20 text-brand" />
                    </div>
                    
                    <div className="space-y-4 relative z-10 text-text-primary/80 leading-relaxed italic">
                        <p className="text-brand font-black mb-4 flex items-center gap-2">
                             Instruction Système (Racine Serveur)
                        </p>
                        <p>"Vous êtes l'IA centrale 'Oracle' de Restaurant OS."</p>
                        <p>"Votre réponse doit être : 1. Factuelle, 2. Concis (max 2 phrases), 3. Multimodale si nécessaire."</p>
                        <p>"Vous avez accès en lecture seule aux contextes d'inventaire, RH et comptabilité."</p>
                        <p>"Si l'utilisateur demande une action hors de ses privilèges (RBAC), renvoyez : ERROR_UNAUTHORIZED."</p>
                        <p>"Chaque transformation de donnée doit être confirmée par l'administrateur système."</p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-nano text-brand/60 uppercase font-black tracking-widest">Modèle: Gemini 3.1 </span>
                        <div className="flex gap-2">
                            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                            <span className="text-nano text-status-success uppercase font-black">Agent En Ligne</span>
                        </div>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}
