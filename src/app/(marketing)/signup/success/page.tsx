'use client';
// ─────────────────────────────────────────────────────────────────
// /signup/success — Post-checkout success page
// ─────────────────────────────────────────────────────────────────
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function SignupSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(16,185,129,0.06),transparent)]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md text-center"
      >
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-8">
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-10 h-10 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </motion.svg>
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-4">
          🎉 Bienvenue !
        </h1>
        <p className="text-lg text-white/50 mb-8 max-w-sm mx-auto">
          Votre espace est en cours de provisionnement. Vous recevrez un email de bienvenue dans quelques secondes.
        </p>

        {sessionId && (
          <p className="text-xs text-white/20 mb-6">
            Référence : {sessionId.slice(0, 20)}...
          </p>
        )}

        <div className="space-y-3">
          <Link
            href="/pos"
            className="block w-full py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-base hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25"
          >
            Accéder à mon espace →
          </Link>
          <Link
            href="/"
            className="block w-full py-3 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 transition-all"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
