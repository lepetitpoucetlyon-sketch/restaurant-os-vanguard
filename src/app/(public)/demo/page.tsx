import React from 'react';
import Link from 'next/link';

export default function DemoLandingPage() {
  const ephemeralTenantId = `demo-pouce-${Date.now()}`;
  const magicLink = `/?tenant=${ephemeralTenantId}&simulacra=true`;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-bg-secondary p-8 rounded-2xl border border-action-primary/20 shadow-2xl text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-action-primary">Restaurant OS</h1>
          <p className="text-sm text-text-muted">Le POS Souverain & Résilient.</p>
        </div>

        <div className="p-4 bg-status-info/10 rounded-xl border border-status-info/20 text-left">
          <h2 className="text-sm font-bold text-status-info mb-2">Bienvenue au Petit Poucet 👋</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Vous allez accéder à un environnement bac-à-sable entièrement isolé.
            <br /><br />
            ✅ Catalogue de plats configuré<br />
            ✅ Employés fictifs avec codes (1234)<br />
            ✅ Plan de salle prêt à l'emploi
          </p>
        </div>

        <Link 
          href={magicLink}
          className="block w-full py-3 px-4 bg-action-primary text-bg-primary font-bold rounded-xl hover:bg-action-primary/90 hover:scale-[1.02] transition-all"
        >
          Lancer la Démo 1-Clic
        </Link>
        
        <p className="text-[10px] text-text-muted">
          Cet environnement s'auto-détruira dans 24h. Aucune donnée n'est envoyée à nos serveurs de production.
        </p>
      </div>
    </div>
  );
}
