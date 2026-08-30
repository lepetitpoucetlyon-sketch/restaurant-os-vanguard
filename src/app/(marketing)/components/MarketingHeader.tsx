'use client';
// ─────────────────────────────────────────────────────────────────
// MarketingHeader — Glassmorphism sticky navbar
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/shared/components/ui/Button";

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '/#features' },
  { label: 'Verticales', href: '/#verticals' },
  { label: 'Tarifs', href: '/pricing' },
  { label: 'Conformité', href: '/legal/nf525' },
];

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow">
              R
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Restaurant<span className="text-amber-400"> OS</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white/60 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2"
            >
              Se connecter
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
            >
              Essai gratuit
            </Link>
          </div>

          {/* Mobile hamburger */}
          <Button variant="ghost"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-white transition-transform ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-opacity ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-transform ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0A0A0F]/95 backdrop-blur-xl border-t border-white/5"
          >
            <div className="px-4 py-6 space-y-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-white/70 hover:text-white transition-colors py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <Link href="/login" className="block text-center text-white/70 py-2">
                  Se connecter
                </Link>
                <Link
                  href="/signup"
                  className="block text-center font-medium px-5 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black"
                >
                  Essai gratuit 14 jours
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
