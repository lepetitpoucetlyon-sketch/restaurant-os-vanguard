import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-bg-primary text-text-primary flex items-center justify-center p-6 antialiased">
      <div className="max-w-md w-full bg-surface-card backdrop-blur-xl border border-border-subtle rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-brand/10 border border-border-accent text-brand flex items-center justify-center mx-auto text-3xl font-bold font-mono">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Page Introuvable
          </h1>
          <p className="text-sm text-text-muted">
            La ressource ou la vue demandée n&apos;existe pas ou a été déplacée dans une autre section opérationnelle.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/pos"
            className="px-6 py-2.5 rounded-xl bg-action-primary hover:bg-action-primary-hover text-text-on-primary font-semibold text-sm transition-all shadow-lg shadow-brand/20"
          >
            Accéder à la Caisse
          </Link>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-surface-hover hover:bg-surface-glass text-text-primary font-medium text-sm transition-all border border-border-subtle"
          >
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
