// NO 'use client' — Server Component.
// Layout minimaliste pour toutes les pages légales.
import type { ReactNode } from 'react';
import Link from 'next/link';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navigation minimale */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
            Restaurant OS
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            ← Retour
          </Link>
        </div>
      </header>

      {/* Navigation légale */}
      <nav className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap gap-4 text-sm">
          <Link href="/legal/cgu" className="text-gray-600 hover:text-gray-900 transition-colors">
            CGU
          </Link>
          <Link href="/legal/cgv" className="text-gray-600 hover:text-gray-900 transition-colors">
            CGV
          </Link>
          <Link href="/legal/mentions" className="text-gray-600 hover:text-gray-900 transition-colors">
            Mentions légales
          </Link>
          <Link href="/legal/rgpd" className="text-gray-600 hover:text-gray-900 transition-colors">
            Confidentialité
          </Link>
        </div>
      </nav>

      {/* Contenu */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>

      {/* Pied de page */}
      <footer className="border-t border-gray-200 bg-gray-50 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-text-muted">
          © {new Date().getFullYear()} Restaurant OS SAS — Tous droits réservés
        </div>
      </footer>
    </div>
  );
}
