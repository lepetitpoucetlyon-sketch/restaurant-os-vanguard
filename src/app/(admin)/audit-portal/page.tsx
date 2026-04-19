import React from 'react';
import { 
    Code2, 
    Layers, 
    Cpu, 
    Shield, 
    Sparkles,
    Zap,
    Cpu as AiIcon
} from 'lucide-react';
import { AuditPortalController } from './AuditPortalController';
import { motion } from 'framer-motion'; // Wait, motion is client-side. I'll need a wrapper or keep it in controller.

// For RSC, I'll use standard <div> for the non-interactive header parts.

const AUDIT_DATA = [
    {
        id: 'architecture',
        title: 'Architecture Système',
        icon: Layers,
        color: '#8B5CF6',
        description: 'Refonte structurelle pour une scalabilité industrielle et une maintenance simplifiée.',
        axes: [
            {
                id: 'A1.1',
                title: 'Feature-Sliced Design',
                problem: 'Couplage fort et dispersion de la logique métier.',
                prompt: `Restructure le projet en architecture Feature-Sliced...`
            },
            {
                id: 'A1.2',
                title: 'Consolidation des Contextes',
                problem: 'Context Hell (17 providers) impactant les performances.',
                prompt: `Fusionne les contextes par domaine métier...`
            }
        ]
    },
    {
        id: 'performance',
        title: 'Performance & Bundle',
        icon: Zap,
        color: '#F59E0B',
        description: 'Optimisation de la vitesse de chargement et de la fluidité runtime.',
        axes: [
            {
                id: 'A3.1',
                title: 'Code Splitting Agressif',
                problem: 'Bundle initial trop lourd.',
                prompt: `Applique dynamic import sur tous les composants lourds...`
            }
        ]
    }
    // ... Simplified for the example, we keep the structure.
];

export default async function AuditPortal() {
    return (
        <div className="min-h-screen bg-bg-primary text-text-primary px-4 md:px-12 py-20 elegant-scrollbar relative overflow-hidden">
            {/* Background Atmosphere - HTML elements for RSC */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent-gold/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="max-w-7xl mx-auto relative z-10">
                <header className="mb-32 text-center">
                    <div className="inline-flex items-center gap-4 px-6 py-2 bg-accent-gold/10 border border-accent-gold/20 rounded-full mb-8">
                        <Sparkles className="w-4 h-4 text-accent-gold" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-gold">Excellence Hub</span>
                    </div>
                    <h1 className="text-7xl md:text-9xl font-serif italic tracking-tighter leading-[0.8] mb-8 text-text-primary">
                        L'Audit <br />
                        <span className="text-text-muted/20 font-light not-italic">Suprême</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-text-muted/60 italic font-light leading-relaxed">
                        Transformer Restaurant OS en une plateforme industrielle à 300€/mois.
                        Le blueprint stratégique pour l'excellence opérationnelle et technologique.
                    </p>
                </header>

                {/* Metrics Grid */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-32">
                    {[
                        { label: 'LOC Mastered', value: '62K', sub: '+242 Files', icon: Code2 },
                        { label: 'Active Modules', value: '33', sub: 'Production Ready', icon: Layers },
                        { label: 'Integrations', value: '24', sub: 'Npm Ecosystem', icon: Cpu },
                        { label: 'Trust Margin', value: '7.2', sub: 'Audit Score / 10', icon: Shield, isGold: true },
                    ].map((metric, i) => (
                        <div
                            key={i}
                            className="bg-bg-secondary p-10 rounded-[3rem] border border-border/40 text-center relative overflow-hidden group hover:border-accent-gold/20 transition-all duration-500"
                        >
                            <metric.icon className="w-8 h-8 mx-auto mb-6 text-text-muted/20" />
                            <p className="text-5xl font-serif italic mb-2 tracking-tighter" style={{ color: metric.isGold ? '#C5A059' : undefined }}>{metric.value}</p>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/40">{metric.label}</p>
                                <p className="text-[10px] font-bold text-text-muted/60 lowercase italic">{metric.sub}</p>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Main Improvement Axes - Interactive Part */}
                <section className="space-y-12 mb-32">
                    <div className="flex items-end justify-between mb-16 px-4">
                        <div className="space-y-4">
                            <h2 className="text-6xl font-serif italic tracking-tight text-text-primary">Axes de Transformation</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted/30">DIMENSIONS STRATÉGIQUES</p>
                        </div>
                    </div>

                    <AuditPortalController auditData={AUDIT_DATA} />
                </section>
            </div>
        </div>
    );
}
