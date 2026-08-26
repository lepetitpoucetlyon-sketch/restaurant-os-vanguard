"use client";

import React, { useState } from 'react';
import { Globe, ShieldCheck, Zap, Database, TrendingUp, Users, Cpu, ChevronRight, PlayCircle, KeyRound, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-8 bg-surface-card border border-border rounded-3xl backdrop-blur-md hover:border-action-primary/40 transition-all group">
    <div className="w-14 h-14 bg-surface-bg border border-default rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <div className="text-brand">{icon}</div>
    </div>
    <h3 className="text-xl font-bold text-text-primary mb-3">{title}</h3>
    <p className="text-muted leading-relaxed">{description}</p>
  </div>
);

/** Modal d'accès démo pré-remplie (Sprint 7) */
function DemoLoginModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const DEMO_EMAIL = 'demo@restaurant-os.app';
  const DEMO_PIN   = '1234'; // PIN DEMO public — pas de vrai compte

  const handleAccess = () => {
    // Redirige vers la page de login avec les credentials DEMO pré-remplis en query params
    // Le tenant _demo_restaurant est résolu par le middleware via ?tenant=
    router.push(`/login?tenant=_demo_restaurant&email=${encodeURIComponent(DEMO_EMAIL)}&demo=1`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-surface-card border border-border rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold uppercase tracking-widest text-text-primary flex items-center gap-2">
            <KeyRound size={18} className="text-brand" />
            Accès Démo
          </h3>
          <button onClick={onClose} className="text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-muted mb-6">
          Accédez à l'environnement de démonstration complet. Toutes vos interactions restent
          locales — le store réel n'est pas modifié (Simulacra Mode).
        </p>

        <div className="space-y-3 mb-6">
          <div className="p-3 bg-surface-bg rounded-xl border border-default">
            <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Email</p>
            <p className="font-mono text-brand">{DEMO_EMAIL}</p>
          </div>
          <div className="p-3 bg-surface-bg rounded-xl border border-default">
            <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">PIN</p>
            <p className="font-mono text-brand tracking-[0.5em]">{DEMO_PIN}</p>
          </div>
        </div>

        <div className="p-3 bg-brand/10 border border-brand/20 rounded-xl mb-6">
          <p className="text-xs text-brand/80">
            ℹ️ Ces identifiants sont publics et partagés. Ce compte DEMO accède à un environnement
            fictif réaliste avec données de démonstration.
          </p>
        </div>

        <button
          onClick={handleAccess}
          className="w-full px-6 py-4 bg-accent text-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <PlayCircle size={18} />
          Accéder à la démo
        </button>
      </div>
    </div>
  );
}

export default function ShowcasePage() {
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <div className="min-h-screen bg-surface-bg text-text-primary font-sans selection:bg-accent selection:text-primary">
      {/* GLOW OVERLAYS */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-action-primary/5 rounded-full blur-[120px] -z-10" />

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-glass border border-border rounded-full text-sm text-brand mb-8 animate-fade-in">
          <Zap size={14} />
          <span>Restaurant OS v3.1 - Fleet Ready</span>
        </div>
        
        <h1 className="text-7xl md:text-8xl font-black tracking-tighter mb-8 leading-tight">
          L'Os de votre <br />
          <span className="bg-gradient-to-r from-[#c5a358] via-[#e6cc8d] to-[#c5a358] bg-clip-text text-transparent">Empire Gastronomique</span>
        </h1>
        
        <p className="text-xl text-muted max-w-2xl mx-auto mb-12 leading-relaxed">
          Propulsez votre chaîne de restaurants à une échelle industrielle avec une plateforme certifiée NF525, pilotée par l'Intelligence Artificielle et sécurisée par la blockchain.
        </p>

        <div className="flex flex-wrap justify-center gap-6">
          <button className="px-10 py-5 bg-accent text-primary font-bold rounded-2xl hover:bg-accent transition-all flex items-center gap-3 text-lg shadow-[0_10px_30px_rgba(197,163,88,0.2)]">
            Déployer la Flotte <ChevronRight size={20} />
          </button>
          <button
            onClick={() => setShowDemoModal(true)}
            className="px-10 py-5 bg-surface-glass border border-brand/40 text-brand font-bold rounded-2xl hover:border-brand transition-all text-lg flex items-center gap-3"
          >
            <PlayCircle size={20} />
            Accéder à la démo
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
      <footer className="py-20 px-6 border-t border-default text-center text-secondary">
        <p>© 2026 Restaurant OS Industrial Edition. Bâti pour la performance, l'excellence et la scalabilité.</p>
      </footer>

      {/* Demo Login Modal */}
      {showDemoModal && <DemoLoginModal onClose={() => setShowDemoModal(false)} />}
    </div>
  );
}
