import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-min-h-[100dvh] bg-[#0a0a0c] text-white flex items-center justify-center p-6 antialiased">
      <div className="max-w-md w-full bg-[#13141a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] flex items-center justify-center mx-auto text-3xl font-bold font-mono">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Page Introuvable
          </h1>
          <p className="text-sm text-gray-400">
            La ressource ou la vue demandée n&apos;existe pas ou a été déplacée dans une autre section opérationnelle.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/pos"
            className="px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#d4af37] text-black font-semibold text-sm transition-all shadow-lg shadow-[#C5A059]/20"
          >
            Accéder à la Caisse
          </Link>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all border border-white/10"
          >
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
