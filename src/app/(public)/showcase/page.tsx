// @ts-nocheck
"use client";

import React from 'react';
import { Globe, ShieldCheck, Zap, Database, TrendingUp, Users, Cpu, ChevronRight } from 'lucide-react';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-8 bg-zinc-900/40 border border-zinc-800 rounded-3xl backdrop-blur-md hover:border-[#c5a358]/40 transition-all group">
    <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <div className="text-[#c5a358]">{icon}</div>
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{description}</p>
  </div>
);

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#c5a358] selection:text-black">
      {/* GLOW OVERLAYS */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-[#c5a358]/10 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-full text-sm text-[#c5a358] mb-8 animate-fade-in">
          <Zap size={14} />
          <span>Restaurant OS v3.1 - Fleet Ready</span>
        </div>
        
        <h1 className="text-7xl md:text-8xl font-black tracking-tighter mb-8 leading-tight">
          L'Os de votre <br />
          <span className="bg-gradient-to-r from-[#c5a358] via-[#e6cc8d] to-[#c5a358] bg-clip-text text-transparent">Empire Gastronomique</span>
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          Propulsez votre chaîne de restaurants à une échelle industrielle avec une plateforme certifiée NF525, pilotée par l'Intelligence Artificielle et sécurisée par la blockchain.
        </p>

        <div className="flex flex-wrap justify-center gap-6">
          <button className="px-10 py-5 bg-[#c5a358] text-black font-bold rounded-2xl hover:bg-[#d4b570] transition-all flex items-center gap-3 text-lg shadow-[0_10px_30px_rgba(197,163,88,0.2)]">
            Déployer la Flotte <ChevronRight size={20} />
          </button>
          <button className="px-10 py-5 bg-zinc-900 border border-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all text-lg">
            Démo Technique
          </button>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Globe size={28} />}
            title="Master Control Center"
            description="Pilotez 50+ instances en temps réel. Gérez vos menus, vos prix et votre personnel depuis une interface unifiée."
          />
          <FeatureCard 
            icon={<ShieldCheck size={28} />}
            title="Conformité NF525"
            description="Chaînage fiscal par hachage cryptographique SHA-256. Inaltérabilité totale et export FEC DGFIP en un clic."
          />
          <FeatureCard 
            icon={<Cpu size={28} />}
            title="Oracle Stratégique AI"
            description="Le cerveau Gemini 3.1 Flash analyse votre flotte et génère des SITREPs quotidiens pour optimiser vos marges."
          />
          <FeatureCard 
            icon={<Database size={28} />}
            title="Inventaire Fédéré"
            description="Gestion de stock prédictive et alertes de rupture mondiales. Optimisation des approvisionnements fournisseurs."
          />
          <FeatureCard 
            icon={<Users size={28} />}
            title="VTC School Mode"
            description="Formez vos équipes dans un environnement sécurisé (Training Mode) sans polluer vos données fiscales réelles."
          />
          <FeatureCard 
            icon={<TrendingUp size={28} />}
            title="Hardening Radar"
            description="Observabilité Sentry & Axiom pour une détection proactive des anomalies de flotte avant qu'elles ne coûtent cher."
          />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 px-6 border-t border-zinc-900 text-center text-gray-500">
        <p>© 2026 Restaurant OS Industrial Edition. Bâti pour la performance, l'excellence et la scalabilité.</p>
      </footer>
    </div>
  );
}
