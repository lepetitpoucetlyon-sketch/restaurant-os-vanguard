'use client';
// ─────────────────────────────────────────────────────────────────
// FinalCTA — Bottom call-to-action section
// ─────────────────────────────────────────────────────────────────
import Link from 'next/link';
import { motion } from 'framer-motion';

export function FinalCTA({ verticalSlug, verticalName }: { verticalSlug: string; verticalName: string }) {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.03] to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(197,160,89,0.08),transparent)]" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
            Prêt à digitaliser votre{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
              {verticalName.toLowerCase()}
            </span>{' '}
            ?
          </h2>
          <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto">
            14 jours d'essai gratuit. Pas de carte bancaire prélevée.
            Annulez à tout moment. Setup en 5 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/signup?vertical=${verticalSlug}`}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-base hover:from-amber-400 hover:to-amber-500 transition-all shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              Commencer gratuitement
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white/70 font-medium hover:bg-white/10 transition-all"
            >
              Demander une démo
            </Link>
          </div>

          <p className="text-xs text-white/25 mt-8">
            NF525 certifié · RGPD conforme · Données hébergées en France
          </p>
        </motion.div>
      </div>
    </section>
  );
}
